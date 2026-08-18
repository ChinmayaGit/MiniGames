# Uno

A real-time multiplayer [Uno](https://en.wikipedia.org/wiki/Uno_(card_game)) game in a **single HTML file** (`Uno.html`). No backend, no database, no install. Host the page anywhere static (GitHub Pages, Netlify, or even `file://` for solo vs bots) and play with friends.

Match the **color** or **number**. First to empty their hand wins.

How to play from a player’s point of view is in the collection [README](README.md). This file covers rooms, networking, and the rules engine.

---

## One HTML file, many simultaneous rooms

There is no server that “owns” rooms. The whole app is `Uno.html`. Sessions stay isolated because each lobby is a **WebRTC peer with a unique ID**, not a shared chat channel.

### How a room is named

When someone creates a room, the host picks a 4-character code from a font-friendly alphabet (no `I`, `O`, `0`, or `1`):

```
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

That code is not stored in a database. It becomes the host’s PeerJS ID:

```
unohost-ABCD
```

The prefix `unohost-` keeps this game’s IDs from colliding with other PeerJS apps on the public PeerServer (including `dobblehost-` rooms from [Dobble](Dobble.md)). Guests never register that ID. They create a **random** peer, then connect *to* `unohost-ABCD`.

```
Host browser ── registers ──►  PeerJS ID: unohost-W7K2
Guest A      ── connects to ─►  unohost-W7K2
Guest B      ── connects to ─►  unohost-W7K2

A different table:
Host 2       ── registers ──►  PeerJS ID: unohost-M4QP   ← different room
```

Two groups can sit in the same café, open the same GitHub Pages URL, and never see each other. They are talking to different peer IDs. Messages never go to “everyone on this website.”

### What if two hosts roll the same code?

PeerJS only allows one live peer per ID. If `unohost-W7K2` is already taken, the host gets `unavailable-id`, generates a new code, and registers again. The colliding host never joins the other lobby; they just get a fresh room.

### Why rooms still do not clash during play

- **Host is the only source of truth.** Game state (draw pile, discard, hands, whose turn, current color, direction) lives in the host’s tab. Guests do not run the rules engine.
- **Each guest gets a private view.** The host does not broadcast one global blob. For every connection it builds `playerView(game, thatPlayerId)` so each person only sees **their own hand** plus public table data (top card, counts, turn).
- **Joining mid-game is rejected.** A `join` after start gets `"Game already started"`. Late arrivals cannot inject themselves into an in-progress match.
- **Disconnects are local.** If a guest drops, that seat is marked offline and skipped. Other rooms are unaffected because they never shared a socket.

Closing the host tab ends that room. Other rooms keep running in their own browsers.

---

## Joining from the same network or a different one

Everyone loads the same static page. Multiplayer is **browser-to-browser WebRTC** via [PeerJS](https://peerjs.com/). The page is only the UI; the PeerJS cloud and STUN servers help peers find each other.

```
                    ┌─────────────────────┐
                    │  PeerJS signaling    │
                    │  (ID lookup + SDP)   │
                    └──────────┬──────────┘
                               │  “who is unohost-W7K2?”
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
     Host tab              Guest on Wi‑Fi       Guest on LTE
     (authoritative        same café            different city
      game state)
          │                    │                    │
          └──────── WebRTC data channels ───────────┘
                   (hands, plays, lobby)
```

### Same network (same Wi‑Fi / LAN)

1. Host creates a room; guests type the code or scan the QR.
2. PeerJS introduces the browsers (signaling).
3. ICE gathers **local** candidates (`192.168.x.x`, etc.).
4. The data channel often stays on the LAN: low latency, no extra hops.

This is the most reliable path. The lobby even hints that same Wi‑Fi works best.

### Different countries (India and UK, etc.)

There is **no region lock**. A host in India and a guest in the UK load the same page, use the same 4-letter code, and PeerJS introduces them. Game messages then go **browser to browser** (or through a TURN relay if a direct path is blocked).

Uno is turn-based, so 150–300 ms of extra latency is fine. You do not need a server in each country.

### Slow links (ships, satellite, mid-ocean)

If someone has internet but it is very slow (VSAT, Starlink at sea, high delay), the game still works. It measures round-trip time and then:

- Sends a **compact** table snapshot instead of bulky JSON
- Lets you play a card **immediately**; the host still confirms
- Pings less often and waits longer before marking someone away (so lag is not treated as a disconnect)
- Reconnects with backoff instead of retrying every second (which would flood a tiny pipe)
- Gives join/rejoin more time to finish

They still need a working data connection. If the link drops for minutes, use Leave / Wait as usual. A ship with only a few kb/s will feel sluggish between turns, but a play is one small message.

What *can* fail is NAT, not distance: some mobile carriers and office networks block direct P2P. The game now tries several global STUN servers and a public TURN fallback so those joins still work more often. Both players still need HTTPS (GitHub Pages / Netlify) and the host tab must stay open.

### Different networks (internet, mobile data, another house)

1. Guests still connect to `unohost-XXXX` through PeerJS signaling. They do not need the host’s IP.
2. STUN (Google, Cloudflare, Metered) helps each browser discover its public address through NAT.
3. WebRTC then tries a **direct** peer-to-peer data channel. If both sides are behind a hard NAT, it can relay via TURN.

Invite options that work across networks:

| Method | What happens |
| --- | --- |
| 4-letter code | Guest opens the same URL, types `W7K2`, joins `unohost-W7K2`. |
| Copy link | URL is `https://yoursite/Uno.html?room=W7K2`. The join field is prefilled. |
| QR code | Encodes that invite URL. Phones on cellular can scan it from the host’s screen. |

The host tab must stay open. Guests talk to the host, not to a cloud game server.

### What this setup does *not* do

There is still **no game server in the cloud**. If TURN is also blocked or the public relay is down, a few office/mobile pairs still cannot join. Same Wi‑Fi almost always works; home broadband across countries usually works; some LTE/CGNAT pairs need the TURN fallback.

HTTPS is required for WebRTC in modern browsers, which is why GitHub Pages / Netlify are a good fit.

---

## Game logic

### The deck

Classic 108-card Uno:

| Cards | Count |
| --- | --- |
| Colors | red, yellow, green, blue |
| 0 per color | 1 |
| 1–9 per color | 2 each |
| Skip / Reverse / Draw Two per color | 2 each |
| Wild | 4 |
| Wild Draw Four | 4 |

Each player is dealt **7** cards. The rest is the draw pile. The first discard is flipped until it is a **number** card (action and wild starts are shuffled back) so the opening color is unambiguous. The host (or you, in solo) goes first.

If the draw pile runs out, the discard pile except the top card is shuffled back into the deck.

### How a turn works

You may play one card that matches the discard’s **color** or **value**, or a Wild.

- **Skip** — the next player is skipped.
- **Reverse** — play order flips. With two players this acts as a skip.
- **Draw Two** — starts or adds to a **+ stack**. The next player is asked only if they hold a legal + card.
- **Wild** — play anytime, then pick the next color.
- **Wild Draw Four** — as a normal play, only if you have **no card of the current color**. As a **stack**, you may play it on +2 or +4 even if you hold the current color. Then pick the color.

If you cannot play, tap the draw pile. You draw **one** card. If that card is legal you may play it or tap **Keep**. If it is not legal, your turn ends.

### + stacking

If someone plays **+2** or **+4**, the penalty is passed to the next player and can be stacked:

- Ask **only if that player has a legal + card**. They choose **Use + card** or **Pick N from the pile**.
- If they have no legal + card, they automatically draw the stacked total and skip their turn.
- **+2 then +2** — allowed. Total becomes 4 (then 6, and so on).
- **+2 then +4** — allowed. Total adds 4, and the stack is now a +4 stack.
- **+4 then +4** — allowed.
- **+4 then +2** — not allowed. You cannot put +2 on +4.

Whoever finally takes it draws the full stacked amount and misses their turn.

### UNO

When you have **2 cards**, tap **UNO!** before playing down to one. If you play to a single card without calling it, you draw 2 as a penalty. Other players can tap **Caught!** if you forget.

Bots always call UNO on time.

### Winning

The first player whose hand is empty wins. If the last card is Draw Two or Wild Draw Four, the next player still draws, then the game ends.

### Disconnects, leave, and host timeout

WebRTC drops when a phone locks or the tab is backgrounded. The game treats that as **away**, not logged out.

- Each player has a hidden seat token in `localStorage`. Rejoining the same room (auto-retry, unlock, or refresh) restores that seat and hand.
- The host tab keeps the authoritative game. If the host’s connection dies, it re-registers the same `unohost-XXXX` room so guests can find it again.
- While someone is away, play **pauses**. Everyone still in the room sees **Wait for them** or **Kick [name]**. Away seats are auto-kicked after **3 minutes**.
- **Leave** is always available (lobby, game, reconnect overlay, and invite links). Leaving vacates the seat immediately. The same token cannot reclaim a kicked/left seat.
- If only **one player remains**, they win and the game ends.
- You cannot kick the host. If the host **leaves**, guests get `host-left` and stop retrying. If the host **disappears**, guests retry for **3 minutes**, then can **Leave** or **Wait 2 more minutes**. After Leave, **Create room** is shown again (invite `?room=` is stripped from the URL).

#### Session scenarios

| Situation | What happens |
| --- | --- |
| Guest leaves lobby | Host drops them from the lobby list. Guest home shows Create room. |
| Guest leaves mid-game | Seat is vacated. Turn skips them. Last remaining player wins. |
| Host leaves | Guests get `host-left`. Overlay: Leave table (no endless retry). |
| Host tab dies / offline | Guests retry for 3 min (extend +2). Then Leave or keep waiting. |
| Guest phone lock | 6s grace, then away + pause. Rejoin restores the same hand. Auto-kick at 3 min. |
| Invite link, host gone | Join fails. **Leave this invite** (or 3 min timeout) reveals Create room. |
| Kicked / already started | Guest is sent home and can create a new room. |
| Reload mid-session | Host restores the table; guests reconnect. Host-gone clock is persisted. |

### House rules this build uses

- Stacking Draw Twos and Wild Draw Fours, with +2 allowed on +2, and +4 allowed on +2 or +4, but **not** +2 on +4.
- No challenging a Wild Draw Four.
- Starting card is always a number.
- Forgotten UNO can be caught by other players.

### Host authority (anti-desync)

Guests never decide “that play was legal.” Flow:

```
Guest taps a card ──► { type: "play", cardId } ──► host
Host checks:
  • game is playing
  • it is that player’s turn
  • the card is in their hand
  • it matches color / value, or is a legal wild
Then hostBroadcast() sends each player a fresh view
```

The host’s own taps call `hostPlay` / `hostDraw` directly. Solo mode is the same path with bot seats (`bot-0` …) that the host tab drives on a short delay.

### What each player actually sees

`playerView` is a stripped snapshot:

- Public: top of discard, current color, direction, draw-pile size, whose turn, card counts, banner.
- Private: **your** hand only — never opponents’ cards.
- `legal` — card ids you may play right now, so the client can highlight them without trusting itself for the outcome.

---

## Message protocol

Tiny JSON over the PeerJS data channel:

| From | Type | Meaning |
| --- | --- | --- |
| Guest → host | `join` | Name + seat token for lobby or rejoin |
| Guest → host | `play` | Play `cardId` from hand |
| Guest → host | `draw` | Draw one card, or take a pending + stack |
| Guest → host | `pass` | Keep a just-drawn card |
| Guest → host | `uno` | Call UNO (hand size ≤ 2) |
| Guest → host | `caught` | Catch a player who forgot UNO |
| Guest → host | `color` | Chosen color after a wild |
| Guest → host | `stack` | `play` or `take` a pending + stack |
| Guest → host | `kick` | Remove an away player |
| Guest → host | `leave` | Vacate seat / drop from lobby |
| Guest → host | `ping` | Keepalive + measured RTT |
| Host → guest | `pong` | Echo of ping timestamp |
| Host → guest | `state` | Compact lobby or in-game view (`v`) |
| Host → guest | `error` | e.g. game already started, kicked |
| Host → guest | `host-left` | Host closed the room; stop retrying |

That is the entire network API.

---

## Solo vs bots

Practice mode never opens PeerJS. You are the host in a local `SOLO` table. Rita, Leo, and Maya play with a simple policy: prefer numbers of the current color, then other matching cards, then Wild, and save Skip / Draw Two / Wild Draw Four when the next player is about to go out. They pick the color they hold most of.

---

## Run it

Open `Uno.html` in a browser, or serve the folder:

```bash
npx serve .
```

Then visit `http://localhost:3000/Uno.html`.

For friends on other networks, put the file on any static HTTPS host. PeerJS is loaded from a CDN; players need internet for signaling even on LAN.

## License

Playable fan implementation of the Uno rules. The name and original artwork belong to their owners.
