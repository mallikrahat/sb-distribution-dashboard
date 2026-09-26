# \# REPORT HUB — Complete User \& Setup Guide

# 

# \---

# 

# \## Table of Contents

# 

# 1\. \[Introduction](#1-introduction)

# 2\. \[What You Get](#2-what-you-get)

# 3\. \[Requirements](#3-requirements)

# 4\. \[Getting the Project](#4-getting-the-project)

# 5\. \[Project Structure](#5-project-structure)

# 6\. \[Running the App Locally](#6-running-the-app-locally)

# 7\. \[Deploying to GitHub Pages](#7-deploying-to-github-pages)

# 8\. \[First Launch — What to Expect](#8-first-launch--what-to-expect)

# 9\. \[Loading Your Own Data](#9-loading-your-own-data)

# 10\. \[Using the Data Sources Page](#10-using-the-data-sources-page)

# 11\. \[Google Sheets Setup](#11-google-sheets-setup)

# 12\. \[Google Drive Setup](#12-google-drive-setup)

# 13\. \[Using the Dashboard](#13-using-the-dashboard)

# 14\. \[Using DB, SPO, and Market Hierarchy Reports](#14-using-db-spo-and-market-hierarchy-reports)

# 15\. \[Searching, Filtering, and Sorting](#15-searching-filtering-and-sorting)

# 16\. \[Choosing Table Columns](#16-choosing-table-columns)

# 17\. \[Using Advanced Filters](#17-using-advanced-filters)

# 18\. \[Switching Between Views](#18-switching-between-views)

# 19\. \[Using the Summary Page](#19-using-the-summary-page)

# 20\. \[Using the Data Quality Page](#20-using-the-data-quality-page)

# 21\. \[Using the Comparison Page](#21-using-the-comparison-page)

# 22\. \[Using DB ↔ SPO Matching](#22-using-db--spo-matching)

# 23\. \[Using the Export Center](#23-using-the-export-center)

# 24\. \[Refreshing Data](#24-refreshing-data)

# 25\. \[Understanding Status Indicators](#25-understanding-status-indicators)

# 26\. \[Changing Branding and Configuration](#26-changing-branding-and-configuration)

# 27\. \[Adding a New Data Source](#27-adding-a-new-data-source)

# 28\. \[Troubleshooting](#28-troubleshooting)

# 29\. \[Security Rules](#29-security-rules)

# 30\. \[Data Rules](#30-data-rules)

# 31\. \[Frequently Asked Questions](#31-frequently-asked-questions)

# 32\. \[Glossary](#32-glossary)

# 

# \---

# 

# \## 1. Introduction

# 

# \*\*REPORT HUB\*\* is a professional, browser-based business reporting application. It runs entirely inside the user's browser, requires no backend, no database, no installation, and no build step. It can be deployed to GitHub Pages in minutes and then accessed from any device with an internet connection.

# 

# The application is designed for internal BI and operations use. It loads real data from local CSV files, Google Sheets, Google Drive, or any publicly accessible CSV/XLSX URL, and provides search, filtering, sorting, pagination, column management, summaries, quality checks, comparisons, DB ↔ SPO matching, and export — all in one unified interface.

# 

# \*\*Key principle:\*\* The application never invents data. Every number, chart, and summary is derived strictly from the actual loaded source files.

# 

# \---

# 

# \## 2. What You Get

# 

# \- A single-page application with 11 pages:

# &#x20; - Dashboard

# &#x20; - Data Sources

# &#x20; - DB Report

# &#x20; - SPO Report

# &#x20; - Market Hierarchy

# &#x20; - Summary

# &#x20; - Data Quality

# &#x20; - Comparison

# &#x20; - DB ↔ SPO Matching

# &#x20; - Export Center

# &#x20; - Settings

# \- Independent configuration for each data source.

# \- Support for CSV, XLSX, XLS, Google Sheets, and Google Drive.

# \- Automatic column and type detection.

# \- Full-featured data grid (search, filter, sort, paginate, resize, reorder, hide columns).

# \- Charts for numeric, categorical, and time-based data.

# \- Export to CSV, Excel, JSON, and Print.

# \- Responsive design for desktop, tablet, and mobile.

# \- A professional corporate dashboard design.

# 

# \---

# 

# \## 3. Requirements

# 

