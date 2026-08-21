# Minigames

**Play online:** [https://myminigames.netlify.app/](https://myminigames.netlify.app/)

A growing collection of small browser games. Each game is a single HTML file — open it and play. No install, no account.

The hub is [index.html](index.html): a grid of every title. Open that first, or jump straight to a game below.

## Games

| Game | Status | File |
| --- | --- | --- |
| **Hub** | Playable | [index.html](index.html) |
| **Dobble** | Playable | [Dobble.html](Dobble.html) |
| **Uno** | Playable | [Uno.html](Uno.html) |
| **Uno Flip** | Playable | [unoflip.html](unoflip.html) |
| **Cubestacc** | Solo vs bots | [Cubestacc.html](Cubestacc.html) |
| More minigames | Coming soon | — |

How rooms, networking, and the rules engines work: [Dobble.md](Dobble.md) · [Uno.md](Uno.md) · [Cubestacc.md](Cubestacc.md). Shared lobby, invite, join, loading, and leave chrome lives in [shared/](shared/README.md) so a new game only needs its board and rules.

---

## How to play Dobble

Any two cards share **exactly one** symbol. Find it and tap it before everyone else. First player to empty their pile wins.

### Setup

1. Open [Dobble.html](Dobble.html) in a browser.
2. Type your name.
3. Choose one:
   - **Create room** — you are the host. Share the 4-letter code, the invite link, or the QR code.
   - **Join friends** — type the host’s code (or open a link that already has `?room=ABCD`).
   - **Practice solo** — play alone against the clock, no lobby.

Everyone must open the **same** `Dobble.html` page. Friends on the same Wi‑Fi or on a different network can join the same lobby.

### In the lobby

- Wait until everyone has connected.
- The host picks how many cards each player gets (quick / normal / long / entire deck).
- Host taps **Start game**. Keep the host tab open for the whole match.

### During a round

You see two cards: **yours** (top of your pile) and the **center**.

1. Scan both cards for the one matching emoji.
2. Tap that symbol on either card.
3. If you are right, your card becomes the new center and you have one fewer card.
4. If you miss, you freeze for a moment while others keep playing.

### Winning

The first player with **no cards left** wins. Scores and cards remaining show at the top. After the match, the host can play again with the same lobby or everyone can go home.

### Tips

- Same Wi‑Fi is the most reliable for joining.
- The host must stay on the page. If the host closes the tab, the room ends.
- You cannot join a game that has already started. Wait for the next round.

---

## How to play Uno

Match the discard’s **color** or **number**. First player to empty their hand wins.

### Setup

1. Open [Uno.html](Uno.html) in a browser.
2. Type your name.
3. Choose one:
   - **Create room** — you are the host. Share the 4-letter code, the invite link, or the QR code.
   - **Join friends** — type the host’s code (or open a link that already has `?room=ABCD`).
   - **Practice solo** — play against 1–3 bots, no lobby.

Everyone must open the **same** `Uno.html` page. Friends on the same Wi‑Fi or on a different network can join the same lobby.

### In the lobby

- Wait until at least two people have connected.
- Host taps **Start game**. Keep the host tab open for the whole match.

### During a turn

You see the discard, the current color, and **your** hand.

1. Tap a highlighted card that matches color or number (or a Wild).
2. If you cannot play, tap the draw pile. You may play the drawn card if it fits, or tap **Keep**.
3. Skip, Reverse, Draw Two, Wild, and Wild +4 do what they say on the card.
4. When you have two cards, tap **UNO!** before going down to one — or you draw 2.

### Winning

The first player with **no cards left** wins. After the match, the host can play again with the same lobby or everyone can go home.

### Tips

- Same Wi‑Fi is the most reliable for joining.
- The host must stay on the page. If the host closes the tab, the room ends.
- You cannot join a game that has already started. Wait for the next round.
- Wild Draw Four is only legal if you have no card of the current color.

---

## How to play Uno Flip

Same lobby, UNO call, Caught window, stacking, and voice as Uno. Open [unoflip.html](unoflip.html).

The deck is **112 double-sided cards**. Each physical card has a Light face and a Dark face. Playing Flip turns every hand, the draw pile, and the discard to the other side.

**Light** (red / yellow / green / blue): numbers **1–9** twice per color (no 0s), plus Skip, Reverse, Draw One (+1), Flip, Wild, and Wild Draw Two (+2).

**Dark** (pink / teal / orange / purple): numbers **1–9** twice per color, plus Skip Everyone, Reverse, Draw Five (+5), Flip, Wild, and Wild Draw Color.

- Skip Everyone means you play again. Wild Draw Color: the next player draws until they get the chosen color.
- +1 stacks with +1 or Wild +2. +5 stacks with +5 or Wild Draw Color.

Everyone must open the **same** `unoflip.html` page (Uno rooms do not mix with Flip rooms).

---

## How to play Cubestacc

Open [Cubestacc.html](Cubestacc.html). Solo vs bots is ready; online rooms come later.

Match **suit** (TOP), **rank** (SIDE), or **face** (FACE) onto the shared cube STACC. First empty hand wins. At two cards, tap **UH OH!** before going to one — or get Caught for +3.

Specials: J +1 · Q skip · K +2 (stackable) · A extra turn · 0 reverse + block top · Wild picks suit. Full notes: [Cubestacc.md](Cubestacc.md). Inspired by STACCS; not affiliated with STICCY.

---

## Coming soon

More one-file minigames will land in this folder. Each will get its own `.html` page and a short how-to, same pattern as Dobble and Uno.

Ideas on the list (not built yet):

- Online Cubestacc rooms
- Party / reaction games
- Short cooperative puzzles

Watch this README for new titles.

---

## Run locally

```bash
npx serve .
```

Then open `http://localhost:3000/` for the game grid, or `Dobble.html` / `Uno.html` directly.

## Deploy on Netlify

Upload **this whole folder**, not a single game file. Netlify needs `index.html`, the game HTML files, and the `shared/` folder together.

1. Push this repo and connect it in Netlify, **or** drag the MiniGames folder onto [app.netlify.com/drop](https://app.netlify.com/drop).
2. Set **publish directory** to the site root (`.` / leave blank). Do not point it at one game file.
3. After deploy:
   - `https://your-site.netlify.app/` → game hub (`index.html`)
   - `/Uno.html` or `/uno` → Uno
   - `/Dobble.html` or `/dobble` → Dobble

If `/` still opens Uno, the site is serving an old drop of `Uno.html` as the index. Trigger a new deploy of the full folder so `index.html` is the homepage.
