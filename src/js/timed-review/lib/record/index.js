
var RecordRTC = require('recordrtc')

module.exports = Recorder

function Recorder(config) {
  this.recording = false
  this.canStart = true
  this.canStop = false

  this.onDone = config.onDone
  this.onUpdate = config.onUpdate
  this.onPreview = config.onPreview

  this.audioRecorder;
  this.videoRecorder;

  // Firefox can record both audio/video in single webm container
  // Don't need to create multiple instances of the RecordRTC for Firefox
  // You can even use below property to force recording only audio blob on chrome
  // var isRecordOnlyAudio = true;
  this.isRecordOnlyAudio = !!navigator.mozGetUserMedia;

}

Recorder.prototype = {
  onStarted: function (stream) {
    this.canStop = true
    this.mediaStream = stream;


    // it is second parameter of the RecordRTC
    var audioConfig = {};
    if (!this.isRecordOnlyAudio) {
      audioConfig.onAudioProcessStarted = function() {
        // invoke video recorder in this callback
        // to get maximum sync
        this.videoRecorder.startRecording();
      }.bind(this);
    }

    this.audioRecorder = RecordRTC(stream, audioConfig);

    if (!this.isRecordOnlyAudio) {
      // it is second parameter of the RecordRTC
      var videoConfig = {
        type: 'video'
      };
      this.videoRecorder = RecordRTC(stream, videoConfig);
    }

    this.audioRecorder.startRecording();

    // this.previewUrl = 
    this.onPreview(window.URL.createObjectURL(stream));
    // this.onUpdate()
  },
  start: function () {
    this.recording = true
    this.canStart = false
    this.canStop = false
    navigator.getUserMedia(
      {audio: true, video: true},
      this.onStarted.bind(this),
      function onError(error) {
        alert('fails!')
        this.canStop = false
        this.canStart = true
      }.bind(this)
    );
  },

  stop: function () {
    if (!this.canStop) return
    this.canStop = false

    if (this.isRecordOnlyAudio) {
      this.audioRecorder.stopRecording(onStopRecording);
    }

    if (!this.isRecordOnlyAudio) {
      this.audioRecorder.stopRecording(function() {
        this.videoRecorder.stopRecording(function() {
          this.onStopped();
        }.bind(this));
      }.bind(this));
    }

    this.onPreview(null)
  },

  onStopped: function () {
    this.recording = false

    this.audioRecorder.getDataURL(function(audioDataURL) {
      var audio = {
        blob: this.audioRecorder.getBlob(),
        dataURL: audioDataURL
      };

      // if record both wav and webm
      if (!this.isRecordOnlyAudio) {
        this.videoRecorder.getDataURL(function(videoDataURL) {
          var video = {
            blob: this.videoRecorder.getBlob(),
            dataURL: videoDataURL
          };

          this.mediaStream.stop()
          this.onDone(audio, video)
        }.bind(this));
      } else {
        this.mediaStream.stop()
        this.onDone(audio)
      }
    }.bind(this));

    this.onUpdate()
  },
}

