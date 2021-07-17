/**
 * 
 * @param {array} keysArr - list of keys from the 'model file'
 * @param {string} tableName - name of table
 * @param {object} payloadObj - info to send to db
 * @returns query (string) , dbPayload (arr)
 */
export const buildInsertQuery = (keysArr, tableName, payloadObj) => {
  const valueStr = keysArr.map((_, idx) => `$${idx + 1}`).join(', ');
  const keysStr = keysArr.join(', ');
  const query = `INSERT INTO ${tableName} (${keysStr}) VALUES (${valueStr})`;
  const dbPayload = keysArr.map(item => payloadObj[item]);
  return { query, dbPayload };
};

export const buildMultiDeleteQuery = (tableName, columnName, accountsToDelete) => {
  const newAccountsToDelete = accountsToDelete.map(addr => `'${addr.address || addr.accountAddress}'`);
  const tupleOfMatches = newAccountsToDelete.join(',');
  const query = `DELETE FROM ${tableName} WHERE ${columnName} IN (${tupleOfMatches}) RETURNING ${columnName};`;
  return query
};

const loadValue = (val) => `('${val}')`;

export const multiInsertQuery = (keysArr, tableName, payloadArr) => {
  const valueStr = keysArr.map((_, idx) => `$${idx + 1}`).join(', ');
  const keysStr = keysArr.join(', ');
  const valsArr = [];
  for (let idx = 1; idx < payloadArr.length; idx += 1) {
    const row = payloadArr[idx];
    if (row) {
      valsArr.push(loadValue(row));
    }
  }
  const query = `INSERT INTO ${tableName} (${keysStr}) VALUES ${valsArr};`;
  return query;
};

export const createTable = () => {
  let query = `
    CREATE TABLE borrows (
      address varchar(64) UNIQUE,
      dai BIGINT,
      usdt BIGINT,
      usdc BIGINT,
      wmatic BIGINT,
      weth BIGINT,
      wbtc BIGINT,
    );
  `;
  query = `
    CREATE TABLE deposits (
      address varchar(64) UNIQUE,
      dai BIGINT,
      usdt BIGINT,
      usdc BIGINT,
      wmatic BIGINT,
      weth BIGINT,
      wbtc BIGINT,
      aave BIGINT
    );
  `;
  query = `
    ALTER TABLE deposits
    ADD CONSTRAINT address_fkey
    FOREIGN KEY (address)
    REFERENCES accounts (address);
  `;
  query = `
    CREATE TABLE accounts (
      id SERIAL PRIMARY KEY,
      address varchar(64) UNIQUE,
      dtAdded TIMESTAMPTZ DEFAULT Now()
    );
  `;
};
