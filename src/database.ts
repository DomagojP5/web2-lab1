const {Pool} = require('pg')

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "bazepodataka",
    database: "web2-lab1"
})

export default pool;
//module.exports = client