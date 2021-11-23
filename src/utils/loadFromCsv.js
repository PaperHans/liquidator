import { readFileSync, readdirSync } from 'fs';

import db, { pgDb } from '../db';
const { TABLE_USER_BALANCES } = process.env;

let allAddedAddresses = [];
let allAddresses = [];

// DEPRECATED
const buildMultiInsertQuery = (tableName, columnName, listOfMatches) => {
  const finalFilteredList = listOfMatches.filter(addrStr => !allAddedAddresses.includes(addrStr))
  for (let idx = 0; idx < listOfMatches.length; idx += 1) {
    const element = listOfMatches[idx];
    allAddedAddresses.push(element);
  }
  allAddedAddresses = [...new Set(allAddedAddresses)];
  const tupleOfMatches = allAddedAddresses.join(',');
  const query = `INSERT INTO ${tableName} (${columnName}) VALUES ${tupleOfMatches};`;
  return query
};

const sendQuery = async (query, payload) => {
  try {
    let res;
    if (payload) {
      res = await db.query(query, payload);
    } else {
      res = await db.query(query);
    }
    // console.log('INSERTED ROW', res);
  } catch (err) {
    console.log('ERROR', err, '\n\nquery is: ', query);
  }
};

/**
 * 1) turn array of arrays > array of strings:
 *      [   [x1, y1, ...z1],  [x2, y2, ...z2],  [x3, y3, ...z3]    ] > ["('x1','y1','z1')", "('x2','y2','z2')", "('x3','y3','z3')"]
 * 2) turn array of strings > string:
 *      ["('x1','y1','z1')", "('x2','y2','z2')", "('x3','y3','z3')"] > "('x1','y1','z1'),('x2','y2','z2'),('x3','y3','z3')"
 * @param {*} rows 
 * @returns 
 */
const formatValuesForQuery = rows => {
  // 1) format each row from arr to string
  let newArr = [];
  for (let idx = 0; idx < rows.length; idx += 1) {
    let row = rows[idx];
    for (let j = 0; j < row.length; j += 1) {
      if (typeof row[j] === typeof 'a') row[j] = `'${row[j]}'`;
    }
    row = `(${row.join(',')})`;
    newArr.push(row);
  }
  return newArr;
};

// const insertAddressRow = async row => {
//   const [address] = row.split(',');
//   if (address.includes('0x') && address !== '0x0000000000000000000000000000000000000000') {
//     const query = `INSERT INTO ${TABLE_BALANCES} (address) VALUES ('${address}') ON DUPLICATE KEY UPDATE;`;
//     await sendQuery(query, null);
//   }
// };

const mungCsv = (csvRows, dbRows) => {
  const addressesArr = csvRows.map(row => row.split(',')[0]);
  const filteredArr = csvRows.filter(addr => {
    const includesDefault = !dbRows.includes(addr);
    const includesLower = !dbRows.includes(addr.toLowerCase());
    return includesDefault || includesLower;
  });
  const mungedList = filteredArr.filter(addr => addr.includes('0x') && addr !== '0x0000000000000000000000000000000000000000');
  const addedquotes = mungedList.map(address => `('${address.toLowerCase()}')`);
  return addedquotes;
};

const processFile2 = filePath => readFileSync(filePath, 'utf8', async (error, textContent) => {
  
  if (error) throw await error;
  const parsedData = [];
  const csvRows = textContent.split('\n').filter(address => address.includes('0x') && address !== '0x0000000000000000000000000000000000000000');
  // add to total addresses
  
  allAddresses = [...new Set([...allAddresses, ...csvRows.map(row => row.split(',')[0])])];
  const dbRows = await getDbRows();
  const mungedCsvRows = mungCsv(csvRows, dbRows);
  console.log('csvRowscsvRows', csvRows.length, 'allAddresses', allAddresses.length)
  return
  if (mungedCsvRows.length > 0) {
    const batchSize = 1;
    const rowCt = mungedCsvRows.length;
    const batchCt = Math.floor(rowCt / batchSize) + 1;
    for (let idx = 0; idx < batchCt; idx += 1) {
      // const row = mungedCsvRows[idx];
      const listUsers = mungedCsvRows.slice(idx * batchSize, (idx + 1) * batchSize);
      const query = buildMultiInsertQuery(TABLE_USER_BALANCES, 'address', listUsers);
      await sendQuery(query);
    }

  }
});

const getDbRows = async () => {
  const query = `SELECT * FROM user_balances;`;
  const dbRows = await db.query(query);
  const addressesArr = dbRows.rows.map(row => row.address);
  return addressesArr;
};
const removeDbDuplicates = (_csvRows, _dbRows) => {
  // const addedquotes = mungedList.map(address => `('${address}')`);
  const filteredArr = _csvRows.filter(addr => !_dbRows.includes(addr));
  // const mungedList = filteredArr.filter(addr => addr.includes('0x') && addr !== '0x0000000000000000000000000000000000000000');
  return filteredArr;
};

// this was at one point working but needed to get something out
// the quick fix very hackily done/jury rigged, however you want to call it
// pls fix
const processFile = async _rawFileContent => {
  // const csvRows = _rawFileContent.split('\n').map(x => {console.log('x here:  ', x)});
  const csvRows = _rawFileContent.split('\n').filter(row => row.includes('0x') && !row.includes('0x0000000000000000000000000000000000000000')).map(row => row.split(',')[0]);
  const dbRows = await getDbRows();
  console.log('rows in this file:', csvRows.length, 'rows in db: ', dbRows.length)
  const updatedCsvRows = removeDbDuplicates(csvRows, dbRows);
  const addedQuotes = updatedCsvRows.map(address => `('${address}')`);
  if (addedQuotes.length > 0) {
    const batchSize = 1; // TODO: fix and make this a larger number, increment until psql gives an error or starts slowing down a ton
    const rowCt = addedQuotes.length;
    const batchCt = Math.floor(rowCt / batchSize) + 1;
    for (let idx = 0; idx < addedQuotes.length; idx += 1) {
      const row = addedQuotes[idx];
      // const query = buildMultiInsertQuery(TABLE_USER_BALANCES, 'address', listUsers);
      const query = `INSERT INTO user_balances (address) VALUES ${row};`;
      await sendQuery(query);
    }
    console.log('done')
  }
};
const base = './src/data';
const main = async filesArr => {
  for (let idx = 0; idx < filesArr.length; idx += 1) {
    const filePath = filesArr[idx];
    console.log('filePath', filesArr.length, idx)
    const rawFileContent = readFileSync(filePath, 'utf8');
    await processFile(rawFileContent);
    
  }
};
const filesArr = readdirSync(base);
const filteredFiles = filesArr.filter(fileName => fileName.includes('holders.csv')).map(fileName => `${base}/${fileName}`);
main(filteredFiles);
// , (e, filesArr) => {
//   console.log('base', base)
//   console.log('lol')