// Declare dependencies
var express = require('express');
var moment = require('moment');
var validator = require('validator');
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

	// Attempt to log in and get schedule
	logIn(res, req.query, 'getSchedule');

});

// Recieve email page request in form: http://127.0.0.1:8080/email?id=00000000&bd=0000
// * Set email by adding addr parameter: http://127.0.0.1:8080/email?id=00000000&bd=0000&addr=example@example.com
app.get('/email', function(req, res) {

	// Set response type to JSON
	res.setHeader('Content-Type', 'application/json');

	// Attempt to login and update email address if new address not specified
	if (req.query.addr === undefined)
		logIn(res, req.query, 'getEmail');

	// Attempt to login and get email address
	else
		logIn(res, req.query, 'setEmail');

});

// Attempt to log into mypks
// * A headless browser is used to satisfy hidden fields
function logIn(res, params, action) {

	// Get username and password from URL
	var id = params.id;
	var bd = params.bd;

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
	else {

		// Create browser and set page URLs
		var browser = new zombie();
		var destination = 'http://mypks.com/';
		var target = 'http://mypks.com/default.aspx';

		// Visit login page and attempt login with specified credentials
		browser.visit(destination, function(e) {
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

							// Proceed to action processing
							else
								processAction(res, params, action, browser);

						});
					}

					// Proceed to action processing
					else
						processAction(res, params, action, browser);
				}

				// Send error if login form is not still present
				catch (e) {
					sendError(res, 'Unable to authenticate');
				}

			});
		});

	}

}

// Process page actions on mypks
function processAction(res, params, action, browser) {
	switch (action) {

		// Get schedule from main page
		case 'getSchedule':
			parseSchedule(res, browser.document);
		break;

		// Get or set email from email page
		case 'getEmail':
		case 'setEmail':
			processEmail(res, params, action, browser);
		break;

	}
}

// Scrape and parse schedule from mypks
function parseSchedule(res, document) {

	// Create array for shift storage and get raw row data
	var shifts = {};
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
			var date = moment(rawDate.substring(rawDate.indexOf(' ') + 1), 'MM/DD/YYYY').format('YYYY-MM-DD');

			// Format start and end times
			var time = {};
			time.start = rawTime.substring(0, rawTime.indexOf('-') - 1);
			time.end = rawTime.substring(rawTime.indexOf('-') + 2);

			// Format activity center number and name
			var activityCenter = {};
			activityCenter.number = parseInt(rawActivityCenter.substring(0, rawActivityCenter.indexOf('-') - 1));
			activityCenter.name = rawActivityCenter.substring(rawActivityCenter.indexOf('-') + 1);

			// Add date to shifts if not present
			if (!shifts[date])
				shifts[date] = [];

			// Add row data to shifts
			shifts[date].push({
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

// Process and update email from mypks
function processEmail(res, params, action, browser) {

	// Set email page URL
	var destination = 'http://mypks.com/emailNotice.aspx';

	// Visit email page and process email action
	browser.visit(destination, function(e) {

		// Create email address store
		var email = {};

		// Set old/current email address
		email.old = browser.document.getElementById('txtEmail').value;

		// Set old/current email address to null if blank
		if (!email.old)
			email.old = null;

		switch (action) {

			// Send email address
			case 'getEmail':
				sendEmail(res, email.old);
			break;

			// Set and send email address
			case 'setEmail':

				// Set new email address
				email.new = params.addr;

				// Send invalid email address error if email address is not valid
				if (!validator.isEmail(email.new))
					sendError(res, 'Invalid email address');

				// Update and send email address
				else {
					browser.fill('txtEmail', email.new).pressButton('Button1', function() {
						sendEmail(res, email);
					});
				}

			break;

		}
	});

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

// Send success response with email
function sendEmail(res, email) {
	res.end(JSON.stringify({
		'success': true,
		'email': email
	}));
}
