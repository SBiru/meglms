// uses the webkitspeech

module.exports = function (options) {
  var rec = new webkitSpeechRecognition()
  rec.interimResults = false // options.interim === false ? false : true
  rec.continuous = true
  rec.onstart = options.start
  rec.onerror = options.error && function (evt) {
    options.error(evt.error)
  }
  rec.onend = function () {
    clearTimeout(timeout)
    options.end.apply(this, arguments)
  }
  rec.onresult = options.result && function (evt) {
    if (typeof(evt.results) === 'undefined') {
      return;
    }
    options.result([].slice.call(evt.results), evt.resultIndex)
  }
  rec.start()
  if (options.timeout) {
    var timeout = setTimeout(function () {
      rec.stop()
      options.end()
    }, options.timeout)
  }
  return rec
}

