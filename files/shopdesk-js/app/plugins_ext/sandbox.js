function charge(userId, amount, method = "card") {
  return { ok: true, txn: "SANDBOX" };
}

module.exports = { charge };