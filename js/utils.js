/* ============================================================
   Utilities — shared helpers
   ============================================================ */
window.Utils = (function(){

  function debounce(fn, wait){
    let t;
    return function(...args){
      clearTimeout(t);
      t = setTimeout(()=>fn.apply(this,args), wait);
    };
  }

  function escapeHtml(s){
    if(s===null||s===undefined) return "";
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  }

  function formatNumber(n){
    if(n===null||n===undefined||n==="") return "";
    const num = Number(n);
    if(!isFinite(num)) return String(n);
    return num.toLocaleString();
  }

  function formatDateTime(d){
    if(!d) return "—";
    const dt = (d instanceof Date) ? d : new Date(d);
    if(isNaN(dt.getTime())) return "—";
    const p = x=>String(x).padStart(2,"0");
    return `${dt.getFullYear()}-${p(dt.getMonth()+1)}-${p(dt.getDate())} ${p(dt.getHours())}:${p(dt.getMinutes())}:${p(dt.getSeconds())}`;
  }

  function todayStamp(){
    const d = new Date();
    const p = x=>String(x).padStart(2,"0");
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
  }

  /* Detect column type from sampled values */
  function detectColumnType(values){
    let nonEmpty = values.filter(v=>v!==null && v!==undefined && String(v).trim()!=="");
    if(nonEmpty.length===0) return "text";
    const sample = nonEmpty.slice(0, 200);

    // Boolean
    const boolVals = sample.filter(v=>/^(true|false|yes|no|0|1)$/i.test(String(v).trim()));
    if(boolVals.length === sample.length && sample.length>0 && new Set(sample.map(v=>String(v).toLowerCase())).size<=2){
      // but 0/1 could be numbers; only treat as boolean if it has true/false/yes/no
      if(sample.some(v=>/^(true|false|yes|no)$/i.test(String(v).trim()))) return "boolean";
    }

    // Number
    const numVals = sample.filter(v=>{
      const s = String(v).trim().replace(/,/g,"");
      return s!=="" && !isNaN(Number(s)) && isFinite(Number(s));
    });
    if(numVals.length === sample.length) return "number";

    // Date
    const dateVals = sample.filter(v=>{
      const s = String(v).trim();
      if(!s) return false;
      // Require a date-like pattern to avoid parsing random numbers
      if(!/[\-\/\.]/.test(s) && !/^\d{4}$/.test(s)) return false;
      const t = Date.parse(s);
      return !isNaN(t) && /\d{4}/.test(s);
    });
    if(dateVals.length === sample.length && sample.length>0) return "date";

    // Categorical: low cardinality relative to row count
    const unique = new Set(sample.map(v=>String(v).trim()));
    if(unique.size <= Math.max(2, Math.floor(sample.length*0.2)) && unique.size <= 30){
      return "categorical";
    }

    return "text";
  }

  function detectColumns(rows){
    if(!rows || rows.length===0) return [];
    const keys = Object.keys(rows[0]);
    return keys.map(k=>{
      const values = rows.slice(0,500).map(r=>r[k]);
      return { field:k, title:k, type:detectColumnType(values) };
    });
  }

  function toNumber(v){
    if(v===null||v===undefined) return NaN;
    const s = String(v).trim().replace(/,/g,"");
    if(s==="") return NaN;
    const n = Number(s);
    return isFinite(n) ? n : NaN;
  }

  function toDate(v){
    if(v===null||v===undefined) return null;
    const s = String(v).trim();
    if(s==="") return null;
    const t = Date.parse(s);
    return isNaN(t) ? null : new Date(t);
  }

  function uid(prefix){
    return (prefix||"id") + "_" + Math.random().toString(36).slice(2,10) + Date.now().toString(36);
  }

  /* Download helper */
  function download(filename, content, mime){
    const blob = new Blob([content], {type:mime||"text/plain;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
  }

  /* localStorage safe helpers */
  function lsGet(key, fallback){
    try{
      const v = localStorage.getItem(key);
      return v===null ? fallback : JSON.parse(v);
    }catch(e){ return fallback; }
  }
  function lsSet(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  /* Escape a value for CSV */
  function csvCell(v){
    if(v===null||v===undefined) return "";
    const s = String(v);
    if(/[",\n\r]/.test(s)) return '"' + s.replace(/"/g,'""') + '"';
    return s;
  }

  function toCSV(rows, columns){
    if(!rows || rows.length===0){
      return columns && columns.length ? columns.join(",") + "\n" : "";
    }
    const cols = columns && columns.length ? columns : Object.keys(rows[0]);
    const lines = [cols.map(csvCell).join(",")];
    rows.forEach(r=>{
      lines.push(cols.map(c=>csvCell(r[c])).join(","));
    });
    return lines.join("\n");
  }

  /* Convert a raw value to a printable string */
  function valueToString(v){
    if(v===null||v===undefined) return "";
    if(v instanceof Date) return formatDateTime(v);
    return String(v);
  }

  return {
    debounce, escapeHtml, formatNumber, formatDateTime, todayStamp,
    detectColumnType, detectColumns, toNumber, toDate, uid,
    download, lsGet, lsSet, csvCell, toCSV, valueToString
  };
})();