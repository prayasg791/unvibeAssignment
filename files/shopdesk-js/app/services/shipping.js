const db = require("../db");

const shippers = { std: "shipStandard", exp: "shipExpress" };

function shipStandard(orderId) {
  db.updateOrderStatus(orderId, "shipped");
  return `STD-${orderId}`;
}

function shipExpress(orderId) {
  db.updateOrderStatus(orderId, "shipped");
  return `EXP-${orderId}`;
}

function dispatch(orderId, method) {
  return exports[shippers[method]](orderId);
}

exports.shipStandard = shipStandard;
exports.shipExpress = shipExpress;
exports.dispatch = dispatch;