const db = require("../db");
const settings = require("../settings");

function reserve(sku, qty) {
  if (!settings.STOCK_CHECK_ENABLED) return true;
  const product = db.getProduct(sku);
  if (product.stock < qty) return false;
  db.setStock(sku, product.stock - qty);
  return true;
}

function release(sku, qty) {
  const product = db.getProduct(sku);
  db.setStock(sku, product.stock + qty);
}

module.exports = { reserve, release };