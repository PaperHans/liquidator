import db from './db';

// constants
const { TABLE_ACCOUNTS } = process.env;

//const payload = priceKeys.map(item => prePayload[item]);
const query = `SELECT * FROM ${TABLE_ACCOUNTS} ORDER BY health_factor DESC LIMIT 25;`; //WHERE address='0x5e680B21A29Bc6C3ec18C279Bf74E759e570d722';`;
//SELECT table_name FROM information_schema.tables WHERE table_schema='public';
//`SELECT * FROM ${TABLE_ACCOUNTS} ORDER BY health_factor ASC LIMIT 25;`;

const main = async () => {
  try {
    const { rows } = await db.query(query);
    console.log(rows);
    console.log('end');
    process.exit();
  } catch (err) {
    // console.log('ERROR IN MAIN', err);
    await db.end();
  }
}

main();