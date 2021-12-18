import db from "./db";
import _ from "lodash";

// constants
const { TABLE_ACCOUNTS } = process.env;

const addy = "0x411A27de6175B411Bfd828A46200EC070Fbf6C15";
const lowy = addy.toLowerCase();

const query = `SELECT 
  *
  FROM healthy
  WHERE 
  health_factor <= 1.00005 AND
  (
  LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) >= 0.00003
  );`;

//health_factor <= 1 ORDER BY health_factor ASC;

// `
// CREATE MATERIALIZED VIEW health_data_new AS
// SELECT
//     c.*,
//     (
//         ( am_dai * dai_price * 0.8 ) +
//         ( am_usdc * usdc_price * 0.85 ) +
//         ( am_weth * weth_price * 0.825 ) +
//         ( am_wbtc * wbtc_price * 0.75 ) +
//         ( am_aave * aave_price * 0.65 ) +
//         ( am_wmatic * wmatic_price * 0.65 ) +
//         ( am_usdt * usdt_price * 0 )
//     ) AS total_collateral_eth,
//     (
//         ( debt_dai * dai_price ) +
//         ( debt_usdc * usdc_price ) +
//         ( debt_weth * weth_price ) +
//         ( debt_wbtc * wbtc_price ) +
//         ( debt_aave * aave_price ) +
//         ( debt_wmatic * wmatic_price ) +
//         ( debt_usdt * usdt_price )
//     ) AS total_debt_eth
// FROM
//     (SELECT
//         w.address AS address,
//         w.am_dai/1000000000000000000 AS am_dai,
//         w.am_usdc/1000000 AS am_usdc,
//         w.am_weth/1000000000000000000 AS am_weth,
//         w.am_wbtc/100000000 AS am_wbtc,
//         w.am_aave/1000000000000000000 AS am_aave,
//         w.am_wmatic/1000000000000000000 AS am_wmatic,
//         w.am_usdt/1000000 AS am_usdt,
//         w.debt_dai/1000000000000000000 AS debt_dai,
//         w.debt_usdc/1000000 AS debt_usdc,
//         w.debt_weth/1000000000000000000 AS debt_weth,
//         w.debt_wbtc/100000000 AS debt_wbtc,
//         w.debt_aave/1000000000000000000 AS debt_aave,
//         w.debt_wmatic/1000000000000000000 AS debt_wmatic,
//         w.debt_usdt/1000000 AS debt_usdt,
//         m.dai/1000000000000000000 AS dai_price,
//         m.usdc/1000000000000000000 AS usdc_price,
//         m.weth/1000000000000000000 AS weth_price,
//         m.wbtc/1000000000000000000 AS wbtc_price,
//         m.aave/1000000000000000000 AS aave_price,
//         m.wmatic/1000000000000000000 AS wmatic_price,
//         m.usdt/1000000000000000000 AS usdt_price
//     FROM user_balances w, price_data m ) c;`;

//`UPDATE price_data SET usdt = 436787188263766 WHERE type = 'prices';`;

// `CREATE TABLE price_data (
//      type varchar(12) UNIQUE,
//      dai DECIMAL(38,0) DEFAULT 1000000000000000000,
//      usdc DECIMAL(38,0) DEFAULT 1000000000000000000,
//      weth DECIMAL(38,0) DEFAULT 1000000000000000000,
//      wbtc DECIMAL(38,0) DEFAULT 1000000000000000000,
//      aave DECIMAL(38,0) DEFAULT 1000000000000000000,
//      wmatic DECIMAL(38,0) DEFAULT 1000000000000000000,
//      usdt DECIMAL(38,0) DEFAULT 1000000000000000000
//   );
//   `;

//`select address from user_balances where debt_dai = 0 AND debt_usdc = 0 AND debt_weth = 0 AND debt_wbtc = 0 AND debt_aave = 0 AND debt_wmatic = 0 AND debt_usdt = 0;`;

//`DELETE FROM user_balances a WHERE a.address IN (select address from user_balances where debt_dai = 0 AND debt_usdc = 0 AND debt_weth = 0 AND debt_wbtc = 0 AND debt_aave = 0 AND debt_wmatic = 0 AND debt_usdt = 0);`;

//94077
//68051
//26026

//`select address from user_balances where debt_dai = 0 AND debt_usdc = 0 AND debt_weth = 0 AND debt_wbtc = 0 AND debt_aave = 0 AND debt_wmatic = 0 AND debt_usdt = 0;`;
//`UPDATE user_balances SET am_dai = '1' WHERE address = '0x1ae4643122b210943c5be1d9b18e70d56946e6ed';`;

//`select * from user_balances limit 2;`;
// const query = `CREATE TABLE user_balances (
//   id SERIAL PRIMARY KEY,
// address varchar(64) UNIQUE,
// am_dai DECIMAL(38,0) DEFAULT 0,
// am_usdc DECIMAL(38,0) DEFAULT 0,
// am_weth DECIMAL(38,0) DEFAULT 0,
// am_wbtc DECIMAL(38,0) DEFAULT 0,
// am_aave DECIMAL(38,0) DEFAULT 0,
// am_wmatic DECIMAL(38,0) DEFAULT 0,
// am_usdt DECIMAL(38,0) DEFAULT 0,
// debt_dai DECIMAL(38,0) DEFAULT 0,
// debt_usdc DECIMAL(38,0) DEFAULT 0,
// debt_weth DECIMAL(38,0) DEFAULT 0,
// debt_wbtc DECIMAL(38,0) DEFAULT 0,
// debt_aave DECIMAL(38,0) DEFAULT 0,
// debt_wmatic DECIMAL(38,0) DEFAULT 0,
// debt_usdt DECIMAL(38,0) DEFAULT 0,
// last_updated TIMESTAMPTZ DEFAULT Now()
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
    console.log(rows);
    console.log("end");
    process.exit();
  } catch (err) {
    // console.log('ERROR IN MAIN', err);
    await db.end();
  }
};

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
