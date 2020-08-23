const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
var cookieParser = require("cookie-parser");
const crypto = require("crypto");
const bridge = require('./bridge');

// PORT assign
const PORT = process.env.PORT || 8080;
const message = `Server is running on PORT:${PORT}.`;

// Init express
const app = express();

// Attach session
app.use(cookieParser());
// set a cookie
app.use(function (req, res, next) {
  var cookie = req.cookies.uuid;
  if (cookie === undefined) {
    var uuid = crypto.randomBytes(16).toString("hex");
    res.cookie('uuid',uuid, { maxAge: 24*60*60*1000, httpOnly: true });
  } 
  next();
});

//create server
const server = http.createServer(app);
var io = require('socket.io')(server, {
  path: '/ws',
  serveClient: false,
  pingInterval: 10000,
  pingTimeout: 5000
});

bridge.init(io);

// API monitoring
app.use(morgan('dev'));
app.use(express.static('../app'));
// CORS handler
const whitelist = ['http://localhost:8080'];
const corsOptions = {
  origin: (origin, callback) => {
    console.log(origin, 'origin');
    if (whitelist.indexOf(origin) !== -1 || origin === undefined || origin.match(/chrome-extension/i)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTION',
  credentials: true,
  exposedHeaders: ['x-auth-token'],
  maxAge: 86400,
  preflightContinue: true,
};
app.use(cors(corsOptions));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
}));
app.use(express.json({
  limit: '50mb',
}));

//testing server
app.get('/test', (req, res) => res.send(message));

app.get("/", (req,res) => {
    res.sendFile(path.resolve(`../app/index.js`))
});
// Restiction router
app.all('*', (req, res) => res.status(404).send(`Access denied`));

server.listen(PORT, () => {
    console.log("Server is running on " + PORT);
})