# \- A modern web browser (Chrome, Edge, Firefox, or Safari — recent versions).

# \- Any one of these for hosting:

# &#x20; - GitHub account (for GitHub Pages), or

# &#x20; - A static file server (Nginx, Apache, S3, Cloudflare Pages, Netlify, Vercel), or

# &#x20; - A local web server such as Python's `http.server` for testing.

# \- No Node.js, PHP, Python server, database, or backend is required.

# 

# \---

# 

# \## 4. Getting the Project

# 

# You have two options:

# 

# \*\*Option A — Download from GitHub\*\*

# 

# 1\. Open the repository page in your browser.

# 2\. Click \*\*Code → Download ZIP\*\*.

# 3\. Extract the ZIP into a folder on your computer.

# 

# \*\*Option B — Clone with Git\*\*

# 

# ```

# git clone https://github.com/<your-username>/<your-repo>.git

# ```

# 

# This creates a folder containing the entire project.

# 

# \---

# 

# \## 5. Project Structure

# 

# ```

# report-hub/

# ├── index.html                  Entry point

# ├── README.md                   Short repo overview

# ├── LICENSE                     MIT license

# ├── css/

# │   └── report-hub.css          Application styles

# ├── js/

# │   ├── config.js               Central configuration

# │   ├── utils.js                Shared helpers

# │   ├── data-source-engine.js   Data loading engine

# │   ├── datatable.js            Data grid wrapper

# │   ├── charts.js               Chart wrappers

# │   ├── reports.js              Page renderers

# │   └── app.js                  Bootstrap and navigation

# ├── data/

# │   ├── db.csv                  DB source (placeholder headers)

# │   ├── spo.csv                 SPO source (placeholder headers)

# │   └── market-hierarchy.csv    Market Hierarchy (placeholder headers)

# └── docs/

# &#x20;   ├── ARCHITECTURE.md

# &#x20;   ├── CONFIGURATION.md

# &#x20;   ├── DATA-SOURCES.md

# &#x20;   ├── DEPLOYMENT.md

# &#x20;   ├── SECURITY.md

# &#x20;   ├── TROUBLESHOOTING.md

# &#x20;   └── CHANGELOG.md

# ```

# 

# \---

# 

# \## 6. Running the App Locally

# 

# Browsers block `fetch()` on `file://` URLs. You must serve the folder over HTTP.

# 

# \*\*Using Python 3\*\*

# 

# ```

# cd report-hub

# python -m http.server 8000

# ```

# 

# \*\*Using Node.js\*\*

# 

# ```

# cd report-hub

# npx serve .

# ```

# 

# \*\*Using PHP\*\*

# 

# ```

# cd report-hub

# php -S localhost:8000

# ```

# 

# Then open `http://localhost:8000` in your browser.

# 

# \---

# 

# \## 7. Deploying to GitHub Pages

# 

# 1\. Create a new repository on GitHub (public or private — Pages on private repos requires a paid plan).

# 2\. From your project folder:

# 

# &#x20;  ```

# &#x20;  git init

# &#x20;  git add .

# &#x20;  git commit -m "Initial commit"

# &#x20;  git branch -M main

# &#x20;  git remote add origin https://github.com/<your-username>/<your-repo>.git

# &#x20;  git push -u origin main

# &#x20;  ```

# 

# 3\. On GitHub, go to \*\*Settings → Pages\*\*.

# 4\. Set \*\*Source\*\* to \*\*Deploy from a branch\*\*.

# 5\. Set \*\*Branch\*\* to `main` and folder to `/ (root)`.

# 6\. Click \*\*Save\*\*.

# 

# Your app will be live at:

# 

# ```

# https://<your-username>.github.io/<your-repo>/

# ```

# 

# Every subsequent push to `main` automatically redeploys.

# 

# \---

# 

# \## 8. First Launch — What to Expect

# 

# On first load, the app:

# 

# 1\. Loads the three placeholder files in `data/` (or your real files if you already replaced them).

# 2\. Displays the \*\*Dashboard\*\* with KPI cards, a source status table, and charts.

# 3\. Populates the sidebar with all enabled reports.

# 

# If your files contain only header rows, the dashboard will show zero records for each source. That is expected — replace the placeholder files with real data (see the next section) or import files via the Data Sources page.

# 

# \---

# 

