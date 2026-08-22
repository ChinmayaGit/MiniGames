# Uno — Architecture & Algorithms

Real-time multiplayer [Uno](https://en.wikipedia.org/wiki/Uno_(card_game)) in one HTML file (`Uno.html`).  
**Play:** [Uno.html](../Uno.html) · PeerJS online + bots · voice · shared kit in [`shared/`](../shared/README.md)

Sister game: [Uno Flip](UnoFlip.md) ([`unoflip.html`](../unoflip.html)) — same networking, double-sided deck.

Technical notes on the **authoritative turn engine**, **draw-stack state machine**, and **WebRTC resilience**.

---

## Overview

> “Uno is a **host-authoritative** card engine over WebRTC with no backend. The interesting bits aren’t matching color — they’re a **draw-stack state machine** (+2/+4 with asymmetric stacking rules), **hidden UNO catch windows**, **optimistic UI with host confirm**, and production-hardened **reconnect / NAT / away-turn** handling so a phone lock doesn’t kill the table.”

---

## Challenges I faced

| Constraint | Why it was hard |
| --- | --- |
| Classic 108-card rules + house stacking | Many edge cases (wild +4 legality, +2 on +4 ban) |
| Private hands | Projection per seat |
| Phone backgrounding | WebRTC drops ≠ leave |
| Same-ISP CGNAT | Join fails until mobile data / TURN |
| Slow links | Compact state, backoff, RTT-aware grace |

---

## System architecture

```
┌─────────────────────────────────────────────────────┐
│  Uno.html + shared/kit.js (+ optional Metered TURN) │
└───────────────────────┬─────────────────────────────┘
                        │ PeerJS  unohost-CODE
           ┌────────────┴────────────┐
           │ Host                    │ Guests
           │ full deck + all hands   │ actions: play / draw / uno / caught
           │ canPlayCard / apply     │ optimistic paint → host nack/fix
           │ playerView(id)          │ seat token rejoin
           │ mic mesh (optional)     │
           └─────────────────────────┘
```

**Room isolation:** Peer ID `unohost-ABCD` (alphabet without `I/O/0/1`). Prefix avoids collisions with `dobblehost-` / `cubestacchost-`. `unavailable-id` → new code.

---

## Domain model

```
game = {
  deck, discard[],
  players[].hand,
  currentColor, direction (±1),
  turn index,
  pendingDraw, pendingKind,   // + stack
  catchTarget / catchUntil,   // hidden UNO window
  …
}
```

**Deck (108):** 4 colors × (1×0, 2×1–9, 2×Skip/Reverse/+2) + 4 Wild + 4 Wild +4.  
Draw empty → reshuffle discard under the top card.

---

## Core algorithms

### 1. Legality — `canPlayCard`

Match **color** or **value**, or Wild. Extra rules:

| Card | Constraint |
| --- | --- |
| Wild +4 (normal) | Only if hand has **no** card of `currentColor` |
| Wild +4 (on stack) | May stack on +2/+4 even if you hold the color |
| +2 on stack | Allowed on +2; **forbidden** on +4 |

**Rationale:** “Legality is a pure function of `(card, top, color, stackKind, hand)` — easy to unit-test and to run only on the host.”

### 2. Draw-stack state machine

```
idle ──play +2/+4──► pending(N, kind)
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   has legal +     no legal +     choose UI
   → prompt        → auto draw N   Use+ / Take N
                   skip turn
```

Stacking matrix (house rules):

| On \ Play | +2 | +4 |
| --- | --- | --- |
| +2 | ✅ add 2 | ✅ add 4, kind→+4 |
| +4 | ❌ | ✅ add 4 |

**Rationale:** “Effects aren’t fire-and-forget; they’re a small FSM with prompts only when the next seat *could* stack — avoids pointless modals.”

### 3. Turn advance

`direction ∈ {+1,-1}`; Skip adds extra step; 2-player Reverse ≡ Skip. After resolving pending draws, turn lands on the next *connected* seat.

### 4. UNO / Caught (hidden window)

1. At 2 cards, player should tap **UNO!** before going to 1.  
2. If they forget: **no public announce**.  
3. Host opens a **1.5–2s** catch window; others may tap **Caught!** → draw 2.  
4. Optional low-probability spectator hint (`UNO_HINT_CHANCE`).

**Rationale:** “Asymmetric information + short timers — closer to a distributed ‘challenge’ than a simple flag.”

### 5. View projection — `playerView`

Private hand + public discard, color, counts, stack size, banners. Never other hands.

### 6. Optimistic play

Guest paints the card immediately; host validates and broadcasts. Illegal → state correction. Feels instant on slow RTT.

---

## Resilience (what broke in practice)

| Failure | Mitigation |
| --- | --- |
| Guest tab background | Seat token; rejoin same hand |
| False “away” | Ping/pong; open channel ⇒ not away |
| Away on turn | Skip after ~15s; auto-kick ~3 min |
| Host gone | Retry ~3 min (+ optional +2); Leave strips `?room=` |
| Last player | Auto-win |
| CGNAT join fail | Wi‑Fi tip, Debug ICE log, optional TURN |
| Slow pipe | Compact snapshots, reconnect backoff, longer join waits |

**Rationale:** “Most demos ignore NAT and phone locks. This build treats them as first-class product bugs.”

---

## Voice

🎤 opens a WebRTC audio path (lobby + in-game). Separate from SFX mute. HTTPS required. Solo has no mic.

---

## Design patterns to name

1. Host-authoritative server-in-a-tab  
2. Command pattern (play/draw/uno/caught)  
3. Effect FSM (pending draw stack)  
4. View DTO / projection  
5. Optimistic UI + authoritative reconcile  
6. Session resume via durable seat token  
7. ICE/TURN diagnostics as a user-facing tool  

---

## Walkthrough

1. Solo: +2 then +4 stack; show prompt vs auto-take.  
2. Try +2 on +4 → rejected.  
3. Forget UNO → Caught window.  
4. Debug panel: ICE candidates.  
5. Lock phone → rejoin with same hand.

## Design decisions & FAQ

**Q: Why not Firebase?**  
A: Static deploy + zero cost; PeerJS enough for ≤8 friends. Scale → extract pure rules to Node.

**Q: Complexity of a play?**  
A: `O(|hand|)` legality on host; broadcast `O(players · handSize)` — fine at Uno scale.

**Q: Cheating?**  
A: Host sees all. Same honesty model as Cubestacc; serverize for ranked play.

---

## Rules appendix (short)

Match color or number. Skip / Reverse / +2 / Wild / Wild +4 as above. Call **UNO!** at 2 cards. First empty hand wins.

## Summary

> “Uno here is a pure rules engine behind a host-authoritative WebRTC shell — stacked draws as an FSM, private views, and reconnect/NAT hardening so the multiplayer story survives the real world.”
