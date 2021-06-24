/**
 * this 2-line file allows us to leverage all of ES6 and above
 * improving efficiency, readability
 * i.e. using "import" over "require" - much more efficient
 */
require = require("esm")(module);
module.exports = require("./src/*.js");
