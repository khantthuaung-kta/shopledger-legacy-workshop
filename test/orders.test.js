const assert = require('node:assert/strict');
const test = require('node:test');
const orders = require('../lib/orders');

function orderHistory() {
  return {
    orders: [
      { id: 1, date: '30/01/2025' },
      { id: 2, date: '31/01/2025' },
      { id: 3, date: '01/02/2025' },
      { id: 4, date: '02/02/2025' }
    ]
  };
}

function listedIds(db, filters) {
  return orders.list(db, filters).map(order => order.id);
}

test('order history sorts newest first across months', () => {
  const db = orderHistory();

  assert.deepEqual(listedIds(db), [4, 3, 2, 1]);
  assert.deepEqual(db.orders.map(order => order.id), [1, 2, 3, 4]);
});

test('a from-only filter excludes orders before February 1', () => {
  assert.deepEqual(listedIds(orderHistory(), { from: '2025-02-01' }), [4, 3]);
});

test('a to-only filter excludes orders after January 31', () => {
  assert.deepEqual(listedIds(orderHistory(), { to: '2025-01-31' }), [2, 1]);
});

test('a date range crossing month end includes both bounds', () => {
  assert.deepEqual(listedIds(orderHistory(), { from: '2025-01-31', to: '2025-02-01' }), [3, 2]);
});

test('order history includes both date bounds within a single month', () => {
  const db = orderHistory();
  db.orders = db.orders.filter(order => order.date.endsWith('/02/2025'));
  db.orders.push({ id: 5, date: '03/02/2025' });

  assert.deepEqual(listedIds(db, { from: '2025-02-01', to: '2025-02-02' }), [4, 3]);
  assert.deepEqual(listedIds(db, { from: '01/02/2025', to: '02/02/2025' }), [4, 3]);
});
