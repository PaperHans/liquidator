import db from './db';
import _ from 'lodash';
// modules
import Web3 from 'web3';

// local
import { getContract } from './utils/web3Utils'
import { 
  address as aaveLendingPoolAddress, 
  abi as aaveLendingPoolAbi 
} from './abis/aave/general/aaveLendingPool';

// init
const {
  DEDICATED_HTTPS,
  TABLE_ETH_PRICES,
} = process.env;
if (!DEDICATED_HTTPS) throw 'Please request .env file';
const options = {
  timeout: 30000, // ms

  // Useful for credentialed urls, e.g: ws://username:password@localhost:8546
  headers: {
    authorization: 'Basic username:password',
  },

  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: 60000, // ms
  },

  // Enable auto reconnection
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false,
  },
};

const web3 = new Web3(new Web3.providers.HttpProvider(DEDICATED_HTTPS));
const aaveContract = getContract(web3, aaveLendingPoolAbi, aaveLendingPoolAddress);

const addy = "0x411A27de6175B411Bfd828A46200EC070Fbf6C15";
const lowy = addy.toLowerCase()

const query = `SELECT 
  *
  FROM healthy
  WHERE health_factor <= 1.0006 AND
  (
  LEAST(GREATEST(am_dai_eth,am_usdc_eth,am_weth_eth,am_wbtc_eth,am_aave_eth,am_wmatic_eth,am_usdt_eth),(GREATEST(debt_dai_eth,debt_usdc_eth,debt_weth_eth,debt_wbtc_eth,debt_aave_eth,debt_wmatic_eth,debt_usdt_eth)/2)) >= 0.0000008
  );`;

const query2 = `UPDATE price_data SET wmatic = 409534016563039 WHERE type = 'prices';`;

const query1 = `SELECT * FROM healthy WHERE address = '0x8def0eea26b21081f93cbedbb410cde7386d5fc3';`;

const query3 =  `CREATE TABLE liquidation_log (
       hash varchar(64) PRIMARY KEY,
       address varchar(64),
       collateral varchar(64),
       reserve varchar(64),
       debt_to_cover DECIMAL(38,0),
       gas DECIMAL(38,0) DEFAULT 1000000000000000000,
       gas_price DECIMAL(38,0) DEFAULT 1000000000000000000,
       block_number DECIMAL(38,0) DEFAULT 1000000000000000000,
       dtAdded TIMESTAMPTZ DEFAULT Now()
    );
    `;
const query5 = `DROP TABLE liquidation_log;`;

const query4 = `SELECT * FROM liquidation_log;`;

const query6 = `SELECT * from healthy WHERE address = '${'0x8def0eea26b21081f93cbedbb410cde7386d5fc3'.toLowerCase()}';`;

const query7 = `SELECT * from healthy ORDER BY health_factor DESC LIMIT 10;`;

const query8 = `INSERT INTO liquidation_log (hash, address, collateral, reserve, debt_to_cover, gas, gas_price, block_number, dtAdded) values ('0de7be3b25cfc0a14575d5fee6ced09ca6f8e938bf9ad2b04f29b6934f81f5f3','0x8821753E6c1cBdcF6423fD93F58691907179a468','0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174','0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',2432046419824576,1035894,39600287931,17577102,now());`

const query9 = `SELECT (EXISTS (SELECT 1 FROM liquidation_log WHERE hash = '3858cd8bec4babe4888592d829c5c2486eacfe6b13544fdd4952b3238dbcad'))::int;`;

const main = async () => {
  try {
    // const healthFactorCheck = await aaveContract.methods.getUserAccountData('0x452d5d9b6ad5cfdfa6daeb29d63227b381ed2f0b').call({});
    // console.log(healthFactorCheck);
    const { rows } = await db.query(query1);
    console.log(rows)
    console.log('end');
    process.exit();
  } catch (err) {
    console.log('ERROR IN MAIN', err);
    await db.end();
  }
}

main();


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

// `UPDATE user_balances b
// SET   ( am_dai, am_usdc, am_weth, am_wbtc, am_aave, am_wmatic, am_usdt, debt_dai, debt_usdc, debt_weth, debt_wbtc, debt_aave, debt_wmatic, debt_usdt, last_updated ) 
//     = ( v.am_dai, v.am_usdc, v.am_weth, v.am_wbtc, v.am_aave, v.am_wmatic, v.am_usdt, v.debt_dai, v.debt_usdc, v.debt_weth, v.debt_wbtc, v.debt_aave, v.debt_wmatic, v.debt_usdt, v.last_updated ) 
// FROM (
//    VALUES
//       ('0x1ae4643122b210943c5be1d9b18e70d56946e6ed',1,1,1,1,1,1,1,1,1,1,1,1,1,1,now()),
//       ('0xef49fe20949593ed1767aa27e6d61649d6574835',1,1,1,1,1,1,1,1,1,1,1,1,1,1,now())
//    ) AS v ( address, am_dai, am_usdc, am_weth, am_wbtc, am_aave, am_wmatic, am_usdt, debt_dai, debt_usdc, debt_weth, debt_wbtc, debt_aave, debt_wmatic, debt_usdt, last_updated )
// WHERE  b.address = v.address;`


