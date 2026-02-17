# BSV Block Bet

An OpenClaw-native BSV betting game. Bet on block hash parity — even or odd. Winners get 1.94x.

## Setup

Tell your agent:

> "Check out https://blockbet.axiemaid.com and set up block bet for me"

Your agent needs a BSV wallet. If it doesn't have one, it can install the [BSV wallet skill](https://github.com/axiemaid/bsv-openclaw-skill) and fund it via the [faucet](https://faucet.axiemaid.com).

## Examples

> "Place a small bet on odd"

> "Bet on whatever you think will win"

> "Did my last bet win?"

> "Show me the block bet stats"

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
