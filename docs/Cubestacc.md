# Cubestacc — Architecture & Algorithms

Fan recreation inspired by [STACCS](https://sticcy.cc/). **Not affiliated** with the publisher.  
**Play:** [Cubestacc.html](../Cubestacc.html) · PeerJS online + solo bots · shared kit in [`shared/`](../shared/README.md)

Technical notes on **what was hard**, the architecture chosen, and the algorithms that make the cube stack work in 2D.

---

## Overview

> “Cubestacc is a real-time multiplayer card game in one HTML file. The hard part isn’t networking — it’s making a **physical 3D cube stack** playable in a **2D browser** without WebGL. I separate **rules space** (integer 3D cells on a parent tree) from **view space** (isometric SVG + painter’s sort + local camera yaw), and run a **host-authoritative P2P** model so every client sees a private hand but one shared board.”

That separation is the core design insight.

---

## Challenges I faced

| Constraint | Why it was hard |
| --- | --- |
| Cards are **cubes** with TOP / FACE / SIDE | Matches depend on *which face* you attach to |
| Screen is **2D** | Cubes overlap; “looks blocked” ≠ “is blocked” |
| Players can **rotate the view** | Glow / drag must follow camera, not fixed left/right art |
| **Online, no game server** | Need authority, private hands, reconnect |
| Mobile + desktop | Same rules engine, different chrome |

Wrong approach: treat the board as a flat list of sprites and block plays on pixel overlap.  
Right approach: **two coordinate systems** + one authoritative state machine.

---

## System architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (single page)                    │
│  shared/kit.js  → lobby, QR, PeerJS ICE, warm-up, toasts    │
│  Cubestacc.html → rules, STACC graph, SVG cubes, UX         │
└───────────────────────────┬─────────────────────────────────┘
                            │ WebRTC DataChannels (PeerJS)
              ┌─────────────┴──────────────┐
              │  Host (authoritative)       │  Guests (views only)
              │  • full deck + all hands    │  • own hand only
              │  • validate plays           │  • send intents
              │  • broadcast per-player     │  • render playerView
              │    private views            │  • local camera only
              └─────────────────────────────┘
```

### Why host-authoritative P2P (not a server)

| Option | Pros | Cons | Choice |
| --- | --- | --- | --- |
| Central game server | Easy anti-cheat | Cost, latency, deploy | Skip for a static Netlify site |
| Fully peer CRDT | No host | Conflict hell for turns | Too heavy |
| **Host browser = room** | Zero backend, simple turns | Host tab must stay open | **Chosen** (same as Uno/Dobble in this repo) |

**Pattern:** guests send *actions* (`play`, `draw`, `caught`…). Host runs `applyPlay` / `legalPlays`, then `playerView(game, id)` strips other players’ cards and pushes state.

**Privacy:** never broadcast full hands. Each guest only receives `you.hand` + public STACC + counts.

**Identity:** seat token in `localStorage` + optional unique name → mid-game rejoin after a short drop grace (~10s).

---

## Domain model (data structures)

The STACC is not an array of “cards on a table.” It is a **rooted tree** of placed nodes:

```
placedNode = {
  id, card, parentId, mode,   // topology (source of truth)
  px, py,                     // cached screen (derived)
  coverTop, coverSide, coverFace,
  chosenSuit?                 // wild pivot
}

tip = open attach points on a node (blockTop / blockSide / blockFace)
```

| Concept | Structure | Meaning |
| --- | --- | --- |
| Placement graph | Parent pointer tree | “DAG/tree of attachments; each edge is a mode” |
| Occupancy | Map of `(x,y,z) → node` | “Sparse 3D grid keyed by cell address” |
| Tips | Open faces per node | “Frontier of legal moves” |
| Hands / deck | Arrays | Classic card state |
| Pending K/J | Counters on game | Stacked effects like Uno draw-twos |

**Invariants**

1. Layout pixels are **derived** from `(parentId, mode, viewRot, hexMetrics)` via `reflowBoard`.  
2. Legality uses **cells**, never pixel collision.  
3. Guests may ignore host `px/py` and reflow locally for their camera.

---

## Dual spaces: rules vs view (core idea)

```
        RULES SPACE                         VIEW SPACE
   ┌──────────────────┐               ┌──────────────────┐
   │ Integer cells    │               │ Isometric SVG    │
   │ (x,y,z)          │   reflow +    │ hex tiles        │
   │ mode deltas      │ ───────────►  │ paintScore sort  │
   │ slotOccupied()   │   camera yaw  │ glow / drag bias │
   └──────────────────┘               └──────────────────┘
         ▲                                      │
         │ legalPlays / applyPlay               │ user sees & drags
         └────────────── same game state ───────┘
```

### A. View offsets (isometric projection by convention)

Attach modes are fractions of cube size, then scaled:

| Mode | Ratio `(rx, ry)` | Intuition |
| --- | --- | --- |
| `top` / `wild` | `(0, -0.6)` | Up the column |
| `side` | `(+0.6, +0.32)` | Rank branch (down-right @ 0°) |
| `face` | `(-0.6, +0.32)` | Face branch (down-left @ 0°) |

```
px' = px_parent + round(rx × hexW)
py' = py_parent + round(ry × hexH)
```

**Camera yaw (`viewRot` ∈ {0,1,2,3}):** cycle side/face vectors in 90° steps; keep `top` “up.” This is a **local client transform** — multiplayer rules stay identical.

**Rationale:** “I didn’t rotate the 3D world; I remapped the 2D basis vectors and reflowed the tree. Cheaper than a scene graph, enough for gameplay.”

### B. Rules cells (discrete lattice)

Walk the parent chain; each mode adds a unit step:

| Mode | Δ cell |
| --- | --- |
| `top` / `wild` | `(0, +1, 0)` height |
| `side` | `(+1, 0, 0)` |
| `face` | `(0, 0, +1)` |
| `start` | `(0, 0, 0)` |

```
key = "x,y,z"
illegal iff key already occupied
```

**Complexity:** building a key is `O(depth)`; checking occupancy over `n` placed cubes is `O(n·depth)` naively (fine for a 60-card game; could memoize to `O(n)`).

**Rationale:** “Screen overlap is a presentation bug class. Occupancy is a set-membership problem on a sparse grid.”

### C. Tips stay partially open

Playing ↑ only sets `blockTop`. SIDE/FACE remain until filled (`ensureOpenTips`).  
Example: `0♦` on `3♦` still allows another `3` → SIDE. That matches the physical cube and is easy to get wrong if you delete the whole tip.

---

## Core algorithms

### 1. Legal move generation — `legalPlays`

```
for each card in hand:
  for each active tip:
    modes = modesFor(card, tip)     // suit→top, rank→side, face→face, wild→wild
    keep modes where !slotOccupied(cell of tip+mode)
```

Filters: pending King stack (only K may play), same-rank dump (`chainRank`), turn ownership.

**Complexity:** `O(|hand| · |tips| · depth)` — tiny at table size.

**Note:** “Move generation is exhaustive search on a small frontier, not AI. Bots just score the resulting list.”

### 2. Reflow — `reflowBoard`

Depth-first memoized walk from roots:

```
pos(node) =
  if start: origin
  else: pos(parent) + stackOff(mode, metrics)
```

After rotate/resize, **recompute all `px/py`**. Guests do the same with their `viewRot`.

**Rationale:** “Source of truth is topology; pixels are a cache. That’s the same idea as ‘layout from a scene graph.’”

### 3. Painter’s algorithm — `paintScore`

Isometric draws need a total order. Sort nodes by:

```
score =
  cellHeight     × 100_000   // higher in stack in front
+ ancestryDepth  × 1_000     // child over its parent
+ px×8 + py×10               // lower-right closer to camera
± tip / cover nudges
+ tiny playIndex             // stable tie-break
→ z-index = 100 + rank
```

**Rationale:** “Classic computer-graphics painter’s algorithm on a discrete isometric grid — no z-buffer, no WebGL, still reads as 3D.”

### 4. Camera-aware interaction — `visualFaceForMode`

Cube SVG art is fixed (TOP diamond, FACE left poly, SIDE right poly). After yaw, the *logical* SIDE may sit on the *left* of the screen.

```
visualFace(mode) =
  top → top
  else → sign(stackOffRatio(mode).x) ≥ 0 ? side : face
```

Glow CSS + drag bias + dir-pick arrows all use this map so UX matches the ghost preview.

**Rationale:** “I decoupled semantic face (rules) from illuminated polygon (UI) via a basis remapping — same idea as transforming normals with a camera matrix, but in 2D.”

### 5. Drag targeting

For each legal `(tip, mode)`, compute the **predicted slot** in client coords; pick nearest within snap radius; bias toward the approach side using `visualFaceForMode`.

### 6. Host view projection — `playerView`

```
view = {
  placed, tips, banner, turnId, deckCount, deckPack, …
  you: { hand, … },          // private
  players: [{ id, count }],  // public counts only
  legal: legalPlays(you),    // host-computed for that seat
  drawNotice?                // one-shot penalty explain
}
```

**Rationale:** “Projection functions are how you do multiplayer without leaking state — like GraphQL field resolvers, but for a card table.”

---

## Rendering pipeline (one frame)

1. `ensureOpenTips` — repair frontier from covers  
2. `reflowBoard` — derive pixels for current yaw  
3. Score + sort placed nodes (`paintScore`)  
4. Emit SVG hexes (suit icons from **deck pack** theme)  
5. Overlay tip glows for legal modes  
6. Hand strip: legal cards get drag / tap  

Deck packs (Classic / Space / Halloween / Nature / Animals) only swap **icon + palette**; suit *ids* stay `spades|hearts|clubs|diamonds` so rules stay theme-agnostic.

---

## Networking & resilience

| Concern | Approach |
| --- | --- |
| Authority | Host applies mutations |
| Sync | Full private view per guest after each action |
| Drop | Mark seat disconnected; skip in `advanceTurn` |
| Rejoin | Token / unique name remaps peer → seat |
| Guest reconnect | Exponential backoff, cap (~8 tries), clear Leave CTA |
| Empty pile | Honest `draws X of Y`; optional Pass when stuck |

**Tradeoff:** full-state broadcast is simple and correct; for larger games you’d diff or event-source. At 5 players × 60 cards, payload size is irrelevant.

---

## Performance choices (what you optimized)

| Technique | Why |
| --- | --- |
| Cache `hexMetrics` until resize | Avoid temp DOM measure every drag frame |
| `legalPlays` skips full reflow | Occupancy doesn’t need pixels |
| Discrete cells not hit-tests | O(n) set check beats geometry |
| SVG not Canvas/WebGL | Crisp cubes, CSS glow, tiny code |
| Single HTML file + shared kit | Deployable static site; games share lobby chrome |

---

## Design patterns you can name

1. **Authoritative server (browser-hosted)** — one writer of truth  
2. **Command / intent messages** — guests propose, host commits  
3. **View projection** — per-seat DTOs  
4. **Derived layout** — topology → pixels (like React layout from state)  
5. **Painter’s algorithm** — explicit depth sort  
6. **Basis remapping** — camera yaw without 3D engine  
7. **Theme as skin** — pack icons over stable suit enums  
8. **Graceful degradation** — empty deck, disconnect skip, reconnect cap  

---

## Walkthrough

1. **Start solo** → show TOP / SIDE / FACE attach.  
2. **Stack ↑ then still play SIDE** → “tips are partial; not a single discard pile.”  
3. **Rotate ↺** → glow moves with camera; rules unchanged.  
4. **Overlap two branches on screen** → both still legal → “cells ≠ pixels.”  
5. **Create room + deck theme** → host chooses Space; guest sees rockets.  
6. **King stack** → Draw N + explain modal → stacked effects.  
7. (Optional) Kill guest network briefly → rejoin via seat token.

---

## Design decisions & FAQ

**Q: Why not Three.js?**  
A: Rules don’t need a mesh. Isometric SVG + sort gives readability, accessibility, and a tiny bundle. I’d reach for WebGL if I needed free camera orbit or lighting.

**Q: How would you scale to 1000 rooms?**  
A: Move authority to a small Node service (same `applyPlay` pure functions), keep clients dumb. PeerJS was a product constraint (static hosting), not a religion.

**Q: Cheating?**  
A: Host can cheat today. Mitigations: server authority, signed state, or spectator audit log. Call it out honestly.

**Q: Worst bug you hit?**  
A: Treating screen overlap as illegal, and lighting the wrong cube face after yaw — both fixed by splitting rules space from view space.

**Q: Complexity of a play?**  
A: Validate `O(|tips|·depth)`, mutate tree `O(1)`, reflow `O(n)`, paint sort `O(n log n)`. Dominated by DOM paint, not CPU.

---

## Rules appendix (short)

**Goal:** empty your hand first. **Deck:** 60 (4 suits × 14 ranks + 4 wilds).

Reference deck art: [`assets/images/cubestacc-deck-ref.png`](../assets/images/cubestacc-deck-ref.png)

| Match | Face |
| --- | --- |
| Same suit | TOP |
| Same rank | SIDE |
| Same face card | FACE |

| Card | Effect |
| --- | --- |
| J | Next draws 1, then plays |
| Q | Skip |
| K | +2 stackable |
| A | Extra turn |
| 0 | Reverse + block TOP |
| Wild | Pivot tips + choose suit |

**UH OH!** at 2 cards before going to 1; **Caught** → +3.

Controls, lobby themes, and UI chrome: see in-game **?** and **◇**.

---

## Summary to close

> “Cubestacc is a small game, but the engineering is a clean **rules/view separation**, a **sparse 3D occupancy grid** on a placement tree, a **painter’s depth sort**, and **host-authoritative P2P** — the same ideas you’d use in a bigger real-time multiplayer client, just distilled into one file you can ship on Netlify.”
