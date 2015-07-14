# MyPKS API

A JSON API for Six Flags scheduling website [MyPKS](http://mypks.com/).

## Usage

Send a GET request with parameters `id` (ID number) and `bd` (birthdate in format `YYMM`).

Request example: http://127.0.0.1:8080/?id=00000000&bd=0000

Current official host: [mypks-api.herokuapp.com](https://mypks-api.herokuapp.com/)

GET is used over POST because it's easier, and because MyPKS login details are non-sensitive and non-changable.

## Responses

Successful login (example)

```json
{
	"success": true,
	"shifts": {
		"2015-05-02": [
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
		]
    },
    "error": null
}
```

ID and birthdate neither in the form of a number

```json
{
	"success": false,
	"error": "Invalid ID and birthdate format"
}
```

ID not in the form of a number

```json
{
	"success": false,
	"error": "Invalid ID format"
}
```

Birthdate not in the form of a number

```json
{
	"success": false,
	"error": "Invalid birthdate format"
}
```

Invalid login credentials

```json
{
	"success": false,
	"error": "Unable to authenticate"
}
```