# \## 9. Loading Your Own Data

# 

# You have four ways to supply data to any source.

# 

# \### Method 1 — Replace the bundled files

# 

# Put your real CSVs at:

# 

# ```

# data/db.csv

# data/spo.csv

# data/market-hierarchy.csv

# ```

# 

# Then click \*\*Refresh All Data\*\* in the top bar, or reload the page.

# 

# The only requirement is that the first row contains column headers. The app detects everything else automatically.

# 

# \### Method 2 — Import a file at runtime

# 

# 1\. Open \*\*Data Sources\*\*.

# 2\. On any source card, click \*\*Choose File\*\*.

# 3\. Select a `.csv`, `.xlsx`, or `.xls` file.

# 4\. Click \*\*Import File\*\*.

# 

# The imported data replaces that source's data immediately. It is held in memory only; reloading the page reverts to the configured source.

# 

# \### Method 3 — Google Sheets

# 

# See \[Section 11](#11-google-sheets-setup).

# 

# \### Method 4 — Google Drive

# 

# See \[Section 12](#12-google-drive-setup).

# 

# You can mix methods freely. For example:

# 

# | Source | Method |

# |---|---|

# | DB | Local file |

# | SPO | Google Sheet |

# | Market Hierarchy | Google Drive link |

# 

# \---

# 

# \## 10. Using the Data Sources Page

# 

# The \*\*Data Sources\*\* page contains one card per configured source. Each card shows:

# 

# \- \*\*Source Name\*\*

# \- \*\*Current Status\*\* (Live, Local File, Connection Error, No Data, Not Configured)

# \- \*\*Method\*\* (Local File, Imported File, Google / URL)

# \- \*\*Records\*\* (row count)

# \- \*\*Last Updated\*\* (timestamp)

# \- \*\*Source Reference\*\* (filename or URL)

# 

# Controls on each card:

# 

# | Control | Purpose |

# |---|---|

# | \*\*Choose File\*\* | Pick a local CSV/XLSX file to import |

# | \*\*Import File\*\* | Load the chosen file into this source |

# | \*\*URL input\*\* | Paste a Google Sheets / Drive / CSV URL |

# | \*\*Load Google/Drive Link\*\* | Fetch and load the URL |

# | \*\*Refresh\*\* | Re-fetch the current source |

# | \*\*Reload Local\*\* | Reload from the configured `localFile` |

# 

# Every control performs a real action. Nothing on this page is decorative.

# 

# \---

# 

# \## 11. Google Sheets Setup

# 

# 1\. Open your Google Sheet.

# 2\. Click \*\*Share\*\*.

# 3\. Set access to \*\*Anyone with the link → Viewer\*\*.

# 4\. Copy the URL. It will look like:

# 

# &#x20;  ```

# &#x20;  https://docs.google.com/spreadsheets/d/FILE\_ID/edit#gid=123456

# &#x20;  ```

# 

# 5\. Paste it into the \*\*URL input\*\* on the relevant source card.

# 6\. Click \*\*Load Google/Drive Link\*\*.

# 

# The app automatically converts your URL to a CSV export URL:

# 

# ```

# https://docs.google.com/spreadsheets/d/FILE\_ID/export?format=csv\&gid=123456

# ```

# 

# \*\*Important:\*\* The sheet must be publicly readable. Private sheets cannot be read by a browser without a proxy.

# 

# \### Finding the GID

# 

# The \*\*GID\*\* is the numeric tab ID. Look at the URL after `#gid=`. If you omit it, the first tab is used.

# 

# \### If the load fails

# 

# You will see a \*\*Connection Error\*\* listing possible causes:

# 

# \- The sheet is not publicly readable.

# \- The URL is incorrect.

# \- The GID is incorrect.

# \- Browser/CORS access is blocked.

# 

# The app never pretends a private sheet loaded successfully.

# 

# \---

# 

# \## 12. Google Drive Setup

# 

# 1\. Right-click the file in Google Drive → \*\*Share\*\*.

# 2\. Set access to \*\*Anyone with the link → Viewer\*\*.

# 3\. Copy the link. It will look like:

# 

# &#x20;  ```

# &#x20;  https://drive.google.com/file/d/FILE\_ID/view

# &#x20;  ```

# 

# 4\. Paste it into the \*\*URL input\*\* on the relevant source card.

