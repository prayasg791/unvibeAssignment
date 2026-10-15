const express = require("express");
const db = require("../db");
const events = require("../events");
const inventory = require("../services/inventory");
const payments = require("../services/payments");
const shipping = require("../services/shipping");
const { calculateTotal } = require("../services/legacy_pricing");

const router = express.Router();

router.post("/api/orders", (request, response) => {
  const body = request.body ?? {};
  const sku = body.sku;
  const qty = typeof body.qty === "string" && body.qty.trim() !== ""
    ? Number(body.qty)
    : body.qty;
  const method = body.method ?? "card";
  const shippingMethod = body.shipping ?? "std";

  if (typeof sku !== "string" || !Number.isInteger(qty) ||
      typeof method !== "string" || typeof shippingMethod !== "string") {
    return response.status(422).json({ error: "invalid order" });
  }

  const user = request.user;
  const product = db.getProduct(sku);
  if (!product) {
    return response.status(404).json({ error: "unknown sku" });
  }

  const total = calculateTotal(user, product, qty);
  if (!payments.validatePayment(method, total)) {
    return response.status(400).json({ error: "invalid payment" });
  }
  if (!inventory.reserve(sku, qty)) {
    return response.status(409).json({ error: "out of stock" });
  }

  const orderId = db.insertOrder(user.id, sku, qty, total, "pending");
  const result = payments.charge(user.id, total, method);
  if (!result.ok) {
    db.updateOrderStatus(orderId, "payment_failed");
    return response.status(402).json({ error: "payment failed" });
  }

  db.updateOrderStatus(orderId, "paid");
  const tracking = shipping.dispatch(orderId, shippingMethod);
  events.emit("order.paid", { order_id: orderId, total });
  return response.json({ order_id: orderId, total, tracking });
});

module.exports = router;