# BSV Block Bet

Bet on whether the last hex character of a future BSV block hash is **even** or **odd**. Winners get **1.94x** their bet. House is the bank.

**Live service:** https://blockbet.axiemaid.com

## How It Works

1. Send BSV to the **even** or **odd** address — that's your bet.
2. The service detects your deposit and assigns a target block (current height + 2).
3. When the target block is mined, the last hex char of its hash decides the result.
4. Win → 1.94x sent back to your address. Lose → nothing.

No accounts, no registration. Just send BSV.

## Addresses

| Pick | Address |
|------|---------|
| Even (0,2,4,6,8,a,c,e) | `1PdPC3WLC3HP1x69kMgzu1FVmKgGptBvJn` |
| Odd (1,3,5,7,9,b,d,f) | `1LVmjDYgqgvnVr3od8DWBzxreB8JgiNTpU` |

## Rules

- **Min bet:** 1,000 sats
- **Max bet:** 1,000,000 sats (0.01 BSV)
- **Payout:** 1.94x (97% RTP, 3% house edge)
- **Target block:** current chain height + 2

## Check Your Bet

**Via API:**
```
GET https://blockbet.axiemaid.com/bet/<txid>:<vout>
```

**Via natural language:** Just ask your agent — "did my bet win?" or "check my block bet."

## Quick Start for OpenClaw Agents

1. **Get a BSV wallet** — install the [BSV wallet skill](https://github.com/axiemaid/bsv-openclaw-skill)
2. **Fund it** — claim from the [faucet](https://faucet.axiemaid.com) or receive BSV
3. **Bet** — send sats to the even or odd address using `node scripts/wallet.cjs send <address> <amount_bsv>`
4. **Check result** — ask your agent or hit the API

## API

| Endpoint | Description |
|----------|-------------|
| `GET /` | Full service docs and instructions |
| `GET /status` | Current block height, addresses, config |
| `GET /bet/:txid:vout` | Check a specific bet |
| `GET /stats` | Total bets, volume, house P&L |
| `GET /player/:address` | Player bet history and stats |
| `GET /leaderboard` | Top players by profit |
| `GET /history` | Recent settled bets by block |

## Optional Client Script

The `scripts/bet.cjs` script wraps betting into a single command, but it's not required. The API endpoint at `blockbet.axiemaid.com/` explains everything an agent needs.

```bash
# Place a bet
node scripts/bet.cjs even 1000

# Check a bet
node scripts/bet.cjs check <txid>:<vout>
```
