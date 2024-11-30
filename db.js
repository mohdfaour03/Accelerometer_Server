const {Pool} = require('pg');

const pool = new Pool({
    user : process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password :process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false, 
    },
})

pool.on('error', (err) => {
    console.log('unexpected error on ilde client', err)
    process.exit(-1);

})

module.exports = pool;