# 5\. Click \*\*Load Google/Drive Link\*\*.

# 

# The app converts it to:

# 

# ```

# https://drive.google.com/uc?export=download\&id=FILE\_ID

# ```

# 

# Only publicly shared files can be loaded.

# 

# \---

# 

# \## 13. Using the Dashboard

# 

# The Dashboard is the executive overview. It shows:

# 

# \- \*\*KPI cards\*\* for:

# &#x20; - Total Records

# &#x20; - DB Records

# &#x20; - SPO Records

# &#x20; - Market Hierarchy Records

# &#x20; - Missing Values

# &#x20; - Duplicate Records

# &#x20; - Last Refresh

# &#x20; - Sources Online

# \- A \*\*Source Status\*\* table listing every source with its status, record count, method, source reference, and last updated timestamp.

# \- Two charts:

# &#x20; - \*\*Records per Source\*\* (doughnut)

# &#x20; - \*\*Loaded Records Overview\*\* (bar)

# 

# KPI values only appear when the underlying data exists. Empty sources show zero and are clearly marked as "No Data."

# 

# The \*\*Refresh All Data\*\* button in the top bar re-fetches every source without reloading the page.

# 

# \---

# 

# \## 14. Using DB, SPO, and Market Hierarchy Reports

# 

# Each of these reports uses the same unified interface.

# 

# At the top of the report:

# 

# 1\. \*\*Search input\*\* — free-text search across all records.

# 2\. \*\*Field selector\*\* — limit the search to one column.

# 3\. \*\*Match type\*\* — Contains, Starts with, Exact, All words.

# 4\. \*\*Sort mode\*\* — Relevance, Source, A–Z.

# 5\. \*\*Page size\*\* — 10, 20, 25, 50, 100, 250, 500, All.

# 6\. \*\*Density\*\* — Normal spacing or Dense rows.

# 7\. \*\*Choose Table Columns\*\* — open the column manager.

# 8\. \*\*Advanced Filters\*\* — open the multi-condition filter builder.

# 9\. \*\*Clear\*\* — reset the search input.

# 

# Below the toolbar:

# 

# \- A \*\*view switcher\*\* (Cards, Table, Compact, Source Split).

# \- A \*\*record count\*\* indicator.

# \- An \*\*Export CSV\*\* button for the current filtered view.

# 

# All columns are detected automatically from your data. No column is ever renamed or fabricated.

# 

# \---

# 

# \## 15. Searching, Filtering, and Sorting

# 

# \### Searching

# 

# Type into the \*\*Search\*\* box. Results update as you type (debounced). The search runs across every field unless you scope it to a specific column using the \*\*Field\*\* selector.

# 

# Match modes:

# 

# \- \*\*Contains keyword\*\* — any field that contains the text.

# \- \*\*Starts with\*\* — any field that begins with the text.

# \- \*\*Exact match\*\* — any field that equals the text exactly.

# \- \*\*All words\*\* — any field that contains every word in the query (in any order).

# 

# \### Relevance

# 

# When \*\*Sort: Relevance\*\* is selected, results are ranked by how closely they match:

# 

# \- Exact match of a field → highest score.

# \- Field starts with the query → high score.

# \- Field contains the query → normal score.

# 

# Scores are computed from the actual matched fields. There is no artificial or decorative relevance data.

# 

# \### Column Filters

# 

# In the table view, each column header offers a filter. The filter type is chosen automatically based on the detected column type:

# 

# \- \*\*Text\*\* — contains / starts with / exact.

# \- \*\*Number\*\* — =, >, <, ≥, ≤, between.

# \- \*\*Date\*\* — before / after / between.

# \- \*\*Categorical\*\* — dropdown / multiselect.

# 

# \### Sorting

# 

# \- Click a column header to sort ascending.

# \- Click again to sort descending.

# \- Hold \*\*Shift\*\* and click additional headers for multi-column sort.

# 

# Sorting and filters persist while you remain in the session.

# 

# \---

# 

# \## 16. Choosing Table Columns

# 

# Click \*\*Choose Table Columns\*\* to open the column manager.

# 

# In the manager you can:

# 

# \- \*\*Show or hide\*\* any column using the checkbox.

# \- \*\*Reorder\*\* columns by dragging the row.

# \- \*\*Restore Default\*\* to reset to the original order and visibility.

