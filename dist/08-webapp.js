"use strict";
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
dotenv_1.default.config();
var app = (0, express_1.default)();
app.set("views", path_1.default.join(__dirname, "views"));
app.set('view engine', 'pug');
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
    console.log("Sign up");
});
app.get("/competition", function (req, res) {
    var user = JSON.stringify(req.oidc.user);
    res.render('competition', { user: user });
});
https_1.default.createServer({
    key: fs_1.default.readFileSync('server.key'),
    cert: fs_1.default.readFileSync('server.cert')
}, app)
    .listen(port, function () {
    console.log("Server running at https://localhost:".concat(port, "/"));
});
var database_1 = __importDefault(require("./database"));
database_1.default.connect();
database_1.default.query("Select * from users", function (err, res) {
    if (!err) {
        console.log(res.rows);
    }
    else {
        console.log(err.message);
    }
});
database_1.default.end;
