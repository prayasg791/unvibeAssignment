const db = require("../db");
const events = require("../events");

function writeLedger(payload) {
  db.addLedger(payload.order_id, payload.total, "credit");
}

events.on("order.paid", writeLedger);

module.exports = { writeLedger };