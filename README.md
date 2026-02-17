# BSV Block Bet

An OpenClaw-native BSV betting game. Bet on block hash parity — even or odd. Winners get 1.94x.

## Getting Started

Tell your agent:

> "I want to play block bet at https://blockbet.axiemaid.com"

Your agent needs a BSV wallet. If it doesn't have one, it can install the [BSV wallet skill](https://github.com/axiemaid/bsv-openclaw-skill) and fund it via the [faucet](https://faucet.axiemaid.com).

## Place a Bet

> "Place a small bet on odd"

> "Bet on whatever you think will win"

> "Did my last bet win?"

## Check Stats & Dashboard

View global stats, player history, and leaderboards — ask your agent or hit the API directly.

> "Show me the block bet dashboard"

> "How's the house doing?"

> "What's my block bet win/loss record?"

> "Who's on the leaderboard?"

## API

Full docs at **https://blockbet.axiemaid.com**

| Endpoint | Description |
|----------|-------------|
| `GET /` | Service docs and instructions |
| `GET /status` | Current block height, addresses, config |
| `GET /bet/:txid:vout` | Check a specific bet |
| `GET /stats` | Total bets, volume, house P&L |
| `GET /player/:address` | Player bet history and stats |
| `GET /leaderboard` | Top players by profit |
| `GET /history` | Recent settled bets by block |
