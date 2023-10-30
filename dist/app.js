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
var pg_1 = require("pg");
var roundRobin_1 = require("./roundRobin");
var externalUrl = process.env.RENDER_EXTERNAL_URL;
var port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000;
dotenv_1.default.config();
var config = {
    authRequired: false,
    idpLogout: true,
    secret: process.env.SECRET,
    //baseURL: `https://localhost:${port}`,
    baseURL: externalUrl || "https://localhost:".concat(port),
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    clientSecret: process.env.CLIENT_SECRET,
    authorizationParams: {
        response_type: 'code',
        //scope: "openid profile email"   
    },
};
var pool = new pg_1.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: true
});
pool.connect();
var app = (0, express_1.default)();
app.set("views", path_1.default.join(__dirname, "views"));
app.set('view engine', 'pug');
app.use(express_1.default.static('public'));
app.use((0, express_openid_connect_1.auth)(config));
if (externalUrl) {
    var hostname_1 = '0.0.0.0'; //ne 127.0.0.1
    app.listen(port, hostname_1, function () {
        console.log("Server locally running at http://".concat(hostname_1, ":").concat(port, "/ and from outside on ").concat(externalUrl));
    });
}
else {
    https_1.default.createServer({
        key: fs_1.default.readFileSync('server.key'),
        cert: fs_1.default.readFileSync('server.cert')
    }, app)
        .listen(port, function () {
        console.log("Server running at https://localhost:".concat(port, "/"));
    });
}
app.get('/', function (req, res) {
    var _a, _b, _c;
    var username;
    if (req.oidc.isAuthenticated()) {
        username = (_b = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = req.oidc.user) === null || _c === void 0 ? void 0 : _c.sub;
    }
    res.render('index', { username: username });
});
app.get("/sign-up", function (req, res) {
    res.oidc.login({
        returnTo: '/',
        authorizationParams: {
            screen_hint: "signup",
        },
    });
});
app.get("/competition", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, email;
    var _a;
    return __generator(this, function (_b) {
        user = JSON.stringify(req.oidc.user);
        email = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.email;
        pool.query("SELECT * FROM competition", function (error, result, client) {
            return __awaiter(this, void 0, void 0, function () {
                var comps;
                return __generator(this, function (_a) {
                    if (result) {
                        comps = result.rows;
                    }
                    pool.query("SELECT * FROM competitor", function (error, result, client) {
                        if (result) {
                            var teams = result.rows;
                        }
                        res.render('competition', { comps: comps, teams: teams, user: user, email: email });
                    });
                    return [2 /*return*/];
                });
            });
        });
        return [2 /*return*/];
    });
}); });
app.get("/generateCompetition", function (req, res) {
    var user = JSON.stringify(req.oidc.user);
    if (!req.oidc.isAuthenticated()) {
        res.redirect("/");
    }
    else {
        res.render("generateCompetition");
    }
});
app.all("/editCompetition/id=:tagId", function (req, res) {
    if (!req.oidc.isAuthenticated()) {
        res.redirect("/");
    }
    var user = (req.oidc.user);
    var id = req.params.tagId;
    pool.query("SELECT * FROM competition WHERE id=".concat(id), function (error, result, client) {
        if (result) {
            var comp = result.rows;
        }
        pool.query("SELECT * FROM competitor WHERE id=".concat(id), function (error, result, client) {
            if (result) {
                var teams = result.rows;
            }
            pool.query("SELECT * FROM matches WHERE id=".concat(id), function (error, result, client) {
                if (result) {
                    var matches = result.rows;
                }
                res.render('editCompetition', { comp: comp, teams: teams, user: user, matches: matches });
            });
        });
    });
});
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.post('/generateCompetition', urlencodedParser, function (req, res) {
    var _a;
    pool.query("\n    INSERT INTO competition (name, email, compType) \n    VALUES ('".concat(req.body.name, "', '").concat((_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.email, "', ").concat(req.body.competitionType, ")"));
    var teamDict = {};
    var i = 1;
    for (var _i = 0, _b = req.body.competitors.split(","); _i < _b.length; _i++) {
        var competitor = _b[_i];
        if (req.body.competitionType == 1) {
            pool.query("\n        INSERT INTO competitor (id, name, win, draw, lose, points)\n        SELECT id, '".concat(competitor, "', 0, 0, 0, 0\n        FROM competition \n        WHERE name='").concat(req.body.name, "'"));
        }
        else if (req.body.competitionType == 2) {
            pool.query("\n        INSERT INTO competitor (id, name, win, lose, points)\n        SELECT id, '".concat(competitor, "', 0, 0, 0\n        FROM competition \n        WHERE name='").concat(req.body.name, "'"));
        }
        teamDict[i] = competitor;
        i++;
    }
    var mapping = {
        4: roundRobin_1.fourPlayerMap,
        5: roundRobin_1.fivePlayerMap,
        6: roundRobin_1.sixPlayerMap,
        7: roundRobin_1.sevenPlayerMap,
        8: roundRobin_1.eightPlayerMap
    };
    if (Object.keys(teamDict)) {
        var length_1 = Object.keys(teamDict).length;
        var matchMap = mapping[length_1];
        matchMap.forEach(function (matches) {
            for (var _i = 0, matches_1 = matches; _i < matches_1.length; _i++) {
                var _a = matches_1[_i], matchId1 = _a[0], matchId2 = _a[1];
                for (var _b = 0, _c = Object.entries(teamDict); _b < _c.length; _b++) {
                    var _d = _c[_b], teamId1 = _d[0], teamName1 = _d[1];
                    for (var _e = 0, _f = Object.entries(teamDict); _e < _f.length; _e++) {
                        var _g = _f[_e], teamId2 = _g[0], teamName2 = _g[1];
                        if ((matchId1 != 'bye' && matchId2 != 'bye') && (teamId1 == matchId1 && teamId2 == matchId2)) {
                            pool.query("\n                INSERT INTO Matches (id, team1, team2, result) \n                SELECT id, '".concat(teamName1, "', '").concat(teamName2, "', 0  \n                FROM competition  \n                WHERE name='").concat(req.body.name, "'"));
                        }
                    }
                }
            }
        });
    }
    setTimeout(function () {
        res.redirect('/competition');
    }, 100);
});
app.post('/updateMatches', urlencodedParser, function (req, res) {
    var _a = req.body.result.split(";"), compId = _a[0], matchid = _a[1], team1 = _a[2], team2 = _a[3], result = _a[4], compType = _a[5];
    pool.query("SELECT result FROM Matches WHERE matchId=".concat(matchid), function (error, result1, client) {
        var prevResult = result1.rows[0].result;
        if (compType == 1) {
            if (prevResult == 0) {
                if (result == 1) {
                    pool.query("UPDATE Competitor SET win=win+1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET lose=lose+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 2) {
                    pool.query("UPDATE Competitor SET draw=draw+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET draw=draw+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 3) {
                    pool.query("UPDATE Competitor SET lose=lose+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win+1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
            else if (prevResult == 1) {
                if (result == 0) {
                    pool.query("UPDATE Competitor SET win=win-1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET lose=lose-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 2) {
                    pool.query("UPDATE Competitor SET draw=draw+1, win=win-1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET draw=draw+1, lose=lose-1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 3) {
                    pool.query("UPDATE Competitor SET lose=lose+1, win=win-1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win+1, lose=lose-1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
            else if (prevResult == 2) {
                if (result == 0) {
                    pool.query("UPDATE Competitor SET draw=draw-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET draw=draw-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 1) {
                    pool.query("UPDATE Competitor SET draw=draw-1, win=win+1, points=points+2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET draw=draw-1, lose=lose+1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 3) {
                    pool.query("UPDATE Competitor SET draw=draw-1, lose=lose+1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET draw=draw-1, win=win+1, points=points+2 WHERE win=win+1 id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
            else if (prevResult == 3) {
                if (result == 0) {
                    pool.query("UPDATE Competitor SET lose=lose-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win-1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 1) {
                    pool.query("UPDATE Competitor SET lose=lose-1, win=win+1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win-1, lose=lose+1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 2) {
                    pool.query("UPDATE Competitor SET lose=lose-1, draw=draw+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win-1, draw=draw+1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
        }
        else if (compType == 2) {
            if (prevResult == 0) {
                if (result == 1) {
                    pool.query("UPDATE Competitor SET win=win+1, points=points+2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET lose=lose+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 3) {
                    pool.query("UPDATE Competitor SET lose=lose+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win+1, points=points+2 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
            else if (prevResult == 1) {
                if (result == 0) {
                    pool.query("UPDATE Competitor SET win=win-1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET lose=lose-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 3) {
                    pool.query("UPDATE Competitor SET lose=lose+1, win=win-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win+1, lose=lose-1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
            else if (prevResult == 3) {
                if (result == 0) {
                    pool.query("UPDATE Competitor SET lose=lose-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win-1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
                else if (result == 1) {
                    pool.query("UPDATE Competitor SET lose=lose-1, win=win+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"));
                    pool.query("UPDATE Competitor SET win=win-1, lose=lose+1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"));
                }
            }
        }
        pool.query("UPDATE Matches SET result=".concat(result, " WHERE matchId=").concat(matchid), function (error, result, client) {
            res.redirect('back');
        });
    });
});
pool.end;
