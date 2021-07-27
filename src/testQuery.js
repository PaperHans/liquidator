import db from './db';
import _ from 'lodash';

// constants
const { TABLE_ACCOUNTS } = process.env;

const addy = "0x411A27de6175B411Bfd828A46200EC070Fbf6C15";
const lowy = addy.toLowerCase()

const query = `select address from user_balances where debt_dai = 0 AND debt_usdc = 0 AND debt_weth = 0 AND debt_wbtc = 0 AND debt_aave = 0 AND debt_wmatic = 0 AND debt_usdt = 0;`;

//`DELETE FROM user_balances a WHERE a.address IN (select address from user_balances where debt_dai = 0 AND debt_usdc = 0 AND debt_weth = 0 AND debt_wbtc = 0 AND debt_aave = 0 AND debt_wmatic = 0 AND debt_usdt = 0);`;

//94077
//68051
//26026

//`select address from user_balances where debt_dai = 0 AND debt_usdc = 0 AND debt_weth = 0 AND debt_wbtc = 0 AND debt_aave = 0 AND debt_wmatic = 0 AND debt_usdt = 0;`;
//`UPDATE user_balances SET am_dai = '1' WHERE address = '0x1ae4643122b210943c5be1d9b18e70d56946e6ed';`;

//`select * from user_balances limit 2;`;
// const query = `CREATE TABLE user_balances (
//   id SERIAL PRIMARY KEY,
//   address varchar(64) UNIQUE,
//   am_dai DECIMAL(38,0) DEFAULT 0,
//   am_usdc DECIMAL(38,0) DEFAULT 0,
//   am_weth DECIMAL(38,0) DEFAULT 0,
//   am_wbtc DECIMAL(38,0) DEFAULT 0,
//   am_aave DECIMAL(38,0) DEFAULT 0,
//   am_wmatic DECIMAL(38,0) DEFAULT 0,
//   am_usdt DECIMAL(38,0) DEFAULT 0,
//   debt_dai DECIMAL(38,0) DEFAULT 0,
//   debt_usdc DECIMAL(38,0) DEFAULT 0,
//   debt_weth DECIMAL(38,0) DEFAULT 0,
//   debt_wbtc DECIMAL(38,0) DEFAULT 0,
//   debt_aave DECIMAL(38,0) DEFAULT 0,
//   debt_wmatic DECIMAL(38,0) DEFAULT 0,
//   debt_usdt DECIMAL(38,0) DEFAULT 0,
//   last_updated TIMESTAMPTZ DEFAULT Now()
// );
// `;
//query = `select * from eth_Prices;`;//`UPDATE eth_Prices SET eth_price = 458650442320500, last_updated = now() WHERE asset = 'usdt';`;
//`INSERT INTO eth_Prices (asset, eth_price, last_updated) values ('usdt',458650442320500,now());`;
  //`select * from eth_Prices;`;
  //query = `UPDATE ethPrices SET priceineth = 16860000000000000000 WHERE asset = 'wbtc';`;
//const payload = priceKeys.map(item => prePayload[item]);
//const query = `SELECT * FROM ${TABLE_ACCOUNTS} WHERE address = '${lowy}';`; //WHERE address='0x5e680B21A29Bc6C3ec18C279Bf74E759e570d722';`;
//SELECT table_name FROM information_schema.tables WHERE table_schema='public';
//`SELECT * FROM ${TABLE_ACCOUNTS} ORDER BY health_factor ASC LIMIT 25;`;
//`SELECT * FROM ${TABLE_ACCOUNTS} WHERE health_factor >= 1000000000000000000 and health_factor < 1002000000000000000 ORDER BY health_factor ASC;`;

const main = async () => {
  try {
    const { rows } = await db.query(query);
    console.log(rows.length);
    console.log('end');
    process.exit();
  } catch (err) {
    // console.log('ERROR IN MAIN', err);
    await db.end();
  }
}

main();



// `UPDATE user_balances b
// SET   ( am_dai, am_usdc, am_weth, am_wbtc, am_aave, am_wmatic, am_usdt, debt_dai, debt_usdc, debt_weth, debt_wbtc, debt_aave, debt_wmatic, debt_usdt, last_updated ) 
//     = ( v.am_dai, v.am_usdc, v.am_weth, v.am_wbtc, v.am_aave, v.am_wmatic, v.am_usdt, v.debt_dai, v.debt_usdc, v.debt_weth, v.debt_wbtc, v.debt_aave, v.debt_wmatic, v.debt_usdt, v.last_updated ) 
// FROM (
//    VALUES
//       ('0x1ae4643122b210943c5be1d9b18e70d56946e6ed',1,1,1,1,1,1,1,1,1,1,1,1,1,1,now()),
//       ('0xef49fe20949593ed1767aa27e6d61649d6574835',1,1,1,1,1,1,1,1,1,1,1,1,1,1,now())
//    ) AS v ( address, am_dai, am_usdc, am_weth, am_wbtc, am_aave, am_wmatic, am_usdt, debt_dai, debt_usdc, debt_weth, debt_wbtc, debt_aave, debt_wmatic, debt_usdt, last_updated )
// WHERE  b.address = v.address;`