# 

# Changes apply to the current view and remain active until you reload the page.

# 

# \---

# 

# \## 17. Using Advanced Filters

# 

# Click \*\*Advanced Filters\*\* to open the multi-condition filter builder.

# 

# Each condition has:

# 

# \- A \*\*field\*\* selector (populated from your actual columns).

# \- An \*\*operator\*\* (=, ≠, >, <, ≥, ≤, contains, is empty).

# \- A \*\*value\*\* input.

# 

# Add as many conditions as you need. Conditions are joined with \*\*AND\*\*.

# 

# Buttons:

# 

# \- \*\*+ Add Condition\*\* — add another row.

# \- \*\*Clear All Filters\*\* — remove every condition.

# \- \*\*Apply Filters\*\* — apply and close.

# 

# Only fields that exist in your data appear in the field selector.

# 

# \---

# 

# \## 18. Switching Between Views

# 

# Use the view switcher at the top of the results area:

# 

# | View | Description |

# |---|---|

# | \*\*Cards\*\* | One card per record showing the first several fields. |

# | \*\*Table\*\* | Full data grid with sort, filter, resize, reorder, pagination. |

# | \*\*Compact\*\* | Dense list showing a subset of columns — useful for scanning many rows. |

# | \*\*Source Split\*\* | Records grouped by source (useful when comparing DB and SPO). |

# 

# Switching views preserves your search, filters, and column configuration.

# 

# \---

# 

# \## 19. Using the Summary Page

# 

# The Summary page analyzes each loaded source automatically and shows:

# 

# \- Total records, columns, numeric columns, categorical columns.

# \- A numeric summary table: count, sum, average, min, max per numeric column.

# \- Bar charts for the top values of up to four categorical columns.

# \- A line chart of records over time if a date column is present.

# 

# Only summaries for which the underlying field exists are shown. The page never invents business meaning.

# 

# \---

# 

# \## 20. Using the Data Quality Page

# 

# The Data Quality page reports on each loaded source:

# 

# \- \*\*Total Records\*\*

# \- \*\*Records With Missing Data\*\*

# \- \*\*Duplicate Records\*\*

# \- \*\*Potential Data Errors\*\* (invalid numbers, invalid dates)

# 

# Plus a per-column table:

# 

# | Column | Total | Missing Count | Missing % | Unique Count |

# |---|---|---|---|---|

# 

# Missing values are counted where the cell is empty or whitespace. Duplicates are detected as rows identical across all columns.

# 

# \---

# 

# \## 21. Using the Comparison Page

# 

# The Comparison page groups records by any available field and computes a metric.

# 

# Controls:

# 

# \- \*\*Source\*\* — choose DB, SPO, or Market Hierarchy.

# \- \*\*Compare By\*\* — choose a field to group by.

# \- \*\*Metric\*\* — Record Count, Unique Count, Sum, Average, Minimum, Maximum.

# \- \*\*Compare\*\* — run the analysis.

# 

# Metrics are filtered to those that make sense for the selected field's type. Numeric metrics (sum, average, min, max) appear only when the field is numeric.

# 

# Results are shown as a bar chart and a table.

# 

# \---

# 

# \## 22. Using DB ↔ SPO Matching

# 

# The Matching page compares records between the DB and SPO sources.

# 

# Controls:

# 

# \- \*\*DB Field\*\* — the field in the DB dataset to match on.

# \- \*\*SPO Field\*\* — the field in the SPO dataset to match on.

# \- \*\*Mode\*\*:

# &#x20; - Exact

# &#x20; - Case insensitive

# &#x20; - Trim whitespace

# &#x20; - Case insensitive + Trim

# \- \*\*Match\*\* — run the comparison.

# 

# Results:

# 

# \- \*\*KPI cards\*\*: DB Records, SPO Records, Matched, Only in DB, Only in SPO, Potential Duplicates.

# \- Two charts: a doughnut of the classification, and a bar chart of totals.

# 

# A record is considered \*\*matched\*\* if its key exists in both datasets after normalization. Keys are normalized according to the selected mode.

# 

# \---

# 

# \## 23. Using the Export Center

# 

# The Export Center lets you export any loaded dataset.

# 

# Controls:

# 

# \- \*\*Report\*\* — which source to export.

# \- \*\*Export\*\* — All Records or Filtered Records.

