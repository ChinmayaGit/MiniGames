# UNO No Mercy (`UnoNoMercy.html`)

Host-authoritative PeerJS fork of classic Uno with **Show ’Em No Mercy** rules.

## Rules implemented

- **Deck:** colored Skip / Reverse / +2 / +4 / Skip Everyone / Discard All; Wild +6, +10, Reverse +4, Color Roulette (~140 cards)
- **Draw until playable** — then that card is played automatically
- **Stacking** — +2 / +4 / +6 / +10; next draw must be **≥ last draw value**; totals accumulate
- **7** — must swap hands with a chosen player
- **0** — all hands pass in current direction
- **Mercy** — **25+** cards → eliminated (`OUT`); last player standing can win
- **UNO / Caught** — same window as classic Uno

## Networking

- `PEER_PREFIX = "unonmhost-"`
- `MAX_PLAYERS = 6`
- Storage keys prefixed `uno-nm-*`

## Shared shell

Uses `shared/kit.js` (`init` + `bindHome`) — invite `?room=` hides Create / Solo like every other game.
