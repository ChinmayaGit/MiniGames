# Cubestacc

Fan recreation inspired by the commercial card game [STACCS](https://sticcy.cc/) (STICCY©© / Dave Chau). **Not affiliated** with the publisher. Original cube UI and name; mechanics follow the published rulebook essentials plus public how-to sources where the supplied PDF ends.

**Play:** [Cubestacc.html](Cubestacc.html) · **Status:** Online rooms (PeerJS) + solo vs bots

In-game: tap **?** for how-to. Tap **◇** for UI chrome colors. **Deck theme** (Classic / Space / Halloween / Nature / Animals) is chosen when you create a room or start solo — it swaps the suit icons on every cube and syncs to the lobby.

---

## Online

Same pattern as Uno / Dobble: **no server**. The host browser is the room (`cubestacchost-CODE` on PeerJS). Guests connect to the host; the host validates plays and broadcasts each player’s private view (own hand + shared STACC).

1. Host: **Create room** → share code / link / QR.  
2. Friends: open the same page → **Join** (or open `?room=ABCD`).  
3. Host taps **Start game** when everyone is in (2–5 players).  
4. Keep the host tab open for the whole match.

**Practice solo** still deals bots locally with no lobby.

---

## Controls (this build)

| Action | How |
| --- | --- |
| Play | Drag a **legal** (glowing) hand cube onto a tip face, or tap the card then pick a side |
| Attach sides | **↑ TOP** same suit · **→ SIDE** same rank · **← FACE** same face (J/J, Q/Q…) |
| Pan board | Drag empty wood |
| Rotate view | **↺ ↻** — local camera only (does not change rules) |
| Same-rank dump | After a play, if you still have that **same rank** legal, keep playing; tap **Done** to end your turn |
| No match | **Draw** — take **1**, turn ends (drawn card not playable same turn) |
| King penalty | After **K** (stackable +2 each), **Draw** takes the **whole stack** (2, 4, 6…). Button shows **Draw N** + explain popup |
| Jack | Next player auto-draws **1**, then still takes their turn |
| UH OH! | At **2** cards left, tap before going to 1 |
| Caught | If someone reaches 1 without UH OH!, tap **Caught** → they draw **3** (+ explain popup) |
| Look | **◇** UI chrome (Sky / Ocean / Wood / Neon / Midnight) + cube paint |
| Deck theme | On home / lobby: **Classic · Space · Halloween · Nature · Animals** — changes suit icons for the whole table |

---

## Sources

| Source | Used for |
| --- | --- |
| User PDF `STACCS_RULEBOOK.pdf` (7 pages) | Ages, player count, deck makeup, setup, turn loop, win condition, cube TOP / FACE / SIDE, match-by-suit |
| [sticcy.cc](https://sticcy.cc/), Ludopedia, public how-to reviews | Match-by-number, match-by-face, wild pivot, UH OH!, special effects |

The PDF stops at **Match by Suits**. Remaining match rules and specials are reconstructed below and marked where inferred.

---

## Goal

First player to play every card in their hand wins.

## Deck (60)

- 4 suits: spades, hearts, clubs, diamonds  
- Per suit: **0**, **2–10**, **J, Q, K, A** → 14 × 4 = 56  
- **4 wilds** (no suit / rank)  
- Total **60**

## Setup

1. Shuffle. Deal **7** each (or **5** if 5 players).  
2. Rest = draw pile.  
3. Flip until a **number card (2–10)** starts the STACC. Specials (J/Q/K/A/0/wild) go back into the pile; reshuffle.  
4. Play starts left of dealer, clockwise.

## Turn (official essentials)

1. If you have a legal match → **you must play** (STACC IT).  
2. If not → **draw 1**, then turn ends (drawn card is **not** playable that same turn).  
3. Next player.

### Draw button (this build)

| Situation | Cards you get |
| --- | --- |
| No legal match | **1**, then turn ends |
| Pending **K** stack | The **full penalty** — each K adds **+2** → 2, 4, 6, 8… (button label **Draw N** + popup) |
| Play a **K** yourself while a stack is pending | Stack more (+2); don’t take the draws yet |
| **J** on you | Auto **+1**, then you still play (not via Draw) |
| **Caught** | **+3** (Caught button, not Draw) + popup |

## Matching (3D)

Treat each card as a cube with **TOP**, **FACE**, **SIDE**:

| Match | Attach on | Screen direction (default view) |
| --- | --- | --- |
| Same **suit** | **TOP** (↑) | Straight up |
| Same **rank** | **SIDE** (→) | Down-right |
| Same **face** (both J, or both Q, …) | **FACE** (←) | Down-left |

Stacking **↑ TOP** only closes that tip’s top. Its **SIDE / FACE** stay open until used (so after **0♦** on **3♦**, you can still play another **3** → SIDE).

**Wild:** may attach to any open tip, then **rotates** the active build: older tips stay visible but are no longer legal; caller **chooses the suit** for the new tip.

**Zero:** when played, that tip’s **TOP is blocked** (no suit-stack on it). Zero also **reverses** turn order (public sources).

**Adjacency / blocked slots:** a play must match the tip. A slot is blocked only if that **exact stack cell** is already filled (same TOP/SIDE/FACE address). Neighbor cubes that only overlap on screen do **not** block the match.

### Same-rank dump (Done)

If after you play you still hold **another card of that same rank** that can legally attach somewhere on the STACC, your turn continues (banner: keep going or **Done**).

- Play as many of that rank as you can (or want).  
- Tap **Done** to end the dump and pass the turn.  
- If nothing of that rank remains legal, the turn ends on its own.  
- Does **not** apply after **Wild**, **Q** (skip), or while resolving an **A** extra-turn the same way — wilds/specials follow their own turn flow.

Example: play **6♥**, still hold a legal **6♠** → you may play it, then **Done**.

## Specials (inferred mapping)

Icons / reviews describe Uno-like chaos on 0 / J / Q / K / A. Exact Queen text was not in the 7-page PDF; Cubestacc uses:

| Card | Effect |
| --- | --- |
| **J** | Next player draws **1**, then still takes a normal turn |
| **Q** | **Skip** next player *(inferred)* |
| **K** | Next player draws **2**; another **K** may stack → draw 4, etc. |
| **A** | **Extra turn** (1-up) |
| **0** | **Reverse** + block TOP on that tip |
| **Wild** | Pivot STACC + choose suit |

Solo / bot practice uses these abilities. A future mode can turn abilities off (true SOLOSTACCS style).

## UH OH!

When you drop to **one** card, call **UH OH!** (button). If you play to one without calling and someone taps **Caught**, you draw **3**.

## Modes in this build

- **Online rooms** — PeerJS host-authoritative, up to 5 players. Guests can **rejoin** mid-game with the same seat token / name (10s drop grace). Host must keep their tab open.  
- **Solo vs bots** — local practice, no lobby  
- **Themes / editions** — local look prefs (`localStorage`)

---

## Visual cards

Board and hand use **hexagonal isometric tiles** (SVG), matching the physical STACCS cube silhouette from the deck art:

- **TOP** diamond — suit  
- **FACE** (left) — suit (+ hat/crown on J/Q/K/A)  
- **SIDE** (right) — rank  
- **Wilds** — blue cube with pixel face  

Active tips stay bright; buried cubes dim. Suit-tinted faces help scan a busy stack (edition can change the palette).

Reference: `assets/cubestacc-deck-ref.png`

---

## How the 3D stack is made “visually possible” (math & algorithms)

Physical STACCS is a real 3D pile. The browser is a **2D plane**, so Cubestacc fakes depth with layout offsets, discrete cells, and a painter’s algorithm.

### 1. Cube faces → screen directions

Each attach mode is a fixed offset as a **fraction of cube width/height** (`STACK_OFF_RATIO`), then scaled by measured hex size:

| Mode | Ratio `(x, y)` | Meaning |
| --- | --- | --- |
| `top` / `wild` | `(0, -0.6)` | Up the column |
| `side` | `(+0.6, +0.32)` | Rank branch (down-right) |
| `face` | `(-0.6, +0.32)` | Face branch (down-left) |

```
px_child = px_parent + round(ratio.x * hexW)
py_child = py_parent + round(ratio.y * hexH)
```

**View rotate (↺ ↻)** cycles side/face vectors in 90° steps while keeping `top` pointing up — a local camera yaw, not a rule change. Positions are **reflowed** from the parent chain after rotate.

### 2. Discrete 3D cell address (legality / occupancy)

Screen overlap is *not* the same as “same seat.” Each placed cube gets an integer cell from walking its parent chain:

| Mode | Cell delta |
| --- | --- |
| `top` / `wild` | `(0, +1, 0)` height |
| `side` | `(+1, 0, 0)` |
| `face` | `(0, 0, +1)` |
| `start` | `(0, 0, 0)` |

A proposed play is **illegal** only if another cube already occupies that exact `(x,y,z)` key (`slotOccupied`). Neighbor cubes that only *look* overlapping on the isometric drawing stay legal.

Tips: any cube with an open TOP/SIDE/FACE stays a tip (`ensureOpenTips`). Playing ↑ only sets `blockTop`; SIDE/FACE remain until filled.

### 3. Paint order (z-index) — who draws on top

Isometric contradiction is fixed with a scored sort, not play order alone:

```
score =
  height * 100000          // higher in the STACC wins
  + ancestryDepth * 1000   // child (face/side/top) over its parent
  + px * 8 + py * 10       // lower-right reads closer to camera
  + tipBoost - coverPenalties
  + tiny playIndex tiebreak
```

Then DOM `z-index = 100 + paintOrderIndex`.

So: **4♥** up on the left column stays *behind* **8♦** on a right branch at the same height; a **J♦** attached ← FACE still paints in front of its parent **J♥**.

### 4. Reflow vs stored pixels

Online guests may receive host `px/py`, but the source of truth for layout is **`parentId` + `mode`**. `reflowBoard` rebuilds coordinates for the current `viewRot` and metrics so everyone stays consistent.

### 5. Interaction helpers

- **Legal glow** — `modesFor` ∩ free cell; after rotate, glow uses `visualFaceForMode` so the lit polygon matches screen direction.  
- **Drag targeting** — nearest glowing tip under the pointer (bias follows rotated side/face).  
- **Penalty popup** — only when Draw takes a **K** stack (or Caught +3), listing why the count is > 1.  
- **Empty pile** — no discard recycle; banners report `draws X of Y (deck empty)`; top bar shows **Pile · N**.

This is how a tabletop cube pile becomes a readable, playable 2D STACC without a WebGL scene.
