import express from 'express';
import fs from 'fs';
import path from 'path'
import https from 'https';
import { auth, requiresAuth } from 'express-openid-connect'; 
import dotenv from 'dotenv'

import {fourPlayerMap, fivePlayerMap, sixPlayerMap, sevenPlayerMap, eightPlayerMap} from './roundRobin'
import pool from './database';
pool.connect();

dotenv.config()

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');

app.use(express.static('public'))

const port = 3000;

const config = { 
  authRequired : false,
  idpLogout : true, //login not only from the app, but also from identity provider
  secret: process.env.SECRET,
  baseURL: `https://localhost:${port}`,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
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


https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)
.listen(port, function () {
  console.log(`Server running at https://localhost:${port}/`);
});


app.get ("/competition", async (req, res) => {
  const user = JSON.stringify(req.oidc.user); 
  const email = req.oidc.user?.email
  
  pool.query(`SELECT * FROM competition`, function (error, result, client){
    var comps = result.rows; 
    //console.log(comps)
    pool.query(`SELECT * FROM competitor`, function (error, result, client){
      var teams = result.rows;
      //console.log(result.rows)
      //console.log("2: " + user)
      //console.log("printing teams: " + teams)
      res.render('competition', {comps:comps, teams:teams, user, email});
    });
    
  });

});

app.get ("/generateCompetition", (req, res) => {
  const user = JSON.stringify(req.oidc.user); 

  res.render('generateCompetition', {user}); 
});

app.post ("/editCompetition/id=:tagId", (req, res) => {
  const user = JSON.stringify(req.oidc.user); 
  //console.log(req.params.tagId)
  const id = req.params.tagId

  pool.query(`SELECT * FROM competition WHERE id=${id}`, function (error, result, client){
    var comp = result.rows;
    pool.query(`SELECT * FROM competitor WHERE id=${id}`, function (error, result, client){
      var teams = result.rows;
      const length = Object.keys(teams).length;
      //console.log("teams: " + length)
      const mapping = {
        4:fourPlayerMap,
        5:fivePlayerMap,
        6:sixPlayerMap,
        7:sevenPlayerMap,
        8:eightPlayerMap
      }
      const map = mapping[length]
      res.render('editCompetition', {comp:comp, teams:teams, user, map:map});
    });
    
  });
  
});



var bodyParser = require('body-parser')
//json parser
var jsonParser = bodyParser.json()
//url parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/generateCompetition', urlencodedParser,  (req, res) => {
  //const {name, competitors, competitionType} = req.body  
  //console.log(name, competitors, competitionType)
  console.log(req.body)
  
  //console.log(`INSERT INTO competition (name, email, compType) VALUES ('${req.body.name}', '${req.oidc.user?.email}', ${req.body.competitionType})`)
  pool.query(`INSERT INTO competition (name, email, compType) VALUES ('${req.body.name}', '${req.oidc.user?.email}', ${req.body.competitionType})`)
  
  for(var competitor of req.body.competitors.split(",")) {
    if(req.body.competitionType == 1) {
      //console.log(`INSERT INTO competitor (id, name, win, draw, lose) VALUES (SELECT id FROM competition WHERE name='${req.body.name}', '${competitor}', 0, 0, 0)`)
      pool.query(`
        INSERT INTO competitor (id, name, win, draw, lose, points)
        SELECT id, '${competitor}', 0, 0, 0, 0
        FROM competition 
        WHERE name='${req.body.name}'`)
    } else if (req.body.competitionType == 2) {
      //console.log(`INSERT INTO competitor (id, name, win, lose) VALUES (SELECT id FROM competition WHERE name='${req.body.name}', '${competitor}', 0, 0)`)  
      pool.query(`
        INSERT INTO competitor (id, name, win, lose, points)
        SELECT id, '${competitor}', 0, 0, 0
        FROM competition 
        WHERE name='${req.body.name}'`)    
    }
    //console.log(competitor)
  }
  res.redirect('/competition')
})

pool.end;