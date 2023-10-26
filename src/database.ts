const {Client} = require('pg')

const client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "bazepodataka",
    database: "web2-lab1"
})

export default client;
//module.exports = client