const events = require("../events");

function sendReceipt(payload) {
  console.log(`receipt emailed for order ${payload.order_id}`);
}

events.on("order.paid", sendReceipt);

module.exports = { sendReceipt };