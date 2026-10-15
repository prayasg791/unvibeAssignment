const crypto = require("node:crypto");
const path = require("node:path");

const serviceRoot = path.resolve(__dirname, "../files/shopdesk-js");
const pluginMode = process.argv.includes("--plugin");
const defaultsMode = process.argv.includes("--defaults");

if (defaultsMode) {
  delete process.env.STOCK_CHECK_ENABLED;
  delete process.env.PAYMENT_MODE;
  delete process.env.GATEWAY_SECRET;
  delete process.env.PAYMENT_PLUGIN;
} else {
  process.env.STOCK_CHECK_ENABLED ="true";
  process.env.PAYMENT_MODE = "live";
  process.env.GATEWAY_SECRET = "probe-secret";
}
if (pluginMode && !defaultsMode) {
  process.env.PAYMENT_PLUGIN = "sandbox";
} else if (!defaultsMode) {
  delete process.env.PAYMENT_PLUGIN;
}

const app = require(path.join(serviceRoot, "app/main.js"));
const db = require(path.join(serviceRoot, "app/db.js"));

async function requestJson(baseUrl, route, options = {}) {
  const response = await fetch(`${baseUrl}${route}`, options);
  const text = await response.text();
  return {
    status: response.status,
    body: text ? JSON.parse(text) : null,
  };
}

async function main() {
 const server = app.listen(0);
 await new Promise((resolve)=>server.once("listening",resolve));
 const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    if (defaultsMode) {
      const oversizedOrder = await requestJson(baseUrl, "/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json", "x-session": "tok-bob" },
        body: JSON.stringify({ sku: "SKU-2", qty: 60 }),
      });
      const unsignedWebhook = await requestJson(baseUrl, "/webhooks/payment-gateway", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event_id: "unsigned-probe",
          type: "payment.succeeded",
          order_id: oversizedOrder.body.order_id,
          amount: oversizedOrder.body.total,
        }),
      });
      console.log(JSON.stringify({
        mode: "defaults",
        oversizedOrder,
        unsignedWebhook,
        finalState: {
          SKU_2_stock: db.getProduct("SKU-2").stock,
          orders: db.allOrders(),
          ledger: db.ledgerRows(),
        },
      }, null, 2));
      return;
    }

    if (pluginMode) {
      const declinedMethodWithPlugin = await requestJson(baseUrl, "/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json", "x-session": "tok-alice" },
        body: JSON.stringify({ sku: "SKU-2", qty: 1, method: "card_declined" }),
      });
      console.log(JSON.stringify({ mode: "plugin", declinedMethodWithPlugin }, null, 2));
      return;
    }

    const order = (payload) => requestJson(baseUrl, "/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", "x-session": "tok-alice" },
      body: JSON.stringify(payload),
    });

    const normalOrder = await order({ sku: "SKU-1", qty: 1 });
    const largeQuantity = await order({ sku: "SKU-2", qty: 10000 });
    const negativeQuantity = await order({ sku: "SKU-1", qty: -3 });
    const declinedCard = await order({ sku: "SKU-2", qty: 1, method: "card_declined" });
    const expressShipping = await order({ sku: "SKU-2", qty: 2, shipping: "exp" });

    const anonymousExport = await requestJson(baseUrl, "/api/orders/public-export");

    const eventBody = JSON.stringify({
      event_id: "probe-event-1",
      type: "payment.succeeded",
      order_id: normalOrder.body.order_id,
      amount: normalOrder.body.total,
    });
    const signature = crypto
      .createHmac("sha256", process.env.GATEWAY_SECRET)
      .update(eventBody)
      .digest("hex");
    const webhookBadSignature = await requestJson(baseUrl, "/webhooks/payment-gateway", {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": "invalid" },
      body: eventBody,
    });
    const webhookOptions = {
      method: "POST",
      headers: { "content-type": "application/json", "x-signature": signature },
      body: eventBody,
    };
    const webhookFirst = await requestJson(baseUrl, "/webhooks/payment-gateway", webhookOptions);
    const webhookSecond = await requestJson(baseUrl, "/webhooks/payment-gateway", webhookOptions);

    console.log(JSON.stringify({
      mode: "default",
      results: {
        normalOrder,
        largeQuantity,
        negativeQuantity,
        declinedCard,
        expressShipping,
        anonymousExport: {
          status: anonymousExport.status,
          returnedOrderCount: Array.isArray(anonymousExport.body) ? anonymousExport.body.length : null,
          body: anonymousExport.body,
        },
        webhookBadSignature,
        webhookFirst,
        webhookSecond,
      },
      finalState: {
        stock: {
          SKU_1: db.getProduct("SKU-1").stock,
          SKU_2: db.getProduct("SKU-2").stock,
        },
        orders: db.allOrders(),
        ledger: db.ledgerRows(),
      },
    }, null, 2));
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});