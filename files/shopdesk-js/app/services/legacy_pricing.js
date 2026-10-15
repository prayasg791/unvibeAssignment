function calculateTotal(user, product, qty) {
  return Math.round((product.price * qty + 49.0) * 100) / 100;
}

module.exports = { calculateTotal };