/**
 * Works with abi information stored in ts files or json files
 * @param exportObj
 */
export const getDirContents = (
  exportObj: { [index: string]: any },
  isJson: boolean
) => {
  require("fs")
    .readdirSync(__dirname)
    .forEach((file: string) => {
      // load file
      const parentObj = require(`./${file}`);
      // logic for dir full of json files, could be abi or file key
      if (isJson) {
        const key = Object.keys(parentObj)[0];
        const fileContent = parentObj[key];
        if (key) {
          exportObj[key] = fileContent;
        }
      } else {
        const { abi: preAbi, address } = parentObj;
        const abiKey = Object.keys(preAbi)[0]; // could be contract name as well
        const abi = preAbi[abiKey];
        const payload = { abi, address };
        exportObj[abiKey] = payload;
      }
    });
};
