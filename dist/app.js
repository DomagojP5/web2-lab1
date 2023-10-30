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
    //ssl : true
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
    var user, email, comps, teams, error_1, comps, teams;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                user = JSON.stringify(req.oidc.user);
                email = (_a = req.oidc.user) === null || _a === void 0 ? void 0 : _a.email;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, pool.query("SELECT * FROM competition")];
            case 2:
                comps = _b.sent();
                return [4 /*yield*/, pool.query("SELECT * FROM competitor")];
            case 3:
                teams = _b.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.log(error_1);
                return [3 /*break*/, 5];
            case 5:
                comps = comps.rows;
                teams = teams.rows;
                res.render('competition', { comps: comps, teams: teams, user: user, email: email });
                return [2 /*return*/];
        }
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
app.all("/editCompetition/id=:tagId", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, id, comp, teams, matches, error_2, comp, teams, matches;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!req.oidc.isAuthenticated()) {
                    res.redirect("/");
                }
                user = (req.oidc.user);
                id = req.params.tagId;
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                return [4 /*yield*/, pool.query("SELECT * FROM competition WHERE id=".concat(id))];
            case 2:
                comp = _a.sent();
                return [4 /*yield*/, pool.query("SELECT * FROM competitor WHERE id=".concat(id))];
            case 3:
                teams = _a.sent();
                return [4 /*yield*/, pool.query("SELECT * FROM matches WHERE id=".concat(id))];
            case 4:
                matches = _a.sent();
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                console.log(error_2);
                return [3 /*break*/, 6];
            case 6:
                comp = comp.rows;
                teams = teams.rows;
                matches = matches.rows;
                res.render('editCompetition', { comp: comp, teams: teams, user: user, matches: matches });
                return [2 /*return*/];
        }
    });
}); });
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
app.post('/generateCompetition', urlencodedParser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var teamDict, i, _i, _a, competitor, mapping, length, matchMap;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, pool.query("\n    INSERT INTO competition (name, email, compType) \n    VALUES ('".concat(req.body.name, "', '").concat((_b = req.oidc.user) === null || _b === void 0 ? void 0 : _b.email, "', ").concat(req.body.competitionType, ")"))];
            case 1:
                _c.sent();
                teamDict = {};
                i = 1;
                _i = 0, _a = req.body.competitors.split(",");
                _c.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 8];
                competitor = _a[_i];
                if (!(req.body.competitionType == 1)) return [3 /*break*/, 4];
                return [4 /*yield*/, pool.query("\n        INSERT INTO competitor (id, name, win, draw, lose, points)\n        SELECT id, '".concat(competitor, "', 0, 0, 0, 0\n        FROM competition \n        WHERE name='").concat(req.body.name, "'"))];
            case 3:
                _c.sent();
                return [3 /*break*/, 6];
            case 4:
                if (!(req.body.competitionType == 2)) return [3 /*break*/, 6];
                return [4 /*yield*/, pool.query("\n        INSERT INTO competitor (id, name, win, lose, points)\n        SELECT id, '".concat(competitor, "', 0, 0, 0\n        FROM competition \n        WHERE name='").concat(req.body.name, "'"))];
            case 5:
                _c.sent();
                _c.label = 6;
            case 6:
                teamDict[i] = competitor;
                i++;
                _c.label = 7;
            case 7:
                _i++;
                return [3 /*break*/, 2];
            case 8:
                mapping = {
                    4: roundRobin_1.fourPlayerMap,
                    5: roundRobin_1.fivePlayerMap,
                    6: roundRobin_1.sixPlayerMap,
                    7: roundRobin_1.sevenPlayerMap,
                    8: roundRobin_1.eightPlayerMap
                };
                length = Object.keys(teamDict).length;
                matchMap = mapping[length];
                matchMap.forEach(function (matches) { return __awaiter(void 0, void 0, void 0, function () {
                    var _i, matches_1, _a, matchId1, matchId2, _b, _c, _d, teamId1, teamName1, _e, _f, _g, teamId2, teamName2;
                    return __generator(this, function (_h) {
                        switch (_h.label) {
                            case 0:
                                _i = 0, matches_1 = matches;
                                _h.label = 1;
                            case 1:
                                if (!(_i < matches_1.length)) return [3 /*break*/, 8];
                                _a = matches_1[_i], matchId1 = _a[0], matchId2 = _a[1];
                                _b = 0, _c = Object.entries(teamDict);
                                _h.label = 2;
                            case 2:
                                if (!(_b < _c.length)) return [3 /*break*/, 7];
                                _d = _c[_b], teamId1 = _d[0], teamName1 = _d[1];
                                _e = 0, _f = Object.entries(teamDict);
                                _h.label = 3;
                            case 3:
                                if (!(_e < _f.length)) return [3 /*break*/, 6];
                                _g = _f[_e], teamId2 = _g[0], teamName2 = _g[1];
                                if (!((matchId1 != 'bye' && matchId2 != 'bye') && (teamId1 == matchId1 && teamId2 == matchId2))) return [3 /*break*/, 5];
                                return [4 /*yield*/, pool.query("\n              INSERT INTO Matches (id, team1, team2, result) \n              SELECT id, '".concat(teamName1, "', '").concat(teamName2, "', 0  \n              FROM competition  \n              WHERE name='").concat(req.body.name, "'"))];
                            case 4:
                                _h.sent();
                                _h.label = 5;
                            case 5:
                                _e++;
                                return [3 /*break*/, 3];
                            case 6:
                                _b++;
                                return [3 /*break*/, 2];
                            case 7:
                                _i++;
                                return [3 /*break*/, 1];
                            case 8: return [2 /*return*/];
                        }
                    });
                }); });
                setTimeout(function () {
                    res.redirect('/competition');
                }, 100);
                return [2 /*return*/];
        }
    });
}); });
app.post('/updateMatches', urlencodedParser, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, compId, matchid, team1, team2, result, compType, prevResult, error_3, prevResult, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body.result.split(";"), compId = _a[0], matchid = _a[1], team1 = _a[2], team2 = _a[3], result = _a[4], compType = _a[5];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, pool.query("SELECT result FROM Matches WHERE matchId=".concat(matchid))];
            case 2:
                prevResult = _b.sent();
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.log(error_3);
                return [3 /*break*/, 4];
            case 4:
                prevResult = prevResult.rows[0].result;
                if (!(compType == 1)) return [3 /*break*/, 44];
                if (!(prevResult == 0)) return [3 /*break*/, 14];
                if (!(result == 1)) return [3 /*break*/, 7];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win+1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 5:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 6:
                _b.sent();
                return [3 /*break*/, 13];
            case 7:
                if (!(result == 2)) return [3 /*break*/, 10];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 8:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 9:
                _b.sent();
                return [3 /*break*/, 13];
            case 10:
                if (!(result == 3)) return [3 /*break*/, 13];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 11:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win+1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 12:
                _b.sent();
                _b.label = 13;
            case 13: return [3 /*break*/, 43];
            case 14:
                if (!(prevResult == 1)) return [3 /*break*/, 24];
                if (!(result == 0)) return [3 /*break*/, 17];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 15:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 16:
                _b.sent();
                return [3 /*break*/, 23];
            case 17:
                if (!(result == 2)) return [3 /*break*/, 20];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw+1, win=win-1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 18:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw+1, lose=lose-1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 19:
                _b.sent();
                return [3 /*break*/, 23];
            case 20:
                if (!(result == 3)) return [3 /*break*/, 23];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose+1, win=win-1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 21:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win+1, lose=lose-1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 22:
                _b.sent();
                _b.label = 23;
            case 23: return [3 /*break*/, 43];
            case 24:
                if (!(prevResult == 2)) return [3 /*break*/, 34];
                if (!(result == 0)) return [3 /*break*/, 27];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 25:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 26:
                _b.sent();
                return [3 /*break*/, 33];
            case 27:
                if (!(result == 1)) return [3 /*break*/, 30];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw-1, win=win+1, points=points+2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 28:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw-1, lose=lose+1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 29:
                _b.sent();
                return [3 /*break*/, 33];
            case 30:
                if (!(result == 3)) return [3 /*break*/, 33];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw-1, lose=lose+1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 31:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET draw=draw-1, win=win+1, points=points+2 WHERE win=win+1 id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 32:
                _b.sent();
                _b.label = 33;
            case 33: return [3 /*break*/, 43];
            case 34:
                if (!(prevResult == 3)) return [3 /*break*/, 43];
                if (!(result == 0)) return [3 /*break*/, 37];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 35:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 36:
                _b.sent();
                return [3 /*break*/, 43];
            case 37:
                if (!(result == 1)) return [3 /*break*/, 40];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1, win=win+1, points=points+3 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 38:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, lose=lose+1, points=points-3 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 39:
                _b.sent();
                return [3 /*break*/, 43];
            case 40:
                if (!(result == 2)) return [3 /*break*/, 43];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1, draw=draw+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 41:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, draw=draw+1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 42:
                _b.sent();
                _b.label = 43;
            case 43: return [3 /*break*/, 64];
            case 44:
                if (!(compType == 2)) return [3 /*break*/, 64];
                if (!(prevResult == 0)) return [3 /*break*/, 51];
                if (!(result == 1)) return [3 /*break*/, 47];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win+1, points=points+2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 45:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 46:
                _b.sent();
                return [3 /*break*/, 50];
            case 47:
                if (!(result == 3)) return [3 /*break*/, 50];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 48:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win+1, points=points+2 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 49:
                _b.sent();
                _b.label = 50;
            case 50: return [3 /*break*/, 64];
            case 51:
                if (!(prevResult == 1)) return [3 /*break*/, 58];
                if (!(result == 0)) return [3 /*break*/, 54];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 52:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 53:
                _b.sent();
                return [3 /*break*/, 57];
            case 54:
                if (!(result == 3)) return [3 /*break*/, 57];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose+1, win=win-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 55:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win+1, lose=lose-1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 56:
                _b.sent();
                _b.label = 57;
            case 57: return [3 /*break*/, 64];
            case 58:
                if (!(prevResult == 3)) return [3 /*break*/, 64];
                if (!(result == 0)) return [3 /*break*/, 61];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 59:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, points=points-2 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 60:
                _b.sent();
                return [3 /*break*/, 64];
            case 61:
                if (!(result == 1)) return [3 /*break*/, 64];
                return [4 /*yield*/, pool.query("UPDATE Competitor SET lose=lose-1, win=win+1, points=points+1 WHERE id=".concat(compId, " AND name='").concat(team1, "'"))];
            case 62:
                _b.sent();
                return [4 /*yield*/, pool.query("UPDATE Competitor SET win=win-1, lose=lose+1, points=points-1 WHERE id=".concat(compId, " AND name='").concat(team2, "'"))];
            case 63:
                _b.sent();
                _b.label = 64;
            case 64:
                _b.trys.push([64, 66, , 67]);
                return [4 /*yield*/, pool.query("UPDATE Matches SET result=".concat(result, " WHERE matchId=").concat(matchid))];
            case 65:
                _b.sent();
                return [3 /*break*/, 67];
            case 66:
                error_4 = _b.sent();
                console.log(error_4);
                return [3 /*break*/, 67];
            case 67:
                res.redirect('back');
                return [2 /*return*/];
        }
    });
}); });
pool.end;
