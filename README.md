# MyPKS API

Web API for Six Flags employee scheduling website MyPKS.

## Usage

Run `npm install` to install the dependencies, then `node server.js` to start
the web server. The web server will listen on port 3000 by default, but this
can be changed by setting the MYPKS_PORT environment variable. It's recommended
to run a proxy such as NGINX in front of the web server.

Send a `x-www-form-urlencoded` POST request to `/mypks-api` with body parameter
`session` set to your MyPKS session ID. To obtain this ID, log into MyPKS and
examine the browser cookie `ASP.NET_SessionId`. The value of this cookie will
be your session ID.

Note that session IDs expire after a predetermined amount of time on the server
with no activity. This amount is 20 minutes by default, which is probably what
MyPKS uses. If this amount of time passes without an API request, or without
you browsing any of the MyPKS pages on your own, your session will expire. In
this case, you'll need to log in again and get a new session ID.

In theory, you could set up a cron job or similar to keep the session alive,
but the server may still kill it at some point.

## Overview

Uses an existing user session to bypass Google's No CAPTCHA reCAPTCHA. Scrapes
web page data and parses it into JSON format.

Note that this is no longer in development and I have no means of testing it
anymore. Six Flags has migrated away from MyPKS, so the project remains for
archival purposes.

### Sample Responses

Successful login

```json
{
	"success": true,
	"shifts": {
		"2015-05-02": [
			{
				"time": {
					"start": "14:00",
					"end": "22:00"
				},
				"location": "Front Gate",
				"activityCenter": {
					"number": 1765,
					"name": "FG Ticket Takers"
				},
				"position": "Taker"
			}
		]
    },
}
```

Invalid session ID (this will still return a 200 success response)

```json
{
	"success": false,
	"error": "Invalid or expired session ID, log into MyPKS to get a new one"
}
```
