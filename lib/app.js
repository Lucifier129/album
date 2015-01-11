//album
var http = require('http')
var Route = require('./route')
var port = process.argv[2] || 1234
var href = 'http://127.0.1:' + port + '/'
var exec = require('child_process').exec
var spawn = require('child_process').spawn
var openBrowserByUrl = function(url) {
	switch (process.platform) {
		case 'darwin':
			exec('open ' + url)
			break
		case 'win32':
			exec('start ' + url)
			break
		default:
			spawn('xdg-open', [url])
	}
}

http.createServer(function(req, res) {
	new Route(req, res).init()
}).listen(port, function() {
	openBrowserByUrl(href)
})

console.log('Server start')