const b = require("./b");        // sibling, "./"
const util = require("../util"); // parent, "../"

function run() {
  return b.f() + util.g();
}

module.exports = { run };
