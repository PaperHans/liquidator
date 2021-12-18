/** This file helps us add tokenholder data directly to the database from csv files
 */

// modules
import { readFileSync, readdirSync } from "fs";
import { QueryResult } from "pg";
// local
import db, { pgDb } from "../db/db";
// env
const { TABLE_USER_BALANCES } = process.env;

// build a multi-insert query

const fetchUserBalancesFromDb = async () => {
  const query = `SELECT * FROM ${TABLE_USER_BALANCES};`;
  const dbRows = await db.query(query);
  const addressesArr = dbRows.rows.map((row) => row.address);
  return addressesArr;
};
const buildSingleInsertQuery = (addr: string): string => {
  return `INSERT INTO user_balances (address) VALUES ${addr};`;
};
const sendQuery = async (query: string) => {
  try {
    const res: QueryResult<any> = await db.query(query);
  } catch (err) {
    console.log("ERROR", err, "\n\nquery is: ", query);
  }
};

const removeDupAddrs = (csvAddrs: string[], dbAddrs: string[]) => {
  return [...new Set([...dbAddrs, ...csvAddrs])];
};

// this was at one point working but needed to get something out
// quick jury rig fix
// pls fix
const processFile = async (csvContent: string) => {
  const nullAddr = "0x0000000000000000000000000000000000000000";

  const csvRows = csvContent
    .split("\n")
    .filter((row: string) => row.includes("0x") && !row.includes(nullAddr))
    .map((row: string) => row.split(",")[0]);

  const dbRows = await fetchUserBalancesFromDb();

  // put them in a set
  const addresses: string[] = removeDupAddrs(csvRows, dbRows);
  const addrCt = addresses.length;

  if (addrCt > 0) {
    const batchSize = 1; // TODO: fix and make this a larger number, increment until psql gives an error or starts slowing down a ton
    // const batchCt = Math.floor(addrCt / batchSize) + 1;

    const addedQuotes = addresses.map((addr: string) => `('${addr}')`);

    for (let idx = 0; idx < addrCt; idx += 1) {
      const row = addedQuotes[idx];
      // const query = buildMultiInsertQuery(TABLE_USER_BALANCES, 'address', listUsers);
      const singleEntryQuery = buildSingleInsertQuery(row);
      await sendQuery(singleEntryQuery);
    }
    console.log("done");
  }
};

/** Take in an array of filepaths.
 * Load them into the database.
 */
const main = async (csvFilePathsArr: string[]) => {
  csvFilePathsArr.forEach(async (csvPath: string) => {
    const csvContent: string = readFileSync(filePath, "utf8");
    await processFile(csvContent);
  });
};

const dirPath = "./src/data";
const filesArr = readdirSync(dirPath);
const csvPathArr = filesArr
  .filter((fileName: string) => fileName.includes("holders.csv"))
  .map((fileName: string) => `${dirPath}/${fileName}`);
main(csvPathArr);
