// Declare dependencies
var express = require('express');
var moment = require('moment');
var zombie = require('zombie');

// Start web server on port 8080 unless otherwise specified
var app = express();
var port = process.env.PORT || 8080;

// Log port web server is listening on
app.listen(port, function() {
	console.log('Six Flags Schedule API running on port ' + port);
});

// Recieve root page request in form: http://127.0.0.1:8080/?id=00000000&bd=0000
// * URL parameters are used for simplicity, and because mypks logins generally aren't sensitive
app.get('/', function(req, res) {

	// Set response type to JSON
	res.setHeader('Content-Type', 'application/json');

	// Get username and password from URL
	var id = req.query.id;
	var bd = req.query.bd;

	// Send error if username and password are invalid
	if (isNaN(id) && isNaN(bd))
		sendError(res, 'Invalid ID and birthdate format');

	// Send error if username is invalid
	else if (isNaN(id))
		sendError(res, 'Invalid ID format');

	// Send error if password is invalid
	else if (isNaN(bd))
		sendError(res, 'Invalid birthdate format');

	// Proceed to log in attempt
	else
		logIn(res, id, bd);

});

// Attempt to log into mypks
// * A headless browser is used to satisfy hidden fields
function logIn(res, id, bd) {

	// Create browser and set page URLs
	var browser = new zombie();
	var destination = 'http://mypks.com/';
	var target = 'http://mypks.com/default.aspx';

	// Visit login page and attempt login with specified credentials
	browser.visit(destination, function(document) {
		browser.fill('txtBadge', id).fill('txtBirthDate', bd).pressButton('btnOK', function() {

			// Make sure login form is still present
			try {
				browser.assert.element('#txtBadge');

				// Attempt to log in again if target URL not reached
				// * Even in normal browsers, mypks sometimes only works after two login attempts
				if (browser.url !== target) {
					browser.fill('txtBadge', id).fill('txtBirthDate', bd).pressButton('btnOK', function() {

						// Send error if target URL not reached
						if (browser.url !== target)
							sendError(res, 'Unable to authenticate');

						// Proceed to schedule parsing
						else
							parseSchedule(res, browser.document);

					});
				}

				// Proceed to schedule parsing
				else
					parseSchedule(res, browser.document);
			}

			// Send error if login form is not still present
			catch (e) {
				sendError(res, 'Unable to authenticate');
			}

		});
	});

}

// Scrape and parse schedule from mypks
function parseSchedule(res, document) {

	// Create array for shift storage and get raw row data
	var shifts = [];
	var rows = document.getElementById('GridView1').tBodies[0].rows;

	// Get raw cell data for each row
	for (var i = 1; i < rows.length; i++) {
		var cells = rows[i].cells;

		// Set raw data to be parsed
		var rawDate = cells[0].innerHTML;
		var rawActivityCenter = cells[2].innerHTML;
		var rawTime = cells[4].innerHTML;

		// Set raw data to be left alone
		var location = cells[1].innerHTML;
		var position = cells[3].innerHTML;

		// Parse data if row isn't empty
		if (location !== '&nbsp;') {

			// Format date
			var date = moment(rawDate.substring(rawDate.indexOf(' ') + 1), 'MM/DD/YYYY').format('dddd, MMMM Do YYYY');

			// Format start and end times
			var time = {};
			time.start = moment(rawTime.substring(0, rawTime.indexOf('-') - 1), 'HH:mm').format('h:mm a');
			time.end = moment(rawTime.substring(rawTime.indexOf('-') + 2), 'HH:mm').format('h:mm a');

			// Format activity center number and name
			var activityCenter = {};
			activityCenter.number = parseInt(rawActivityCenter.substring(0, rawActivityCenter.indexOf('-') - 1));
			activityCenter.name = rawActivityCenter.substring(rawActivityCenter.indexOf('-') + 1);

			// Add row data to shifts
			shifts.push({
				'date': date,
				'time': time,
				'location': location,
				'activityCenter': activityCenter,
				'position': position
			});

		}
	}

	// Send parsed and formatted shifts
	sendShifts(res, shifts);

}

// Send success response with shifts
function sendShifts(res, shifts) {
	res.end(JSON.stringify({
		'success': true,
		'shifts': shifts,
		'error': null
	}));
}

// Send error response with message
function sendError(res, e) {
	res.end(JSON.stringify({
		'success': false,
		'error': e
	}));
}
