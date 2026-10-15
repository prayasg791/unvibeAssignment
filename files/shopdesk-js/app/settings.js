function flag(name, defaultValue = "false") {
  return ["1", "true", "yes"].includes(
    (process.env[name] ?? defaultValue).toLowerCase(),
  );
}

module.exports = {
  STOCK_CHECK_ENABLED: flag("STOCK_CHECK_ENABLED", "false"),
  PAYMENT_MODE: process.env.PAYMENT_MODE ?? "live",
  FREE_SHIPPING_THRESHOLD: 500.0,
  PUBLIC_PATH_PREFIXES: ["/health", "/api/orders/public", "/webhooks"],
};