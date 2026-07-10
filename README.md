# Hoard & Holdings

You are a freshly evicted young dragon with scales to prove and absolutely no real estate to your name. Hoard & Holdings is a turn-based fantasy tycoon game in which you build a kobold labour colony, purchase lairs across a procedurally flavoured region, intimidate adventurers, out-manoeuvre rival dragons, and claw your way from humiliating homelessness to terrifying greatness — all narrated with the tone of a very dry medieval comedy. The game runs entirely in the browser, saves to localStorage, and requires no server beyond a local Vite dev instance.

Every in-game day has three acts: a **Morning** action (visit the realtor, hire kobolds, manage your colony, or send an expedition), an **Afternoon** action (hunt adventurers, negotiate with rivals, sell loot, sabotage a rival, or explore ruins), and an automated **Evening** resolution where your kobolds earn income, rivals scheme, seasonal events trigger, and the game tells you exactly how badly things are going. Balance your dread rating carefully — high enough to intimidate rivals, low enough that hero parties don't camp outside your front door.

---

## Play Online

The latest build is deployed to GitHub Pages — no installation required:

**https://jsmitsarthrex.github.io/hoard-and-holdings/**

---

## Setup

```bash
npm install
npm run dev
```

The dev server starts at **http://localhost:5173**. To enable Claude-powered NPC dialogue, create a `.env` file in the project root:

```
VITE_ANTHROPIC_API_KEY=your_key_here
```

Without this key the game falls back to hand-written dialogue lines for all NPCs.

---

## Starting a New Game

### Intro Sequence

After clicking **New Game** on the title screen, you step through a four-panel comic-style prologue that explains the premise. Click, press `Enter`, `Space`, or `→` to advance. The final panel is the **Dragon Creation** screen.

### Dragon Creation

| Option | Details |
|---|---|
| **Name** | Type any name up to 30 characters, or click **Randomize** to get a procedurally generated prefix-suffix name (e.g. *Emberclaw*, *Frostmaw*). |
| **Lineage (Breed)** | Pick one of 8 dragon breeds, each with different ATK / DEF / SPD stats that influence combat rolls. |
| **Difficulty** | Choose one of three difficulty tiers (see below). |

#### Dragon Breeds

| Breed | Flavour | Strengths |
|---|---|---|
| Fire Drake | Masters of flame | High ATK & Sp.ATK |
| Frost Wyrm | Born of glacial peaks | Balanced; high HP & DEF |
| Elder Drake | Purest lineage | Exceptional ATK & SPD |
| Acid Serpent | Corrosive breath | Balanced all-round |
| Storm Drake | Lightning incarnate | High Sp.ATK & SPD |
| Shadow Wyrm | Creatures of dusk | High ATK & SPD |
| Specter Drake | Neither alive nor dead | High Sp.ATK & Sp.DEF |
| Iron Wyrm | Scales harder than metal | Extreme DEF |

#### Difficulty Settings

| Difficulty | Label | Starting Gold | Win Threshold | Motel Cost / Night |
|---|---|---|---|---|
| Easy | Scroll of Comfort | 200g | 30 properties | 2g |
| Normal | Standard Conquest | 150g | 50 properties | 5g |
| Hard | Ordeal of Flames | 80g | 75 properties | 10g |

---

## How to Play

### Daily Structure

Each day follows a fixed three-act structure. You choose **one** Morning action and **one** Afternoon action; the Evening resolves automatically.

#### Morning Actions

| Action | Screen | What it does |
|---|---|---|
| **Grixle's Realty** | Real Estate | Browse all properties across every district on the world map. Buy with gold. Properties generate passive income through your kobold colony and count toward the win threshold. Active deed auctions are also managed here, as are property upgrades for owned holdings. |
| **Kobold Agency** | Kobold Agency | Hire kobold workers (Common / Uncommon / Rare tiers). Each kobold has a species, role, daily wage, and morale/loyalty values. Hiring costs one day's wage upfront. |
| **Manage Colony** | Colony Management | Reassign kobold roles, review the roster, monitor morale, and inspect earned traits. Kobolds with morale ≤ 0 will revolt at the next Evening resolution. |
| **Send Expedition** | Expedition | Deploy available kobolds to explore ruins. More scouts shift the odds towards loot and intel; fewer scouts risk injuries or captures. Results resolve the following Evening. |

