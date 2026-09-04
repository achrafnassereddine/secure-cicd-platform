import fs from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/security-gate.mjs <report...>');
  process.exit(2);
}

let high = 0;
let critical = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  const upper = text.toUpperCase();
  high += (upper.match(/"SEVERITY"\s*:\s*"HIGH"/g) ?? []).length;
  critical += (upper.match(/"SEVERITY"\s*:\s*"CRITICAL"/g) ?? []).length;
}

if (critical > 0 || high > 0) {
  console.error(`Security gate failed: ${critical} critical, ${high} high findings.`);
  process.exit(1);
}
console.log('Security gate passed: no high/critical findings detected in supplied reports.');
