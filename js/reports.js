/* ============================================================
   Reports — page renderers
   Each report has a render(container) function.
   ============================================================ */
window.Reports = (function(){

  /* Session state per report */
  const session = {
    search: {},          // reportId -> query
    view: {},            // reportId -> view mode (cards|table|compact|split)
    density: {},         // reportId -> normal|dense
    pageSize: {},        // reportId -> number|"All"
    hidden: {},          // reportId -> [fields]
    order: {},           // reportId -> [fields]
    sort: {},            // reportId -> sort config
    filters: {}          // reportId -> advanced filter rows
  };

  function sess(reportId){
    if(!session.search[reportId]) session.search[reportId] = "";
    if(!session.view[reportId]) session.view[reportId] = "table";
    if(!session.density[reportId]) session.density[reportId] = "normal";
    if(!session.pageSize[reportId]) session.pageSize[reportId] = 25;
    if(!session.hidden[reportId]) session.hidden[reportId] = null;
    if(!session.order[reportId]) session.order[reportId] = null;
    if(!session.filters[reportId]) session.filters[reportId] = [];
    return session;
  }

  /* =========================================================
     Shared UI helpers
     ========================================================= */

  function statusPill(status){
    const map = {
      "Live":"status-live",
      "Loading":"status-loading",
      "Connection Error":"status-error",
      "No Data":"status-nodata",
      "Local File":"status-local",
      "Not Configured":"status-notconfig"
    };
    const cls = map[status] || "status-nodata";
    return `<span class="status-pill ${cls}">● ${Utils.escapeHtml(status)}</span>`;
  }

  function sourceSummaryRow(id){
    const s = DataSource.get(id);
    if(!s) return "";
    return `
      <div class="source-meta">
        <div><div class="m-label">Status</div><div class="m-value">${statusPill(s.status)}</div></div>
        <div><div class="m-label">Records</div><div class="m-value">${Utils.formatNumber(s.recordCount)}</div></div>
        <div><div class="m-label">Method</div><div class="m-value">${Utils.escapeHtml(methodLabel(s.method))}</div></div>
        <div><div class="m-label">Last Updated</div><div class="m-value">${Utils.escapeHtml(Utils.formatDateTime(s.lastUpdated))}</div></div>
      </div>
    `;
  }

  function methodLabel(m){
    return ({
      "local":"Local File",
      "file":"Imported File",
      "url":"Google / URL",
      "none":"Not Configured"
    })[m] || m || "—";
  }

  function emptyState(title, msg, actionHtml){
    return `
      <div class="state-box">
        <div class="state-icon">▤</div>
        <h3>${Utils.escapeHtml(title)}</h3>
        <p>${Utils.escapeHtml(msg)}</p>
        ${actionHtml||""}
      </div>
    `;
  }

  function loadingState(msg){
    return `<div class="state-box"><div class="spinner"></div><p>${Utils.escapeHtml(msg||"Loading…")}</p></div>`;
  }

  function errorState(id, err){
    return `
      <div class="state-error">
        <h4>Connection Error</h4>
        <div style="font-size:12.5px;white-space:pre-line">${Utils.escapeHtml(err||"Unknown error")}</div>
      </div>
    `;
  }

  /* =========================================================
     Dashboard
     ========================================================= */
  function renderDashboard(el){
    const ids = Object.keys(DataSource.state);
    const totalRecords = ids.reduce((a,id)=>a + DataSource.get(id).recordCount, 0);

    let missingCount = 0;
    let duplicateCount = 0;
    ids.forEach(id=>{
      const s = DataSource.get(id);
      if(!s.rows.length) return;
      const q = DataQuality.analyze(s.rows, s.columns);
      missingCount += q.totalMissing;
      duplicateCount += q.duplicateRows;
    });

    const anyConfigured = ids.some(id=>{
      const st = DataSource.get(id).status;
      return st !== "Not Configured" && st !== "No Data";
    });

    const kpis = [
      { label:"Total Records", value: Utils.formatNumber(totalRecords), sub:"All sources combined" },
      { label:"DB Records", value: Utils.formatNumber(DataSource.get("db").recordCount), sub: statusLabel("db") },
      { label:"SPO Records", value: Utils.formatNumber(DataSource.get("spo").recordCount), sub: statusLabel("spo") },
      { label:"Market Hierarchy", value: Utils.formatNumber(DataSource.get("marketHierarchy").recordCount), sub: statusLabel("marketHierarchy") },
      { label:"Missing Values", value: Utils.formatNumber(missingCount), sub:"Across all sources" },
      { label:"Duplicate Records", value: Utils.formatNumber(duplicateCount), sub:"Across all sources" },
      { label:"Last Refresh", value: Utils.escapeHtml(lastRefreshLabel()), sub:"Most recent update" },
      { label:"Sources Online", value: ids.filter(id=>DataSource.get(id).recordCount>0).length + " / " + ids.length, sub:"With data loaded" }
    ];

    const statusList = ids.map(id=>{
      const s = DataSource.get(id);
      return `
        <tr>
          <td><strong>${Utils.escapeHtml(s.title)}</strong></td>
          <td>${statusPill(s.status)}</td>
          <td class="num">${Utils.formatNumber(s.recordCount)}</td>
          <td>${Utils.escapeHtml(methodLabel(s.method))}</td>
          <td>${Utils.escapeHtml(s.fileName || s.url || "—")}</td>
          <td>${Utils.escapeHtml(Utils.formatDateTime(s.lastUpdated))}</td>
        </tr>`;
    }).join("");

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Dashboard</div>
        <div class="page-sub">Executive overview of all configured data sources and reports.</div>
      </div>

      <div class="kpi-grid">
        ${kpis.map(k=>`
          <div class="kpi-card">
            <div class="kpi-label">${Utils.escapeHtml(k.label)}</div>
            <div class="kpi-value">${k.value}</div>
            <div class="kpi-sub">${k.sub}</div>
          </div>`).join("")}
      </div>

      <div class="section">
        <div class="section-title">Source Status</div>
        <div class="card table-scroll">
          <table class="data-table">
            <thead><tr>
              <th>Source</th><th>Status</th><th class="num">Records</th><th>Method</th><th>Source</th><th>Last Updated</th>
            </tr></thead>
            <tbody>${statusList}</tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Data Composition</div>
        <div class="grid-2">
          <div class="chart-card">
            <h4>Records per Source</h4>
            <div class="chart-wrap"><canvas id="dashSourceChart"></canvas></div>
          </div>
          <div class="chart-card">
            <h4>Loaded Records Overview</h4>
            <div class="chart-wrap"><canvas id="dashRecordsChart"></canvas></div>
          </div>
        </div>
      </div>
    `;

    setTimeout(()=>{
      const labels = ids.map(id=>DataSource.get(id).title);
      const values = ids.map(id=>DataSource.get(id).recordCount);
      const c1 = document.getElementById("dashSourceChart");
      if(c1) Charts.doughnut("dashSource", c1, labels, values);
      const c2 = document.getElementById("dashRecordsChart");
      if(c2) Charts.bar("dashRecords", c2, labels, values, "Records");
    }, 30);
  }

  function statusLabel(id){
    const s = DataSource.get(id);
    return Utils.escapeHtml(s.status);
  }

  function lastRefreshLabel(){
    const stamps = Object.keys(DataSource.state)
      .map(id=>DataSource.get(id).lastUpdated)
      .filter(Boolean)
      .map(d=>d instanceof Date ? d : new Date(d));
    if(!stamps.length) return "—";
    const latest = new Date(Math.max.apply(null, stamps));
    return Utils.formatDateTime(latest);
  }

  /* =========================================================
     Data Sources
     ========================================================= */
  function renderSources(el){
    const ids = Object.keys(DataSource.state);
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Data Sources</div>
        <div class="page-sub">Configure each source independently — local file, Google Sheets, Google Drive, or direct URL.</div>
      </div>
      <div id="sourceCards"></div>
    `;
    const wrap = document.getElementById("sourceCards");
    ids.forEach(id=>{
      const s = DataSource.get(id);
      const card = document.createElement("div");
      card.className = "source-card";
      card.innerHTML = `
        <div class="source-card-head">
          <div>
            <div class="source-card-title">${Utils.escapeHtml(s.title)} Source</div>
            <div class="source-card-sub">Configure how ${Utils.escapeHtml(s.title)} data is loaded.</div>
          </div>
          ${statusPill(s.status)}
        </div>
        <div class="source-meta">
          <div><div class="m-label">Method</div><div class="m-value">${Utils.escapeHtml(methodLabel(s.method))}</div></div>
          <div><div class="m-label">Records</div><div class="m-value">${Utils.formatNumber(s.recordCount)}</div></div>
          <div><div class="m-label">Last Updated</div><div class="m-value">${Utils.escapeHtml(Utils.formatDateTime(s.lastUpdated))}</div></div>
          <div><div class="m-label">Source Ref</div><div class="m-value">${Utils.escapeHtml(s.fileName || s.url || "—")}</div></div>
        </div>
        ${s.error ? `<div class="state-error" style="margin:8px 0"><div style="font-size:12.5px;white-space:pre-line">${Utils.escapeHtml(s.error)}</div></div>` : ""}
        <div style="margin-top:10px">
          <div class="field-row">
            <input type="file" accept=".csv,.xlsx,.xls" id="file_${id}" style="display:none">
            <button class="btn" data-action="choose" data-id="${id}">Choose File</button>
            <span class="file-name" id="fname_${id}">No file chosen</span>
            <button class="btn btn-primary" data-action="import" data-id="${id}" disabled>Import File</button>
          </div>
          <div class="field-row" style="margin-top:8px">
            <input class="input" type="text" id="url_${id}" placeholder="Paste Google Sheets / Drive / CSV URL…" value="${Utils.escapeHtml(s.url||"")}">
            <button class="btn btn-primary" data-action="loadurl" data-id="${id}">Load Google/Drive Link</button>
            <button class="btn" data-action="refresh" data-id="${id}">Refresh</button>
            <button class="btn" data-action="local" data-id="${id}">Reload Local</button>
          </div>
        </div>
      `;
      wrap.appendChild(card);
    });

    // Wire up events
    ids.forEach(id=>{
      const fileInput = document.getElementById("file_"+id);
      const fname = document.getElementById("fname_"+id);
      const importBtn = document.querySelector(`[data-action="import"][data-id="${id}"]`);
      const chooseBtn = document.querySelector(`[data-action="choose"][data-id="${id}"]`);

      chooseBtn.addEventListener("click", ()=>fileInput.click());
      fileInput.addEventListener("change", ()=>{
        const f = fileInput.files[0];
        fname.textContent = f ? f.name : "No file chosen";
        importBtn.disabled = !f;
      });
      importBtn.addEventListener("click", async ()=>{
        const f = fileInput.files[0];
        if(!f) return;
        await DataSource.loadFromFile(id, f);
        App.toast(`Imported ${f.name}`, "success");
        App.navigate("sources", true);
      });

      document.querySelector(`[data-action="loadurl"][data-id="${id}"]`).addEventListener("click", async ()=>{
        const url = document.getElementById("url_"+id).value.trim();
        if(!url){ App.toast("Please paste a URL first.", "warn"); return; }
        await DataSource.loadFromUrl(id, url);
        App.toast(`Load attempt finished for ${id.toUpperCase()}`, DataSource.get(id).status==="Live" ? "success":"error");
        App.navigate("sources", true);
      });

      document.querySelector(`[data-action="refresh"][data-id="${id}"]`).addEventListener("click", async ()=>{
        await DataSource.refresh(id);
        App.toast(`Refreshed ${id.toUpperCase()}`, "success");
        App.navigate("sources", true);
      });

      document.querySelector(`[data-action="local"][data-id="${id}"]`).addEventListener("click", async ()=>{
        await DataSource.loadLocalFile(id);
        App.toast(`Reloaded local ${id.toUpperCase()}`, "success");
        App.navigate("sources", true);
      });
    });
  }

  /* =========================================================
     Generic Report (DB / SPO / Market Hierarchy)
     ========================================================= */
  function renderSourceReport(el, sourceId, title){
    const s = DataSource.get(sourceId);
    if(!s){
      el.innerHTML = emptyState("Source not found", "This source is not configured.");
      return;
    }

    // Session defaults
    const S = sess(sourceId);
    if(S.hidden[sourceId]===null){
      S.hidden[sourceId] = (window.REPORT_CONFIG.defaultHiddenColumns[sourceId]||[]).slice();
    }
    if(S.order[sourceId]===null){
      S.order[sourceId] = s.columns.slice();
    }

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">${Utils.escapeHtml(title)}</div>
        <div class="page-sub">Search, filter, sort, and export the ${Utils.escapeHtml(title)} dataset.</div>
      </div>

      <div class="search-panel">
        <div class="search-row">
          <div class="search-input-wrap">
            <span class="search-icon">⌕</span>
            <input class="input" id="searchInput" placeholder="Search anything: name, code, phone, address, ID, keyword..." value="${Utils.escapeHtml(S.search[sourceId]||"")}">
          </div>
          <select class="input" id="sourceSelector" style="display:none"></select>
          <select class="input" id="fieldSelector">
            <option value="">All Fields</option>
            ${s.columns.map(c=>`<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join("")}
          </select>
          <button class="btn" id="clearSearch">Clear</button>
        </div>
        <div class="search-row">
          <span class="filter-label">Match</span>
          <select class="input" id="matchType">
            <option value="contains">Contains keyword</option>
            <option value="startsWith">Starts with</option>
            <option value="exact">Exact match</option>
            <option value="allWords">All words</option>
          </select>
          <span class="filter-label">Sort</span>
          <select class="input" id="sortMode">
            <option value="relevance">Sort: Relevance</option>
            <option value="source">Sort: Source</option>
            <option value="az">Sort: A–Z</option>
          </select>
          <span class="filter-label">Page size</span>
          <select class="input" id="pageSizeSel">
            ${window.REPORT_CONFIG.pageSizes.map(p=>`<option value="${p}" ${String(S.pageSize[sourceId])===String(p)?"selected":""}>${p}</option>`).join("")}
          </select>
          <span class="filter-label">Density</span>
          <select class="input" id="densitySel">
            <option value="normal" ${S.density[sourceId]==="normal"?"selected":""}>Normal spacing</option>
            <option value="dense" ${S.density[sourceId]==="dense"?"selected":""}>Dense rows</option>
          </select>
          <button class="btn" id="chooseColsBtn">Choose Table Columns</button>
          <button class="btn" id="advFilterBtn">Advanced Filters</button>
        </div>
      </div>

      <div id="reportBody"></div>
    `;

    // Bind controls
    const searchInput = document.getElementById("searchInput");
    const fieldSelector = document.getElementById("fieldSelector");
    const matchType = document.getElementById("matchType");
    const sortMode = document.getElementById("sortMode");
    const pageSizeSel = document.getElementById("pageSizeSel");
    const densitySel = document.getElementById("densitySel");

    const rerender = ()=>renderReportBody(sourceId, el);

    searchInput.addEventListener("input", Utils.debounce(()=>{
      S.search[sourceId] = searchInput.value;
      rerender();
    }, 180));
    fieldSelector.addEventListener("change", rerender);
    matchType.addEventListener("change", rerender);
    sortMode.addEventListener("change", rerender);
    pageSizeSel.addEventListener("change", ()=>{
      S.pageSize[sourceId] = pageSizeSel.value;
      rerender();
    });
    densitySel.addEventListener("change", ()=>{
      S.density[sourceId] = densitySel.value;
      rerender();
    });
    document.getElementById("clearSearch").addEventListener("click", ()=>{
      searchInput.value = "";
      S.search[sourceId] = "";
      rerender();
    });
    document.getElementById("chooseColsBtn").addEventListener("click", ()=>{
      openColumnManager(sourceId, rerender);
    });
    document.getElementById("advFilterBtn").addEventListener("click", ()=>{
      openAdvancedFilters(sourceId, rerender);
    });

    renderReportBody(sourceId, el);
  }

  function renderReportBody(sourceId, rootEl){
    const s = DataSource.get(sourceId);
    const body = rootEl.querySelector("#reportBody");
    if(!body) return;

    if(s.status === "Loading"){
      body.innerHTML = loadingState("Loading "+s.title+"…");
      return;
    }
    if(s.status === "Connection Error"){
      body.innerHTML = errorState(sourceId, s.error);
      return;
    }
    if(!s.rows.length){
      body.innerHTML = emptyState("No data available",
        `The ${s.title} source returned no records. Configure the source from Data Sources.`,
        `<button class="btn btn-primary" onclick="App.navigate('sources')">Go to Data Sources</button>`);
      return;
    }

    const S = sess(sourceId);
    const query = (S.search[sourceId]||"").trim();
    const field = (rootEl.querySelector("#fieldSelector")||{}).value || "";
    const mode = (rootEl.querySelector("#matchType")||{}).value || "contains";
    const sortM = (rootEl.querySelector("#sortMode")||{}).value || "relevance";
    const view = S.view[sourceId] || "table";

    // Filter
    let rows = s.rows.slice();
    rows = applySearch(rows, query, field, mode, s.title);

    // Advanced filters
    const adv = S.filters[sourceId] || [];
    if(adv.length){
      rows = applyAdvancedFilters(rows, adv);
    }

    // Sort
    if(sortM === "az" && s.columns.length){
      const c = s.columns[0];
      rows.sort((a,b)=>String(a[c]||"").localeCompare(String(b[c]||"")));
    }else if(sortM === "source"){
      rows.sort((a,b)=>String(a.__source||"").localeCompare(String(b.__source||"")));
    }
    // relevance keeps original order (score sort applied for search)

    // Toolbar
    const total = s.recordCount;
    const filtered = rows.length;

    const toolbar = `
      <div class="results-toolbar">
        <div class="view-switch" id="viewSwitch">
          <button data-view="cards" class="${view==='cards'?'active':''}">Cards</button>
          <button data-view="table" class="${view==='table'?'active':''}">Table</button>
          <button data-view="compact" class="${view==='compact'?'active':''}">Compact</button>
          <button data-view="split" class="${view==='split'?'active':''}">Source Split</button>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <span class="results-count">Showing ${filtered===0?0:1}–${filtered} of ${Utils.formatNumber(total)} records${query?` (filtered from ${Utils.formatNumber(total)})`:""}</span>
          <button class="btn" id="exportFilteredBtn">Export CSV</button>
        </div>
      </div>
    `;

    const viewHtml = `
      ${toolbar}
      <div id="viewHost"></div>
    `;
    body.innerHTML = viewHtml;

    // View switch
    body.querySelectorAll("#viewSwitch button").forEach(b=>{
      b.addEventListener("click", ()=>{
        S.view[sourceId] = b.dataset.view;
        body.querySelectorAll("#viewSwitch button").forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        paintView(sourceId, rows, body.querySelector("#viewHost"), rootEl);
      });
    });

    body.querySelector("#exportFilteredBtn").addEventListener("click", ()=>{
      const cols = s.columns;
      const csv = Utils.toCSV(rows.map(r=>{
        const o = {}; cols.forEach(c=>o[c]=r[c]); return o;
      }), cols);
      Utils.download(`${s.title.replace(/\s+/g,'_')}_Report_${Utils.todayStamp()}.csv`, csv, "text/csv;charset=utf-8;");
      App.toast("Export started", "success");
    });

    paintView(sourceId, rows, body.querySelector("#viewHost"), rootEl);
  }

  function paintView(sourceId, rows, host, rootEl){
    const s = DataSource.get(sourceId);
    const S = sess(sourceId);
    const view = S.view[sourceId] || "table";
    const pageSize = S.pageSize[sourceId];

    if(view === "cards"){
      host.innerHTML = renderCards(rows, s);
    }else if(view === "compact"){
      host.innerHTML = renderCompact(rows, s);
    }else if(view === "split"){
      host.innerHTML = renderSplit(rows, s);
    }else{
      host.innerHTML = `<div class="table-wrap ${S.density[sourceId]==='dense'?'dense':''}" id="tableHost"></div>`;
      setTimeout(()=>{
        const el = host.querySelector("#tableHost");
        if(!el) return;
        DataTable.create(el, rows, Utils.detectColumns(rows.length?rows:s.rows), {
          hidden: S.hidden[sourceId] || [],
          order: S.order[sourceId] || s.columns,
          pageSize: pageSize
        });
      }, 0);
    }
  }

  function renderCards(rows, s){
    if(!rows.length) return emptyState("No results", "No records match your search or filters.");
    const cols = s.columns.slice(0, 12); // show a reasonable subset
    return `<div class="cards-grid">${rows.slice(0,300).map((r,i)=>`
      <div class="record-card">
        <div class="record-card-head">
          <span class="record-card-num">#${i+1}</span>
          <span class="record-card-source">${Utils.escapeHtml(r.__source||s.title)}</span>
        </div>
        ${cols.map(c=>{
          const v = r[c];
          if(v===null||v===undefined||v==="") return "";
          return `<div class="record-card-field"><span class="k">${Utils.escapeHtml(c)}</span><span class="v">${Utils.escapeHtml(String(v))}</span></div>`;
        }).join("")}
      </div>`).join("")}</div>
      ${rows.length>300?`<div class="state-box" style="padding:14px"><p>Showing first 300 of ${rows.length} records. Use Table view for full data.</p></div>`:""}`;
  }

  function renderCompact(rows, s){
    if(!rows.length) return emptyState("No results", "No records match your search or filters.");
    const cols = s.columns.slice(0,3);
    const head = `<div class="compact-row head"><div class="num">#</div>${cols.map(c=>`<div class="cell">${Utils.escapeHtml(c)}</div>`).join("")}${s.columns.length>3?`<div class="cell">…</div>`:""}</div>`;
    const body = rows.slice(0,500).map((r,i)=>`
      <div class="compact-row">
        <div class="num">${i+1}</div>
        ${cols.map(c=>`<div class="cell" title="${Utils.escapeHtml(String(r[c]??''))}">${Utils.escapeHtml(String(r[c]??''))}</div>`).join("")}
        ${s.columns.length>3?`<div class="cell">+${s.columns.length-3} more</div>`:""}
      </div>`).join("");
    return `<div class="compact-list">${head}${body}</div>
      ${rows.length>500?`<div class="state-box" style="padding:14px"><p>Showing first 500 of ${rows.length} records.</p></div>`:""}`;
  }

  function renderSplit(rows, s){
    // Group by __source if combined; here only one source, so show single section
    const groups = {};
    rows.forEach(r=>{
      const key = r.__source || s.title;
      (groups[key] = groups[key] || []).push(r);
    });
    const keys = Object.keys(groups);
    if(!keys.length) return emptyState("No results", "No records match your search or filters.");
    return keys.map(k=>`
      <div class="split-section">
        <div class="split-head">
          <span class="badge">${Utils.escapeHtml(k)}</span>
          <span class="count">${groups[k].length} records</span>
        </div>
        <div class="table-wrap" id="split_${k.replace(/[^a-z0-9]/gi,'_')}"></div>
      </div>
    `).join("") + `<script>window.__splitGroups = ${JSON.stringify(keys.map(k=>k.replace(/[^a-z0-9]/gi,'_')))};<\/script>`;
  }

  /* =========================================================
     Search
     ========================================================= */
  function applySearch(rows, query, field, mode, sourceTitle){
    if(!query) return rows;
    const q = query.toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);

    function matchCell(val){
      if(val===null||val===undefined) return false;
      const s = String(val).toLowerCase();
      switch(mode){
        case "exact": return s === q;
        case "startsWith": return s.startsWith(q);
        case "allWords": return words.every(w=>s.includes(w));
        case "contains":
        default: return s.includes(q);
      }
    }

    function scoreRow(r){
      let score = 0;
      const fields = field ? [field] : Object.keys(r);
      for(const f of fields){
        if(f === "__source" || f === "__sourceId") continue;
        const v = r[f];
        if(v===null||v===undefined) continue;
        const s = String(v).toLowerCase();
        if(s === q) score += 100;
        else if(s.startsWith(q)) score += 50;
        else if(s.includes(q)) score += 20;
        if(mode === "allWords"){
          if(words.every(w=>s.includes(w))) score += 10;
        }
      }
      return score;
    }

    const filtered = rows.filter(r=>{
      const fields = field ? [field] : Object.keys(r);
      return fields.some(f=>matchCell(r[f]));
    });

    // attach scores for relevance sort
    filtered.forEach(r=>{ r.__score = scoreRow(r); });
    filtered.sort((a,b)=>(b.__score||0)-(a.__score||0));
    return filtered;
  }

  /* =========================================================
     Advanced filters
     ========================================================= */
  function applyAdvancedFilters(rows, filters){
    return rows.filter(r=>{
      return filters.every(f=>{
        if(!f.field || !f.op) return true;
        const v = r[f.field];
        const sv = String(v??"").toLowerCase();
        const fv = String(f.value??"").toLowerCase();
        switch(f.op){
          case "contains": return sv.includes(fv);
          case "eq": return sv === fv;
          case "neq": return sv !== fv;
          case "gt": return Number(v) > Number(f.value);
          case "lt": return Number(v) < Number(f.value);
          case "gte": return Number(v) >= Number(f.value);
          case "lte": return Number(v) <= Number(f.value);
          case "empty": return v===null||v===undefined||String(v).trim()==="";
          default: return true;
        }
      });
    });
  }

  /* =========================================================
     Column manager modal
     ========================================================= */
  function openColumnManager(sourceId, onApply){
    const s = DataSource.get(sourceId);
    const S = sess(sourceId);
    const list = document.getElementById("colManagerList");
    const hidden = new Set((S.hidden[sourceId]||[]).map(h=>h.toLowerCase()));
    const order = (S.order[sourceId] && S.order[sourceId].length) ? S.order[sourceId].slice() : s.columns.slice();
    // ensure all columns present
    s.columns.forEach(c=>{ if(!order.includes(c)) order.push(c); });

    list.innerHTML = order.map(c=>`
      <li draggable="true" data-field="${Utils.escapeHtml(c)}">
        <span style="color:#94a3b8">⋮⋮</span>
        <input type="checkbox" ${hidden.has(c.toLowerCase())?"":"checked"} data-check="${Utils.escapeHtml(c)}">
        <label>${Utils.escapeHtml(c)}</label>
      </li>`).join("");

    // drag reorder
    let dragEl = null;
    list.querySelectorAll("li").forEach(li=>{
      li.addEventListener("dragstart", e=>{
        dragEl = li; li.classList.add("dragging");
      });
      li.addEventListener("dragend", ()=>{ li.classList.remove("dragging"); dragEl=null; });
      li.addEventListener("dragover", e=>{
        e.preventDefault();
        const after = getDragAfterElement(list, e.clientY);
        if(!dragEl) return;
        if(after == null) list.appendChild(dragEl);
        else list.insertBefore(dragEl, after);
      });
    });

    const modal = document.getElementById("colManagerModal");
    modal.classList.remove("hidden");

    const apply = ()=>{
      const items = Array.from(list.querySelectorAll("li"));
      const newHidden = [];
      const newOrder = [];
      items.forEach(li=>{
        const f = li.dataset.field;
        newOrder.push(f);
        const cb = li.querySelector("input[type=checkbox]");
        if(!cb.checked) newHidden.push(f);
      });
      S.hidden[sourceId] = newHidden;
      S.order[sourceId] = newOrder;
      modal.classList.add("hidden");
      if(onApply) onApply();
    };

    document.getElementById("colApplyBtn").onclick = apply;
    document.getElementById("colResetBtn").onclick = ()=>{
      S.hidden[sourceId] = (window.REPORT_CONFIG.defaultHiddenColumns[sourceId]||[]).slice();
      S.order[sourceId] = s.columns.slice();
      modal.classList.add("hidden");
      if(onApply) onApply();
    };
    modal.querySelectorAll("[data-close-modal]").forEach(b=>{
      b.onclick = ()=>modal.classList.add("hidden");
    });
  }

  function getDragAfterElement(container, y){
    const els = Array.from(container.querySelectorAll("li:not(.dragging)"));
    return els.reduce((closest, child)=>{
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height/2;
      if(offset < 0 && offset > closest.offset){
        return { offset, element: child };
      }
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }

  /* =========================================================
     Advanced filter modal
     ========================================================= */
  function openAdvancedFilters(sourceId, onApply){
    const s = DataSource.get(sourceId);
    const S = sess(sourceId);
    const wrap = document.getElementById("advFilterRows");
    let rows = (S.filters[sourceId]||[]).slice();
    if(rows.length===0) rows = [{field:"", op:"contains", value:""}];

    function paint(){
      wrap.innerHTML = rows.map((r,i)=>`
        <div class="adv-filter-row">
          <select data-i="${i}" data-k="field">
            <option value="">— Field —</option>
            ${s.columns.map(c=>`<option value="${Utils.escapeHtml(c)}" ${r.field===c?"selected":""}>${Utils.escapeHtml(c)}</option>`).join("")}
          </select>
          <select data-i="${i}" data-k="op">
            ${[
              ["contains","contains"],["eq","="],["neq","≠"],
              ["gt",">"],["lt","<"],["gte","≥"],["lte","≤"],["empty","is empty"]
            ].map(([v,l])=>`<option value="${v}" ${r.op===v?"selected":""}>${l}</option>`).join("")}
          </select>
          <input data-i="${i}" data-k="value" value="${Utils.escapeHtml(r.value||"")}" placeholder="value">
          <span></span>
          <button class="btn btn-sm btn-danger" data-rm="${i}">✕</button>
        </div>
      `).join("");
      wrap.querySelectorAll("select,input").forEach(inp=>{
        inp.oninput = inp.onchange = ()=>{
          const i = +inp.dataset.i, k = inp.dataset.k;
          rows[i][k] = inp.value;
        };
      });
      wrap.querySelectorAll("[data-rm]").forEach(b=>{
        b.onclick = ()=>{ rows.splice(+b.dataset.rm,1); if(!rows.length) rows=[{field:"",op:"contains",value:""}]; paint(); };
      });
    }
    paint();

    document.getElementById("advAddRow").onclick = ()=>{ rows.push({field:"",op:"contains",value:""}); paint(); };
    document.getElementById("advClearBtn").onclick = ()=>{
      rows = [{field:"",op:"contains",value:""}];
      S.filters[sourceId] = [];
      paint();
      document.getElementById("advFilterModal").classList.add("hidden");
      if(onApply) onApply();
    };
    document.getElementById("advApplyBtn").onclick = ()=>{
      S.filters[sourceId] = rows.filter(r=>r.field && r.op);
      document.getElementById("advFilterModal").classList.add("hidden");
      if(onApply) onApply();
    };
    const modal = document.getElementById("advFilterModal");
    modal.classList.remove("hidden");
    modal.querySelectorAll("[data-close-modal]").forEach(b=>{
      b.onclick = ()=>modal.classList.add("hidden");
    });
  }

  /* =========================================================
     Summary
     ========================================================= */
  function renderSummary(el){
    const ids = Object.keys(DataSource.state);
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Summary</div>
        <div class="page-sub">Automatic summaries derived from the actual loaded datasets.</div>
      </div>
      <div id="summaryBody"></div>
    `;
    const body = document.getElementById("summaryBody");
    let html = "";
    ids.forEach(id=>{
      const s = DataSource.get(id);
      if(!s.rows.length){
        html += `<div class="section"><div class="section-title">${Utils.escapeHtml(s.title)} <span class="count-badge">No data</span></div>
          ${emptyState("No data available", "Load the "+s.title+" source to see its summary.")}</div>`;
        return;
      }
      html += renderSummaryForSource(s);
    });
    body.innerHTML = html;
  }

  function renderSummaryForSource(s){
    const cols = s.columns;
    const rows = s.rows;
    const numericCols = [];
    const catCols = [];
    const dateCols = [];

    cols.forEach(c=>{
      const t = Utils.detectColumnType(rows.slice(0,300).map(r=>r[c]));
      if(t==="number") numericCols.push(c);
      else if(t==="categorical") catCols.push(c);
      else if(t==="date") dateCols.push(c);
    });

    let html = `<div class="section">
      <div class="section-title">${Utils.escapeHtml(s.title)} <span class="count-badge">${Utils.formatNumber(rows.length)} records</span></div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Records</div><div class="kpi-value">${Utils.formatNumber(rows.length)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Columns</div><div class="kpi-value">${cols.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Numeric Columns</div><div class="kpi-value">${numericCols.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Categorical Columns</div><div class="kpi-value">${catCols.length}</div></div>
      </div>`;

    if(numericCols.length){
      html += `<div class="card table-scroll" style="margin-top:14px">
        <table class="data-table">
          <thead><tr><th>Numeric Column</th><th class="num">Count</th><th class="num">Sum</th><th class="num">Avg</th><th class="num">Min</th><th class="num">Max</th></tr></thead>
          <tbody>
            ${numericCols.map(c=>{
              const nums = rows.map(r=>Utils.toNumber(r[c])).filter(n=>!isNaN(n));
              if(!nums.length) return "";
              const sum = nums.reduce((a,b)=>a+b,0);
              const avg = sum/nums.length;
              return `<tr>
                <td>${Utils.escapeHtml(c)}</td>
                <td class="num">${Utils.formatNumber(nums.length)}</td>
                <td class="num">${Utils.formatNumber(Math.round(sum*100)/100)}</td>
                <td class="num">${Utils.formatNumber(Math.round(avg*100)/100)}</td>
                <td class="num">${Utils.formatNumber(Math.min.apply(null,nums))}</td>
                <td class="num">${Utils.formatNumber(Math.max.apply(null,nums))}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table></div>`;
    }

    if(catCols.length){
      html += `<div class="grid-2" style="margin-top:14px">`;
      catCols.slice(0,4).forEach((c,i)=>{
        const counts = {};
        rows.forEach(r=>{
          const v = String(r[c]??"").trim() || "(empty)";
          counts[v] = (counts[v]||0)+1;
        });
        const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
        const canvasId = "sumCat_"+i;
        html += `<div class="chart-card">
          <h4>${Utils.escapeHtml(c)} — Top values</h4>
          <div class="chart-wrap"><canvas id="${canvasId}"></canvas></div>
        </div>`;
        setTimeout(()=>{
          const cv = document.getElementById(canvasId);
          if(cv) Charts.horizontalBar(canvasId, cv, entries.map(e=>e[0]), entries.map(e=>e[1]), "Records");
        }, 30);
      });
      html += `</div>`;
    }

    if(dateCols.length){
      const c = dateCols[0];
      const counts = {};
      rows.forEach(r=>{
        const d = Utils.toDate(r[c]);
        if(!d) return;
        const k = d.toISOString().slice(0,10);
        counts[k] = (counts[k]||0)+1;
      });
      const keys = Object.keys(counts).sort();
      const canvasId = "sumDate_"+s.id;
      html += `<div class="chart-card" style="margin-top:14px">
        <h4>${Utils.escapeHtml(c)} — Records over time</h4>
        <div class="chart-wrap"><canvas id="${canvasId}"></canvas></div>
      </div>`;
      setTimeout(()=>{
        const cv = document.getElementById(canvasId);
        if(cv) Charts.line(canvasId, cv, keys, keys.map(k=>counts[k]), "Records");
      }, 30);
    }

    html += `</div>`;
    return html;
  }

  /* =========================================================
     Data Quality
     ========================================================= */
  function renderQuality(el){
    const ids = Object.keys(DataSource.state);
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Data Quality</div>
        <div class="page-sub">Missing values, duplicates and anomalies detected in the actual loaded data.</div>
      </div>
      <div id="qualityBody"></div>
    `;
    const body = document.getElementById("qualityBody");
    let html = "";
    ids.forEach(id=>{
      const s = DataSource.get(id);
      if(!s.rows.length){
        html += `<div class="section"><div class="section-title">${Utils.escapeHtml(s.title)} <span class="count-badge">No data</span></div>
          ${emptyState("No data available", "Load the "+s.title+" source to analyze quality.")}</div>`;
        return;
      }
      html += renderQualityForSource(s);
    });
    body.innerHTML = html;
  }

  function renderQualityForSource(s){
    const rows = s.rows;
    const cols = s.columns;
    const q = DataQuality.analyze(rows, cols);

    const colRows = cols.map(c=>{
      const total = rows.length;
      let missing = 0, unique = new Set();
      rows.forEach(r=>{
        const v = r[c];
        if(v===null||v===undefined||String(v).trim()==="") missing++;
        else unique.add(String(v));
      });
      const pct = total ? (missing/total*100) : 0;
      return { col:c, total, missing, pct, unique: unique.size };
    });

    return `<div class="section">
      <div class="section-title">${Utils.escapeHtml(s.title)} <span class="count-badge">${Utils.formatNumber(rows.length)} records</span></div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">Total Records</div><div class="kpi-value">${Utils.formatNumber(rows.length)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Records With Missing Data</div><div class="kpi-value">${Utils.formatNumber(q.rowsWithMissing)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Duplicate Records</div><div class="kpi-value">${Utils.formatNumber(q.duplicateRows)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Potential Data Errors</div><div class="kpi-value">${Utils.formatNumber(q.potentialErrors)}</div></div>
      </div>
      <div class="card table-scroll" style="margin-top:14px">
        <table class="data-table">
          <thead><tr><th>Column</th><th class="num">Total</th><th class="num">Missing Count</th><th class="num">Missing %</th><th class="num">Unique Count</th></tr></thead>
          <tbody>
            ${colRows.map(r=>`
              <tr>
                <td>${Utils.escapeHtml(r.col)}</td>
                <td class="num">${Utils.formatNumber(r.total)}</td>
                <td class="num">${Utils.formatNumber(r.missing)}</td>
                <td class="num">${r.pct.toFixed(2)}%</td>
                <td class="num">${Utils.formatNumber(r.unique)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>`;
  }

  /* =========================================================
     Comparison
     ========================================================= */
  function renderComparison(el){
    const ids = Object.keys(DataSource.state).filter(id=>DataSource.get(id).rows.length>0);
    if(!ids.length){
      el.innerHTML = `<div class="page-header"><div class="page-title">Comparison</div></div>
        ${emptyState("No data available", "Load at least one source to use Comparison.")}`;
      return;
    }

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Comparison</div>
        <div class="page-sub">Compare groups within an actual loaded field.</div>
      </div>

      <div class="filter-bar">
        <span class="filter-label">Source</span>
        <select class="input" id="cmpSource">
          ${ids.map(id=>`<option value="${id}">${Utils.escapeHtml(DataSource.get(id).title)}</option>`).join("")}
        </select>
        <span class="filter-label">Compare By</span>
        <select class="input" id="cmpField"></select>
        <span class="filter-label">Metric</span>
        <select class="input" id="cmpMetric"></select>
        <button class="btn btn-primary" id="cmpRun">Compare</button>
      </div>

      <div id="cmpBody"></div>
    `;

    function refreshFields(){
      const id = document.getElementById("cmpSource").value;
      const s = DataSource.get(id);
      const fieldSel = document.getElementById("cmpField");
      fieldSel.innerHTML = s.columns.map(c=>`<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join("");
      refreshMetrics();
    }
    function refreshMetrics(){
      const id = document.getElementById("cmpSource").value;
      const s = DataSource.get(id);
      const field = document.getElementById("cmpField").value;
      const metricSel = document.getElementById("cmpMetric");
      const t = Utils.detectColumnType(s.rows.slice(0,300).map(r=>r[field]));
      const opts = [["count","Record Count"],["unique","Unique Count"]];
      if(t==="number"){
        opts.push(["sum","Sum"],["avg","Average"],["min","Minimum"],["max","Maximum"]);
      }
      metricSel.innerHTML = opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join("");
    }
    document.getElementById("cmpSource").onchange = ()=>{ refreshFields(); };
    document.getElementById("cmpField").onchange = refreshMetrics;
    document.getElementById("cmpRun").onclick = ()=>{
      const id = document.getElementById("cmpSource").value;
      const s = DataSource.get(id);
      const field = document.getElementById("cmpField").value;
      const metric = document.getElementById("cmpMetric").value;
      const rows = s.rows;

      // group
      const groups = {};
      rows.forEach(r=>{
        const k = String(r[field]??"").trim() || "(empty)";
        (groups[k] = groups[k] || []).push(r);
      });

      const labels = Object.keys(groups);
      const values = labels.map(k=>{
        const arr = groups[k];
        switch(metric){
          case "unique": {
            const set = new Set();
            arr.forEach(r=>Object.values(r).forEach(v=>set.add(String(v))));
            return set.size;
          }
          case "sum": return arr.reduce((a,r)=>a+(Utils.toNumber(r[field])||0),0);
          case "avg": {
            const nums = arr.map(r=>Utils.toNumber(r[field])).filter(n=>!isNaN(n));
            return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : 0;
          }
          case "min": {
            const nums = arr.map(r=>Utils.toNumber(r[field])).filter(n=>!isNaN(n));
            return nums.length ? Math.min.apply(null,nums) : 0;
          }
          case "max": {
            const nums = arr.map(r=>Utils.toNumber(r[field])).filter(n=>!isNaN(n));
            return nums.length ? Math.max.apply(null,nums) : 0;
          }
          case "count":
          default: return arr.length;
        }
      });

      const body = document.getElementById("cmpBody");
      body.innerHTML = `
        <div class="grid-2">
          <div class="chart-card">
            <h4>${Utils.escapeHtml(field)} — ${Utils.escapeHtml(metric)}</h4>
            <div class="chart-wrap"><canvas id="cmpChart"></canvas></div>
          </div>
          <div class="card table-scroll">
            <table class="data-table">
              <thead><tr><th>${Utils.escapeHtml(field)}</th><th class="num">${Utils.escapeHtml(metric)}</th></tr></thead>
              <tbody>
                ${labels.map((l,i)=>`<tr><td>${Utils.escapeHtml(l)}</td><td class="num">${Utils.formatNumber(Math.round(values[i]*100)/100)}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
      setTimeout(()=>{
        const cv = document.getElementById("cmpChart");
        if(cv) Charts.bar("cmpChart", cv, labels, values, metric);
      }, 30);
    };

    refreshFields();
  }

  /* =========================================================
     DB ↔ SPO Matching
     ========================================================= */
  function renderMatching(el){
    const db = DataSource.get("db");
    const spo = DataSource.get("spo");
    if(!db.rows.length || !spo.rows.length){
      el.innerHTML = `<div class="page-header"><div class="page-title">DB ↔ SPO Matching</div></div>
        ${emptyState("Data required", "Both DB and SPO sources must be loaded to use matching.",
          `<button class="btn btn-primary" onclick="App.navigate('sources')">Go to Data Sources</button>`)}`;
      return;
    }

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">DB ↔ SPO Matching</div>
        <div class="page-sub">Select the matching fields for each source and classify records.</div>
      </div>

      <div class="filter-bar">
        <span class="filter-label">DB Field</span>
        <select class="input" id="mDbField">${db.columns.map(c=>`<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join("")}</select>
        <span class="filter-label">SPO Field</span>
        <select class="input" id="mSpoField">${spo.columns.map(c=>`<option value="${Utils.escapeHtml(c)}">${Utils.escapeHtml(c)}</option>`).join("")}</select>
        <span class="filter-label">Mode</span>
        <select class="input" id="mMode">
          <option value="exact">Exact</option>
          <option value="ci">Case insensitive</option>
          <option value="trim">Trim whitespace</option>
          <option value="ciTrim" selected>Case insensitive + Trim</option>
        </select>
        <button class="btn btn-primary" id="mRun">Match</button>
      </div>

      <div id="mBody"></div>
    `;

    document.getElementById("mRun").onclick = ()=>{
      const dbF = document.getElementById("mDbField").value;
      const spoF = document.getElementById("mSpoField").value;
      const mode = document.getElementById("mMode").value;
      runMatching(db, spo, dbF, spoF, mode);
    };
  }

  function runMatching(db, spo, dbF, spoF, mode){
    function norm(v){
      if(v===null||v===undefined) return "";
      let s = String(v);
      if(mode === "ci" || mode === "ciTrim") s = s.toLowerCase();
      if(mode === "trim" || mode === "ciTrim") s = s.trim();
      return s;
    }

    const dbMap = new Map();
    db.rows.forEach(r=>{
      const k = norm(r[dbF]);
      if(k==="") return;
      if(!dbMap.has(k)) dbMap.set(k, []);
      dbMap.get(k).push(r);
    });

    const spoMap = new Map();
    spo.rows.forEach(r=>{
      const k = norm(r[spoF]);
      if(k==="") return;
      if(!spoMap.has(k)) spoMap.set(k, []);
      spoMap.get(k).push(r);
    });

    let matched = 0, dbOnly = 0, spoOnly = 0, potentialDup = 0;
    const dbKeys = new Set(dbMap.keys());
    const spoKeys = new Set(spoMap.keys());

    dbKeys.forEach(k=>{
      if(spoKeys.has(k)) matched++;
      else dbOnly++;
    });
    spoKeys.forEach(k=>{
      if(!dbKeys.has(k)) spoOnly++;
    });
    dbMap.forEach((arr,k)=>{ if(arr.length>1) potentialDup++; });

    const body = document.getElementById("mBody");
    body.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-label">DB Records</div><div class="kpi-value">${Utils.formatNumber(db.rows.length)}</div></div>
        <div class="kpi-card"><div class="kpi-label">SPO Records</div><div class="kpi-value">${Utils.formatNumber(spo.rows.length)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Matched</div><div class="kpi-value" style="color:var(--success)">${Utils.formatNumber(matched)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Only in DB</div><div class="kpi-value" style="color:var(--warn)">${Utils.formatNumber(dbOnly)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Only in SPO</div><div class="kpi-value" style="color:var(--danger)">${Utils.formatNumber(spoOnly)}</div></div>
        <div class="kpi-card"><div class="kpi-label">Potential Duplicates (DB)</div><div class="kpi-value">${Utils.formatNumber(potentialDup)}</div></div>
      </div>

      <div class="grid-2">
        <div class="chart-card">
          <h4>Match Classification</h4>
          <div class="chart-wrap"><canvas id="mChart"></canvas></div>
        </div>
        <div class="chart-card">
          <h4>DB Field vs SPO Field</h4>
          <div class="chart-wrap"><canvas id="mChart2"></canvas></div>
        </div>
      </div>
    `;
    setTimeout(()=>{
      const c1 = document.getElementById("mChart");
      if(c1) Charts.doughnut("mChart", c1,
        ["Matched","Only in DB","Only in SPO"],
        [matched, dbOnly, spoOnly]);
      const c2 = document.getElementById("mChart2");
      if(c2) Charts.bar("mChart2", c2,
        ["DB total","SPO total","Matched"],
        [db.rows.length, spo.rows.length, matched], "Records");
    }, 30);
  }

  /* =========================================================
     Export Center
     ========================================================= */
  function renderExport(el){
    const ids = Object.keys(DataSource.state);
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Export Center</div>
        <div class="page-sub">Export any loaded dataset in CSV, Excel or JSON format.</div>
      </div>

      <div class="card card-pad">
        <div class="grid-3">
          <div>
            <div class="m-label" style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px">Report</div>
            <select class="input" id="expReport" style="width:100%">
              ${ids.map(id=>`<option value="${id}">${Utils.escapeHtml(DataSource.get(id).title)}</option>`).join("")}
            </select>
          </div>
          <div>
            <div class="m-label" style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px">Export</div>
            <select class="input" id="expScope" style="width:100%">
              <option value="all">All Records</option>
              <option value="filtered">Filtered Records</option>
            </select>
          </div>
          <div>
            <div class="m-label" style="font-size:11px;color:var(--text-3);text-transform:uppercase;font-weight:600;margin-bottom:4px">Format</div>
            <select class="input" id="expFormat" style="width:100%">
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="json">JSON</option>
              <option value="print">Print</option>
            </select>
          </div>
        </div>
        <div style="margin-top:14px">
          <button class="btn btn-primary" id="expRun">Export</button>
        </div>
      </div>
    `;

    document.getElementById("expRun").onclick = ()=>{
      const id = document.getElementById("expReport").value;
      const format = document.getElementById("expFormat").value;
      const s = DataSource.get(id);
      if(!s.rows.length){ App.toast("No data to export.", "warn"); return; }
      const rows = s.rows;
      const cols = s.columns;
      const base = s.title.replace(/\s+/g,'_') + "_Report_" + Utils.todayStamp();

      if(format === "csv"){
        const csv = Utils.toCSV(rows, cols);
        Utils.download(base + ".csv", csv, "text/csv;charset=utf-8;");
      }else if(format === "json"){
        Utils.download(base + ".json", JSON.stringify(rows, null, 2), "application/json");
      }else if(format === "xlsx"){
        const aoa = [cols].concat(rows.map(r=>cols.map(c=>r[c])));
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, base + ".xlsx");
      }else if(format === "print"){
        const w = window.open("", "_blank");
        w.document.write(`<html><head><title>${base}</title></head><body>
          <h2>${Utils.escapeHtml(s.title)} Report</h2>
          <table border="1" cellspacing="0" cellpadding="4" style="border-collapse:collapse;font-size:12px">
            <thead><tr>${cols.map(c=>`<th>${Utils.escapeHtml(c)}</th>`).join("")}</tr></thead>
            <tbody>${rows.slice(0,2000).map(r=>`<tr>${cols.map(c=>`<td>${Utils.escapeHtml(String(r[c]??''))}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </body></html>`);
        w.document.close();
        w.focus();
        setTimeout(()=>w.print(), 300);
      }
      App.toast("Export started", "success");
    };
  }

  /* =========================================================
     Settings
     ========================================================= */
  function renderSettings(el){
    const cfg = window.REPORT_CONFIG;
    const sourceRows = Object.keys(cfg.sources).map(id=>{
      const s = cfg.sources[id];
      return `<tr>
        <td><strong>${Utils.escapeHtml(s.title)}</strong></td>
        <td>${Utils.escapeHtml(s.localFile||"—")}</td>
        <td>${Utils.escapeHtml(s.url||"—")}</td>
        <td>${Utils.escapeHtml(s.gid||"—")}</td>
      </tr>`;
    }).join("");

    const reportRows = cfg.reports.map(r=>`
      <tr>
        <td>${Utils.escapeHtml(r.title)}</td>
        <td><code>${Utils.escapeHtml(r.id)}</code></td>
        <td>${r.enabled?"Enabled":"Disabled"}</td>
        <td>${Utils.escapeHtml(r.source||"—")}</td>
      </tr>`).join("");

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">Settings</div>
        <div class="page-sub">Current application configuration (read-only — edit js/config.js to change).</div>
      </div>

      <div class="settings-grid">
        <div class="card card-pad">
          <div class="settings-item"><div class="s-label">Company Name</div><div class="s-value">${Utils.escapeHtml(cfg.companyName)}</div></div>
          <div class="settings-item"><div class="s-label">Application Name</div><div class="s-value">${Utils.escapeHtml(cfg.appTitle)}</div></div>
          <div class="settings-item"><div class="s-label">Application Version</div><div class="s-value">${Utils.escapeHtml(cfg.version)}</div></div>
          <div class="settings-item"><div class="s-label">Page Sizes</div><div class="s-value">${cfg.pageSizes.join(", ")}</div></div>
        </div>
        <div class="card card-pad">
          <div class="settings-item"><div class="s-label">Configured Reports</div><div class="s-value">${cfg.reports.length}</div></div>
          <div class="settings-item"><div class="s-label">Configured Sources</div><div class="s-value">${Object.keys(cfg.sources).length}</div></div>
          <div class="settings-item"><div class="s-label">Default Hidden Columns</div><div class="s-value">${Object.keys(cfg.defaultHiddenColumns).map(k=>`${k}: [${(cfg.defaultHiddenColumns[k]||[]).join(", ")}]`).join("<br>")}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Sources</div>
        <div class="card table-scroll">
          <table class="data-table">
            <thead><tr><th>Source</th><th>Local File</th><th>URL</th><th>GID</th></tr></thead>
            <tbody>${sourceRows}</tbody>
          </table>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Reports</div>
        <div class="card table-scroll">
          <table class="data-table">
            <thead><tr><th>Title</th><th>ID</th><th>Status</th><th>Source</th></tr></thead>
            <tbody>${reportRows}</tbody>
          </table>
        </div>
      </div>

      <div class="security-note">
        <strong>⚠ Security Warning</strong>
        Never put passwords, API keys, service-account credentials, authentication cookies, or other private secrets in the GitHub repository.
        Private data should be connected through a Google Apps Script or a secure backend/API.
      </div>
    `;
  }

  /* =========================================================
     Public API
     ========================================================= */
  const renderers = {
    dashboard: renderDashboard,
    sources: renderSources,
    db: (el)=>renderSourceReport(el, "db", "DB Report"),
    spo: (el)=>renderSourceReport(el, "spo", "SPO Report"),
    marketHierarchy: (el)=>renderSourceReport(el, "marketHierarchy", "Market Hierarchy"),
    summary: renderSummary,
    quality: renderQuality,
    comparison: renderComparison,
    matching: renderMatching,
    export: renderExport,
    settings: renderSettings
  };

  function render(id, el){
    const fn = renderers[id];
    if(!fn){
      el.innerHTML = emptyState("Report not found", "No renderer registered for \""+id+"\".");
      return;
    }
    fn(el);
  }

  return { render, session, renderSourceReport };
})();