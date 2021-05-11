const express = require("express");
const { join } = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const jwt = require("express-jwt");
const jwtAuthz = require("express-jwt-authz");
const jwksRsa = require("jwks-rsa");
const authConfig = require("./auth_config.json");

const app = express();

const checkScopes = jwtAuthz([ 'create:order' ]);

// create the JWT middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

app.use(morgan("dev"));
app.use(helmet());
app.use(express.static(join(__dirname, "public")));

// Create an endpoint that uses the above middleware to
// protect this route from unauthorized requests
app.get("/api/orders", checkJwt, checkScopes, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!"
  });
});

app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Error handler
app.use(function(err, req, res, next) {
  console.log(err);
  if (err.name === "UnauthorizedError") {
    
    return res.status(401).send({ msg: "Invalid token" });
  }else{
    console.log(err);
  }

  next(err, req, res);
});

process.on("SIGINT", function() {
  process.exit();
});

module.exports = app;
