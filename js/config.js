/* ============================================================
   REPORT HUB — Central Configuration
   Edit this file to configure the application without touching
   application logic.
   ============================================================ */

window.REPORT_CONFIG = {
  companyName: "REPORT HUB",
  appTitle: "Live Business Reporting",
  version: "1.0.0",

  /* Default page sizes offered in dropdowns */
  pageSizes: [10, 20, 25, 50, 100, 250, 500, "All"],

  /* Sources. localFile is used on first load. url/gid can override. */
  sources: {
    db: {
      id: "db",
      title: "DB",
      localFile: "data/db.csv",
      url: "",
      gid: ""
    },
    spo: {
      id: "spo",
      title: "SPO",
      localFile: "data/spo.csv",
      url: "",
      gid: ""
    },
    marketHierarchy: {
      id: "marketHierarchy",
      title: "Market Hierarchy",
      localFile: "data/market-hierarchy.csv",
      url: "",
      gid: ""
    }
  },

  /* Reports / Navigation. Icon is a single unicode glyph. */
  reports: [
    { id:"dashboard",       title:"Dashboard",          icon:"▦", enabled:true },
    { id:"sources",         title:"Data Sources",       icon:"⇧", enabled:true },
    { id:"db",              title:"DB Report",          icon:"▤", enabled:true, source:"db" },
    { id:"spo",             title:"SPO Report",         icon:"▤", enabled:true, source:"spo" },
    { id:"marketHierarchy", title:"Market Hierarchy",   icon:"⌘", enabled:true, source:"marketHierarchy" },
    { id:"summary",         title:"Summary",            icon:"◫", enabled:true },
    { id:"quality",         title:"Data Quality",       icon:"✓", enabled:true },
    { id:"comparison",      title:"Comparison",         icon:"⇄", enabled:true },
    { id:"matching",        title:"DB ↔ SPO Matching",  icon:"↔", enabled:true },
    { id:"export",          title:"Export Center",      icon:"⇩", enabled:true },
    { id:"settings",        title:"Settings",           icon:"⚙", enabled:true }
  ],

  /* Default hidden columns per source (case-insensitive column names) */
  defaultHiddenColumns: {
    db: [],
    spo: [],
    marketHierarchy: []
  },

  /* Default matching fields for DB ↔ SPO (optional pre-selection) */
  defaultMatching: {
    dbField: "",
    spoField: "",
    mode: "caseInsensitive"
  }
};