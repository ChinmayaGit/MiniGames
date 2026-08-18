# Shared MiniGames kit

Reusable lobby, invite, join, loading, warning, and leave chrome. A new game file should only hold **theme + rules + board**.

## Files

| File | Role |
| --- | --- |
| `boot.css` | First-paint “waking up” splash (Netlify / CDN cold start) |
| `shell.css` | Home / lobby / QR / join status / warmup overlay / toast / Wi‑Fi tip |
| `kit.js` | Create/join helpers, room codes, invite URL, PeerJS ICE, leave bindings |

## New game skeleton

```html
<html lang="en" class="booting"
  style="--boot-bg:#111;--boot-accent:#ffcc33;--boot-ink:#fff;--boot-title:'Waking up…'">
<head>
  <link rel="stylesheet" href="shared/boot.css" />
  <script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
  <link rel="stylesheet" href="shared/shell.css" />
  <style> /* theme + board only */ </style>
</head>
<body>
  <!-- screen-home: name, Create room, join code, Join, optional Solo -->
  <!-- screen-lobby: lobby-code, Copy link, Leave, lobby-players, Start, qr -->
  <!-- screen-game: your board -->
  <!-- screen-end: Play again, Home -->
  <script src="shared/kit.js"></script>
  <script>
    const MG = MiniGames;
    MG.init({ nameKey: "mygame-name", hubHref: "index.html", maxPlayers: 8 });
    MG.bindHome({
      onCreate: createRoom,
      onJoin: joinRoom,
      onSolo: startSolo,
      onLeave: leaveRoom,
      onHome: goHome,
      onAgain: playAgain,
      onStart: startHostGame,
      inviteUrl: () => MG.inviteUrl(state.room),
    });
  </script>
</body>
```

Keep IDs stable so the kit can find them: `name`, `btn-create`, `join-code`, `btn-join`, `btn-solo`, `join-status`, `home-error`, `lobby-code`, `lobby-players`, `btn-copy`, `btn-lobby-leave`, `btn-start`, `qr`, `btn-home`, `btn-again`.

## Helpers

- `MG.randomCode()` — 4-letter room code
- `MG.inviteUrl(room)` — `?room=` link for QR / copy
- `MG.peerOptions(extraIce)` — STUN (+ optional TURN)
- `MG.showWarmup(title, text)` / `MG.hideWarmup()` — don’t-spam overlay
- `MG.waitForPeer(ok, fail)` — wait for PeerJS CDN
- `MG.renderPlayerList(players, myId, statusFn)` — lobby roster
- `MG.wifiHint()` — same-ISP / different Wi‑Fi copy
- `MG.stripRoomFromUrl()` — after Leave, show Create again

Peer ID prefix (`unohost-`, `dobblehost-`) stays **per game** so rooms never clash.

Then add the game to `index.html` and `netlify.toml` aliases.
