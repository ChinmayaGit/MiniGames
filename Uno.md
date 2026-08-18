# Uno

A real-time multiplayer [Uno](https://en.wikipedia.org/wiki/Uno_(card_game)) game in a **single HTML file** (`Uno.html`). No backend, no database, no install. Host the page anywhere static (GitHub Pages, Netlify, or even `file://` for solo vs bots) and play with friends.

Match the **color** or **number**. First to empty their hand wins.

How to play from a player’s point of view is in the collection [README](README.md). This file covers rooms, networking, rules, and the problems this build already ran into.

---

## Features in this build

- **Solo vs bots** — 1–3 bots, no PeerJS.
- **Multiplayer rooms** — 4-letter code, copy-link, QR. Host-authoritative; guests only send actions.
- **Invite URLs** — `?room=ABCD` prefills join and hides Create until you leave the invite.
- **Classic table** — fanned hands, play-to-pile animation, color chip, dark mode.
- **+2 / +4 stacking** — +2 on +2, +4 on +2 or +4, not +2 on +4. Prompt only if the next player has a legal + card.
- **UNO / Caught!** — call before going to one card. Forgetting is silent unless someone taps **Caught!** in a short window.
- **Voice** — **🎤 Mic** in the lobby (under the player list) and in-game (next to UNO). 🔊 is game SFX only.
- **Leave** — lobby, game, reconnect overlay, and invite home. Last remaining player wins.
- **Reconnect** — seat token in `localStorage`; same hand after lock/refresh. Host gone: retry 3 minutes, optional +2, then Leave so Create room shows again.
- **Slow links** — compact snapshots, optimistic play, longer timeouts, ping/pong RTT, reconnect backoff.
- **Debug** — bottom-left **Debug** button: ICE/join log, Copy, Test ICE, optional Metered TURN key.

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

- **Host is the only source of truth.** Game state lives in the host’s tab. Guests do not run the rules engine.
- **Each guest gets a private view.** The host builds `playerView(game, thatPlayerId)` so each person only sees **their own hand** plus public table data.
- **Joining mid-game is rejected.** A new player after start gets `"Game already started"`. A returning seat token is allowed back in.
- **Disconnects are local.** Other rooms are unaffected because they never shared a socket.

Closing the host tab ends that room. Other rooms keep running in their own browsers.

---

## Joining from the same network or a different one

Everyone loads the same static page. Multiplayer is **browser-to-browser WebRTC** via [PeerJS](https://peerjs.com/). The page is only the UI; the PeerJS cloud and STUN servers help peers find each other. Distance (next room, 5 km, another country) is not a region lock.

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

This is the most reliable path.

### Same ISP, two different home Wi‑Fi (common failure)

This is the case that looks like a bug: code, link, and QR all fail together, then **mobile data works**.

Two houses (or two routers in the same town) on the **same internet provider** often sit behind **CGNAT / symmetric NAT**. The phones *find* the room (signaling works) and even get a public STUN address, but they cannot open a direct data channel. **Distance does not fix this** — 50 metres or 5 km is the same NAT problem.

**What to do:**

| Setup | Usually |
| --- | --- |
| Everyone on the **same Wi‑Fi** | Works |
| Two **different home Wi‑Fi**, same ISP | Often fails |
| One phone on **mobile data** | Works |
| Different ISPs, or far apart on different networks | Often works |
| Both on home Wi‑Fi **plus a working TURN relay** | Works at any distance |

The home and lobby screens show this as a **Wi‑Fi tip**. Join timeout text says the same thing. There is **no brand-specific ISP** — any provider that uses CGNAT can do this.

### Different countries (any long-distance link)

There is **no region lock**. A host in one country and a guest in another use the same page and code. Game messages go browser to browser (or through TURN if the direct path is blocked). Uno is turn-based, so extra delay is fine. You do not need a server in each country.

### Slow links (ships, satellite, high delay)

If someone has internet but it is very slow, the game still tries to stay playable:

- Compact table snapshots instead of bulky JSON
- Your card plays on screen immediately; the host still confirms
- Pings less often; lag is not treated as “they left”
- Reconnect backoff so a tiny pipe is not flooded
- Longer join/rejoin waits

They still need a working data connection. A few kb/s feels sluggish between turns; a play is one small message.

### Voice (microphone)

Tap **🎤 Mic** in the lobby (under the player list) or in the game (next to **UNO!**). That asks for microphone permission and sends voice over WebRTC. Tap again to mute. The 🔊 button is only game sound effects. Solo vs bots has no mic. HTTPS is required.

### Invite options

| Method | What happens |
| --- | --- |
| 4-letter code | Guest opens the same URL, types `W7K2`, joins `unohost-W7K2`. |
| Copy link | URL is `https://yoursite/Uno.html?room=W7K2`. The join field is prefilled. |
| QR code | Encodes that invite URL. |

The host tab must stay open. Guests talk to the host, not to a cloud game server. HTTPS is required for WebRTC, which is why GitHub Pages / Netlify are a good fit.

---

## Issues we hit, and how this build handles them

### 1. Same ISP, different home Wi‑Fi — cannot join (code / link / QR all fail)

**What happened:** Signaling succeeded (`guest peer open → unohost-XXXX`). STUN produced `host` and `srflx` candidates. ICE stayed on `checking` until timeout. Mobile data then worked.

**What the debug log showed:**

- `400 TURN allocate error` on the public relay — old shared passwords are rejected
- `701` host lookup on dead relay hostnames — DNS gone
- No `relay` candidates, so two hard NATs never connected

**How we handle it:**

- Home/lobby **Wi‑Fi tip** (any ISP, not a named brand)
- Join timeout tells people to use **mobile data** or the **same Wi‑Fi**
- Bottom-left **Debug**: live ICE/join log, **Copy log**, **Test ICE**
- Dead public TURN URLs removed so ICE is not wasted on 701s
- Optional **Metered TURN** (app name + API key in Debug). After Save, Test ICE should show `relay`. **Both** phones should save TURN **before** the host creates the room

### 2. Host “disconnected” overlay — Kick yourself / Kick the host — game stuck

**What happened:** A short WebRTC drop (or a skipped ping) marked someone away. The overlay covered the table. Kick buttons could appear for **you** or the **host**. Kick-host does nothing, so the game sat paused.

**How we handle it:**

- Never kick the host; never show Kick for yourself
- Play **continues** unless it is the missing player’s turn
- After **15 seconds** on an away turn, that turn is **skipped** (they can still rejoin)
- Auto-kick only after **3 minutes** away
- If the data channel is still open, they are **not** marked away
- Any ping/action from them clears away (`noteAlive`) so a false disconnect does not last forever
- Guests keep pinging even if they recently received state (receiving state does not prove to the *host* that the guest is alive)

### 3. Host gone — guests retry forever; Create room hidden on invite links

**What happened:** Invite `?room=` hid Create room. If the host left or the tab died, guests kept reconnecting and could not start their own room.

**How we handle it:**

- **Leave** in lobby, game, reconnect overlay, and **Leave this invite** on home
- Host leave sends `host-left`; guests stop retrying
- Host missing: retry **3 minutes**, optional **Wait 2 more minutes**, then Leave
- Leave strips `?room=` from the URL so Create room and solo show again
- Last remaining player **wins**

### 4. Mic button missing

**What happened:** A 42px mic sat in a cramped top bar and was clipped on phones.

**How we handle it:** Labeled **🎤 Mic** under the lobby player list and in the bottom action row next to UNO.

### 5. Slow or high-latency internet

Compact `state` payloads (`v`), optimistic local play, RTT-aware away grace, join waits up to ~24–32s on slow links, reconnect backoff.

### 6. Phone lock / tab background

Seat **token** in `localStorage`. Rejoin restores the same hand. Host re-binds `unohost-XXXX`. Guests ping; host marks away only if the connection is actually gone.

---

## Disconnects, leave, and host timeout

WebRTC drops when a phone locks or the tab is backgrounded. The game treats that as **away**, not logged out.

- Hidden seat token in `localStorage`. Rejoin restores that seat and hand.
- Host tab is authoritative. If the host peer dies, it re-registers the same `unohost-XXXX`.
- **Leave** always vacates the seat. A kicked/left token cannot reclaim it.
- If only **one player remains**, they win.
- You cannot kick the host. Host **leaves** → `host-left`. Host **disappears** → 3 min retry, then Leave / +2 min.

#### Session scenarios

| Situation | What happens |
| --- | --- |
| Guest leaves lobby | Host drops them from the list. Guest home shows Create room. |
| Guest leaves mid-game | Seat vacated. Last remaining player wins. |
| Host leaves | Guests get `host-left`. Leave table; no endless retry. |
| Host tab dies / offline | Guests retry 3 min (extend +2). Then Leave or keep waiting. |
| Guest phone lock | Grace, then away if the channel is really down. Rejoin restores the hand. Skip their turn after 15s; auto-kick at 3 min. |
| False away (still connected) | Ping/open channel clears away. No Kick-self / Kick-host. |
| Invite link, host gone | **Leave this invite** (or 3 min) reveals Create room. |
| Kicked / already started | Guest is sent home and can create a new room. |
| Reload mid-session | Host restores the table; guests reconnect. Host-gone clock is persisted. |
| Same ISP, two home Wi‑Fi | Often cannot join. Mobile data or same Wi‑Fi. Debug log if it still fails. |

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

Each player is dealt **7** cards. The rest is the draw pile. The first discard is flipped until it is a **number** card (action and wild starts are shuffled back). The host (or you, in solo) goes first.

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

When you have **2 cards**, tap **UNO!** before playing down to one. **Caught!** stays on the table the whole game.

If you drop to one card without calling it, nothing is announced. Other players have a hidden **1.5–2 second** window to tap **Caught!** and make you draw 2. If nobody does, you get away — no penalty, no reveal.

Sometimes (not always) others see a quiet hint: `👀 Someone might have forgotten UNO...`. Tune `UNO_HINT_CHANCE` in `Uno.html` (default `0.28`). Window length is `CATCH_WINDOW_MIN_MS`–`CATCH_WINDOW_MAX_MS`.

Bots always call UNO on time.

### Winning

The first player whose hand is empty wins. If the last card is Draw Two or Wild Draw Four, the next player still draws, then the game ends. If everyone else leaves, the last player still in the table wins.

### House rules this build uses

- Stacking Draw Twos and Wild Draw Fours, with +2 allowed on +2, and +4 allowed on +2 or +4, but **not** +2 on +4.
- No challenging a Wild Draw Four.
- Starting card is always a number.
- Forgotten UNO is only punished if another player taps **Caught!** during the short hidden window.

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

`playerView` is a stripped snapshot, then packed for the wire (`type: "state", v: …`):

- Public: top of discard, current color, direction, draw-pile size, whose turn, card counts, banner.
- Private: **your** hand only — never opponents’ cards.
- `legal` — card ids you may play right now.

---

## Debug log (how to read it)

Bottom-left **Debug**. After a failed join, Copy log.

| Line | Meaning |
| --- | --- |
| `guest peer open … → unohost-XXXX` | Signaling worked; the room exists |
| `cand host` / `cand srflx` | STUN found local / public addresses |
| `cand relay` | TURN relay is working (needed for two hard home NATs) |
| `ice-error 400 TURN allocate` | Relay rejected credentials (old public passwords) |
| `ice-error 701` | Relay hostname/DNS failed |
| `ice=checking` then `join timeout` | Hole punch failed; no relay |
| `guest datachannel open` | You are in |

**Test ICE** should list `relay` after a Metered key is saved. Save TURN on **both** phones, then create the room.

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
| Guest → host | `caught` | Catch a player during the hidden UNO window |
| Guest → host | `color` | Chosen color after a wild |
| Guest → host | `stack` | `play` or `take` a pending + stack |
| Guest → host | `kick` | Remove an away player (never the host) |
| Guest → host | `leave` | Vacate seat / drop from lobby |
| Guest → host | `ping` | Keepalive + measured RTT |
| Guest → host | `voice` | Mic on/off for the roster |
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

For friends on other networks, put the file on any static **HTTPS** host. PeerJS is loaded from a CDN; players need internet for signaling even on LAN.

## License

Playable fan implementation of the Uno rules. The name and original artwork belong to their owners.
