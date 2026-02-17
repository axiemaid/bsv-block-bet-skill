#!/usr/bin/env node
/**
 * BSV Block Bet Client v3 — Place bets by sending BSV to even/odd addresses.
 * No rounds — every bet is independent, SatoshiDice-style.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BET_API = process.env.BET_API || 'https://blockbet.axiemaid.com';
const WALLET_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'bsv-wallet.json');
const WOC_BASE = 'https://api.whatsonchain.com/v1/bsv/main';
const FEE_RATE = 1;

// --- HTTP helpers ---
function httpReq(urlStr, method, body) {
  const url = new URL(urlStr);
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: { 'User-Agent': 'bsv-bet-client/3.0', 'Content-Type': 'application/json' }
    };
    const req = lib.request(opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    https.get(urlStr, { headers: { 'User-Agent': 'bsv-bet-client/3.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    }).on('error', reject);
  });
}

function httpPost(urlStr, body) {
  const url = new URL(urlStr);
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname, path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// --- Wallet ---
function loadWallet() {
  if (!fs.existsSync(WALLET_PATH)) return null;
  return JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8'));
}

function ensureBsv() {
  try {
    return require('bsv');
  } catch {
    // Try BSV wallet skill location first
    const bsvSkillDir = path.join(__dirname, '..', '..', '..', 'bsv', 'bsv-openclaw-skill');
    try {
      return require(path.join(bsvSkillDir, 'node_modules', 'bsv'));
    } catch {}
    // Auto-install locally
    const { execSync } = require('child_process');
    const skillDir = path.join(__dirname, '..');
    if (!fs.existsSync(path.join(skillDir, 'node_modules', 'bsv'))) {
      console.error('Installing bsv package...');
      execSync('npm install bsv@2 --save --no-fund --no-audit', { cwd: skillDir, stdio: 'inherit' });
    }
    return require(path.join(skillDir, 'node_modules', 'bsv'));
  }
}

// --- Send BSV ---
async function sendToAddress(toAddress, amountSats) {
  const bsv = ensureBsv();
  const w = loadWallet();
  if (!w) throw new Error('No wallet. Run: node wallet.cjs init');

  const utxos = await httpGet(`${WOC_BASE}/address/${w.address}/unspent`);
  if (!utxos.length) throw new Error('No UTXOs available (zero balance)');

  utxos.sort((a, b) => b.value - a.value);

  let selected = [];
  let totalIn = 0;
  for (const u of utxos) {
    selected.push(u);
    totalIn += u.value;
    const estFee = (148 * selected.length + 34 * 2 + 10) * FEE_RATE;
    if (totalIn >= amountSats + estFee) break;
  }

  const fee = (148 * selected.length + 34 * 2 + 10) * FEE_RATE;
  const change = totalIn - amountSats - fee;
  if (change < 0) throw new Error(`Insufficient funds. Need ${amountSats + fee} sats, have ${totalIn} sats`);

  const privKey = bsv.PrivKey.fromWif(w.wif);
  const keyPair = bsv.KeyPair.fromPrivKey(privKey);
  const pubKey = keyPair.pubKey;

  const tx = new bsv.Tx();
  const inputTxOuts = [];

  for (const u of selected) {
    const rawTx = await httpGet(`${WOC_BASE}/tx/${u.tx_hash}/hex`);
    const prevTx = bsv.Tx.fromHex(typeof rawTx === 'string' ? rawTx : rawTx.hex || rawTx);
    const txOut = prevTx.txOuts[u.tx_pos];
    const txHashBuf = Buffer.from(u.tx_hash, 'hex').reverse();
    tx.addTxIn(txHashBuf, u.tx_pos, new bsv.Script(), 0xffffffff);
    inputTxOuts.push(txOut);
  }

  tx.addTxOut(new bsv.Bn(amountSats), bsv.Address.fromString(toAddress).toTxOutScript());
  if (change >= 546) {
    tx.addTxOut(new bsv.Bn(change), bsv.Address.fromString(w.address).toTxOutScript());
  }

  for (let i = 0; i < selected.length; i++) {
    const sig = tx.sign(keyPair, bsv.Sig.SIGHASH_ALL | bsv.Sig.SIGHASH_FORKID, i, inputTxOuts[i].script, inputTxOuts[i].valueBn);
    const sigScript = new bsv.Script();
    sigScript.writeBuffer(sig.toTxFormat());
    sigScript.writeBuffer(pubKey.toBuffer());
    tx.txIns[i].setScript(sigScript);
  }

  const txHex = tx.toHex();
  const result = await httpPost(`${WOC_BASE}/tx/raw`, { txhex: txHex });
  const txid = typeof result === 'string' ? result.replace(/"/g, '') : result.txid || result;
  return txid;
}

// --- Commands ---

async function cmdStatus() {
  const res = await httpReq(`${BET_API}/status`, 'GET');
  const s = res.body;
  console.log(`=== BSV Block Bet v3 ===`);
  console.log(`\nBet by sending BSV to:`);
  console.log(`  Even: ${s.evenAddress || '(not available)'}`);
  console.log(`  Odd:  ${s.oddAddress || '(not available)'}`);
  console.log(`\nMin: ${s.config.minBet} sats | Max: ${s.config.maxBet} sats | Payout: ${s.config.payoutMult}x`);
  if (s.currentHeight) console.log(`Chain height: #${s.currentHeight}`);
  console.log(`Pending bets: ${s.pendingBets} (${s.totalPendingAmount} sats)`);
}

async function cmdBet(pick, amountSats) {
  if (!pick || !['even', 'odd'].includes(pick)) {
    console.error('Usage: node bet.cjs bet <even|odd> <amount_sats>');
    process.exit(1);
  }
  const amount = parseInt(amountSats, 10);
  if (!amount || amount < 1000) {
    console.error('Amount must be at least 1000 sats');
    process.exit(1);
  }

  const w = loadWallet();
  if (!w) { console.error('No wallet. Run: node wallet.cjs init'); process.exit(1); }

  console.log(`Fetching bet addresses...`);
  const addrRes = await httpReq(`${BET_API}/address`, 'GET');
  if (addrRes.status !== 200) {
    console.error(`Error fetching addresses: ${JSON.stringify(addrRes.body)}`);
    process.exit(1);
  }
  const targetAddress = addrRes.body[pick];
  if (!targetAddress) {
    console.error(`No ${pick} address available`);
    process.exit(1);
  }

  console.log(`Sending ${amount} sats to ${pick} address: ${targetAddress}`);
  try {
    const txid = await sendToAddress(targetAddress, amount);
    console.log(`✅ Bet placed! TXID: ${txid}`);
    console.log(`Pick: ${pick} | Amount: ${amount} sats`);
    console.log(`Target block will be assigned when detected (~30s).`);
    console.log(`Check status: node bet.cjs check ${txid}`);
  } catch (e) {
    console.error(`❌ Failed: ${e.message}`);
    process.exit(1);
  }
}

async function cmdCheck(betId) {
  if (!betId) { console.error('Usage: node bet.cjs check <txid or txid:vout>'); process.exit(1); }
  const res = await httpReq(`${BET_API}/bet/${encodeURIComponent(betId)}`, 'GET');
  if (res.status !== 200) {
    console.error(`Error: ${res.body.error || 'Bet not found'}`);
    process.exit(1);
  }
  const b = res.body;
  console.log(`Bet ${b.id}:`);
  console.log(`  Pick:         ${b.pick}`);
  console.log(`  Amount:       ${b.amount} sats`);
  console.log(`  Status:       ${b.status}`);
  console.log(`  Target block: #${b.targetHeight}`);
  console.log(`  Return:       ${b.returnAddress}`);
  console.log(`  Deposit tx:   ${b.depositTxid}`);
  if (b.blockHash) {
    console.log(`  Block hash:   ${b.blockHash}`);
    console.log(`  Parity:       ${b.parity}`);
  }
  if (b.settleTxid) {
    console.log(`  Settle tx:    ${b.settleTxid}`);
  }
  if (b.status === 'won') {
    console.log(`  Payout:       ${Math.floor(b.amount * 1.94)} sats`);
  }
}

async function cmdHistory() {
  const res = await httpReq(`${BET_API}/history`, 'GET');
  const blocks = res.body.blocks || [];
  if (!blocks.length) { console.log('No settled bets yet'); return; }
  console.log('=== Recent Settled Bets ===');
  for (const block of blocks) {
    const hash = block.blockHash ? block.blockHash.slice(-8) : '—';
    console.log(`\nBlock #${block.targetHeight} | parity: ${block.parity || '—'} | hash: ...${hash}`);
    for (const b of block.bets) {
      const result = b.status === 'won' ? `✅ +${b.payout}` : `❌ -${b.amount}`;
      const addr = b.returnAddress.slice(0, 8) + '...';
      console.log(`  ${b.pick.padEnd(4)} | ${b.amount} sats | ${addr} | ${result}`);
    }
  }
}

async function cmdStats() {
  const res = await httpReq(`${BET_API}/stats`, 'GET');
  if (res.status !== 200) { console.error('Failed to fetch stats'); process.exit(1); }
  const s = res.body;
  console.log('=== Block Bet Dashboard ===');
  console.log(`Total wagered:  ${s.totalWagered} sats`);
  console.log(`Total payouts:  ${s.totalPayouts} sats`);
  console.log(`House profit:   ${s.houseProfit} sats`);
  console.log(`House balance:  ${s.houseBalance} sats`);
  console.log(`Blocks played:  ${s.totalBlocks}`);
  console.log(`Total bets:     ${s.totalBets} (${s.totalWins}W / ${s.totalLosses}L)`);
  console.log(`Unique players: ${s.uniquePlayers}`);
  console.log(`Even wins: ${s.evenWins} | Odd wins: ${s.oddWins}`);
}

async function cmdPlayer(address) {
  if (!address) {
    const w = loadWallet();
    if (!w) { console.error('Usage: node bet.cjs player <address>'); process.exit(1); }
    address = w.address;
  }
  const res = await httpReq(`${BET_API}/player/${address}`, 'GET');
  if (res.status !== 200) { console.error(res.body.error || 'Player not found'); process.exit(1); }
  const p = res.body;
  console.log(`=== Player: ${p.address} ===`);
  console.log(`Total wagered:  ${p.totalWagered} sats`);
  console.log(`Total payouts:  ${p.totalPayouts} sats`);
  console.log(`Net profit:     ${p.netProfit >= 0 ? '+' : ''}${p.netProfit} sats`);
  console.log(`Record:         ${p.wins}W / ${p.losses}L (${p.winRate}%)`);
  console.log(`Active bets:    ${p.activeBets}`);
  if (p.recentBets && p.recentBets.length) {
    console.log(`\nRecent bets:`);
    for (const b of p.recentBets) {
      const result = b.status === 'won' ? `✅ +${b.payout}` : `❌ -${b.amount}`;
      console.log(`  #${b.targetHeight} | ${b.pick.padEnd(4)} | ${b.amount} sats | ${result}`);
    }
  }
}

async function cmdLeaderboard() {
  const res = await httpReq(`${BET_API}/leaderboard`, 'GET');
  if (res.status !== 200) { console.error('Failed to fetch leaderboard'); process.exit(1); }
  const lb = res.body.leaderboard || [];
  if (!lb.length) { console.log('No players yet'); return; }
  console.log('=== Leaderboard ===');
  console.log(`${'#'.padEnd(4)} ${'Address'.padEnd(36)} ${'Profit'.padStart(10)} ${'Bets'.padStart(6)} ${'Win%'.padStart(6)}`);
  lb.forEach((p, i) => {
    const addr = p.address.slice(0, 8) + '...' + p.address.slice(-4);
    const profit = (p.netProfit >= 0 ? '+' : '') + p.netProfit;
    console.log(`${String(i + 1).padEnd(4)} ${addr.padEnd(36)} ${profit.padStart(10)} ${String(p.bets).padStart(6)} ${(p.winRate + '%').padStart(6)}`);
  });
}

// --- Main ---
const [,, cmd, ...args] = process.argv;
const commands = {
  status: cmdStatus,
  bet: () => cmdBet(args[0], args[1]),
  check: () => cmdCheck(args[0]),
  history: cmdHistory,
  stats: cmdStats,
  player: () => cmdPlayer(args[0]),
  leaderboard: cmdLeaderboard,
  lb: cmdLeaderboard,
};

if (!cmd || !commands[cmd]) {
  console.log('BSV Block Bet Client v3 — Commands:');
  console.log('  status              Service status + bet addresses');
  console.log('  bet <even|odd> <sats>  Send BSV to bet');
  console.log('  check <txid>        Check bet status by txid');
  console.log('  history             Recent settled bets by block');
  console.log('  stats               Global dashboard');
  console.log('  player [address]    Player profile (default: own wallet)');
  console.log('  leaderboard         Top players by profit');
  process.exit(0);
}

commands[cmd]().catch(e => { console.error(`Error: ${e.message}`); process.exit(1); });
