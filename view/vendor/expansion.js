;
(function($, window, undefined) {
	var $doc = $(document)

	$.fn.drafting = function(onStart, onEnd, onMove) {
		var $this = this
		$this.on('mousedown', function(e) {
			e.preventDefault()
			var offset = $(this).position()
			var origin = {
				left: e.pageX,
				top: e.pageY
			}
			var position
			if (typeof onStart === 'function') {
				onStart.call($this, offset, origin)
			}
			$doc.on({
				'mousemove.drag': function(e) {
					position = {
						left: offset.left + e.pageX - origin.left,
						top: offset.top + e.pageY - origin.top
					}
					$this.css(position)
					if (typeof onMove === 'function') {
						onMove.call($this, position, origin)
					}
				},
				'mouseup.drop': function(e) {
					if (typeof onEnd === 'function') {
						onEnd.call($this, position, origin)
					}
					$doc.off('mouseup.drop').off('mousemove.drag')
				}
			})
		})
		return this
	}
})(jQuery, this);
