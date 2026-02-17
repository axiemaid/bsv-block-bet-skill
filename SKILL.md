---
name: block-bet
description: Bet on BSV block hash parity (even/odd). SatoshiDice-style — every bet is independent, no rounds.
---

# BSV Block Bet

Bet on whether the last hex character of a future BSV block hash is **even** (0,2,4,6,8,a,c,e) or **odd** (1,3,5,7,9,b,d,f).

**Fixed odds: 1.94x payout** (3% house edge). No registration, no accounts, no rounds — just send BSV.

Every bet is its own independent game. When detected, a target block (current height + 2) is assigned. When that block mines, the hash determines the winner.

Service: `https://blockbet.axiemaid.com`

## Prerequisites

- **BSV skill** — needed for wallet management (`wallet.cjs`). Install from: https://github.com/axiemaid/bsv-openclaw-skill
- A funded BSV wallet (`node scripts/wallet.cjs init` via the BSV skill)
- First run auto-installs the `bsv` npm package

## How It Works

1. Check the service status and get the bet addresses
2. Send BSV to the **even** or **odd** address — that's your bet
3. Service detects your deposit (~30s) and assigns target block = current height + 2
4. Target block mines → last hex char of hash determines even/odd
5. Winners get 1.94x sent back to their address

No rounds, no waiting windows. Every bet settles independently based on its own target block.

## Commands

### Check service status
```bash
node scripts/bet.cjs status
```
Shows even/odd addresses, current chain height, pending bets, and config.

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
Look up a bet by its deposit transaction ID. Shows target block, status, block hash/parity when settled.

### Recent settled bets
```bash
node scripts/bet.cjs history
```
Shows recently settled bets grouped by target block.

### Global stats
```bash
node scripts/bet.cjs stats
```
Total wagered, house profit, blocks played, win distribution.

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

These are permanent — same addresses always:

| Pick | Address |
|------|---------|
| Even | `1PdPC3WLC3HP1x69kMgzu1FVmKgGptBvJn` |
| Odd  | `1LVmjDYgqgvnVr3od8DWBzxreB8JgiNTpU` |

Or fetch them live: `GET https://blockbet.axiemaid.com/address`

## Bet Lifecycle

1. Player sends BSV to even/odd address
2. Service detects UTXO (~30s poll), assigns target block = current + 2
3. When target block mines, hash parity is checked
4. Settlement TX built: bet UTXOs as inputs, winner payouts as outputs
5. Each bet is independent — multiple bets can target different blocks simultaneously

## API (read-only)

All endpoints at `https://blockbet.axiemaid.com`:

| Endpoint | Description |
|----------|-------------|
| `GET /status` | Service status, addresses, pending bets, config |
| `GET /address` | Even/odd/house addresses |
| `GET /bet/:txid` | Bet details (includes targetHeight, blockHash, parity) |
| `GET /history` | Recent settled bets grouped by target block |
| `GET /stats` | Global dashboard |
| `GET /player/:address` | Player profile |
| `GET /leaderboard` | Top players |

## Notes

- Bets below 1,000 or above 100,000 sats are ignored
- The service resolves your return address from your transaction's inputs
- All bets and payouts are on-chain BSV transactions
- Bets targeting the same block are settled in one transaction for efficiency
- Source: https://github.com/axiemaid/bsv-block-bet
