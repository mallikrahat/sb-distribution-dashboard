/* ============================================================
   Data Source Engine
   Loads DB / SPO / Market Hierarchy from:
   - local CSV/XLSX files (data/*.csv by default)
   - Google Sheets URL (converted to CSV export)
   - Google Drive file link (converted to direct download)
   - direct CSV/XLSX URL
   Also handles user-imported files.
   ============================================================ */
window.DataSource = (function(){

  const config = window.REPORT_CONFIG;

  /* state per source id */
  const state = {};

  function initState(id){
    state[id] = {
      id,
      title: (config.sources[id] && config.sources[id].title) || id,
      method: "none",              // local | url | file | none
      url: "",
      fileName: "",
      rows: [],
      columns: [],
      status: "No Data",           // see STATUS
      error: "",
      lastUpdated: null,
      recordCount: 0
    };
  }

  Object.keys(config.sources || {}).forEach(initState);

  function get(id){ return state[id]; }
  function getAll(){ return state; }

  /* ---------- URL conversion ---------- */

  function parseGoogleSheetUrl(url){
    // Extract file id and gid
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if(!idMatch) return null;
    const fileId = idMatch[1];
    let gid = "";
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    if(gidMatch) gid = gidMatch[1];
    // Also handle ?gid= in query
    if(!gid){
      const qm = url.match(/[?&]gid=([0-9]+)/);
      if(qm) gid = qm[1];
    }
    let out = `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
    if(gid) out += `&gid=${gid}`;
    return out;
  }

  function parseDriveUrl(url){
    // https://drive.google.com/file/d/FILE_ID/view
    const m = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
    if(m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    // https://drive.google.com/open?id=FILE_ID
    const m2 = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if(m2) return `https://drive.google.com/uc?export=download&id=${m2[1]}`;
    return null;
  }

  function resolveUrl(url){
    if(!url) return url;
    if(/docs\.google\.com\/spreadsheets\/d\//.test(url)){
      const c = parseGoogleSheetUrl(url);
      if(c) return c;
    }
    if(/drive\.google\.com/.test(url)){
      const c = parseDriveUrl(url);
      if(c) return c;
    }
    return url;
  }

  /* ---------- Parsing ---------- */

  function rowsFromCSVText(text){
    const res = Papa.parse(text, {
      header:true,
      skipEmptyLines:"greedy",
      dynamicTyping:false,
      transformHeader: h => h.trim()
    });
    if(res.errors && res.errors.length){
      // Ignore non-fatal errors, but record if no data
    }
    // Filter out completely empty rows
    const rows = (res.data||[]).filter(r=>{
      if(!r) return false;
      return Object.keys(r).some(k=>{
        const v = r[k];
        return v!==null && v!==undefined && String(v).trim()!=="";
      });
    });
    return { rows, columns: res.meta && res.meta.fields ? res.meta.fields : [] };
  }

  function rowsFromArrayBuffer(buf, fileName){
    const wb = XLSX.read(buf, {type:"array", cellDates:true, cellText:false});
    const first = wb.SheetNames[0];
    const ws = wb.Sheets[first];
    const json = XLSX.utils.sheet_to_json(ws, {defval:"", raw:true});
    const rows = json.filter(r=>Object.keys(r).some(k=>{
      const v = r[k];
      return v!==null && v!==undefined && String(v).trim()!=="";
    })).map(r=>{
      // Convert Date objects to ISO strings for consistency
      const o = {};
      Object.keys(r).forEach(k=>{
        const v = r[k];
        o[k] = (v instanceof Date) ? v.toISOString().slice(0,19).replace("T"," ") : v;
      });
      return o;
    });
    const columns = rows.length ? Object.keys(rows[0]) : [];
    return { rows, columns };
  }

  /* ---------- Loading ---------- */

  function setStatus(id, status, error){
    const s = state[id];
    if(!s) return;
    s.status = status;
    s.error = error || "";
    if(window.App && App.onSourceStatusChange) App.onSourceStatusChange(id);
  }

  function applyRows(id, rows, columns, meta){
    const s = state[id];
    s.rows = rows || [];
    s.columns = columns && columns.length ? columns : (rows && rows.length ? Object.keys(rows[0]) : []);
    s.recordCount = s.rows.length;
    s.lastUpdated = new Date();
    if(meta){
      if(meta.method) s.method = meta.method;
      if(meta.url !== undefined) s.url = meta.url;
      if(meta.fileName !== undefined) s.fileName = meta.fileName;
    }
    if(s.rows.length === 0){
      setStatus(id, "No Data");
    }else{
      setStatus(id, s.method === "file" ? "Local File" : (s.method === "url" ? "Live" : "No Data"));
    }
    if(window.App && App.onSourceUpdated) App.onSourceUpdated(id);
  }

  function applyError(id, message){
    const s = state[id];
    s.rows = [];
    s.columns = [];
    s.recordCount = 0;
    s.lastUpdated = new Date();
    setStatus(id, "Connection Error", message);
    if(window.App && App.onSourceError) App.onSourceError(id, message);
  }

  /* Load a source by its config localFile */
  async function loadLocalFile(id){
    const s = state[id];
    const cfg = config.sources[id];
    if(!cfg || !cfg.localFile){
      setStatus(id, "Not Configured");
      return;
    }
    setStatus(id, "Loading");
    try{
      const res = await fetch(cfg.localFile, {cache:"no-cache"});
      if(!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const text = await res.text();
      const parsed = rowsFromCSVText(text);
      applyRows(id, parsed.rows, parsed.columns, {
        method:"file",
        fileName: cfg.localFile.split("/").pop(),
        url: cfg.localFile
      });
    }catch(err){
      applyError(id, `Unable to load local file "${cfg.localFile}". ${err.message}`);
    }
  }

  /* Load from a URL (Google Sheets / Drive / direct) */
  async function loadFromUrl(id, rawUrl){
    const s = state[id];
    if(!rawUrl){
      applyError(id, "No URL provided.");
      return;
    }
    const url = resolveUrl(rawUrl);
    setStatus(id, "Loading");
    try{
      const res = await fetch(url, {cache:"no-cache", redirect:"follow"});
      if(!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const ct = (res.headers.get("content-type")||"").toLowerCase();

      let parsed;
      if(ct.includes("spreadsheet") || ct.includes("excel") || /\.xlsx?($|\?)/i.test(url)){
        const buf = await res.arrayBuffer();
        parsed = rowsFromArrayBuffer(buf, url);
      }else{
        const text = await res.text();
        // If Google returns an HTML login page, Papa will produce garbage
        if(/^\s*<!DOCTYPE html/i.test(text) || /<html/i.test(text.slice(0,200))){
          throw new Error("Received an HTML page instead of CSV data. The file may not be publicly accessible.");
        }
        parsed = rowsFromCSVText(text);
      }
      if(!parsed.rows || parsed.rows.length===0){
        throw new Error("The source returned no rows.");
      }
      applyRows(id, parsed.rows, parsed.columns, {
        method:"url",
        url: rawUrl,
        fileName:""
      });
    }catch(err){
      applyError(id,
        `Unable to load this source.\n\nPossible causes:\n` +
        `• The file/sheet is not publicly readable\n` +
        `• The URL is incorrect\n` +
        `• The GID is incorrect\n` +
        `• Browser/CORS access is blocked\n\n` +
        `Details: ${err.message}`
      );
    }
  }

  /* Load from a user-imported File object */
  async function loadFromFile(id, file){
    if(!file){ return; }
    setStatus(id, "Loading");
    const name = (file.name||"").toLowerCase();
    try{
      if(name.endsWith(".csv")){
        const text = await file.text();
        const parsed = rowsFromCSVText(text);
        if(parsed.rows.length===0) throw new Error("The file contains no data rows.");
        applyRows(id, parsed.rows, parsed.columns, {method:"file", fileName:file.name, url:""});
      }else if(name.endsWith(".xlsx") || name.endsWith(".xls")){
        const buf = await file.arrayBuffer();
        const parsed = rowsFromArrayBuffer(buf, file.name);
        if(parsed.rows.length===0) throw new Error("The workbook contains no data rows.");
        applyRows(id, parsed.rows, parsed.columns, {method:"file", fileName:file.name, url:""});
      }else{
        throw new Error("Unsupported file type. Please provide CSV, XLSX or XLS.");
      }
    }catch(err){
      applyError(id, `Unable to import file "${file.name}". ${err.message}`);
    }
  }

  /* Refresh: reload using current method */
  async function refresh(id){
    const s = state[id];
    if(s.method === "url" && s.url){
      await loadFromUrl(id, s.url);
    }else if(s.method === "file" && s.fileName && !s.url){
      // User-imported file can't be re-read from disk (browser security).
      // Fall back to the configured localFile if it exists.
      const cfg = config.sources[id];
      if(cfg && cfg.localFile){
        await loadLocalFile(id);
      }else{
        // Nothing to refresh
      }
    }else{
      const cfg = config.sources[id];
      if(cfg && cfg.url){
        await loadFromUrl(id, cfg.url);
      }else if(cfg && cfg.localFile){
        await loadLocalFile(id);
      }
    }
  }

  async function refreshAll(){
    await Promise.all(Object.keys(state).map(id=>refresh(id)));
  }

  /* Initial auto-load: prefer config.url if present, else localFile */
  async function bootstrap(){
    const tasks = Object.keys(state).map(id=>{
      const cfg = config.sources[id];
      if(cfg && cfg.url){
        return loadFromUrl(id, cfg.url);
      }
      if(cfg && cfg.localFile){
        return loadLocalFile(id);
      }
      setStatus(id, "Not Configured");
      return Promise.resolve();
    });
    await Promise.all(tasks);
  }

  /* Aggregate helpers */
  function allColumnsFor(ids){
    const cols = new Set();
    (ids||Object.keys(state)).forEach(id=>{
      (state[id].columns||[]).forEach(c=>cols.add(c));
    });
    return Array.from(cols);
  }

  function combinedRows(ids){
    const out = [];
    (ids||Object.keys(state)).forEach(id=>{
      const s = state[id];
      (s.rows||[]).forEach(r=>{
        out.push(Object.assign({}, r, { __source: s.title, __sourceId: id }));
      });
    });
    return out;
  }

  return {
    state, get, getAll,
    loadLocalFile, loadFromUrl, loadFromFile,
    refresh, refreshAll, bootstrap,
    resolveUrl, allColumnsFor, combinedRows
  };
})();