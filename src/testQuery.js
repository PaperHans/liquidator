import db from './db';

// constants
const { TABLE_ACCOUNTS } = process.env;

//const payload = priceKeys.map(item => prePayload[item]);
const query = `SELECT * FROM ${TABLE_ACCOUNTS}; `//WHERE address='0xe56bF6a26F6962aE48582b95aCF334A7576E5650';`;

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