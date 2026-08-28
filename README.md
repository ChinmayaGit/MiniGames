# Minigames — Architecture overview

**Play:** [https://myminigames.netlify.app/](https://myminigames.netlify.app/)

A collection of **single-file browser games** with **real-time multiplayer** and **no game server**. Static host (Netlify) + PeerJS WebRTC. Shared lobby chrome in [`shared/`](shared/README.md).

This README is the **project overview**; each game’s MD covers architecture and algorithms in more depth.

---

## Overview

> This repo is a static minigame platform where each title is one HTML file. Multiplayer is **host-authoritative P2P** — the host browser is the room. A shared kit handles lobby, invites, and ICE; each game owns a rules engine. Standouts: Dobble’s **finite geometry deck**, Uno’s **stack FSM + reconnect hardening**, and Cubestacc’s **3D-rules / 2D-view split** without WebGL.

---

## Games (technical map)

| Game | File | Technical highlight | Deep notes |
| --- | --- | --- | --- |
| **Hub** | [index.html](index.html) | Product surface / discovery | — |
| **Dobble** | [Dobble.html](Dobble.html) | Projective plane order 7; unique intersection | [Dobble.md](docs/Dobble.md) |
| **Uno** | [Uno.html](Uno.html) | Draw-stack FSM, UNO catch window, NAT/reconnect | [Uno.md](docs/Uno.md) |
| **Uno Flip** | [unoflip.html](unoflip.html) | Dual-face cards + O(1) global flip | [UnoFlip.md](docs/UnoFlip.md) |
| **Cubestacc** | [Cubestacc.html](Cubestacc.html) | Sparse 3D cells + painter’s sort + camera yaw | [Cubestacc.md](docs/Cubestacc.md) |
| **Bullet** | [Bullet.html](Bullet.html) | Blaster FSM: load → timing recharge → Single/Power/Fusion | [Bullet.md](docs/Bullet.md) |

---

## Cross-cutting architecture

```
                    Netlify (static HTTPS)
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
           Dobble         Uno/Flip     Cubestacc    Bullet
              └─────────────┬─────────────┘
                            │ shared/kit.js
                            │ PeerJS signaling + STUN/(TURN)
                            ▼
                   Host tab ◄──data channel──► Guests
                   (authoritative state)
```

**Shared decisions**

1. **Host-authoritative** — guests send intents; host validates; `playerView` per seat  
2. **Peer ID = `prefix + roomCode`** — many rooms, one public PeerServer  
3. **Private hands** — never broadcast full state  
4. **Invite UX** — code / `?room=` / QR; Leave strips query so Create returns  
5. **Solo path** — same rules, no PeerJS  

**Rationale:** Multiplayer was treated as a product constraint (static hosting), so rules engines stay host-safe and easy to reason about.

---

## What each game highlights

| If you care about… | Start here… |
| --- | --- |
| Algorithms / CS | Dobble geometry; Cubestacc cells + paint score |
| System design | Host authority, projection, reconnect, NAT |
| Frontend polish | SVG cubes, editions, optimistic Uno UI |
| Product sense | Wi‑Fi tips, warmup, Debug ICE, seat rejoin |
| Code organization | `shared/` kit vs per-game rules |

---

## How to play (player-facing, short)

### Bullet

Pick a **3-bullet loadout**. Draw → Load → attack when ⚡ fills (5s/cell) → Single / Power / Twin Fusion. Details: [Bullet.md](docs/Bullet.md). · [Play](Bullet.html)

### Cubestacc

Match suit↑ / rank→ / face← on a shared cube STACC. Deck themes in lobby. Details: [Cubestacc.md](docs/Cubestacc.md). · [Play](Cubestacc.html)

### Uno Flip

Double-sided deck; **Flip** turns the whole table Light↔Dark. Details: [UnoFlip.md](docs/UnoFlip.md). · [Play](unoflip.html)

### Uno

Match **color** or **number**. Stack +2/+4 (house rules). Call **UNO!** at 2 cards or risk **Caught!**. Details: [Uno.md](docs/Uno.md). · [Play](Uno.html)

### Dobble

Any two cards share **exactly one** symbol — tap it. First empty pile wins. Host picks edition + cards each. Details: [Dobble.md](docs/Dobble.md). · [Play](Dobble.html)

---

## Screenshots

### Mobile

**Hub** · [index.html](index.html)

<p>
<img src="Pics/Mobile/dasboard1.png" width="180" alt="Hub mobile 1" />
<img src="Pics/Mobile/dashboard2.png" width="180" alt="Hub mobile 2" />
</p>

**Bullet** · [Bullet.html](Bullet.html)

<p>
<img src="Pics/Mobile/bullet1.png" width="180" alt="Bullet mobile 1" />
<img src="Pics/Mobile/bullet2.png" width="180" alt="Bullet mobile 2" />
<img src="Pics/Mobile/bullet3.png" width="180" alt="Bullet mobile 3" />
<img src="Pics/Mobile/bullet4.png" width="180" alt="Bullet mobile 4" />
<img src="Pics/Mobile/bullet5.png" width="180" alt="Bullet mobile 5" />
</p>

**Cube** · [Cubestacc.html](Cubestacc.html)

<p>
<img src="Pics/Mobile/cube1.png" width="180" alt="Cube mobile 1" />
<img src="Pics/Mobile/cube2.png" width="180" alt="Cube mobile 2" />
<img src="Pics/Mobile/cube3.png" width="180" alt="Cube mobile 3" />
</p>

**Flip** · [unoflip.html](unoflip.html)

<p>
<img src="Pics/Mobile/flip1.png" width="180" alt="Flip mobile 1" />
<img src="Pics/Mobile/flip2.png" width="180" alt="Flip mobile 2" />
<img src="Pics/Mobile/flip3.png" width="180" alt="Flip mobile 3" />
</p>

**Uno** · [Uno.html](Uno.html)

<p>
<img src="Pics/Mobile/uno1.png" width="180" alt="Uno mobile 1" />
<img src="Pics/Mobile/uno2.png" width="180" alt="Uno mobile 2" />
</p>

**Dobble** · [Dobble.html](Dobble.html)

<p>
<img src="Pics/Mobile/dobble1.png" width="180" alt="Dobble mobile 1" />
<img src="Pics/Mobile/dobble2.png" width="180" alt="Dobble mobile 2" />
</p>

### Desktop

**Hub** · [index.html](index.html)

<p>
<img src="Pics/Desktop/dashboard1.png" width="320" alt="Hub desktop 1" />
<img src="Pics/Desktop/dashboard2.png" width="320" alt="Hub desktop 2" />
</p>

**Bullet** · [Bullet.html](Bullet.html)

<p>
<img src="Pics/Desktop/bullet1.png" width="320" alt="Bullet desktop 1" />
<img src="Pics/Desktop/Bullet2.png" width="320" alt="Bullet desktop 2" />
<img src="Pics/Desktop/Bullet3.png" width="320" alt="Bullet desktop 3" />
</p>

**Cube** · [Cubestacc.html](Cubestacc.html)

<p>
<img src="Pics/Desktop/cube1.png" width="320" alt="Cube desktop 1" />
<img src="Pics/Desktop/Cube2.png" width="320" alt="Cube desktop 2" />
<img src="Pics/Desktop/Cube3.png" width="320" alt="Cube desktop 3" />
</p>

**Flip** · [unoflip.html](unoflip.html)

<p>
<img src="Pics/Desktop/flip1.png" width="320" alt="Flip desktop 1" />
<img src="Pics/Desktop/flip2.png" width="320" alt="Flip desktop 2" />
<img src="Pics/Desktop/flip3.png" width="320" alt="Flip desktop 3" />
</p>

**Uno** · [Uno.html](Uno.html)

<p>
<img src="Pics/Desktop/uno1.png" width="320" alt="Uno desktop 1" />
<img src="Pics/Desktop/uno2.png" width="320" alt="Uno desktop 2" />
</p>

**Dobble** · [Dobble.html](Dobble.html)

<p>
<img src="Pics/Desktop/dobble1.png" width="320" alt="Dobble desktop 1" />
<img src="Pics/Desktop/dobbl2.png" width="320" alt="Dobble desktop 2" />
</p>

---

## Repo layout

```
MiniGames/
  index.html          # hub
  *.html              # games (root URLs for Netlify)
  docs/               # architecture notes
  Pics/Mobile/        # mobile screenshots
  Pics/Desktop/       # desktop screenshots
  assets/icons/       # SVGs (e.g. flip.svg)
  assets/images/      # reference images
  shared/             # lobby kit (css/js)
```

## Run & deploy

```bash
npx serve .
```

Open `http://localhost:3000/`. Deploy the **whole folder** to Netlify (`index.html`, game HTML, `docs/`, `assets/`, and `shared/`).

HTTPS matters for WebRTC. Same Wi‑Fi is the most reliable join path; same-ISP different homes often need mobile data or TURN.

---

## Coming soon

More one-file titles (party / co-op). Each gets `.html` + architecture MD + hub tile.

---

## Summary

> “A static P2P minigame lab: shared multiplayer shell, per-game rules engines, and a few algorithms (geometry, effect FSMs, isometric occupancy) that are worth reading in the per-game docs.”
