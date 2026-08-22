# Dobble — Architecture & Algorithms

Real-time multiplayer [Dobble / Spot It!](https://en.wikipedia.org/wiki/Dobble) in one HTML file (`Dobble.html`).  
**Play:** [Dobble.html](../Dobble.html) · PeerJS online + solo · shared kit in [`shared/`](../shared/README.md)

Technical notes on the **finite-geometry deck**, match validation, and **host-authoritative P2P** multiplayer.

---

## Overview

> “Dobble looks like a reaction game, but the deck is **finite projective geometry of order 7**. Every pair of cards shares **exactly one** symbol by construction — I don’t search for matches at deal time; the math guarantees them. Multiplayer is **host-authoritative WebRTC**: guests only send clicks; the host validates intersection and broadcasts private views so hands never leak.”

---

## Challenges I faced

| Constraint | Why it was hard |
| --- | --- |
| Any two cards must share **exactly one** symbol | Can’t randomly assign emojis |
| Race to tap first | Need lock + round IDs or desync |
| Private top cards | Can’t broadcast full hands |
| Same card layout on every client | Highlight must land on the same glyph |
| Static hosting | No game server |

---

## System architecture

```
┌──────────────────────────────────────────────┐
│  Dobble.html + shared/kit.js                 │
│  Editions = emoji skins over fixed indices   │
└───────────────────┬──────────────────────────┘
                    │ PeerJS  (dobblehost-CODE)
         ┌──────────┴──────────┐
         │ Host = authority     │ Guests = intents
         │ deck, center, hands  │ click {symbol, round}
         │ freeze / scores      │ playerView only
         └──────────────────────┘
```

Same lobby pattern as Uno / Cubestacc: 4-letter code → `dobblehost-ABCD`, invite `?room=`, QR, host tab must stay open.

---

## The math (core idea)

Dobble ≈ a **finite projective plane** of order **n = 7**:

| Quantity | Formula | Value |
| --- | --- | --- |
| Symbols per card | `n + 1` | **8** |
| Total symbols | `n² + n + 1` | **57** |
| Total cards | `n² + n + 1` | **57** |

### Construction — `generateDeck(n)`

Classic affine / projective block design (indices, not emojis yet):

1. Starter card `[0, 1, …, n]`  
2. `n` cards that all share symbol `0`, plus fresh symbol blocks  
3. `n × n` cards via **modular arithmetic** so ∀ cards `A ≠ B`, `|A ∩ B| = 1`

**Rationale:** “The deck is a combinatorial design. Correctness is a proof, not a unit test that happens to pass.”

### Emoji permutation (editions)

At deal, host shuffles a bijection `{0…56} → emoji IDs` for the chosen pack (Classic, Harry Potter, Disney, …). Remapping preserves intersections:

```
intersection(cardA, cardB)  // on indices
→ same unique match after emoji remap
```

**Rationale:** “Themes are a skinning layer over stable IDs — like i18n keys vs translated strings.”

### Match check — `O(k)` with k = 8

```
intersection(a, b) = symbols in a that appear in b   // expect length 1
```

Host accepts a click only if `symbol === intersection(hand[0], center)[0]`.

---

## Domain model

```
game = {
  center,          // public card
  players[].hand,  // private stacks (top card is playable)
  round,           // monotonic; stale clicks ignored
  locked,          // brief highlight lock after a hit
  frozenUntil[id], // miss penalty
  edition          // emoji pack id
}
```

**Win condition (Tower / well variant):** empty your stack first. Correct tap → your top card becomes the new center.

---

## Core algorithms

### 1. Deterministic layout — `layoutSymbols` + `mulberry32`

Symbol positions/sizes/rotations are seeded from a **hash of the card’s symbol IDs**. Every client draws the same constellation, so host “highlight this emoji” lines up for everyone.

**Rationale:** “Shared seeded PRNG = lockstep cosmetics without sending layout over the wire.”

### 2. Host click pipeline (anti-desync)

```
Guest tap → { type: "click", symbol, round }
Host:
  playing && !locked && round === g.round
  && player not frozen && has a top card
  && symbol === unique intersection
→ lock table ~900ms, score++, center = that card, round++
→ playerView broadcast
```

Wrong taps: local buzz immediately; freeze only after host confirms.

### 3. View projection — `playerView`

| Public | Private |
| --- | --- |
| Center, scores, counts, freezes, banner | **Your** top card only |

---

## Networking & NAT (short)

WebRTC via PeerJS + STUN. Same Wi‑Fi best; same-ISP / different home Wi‑Fi often fails (CGNAT) → mobile data or TURN. No game server; host browser is the room.

---

## Design patterns to name

1. **Combinatorial design** for deck correctness  
2. **Authoritative host** + intent messages  
3. **Round tokens** (optimistic concurrency / stale-event rejection)  
4. **Seeded layout** for multiplayer visual sync  
5. **Skinning** (editions) over stable indices  

---

## Walkthrough

1. Show two cards → only one shared emoji.  
2. Explain `n=7` table.  
3. Change edition → same indices, new art.  
4. Two phones: race tap; loser freezes.  
5. Mention round ID kills late clicks.

## Design decisions & FAQ

**Q: Why not generate random cards until unique?**  
A: Rejection sampling doesn’t scale and can fail; geometry is `O(1)` correct.

**Q: Can someone cheat?**  
A: Host can. Mitigate with a server running the same `intersection` check.

**Q: Complexity of a tap?**  
A: `O(symbols per card)` validation + `O(players)` broadcast.

---

## Rules appendix

Tap the one shared symbol. Miss → short freeze. First empty pile wins. Host picks cards-each (5 / 8 / 12 / split). Keep host tab open.

## Summary

> “Dobble here is finite geometry plus a tiny authoritative realtime protocol — the flashy part is emojis; the engineering is the proof that every pair intersects once.”
