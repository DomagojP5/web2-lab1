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

      let teamDict = {};
      for(let i = 0; i < teams.length; i++) {
        teamDict[i+1] = teams[i].name
      }
      const map = mapping[length]
      //console.log(comp)
      //console.log(teams)
      res.render('editCompetition', {comp, teams, user, map, teamDict});
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
  //console.log(req.body)
  
  console.log(`INSERT INTO competition (name, email, compType) VALUES ('${req.body.name}', '${req.oidc.user?.email}', ${req.body.competitionType})`)
  pool.query(`INSERT INTO competition (name, email, compType) VALUES ('${req.body.name}', '${req.oidc.user?.email}', ${req.body.competitionType})`)
  
  let teamDict = {};
  let i = 1;
  for(var competitor of req.body.competitors.split(",")) {
    if(req.body.competitionType == 1) {
      console.log(`INSERT INTO competitor (id, name, win, draw, lose, points) SELECT id, '${competitor}', 0, 0, 0, 0 FROM competition  WHERE name='${req.body.name}'`)
      pool.query(`
        INSERT INTO competitor (id, name, win, draw, lose, points)
        SELECT id, '${competitor}', 0, 0, 0, 0
        FROM competition 
        WHERE name='${req.body.name}'`)
    } else if (req.body.competitionType == 2) {
      console.log(`INSERT INTO competitor (id, name, win, lose, points) SELECT id, '${competitor}', 0, 0, 0FROM competition WHERE name='${req.body.name}'`) 
      
      pool.query(`
        INSERT INTO competitor (id, name, win, lose, points)
        SELECT id, '${competitor}', 0, 0, 0
        FROM competition 
        WHERE name='${req.body.name}'`)
           
    }
    teamDict[i] = competitor;
    i++;
  }
  const mapping = {
    4:fourPlayerMap,
    5:fivePlayerMap,
    6:sixPlayerMap,
    7:sevenPlayerMap,
    8:eightPlayerMap
  }
  const length = Object.keys(teamDict).length;
  const matchMap = mapping[length]
  //console.log("map size: " + matchMap.size)
  //console.log(mapping[length]);
  matchMap.forEach((matches) => {
    for (let [matchId1, matchId2] of matches) {
      //console.log(matchId1, matchId2)
      for (const [teamId1, teamName1] of Object.entries(teamDict)) {
        for (const [teamId2, teamName2] of Object.entries(teamDict)) {
          if((matchId1 != 'bye' && matchId2 != 'bye') && (teamId1 == matchId1 && teamId2 == matchId2)) {
            console.log(`INSERT INTO Matches (id, team1, team2, result) SELECT id, '${teamName1}', '${teamName2}'  FROM competition  WHERE name='${req.body.name}', 0`)
            pool.query(`INSERT INTO Matches (id, team1, team2, result) SELECT id, '${teamName1}', '${teamName2}'  FROM competition  WHERE name='${req.body.name}', 0`)
        }
      }
    }
  }});
  res.redirect('/competition')
})

app.post('/updateMatches', urlencodedParser, (req, res) => {
  console.log(req.body)
  console.log(req.body.result)
  res.redirect('/competition')
})


pool.end;