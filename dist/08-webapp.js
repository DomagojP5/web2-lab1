"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var https_1 = __importDefault(require("https"));
var express_openid_connect_1 = require("express-openid-connect");
var dotenv_1 = __importDefault(require("dotenv"));
var roundRobin_1 = require("./roundRobin");
var database_1 = __importDefault(require("./database"));
database_1.default.connect();
dotenv_1.default.config();
var app = (0, express_1.default)();
app.set("views", path_1.default.join(__dirname, "views"));
app.set('view engine', 'pug');
app.use(express_1.default.static('public'));
var port = 3000;
var config = {
    authRequired: false,
    idpLogout: true,
    secret: process.env.SECRET,
    baseURL: "https://localhost:".concat(port),
    clientID: process.env.CLIENT_ID,
    //issuerBaseURL: 'https://localhost:'.concat("3000", "/"),
    //issuerBaseURL: 'https://fer-web2.eu.auth0.com',
    issuerBaseURL: 'https://fer-web2-labos.eu.auth0.com',
    //issuerBaseURL: process.env.ISSUER_BASE_URL,
    clientSecret: process.env.CLIENT_SECRET,
    authorizationParams: {
        response_type: 'code',
        //scope: "openid profile email"   
    },
};
// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use((0, express_openid_connect_1.auth)(config));
app.get('/', function (req, res) {
    var _a, _b, _c;
    var username;
    if (req.oidc.isAuthenticated()) {
        username = (_b = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = req.oidc.user) === null || _c === void 0 ? void 0 : _c.sub;
    }
    res.render('index', { username: username });
});
app.get('/private', (0, express_openid_connect_1.requiresAuth)(), function (req, res) {
    var user = JSON.stringify(req.oidc.user);
    res.render('private', { user: user });
});
app.get("/sign-up", function (req, res) {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});
https_1.default.createServer({
    key: fs_1.default.readFileSync('server.key'),
    cert: fs_1.default.readFileSync('server.cert')
}, app)
    .listen(port, function () {
    console.log("Server running at https://localhost:".concat(port, "/"));
});
app.get("/competition", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, email;
    var _a;
    return __generator(this, function (_b) {
        user = JSON.stringify(req.oidc.user);
        email = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.email;
        database_1.default.query("SELECT * FROM competition", function (error, result, client) {
            var comps = result.rows;
            //console.log(comps)
            database_1.default.query("SELECT * FROM competitor", function (error, result, client) {
                var teams = result.rows;
                //console.log(result.rows)
                //console.log("2: " + user)
                //console.log("printing teams: " + teams)
                /*
                for (var i = 0; i < comps.length; i++) {
                  console.log(comps[i])
                  console.log("id: " + comps[i].id)
                  pool.query(`SELECT * FROM competitor WHERE id =${comps[i].id}`, function (error, result, client) {
                    var newTeams = result.rows;
                    console.log("prije: " + JSON.stringify(newTeams))
                    console.log()
                    newTeams.sort( function (a,b) {
                      console.log("usporedba" + JSON.stringify(a) + " i " + JSON.stringify(b) + " :" + `${a.points > b.points}`)
                      return a.points > b.points;
                    })
                    console.log("poslije" + JSON.stringify(newTeams))
                  })
                }
                console.log("prije: " + JSON.stringify(teams))
                console.log()
                teams.sort( function (a,b) {
                  console.log("usporedba" + JSON.stringify(a) + " i " + JSON.stringify(b) + " :" + `${3*a.win+a.draw > 3*b.win+b.draw}`)
                  return 3*a.win+a.draw > 3*b.win+b.draw;
                })
                console.log("poslije" + JSON.stringify(teams))
                */
                res.render('competition', { comps: comps, teams: teams, user: user, email: email });
            });
        });
        return [2 /*return*/];
    });
}); });
app.get("/generateCompetition", function (req, res) {
    var user = JSON.stringify(req.oidc.user);
    res.render('generateCompetition', { user: user });
});
app.post("/editCompetition/id=:tagId", function (req, res) {
    var user = JSON.stringify(req.oidc.user);
    //console.log(req.params.tagId)
    var id = req.params.tagId;
    database_1.default.query("SELECT * FROM competition WHERE id=".concat(id), function (error, result, client) {
        var comp = result.rows;
        database_1.default.query("SELECT * FROM competitor WHERE id=".concat(id), function (error, result, client) {
            var teams = result.rows;
            var length = Object.keys(teams).length;
            console.log("teams: " + length);
            var mapping = {
                4: roundRobin_1.fourPlayerMap,
                5: roundRobin_1.fivePlayerMap,
                6: roundRobin_1.sixPlayerMap,
                7: roundRobin_1.sevenPlayerMap,
                8: roundRobin_1.eightPlayerMap
            };
            var map = mapping[length];
            res.render('editCompetition', { comp: comp, teams: teams, user: user });
        });
    });
});
var bodyParser = require('body-parser');
//json parser
var jsonParser = bodyParser.json();
//url parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.post('/generateCompetition', urlencodedParser, function (req, res) {
    var _a;
    //const {name, competitors, competitionType} = req.body  
    //console.log(name, competitors, competitionType)
    console.log(req.body);
    //console.log(req.body.name)
    //console.log(req.body.competitors)
    //console.log(req.body.competitionType)
    //console.log(req.oidc.user?.email)
    //console.log(`INSERT INTO competition (name, email, compType) VALUES ('${req.body.name}', '${req.oidc.user?.email}', ${req.body.competitionType})`)
    database_1.default.query("INSERT INTO competition (name, email, compType) VALUES ('".concat(req.body.name, "', '").concat((_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.email, "', ").concat(req.body.competitionType, ")"));
    for (var _i = 0, _b = req.body.competitors.split(","); _i < _b.length; _i++) {
        var competitor = _b[_i];
        if (req.body.competitionType == 1) {
            //console.log(`INSERT INTO competitor (id, name, win, draw, lose) VALUES (SELECT id FROM competition WHERE name='${req.body.name}', '${competitor}', 0, 0, 0)`)
            database_1.default.query("\n        INSERT INTO competitor (id, name, win, draw, lose, points)\n        SELECT id, '".concat(competitor, "', 0, 0, 0, 0\n        FROM competition \n        WHERE name='").concat(req.body.name, "'"));
        }
        else if (req.body.competitionType == 2) {
            //console.log(`INSERT INTO competitor (id, name, win, lose) VALUES (SELECT id FROM competition WHERE name='${req.body.name}', '${competitor}', 0, 0)`)  
            database_1.default.query("\n        INSERT INTO competitor (id, name, win, lose, points)\n        SELECT id, '".concat(competitor, "', 0, 0, 0\n        FROM competition \n        WHERE name='").concat(req.body.name, "'"));
        }
        //console.log(competitor)
    }
    res.redirect('/competition');
});
/*
pool
  .query(`BEGIN`)
  .then((res) => {
    pool.query(
      `INSERT INTO competition (id, name, email) VALUES (1, 'comp1', 'domagoj.penava5@gmail.com')`
    )
  })
  .then((res) => {
    pool.query(
      `INSERT INTO competitor (id, competitorId, name, win, draw, lose) VALUES (1, 2, 'team2', 0, 0, 1)`
    )
  })
  .then((res) => {
    pool.query(`COMMIT`)
  })
  .catch((err) => {
    pool.query(`ROLLBACK`)
  })

*/
//db pool end
database_1.default.end;
