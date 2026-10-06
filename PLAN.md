# Implementation Plan: CT Real Estate Deal Finder with Investment Analysis

**Target**: Build a private Node.js script that scrapes **CT Judicial foreclosures** + **bank REO listings** + **tax assessor data**, identifies properties 15% below market value, calculates investment-grade metrics, and exports tracked deals to `below_market_deals.md`.

**Complexity**: MEDIUM-HIGH | **Estimated Time**: 8-10 hours

---

## Data Sources (Verified)

| Source | URL/Priority | Purpose |
|---|---|---|
| **CT Judicial Foreclosures** | https://sso.eservices.jud.ct.gov/foreclosures/Public/PendPostbyTownList.aspx | Official foreclosure listings, court dates, status |
| **Bank REO Listings** (Prioritized CT Underwriters) | See section below | Bank-owned properties, often discounted |
| **CT Tax Assessor** | By town (web scrape or API) | Assessed values, property details |
| **Zillow / Redfin** (fallback) | Public scrape | Market value estimates, rental comparables |

---

## Bank REO Sources (Prioritized for CT)

**Tier 1: Major CT Underwriters (Prioritize)**
- Bank of America (BAC Realty) - largest presence
- Wells Fargo (Wells Fargo REO)
- Chase Home Finance
- HSBC (Northeast operations)
- Berkshire Bank (CT-based)
- People's Bank (CT regional)

**Tier 2: Other National Banks**
- Citi / Citibank
- US Bank
- KeyBank
- PNC Bank
- M&T Bank

**Tier 3: Aggregators** (if direct bank scraping fails)
- Zillow foreclosure filter (already in plan)
- Redfin bank-owned properties
- Realtor.com foreclosures

**Scraping Strategy**:
- Each bank has REO portal (e.g., `bankofamerica.com/real-estate` or similar)
- Extract: address, list price, bank contact, property type
- Match against Judicial + assessor data to avoid dupes
- Track bank name as deal source

---

## Architecture

```
┌─ CT Judicial ────────────┐
│  Foreclosures            │
└────────────┬─────────────┘
             │
┌────────────┴─────────────┐
│                          │
│    ┌──────────────────────────────────────┐
│    │ Bank REO Listings (Tier 1→2→3)       │
│    │ - BofA, Wells Fargo, Chase, etc.     │
│    └──────────────────────────────────────┘
│                          │
│    ┌──────────────────────────────────────┐
│    │ CT Tax Assessor Data                 │
│    └──────────────────────────────────────┘
│
└────────────┬─────────────┘
             │
        ┌────▼──────────┐
        │  Scraper      │  ← Consolidate all sources
        │  + Dedupe     │  ← Remove duplicates by address
        └────┬──────────┘
             │
        [Property objects: address, source, assessed_value, list_price, court_date, bank_name]
             │
        ┌────▼──────────────────────┐
        │  Fetch Market Value        │  ← Compare assessed vs market
        │  (Zillow + tax records)    │
        └────┬──────────────────────┘
             │
        ┌────▼──────────────────────────┐
        │  Investment Analysis           │
        │  - ARV estimate                │
        │  - Cap rate (rental income)    │
        │  - Cash-on-cash return         │
        │  - Days-to-cash (timeline)     │
        │  - Market demand signal        │
        └────┬──────────────────────────┘
             │
        ┌────▼──────────────┐
        │  Filter & Rank    │  ← 15% discount + deal score
        └────┬──────────────┘
             │
        ┌────▼──────────────┐
        │  Export & Track   │  ← below_market_deals.md
        └───────────────────┘
```

---

## Implementation Phases

### Phase 1: Judicial + Bank REO Scrapers
**Goal**: Extract property listings from CT Judicial + bank REO sites

**Judicial Foreclosures:**
- Parse foreclosure list by town (Cheshire, Madison, Guilford, Orange)
- Extract: address, county, case number, court date, status, opening bid

