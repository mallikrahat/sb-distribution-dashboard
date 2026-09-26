/* ============================================================
   App — bootstrap, navigation, status, toasts
   ============================================================ */
window.App = (function(){

  const cfg = window.REPORT_CONFIG;
  let currentReport = "dashboard";

  /* ---------- Navigation ---------- */
  function buildNav(){
    const nav = document.getElementById("navMenu");
    nav.innerHTML = cfg.reports.filter(r=>r.enabled).map(r=>`
      <button class="nav-item" data-report="${r.id}">
        <span class="nav-icon">${r.icon||"▤"}</span>
        <span>${Utils.escapeHtml(r.title)}</span>
      </button>
    `).join("");
    nav.querySelectorAll(".nav-item").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        navigate(btn.dataset.report);
      });
    });
  }

  function setActiveNav(id){
    document.querySelectorAll(".nav-item").forEach(b=>{
      b.classList.toggle("active", b.dataset.report === id);
    });
  }

  function navigate(id, force){
    if(!id) id = "dashboard";
    if(!force && id === currentReport && document.getElementById("mainContent").children.length) return;
    currentReport = id;

    // close mobile sidebar
    document.getElementById("sidebar").classList.remove("open");

    const report = cfg.reports.find(r=>r.id===id);
    const title = report ? report.title : id;

    // breadcrumbs
    document.getElementById("breadcrumbs").innerHTML =
      `<strong>${Utils.escapeHtml(cfg.companyName)}</strong> / ${Utils.escapeHtml(title)}`;

    setActiveNav(id);

    const main = document.getElementById("mainContent");
    main.innerHTML = "";
    try{
      Reports.render(id, main);
    }catch(err){
      main.innerHTML = `<div class="state-error"><h4>Report Error</h4><div>${Utils.escapeHtml(err.message)}</div></div>`;
      console.error(err);
    }
    window.scrollTo({top:0, behavior:"instant"});
  }

  /* ---------- Toasts ---------- */
  function toast(msg, type){
    const host = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = "toast " + (type||"");
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=>{
      el.style.transition = "opacity .3s ease, transform .3s ease";
      el.style.opacity = "0";
      el.style.transform = "translateX(20px)";
      setTimeout(()=>el.remove(), 300);
    }, 3200);
  }

  /* ---------- Global status ---------- */
  function updateGlobalStatus(){
    const ids = Object.keys(DataSource.state);
    const statuses = ids.map(id=>DataSource.get(id).status);
    const pill = document.getElementById("globalStatus");
    let status = "No Data";
    if(statuses.some(s=>s==="Loading")) status = "Loading";
    else if(statuses.some(s=>s==="Connection Error")) status = "Connection Error";
    else if(statuses.some(s=>s==="Live")) status = "Live";
    else if(statuses.some(s=>s==="Local File")) status = "Local File";
    else if(statuses.every(s=>s==="Not Configured")) status = "Not Configured";

    pill.className = "status-pill " + ({
      "Live":"status-live",
      "Loading":"status-loading",
      "Connection Error":"status-error",
      "No Data":"status-nodata",
      "Local File":"status-local",
      "Not Configured":"status-notconfig"
    })[status];
    pill.textContent = "● " + status;
  }

  /* Source event handlers */
  function onSourceStatusChange(){ updateGlobalStatus(); }
  function onSourceUpdated(id){
    updateGlobalStatus();
    // If we're viewing a source report, re-render
    if(currentReport === id || (currentReport==="db"&&id==="db") || (currentReport==="spo"&&id==="spo")){
      // handled by explicit re-render below
    }
    if(["dashboard","sources"].includes(currentReport)){
      navigate(currentReport, true);
    }
  }
  function onSourceError(id, msg){
    updateGlobalStatus();
    toast(`Error loading ${id}: ${msg.split("\n")[0]}`, "error");
    if(["dashboard","sources"].includes(currentReport)){
      navigate(currentReport, true);
    }
  }

  /* ---------- Refresh all ---------- */
  async function refreshAll(){
    toast("Refreshing all sources…", "");
    document.getElementById("refreshAllBtn").disabled = true;
    try{
      await DataSource.refreshAll();
      toast("All sources refreshed", "success");
    }catch(e){
      toast("Refresh encountered errors", "error");
    }finally{
      document.getElementById("refreshAllBtn").disabled = false;
      navigate(currentReport, true);
    }
  }

  /* ---------- Bootstrap ---------- */
  async function boot(){
    // Brand
    document.getElementById("brandTitle").textContent = cfg.companyName;
    document.getElementById("brandSub").textContent = cfg.appTitle;
    document.getElementById("appVersion").textContent = "v" + cfg.version;
    document.title = cfg.companyName + " — " + cfg.appTitle;

    // Nav
    buildNav();

    // Menu toggle (mobile)
    document.getElementById("menuToggle").addEventListener("click", ()=>{
      document.getElementById("sidebar").classList.toggle("open");
    });

    // Refresh button
    document.getElementById("refreshAllBtn").addEventListener("click", refreshAll);

    // Initial dashboard paint (loading state)
    navigate("dashboard", true);

    // Load data
    await DataSource.bootstrap();

    // Update status and re-render current page
    updateGlobalStatus();
    navigate(currentReport, true);
  }

  document.addEventListener("DOMContentLoaded", boot);

  return {
    navigate, toast, refreshAll, updateGlobalStatus,
    onSourceStatusChange, onSourceUpdated, onSourceError
  };
})();