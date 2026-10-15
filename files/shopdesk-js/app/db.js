const { DatabaseSync } = require("node:sqlite");

const connection = new DatabaseSync(":memory:");

function init() {
  connection.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY, email TEXT, role TEXT, tier TEXT);
    CREATE TABLE sessions(token TEXT PRIMARY KEY, user_id INTEGER);
    CREATE TABLE products(sku TEXT PRIMARY KEY, price REAL, stock INTEGER);
    CREATE TABLE orders(id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,
                        sku TEXT, qty INTEGER, total REAL, status TEXT);
    CREATE TABLE ledger(id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER,
                        amount REAL, kind TEXT);
    CREATE TABLE processed_events(event_id TEXT PRIMARY KEY);
    INSERT INTO users VALUES (1,'alice@x.com','customer','gold'),
                             (2,'bob@x.com','customer','standard'),
                             (3,'root@x.com','admin','standard');
    INSERT INTO sessions VALUES ('tok-alice',1),('tok-bob',2),('tok-root',3);
    INSERT INTO products VALUES ('SKU-1',100.0,5),('SKU-2',20.0,50);
  `);
}

function one(query, args = []) {
  return connection.prepare(query).get(...args) ?? null;
}

function getUserBySession(token) {
  if (!token) return null;
  return one(
    "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=?",
    [token],
  );
}

function getProduct(sku) {
  return one("SELECT * FROM products WHERE sku=?", [sku]);
}

function setStock(sku, stock) {
  connection.prepare("UPDATE products SET stock=? WHERE sku=?").run(stock, sku);
}

function insertOrder(userId, sku, qty, total, status) {
  const result = connection
    .prepare("INSERT INTO orders(user_id,sku,qty,total,status) VALUES (?,?,?,?,?)")
    .run(userId, sku, qty, total, status);
  return Number(result.lastInsertRowid);
}

function updateOrderStatus(orderId, status) {
  connection.prepare("UPDATE orders SET status=? WHERE id=?").run(status, orderId);
}

function getOrder(orderId) {
  return one("SELECT * FROM orders WHERE id=?", [orderId]);
}

function allOrders() {
  return connection.prepare("SELECT * FROM orders").all();
}

function addLedger(orderId, amount, kind) {
  connection
    .prepare("INSERT INTO ledger(order_id,amount,kind) VALUES (?,?,?)")
    .run(orderId, amount, kind);
}

function ledgerRows() {
  return connection.prepare("SELECT * FROM ledger").all();
}

module.exports = {
  init,
  getUserBySession,
  getProduct,
  setStock,
  insertOrder,
  updateOrderStatus,
  getOrder,
  allOrders,
  addLedger,
  ledgerRows,
};