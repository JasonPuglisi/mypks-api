var bodyParser = require('body-parser');
var express = require('express');
var moment = require('moment');
var request = require('request');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

var mypksRoot = 'mypks.com';
var mypksMain = 'http://mypks.com/default.aspx';
var mypksSession = 'ASP.NET_SessionId';
var mypksAuth = '.ASPXAUTH';

app.post('/', function(req, res) {
  var session = req.body.session;
  var auth = req.body.auth;

  var jar = request.jar();
  var cookie = request.cookie(mypksSession + '=' + session + '&' + mypksAuth +
    '=' + auth);
  jar.setCookie(cookie, mypksRoot);

  request({ url: mypksMain, jar: jar }, function(err, res2, body) {
    res.send(body);
  });
});

app.listen(process.env.MYPKS_PORT || 3000);

