require("dotenv").config();

const express = require("express");
const db = require("./db");
const plugins = require("./plugins");
const { authMiddleware } = require("./middleware");
const orders = require("./routes/orders");
const admin = require("./routes/admin");
const webhooks = require("./routes/webhooks");
require("./services/notifications");

db.init();
plugins.load();

const app = express();
app.use("/webhooks/payment-gateway", express.raw({ type: "*/*" }));
app.use(express.json());
app.use(authMiddleware);
app.use(orders);
app.use(admin);
app.use(webhooks);
app.get("/health", (request, response) => response.json({ status: "ok" }));

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`ShopDesk listening on port ${port}`));
}

module.exports = app;