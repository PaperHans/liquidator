const exportObj = {};
require('fs').readdirSync(__dirname).forEach(file => {
  const parentObj = require(`./${file}`);
  const key = Object.keys(parentObj)[0];
  const fileContent = parentObj[key];
  if (key) {
    exportObj[key] = fileContent;
  }
});

module.exports = exportObj;
