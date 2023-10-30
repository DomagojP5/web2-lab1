import express from 'express';
import fs from 'fs';
import path from 'path'
import https from 'https';
import { auth, requiresAuth } from 'express-openid-connect'; 
import dotenv from 'dotenv'
import { Pool } from 'pg'
import {fourPlayerMap, fivePlayerMap, sixPlayerMap, sevenPlayerMap, eightPlayerMap} from './roundRobin'

const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;

dotenv.config()

const config = { 
  authRequired : false,
  idpLogout : true, //login not only from the app, but also from identity provider
  secret: process.env.SECRET,
  //baseURL: `https://localhost:${port}`,
  baseURL: externalUrl || `https://localhost:${port}`,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  clientSecret: process.env.CLIENT_SECRET,
  authorizationParams: {
    response_type: 'code' ,
    //scope: "openid profile email"   
  },
};

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: 5432,
  //ssl : true
})

pool.connect();
  
const app = express();
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'pug');
app.use(express.static('public'))
app.use(auth(config));
  
if (externalUrl) {
  const hostname = '0.0.0.0'; //ne 127.0.0.1
  app.listen(port, hostname, () => {
    console.log(`Server locally running at http://${hostname}:${port}/ and from outside on ${externalUrl}`);
  });
} else {
  https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(port, function () {
    console.log(`Server running at https://localhost:${port}/`);
  });
}

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

app.get ("/competition", async (req, res) => {
  const user = JSON.stringify(req.oidc.user); 
  const email = req.oidc.user?.email

  var comps;
  var teams;
  try {
    comps = await pool.query(`SELECT * FROM competition`)
    teams = await pool.query(`SELECT * FROM competitor`)
  } catch (error) {
    console.log(error)
  }
  var comps = comps.rows
  var teams = teams.rows
  res.render('competition', {comps, teams, user, email});
});

app.get ("/generateCompetition", (req, res) => {
  const user = JSON.stringify(req.oidc.user); 
  if (!req.oidc.isAuthenticated()) {
    res.redirect("/")
  } else {
    res.render("generateCompetition")
  }
});

app.all ("/editCompetition/id=:tagId", async (req, res) => {

  if (!req.oidc.isAuthenticated()) {
    res.redirect("/")
  } 
  const user = (req.oidc.user); 
  const id = req.params.tagId

  var comp;
  var teams;
  var matches;
  try {
    comp = await pool.query(`SELECT * FROM competition WHERE id=${id}`)
    teams = await pool.query(`SELECT * FROM competitor WHERE id=${id}`)
    matches = await pool.query(`SELECT * FROM matches WHERE id=${id}`)
  } catch (error) {
    console.log(error)
  }
  var comp = comp.rows;
  var teams = teams.rows;
  var matches = matches.rows;
  res.render('editCompetition', {comp, teams, user, matches});
});