#### Free Visits (no action cost)

These locations can be visited at any time during Morning or Afternoon without spending your action slot.

| Visit | NPC | What it does |
|---|---|---|
| **Ironclad Bank** | Barrax (Dragonborn Banker) | Economy forecast and active NPC contracts offered by Barrax. |
| **Arcane Law Office** | Saeloril Vethran (Elven Lawyer) | Purchase legal protection for your properties (30g). Consult on district ownership and rival claims. |
| **The Ember & Straw Inn** | Rosie Tumblefoot (Halfling Innkeeper) | Hear local rumours, accept NPC contracts, and review your motel arrangement if you lack a lair. |
| **Upgrade Lair** | — | Build permanent lair rooms or apply property-specific upgrades to owned holdings. |
| **The Back Room** | — | Browse the Black Market's rotating stock of stolen goods, intelligence, and pre-trained kobolds. |

#### Afternoon Actions

| Action | Screen | What it does |
|---|---|---|
| **Hunt Adventurers** | Combat | Roll a modified d20 against the current hero party. Win: earn gold + random loot item + dread. Lose: pay healing fees. Active incursions are also resolved here. After winning, you may capture a surviving adventurer for ransom. |
| **Visit a Rival** | Rival Screen | View each rival's portfolio and relationship score. Buy their properties at a premium, attempt to buy back a poached kobold (10× daily wage), or make a persuasion roll to improve relations and reduce dread. |
| **Sell at Auction** | Auction | Sell hoard loot items at a price determined by the live economy multiplier. A Recharts line chart shows gold history so you can time sales optimally. |
| **Sabotage / Heist** | Sabotage | Send kobolds to disrupt a rival's operations or steal their gold. Success scales with kobold count and dragon age tier. Requires at least one kobold. |
| **Explore Ruins** | Dungeon | Venture personally into tiered dungeon rooms for rare loot and legendary artefacts. Combat risk scales with dungeon tier. Higher tiers can yield items not obtainable elsewhere. |

#### Evening Resolution (Automatic)

1. **Expedition Results** — if kobolds were sent on an expedition, their outcome (loot, intel, injuries, or captures) resolves and kobolds return.
2. **Kobold Income** — each non-expeditionary kobold earns `dailyWage × 2` gross. Without a lair, income is halved and the motel fee is charged. Deep Mine Shaft upgrades boost assigned miner gross by +50%. Treasure Vault boosts all gross by +10%.
3. **Kobold Wages** — deducted from gross income. Winter Scarcity adds 20%.
4. **Lair Passive Effects** — Trophy Hall adds +1 Dread per 5 hoard items held; Grand Hall property upgrades add +2 Dread each.
5. **Kobold Trait Assignment** — any kobold with 15+ days employed who lacks a trait earns their role-specific trait.
6. **Rival AI** — rivals may acquire open-market properties or poach one of your kobolds (Loyal Guard trait provides immunity).
7. **Incursion Spawn** — a hero party may spawn based on your dread level. Watchtower property upgrades reduce this chance by −20% each.
8. **Auto-raid** — ignored incursions raid at dawn: 15% gold lost, kobold morale −20. Guard Post reduces auto-raid gold loss by 50%; Fortified Walls reduce it by a further 40%.
9. **Kobold Revolts** — any kobold at 0 morale steals gold (10–30%) and possibly a hoard item, then quits. 50% chance they join a rival.
10. **Ransom Expiry** — an active prisoner ransom not paid before its deadline is forfeit.
11. **Pending Events** — all queued events (revolts, incursions, seasonal transitions, council votes) surface as dismissible modal cards.

After Evening resolves, click **Advance to Next Day** to begin the morning of day `n + 1`.

---

## Core Systems

### Gold & Economy