# \- \*\*Format\*\* — CSV, Excel, JSON, Print.

# 

# Click \*\*Export\*\* to download the file.

# 

# Filenames follow this pattern:

# 

# ```

# <Source>\_Report\_YYYY-MM-DD.<ext>

# ```

# 

# Examples:

# 

# ```

# DB\_Report\_2025-01-15.xlsx

# SPO\_Report\_2025-01-15.csv

# ```

# 

# The \*\*Print\*\* option opens a new window with a printable table (first 2,000 rows).

# 

# \---

# 

# \## 24. Refreshing Data

# 

# There are two ways to refresh:

# 

# \- \*\*Refresh All Data\*\* — the button in the top bar. Re-fetches every source.

# \- \*\*Refresh\*\* — the button on each Data Sources card. Re-fetches only that source.

# 

# Refreshing:

# 

# \- Fetches the latest data from the configured source.

# \- Replaces the current rows.

# \- Rebuilds column metadata if needed.

# \- Updates record counts, timestamps, and status.

# \- Preserves your interface settings where possible.

# 

# No page reload is required.

# 

# \---

# 

# \## 25. Understanding Status Indicators

# 

# Each source is always in exactly one state:

# 

# | Status | Meaning |

# |---|---|

# | \*\*Live\*\* | Successfully loaded from a URL |

# | \*\*Loading\*\* | Fetch or parse in progress |

# | \*\*Local File\*\* | Loaded from a bundled or imported file |

# | \*\*Connection Error\*\* | Fetch or parse failed — see the error panel |

# | \*\*No Data\*\* | Loaded successfully but the dataset is empty |

# | \*\*Not Configured\*\* | No local file and no URL are set for this source |

# 

# The global status pill in the top bar reflects the highest-priority state across all sources.

# 

# \---

# 

# \## 26. Changing Branding and Configuration

# 

# All configuration lives in \*\*`js/config.js`\*\*. Open it in any text editor.

# 

# Change the company name and app title:

# 

# ```js

# companyName: "Acme Corp",

# appTitle: "Operations Reporting Hub",

# version: "2.1.0"

# ```

# 

# Change default page sizes:

# 

# ```js

# pageSizes: \[25, 50, 100, 500, "All"]

# ```

# 

# Change which columns are hidden by default per source:

# 

# ```js

# defaultHiddenColumns: {

# &#x20; db: \["internal\_notes"],

# &#x20; spo: \[],

# &#x20; marketHierarchy: \[]

# }

# ```

# 

# Change which reports appear in the sidebar:

# 

# ```js

# reports: \[

# &#x20; { id:"dashboard", title:"Dashboard", icon:"▦", enabled:true },

# &#x20; ...

# ]

# ```

# 

# Set to `enabled: false` to hide a report from the sidebar.

# 

# Save the file and reload the page to see the changes.

# 

# \---

# 

# \## 27. Adding a New Data Source

# 

# To add a new source (for example, Inventory):

# 

# 1\. Open `js/config.js`.

# 2\. Add a source under `sources`:

# 

# &#x20;  ```js

# &#x20;  inventory: {

# &#x20;    id: "inventory",

# &#x20;    title: "Inventory",

# &#x20;    localFile: "data/inventory.csv",

# &#x20;    url: "",

# &#x20;    gid: ""

# &#x20;  }

# &#x20;  ```

# 

# 3\. Add a report under `reports`:

# 

# &#x20;  ```js

# &#x20;  { id:"inventory", title:"Inventory", icon:"▤", enabled:true, source:"inventory" }

# &#x20;  ```

# 

# 4\. (Optional) Create `data/inventory.csv` with your data.

# 

# 5\. Reload the page. The new source appears in the sidebar and on the Data Sources page automatically. No code changes are required.

# 

# \---

# 

# \## 28. Troubleshooting

# 

# \*\*The page is blank.\*\*

# Open the browser console (F12). Confirm you are serving over HTTP, not `file://`.

# 

# \*\*"No Data" everywhere.\*\*

# Your CSVs may contain only header rows. Replace them with real data or import a file via the Data Sources page.

# 

# \*\*"Connection Error" on a Google Sheet or Drive file.\*\*

# The file is not publicly shared. Set sharing to "Anyone with the link → Viewer."

# 

