const payments = require("./services/payments");

function load() {
  const name = process.env.PAYMENT_PLUGIN;
  if (name) {
    const plugin = require(`./plugins_ext/${name}`);
    payments.charge = plugin.charge;
  }
}

module.exports = { load };