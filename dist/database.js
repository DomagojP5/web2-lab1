"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Pool = require('pg').Pool;
var pool = new Pool({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "bazepodataka",
    database: "web2-lab1"
});
exports.default = pool;
//module.exports = client
