# Cubestacc

Fan recreation inspired by the commercial card game [STACCS](https://sticcy.cc/) (STICCY©© / Dave Chau). **Not affiliated** with the publisher. Original cube UI and name; mechanics follow the published rulebook essentials plus public how-to sources where the supplied PDF ends.

**Play:** [Cubestacc.html](Cubestacc.html) · **Status:** Solo vs bots (online rooms later)

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

## Matching (3D)

Treat each card as a cube with **TOP**, **FACE**, **SIDE**:

| Match | Attach on | Rule |
| --- | --- | --- |
| Same **suit** | **TOP** | Official (PDF) |
| Same **rank** | **SIDE** | Public rules |
| Same **face** (both J, or both Q, …) | **FACE** | Public rules |

**Wild:** may attach to any open tip, then **rotates** the active build: older tips stay visible but are no longer legal; caller **chooses the suit** for the new tip.

**Zero:** when played, that tip’s **TOP is blocked** (no suit-stack on it). Zero also **reverses** turn order (public sources).

**Adjacency (simplified digital rule):** a play must match the chosen tip; tight two-neighbor “must match both” slots from physical play are approximated by tip-based legal moves so the browser game stays clear.

**Same-rank dump:** if you play by rank (or continue on a tip of that rank), you may play **additional cards of that same rank** before ending your turn.

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

- **Solo vs bots** — primary  
- **Online rooms** — not yet (same kit as Uno later)

---

## Visual cards

Board and hand use **hexagonal isometric tiles** (SVG), matching the physical STACCS cube silhouette from the deck art:

- **TOP** diamond — suit  
- **FACE** (left) — suit (+ hat/crown on J/Q/K/A)  
- **SIDE** (right) — rank  
- **Wilds** — blue cube with pixel face  

Reference: `assets/cubestacc-deck-ref.png`

