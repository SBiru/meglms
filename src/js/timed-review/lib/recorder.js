var RecordRTC = require('recordrtc')

module.exports = function (stream, onStarted) {
  var isRecordOnlyAudio = !!navigator.mozGetUserMedia;

  var audioConfig = {};
  audioConfig.onAudioProcessStarted = function() {
    console.log('started')
    // invoke video recorder in this callback
    // to get maximum sync
    if (!isRecordOnlyAudio) {
      videoRecorder.startRecording();
    }
    onStarted()
  }

  var audioRecorder = RecordRTC(stream, audioConfig)
    , videoRecorder

  if (!isRecordOnlyAudio) {
    // it is second parameter of the RecordRTC
    var videoConfig = {
      type: 'video'
    };
    videoRecorder = RecordRTC(stream, videoConfig);
  }

  audioRecorder.startRecording();

  function onStopped(done) {
    audioRecorder.getDataURL(function(audioDataURL) {
      var audio = {
        blob: audioRecorder.getBlob(),
        dataURL: audioDataURL
      };

      // if record both wav and webm
      if (!isRecordOnlyAudio) {
        videoRecorder.getDataURL(function(videoDataURL) {
          var video = {
            blob: videoRecorder.getBlob(),
            dataURL: videoDataURL
          };

          done(audio, video)
        })
      } else {
        done(audio)
      }
    })
  }

  return function stop(done) {
    if (isRecordOnlyAudio) {
      audioRecorder.stopRecording(onStopped.bind(null, done));
    } else {
      audioRecorder.stopRecording(function() {
        videoRecorder.stopRecording(function() {
          onStopped(done)
        })
      })
    }
  }
}

