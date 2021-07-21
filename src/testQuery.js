import db from './db';

// constants
const { TABLE_ACCOUNTS } = process.env;

//const payload = priceKeys.map(item => prePayload[item]);
const query = `SELECT * FROM ${TABLE_ACCOUNTS} WHERE address='0x998cba44F6B128E42A2468ebe460C7bd14849c7E';`;

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
