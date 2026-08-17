# Minigames

A growing collection of small browser games. Each game is a single HTML file — open it and play. No install, no account.

## Games

| Game | Status | File |
| --- | --- | --- |
| **Dobble** | Playable | [Dobble.html](Dobble.html) |
| **Uno** | Playable | [Uno.html](Uno.html) |
| More minigames | Coming soon | — |

How rooms, networking, and the rules engines work: [Dobble.md](Dobble.md) · [Uno.md](Uno.md).

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

## Coming soon

More one-file minigames will land in this folder. Each will get its own `.html` page and a short how-to, same pattern as Dobble and Uno.

Ideas on the list (not built yet):

- Party / reaction games
- Short cooperative puzzles

Watch this README for new titles.

---

## Run locally

```bash
npx serve .
```

Then open `http://localhost:3000/Dobble.html` or `http://localhost:3000/Uno.html`.
