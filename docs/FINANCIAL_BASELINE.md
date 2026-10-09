# FINANCIAL_BASELINE.md — Backdesk default figures and their sources

**Compiled:** 2026-10-09, from the Xenia Homes project (Amir's B12 work in Madinaty, 2026), his own spreadsheets, and public sources.
**Purpose:** the reference for every default, preset, hint and seasonal value the calculator shows. Each figure carries its source and a confidence tag. CLAUDE.md §2 still applies: a figure with no real source stays `SAMPLE`.

## 0. Read this first

**B12 never operated.** It has no bills, no bookings and no monthly actuals. Every figure below is an offer, a quote, a market observation, Amir's own planning figure, or an estimate. None of it may become a `curated` benchmark row (BUILD_PLAN §3) until a unit has real books.

| Tag | Meaning | Use in the app |
|---|---|---|
| **R** | Real observation: an actual offer, a platform screen Amir saw, a market scrape, PriceLabs data | Default allowed; cite source in a code comment |
| **O** | Amir's operator figure: his own sheet or a direct statement from experience, not a measured bill | Default allowed, keeps the `SAMPLE` tag until confirmed by real books |
| **P** | Public source (tariff, platform policy) with a date | Hint text and reference tables |
| **E** | Estimate from earlier AI-assisted models, no external source | `SAMPLE` only, or drop |

## 1. Findings that change the app

1. **The arbitrage preset counts the furniture twice.** Rent 35,000 is Amir's real offer for a *furnished* 3-bedroom unit (R). The preset also depreciates a 250,000 setup cost, which only applies to an *empty* unit. Amir's real empty-unit offer was 18,000 (R). Fix: two arbitrage presets (furnished / empty), driven by the furnished flag.
2. **The default 18 booked nights (60%) is above the whole market range.** New Cairo occupancy runs 34–52% (P, AirROI vs Airbtics). A zero-review first year was assessed at 38–45% (E). At 14 nights the current preset loses 15,248 a month instead of 7,014.
3. **Listed price ≠ booked price.** In Madinaty, PriceLabs booked rates (~2,450) ran about 35% below the listed median (~3,786, 24-listing scrape) (R). The calculator's ADR means the booked rate. It is the largest single swing in every verdict.
4. **Missing inputs:** laundry per stay, other monthly costs (software, phone line), and the lease's upfront cash (broker fee, prepaid months). Laundry and software were in every one of Amir's models.
5. **Seasonality data now exists for Madinaty** (open question 12 in BUILD_PLAN §6): Amir's electricity curve and the B12 monthly occupancy/ADR curve, below.

## 2. Revenue inputs

### 2.1 Nightly rate (ADR)

| Figure | Value (EGP) | Tag | Source |
|---|---|---|---|
| 3BR Madinaty, listed, weekday median | 3,025 | R | 51-listing Airbnb scrape, Sep 2026 |
| 3BR Madinaty, listed, weekend median | 3,558 | R | same |
| 3BR Madinaty, listed p25 / p75 / p90 | 2,888 / 4,194 / 4,957 | R | same |
| 3BR Madinaty, listed median (guest-facing) | 3,786 | R | 24-listing scrape, Sep 2026 |
| 3BR Madinaty, host-net median | 3,199 | R | same, after fees |
| 3BR Madinaty, **booked** rate | ~2,450 | R | PriceLabs, from Amir's Sep 2026 analysis |
| Same-building competitor (B12) | 3,381, rating 4.89 | R | scrape |
| New Cairo ADR, all sizes | 2,200 (AirROI) / 2,900 (Airbtics) | P | web, Jun 2026 |
| B12 rate ladder (BAR #1–#8) | 2,400 · 2,650 · 2,900 · **3,200 base** · 3,550 weekend · 3,950 · 4,500 · 5,200 holidays | O | Xenia_B12_Rate_Structure workbook |

**Review effect (R):** zero-review listings median 2,893 vs one-review 3,819. A single review closes the gap, so a launch discount needs only 3–5 bookings.

### 2.2 Occupancy and length of stay

| Figure | Value | Tag | Source |
|---|---|---|---|
| New Cairo market occupancy | 34–52% | P | AirROI (low) vs Airbtics (high), Jun 2026 |
| First-year occupancy, zero-review operator | 38–45% | E | Jun 2026 audit |
| B12 break-even occupancy at 35k rent | ~49.5% | E | rate workbook |
| Average length of stay (ALOS) | **2.5 nights** | O | confirmed by Amir for B12 (models used 3.0) |
| Launch ramp, months 1–4 | 40% · 60% · 80% · 100% of steady state | E | Jun 2026 model |

### 2.3 Cleaning fee charged to the guest

| Figure | Value | Tag | Source |
|---|---|---|---|
| B12 unified cleaning fee | ~$12 (≈ 610 EGP at 50.8) | O | B12 Airbnb setup; the short/long split was dropped because it lost money per booking |

### 2.4 Seasonality (Madinaty / New Cairo)

Amir's rule (O): Ramadan is always low; Eid al-Fitr, Eid al-Adha and summer price at about **2×**. Gulf school holidays drive peak demand.

B12 monthly curve (E, built on the 24-listing scrape; Sep–Oct include the launch ramp):

| Month | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ADR | 2,900 | 3,300 | 3,800 | 4,300 | 3,800 | 3,800 | 3,800 | 3,800 | 3,800 | 4,400 | 4,500 | 4,400 |
| Occupancy | 25% | 35% | 45% | 60% | 45% | 45% | 45% | 50% | 50% | 65% | 70% | 65% |

**Engine note:** Ramadan and both Eids move about 11 days earlier each year. Seasonal multipliers keyed to Gregorian months will drift; tie them to Hijri dates (e.g. the Aladhan API) or let the host edit them each year. Ramadan 2027 starts around 8 February; Eid al-Adha 2027 falls around 16 May.

### 2.5 Discounts used on B12 (O)

New-listing promotion 20% (first 3 bookings) · weekly (7+) 12% · monthly (28+) 25% · last-minute: none (it applies all year, including Eid). Non-refundable/early-bird BAR −10–12%; direct booking BAR −5–8%.

## 3. Platform and payment fees

| Channel | Rate | Tag | Source |
|---|---|---|---|
| Airbnb, host-only fee | 15.5% | P | Airbnb policy, Oct 2025 (not yet checked on B12's own screen) |
| Booking.com, base | 15% | P | Booking.com |
| Booking.com, **observed** | **17.4%** | R | B12 extranet screen, Sep 2026. Displayed price = target net ÷ (1 − 0.174) |
| Booking.com with Genius/Preferred | 18–20% | P | web, Jun 2026 |
| Direct booking, card processing (Paymob/Fawry) | ~2.75–3% | E | Jun 2026 model |
| Channel mix used in the B12 budget | 45% Airbnb · 45% Booking.com · 10% direct | O | B12 annual budget |
| Bank charge on foreign payouts | $20 per transfer (placeholder, never filled) | O | Amir's Work structure sheet |

**Discard:** Airbnb 3% split fee in Amir's older sheet. Egyptian hosts moved to the host-only fee.

## 4. Fixed monthly costs

### 4.1 Rent and lease terms

| Figure | Value (EGP) | Tag | Source |
|---|---|---|---|
| 3BR Madinaty, **furnished**, monthly | 35,000 | R | B12 offer, Sep 2026 |
| Same unit, 6 months prepaid | 30,000 | R | same offer, Deal B |
| 3BR Madinaty, **empty** (finished, kitchen fitted), 3–5 year lease | 18,000 | R | new-unit offer, Sep 2026 |
| 2BR Madinaty | 15,000 | O | Amir, Apr 2026 (mid-range estimate 15,000–22,000, E) |
| Deposit | 1 month | R | B12 offer |
| Prepaid at signing | 1 month (Deal A) / 6 months (Deal B) | R | B12 offer |
| Broker fee | 0.5 month | R | B12 offer |
| Upfront cash, Deal A / Deal B | 102,000 / 239,500 | E | 35k×(1+1+0.5)+14,500 launch extras; 30k×(6+1+0.5)+14,500 |
| Arbitrage viability ceiling, Madinaty | rent below ~13,000 (rough range 13,000–26,000 by market state) | R | Amir's PriceLabs and listing-CSV analysis |

Deposit is recoverable cash, not a cost. Broker fee is a one-off cost spread over the lease. Prepaid rent is cash timing only.

### 4.2 Utilities

**Electricity, B12 (O):** 1,500–2,000 a month (Amir: inverter ACs and instant water heaters). This replaced a 6,000 summer estimate.

**Electricity, Amir's own monthly curve (O, 2BR, Work structure sheet):**

| Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Avg |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1,000 | 1,000 | 1,000 | 1,000 | 1,500 | 3,000 | 4,000 | 4,000 | 4,000 | 3,000 | 2,500 | 1,000 | **2,250** |

As multipliers of the average: 0.44 · 0.44 · 0.44 · 0.44 · 0.67 · 1.33 · 1.78 · 1.78 · 1.78 · 1.33 · 1.11 · 0.44. Use them for the utilities line in the 12-month projection.

**Household tariff, 2026 (P, Egypt Independent, 9 Jul 2026), EGP per kWh:**

| 0–50 | 51–100 | 101–200 | 201–350 | 351–650 | 651–1,000 | >1,000 |
|---|---|---|---|---|---|---|
| 0.68 | 0.78 | 0.95 | 1.55 | 1.95 | 2.10 | 2.58 |

**Discard:** the "EEHC 2024" table (0.27–1.60) in the acquisition evaluator. It predates two increases. Confirm how bills apply tiers above 650 kWh before modelling bills from kWh.

**AC load model (E):** 1.5 HP ≈ 1.3 kWh/h; 2.25 HP ≈ 2.0 kWh/h; base load ≈ 7 kWh/day (fridge, lights, TV, router, washer); summer AC 9 h/day, rest of year 3.5 h/day. Useful for a later "estimate my bill" helper, not as a default.

| Other utility | Value (EGP/month) | Tag | Source |
|---|---|---|---|
| Water | 150 | O | Amir's sheet (models used 400, E) |
| Water tariff | 3.50/m³ (0–20 m³), 4.50/m³ (20–40) + 20 service | E | evaluator, "NUCA New Cairo", unverified |
| Gas | 0 for B12 (electric cooktop) | O | B12 handover; LPG cylinder ~150 each if used (E) |
| Internet | 500–600 | O | Amir's sheet 500; ADSL 600 |

### 4.3 Overheads (no field in the app today)

| Item | Value | Tag | Source |
|---|---|---|---|
| PMS / channel manager | Hospitable $39/month | O | Amir's sheet |
| Beds24 channel manager | €8–10/month (~500 EGP) | P | Beds24 pricing, unconfirmed in EGP |
| Mobile line | $10/month (sheet); 200 EGP (model) | O / E | |
| Dynamic pricing tool (PriceLabs) | ~$20 (~1,000 EGP) | E | |
| Bookkeeping | 1,000 | E | |
| Liability insurance | 250 | E | price unconfirmed |
| Marketing | 250 | E | B12 budget |
| Compound / service fees | **open question** | — | Models used 500–1,000 (E). In a Madinaty rental the owner may pay the compound fee; Amir to confirm |

## 5. Per-stay costs (each turnover)

| Item | Value (EGP per stay) | Tag | Source |
|---|---|---|---|
| Cleaning, per job | 400–600 | O | Amir's Work structure sheet |
| Cleaning, B12 3BR full turnover | 500–600 (4–5 hours) | O | B12 launch planning |
| Cleaner pay used in the ERP spec | 350 | E | |
| Laundry, wash + iron (outsourced) | 150–200 wash + 150–200 iron | O | Amir's sheet |
| Laundry, model | 250 | E | sheets, covers, towels, blanket |
| Laundry, older sheet line | 50 | O | "50 EGP per stay", likely in-house machine only |
| Consumables, itemized | **180** = toilet paper 30 · toiletries 40 · dish/cleaning chemicals 35 · bin bags 10 · coffee/tea/sugar 30 · welcome items 35 | E | Jun 2026 model |
| Guest supplies, B12 budget | 100 | E | |

**Amir's welcome kit (O), per stay:** 2 large Nestlé water bottles, 2 Nescafé sachets, 2 sugar sachets, 2 Lipton tea bags, chips and biscuit packs. It still needs pricing from Carrefour, Spinneys or Amazon.eg.

**Per guest per day (E):** tissue 0.5 roll, coffee 2, tea 2, sugar 4, water 1.5 bottles. Unit prices (E): tissue roll 5, coffee capsule 12–18, tea 2, sugar 0.5, 500 ml water 3. Use this only for a later guests × nights model, not as a default.

## 6. Repairs and reserves

| Item | Value (EGP/month) | Tag | Source |
|---|---|---|---|
| Repairs allowance | 800 | E | models (app default) |
| Light fixture repairs | 1,000–1,250 | O | Amir's sheet |
| Maintenance per job (plumber / electrician / other) | 100–400 / 100–300 / 100–400 | O | Amir's sheet; ~1,000 per unit per month at 15 nights |
| Replacement reserve, itemized | ~1,583 = linen 4,000 · towels 3,000 · kitchen 3,000 · electronics 3,500 · furniture wear 2,500 · small appliances 1,500 · décor 1,500 per year | E | Jun 2026 model |
| Replacement reserve, Amir's call | 500 | O | Amir cut 1,500 as too high (B12, furnished) |
| Emergency / capex reserve | 1,000 | E | B12 budget; one AC failure was estimated at 23,500 |
| Working-capital buffer, year 1 at 30k rent | 186,000 | E | Jun 2026 audit |

## 7. Setup investment (CAPEX)

### 7.1 Furnished vs empty

| Situation | Setup cost | Tag |
|---|---|---|
| Rented furnished | 0 (only additions: B12 needed ~111,425 in total, of which 78,745 essential, 30,450 décor in three waves, 2,230 repairs and consumables) | R/E |
| Rented furnished, décor additions only (B12 tracker v2) | 32,240 wholesale / 52,398 online | E |
| Empty but finished (kitchen fitted), 3BR | ~334,000 (appliance and furniture carts) | R (Amir's carts) |
| Safe capex ceiling at base-case ADR and occupancy | 270,000–300,000 | E |
| Empty shell to guest-ready (kitchen, lighting, curtains, paint, plumbing, identity décor, locks) | 550,000–700,000 | E |

### 7.2 Amir's 2BR furnishing list (O, Work structure sheet): **313,050**, plus kitchen 34,500 = 347,550

| Category | Total | Items (quantity × price) |
|---|---|---|
| Appliances (أجهزة) | 162,300 | 60" TV 25,000 · flat cooker 10,000 · microwave 5,000 · fridge 12,000 · front-load washer 15,000 · 50 L heater 3,500 · 2 × 1.5 HP AC 41,000 · 1 × 3 HP AC 40,000 · espresso machine 8,500 · kettle 600 · iron 1,000 · hair dryer 700 |
| Furniture (فرش) | 97,500 | corner sofa 25,000 · armchair 10,000 · sofa bed (unpriced) · corner table 2,500 · coffee table 1,000 · dining set 15,000 · 3 beds 27,000 · 5 nightstands 5,000 · 2 wardrobes 10,000 · 2 clothes racks 2,000 |
| Equipping (تجهيز) | 37,600 | 3 mattresses 10,500 · TV mount 700 · 2 chandeliers 3,000 · 3 curtains 3,000 · pan set 1,500 · granite pot set 2,000 · serving plates 500 · glasses 200 · knife set 700 · rectangular 3-piece set 500 · cutlery 500 · ironing board 1,000 · 6 small towels 500 · 3 large towels 500 · 3 sheet sets 1,500 · 3 duvets 3,000 · 3 duvet covers 1,500 · 3 mattress covers 1,500 · 3 blankets 3,000 · 8 pillows 2,000 |
| Décor (ديكورات) | 15,650 | 2 bedroom mirrors 3,000 · 2 hall mirrors 3,000 · bathroom mirror 600 · 5 lamps 2,500 · 3 plants 1,000 · 5 frames 3,000 · bathroom set 500 · kitchen set 300 · 6 bins 900 · doormats 850 (entrance 300, bathroom 300, kitchen 250) |
| Finishing (تشطيب) | 34,500 | kitchen 34,500 (gypsum and paint unpriced) |

### 7.3 Finishing unit prices (R, contractor reels analysed Sep 2026)

Plaster prep and primer for a 146 m² flat: 15,400 · painting labour: 80 per m² · interior door supplied and fitted: 6,000 · HPL door skin: about +2,000 per door.

### 7.4 Useful life

60 months (O: Amir's sheet depreciates 20% a year; matches the app default). Under STR wear the weighted asset life was estimated at 48–54 months (E). A payback longer than about 48 months means the furniture wears out first.

## 8. Staffing (O, Amir's Work structure sheet, 2 properties)

| Role | Pay |
|---|---|
| Key handover, online messaging, on-site, emergency and maintenance | 4,000–6,000 a month each; 16,000 minimum for the four |
| Cleaning | 400–600 per job; ~3,000 a month per property on payroll; ~7,000 per unit at 15 nights |
| Washing / ironing | 150–200 per job each; ~210 pieces a month at 15 nights; ~3,000 per unit outsourced |
| Property assistant (later) | 1,500–2,000 a month or per task (E) |

## 9. Tax and compliance

- Effective profit tax 10%: placeholder only (E). Tax is a user setting (CLAUDE.md §2).
- Amir's older sheet charges 14% VAT on revenue. That is a hotel habit; an individual host is generally outside VAT below the registration threshold. Confirm with an accountant; never default it.
- Holiday Home licensing (Ministerial Decision 609/2025): fees and the tourism fitness certificate are real costs with no figure yet.

## 10. Discarded figures

| Figure | Why |
|---|---|
| "Madinaty 2BR ADR 1,100, occupancy 65%" (SaaS constants file) | No source; contradicted by both scrapes |
| EEHC 2024 tariff 0.27–1.60 | Outdated |
| Airbnb 3% split fee | Outdated for Egyptian hosts |
| Booking.com 15% as the working rate | Replaced by the observed 17.4% |
| Utilities 6,000 in summer | Corrected by Amir (inverter ACs) |
| "Total fixed costs 20,800" in Amir's Costs sheet | Adds electricity, water and internet twice (true total 17,900) |
| Tolip Royal Alexandria sales report | Hotel data, not apartments |
| 2017 Airbnb client book (Savannah, GA) | No Egyptian figures |

## 11. Worked comparison (engine replicated; check: current preset = −7,014, break-even 21.41)

Common inputs for the 3BR cases: ALOS 2.5, cleaning fee 600, Airbnb 15.5%, utilities 2,150 (electricity 2,000 + water 150), internet 600, compound 0, repairs 800, per stay: cleaning 550 + laundry 250 + consumables 180.

| Case | Monthly net | Break-even |
|---|---|---|
| Current preset (2BR, 35k rent + 250k setup, 18 nights) | −7,014 | 22 nights |
| Current preset at 14 nights | −15,248 | 22 nights |
| 3BR **furnished** 35k · ADR 3,200 (listed base) · 14 nights | −3,343 | 16 nights |
| 3BR **empty** 18k + 334k/60 · ADR 3,200 · 14 nights | **+8,091** | 11 nights |
| 3BR furnished 35k · ADR 2,450 (booked) · 14 nights | −12,215 | 21 nights |
| 3BR empty 18k + 334k/60 · ADR 2,450 · 14 nights | −782 | 15 nights |

The empty unit costs 11,433 a month less than the furnished one (35,000 against 18,000 + 5,567 depreciation) but needs ~334,000 up front. Payback of that 334,000: 24.5 months at 3,200 × 14 nights; 38.7 months at 3,200 × 12; 69.8 months at 2,450 × 14, which is beyond the 60-month life. The verdict depends on the booked rate more than on any cost line.

## 12. Changes proposed for the calculator

1. **Furnished flag** (already requested): `furnished = true` hides setup cost and depreciation.
2. **Two arbitrage presets** replacing the current one: *furnished* (rent 35,000, setup 0) and *empty* (rent 18,000, setup 334,000, life 60). Label both "مثال", not a city. Cite the sources above in code comments.
3. **Defaults:** booked nights 14 (not 18), ALOS 2.5, cleaning cost 500 for 2BR / 550 for 3BR, consumables 150 (2BR) / 180 (3BR).
4. **New fields:** laundry per stay (default 250, SAMPLE); other monthly costs (software, phone line; default 0); broker fee (one-off, spread over the lease); prepaid months (cash timing only, shown in "money needed to start").
5. **Hints:** under ADR, "سعر الحجز الفعلي غالبًا أقل من السعر المعروض"; under platform fee, "Booking.com: 15% أساسي، ظهر 17.4% على شقة في مدينتي".
6. **Projection seasonality:** seed Madinaty multipliers from §2.4 and the electricity curve from §4.2, editable, marked SAMPLE, with Ramadan and Eid tied to Hijri dates.
7. **Keep `SAMPLE`** on every O and E figure until a unit has real books. BUILD_PLAN §4.6 worked examples stay unchanged: they test the math, not the market.

## 13. Open questions for Amir

1. In a Madinaty rental, who pays the compound service fee: owner or tenant?
2. Default ADR: the booked rate (~2,450, conservative) or the listed base (3,200)?
3. Is the 334,000 cart total for the 3-bedroom empty unit, appliances and furniture together, ACs included or not?
4. Does 1,500–2,000 a month electricity apply to a 3-bedroom with three inverter ACs year-round, or summer only?
5. A real cleaning quote per turnover for 2BR and 3BR, to replace the ranges.
