# Bullet — Architecture & Algorithms

Blaster duel card game in one HTML file (`Bullet.html`).  
**Play:** [Bullet.html](../Bullet.html) · PeerJS online + solo vs bot · shared kit in [`shared/`](../shared/README.md)

---

## Overview

> “Bullet’s signature loop is **prepare before you fire**: Draw → Load Bullets → Attack when energy is ready → Resolve → Opponent. Energy regenerates **1 cell / 5s** (Clash Royale–style bar). Costs gate Single / Power / Twin Fusion shots. Multiplayer stays **host-authoritative**.”

---

## Challenges I faced

| Constraint | Why it was hard |
| --- | --- |
| Cannot attack immediately | Need a prep FSM, not “click card = damage” |
| Energy must feel continuous | Auto regen + CR-style fill bar above pips |
| Multiple attack modes | Cylinder chambers + energy costs |
| Twin Fusion recipes | Element pairs → unique effects, not sum of damage |
| Loadout of 3 | Strategy before battle without full collection |

---

## Core combat loop (FSM)

```
START TURN
  → status ticks (burn / poison / freeze / stun)
  → draw 1–2 cards
  → subPhase: armed
      Load bullets into the 5-chamber cylinder
      Use utils (Power Core, Draw+, Shield)
      Fire when ⚡ is ready: Single ⚡1 | Power ⚡2 | Fusion ⚡3
  → resolve FX → next player
```

Energy fills for everyone in real time (not only on your turn). You may fire only with enough cells.

---

## Blaster energy

| Attack | Cost |
| --- | --- |
| Single Shot | ⚡1 |
| Power-Up Shot | ⚡2 |
| Twin Fusion | ⚡3 |

- Meter max **5**. Starts at **1**.
- **Auto regen:** +1 cell every **5 seconds** while below max.
- UI: continuous fill bar (Clash Royale style) above the pip row; fractional progress kept when spending.
- Host ticks energy; guests interpolate from `energyRegenAt` for a smooth bar.

---

## Bullets & roles

Catalog entries carry `elem`, `role`, `dmg`, optional `effect`, and optional `art` for custom projectile icons (`assets/bullets/`).

Roles in battle:

- **Attack** — high damage  
- **Tank** — reduces incoming damage while loaded  
- **Speed** — chance to refund energy on fire  
- **Control** — freeze / stun / poison  
- **Support** — heal / shield effects  
- **Trick** — steal a card  

### Attack modes

1. **Single** — hammer chamber bullet (cylinder rotates after)  
2. **Power** — bullet marked with Power Core → ~2× damage  
3. **Fusion** — two compatible elements in hammer + next chamber

Unknown pairs refuse the shot; known pairs can surface a “NEW FUSION” discovery message.

---

## Board layout

| Corner | Content |
| --- | --- |
| Top left | Enemy HP |
| Bottom left | Hand + Load / Attack buttons |
| Bottom right | Energy bar + pips + 5-chamber cylinder, then your HP |

---

## Networking

Same pattern as other games: PeerJS `bullethost-CODE`, host validates `load | util | attack | target`, broadcasts `playerView` (includes energy + regen timestamp).

---

## Not in this slice (roadmap)

Exploration hex map, rarity draws on tiles, bullet evolution trees, persistent fusion cookbook, tech unlocks (boat / lab / siege) — designed as the next layer on top of this battle engine.

---

## Files

| File | Role |
| --- | --- |
| `Bullet.html` | UI, rules, energy regen, networking |
| `assets/bullets/` | Element bullet icons |
| `docs/Bullet.md` | This document |
