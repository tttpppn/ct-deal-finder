# Graph Report - ct-deal-finder  (2026-10-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 67 nodes · 125 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 32,501 input · 1,608 output

## Graph Freshness
- Built from commit: `f2602e27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Deal Metrics
- Foreclosure Data Scraper
- Package Metadata
- Logging Infrastructure
- App Configuration
- Build Scripts
- External Dependencies
- Runtime Requirements

## God Nodes (most connected - your core abstractions)
1. `logger` - 9 edges
2. `main()` - 8 edges
3. `createAddressKey()` - 6 edges
4. `scripts` - 5 edges
5. `calculateDealMetrics()` - 4 edges
6. `exportToCSV()` - 4 edges
7. `consolidateProperties()` - 4 edges
8. `fetchBankREO()` - 4 edges
9. `scrapeWithFallback()` - 4 edges
10. `fetchForeclosureList()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `scrapeWithFallback()`  [EXTRACTED]
  index.js → scrapers/bankReo.js
- `main()` --calls--> `scrapeAllTowns()`  [EXTRACTED]
  index.js → scrapers/judicial.js
- `main()` --calls--> `calculateDealMetrics()`  [EXTRACTED]
  index.js → analysis/investmentScore.js
- `main()` --calls--> `rankDeals()`  [EXTRACTED]
  index.js → analysis/investmentScore.js
- `main()` --calls--> `getRentalComps()`  [EXTRACTED]
  index.js → scrapers/rentalComps.js

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "Deal Metrics"
Cohesion: 0.28
Nodes (10): calculateDealMetrics(), parsePrice(), rankDeals(), DEAL_CONFIG, main(), getRentalComps(), escapeCSV(), exportToCSV() (+2 more)

### Community 1 - "Foreclosure Data Scraper"
Cohesion: 0.29
Nodes (10): axios, fetchBankREO(), getMockBankREOData(), scrapeWithFallback(), fetchForeclosureList(), getMockForeclosureData(), scrapeAllTowns(), compareAddresses() (+2 more)

### Community 2 - "Package Metadata"
Cohesion: 0.18
Nodes (10): author, description, keywords, license, main, name, type, version (+2 more)

### Community 3 - "Logging Infrastructure"
Cohesion: 0.27
Nodes (5): formatTimestamp(), LEVELS, log(), LOG_FILE, logger

### Community 4 - "App Configuration"
Cohesion: 0.32
Nodes (6): BANK_REO_TIERS, CACHE_DIR, CT_JUDICIAL_BASE_URL, LOGS_DIR, REQUEST_CONFIG, TOWNS

### Community 5 - "Build Scripts"
Cohesion: 0.40
Nodes (5): scripts, scrape:all, scrape:banks, scrape:judicial, start

### Community 6 - "External Dependencies"
Cohesion: 0.50
Nodes (4): dependencies, axios, cheerio, marked

## Knowledge Gaps
- **22 isolated node(s):** `author`, `description`, `keywords`, `license`, `main` (+17 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 23 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `axios` connect `Foreclosure Data Scraper` to `Package Metadata`?**
  _High betweenness centrality (0.451) - this node is a cross-community bridge._
- **What connects `author`, `description`, `keywords` to the rest of the system?**
  _22 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `scripts` connect `Build Scripts` to `Package Metadata`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `dependencies` connect `External Dependencies` to `Package Metadata`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._