Gold is the single resource. It funds property purchases, kobold wages, motel bills, and rival negotiations. The economy multiplier (sourced from the Dragon Age dataset, reshaped as a cyclical index) scales item sell prices at auction — watch the chart and sell during peaks.

### Dread

Your fearsome reputation, tracked 0–100. Five named tiers with distinct visual feedback:

| Range | Label | Effect |
|---|---|---|
| 0–24 | Unknown | No effect. Heroes wander carelessly nearby. |
| 25–49 | Noticed | Word spreads. Rivals begin watching. |
| 50–74 | Feared | Stronger hero parties form. Rivals hesitate. |
| 75–89 | Dreaded | Bards sing dark songs. Hero spawn doubles. |
| 90–100 | LEGENDARY | Maximum hero threat. Rivals flee negotiations. |

Dread is displayed in the top bar with a colour-coded fill bar and a hover tooltip explaining the tier's effects. High dread is a double-edged sword: it boosts persuasion and intimidation but dramatically increases hero incursion frequency. Higher dread also shortens prisoner ransom deadlines (captives grow bolder when you are unknown) and unlocks an elite kobold slot on the Black Market.

### Dragon Age Tiers

Your dragon grows as days pass. Each tier upgrade fires a celebration event and grants permanent bonuses:

| Tier | Name | Day Threshold | Bonus |
|---|---|---|---|
| 1 | Wyrmling | Day 0 | Starting state |
| 2 | Young Drake | Day 30 | Combat rolls +2 · Tier 2 hero parties unlocked |
| 3 | Adult | Day 70 | Gold income +15% · Tier 3 hero parties unlocked · Can sell Uncommon items |
| 4 | Ancient | Day 120 | Dread intimidation bonus +10 · Tier 4 hero parties unlocked |
| 5 | Great Wyrm | Day 180 | All income +25% · Rivals fear you (persuasion DC reduced to 10) |

A five-segment gold bar in the top header tracks current tier and days until the next.

### Dragon Abilities

Once per day, from the Game Hub, you can activate one Dragon Ability. The cooldown resets each morning. Abilities unlock as your dragon ages:

| Ability | Min Tier | Effect |
|---|---|---|
| **Territorial Roar** 😤 | Tier 1 | +8 Dread. Chosen rival relationship −10. |
| **Searing Cache** 🔥 | Tier 2 | Gain `20 + ageTier × 15` gold and 1 random hoard item. |
| **Dreadful Presence** 🌑 | Tier 3 | All active incursion tiers reduced by 1 (minimum 1) until resolved. |
| **Demand Tribute** 👑 | Tier 4 | Force a rival to pay `propertyCount × 20g`. If their relationship is below 30 they refuse: −25 relationship, you gain nothing. |
| **Ancient Terror** 🐉 | Tier 5 | +15 Dread. All rival relationships −5. All active incursions auto-dismissed. |

### Kobold Colony

Kobolds are your workforce. Each has:

- **Species** — Red / Blue / Green / Purple / White (cosmetic, affects procedural portrait)
- **Tier** — Common / Uncommon / Rare (drives daily wage)
- **Role** — Miner ⛏ / Guard 🛡 / Treasurer 💰 / Scout 🔭 / Cook 🍖
- **Morale** — 0–100. Declines from earthquakes, raids, and neglect. Reaches 0 → revolt.
- **Loyalty** — 0–100. Low loyalty increases poaching vulnerability.

Kobolds generate `dailyWage × 2` gross income per day (halved without a lair). Wages are deducted each evening. You can dismiss kobolds at any time at no cost.

#### Kobold Traits

After 15 consecutive days of employment a kobold earns a permanent role-specific trait. Traits are visible as ⭐ badges in the Colony Management and Expedition screens. Pre-trained kobolds with traits are occasionally available on the Black Market.

| Role | Trait | Effect |
|---|---|---|
| Miner | Veteran Miner | +2 gold earned per evening |
| Guard | Loyal Guard | Immune to rival poaching attempts |
| Treasurer | Sharp Ledger | Total kobold income +3% |
| Scout | Shadow Step | +1 to all of your combat attack rolls |
| Cook | Master Cook | +2 morale per day to every kobold in the colony |

