# MyPKS API

MyPKS API is a JSON API for Six Flags employee scheduling website
[MyPKS](http://mypks.com/). It uses an existing user session to bypass
ReCAPTCHA on the login page and present schedule information in a simple,
manipulatable format.

## Usage

Send a `x-www-form-urlencoded` POST request to `/mypks-api` with body parameter
`session` set to your MyPKS session ID. To obtain this ID, log into MyPKS and
examine the browser cookie `ASP.NET_SessionId`. The value of this cookie will
be your session ID.

Note that session IDs expire after a predetermined amount of time on the server
with no activity. This amount is 20 minutes by default, which is probably what
MyPKS uses. If this amount of time passes without an API request, or without
you browsing any of the MyPKS pages on your own, your session will expire. In
this case, you'll need to log in again and get a new session ID.

## Availability

This service is no longer hosted officially anywhere, but it should still work
properly with a valid MyPKS session. I have no way to test it any more,
especially since the company seems to be adopting a new system (at least
partially).

## Responses

Successful login (example)

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

Invalid session ID (this will still return a `200` success response)

```json
{
	"success": false,
	"error": "Invalid or expired session ID, log into MyPKS to get a new one"
}
```

