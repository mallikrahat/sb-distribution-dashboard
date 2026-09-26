/* ============================================================
   Charts — Chart.js wrappers
   ============================================================ */
window.Charts = (function(){

  const store = {};

  function destroy(id){
    if(store[id]){ try{ store[id].destroy(); }catch(e){} delete store[id]; }
  }

  function make(id, canvas, type, data, options){
    destroy(id);
    const ctx = canvas.getContext("2d");
    const cfg = {
      type,
      data,
      options: Object.assign({
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{ position:"bottom", labels:{ boxWidth:12, font:{size:12} } }
        },
        scales: (type==="doughnut"||type==="pie") ? {} : {
          y:{ beginAtZero:true, grid:{ color:"#f1f5f9" }, ticks:{ font:{size:11} } },
          x:{ grid:{ display:false }, ticks:{ font:{size:11} } }
        }
      }, options||{})
    };
    store[id] = new Chart(ctx, cfg);
    return store[id];
  }

  function bar(id, canvas, labels, values, label){
    return make(id, canvas, "bar", {
      labels,
      datasets:[{
        label: label || "Count",
        data: values,
        backgroundColor:"#2563eb",
        borderRadius:4
      }]
    });
  }

  function horizontalBar(id, canvas, labels, values, label){
    return make(id, canvas, "bar", {
      labels,
      datasets:[{
        label: label || "Count",
        data: values,
        backgroundColor:"#2563eb",
        borderRadius:4
      }]
    }, { indexAxis:"y" });
  }

  function doughnut(id, canvas, labels, values){
    const palette = ["#2563eb","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#db2777","#65a30d","#ea580c","#475569"];
    return make(id, canvas, "doughnut", {
      labels,
      datasets:[{
        data: values,
        backgroundColor: labels.map((_,i)=>palette[i%palette.length]),
        borderWidth:1,
        borderColor:"#fff"
      }]
    });
  }

  function line(id, canvas, labels, values, label){
    return make(id, canvas, "line", {
      labels,
      datasets:[{
        label: label || "Value",
        data: values,
        borderColor:"#2563eb",
        backgroundColor:"rgba(37,99,235,.12)",
        fill:true,
        tension:.25,
        pointRadius:3
      }]
    });
  }

  return { make, bar, horizontalBar, doughnut, line, destroy };
})();