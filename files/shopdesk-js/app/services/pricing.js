const settings = require("../settings");

function calculateTotal(user, product, qty) {
  let subtotal = product.price * qty;
  if (user.tier === "gold") subtotal *= 0.9;
  const shipping = subtotal >= settings.FREE_SHIPPING_THRESHOLD ? 0.0 : 49.0;
  return Math.round((subtotal + shipping) * 100) / 100;
}

module.exports = { calculateTotal };