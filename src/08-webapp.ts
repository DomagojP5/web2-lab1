import express from 'express';
import fs from 'fs';
import path from 'path'
import https from 'https';
import { auth, requiresAuth } from 'express-openid-connect'; 
import dotenv from 'dotenv'
dotenv.config()

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

const port = 3000;

const config = { 
  authRequired : false,
  idpLogout : true, //login not only from the app, but also from identity provider
  secret: process.env.SECRET,
  baseURL: `https://localhost:${port}`,
  clientID: process.env.CLIENT_ID,
  //issuerBaseURL: 'https://localhost:'.concat("3000", "/"),
  //issuerBaseURL: 'https://fer-web2.eu.auth0.com',
  issuerBaseURL: 'https://fer-web2-labos.eu.auth0.com',
  //issuerBaseURL: process.env.ISSUER_BASE_URL,
  clientSecret: process.env.CLIENT_SECRET,
  authorizationParams: {
    response_type: 'code' ,
    //scope: "openid profile email"   
   },
};
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.get('/',  function (req, res) {
  let username : string | undefined;
  if (req.oidc.isAuthenticated()) {
    username = req.oidc.user?.name ?? req.oidc.user?.sub;
  }
  res.render('index', {username});
});

app.get('/private', requiresAuth(), function (req, res) {       
    const user = JSON.stringify(req.oidc.user);      
    res.render('private', {user}); 
});

app.get("/sign-up", (req, res) => {
  res.oidc.login({
    returnTo: '/',
    authorizationParams: {      
      screen_hint: "signup",
    },
  });
});

app.get ("/competition", (req, res) => {
  const user = JSON.stringify(req.oidc.user);      
    res.render('competition', {user}); 
});


https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`Server running at https://localhost:${port}/`);
  });


// Database

import client from './database';

client.connect();

client.query(`Select * from users`, (err, res) => {
    if (!err) {
        //console.log(res.rows);
    } else {
        console.log(err.message);
    }
   
})

client.end;

//round-robin
import {fourPlayerMap, fivePlayerMap, sixPlayerMap, sevenPlayerMap, eightPlayerMap} from './roundRobin'

console.log("4 player round-robin:")
fourPlayerMap.forEach((value, key) => {
    console.log(`round${key}: `)
    for (var match of value) {
        console.log(`    ${match[0]} vs ${match[1]}`)
    }
})
