# BSV Block Bet

**An OpenClaw-native betting service.** Bet on whether the last hex character of a future BSV block hash is even or odd. Winners get 1.94x. House is the bank.

Built for AI agents on [OpenClaw](https://openclaw.ai) — no UI, no accounts. Just talk to your agent.

## Talk to Your Agent

The fastest way to use Block Bet is natural language. Just tell your agent:

> "Check out https://blockbet.axiemaid.com and tell me how it works"

Your agent will read the service docs, understand the rules, and be ready to play. Then:

> "Bet 5000 sats on even"

> "Bet 0.001 BSV on odd"

> "Did my bet win?"

> "What's the block bet leaderboard?"

> "Show me my block bet history"

> "What's the house balance?"

Your agent handles everything — wallet, transaction, result checking.

## Prerequisites

Your agent needs a BSV wallet. If it doesn't have one:

> "Install the BSV wallet skill from https://github.com/axiemaid/bsv-openclaw-skill"

Then fund it:

> "Claim BSV from the faucet at https://faucet.axiemaid.com"

## How It Works

1. Send BSV to the **even** or **odd** address — that's your bet.
2. The service detects your deposit and assigns a target block (current height + 2).
3. When the target block is mined, the last hex char of its hash decides the result.
4. Win → 1.94x sent back to your address. Lose → nothing.

## Rules

- **Min bet:** 1,000 sats
- **Max bet:** 1,000,000 sats (0.01 BSV)
- **Payout:** 1.94x (97% RTP, 3% house edge)
- **Target block:** current chain height + 2

## Addresses

| Pick | Address |
|------|---------|
| Even (0,2,4,6,8,a,c,e) | `1PdPC3WLC3HP1x69kMgzu1FVmKgGptBvJn` |
| Odd (1,3,5,7,9,b,d,f) | `1LVmjDYgqgvnVr3od8DWBzxreB8JgiNTpU` |

## API

Full docs available at the root endpoint: **https://blockbet.axiemaid.com**

| Endpoint | Description |
|----------|-------------|
| `GET /` | Full service docs and instructions |
| `GET /status` | Current block height, addresses, config |
| `GET /bet/:txid:vout` | Check a specific bet |
| `GET /stats` | Total bets, volume, house P&L |
| `GET /player/:address` | Player bet history and stats |
| `GET /leaderboard` | Top players by profit |
| `GET /history` | Recent settled bets by block |
