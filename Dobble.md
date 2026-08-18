# Dobble

A real-time multiplayer [Dobble](https://en.wikipedia.org/wiki/Dobble) (Spot It!) game in a **single HTML file** (`Dobble.html`). No backend, no database, no install. Host the page anywhere static (GitHub Pages, Netlify, or even `file://` for solo practice) and play with friends.

Any two cards share **exactly one** symbol. Tap it first.

Pick an **edition** on the home screen or in the lobby (host chooses, everyone plays that pack): Classic, Harry Potter, Disney, Superheroes, Animals, Space, Food, Ocean. Each pack has 57 emoji. The match rule does not change.

How to play from a player’s point of view is in the collection [README](README.md). This file covers rooms, networking, and the rules engine.

---

## One HTML file, many simultaneous rooms

There is no server that “owns” rooms. The whole app is `Dobble.html`. Sessions stay isolated because each lobby is a **WebRTC peer with a unique ID**, not a shared chat channel.

### How a room is named

When someone creates a room, the host picks a 4-character code from a font-friendly alphabet (no `I`, `O`, `0`, or `1`):

```
ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

That code is not stored in a database. It becomes the host’s PeerJS ID:

```
dobblehost-ABCD
```

The prefix `dobblehost-` keeps this game’s IDs from colliding with other PeerJS apps on the public PeerServer. Guests never register that ID. They create a **random** peer, then connect *to* `dobblehost-ABCD`.

```
Host browser ── registers ──►  PeerJS ID: dobblehost-W7K2
Guest A      ── connects to ─►  dobblehost-W7K2
Guest B      ── connects to ─►  dobblehost-W7K2

A different table:
Host 2       ── registers ──►  PeerJS ID: dobblehost-M4QP   ← different room
```

Two groups can sit in the same café, open the same GitHub Pages URL, and never see each other. They are talking to different peer IDs. Messages never go to “everyone on this website.”

### What if two hosts roll the same code?

PeerJS only allows one live peer per ID. If `dobblehost-W7K2` is already taken, the host gets `unavailable-id`, generates a new code, and registers again. The colliding host never joins the other lobby; they just get a fresh room.

### Why rooms still do not clash during play

- **Host is the only source of truth.** Game state (`center` card, hands, scores, freeze timers, round number) lives in the host’s tab. Guests do not run the rules engine.
- **Each guest gets a private view.** The host does not broadcast one global blob. For every connection it builds `playerView(game, thatPlayerId)` so each person only sees their own top card plus public scoreboard data.
- **Clicks are tagged with a round.** After a match, the round increments. A late tap from the previous pair of cards is ignored (`round !== g.round`).
- **Joining mid-game is rejected.** A `join` after start gets `"Game already started"`. Late arrivals cannot inject themselves into an in-progress match.
- **Disconnects are local.** If a guest drops, only that seat is marked offline. Other rooms are unaffected because they never shared a socket.

Closing the host tab ends that room. Other rooms keep running in their own browsers.

---

## Joining from the same network or a different one

Everyone loads the same static page. Multiplayer is **browser-to-browser WebRTC** via [PeerJS](https://peerjs.com/). The page is only the UI; the PeerJS cloud and STUN servers help peers find each other.

```
                    ┌─────────────────────┐
                    │  PeerJS signaling    │
                    │  (ID lookup + SDP)   │
                    └──────────┬──────────┘
                               │  “who is dobblehost-W7K2?”
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
     Host tab              Guest on Wi‑Fi       Guest on LTE
     (authoritative        same café            different city
      game state)
          │                    │                    │
          └──────── WebRTC data channels ───────────┘
                   (cards, clicks, lobby)
```

### Same network (same Wi‑Fi / LAN)

1. Host creates a room; guests type the code or scan the QR.
2. PeerJS introduces the browsers (signaling).
3. ICE gathers **local** candidates (`192.168.x.x`, etc.).
4. The data channel often stays on the LAN: low latency, no extra hops.

This is the most reliable path. The lobby even hints that same Wi‑Fi works best.

### Different networks (internet, mobile data, another house)

1. Guests still connect to `dobblehost-XXXX` through PeerJS signaling. They do not need the host’s IP.
2. Google STUN (`stun.l.google.com`, `stun1.l.google.com`) helps each browser discover its public address through NAT.
3. WebRTC then tries a **direct** peer-to-peer data channel across the internet.

Invite options that work across networks:

| Method | What happens |
| --- | --- |
| 4-letter code | Guest opens the same URL, types `W7K2`, joins `dobblehost-W7K2`. |
| Copy link | URL is `https://yoursite/Dobble.html?room=W7K2`. The join field is prefilled. |
| QR code | Encodes that invite URL. Phones on cellular can scan it from the host’s screen. |

The host tab must stay open. Guests talk to the host, not to a cloud game server.

### What this setup does *not* do

There is **no TURN relay**. If both sides are behind strict symmetric NATs (some offices, some mobile carriers), STUN may not be enough and the join can fail. Same Wi‑Fi almost always works; cross-network usually works on typical home routers.

HTTPS is required for WebRTC in modern browsers, which is why GitHub Pages / Netlify are a good fit.

---

## Game logic

### The math: why every pair of cards shares one symbol

Dobble is a finite geometry. This build uses order **n = 7**:

| | Count |
| --- | --- |
| Symbols per card | n + 1 = **8** |
| Unique symbols | n² + n + 1 = **57** |
| Cards in the deck | n² + n + 1 = **57** |

`generateDeck(n)` builds the classic affine-plane construction:

1. One starter card `[0, 1, …, n]`.
2. *n* cards that all share symbol `0`, plus a block of “new” symbols.
3. *n × n* remaining cards using modular arithmetic so each pair of cards intersects in exactly one index.

Those indices are not emojis yet. At deal time the host shuffles a permutation of the 57 emoji IDs and remaps every card. Each match uses a different mapping, but the **intersection property is unchanged**.

The leftover pile is shuffled and dealt. One card becomes the **center**. Each player gets a private stack (`cards each`: 5 / 8 / 12, or the whole remaining deck split evenly).

### How a round is won

This is the “The Tower” / well variant:

- You always see **your top card** and the **center card**.
- Exactly one emoji appears on both. Tap it on either card.
- **Correct:** host locks the table, highlights that symbol for ~900 ms, awards a point, then **your card becomes the new center**. You now have one fewer card.
- **Wrong or too slow on a miss:** that player is frozen ~1.6 s and cannot tap. Others keep playing.
- **Win:** first player whose hand is empty.

Because the new center is the card you just matched, the next intersection is a different symbol. Everyone’s remaining top cards are still guaranteed to share exactly one symbol with it.

### Host authority (anti-desync)

Guests never decide “that was a match.” Flow:

```
Guest taps ──► { type: "click", symbol, round } ──► host
Host checks:
  • game is playing and not locked
  • click is for the current round
  • player has a card and is not frozen
  • intersection(hand[0], center) is exactly that symbol
Then hostBroadcast() sends each player a fresh view
```

The host’s own taps call `hostHandleClick` directly. Solo mode is the same path with a single local player and no PeerJS.

Wrong taps still play a local buzz immediately (snappy feel), but the freeze only sticks after the host confirms.

### What each player actually sees

`playerView` is a stripped snapshot:

- Public: center card, banner, scores, cards remaining, who is frozen.
- Private: **your** top card only — never opponents’ hands.

Symbol positions on a card are not random per browser. `layoutSymbols` seeds a `mulberry32` RNG from a hash of the card’s IDs, so every client draws the same sizes, rotations, and spots. When the host highlights a match, everyone sees the same emoji pop in the same place.

---

## Message protocol

Tiny JSON over the PeerJS data channel:

| From | Type | Meaning |
| --- | --- | --- |
| Guest → host | `join` | Name for the lobby list |
| Guest → host | `click` | Tapped symbol + round |
| Host → guest | `state` | Lobby or in-game view (includes `edition`) |
| Host → guest | `error` | e.g. game already started |

That is the entire network API.

---

## Run it

Open `Dobble.html` in a browser, or serve the folder:

```bash
npx serve .
```

Then visit `http://localhost:3000/Dobble.html`.

For friends on other networks, put the file on any static HTTPS host. PeerJS is loaded from a CDN; players need internet for signaling even on LAN.

## License

Playable fan implementation of the Dobble / Spot It! rules. The name and original artwork belong to their owners.
