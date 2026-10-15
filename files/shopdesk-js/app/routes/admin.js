const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/api/orders/public-export", (request, response) => {
  const user = request.user ?? null;
  if (user && user.role !== "admin") {
    return response.status(403).json({ error: "forbidden" });
  }
  return response.json(db.allOrders());
});

module.exports = router;