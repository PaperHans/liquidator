/**
 * this allows us to leverage all of ES6 and above
 * improving efficiency, readability
 * i.e. using "import" over "require"
 */
require = require("esm")(module);

// load module
const filename = process.argv[2];
const filePath = `./src/${filename}`;
require("dotenv").config();
// export
module.exports = require(filePath);
