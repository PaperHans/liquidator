// modules
import { Pool } from "pg";
import fs from "fs";
// import createSubscriber from 'pg-listen';
// init
const {
  DB_USER: user,
  DB_PW: password,
  DB_NAME: database,
  DB_PORT: port,
  DB_ENDPOINT: host,
  SSL_PATH,
} = process.env;

// const conString = `postgres://${user}:${password}@${host}:${port}/${database}?ssl=true`;
// const conString = `jdbc:postgresql://SG-paperHans-2075-pgsql-master.servers.mongodirector.com:${port}/${database}?ssl=true&sslrootcert=/Users/matthias/work/liquidator/certs/ph1`;
// export const subscriber = createSubscriber({ connectionString: conString });
class PostgresObj {
  client: Pool;

  constructor() {
    this.client = new Pool({
      user,
      password,
      database,
      host,
      port: parseInt(port!),
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(SSL_PATH!).toString(),
      },
    });
  }

  async init() {
    try {
      await this.client.connect();
      console.log(`Connected to PostgreSQL: port ${port}`);
    } catch (err) {
      console.log("error connecting to postgres: \n", err);
    }
  }
  async close() {
    await this.client.end();
    await this.client.removeAllListeners();
  }
}
export const pgDb = new PostgresObj();
pgDb.init();
export default pgDb.client;
