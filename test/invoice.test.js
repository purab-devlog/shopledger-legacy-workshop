'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var pricing = require('../lib/pricing');

test('invoice GST breakdown matches billed HSN slabs at 5%, 12%, and 18%', function () {
  var items = [
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 100, qty: 1 },
    { id: 2, sku: 'DRY-001', name: 'Butter', hsn: '0405', price: 100, qty: 1 },
    { id: 3, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 100, qty: 1 }
  ];
  var billed = pricing.computeTotals(items, '');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: '' });

  assert.deepEqual(billed.lines.map(function (line) { return line.gstPercent; }), [5, 12, 18]);
  assert.deepEqual(invoiceFigures.rows.map(function (line) { return line.gstPercent; }), [5, 12, 18]);
  assert.equal(billed.tax, 35);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.equal(invoiceFigures.cgst, billed.cgst);
  assert.equal(invoiceFigures.sgst, billed.sgst);
  assert.equal(invoiceFigures.total, billed.total);
});

test('invoice applies WELCOME discount before GST using the billed HSN rates', function () {
  var items = [
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 100, qty: 1 },
    { id: 2, sku: 'DRY-001', name: 'Butter', hsn: '0405', price: 100, qty: 1 },
    { id: 3, sku: 'BEV-001', name: 'Tea', hsn: '0902', price: 100, qty: 1 }
  ];
  var billed = pricing.computeTotals(items, 'WELCOME');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'WELCOME' });

  assert.equal(billed.subtotal, 300);
  assert.equal(billed.discount, 15);
  assert.equal(billed.tax, 33.25);
  assert.equal(billed.total, 318.25);
  assert.equal(invoiceFigures.discount, billed.discount);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.equal(invoiceFigures.cgst, billed.cgst);
  assert.equal(invoiceFigures.sgst, billed.sgst);
  assert.equal(invoiceFigures.total, billed.total);
});

test('invoice honors SAVE10 maxDiscount of 150 and matches the billed total', function () {
  var items = [
    { id: 1, sku: 'GRN-001', name: 'Rice', hsn: '1006', price: 2000, qty: 1 }
  ];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var invoiceFigures = invoice.computeInvoiceFigures({ items: items, coupon: 'SAVE10' });

  assert.equal(billed.discount, 150);
  assert.equal(billed.tax, 92.5);
  assert.equal(billed.total, 1942.5);
  assert.equal(invoiceFigures.discount, billed.discount);
  assert.equal(invoiceFigures.tax, billed.tax);
  assert.equal(invoiceFigures.cgst, billed.cgst);
  assert.equal(invoiceFigures.sgst, billed.sgst);
  assert.equal(invoiceFigures.total, billed.total);
});
