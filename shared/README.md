# Shared MiniGames kit — Architecture

Reusable lobby / invite / PeerJS chrome so each game HTML stays **theme + rules + board**.  
Files: `boot.css` · `shell.css` · `kit.js`

---

## Overview

> “The kit is a **multiplayer shell library** for static sites: room codes, invite URLs, QR, warm-up against CDN cold starts, PeerJS ICE helpers, and consistent leave/join UX. Games plug in callbacks (`onCreate`, `onStart`, …) and keep their own authoritative rules. It’s separation of concerns — **transport & lobby ≠ game logic**.”

---

## What this kit solves

| Pain | Approach |
| --- | --- |
| Every game reimplements lobby | Shared DOM IDs + `MG.bindHome` |
| Netlify cold start feels broken | `boot.css` + warmup overlay (“don’t tap again”) |
| PeerJS CDN slow | `waitForPeer` |
| NAT / same-ISP fails | `wifiHint`, optional TURN via `peerOptions` |
| Invite links hide Create forever | `stripRoomFromUrl` on Leave |
| Room ID collisions across games | **Per-game Peer prefix** (`unohost-`, `dobblehost-`, …) |

---

## Architecture

```
index.html (hub)
    │
    ├─ Dobble.html / Uno.html / unoflip.html / Cubestacc.html
    ├─ docs/          (architecture notes)
    ├─ assets/icons/  (SVGs)
    ├─ assets/images/ (reference art)
    └─ shared/        (boot.css, shell.css, kit.js)
         │
         └─ each game owns: Peer prefix, rules engine, board UI
```

**Dependency direction:** games depend on kit; kit never imports a game. New title = copy skeleton + unique prefix + rules.

---

## API surface (what to memorize)

| Helper | Role |
| --- | --- |
| `MG.init({ nameKey, hubHref, maxPlayers })` | Local name persistence, caps |
| `MG.bindHome({ onCreate, onJoin, onSolo, onStart, … })` | Wire stable button IDs |
| `MG.randomCode()` | Font-safe 4-char alphabet |
| `MG.inviteUrl(room)` | `?room=` for QR / copy |
| `MG.peerOptions(extraIce)` | STUN (+ optional TURN) |
| `MG.showWarmup` / `hideWarmup` | Cold-start UX |
| `MG.waitForPeer` | CDN ready gate |
| `MG.renderPlayerList` | Lobby roster |
| `MG.wifiHint` / `stripRoomFromUrl` | NAT copy + invite cleanup |

---

## Design patterns

1. **Facade** — `MiniGames` hides PeerJS boilerplate  
2. **Template method** — bindHome expects game callbacks  
3. **Convention over configuration** — fixed element IDs  
4. **Prefix multiplexing** — one public PeerServer, many apps  

---

## Design notes

- **Adding a game quickly:** kit skeleton + unique Peer prefix + rules/board.  
- **No npm monorepo:** static hosting, zero build step, easy to read as source.  
- **Cold start:** boot splash + warmup so users don’t double-tap Create while PeerJS loads.

## Summary

> The shared kit is the multiplayer shell for this collection; each game is a rules and board plugin.