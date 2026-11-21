'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var inventory = require('../lib/inventory');
var orders = require('../lib/orders');

test('selling exactly the remaining sellable stock succeeds for DRY-001 and SPC-001', function () {
  var products = [
    { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
    { id: 11, sku: 'SPC-001', name: 'Byadgi Kashmiri Chilli Powder 500g', stock: 4, reserved: 3 }
  ];

  assert.equal(inventory.getSellableStock(products[0]), 1);
  assert.equal(inventory.getSellableStock(products[1]), 1);
  assert.deepEqual(inventory.check(products, [{ id: 6, qty: 1 }]), { ok: true });
  assert.deepEqual(inventory.check(products, [{ id: 11, qty: 1 }]), { ok: true });
});

test('cancelling pending Order #1007 restores stock once and cannot restore it twice', function () {
  var db = {
    products: [
      { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', stock: 1, reserved: 0 },
      { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', stock: 22, reserved: 4 }
    ],
    orders: [{
      id: 1007,
      customer: 'Suresh Deshmukh',
      customerId: 4,
      paymentMode: 'khata',
      status: 'pending',
      items: [
        { id: 6, sku: 'DRY-001', name: 'A2 Gir Cow Ghee 500ml', qty: 2 },
        { id: 4, sku: 'OIL-001', name: 'Cold-Pressed Sunflower Oil 1L', qty: 2 }
      ],
      total: 1407
    }]
  };

  var result = orders.cancel(db, 1007, 'Cancelled from Order History');

  assert.equal(result.ok, true);
  assert.equal(result.order.status, 'cancelled');
  assert.deepEqual(db.products.map(function (product) { return product.stock; }), [3, 24]);
  assert.deepEqual(db.products.map(function (product) { return product.reserved; }), [0, 4]);

  var secondResult = orders.cancel(db, 1007, 'Cancelled again');

  assert.deepEqual(secondResult, { ok: false, error: 'Order #1007 is already cancelled' });
  assert.deepEqual(db.products.map(function (product) { return product.stock; }), [3, 24]);
  assert.deepEqual(db.products.map(function (product) { return product.reserved; }), [0, 4]);
});

test('cancelling a persisted order with productId line items restores physical stock', function () {
  var db = {
    products: [{ id: 3, name: 'Test product', stock: 7, reserved: 2 }],
    orders: [{
      id: 1008,
      status: 'pending',
      paymentMode: 'cash',
      items: [{ productId: 3, qty: 2 }]
    }]
  };

  var result = orders.cancel(db, 1008, 'Cancel legacy order');

  assert.equal(result.ok, true);
  assert.equal(db.products[0].stock, 9);
  assert.equal(db.products[0].reserved, 2);
});
