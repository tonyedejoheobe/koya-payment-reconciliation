// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

const latestAttemptByTxnId = new Map();
const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n");

for (const line of lines) {
  if (line.trim() === "") continue;

  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  if (
    event === null ||
    typeof event !== "object" ||
    Array.isArray(event) ||
    event.txn_id === undefined ||
    event.txn_id === null ||
    event.txn_id === ""
  ) {
    continue;
  }

  const timestamp = Date.parse(event.ts);
  const latestAttempt = latestAttemptByTxnId.get(event.txn_id);
  if (!latestAttempt || timestamp >= latestAttempt.timestamp) {
    latestAttemptByTxnId.set(event.txn_id, { event, timestamp });
  }
}

let total = 0;
let count = 0;
for (const { event } of latestAttemptByTxnId.values()) {
  if (event.status === "success") {
    total += Number(String(event.amount).replace(/,/g, ""));
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
