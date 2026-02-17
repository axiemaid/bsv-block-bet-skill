---
name: block-bet
description: Bet on BSV block hash parity (even/odd). SatoshiDice-style — just send BSV to bet.
---

# BSV Block Bet

Bet on whether the last hex character of a future BSV block hash is **even** (0,2,4,6,8,a,c,e) or **odd** (1,3,5,7,9,b,d,f).

**Fixed odds: 1.94x payout** (3% house edge). No registration, no accounts — just send BSV.

Service: `https://blockbet.axiemaid.com`

## Prerequisites

- **BSV skill** — needed for wallet management (`wallet.cjs`). Install from: https://github.com/axiemaid/bsv-openclaw-skill
- A funded BSV wallet (`node scripts/wallet.cjs init` via the BSV skill)
- First run auto-installs the `bsv` npm package

## How It Works

1. Check the current round and get the bet addresses
2. Send BSV to the **even** or **odd** address — that's your bet
3. Service detects your deposit automatically
4. Target block mines → hash determines winner
5. Winners get 1.94x sent back to their address

No API call needed to bet. Just a BSV transaction.

## Commands

### Check current round
```bash
node scripts/bet.cjs status
```
Shows the even/odd addresses, current round target block, pool sizes, and config.

### Place a bet
```bash
node scripts/bet.cjs bet <even|odd> <amount_sats>
```
Fetches the bet address from the service, sends BSV directly. Min 1,000 sats, max 100,000 sats.

Always confirm with the user before placing a bet.

### Check a bet
```bash
node scripts/bet.cjs check <txid>
```
Look up a bet by its deposit transaction ID.

### Recent rounds
```bash
node scripts/bet.cjs history
```

### Global stats
```bash
node scripts/bet.cjs stats
```
Total wagered, house profit, rounds played, win distribution.

### Player profile
```bash
node scripts/bet.cjs player [address]
```
Win/loss record, net profit, recent bets. Defaults to own wallet if no address given.

### Leaderboard
```bash
node scripts/bet.cjs leaderboard
```
Top players ranked by profit. Alias: `lb`.

## Bet Addresses

These are permanent — same addresses every round:

| Pick | Address |
|------|---------|
| Even | `1PdPC3WLC3HP1x69kMgzu1FVmKgGptBvJn` |
| Odd  | `1LVmjDYgqgvnVr3od8DWBzxreB8JgiNTpU` |

Or fetch them live: `GET https://blockbet.axiemaid.com/address`

## Round Timing

- Rounds target a block ~3 blocks ahead of current height
- Betting closes 1 block before target (buffer)
- Late deposits roll into the next round
- New round starts automatically after settlement

## API (read-only)

All endpoints at `https://blockbet.axiemaid.com`:

| Endpoint | Description |
|----------|-------------|
| `GET /status` | Current round, addresses, config |
| `GET /address` | Even/odd/house addresses |
| `GET /bet/:txid` | Bet details by deposit txid |
| `GET /round/:height` | Round results |
| `GET /history` | Recent rounds |
| `GET /stats` | Global dashboard |
| `GET /player/:address` | Player profile |
| `GET /leaderboard` | Top players |

## Notes

- Bets below 1,000 or above 100,000 sats are ignored
- The service resolves your return address from your transaction's inputs
- All bets and payouts are on-chain BSV transactions
- Source: https://github.com/axiemaid/bsv-block-bet
