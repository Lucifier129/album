var fs = require('fs')
var url = require('url')
var path = require('path')
var mime = require('./mime')
var querystring = require('querystring').parse

var cwd = process.cwd()
var viewDir = path.join(path.dirname(__dirname), 'view/')
var dirImg = 'dir.jpg'
var docImg = 'doc.jpg'
var methodName = 'getFileFromCurrentDir'

function readMime(pth) {
	return mime[path.extname(pth).slice(1)] || 'text/unknown'
}

function readFile(pth, callback) {
	if (typeof callback !== 'function') {
		return console.log(callback + ' is not a function')
	}
	fs.exists(pth, function(exists) {
		if (!exists) {
			return callback(null, pth + ' is not found:404')
		}
		fs.readFile(pth, callback)
	})
}

function readDir(dir, callback) {
	fs.readdir(dir, function(err, files) {
		if (err) {
			return console.log(err)
		}
		callback(files)
	})
}

function isExits(pth) {
	return fs.existsSync(pth)
}

function getStat(pth) {
	return isExits(pth) && fs.statSync(pth)
}

function isFile(pth) {
	var stat = getStat(pth)
	return stat && stat.isFile()
}

function isDir(pth) {
	var stat = getStat(pth)
	return stat && stat.isDirectory()
}

function isImg(pth) {
	return /jpg|gif|png/i.test(path.extname(pth))
}

function scanDir(dir, basedir) {
	dir = decodeURI(dir)
	var files = fs.readdirSync(dir)
	var imgs = []
	var docs = []
	var dirs = []
	files.forEach(function(filename) {
		var fullPath = path.join(dir, filename)
		var relativePath = path.join(basedir, filename)
		if (isFile(fullPath)) {
			if (isImg(filename)) {
				imgs.push(relativePath)
			} else {
				docs.push(relativePath)
			}
		} else if (isDir(fullPath)) {
			dirs.push(relativePath)
		}

	})
	return {
		imgs: imgs,
		docs: docs,
		dirs: dirs
	}
}

function Route(req, res) {
	var urlObj = url.parse(req.url)
	this.path = decodeURI(urlObj.pathname)
	this.query = querystring(urlObj.query)
	this.method = req.method.toLowerCase()
	this.req = req
	this.res = res
}

Route.prototype = {
	getFullPath: function() {
		var fullPath = path.join(cwd, this.path)
		if (!isDir(fullPath) && !isExits(fullPath)) {
			fullPath = path.join(viewDir, this.path)
		}
		return fullPath
	},
	writeHead: function(head) {
		this.res.writeHead(200, {
			'Content-Type': head || readMime(this.path)
		})
		return this
	},
	write: function(content) {
		this.res.end(content)
	},
	readFile: function(pth) {
		var that = this
		readFile(this.path, function(err, data) {
			if (err) {
				return console.log('read ' + this.path + ' fail')
			}
			that.write(data)
		})
	},
	onQuery: function(callback) {
		var that = this

		if (this.method === 'post') {
			var post = ''
			this.req.on('data', function(chunk) {
				post += chunk
			}).on('end', function() {
				try {
					post = post.replace(methodName, '')
					that.query = JSON.parse(post)
				} catch (e) {
					that.query = null
				}
				callback(that.query)
			})
		} else {
			this.query.dir = this.query.dir.replace(methodName, '')
			callback(this.query)
		}
		return this
	},
	scanDir: function() {
		var that = this
		this.onQuery(function(query) {
			var dirInfo = scanDir(path.join(cwd, query.dir), query.dir)
			var imgs = dirInfo.imgs
			var docs = dirInfo.docs
			var dirs = dirInfo.dirs
			imgs.forEach(function(pth, index) {
				var basename = path.basename(pth)
				imgs[index] = {
					type: 'img',
					path: pth,
					name: basename,
					title: basename
				}
			})
			docs.forEach(function(pth, index) {
				var basename = path.basename(pth)
				docs[index] = {
					type: 'doc',
					path: docImg,
					name: '<a href="' + pth + '" target="_blank">' + path.basename(pth) + '</a>',
					title: basename
				}
			})
			dirs.forEach(function(pth, index) {
				var basename = path.basename(pth)
				dirs[index] = {
					type: 'dir',
					path: dirImg,
					name: basename,
					title: basename
				}
			})
			that.write(JSON.stringify({
				header: decodeURI(query.dir),
				files: dirs.concat(docs, imgs)
			}))
		})
		return this
	},
	checkType: function() {
		if (/favicon.ico/i.test(this.path)) {
			return
		}
		if (this.path === '/') {
			this.path = viewDir + 'index.html'
			return this.writeHead().readFile()
		}
		var oldPath = this.path
		var fullPath = this.path = this.getFullPath()
		if (isFile(fullPath)) {
			this
				.writeHead()
				.readFile()
		} else if (this.path.indexOf(methodName) !== -1) {
			this
				.writeHead('application/json')
				.scanDir()
		} else if (isDir(fullPath)) {
			this.query = {
				dir: oldPath
			}
			this.writeHead('application/json')
				.scanDir()
		}
		return this
	},
	init: function() {
		this.checkType()
	}
}

module.exports = Route