### Hero Incursions

Each evening there is a chance (driven by your dread level) that a named hero party spawns. Active incursions appear as a pulsing red badge in the top bar and must be fought in the **Hunt Adventurers** screen within **2 days**. If ignored, the party auto-raids at dawn — stealing 15% of your gold and dropping all kobold morale by 20.

### Rival Dragons

Three rival dragons populate the region from the start:

| Rival | Breed | Starting Properties |
|---|---|---|
| Scorch the Relentless | Fire Drake | prop_03_00, prop_07_00 |
| Frostbite the Unyielding | Frost Wyrm | prop_00_02, prop_08_00 |
| Shadowmere the Cunning | Shadow Wyrm | prop_06_04, prop_09_02 |

Each rival has a **relationship score** (0–100, starting at 50). Actions on the Rival screen can push it up or down. Rivals autonomously buy properties each evening; occasionally they poach a kobold from your colony. You can buy back poached kobolds at 10× their daily wage.

### Sabotage & Heist

From the **Sabotage / Heist** afternoon action, pick a target rival and a mission type:

- **Sabotage** — Kobolds disrupt the rival's operations. On success the rival is marked as sabotaged until a future day, suppressing their evening actions. On failure, relationship decreases.
- **Theft** — Kobolds attempt to steal gold directly from the rival's hoard. Success amount is determined by a dice roll modified by kobold count and dragon age tier. Failure risks a relationship penalty.

Requires at least one kobold in your colony.

### Seasonal Events

Seasons cycle on a 200-day year (50 days each). Each season transition fires an event modal and may apply a **status effect**:

| Season | Event | Effect |
|---|---|---|
| Spring | Season of Stirring | Dread recalculated from property count. Each rival gains 30 gold. |
| Summer | Season of the Long Sun | **Sell prices +25%** for 5 days (Merchant Festival). |
| Autumn | Season of the Fading Flame | **Hero spawn chance +15%** for 10 days (Adventuring Season). |
| Winter | Season of the Iron Cold | **Kobold wages +20%** for 50 days (Winter Scarcity). |

### Random Events

Each morning there is an **8% chance** of a random event. Events are either passive (auto-resolved with a notification) or interactive (present 2–3 player choices). Examples include:

- **Catastrophic Tremor** — kobold morale −15, one hoard item lost
- **Wandering Merchant** — buy a random item cheap or ignore
- **Kobold Talent Show** — morale boost for your colony
- **Rival Sabotage** — mysterious gold loss
- **Treasure Discovery** — free hoard item added
- …and many more, each with weighted spawn probability and optional conditions (e.g. only fires if you have kobolds, or if dread is above a threshold)

### Status Effects

Short- and medium-term modifiers that stack on top of baseline values:

- `sellMultiplier` — scales auction item sale prices (Summer Festival: +0.25)
- `heroSpawnBonus` — increases evening incursion probability (Autumn: +0.15)
- `wageCostModifier` — multiplies kobold wage deductions (Winter: +0.20)
- `councilVoteBonus` — modifies property buy prices (Property Tax Exemption: −0.20)
- `rivalAggressionMultiplier` — scales rival property acquisition rate (Free Market Declaration: +1.0)

Active effects are shown as emoji icons with hover tooltips in the top bar. They expire on a specific day tracked per-effect.

### Dragon Council

Periodically, a Dragon Council vote triggers as a pending event. You vote Aye or Nay; each rival votes independently with alignment probability based on their relationship score (relationship > 50 gives a 60% chance to mirror your vote).

| Motion | Effect if Passed |
|---|---|
| **Adventurer Licensing Fee** 📜 | Hero spawn chance −15% for 15 days |
| **Property Tax Exemption** 🏛️ | Property buy prices −20% for 10 days |
| **Free Market Declaration** 📈 | Rivals acquire properties twice as aggressively for 10 days |
| **Dragon Solidarity Pact** 🤝 | All rival relationships +10 immediately |

