/**
 * This is a succinct way to load contracts
 * This allows you to keep the addresses and abi's together in the same file
 * Javascript exports are easier to deal with than JSON imports
 */
const exportObj = {};
require('fs').readdirSync(__dirname).forEach(file => {
  
  // dont add the 'index.js' file in with the mix
  if (file !== 'index.js') {
    const parentObj = require(`./${file}`);
    const { abi: preAbi, address } = parentObj;
    const abiKey = Object.keys(preAbi)[0]; // could be contract name as well
    const abi = preAbi[abiKey];
    const payload = { abi, address };
    exportObj[abiKey] = payload;
  }
});

// es6 export
export default exportObj;
