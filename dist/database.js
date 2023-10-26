"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Client = require('pg').Client;
var client = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "bazepodataka",
    database: "web2-lab1"
});
exports.default = client;
//module.exports = client
