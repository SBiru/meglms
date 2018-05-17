
var MediaStreamRecorder = require('RecordRTC/MediaStreamRecorder')
var WhammyRecorder = require('RecordRTC/WhammyRecorder')
var StereoRecorder = require('RecordRTC/StereoRecorder')
var async = require('async')

var isChrome = !navigator.mozGetUserMedia;

// TODO have a timeout here (a second or so), so if the Recorder instance
// doesn't start up, we can show a helpful error message.

module.exports = isChrome ? recordChrome : recordMoz

function recordChrome(stream, onStarted) {
  var stereo = new StereoRecorder(stream)
  var whammy = new WhammyRecorder(stream)
  stereo.record()
  stereo.onAudioProcessStarted = function () {
    whammy.record()
    onStarted()
  }
  return function stop(done) {
    async.parallel({
      video: function (next) {whammy.stop(function () {next(null, whammy.blob)})},
      audio: function (next) {stereo.stop(function () {next(null, stereo.blob)})},
    }, function (err, blobs) {
      done(null, blobs)
    })
  }
}

function recordMoz(stream, onStarted) {
  var recorder = new MediaStreamRecorder(stream)
  recorder.record()
  stereo.onAudioProcessStarted = function () {
    onStarted()
  }
  return function stop(done) {
    recorder.stop(function () {
      done(null, recorder.blob)
    })
  }
}
