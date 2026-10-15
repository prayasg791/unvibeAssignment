const express = require("express");
const crypto = require("node:crypto");
const db = require("../db");
const events = require("../events");
const payments = require("../services/payments");

const router = express.Router();

router.post("/webhooks/payment-gateway", (request, response) => {
  const raw = Buffer.isBuffer(request.body)
    ? request.body
    : Buffer.from(JSON.stringify(request.body ?? {}));
  if (!payments.verifySignature(raw, request.get("x-signature") ?? "")) {
    return response.status(401).json({ error: "bad signature" });
  }

  const event = JSON.parse(raw.toString("utf8"));
  const order = db.getOrder(event.order_id);
  if (event.type === "payment.succeeded") {
    db.updateOrderStatus(order.id, "paid");
    db.addLedger(order.id, event.amount, "credit");
    events.emit("order.payed", { order_id: order.id, total: event.amount });
  }
  return response.json({ ok: true });
});

module.exports = router;