var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.post('/generateCompetition', urlencodedParser,  async (req, res) => {
  await pool.query(`
    INSERT INTO competition (name, email, compType) 
    VALUES ('${req.body.name}', '${req.oidc.user?.email}', ${req.body.competitionType})`)
  
  let teamDict = {};
  let i = 1;
  for(var competitor of req.body.competitors.split(",")) {
    if(req.body.competitionType == 1) {
      await pool.query(`
        INSERT INTO competitor (id, name, win, draw, lose, points)
        SELECT id, '${competitor}', 0, 0, 0, 0
        FROM competition 
        WHERE name='${req.body.name}'`)
    } else if (req.body.competitionType == 2) {      
      await pool.query(`
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
  matchMap.forEach( async(matches) => {
    for (let [matchId1, matchId2] of matches) {
      for (const [teamId1, teamName1] of Object.entries(teamDict)) {
        for (const [teamId2, teamName2] of Object.entries(teamDict)) {
          if((matchId1 != 'bye' && matchId2 != 'bye') && (teamId1 == matchId1 && teamId2 == matchId2)) {
            await pool.query(`
              INSERT INTO Matches (id, team1, team2, result) 
              SELECT id, '${teamName1}', '${teamName2}', 0  
              FROM competition  
              WHERE name='${req.body.name}'`)
        }
      }
    }
  }});
  setTimeout(() => {
    res.redirect('/competition')
  }, 100)
})

app.post('/updateMatches', urlencodedParser, async(req, res) => {
  const [compId, matchid, team1, team2, result, compType] = req.body.result.split(";")
  var prevResult;
  try {
    prevResult =  await pool.query(`SELECT result FROM Matches WHERE matchId=${matchid}`)
  } catch (error) {
    console.log(error)
  } 
  var prevResult = prevResult.rows[0].result;
  if(compType == 1) {
    if (prevResult == 0) {
      if(result == 1) {
        await pool.query(`UPDATE Competitor SET win=win+1, points=points+3 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET lose=lose+1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 2) {
        await pool.query(`UPDATE Competitor SET draw=draw+1, points=points+1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET draw=draw+1, points=points+1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 3) {
        await pool.query(`UPDATE Competitor SET lose=lose+1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win+1, points=points+3 WHERE id=${compId} AND name='${team2}'`)
      }
    } else if (prevResult == 1) {
      if(result == 0) {
        await pool.query(`UPDATE Competitor SET win=win-1, points=points-3 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET lose=lose-1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 2) {
        await pool.query(`UPDATE Competitor SET draw=draw+1, win=win-1, points=points-2 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET draw=draw+1, lose=lose-1, points=points+1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 3) {
        await pool.query(`UPDATE Competitor SET lose=lose+1, win=win-1, points=points-3 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win+1, lose=lose-1, points=points+3 WHERE id=${compId} AND name='${team2}'`)
      }
    } else if (prevResult == 2) {
      if(result == 0) {
        await pool.query(`UPDATE Competitor SET draw=draw-1, points=points-1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET draw=draw-1, points=points-1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 1) {
        await pool.query(`UPDATE Competitor SET draw=draw-1, win=win+1, points=points+2 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET draw=draw-1, lose=lose+1, points=points-1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 3) {
        await pool.query(`UPDATE Competitor SET draw=draw-1, lose=lose+1, points=points-1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET draw=draw-1, win=win+1, points=points+2 WHERE win=win+1 id=${compId} AND name='${team2}'`)
      }
    } else if (prevResult == 3) {
      if(result == 0) {
        await pool.query(`UPDATE Competitor SET lose=lose-1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win-1, points=points-3 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 1) {
        await pool.query(`UPDATE Competitor SET lose=lose-1, win=win+1, points=points+3 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win-1, lose=lose+1, points=points-3 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 2) {
        await pool.query(`UPDATE Competitor SET lose=lose-1, draw=draw+1, points=points+1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win-1, draw=draw+1, points=points-2 WHERE id=${compId} AND name='${team2}'`)
      }
    } 
  } else if (compType == 2) {
    if (prevResult == 0) {
      if(result == 1) {
        await pool.query(`UPDATE Competitor SET win=win+1, points=points+2 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET lose=lose+1, points=points+1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 3) {
        await pool.query(`UPDATE Competitor SET lose=lose+1, points=points+1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win+1, points=points+2 WHERE id=${compId} AND name='${team2}'`)
      }
    } else if (prevResult == 1) {
      if(result == 0) {
        await pool.query(`UPDATE Competitor SET win=win-1, points=points-2 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET lose=lose-1, points=points-1 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 3) {
        await pool.query(`UPDATE Competitor SET lose=lose+1, win=win-1, points=points-1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win+1, lose=lose-1, points=points+1 WHERE id=${compId} AND name='${team2}'`)
      }
    } else if (prevResult == 3) {
      if(result == 0) {
        await pool.query(`UPDATE Competitor SET lose=lose-1, points=points-1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win-1, points=points-2 WHERE id=${compId} AND name='${team2}'`)
      } else if (result == 1) {
        await pool.query(`UPDATE Competitor SET lose=lose-1, win=win+1, points=points+1 WHERE id=${compId} AND name='${team1}'`)
        await pool.query(`UPDATE Competitor SET win=win-1, lose=lose+1, points=points-1 WHERE id=${compId} AND name='${team2}'`)
      }
    } 
  }
  try {
    await pool.query(`UPDATE Matches SET result=${result} WHERE matchId=${matchid}`)
  } catch (error) {
    console.log(error)
  }
  res.redirect('back');
})
pool.end;