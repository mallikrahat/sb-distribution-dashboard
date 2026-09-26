/* ============================================================
   DataTable — Tabulator wrapper for professional data grids
   ============================================================ */
window.DataTable = (function(){

  const instances = {};

  function buildColumns(columns, options){
    options = options || {};
    const hidden = options.hidden || [];
    const order = options.order || null;
    let cols = columns.map(c=>{
      const col = {
        title: c.title || c.field,
        field: c.field,
        sorter: mapSorter(c.type),
        headerFilter: mapHeaderFilter(c.type),
        headerFilterPlaceholder: "",
        resizable: true,
        widthGrow: 1,
        minWidth: 90,
        formatter: cell => {
          const v = cell.getValue();
          if(v===null||v===undefined||v==="") return "";
          return String(v);
        }
      };
      if(c.type === "number"){
        col.hozAlign = "right";
        col.headerHozAlign = "right";
      }
      return col;
    });
    // Apply order if provided
    if(order && order.length){
      const map = {};
      cols.forEach(c=>map[c.field]=c);
      const ordered = [];
      order.forEach(f=>{ if(map[f]){ ordered.push(map[f]); delete map[f]; }});
      Object.values(map).forEach(c=>ordered.push(c));
      cols = ordered;
    }
    // Apply hidden
    const hiddenSet = new Set((hidden||[]).map(h=>String(h).toLowerCase()));
    cols.forEach(c=>{
      if(hiddenSet.has(String(c.field).toLowerCase())) c.visible = false;
    });
    return cols;
  }

  function mapSorter(type){
    switch(type){
      case "number": return "number";
      case "date": return "datetime";
      case "boolean": return "bool";
      default: return "string";
    }
  }

  function mapHeaderFilter(type){
    switch(type){
      case "number": return "input";
      case "date": return "input";
      case "categorical": return "list";
      default: return "input";
    }
  }

  function create(el, rows, columns, opts){
    opts = opts || {};
    const id = el.id || ("tbl_" + Utils.uid());
    if(!el.id) el.id = id;

    if(instances[id]){
      try{ instances[id].destroy(); }catch(e){}
      delete instances[id];
    }

    const tabCols = buildColumns(columns, opts);
    const pageSize = opts.pageSize === "All" ? rows.length : (opts.pageSize || 25);

    const table = new Tabulator(el, {
      data: rows,
      columns: tabCols,
      layout: "fitDataStretch",
      height: opts.height || "520px",
      pagination: opts.pagination !== false,
      paginationSize: pageSize,
      paginationSizeSelector: window.REPORT_CONFIG.pageSizes,
      paginationCounter: "rows",
      movableColumns: true,
      resizableColumns: true,
      virtualDom: true,
      virtualDomBuffer: 200,
      initialSort: opts.initialSort || [],
      placeholder: opts.placeholder || "No records to display",
      columnDefaults: { resizable:true, headerSort:true },
      ajaxURL: null
    });

    instances[id] = table;
    return table;
  }

  function get(id){ return instances[id]; }
  function destroy(id){
    if(instances[id]){ try{ instances[id].destroy(); }catch(e){} delete instances[id]; }
  }

  /* Column manager helpers */
  function visibleColumns(table){
    return table.getColumns().filter(c=>c.isVisible()).map(c=>c.getField());
  }
  function allColumns(table){
    return table.getColumns().map(c=>c.getField());
  }

  return { create, get, destroy, buildColumns, visibleColumns, allColumns, instances };
})();