"use strict"

module.exports = function() {
	var queue = []
	return {
		throttle: function(fn) {
			var result = function() {
				return new Promise(function(resolve) {
					if (!result.pending) {
						queue.push(function() {
							result.callNow()
							resolve()
						})
						result.pending = true
					}
				})
			}
			result.callNow = function() {
				result.cancel()
				fn()
			}
			result.cancel = function() {
				// var index = queue.indexOf(result.callNow)
				// if (index >= 0) {
				// 	queue.splice(index, 1)
				// }
				result.pending = false
			}
			return result
		},
		fire: function() {
			var tasks = queue
			queue = []
			tasks.forEach(function(fn) {fn()})
		},
		queueLength: function(){
			return queue.length
		}
	}
}