### NPC Contracts

The **Ironclad Bank** (Barrax) and **The Ember & Straw Inn** (Rosie) occasionally offer time-limited contracts. Each contract specifies a condition (e.g. sell N items, defeat N adventurers, acquire N properties) and a gold reward. Progress is tracked automatically and the contract card is visible in the relevant NPC screen. Contracts that expire before completion are marked as failed.

### Lair Construction

Once you own a property, permanent rooms can be built from the **Upgrade Lair** free visit. Each room is purchased once and applies a passive effect permanently:

| Room | Cost | Effect |
|---|---|---|
| **Kobold Barracks** 🪖 | 80g | On build: all kobolds +10 morale. Each evening: all kobolds +5 morale. |
| **Guard Post** 🛡️ | 100g | Auto-raid gold loss reduced by 50%. |
| **Trophy Hall** 🏆 | 120g | +1 Dread per 5 hoard items held, recalculated each evening. |
| **Treasure Vault** 🔒 | 150g | Kobold gross income +10%. |

### Property Upgrades

Individual owned properties can be upgraded from the **Real Estate** screen's Holdings section. Each upgrade requires a minimum number of days of ownership; some also require a medium or large lair:

| Upgrade | Cost | Min Days Owned | Lair Req. | Effect |
|---|---|---|---|---|
| **Deep Mine Shaft** ⛏️ | 120g | 5 days | — | Miners at this property earn +50% gross income. |
| **Watchtower** 🗼 | 100g | 3 days | — | Incursion spawn chance −20% globally. |
| **Fortified Walls** 🧱 | 140g | 5 days | Medium+ | Auto-raid gold loss reduced by 40%. |
| **Grand Hall** 🏛️ | 200g | 7 days | Large+ | +2 Dread each evening. |

Upgrades are shown per property card: built upgrades display a green ✓ badge; available upgrades show a 🔨 Build button; locked upgrades show a countdown to the min-ownership day.

### Competitive Property Auctions

Each day there is a **20% chance** a property deed goes to auction. An auction banner appears in the Real Estate screen, showing the current bid and the competing rival. You can place a higher bid at any time; the highest bid at end of day wins the deed. Winning via auction may be cheaper than the open-market price.

### Prisoner Ransom

After **winning combat**, you may capture a surviving adventurer for ransom instead of taking the standard loot. This sets an `activeRansom` with a gold demand and an expiry deadline. The deadline is shorter when your dread is low (captives grow bolder against an obscure dragon). If paid before expiry, you receive the gold. If it lapses, the captive escapes and you receive nothing.

### Black Market

Accessible via **The Back Room** free visit. The Black Market's rotating stock refreshes every few days and contains three item types:

- **Stolen Goods** — hoard items priced below open-market value
- **Intelligence** — intel on rival portfolios or upcoming hero party spawns
- **Kobolds** — pre-trained kobolds that already have their role trait, priced at 8× daily wage

High dread unlocks an additional elite Rare kobold slot in each refresh.

### Expeditions

From the **Send Expedition** Morning action, select any kobolds not currently on an expedition. The outcome probability bar shifts based on scout count:

| Outcome | Base Chance | Scout Modifier |
|---|---|---|
| Loot | 40% | +10% per scout (max 90%) |
| Intel | Remainder | — |
| Injury | 20% | −5% per scout (min 5%) |
| Captured | 10% | −5% per scout (min 2%) |

Results resolve the following Evening. Kobolds on expedition do not contribute to evening income.

### Dungeon Exploration

The **Explore Ruins** afternoon action sends your dragon personally into tiered dungeon rooms. Unlike expeditions (kobold-led scouting), dungeon runs involve direct combat against monster groups:

