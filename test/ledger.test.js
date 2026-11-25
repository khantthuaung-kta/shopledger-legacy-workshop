const assert = require('node:assert/strict');
const test = require('node:test');
const ledger = require('../lib/ledger');

function khata() {
  return {
    customers: [{ id: 1, name: 'Test Customer', openingBalance: 100, totalBilled: 400, totalSettled: 50, balance: 450 }],
    settlements: [],
    nextSettlementId: 10
  };
}

test('a numeric settlement updates the balance and records the payment', () => {
  const db = khata();
  const result = ledger.recordSettlement(db, '1', 25, 'cash', 'Partial payment');

  assert.equal(result.ok, true);
  assert.equal(db.customers[0].totalSettled, 75);
  assert.equal(db.customers[0].balance, 425);
  assert.equal(ledger.listCustomers(db)[0].balance, 425);
  assert.equal(db.nextSettlementId, 11);
  assert.deepEqual(db.settlements, [result.settlement]);
  assert.equal(result.settlement.id, 10);
  assert.equal(result.settlement.amount, 25);
  assert.equal(result.settlement.mode, 'cash');
  assert.equal(result.settlement.note, 'Partial payment');
});

test('a string settlement updates the total and balance numerically', () => {
  const db = khata();
  const result = ledger.recordSettlement(db, '1', '25');

  assert.equal(result.ok, true);
  assert.equal(result.settlement.amount, 25);
  assert.equal(db.customers[0].totalSettled, 75);
  assert.equal(db.customers[0].balance, 425);
  assert.equal(ledger.listCustomers(db)[0].balance, 425);
});

test('fractional-paise settlements accumulate before rounding the balance', () => {
  const db = khata();

  assert.equal(ledger.recordSettlement(db, '1', '0.004').ok, true);
  assert.equal(ledger.recordSettlement(db, '1', '0.004').ok, true);

  assert.deepEqual(db.settlements.map(settlement => settlement.amount), [0.004, 0.004]);
  assert.ok(Math.abs(db.customers[0].totalSettled - 50.008) < 1e-10);
  assert.equal(db.customers[0].balance, 449.99);
  assert.equal(ledger.listCustomers(db)[0].balance, 449.99);
});

test('a nonpositive settlement is rejected without changing the account or history', () => {
  const db = khata();

  assert.deepEqual(ledger.recordSettlement(db, '1', 0), {
    ok: false,
    error: 'Settlement amount must be greater than zero'
  });
  assert.deepEqual(db, khata());
});
