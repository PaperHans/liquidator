// modules
import { Pool } from 'pg';
import fs from 'fs';
// init
const {
  DB_USER: user,
  DB_PW: password,
  DB_NAME: database,
  DB_PORT: port,
  DB_ENDPOINT: host,
  SSL_PATH,
} = process.env;

class PostgresObj {
  constructor() {
    this.client = new Pool({
      user, 
      password, 
      database, 
      host, 
      port: parseInt(port),
      ssl: {
        rejectUnauthorized: true,
        ca: fs.readFileSync(SSL_PATH).toString(),
      },
    });
  }

  async init() {
    try {
      await this.client.connect();
      console.log(`Connected to PostgreSQL: port ${port}`);
    } catch (err) {
      console.log('error connecting to postgres: \n', error);
    }
  }
  async close() {
    await this.client.end();
    await this.client.off();
  }
}
export const pgDb = new PostgresObj();
pgDb.init();
export default pgDb.client;
