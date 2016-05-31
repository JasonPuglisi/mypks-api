var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var express = require('express');
var moment = require('moment');
var request = require('request');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));

var mypksRoot = 'http://mypks.com';
var mypksMain = 'http://mypks.com/default.aspx';
var mypksSession = 'ASP.NET_SessionId';

app.get('/mypks-api', function(req, res) {
  res.redirect('https://github.com/JasonPuglisi/mypks-api');
});

app.post('/mypks-api', function(req, res) {
  var session = req.body.session;
  var auth = req.body.auth;

  var jar = request.jar();
  var cookie = request.cookie(mypksSession + '=' + session);
  jar.setCookie(cookie, mypksRoot);

  request({ url: mypksMain, jar: jar }, function(err, res2, body) {
    if (!err && res2.statusCode === 200) {
      var $ = cheerio.load(body);
      parseSchedulePage($, function(shifts) {
        res.json({
          success: true,
          shifts: shifts
        });
      });
    } else {
      res.json({
        success: false,
        error: "Invalid or expired session ID, log into MyPKS to get a new one"
      });
    }
  });
});

app.listen(process.env.MYPKS_PORT || 3000);

function parseSchedulePage($, callback) {
  var shifts = {};

  var tableSelector = '#GridView1 tr';
  var rows = $(tableSelector);
  for (var i = 1; i < rows.length; i++) {
    var cols = rows.eq(i).find('td').map(function(i, el) {
      return $(this).text();
    }).get();

    var date = cols[0];
    var location = cols[1];
    var activityCenter = cols[2];
    var position = cols[3];
    var time = cols[4];

    if (activityCenter !== ' ') {
      var dateParsed = moment(date.substring(date.indexOf(' ') + 1),
        'MM/DD/YYYY').format('YYYY-MM-DD');

      var activityCenterParsed = {};
      activityCenterParsed.number = parseInt(activityCenter.substring(0,
        activityCenter.indexOf('-') - 1));
      activityCenterParsed.name = activityCenter.substring(
        activityCenter.indexOf('-') + 1);

      var timeParsed = {};
      timeParsed.start = time.substring(0, time.indexOf('-') - 1);
      timeParsed.end = time.substring(time.indexOf('-') + 2);

      if (!shifts[dateParsed]) {
        shifts[dateParsed] = [];
      }

      shifts[dateParsed].push({
        time: timeParsed,
        location: location,
        activityCenter: activityCenterParsed,
        position: position
      });
    }
  }

  callback(shifts);
}

