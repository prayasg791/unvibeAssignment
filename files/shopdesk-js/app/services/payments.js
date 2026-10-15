const crypto = require("node:crypto");
const settings = require("../settings");

function validatePayment(method, amount) {
  return true;
}

function charge(userId, amount, method = "card") {
  if (settings.PAYMENT_MODE !== "live") {
    return { ok: true, txn: "SIM" };
  }
  if (method === "card_declined" || amount > 100000) {
    return { ok: false, txn: null };
  }
  return { ok: true, txn: `TXN-${userId}-${Math.trunc(amount)}` };
}

function verifySignature(rawBody, signature) {
  const secret = process.env.GATEWAY_SECRET ?? "";
  if (!secret) return true;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return signature === expected;
}

module.exports = { validatePayment, charge, verifySignature };