# \*\*"Connection Error" with a CORS message.\*\*

# The source does not send `Access-Control-Allow-Origin`. Options: host the file on the same origin, use Google Sheets, or set up a proxy (see the Security section).

# 

# \*\*Search returns nothing.\*\*

# Check the Match mode — "Exact" requires full-value matches. Also check the Field selector and clear any Advanced Filters.

# 

# \*\*Columns detected as text instead of number/date.\*\*

# A single non-numeric value in a numeric column causes a fallback to text. Clean the data, or accept the text treatment.

# 

# \*\*Export produces an empty file.\*\*

# The current filtered view has zero rows. Switch the Export Center scope to "All Records."

# 

# \*\*Charts are blank.\*\*

# The dataset has no numeric or categorical columns. Charts appear only when the underlying data supports them.

# 

# \*\*Sidebar is hidden on mobile.\*\*

# Tap the ☰ button in the top-left of the top bar.

# 

# \---

# 

# \## 29. Security Rules

# 

# \- Never commit passwords, API keys, service-account JSON, tokens, cookies, or any private credential to the repository.

# \- The frontend is public by design. Everything in `js/`, `css/`, `data/`, and `index.html` is visible to anyone with the URL.

# \- The app only reads publicly accessible URLs.

# \- For private data, use a Google Apps Script endpoint or a secure backend/API, and point the source URL at it.

# \- Do not attempt to bypass authentication.

# 

# \---

# 

# \## 30. Data Rules

# 

# \- The application never fabricates data.

# \- It never invents customers, products, prices, dates, statistics, fields, or business calculations.

# \- If a field is missing, it is displayed as empty or `N/A`.

# \- All numbers, charts, summaries, and matches come from the actual loaded source files.

# \- Column names are preserved exactly as they appear in the source.

# \- Column types are detected from the data, never assumed.

# 

# \---

# 

# \## 31. Frequently Asked Questions

# 

# \*\*Can I use this without GitHub?\*\*

# Yes. Any static file server will work. GitHub Pages is simply the easiest path.

# 

# \*\*Do I need a server or database?\*\*

# No. The app is fully client-side.

# 

# \*\*Can I load multiple Google Sheets at once?\*\*

# Yes. Each source can be configured independently.

# 

# \*\*Can I add more sources?\*\*

# Yes. Add them in `js/config.js`. No code changes required.

# 

# \*\*Can I use private Google Sheets?\*\*

# Not directly from a browser. You need a Google Apps Script or a secure backend proxy.

# 

# \*\*Is my data uploaded anywhere?\*\*

# No. Data is loaded into the browser and never transmitted to any server.

# 

# \*\*Does it work offline?\*\*

# The interface loads if cached, but data sources require network access.

# 

# \*\*Is my search history saved?\*\*

# No. Search, filters, and view settings persist only for the session. Non-sensitive UI preferences may be stored in `localStorage`.

# 

# \*\*Can I export to PDF?\*\*

# Use the \*\*Print\*\* option and select "Save as PDF" in your browser's print dialog.

# 

# \*\*Why is a numeric column shown as text?\*\*

# Because at least one value in the column could not be parsed as a number. Clean the source data.

# 

# \*\*How do I reset everything?\*\*

# Clear your browser's `localStorage` for the site, then reload.

# 

# \---

# 

# \## 32. Glossary

# 

# | Term | Meaning |

# |---|---|

# | \*\*Source\*\* | A dataset the app loads (DB, SPO, Market Hierarchy, or any added source) |

# | \*\*Report\*\* | A page in the app that displays or analyzes data |

# | \*\*GID\*\* | The numeric ID of a specific tab in a Google Sheet |

# | \*\*FILE\_ID\*\* | The unique ID in a Google Sheets or Drive URL |

# | \*\*Match mode\*\* | How a search query is compared against field values |

# | \*\*Relevance\*\* | A score computed from the actual matched fields |

# | \*\*Categorical\*\* | A column with a small number of distinct values |

# | \*\*Local File\*\* | A CSV/XLSX shipped in `data/` or imported by the user |

# | \*\*Live\*\* | Data loaded from a URL (Google Sheets, Drive, or direct) |

# | \*\*N/A\*\* | Shown when a value is genuinely unavailable — never invented |

# 

# \---

# 

# \*\*End of guide.\*\*

