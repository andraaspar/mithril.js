"use strict"

var coreRenderer = require("../render/render")

function throttle(callback) {
	//60fps translates to 16.6ms, round it down since setTimeout requires int
	var delay = 16
	var last = 0
	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
	var cancel = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : clearTimeout
	var result = function() {
		return new Promise(function(resolve) {
			var elapsed = Date.now() - last
			if (result.pending == null) {
				result.pending = timeout(function() {
					result.callNow()
					resolve()
				}, delay - elapsed)
			}
		})
	}
	result.callNow = function() {
		result.cancel()
		callback()
		last = Date.now()
	}
	result.cancel = function() {
		cancel(result.pending)
		result.pending = null
	}
	return result
}


module.exports = function($window, throttleMock) {
	var renderService = coreRenderer($window)
	renderService.setEventCallback(function(e) {
		if (e.redraw === false) e.redraw = undefined
		else redraw()
	})

	var callbacks = []
	var rendering = false
	var renderQueue = []
	
	function subscribe(key, callback) {
		unsubscribe(key)
		callbacks.push(key, callback)
	}
	function unsubscribe(key) {
		var index = callbacks.indexOf(key)
		if (index > -1) callbacks.splice(index, 2)
	}
	function sync() {
		for (var i = 1; i < callbacks.length; i+=2) try {callbacks[i]()} catch (e) {/*noop*/}
	}
	var throttledSync = (throttleMock || throttle)(sync)
	var lastPromise
	
	function redraw() {
		if (throttledSync.pending) {
			return lastPromise
		} else if (rendering) {
			return new Promise(function(resolve) {
				renderQueue.push(function() {
					throttledSync.callNow()
					resolve()
				})
			})
		} else {
			return lastPromise = throttledSync()
		}
	}
	function render() {
		rendering = true
		renderService.render.apply(renderService, arguments)
		while (renderQueue.length) {
			renderQueue.shift()()
		}
		rendering = false
	}
	redraw.sync = sync
	return {subscribe: subscribe, unsubscribe: unsubscribe, redraw: redraw, render: render}
}
