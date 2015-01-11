//main.js for album
$(function() {
	var album = {
		url: 'getFileFromCurrentDir',
		urlCache: {},
		loaded: true,
		initData: function() {
			this.curUrl = this.url
			this.loaded = false
			var that = this
			var ajaxSetting = {
				url: this.url,
				type: 'GET',
				data: {
					dir: '/'
				},
				success: function(data) {
					that.loaded = true
					that.header = data.header
					that.urlCache['getFileFromCurrentDir'] = data
					that
						.append()
						.refresh(data)
						.getImgs(data)
						.addDir()
						.addClick()
						.addKeyUp()
						.addDragAndDrop()
						.addCloseWindow()
						.addContextMemu()
				}
			}
			$.ajax(ajaxSetting)
			return this
		},
		refresh: function(data) {
			var newData = {
				header: data.header
			}
			var newFiles = newData.files = []
			var count = 0
			data.files.forEach(function(value, index) {
				newFiles[count] = newFiles[count] || {}
				newFiles[count].file = newFiles[count].file || []
				newFiles[count].file.push(value)
				count = (++count) % 4
			})
			this.dom.content.addClass('animate')
			this.dom.container.refresh(newData)
			return this
		},
		getImgs: function(data) {
			var imgs = this.imgs
			imgs.length = 0
			data.files.forEach(function(file) {
				if (file.type === 'img') {
					imgs.push(file.path)
				}
			})
			return this
		},
		addClick: function() {
			var that = this
			var imgs = this.imgs
			this.dom.container.on('click', 'img.img', function() {
				that.count = imgs.indexOf($(this).attr('src'))
				that.dom.popWindow.show()
				that.dom.imgArea.addClass('animated zoomIn')
				that.selectImgByIndex()
			}).on('click', '.dir', function() {
				that.dir.push($(this).data('dir'))
				that.update()
			})
			this.dom.nav.on('click', 'a', function() {
				that.dir = that.dir.slice(0, $(this).index() + 1)
				that.addDir().update()
			})
			return this
		},
		addDir: function() {
			this.dom.nav.refresh({
				dir: this.dir.map(function(value) {
					return value + '/'
				})
			})
			return this
		},
		update: function() {
			if (!this.loaded) {
				return this
			}
			var that = this
			var url = encodeURI(this.dir.join('/'))
			var data = this.urlCache[url]
			if (data) {
				return this.refresh(data).getImgs(data).addDir()
			}
			this.loaded = false
			$.ajax({
				url: url,
				type: 'GET',
				data: {
					dir: url
				},
				success: function(data) {
					if (typeof data === 'string') {
						data = $.parseJSON(data)
					}
					if (data.header) {
						that.header = data.header
					}
					that.urlCache[url] = data
					that
						.refresh(data)
						.getImgs(data)
						.addDir()
					that.loaded = true
				}
			})
			return this
		},
		addKeyUp: function() {
			var that = this
			this.dom.doc.on('keyup', function(e) {
				if (that.dom.popWindow.css('display') !== 'none') {
					e.preventDefault()
					switch (e.keyCode) {
						case 37:
						case 38:
							--that.count
							that.selectImgByIndex()
							break
						case 39:
						case 40:
						case 13:
							++that.count
							that.selectImgByIndex()
							break
					}
				}
			})
			return this
		},
		addDragAndDrop: function() {
			this.dom.imgArea.drafting()
			return this
		},
		addCloseWindow: function() {
			var that = this
			this.dom.popWindow.on('click', function(e) {
				var id = e.target.id
				if (id === 'popWindow' || id === 'closer') {
					that.dom.popWindow.hide()
					that.dom.imgArea.removeClass('animated zoomIn')
					that.dom.container.refresh({
						header: that.header
					})
					that.dom.body.css('overflow', 'auto')
				}
			})
			return this
		},
		addContextMemu: function() {
			var $contextmenu = $('#contextmenu')
			var that = this
			$contextmenu.on('click', '#next, #prev, #prevDir', function() {
				switch (this.id) {
					case 'next':
						that.count += 1
						that.selectImgByIndex()
						break
					case 'prev':
						that.count -= 1
						that.selectImgByIndex()
						break
					case 'prevDir':
						if (that.dir.length > 1) {
							$contextmenu.hide()
							that.dom.popWindow.fadeOut()
							that.dom.body.css('overflow', 'auto')
							that.dir.pop()
							that.update()
						}
						break
				}
			}).on('mouseleave', function() {
				$(this).hide()
			})
			this.dom.popWindow.on('contextmenu', function(e) {
				e.preventDefault()
				$contextmenu.css({
					top: e.pageY + that.dom.popWindow.scrollTop() - that.dom.popWindow.offset().top - 40,
					left: e.pageX - 50
				}).show()
			})
			return this
		},
		selectImgByIndex: function() {
			var len = this.imgs.length
			if (this.count >= len) {
				this.count %= len
			} else if (this.count < 0) {
				this.count += len
			}
			var src = this.imgs[this.count]
			this.dom.img.attr('src', src)
			this.dom.imgArea.css({
				left: 0,
				top: 0
			})
			this.dom.container.refresh({
				header: this.header + src.substr(src.lastIndexOf('/'))
			})
			this.dom.popWindow.scrollTop(0)
			this.dom.body.css('overflow', 'hidden')
			return this
		},
		append: function() {
			$('body').append($('#temp').html())
			$.extend(this, {
					dom: {
						popWindow: $('#popWindow'),
						container: $('#container'),
						content: $('#content'),
						imgArea: $('#img-area'),
						img: $('#img-area img'),
						nav: $('#nav'),
						doc: $(document),
						body: $(document.body)
					},
					imgs: [],
					count: 0,
					dir: [this.url]
				})
			//删除动画class名
			var content = this.dom.content[0]
			var animated = function() {
				$(this).removeClass('animate')
			}
			content.addEventListener('amimationEnd', animated, false)
			content.addEventListener('webkitAnimationEnd', animated, false)
			return this
		},
		init: function() {
			this.initData()
			return this
		}
	}

	album.init()

	window.album = album

})