**Bank REO Listings:**
- Target Tier 1 banks first (BofA, Wells Fargo, Chase, HSBC, Berkshire, People's)
- Extract: address, list price, bank name, property type, link to listing
- Implement fallback to Zillow/Redfin if direct bank scraping fails
- Handle bank portal structure variations (each bank has different UI)

**Consolidation:**
- Combine all sources into unified property objects
- Dedupe by normalized address (critical: same property may appear in Judicial + Bank)
- Track source (judicial, boa_reo, wellsfargo_reo, etc.)

**Files**: `scrapers/judicial.js`, `scrapers/bankReo.js`, `utils/dedupe.js`, `config.js`

**Validate**: 
```bash
node scrapers/judicial.js cheshire          # 5+ listings
node scrapers/bankReo.js                    # 10+ bank REO listings across CT
node index.js                               # Consolidated output, no dupes
```

### Phase 2: Tax Assessor Data Fetcher
**Goal**: Get assessed values for comparison

- Fetch CT tax records by town (structure varies by town)
- Match property addresses between all sources
- Extract: assessed value, property type, age, square footage
- Implement address normalization (trim, standardize "St"/"Street", etc.)
- **Files**: `scrapers/taxAssessor.js`, `utils/addressNormalize.js`
- **Validate**: Manual match 5 properties: judicial/bank address ↔ assessor address

### Phase 3: Market Value Lookup & Comparison
**Goal**: Get current market values; compare assessed vs market

- Zillow scraping fallback (if Judicial/Assessor/Bank don't include market value)
- Calculate delta: `assessedValue vs marketValue` (identify under/over-valued)
- Cache results to avoid re-fetching
- **Files**: `scrapers/zillow.js`, `utils/marketValue.js`
- **Validate**: 3 test addresses show both assessed and market values

### Phase 4: Investment-Grade Analysis
**Goal**: Calculate ROI, ARV, cap rate, timeline

**Metrics to compute:**

| Metric | Formula | Example |
|---|---|---|
| **Deal Discount %** | `(marketValue - askingPrice) / marketValue * 100` | "15.2%" |
| **ARV (After-Repair Value)** | `marketValue` (assume good condition) | "Same as market" |
| **Renovation Cost Est.** | `assessedValue * 0.12` (12% of property value) | "$18k" |
| **Est. Rental Income** | Zillow rental comp or `marketValue * 0.006` (0.6%/mo) | "$1,200/mo" |
| **Cap Rate** | `(rentalIncome * 12) / purchasePrice * 100` | "8.5%" |
| **Cash-on-Cash Return** | `annualCashFlow / downPayment * 100` (assume 20% down) | "12.3%" |
| **Days-to-Cash** | Foreclosure/bank sale timeline | "30-90 days (bank REO), 90-180 (judicial)" |
| **Market Demand** | Count similar properties in area (past 30 days) | "High (4 sold)" |

**Files**: `analysis/investmentScore.js`

**Validate**: Manual calc 2 properties, verify against formula

### Phase 5: Filtering, Ranking & Export
**Goal**: Identify deals, score them, export to markdown with history

- Filter rule: `askingPrice < marketValue * 0.85` (15% discount)
- Rank by: deal score (combo of cap rate + days-to-cash + discount %)
- Bank REO deals rank higher (typically faster path to cash than judicial)
- Track deals over time (dedupe by address, mark sold/withdrawn)
- Generate markdown table with links + source attribution
- Add summary stats (total deals by source, avg cap rate, best opportunity)
- **Files**: `dealFinder.js`, `exporter.js`, `below_market_deals.md`
- **Validate**: Output markdown renders correctly, includes all metrics, source attribution

### Phase 6: Error Handling & Robustness
**Goal**: Handle network failures, stale data, malformed HTML gracefully

- Retry logic with exponential backoff
- Fallback cascade: if Tier 1 bank fails, try Tier 2, then Tier 3
- Fallback to cached data if scraper fails
- Detailed error logging to file
- Graceful degradation (skip 1 source, continue with others)
- **Files**: `utils/retry.js`, `utils/logger.js`, `utils/fallback.js`
- **Validate**: Intentionally fail 1 source, script continues with others

---

## Files to Create

```
ct-deal-finder/
├── package.json                 # Dependencies (cheerio, axios, marked)
├── config.js                    # Towns, URLs, bank tiers, thresholds, constants
├── index.js                     # Main orchestration
├── scrapers/
│   ├── judicial.js              # CT Judicial foreclosure parser
│   ├── bankReo.js               # Bank REO listings (multi-bank)
│   ├── taxAssessor.js           # CT tax records fetcher
│   └── zillow.js                # Market value fallback
├── analysis/
│   └── investmentScore.js       # ROI, cap rate, ARV calculations
├── utils/
│   ├── addressNormalize.js      # Address matching logic
│   ├── dedupe.js                # Remove duplicate properties by address
│   ├── marketValue.js           # Fetch & cache market values
│   ├── retry.js                 # Retry + backoff logic
│   ├── fallback.js              # Tier 1→2→3 bank scraping fallback
│   └── logger.js                # Logging to file + console
├── dealFinder.js                # Filter + rank deals
├── exporter.js                  # Markdown export with history
├── below_market_deals.md        # Output (auto-generated)
├── cache/                       # Cached data (gitignored)
├── logs/                        # Log files (gitignored)
└── .gitignore                   # Ignore cache, logs, node_modules
```

---

## Key Decisions

| Decision | Rationale |
|---|---|
| **Judicial + Bank REO sources** | Cast wider net; bank REO often faster to close than judicial |
| **Prioritize CT underwriters** | Tier 1 banks have more CT inventory; faster path to deals |
| **Dedupe by address** | Same property may appear in multiple sources |
| **Compare assessed vs market value** | Identify mispriced properties (not just discounts) |
| **12% renovation cost assumption** | Standard industry estimate; can adjust per property |
| **Bank REO deals score higher** | Shorter timeline to cash (30-90 days vs 90-180 judicial) |
| **0.6% monthly rent/value** | Industry rule-of-thumb for rental income |
| **Export to markdown** | Version-controllable, readable, shareable format |

---

## Validation Strategy

```bash
# 1. Test Judicial scraper
node scrapers/judicial.js cheshire

# 2. Test bank REO scraper (Tier 1 banks)
node scrapers/bankReo.js

# 3. Test dedupe logic
node utils/dedupe.js

# 4. Test address matching + market value lookup
node utils/marketValue.js "123 Main St, Madison, CT"

# 5. Test investment scoring
node analysis/investmentScore.js

# 6. Full pipeline
node index.js

# 7. Verify output
cat below_market_deals.md

# 8. Re-run (should use cache, run faster)
time node index.js
```

---

## Acceptance Criteria

- ✅ Scrapes all 4 towns from CT Judicial without errors
- ✅ Scrapes Tier 1 bank REO listings (BofA, Wells, Chase, HSBC, Berkshire, People's)
- ✅ Dedupes properties by address (no duplicates across sources)
- ✅ Matches 80%+ of addresses between all sources + assessor data
- ✅ Market values populate (Zillow or assessor fallback)
- ✅ Investment metrics calculated correctly (manual spot-check 3 properties)
- ✅ Filters identify deals correctly (15% discount rule)
- ✅ Deals ranked by investment score (cap rate primary, bank REO timeline prioritized)
- ✅ `below_market_deals.md` exports with source attribution + links + full metrics
- ✅ Handles network failures gracefully (Tier 1→2→3 fallback, cached data)
- ✅ Runtime < 3 minutes for full pipeline
- ✅ Tracks deal history (no dupes, marks sold/withdrawn, source tracked)

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Bank REO portal structure varies by bank | High | Build bank-specific scrapers; Tier 1→2→3 fallback to Zillow |
| Bank sites block scraper (rate limiting) | Medium | Add user-agent rotation, respectful delays (3-5s between requests) |
| CT Judicial site blocks scraper | Medium | Add delays, cache aggressively, implement retry logic |
| Address format inconsistency across sources | High | Comprehensive normalization function (trim, case, standardize abbreviations) |
| Market value unavailable (Zillow blocks scraping) | High | Fall back to assessed value; note "estimated" in output |
| Rental income data missing for cap rate | High | Use 0.6% rule-of-thumb; add "assumed" flag in markdown |
| Foreclosure timeline varies (judicial vs bank) | Low | Note source + timeline separately; both tracked in output |
| Property condition unknown | High | Caveat in markdown: "ARV assumes full condition; inspect before investing" |
| Duplicate properties across sources | Medium | Dedupe logic on normalized address; manual spot-check |

---

**Ready to proceed?** Approve to begin Phase 1 coding (Judicial + Bank REO scrapers).
