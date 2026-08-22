# Uno Flip — Architecture & Algorithms

Double-sided Uno variant in one HTML file (`unoflip.html`).  
**Play:** [unoflip.html](../unoflip.html) · Same PeerJS lobby / voice / UNO / Caught as [Uno](Uno.md) · shared kit in [`shared/`](../shared/README.md)

Rooms use a **different Peer prefix** than classic Uno — Flip and Uno tables never mix.

---

## Overview

> “Uno Flip extends the same host-authoritative engine with a **dual-face card model**: each physical card is one ID with Light and Dark faces. Playing **Flip** is a global transform — every hand, the draw pile, and the discard remap through `faceOf(card, side)` while stacking rules switch to a second matrix (+1/+2 light vs +5/wild-color dark). It’s the same networking story as Uno, plus a **side-indexed state machine**.”

---

## Challenges I faced

| Constraint | Why it was hard |
| --- | --- |
| 112 cards × 2 faces | Must not duplicate IDs or desync sides |
| Flip affects **everyone** | Atomic `side` toggle + color remap |
| Different actions per side | Two legality tables, one engine |
| Same UX as Uno | Reuse patterns: stack FSM, UNO window, views |

---

## System architecture

Identical to Uno:

- Peer ID: `unofliphost-CODE` (not `unohost-`) so Flip and classic Uno tables never mix  
- Guests send intents; host validates; `playerView` strips hands  
- Seat token rejoin, Caught window, optional mic, NAT tips  

Difference is **almost entirely in the rules/card model**.

---

## Domain model — dual faces

```
card = { id, light: Face, dark: Face }
Face = { color, value/type }   // number | skip | reverse | draw* | flip | wild*

game.side ∈ { "light", "dark" }
faceOf(g, card) = card[g.side]
```

**Rationale:** “One identity, two presentations — like a polymorphic record or a double-buffered sprite. Flip flips the buffer for the whole table.”

### Deck sketch

| Side | Colors | Numbers | Specials |
| --- | --- | --- | --- |
| **Light** | R/Y/G/B | 1–9 (×2), no 0 | Skip, Reverse, Draw One (+1), Flip, Wild, Wild +2 |
| **Dark** | Pink/Teal/Orange/Purple | 1–9 (×2) | Skip Everyone, Reverse, Draw Five (+5), Flip, Wild, Wild Draw Color |

Total **112** physical cards.

---

## Core algorithms

### 1. Global flip — `flipTable`

```
g.side = opposite(g.side)
top = faceOf(g, discardTop)
currentColor = top.color if not wild else mapColorToSide(oldColor, g.side)
```

Hands don’t rewrite card objects — **rendering and legality read through `faceOf`**. Guests just receive `side` in the view and paint the other face.

**Rationale:** “Flip is O(1) state + O(n) repaint, not O(n) card mutation. That avoids desync (‘my 7 became your skip’).”

### 2. Color mapping across sides

Light and dark palettes are parallel arrays. `mapColorToSide` preserves index so a chosen wild color survives a flip semantically (red↔pink, etc.).

### 3. Legality — `canPlayCard` (side-aware)

Same structure as Uno, but values depend on `faceOf`:

- Match color or value on **current** side  
- Flip is always special (playable per house rules when legal like other actions)  
- Wild Draw Color / +5 only on dark; +1 / Wild +2 on light  

### 4. Stacking matrices (two FSMs, one pending counter)

| Side | Stack family | Rules of thumb |
| --- | --- | --- |
| Light | +1 / Wild +2 | +1 with +1 or Wild +2 |
| Dark | +5 / Wild Draw Color | +5 with +5 or Wild Draw Color |

Cross-family stacking is rejected. Wild Draw Color: next player draws until they receive the chosen color (loop on draw pile with reshuffle).

**Rationale:** “Pending draw is still `(amount, kind)`; kind is an enum that grows with the side’s card set — open-closed for effects.”

### 5. Skip Everyone

Dark skip-all ⇒ current player effectively gets another turn (advance 0 / extra flag) rather than skipping one neighbor — different from classic Skip.

### 6. View projection

`playerView` includes `side` + faces for your hand and discard top so guests don’t need the dual card table locally beyond what’s sent (or send both faces once at deal — either way host owns truth).

---

## What you reuse vs invent

| Reused from Uno | New in Flip |
| --- | --- |
| Host authority, PeerJS lobby | `light`/`dark` faces |
| UNO / Caught window | `flipTable` + color map |
| + stack prompt UX | Two stacking matrices |
| Reconnect / away / voice | Skip Everyone, Draw Color |

**Rationale:** “Product fork with a shared protocol — good example of keeping networking stable while swapping the rules module.”

---

## Design patterns to name

1. **Double buffering / dual representation** per card  
2. **Strategy by side** for legality & stacking  
3. **O(1) world transform** (flip) vs per-card edits  
4. Same host-authoritative + projection patterns as Uno  

---

## Walkthrough

1. Play on Light → show +1 stack.  
2. Play **Flip** → whole table colors change; discard face flips.  
3. Show Dark +5 / Wild Draw Color.  
4. Skip Everyone → you go again.  
5. Note separate room prefix from classic Uno.

## Design decisions & FAQ

**Q: Why not two decks?**  
A: Physical Flip is one card with two faces. Dual face on one ID preserves shuffle identity across flips.

**Q: Bandwidth?**  
A: Sending `side` + card ids is enough if both faces are known from the initial deck definition embedded in the page.

---

## Rules appendix (short)

Call **UNO!** at 2 cards; **Caught!** window like Uno. First empty hand wins. Light: +1 / Flip / Wild +2. Dark: +5 / Skip Everyone / Wild Draw Color / Flip.

## Summary

> “Uno Flip is the Uno networking shell with a dual-face card model and an O(1) global side flip — two rule tables, one authoritative engine.”