- Tier 1–2 rooms yield common dungeon loot and small gold amounts.
- Tier 3–4 rooms yield rare artefacts with higher flavour text and sell values.
- Tier 5 rooms have a chance to drop one of six **Legendary Items** (e.g. *The Obsidian Chalice of Nezznar*, *Halaster's Annotated Grimoire*).

Dungeon loot is added directly to your hoard and can be sold at auction.

### Earned Titles

Reaching certain milestones awards your dragon a permanent title, displayed beneath their name in the top bar:

| Title | Condition |
|---|---|
| **The Landlord** | Own 10 or more properties |
| **The Kobold Shepherd** | Have 5+ kobolds, all with morale ≥ 70 |
| **The Dreaded** | Reach a Dread score of 75 or higher |
| **The Wyrm of Commerce** | Sell 10 or more hoard items at auction |
| **The Undefeated** | Defeat 10+ adventurers with zero combat losses |
| **The Peacemaker** | Bring all rival relationships to 70 or above |

Multiple titles can be earned per run; the most recently earned title is shown at any given time.

### Rumours

The Game Hub displays a live **Rumours** panel — context-aware flavour text generated from your current game state. Rumours surface information about active incursions, recent rival property seizures, kobold morale trends, economy highs, and approach of the next season change.

---

## Win & Lose Conditions

- **Win** — Own properties equal to or exceeding your difficulty's win threshold (30 / 50 / 75). The win screen triggers immediately on purchase.
- **Lose** — Gold reaches 0 at any evening resolution. The lose screen shows a summary of your run.

---

## UI & Controls

### Top Bar (always visible during play)

| Element | Description |
|---|---|
| Dragon name + Day | Identity and current day counter |
| Earned Title | Most recently unlocked title, shown beneath the dragon's name |
| Age Tier bar | Five gold segments; current + passed segments glow |
| Gold (coin icon) | Current gold, formatted with thousands separators |
| Dread meter | Colour-coded fill bar with label and hover tooltip |
| Incursion badge | Pulsing red badge when hero parties are active |
| Status effect icons | Emoji icons for active status effects (hover for detail) |
| Time of Day | Morning / Afternoon / Evening indicator |
| ? button | Opens the About / How to Play modal |
| ⚙ Options button | Opens the Options modal |

### Options Modal

Accessible via the gear icon at any time during play:

- **Save** — Displays current dragon, day, and property count. Progress auto-saves with every action (Zustand persist → localStorage key `hoard-holdings-save`). The "Confirm Save" button provides a visual confirmation flash.
- **New Game** — Two-step confirmation to wipe the current run and start fresh.
- **Back to Title** — Returns to the title screen without erasing progress.
- **Sound** — Collapsible section with two independent sub-panels: **SFX** (mute toggle + volume slider; keys `hoard-holdings-muted` / `hoard-holdings-volume`) and **Music** (mute toggle + volume slider; keys `hoard-holdings-music-muted` / `hoard-holdings-music-volume`).

### Game Chronicle (bottom bar)

The last 3 log entries are shown at the bottom of every screen, stamped with `[Day N · timeofday]`.

### World Map

The Game Hub includes an interactive SVG world map showing all districts. Properties are colour-coded by owner (player / rival / unclaimed). Clicking a property pin opens a popup with name, price, and a direct "Buy" link to the Real Estate screen with that property highlighted.

### Dragon Ability Panel

Displayed in the Game Hub below the action buttons. Shows the ability available at your current tier with a **Use** button (greyed out if already used today). The cooldown resets each morning.

---

## Audio

All sound and music is synthesised at runtime using the **Web Audio API** — no external audio files are required.

### Sound Effects

| Sound | Trigger |
|---|---|
| `coinPickup` | Winning combat, selling at auction, buying from rival |
| `coinLoss` | Losing combat, buying a property |
| `diceRoll` | Rolling in the combat screen |
| `pageFlip` | Navigating between screens |
| `koboldCheer` | Hiring a kobold |
| `dragonRoar` | Age tier celebration events |
| `alert` | Event modal appears |
| `uiClick` | Button presses within modals |
| `uiOpen` | Opening a modal or overlay |
| `uiClose` | Closing a modal or overlay |

### Music

A procedural ambient music engine plays a continuously looping score with three context-aware tracks that crossfade when you move between areas:

| Track | Context | Character |
|---|---|---|
| **Ambient** | Game Hub, exploration screens | A minor, 76 BPM, sustained sawtooth drone |
| **Combat** | Hunt Adventurers screen | E minor, 112 BPM, driving off-beat bass hits, no drone |
| **NPC** | Bank, Inn, Law Office, Rival screen | C major, 58 BPM, soft and conversational |

Music volume and mute state are persisted separately from SFX to localStorage keys `hoard-holdings-music-muted` and `hoard-holdings-music-volume`.

---

## NPC Portraits

Procedural **Canvas 2D** pixel art portraits (32×32, rendered at configurable display sizes) are drawn at runtime for six NPC archetypes:

- Goblin Realtor (Grixle)
- Gnoll Agency Rep
- Dragonborn Banker
- Elven Lawyer
- Halfling Innkeeper
- Rival Dragon

Each archetype uses a species-specific colour palette. Adventurer portraits use a separate generator for hero party members with class-specific palettes. Kobold avatars are rendered via `KoboldAvatar.tsx` using species colours.

---

## Tech Stack

- **Vite 6** — build tooling and dev server
- **React 19** — UI framework
- **TypeScript 5.8** — full type safety; `tsc --noEmit` produces zero errors
- **Tailwind CSS v4** — utility styling via `@tailwindcss/vite`
- **Zustand 5** — global game state with `persist` middleware (localStorage save)
- **Recharts** — gold history line chart on the Auction screen
- **Lucide React** — icon library
- **Web Audio API** — synthesised sound effects (no external audio files)
- **Google Fonts** — Cinzel (headings, 400/600/700/900) + Crimson Text (body)

### Project Structure

```
src/
├── audio/          audioEngine.ts — Web Audio synthesiser, mute/volume persistence
├── components/
│   ├── economy/    EconomyChart, EconomyIndicator, EconomyTicker
│   ├── events/     EventModal — FIFO pending-event overlay
│   ├── map/        WorldMap, DistrictPanel, PropertyPin
│   ├── npcs/       NPCPortrait, AdventurerPortrait, KoboldAvatar
│   └── ui/         AboutModal, ContractCard, DragonAbilityPanel,
│                   HoverTooltip, OptionsModal
├── data/           districts, dragonAbilities, dragonBreeds, economyIndex,
│                   heroParties, koboldWages, lairRooms, npcTemplates,
│                   propertyUpgrades, seasonalEvents, titles
├── dialogue/       claudeDialogue, dialogueEngine + per-NPC trees
│                   (realtor, banker, lawyer, innkeeper, rival)
├── engine/         councilMotions, economyEngine, gameClock, incursionEngine,
│                   randomEvents, rivalAI, rumoursEngine, seasonalEvents,
│                   statusEffects
├── layouts/        GameLayout — top bar, chronicle, event/options overlays
├── screens/        TitleScreen, IntroScreen, GameHub,
│                   RealEstateScreen, KoboldAgencyScreen, KoboldManagementScreen,
│                   CombatScreen, RivalScreen, AuctionScreen,
│                   LairScreen, ExpeditionScreen, DungeonScreen, SabotageScreen,
│                   BlackMarketScreen, BankScreen, InnkeeperScreen, LawyerScreen,
│                   WinScreen, LoseScreen
├── store/          gameStore.ts — Zustand store + all game actions
└── types/          index.ts — all shared TypeScript interfaces
```

---

## Dataset Credits

- **Property listings** — derived from the Boston Real Estate dataset (Kaggle), scaled and flavour-renamed for fantasy use
- **Hero parties & monsters** — derived from the D&D 5e SRD monster dataset (Open5e)
- **Dragon breeds & stats** — derived from the How to Train Your Dragon species dataset
- **Economy price index** — derived from the Dragon Age companion approval dataset (reshaped as a cyclical multiplier series)
- **Kobold wages** — hand-tuned based on the DnD Monsters CR/XP curve
- **Dragon names** — procedurally generated prefix/suffix pools inspired by fantasy naming conventions
