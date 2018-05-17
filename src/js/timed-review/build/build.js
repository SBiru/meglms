(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){

var Conversation = require('../lib/conversation')

module.exports = function ($state, $scope, $sce, conversation) {
  // initializing the state
  if (!conversation) {
    return $state.transitionTo('conversations.list');
  }
  $scope.game = new Conversation(conversation, update)

  $scope.$on('$destroy', function () {
    $scope.game.end();
  })

  function update() {
    if (!$scope.$$phase) {
      try {
        $scope.$digest()
      } catch (e) {}
    }
  }

  if (localStorage.DEBUG_CONVERSE) {
    $scope.game.start()
  }
}


},{"../lib/conversation":6}],3:[function(require,module,exports){

module.exports = function ($scope, conversations) {
  $scope.conversations = conversations
}


},{}],4:[function(require,module,exports){
module.exports=[
  {
    "dialog": [
      {
        "prompt": "Hello, what is your name?", 
        "answer_audio": "myname.wav", 
        "answer_duration": 2.375, 
        "answers": [
          "My name is Stephen."
        ], 
        "prompt_audio": "what-name.wav", 
        "prompt_duration": 2.625
      }, 
      {
        "prompt": "How old are you?", 
        "answer_audio": "myage.wav", 
        "answer_duration": 3.625, 
        "answers": [
          "I am 17 years old."
        ], 
        "prompt_audio": "how-old.wav", 
        "prompt_duration": 1.75
      }, 
      {
        "prompt": "How many brothers and sisters do you have?", 
        "answer_audio": "mysiblings.wav", 
        "answer_duration": 3.5, 
        "answers": [
          "I have 2 brothers and 1 sister."
        ], 
        "prompt_audio": "how-siblings.wav", 
        "prompt_duration": 3.5
      }, 
      {
        "prompt": "Who do you work for?", 
        "answer_audio": "myemployer.wav", 
        "answer_duration": 2.875, 
        "answers": [
          "I work for a school."
        ], 
        "prompt_audio": "who-employer.wav", 
        "prompt_duration": 2.0
      }, 
      {
        "prompt": "What do you do in your job?", 
        "answer_audio": "myjob.wav", 
        "answer_duration": 4.125, 
        "answers": [
          "I teach math to third grade students."
        ], 
        "prompt_audio": "what-job.wav", 
        "prompt_duration": 2.125
      }
    ], 
    "title": "First Conversation"
  }
]
},{}],5:[function(require,module,exports){

var SimpleDirective = require('./lib/simple-directive')
  , Conversation = require('./lib/conversation')
  , DialogItem = require('./lib/dialog-item')

function iPromised($q, data) {
  var p = $q.defer()
  p.resolve(data)
  return p.promise
}

var app = angular.module('converse', ['ui.router'])
  // TODO make this talk to a backend endpoint
  .service('getConversations', function ($q) {
    return function () {
      return iPromised($q, require('./data/conversations.json'))
    }
  })
  .service('getConversation', function ($q) {
    return function (id) {
      return iPromised($q, require('./data/conversations.json')[id])
    }
  })

  .directive('record', require('./lib/record/directive'))
  .directive('timer', require('./lib/timer'))

  .directive('dialogItem', function dialogItem() {
    return {
      scope: {pastItems: '=', data: '=', onDone: '=', stream: '=', time: '='},
      templateUrl: 'views/dialog-item.html',
      controller: function ($scope, $element, $sce) {
        $scope.dialog = new DialogItem($scope.data, $scope.stream, $scope.time, $scope.$digest.bind($scope));
        $scope.$watch('data', function (data) {
          $scope.dialog = new DialogItem(data, $scope.stream, $scope.time, $scope.$digest.bind($scope));
        })
        $scope.$watch('stream', function (stream) {
          $scope.dialog.stream = stream
          $scope.previewUrl = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream))
        })
        $scope.$watch('dialog.state', function (state) {
          if (state === 'started') {
            $element.find('video')[0].play()
          } else {
            $element.find('video')[0].pause()
          }
        })
        $element.find('video')[0].muted = true
        $scope.$on('$destroy', function () {
          $scope.dialog.stop()
        })
      },
    }
  })

  .config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/conversations/list');

    // Now set up the states
    $stateProvider
      .state('conversations', {
        url: "/conversations",
        templateUrl: "views/conversations.html",
        controller: function () {
          console.log('promising');
        },
      })
      .state('conversations.list', {
        url: "/list",
        templateUrl: "views/conversations.list.html",
        controller: require('./controllers/list-conversations'),
        resolve: {
          conversations: function (getConversations) {
            return getConversations()
          },
        },
      })
      .state('conversations.play', {
        url: '/:id',
        templateUrl: 'views/conversation.html',
        controller: require('./controllers/conversation'),
        resolve: {
          conversation: function (getConversation, $stateParams) {
            return getConversation($stateParams.id)
          },
        },
      })
    });


},{"./controllers/conversation":2,"./controllers/list-conversations":3,"./data/conversations.json":4,"./lib/conversation":6,"./lib/dialog-item":7,"./lib/record/directive":9,"./lib/simple-directive":12,"./lib/timer":14}],6:[function(require,module,exports){

var DialogItem = require('./dialog-item')

var FAST_LIMIT = 1
var MED_LIMIT = 1.5
var SLOW_LIMIT = 2

module.exports = Conversation

function Conversation(data, onUpdated) {
  this.title = data.title
  this.dialog = data.dialog
  this.state = 'unstarted'
  this.index = 0
  this.length = this.dialog.length
  this.onUpdated = onUpdated
  // this.dialogs = data.dialog.map(function (data) {return new DialogItem(data)})
  this.score = 0;
  this.next = this.next.bind(this)
}

Conversation.prototype = {
  start: function (speed) {
    this.state = 'starting'
    this.speed = speed

    navigator.getUserMedia(
      {audio: true, video: true},
      this.onStarted.bind(this),
      function onError(error) {
        alert('fails!')
        this.state = 'error'
        this.error = error
        this.onUpdated()
      }.bind(this)
    );
  },

  getTimeLimit: function() {
    if (!this.speed) return null
    if (this.speed === 'fast') return FAST_LIMIT
    if (this.speed === 'medium') return MED_LIMIT
    return SLOW_LIMIT
  },

  onStarted: function (stream) {
    this.mediaStream = stream
    this.state = 'running'
    this.index = 0
    this.score = 0;
    this.onUpdated()
  },

  getCurrentDialog: function () {
    return this.dialog[this.index]
  },

  next: function () {
    this.score += 1;
    if (this.index < this.length - 1) {
      this.index += 1;
    } else {
      this.end();
    }
    try {
      this.onUpdated()
    } catch (e) {}
  },

  end: function () {
    if (this.state === 'finished') return
    this.state = 'finished'
    this.mediaStream.stop()
  }
}

},{"./dialog-item":7}],7:[function(require,module,exports){

var startSpeech = require('./speech')
  , recorder = require('./recnew')

module.exports = DialogItem

function DialogItem(data, stream, time, onUpdate) {
  this.data = data
  this.stream = stream
  this.finalWords = []
  this.interimWords = []
  this.onUpdate = onUpdate
  this.state = 'prompt'
  // this.start()
  this.onStart = function () {
    this.start()
    this.onUpdate()
  }.bind(this)
  this.start = this.start.bind(this)
  this.stop = this.stop.bind(this)
  this.promptAudio = 'data/audio/' + data.prompt_audio
  this.promptTime = data.prompt_duration
  this.answerAudio = 'data/audio/' + data.answer_audio
  if (time) {
    this.isTimed = true
    this.timeLimit = data.answer_duration * time
  }
}

DialogItem.prototype = {
  start: function () {
    // this.startRecognizing()
    this.state = 'starting'
    this.startRecording()
  },

  stop: function () {
    if (this.state !== 'started') return
    this.state = 'processing'
    try {
      this.onUpdate()
    } catch (e) {}
    // this.rec.stop()
    this.stopRecording(this.doneRecording.bind(this))
  },

  doneRecording: function (audio, video) {
    this.validate()
    this.onUpdate()
  },

  startRecording: function () {
    this.stopRecording = recorder(this.stream, function () {
      console.log('started')
      this.state = 'started'
      this.onUpdate()
    }.bind(this))
  },

  startRecognizing: function () {
    this.rec = startSpeech({
      start: function () {
        this.state = 'started'
        this.finalWords = []
        this.interimWords = []
        this.onUpdate()
      }.bind(this),
      error: function (error) {
        this.state = 'error'
        this.error = error
        this.onUpdate()
      }.bind(this),
      result: function (results, index) {
        this.interimWords = []
        for (var i=index; i<results.length; ++i) {
          if (results[i].isFinal) {
            this.finalWords.push(results[i][0].transcript)
          } else {
            this.interimWords.push(results[i][0].transcript)
          }
        }
        this.onUpdate()
      }.bind(this),
      end: function () {
        // TODO make this better - is there some infos to send back?
        // this.validate()
        // this.onUpdate()
      }.bind(this),
    })
  },

  validate: function () {
    console.log('done')
    this.state = 'done-valid'
  }
}


},{"./recnew":8,"./speech":13}],8:[function(require,module,exports){

var MediaStreamRecorder = require('RecordRTC/dev/MediaStreamRecorder')
var WhammyRecorder = require('RecordRTC/dev/WhammyRecorder')
var StereoRecorder = require('RecordRTC/dev/StereoRecorder')
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

},{"RecordRTC/dev/MediaStreamRecorder":15,"RecordRTC/dev/StereoRecorder":17,"RecordRTC/dev/WhammyRecorder":19,"async":21}],9:[function(require,module,exports){

var Recorder = require('./')

module.exports = function recordDirective() {
  return {
    scope: {
      onDone: '=',
      autostart: '=',
    },
    template: require('./index.html'),
    controller: function ($scope, $element, $sce) {
      $scope.previewUrl = null;
      $scope.recorder = new Recorder({
        onDone: $scope.onDone || function () {
        },
        onUpdate: $scope.$digest.bind($scope),
        onPreview: function (url) {
          if (!url) {
            $scope.previewUrl = null;
          } else {
            $scope.previewUrl = $sce.trustAsResourceUrl(url);
          }
          // var video = $element.children('video')[0]
          // video.src = url;
          // video.play()
          if (!$scope.$$phase) {
            try {
              $scope.$digest()
            } catch(e) {}
          }
          // videoElement.play();
          // videoElement.muted = true;
          // videoElement.controls = false;
        }
      });

      if ($scope.autostart) {
        $scope.recorder.start()
      }
    },
      /*
      $scope.$watch('data', function (data) {
        $scope.dialog = new DialogItem(data, $scope.$digest.bind($scope));
      })
      */
  }
}



},{"./":11,"./index.html":10}],10:[function(require,module,exports){
module.exports = '<!-- todo make this a switch? -->\n<button ng-click="recorder.start()" ng-disabled="!recorder.canStart">Start Recording</button>\n<button ng-click="recorder.stop()" ng-disabled="!recorder.canStop">Stop Recording</button>\n<video ng-src="{{previewUrl}}" muted="true" ng-show="!!previewUrl" autoplay></video>\n\n\n';
},{}],11:[function(require,module,exports){

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


},{"recordrtc":22}],12:[function(require,module,exports){

module.exports = function (controller, template) {
  return ['$compile', function SimpleDirective($compile) {
    return {
      scope: {},
      template: template,
      controller: controller,
    }
  }]
}


},{}],13:[function(require,module,exports){
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


},{}],14:[function(require,module,exports){

function pie(x, y, t1, r) {
	var vals = {
    x1: Math.cos(0) * r + x,
    y1: Math.sin(0) * r + y,
    x2: Math.cos(t1) * r + x,
    y2: Math.sin(t1) * r + y,
    flag: t1 < Math.PI ? 0 : 1,
    r: r,
  }
  return 'M${x1} ${y1} A ${r} ${r}, 0, ${flag}, 1, ${x2} ${y2}'.replace(/\${([^}]+)}/g, function (full, name) {return vals[name]})
}

module.exports = function timerDirective() {
  return {
    scope: {
      onDone: '=',
      time: '='
    },

    template: '<div class="Timer">' +
      '<svg width=100 height=100>' +
        '<circle cx="50" cy="50" r="40"/>' +
        '<path ng-attr-d="{{path}}"/>'+
      '</svg>' +
    '</div>',
    controller: function ($scope) {
      $scope.start = Date.now()
      $scope.left = $scope.time
      function makePie() {
        return pie(50, 50, (Date.now() - $scope.start) / 1000 / $scope.time * Math.PI * 2, 40)
      }
      $scope.path = makePie()
      var tout = setInterval(function () {
        $scope.left = $scope.time - (Date.now() - $scope.start) / 1000
        if ($scope.left <= 0) {
          $scope.left = 0
          clearInterval(tout)
          $scope.onDone()
        } else {
          $scope.path = makePie()
        }
        $scope.$digest()
      }, 20);

      $scope.$on('$destroy', function () {
        clearInterval(tout)
      })
    },
  }
}


},{}],15:[function(require,module,exports){
// ______________________
// MediaStreamRecorder.js

// todo: need to show alert boxes for incompatible cases
// encoder only supports 48k/16k mono audio channel

/*
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

/**
 * MediaStreamRecorder is an abstraction layer for "MediaRecorder API". It is used by {@link RecordRTC} to record MediaStream(s) in Firefox.
 * @summary Runs top over MediaRecorder API.
 * @typedef MediaStreamRecorder
 * @class
 * @example
 * var recorder = new MediaStreamRecorder(MediaStream);
 * recorder.mimeType = 'video/webm'; // audio/ogg or video/webm
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 *
 *     // or
 *     var blob = recorder.blob;
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

module.exports = MediaStreamRecorder

function MediaStreamRecorder(mediaStream) {
    var self = this;

    // if user chosen only audio option; and he tried to pass MediaStream with
    // both audio and video tracks;
    // using a dirty workaround to generate audio-only stream so that we can get audio/ogg output.
    if (self.mimeType && self.mimeType !== 'video/webm' && mediaStream.getVideoTracks && mediaStream.getVideoTracks().length) {
        var context = new AudioContext();
        var mediaStreamSource = context.createMediaStreamSource(mediaStream);

        var destination = context.createMediaStreamDestination();
        mediaStreamSource.connect(destination);

        mediaStream = destination.stream;
    }

    var dataAvailable = false;

    /**
     * This method records MediaStream.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp
        // https://wiki.mozilla.org/Gecko:MediaRecorder
        // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html

        // starting a recording session; which will initiate "Reading Thread"
        // "Reading Thread" are used to prevent main-thread blocking scenarios
        mediaRecorder = new window.MediaRecorder(mediaStream);

        // Dispatching OnDataAvailable Handler
        mediaRecorder.ondataavailable = function(e) {
            if (dataAvailable) {
                return;
            }

            if (!e.data.size) {
                if (!self.disableLogs) {
                    console.warn('Recording of', e.data.type, 'failed.');
                }
                return;
            }

            dataAvailable = true;

            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof MediaStreamRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            self.blob = new Blob([e.data], {
                type: e.data.type || self.mimeType || 'audio/ogg'
            });

            if (self.callback) {
                self.callback();
            }
        };

        mediaRecorder.onerror = function(error) {
            if (!self.disableLogs) {
                console.warn(error);
            }

            // When the stream is "ended" set recording to 'inactive' 
            // and stop gathering data. Callers should not rely on 
            // exactness of the timeSlice value, especially 
            // if the timeSlice value is small. Callers should 
            // consider timeSlice as a minimum value

            mediaRecorder.stop();
            self.record(0);
        };

        // void start(optional long mTimeSlice)
        // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
        // handler. "mTimeSlice < 0" means Session object does not push encoded data to
        // onDataAvailable, instead, it passive wait the client side pull encoded data
        // by calling requestData API.
        mediaRecorder.start(0);

        // Start recording. If timeSlice has been provided, mediaRecorder will
        // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
        // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.

        if (self.onAudioProcessStarted) {
            self.onAudioProcessStarted();
        }
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }

        this.callback = callback;
        // mediaRecorder.state === 'recording' means that media recorder is associated with "session"
        // mediaRecorder.state === 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

        if (mediaRecorder.state === 'recording') {
            // "stop" method auto invokes "requestData"!
            // mediaRecorder.requestData();
            mediaRecorder.stop();
        }
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();

            if (!this.disableLogs) {
                console.debug('Paused recording.');
            }
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();

            if (!this.disableLogs) {
                console.debug('Resumed recording.');
            }
        }
    };

    // Reference to "MediaRecorder" object
    var mediaRecorder;
}

},{}],16:[function(require,module,exports){
// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js
// https://github.com/mattdiamond/Recorderjs#license-mit
// ______________________
// StereoAudioRecorder.js

/**
 * StereoAudioRecorder is a standalone class used by {@link RecordRTC} to bring "stereo" audio-recording in chrome.
 * @summary JavaScript standalone object for stereo audio recording.
 * @typedef StereoAudioRecorder
 * @class
 * @example
 * var recorder = new StereoAudioRecorder(MediaStream, {
 *     sampleRate: 44100,
 *     bufferSize: 4096
 * });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {sampleRate: 44100, bufferSize: 4096}
 */

var AudioContextConstructor = null;
var AudioContext = window.AudioContext || window.webkitAudioContext;

module.exports = StereoAudioRecorder

var __stereoAudioRecorderJavacriptNode;

function StereoAudioRecorder(mediaStream, config) {
    if (!mediaStream.getAudioTracks().length) {
        throw 'Your stream has no audio tracks.';
    }

    var self = this;

    // variables
    var leftchannel = [];
    var rightchannel = [];
    var recording = false;
    var recordingLength = 0;

    if (!AudioContextConstructor) {
        AudioContextConstructor = new AudioContext();
    }

    var context = AudioContextConstructor;

    // creates an audio node from the microphone incoming stream
    var audioInput = context.createMediaStreamSource(mediaStream);

    var legalBufferValues = [0, 256, 512, 1024, 2048, 4096, 8192, 16384];

    /**
     * The sample rate (in sample-frames per second) at which the
     * AudioContext handles audio. It is assumed that all AudioNodes
     * in the context run at this rate. In making this assumption,
     * sample-rate converters or "varispeed" processors are not supported
     * in real-time processing.
     * The sampleRate parameter describes the sample-rate of the
     * linear PCM audio data in the buffer in sample-frames per second.
     * An implementation must support sample-rates in at least
     * the range 22050 to 96000.
     * @property {number} sampleRate - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     sampleRate: 44100
     * });
     */
    var sampleRate = typeof config.sampleRate !== 'undefined' ? config.sampleRate : context.sampleRate || 44100;

    if (sampleRate < 22050 || sampleRate > 96000) {
        // Ref: http://stackoverflow.com/a/26303918/552182
        if (!config.disableLogs) {
            console.warn('sample-rate must be under range 22050 and 96000.');
        }
    }

    if (context.createScriptProcessor) {
        __stereoAudioRecorderJavacriptNode = context.createScriptProcessor(bufferSize, 2, 2);
    } else if (context.createJavaScriptNode) {
        __stereoAudioRecorderJavacriptNode = context.createJavaScriptNode(bufferSize, 2, 2);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    window.audioProcess = __stereoAudioRecorderJavacriptNode

    // connect the stream to the gain node
    audioInput.connect(__stereoAudioRecorderJavacriptNode);

    bufferSize = __stereoAudioRecorderJavacriptNode.bufferSize;

    if (!config.disableLogs) {
        console.log('sample-rate', sampleRate);
        console.log('buffer-size', bufferSize);
    }

    /**
     * From the spec: This value controls how frequently the audioprocess event is
     * dispatched and how many sample-frames need to be processed each call.
     * Lower values for buffer size will result in a lower (better) latency.
     * Higher values will be necessary to avoid audio breakup and glitches
     * The size of the buffer (in sample-frames) which needs to
     * be processed each time onprocessaudio is called.
     * Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
     * @property {number} bufferSize - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     bufferSize: 4096
     * });
     */

    // "0" means, let chrome decide the most accurate buffer-size for current platform.
    var bufferSize = typeof config.bufferSize === 'undefined' ? 4096 : config.bufferSize;

    if (legalBufferValues.indexOf(bufferSize) === -1) {
        if (!config.disableLogs) {
            console.warn('Legal values for buffer-size are ' + JSON.stringify(legalBufferValues, null, '\t'));
        }
    }


    /**
     * This method records MediaStream.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;

        recording = true;
    };


    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        // stop recording
        recording = false;

        // to make sure onaudioprocess stops firing
        audioInput.disconnect();

        mergeLeftRightBuffers({
            sampleRate: sampleRate,
            leftChannel: config.leftChannel,
            leftBuffers: [leftchannel, recordingLength],
            rightBuffers: [rightchannel, recordingLength]
        }, function(buffer, view) {
            /**
             * @property {Blob} blob - The recorded blob object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var blob = recorder.blob;
             * });
             */
            self.blob = new Blob([view], {
                type: 'audio/wav'
            });

            /**
             * @property {ArrayBuffer} buffer - The recorded buffer object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var buffer = recorder.buffer;
             * });
             */
            self.buffer = new ArrayBuffer(view);

            /**
             * @property {DataView} view - The recorded data-view object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var view = recorder.view;
             * });
             */
            self.view = view;

            self.sampleRate = sampleRate;
            self.bufferSize = bufferSize;

            // recorded audio length
            self.length = recordingLength;

            if (callback) {
                callback();
            }

            isAudioProcessStarted = false;
        });
    };

    var isPaused = false;
    /**
     * This method pauses the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPaused = true;

        if (!config.disableLogs) {
            console.debug('Paused recording.');
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPaused = false;

        if (!config.disableLogs) {
            console.debug('Resumed recording.');
        }
    };

    var isAudioProcessStarted = false;

    __stereoAudioRecorderJavacriptNode.addEventListener('audioprocess', function(e) {
        if (isPaused) {
            return;
        }

        // if MediaStream().stop() or MediaStreamTrack.stop() is invoked.
        if (mediaStream.ended) {
            __stereoAudioRecorderJavacriptNode.onaudioprocess = function() {};
            return;
        }

        if (!recording) {
            audioInput.disconnect();
            return;
        }

        /**
         * This method is called on "onaudioprocess" event's first invocation.
         * @method {function} onAudioProcessStarted
         * @memberof StereoAudioRecorder
         * @example
         * recorder.onAudioProcessStarted: function() { };
         */
        if (!isAudioProcessStarted) {
            isAudioProcessStarted = true;
            if (self.onAudioProcessStarted) {
                self.onAudioProcessStarted();
            }
        }

        var left = e.inputBuffer.getChannelData(0);
        var right = e.inputBuffer.getChannelData(1);

        // we clone the samples
        leftchannel.push(new Float32Array(left));
        rightchannel.push(new Float32Array(right));

        recordingLength += bufferSize;
    });

    // to prevent self audio to be connected with speakers
    __stereoAudioRecorderJavacriptNode.connect(context.destination);
}

function mergeLeftRightBuffers(config, callback) {
    function mergeAudioBuffers(config) {
        var leftBuffers = config.leftBuffers;
        var rightBuffers = config.rightBuffers;
        var sampleRate = config.sampleRate;

        leftBuffers = mergeBuffers(leftBuffers[0], leftBuffers[1]);
        rightBuffers = mergeBuffers(rightBuffers[0], rightBuffers[1]);

        function mergeBuffers(channelBuffer, rLength) {
            var result = new Float64Array(rLength);
            var offset = 0;
            var lng = channelBuffer.length;

            for (var i = 0; i < lng; i++) {
                var buffer = channelBuffer[i];
                result.set(buffer, offset);
                offset += buffer.length;
            }

            return result;
        }

        function interleave(leftChannel, rightChannel) {
            var length = leftChannel.length + rightChannel.length;

            var result = new Float64Array(length);

            var inputIndex = 0;

            for (var index = 0; index < length;) {
                result[index++] = leftChannel[inputIndex];
                result[index++] = rightChannel[inputIndex];
                inputIndex++;
            }
            return result;
        }

        function writeUTFBytes(view, offset, string) {
            var lng = string.length;
            for (var i = 0; i < lng; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }

        // interleave both channels together
        var interleaved = interleave(leftBuffers, rightBuffers);

        var interleavedLength = interleaved.length;

        // create wav file
        var resultingBufferLength = 44 + interleavedLength * 2;

        var buffer = new ArrayBuffer(resultingBufferLength);

        var view = new DataView(buffer);

        // RIFF chunk descriptor/identifier 
        writeUTFBytes(view, 0, 'RIFF');

        // RIFF chunk length
        var blockAlign = 4;
        view.setUint32(blockAlign, 44 + interleavedLength * 2, true);

        // RIFF type 
        writeUTFBytes(view, 8, 'WAVE');

        // format chunk identifier 
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');

        // format chunk length 
        view.setUint32(16, 16, true);

        // sample format (raw)
        view.setUint16(20, 1, true);

        // stereo (2 channels)
        view.setUint16(22, 2, true);

        // sample rate 
        view.setUint32(24, sampleRate, true);

        // byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * blockAlign, true);

        // block align (channel count * bytes per sample) 
        view.setUint16(32, blockAlign, true);

        // bits per sample 
        view.setUint16(34, 16, true);

        // data sub-chunk
        // data chunk identifier 
        writeUTFBytes(view, 36, 'data');

        // data chunk length 
        view.setUint32(40, interleavedLength * 2, true);

        // write the PCM samples
        var offset = 44,
            leftChannel;
        for (var i = 0; i < interleavedLength; i++, offset += 2) {
            var size = Math.max(-1, Math.min(1, interleaved[i]));
            var currentChannel = size < 0 ? size * 32768 : size * 32767;

            if (config.leftChannel) {
                if (currentChannel !== leftChannel) {
                    view.setInt16(offset, currentChannel, true);
                }
                leftChannel = currentChannel;
            } else {
                view.setInt16(offset, currentChannel, true);
            }
        }

        postMessage({
            buffer: buffer,
            view: view
        });
    }
    var webWorker = processInWebWorker(mergeAudioBuffers);

    webWorker.onmessage = function(event) {
        callback(event.data.buffer, event.data.view);
    };

    webWorker.postMessage(config);
}

function processInWebWorker(_function) {
    var blob = URL.createObjectURL(new Blob([_function.toString(),
        'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
    ], {
        type: 'application/javascript'
    }));

    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}


},{}],17:[function(require,module,exports){
// _________________
// StereoRecorder.js

/**
 * StereoRecorder is a standalone class used by {@link RecordRTC} to bring audio-recording in chrome. It runs top over {@link StereoAudioRecorder}.
 * @summary JavaScript standalone object for stereo audio recording.
 * @typedef StereoRecorder
 * @class
 * @example
 * var recorder = new StereoRecorder(MediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

var StereoAudioRecorder = require('./StereoAudioRecorder')

module.exports = StereoRecorder

function StereoRecorder(mediaStream) {
    var self = this;

    // Reference to "StereoAudioRecorder" object
    var mediaRecorder;

    /**
     * This method records MediaStream.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        mediaRecorder = new StereoAudioRecorder(mediaStream, this);
        mediaRecorder.onAudioProcessStarted = function() {
            if (self.onAudioProcessStarted) {
                self.onAudioProcessStarted();
            }
        };
        mediaRecorder.record();
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.stop(function() {
            for (var item in mediaRecorder) {
                self[item] = mediaRecorder[item];
            }

            if (callback) {
                callback();
            }
        });
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.pause();
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.resume();
    };
}

},{"./StereoAudioRecorder":16}],18:[function(require,module,exports){
// https://github.com/antimatter15/whammy/blob/master/LICENSE
// _________
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

/**
 * Whammy is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It is written by {@link https://github.com/antimatter15|antimatter15}
 * @summary A real time javascript webm encoder based on a canvas hack.
 * @typedef Whammy
 * @class
 * @example
 * var recorder = new Whammy().Video(15);
 * recorder.add(context || canvas || dataURL);
 * var output = recorder.compile();
 */

// a more abstract-ish API

var whammyInWebWorker = require('./whammy_worker');

module.exports = {
    /**
      * A more abstract-ish API.
      * @method
      * @memberof Whammy
      * @example
      * recorder = new Whammy().Video(0.8, 100);
      * @param {?number} speed - 0.8
      * @param {?number} quality - 100
      */
    Video: WhammyVideo
};

function WhammyVideo(duration) {
    this.frames = [];
    this.duration = duration || 1;
    this.quality = 100;
}

/**
  * Pass Canvas or Context or image/webp(string) to {@link Whammy} encoder.
  * @method
  * @memberof Whammy
  * @example
  * recorder = new Whammy().Video(0.8, 100);
  * recorder.add(canvas || context || 'image/webp');
  * @param {string} frame - Canvas || Context || image/webp
  * @param {number} duration - Stick a duration (in milliseconds)
  */
WhammyVideo.prototype.add = function(frame, duration) {
    if ('canvas' in frame) { //CanvasRenderingContext2D
        frame = frame.canvas;
    }

    if ('toDataURL' in frame) {
        frame = frame.toDataURL('image/webp', this.quality);
    }

    if (!(/^data:image\/webp;base64,/ig).test(frame)) {
        throw 'Input must be formatted properly as a base64 encoded DataURI of type image/webp';
    }
    this.frames.push({
        image: frame,
        duration: duration || this.duration
    });
};

function processInWebWorker(_function) {
    var blob = URL.createObjectURL(new Blob([_function.toString(),
        'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
    ], {
        type: 'application/javascript'
    }));

    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}

/**
  * Encodes frames in WebM container. It uses WebWorkinvoke to invoke 'ArrayToWebM' method.
  * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
  * @method
  * @memberof Whammy
  * @example
  * recorder = new Whammy().Video(0.8, 100);
  * recorder.compile(function(blob) {
  *    // blob.size - blob.type
  * });
  */
WhammyVideo.prototype.compile = function(callback) {
    var webWorker = processInWebWorker(whammyInWebWorker);

    webWorker.onmessage = function(event) {
        if (event.data.error) {
            console.error(event.data.error);
            return;
        }
        callback(event.data);
    };

    webWorker.postMessage(this.frames);
};

},{"./whammy_worker":20}],19:[function(require,module,exports){
// _________________
// WhammyRecorder.js

/**
 * WhammyRecorder is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It runs top over {@link Whammy}.
 * @summary Video recording feature in Chrome.
 * @typedef WhammyRecorder
 * @class
 * @example
 * var recorder = new WhammyRecorder(mediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

var Whammy = require('./Whammy')

module.exports = WhammyRecorder

function WhammyRecorder(mediaStream) {
    /**
     * This method records video.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!this.width) {
            this.width = 320;
        }

        if (!this.height) {
            this.height = 240;
        }

        if (!this.video) {
            this.video = {
                width: this.width,
                height: this.height
            };
        }

        if (!this.canvas) {
            this.canvas = {
                width: this.width,
                height: this.height
            };
        }

        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        context = canvas.getContext('2d');

        // setting defaults
        if (this.video && this.video instanceof HTMLVideoElement) {
            video = this.video.cloneNode();
        } else {
            video = document.createElement('video');
            video.src = URL.createObjectURL(mediaStream);

            video.width = this.video.width;
            video.height = this.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video();

        if (!this.disableLogs) {
            console.log('canvas resolutions', canvas.width, '*', canvas.height);
            console.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);
        }

        drawFrames();
    };

    function drawFrames() {
        var duration = new Date().getTime() - lastTime;
        if (!duration) {
            return setTimeout(drawFrames, 10);
        }

        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawFrames, 100);
        }

        // via #206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        if (video.paused) {
            // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
            // Tweak for Android Chrome
            video.play();
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        whammy.frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });

        if (!isStopDrawing) {
            setTimeout(drawFrames, 10);
        }
    }

    /**
     * remove black frames from the beginning to the specified frame
     * @param {Array} _frames - array of frames to be checked
     * @param {number} _framesToCheck - number of frame until check will be executed (-1 - will drop all frames until frame not matched will be found)
     * @param {number} _pixTolerance - 0 - very strict (only black pixel color) ; 1 - all
     * @param {number} _frameTolerance - 0 - very strict (only black frame color) ; 1 - all
     * @returns {Array} - array of frames
     */
    // pull#293 by @volodalexey
    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        for (var f = 0; f < endCheckFrame; f++) {
            var matchPixCount, endPixCheck, maxPixCount;

            if (!doNotCheckNext) {
                var image = new Image();
                image.src = _frames[f].image;
                context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                matchPixCount = 0;
                endPixCheck = imageData.data.length;
                maxPixCount = imageData.data.length / 4;

                for (var pix = 0; pix < endPixCheck; pix += 4) {
                    var currentColor = {
                        r: imageData.data[pix],
                        g: imageData.data[pix + 1],
                        b: imageData.data[pix + 2]
                    };
                    var colorDifference = Math.sqrt(
                        Math.pow(currentColor.r - sampleColor.r, 2) +
                        Math.pow(currentColor.g - sampleColor.g, 2) +
                        Math.pow(currentColor.b - sampleColor.b, 2)
                    );
                    // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                    if (colorDifference <= maxColorDifference * pixTolerance) {
                        matchPixCount++;
                    }
                }
            }

            if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
                // console.log('removed black frame : ' + f + ' ; frame duration ' + _frames[f].duration);
            } else {
                // console.log('frame is passed : ' + f);
                if (checkUntilNotBlack) {
                    doNotCheckNext = true;
                }
                resultFrames.push(_frames[f]);
            }
        }

        resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

        if (resultFrames.length <= 0) {
            // at least one last frame should be available for next manipulation
            // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
            resultFrames.push(_frames[_frames.length - 1]);
        }

        return resultFrames;
    }

    var isStopDrawing = false;

    /**
     * This method stops recording video.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isStopDrawing = true;

        var _this = this;
        // analyse of all frames takes some time!
        setTimeout(function() {
            // e.g. dropBlackFrames(frames, 10, 1, 1) - will cut all 10 frames
            // e.g. dropBlackFrames(frames, 10, 0.5, 0.5) - will analyse 10 frames
            // e.g. dropBlackFrames(frames, 10) === dropBlackFrames(frames, 10, 0, 0) - will analyse 10 frames with strict black color
            whammy.frames = dropBlackFrames(whammy.frames, -1);

            // to display advertisement images!
            if (this.advertisement && this.advertisement.length) {
                whammy.frames = this.advertisement.concat(whammy.frames);
            }

            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof WhammyRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            whammy.compile(function(blob) {
                _this.blob = blob;

                if (_this.blob.forEach) {
                    _this.blob = new Blob([], {
                        type: 'video/webm'
                    });
                }

                if (callback) {
                    callback(_this.blob);
                }
            });
        }, 10);
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;

        if (!this.disableLogs) {
            console.debug('Paused recording.');
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (!this.disableLogs) {
            console.debug('Resumed recording.');
        }
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;
}

},{"./Whammy":18}],20:[function(require,module,exports){

module.exports = whammyInWebWorker

function whammyInWebWorker(frames) {
    function ArrayToWebM(frames) {
        var info = checkFrames(frames);
        if (!info) {
            return [];
        }

        var clusterMaxDuration = 30000;

        var EBML = [{
            'id': 0x1a45dfa3, // EBML
            'data': [{
                'data': 1,
                'id': 0x4286 // EBMLVersion
            }, {
                'data': 1,
                'id': 0x42f7 // EBMLReadVersion
            }, {
                'data': 4,
                'id': 0x42f2 // EBMLMaxIDLength
            }, {
                'data': 8,
                'id': 0x42f3 // EBMLMaxSizeLength
            }, {
                'data': 'webm',
                'id': 0x4282 // DocType
            }, {
                'data': 2,
                'id': 0x4287 // DocTypeVersion
            }, {
                'data': 2,
                'id': 0x4285 // DocTypeReadVersion
            }]
        }, {
            'id': 0x18538067, // Segment
            'data': [{
                'id': 0x1549a966, // Info
                'data': [{
                    'data': 1e6, //do things in millisecs (num of nanosecs for duration scale)
                    'id': 0x2ad7b1 // TimecodeScale
                }, {
                    'data': 'whammy',
                    'id': 0x4d80 // MuxingApp
                }, {
                    'data': 'whammy',
                    'id': 0x5741 // WritingApp
                }, {
                    'data': doubleToString(info.duration),
                    'id': 0x4489 // Duration
                }]
            }, {
                'id': 0x1654ae6b, // Tracks
                'data': [{
                    'id': 0xae, // TrackEntry
                    'data': [{
                        'data': 1,
                        'id': 0xd7 // TrackNumber
                    }, {
                        'data': 1,
                        'id': 0x73c5 // TrackUID
                    }, {
                        'data': 0,
                        'id': 0x9c // FlagLacing
                    }, {
                        'data': 'und',
                        'id': 0x22b59c // Language
                    }, {
                        'data': 'V_VP8',
                        'id': 0x86 // CodecID
                    }, {
                        'data': 'VP8',
                        'id': 0x258688 // CodecName
                    }, {
                        'data': 1,
                        'id': 0x83 // TrackType
                    }, {
                        'id': 0xe0, // Video
                        'data': [{
                            'data': info.width,
                            'id': 0xb0 // PixelWidth
                        }, {
                            'data': info.height,
                            'id': 0xba // PixelHeight
                        }]
                    }]
                }]
            }]
        }];

        //Generate clusters (max duration)
        var frameNumber = 0;
        var clusterTimecode = 0;
        while (frameNumber < frames.length) {

            var clusterFrames = [];
            var clusterDuration = 0;
            do {
                clusterFrames.push(frames[frameNumber]);
                clusterDuration += frames[frameNumber].duration;
                frameNumber++;
            } while (frameNumber < frames.length && clusterDuration < clusterMaxDuration);

            var clusterCounter = 0;
            var cluster = {
                'id': 0x1f43b675, // Cluster
                'data': getClusterData(clusterTimecode, clusterCounter, clusterFrames)
            }; //Add cluster to segment
            EBML[1].data.push(cluster);
            clusterTimecode += clusterDuration;
        }

        return generateEBML(EBML);
    }

    function getClusterData(clusterTimecode, clusterCounter, clusterFrames) {
        return [{
            'data': clusterTimecode,
            'id': 0xe7 // Timecode
        }].concat(clusterFrames.map(function(webp) {
            var block = makeSimpleBlock({
                discardable: 0,
                frame: webp.data.slice(4),
                invisible: 0,
                keyframe: 1,
                lacing: 0,
                trackNum: 1,
                timecode: Math.round(clusterCounter)
            });
            clusterCounter += webp.duration;
            return {
                data: block,
                id: 0xa3
            };
        }));
    }

    // sums the lengths of all the frames and gets the duration

    function checkFrames(frames) {
        if (!frames[0]) {
            postMessage({
                error: 'Something went wrong. Maybe WebP format is not supported in the current browser.'
            });
            return;
        }

        var width = frames[0].width,
            height = frames[0].height,
            duration = frames[0].duration;

        for (var i = 1; i < frames.length; i++) {
            duration += frames[i].duration;
        }
        return {
            duration: duration,
            width: width,
            height: height
        };
    }

    function numToBuffer(num) {
        var parts = [];
        while (num > 0) {
            parts.push(num & 0xff);
            num = num >> 8;
        }
        return new Uint8Array(parts.reverse());
    }

    function strToBuffer(str) {
        return new Uint8Array(str.split('').map(function(e) {
            return e.charCodeAt(0);
        }));
    }

    function bitsToBuffer(bits) {
        var data = [];
        var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
        bits = pad + bits;
        for (var i = 0; i < bits.length; i += 8) {
            data.push(parseInt(bits.substr(i, 8), 2));
        }
        return new Uint8Array(data);
    }

    function generateEBML(json) {
        var ebml = [];
        for (var i = 0; i < json.length; i++) {
            var data = json[i].data;

            if (typeof data === 'object') {
                data = generateEBML(data);
            }

            if (typeof data === 'number') {
                data = bitsToBuffer(data.toString(2));
            }

            if (typeof data === 'string') {
                data = strToBuffer(data);
            }

            var len = data.size || data.byteLength || data.length;
            var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
            var sizeToString = len.toString(2);
            var padded = (new Array((zeroes * 7 + 7 + 1) - sizeToString.length)).join('0') + sizeToString;
            var size = (new Array(zeroes)).join('0') + '1' + padded;

            ebml.push(numToBuffer(json[i].id));
            ebml.push(bitsToBuffer(size));
            ebml.push(data);
        }

        return new Blob(ebml, {
            type: 'video/webm'
        });
    }

    function toBinStrOld(bits) {
        var data = '';
        var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
        bits = pad + bits;
        for (var i = 0; i < bits.length; i += 8) {
            data += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
        }
        return data;
    }

    function makeSimpleBlock(data) {
        var flags = 0;

        if (data.keyframe) {
            flags |= 128;
        }

        if (data.invisible) {
            flags |= 8;
        }

        if (data.lacing) {
            flags |= (data.lacing << 1);
        }

        if (data.discardable) {
            flags |= 1;
        }

        if (data.trackNum > 127) {
            throw 'TrackNumber > 127 not supported';
        }

        var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
            return String.fromCharCode(e);
        }).join('') + data.frame;

        return out;
    }

    function parseWebP(riff) {
        var VP8 = riff.RIFF[0].WEBP[0];

        var frameStart = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
        for (var i = 0, c = []; i < 4; i++) {
            c[i] = VP8.charCodeAt(frameStart + 3 + i);
        }

        var width, height, tmp;

        //the code below is literally copied verbatim from the bitstream spec
        tmp = (c[1] << 8) | c[0];
        width = tmp & 0x3FFF;
        tmp = (c[3] << 8) | c[2];
        height = tmp & 0x3FFF;
        return {
            width: width,
            height: height,
            data: VP8,
            riff: riff
        };
    }

    function getStrLength(string, offset) {
        return parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
            var unpadded = i.charCodeAt(0).toString(2);
            return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
        }).join(''), 2);
    }

    function parseRIFF(string) {
        var offset = 0;
        var chunks = {};

        while (offset < string.length) {
            var id = string.substr(offset, 4);
            var len = getStrLength(string, offset);
            var data = string.substr(offset + 4 + 4, len);
            offset += 4 + 4 + len;
            chunks[id] = chunks[id] || [];

            if (id === 'RIFF' || id === 'LIST') {
                chunks[id].push(parseRIFF(data));
            } else {
                chunks[id].push(data);
            }
        }
        return chunks;
    }

    function doubleToString(num) {
        return [].slice.call(
            new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
            return String.fromCharCode(e);
        }).reverse().join('');
    }

    var webm = new ArrayToWebM(frames.map(function(frame) {
        var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
        webp.duration = frame.duration;
        return webp;
    }));

    postMessage(webm);
}


},{}],21:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))

},{"_process":1}],22:[function(require,module,exports){
// Last time updated at Feb 12, 2015, 08:32:23

// links:
// Open-Sourced: https://github.com/muaz-khan/RecordRTC
// http://cdn.WebRTC-Experiment.com/RecordRTC.js
// http://www.WebRTC-Experiment.com/RecordRTC.js (for China users)
// http://RecordRTC.org/latest.js (for China users)
// npm install recordrtc
// http://recordrtc.org/

// updates?
/*
-. Fixed echo.
-. You can pass "recorderType" - RecordRTC(stream, { recorderType: window.WhammyRecorder });
-. If MediaStream is suddenly stopped in Firefox.
-. Added "disableLogs"         - RecordRTC(stream, { disableLogs: true });
-. You can pass "bufferSize:0" - RecordRTC(stream, { bufferSize: 0 });
-. You can set "leftChannel"   - RecordRTC(stream, { leftChannel: true });
-. Fixed MRecordRTC.
-. Added functionality for analyse black frames and cut them - pull#293
-. if you're recording GIF, you must link: https://cdn.webrtc-experiment.com/gif-recorder.js
*/

//------------------------------------

// Browsers Support::
// Chrome (all versions) [ audio/video separately ]
// Firefox ( >= 29 ) [ audio/video in single webm/mp4 container or only audio in ogg ]
// Opera (all versions) [ same as chrome ]
// Android (Chrome) [ only video ]
// Android (Opera) [ only video ]
// Android (Firefox) [ only video ]

//------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
//------------------------------------
// Note: RecordRTC.js is using 3 other libraries; you need to accept their licences as well.
//------------------------------------
// 1. RecordRTC.js
// 2. MRecordRTC.js
// 3. Cross-Browser-Declarations.js
// 4. Storage.js
// 5. MediaStreamRecorder.js
// 6. StereoRecorder.js
// 7. StereoAudioRecorder.js
// 8. CanvasRecorder.js
// 9. WhammyRecorder.js
// 10. Whammy.js
// 11. DiskStorage.js
// 12. GifRecorder.js
//------------------------------------

'use strict';
// ____________
// RecordRTC.js

/**
 * {@link https://github.com/muaz-khan/RecordRTC|RecordRTC} is a JavaScript-based media-recording library for modern web-browsers (supporting WebRTC getUserMedia API). It is optimized for different devices and browsers to bring all client-side (pluginfree) recording solutions in single place.
 * @summary JavaScript audio/video recording library runs top over WebRTC getUserMedia API.
 * @license {@link https://www.webrtc-experiment.com/licence/|MIT}
 * @author {@link https://www.MuazKhan.com|Muaz Khan}
 * @typedef RecordRTC
 * @class
 * @example
 * var recordRTC = RecordRTC(mediaStream, {
 *     type: 'video' // audio or video or gif or canvas
 * });
 *
 * // or, you can even use keyword "new"
 * var recordRTC = new RecordRTC(mediaStream[, config]);
 * @see For further information:
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */

module.exports = RecordRTC;

function RecordRTC(mediaStream, config) {
    config = config || {};

    if (!mediaStream) {
        throw 'MediaStream is mandatory.';
    }

    if (!config.type) {
        config.type = 'audio';
    }

    var self = this;

    function startRecording() {
        if (!config.disableLogs) {
            console.debug('started recording ' + config.type + ' stream.');
        }

        // Media Stream Recording API has not been implemented in chrome yet;
        // That's why using WebAudio API to record stereo audio in WAV format
        var Recorder = isChrome ? StereoRecorder : MediaStreamRecorder;

        // video recorder (in WebM format)
        if (config.type === 'video' && isChrome) {
            Recorder = WhammyRecorder;
        }

        // video recorder (in Gif format)
        if (config.type === 'gif') {
            Recorder = GifRecorder;
        }

        // html2canvas recording!
        if (config.type === 'canvas') {
            Recorder = CanvasRecorder;
        }

        if (config.recorderType) {
            Recorder = config.recorderType;
        }

        mediaRecorder = new Recorder(mediaStream);

        // Merge all data-types except "function"
        mediaRecorder = mergeProps(mediaRecorder, config);

        mediaRecorder.onAudioProcessStarted = function() {
            if (config.onAudioProcessStarted) {
                config.onAudioProcessStarted();
            }
        };

        mediaRecorder.onGifPreview = function(gif) {
            if (config.onGifPreview) {
                config.onGifPreview(gif);
            }
        };

        mediaRecorder.record();

        return self;
    }

    function stopRecording(callback) {
        if (!mediaRecorder) {
            return console.warn(WARNING);
        }

        /*jshint validthis:true */
        var recordRTC = this;

        if (!config.disableLogs) {
            console.warn('Stopped recording ' + config.type + ' stream.');
        }

        if (config.type !== 'gif') {
            mediaRecorder.stop(_callback);
        } else {
            mediaRecorder.stop();
            _callback();
        }

        function _callback() {
            for (var item in mediaRecorder) {
                if (self) {
                    self[item] = mediaRecorder[item];
                }

                if (recordRTC) {
                    recordRTC[item] = mediaRecorder[item];
                }
            }

            var blob = mediaRecorder.blob;
            if (callback) {
                var url = URL.createObjectURL(blob);
                callback(url);
            }

            if (!config.disableLogs) {
                console.debug(blob.type, '->', bytesToSize(blob.size));
            }

            if (!config.autoWriteToDisk) {
                return;
            }

            getDataURL(function(dataURL) {
                var parameter = {};
                parameter[config.type + 'Blob'] = dataURL;
                DiskStorage.Store(parameter);
            });
        }
    }

    function pauseRecording() {
        if (!mediaRecorder) {
            return console.warn(WARNING);
        }

        // not all libs yet having  this method
        if (mediaRecorder.pause) {
            mediaRecorder.pause();
        } else if (!config.disableLogs) {
            console.warn('This recording library is having no "pause" method.');
        }
    }

    function resumeRecording() {
        if (!mediaRecorder) {
            return console.warn(WARNING);
        }

        // not all libs yet having  this method
        if (mediaRecorder.resume) {
            mediaRecorder.resume();
        } else if (!config.disableLogs) {
            console.warn('This recording library is having no "resume" method.');
        }
    }

    function getDataURL(callback, _mediaRecorder) {
        if (!callback) {
            throw 'Pass a callback function over getDataURL.';
        }

        var blob = _mediaRecorder ? _mediaRecorder.blob : mediaRecorder.blob;

        if (!blob) {
            if (!config.disableLogs) {
                console.warn('Blob encoder did not yet finished its job.');
            }

            setTimeout(function() {
                getDataURL(callback, _mediaRecorder);
            }, 1000);
            return;
        }

        if (!!window.Worker) {
            var webWorker = processInWebWorker(function readFile(_blob) {
                postMessage(new FileReaderSync().readAsDataURL(_blob));
            });

            webWorker.onmessage = function(event) {
                callback(event.data);
            };

            webWorker.postMessage(blob);
        } else {
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = function(event) {
                callback(event.target.result);
            };
        }

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {readFile(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            URL.revokeObjectURL(blob);
            return worker;
        }
    }

    var WARNING = 'It seems that "startRecording" is not invoked for ' + config.type + ' recorder.';

    var mediaRecorder;

    var returnObject = {
        /**
         * This method starts recording. It doesn't take any argument.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.startRecording();
         */
        startRecording: startRecording,

        /**
         * This method stops recording. It takes single "callback" argument. It is suggested to get blob or URI in the callback to make sure all encoders finished their jobs.
         * @param {function} callback - This callback function is invoked after completion of all encoding jobs.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function(videoURL) {
         *     video.src = videoURL;
         *     recordRTC.blob; recordRTC.buffer;
         * });
         */
        stopRecording: stopRecording,

        /**
         * This method pauses the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.pauseRecording();
         */
        pauseRecording: pauseRecording,

        /**
         * This method resumes the recording process.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.resumeRecording();
         */
        resumeRecording: resumeRecording,

        /**
         * It is equivalent to <code class="str">"recordRTC.blob"</code> property.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var blob = recordRTC.getBlob();
         *
         *     // equivalent to: recordRTC.blob property
         *     var blob = recordRTC.blob;
         * });
         */
        getBlob: function() {
            if (!mediaRecorder) {
                return console.warn(WARNING);
            }

            return mediaRecorder.blob;
        },

        /**
         * This method returns DataURL. It takes single "callback" argument.
         * @param {function} callback - DataURL is passed back over this callback.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     recordRTC.getDataURL(function(dataURL) {
         *         video.src = dataURL;
         *     });
         * });
         */
        getDataURL: getDataURL,

        /**
         * This method returns Virutal/Blob URL. It doesn't take any argument.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     video.src = recordRTC.toURL();
         * });
         */
        toURL: function() {
            if (!mediaRecorder) {
                return console.warn(WARNING);
            }

            return URL.createObjectURL(mediaRecorder.blob);
        },

        /**
         * This method saves blob/file into disk (by inovking save-as dialog). It takes single (optional) argument i.e. FileName
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     recordRTC.save('file-name');
         * });
         */
        save: function(fileName) {
            if (!mediaRecorder) {
                var that = this;
                setTimeout(function() {
                    that.save(fileName);
                }, 2000);
                return console.warn(WARNING);
            }

            var hyperlink = document.createElement('a');
            hyperlink.href = URL.createObjectURL(mediaRecorder.blob);
            hyperlink.target = '_blank';
            hyperlink.download = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + mediaRecorder.blob.type.split('/')[1];

            var evt = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });

            hyperlink.dispatchEvent(evt);

            (window.URL || window.webkitURL).revokeObjectURL(hyperlink.href);
        },

        /**
         * This method gets blob from indexed-DB storage. It takes single "callback" argument.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.getFromDisk(function(dataURL) {
         *     video.src = dataURL;
         * });
         */
        getFromDisk: function(callback) {
            if (!mediaRecorder) {
                return console.warn(WARNING);
            }

            RecordRTC.getFromDisk(config.type, callback);
        },

        /**
         * This method appends prepends array of webp images to the recorded video-blob. It takes an "array" object.
         * @type {Array.<Array>}
         * @param {Array} arrayOfWebPImages - Array of webp images.
         * @method
         * @memberof RecordRTC
         * @instance
         * @example
         * var arrayOfWebPImages = [];
         * arrayOfWebPImages.push({
         *     duration: index,
         *     image: 'data:image/webp;base64,...'
         * });
         * recordRTC.setAdvertisementArray(arrayOfWebPImages);
         */
        setAdvertisementArray: function(arrayOfWebPImages) {
            this.advertisement = [];

            var length = arrayOfWebPImages.length;
            for (var i = 0; i < length; i++) {
                this.advertisement.push({
                    duration: i,
                    image: arrayOfWebPImages[i]
                });
            }
        },

        /**
         * It is equivalent to <code class="str">"recordRTC.getBlob()"</code> method.
         * @property {Blob} blob - Recorded Blob can be accessed using this property.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var blob = recordRTC.blob;
         *
         *     // equivalent to: recordRTC.getBlob() method
         *     var blob = recordRTC.getBlob();
         * });
         */
        blob: null,

        /**
         * @todo Add descriptions.
         * @property {number} bufferSize - Either audio device's default buffer-size, or your custom value.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var bufferSize = recordRTC.bufferSize;
         * });
         */
        bufferSize: 0,

        /**
         * @todo Add descriptions.
         * @property {number} sampleRate - Audio device's default sample rates.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var sampleRate = recordRTC.sampleRate;
         * });
         */
        sampleRate: 0,

        /**
         * @todo Add descriptions.
         * @property {ArrayBuffer} buffer - Audio ArrayBuffer, supported only in Chrome.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var buffer = recordRTC.buffer;
         * });
         */
        buffer: null,

        /**
         * @todo Add descriptions.
         * @property {DataView} view - Audio DataView, supported only in Chrome.
         * @memberof RecordRTC
         * @instance
         * @example
         * recordRTC.stopRecording(function() {
         *     var dataView = recordRTC.view;
         * });
         */
        view: null
    };

    if (!this) {
        return returnObject;
    }

    // if someone wanna use RecordRTC with "new" keyword.
    for (var prop in returnObject) {
        this[prop] = returnObject[prop];
    }

    return returnObject;
}

/**
 * This method can be used to get all recorded blobs from IndexedDB storage.
 * @param {string} type - 'all' or 'audio' or 'video' or 'gif'
 * @param {function} callback - Callback function to get all stored blobs.
 * @method
 * @memberof RecordRTC
 * @example
 * RecordRTC.getFromDisk('all', function(dataURL, type){
 *     if(type === 'audio') { }
 *     if(type === 'video') { }
 *     if(type === 'gif')   { }
 * });
 */
RecordRTC.getFromDisk = function(type, callback) {
    if (!callback) {
        throw 'callback is mandatory.';
    }

    console.log('Getting recorded ' + (type === 'all' ? 'blobs' : type + ' blob ') + ' from disk!');
    DiskStorage.Fetch(function(dataURL, _type) {
        if (type !== 'all' && _type === type + 'Blob' && callback) {
            callback(dataURL);
        }

        if (type === 'all' && callback) {
            callback(dataURL, _type.replace('Blob', ''));
        }
    });
};

/**
 * This method can be used to store recorded blobs into IndexedDB storage.
 * @param {object} options - {audio: Blob, video: Blob, gif: Blob}
 * @method
 * @memberof RecordRTC
 * @example
 * RecordRTC.writeToDisk({
 *     audio: audioBlob,
 *     video: videoBlob,
 *     gif  : gifBlob
 * });
 */
RecordRTC.writeToDisk = function(options) {
    console.log('Writing recorded blob(s) to disk!');
    options = options || {};
    if (options.audio && options.video && options.gif) {
        options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
                options.gif.getDataURL(function(gifDataURL) {
                    DiskStorage.Store({
                        audioBlob: audioDataURL,
                        videoBlob: videoDataURL,
                        gifBlob: gifDataURL
                    });
                });
            });
        });
    } else if (options.audio && options.video) {
        options.audio.getDataURL(function(audioDataURL) {
            options.video.getDataURL(function(videoDataURL) {
                DiskStorage.Store({
                    audioBlob: audioDataURL,
                    videoBlob: videoDataURL
                });
            });
        });
    } else if (options.audio && options.gif) {
        options.audio.getDataURL(function(audioDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                    audioBlob: audioDataURL,
                    gifBlob: gifDataURL
                });
            });
        });
    } else if (options.video && options.gif) {
        options.video.getDataURL(function(videoDataURL) {
            options.gif.getDataURL(function(gifDataURL) {
                DiskStorage.Store({
                    videoBlob: videoDataURL,
                    gifBlob: gifDataURL
                });
            });
        });
    } else if (options.audio) {
        options.audio.getDataURL(function(audioDataURL) {
            DiskStorage.Store({
                audioBlob: audioDataURL
            });
        });
    } else if (options.video) {
        options.video.getDataURL(function(videoDataURL) {
            DiskStorage.Store({
                videoBlob: videoDataURL
            });
        });
    } else if (options.gif) {
        options.gif.getDataURL(function(gifDataURL) {
            DiskStorage.Store({
                gifBlob: gifDataURL
            });
        });
    }
};
// _____________
// MRecordRTC.js

/**
 * MRecordRTC runs top over {@link RecordRTC} to bring multiple recordings in single place, by providing simple API.
 * @summary MRecordRTC stands for "Multiple-RecordRTC".
 * @license {@link https://www.webrtc-experiment.com/licence/|MIT}
 * @author {@link https://www.MuazKhan.com|Muaz Khan}
 * @typedef MRecordRTC
 * @class
 * @example
 * var recorder = new MRecordRTC();
 * recorder.addStream(MediaStream);
 * recorder.mediaType = {
 *     audio: true,
 *     video: true,
 *     gif: true
 * };
 * recorder.startRecording();
 * @see For further information:
 * @see {@link https://github.com/muaz-khan/RecordRTC/tree/master/MRecordRTC|MRecordRTC Source Code}
 */

function MRecordRTC(mediaStream) {

    /**
     * This method attaches MediaStream object to {@link MRecordRTC}.
     * @param {MediaStream} mediaStream - A MediaStream object, either fetched using getUserMedia API, or generated using captureStreamUntilEnded or WebAudio API.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.addStream(MediaStream);
     */
    this.addStream = function(_mediaStream) {
        if (_mediaStream) {
            mediaStream = _mediaStream;
        }
    };

    /**
     * This property can be used to set recording type e.g. audio, or video, or gif, or canvas.
     * @property {object} mediaType - {audio: true, video: true, gif: true}
     * @memberof MRecordRTC
     * @example
     * var recorder = new MRecordRTC();
     * recorder.mediaType = {
     *     audio: true,
     *     video: true,
     *     gif  : true
     * };
     */
    this.mediaType = {
        audio: true,
        video: true
    };

    /**
     * This method starts recording.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.startRecording();
     */
    this.startRecording = function() {
        if (!isChrome && mediaStream && mediaStream.getAudioTracks && mediaStream.getAudioTracks().length && mediaStream.getVideoTracks().length) {
            // Firefox is supporting both audio/video in single blob
            this.mediaType.audio = false;
        }

        if (this.mediaType.audio) {
            this.audioRecorder = new RecordRTC(mediaStream, {
                type: 'audio',
                bufferSize: this.bufferSize,
                sampleRate: this.sampleRate
            });
            this.audioRecorder.startRecording();
        }

        if (this.mediaType.video) {
            this.videoRecorder = new RecordRTC(mediaStream, {
                type: 'video',
                video: this.video,
                canvas: this.canvas
            });
            this.videoRecorder.startRecording();
        }

        if (this.mediaType.gif) {
            this.gifRecorder = new RecordRTC(mediaStream, {
                type: 'gif',
                frameRate: this.frameRate || 200,
                quality: this.quality || 10
            });
            this.gifRecorder.startRecording();
        }
    };

    /**
     * This method stop recording.
     * @param {function} callback - Callback function is invoked when all encoders finish their jobs.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.stopRecording(function(recording){
     *     var audioBlob = recording.audio;
     *     var videoBlob = recording.video;
     *     var gifBlob   = recording.gif;
     * });
     */
    this.stopRecording = function(callback) {
        callback = callback || function() {};

        if (this.audioRecorder) {
            this.audioRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'audio');
            });
        }

        if (this.videoRecorder) {
            this.videoRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'video');
            });
        }

        if (this.gifRecorder) {
            this.gifRecorder.stopRecording(function(blobURL) {
                callback(blobURL, 'gif');
            });
        }
    };

    /**
     * This method can be used to manually get all recorded blobs.
     * @param {function} callback - All recorded blobs are passed back to "callback" function.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.getBlob(function(recording){
     *     var audioBlob = recording.audio;
     *     var videoBlob = recording.video;
     *     var gifBlob   = recording.gif;
     * });
     */
    this.getBlob = function(callback) {
        var output = {};

        if (this.audioRecorder) {
            output.audio = this.audioRecorder.getBlob();
        }

        if (this.videoRecorder) {
            output.video = this.videoRecorder.getBlob();
        }

        if (this.gifRecorder) {
            output.gif = this.gifRecorder.getBlob();
        }

        if (callback) {
            callback(output);
        }
    };

    /**
     * This method can be used to manually get all recorded blobs' DataURLs.
     * @param {function} callback - All recorded blobs' DataURLs are passed back to "callback" function.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.getDataURL(function(recording){
     *     var audioDataURL = recording.audio;
     *     var videoDataURL = recording.video;
     *     var gifDataURL   = recording.gif;
     * });
     */
    this.getDataURL = function(callback) {
        this.getBlob(function(blob) {
            getDataURL(blob.audio, function(_audioDataURL) {
                getDataURL(blob.video, function(_videoDataURL) {
                    callback({
                        audio: _audioDataURL,
                        video: _videoDataURL
                    });
                });
            });
        });

        function getDataURL(blob, callback00) {
            if (!!window.Worker) {
                var webWorker = processInWebWorker(function readFile(_blob) {
                    postMessage(new FileReaderSync().readAsDataURL(_blob));
                });

                webWorker.onmessage = function(event) {
                    callback00(event.data);
                };

                webWorker.postMessage(blob);
            } else {
                var reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onload = function(event) {
                    callback00(event.target.result);
                };
            }
        }

        function processInWebWorker(_function) {
            var blob = URL.createObjectURL(new Blob([_function.toString(),
                'this.onmessage =  function (e) {readFile(e.data);}'
            ], {
                type: 'application/javascript'
            }));

            var worker = new Worker(blob);
            URL.revokeObjectURL(blob);
            return worker;
        }
    };

    /**
     * This method can be used to ask {@link MRecordRTC} to write all recorded blobs into IndexedDB storage.
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.writeToDisk();
     */
    this.writeToDisk = function() {
        RecordRTC.writeToDisk({
            audio: this.audioRecorder,
            video: this.videoRecorder,
            gif: this.gifRecorder
        });
    };

    /**
     * This method can be used to invoke save-as dialog for all recorded blobs.
     * @param {object} args - {audio: 'audio-name', video: 'video-name', gif: 'gif-name'}
     * @method
     * @memberof MRecordRTC
     * @example
     * recorder.save({
     *     audio: 'audio-file-name',
     *     video: 'video-file-name',
     *     gif  : 'gif-file-name'
     * });
     */
    this.save = function(args) {
        args = args || {
            audio: true,
            video: true,
            gif: true
        };

        if (!!args.audio && this.audioRecorder) {
            this.audioRecorder.save(typeof args.audio === 'string' ? args.audio : '');
        }

        if (!!args.video && this.videoRecorder) {
            this.videoRecorder.save(typeof args.video === 'string' ? args.video : '');
        }
        if (!!args.gif && this.gifRecorder) {
            this.gifRecorder.save(typeof args.gif === 'string' ? args.gif : '');
        }
    };
}

/**
 * This method can be used to get all recorded blobs from IndexedDB storage.
 * @param {string} type - 'all' or 'audio' or 'video' or 'gif'
 * @param {function} callback - Callback function to get all stored blobs.
 * @method
 * @memberof MRecordRTC
 * @example
 * MRecordRTC.getFromDisk('all', function(dataURL, type){
 *     if(type === 'audio') { }
 *     if(type === 'video') { }
 *     if(type === 'gif')   { }
 * });
 */
MRecordRTC.getFromDisk = RecordRTC.getFromDisk;

/**
 * This method can be used to store recorded blobs into IndexedDB storage.
 * @param {object} options - {audio: Blob, video: Blob, gif: Blob}
 * @method
 * @memberof MRecordRTC
 * @example
 * MRecordRTC.writeToDisk({
 *     audio: audioBlob,
 *     video: videoBlob,
 *     gif  : gifBlob
 * });
 */
MRecordRTC.writeToDisk = RecordRTC.writeToDisk;
// _____________________________
// Cross-Browser-Declarations.js

// animation-frame used in WebM recording
if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
}

if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
}

// WebAudio API representer
if (!window.AudioContext) {
    window.AudioContext = window.webkitAudioContext || window.mozAudioContext;
}

window.URL = window.URL || window.webkitURL;
navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

if (window.webkitMediaStream) {
    window.MediaStream = window.webkitMediaStream;
}

var isChrome = !!navigator.webkitGetUserMedia;

// Merge all other data-types except "function"

/**
 * @param {object} mergein - Merge another object in this object.
 * @param {object} mergeto - Merge this object in another object.
 * @returns {object} - merged object
 * @example
 * var mergedObject = mergeProps({}, {
 *     x: 10, // this will be merged
 *     y: 10, // this will be merged
 *     add: function() {} // this will be skipped
 * });
 */
function mergeProps(mergein, mergeto) {
    mergeto = reformatProps(mergeto);
    for (var t in mergeto) {
        if (typeof mergeto[t] !== 'function') {
            mergein[t] = mergeto[t];
        }
    }
    return mergein;
}

/**
 * @param {object} obj - If a property name is "sample-rate"; it will be converted into "sampleRate".
 * @returns {object} - formatted object.
 * @example
 * var mergedObject = reformatProps({
 *     'sample-rate': 44100,
 *     'buffer-size': 4096
 * });
 *
 * mergedObject.sampleRate === 44100
 * mergedObject.bufferSize === 4096
 */
function reformatProps(obj) {
    var output = {};
    for (var o in obj) {
        if (o.indexOf('-') !== -1) {
            var splitted = o.split('-');
            var name = splitted[0] + splitted[1].split('')[0].toUpperCase() + splitted[1].substr(1);
            output[name] = obj[o];
        } else {
            output[o] = obj[o];
        }
    }
    return output;
}

if (location.href.indexOf('file:') === 0) {
    console.error('Please load this HTML file on HTTP or HTTPS.');
}

// below function via: http://goo.gl/B3ae8c
/**
 * @param {number} bytes - Pass bytes and get formafted string.
 * @returns {string} - formafted string
 * @example
 * bytesToSize(1024*1024*5) === '5 GB'
 */
function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}
// __________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// Storage.js

/**
 * Storage is a standalone object used by {@link RecordRTC} to store reusable objects e.g. "new AudioContext".
 * @example
 * Storage.AudioContext === webkitAudioContext
 * @property {webkitAudioContext} AudioContext - Keeps a reference to AudioContext object.
 */

var Storage = {
    AudioContext: window.AudioContext || window.webkitAudioContext
};
// ______________________
// MediaStreamRecorder.js

// todo: need to show alert boxes for incompatible cases
// encoder only supports 48k/16k mono audio channel

/*
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

/**
 * MediaStreamRecorder is an abstraction layer for "MediaRecorder API". It is used by {@link RecordRTC} to record MediaStream(s) in Firefox.
 * @summary Runs top over MediaRecorder API.
 * @typedef MediaStreamRecorder
 * @class
 * @example
 * var recorder = new MediaStreamRecorder(MediaStream);
 * recorder.mimeType = 'video/webm'; // audio/ogg or video/webm
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 *
 *     // or
 *     var blob = recorder.blob;
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

function MediaStreamRecorder(mediaStream) {
    var self = this;

    // if user chosen only audio option; and he tried to pass MediaStream with
    // both audio and video tracks;
    // using a dirty workaround to generate audio-only stream so that we can get audio/ogg output.
    if (self.mimeType && self.mimeType !== 'video/webm' && mediaStream.getVideoTracks && mediaStream.getVideoTracks().length) {
        var context = new AudioContext();
        var mediaStreamSource = context.createMediaStreamSource(mediaStream);

        var destination = context.createMediaStreamDestination();
        mediaStreamSource.connect(destination);

        mediaStream = destination.stream;
    }

    var dataAvailable = false;

    /**
     * This method records MediaStream.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp
        // https://wiki.mozilla.org/Gecko:MediaRecorder
        // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html

        // starting a recording session; which will initiate "Reading Thread"
        // "Reading Thread" are used to prevent main-thread blocking scenarios
        mediaRecorder = new window.MediaRecorder(mediaStream);

        // Dispatching OnDataAvailable Handler
        mediaRecorder.ondataavailable = function(e) {
            if (dataAvailable) {
                return;
            }

            if (!e.data.size) {
                if (!self.disableLogs) {
                    console.warn('Recording of', e.data.type, 'failed.');
                }
                return;
            }

            dataAvailable = true;

            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof MediaStreamRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            self.blob = new Blob([e.data], {
                type: e.data.type || self.mimeType || 'audio/ogg'
            });

            if (self.callback) {
                self.callback();
            }
        };

        mediaRecorder.onerror = function(error) {
            if (!self.disableLogs) {
                console.warn(error);
            }

            // When the stream is "ended" set recording to 'inactive' 
            // and stop gathering data. Callers should not rely on 
            // exactness of the timeSlice value, especially 
            // if the timeSlice value is small. Callers should 
            // consider timeSlice as a minimum value

            mediaRecorder.stop();
            self.record(0);
        };

        // void start(optional long mTimeSlice)
        // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
        // handler. "mTimeSlice < 0" means Session object does not push encoded data to
        // onDataAvailable, instead, it passive wait the client side pull encoded data
        // by calling requestData API.
        mediaRecorder.start(0);

        // Start recording. If timeSlice has been provided, mediaRecorder will
        // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
        // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.

        if (self.onAudioProcessStarted) {
            self.onAudioProcessStarted();
        }
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }

        this.callback = callback;
        // mediaRecorder.state === 'recording' means that media recorder is associated with "session"
        // mediaRecorder.state === 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

        if (mediaRecorder.state === 'recording') {
            // "stop" method auto invokes "requestData"!
            // mediaRecorder.requestData();
            mediaRecorder.stop();
        }
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();

            if (!this.disableLogs) {
                console.debug('Paused recording.');
            }
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();

            if (!this.disableLogs) {
                console.debug('Resumed recording.');
            }
        }
    };

    // Reference to "MediaRecorder" object
    var mediaRecorder;
}
// _________________
// StereoRecorder.js

/**
 * StereoRecorder is a standalone class used by {@link RecordRTC} to bring audio-recording in chrome. It runs top over {@link StereoAudioRecorder}.
 * @summary JavaScript standalone object for stereo audio recording.
 * @typedef StereoRecorder
 * @class
 * @example
 * var recorder = new StereoRecorder(MediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

function StereoRecorder(mediaStream) {
    var self = this;

    /**
     * This method records MediaStream.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        mediaRecorder = new StereoAudioRecorder(mediaStream, this);
        mediaRecorder.onAudioProcessStarted = function() {
            if (self.onAudioProcessStarted) {
                self.onAudioProcessStarted();
            }
        };
        mediaRecorder.record();
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.stop(function() {
            for (var item in mediaRecorder) {
                self[item] = mediaRecorder[item];
            }

            if (callback) {
                callback();
            }
        });
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.pause();
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof StereoRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.resume();
    };

    // Reference to "StereoAudioRecorder" object
    var mediaRecorder;
}
// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js
// https://github.com/mattdiamond/Recorderjs#license-mit
// ______________________
// StereoAudioRecorder.js

/**
 * StereoAudioRecorder is a standalone class used by {@link RecordRTC} to bring "stereo" audio-recording in chrome.
 * @summary JavaScript standalone object for stereo audio recording.
 * @typedef StereoAudioRecorder
 * @class
 * @example
 * var recorder = new StereoAudioRecorder(MediaStream, {
 *     sampleRate: 44100,
 *     bufferSize: 4096
 * });
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 * @param {object} config - {sampleRate: 44100, bufferSize: 4096}
 */

var __stereoAudioRecorderJavacriptNode;

function StereoAudioRecorder(mediaStream, config) {
    if (!mediaStream.getAudioTracks().length) {
        throw 'Your stream has no audio tracks.';
    }

    var self = this;

    // variables
    var leftchannel = [];
    var rightchannel = [];
    var recording = false;
    var recordingLength = 0;

    /**
     * This method records MediaStream.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;

        recording = true;
    };

    function mergeLeftRightBuffers(config, callback) {
        function mergeAudioBuffers(config) {
            var leftBuffers = config.leftBuffers;
            var rightBuffers = config.rightBuffers;
            var sampleRate = config.sampleRate;

            leftBuffers = mergeBuffers(leftBuffers[0], leftBuffers[1]);
            rightBuffers = mergeBuffers(rightBuffers[0], rightBuffers[1]);

            function mergeBuffers(channelBuffer, rLength) {
                var result = new Float64Array(rLength);
                var offset = 0;
                var lng = channelBuffer.length;

                for (var i = 0; i < lng; i++) {
                    var buffer = channelBuffer[i];
                    result.set(buffer, offset);
                    offset += buffer.length;
                }

                return result;
            }

            function interleave(leftChannel, rightChannel) {
                var length = leftChannel.length + rightChannel.length;

                var result = new Float64Array(length);

                var inputIndex = 0;

                for (var index = 0; index < length;) {
                    result[index++] = leftChannel[inputIndex];
                    result[index++] = rightChannel[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function writeUTFBytes(view, offset, string) {
                var lng = string.length;
                for (var i = 0; i < lng; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            // interleave both channels together
            var interleaved = interleave(leftBuffers, rightBuffers);

            var interleavedLength = interleaved.length;

            // create wav file
            var resultingBufferLength = 44 + interleavedLength * 2;

            var buffer = new ArrayBuffer(resultingBufferLength);

            var view = new DataView(buffer);

            // RIFF chunk descriptor/identifier 
            writeUTFBytes(view, 0, 'RIFF');

            // RIFF chunk length
            var blockAlign = 4;
            view.setUint32(blockAlign, 44 + interleavedLength * 2, true);

            // RIFF type 
            writeUTFBytes(view, 8, 'WAVE');

            // format chunk identifier 
            // FMT sub-chunk
            writeUTFBytes(view, 12, 'fmt ');

            // format chunk length 
            view.setUint32(16, 16, true);

            // sample format (raw)
            view.setUint16(20, 1, true);

            // stereo (2 channels)
            view.setUint16(22, 2, true);

            // sample rate 
            view.setUint32(24, sampleRate, true);

            // byte rate (sample rate * block align)
            view.setUint32(28, sampleRate * blockAlign, true);

            // block align (channel count * bytes per sample) 
            view.setUint16(32, blockAlign, true);

            // bits per sample 
            view.setUint16(34, 16, true);

            // data sub-chunk
            // data chunk identifier 
            writeUTFBytes(view, 36, 'data');

            // data chunk length 
            view.setUint32(40, interleavedLength * 2, true);

            // write the PCM samples
            var offset = 44,
                leftChannel;
            for (var i = 0; i < interleavedLength; i++, offset += 2) {
                var size = Math.max(-1, Math.min(1, interleaved[i]));
                var currentChannel = size < 0 ? size * 32768 : size * 32767;

                if (config.leftChannel) {
                    if (currentChannel !== leftChannel) {
                        view.setInt16(offset, currentChannel, true);
                    }
                    leftChannel = currentChannel;
                } else {
                    view.setInt16(offset, currentChannel, true);
                }
            }

            postMessage({
                buffer: buffer,
                view: view
            });
        }
        var webWorker = processInWebWorker(mergeAudioBuffers);

        webWorker.onmessage = function(event) {
            callback(event.data.buffer, event.data.view);
        };

        webWorker.postMessage(config);
    }

    function processInWebWorker(_function) {
        var blob = URL.createObjectURL(new Blob([_function.toString(),
            'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(blob);
        URL.revokeObjectURL(blob);
        return worker;
    }

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        // stop recording
        recording = false;

        // to make sure onaudioprocess stops firing
        audioInput.disconnect();

        mergeLeftRightBuffers({
            sampleRate: sampleRate,
            leftChannel: config.leftChannel,
            leftBuffers: [leftchannel, recordingLength],
            rightBuffers: [rightchannel, recordingLength]
        }, function(buffer, view) {
            /**
             * @property {Blob} blob - The recorded blob object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var blob = recorder.blob;
             * });
             */
            self.blob = new Blob([view], {
                type: 'audio/wav'
            });

            /**
             * @property {ArrayBuffer} buffer - The recorded buffer object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var buffer = recorder.buffer;
             * });
             */
            self.buffer = new ArrayBuffer(view);

            /**
             * @property {DataView} view - The recorded data-view object.
             * @memberof StereoAudioRecorder
             * @example
             * recorder.stop(function(){
             *     var view = recorder.view;
             * });
             */
            self.view = view;

            self.sampleRate = sampleRate;
            self.bufferSize = bufferSize;

            // recorded audio length
            self.length = recordingLength;

            if (callback) {
                callback();
            }

            isAudioProcessStarted = false;
        });
    };

    if (!Storage.AudioContextConstructor) {
        Storage.AudioContextConstructor = new Storage.AudioContext();
    }

    var context = Storage.AudioContextConstructor;

    // creates an audio node from the microphone incoming stream
    var audioInput = context.createMediaStreamSource(mediaStream);

    var legalBufferValues = [0, 256, 512, 1024, 2048, 4096, 8192, 16384];

    /**
     * From the spec: This value controls how frequently the audioprocess event is
     * dispatched and how many sample-frames need to be processed each call.
     * Lower values for buffer size will result in a lower (better) latency.
     * Higher values will be necessary to avoid audio breakup and glitches
     * The size of the buffer (in sample-frames) which needs to
     * be processed each time onprocessaudio is called.
     * Legal values are (256, 512, 1024, 2048, 4096, 8192, 16384).
     * @property {number} bufferSize - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     bufferSize: 4096
     * });
     */

    // "0" means, let chrome decide the most accurate buffer-size for current platform.
    var bufferSize = typeof config.bufferSize === 'undefined' ? 4096 : config.bufferSize;

    if (legalBufferValues.indexOf(bufferSize) === -1) {
        if (!config.disableLogs) {
            console.warn('Legal values for buffer-size are ' + JSON.stringify(legalBufferValues, null, '\t'));
        }
    }


    /**
     * The sample rate (in sample-frames per second) at which the
     * AudioContext handles audio. It is assumed that all AudioNodes
     * in the context run at this rate. In making this assumption,
     * sample-rate converters or "varispeed" processors are not supported
     * in real-time processing.
     * The sampleRate parameter describes the sample-rate of the
     * linear PCM audio data in the buffer in sample-frames per second.
     * An implementation must support sample-rates in at least
     * the range 22050 to 96000.
     * @property {number} sampleRate - Buffer-size for how frequently the audioprocess event is dispatched.
     * @memberof StereoAudioRecorder
     * @example
     * recorder = new StereoAudioRecorder(mediaStream, {
     *     sampleRate: 44100
     * });
     */
    var sampleRate = typeof config.sampleRate !== 'undefined' ? config.sampleRate : context.sampleRate || 44100;

    if (sampleRate < 22050 || sampleRate > 96000) {
        // Ref: http://stackoverflow.com/a/26303918/552182
        if (!config.disableLogs) {
            console.warn('sample-rate must be under range 22050 and 96000.');
        }
    }

    if (context.createJavaScriptNode) {
        __stereoAudioRecorderJavacriptNode = context.createJavaScriptNode(bufferSize, 2, 2);
    } else if (context.createScriptProcessor) {
        __stereoAudioRecorderJavacriptNode = context.createScriptProcessor(bufferSize, 2, 2);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    // connect the stream to the gain node
    audioInput.connect(__stereoAudioRecorderJavacriptNode);

    bufferSize = __stereoAudioRecorderJavacriptNode.bufferSize;

    if (!config.disableLogs) {
        console.log('sample-rate', sampleRate);
        console.log('buffer-size', bufferSize);
    }

    var isPaused = false;
    /**
     * This method pauses the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPaused = true;

        if (!config.disableLogs) {
            console.debug('Paused recording.');
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof StereoAudioRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPaused = false;

        if (!config.disableLogs) {
            console.debug('Resumed recording.');
        }
    };

    var isAudioProcessStarted = false;

    __stereoAudioRecorderJavacriptNode.onaudioprocess = function(e) {
        if (isPaused) {
            return;
        }

        // if MediaStream().stop() or MediaStreamTrack.stop() is invoked.
        if (mediaStream.ended) {
            __stereoAudioRecorderJavacriptNode.onaudioprocess = function() {};
            return;
        }

        if (!recording) {
            audioInput.disconnect();
            return;
        }

        /**
         * This method is called on "onaudioprocess" event's first invocation.
         * @method {function} onAudioProcessStarted
         * @memberof StereoAudioRecorder
         * @example
         * recorder.onAudioProcessStarted: function() { };
         */
        if (!isAudioProcessStarted) {
            isAudioProcessStarted = true;
            if (self.onAudioProcessStarted) {
                self.onAudioProcessStarted();
            }
        }

        var left = e.inputBuffer.getChannelData(0);
        var right = e.inputBuffer.getChannelData(1);

        // we clone the samples
        leftchannel.push(new Float32Array(left));
        rightchannel.push(new Float32Array(right));

        recordingLength += bufferSize;
    };

    // to prevent self audio to be connected with speakers
    __stereoAudioRecorderJavacriptNode.connect(context.destination);
}
// _________________
// CanvasRecorder.js

/**
 * CanvasRecorder is a standalone class used by {@link RecordRTC} to bring HTML5-Canvas recording into video WebM. It uses HTML2Canvas library and runs top over {@link Whammy}.
 * @summary HTML2Canvas recording into video WebM.
 * @typedef CanvasRecorder
 * @class
 * @example
 * var recorder = new CanvasRecorder(htmlElement);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {HTMLElement} htmlElement - querySelector/getElementById/getElementsByTagName[0]/etc.
 */

function CanvasRecorder(htmlElement) {
    if (!window.html2canvas) {
        throw 'Please link: //cdn.webrtc-experiment.com/screenshot.js';
    }

    var isRecording;

    /**
     * This method records Canvas.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        isRecording = true;
        whammy.frames = [];
        drawCanvasFrame();
    };

    /**
     * This method stops recording Canvas.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isRecording = false;

        /**
         * @property {Blob} blob - Recorded frames in video/webm blob.
         * @memberof CanvasRecorder
         * @example
         * recorder.stop(function() {
         *     var blob = recorder.blob;
         * });
         */
        this.blob = whammy.compile();

        if (callback) {
            callback(this.blob);
        }
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;

        if (!this.disableLogs) {
            console.debug('Paused recording.');
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof CanvasRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (!this.disableLogs) {
            console.debug('Resumed recording.');
        }
    };

    function drawCanvasFrame() {
        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawCanvasFrame, 100);
        }

        window.html2canvas(htmlElement, {
            onrendered: function(canvas) {
                var duration = new Date().getTime() - lastTime;
                if (!duration) {
                    return drawCanvasFrame();
                }

                // via #206, by Jack i.e. @Seymourr
                lastTime = new Date().getTime();

                whammy.frames.push({
                    duration: duration,
                    image: canvas.toDataURL('image/webp')
                });

                if (isRecording) {
                    requestAnimationFrame(drawCanvasFrame);
                }
            }
        });
    }

    var lastTime = new Date().getTime();

    var whammy = new Whammy.Video(100);
}
// _________________
// WhammyRecorder.js

/**
 * WhammyRecorder is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It runs top over {@link Whammy}.
 * @summary Video recording feature in Chrome.
 * @typedef WhammyRecorder
 * @class
 * @example
 * var recorder = new WhammyRecorder(mediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     video.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

function WhammyRecorder(mediaStream) {
    /**
     * This method records video.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!this.width) {
            this.width = 320;
        }

        if (!this.height) {
            this.height = 240;
        }

        if (!this.video) {
            this.video = {
                width: this.width,
                height: this.height
            };
        }

        if (!this.canvas) {
            this.canvas = {
                width: this.width,
                height: this.height
            };
        }

        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        context = canvas.getContext('2d');

        // setting defaults
        if (this.video && this.video instanceof HTMLVideoElement) {
            video = this.video.cloneNode();
        } else {
            video = document.createElement('video');
            video.src = URL.createObjectURL(mediaStream);

            video.width = this.video.width;
            video.height = this.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video();

        if (!this.disableLogs) {
            console.log('canvas resolutions', canvas.width, '*', canvas.height);
            console.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);
        }

        drawFrames();
    };

    function drawFrames() {
        var duration = new Date().getTime() - lastTime;
        if (!duration) {
            return setTimeout(drawFrames, 10);
        }

        if (isPausedRecording) {
            lastTime = new Date().getTime();
            return setTimeout(drawFrames, 100);
        }

        // via #206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        if (video.paused) {
            // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
            // Tweak for Android Chrome
            video.play();
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        whammy.frames.push({
            duration: duration,
            image: canvas.toDataURL('image/webp')
        });

        if (!isStopDrawing) {
            setTimeout(drawFrames, 10);
        }
    }

    /**
     * remove black frames from the beginning to the specified frame
     * @param {Array} _frames - array of frames to be checked
     * @param {number} _framesToCheck - number of frame until check will be executed (-1 - will drop all frames until frame not matched will be found)
     * @param {number} _pixTolerance - 0 - very strict (only black pixel color) ; 1 - all
     * @param {number} _frameTolerance - 0 - very strict (only black frame color) ; 1 - all
     * @returns {Array} - array of frames
     */
    // pull#293 by @volodalexey
    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        for (var f = 0; f < endCheckFrame; f++) {
            var matchPixCount, endPixCheck, maxPixCount;

            if (!doNotCheckNext) {
                var image = new Image();
                image.src = _frames[f].image;
                context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                matchPixCount = 0;
                endPixCheck = imageData.data.length;
                maxPixCount = imageData.data.length / 4;

                for (var pix = 0; pix < endPixCheck; pix += 4) {
                    var currentColor = {
                        r: imageData.data[pix],
                        g: imageData.data[pix + 1],
                        b: imageData.data[pix + 2]
                    };
                    var colorDifference = Math.sqrt(
                        Math.pow(currentColor.r - sampleColor.r, 2) +
                        Math.pow(currentColor.g - sampleColor.g, 2) +
                        Math.pow(currentColor.b - sampleColor.b, 2)
                    );
                    // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                    if (colorDifference <= maxColorDifference * pixTolerance) {
                        matchPixCount++;
                    }
                }
            }

            if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
                // console.log('removed black frame : ' + f + ' ; frame duration ' + _frames[f].duration);
            } else {
                // console.log('frame is passed : ' + f);
                if (checkUntilNotBlack) {
                    doNotCheckNext = true;
                }
                resultFrames.push(_frames[f]);
            }
        }

        resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

        if (resultFrames.length <= 0) {
            // at least one last frame should be available for next manipulation
            // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
            resultFrames.push(_frames[_frames.length - 1]);
        }

        return resultFrames;
    }

    var isStopDrawing = false;

    /**
     * This method stops recording video.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        isStopDrawing = true;

        var _this = this;
        // analyse of all frames takes some time!
        setTimeout(function() {
            // e.g. dropBlackFrames(frames, 10, 1, 1) - will cut all 10 frames
            // e.g. dropBlackFrames(frames, 10, 0.5, 0.5) - will analyse 10 frames
            // e.g. dropBlackFrames(frames, 10) === dropBlackFrames(frames, 10, 0, 0) - will analyse 10 frames with strict black color
            whammy.frames = dropBlackFrames(whammy.frames, -1);

            // to display advertisement images!
            if (this.advertisement && this.advertisement.length) {
                whammy.frames = this.advertisement.concat(whammy.frames);
            }

            /**
             * @property {Blob} blob - Recorded frames in video/webm blob.
             * @memberof WhammyRecorder
             * @example
             * recorder.stop(function() {
             *     var blob = recorder.blob;
             * });
             */
            whammy.compile(function(blob) {
                _this.blob = blob;

                if (_this.blob.forEach) {
                    _this.blob = new Blob([], {
                        type: 'video/webm'
                    });
                }

                if (callback) {
                    callback(_this.blob);
                }
            });
        }, 10);
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;

        if (!this.disableLogs) {
            console.debug('Paused recording.');
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof WhammyRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (!this.disableLogs) {
            console.debug('Resumed recording.');
        }
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;
}
// https://github.com/antimatter15/whammy/blob/master/LICENSE
// _________
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

/**
 * Whammy is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It is written by {@link https://github.com/antimatter15|antimatter15}
 * @summary A real time javascript webm encoder based on a canvas hack.
 * @typedef Whammy
 * @class
 * @example
 * var recorder = new Whammy().Video(15);
 * recorder.add(context || canvas || dataURL);
 * var output = recorder.compile();
 */

var Whammy = (function() {
    // a more abstract-ish API

    function WhammyVideo(duration) {
        this.frames = [];
        this.duration = duration || 1;
        this.quality = 100;
    }

    /**
     * Pass Canvas or Context or image/webp(string) to {@link Whammy} encoder.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.add(canvas || context || 'image/webp');
     * @param {string} frame - Canvas || Context || image/webp
     * @param {number} duration - Stick a duration (in milliseconds)
     */
    WhammyVideo.prototype.add = function(frame, duration) {
        if ('canvas' in frame) { //CanvasRenderingContext2D
            frame = frame.canvas;
        }

        if ('toDataURL' in frame) {
            frame = frame.toDataURL('image/webp', this.quality);
        }

        if (!(/^data:image\/webp;base64,/ig).test(frame)) {
            throw 'Input must be formatted properly as a base64 encoded DataURI of type image/webp';
        }
        this.frames.push({
            image: frame,
            duration: duration || this.duration
        });
    };

    function processInWebWorker(_function) {
        var blob = URL.createObjectURL(new Blob([_function.toString(),
            'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(blob);
        URL.revokeObjectURL(blob);
        return worker;
    }

    function whammyInWebWorker(frames) {
        function ArrayToWebM(frames) {
            var info = checkFrames(frames);
            if (!info) {
                return [];
            }

            var clusterMaxDuration = 30000;

            var EBML = [{
                'id': 0x1a45dfa3, // EBML
                'data': [{
                    'data': 1,
                    'id': 0x4286 // EBMLVersion
                }, {
                    'data': 1,
                    'id': 0x42f7 // EBMLReadVersion
                }, {
                    'data': 4,
                    'id': 0x42f2 // EBMLMaxIDLength
                }, {
                    'data': 8,
                    'id': 0x42f3 // EBMLMaxSizeLength
                }, {
                    'data': 'webm',
                    'id': 0x4282 // DocType
                }, {
                    'data': 2,
                    'id': 0x4287 // DocTypeVersion
                }, {
                    'data': 2,
                    'id': 0x4285 // DocTypeReadVersion
                }]
            }, {
                'id': 0x18538067, // Segment
                'data': [{
                    'id': 0x1549a966, // Info
                    'data': [{
                        'data': 1e6, //do things in millisecs (num of nanosecs for duration scale)
                        'id': 0x2ad7b1 // TimecodeScale
                    }, {
                        'data': 'whammy',
                        'id': 0x4d80 // MuxingApp
                    }, {
                        'data': 'whammy',
                        'id': 0x5741 // WritingApp
                    }, {
                        'data': doubleToString(info.duration),
                        'id': 0x4489 // Duration
                    }]
                }, {
                    'id': 0x1654ae6b, // Tracks
                    'data': [{
                        'id': 0xae, // TrackEntry
                        'data': [{
                            'data': 1,
                            'id': 0xd7 // TrackNumber
                        }, {
                            'data': 1,
                            'id': 0x73c5 // TrackUID
                        }, {
                            'data': 0,
                            'id': 0x9c // FlagLacing
                        }, {
                            'data': 'und',
                            'id': 0x22b59c // Language
                        }, {
                            'data': 'V_VP8',
                            'id': 0x86 // CodecID
                        }, {
                            'data': 'VP8',
                            'id': 0x258688 // CodecName
                        }, {
                            'data': 1,
                            'id': 0x83 // TrackType
                        }, {
                            'id': 0xe0, // Video
                            'data': [{
                                'data': info.width,
                                'id': 0xb0 // PixelWidth
                            }, {
                                'data': info.height,
                                'id': 0xba // PixelHeight
                            }]
                        }]
                    }]
                }]
            }];

            //Generate clusters (max duration)
            var frameNumber = 0;
            var clusterTimecode = 0;
            while (frameNumber < frames.length) {

                var clusterFrames = [];
                var clusterDuration = 0;
                do {
                    clusterFrames.push(frames[frameNumber]);
                    clusterDuration += frames[frameNumber].duration;
                    frameNumber++;
                } while (frameNumber < frames.length && clusterDuration < clusterMaxDuration);

                var clusterCounter = 0;
                var cluster = {
                    'id': 0x1f43b675, // Cluster
                    'data': getClusterData(clusterTimecode, clusterCounter, clusterFrames)
                }; //Add cluster to segment
                EBML[1].data.push(cluster);
                clusterTimecode += clusterDuration;
            }

            return generateEBML(EBML);
        }

        function getClusterData(clusterTimecode, clusterCounter, clusterFrames) {
            return [{
                'data': clusterTimecode,
                'id': 0xe7 // Timecode
            }].concat(clusterFrames.map(function(webp) {
                var block = makeSimpleBlock({
                    discardable: 0,
                    frame: webp.data.slice(4),
                    invisible: 0,
                    keyframe: 1,
                    lacing: 0,
                    trackNum: 1,
                    timecode: Math.round(clusterCounter)
                });
                clusterCounter += webp.duration;
                return {
                    data: block,
                    id: 0xa3
                };
            }));
        }

        // sums the lengths of all the frames and gets the duration

        function checkFrames(frames) {
            if (!frames[0]) {
                postMessage({
                    error: 'Something went wrong. Maybe WebP format is not supported in the current browser.'
                });
                return;
            }

            var width = frames[0].width,
                height = frames[0].height,
                duration = frames[0].duration;

            for (var i = 1; i < frames.length; i++) {
                duration += frames[i].duration;
            }
            return {
                duration: duration,
                width: width,
                height: height
            };
        }

        function numToBuffer(num) {
            var parts = [];
            while (num > 0) {
                parts.push(num & 0xff);
                num = num >> 8;
            }
            return new Uint8Array(parts.reverse());
        }

        function strToBuffer(str) {
            return new Uint8Array(str.split('').map(function(e) {
                return e.charCodeAt(0);
            }));
        }

        function bitsToBuffer(bits) {
            var data = [];
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data.push(parseInt(bits.substr(i, 8), 2));
            }
            return new Uint8Array(data);
        }

        function generateEBML(json) {
            var ebml = [];
            for (var i = 0; i < json.length; i++) {
                var data = json[i].data;

                if (typeof data === 'object') {
                    data = generateEBML(data);
                }

                if (typeof data === 'number') {
                    data = bitsToBuffer(data.toString(2));
                }

                if (typeof data === 'string') {
                    data = strToBuffer(data);
                }

                var len = data.size || data.byteLength || data.length;
                var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
                var sizeToString = len.toString(2);
                var padded = (new Array((zeroes * 7 + 7 + 1) - sizeToString.length)).join('0') + sizeToString;
                var size = (new Array(zeroes)).join('0') + '1' + padded;

                ebml.push(numToBuffer(json[i].id));
                ebml.push(bitsToBuffer(size));
                ebml.push(data);
            }

            return new Blob(ebml, {
                type: 'video/webm'
            });
        }

        function toBinStrOld(bits) {
            var data = '';
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data += String.fromCharCode(parseInt(bits.substr(i, 8), 2));
            }
            return data;
        }

        function makeSimpleBlock(data) {
            var flags = 0;

            if (data.keyframe) {
                flags |= 128;
            }

            if (data.invisible) {
                flags |= 8;
            }

            if (data.lacing) {
                flags |= (data.lacing << 1);
            }

            if (data.discardable) {
                flags |= 1;
            }

            if (data.trackNum > 127) {
                throw 'TrackNumber > 127 not supported';
            }

            var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
                return String.fromCharCode(e);
            }).join('') + data.frame;

            return out;
        }

        function parseWebP(riff) {
            var VP8 = riff.RIFF[0].WEBP[0];

            var frameStart = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
            for (var i = 0, c = []; i < 4; i++) {
                c[i] = VP8.charCodeAt(frameStart + 3 + i);
            }

            var width, height, tmp;

            //the code below is literally copied verbatim from the bitstream spec
            tmp = (c[1] << 8) | c[0];
            width = tmp & 0x3FFF;
            tmp = (c[3] << 8) | c[2];
            height = tmp & 0x3FFF;
            return {
                width: width,
                height: height,
                data: VP8,
                riff: riff
            };
        }

        function getStrLength(string, offset) {
            return parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
                var unpadded = i.charCodeAt(0).toString(2);
                return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
            }).join(''), 2);
        }

        function parseRIFF(string) {
            var offset = 0;
            var chunks = {};

            while (offset < string.length) {
                var id = string.substr(offset, 4);
                var len = getStrLength(string, offset);
                var data = string.substr(offset + 4 + 4, len);
                offset += 4 + 4 + len;
                chunks[id] = chunks[id] || [];

                if (id === 'RIFF' || id === 'LIST') {
                    chunks[id].push(parseRIFF(data));
                } else {
                    chunks[id].push(data);
                }
            }
            return chunks;
        }

        function doubleToString(num) {
            return [].slice.call(
                new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
                return String.fromCharCode(e);
            }).reverse().join('');
        }

        var webm = new ArrayToWebM(frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
        }));

        postMessage(webm);
    }

    /**
     * Encodes frames in WebM container. It uses WebWorkinvoke to invoke 'ArrayToWebM' method.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.compile(function(blob) {
     *    // blob.size - blob.type
     * });
     */
    WhammyVideo.prototype.compile = function(callback) {
        var webWorker = processInWebWorker(whammyInWebWorker);

        webWorker.onmessage = function(event) {
            if (event.data.error) {
                console.error(event.data.error);
                return;
            }
            callback(event.data);
        };

        webWorker.postMessage(this.frames);
    };

    return {
        /**
         * A more abstract-ish API.
         * @method
         * @memberof Whammy
         * @example
         * recorder = new Whammy().Video(0.8, 100);
         * @param {?number} speed - 0.8
         * @param {?number} quality - 100
         */
        Video: WhammyVideo
    };
})();
// ______________ (indexed-db)
// DiskStorage.js

/**
 * DiskStorage is a standalone object used by {@link RecordRTC} to store recorded blobs in IndexedDB storage.
 * @summary Writing blobs into IndexedDB.
 * @example
 * DiskStorage.Store({
 *     audioBlob: yourAudioBlob,
 *     videoBlob: yourVideoBlob,
 *     gifBlob  : yourGifBlob
 * });
 * DiskStorage.Fetch(function(dataURL, type) {
 *     if(type === 'audioBlob') { }
 *     if(type === 'videoBlob') { }
 *     if(type === 'gifBlob')   { }
 * });
 * // DiskStorage.dataStoreName = 'recordRTC';
 * // DiskStorage.onError = function(error) { };
 * @property {function} init - This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
 * @property {function} Fetch - This method fetches stored blobs from IndexedDB.
 * @property {function} Store - This method stores blobs in IndexedDB.
 * @property {function} onError - This function is invoked for any known/unknown error.
 * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
 */


var DiskStorage = {
    /**
     * This method must be called once to initialize IndexedDB ObjectStore. Though, it is auto-used internally.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.init();
     */
    init: function() {
        var self = this;
        var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.OIndexedDB || window.msIndexedDB;
        var dbVersion = 1;
        var dbName = this.dbName || location.href.replace(/\/|:|#|%|\.|\[|\]/g, ''),
            db;
        var request = indexedDB.open(dbName, dbVersion);

        function createObjectStore(dataBase) {
            dataBase.createObjectStore(self.dataStoreName);
        }

        function putInDB() {
            var transaction = db.transaction([self.dataStoreName], 'readwrite');

            if (self.videoBlob) {
                transaction.objectStore(self.dataStoreName).put(self.videoBlob, 'videoBlob');
            }

            if (self.gifBlob) {
                transaction.objectStore(self.dataStoreName).put(self.gifBlob, 'gifBlob');
            }

            if (self.audioBlob) {
                transaction.objectStore(self.dataStoreName).put(self.audioBlob, 'audioBlob');
            }

            function getFromStore(portionName) {
                transaction.objectStore(self.dataStoreName).get(portionName).onsuccess = function(event) {
                    if (self.callback) {
                        self.callback(event.target.result, portionName);
                    }
                };
            }

            getFromStore('audioBlob');
            getFromStore('videoBlob');
            getFromStore('gifBlob');
        }

        request.onerror = self.onError;

        request.onsuccess = function() {
            db = request.result;
            db.onerror = self.onError;

            if (db.setVersion) {
                if (db.version !== dbVersion) {
                    var setVersion = db.setVersion(dbVersion);
                    setVersion.onsuccess = function() {
                        createObjectStore(db);
                        putInDB();
                    };
                } else {
                    putInDB();
                }
            } else {
                putInDB();
            }
        };
        request.onupgradeneeded = function(event) {
            createObjectStore(event.target.result);
        };
    },
    /**
     * This method fetches stored blobs from IndexedDB.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.Fetch(function(dataURL, type) {
     *     if(type === 'audioBlob') { }
     *     if(type === 'videoBlob') { }
     *     if(type === 'gifBlob')   { }
     * });
     */
    Fetch: function(callback) {
        this.callback = callback;
        this.init();

        return this;
    },
    /**
     * This method stores blobs in IndexedDB.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.Store({
     *     audioBlob: yourAudioBlob,
     *     videoBlob: yourVideoBlob,
     *     gifBlob  : yourGifBlob
     * });
     */
    Store: function(config) {
        this.audioBlob = config.audioBlob;
        this.videoBlob = config.videoBlob;
        this.gifBlob = config.gifBlob;

        this.init();

        return this;
    },
    /**
     * This function is invoked for any known/unknown error.
     * @method
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.onError = function(error){
     *     alerot( JSON.stringify(error) );
     * };
     */
    onError: function(error) {
        console.error(JSON.stringify(error, null, '\t'));
    },

    /**
     * @property {string} dataStoreName - Name of the ObjectStore created in IndexedDB storage.
     * @memberof DiskStorage
     * @internal
     * @example
     * DiskStorage.dataStoreName = 'recordRTC';
     */
    dataStoreName: 'recordRTC',
    dbName: null
};
// ______________
// GifRecorder.js

/**
 * GifRecorder is standalone calss used by {@link RecordRTC} to record video as animated gif image.
 * @typedef GifRecorder
 * @class
 * @example
 * var recorder = new GifRecorder(mediaStream);
 * recorder.record();
 * recorder.stop(function(blob) {
 *     img.src = URL.createObjectURL(blob);
 * });
 * @param {MediaStream} mediaStream - MediaStream object fetched using getUserMedia API or generated using captureStreamUntilEnded or WebAudio API.
 */

function GifRecorder(mediaStream) {
    if (!window.GIFEncoder) {
        throw 'Please link: https://cdn.webrtc-experiment.com/gif-recorder.js';
    }

    /**
     * This method records MediaStream.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.record();
     */
    this.record = function() {
        if (!this.width) {
            this.width = video.offsetWidth || 320;
        }

        if (!this.height) {
            this.height = video.offsetHeight || 240;
        }

        if (!this.video) {
            this.video = {
                width: this.width,
                height: this.height
            };
        }

        if (!this.canvas) {
            this.canvas = {
                width: this.width,
                height: this.height
            };
        }

        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        video.width = this.video.width;
        video.height = this.video.height;

        // external library to record as GIF images
        gifEncoder = new window.GIFEncoder();

        // void setRepeat(int iter) 
        // Sets the number of times the set of GIF frames should be played. 
        // Default is 1; 0 means play indefinitely.
        gifEncoder.setRepeat(0);

        // void setFrameRate(Number fps) 
        // Sets frame rate in frames per second. 
        // Equivalent to setDelay(1000/fps).
        // Using "setDelay" instead of "setFrameRate"
        gifEncoder.setDelay(this.frameRate || 200);

        // void setQuality(int quality) 
        // Sets quality of color quantization (conversion of images to the 
        // maximum 256 colors allowed by the GIF specification). 
        // Lower values (minimum = 1) produce better colors, 
        // but slow processing significantly. 10 is the default, 
        // and produces good color mapping at reasonable speeds. 
        // Values greater than 20 do not yield significant improvements in speed.
        gifEncoder.setQuality(this.quality || 10);

        // Boolean start() 
        // This writes the GIF Header and returns false if it fails.
        gifEncoder.start();

        startTime = Date.now();

        var self = this;

        function drawVideoFrame(time) {
            if (isPausedRecording) {
                return setTimeout(function() {
                    drawVideoFrame(time);
                }, 100);
            }

            lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

            if (typeof lastFrameTime === undefined) {
                lastFrameTime = time;
            }

            // ~10 fps
            if (time - lastFrameTime < 90) {
                return;
            }

            if (video.paused) {
                // via: https://github.com/muaz-khan/WebRTC-Experiment/pull/316
                // Tweak for Android Chrome
                video.play();
            }

            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (self.onGifPreview) {
                self.onGifPreview(canvas.toDataURL('image/png'));
            }

            gifEncoder.addFrame(context);
            lastFrameTime = time;
        }

        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.stop(function(blob) {
     *     img.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function() {
        if (lastAnimationFrame) {
            cancelAnimationFrame(lastAnimationFrame);
        }

        endTime = Date.now();

        /**
         * @property {Blob} blob - The recorded blob object.
         * @memberof GifRecorder
         * @example
         * recorder.stop(function(){
         *     var blob = recorder.blob;
         * });
         */
        this.blob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: 'image/gif'
        });

        // bug: find a way to clear old recorded blobs
        gifEncoder.stream().bin = [];
    };

    var isPausedRecording = false;

    /**
     * This method pauses the recording process.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        isPausedRecording = true;

        if (!this.disableLogs) {
            console.debug('Paused recording.');
        }
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof GifRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        isPausedRecording = false;

        if (!this.disableLogs) {
            console.debug('Resumed recording.');
        }
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.src = URL.createObjectURL(mediaStream);
    video.play();

    var lastAnimationFrame = null;
    var startTime, endTime, lastFrameTime;

    var gifEncoder;
}

},{}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy5udm0vdjAuMTAuMzMvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8uLi8ubnZtL3YwLjEwLjMzL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiY29udHJvbGxlcnMvY29udmVyc2F0aW9uLmpzIiwiY29udHJvbGxlcnMvbGlzdC1jb252ZXJzYXRpb25zLmpzIiwiZGF0YS9jb252ZXJzYXRpb25zLmpzb24iLCJpbmRleC5qcyIsImxpYi9jb252ZXJzYXRpb24uanMiLCJsaWIvZGlhbG9nLWl0ZW0uanMiLCJsaWIvcmVjbmV3LmpzIiwibGliL3JlY29yZC9kaXJlY3RpdmUuanMiLCJsaWIvcmVjb3JkL2luZGV4Lmh0bWwiLCJsaWIvcmVjb3JkL2luZGV4LmpzIiwibGliL3NpbXBsZS1kaXJlY3RpdmUuanMiLCJsaWIvc3BlZWNoLmpzIiwibGliL3RpbWVyLmpzIiwibm9kZV9tb2R1bGVzL1JlY29yZFJUQy9kZXYvTWVkaWFTdHJlYW1SZWNvcmRlci5qcyIsIm5vZGVfbW9kdWxlcy9SZWNvcmRSVEMvZGV2L1N0ZXJlb0F1ZGlvUmVjb3JkZXIuanMiLCJub2RlX21vZHVsZXMvUmVjb3JkUlRDL2Rldi9TdGVyZW9SZWNvcmRlci5qcyIsIm5vZGVfbW9kdWxlcy9SZWNvcmRSVEMvZGV2L1doYW1teS5qcyIsIm5vZGVfbW9kdWxlcy9SZWNvcmRSVEMvZGV2L1doYW1teVJlY29yZGVyLmpzIiwibm9kZV9tb2R1bGVzL1JlY29yZFJUQy9kZXYvd2hhbW15X3dvcmtlci5qcyIsIm5vZGVfbW9kdWxlcy9hc3luYy9saWIvYXN5bmMuanMiLCJub2RlX21vZHVsZXMvcmVjb3JkcnRjL1JlY29yZFJUQy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN01BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOWFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ25tQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuICAgIHZhciBjdXJyZW50UXVldWU7XG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHZhciBpID0gLTE7XG4gICAgICAgIHdoaWxlICgrK2kgPCBsZW4pIHtcbiAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbn1cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgcXVldWUucHVzaChmdW4pO1xuICAgIGlmICghZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlxudmFyIENvbnZlcnNhdGlvbiA9IHJlcXVpcmUoJy4uL2xpYi9jb252ZXJzYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkc3RhdGUsICRzY29wZSwgJHNjZSwgY29udmVyc2F0aW9uKSB7XG4gIC8vIGluaXRpYWxpemluZyB0aGUgc3RhdGVcbiAgaWYgKCFjb252ZXJzYXRpb24pIHtcbiAgICByZXR1cm4gJHN0YXRlLnRyYW5zaXRpb25UbygnY29udmVyc2F0aW9ucy5saXN0Jyk7XG4gIH1cbiAgJHNjb3BlLmdhbWUgPSBuZXcgQ29udmVyc2F0aW9uKGNvbnZlcnNhdGlvbiwgdXBkYXRlKVxuXG4gICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICRzY29wZS5nYW1lLmVuZCgpO1xuICB9KVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICBpZiAoISRzY29wZS4kJHBoYXNlKSB7XG4gICAgICB0cnkge1xuICAgICAgICAkc2NvcGUuJGRpZ2VzdCgpXG4gICAgICB9IGNhdGNoIChlKSB7fVxuICAgIH1cbiAgfVxuXG4gIGlmIChsb2NhbFN0b3JhZ2UuREVCVUdfQ09OVkVSU0UpIHtcbiAgICAkc2NvcGUuZ2FtZS5zdGFydCgpXG4gIH1cbn1cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkc2NvcGUsIGNvbnZlcnNhdGlvbnMpIHtcbiAgJHNjb3BlLmNvbnZlcnNhdGlvbnMgPSBjb252ZXJzYXRpb25zXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzPVtcbiAge1xuICAgIFwiZGlhbG9nXCI6IFtcbiAgICAgIHtcbiAgICAgICAgXCJwcm9tcHRcIjogXCJIZWxsbywgd2hhdCBpcyB5b3VyIG5hbWU/XCIsIFxuICAgICAgICBcImFuc3dlcl9hdWRpb1wiOiBcIm15bmFtZS53YXZcIiwgXG4gICAgICAgIFwiYW5zd2VyX2R1cmF0aW9uXCI6IDIuMzc1LCBcbiAgICAgICAgXCJhbnN3ZXJzXCI6IFtcbiAgICAgICAgICBcIk15IG5hbWUgaXMgU3RlcGhlbi5cIlxuICAgICAgICBdLCBcbiAgICAgICAgXCJwcm9tcHRfYXVkaW9cIjogXCJ3aGF0LW5hbWUud2F2XCIsIFxuICAgICAgICBcInByb21wdF9kdXJhdGlvblwiOiAyLjYyNVxuICAgICAgfSwgXG4gICAgICB7XG4gICAgICAgIFwicHJvbXB0XCI6IFwiSG93IG9sZCBhcmUgeW91P1wiLCBcbiAgICAgICAgXCJhbnN3ZXJfYXVkaW9cIjogXCJteWFnZS53YXZcIiwgXG4gICAgICAgIFwiYW5zd2VyX2R1cmF0aW9uXCI6IDMuNjI1LCBcbiAgICAgICAgXCJhbnN3ZXJzXCI6IFtcbiAgICAgICAgICBcIkkgYW0gMTcgeWVhcnMgb2xkLlwiXG4gICAgICAgIF0sIFxuICAgICAgICBcInByb21wdF9hdWRpb1wiOiBcImhvdy1vbGQud2F2XCIsIFxuICAgICAgICBcInByb21wdF9kdXJhdGlvblwiOiAxLjc1XG4gICAgICB9LCBcbiAgICAgIHtcbiAgICAgICAgXCJwcm9tcHRcIjogXCJIb3cgbWFueSBicm90aGVycyBhbmQgc2lzdGVycyBkbyB5b3UgaGF2ZT9cIiwgXG4gICAgICAgIFwiYW5zd2VyX2F1ZGlvXCI6IFwibXlzaWJsaW5ncy53YXZcIiwgXG4gICAgICAgIFwiYW5zd2VyX2R1cmF0aW9uXCI6IDMuNSwgXG4gICAgICAgIFwiYW5zd2Vyc1wiOiBbXG4gICAgICAgICAgXCJJIGhhdmUgMiBicm90aGVycyBhbmQgMSBzaXN0ZXIuXCJcbiAgICAgICAgXSwgXG4gICAgICAgIFwicHJvbXB0X2F1ZGlvXCI6IFwiaG93LXNpYmxpbmdzLndhdlwiLCBcbiAgICAgICAgXCJwcm9tcHRfZHVyYXRpb25cIjogMy41XG4gICAgICB9LCBcbiAgICAgIHtcbiAgICAgICAgXCJwcm9tcHRcIjogXCJXaG8gZG8geW91IHdvcmsgZm9yP1wiLCBcbiAgICAgICAgXCJhbnN3ZXJfYXVkaW9cIjogXCJteWVtcGxveWVyLndhdlwiLCBcbiAgICAgICAgXCJhbnN3ZXJfZHVyYXRpb25cIjogMi44NzUsIFxuICAgICAgICBcImFuc3dlcnNcIjogW1xuICAgICAgICAgIFwiSSB3b3JrIGZvciBhIHNjaG9vbC5cIlxuICAgICAgICBdLCBcbiAgICAgICAgXCJwcm9tcHRfYXVkaW9cIjogXCJ3aG8tZW1wbG95ZXIud2F2XCIsIFxuICAgICAgICBcInByb21wdF9kdXJhdGlvblwiOiAyLjBcbiAgICAgIH0sIFxuICAgICAge1xuICAgICAgICBcInByb21wdFwiOiBcIldoYXQgZG8geW91IGRvIGluIHlvdXIgam9iP1wiLCBcbiAgICAgICAgXCJhbnN3ZXJfYXVkaW9cIjogXCJteWpvYi53YXZcIiwgXG4gICAgICAgIFwiYW5zd2VyX2R1cmF0aW9uXCI6IDQuMTI1LCBcbiAgICAgICAgXCJhbnN3ZXJzXCI6IFtcbiAgICAgICAgICBcIkkgdGVhY2ggbWF0aCB0byB0aGlyZCBncmFkZSBzdHVkZW50cy5cIlxuICAgICAgICBdLCBcbiAgICAgICAgXCJwcm9tcHRfYXVkaW9cIjogXCJ3aGF0LWpvYi53YXZcIiwgXG4gICAgICAgIFwicHJvbXB0X2R1cmF0aW9uXCI6IDIuMTI1XG4gICAgICB9XG4gICAgXSwgXG4gICAgXCJ0aXRsZVwiOiBcIkZpcnN0IENvbnZlcnNhdGlvblwiXG4gIH1cbl0iLCJcbnZhciBTaW1wbGVEaXJlY3RpdmUgPSByZXF1aXJlKCcuL2xpYi9zaW1wbGUtZGlyZWN0aXZlJylcbiAgLCBDb252ZXJzYXRpb24gPSByZXF1aXJlKCcuL2xpYi9jb252ZXJzYXRpb24nKVxuICAsIERpYWxvZ0l0ZW0gPSByZXF1aXJlKCcuL2xpYi9kaWFsb2ctaXRlbScpXG5cbmZ1bmN0aW9uIGlQcm9taXNlZCgkcSwgZGF0YSkge1xuICB2YXIgcCA9ICRxLmRlZmVyKClcbiAgcC5yZXNvbHZlKGRhdGEpXG4gIHJldHVybiBwLnByb21pc2Vcbn1cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdjb252ZXJzZScsIFsndWkucm91dGVyJ10pXG4gIC8vIFRPRE8gbWFrZSB0aGlzIHRhbGsgdG8gYSBiYWNrZW5kIGVuZHBvaW50XG4gIC5zZXJ2aWNlKCdnZXRDb252ZXJzYXRpb25zJywgZnVuY3Rpb24gKCRxKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBpUHJvbWlzZWQoJHEsIHJlcXVpcmUoJy4vZGF0YS9jb252ZXJzYXRpb25zLmpzb24nKSlcbiAgICB9XG4gIH0pXG4gIC5zZXJ2aWNlKCdnZXRDb252ZXJzYXRpb24nLCBmdW5jdGlvbiAoJHEpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGlkKSB7XG4gICAgICByZXR1cm4gaVByb21pc2VkKCRxLCByZXF1aXJlKCcuL2RhdGEvY29udmVyc2F0aW9ucy5qc29uJylbaWRdKVxuICAgIH1cbiAgfSlcblxuICAuZGlyZWN0aXZlKCdyZWNvcmQnLCByZXF1aXJlKCcuL2xpYi9yZWNvcmQvZGlyZWN0aXZlJykpXG4gIC5kaXJlY3RpdmUoJ3RpbWVyJywgcmVxdWlyZSgnLi9saWIvdGltZXInKSlcblxuICAuZGlyZWN0aXZlKCdkaWFsb2dJdGVtJywgZnVuY3Rpb24gZGlhbG9nSXRlbSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc2NvcGU6IHtwYXN0SXRlbXM6ICc9JywgZGF0YTogJz0nLCBvbkRvbmU6ICc9Jywgc3RyZWFtOiAnPScsIHRpbWU6ICc9J30sXG4gICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2RpYWxvZy1pdGVtLmh0bWwnLFxuICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRzY2UpIHtcbiAgICAgICAgJHNjb3BlLmRpYWxvZyA9IG5ldyBEaWFsb2dJdGVtKCRzY29wZS5kYXRhLCAkc2NvcGUuc3RyZWFtLCAkc2NvcGUudGltZSwgJHNjb3BlLiRkaWdlc3QuYmluZCgkc2NvcGUpKTtcbiAgICAgICAgJHNjb3BlLiR3YXRjaCgnZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgJHNjb3BlLmRpYWxvZyA9IG5ldyBEaWFsb2dJdGVtKGRhdGEsICRzY29wZS5zdHJlYW0sICRzY29wZS50aW1lLCAkc2NvcGUuJGRpZ2VzdC5iaW5kKCRzY29wZSkpO1xuICAgICAgICB9KVxuICAgICAgICAkc2NvcGUuJHdhdGNoKCdzdHJlYW0nLCBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgJHNjb3BlLmRpYWxvZy5zdHJlYW0gPSBzdHJlYW1cbiAgICAgICAgICAkc2NvcGUucHJldmlld1VybCA9ICRzY2UudHJ1c3RBc1Jlc291cmNlVXJsKHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKHN0cmVhbSkpXG4gICAgICAgIH0pXG4gICAgICAgICRzY29wZS4kd2F0Y2goJ2RpYWxvZy5zdGF0ZScsIGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ3N0YXJ0ZWQnKSB7XG4gICAgICAgICAgICAkZWxlbWVudC5maW5kKCd2aWRlbycpWzBdLnBsYXkoKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkZWxlbWVudC5maW5kKCd2aWRlbycpWzBdLnBhdXNlKClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgICRlbGVtZW50LmZpbmQoJ3ZpZGVvJylbMF0ubXV0ZWQgPSB0cnVlXG4gICAgICAgICRzY29wZS4kb24oJyRkZXN0cm95JywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICRzY29wZS5kaWFsb2cuc3RvcCgpXG4gICAgICAgIH0pXG4gICAgICB9LFxuICAgIH1cbiAgfSlcblxuICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9jb252ZXJzYXRpb25zL2xpc3QnKTtcblxuICAgIC8vIE5vdyBzZXQgdXAgdGhlIHN0YXRlc1xuICAgICRzdGF0ZVByb3ZpZGVyXG4gICAgICAuc3RhdGUoJ2NvbnZlcnNhdGlvbnMnLCB7XG4gICAgICAgIHVybDogXCIvY29udmVyc2F0aW9uc1wiLFxuICAgICAgICB0ZW1wbGF0ZVVybDogXCJ2aWV3cy9jb252ZXJzYXRpb25zLmh0bWxcIixcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdwcm9taXNpbmcnKTtcbiAgICAgICAgfSxcbiAgICAgIH0pXG4gICAgICAuc3RhdGUoJ2NvbnZlcnNhdGlvbnMubGlzdCcsIHtcbiAgICAgICAgdXJsOiBcIi9saXN0XCIsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBcInZpZXdzL2NvbnZlcnNhdGlvbnMubGlzdC5odG1sXCIsXG4gICAgICAgIGNvbnRyb2xsZXI6IHJlcXVpcmUoJy4vY29udHJvbGxlcnMvbGlzdC1jb252ZXJzYXRpb25zJyksXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICBjb252ZXJzYXRpb25zOiBmdW5jdGlvbiAoZ2V0Q29udmVyc2F0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIGdldENvbnZlcnNhdGlvbnMoKVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdjb252ZXJzYXRpb25zLnBsYXknLCB7XG4gICAgICAgIHVybDogJy86aWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3ZpZXdzL2NvbnZlcnNhdGlvbi5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogcmVxdWlyZSgnLi9jb250cm9sbGVycy9jb252ZXJzYXRpb24nKSxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgIGNvbnZlcnNhdGlvbjogZnVuY3Rpb24gKGdldENvbnZlcnNhdGlvbiwgJHN0YXRlUGFyYW1zKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0Q29udmVyc2F0aW9uKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICB9KTtcblxuIiwiXG52YXIgRGlhbG9nSXRlbSA9IHJlcXVpcmUoJy4vZGlhbG9nLWl0ZW0nKVxuXG52YXIgRkFTVF9MSU1JVCA9IDFcbnZhciBNRURfTElNSVQgPSAxLjVcbnZhciBTTE9XX0xJTUlUID0gMlxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbnZlcnNhdGlvblxuXG5mdW5jdGlvbiBDb252ZXJzYXRpb24oZGF0YSwgb25VcGRhdGVkKSB7XG4gIHRoaXMudGl0bGUgPSBkYXRhLnRpdGxlXG4gIHRoaXMuZGlhbG9nID0gZGF0YS5kaWFsb2dcbiAgdGhpcy5zdGF0ZSA9ICd1bnN0YXJ0ZWQnXG4gIHRoaXMuaW5kZXggPSAwXG4gIHRoaXMubGVuZ3RoID0gdGhpcy5kaWFsb2cubGVuZ3RoXG4gIHRoaXMub25VcGRhdGVkID0gb25VcGRhdGVkXG4gIC8vIHRoaXMuZGlhbG9ncyA9IGRhdGEuZGlhbG9nLm1hcChmdW5jdGlvbiAoZGF0YSkge3JldHVybiBuZXcgRGlhbG9nSXRlbShkYXRhKX0pXG4gIHRoaXMuc2NvcmUgPSAwO1xuICB0aGlzLm5leHQgPSB0aGlzLm5leHQuYmluZCh0aGlzKVxufVxuXG5Db252ZXJzYXRpb24ucHJvdG90eXBlID0ge1xuICBzdGFydDogZnVuY3Rpb24gKHNwZWVkKSB7XG4gICAgdGhpcy5zdGF0ZSA9ICdzdGFydGluZydcbiAgICB0aGlzLnNwZWVkID0gc3BlZWRcblxuICAgIG5hdmlnYXRvci5nZXRVc2VyTWVkaWEoXG4gICAgICB7YXVkaW86IHRydWUsIHZpZGVvOiB0cnVlfSxcbiAgICAgIHRoaXMub25TdGFydGVkLmJpbmQodGhpcyksXG4gICAgICBmdW5jdGlvbiBvbkVycm9yKGVycm9yKSB7XG4gICAgICAgIGFsZXJ0KCdmYWlscyEnKVxuICAgICAgICB0aGlzLnN0YXRlID0gJ2Vycm9yJ1xuICAgICAgICB0aGlzLmVycm9yID0gZXJyb3JcbiAgICAgICAgdGhpcy5vblVwZGF0ZWQoKVxuICAgICAgfS5iaW5kKHRoaXMpXG4gICAgKTtcbiAgfSxcblxuICBnZXRUaW1lTGltaXQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICghdGhpcy5zcGVlZCkgcmV0dXJuIG51bGxcbiAgICBpZiAodGhpcy5zcGVlZCA9PT0gJ2Zhc3QnKSByZXR1cm4gRkFTVF9MSU1JVFxuICAgIGlmICh0aGlzLnNwZWVkID09PSAnbWVkaXVtJykgcmV0dXJuIE1FRF9MSU1JVFxuICAgIHJldHVybiBTTE9XX0xJTUlUXG4gIH0sXG5cbiAgb25TdGFydGVkOiBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgdGhpcy5tZWRpYVN0cmVhbSA9IHN0cmVhbVxuICAgIHRoaXMuc3RhdGUgPSAncnVubmluZydcbiAgICB0aGlzLmluZGV4ID0gMFxuICAgIHRoaXMuc2NvcmUgPSAwO1xuICAgIHRoaXMub25VcGRhdGVkKClcbiAgfSxcblxuICBnZXRDdXJyZW50RGlhbG9nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlhbG9nW3RoaXMuaW5kZXhdXG4gIH0sXG5cbiAgbmV4dDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc2NvcmUgKz0gMTtcbiAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMubGVuZ3RoIC0gMSkge1xuICAgICAgdGhpcy5pbmRleCArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuZCgpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgdGhpcy5vblVwZGF0ZWQoKVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH0sXG5cbiAgZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPT09ICdmaW5pc2hlZCcpIHJldHVyblxuICAgIHRoaXMuc3RhdGUgPSAnZmluaXNoZWQnXG4gICAgdGhpcy5tZWRpYVN0cmVhbS5zdG9wKClcbiAgfVxufVxuIiwiXG52YXIgc3RhcnRTcGVlY2ggPSByZXF1aXJlKCcuL3NwZWVjaCcpXG4gICwgcmVjb3JkZXIgPSByZXF1aXJlKCcuL3JlY25ldycpXG5cbm1vZHVsZS5leHBvcnRzID0gRGlhbG9nSXRlbVxuXG5mdW5jdGlvbiBEaWFsb2dJdGVtKGRhdGEsIHN0cmVhbSwgdGltZSwgb25VcGRhdGUpIHtcbiAgdGhpcy5kYXRhID0gZGF0YVxuICB0aGlzLnN0cmVhbSA9IHN0cmVhbVxuICB0aGlzLmZpbmFsV29yZHMgPSBbXVxuICB0aGlzLmludGVyaW1Xb3JkcyA9IFtdXG4gIHRoaXMub25VcGRhdGUgPSBvblVwZGF0ZVxuICB0aGlzLnN0YXRlID0gJ3Byb21wdCdcbiAgLy8gdGhpcy5zdGFydCgpXG4gIHRoaXMub25TdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnN0YXJ0KClcbiAgICB0aGlzLm9uVXBkYXRlKClcbiAgfS5iaW5kKHRoaXMpXG4gIHRoaXMuc3RhcnQgPSB0aGlzLnN0YXJ0LmJpbmQodGhpcylcbiAgdGhpcy5zdG9wID0gdGhpcy5zdG9wLmJpbmQodGhpcylcbiAgdGhpcy5wcm9tcHRBdWRpbyA9ICdkYXRhL2F1ZGlvLycgKyBkYXRhLnByb21wdF9hdWRpb1xuICB0aGlzLnByb21wdFRpbWUgPSBkYXRhLnByb21wdF9kdXJhdGlvblxuICB0aGlzLmFuc3dlckF1ZGlvID0gJ2RhdGEvYXVkaW8vJyArIGRhdGEuYW5zd2VyX2F1ZGlvXG4gIGlmICh0aW1lKSB7XG4gICAgdGhpcy5pc1RpbWVkID0gdHJ1ZVxuICAgIHRoaXMudGltZUxpbWl0ID0gZGF0YS5hbnN3ZXJfZHVyYXRpb24gKiB0aW1lXG4gIH1cbn1cblxuRGlhbG9nSXRlbS5wcm90b3R5cGUgPSB7XG4gIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gdGhpcy5zdGFydFJlY29nbml6aW5nKClcbiAgICB0aGlzLnN0YXRlID0gJ3N0YXJ0aW5nJ1xuICAgIHRoaXMuc3RhcnRSZWNvcmRpbmcoKVxuICB9LFxuXG4gIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZSAhPT0gJ3N0YXJ0ZWQnKSByZXR1cm5cbiAgICB0aGlzLnN0YXRlID0gJ3Byb2Nlc3NpbmcnXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMub25VcGRhdGUoKVxuICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgLy8gdGhpcy5yZWMuc3RvcCgpXG4gICAgdGhpcy5zdG9wUmVjb3JkaW5nKHRoaXMuZG9uZVJlY29yZGluZy5iaW5kKHRoaXMpKVxuICB9LFxuXG4gIGRvbmVSZWNvcmRpbmc6IGZ1bmN0aW9uIChhdWRpbywgdmlkZW8pIHtcbiAgICB0aGlzLnZhbGlkYXRlKClcbiAgICB0aGlzLm9uVXBkYXRlKClcbiAgfSxcblxuICBzdGFydFJlY29yZGluZzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuc3RvcFJlY29yZGluZyA9IHJlY29yZGVyKHRoaXMuc3RyZWFtLCBmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnc3RhcnRlZCcpXG4gICAgICB0aGlzLnN0YXRlID0gJ3N0YXJ0ZWQnXG4gICAgICB0aGlzLm9uVXBkYXRlKClcbiAgICB9LmJpbmQodGhpcykpXG4gIH0sXG5cbiAgc3RhcnRSZWNvZ25pemluZzogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMucmVjID0gc3RhcnRTcGVlY2goe1xuICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5zdGF0ZSA9ICdzdGFydGVkJ1xuICAgICAgICB0aGlzLmZpbmFsV29yZHMgPSBbXVxuICAgICAgICB0aGlzLmludGVyaW1Xb3JkcyA9IFtdXG4gICAgICAgIHRoaXMub25VcGRhdGUoKVxuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICB0aGlzLnN0YXRlID0gJ2Vycm9yJ1xuICAgICAgICB0aGlzLmVycm9yID0gZXJyb3JcbiAgICAgICAgdGhpcy5vblVwZGF0ZSgpXG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgICByZXN1bHQ6IGZ1bmN0aW9uIChyZXN1bHRzLCBpbmRleCkge1xuICAgICAgICB0aGlzLmludGVyaW1Xb3JkcyA9IFtdXG4gICAgICAgIGZvciAodmFyIGk9aW5kZXg7IGk8cmVzdWx0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIGlmIChyZXN1bHRzW2ldLmlzRmluYWwpIHtcbiAgICAgICAgICAgIHRoaXMuZmluYWxXb3Jkcy5wdXNoKHJlc3VsdHNbaV1bMF0udHJhbnNjcmlwdClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pbnRlcmltV29yZHMucHVzaChyZXN1bHRzW2ldWzBdLnRyYW5zY3JpcHQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMub25VcGRhdGUoKVxuICAgICAgfS5iaW5kKHRoaXMpLFxuICAgICAgZW5kOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIFRPRE8gbWFrZSB0aGlzIGJldHRlciAtIGlzIHRoZXJlIHNvbWUgaW5mb3MgdG8gc2VuZCBiYWNrP1xuICAgICAgICAvLyB0aGlzLnZhbGlkYXRlKClcbiAgICAgICAgLy8gdGhpcy5vblVwZGF0ZSgpXG4gICAgICB9LmJpbmQodGhpcyksXG4gICAgfSlcbiAgfSxcblxuICB2YWxpZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIGNvbnNvbGUubG9nKCdkb25lJylcbiAgICB0aGlzLnN0YXRlID0gJ2RvbmUtdmFsaWQnXG4gIH1cbn1cblxuIiwiXG52YXIgTWVkaWFTdHJlYW1SZWNvcmRlciA9IHJlcXVpcmUoJ1JlY29yZFJUQy9kZXYvTWVkaWFTdHJlYW1SZWNvcmRlcicpXG52YXIgV2hhbW15UmVjb3JkZXIgPSByZXF1aXJlKCdSZWNvcmRSVEMvZGV2L1doYW1teVJlY29yZGVyJylcbnZhciBTdGVyZW9SZWNvcmRlciA9IHJlcXVpcmUoJ1JlY29yZFJUQy9kZXYvU3RlcmVvUmVjb3JkZXInKVxudmFyIGFzeW5jID0gcmVxdWlyZSgnYXN5bmMnKVxuXG52YXIgaXNDaHJvbWUgPSAhbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYTtcblxuLy8gVE9ETyBoYXZlIGEgdGltZW91dCBoZXJlIChhIHNlY29uZCBvciBzbyksIHNvIGlmIHRoZSBSZWNvcmRlciBpbnN0YW5jZVxuLy8gZG9lc24ndCBzdGFydCB1cCwgd2UgY2FuIHNob3cgYSBoZWxwZnVsIGVycm9yIG1lc3NhZ2UuXG5cbm1vZHVsZS5leHBvcnRzID0gaXNDaHJvbWUgPyByZWNvcmRDaHJvbWUgOiByZWNvcmRNb3pcblxuZnVuY3Rpb24gcmVjb3JkQ2hyb21lKHN0cmVhbSwgb25TdGFydGVkKSB7XG4gIHZhciBzdGVyZW8gPSBuZXcgU3RlcmVvUmVjb3JkZXIoc3RyZWFtKVxuICB2YXIgd2hhbW15ID0gbmV3IFdoYW1teVJlY29yZGVyKHN0cmVhbSlcbiAgc3RlcmVvLnJlY29yZCgpXG4gIHN0ZXJlby5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgd2hhbW15LnJlY29yZCgpXG4gICAgb25TdGFydGVkKClcbiAgfVxuICByZXR1cm4gZnVuY3Rpb24gc3RvcChkb25lKSB7XG4gICAgYXN5bmMucGFyYWxsZWwoe1xuICAgICAgdmlkZW86IGZ1bmN0aW9uIChuZXh0KSB7d2hhbW15LnN0b3AoZnVuY3Rpb24gKCkge25leHQobnVsbCwgd2hhbW15LmJsb2IpfSl9LFxuICAgICAgYXVkaW86IGZ1bmN0aW9uIChuZXh0KSB7c3RlcmVvLnN0b3AoZnVuY3Rpb24gKCkge25leHQobnVsbCwgc3RlcmVvLmJsb2IpfSl9LFxuICAgIH0sIGZ1bmN0aW9uIChlcnIsIGJsb2JzKSB7XG4gICAgICBkb25lKG51bGwsIGJsb2JzKVxuICAgIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVjb3JkTW96KHN0cmVhbSwgb25TdGFydGVkKSB7XG4gIHZhciByZWNvcmRlciA9IG5ldyBNZWRpYVN0cmVhbVJlY29yZGVyKHN0cmVhbSlcbiAgcmVjb3JkZXIucmVjb3JkKClcbiAgc3RlcmVvLm9uQXVkaW9Qcm9jZXNzU3RhcnRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBvblN0YXJ0ZWQoKVxuICB9XG4gIHJldHVybiBmdW5jdGlvbiBzdG9wKGRvbmUpIHtcbiAgICByZWNvcmRlci5zdG9wKGZ1bmN0aW9uICgpIHtcbiAgICAgIGRvbmUobnVsbCwgcmVjb3JkZXIuYmxvYilcbiAgICB9KVxuICB9XG59XG4iLCJcbnZhciBSZWNvcmRlciA9IHJlcXVpcmUoJy4vJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiByZWNvcmREaXJlY3RpdmUoKSB7XG4gIHJldHVybiB7XG4gICAgc2NvcGU6IHtcbiAgICAgIG9uRG9uZTogJz0nLFxuICAgICAgYXV0b3N0YXJ0OiAnPScsXG4gICAgfSxcbiAgICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi9pbmRleC5odG1sJyksXG4gICAgY29udHJvbGxlcjogZnVuY3Rpb24gKCRzY29wZSwgJGVsZW1lbnQsICRzY2UpIHtcbiAgICAgICRzY29wZS5wcmV2aWV3VXJsID0gbnVsbDtcbiAgICAgICRzY29wZS5yZWNvcmRlciA9IG5ldyBSZWNvcmRlcih7XG4gICAgICAgIG9uRG9uZTogJHNjb3BlLm9uRG9uZSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIH0sXG4gICAgICAgIG9uVXBkYXRlOiAkc2NvcGUuJGRpZ2VzdC5iaW5kKCRzY29wZSksXG4gICAgICAgIG9uUHJldmlldzogZnVuY3Rpb24gKHVybCkge1xuICAgICAgICAgIGlmICghdXJsKSB7XG4gICAgICAgICAgICAkc2NvcGUucHJldmlld1VybCA9IG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRzY29wZS5wcmV2aWV3VXJsID0gJHNjZS50cnVzdEFzUmVzb3VyY2VVcmwodXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gdmFyIHZpZGVvID0gJGVsZW1lbnQuY2hpbGRyZW4oJ3ZpZGVvJylbMF1cbiAgICAgICAgICAvLyB2aWRlby5zcmMgPSB1cmw7XG4gICAgICAgICAgLy8gdmlkZW8ucGxheSgpXG4gICAgICAgICAgaWYgKCEkc2NvcGUuJCRwaGFzZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKVxuICAgICAgICAgICAgfSBjYXRjaChlKSB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICAvLyB2aWRlb0VsZW1lbnQucGxheSgpO1xuICAgICAgICAgIC8vIHZpZGVvRWxlbWVudC5tdXRlZCA9IHRydWU7XG4gICAgICAgICAgLy8gdmlkZW9FbGVtZW50LmNvbnRyb2xzID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBpZiAoJHNjb3BlLmF1dG9zdGFydCkge1xuICAgICAgICAkc2NvcGUucmVjb3JkZXIuc3RhcnQoKVxuICAgICAgfVxuICAgIH0sXG4gICAgICAvKlxuICAgICAgJHNjb3BlLiR3YXRjaCgnZGF0YScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICRzY29wZS5kaWFsb2cgPSBuZXcgRGlhbG9nSXRlbShkYXRhLCAkc2NvcGUuJGRpZ2VzdC5iaW5kKCRzY29wZSkpO1xuICAgICAgfSlcbiAgICAgICovXG4gIH1cbn1cblxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9ICc8IS0tIHRvZG8gbWFrZSB0aGlzIGEgc3dpdGNoPyAtLT5cXG48YnV0dG9uIG5nLWNsaWNrPVwicmVjb3JkZXIuc3RhcnQoKVwiIG5nLWRpc2FibGVkPVwiIXJlY29yZGVyLmNhblN0YXJ0XCI+U3RhcnQgUmVjb3JkaW5nPC9idXR0b24+XFxuPGJ1dHRvbiBuZy1jbGljaz1cInJlY29yZGVyLnN0b3AoKVwiIG5nLWRpc2FibGVkPVwiIXJlY29yZGVyLmNhblN0b3BcIj5TdG9wIFJlY29yZGluZzwvYnV0dG9uPlxcbjx2aWRlbyBuZy1zcmM9XCJ7e3ByZXZpZXdVcmx9fVwiIG11dGVkPVwidHJ1ZVwiIG5nLXNob3c9XCIhIXByZXZpZXdVcmxcIiBhdXRvcGxheT48L3ZpZGVvPlxcblxcblxcbic7IiwiXG52YXIgUmVjb3JkUlRDID0gcmVxdWlyZSgncmVjb3JkcnRjJylcblxubW9kdWxlLmV4cG9ydHMgPSBSZWNvcmRlclxuXG5mdW5jdGlvbiBSZWNvcmRlcihjb25maWcpIHtcbiAgdGhpcy5yZWNvcmRpbmcgPSBmYWxzZVxuICB0aGlzLmNhblN0YXJ0ID0gdHJ1ZVxuICB0aGlzLmNhblN0b3AgPSBmYWxzZVxuXG4gIHRoaXMub25Eb25lID0gY29uZmlnLm9uRG9uZVxuICB0aGlzLm9uVXBkYXRlID0gY29uZmlnLm9uVXBkYXRlXG4gIHRoaXMub25QcmV2aWV3ID0gY29uZmlnLm9uUHJldmlld1xuXG4gIHRoaXMuYXVkaW9SZWNvcmRlcjtcbiAgdGhpcy52aWRlb1JlY29yZGVyO1xuXG4gIC8vIEZpcmVmb3ggY2FuIHJlY29yZCBib3RoIGF1ZGlvL3ZpZGVvIGluIHNpbmdsZSB3ZWJtIGNvbnRhaW5lclxuICAvLyBEb24ndCBuZWVkIHRvIGNyZWF0ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIFJlY29yZFJUQyBmb3IgRmlyZWZveFxuICAvLyBZb3UgY2FuIGV2ZW4gdXNlIGJlbG93IHByb3BlcnR5IHRvIGZvcmNlIHJlY29yZGluZyBvbmx5IGF1ZGlvIGJsb2Igb24gY2hyb21lXG4gIC8vIHZhciBpc1JlY29yZE9ubHlBdWRpbyA9IHRydWU7XG4gIHRoaXMuaXNSZWNvcmRPbmx5QXVkaW8gPSAhIW5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWE7XG5cbn1cblxuUmVjb3JkZXIucHJvdG90eXBlID0ge1xuICBvblN0YXJ0ZWQ6IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICB0aGlzLmNhblN0b3AgPSB0cnVlXG4gICAgdGhpcy5tZWRpYVN0cmVhbSA9IHN0cmVhbTtcblxuXG4gICAgLy8gaXQgaXMgc2Vjb25kIHBhcmFtZXRlciBvZiB0aGUgUmVjb3JkUlRDXG4gICAgdmFyIGF1ZGlvQ29uZmlnID0ge307XG4gICAgaWYgKCF0aGlzLmlzUmVjb3JkT25seUF1ZGlvKSB7XG4gICAgICBhdWRpb0NvbmZpZy5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gaW52b2tlIHZpZGVvIHJlY29yZGVyIGluIHRoaXMgY2FsbGJhY2tcbiAgICAgICAgLy8gdG8gZ2V0IG1heGltdW0gc3luY1xuICAgICAgICB0aGlzLnZpZGVvUmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTtcbiAgICAgIH0uYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLmF1ZGlvUmVjb3JkZXIgPSBSZWNvcmRSVEMoc3RyZWFtLCBhdWRpb0NvbmZpZyk7XG5cbiAgICBpZiAoIXRoaXMuaXNSZWNvcmRPbmx5QXVkaW8pIHtcbiAgICAgIC8vIGl0IGlzIHNlY29uZCBwYXJhbWV0ZXIgb2YgdGhlIFJlY29yZFJUQ1xuICAgICAgdmFyIHZpZGVvQ29uZmlnID0ge1xuICAgICAgICB0eXBlOiAndmlkZW8nXG4gICAgICB9O1xuICAgICAgdGhpcy52aWRlb1JlY29yZGVyID0gUmVjb3JkUlRDKHN0cmVhbSwgdmlkZW9Db25maWcpO1xuICAgIH1cblxuICAgIHRoaXMuYXVkaW9SZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xuXG4gICAgLy8gdGhpcy5wcmV2aWV3VXJsID0gXG4gICAgdGhpcy5vblByZXZpZXcod2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKSk7XG4gICAgLy8gdGhpcy5vblVwZGF0ZSgpXG4gIH0sXG4gIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZWNvcmRpbmcgPSB0cnVlXG4gICAgdGhpcy5jYW5TdGFydCA9IGZhbHNlXG4gICAgdGhpcy5jYW5TdG9wID0gZmFsc2VcbiAgICBuYXZpZ2F0b3IuZ2V0VXNlck1lZGlhKFxuICAgICAge2F1ZGlvOiB0cnVlLCB2aWRlbzogdHJ1ZX0sXG4gICAgICB0aGlzLm9uU3RhcnRlZC5iaW5kKHRoaXMpLFxuICAgICAgZnVuY3Rpb24gb25FcnJvcihlcnJvcikge1xuICAgICAgICBhbGVydCgnZmFpbHMhJylcbiAgICAgICAgdGhpcy5jYW5TdG9wID0gZmFsc2VcbiAgICAgICAgdGhpcy5jYW5TdGFydCA9IHRydWVcbiAgICAgIH0uYmluZCh0aGlzKVxuICAgICk7XG4gIH0sXG5cbiAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5jYW5TdG9wKSByZXR1cm5cbiAgICB0aGlzLmNhblN0b3AgPSBmYWxzZVxuXG4gICAgaWYgKHRoaXMuaXNSZWNvcmRPbmx5QXVkaW8pIHtcbiAgICAgIHRoaXMuYXVkaW9SZWNvcmRlci5zdG9wUmVjb3JkaW5nKG9uU3RvcFJlY29yZGluZyk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmlzUmVjb3JkT25seUF1ZGlvKSB7XG4gICAgICB0aGlzLmF1ZGlvUmVjb3JkZXIuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdGhpcy5vblN0b3BwZWQoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgdGhpcy5vblByZXZpZXcobnVsbClcbiAgfSxcblxuICBvblN0b3BwZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnJlY29yZGluZyA9IGZhbHNlXG5cbiAgICB0aGlzLmF1ZGlvUmVjb3JkZXIuZ2V0RGF0YVVSTChmdW5jdGlvbihhdWRpb0RhdGFVUkwpIHtcbiAgICAgIHZhciBhdWRpbyA9IHtcbiAgICAgICAgYmxvYjogdGhpcy5hdWRpb1JlY29yZGVyLmdldEJsb2IoKSxcbiAgICAgICAgZGF0YVVSTDogYXVkaW9EYXRhVVJMXG4gICAgICB9O1xuXG4gICAgICAvLyBpZiByZWNvcmQgYm90aCB3YXYgYW5kIHdlYm1cbiAgICAgIGlmICghdGhpcy5pc1JlY29yZE9ubHlBdWRpbykge1xuICAgICAgICB0aGlzLnZpZGVvUmVjb3JkZXIuZ2V0RGF0YVVSTChmdW5jdGlvbih2aWRlb0RhdGFVUkwpIHtcbiAgICAgICAgICB2YXIgdmlkZW8gPSB7XG4gICAgICAgICAgICBibG9iOiB0aGlzLnZpZGVvUmVjb3JkZXIuZ2V0QmxvYigpLFxuICAgICAgICAgICAgZGF0YVVSTDogdmlkZW9EYXRhVVJMXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMubWVkaWFTdHJlYW0uc3RvcCgpXG4gICAgICAgICAgdGhpcy5vbkRvbmUoYXVkaW8sIHZpZGVvKVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tZWRpYVN0cmVhbS5zdG9wKClcbiAgICAgICAgdGhpcy5vbkRvbmUoYXVkaW8pXG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMub25VcGRhdGUoKVxuICB9LFxufVxuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRyb2xsZXIsIHRlbXBsYXRlKSB7XG4gIHJldHVybiBbJyRjb21waWxlJywgZnVuY3Rpb24gU2ltcGxlRGlyZWN0aXZlKCRjb21waWxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgIGNvbnRyb2xsZXI6IGNvbnRyb2xsZXIsXG4gICAgfVxuICB9XVxufVxuXG4iLCIvLyB1c2VzIHRoZSB3ZWJraXRzcGVlY2hcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICB2YXIgcmVjID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKClcbiAgcmVjLmludGVyaW1SZXN1bHRzID0gZmFsc2UgLy8gb3B0aW9ucy5pbnRlcmltID09PSBmYWxzZSA/IGZhbHNlIDogdHJ1ZVxuICByZWMuY29udGludW91cyA9IHRydWVcbiAgcmVjLm9uc3RhcnQgPSBvcHRpb25zLnN0YXJ0XG4gIHJlYy5vbmVycm9yID0gb3B0aW9ucy5lcnJvciAmJiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgb3B0aW9ucy5lcnJvcihldnQuZXJyb3IpXG4gIH1cbiAgcmVjLm9uZW5kID0gZnVuY3Rpb24gKCkge1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KVxuICAgIG9wdGlvbnMuZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgfVxuICByZWMub25yZXN1bHQgPSBvcHRpb25zLnJlc3VsdCAmJiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKHR5cGVvZihldnQucmVzdWx0cykgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIG9wdGlvbnMucmVzdWx0KFtdLnNsaWNlLmNhbGwoZXZ0LnJlc3VsdHMpLCBldnQucmVzdWx0SW5kZXgpXG4gIH1cbiAgcmVjLnN0YXJ0KClcbiAgaWYgKG9wdGlvbnMudGltZW91dCkge1xuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICByZWMuc3RvcCgpXG4gICAgICBvcHRpb25zLmVuZCgpXG4gICAgfSwgb3B0aW9ucy50aW1lb3V0KVxuICB9XG4gIHJldHVybiByZWNcbn1cblxuIiwiXG5mdW5jdGlvbiBwaWUoeCwgeSwgdDEsIHIpIHtcblx0dmFyIHZhbHMgPSB7XG4gICAgeDE6IE1hdGguY29zKDApICogciArIHgsXG4gICAgeTE6IE1hdGguc2luKDApICogciArIHksXG4gICAgeDI6IE1hdGguY29zKHQxKSAqIHIgKyB4LFxuICAgIHkyOiBNYXRoLnNpbih0MSkgKiByICsgeSxcbiAgICBmbGFnOiB0MSA8IE1hdGguUEkgPyAwIDogMSxcbiAgICByOiByLFxuICB9XG4gIHJldHVybiAnTSR7eDF9ICR7eTF9IEEgJHtyfSAke3J9LCAwLCAke2ZsYWd9LCAxLCAke3gyfSAke3kyfScucmVwbGFjZSgvXFwkeyhbXn1dKyl9L2csIGZ1bmN0aW9uIChmdWxsLCBuYW1lKSB7cmV0dXJuIHZhbHNbbmFtZV19KVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHRpbWVyRGlyZWN0aXZlKCkge1xuICByZXR1cm4ge1xuICAgIHNjb3BlOiB7XG4gICAgICBvbkRvbmU6ICc9JyxcbiAgICAgIHRpbWU6ICc9J1xuICAgIH0sXG5cbiAgICB0ZW1wbGF0ZTogJzxkaXYgY2xhc3M9XCJUaW1lclwiPicgK1xuICAgICAgJzxzdmcgd2lkdGg9MTAwIGhlaWdodD0xMDA+JyArXG4gICAgICAgICc8Y2lyY2xlIGN4PVwiNTBcIiBjeT1cIjUwXCIgcj1cIjQwXCIvPicgK1xuICAgICAgICAnPHBhdGggbmctYXR0ci1kPVwie3twYXRofX1cIi8+JytcbiAgICAgICc8L3N2Zz4nICtcbiAgICAnPC9kaXY+JyxcbiAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlKSB7XG4gICAgICAkc2NvcGUuc3RhcnQgPSBEYXRlLm5vdygpXG4gICAgICAkc2NvcGUubGVmdCA9ICRzY29wZS50aW1lXG4gICAgICBmdW5jdGlvbiBtYWtlUGllKCkge1xuICAgICAgICByZXR1cm4gcGllKDUwLCA1MCwgKERhdGUubm93KCkgLSAkc2NvcGUuc3RhcnQpIC8gMTAwMCAvICRzY29wZS50aW1lICogTWF0aC5QSSAqIDIsIDQwKVxuICAgICAgfVxuICAgICAgJHNjb3BlLnBhdGggPSBtYWtlUGllKClcbiAgICAgIHZhciB0b3V0ID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUubGVmdCA9ICRzY29wZS50aW1lIC0gKERhdGUubm93KCkgLSAkc2NvcGUuc3RhcnQpIC8gMTAwMFxuICAgICAgICBpZiAoJHNjb3BlLmxlZnQgPD0gMCkge1xuICAgICAgICAgICRzY29wZS5sZWZ0ID0gMFxuICAgICAgICAgIGNsZWFySW50ZXJ2YWwodG91dClcbiAgICAgICAgICAkc2NvcGUub25Eb25lKClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkc2NvcGUucGF0aCA9IG1ha2VQaWUoKVxuICAgICAgICB9XG4gICAgICAgICRzY29wZS4kZGlnZXN0KClcbiAgICAgIH0sIDIwKTtcblxuICAgICAgJHNjb3BlLiRvbignJGRlc3Ryb3knLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwodG91dClcbiAgICAgIH0pXG4gICAgfSxcbiAgfVxufVxuXG4iLCIvLyBfX19fX19fX19fX19fX19fX19fX19fXG4vLyBNZWRpYVN0cmVhbVJlY29yZGVyLmpzXG5cbi8vIHRvZG86IG5lZWQgdG8gc2hvdyBhbGVydCBib3hlcyBmb3IgaW5jb21wYXRpYmxlIGNhc2VzXG4vLyBlbmNvZGVyIG9ubHkgc3VwcG9ydHMgNDhrLzE2ayBtb25vIGF1ZGlvIGNoYW5uZWxcblxuLypcbiAqIEltcGxlbWVudGF0aW9uIG9mIGh0dHBzOi8vZHZjcy53My5vcmcvaGcvZGFwL3Jhdy1maWxlL2RlZmF1bHQvbWVkaWEtc3RyZWFtLWNhcHR1cmUvTWVkaWFSZWNvcmRlci5odG1sXG4gKiBUaGUgTWVkaWFSZWNvcmRlciBhY2NlcHRzIGEgbWVkaWFTdHJlYW0gYXMgaW5wdXQgc291cmNlIHBhc3NlZCBmcm9tIFVBLiBXaGVuIHJlY29yZGVyIHN0YXJ0cyxcbiAqIGEgTWVkaWFFbmNvZGVyIHdpbGwgYmUgY3JlYXRlZCBhbmQgYWNjZXB0IHRoZSBtZWRpYVN0cmVhbSBhcyBpbnB1dCBzb3VyY2UuXG4gKiBFbmNvZGVyIHdpbGwgZ2V0IHRoZSByYXcgZGF0YSBieSB0cmFjayBkYXRhIGNoYW5nZXMsIGVuY29kZSBpdCBieSBzZWxlY3RlZCBNSU1FIFR5cGUsIHRoZW4gc3RvcmUgdGhlIGVuY29kZWQgaW4gRW5jb2RlZEJ1ZmZlckNhY2hlIG9iamVjdC5cbiAqIFRoZSBlbmNvZGVkIGRhdGEgd2lsbCBiZSBleHRyYWN0ZWQgb24gZXZlcnkgdGltZXNsaWNlIHBhc3NlZCBmcm9tIFN0YXJ0IGZ1bmN0aW9uIGNhbGwgb3IgYnkgUmVxdWVzdERhdGEgZnVuY3Rpb24uXG4gKiBUaHJlYWQgbW9kZWw6XG4gKiBXaGVuIHRoZSByZWNvcmRlciBzdGFydHMsIGl0IGNyZWF0ZXMgYSBcIk1lZGlhIEVuY29kZXJcIiB0aHJlYWQgdG8gcmVhZCBkYXRhIGZyb20gTWVkaWFFbmNvZGVyIG9iamVjdCBhbmQgc3RvcmUgYnVmZmVyIGluIEVuY29kZWRCdWZmZXJDYWNoZSBvYmplY3QuXG4gKiBBbHNvIGV4dHJhY3QgdGhlIGVuY29kZWQgZGF0YSBhbmQgY3JlYXRlIGJsb2JzIG9uIGV2ZXJ5IHRpbWVzbGljZSBwYXNzZWQgZnJvbSBzdGFydCBmdW5jdGlvbiBvciBSZXF1ZXN0RGF0YSBmdW5jdGlvbiBjYWxsZWQgYnkgVUEuXG4gKi9cblxuLyoqXG4gKiBNZWRpYVN0cmVhbVJlY29yZGVyIGlzIGFuIGFic3RyYWN0aW9uIGxheWVyIGZvciBcIk1lZGlhUmVjb3JkZXIgQVBJXCIuIEl0IGlzIHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gcmVjb3JkIE1lZGlhU3RyZWFtKHMpIGluIEZpcmVmb3guXG4gKiBAc3VtbWFyeSBSdW5zIHRvcCBvdmVyIE1lZGlhUmVjb3JkZXIgQVBJLlxuICogQHR5cGVkZWYgTWVkaWFTdHJlYW1SZWNvcmRlclxuICogQGNsYXNzXG4gKiBAZXhhbXBsZVxuICogdmFyIHJlY29yZGVyID0gbmV3IE1lZGlhU3RyZWFtUmVjb3JkZXIoTWVkaWFTdHJlYW0pO1xuICogcmVjb3JkZXIubWltZVR5cGUgPSAndmlkZW8vd2VibSc7IC8vIGF1ZGlvL29nZyBvciB2aWRlby93ZWJtXG4gKiByZWNvcmRlci5yZWNvcmQoKTtcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xuICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gKlxuICogICAgIC8vIG9yXG4gKiAgICAgdmFyIGJsb2IgPSByZWNvcmRlci5ibG9iO1xuICogfSk7XG4gKiBAcGFyYW0ge01lZGlhU3RyZWFtfSBtZWRpYVN0cmVhbSAtIE1lZGlhU3RyZWFtIG9iamVjdCBmZXRjaGVkIHVzaW5nIGdldFVzZXJNZWRpYSBBUEkgb3IgZ2VuZXJhdGVkIHVzaW5nIGNhcHR1cmVTdHJlYW1VbnRpbEVuZGVkIG9yIFdlYkF1ZGlvIEFQSS5cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1lZGlhU3RyZWFtUmVjb3JkZXJcblxuZnVuY3Rpb24gTWVkaWFTdHJlYW1SZWNvcmRlcihtZWRpYVN0cmVhbSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIGlmIHVzZXIgY2hvc2VuIG9ubHkgYXVkaW8gb3B0aW9uOyBhbmQgaGUgdHJpZWQgdG8gcGFzcyBNZWRpYVN0cmVhbSB3aXRoXG4gICAgLy8gYm90aCBhdWRpbyBhbmQgdmlkZW8gdHJhY2tzO1xuICAgIC8vIHVzaW5nIGEgZGlydHkgd29ya2Fyb3VuZCB0byBnZW5lcmF0ZSBhdWRpby1vbmx5IHN0cmVhbSBzbyB0aGF0IHdlIGNhbiBnZXQgYXVkaW8vb2dnIG91dHB1dC5cbiAgICBpZiAoc2VsZi5taW1lVHlwZSAmJiBzZWxmLm1pbWVUeXBlICE9PSAndmlkZW8vd2VibScgJiYgbWVkaWFTdHJlYW0uZ2V0VmlkZW9UcmFja3MgJiYgbWVkaWFTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICAgIHZhciBtZWRpYVN0cmVhbVNvdXJjZSA9IGNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2UobWVkaWFTdHJlYW0pO1xuXG4gICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IGNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1EZXN0aW5hdGlvbigpO1xuICAgICAgICBtZWRpYVN0cmVhbVNvdXJjZS5jb25uZWN0KGRlc3RpbmF0aW9uKTtcblxuICAgICAgICBtZWRpYVN0cmVhbSA9IGRlc3RpbmF0aW9uLnN0cmVhbTtcbiAgICB9XG5cbiAgICB2YXIgZGF0YUF2YWlsYWJsZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xuICAgICAqL1xuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9keHIubW96aWxsYS5vcmcvbW96aWxsYS1jZW50cmFsL3NvdXJjZS9jb250ZW50L21lZGlhL01lZGlhUmVjb3JkZXIuY3BwXG4gICAgICAgIC8vIGh0dHBzOi8vd2lraS5tb3ppbGxhLm9yZy9HZWNrbzpNZWRpYVJlY29yZGVyXG4gICAgICAgIC8vIGh0dHBzOi8vZHZjcy53My5vcmcvaGcvZGFwL3Jhdy1maWxlL2RlZmF1bHQvbWVkaWEtc3RyZWFtLWNhcHR1cmUvTWVkaWFSZWNvcmRlci5odG1sXG5cbiAgICAgICAgLy8gc3RhcnRpbmcgYSByZWNvcmRpbmcgc2Vzc2lvbjsgd2hpY2ggd2lsbCBpbml0aWF0ZSBcIlJlYWRpbmcgVGhyZWFkXCJcbiAgICAgICAgLy8gXCJSZWFkaW5nIFRocmVhZFwiIGFyZSB1c2VkIHRvIHByZXZlbnQgbWFpbi10aHJlYWQgYmxvY2tpbmcgc2NlbmFyaW9zXG4gICAgICAgIG1lZGlhUmVjb3JkZXIgPSBuZXcgd2luZG93Lk1lZGlhUmVjb3JkZXIobWVkaWFTdHJlYW0pO1xuXG4gICAgICAgIC8vIERpc3BhdGNoaW5nIE9uRGF0YUF2YWlsYWJsZSBIYW5kbGVyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGRhdGFBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZS5kYXRhLnNpemUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdSZWNvcmRpbmcgb2YnLCBlLmRhdGEudHlwZSwgJ2ZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhQXZhaWxhYmxlID0gdHJ1ZTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jsb2J9IGJsb2IgLSBSZWNvcmRlZCBmcmFtZXMgaW4gdmlkZW8vd2VibSBibG9iLlxuICAgICAgICAgICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLmJsb2IgPSBuZXcgQmxvYihbZS5kYXRhXSwge1xuICAgICAgICAgICAgICAgIHR5cGU6IGUuZGF0YS50eXBlIHx8IHNlbGYubWltZVR5cGUgfHwgJ2F1ZGlvL29nZydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbGYuY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBtZWRpYVJlY29yZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgaWYgKCFzZWxmLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2hlbiB0aGUgc3RyZWFtIGlzIFwiZW5kZWRcIiBzZXQgcmVjb3JkaW5nIHRvICdpbmFjdGl2ZScgXG4gICAgICAgICAgICAvLyBhbmQgc3RvcCBnYXRoZXJpbmcgZGF0YS4gQ2FsbGVycyBzaG91bGQgbm90IHJlbHkgb24gXG4gICAgICAgICAgICAvLyBleGFjdG5lc3Mgb2YgdGhlIHRpbWVTbGljZSB2YWx1ZSwgZXNwZWNpYWxseSBcbiAgICAgICAgICAgIC8vIGlmIHRoZSB0aW1lU2xpY2UgdmFsdWUgaXMgc21hbGwuIENhbGxlcnMgc2hvdWxkIFxuICAgICAgICAgICAgLy8gY29uc2lkZXIgdGltZVNsaWNlIGFzIGEgbWluaW11bSB2YWx1ZVxuXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcbiAgICAgICAgICAgIHNlbGYucmVjb3JkKDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHZvaWQgc3RhcnQob3B0aW9uYWwgbG9uZyBtVGltZVNsaWNlKVxuICAgICAgICAvLyBUaGUgaW50ZXJ2YWwgb2YgcGFzc2luZyBlbmNvZGVkIGRhdGEgZnJvbSBFbmNvZGVkQnVmZmVyQ2FjaGUgdG8gb25EYXRhQXZhaWxhYmxlXG4gICAgICAgIC8vIGhhbmRsZXIuIFwibVRpbWVTbGljZSA8IDBcIiBtZWFucyBTZXNzaW9uIG9iamVjdCBkb2VzIG5vdCBwdXNoIGVuY29kZWQgZGF0YSB0b1xuICAgICAgICAvLyBvbkRhdGFBdmFpbGFibGUsIGluc3RlYWQsIGl0IHBhc3NpdmUgd2FpdCB0aGUgY2xpZW50IHNpZGUgcHVsbCBlbmNvZGVkIGRhdGFcbiAgICAgICAgLy8gYnkgY2FsbGluZyByZXF1ZXN0RGF0YSBBUEkuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RhcnQoMCk7XG5cbiAgICAgICAgLy8gU3RhcnQgcmVjb3JkaW5nLiBJZiB0aW1lU2xpY2UgaGFzIGJlZW4gcHJvdmlkZWQsIG1lZGlhUmVjb3JkZXIgd2lsbFxuICAgICAgICAvLyByYWlzZSBhIGRhdGFhdmFpbGFibGUgZXZlbnQgY29udGFpbmluZyB0aGUgQmxvYiBvZiBjb2xsZWN0ZWQgZGF0YSBvbiBldmVyeSB0aW1lU2xpY2UgbWlsbGlzZWNvbmRzLlxuICAgICAgICAvLyBJZiB0aW1lU2xpY2UgaXNuJ3QgcHJvdmlkZWQsIFVBIHNob3VsZCBjYWxsIHRoZSBSZXF1ZXN0RGF0YSB0byBvYnRhaW4gdGhlIEJsb2IgZGF0YSwgYWxzbyBzZXQgdGhlIG1UaW1lU2xpY2UgdG8gemVyby5cblxuICAgICAgICBpZiAoc2VsZi5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHNlbGYub25BdWRpb1Byb2Nlc3NTdGFydGVkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIE1lZGlhU3RyZWFtLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIC8vIG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdyZWNvcmRpbmcnIG1lYW5zIHRoYXQgbWVkaWEgcmVjb3JkZXIgaXMgYXNzb2NpYXRlZCB3aXRoIFwic2Vzc2lvblwiXG4gICAgICAgIC8vIG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdzdG9wcGVkJyBtZWFucyB0aGF0IG1lZGlhIHJlY29yZGVyIGlzIGRldGFjaGVkIGZyb20gdGhlIFwic2Vzc2lvblwiIC4uLiBpbiB0aGlzIGNhc2U7IFwic2Vzc2lvblwiIHdpbGwgYWxzbyBiZSBkZWxldGVkLlxuXG4gICAgICAgIGlmIChtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncmVjb3JkaW5nJykge1xuICAgICAgICAgICAgLy8gXCJzdG9wXCIgbWV0aG9kIGF1dG8gaW52b2tlcyBcInJlcXVlc3REYXRhXCIhXG4gICAgICAgICAgICAvLyBtZWRpYVJlY29yZGVyLnJlcXVlc3REYXRhKCk7XG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcbiAgICAgKi9cbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdyZWNvcmRpbmcnKSB7XG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnBhdXNlKCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1BhdXNlZCByZWNvcmRpbmcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBNZWRpYVN0cmVhbVJlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZXN1bWUoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncGF1c2VkJykge1xuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5yZXN1bWUoKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVzdW1lZCByZWNvcmRpbmcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gUmVmZXJlbmNlIHRvIFwiTWVkaWFSZWNvcmRlclwiIG9iamVjdFxuICAgIHZhciBtZWRpYVJlY29yZGVyO1xufVxuIiwiLy8gc291cmNlIGNvZGUgZnJvbTogaHR0cDovL3R5cGVkYXJyYXkub3JnL3dwLWNvbnRlbnQvcHJvamVjdHMvV2ViQXVkaW9SZWNvcmRlci9zY3JpcHQuanNcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXR0ZGlhbW9uZC9SZWNvcmRlcmpzI2xpY2Vuc2UtbWl0XG4vLyBfX19fX19fX19fX19fX19fX19fX19fXG4vLyBTdGVyZW9BdWRpb1JlY29yZGVyLmpzXG5cbi8qKlxuICogU3RlcmVvQXVkaW9SZWNvcmRlciBpcyBhIHN0YW5kYWxvbmUgY2xhc3MgdXNlZCBieSB7QGxpbmsgUmVjb3JkUlRDfSB0byBicmluZyBcInN0ZXJlb1wiIGF1ZGlvLXJlY29yZGluZyBpbiBjaHJvbWUuXG4gKiBAc3VtbWFyeSBKYXZhU2NyaXB0IHN0YW5kYWxvbmUgb2JqZWN0IGZvciBzdGVyZW8gYXVkaW8gcmVjb3JkaW5nLlxuICogQHR5cGVkZWYgU3RlcmVvQXVkaW9SZWNvcmRlclxuICogQGNsYXNzXG4gKiBAZXhhbXBsZVxuICogdmFyIHJlY29yZGVyID0gbmV3IFN0ZXJlb0F1ZGlvUmVjb3JkZXIoTWVkaWFTdHJlYW0sIHtcbiAqICAgICBzYW1wbGVSYXRlOiA0NDEwMCxcbiAqICAgICBidWZmZXJTaXplOiA0MDk2XG4gKiB9KTtcbiAqIHJlY29yZGVyLnJlY29yZCgpO1xuICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAqIH0pO1xuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIC0ge3NhbXBsZVJhdGU6IDQ0MTAwLCBidWZmZXJTaXplOiA0MDk2fVxuICovXG5cbnZhciBBdWRpb0NvbnRleHRDb25zdHJ1Y3RvciA9IG51bGw7XG52YXIgQXVkaW9Db250ZXh0ID0gd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0ZXJlb0F1ZGlvUmVjb3JkZXJcblxudmFyIF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGU7XG5cbmZ1bmN0aW9uIFN0ZXJlb0F1ZGlvUmVjb3JkZXIobWVkaWFTdHJlYW0sIGNvbmZpZykge1xuICAgIGlmICghbWVkaWFTdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgJ1lvdXIgc3RyZWFtIGhhcyBubyBhdWRpbyB0cmFja3MuJztcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyB2YXJpYWJsZXNcbiAgICB2YXIgbGVmdGNoYW5uZWwgPSBbXTtcbiAgICB2YXIgcmlnaHRjaGFubmVsID0gW107XG4gICAgdmFyIHJlY29yZGluZyA9IGZhbHNlO1xuICAgIHZhciByZWNvcmRpbmdMZW5ndGggPSAwO1xuXG4gICAgaWYgKCFBdWRpb0NvbnRleHRDb25zdHJ1Y3Rvcikge1xuICAgICAgICBBdWRpb0NvbnRleHRDb25zdHJ1Y3RvciA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB9XG5cbiAgICB2YXIgY29udGV4dCA9IEF1ZGlvQ29udGV4dENvbnN0cnVjdG9yO1xuXG4gICAgLy8gY3JlYXRlcyBhbiBhdWRpbyBub2RlIGZyb20gdGhlIG1pY3JvcGhvbmUgaW5jb21pbmcgc3RyZWFtXG4gICAgdmFyIGF1ZGlvSW5wdXQgPSBjb250ZXh0LmNyZWF0ZU1lZGlhU3RyZWFtU291cmNlKG1lZGlhU3RyZWFtKTtcblxuICAgIHZhciBsZWdhbEJ1ZmZlclZhbHVlcyA9IFswLCAyNTYsIDUxMiwgMTAyNCwgMjA0OCwgNDA5NiwgODE5MiwgMTYzODRdO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHNhbXBsZSByYXRlIChpbiBzYW1wbGUtZnJhbWVzIHBlciBzZWNvbmQpIGF0IHdoaWNoIHRoZVxuICAgICAqIEF1ZGlvQ29udGV4dCBoYW5kbGVzIGF1ZGlvLiBJdCBpcyBhc3N1bWVkIHRoYXQgYWxsIEF1ZGlvTm9kZXNcbiAgICAgKiBpbiB0aGUgY29udGV4dCBydW4gYXQgdGhpcyByYXRlLiBJbiBtYWtpbmcgdGhpcyBhc3N1bXB0aW9uLFxuICAgICAqIHNhbXBsZS1yYXRlIGNvbnZlcnRlcnMgb3IgXCJ2YXJpc3BlZWRcIiBwcm9jZXNzb3JzIGFyZSBub3Qgc3VwcG9ydGVkXG4gICAgICogaW4gcmVhbC10aW1lIHByb2Nlc3NpbmcuXG4gICAgICogVGhlIHNhbXBsZVJhdGUgcGFyYW1ldGVyIGRlc2NyaWJlcyB0aGUgc2FtcGxlLXJhdGUgb2YgdGhlXG4gICAgICogbGluZWFyIFBDTSBhdWRpbyBkYXRhIGluIHRoZSBidWZmZXIgaW4gc2FtcGxlLWZyYW1lcyBwZXIgc2Vjb25kLlxuICAgICAqIEFuIGltcGxlbWVudGF0aW9uIG11c3Qgc3VwcG9ydCBzYW1wbGUtcmF0ZXMgaW4gYXQgbGVhc3RcbiAgICAgKiB0aGUgcmFuZ2UgMjIwNTAgdG8gOTYwMDAuXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IHNhbXBsZVJhdGUgLSBCdWZmZXItc2l6ZSBmb3IgaG93IGZyZXF1ZW50bHkgdGhlIGF1ZGlvcHJvY2VzcyBldmVudCBpcyBkaXNwYXRjaGVkLlxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlciA9IG5ldyBTdGVyZW9BdWRpb1JlY29yZGVyKG1lZGlhU3RyZWFtLCB7XG4gICAgICogICAgIHNhbXBsZVJhdGU6IDQ0MTAwXG4gICAgICogfSk7XG4gICAgICovXG4gICAgdmFyIHNhbXBsZVJhdGUgPSB0eXBlb2YgY29uZmlnLnNhbXBsZVJhdGUgIT09ICd1bmRlZmluZWQnID8gY29uZmlnLnNhbXBsZVJhdGUgOiBjb250ZXh0LnNhbXBsZVJhdGUgfHwgNDQxMDA7XG5cbiAgICBpZiAoc2FtcGxlUmF0ZSA8IDIyMDUwIHx8IHNhbXBsZVJhdGUgPiA5NjAwMCkge1xuICAgICAgICAvLyBSZWY6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI2MzAzOTE4LzU1MjE4MlxuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdzYW1wbGUtcmF0ZSBtdXN0IGJlIHVuZGVyIHJhbmdlIDIyMDUwIGFuZCA5NjAwMC4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3Nvcikge1xuICAgICAgICBfX3N0ZXJlb0F1ZGlvUmVjb3JkZXJKYXZhY3JpcHROb2RlID0gY29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoYnVmZmVyU2l6ZSwgMiwgMik7XG4gICAgfSBlbHNlIGlmIChjb250ZXh0LmNyZWF0ZUphdmFTY3JpcHROb2RlKSB7XG4gICAgICAgIF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGUgPSBjb250ZXh0LmNyZWF0ZUphdmFTY3JpcHROb2RlKGJ1ZmZlclNpemUsIDIsIDIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93ICdXZWJBdWRpbyBBUEkgaGFzIG5vIHN1cHBvcnQgb24gdGhpcyBicm93c2VyLic7XG4gICAgfVxuXG4gICAgd2luZG93LmF1ZGlvUHJvY2VzcyA9IF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGVcblxuICAgIC8vIGNvbm5lY3QgdGhlIHN0cmVhbSB0byB0aGUgZ2FpbiBub2RlXG4gICAgYXVkaW9JbnB1dC5jb25uZWN0KF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGUpO1xuXG4gICAgYnVmZmVyU2l6ZSA9IF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGUuYnVmZmVyU2l6ZTtcblxuICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzYW1wbGUtcmF0ZScsIHNhbXBsZVJhdGUpO1xuICAgICAgICBjb25zb2xlLmxvZygnYnVmZmVyLXNpemUnLCBidWZmZXJTaXplKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGcm9tIHRoZSBzcGVjOiBUaGlzIHZhbHVlIGNvbnRyb2xzIGhvdyBmcmVxdWVudGx5IHRoZSBhdWRpb3Byb2Nlc3MgZXZlbnQgaXNcbiAgICAgKiBkaXNwYXRjaGVkIGFuZCBob3cgbWFueSBzYW1wbGUtZnJhbWVzIG5lZWQgdG8gYmUgcHJvY2Vzc2VkIGVhY2ggY2FsbC5cbiAgICAgKiBMb3dlciB2YWx1ZXMgZm9yIGJ1ZmZlciBzaXplIHdpbGwgcmVzdWx0IGluIGEgbG93ZXIgKGJldHRlcikgbGF0ZW5jeS5cbiAgICAgKiBIaWdoZXIgdmFsdWVzIHdpbGwgYmUgbmVjZXNzYXJ5IHRvIGF2b2lkIGF1ZGlvIGJyZWFrdXAgYW5kIGdsaXRjaGVzXG4gICAgICogVGhlIHNpemUgb2YgdGhlIGJ1ZmZlciAoaW4gc2FtcGxlLWZyYW1lcykgd2hpY2ggbmVlZHMgdG9cbiAgICAgKiBiZSBwcm9jZXNzZWQgZWFjaCB0aW1lIG9ucHJvY2Vzc2F1ZGlvIGlzIGNhbGxlZC5cbiAgICAgKiBMZWdhbCB2YWx1ZXMgYXJlICgyNTYsIDUxMiwgMTAyNCwgMjA0OCwgNDA5NiwgODE5MiwgMTYzODQpLlxuICAgICAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBidWZmZXJTaXplIC0gQnVmZmVyLXNpemUgZm9yIGhvdyBmcmVxdWVudGx5IHRoZSBhdWRpb3Byb2Nlc3MgZXZlbnQgaXMgZGlzcGF0Y2hlZC5cbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIgPSBuZXcgU3RlcmVvQXVkaW9SZWNvcmRlcihtZWRpYVN0cmVhbSwge1xuICAgICAqICAgICBidWZmZXJTaXplOiA0MDk2XG4gICAgICogfSk7XG4gICAgICovXG5cbiAgICAvLyBcIjBcIiBtZWFucywgbGV0IGNocm9tZSBkZWNpZGUgdGhlIG1vc3QgYWNjdXJhdGUgYnVmZmVyLXNpemUgZm9yIGN1cnJlbnQgcGxhdGZvcm0uXG4gICAgdmFyIGJ1ZmZlclNpemUgPSB0eXBlb2YgY29uZmlnLmJ1ZmZlclNpemUgPT09ICd1bmRlZmluZWQnID8gNDA5NiA6IGNvbmZpZy5idWZmZXJTaXplO1xuXG4gICAgaWYgKGxlZ2FsQnVmZmVyVmFsdWVzLmluZGV4T2YoYnVmZmVyU2l6ZSkgPT09IC0xKSB7XG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0xlZ2FsIHZhbHVlcyBmb3IgYnVmZmVyLXNpemUgYXJlICcgKyBKU09OLnN0cmluZ2lmeShsZWdhbEJ1ZmZlclZhbHVlcywgbnVsbCwgJ1xcdCcpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xuICAgICAqL1xuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHJlc2V0IHRoZSBidWZmZXJzIGZvciB0aGUgbmV3IHJlY29yZGluZ1xuICAgICAgICBsZWZ0Y2hhbm5lbC5sZW5ndGggPSByaWdodGNoYW5uZWwubGVuZ3RoID0gMDtcbiAgICAgICAgcmVjb3JkaW5nTGVuZ3RoID0gMDtcblxuICAgICAgICByZWNvcmRpbmcgPSB0cnVlO1xuICAgIH07XG5cblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHN0b3BzIHJlY29yZGluZyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLCB0aGF0IGlzIHVzZWQgdG8gcGFzcyByZWNvcmRlZCBibG9iIGJhY2sgdG8gdGhlIGNhbGxlZS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xuICAgICAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIHN0b3AgcmVjb3JkaW5nXG4gICAgICAgIHJlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIC8vIHRvIG1ha2Ugc3VyZSBvbmF1ZGlvcHJvY2VzcyBzdG9wcyBmaXJpbmdcbiAgICAgICAgYXVkaW9JbnB1dC5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgbWVyZ2VMZWZ0UmlnaHRCdWZmZXJzKHtcbiAgICAgICAgICAgIHNhbXBsZVJhdGU6IHNhbXBsZVJhdGUsXG4gICAgICAgICAgICBsZWZ0Q2hhbm5lbDogY29uZmlnLmxlZnRDaGFubmVsLFxuICAgICAgICAgICAgbGVmdEJ1ZmZlcnM6IFtsZWZ0Y2hhbm5lbCwgcmVjb3JkaW5nTGVuZ3RoXSxcbiAgICAgICAgICAgIHJpZ2h0QnVmZmVyczogW3JpZ2h0Y2hhbm5lbCwgcmVjb3JkaW5nTGVuZ3RoXVxuICAgICAgICB9LCBmdW5jdGlvbihidWZmZXIsIHZpZXcpIHtcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCbG9ifSBibG9iIC0gVGhlIHJlY29yZGVkIGJsb2Igb2JqZWN0LlxuICAgICAgICAgICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgKiAgICAgdmFyIGJsb2IgPSByZWNvcmRlci5ibG9iO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNlbGYuYmxvYiA9IG5ldyBCbG9iKFt2aWV3XSwge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhdWRpby93YXYnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0FycmF5QnVmZmVyfSBidWZmZXIgLSBUaGUgcmVjb3JkZWQgYnVmZmVyIG9iamVjdC5cbiAgICAgICAgICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICogICAgIHZhciBidWZmZXIgPSByZWNvcmRlci5idWZmZXI7XG4gICAgICAgICAgICAgKiB9KTtcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgc2VsZi5idWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIodmlldyk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtEYXRhVmlld30gdmlldyAtIFRoZSByZWNvcmRlZCBkYXRhLXZpZXcgb2JqZWN0LlxuICAgICAgICAgICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgKiAgICAgdmFyIHZpZXcgPSByZWNvcmRlci52aWV3O1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNlbGYudmlldyA9IHZpZXc7XG5cbiAgICAgICAgICAgIHNlbGYuc2FtcGxlUmF0ZSA9IHNhbXBsZVJhdGU7XG4gICAgICAgICAgICBzZWxmLmJ1ZmZlclNpemUgPSBidWZmZXJTaXplO1xuXG4gICAgICAgICAgICAvLyByZWNvcmRlZCBhdWRpbyBsZW5ndGhcbiAgICAgICAgICAgIHNlbGYubGVuZ3RoID0gcmVjb3JkaW5nTGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpc0F1ZGlvUHJvY2Vzc1N0YXJ0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBpc1BhdXNlZCA9IGZhbHNlO1xuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5wYXVzZSgpO1xuICAgICAqL1xuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaXNQYXVzZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdQYXVzZWQgcmVjb3JkaW5nLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHJlc3VtZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XG4gICAgICovXG4gICAgdGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaXNQYXVzZWQgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVzdW1lZCByZWNvcmRpbmcuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGlzQXVkaW9Qcm9jZXNzU3RhcnRlZCA9IGZhbHNlO1xuXG4gICAgX19zdGVyZW9BdWRpb1JlY29yZGVySmF2YWNyaXB0Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdhdWRpb3Byb2Nlc3MnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmIChpc1BhdXNlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgTWVkaWFTdHJlYW0oKS5zdG9wKCkgb3IgTWVkaWFTdHJlYW1UcmFjay5zdG9wKCkgaXMgaW52b2tlZC5cbiAgICAgICAgaWYgKG1lZGlhU3RyZWFtLmVuZGVkKSB7XG4gICAgICAgICAgICBfX3N0ZXJlb0F1ZGlvUmVjb3JkZXJKYXZhY3JpcHROb2RlLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24oKSB7fTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcmVjb3JkaW5nKSB7XG4gICAgICAgICAgICBhdWRpb0lucHV0LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gXCJvbmF1ZGlvcHJvY2Vzc1wiIGV2ZW50J3MgZmlyc3QgaW52b2NhdGlvbi5cbiAgICAgICAgICogQG1ldGhvZCB7ZnVuY3Rpb259IG9uQXVkaW9Qcm9jZXNzU3RhcnRlZFxuICAgICAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRlci5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQ6IGZ1bmN0aW9uKCkgeyB9O1xuICAgICAgICAgKi9cbiAgICAgICAgaWYgKCFpc0F1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcbiAgICAgICAgICAgIGlzQXVkaW9Qcm9jZXNzU3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoc2VsZi5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm9uQXVkaW9Qcm9jZXNzU3RhcnRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxlZnQgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xuICAgICAgICB2YXIgcmlnaHQgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDEpO1xuXG4gICAgICAgIC8vIHdlIGNsb25lIHRoZSBzYW1wbGVzXG4gICAgICAgIGxlZnRjaGFubmVsLnB1c2gobmV3IEZsb2F0MzJBcnJheShsZWZ0KSk7XG4gICAgICAgIHJpZ2h0Y2hhbm5lbC5wdXNoKG5ldyBGbG9hdDMyQXJyYXkocmlnaHQpKTtcblxuICAgICAgICByZWNvcmRpbmdMZW5ndGggKz0gYnVmZmVyU2l6ZTtcbiAgICB9KTtcblxuICAgIC8vIHRvIHByZXZlbnQgc2VsZiBhdWRpbyB0byBiZSBjb25uZWN0ZWQgd2l0aCBzcGVha2Vyc1xuICAgIF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGUuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VMZWZ0UmlnaHRCdWZmZXJzKGNvbmZpZywgY2FsbGJhY2spIHtcbiAgICBmdW5jdGlvbiBtZXJnZUF1ZGlvQnVmZmVycyhjb25maWcpIHtcbiAgICAgICAgdmFyIGxlZnRCdWZmZXJzID0gY29uZmlnLmxlZnRCdWZmZXJzO1xuICAgICAgICB2YXIgcmlnaHRCdWZmZXJzID0gY29uZmlnLnJpZ2h0QnVmZmVycztcbiAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSBjb25maWcuc2FtcGxlUmF0ZTtcblxuICAgICAgICBsZWZ0QnVmZmVycyA9IG1lcmdlQnVmZmVycyhsZWZ0QnVmZmVyc1swXSwgbGVmdEJ1ZmZlcnNbMV0pO1xuICAgICAgICByaWdodEJ1ZmZlcnMgPSBtZXJnZUJ1ZmZlcnMocmlnaHRCdWZmZXJzWzBdLCByaWdodEJ1ZmZlcnNbMV0pO1xuXG4gICAgICAgIGZ1bmN0aW9uIG1lcmdlQnVmZmVycyhjaGFubmVsQnVmZmVyLCByTGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0NjRBcnJheShyTGVuZ3RoKTtcbiAgICAgICAgICAgIHZhciBvZmZzZXQgPSAwO1xuICAgICAgICAgICAgdmFyIGxuZyA9IGNoYW5uZWxCdWZmZXIubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxuZzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IGNoYW5uZWxCdWZmZXJbaV07XG4gICAgICAgICAgICAgICAgcmVzdWx0LnNldChidWZmZXIsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgb2Zmc2V0ICs9IGJ1ZmZlci5sZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBpbnRlcmxlYXZlKGxlZnRDaGFubmVsLCByaWdodENoYW5uZWwpIHtcbiAgICAgICAgICAgIHZhciBsZW5ndGggPSBsZWZ0Q2hhbm5lbC5sZW5ndGggKyByaWdodENoYW5uZWwubGVuZ3RoO1xuXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gbmV3IEZsb2F0NjRBcnJheShsZW5ndGgpO1xuXG4gICAgICAgICAgICB2YXIgaW5wdXRJbmRleCA9IDA7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0W2luZGV4KytdID0gbGVmdENoYW5uZWxbaW5wdXRJbmRleF07XG4gICAgICAgICAgICAgICAgcmVzdWx0W2luZGV4KytdID0gcmlnaHRDaGFubmVsW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgICAgIGlucHV0SW5kZXgrKztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB3cml0ZVVURkJ5dGVzKHZpZXcsIG9mZnNldCwgc3RyaW5nKSB7XG4gICAgICAgICAgICB2YXIgbG5nID0gc3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG5nOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQ4KG9mZnNldCArIGksIHN0cmluZy5jaGFyQ29kZUF0KGkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGludGVybGVhdmUgYm90aCBjaGFubmVscyB0b2dldGhlclxuICAgICAgICB2YXIgaW50ZXJsZWF2ZWQgPSBpbnRlcmxlYXZlKGxlZnRCdWZmZXJzLCByaWdodEJ1ZmZlcnMpO1xuXG4gICAgICAgIHZhciBpbnRlcmxlYXZlZExlbmd0aCA9IGludGVybGVhdmVkLmxlbmd0aDtcblxuICAgICAgICAvLyBjcmVhdGUgd2F2IGZpbGVcbiAgICAgICAgdmFyIHJlc3VsdGluZ0J1ZmZlckxlbmd0aCA9IDQ0ICsgaW50ZXJsZWF2ZWRMZW5ndGggKiAyO1xuXG4gICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIocmVzdWx0aW5nQnVmZmVyTGVuZ3RoKTtcblxuICAgICAgICB2YXIgdmlldyA9IG5ldyBEYXRhVmlldyhidWZmZXIpO1xuXG4gICAgICAgIC8vIFJJRkYgY2h1bmsgZGVzY3JpcHRvci9pZGVudGlmaWVyIFxuICAgICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDAsICdSSUZGJyk7XG5cbiAgICAgICAgLy8gUklGRiBjaHVuayBsZW5ndGhcbiAgICAgICAgdmFyIGJsb2NrQWxpZ24gPSA0O1xuICAgICAgICB2aWV3LnNldFVpbnQzMihibG9ja0FsaWduLCA0NCArIGludGVybGVhdmVkTGVuZ3RoICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUklGRiB0eXBlIFxuICAgICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDgsICdXQVZFJyk7XG5cbiAgICAgICAgLy8gZm9ybWF0IGNodW5rIGlkZW50aWZpZXIgXG4gICAgICAgIC8vIEZNVCBzdWItY2h1bmtcbiAgICAgICAgd3JpdGVVVEZCeXRlcyh2aWV3LCAxMiwgJ2ZtdCAnKTtcblxuICAgICAgICAvLyBmb3JtYXQgY2h1bmsgbGVuZ3RoIFxuICAgICAgICB2aWV3LnNldFVpbnQzMigxNiwgMTYsIHRydWUpO1xuXG4gICAgICAgIC8vIHNhbXBsZSBmb3JtYXQgKHJhdylcbiAgICAgICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuXG4gICAgICAgIC8vIHN0ZXJlbyAoMiBjaGFubmVscylcbiAgICAgICAgdmlldy5zZXRVaW50MTYoMjIsIDIsIHRydWUpO1xuXG4gICAgICAgIC8vIHNhbXBsZSByYXRlIFxuICAgICAgICB2aWV3LnNldFVpbnQzMigyNCwgc2FtcGxlUmF0ZSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gYnl0ZSByYXRlIChzYW1wbGUgcmF0ZSAqIGJsb2NrIGFsaWduKVxuICAgICAgICB2aWV3LnNldFVpbnQzMigyOCwgc2FtcGxlUmF0ZSAqIGJsb2NrQWxpZ24sIHRydWUpO1xuXG4gICAgICAgIC8vIGJsb2NrIGFsaWduIChjaGFubmVsIGNvdW50ICogYnl0ZXMgcGVyIHNhbXBsZSkgXG4gICAgICAgIHZpZXcuc2V0VWludDE2KDMyLCBibG9ja0FsaWduLCB0cnVlKTtcblxuICAgICAgICAvLyBiaXRzIHBlciBzYW1wbGUgXG4gICAgICAgIHZpZXcuc2V0VWludDE2KDM0LCAxNiwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gZGF0YSBzdWItY2h1bmtcbiAgICAgICAgLy8gZGF0YSBjaHVuayBpZGVudGlmaWVyIFxuICAgICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDM2LCAnZGF0YScpO1xuXG4gICAgICAgIC8vIGRhdGEgY2h1bmsgbGVuZ3RoIFxuICAgICAgICB2aWV3LnNldFVpbnQzMig0MCwgaW50ZXJsZWF2ZWRMZW5ndGggKiAyLCB0cnVlKTtcblxuICAgICAgICAvLyB3cml0ZSB0aGUgUENNIHNhbXBsZXNcbiAgICAgICAgdmFyIG9mZnNldCA9IDQ0LFxuICAgICAgICAgICAgbGVmdENoYW5uZWw7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW50ZXJsZWF2ZWRMZW5ndGg7IGkrKywgb2Zmc2V0ICs9IDIpIHtcbiAgICAgICAgICAgIHZhciBzaXplID0gTWF0aC5tYXgoLTEsIE1hdGgubWluKDEsIGludGVybGVhdmVkW2ldKSk7XG4gICAgICAgICAgICB2YXIgY3VycmVudENoYW5uZWwgPSBzaXplIDwgMCA/IHNpemUgKiAzMjc2OCA6IHNpemUgKiAzMjc2NztcblxuICAgICAgICAgICAgaWYgKGNvbmZpZy5sZWZ0Q2hhbm5lbCkge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Q2hhbm5lbCAhPT0gbGVmdENoYW5uZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRJbnQxNihvZmZzZXQsIGN1cnJlbnRDaGFubmVsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGVmdENoYW5uZWwgPSBjdXJyZW50Q2hhbm5lbDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmlldy5zZXRJbnQxNihvZmZzZXQsIGN1cnJlbnRDaGFubmVsLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIGJ1ZmZlcjogYnVmZmVyLFxuICAgICAgICAgICAgdmlldzogdmlld1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdmFyIHdlYldvcmtlciA9IHByb2Nlc3NJbldlYldvcmtlcihtZXJnZUF1ZGlvQnVmZmVycyk7XG5cbiAgICB3ZWJXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgY2FsbGJhY2soZXZlbnQuZGF0YS5idWZmZXIsIGV2ZW50LmRhdGEudmlldyk7XG4gICAgfTtcblxuICAgIHdlYldvcmtlci5wb3N0TWVzc2FnZShjb25maWcpO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzSW5XZWJXb3JrZXIoX2Z1bmN0aW9uKSB7XG4gICAgdmFyIGJsb2IgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtfZnVuY3Rpb24udG9TdHJpbmcoKSxcbiAgICAgICAgJ3RoaXMub25tZXNzYWdlID0gIGZ1bmN0aW9uIChlKSB7JyArIF9mdW5jdGlvbi5uYW1lICsgJyhlLmRhdGEpO30nXG4gICAgXSwge1xuICAgICAgICB0eXBlOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCdcbiAgICB9KSk7XG5cbiAgICB2YXIgd29ya2VyID0gbmV3IFdvcmtlcihibG9iKTtcbiAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGJsb2IpO1xuICAgIHJldHVybiB3b3JrZXI7XG59XG5cbiIsIi8vIF9fX19fX19fX19fX19fX19fXG4vLyBTdGVyZW9SZWNvcmRlci5qc1xuXG4vKipcbiAqIFN0ZXJlb1JlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIGF1ZGlvLXJlY29yZGluZyBpbiBjaHJvbWUuIEl0IHJ1bnMgdG9wIG92ZXIge0BsaW5rIFN0ZXJlb0F1ZGlvUmVjb3JkZXJ9LlxuICogQHN1bW1hcnkgSmF2YVNjcmlwdCBzdGFuZGFsb25lIG9iamVjdCBmb3Igc3RlcmVvIGF1ZGlvIHJlY29yZGluZy5cbiAqIEB0eXBlZGVmIFN0ZXJlb1JlY29yZGVyXG4gKiBAY2xhc3NcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgU3RlcmVvUmVjb3JkZXIoTWVkaWFTdHJlYW0pO1xuICogcmVjb3JkZXIucmVjb3JkKCk7XG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcbiAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICogfSk7XG4gKiBAcGFyYW0ge01lZGlhU3RyZWFtfSBtZWRpYVN0cmVhbSAtIE1lZGlhU3RyZWFtIG9iamVjdCBmZXRjaGVkIHVzaW5nIGdldFVzZXJNZWRpYSBBUEkgb3IgZ2VuZXJhdGVkIHVzaW5nIGNhcHR1cmVTdHJlYW1VbnRpbEVuZGVkIG9yIFdlYkF1ZGlvIEFQSS5cbiAqL1xuXG52YXIgU3RlcmVvQXVkaW9SZWNvcmRlciA9IHJlcXVpcmUoJy4vU3RlcmVvQXVkaW9SZWNvcmRlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gU3RlcmVvUmVjb3JkZXJcblxuZnVuY3Rpb24gU3RlcmVvUmVjb3JkZXIobWVkaWFTdHJlYW0pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBSZWZlcmVuY2UgdG8gXCJTdGVyZW9BdWRpb1JlY29yZGVyXCIgb2JqZWN0XG4gICAgdmFyIG1lZGlhUmVjb3JkZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZWNvcmRzIE1lZGlhU3RyZWFtLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xuICAgICAqL1xuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIG1lZGlhUmVjb3JkZXIgPSBuZXcgU3RlcmVvQXVkaW9SZWNvcmRlcihtZWRpYVN0cmVhbSwgdGhpcyk7XG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25BdWRpb1Byb2Nlc3NTdGFydGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoc2VsZi5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm9uQXVkaW9Qcm9jZXNzU3RhcnRlZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBtZWRpYVJlY29yZGVyLnJlY29yZCgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcgTWVkaWFTdHJlYW0uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpdGVtIGluIG1lZGlhUmVjb3JkZXIpIHtcbiAgICAgICAgICAgICAgICBzZWxmW2l0ZW1dID0gbWVkaWFSZWNvcmRlcltpdGVtXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcbiAgICAgKi9cbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVkaWFSZWNvcmRlci5wYXVzZSgpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZXN1bWVzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZXN1bWUoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIucmVzdW1lKCk7XG4gICAgfTtcbn1cbiIsIi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbnRpbWF0dGVyMTUvd2hhbW15L2Jsb2IvbWFzdGVyL0xJQ0VOU0Vcbi8vIF9fX19fX19fX1xuLy8gV2hhbW15LmpzXG5cbi8vIHRvZG86IEZpcmVmb3ggbm93IHN1cHBvcnRzIHdlYnAgZm9yIHdlYm0gY29udGFpbmVycyFcbi8vIHRoZWlyIE1lZGlhUmVjb3JkZXIgaW1wbGVtZW50YXRpb24gd29ya3Mgd2VsbCFcbi8vIHNob3VsZCB3ZSBwcm92aWRlIGFuIG9wdGlvbiB0byByZWNvcmQgdmlhIFdoYW1teS5qcyBvciBNZWRpYVJlY29yZGVyIEFQSSBpcyBhIGJldHRlciBzb2x1dGlvbj9cblxuLyoqXG4gKiBXaGFtbXkgaXMgYSBzdGFuZGFsb25lIGNsYXNzIHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gYnJpbmcgdmlkZW8gcmVjb3JkaW5nIGluIENocm9tZS4gSXQgaXMgd3JpdHRlbiBieSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2FudGltYXR0ZXIxNXxhbnRpbWF0dGVyMTV9XG4gKiBAc3VtbWFyeSBBIHJlYWwgdGltZSBqYXZhc2NyaXB0IHdlYm0gZW5jb2RlciBiYXNlZCBvbiBhIGNhbnZhcyBoYWNrLlxuICogQHR5cGVkZWYgV2hhbW15XG4gKiBAY2xhc3NcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgV2hhbW15KCkuVmlkZW8oMTUpO1xuICogcmVjb3JkZXIuYWRkKGNvbnRleHQgfHwgY2FudmFzIHx8IGRhdGFVUkwpO1xuICogdmFyIG91dHB1dCA9IHJlY29yZGVyLmNvbXBpbGUoKTtcbiAqL1xuXG4vLyBhIG1vcmUgYWJzdHJhY3QtaXNoIEFQSVxuXG52YXIgd2hhbW15SW5XZWJXb3JrZXIgPSByZXF1aXJlKCcuL3doYW1teV93b3JrZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLyoqXG4gICAgICAqIEEgbW9yZSBhYnN0cmFjdC1pc2ggQVBJLlxuICAgICAgKiBAbWV0aG9kXG4gICAgICAqIEBtZW1iZXJvZiBXaGFtbXlcbiAgICAgICogQGV4YW1wbGVcbiAgICAgICogcmVjb3JkZXIgPSBuZXcgV2hhbW15KCkuVmlkZW8oMC44LCAxMDApO1xuICAgICAgKiBAcGFyYW0gez9udW1iZXJ9IHNwZWVkIC0gMC44XG4gICAgICAqIEBwYXJhbSB7P251bWJlcn0gcXVhbGl0eSAtIDEwMFxuICAgICAgKi9cbiAgICBWaWRlbzogV2hhbW15VmlkZW9cbn07XG5cbmZ1bmN0aW9uIFdoYW1teVZpZGVvKGR1cmF0aW9uKSB7XG4gICAgdGhpcy5mcmFtZXMgPSBbXTtcbiAgICB0aGlzLmR1cmF0aW9uID0gZHVyYXRpb24gfHwgMTtcbiAgICB0aGlzLnF1YWxpdHkgPSAxMDA7XG59XG5cbi8qKlxuICAqIFBhc3MgQ2FudmFzIG9yIENvbnRleHQgb3IgaW1hZ2Uvd2VicChzdHJpbmcpIHRvIHtAbGluayBXaGFtbXl9IGVuY29kZXIuXG4gICogQG1ldGhvZFxuICAqIEBtZW1iZXJvZiBXaGFtbXlcbiAgKiBAZXhhbXBsZVxuICAqIHJlY29yZGVyID0gbmV3IFdoYW1teSgpLlZpZGVvKDAuOCwgMTAwKTtcbiAgKiByZWNvcmRlci5hZGQoY2FudmFzIHx8IGNvbnRleHQgfHwgJ2ltYWdlL3dlYnAnKTtcbiAgKiBAcGFyYW0ge3N0cmluZ30gZnJhbWUgLSBDYW52YXMgfHwgQ29udGV4dCB8fCBpbWFnZS93ZWJwXG4gICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uIC0gU3RpY2sgYSBkdXJhdGlvbiAoaW4gbWlsbGlzZWNvbmRzKVxuICAqL1xuV2hhbW15VmlkZW8ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGZyYW1lLCBkdXJhdGlvbikge1xuICAgIGlmICgnY2FudmFzJyBpbiBmcmFtZSkgeyAvL0NhbnZhc1JlbmRlcmluZ0NvbnRleHQyRFxuICAgICAgICBmcmFtZSA9IGZyYW1lLmNhbnZhcztcbiAgICB9XG5cbiAgICBpZiAoJ3RvRGF0YVVSTCcgaW4gZnJhbWUpIHtcbiAgICAgICAgZnJhbWUgPSBmcmFtZS50b0RhdGFVUkwoJ2ltYWdlL3dlYnAnLCB0aGlzLnF1YWxpdHkpO1xuICAgIH1cblxuICAgIGlmICghKC9eZGF0YTppbWFnZVxcL3dlYnA7YmFzZTY0LC9pZykudGVzdChmcmFtZSkpIHtcbiAgICAgICAgdGhyb3cgJ0lucHV0IG11c3QgYmUgZm9ybWF0dGVkIHByb3Blcmx5IGFzIGEgYmFzZTY0IGVuY29kZWQgRGF0YVVSSSBvZiB0eXBlIGltYWdlL3dlYnAnO1xuICAgIH1cbiAgICB0aGlzLmZyYW1lcy5wdXNoKHtcbiAgICAgICAgaW1hZ2U6IGZyYW1lLFxuICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24gfHwgdGhpcy5kdXJhdGlvblxuICAgIH0pO1xufTtcblxuZnVuY3Rpb24gcHJvY2Vzc0luV2ViV29ya2VyKF9mdW5jdGlvbikge1xuICAgIHZhciBibG9iID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbX2Z1bmN0aW9uLnRvU3RyaW5nKCksXG4gICAgICAgICd0aGlzLm9ubWVzc2FnZSA9ICBmdW5jdGlvbiAoZSkgeycgKyBfZnVuY3Rpb24ubmFtZSArICcoZS5kYXRhKTt9J1xuICAgIF0sIHtcbiAgICAgICAgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXG4gICAgfSkpO1xuXG4gICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoYmxvYik7XG4gICAgVVJMLnJldm9rZU9iamVjdFVSTChibG9iKTtcbiAgICByZXR1cm4gd29ya2VyO1xufVxuXG4vKipcbiAgKiBFbmNvZGVzIGZyYW1lcyBpbiBXZWJNIGNvbnRhaW5lci4gSXQgdXNlcyBXZWJXb3JraW52b2tlIHRvIGludm9rZSAnQXJyYXlUb1dlYk0nIG1ldGhvZC5cbiAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayAtIENhbGxiYWNrIGZ1bmN0aW9uLCB0aGF0IGlzIHVzZWQgdG8gcGFzcyByZWNvcmRlZCBibG9iIGJhY2sgdG8gdGhlIGNhbGxlZS5cbiAgKiBAbWV0aG9kXG4gICogQG1lbWJlcm9mIFdoYW1teVxuICAqIEBleGFtcGxlXG4gICogcmVjb3JkZXIgPSBuZXcgV2hhbW15KCkuVmlkZW8oMC44LCAxMDApO1xuICAqIHJlY29yZGVyLmNvbXBpbGUoZnVuY3Rpb24oYmxvYikge1xuICAqICAgIC8vIGJsb2Iuc2l6ZSAtIGJsb2IudHlwZVxuICAqIH0pO1xuICAqL1xuV2hhbW15VmlkZW8ucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciB3ZWJXb3JrZXIgPSBwcm9jZXNzSW5XZWJXb3JrZXIod2hhbW15SW5XZWJXb3JrZXIpO1xuXG4gICAgd2ViV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmIChldmVudC5kYXRhLmVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGV2ZW50LmRhdGEuZXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKGV2ZW50LmRhdGEpO1xuICAgIH07XG5cbiAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UodGhpcy5mcmFtZXMpO1xufTtcbiIsIi8vIF9fX19fX19fX19fX19fX19fXG4vLyBXaGFtbXlSZWNvcmRlci5qc1xuXG4vKipcbiAqIFdoYW1teVJlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIHZpZGVvIHJlY29yZGluZyBpbiBDaHJvbWUuIEl0IHJ1bnMgdG9wIG92ZXIge0BsaW5rIFdoYW1teX0uXG4gKiBAc3VtbWFyeSBWaWRlbyByZWNvcmRpbmcgZmVhdHVyZSBpbiBDaHJvbWUuXG4gKiBAdHlwZWRlZiBXaGFtbXlSZWNvcmRlclxuICogQGNsYXNzXG4gKiBAZXhhbXBsZVxuICogdmFyIHJlY29yZGVyID0gbmV3IFdoYW1teVJlY29yZGVyKG1lZGlhU3RyZWFtKTtcbiAqIHJlY29yZGVyLnJlY29yZCgpO1xuICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAqIH0pO1xuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXG4gKi9cblxudmFyIFdoYW1teSA9IHJlcXVpcmUoJy4vV2hhbW15JylcblxubW9kdWxlLmV4cG9ydHMgPSBXaGFtbXlSZWNvcmRlclxuXG5mdW5jdGlvbiBXaGFtbXlSZWNvcmRlcihtZWRpYVN0cmVhbSkge1xuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHJlY29yZHMgdmlkZW8uXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucmVjb3JkKCk7XG4gICAgICovXG4gICAgdGhpcy5yZWNvcmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCF0aGlzLndpZHRoKSB7XG4gICAgICAgICAgICB0aGlzLndpZHRoID0gMzIwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmhlaWdodCkge1xuICAgICAgICAgICAgdGhpcy5oZWlnaHQgPSAyNDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMudmlkZW8pIHtcbiAgICAgICAgICAgIHRoaXMudmlkZW8gPSB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jYW52YXMpIHtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjYW52YXMud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblxuICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgLy8gc2V0dGluZyBkZWZhdWx0c1xuICAgICAgICBpZiAodGhpcy52aWRlbyAmJiB0aGlzLnZpZGVvIGluc3RhbmNlb2YgSFRNTFZpZGVvRWxlbWVudCkge1xuICAgICAgICAgICAgdmlkZW8gPSB0aGlzLnZpZGVvLmNsb25lTm9kZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xuICAgICAgICAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChtZWRpYVN0cmVhbSk7XG5cbiAgICAgICAgICAgIHZpZGVvLndpZHRoID0gdGhpcy52aWRlby53aWR0aDtcbiAgICAgICAgICAgIHZpZGVvLmhlaWdodCA9IHRoaXMudmlkZW8uaGVpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgdmlkZW8ubXV0ZWQgPSB0cnVlO1xuICAgICAgICB2aWRlby5wbGF5KCk7XG5cbiAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgd2hhbW15ID0gbmV3IFdoYW1teS5WaWRlbygpO1xuXG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NhbnZhcyByZXNvbHV0aW9ucycsIGNhbnZhcy53aWR0aCwgJyonLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCd2aWRlbyB3aWR0aC9oZWlnaHQnLCB2aWRlby53aWR0aCB8fCBjYW52YXMud2lkdGgsICcqJywgdmlkZW8uaGVpZ2h0IHx8IGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgZHJhd0ZyYW1lcygpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkcmF3RnJhbWVzKCkge1xuICAgICAgICB2YXIgZHVyYXRpb24gPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIGxhc3RUaW1lO1xuICAgICAgICBpZiAoIWR1cmF0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChkcmF3RnJhbWVzLCAxMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaXNQYXVzZWRSZWNvcmRpbmcpIHtcbiAgICAgICAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChkcmF3RnJhbWVzLCAxMDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmlhICMyMDYsIGJ5IEphY2sgaS5lLiBAU2V5bW91cnJcbiAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgICAgICBpZiAodmlkZW8ucGF1c2VkKSB7XG4gICAgICAgICAgICAvLyB2aWE6IGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vV2ViUlRDLUV4cGVyaW1lbnQvcHVsbC8zMTZcbiAgICAgICAgICAgIC8vIFR3ZWFrIGZvciBBbmRyb2lkIENocm9tZVxuICAgICAgICAgICAgdmlkZW8ucGxheSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UodmlkZW8sIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHdoYW1teS5mcmFtZXMucHVzaCh7XG4gICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24sXG4gICAgICAgICAgICBpbWFnZTogY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghaXNTdG9wRHJhd2luZykge1xuICAgICAgICAgICAgc2V0VGltZW91dChkcmF3RnJhbWVzLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYmxhY2sgZnJhbWVzIGZyb20gdGhlIGJlZ2lubmluZyB0byB0aGUgc3BlY2lmaWVkIGZyYW1lXG4gICAgICogQHBhcmFtIHtBcnJheX0gX2ZyYW1lcyAtIGFycmF5IG9mIGZyYW1lcyB0byBiZSBjaGVja2VkXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IF9mcmFtZXNUb0NoZWNrIC0gbnVtYmVyIG9mIGZyYW1lIHVudGlsIGNoZWNrIHdpbGwgYmUgZXhlY3V0ZWQgKC0xIC0gd2lsbCBkcm9wIGFsbCBmcmFtZXMgdW50aWwgZnJhbWUgbm90IG1hdGNoZWQgd2lsbCBiZSBmb3VuZClcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gX3BpeFRvbGVyYW5jZSAtIDAgLSB2ZXJ5IHN0cmljdCAob25seSBibGFjayBwaXhlbCBjb2xvcikgOyAxIC0gYWxsXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IF9mcmFtZVRvbGVyYW5jZSAtIDAgLSB2ZXJ5IHN0cmljdCAob25seSBibGFjayBmcmFtZSBjb2xvcikgOyAxIC0gYWxsXG4gICAgICogQHJldHVybnMge0FycmF5fSAtIGFycmF5IG9mIGZyYW1lc1xuICAgICAqL1xuICAgIC8vIHB1bGwjMjkzIGJ5IEB2b2xvZGFsZXhleVxuICAgIGZ1bmN0aW9uIGRyb3BCbGFja0ZyYW1lcyhfZnJhbWVzLCBfZnJhbWVzVG9DaGVjaywgX3BpeFRvbGVyYW5jZSwgX2ZyYW1lVG9sZXJhbmNlKSB7XG4gICAgICAgIHZhciBsb2NhbENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgICAgICBsb2NhbENhbnZhcy53aWR0aCA9IGNhbnZhcy53aWR0aDtcbiAgICAgICAgbG9jYWxDYW52YXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodDtcbiAgICAgICAgdmFyIGNvbnRleHQyZCA9IGxvY2FsQ2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIHZhciByZXN1bHRGcmFtZXMgPSBbXTtcblxuICAgICAgICB2YXIgY2hlY2tVbnRpbE5vdEJsYWNrID0gX2ZyYW1lc1RvQ2hlY2sgPT09IC0xO1xuICAgICAgICB2YXIgZW5kQ2hlY2tGcmFtZSA9IChfZnJhbWVzVG9DaGVjayAmJiBfZnJhbWVzVG9DaGVjayA+IDAgJiYgX2ZyYW1lc1RvQ2hlY2sgPD0gX2ZyYW1lcy5sZW5ndGgpID9cbiAgICAgICAgICAgIF9mcmFtZXNUb0NoZWNrIDogX2ZyYW1lcy5sZW5ndGg7XG4gICAgICAgIHZhciBzYW1wbGVDb2xvciA9IHtcbiAgICAgICAgICAgIHI6IDAsXG4gICAgICAgICAgICBnOiAwLFxuICAgICAgICAgICAgYjogMFxuICAgICAgICB9O1xuICAgICAgICB2YXIgbWF4Q29sb3JEaWZmZXJlbmNlID0gTWF0aC5zcXJ0KFxuICAgICAgICAgICAgTWF0aC5wb3coMjU1LCAyKSArXG4gICAgICAgICAgICBNYXRoLnBvdygyNTUsIDIpICtcbiAgICAgICAgICAgIE1hdGgucG93KDI1NSwgMilcbiAgICAgICAgKTtcbiAgICAgICAgdmFyIHBpeFRvbGVyYW5jZSA9IF9waXhUb2xlcmFuY2UgJiYgX3BpeFRvbGVyYW5jZSA+PSAwICYmIF9waXhUb2xlcmFuY2UgPD0gMSA/IF9waXhUb2xlcmFuY2UgOiAwO1xuICAgICAgICB2YXIgZnJhbWVUb2xlcmFuY2UgPSBfZnJhbWVUb2xlcmFuY2UgJiYgX2ZyYW1lVG9sZXJhbmNlID49IDAgJiYgX2ZyYW1lVG9sZXJhbmNlIDw9IDEgPyBfZnJhbWVUb2xlcmFuY2UgOiAwO1xuICAgICAgICB2YXIgZG9Ob3RDaGVja05leHQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKHZhciBmID0gMDsgZiA8IGVuZENoZWNrRnJhbWU7IGYrKykge1xuICAgICAgICAgICAgdmFyIG1hdGNoUGl4Q291bnQsIGVuZFBpeENoZWNrLCBtYXhQaXhDb3VudDtcblxuICAgICAgICAgICAgaWYgKCFkb05vdENoZWNrTmV4dCkge1xuICAgICAgICAgICAgICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgICAgICAgICAgIGltYWdlLnNyYyA9IF9mcmFtZXNbZl0uaW1hZ2U7XG4gICAgICAgICAgICAgICAgY29udGV4dDJkLmRyYXdJbWFnZShpbWFnZSwgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2VEYXRhID0gY29udGV4dDJkLmdldEltYWdlRGF0YSgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICAgICAgICAgIG1hdGNoUGl4Q291bnQgPSAwO1xuICAgICAgICAgICAgICAgIGVuZFBpeENoZWNrID0gaW1hZ2VEYXRhLmRhdGEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIG1heFBpeENvdW50ID0gaW1hZ2VEYXRhLmRhdGEubGVuZ3RoIC8gNDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIHBpeCA9IDA7IHBpeCA8IGVuZFBpeENoZWNrOyBwaXggKz0gNCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY3VycmVudENvbG9yID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcjogaW1hZ2VEYXRhLmRhdGFbcGl4XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGc6IGltYWdlRGF0YS5kYXRhW3BpeCArIDFdLFxuICAgICAgICAgICAgICAgICAgICAgICAgYjogaW1hZ2VEYXRhLmRhdGFbcGl4ICsgMl1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbG9yRGlmZmVyZW5jZSA9IE1hdGguc3FydChcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRDb2xvci5yIC0gc2FtcGxlQ29sb3IuciwgMikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coY3VycmVudENvbG9yLmcgLSBzYW1wbGVDb2xvci5nLCAyKSArXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhjdXJyZW50Q29sb3IuYiAtIHNhbXBsZUNvbG9yLmIsIDIpXG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGRpZmZlcmVuY2UgaW4gY29sb3IgaXQgaXMgZGlmZmVyZW5jZSBpbiBjb2xvciB2ZWN0b3JzIChyMSxnMSxiMSkgPD0+IChyMixnMixiMilcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbG9yRGlmZmVyZW5jZSA8PSBtYXhDb2xvckRpZmZlcmVuY2UgKiBwaXhUb2xlcmFuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoUGl4Q291bnQrKztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFkb05vdENoZWNrTmV4dCAmJiBtYXhQaXhDb3VudCAtIG1hdGNoUGl4Q291bnQgPD0gbWF4UGl4Q291bnQgKiBmcmFtZVRvbGVyYW5jZSkge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdyZW1vdmVkIGJsYWNrIGZyYW1lIDogJyArIGYgKyAnIDsgZnJhbWUgZHVyYXRpb24gJyArIF9mcmFtZXNbZl0uZHVyYXRpb24pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnZnJhbWUgaXMgcGFzc2VkIDogJyArIGYpO1xuICAgICAgICAgICAgICAgIGlmIChjaGVja1VudGlsTm90QmxhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgZG9Ob3RDaGVja05leHQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXN1bHRGcmFtZXMucHVzaChfZnJhbWVzW2ZdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdEZyYW1lcyA9IHJlc3VsdEZyYW1lcy5jb25jYXQoX2ZyYW1lcy5zbGljZShlbmRDaGVja0ZyYW1lKSk7XG5cbiAgICAgICAgaWYgKHJlc3VsdEZyYW1lcy5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgLy8gYXQgbGVhc3Qgb25lIGxhc3QgZnJhbWUgc2hvdWxkIGJlIGF2YWlsYWJsZSBmb3IgbmV4dCBtYW5pcHVsYXRpb25cbiAgICAgICAgICAgIC8vIGlmIHRvdGFsIGR1cmF0aW9uIG9mIGFsbCBmcmFtZXMgd2lsbCBiZSA8IDEwMDAgdGhhbiBmZm1wZWcgZG9lc24ndCB3b3JrIHdlbGwuLi5cbiAgICAgICAgICAgIHJlc3VsdEZyYW1lcy5wdXNoKF9mcmFtZXNbX2ZyYW1lcy5sZW5ndGggLSAxXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0RnJhbWVzO1xuICAgIH1cblxuICAgIHZhciBpc1N0b3BEcmF3aW5nID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcgdmlkZW8uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgaXNTdG9wRHJhd2luZyA9IHRydWU7XG5cbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgLy8gYW5hbHlzZSBvZiBhbGwgZnJhbWVzIHRha2VzIHNvbWUgdGltZSFcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGUuZy4gZHJvcEJsYWNrRnJhbWVzKGZyYW1lcywgMTAsIDEsIDEpIC0gd2lsbCBjdXQgYWxsIDEwIGZyYW1lc1xuICAgICAgICAgICAgLy8gZS5nLiBkcm9wQmxhY2tGcmFtZXMoZnJhbWVzLCAxMCwgMC41LCAwLjUpIC0gd2lsbCBhbmFseXNlIDEwIGZyYW1lc1xuICAgICAgICAgICAgLy8gZS5nLiBkcm9wQmxhY2tGcmFtZXMoZnJhbWVzLCAxMCkgPT09IGRyb3BCbGFja0ZyYW1lcyhmcmFtZXMsIDEwLCAwLCAwKSAtIHdpbGwgYW5hbHlzZSAxMCBmcmFtZXMgd2l0aCBzdHJpY3QgYmxhY2sgY29sb3JcbiAgICAgICAgICAgIHdoYW1teS5mcmFtZXMgPSBkcm9wQmxhY2tGcmFtZXMod2hhbW15LmZyYW1lcywgLTEpO1xuXG4gICAgICAgICAgICAvLyB0byBkaXNwbGF5IGFkdmVydGlzZW1lbnQgaW1hZ2VzIVxuICAgICAgICAgICAgaWYgKHRoaXMuYWR2ZXJ0aXNlbWVudCAmJiB0aGlzLmFkdmVydGlzZW1lbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgd2hhbW15LmZyYW1lcyA9IHRoaXMuYWR2ZXJ0aXNlbWVudC5jb25jYXQod2hhbW15LmZyYW1lcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtCbG9ifSBibG9iIC0gUmVjb3JkZWQgZnJhbWVzIGluIHZpZGVvL3dlYm0gYmxvYi5cbiAgICAgICAgICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgKiAgICAgdmFyIGJsb2IgPSByZWNvcmRlci5ibG9iO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHdoYW1teS5jb21waWxlKGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5ibG9iID0gYmxvYjtcblxuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5ibG9iLmZvckVhY2gpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYmxvYiA9IG5ldyBCbG9iKFtdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndmlkZW8vd2VibSdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKF90aGlzLmJsb2IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMCk7XG4gICAgfTtcblxuICAgIHZhciBpc1BhdXNlZFJlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcGF1c2VzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFdoYW1teVJlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5wYXVzZSgpO1xuICAgICAqL1xuICAgIHRoaXMucGF1c2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaXNQYXVzZWRSZWNvcmRpbmcgPSB0cnVlO1xuXG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUGF1c2VkIHJlY29yZGluZy4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZXN1bWVzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFdoYW1teVJlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZXN1bWUoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpc1BhdXNlZFJlY29yZGluZyA9IGZhbHNlO1xuXG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVzdW1lZCByZWNvcmRpbmcuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICB2YXIgdmlkZW87XG4gICAgdmFyIGxhc3RUaW1lO1xuICAgIHZhciB3aGFtbXk7XG59XG4iLCJcbm1vZHVsZS5leHBvcnRzID0gd2hhbW15SW5XZWJXb3JrZXJcblxuZnVuY3Rpb24gd2hhbW15SW5XZWJXb3JrZXIoZnJhbWVzKSB7XG4gICAgZnVuY3Rpb24gQXJyYXlUb1dlYk0oZnJhbWVzKSB7XG4gICAgICAgIHZhciBpbmZvID0gY2hlY2tGcmFtZXMoZnJhbWVzKTtcbiAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2x1c3Rlck1heER1cmF0aW9uID0gMzAwMDA7XG5cbiAgICAgICAgdmFyIEVCTUwgPSBbe1xuICAgICAgICAgICAgJ2lkJzogMHgxYTQ1ZGZhMywgLy8gRUJNTFxuICAgICAgICAgICAgJ2RhdGEnOiBbe1xuICAgICAgICAgICAgICAgICdkYXRhJzogMSxcbiAgICAgICAgICAgICAgICAnaWQnOiAweDQyODYgLy8gRUJNTFZlcnNpb25cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAnZGF0YSc6IDEsXG4gICAgICAgICAgICAgICAgJ2lkJzogMHg0MmY3IC8vIEVCTUxSZWFkVmVyc2lvblxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICdkYXRhJzogNCxcbiAgICAgICAgICAgICAgICAnaWQnOiAweDQyZjIgLy8gRUJNTE1heElETGVuZ3RoXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgJ2RhdGEnOiA4LFxuICAgICAgICAgICAgICAgICdpZCc6IDB4NDJmMyAvLyBFQk1MTWF4U2l6ZUxlbmd0aFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICdkYXRhJzogJ3dlYm0nLFxuICAgICAgICAgICAgICAgICdpZCc6IDB4NDI4MiAvLyBEb2NUeXBlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgJ2RhdGEnOiAyLFxuICAgICAgICAgICAgICAgICdpZCc6IDB4NDI4NyAvLyBEb2NUeXBlVmVyc2lvblxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICdkYXRhJzogMixcbiAgICAgICAgICAgICAgICAnaWQnOiAweDQyODUgLy8gRG9jVHlwZVJlYWRWZXJzaW9uXG4gICAgICAgICAgICB9XVxuICAgICAgICB9LCB7XG4gICAgICAgICAgICAnaWQnOiAweDE4NTM4MDY3LCAvLyBTZWdtZW50XG4gICAgICAgICAgICAnZGF0YSc6IFt7XG4gICAgICAgICAgICAgICAgJ2lkJzogMHgxNTQ5YTk2NiwgLy8gSW5mb1xuICAgICAgICAgICAgICAgICdkYXRhJzogW3tcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxZTYsIC8vZG8gdGhpbmdzIGluIG1pbGxpc2VjcyAobnVtIG9mIG5hbm9zZWNzIGZvciBkdXJhdGlvbiBzY2FsZSlcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHgyYWQ3YjEgLy8gVGltZWNvZGVTY2FsZVxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnd2hhbW15JyxcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0ZDgwIC8vIE11eGluZ0FwcFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnd2hhbW15JyxcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg1NzQxIC8vIFdyaXRpbmdBcHBcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICdkYXRhJzogZG91YmxlVG9TdHJpbmcoaW5mby5kdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDQ4OSAvLyBEdXJhdGlvblxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgJ2lkJzogMHgxNjU0YWU2YiwgLy8gVHJhY2tzXG4gICAgICAgICAgICAgICAgJ2RhdGEnOiBbe1xuICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGFlLCAvLyBUcmFja0VudHJ5XG4gICAgICAgICAgICAgICAgICAgICdkYXRhJzogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4ZDcgLy8gVHJhY2tOdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg3M2M1IC8vIFRyYWNrVUlEXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4OWMgLy8gRmxhZ0xhY2luZ1xuICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6ICd1bmQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHgyMmI1OWMgLy8gTGFuZ3VhZ2VcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnVl9WUDgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg4NiAvLyBDb2RlY0lEXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogJ1ZQOCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDI1ODY4OCAvLyBDb2RlY05hbWVcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg4MyAvLyBUcmFja1R5cGVcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHhlMCwgLy8gVmlkZW9cbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IGluZm8ud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHhiMCAvLyBQaXhlbFdpZHRoXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBpbmZvLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGJhIC8vIFBpeGVsSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XVxuICAgICAgICB9XTtcblxuICAgICAgICAvL0dlbmVyYXRlIGNsdXN0ZXJzIChtYXggZHVyYXRpb24pXG4gICAgICAgIHZhciBmcmFtZU51bWJlciA9IDA7XG4gICAgICAgIHZhciBjbHVzdGVyVGltZWNvZGUgPSAwO1xuICAgICAgICB3aGlsZSAoZnJhbWVOdW1iZXIgPCBmcmFtZXMubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIHZhciBjbHVzdGVyRnJhbWVzID0gW107XG4gICAgICAgICAgICB2YXIgY2x1c3RlckR1cmF0aW9uID0gMDtcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBjbHVzdGVyRnJhbWVzLnB1c2goZnJhbWVzW2ZyYW1lTnVtYmVyXSk7XG4gICAgICAgICAgICAgICAgY2x1c3RlckR1cmF0aW9uICs9IGZyYW1lc1tmcmFtZU51bWJlcl0uZHVyYXRpb247XG4gICAgICAgICAgICAgICAgZnJhbWVOdW1iZXIrKztcbiAgICAgICAgICAgIH0gd2hpbGUgKGZyYW1lTnVtYmVyIDwgZnJhbWVzLmxlbmd0aCAmJiBjbHVzdGVyRHVyYXRpb24gPCBjbHVzdGVyTWF4RHVyYXRpb24pO1xuXG4gICAgICAgICAgICB2YXIgY2x1c3RlckNvdW50ZXIgPSAwO1xuICAgICAgICAgICAgdmFyIGNsdXN0ZXIgPSB7XG4gICAgICAgICAgICAgICAgJ2lkJzogMHgxZjQzYjY3NSwgLy8gQ2x1c3RlclxuICAgICAgICAgICAgICAgICdkYXRhJzogZ2V0Q2x1c3RlckRhdGEoY2x1c3RlclRpbWVjb2RlLCBjbHVzdGVyQ291bnRlciwgY2x1c3RlckZyYW1lcylcbiAgICAgICAgICAgIH07IC8vQWRkIGNsdXN0ZXIgdG8gc2VnbWVudFxuICAgICAgICAgICAgRUJNTFsxXS5kYXRhLnB1c2goY2x1c3Rlcik7XG4gICAgICAgICAgICBjbHVzdGVyVGltZWNvZGUgKz0gY2x1c3RlckR1cmF0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGdlbmVyYXRlRUJNTChFQk1MKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDbHVzdGVyRGF0YShjbHVzdGVyVGltZWNvZGUsIGNsdXN0ZXJDb3VudGVyLCBjbHVzdGVyRnJhbWVzKSB7XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgJ2RhdGEnOiBjbHVzdGVyVGltZWNvZGUsXG4gICAgICAgICAgICAnaWQnOiAweGU3IC8vIFRpbWVjb2RlXG4gICAgICAgIH1dLmNvbmNhdChjbHVzdGVyRnJhbWVzLm1hcChmdW5jdGlvbih3ZWJwKSB7XG4gICAgICAgICAgICB2YXIgYmxvY2sgPSBtYWtlU2ltcGxlQmxvY2soe1xuICAgICAgICAgICAgICAgIGRpc2NhcmRhYmxlOiAwLFxuICAgICAgICAgICAgICAgIGZyYW1lOiB3ZWJwLmRhdGEuc2xpY2UoNCksXG4gICAgICAgICAgICAgICAgaW52aXNpYmxlOiAwLFxuICAgICAgICAgICAgICAgIGtleWZyYW1lOiAxLFxuICAgICAgICAgICAgICAgIGxhY2luZzogMCxcbiAgICAgICAgICAgICAgICB0cmFja051bTogMSxcbiAgICAgICAgICAgICAgICB0aW1lY29kZTogTWF0aC5yb3VuZChjbHVzdGVyQ291bnRlcilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2x1c3RlckNvdW50ZXIgKz0gd2VicC5kdXJhdGlvbjtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZGF0YTogYmxvY2ssXG4gICAgICAgICAgICAgICAgaWQ6IDB4YTNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvLyBzdW1zIHRoZSBsZW5ndGhzIG9mIGFsbCB0aGUgZnJhbWVzIGFuZCBnZXRzIHRoZSBkdXJhdGlvblxuXG4gICAgZnVuY3Rpb24gY2hlY2tGcmFtZXMoZnJhbWVzKSB7XG4gICAgICAgIGlmICghZnJhbWVzWzBdKSB7XG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgZXJyb3I6ICdTb21ldGhpbmcgd2VudCB3cm9uZy4gTWF5YmUgV2ViUCBmb3JtYXQgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGUgY3VycmVudCBicm93c2VyLidcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoID0gZnJhbWVzWzBdLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0ID0gZnJhbWVzWzBdLmhlaWdodCxcbiAgICAgICAgICAgIGR1cmF0aW9uID0gZnJhbWVzWzBdLmR1cmF0aW9uO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgZnJhbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkdXJhdGlvbiArPSBmcmFtZXNbaV0uZHVyYXRpb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcbiAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbnVtVG9CdWZmZXIobnVtKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IFtdO1xuICAgICAgICB3aGlsZSAobnVtID4gMCkge1xuICAgICAgICAgICAgcGFydHMucHVzaChudW0gJiAweGZmKTtcbiAgICAgICAgICAgIG51bSA9IG51bSA+PiA4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShwYXJ0cy5yZXZlcnNlKCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN0clRvQnVmZmVyKHN0cikge1xuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoc3RyLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgcmV0dXJuIGUuY2hhckNvZGVBdCgwKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJpdHNUb0J1ZmZlcihiaXRzKSB7XG4gICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgIHZhciBwYWQgPSAoYml0cy5sZW5ndGggJSA4KSA/IChuZXcgQXJyYXkoMSArIDggLSAoYml0cy5sZW5ndGggJSA4KSkpLmpvaW4oJzAnKSA6ICcnO1xuICAgICAgICBiaXRzID0gcGFkICsgYml0cztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaXRzLmxlbmd0aDsgaSArPSA4KSB7XG4gICAgICAgICAgICBkYXRhLnB1c2gocGFyc2VJbnQoYml0cy5zdWJzdHIoaSwgOCksIDIpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVFQk1MKGpzb24pIHtcbiAgICAgICAgdmFyIGVibWwgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqc29uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGpzb25baV0uZGF0YTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIGRhdGEgPSBnZW5lcmF0ZUVCTUwoZGF0YSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICBkYXRhID0gYml0c1RvQnVmZmVyKGRhdGEudG9TdHJpbmcoMikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHN0clRvQnVmZmVyKGRhdGEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbGVuID0gZGF0YS5zaXplIHx8IGRhdGEuYnl0ZUxlbmd0aCB8fCBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciB6ZXJvZXMgPSBNYXRoLmNlaWwoTWF0aC5jZWlsKE1hdGgubG9nKGxlbikgLyBNYXRoLmxvZygyKSkgLyA4KTtcbiAgICAgICAgICAgIHZhciBzaXplVG9TdHJpbmcgPSBsZW4udG9TdHJpbmcoMik7XG4gICAgICAgICAgICB2YXIgcGFkZGVkID0gKG5ldyBBcnJheSgoemVyb2VzICogNyArIDcgKyAxKSAtIHNpemVUb1N0cmluZy5sZW5ndGgpKS5qb2luKCcwJykgKyBzaXplVG9TdHJpbmc7XG4gICAgICAgICAgICB2YXIgc2l6ZSA9IChuZXcgQXJyYXkoemVyb2VzKSkuam9pbignMCcpICsgJzEnICsgcGFkZGVkO1xuXG4gICAgICAgICAgICBlYm1sLnB1c2gobnVtVG9CdWZmZXIoanNvbltpXS5pZCkpO1xuICAgICAgICAgICAgZWJtbC5wdXNoKGJpdHNUb0J1ZmZlcihzaXplKSk7XG4gICAgICAgICAgICBlYm1sLnB1c2goZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IEJsb2IoZWJtbCwge1xuICAgICAgICAgICAgdHlwZTogJ3ZpZGVvL3dlYm0nXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRvQmluU3RyT2xkKGJpdHMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAnJztcbiAgICAgICAgdmFyIHBhZCA9IChiaXRzLmxlbmd0aCAlIDgpID8gKG5ldyBBcnJheSgxICsgOCAtIChiaXRzLmxlbmd0aCAlIDgpKSkuam9pbignMCcpIDogJyc7XG4gICAgICAgIGJpdHMgPSBwYWQgKyBiaXRzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJpdHMubGVuZ3RoOyBpICs9IDgpIHtcbiAgICAgICAgICAgIGRhdGEgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChiaXRzLnN1YnN0cihpLCA4KSwgMikpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VTaW1wbGVCbG9jayhkYXRhKSB7XG4gICAgICAgIHZhciBmbGFncyA9IDA7XG5cbiAgICAgICAgaWYgKGRhdGEua2V5ZnJhbWUpIHtcbiAgICAgICAgICAgIGZsYWdzIHw9IDEyODtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmludmlzaWJsZSkge1xuICAgICAgICAgICAgZmxhZ3MgfD0gODtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmxhY2luZykge1xuICAgICAgICAgICAgZmxhZ3MgfD0gKGRhdGEubGFjaW5nIDw8IDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuZGlzY2FyZGFibGUpIHtcbiAgICAgICAgICAgIGZsYWdzIHw9IDE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS50cmFja051bSA+IDEyNykge1xuICAgICAgICAgICAgdGhyb3cgJ1RyYWNrTnVtYmVyID4gMTI3IG5vdCBzdXBwb3J0ZWQnO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG91dCA9IFtkYXRhLnRyYWNrTnVtIHwgMHg4MCwgZGF0YS50aW1lY29kZSA+PiA4LCBkYXRhLnRpbWVjb2RlICYgMHhmZiwgZmxhZ3NdLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShlKTtcbiAgICAgICAgfSkuam9pbignJykgKyBkYXRhLmZyYW1lO1xuXG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VXZWJQKHJpZmYpIHtcbiAgICAgICAgdmFyIFZQOCA9IHJpZmYuUklGRlswXS5XRUJQWzBdO1xuXG4gICAgICAgIHZhciBmcmFtZVN0YXJ0ID0gVlA4LmluZGV4T2YoJ1xceDlkXFx4MDFcXHgyYScpOyAvLyBBIFZQOCBrZXlmcmFtZSBzdGFydHMgd2l0aCB0aGUgMHg5ZDAxMmEgaGVhZGVyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBjID0gW107IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIGNbaV0gPSBWUDguY2hhckNvZGVBdChmcmFtZVN0YXJ0ICsgMyArIGkpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdpZHRoLCBoZWlnaHQsIHRtcDtcblxuICAgICAgICAvL3RoZSBjb2RlIGJlbG93IGlzIGxpdGVyYWxseSBjb3BpZWQgdmVyYmF0aW0gZnJvbSB0aGUgYml0c3RyZWFtIHNwZWNcbiAgICAgICAgdG1wID0gKGNbMV0gPDwgOCkgfCBjWzBdO1xuICAgICAgICB3aWR0aCA9IHRtcCAmIDB4M0ZGRjtcbiAgICAgICAgdG1wID0gKGNbM10gPDwgOCkgfCBjWzJdO1xuICAgICAgICBoZWlnaHQgPSB0bXAgJiAweDNGRkY7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGRhdGE6IFZQOCxcbiAgICAgICAgICAgIHJpZmY6IHJpZmZcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRTdHJMZW5ndGgoc3RyaW5nLCBvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHN0cmluZy5zdWJzdHIob2Zmc2V0ICsgNCwgNCkuc3BsaXQoJycpLm1hcChmdW5jdGlvbihpKSB7XG4gICAgICAgICAgICB2YXIgdW5wYWRkZWQgPSBpLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMik7XG4gICAgICAgICAgICByZXR1cm4gKG5ldyBBcnJheSg4IC0gdW5wYWRkZWQubGVuZ3RoICsgMSkpLmpvaW4oJzAnKSArIHVucGFkZGVkO1xuICAgICAgICB9KS5qb2luKCcnKSwgMik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VSSUZGKHN0cmluZykge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gMDtcbiAgICAgICAgdmFyIGNodW5rcyA9IHt9O1xuXG4gICAgICAgIHdoaWxlIChvZmZzZXQgPCBzdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgaWQgPSBzdHJpbmcuc3Vic3RyKG9mZnNldCwgNCk7XG4gICAgICAgICAgICB2YXIgbGVuID0gZ2V0U3RyTGVuZ3RoKHN0cmluZywgb2Zmc2V0KTtcbiAgICAgICAgICAgIHZhciBkYXRhID0gc3RyaW5nLnN1YnN0cihvZmZzZXQgKyA0ICsgNCwgbGVuKTtcbiAgICAgICAgICAgIG9mZnNldCArPSA0ICsgNCArIGxlbjtcbiAgICAgICAgICAgIGNodW5rc1tpZF0gPSBjaHVua3NbaWRdIHx8IFtdO1xuXG4gICAgICAgICAgICBpZiAoaWQgPT09ICdSSUZGJyB8fCBpZCA9PT0gJ0xJU1QnKSB7XG4gICAgICAgICAgICAgICAgY2h1bmtzW2lkXS5wdXNoKHBhcnNlUklGRihkYXRhKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNodW5rc1tpZF0ucHVzaChkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2h1bmtzO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRvdWJsZVRvU3RyaW5nKG51bSkge1xuICAgICAgICByZXR1cm4gW10uc2xpY2UuY2FsbChcbiAgICAgICAgICAgIG5ldyBVaW50OEFycmF5KChuZXcgRmxvYXQ2NEFycmF5KFtudW1dKSkuYnVmZmVyKSwgMCkubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGUpO1xuICAgICAgICB9KS5yZXZlcnNlKCkuam9pbignJyk7XG4gICAgfVxuXG4gICAgdmFyIHdlYm0gPSBuZXcgQXJyYXlUb1dlYk0oZnJhbWVzLm1hcChmdW5jdGlvbihmcmFtZSkge1xuICAgICAgICB2YXIgd2VicCA9IHBhcnNlV2ViUChwYXJzZVJJRkYoYXRvYihmcmFtZS5pbWFnZS5zbGljZSgyMykpKSk7XG4gICAgICAgIHdlYnAuZHVyYXRpb24gPSBmcmFtZS5kdXJhdGlvbjtcbiAgICAgICAgcmV0dXJuIHdlYnA7XG4gICAgfSkpO1xuXG4gICAgcG9zdE1lc3NhZ2Uod2VibSk7XG59XG5cbiIsIi8qIVxuICogYXN5bmNcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9jYW9sYW4vYXN5bmNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IENhb2xhbiBNY01haG9uXG4gKiBSZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqL1xuLypqc2hpbnQgb25ldmFyOiBmYWxzZSwgaW5kZW50OjQgKi9cbi8qZ2xvYmFsIHNldEltbWVkaWF0ZTogZmFsc2UsIHNldFRpbWVvdXQ6IGZhbHNlLCBjb25zb2xlOiBmYWxzZSAqL1xuKGZ1bmN0aW9uICgpIHtcblxuICAgIHZhciBhc3luYyA9IHt9O1xuXG4gICAgLy8gZ2xvYmFsIG9uIHRoZSBzZXJ2ZXIsIHdpbmRvdyBpbiB0aGUgYnJvd3NlclxuICAgIHZhciByb290LCBwcmV2aW91c19hc3luYztcblxuICAgIHJvb3QgPSB0aGlzO1xuICAgIGlmIChyb290ICE9IG51bGwpIHtcbiAgICAgIHByZXZpb3VzX2FzeW5jID0gcm9vdC5hc3luYztcbiAgICB9XG5cbiAgICBhc3luYy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByb290LmFzeW5jID0gcHJldmlvdXNfYXN5bmM7XG4gICAgICAgIHJldHVybiBhc3luYztcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gb25seV9vbmNlKGZuKSB7XG4gICAgICAgIHZhciBjYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKGNhbGxlZCkgdGhyb3cgbmV3IEVycm9yKFwiQ2FsbGJhY2sgd2FzIGFscmVhZHkgY2FsbGVkLlwiKTtcbiAgICAgICAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgICAgICAgICBmbi5hcHBseShyb290LCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8vLyBjcm9zcy1icm93c2VyIGNvbXBhdGlibGl0eSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgdmFyIF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgICAgICAgcmV0dXJuIF90b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIHZhciBfZWFjaCA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yKSB7XG4gICAgICAgIGlmIChhcnIuZm9yRWFjaCkge1xuICAgICAgICAgICAgcmV0dXJuIGFyci5mb3JFYWNoKGl0ZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgICAgICAgaXRlcmF0b3IoYXJyW2ldLCBpLCBhcnIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBfbWFwID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IpIHtcbiAgICAgICAgaWYgKGFyci5tYXApIHtcbiAgICAgICAgICAgIHJldHVybiBhcnIubWFwKGl0ZXJhdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICBfZWFjaChhcnIsIGZ1bmN0aW9uICh4LCBpLCBhKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goaXRlcmF0b3IoeCwgaSwgYSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcblxuICAgIHZhciBfcmVkdWNlID0gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIG1lbW8pIHtcbiAgICAgICAgaWYgKGFyci5yZWR1Y2UpIHtcbiAgICAgICAgICAgIHJldHVybiBhcnIucmVkdWNlKGl0ZXJhdG9yLCBtZW1vKTtcbiAgICAgICAgfVxuICAgICAgICBfZWFjaChhcnIsIGZ1bmN0aW9uICh4LCBpLCBhKSB7XG4gICAgICAgICAgICBtZW1vID0gaXRlcmF0b3IobWVtbywgeCwgaSwgYSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbWVtbztcbiAgICB9O1xuXG4gICAgdmFyIF9rZXlzID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0LmtleXMpIHtcbiAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopO1xuICAgICAgICB9XG4gICAgICAgIHZhciBrZXlzID0gW107XG4gICAgICAgIGZvciAodmFyIGsgaW4gb2JqKSB7XG4gICAgICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgIH07XG5cbiAgICAvLy8vIGV4cG9ydGVkIGFzeW5jIG1vZHVsZSBmdW5jdGlvbnMgLy8vL1xuXG4gICAgLy8vLyBuZXh0VGljayBpbXBsZW1lbnRhdGlvbiB3aXRoIGJyb3dzZXItY29tcGF0aWJsZSBmYWxsYmFjayAvLy8vXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAndW5kZWZpbmVkJyB8fCAhKHByb2Nlc3MubmV4dFRpY2spKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBhc3luYy5uZXh0VGljayA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgICAgIC8vIG5vdCBhIGRpcmVjdCBhbGlhcyBmb3IgSUUxMCBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBhc3luYy5uZXh0VGljaztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFzeW5jLm5leHRUaWNrID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlID0gYXN5bmMubmV4dFRpY2s7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGFzeW5jLm5leHRUaWNrID0gcHJvY2Vzcy5uZXh0VGljaztcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgLy8gbm90IGEgZGlyZWN0IGFsaWFzIGZvciBJRTEwIGNvbXBhdGliaWxpdHlcbiAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZuKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUgPSBhc3luYy5uZXh0VGljaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jLmVhY2ggPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgaWYgKCFhcnIubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY29tcGxldGVkID0gMDtcbiAgICAgICAgX2VhY2goYXJyLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgaXRlcmF0b3IoeCwgb25seV9vbmNlKGRvbmUpICk7XG4gICAgICAgIH0pO1xuICAgICAgICBmdW5jdGlvbiBkb25lKGVycikge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGNvbXBsZXRlZCArPSAxO1xuICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGFzeW5jLmZvckVhY2ggPSBhc3luYy5lYWNoO1xuXG4gICAgYXN5bmMuZWFjaFNlcmllcyA9IGZ1bmN0aW9uIChhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBpZiAoIWFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjb21wbGV0ZWQgPSAwO1xuICAgICAgICB2YXIgaXRlcmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKGFycltjb21wbGV0ZWRdLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZWQgPj0gYXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZXJhdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBpdGVyYXRlKCk7XG4gICAgfTtcbiAgICBhc3luYy5mb3JFYWNoU2VyaWVzID0gYXN5bmMuZWFjaFNlcmllcztcblxuICAgIGFzeW5jLmVhY2hMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIGZuID0gX2VhY2hMaW1pdChsaW1pdCk7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIFthcnIsIGl0ZXJhdG9yLCBjYWxsYmFja10pO1xuICAgIH07XG4gICAgYXN5bmMuZm9yRWFjaExpbWl0ID0gYXN5bmMuZWFjaExpbWl0O1xuXG4gICAgdmFyIF9lYWNoTGltaXQgPSBmdW5jdGlvbiAobGltaXQpIHtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgaWYgKCFhcnIubGVuZ3RoIHx8IGxpbWl0IDw9IDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb21wbGV0ZWQgPSAwO1xuICAgICAgICAgICAgdmFyIHN0YXJ0ZWQgPSAwO1xuICAgICAgICAgICAgdmFyIHJ1bm5pbmcgPSAwO1xuXG4gICAgICAgICAgICAoZnVuY3Rpb24gcmVwbGVuaXNoICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHJ1bm5pbmcgPCBsaW1pdCAmJiBzdGFydGVkIDwgYXJyLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzdGFydGVkICs9IDE7XG4gICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgaXRlcmF0b3IoYXJyW3N0YXJ0ZWQgLSAxXSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlZCArPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJ1bm5pbmcgLT0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVkID49IGFyci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcGxlbmlzaCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG5cbiAgICB2YXIgZG9QYXJhbGxlbCA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIFthc3luYy5lYWNoXS5jb25jYXQoYXJncykpO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgdmFyIGRvUGFyYWxsZWxMaW1pdCA9IGZ1bmN0aW9uKGxpbWl0LCBmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIFtfZWFjaExpbWl0KGxpbWl0KV0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHZhciBkb1NlcmllcyA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KG51bGwsIFthc3luYy5lYWNoU2VyaWVzXS5jb25jYXQoYXJncykpO1xuICAgICAgICB9O1xuICAgIH07XG5cblxuICAgIHZhciBfYXN5bmNNYXAgPSBmdW5jdGlvbiAoZWFjaGZuLCBhcnIsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhcnIgPSBfbWFwKGFyciwgZnVuY3Rpb24gKHgsIGkpIHtcbiAgICAgICAgICAgIHJldHVybiB7aW5kZXg6IGksIHZhbHVlOiB4fTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgudmFsdWUsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKHgudmFsdWUsIGZ1bmN0aW9uIChlcnIsIHYpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0c1t4LmluZGV4XSA9IHY7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyLCByZXN1bHRzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBhc3luYy5tYXAgPSBkb1BhcmFsbGVsKF9hc3luY01hcCk7XG4gICAgYXN5bmMubWFwU2VyaWVzID0gZG9TZXJpZXMoX2FzeW5jTWFwKTtcbiAgICBhc3luYy5tYXBMaW1pdCA9IGZ1bmN0aW9uIChhcnIsIGxpbWl0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgcmV0dXJuIF9tYXBMaW1pdChsaW1pdCkoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgIH07XG5cbiAgICB2YXIgX21hcExpbWl0ID0gZnVuY3Rpb24obGltaXQpIHtcbiAgICAgICAgcmV0dXJuIGRvUGFyYWxsZWxMaW1pdChsaW1pdCwgX2FzeW5jTWFwKTtcbiAgICB9O1xuXG4gICAgLy8gcmVkdWNlIG9ubHkgaGFzIGEgc2VyaWVzIHZlcnNpb24sIGFzIGRvaW5nIHJlZHVjZSBpbiBwYXJhbGxlbCB3b24ndFxuICAgIC8vIHdvcmsgaW4gbWFueSBzaXR1YXRpb25zLlxuICAgIGFzeW5jLnJlZHVjZSA9IGZ1bmN0aW9uIChhcnIsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoU2VyaWVzKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihtZW1vLCB4LCBmdW5jdGlvbiAoZXJyLCB2KSB7XG4gICAgICAgICAgICAgICAgbWVtbyA9IHY7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhlcnIsIG1lbW8pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIC8vIGluamVjdCBhbGlhc1xuICAgIGFzeW5jLmluamVjdCA9IGFzeW5jLnJlZHVjZTtcbiAgICAvLyBmb2xkbCBhbGlhc1xuICAgIGFzeW5jLmZvbGRsID0gYXN5bmMucmVkdWNlO1xuXG4gICAgYXN5bmMucmVkdWNlUmlnaHQgPSBmdW5jdGlvbiAoYXJyLCBtZW1vLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJldmVyc2VkID0gX21hcChhcnIsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSkucmV2ZXJzZSgpO1xuICAgICAgICBhc3luYy5yZWR1Y2UocmV2ZXJzZWQsIG1lbW8sIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcbiAgICAvLyBmb2xkciBhbGlhc1xuICAgIGFzeW5jLmZvbGRyID0gYXN5bmMucmVkdWNlUmlnaHQ7XG5cbiAgICB2YXIgX2ZpbHRlciA9IGZ1bmN0aW9uIChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIGFyciA9IF9tYXAoYXJyLCBmdW5jdGlvbiAoeCwgaSkge1xuICAgICAgICAgICAgcmV0dXJuIHtpbmRleDogaSwgdmFsdWU6IHh9O1xuICAgICAgICB9KTtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LnZhbHVlLCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGFzeW5jLmZpbHRlciA9IGRvUGFyYWxsZWwoX2ZpbHRlcik7XG4gICAgYXN5bmMuZmlsdGVyU2VyaWVzID0gZG9TZXJpZXMoX2ZpbHRlcik7XG4gICAgLy8gc2VsZWN0IGFsaWFzXG4gICAgYXN5bmMuc2VsZWN0ID0gYXN5bmMuZmlsdGVyO1xuICAgIGFzeW5jLnNlbGVjdFNlcmllcyA9IGFzeW5jLmZpbHRlclNlcmllcztcblxuICAgIHZhciBfcmVqZWN0ID0gZnVuY3Rpb24gKGVhY2hmbiwgYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgYXJyID0gX21hcChhcnIsIGZ1bmN0aW9uICh4LCBpKSB7XG4gICAgICAgICAgICByZXR1cm4ge2luZGV4OiBpLCB2YWx1ZTogeH07XG4gICAgICAgIH0pO1xuICAgICAgICBlYWNoZm4oYXJyLCBmdW5jdGlvbiAoeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yKHgudmFsdWUsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgICAgICAgaWYgKCF2KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhfbWFwKHJlc3VsdHMuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhLmluZGV4IC0gYi5pbmRleDtcbiAgICAgICAgICAgIH0pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB4LnZhbHVlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGFzeW5jLnJlamVjdCA9IGRvUGFyYWxsZWwoX3JlamVjdCk7XG4gICAgYXN5bmMucmVqZWN0U2VyaWVzID0gZG9TZXJpZXMoX3JlamVjdCk7XG5cbiAgICB2YXIgX2RldGVjdCA9IGZ1bmN0aW9uIChlYWNoZm4sIGFyciwgaXRlcmF0b3IsIG1haW5fY2FsbGJhY2spIHtcbiAgICAgICAgZWFjaGZuKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBtYWluX2NhbGxiYWNrKHgpO1xuICAgICAgICAgICAgICAgICAgICBtYWluX2NhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBtYWluX2NhbGxiYWNrKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgYXN5bmMuZGV0ZWN0ID0gZG9QYXJhbGxlbChfZGV0ZWN0KTtcbiAgICBhc3luYy5kZXRlY3RTZXJpZXMgPSBkb1NlcmllcyhfZGV0ZWN0KTtcblxuICAgIGFzeW5jLnNvbWUgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgbWFpbl9jYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICh2KSB7XG4gICAgICAgICAgICAgICAgICAgIG1haW5fY2FsbGJhY2sodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIG1haW5fY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBtYWluX2NhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyBhbnkgYWxpYXNcbiAgICBhc3luYy5hbnkgPSBhc3luYy5zb21lO1xuXG4gICAgYXN5bmMuZXZlcnkgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgbWFpbl9jYWxsYmFjaykge1xuICAgICAgICBhc3luYy5lYWNoKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAodikge1xuICAgICAgICAgICAgICAgIGlmICghdikge1xuICAgICAgICAgICAgICAgICAgICBtYWluX2NhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgbWFpbl9jYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIG1haW5fY2FsbGJhY2sodHJ1ZSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgLy8gYWxsIGFsaWFzXG4gICAgYXN5bmMuYWxsID0gYXN5bmMuZXZlcnk7XG5cbiAgICBhc3luYy5zb3J0QnkgPSBmdW5jdGlvbiAoYXJyLCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgYXN5bmMubWFwKGFyciwgZnVuY3Rpb24gKHgsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpdGVyYXRvcih4LCBmdW5jdGlvbiAoZXJyLCBjcml0ZXJpYSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHt2YWx1ZTogeCwgY3JpdGVyaWE6IGNyaXRlcmlhfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBmbiA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IGxlZnQuY3JpdGVyaWEsIGIgPSByaWdodC5jcml0ZXJpYTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgX21hcChyZXN1bHRzLnNvcnQoZm4pLCBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4geC52YWx1ZTtcbiAgICAgICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBhc3luYy5hdXRvID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICB2YXIga2V5cyA9IF9rZXlzKHRhc2tzKTtcbiAgICAgICAgdmFyIHJlbWFpbmluZ1Rhc2tzID0ga2V5cy5sZW5ndGhcbiAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzdWx0cyA9IHt9O1xuXG4gICAgICAgIHZhciBsaXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgdmFyIGFkZExpc3RlbmVyID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBsaXN0ZW5lcnMudW5zaGlmdChmbik7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0ZW5lcnMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAobGlzdGVuZXJzW2ldID09PSBmbikge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICB2YXIgdGFza0NvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVtYWluaW5nVGFza3MtLVxuICAgICAgICAgICAgX2VhY2gobGlzdGVuZXJzLnNsaWNlKDApLCBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgYWRkTGlzdGVuZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFyZW1haW5pbmdUYXNrcykge1xuICAgICAgICAgICAgICAgIHZhciB0aGVDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgZmluYWwgY2FsbGJhY2sgZnJvbSBjYWxsaW5nIGl0c2VsZiBpZiBpdCBlcnJvcnNcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGZ1bmN0aW9uICgpIHt9O1xuXG4gICAgICAgICAgICAgICAgdGhlQ2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9lYWNoKGtleXMsIGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICB2YXIgdGFzayA9IF9pc0FycmF5KHRhc2tzW2tdKSA/IHRhc2tzW2tdOiBbdGFza3Nba11dO1xuICAgICAgICAgICAgdmFyIHRhc2tDYWxsYmFjayA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNhZmVSZXN1bHRzID0ge307XG4gICAgICAgICAgICAgICAgICAgIF9lYWNoKF9rZXlzKHJlc3VsdHMpLCBmdW5jdGlvbihya2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1tya2V5XSA9IHJlc3VsdHNbcmtleV07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzYWZlUmVzdWx0c1trXSA9IGFyZ3M7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgc2FmZVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAvLyBzdG9wIHN1YnNlcXVlbnQgZXJyb3JzIGhpdHRpbmcgY2FsbGJhY2sgbXVsdGlwbGUgdGltZXNcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUodGFza0NvbXBsZXRlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdmFyIHJlcXVpcmVzID0gdGFzay5zbGljZSgwLCBNYXRoLmFicyh0YXNrLmxlbmd0aCAtIDEpKSB8fCBbXTtcbiAgICAgICAgICAgIHZhciByZWFkeSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX3JlZHVjZShyZXF1aXJlcywgZnVuY3Rpb24gKGEsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChhICYmIHJlc3VsdHMuaGFzT3duUHJvcGVydHkoeCkpO1xuICAgICAgICAgICAgICAgIH0sIHRydWUpICYmICFyZXN1bHRzLmhhc093blByb3BlcnR5KGspO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgdGFza1t0YXNrLmxlbmd0aCAtIDFdKHRhc2tDYWxsYmFjaywgcmVzdWx0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXNrW3Rhc2subGVuZ3RoIC0gMV0odGFza0NhbGxiYWNrLCByZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMucmV0cnkgPSBmdW5jdGlvbih0aW1lcywgdGFzaywgY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIERFRkFVTFRfVElNRVMgPSA1O1xuICAgICAgICB2YXIgYXR0ZW1wdHMgPSBbXTtcbiAgICAgICAgLy8gVXNlIGRlZmF1bHRzIGlmIHRpbWVzIG5vdCBwYXNzZWRcbiAgICAgICAgaWYgKHR5cGVvZiB0aW1lcyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSB0YXNrO1xuICAgICAgICAgICAgdGFzayA9IHRpbWVzO1xuICAgICAgICAgICAgdGltZXMgPSBERUZBVUxUX1RJTUVTO1xuICAgICAgICB9XG4gICAgICAgIC8vIE1ha2Ugc3VyZSB0aW1lcyBpcyBhIG51bWJlclxuICAgICAgICB0aW1lcyA9IHBhcnNlSW50KHRpbWVzLCAxMCkgfHwgREVGQVVMVF9USU1FUztcbiAgICAgICAgdmFyIHdyYXBwZWRUYXNrID0gZnVuY3Rpb24od3JhcHBlZENhbGxiYWNrLCB3cmFwcGVkUmVzdWx0cykge1xuICAgICAgICAgICAgdmFyIHJldHJ5QXR0ZW1wdCA9IGZ1bmN0aW9uKHRhc2ssIGZpbmFsQXR0ZW1wdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbihzZXJpZXNDYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrKGZ1bmN0aW9uKGVyciwgcmVzdWx0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcmllc0NhbGxiYWNrKCFlcnIgfHwgZmluYWxBdHRlbXB0LCB7ZXJyOiBlcnIsIHJlc3VsdDogcmVzdWx0fSk7XG4gICAgICAgICAgICAgICAgICAgIH0sIHdyYXBwZWRSZXN1bHRzKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHdoaWxlICh0aW1lcykge1xuICAgICAgICAgICAgICAgIGF0dGVtcHRzLnB1c2gocmV0cnlBdHRlbXB0KHRhc2ssICEodGltZXMtPTEpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhc3luYy5zZXJpZXMoYXR0ZW1wdHMsIGZ1bmN0aW9uKGRvbmUsIGRhdGEpe1xuICAgICAgICAgICAgICAgIGRhdGEgPSBkYXRhW2RhdGEubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICAgICAgKHdyYXBwZWRDYWxsYmFjayB8fCBjYWxsYmFjaykoZGF0YS5lcnIsIGRhdGEucmVzdWx0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIElmIGEgY2FsbGJhY2sgaXMgcGFzc2VkLCBydW4gdGhpcyBhcyBhIGNvbnRyb2xsIGZsb3dcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrID8gd3JhcHBlZFRhc2soKSA6IHdyYXBwZWRUYXNrXG4gICAgfTtcblxuICAgIGFzeW5jLndhdGVyZmFsbCA9IGZ1bmN0aW9uICh0YXNrcywgY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbiAoKSB7fTtcbiAgICAgICAgaWYgKCFfaXNBcnJheSh0YXNrcykpIHtcbiAgICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdGaXJzdCBhcmd1bWVudCB0byB3YXRlcmZhbGwgbXVzdCBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMnKTtcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdyYXBJdGVyYXRvciA9IGZ1bmN0aW9uIChpdGVyYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrID0gZnVuY3Rpb24gKCkge307XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXh0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5wdXNoKHdyYXBJdGVyYXRvcihuZXh0KSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLnB1c2goY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVyYXRvci5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgd3JhcEl0ZXJhdG9yKGFzeW5jLml0ZXJhdG9yKHRhc2tzKSkoKTtcbiAgICB9O1xuXG4gICAgdmFyIF9wYXJhbGxlbCA9IGZ1bmN0aW9uKGVhY2hmbiwgdGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgZnVuY3Rpb24gKCkge307XG4gICAgICAgIGlmIChfaXNBcnJheSh0YXNrcykpIHtcbiAgICAgICAgICAgIGVhY2hmbi5tYXAodGFza3MsIGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwobnVsbCwgZXJyLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgIGVhY2hmbi5lYWNoKF9rZXlzKHRhc2tzKSwgZnVuY3Rpb24gKGssIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgdGFza3Nba10oZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzLmxlbmd0aCA8PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2tdID0gYXJncztcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIsIHJlc3VsdHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgYXN5bmMucGFyYWxsZWwgPSBmdW5jdGlvbiAodGFza3MsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbCh7IG1hcDogYXN5bmMubWFwLCBlYWNoOiBhc3luYy5lYWNoIH0sIHRhc2tzLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnBhcmFsbGVsTGltaXQgPSBmdW5jdGlvbih0YXNrcywgbGltaXQsIGNhbGxiYWNrKSB7XG4gICAgICAgIF9wYXJhbGxlbCh7IG1hcDogX21hcExpbWl0KGxpbWl0KSwgZWFjaDogX2VhY2hMaW1pdChsaW1pdCkgfSwgdGFza3MsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuc2VyaWVzID0gZnVuY3Rpb24gKHRhc2tzLCBjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayA9IGNhbGxiYWNrIHx8IGZ1bmN0aW9uICgpIHt9O1xuICAgICAgICBpZiAoX2lzQXJyYXkodGFza3MpKSB7XG4gICAgICAgICAgICBhc3luYy5tYXBTZXJpZXModGFza3MsIGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICAgICAgICAgICAgZm4oZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwobnVsbCwgZXJyLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSB7fTtcbiAgICAgICAgICAgIGFzeW5jLmVhY2hTZXJpZXMoX2tleXModGFza3MpLCBmdW5jdGlvbiAoaywgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB0YXNrc1trXShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MubGVuZ3RoIDw9IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNba10gPSBhcmdzO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSwgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcmVzdWx0cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5pdGVyYXRvciA9IGZ1bmN0aW9uICh0YXNrcykge1xuICAgICAgICB2YXIgbWFrZUNhbGxiYWNrID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgZm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0YXNrc1tpbmRleF0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZuLm5leHQoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBmbi5uZXh0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5kZXggPCB0YXNrcy5sZW5ndGggLSAxKSA/IG1ha2VDYWxsYmFjayhpbmRleCArIDEpOiBudWxsO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiBmbjtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIG1ha2VDYWxsYmFjaygwKTtcbiAgICB9O1xuXG4gICAgYXN5bmMuYXBwbHkgPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmFwcGx5KFxuICAgICAgICAgICAgICAgIG51bGwsIGFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpXG4gICAgICAgICAgICApO1xuICAgICAgICB9O1xuICAgIH07XG5cbiAgICB2YXIgX2NvbmNhdCA9IGZ1bmN0aW9uIChlYWNoZm4sIGFyciwgZm4sIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciByID0gW107XG4gICAgICAgIGVhY2hmbihhcnIsIGZ1bmN0aW9uICh4LCBjYikge1xuICAgICAgICAgICAgZm4oeCwgZnVuY3Rpb24gKGVyciwgeSkge1xuICAgICAgICAgICAgICAgIHIgPSByLmNvbmNhdCh5IHx8IFtdKTtcbiAgICAgICAgICAgICAgICBjYihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVyciwgcik7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgYXN5bmMuY29uY2F0ID0gZG9QYXJhbGxlbChfY29uY2F0KTtcbiAgICBhc3luYy5jb25jYXRTZXJpZXMgPSBkb1NlcmllcyhfY29uY2F0KTtcblxuICAgIGFzeW5jLndoaWxzdCA9IGZ1bmN0aW9uICh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKHRlc3QoKSkge1xuICAgICAgICAgICAgaXRlcmF0b3IoZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFzeW5jLndoaWxzdCh0ZXN0LCBpdGVyYXRvciwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGFzeW5jLmRvV2hpbHN0ID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICBpdGVyYXRvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICBpZiAodGVzdC5hcHBseShudWxsLCBhcmdzKSkge1xuICAgICAgICAgICAgICAgIGFzeW5jLmRvV2hpbHN0KGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMudW50aWwgPSBmdW5jdGlvbiAodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghdGVzdCgpKSB7XG4gICAgICAgICAgICBpdGVyYXRvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYXN5bmMudW50aWwodGVzdCwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBhc3luYy5kb1VudGlsID0gZnVuY3Rpb24gKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjaykge1xuICAgICAgICBpdGVyYXRvcihmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICBpZiAoIXRlc3QuYXBwbHkobnVsbCwgYXJncykpIHtcbiAgICAgICAgICAgICAgICBhc3luYy5kb1VudGlsKGl0ZXJhdG9yLCB0ZXN0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgYXN5bmMucXVldWUgPSBmdW5jdGlvbiAod29ya2VyLCBjb25jdXJyZW5jeSkge1xuICAgICAgICBpZiAoY29uY3VycmVuY3kgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uY3VycmVuY3kgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIF9pbnNlcnQocSwgZGF0YSwgcG9zLCBjYWxsYmFjaykge1xuICAgICAgICAgIGlmICghcS5zdGFydGVkKXtcbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgaWYgKHEuZHJhaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfZWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG51bGxcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICBpZiAocG9zKSB7XG4gICAgICAgICAgICAgICAgcS50YXNrcy51bnNoaWZ0KGl0ZW0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHEudGFza3MucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmIChxLnNhdHVyYXRlZCAmJiBxLnRhc2tzLmxlbmd0aCA9PT0gcS5jb25jdXJyZW5jeSkge1xuICAgICAgICAgICAgICAgICAgcS5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhc3luYy5zZXRJbW1lZGlhdGUocS5wcm9jZXNzKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JrZXJzID0gMDtcbiAgICAgICAgdmFyIHEgPSB7XG4gICAgICAgICAgICB0YXNrczogW10sXG4gICAgICAgICAgICBjb25jdXJyZW5jeTogY29uY3VycmVuY3ksXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG51bGwsXG4gICAgICAgICAgICBlbXB0eTogbnVsbCxcbiAgICAgICAgICAgIGRyYWluOiBudWxsLFxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXG4gICAgICAgICAgICBwYXVzZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcHVzaDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgZmFsc2UsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBraWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIHEuZHJhaW4gPSBudWxsO1xuICAgICAgICAgICAgICBxLnRhc2tzID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdW5zaGlmdDogZnVuY3Rpb24gKGRhdGEsIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIF9pbnNlcnQocSwgZGF0YSwgdHJ1ZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXEucGF1c2VkICYmIHdvcmtlcnMgPCBxLmNvbmN1cnJlbmN5ICYmIHEudGFza3MubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXNrID0gcS50YXNrcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocS5lbXB0eSAmJiBxLnRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcS5lbXB0eSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcnMgKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3b3JrZXJzIC09IDE7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFzay5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhc2suY2FsbGJhY2suYXBwbHkodGFzaywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChxLmRyYWluICYmIHEudGFza3MubGVuZ3RoICsgd29ya2VycyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHEucHJvY2VzcygpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2IgPSBvbmx5X29uY2UobmV4dCk7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtlcih0YXNrLmRhdGEsIGNiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHEudGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2VycztcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpZGxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcS50YXNrcy5sZW5ndGggKyB3b3JrZXJzID09PSAwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBhdXNlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHEucGF1c2VkID09PSB0cnVlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBxLnByb2Nlc3MoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAocS5wYXVzZWQgPT09IGZhbHNlKSB7IHJldHVybjsgfVxuICAgICAgICAgICAgICAgIHEucGF1c2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcS5wcm9jZXNzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG4gICAgXG4gICAgYXN5bmMucHJpb3JpdHlRdWV1ZSA9IGZ1bmN0aW9uICh3b3JrZXIsIGNvbmN1cnJlbmN5KSB7XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBfY29tcGFyZVRhc2tzKGEsIGIpe1xuICAgICAgICAgIHJldHVybiBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIGZ1bmN0aW9uIF9iaW5hcnlTZWFyY2goc2VxdWVuY2UsIGl0ZW0sIGNvbXBhcmUpIHtcbiAgICAgICAgICB2YXIgYmVnID0gLTEsXG4gICAgICAgICAgICAgIGVuZCA9IHNlcXVlbmNlLmxlbmd0aCAtIDE7XG4gICAgICAgICAgd2hpbGUgKGJlZyA8IGVuZCkge1xuICAgICAgICAgICAgdmFyIG1pZCA9IGJlZyArICgoZW5kIC0gYmVnICsgMSkgPj4+IDEpO1xuICAgICAgICAgICAgaWYgKGNvbXBhcmUoaXRlbSwgc2VxdWVuY2VbbWlkXSkgPj0gMCkge1xuICAgICAgICAgICAgICBiZWcgPSBtaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBlbmQgPSBtaWQgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYmVnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjaykge1xuICAgICAgICAgIGlmICghcS5zdGFydGVkKXtcbiAgICAgICAgICAgIHEuc3RhcnRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoZGF0YS5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgIC8vIGNhbGwgZHJhaW4gaW1tZWRpYXRlbHkgaWYgdGhlcmUgYXJlIG5vIHRhc2tzXG4gICAgICAgICAgICAgcmV0dXJuIGFzeW5jLnNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgaWYgKHEuZHJhaW4pIHtcbiAgICAgICAgICAgICAgICAgICAgIHEuZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBfZWFjaChkYXRhLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgZGF0YTogdGFzayxcbiAgICAgICAgICAgICAgICAgIHByaW9yaXR5OiBwcmlvcml0eSxcbiAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiB0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicgPyBjYWxsYmFjayA6IG51bGxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHEudGFza3Muc3BsaWNlKF9iaW5hcnlTZWFyY2gocS50YXNrcywgaXRlbSwgX2NvbXBhcmVUYXNrcykgKyAxLCAwLCBpdGVtKTtcblxuICAgICAgICAgICAgICBpZiAocS5zYXR1cmF0ZWQgJiYgcS50YXNrcy5sZW5ndGggPT09IHEuY29uY3VycmVuY3kpIHtcbiAgICAgICAgICAgICAgICAgIHEuc2F0dXJhdGVkKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYXN5bmMuc2V0SW1tZWRpYXRlKHEucHJvY2Vzcyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIFN0YXJ0IHdpdGggYSBub3JtYWwgcXVldWVcbiAgICAgICAgdmFyIHEgPSBhc3luYy5xdWV1ZSh3b3JrZXIsIGNvbmN1cnJlbmN5KTtcbiAgICAgICAgXG4gICAgICAgIC8vIE92ZXJyaWRlIHB1c2ggdG8gYWNjZXB0IHNlY29uZCBwYXJhbWV0ZXIgcmVwcmVzZW50aW5nIHByaW9yaXR5XG4gICAgICAgIHEucHVzaCA9IGZ1bmN0aW9uIChkYXRhLCBwcmlvcml0eSwgY2FsbGJhY2spIHtcbiAgICAgICAgICBfaW5zZXJ0KHEsIGRhdGEsIHByaW9yaXR5LCBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBSZW1vdmUgdW5zaGlmdCBmdW5jdGlvblxuICAgICAgICBkZWxldGUgcS51bnNoaWZ0O1xuXG4gICAgICAgIHJldHVybiBxO1xuICAgIH07XG5cbiAgICBhc3luYy5jYXJnbyA9IGZ1bmN0aW9uICh3b3JrZXIsIHBheWxvYWQpIHtcbiAgICAgICAgdmFyIHdvcmtpbmcgICAgID0gZmFsc2UsXG4gICAgICAgICAgICB0YXNrcyAgICAgICA9IFtdO1xuXG4gICAgICAgIHZhciBjYXJnbyA9IHtcbiAgICAgICAgICAgIHRhc2tzOiB0YXNrcyxcbiAgICAgICAgICAgIHBheWxvYWQ6IHBheWxvYWQsXG4gICAgICAgICAgICBzYXR1cmF0ZWQ6IG51bGwsXG4gICAgICAgICAgICBlbXB0eTogbnVsbCxcbiAgICAgICAgICAgIGRyYWluOiBudWxsLFxuICAgICAgICAgICAgZHJhaW5lZDogdHJ1ZSxcbiAgICAgICAgICAgIHB1c2g6IGZ1bmN0aW9uIChkYXRhLCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmICghX2lzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IFtkYXRhXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX2VhY2goZGF0YSwgZnVuY3Rpb24odGFzaykge1xuICAgICAgICAgICAgICAgICAgICB0YXNrcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHRhc2ssXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogdHlwZW9mIGNhbGxiYWNrID09PSAnZnVuY3Rpb24nID8gY2FsbGJhY2sgOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjYXJnby5kcmFpbmVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjYXJnby5zYXR1cmF0ZWQgJiYgdGFza3MubGVuZ3RoID09PSBwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXJnby5zYXR1cmF0ZWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFzeW5jLnNldEltbWVkaWF0ZShjYXJnby5wcm9jZXNzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbiBwcm9jZXNzKCkge1xuICAgICAgICAgICAgICAgIGlmICh3b3JraW5nKSByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKHRhc2tzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZihjYXJnby5kcmFpbiAmJiAhY2FyZ28uZHJhaW5lZCkgY2FyZ28uZHJhaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgY2FyZ28uZHJhaW5lZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgdHMgPSB0eXBlb2YgcGF5bG9hZCA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IHRhc2tzLnNwbGljZSgwLCBwYXlsb2FkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGFza3Muc3BsaWNlKDAsIHRhc2tzLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgZHMgPSBfbWFwKHRzLCBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFzay5kYXRhO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYoY2FyZ28uZW1wdHkpIGNhcmdvLmVtcHR5KCk7XG4gICAgICAgICAgICAgICAgd29ya2luZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgd29ya2VyKGRzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmtpbmcgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgX2VhY2godHMsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEuY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsZW5ndGg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFza3MubGVuZ3RoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJ1bm5pbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gd29ya2luZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGNhcmdvO1xuICAgIH07XG5cbiAgICB2YXIgX2NvbnNvbGVfZm4gPSBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb25zb2xlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGNvbnNvbGVbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9lYWNoKGFyZ3MsIGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZVtuYW1lXSh4KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV0pKTtcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGFzeW5jLmxvZyA9IF9jb25zb2xlX2ZuKCdsb2cnKTtcbiAgICBhc3luYy5kaXIgPSBfY29uc29sZV9mbignZGlyJyk7XG4gICAgLyphc3luYy5pbmZvID0gX2NvbnNvbGVfZm4oJ2luZm8nKTtcbiAgICBhc3luYy53YXJuID0gX2NvbnNvbGVfZm4oJ3dhcm4nKTtcbiAgICBhc3luYy5lcnJvciA9IF9jb25zb2xlX2ZuKCdlcnJvcicpOyovXG5cbiAgICBhc3luYy5tZW1vaXplID0gZnVuY3Rpb24gKGZuLCBoYXNoZXIpIHtcbiAgICAgICAgdmFyIG1lbW8gPSB7fTtcbiAgICAgICAgdmFyIHF1ZXVlcyA9IHt9O1xuICAgICAgICBoYXNoZXIgPSBoYXNoZXIgfHwgZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgbWVtb2l6ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICAgICAgdmFyIGtleSA9IGhhc2hlci5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgICAgICAgIGlmIChrZXkgaW4gbWVtbykge1xuICAgICAgICAgICAgICAgIGFzeW5jLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgbWVtb1trZXldKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGtleSBpbiBxdWV1ZXMpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZXNba2V5XS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHF1ZXVlc1trZXldID0gW2NhbGxiYWNrXTtcbiAgICAgICAgICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzLmNvbmNhdChbZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBtZW1vW2tleV0gPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgICAgIHZhciBxID0gcXVldWVzW2tleV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBxdWV1ZXNba2V5XTtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBxLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgIHFbaV0uYXBwbHkobnVsbCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1dKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIG1lbW9pemVkLm1lbW8gPSBtZW1vO1xuICAgICAgICBtZW1vaXplZC51bm1lbW9pemVkID0gZm47XG4gICAgICAgIHJldHVybiBtZW1vaXplZDtcbiAgICB9O1xuXG4gICAgYXN5bmMudW5tZW1vaXplID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gKGZuLnVubWVtb2l6ZWQgfHwgZm4pLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH07XG5cbiAgICBhc3luYy50aW1lcyA9IGZ1bmN0aW9uIChjb3VudCwgaXRlcmF0b3IsIGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBjb3VudGVyID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgY291bnRlci5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhc3luYy5tYXAoY291bnRlciwgaXRlcmF0b3IsIGNhbGxiYWNrKTtcbiAgICB9O1xuXG4gICAgYXN5bmMudGltZXNTZXJpZXMgPSBmdW5jdGlvbiAoY291bnQsIGl0ZXJhdG9yLCBjYWxsYmFjaykge1xuICAgICAgICB2YXIgY291bnRlciA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGNvdW50ZXIucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYXN5bmMubWFwU2VyaWVzKGNvdW50ZXIsIGl0ZXJhdG9yLCBjYWxsYmFjayk7XG4gICAgfTtcblxuICAgIGFzeW5jLnNlcSA9IGZ1bmN0aW9uICgvKiBmdW5jdGlvbnMuLi4gKi8pIHtcbiAgICAgICAgdmFyIGZucyA9IGFyZ3VtZW50cztcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICBhc3luYy5yZWR1Y2UoZm5zLCBhcmdzLCBmdW5jdGlvbiAobmV3YXJncywgZm4sIGNiKSB7XG4gICAgICAgICAgICAgICAgZm4uYXBwbHkodGhhdCwgbmV3YXJncy5jb25jYXQoW2Z1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVyciA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5leHRhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgY2IoZXJyLCBuZXh0YXJncyk7XG4gICAgICAgICAgICAgICAgfV0pKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIsIHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjay5hcHBseSh0aGF0LCBbZXJyXS5jb25jYXQocmVzdWx0cykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIGFzeW5jLmNvbXBvc2UgPSBmdW5jdGlvbiAoLyogZnVuY3Rpb25zLi4uICovKSB7XG4gICAgICByZXR1cm4gYXN5bmMuc2VxLmFwcGx5KG51bGwsIEFycmF5LnByb3RvdHlwZS5yZXZlcnNlLmNhbGwoYXJndW1lbnRzKSk7XG4gICAgfTtcblxuICAgIHZhciBfYXBwbHlFYWNoID0gZnVuY3Rpb24gKGVhY2hmbiwgZm5zIC8qYXJncy4uLiovKSB7XG4gICAgICAgIHZhciBnbyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3MucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gZWFjaGZuKGZucywgZnVuY3Rpb24gKGZuLCBjYikge1xuICAgICAgICAgICAgICAgIGZuLmFwcGx5KHRoYXQsIGFyZ3MuY29uY2F0KFtjYl0pKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWxsYmFjayk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgICAgICAgICAgcmV0dXJuIGdvLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGdvO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBhc3luYy5hcHBseUVhY2ggPSBkb1BhcmFsbGVsKF9hcHBseUVhY2gpO1xuICAgIGFzeW5jLmFwcGx5RWFjaFNlcmllcyA9IGRvU2VyaWVzKF9hcHBseUVhY2gpO1xuXG4gICAgYXN5bmMuZm9yZXZlciA9IGZ1bmN0aW9uIChmbiwgY2FsbGJhY2spIHtcbiAgICAgICAgZnVuY3Rpb24gbmV4dChlcnIpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZuKG5leHQpO1xuICAgICAgICB9XG4gICAgICAgIG5leHQoKTtcbiAgICB9O1xuXG4gICAgLy8gTm9kZS5qc1xuICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGFzeW5jO1xuICAgIH1cbiAgICAvLyBBTUQgLyBSZXF1aXJlSlNcbiAgICBlbHNlIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGFzeW5jO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gaW5jbHVkZWQgZGlyZWN0bHkgdmlhIDxzY3JpcHQ+IHRhZ1xuICAgIGVsc2Uge1xuICAgICAgICByb290LmFzeW5jID0gYXN5bmM7XG4gICAgfVxuXG59KCkpO1xuIiwiLy8gTGFzdCB0aW1lIHVwZGF0ZWQgYXQgRmViIDEyLCAyMDE1LCAwODozMjoyM1xuXG4vLyBsaW5rczpcbi8vIE9wZW4tU291cmNlZDogaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVENcbi8vIGh0dHA6Ly9jZG4uV2ViUlRDLUV4cGVyaW1lbnQuY29tL1JlY29yZFJUQy5qc1xuLy8gaHR0cDovL3d3dy5XZWJSVEMtRXhwZXJpbWVudC5jb20vUmVjb3JkUlRDLmpzIChmb3IgQ2hpbmEgdXNlcnMpXG4vLyBodHRwOi8vUmVjb3JkUlRDLm9yZy9sYXRlc3QuanMgKGZvciBDaGluYSB1c2Vycylcbi8vIG5wbSBpbnN0YWxsIHJlY29yZHJ0Y1xuLy8gaHR0cDovL3JlY29yZHJ0Yy5vcmcvXG5cbi8vIHVwZGF0ZXM/XG4vKlxuLS4gRml4ZWQgZWNoby5cbi0uIFlvdSBjYW4gcGFzcyBcInJlY29yZGVyVHlwZVwiIC0gUmVjb3JkUlRDKHN0cmVhbSwgeyByZWNvcmRlclR5cGU6IHdpbmRvdy5XaGFtbXlSZWNvcmRlciB9KTtcbi0uIElmIE1lZGlhU3RyZWFtIGlzIHN1ZGRlbmx5IHN0b3BwZWQgaW4gRmlyZWZveC5cbi0uIEFkZGVkIFwiZGlzYWJsZUxvZ3NcIiAgICAgICAgIC0gUmVjb3JkUlRDKHN0cmVhbSwgeyBkaXNhYmxlTG9nczogdHJ1ZSB9KTtcbi0uIFlvdSBjYW4gcGFzcyBcImJ1ZmZlclNpemU6MFwiIC0gUmVjb3JkUlRDKHN0cmVhbSwgeyBidWZmZXJTaXplOiAwIH0pO1xuLS4gWW91IGNhbiBzZXQgXCJsZWZ0Q2hhbm5lbFwiICAgLSBSZWNvcmRSVEMoc3RyZWFtLCB7IGxlZnRDaGFubmVsOiB0cnVlIH0pO1xuLS4gRml4ZWQgTVJlY29yZFJUQy5cbi0uIEFkZGVkIGZ1bmN0aW9uYWxpdHkgZm9yIGFuYWx5c2UgYmxhY2sgZnJhbWVzIGFuZCBjdXQgdGhlbSAtIHB1bGwjMjkzXG4tLiBpZiB5b3UncmUgcmVjb3JkaW5nIEdJRiwgeW91IG11c3QgbGluazogaHR0cHM6Ly9jZG4ud2VicnRjLWV4cGVyaW1lbnQuY29tL2dpZi1yZWNvcmRlci5qc1xuKi9cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gQnJvd3NlcnMgU3VwcG9ydDo6XG4vLyBDaHJvbWUgKGFsbCB2ZXJzaW9ucykgWyBhdWRpby92aWRlbyBzZXBhcmF0ZWx5IF1cbi8vIEZpcmVmb3ggKCA+PSAyOSApIFsgYXVkaW8vdmlkZW8gaW4gc2luZ2xlIHdlYm0vbXA0IGNvbnRhaW5lciBvciBvbmx5IGF1ZGlvIGluIG9nZyBdXG4vLyBPcGVyYSAoYWxsIHZlcnNpb25zKSBbIHNhbWUgYXMgY2hyb21lIF1cbi8vIEFuZHJvaWQgKENocm9tZSkgWyBvbmx5IHZpZGVvIF1cbi8vIEFuZHJvaWQgKE9wZXJhKSBbIG9ubHkgdmlkZW8gXVxuLy8gQW5kcm9pZCAoRmlyZWZveCkgWyBvbmx5IHZpZGVvIF1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIE11YXogS2hhbiAgICAgLSB3d3cuTXVhektoYW4uY29tXG4vLyBNSVQgTGljZW5zZSAgIC0gd3d3LldlYlJUQy1FeHBlcmltZW50LmNvbS9saWNlbmNlXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gTm90ZTogUmVjb3JkUlRDLmpzIGlzIHVzaW5nIDMgb3RoZXIgbGlicmFyaWVzOyB5b3UgbmVlZCB0byBhY2NlcHQgdGhlaXIgbGljZW5jZXMgYXMgd2VsbC5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyAxLiBSZWNvcmRSVEMuanNcbi8vIDIuIE1SZWNvcmRSVEMuanNcbi8vIDMuIENyb3NzLUJyb3dzZXItRGVjbGFyYXRpb25zLmpzXG4vLyA0LiBTdG9yYWdlLmpzXG4vLyA1LiBNZWRpYVN0cmVhbVJlY29yZGVyLmpzXG4vLyA2LiBTdGVyZW9SZWNvcmRlci5qc1xuLy8gNy4gU3RlcmVvQXVkaW9SZWNvcmRlci5qc1xuLy8gOC4gQ2FudmFzUmVjb3JkZXIuanNcbi8vIDkuIFdoYW1teVJlY29yZGVyLmpzXG4vLyAxMC4gV2hhbW15LmpzXG4vLyAxMS4gRGlza1N0b3JhZ2UuanNcbi8vIDEyLiBHaWZSZWNvcmRlci5qc1xuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuJ3VzZSBzdHJpY3QnO1xuLy8gX19fX19fX19fX19fXG4vLyBSZWNvcmRSVEMuanNcblxuLyoqXG4gKiB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEN8UmVjb3JkUlRDfSBpcyBhIEphdmFTY3JpcHQtYmFzZWQgbWVkaWEtcmVjb3JkaW5nIGxpYnJhcnkgZm9yIG1vZGVybiB3ZWItYnJvd3NlcnMgKHN1cHBvcnRpbmcgV2ViUlRDIGdldFVzZXJNZWRpYSBBUEkpLiBJdCBpcyBvcHRpbWl6ZWQgZm9yIGRpZmZlcmVudCBkZXZpY2VzIGFuZCBicm93c2VycyB0byBicmluZyBhbGwgY2xpZW50LXNpZGUgKHBsdWdpbmZyZWUpIHJlY29yZGluZyBzb2x1dGlvbnMgaW4gc2luZ2xlIHBsYWNlLlxuICogQHN1bW1hcnkgSmF2YVNjcmlwdCBhdWRpby92aWRlbyByZWNvcmRpbmcgbGlicmFyeSBydW5zIHRvcCBvdmVyIFdlYlJUQyBnZXRVc2VyTWVkaWEgQVBJLlxuICogQGxpY2Vuc2Uge0BsaW5rIGh0dHBzOi8vd3d3LndlYnJ0Yy1leHBlcmltZW50LmNvbS9saWNlbmNlL3xNSVR9XG4gKiBAYXV0aG9yIHtAbGluayBodHRwczovL3d3dy5NdWF6S2hhbi5jb218TXVheiBLaGFufVxuICogQHR5cGVkZWYgUmVjb3JkUlRDXG4gKiBAY2xhc3NcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmVjb3JkUlRDID0gUmVjb3JkUlRDKG1lZGlhU3RyZWFtLCB7XG4gKiAgICAgdHlwZTogJ3ZpZGVvJyAvLyBhdWRpbyBvciB2aWRlbyBvciBnaWYgb3IgY2FudmFzXG4gKiB9KTtcbiAqXG4gKiAvLyBvciwgeW91IGNhbiBldmVuIHVzZSBrZXl3b3JkIFwibmV3XCJcbiAqIHZhciByZWNvcmRSVEMgPSBuZXcgUmVjb3JkUlRDKG1lZGlhU3RyZWFtWywgY29uZmlnXSk7XG4gKiBAc2VlIEZvciBmdXJ0aGVyIGluZm9ybWF0aW9uOlxuICogQHNlZSB7QGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL211YXota2hhbi9SZWNvcmRSVEN8UmVjb3JkUlRDIFNvdXJjZSBDb2RlfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gUmVjb3JkUlRDO1xuXG5mdW5jdGlvbiBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblxuICAgIGlmICghbWVkaWFTdHJlYW0pIHtcbiAgICAgICAgdGhyb3cgJ01lZGlhU3RyZWFtIGlzIG1hbmRhdG9yeS4nO1xuICAgIH1cblxuICAgIGlmICghY29uZmlnLnR5cGUpIHtcbiAgICAgICAgY29uZmlnLnR5cGUgPSAnYXVkaW8nO1xuICAgIH1cblxuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIHN0YXJ0UmVjb3JkaW5nKCkge1xuICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1Zygnc3RhcnRlZCByZWNvcmRpbmcgJyArIGNvbmZpZy50eXBlICsgJyBzdHJlYW0uJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNZWRpYSBTdHJlYW0gUmVjb3JkaW5nIEFQSSBoYXMgbm90IGJlZW4gaW1wbGVtZW50ZWQgaW4gY2hyb21lIHlldDtcbiAgICAgICAgLy8gVGhhdCdzIHdoeSB1c2luZyBXZWJBdWRpbyBBUEkgdG8gcmVjb3JkIHN0ZXJlbyBhdWRpbyBpbiBXQVYgZm9ybWF0XG4gICAgICAgIHZhciBSZWNvcmRlciA9IGlzQ2hyb21lID8gU3RlcmVvUmVjb3JkZXIgOiBNZWRpYVN0cmVhbVJlY29yZGVyO1xuXG4gICAgICAgIC8vIHZpZGVvIHJlY29yZGVyIChpbiBXZWJNIGZvcm1hdClcbiAgICAgICAgaWYgKGNvbmZpZy50eXBlID09PSAndmlkZW8nICYmIGlzQ2hyb21lKSB7XG4gICAgICAgICAgICBSZWNvcmRlciA9IFdoYW1teVJlY29yZGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmlkZW8gcmVjb3JkZXIgKGluIEdpZiBmb3JtYXQpXG4gICAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2dpZicpIHtcbiAgICAgICAgICAgIFJlY29yZGVyID0gR2lmUmVjb3JkZXI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBodG1sMmNhbnZhcyByZWNvcmRpbmchXG4gICAgICAgIGlmIChjb25maWcudHlwZSA9PT0gJ2NhbnZhcycpIHtcbiAgICAgICAgICAgIFJlY29yZGVyID0gQ2FudmFzUmVjb3JkZXI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29uZmlnLnJlY29yZGVyVHlwZSkge1xuICAgICAgICAgICAgUmVjb3JkZXIgPSBjb25maWcucmVjb3JkZXJUeXBlO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVkaWFSZWNvcmRlciA9IG5ldyBSZWNvcmRlcihtZWRpYVN0cmVhbSk7XG5cbiAgICAgICAgLy8gTWVyZ2UgYWxsIGRhdGEtdHlwZXMgZXhjZXB0IFwiZnVuY3Rpb25cIlxuICAgICAgICBtZWRpYVJlY29yZGVyID0gbWVyZ2VQcm9wcyhtZWRpYVJlY29yZGVyLCBjb25maWcpO1xuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25BdWRpb1Byb2Nlc3NTdGFydGVkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnLm9uQXVkaW9Qcm9jZXNzU3RhcnRlZCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBtZWRpYVJlY29yZGVyLm9uR2lmUHJldmlldyA9IGZ1bmN0aW9uKGdpZikge1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5vbkdpZlByZXZpZXcpIHtcbiAgICAgICAgICAgICAgICBjb25maWcub25HaWZQcmV2aWV3KGdpZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgbWVkaWFSZWNvcmRlci5yZWNvcmQoKTtcblxuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9wUmVjb3JkaW5nKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihXQVJOSU5HKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qanNoaW50IHZhbGlkdGhpczp0cnVlICovXG4gICAgICAgIHZhciByZWNvcmRSVEMgPSB0aGlzO1xuXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1N0b3BwZWQgcmVjb3JkaW5nICcgKyBjb25maWcudHlwZSArICcgc3RyZWFtLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbmZpZy50eXBlICE9PSAnZ2lmJykge1xuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5zdG9wKF9jYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcbiAgICAgICAgICAgIF9jYWxsYmFjaygpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gX2NhbGxiYWNrKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaXRlbSBpbiBtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZltpdGVtXSA9IG1lZGlhUmVjb3JkZXJbaXRlbV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHJlY29yZFJUQykge1xuICAgICAgICAgICAgICAgICAgICByZWNvcmRSVENbaXRlbV0gPSBtZWRpYVJlY29yZGVyW2l0ZW1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGJsb2IgPSBtZWRpYVJlY29yZGVyLmJsb2I7XG4gICAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayh1cmwpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYmxvYi50eXBlLCAnLT4nLCBieXRlc1RvU2l6ZShibG9iLnNpemUpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFjb25maWcuYXV0b1dyaXRlVG9EaXNrKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnZXREYXRhVVJMKGZ1bmN0aW9uKGRhdGFVUkwpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW1ldGVyID0ge307XG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyW2NvbmZpZy50eXBlICsgJ0Jsb2InXSA9IGRhdGFVUkw7XG4gICAgICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUocGFyYW1ldGVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGF1c2VSZWNvcmRpbmcoKSB7XG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihXQVJOSU5HKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vdCBhbGwgbGlicyB5ZXQgaGF2aW5nICB0aGlzIG1ldGhvZFxuICAgICAgICBpZiAobWVkaWFSZWNvcmRlci5wYXVzZSkge1xuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5wYXVzZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVGhpcyByZWNvcmRpbmcgbGlicmFyeSBpcyBoYXZpbmcgbm8gXCJwYXVzZVwiIG1ldGhvZC4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlc3VtZVJlY29yZGluZygpIHtcbiAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gY29uc29sZS53YXJuKFdBUk5JTkcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm90IGFsbCBsaWJzIHlldCBoYXZpbmcgIHRoaXMgbWV0aG9kXG4gICAgICAgIGlmIChtZWRpYVJlY29yZGVyLnJlc3VtZSkge1xuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5yZXN1bWUoKTtcbiAgICAgICAgfSBlbHNlIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoaXMgcmVjb3JkaW5nIGxpYnJhcnkgaXMgaGF2aW5nIG5vIFwicmVzdW1lXCIgbWV0aG9kLicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RGF0YVVSTChjYWxsYmFjaywgX21lZGlhUmVjb3JkZXIpIHtcbiAgICAgICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICAgICAgdGhyb3cgJ1Bhc3MgYSBjYWxsYmFjayBmdW5jdGlvbiBvdmVyIGdldERhdGFVUkwuJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBibG9iID0gX21lZGlhUmVjb3JkZXIgPyBfbWVkaWFSZWNvcmRlci5ibG9iIDogbWVkaWFSZWNvcmRlci5ibG9iO1xuXG4gICAgICAgIGlmICghYmxvYikge1xuICAgICAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0Jsb2IgZW5jb2RlciBkaWQgbm90IHlldCBmaW5pc2hlZCBpdHMgam9iLicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGdldERhdGFVUkwoY2FsbGJhY2ssIF9tZWRpYVJlY29yZGVyKTtcbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCEhd2luZG93Lldvcmtlcikge1xuICAgICAgICAgICAgdmFyIHdlYldvcmtlciA9IHByb2Nlc3NJbldlYldvcmtlcihmdW5jdGlvbiByZWFkRmlsZShfYmxvYikge1xuICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKG5ldyBGaWxlUmVhZGVyU3luYygpLnJlYWRBc0RhdGFVUkwoX2Jsb2IpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB3ZWJXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudC5kYXRhKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHdlYldvcmtlci5wb3N0TWVzc2FnZShibG9iKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwoYmxvYik7XG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhldmVudC50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzSW5XZWJXb3JrZXIoX2Z1bmN0aW9uKSB7XG4gICAgICAgICAgICB2YXIgYmxvYiA9IFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW19mdW5jdGlvbi50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICd0aGlzLm9ubWVzc2FnZSA9ICBmdW5jdGlvbiAoZSkge3JlYWRGaWxlKGUuZGF0YSk7fSdcbiAgICAgICAgICAgIF0sIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCdcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoYmxvYik7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgcmV0dXJuIHdvcmtlcjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciBXQVJOSU5HID0gJ0l0IHNlZW1zIHRoYXQgXCJzdGFydFJlY29yZGluZ1wiIGlzIG5vdCBpbnZva2VkIGZvciAnICsgY29uZmlnLnR5cGUgKyAnIHJlY29yZGVyLic7XG5cbiAgICB2YXIgbWVkaWFSZWNvcmRlcjtcblxuICAgIHZhciByZXR1cm5PYmplY3QgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBzdGFydHMgcmVjb3JkaW5nLiBJdCBkb2Vzbid0IHRha2UgYW55IGFyZ3VtZW50LlxuICAgICAgICAgKiBAbWV0aG9kXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZFJUQy5zdGFydFJlY29yZGluZygpO1xuICAgICAgICAgKi9cbiAgICAgICAgc3RhcnRSZWNvcmRpbmc6IHN0YXJ0UmVjb3JkaW5nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcuIEl0IHRha2VzIHNpbmdsZSBcImNhbGxiYWNrXCIgYXJndW1lbnQuIEl0IGlzIHN1Z2dlc3RlZCB0byBnZXQgYmxvYiBvciBVUkkgaW4gdGhlIGNhbGxiYWNrIHRvIG1ha2Ugc3VyZSBhbGwgZW5jb2RlcnMgZmluaXNoZWQgdGhlaXIgam9icy5cbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBUaGlzIGNhbGxiYWNrIGZ1bmN0aW9uIGlzIGludm9rZWQgYWZ0ZXIgY29tcGxldGlvbiBvZiBhbGwgZW5jb2Rpbmcgam9icy5cbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRSVEMuc3RvcFJlY29yZGluZyhmdW5jdGlvbih2aWRlb1VSTCkge1xuICAgICAgICAgKiAgICAgdmlkZW8uc3JjID0gdmlkZW9VUkw7XG4gICAgICAgICAqICAgICByZWNvcmRSVEMuYmxvYjsgcmVjb3JkUlRDLmJ1ZmZlcjtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICBzdG9wUmVjb3JkaW5nOiBzdG9wUmVjb3JkaW5nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAgICAgKiBAbWV0aG9kXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZFJUQy5wYXVzZVJlY29yZGluZygpO1xuICAgICAgICAgKi9cbiAgICAgICAgcGF1c2VSZWNvcmRpbmc6IHBhdXNlUmVjb3JkaW5nLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCByZXN1bWVzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRSVEMucmVzdW1lUmVjb3JkaW5nKCk7XG4gICAgICAgICAqL1xuICAgICAgICByZXN1bWVSZWNvcmRpbmc6IHJlc3VtZVJlY29yZGluZyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXQgaXMgZXF1aXZhbGVudCB0byA8Y29kZSBjbGFzcz1cInN0clwiPlwicmVjb3JkUlRDLmJsb2JcIjwvY29kZT4gcHJvcGVydHkuXG4gICAgICAgICAqIEBtZXRob2RcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogcmVjb3JkUlRDLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24oKSB7XG4gICAgICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZFJUQy5nZXRCbG9iKCk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyBlcXVpdmFsZW50IHRvOiByZWNvcmRSVEMuYmxvYiBwcm9wZXJ0eVxuICAgICAgICAgKiAgICAgdmFyIGJsb2IgPSByZWNvcmRSVEMuYmxvYjtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXRCbG9iOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oV0FSTklORyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBtZWRpYVJlY29yZGVyLmJsb2I7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgRGF0YVVSTC4gSXQgdGFrZXMgc2luZ2xlIFwiY2FsbGJhY2tcIiBhcmd1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBEYXRhVVJMIGlzIHBhc3NlZCBiYWNrIG92ZXIgdGhpcyBjYWxsYmFjay5cbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRSVEMuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcbiAgICAgICAgICogICAgIHJlY29yZFJUQy5nZXREYXRhVVJMKGZ1bmN0aW9uKGRhdGFVUkwpIHtcbiAgICAgICAgICogICAgICAgICB2aWRlby5zcmMgPSBkYXRhVVJMO1xuICAgICAgICAgKiAgICAgfSk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgZ2V0RGF0YVVSTDogZ2V0RGF0YVVSTCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhpcyBtZXRob2QgcmV0dXJucyBWaXJ1dGFsL0Jsb2IgVVJMLiBJdCBkb2Vzbid0IHRha2UgYW55IGFyZ3VtZW50LlxuICAgICAgICAgKiBAbWV0aG9kXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZFJUQy5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xuICAgICAgICAgKiAgICAgdmlkZW8uc3JjID0gcmVjb3JkUlRDLnRvVVJMKCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdG9VUkw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihXQVJOSU5HKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwobWVkaWFSZWNvcmRlci5ibG9iKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhpcyBtZXRob2Qgc2F2ZXMgYmxvYi9maWxlIGludG8gZGlzayAoYnkgaW5vdmtpbmcgc2F2ZS1hcyBkaWFsb2cpLiBJdCB0YWtlcyBzaW5nbGUgKG9wdGlvbmFsKSBhcmd1bWVudCBpLmUuIEZpbGVOYW1lXG4gICAgICAgICAqIEBtZXRob2RcbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogcmVjb3JkUlRDLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24oKSB7XG4gICAgICAgICAqICAgICByZWNvcmRSVEMuc2F2ZSgnZmlsZS1uYW1lJyk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oZmlsZU5hbWUpIHtcbiAgICAgICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGF0LnNhdmUoZmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgIH0sIDIwMDApO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oV0FSTklORyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBoeXBlcmxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBoeXBlcmxpbmsuaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwobWVkaWFSZWNvcmRlci5ibG9iKTtcbiAgICAgICAgICAgIGh5cGVybGluay50YXJnZXQgPSAnX2JsYW5rJztcbiAgICAgICAgICAgIGh5cGVybGluay5kb3dubG9hZCA9IChmaWxlTmFtZSB8fCAoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogOTk5OTk5OTk5OSkgKyA4ODg4ODg4ODgpKSArICcuJyArIG1lZGlhUmVjb3JkZXIuYmxvYi50eXBlLnNwbGl0KCcvJylbMV07XG5cbiAgICAgICAgICAgIHZhciBldnQgPSBuZXcgTW91c2VFdmVudCgnY2xpY2snLCB7XG4gICAgICAgICAgICAgICAgdmlldzogd2luZG93LFxuICAgICAgICAgICAgICAgIGJ1YmJsZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgY2FuY2VsYWJsZTogdHJ1ZVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGh5cGVybGluay5kaXNwYXRjaEV2ZW50KGV2dCk7XG5cbiAgICAgICAgICAgICh3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwpLnJldm9rZU9iamVjdFVSTChoeXBlcmxpbmsuaHJlZik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoaXMgbWV0aG9kIGdldHMgYmxvYiBmcm9tIGluZGV4ZWQtREIgc3RvcmFnZS4gSXQgdGFrZXMgc2luZ2xlIFwiY2FsbGJhY2tcIiBhcmd1bWVudC5cbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRSVEMuZ2V0RnJvbURpc2soZnVuY3Rpb24oZGF0YVVSTCkge1xuICAgICAgICAgKiAgICAgdmlkZW8uc3JjID0gZGF0YVVSTDtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXRGcm9tRGlzazogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25zb2xlLndhcm4oV0FSTklORyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFJlY29yZFJUQy5nZXRGcm9tRGlzayhjb25maWcudHlwZSwgY2FsbGJhY2spO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGlzIG1ldGhvZCBhcHBlbmRzIHByZXBlbmRzIGFycmF5IG9mIHdlYnAgaW1hZ2VzIHRvIHRoZSByZWNvcmRlZCB2aWRlby1ibG9iLiBJdCB0YWtlcyBhbiBcImFycmF5XCIgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7QXJyYXkuPEFycmF5Pn1cbiAgICAgICAgICogQHBhcmFtIHtBcnJheX0gYXJyYXlPZldlYlBJbWFnZXMgLSBBcnJheSBvZiB3ZWJwIGltYWdlcy5cbiAgICAgICAgICogQG1ldGhvZFxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiB2YXIgYXJyYXlPZldlYlBJbWFnZXMgPSBbXTtcbiAgICAgICAgICogYXJyYXlPZldlYlBJbWFnZXMucHVzaCh7XG4gICAgICAgICAqICAgICBkdXJhdGlvbjogaW5kZXgsXG4gICAgICAgICAqICAgICBpbWFnZTogJ2RhdGE6aW1hZ2Uvd2VicDtiYXNlNjQsLi4uJ1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICogcmVjb3JkUlRDLnNldEFkdmVydGlzZW1lbnRBcnJheShhcnJheU9mV2ViUEltYWdlcyk7XG4gICAgICAgICAqL1xuICAgICAgICBzZXRBZHZlcnRpc2VtZW50QXJyYXk6IGZ1bmN0aW9uKGFycmF5T2ZXZWJQSW1hZ2VzKSB7XG4gICAgICAgICAgICB0aGlzLmFkdmVydGlzZW1lbnQgPSBbXTtcblxuICAgICAgICAgICAgdmFyIGxlbmd0aCA9IGFycmF5T2ZXZWJQSW1hZ2VzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFkdmVydGlzZW1lbnQucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBpLFxuICAgICAgICAgICAgICAgICAgICBpbWFnZTogYXJyYXlPZldlYlBJbWFnZXNbaV1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSXQgaXMgZXF1aXZhbGVudCB0byA8Y29kZSBjbGFzcz1cInN0clwiPlwicmVjb3JkUlRDLmdldEJsb2IoKVwiPC9jb2RlPiBtZXRob2QuXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFJlY29yZGVkIEJsb2IgY2FuIGJlIGFjY2Vzc2VkIHVzaW5nIHRoaXMgcHJvcGVydHkuXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZFJUQy5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xuICAgICAgICAgKiAgICAgdmFyIGJsb2IgPSByZWNvcmRSVEMuYmxvYjtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgIC8vIGVxdWl2YWxlbnQgdG86IHJlY29yZFJUQy5nZXRCbG9iKCkgbWV0aG9kXG4gICAgICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZFJUQy5nZXRCbG9iKCk7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgYmxvYjogbnVsbCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHRvZG8gQWRkIGRlc2NyaXB0aW9ucy5cbiAgICAgICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGJ1ZmZlclNpemUgLSBFaXRoZXIgYXVkaW8gZGV2aWNlJ3MgZGVmYXVsdCBidWZmZXItc2l6ZSwgb3IgeW91ciBjdXN0b20gdmFsdWUuXG4gICAgICAgICAqIEBtZW1iZXJvZiBSZWNvcmRSVENcbiAgICAgICAgICogQGluc3RhbmNlXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZFJUQy5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKCkge1xuICAgICAgICAgKiAgICAgdmFyIGJ1ZmZlclNpemUgPSByZWNvcmRSVEMuYnVmZmVyU2l6ZTtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICBidWZmZXJTaXplOiAwLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdG9kbyBBZGQgZGVzY3JpcHRpb25zLlxuICAgICAgICAgKiBAcHJvcGVydHkge251bWJlcn0gc2FtcGxlUmF0ZSAtIEF1ZGlvIGRldmljZSdzIGRlZmF1bHQgc2FtcGxlIHJhdGVzLlxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRSVEMuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcbiAgICAgICAgICogICAgIHZhciBzYW1wbGVSYXRlID0gcmVjb3JkUlRDLnNhbXBsZVJhdGU7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgc2FtcGxlUmF0ZTogMCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHRvZG8gQWRkIGRlc2NyaXB0aW9ucy5cbiAgICAgICAgICogQHByb3BlcnR5IHtBcnJheUJ1ZmZlcn0gYnVmZmVyIC0gQXVkaW8gQXJyYXlCdWZmZXIsIHN1cHBvcnRlZCBvbmx5IGluIENocm9tZS5cbiAgICAgICAgICogQG1lbWJlcm9mIFJlY29yZFJUQ1xuICAgICAgICAgKiBAaW5zdGFuY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogcmVjb3JkUlRDLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24oKSB7XG4gICAgICAgICAqICAgICB2YXIgYnVmZmVyID0gcmVjb3JkUlRDLmJ1ZmZlcjtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICBidWZmZXI6IG51bGwsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0b2RvIEFkZCBkZXNjcmlwdGlvbnMuXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7RGF0YVZpZXd9IHZpZXcgLSBBdWRpbyBEYXRhVmlldywgc3VwcG9ydGVkIG9ubHkgaW4gQ2hyb21lLlxuICAgICAgICAgKiBAbWVtYmVyb2YgUmVjb3JkUlRDXG4gICAgICAgICAqIEBpbnN0YW5jZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRSVEMuc3RvcFJlY29yZGluZyhmdW5jdGlvbigpIHtcbiAgICAgICAgICogICAgIHZhciBkYXRhVmlldyA9IHJlY29yZFJUQy52aWV3O1xuICAgICAgICAgKiB9KTtcbiAgICAgICAgICovXG4gICAgICAgIHZpZXc6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKCF0aGlzKSB7XG4gICAgICAgIHJldHVybiByZXR1cm5PYmplY3Q7XG4gICAgfVxuXG4gICAgLy8gaWYgc29tZW9uZSB3YW5uYSB1c2UgUmVjb3JkUlRDIHdpdGggXCJuZXdcIiBrZXl3b3JkLlxuICAgIGZvciAodmFyIHByb3AgaW4gcmV0dXJuT2JqZWN0KSB7XG4gICAgICAgIHRoaXNbcHJvcF0gPSByZXR1cm5PYmplY3RbcHJvcF07XG4gICAgfVxuXG4gICAgcmV0dXJuIHJldHVybk9iamVjdDtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBnZXQgYWxsIHJlY29yZGVkIGJsb2JzIGZyb20gSW5kZXhlZERCIHN0b3JhZ2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtICdhbGwnIG9yICdhdWRpbycgb3IgJ3ZpZGVvJyBvciAnZ2lmJ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiB0byBnZXQgYWxsIHN0b3JlZCBibG9icy5cbiAqIEBtZXRob2RcbiAqIEBtZW1iZXJvZiBSZWNvcmRSVENcbiAqIEBleGFtcGxlXG4gKiBSZWNvcmRSVEMuZ2V0RnJvbURpc2soJ2FsbCcsIGZ1bmN0aW9uKGRhdGFVUkwsIHR5cGUpe1xuICogICAgIGlmKHR5cGUgPT09ICdhdWRpbycpIHsgfVxuICogICAgIGlmKHR5cGUgPT09ICd2aWRlbycpIHsgfVxuICogICAgIGlmKHR5cGUgPT09ICdnaWYnKSAgIHsgfVxuICogfSk7XG4gKi9cblJlY29yZFJUQy5nZXRGcm9tRGlzayA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCFjYWxsYmFjaykge1xuICAgICAgICB0aHJvdyAnY2FsbGJhY2sgaXMgbWFuZGF0b3J5Lic7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ0dldHRpbmcgcmVjb3JkZWQgJyArICh0eXBlID09PSAnYWxsJyA/ICdibG9icycgOiB0eXBlICsgJyBibG9iICcpICsgJyBmcm9tIGRpc2shJyk7XG4gICAgRGlza1N0b3JhZ2UuRmV0Y2goZnVuY3Rpb24oZGF0YVVSTCwgX3R5cGUpIHtcbiAgICAgICAgaWYgKHR5cGUgIT09ICdhbGwnICYmIF90eXBlID09PSB0eXBlICsgJ0Jsb2InICYmIGNhbGxiYWNrKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhkYXRhVVJMKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlID09PSAnYWxsJyAmJiBjYWxsYmFjaykge1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YVVSTCwgX3R5cGUucmVwbGFjZSgnQmxvYicsICcnKSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gc3RvcmUgcmVjb3JkZWQgYmxvYnMgaW50byBJbmRleGVkREIgc3RvcmFnZS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIC0ge2F1ZGlvOiBCbG9iLCB2aWRlbzogQmxvYiwgZ2lmOiBCbG9ifVxuICogQG1ldGhvZFxuICogQG1lbWJlcm9mIFJlY29yZFJUQ1xuICogQGV4YW1wbGVcbiAqIFJlY29yZFJUQy53cml0ZVRvRGlzayh7XG4gKiAgICAgYXVkaW86IGF1ZGlvQmxvYixcbiAqICAgICB2aWRlbzogdmlkZW9CbG9iLFxuICogICAgIGdpZiAgOiBnaWZCbG9iXG4gKiB9KTtcbiAqL1xuUmVjb3JkUlRDLndyaXRlVG9EaXNrID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIGNvbnNvbGUubG9nKCdXcml0aW5nIHJlY29yZGVkIGJsb2IocykgdG8gZGlzayEnKTtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBpZiAob3B0aW9ucy5hdWRpbyAmJiBvcHRpb25zLnZpZGVvICYmIG9wdGlvbnMuZ2lmKSB7XG4gICAgICAgIG9wdGlvbnMuYXVkaW8uZ2V0RGF0YVVSTChmdW5jdGlvbihhdWRpb0RhdGFVUkwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMudmlkZW8uZ2V0RGF0YVVSTChmdW5jdGlvbih2aWRlb0RhdGFVUkwpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmdpZi5nZXREYXRhVVJMKGZ1bmN0aW9uKGdpZkRhdGFVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYXVkaW9CbG9iOiBhdWRpb0RhdGFVUkwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWRlb0Jsb2I6IHZpZGVvRGF0YVVSTCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdpZkJsb2I6IGdpZkRhdGFVUkxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmF1ZGlvICYmIG9wdGlvbnMudmlkZW8pIHtcbiAgICAgICAgb3B0aW9ucy5hdWRpby5nZXREYXRhVVJMKGZ1bmN0aW9uKGF1ZGlvRGF0YVVSTCkge1xuICAgICAgICAgICAgb3B0aW9ucy52aWRlby5nZXREYXRhVVJMKGZ1bmN0aW9uKHZpZGVvRGF0YVVSTCkge1xuICAgICAgICAgICAgICAgIERpc2tTdG9yYWdlLlN0b3JlKHtcbiAgICAgICAgICAgICAgICAgICAgYXVkaW9CbG9iOiBhdWRpb0RhdGFVUkwsXG4gICAgICAgICAgICAgICAgICAgIHZpZGVvQmxvYjogdmlkZW9EYXRhVVJMXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmF1ZGlvICYmIG9wdGlvbnMuZ2lmKSB7XG4gICAgICAgIG9wdGlvbnMuYXVkaW8uZ2V0RGF0YVVSTChmdW5jdGlvbihhdWRpb0RhdGFVUkwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMuZ2lmLmdldERhdGFVUkwoZnVuY3Rpb24oZ2lmRGF0YVVSTCkge1xuICAgICAgICAgICAgICAgIERpc2tTdG9yYWdlLlN0b3JlKHtcbiAgICAgICAgICAgICAgICAgICAgYXVkaW9CbG9iOiBhdWRpb0RhdGFVUkwsXG4gICAgICAgICAgICAgICAgICAgIGdpZkJsb2I6IGdpZkRhdGFVUkxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMudmlkZW8gJiYgb3B0aW9ucy5naWYpIHtcbiAgICAgICAgb3B0aW9ucy52aWRlby5nZXREYXRhVVJMKGZ1bmN0aW9uKHZpZGVvRGF0YVVSTCkge1xuICAgICAgICAgICAgb3B0aW9ucy5naWYuZ2V0RGF0YVVSTChmdW5jdGlvbihnaWZEYXRhVVJMKSB7XG4gICAgICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUoe1xuICAgICAgICAgICAgICAgICAgICB2aWRlb0Jsb2I6IHZpZGVvRGF0YVVSTCxcbiAgICAgICAgICAgICAgICAgICAgZ2lmQmxvYjogZ2lmRGF0YVVSTFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5hdWRpbykge1xuICAgICAgICBvcHRpb25zLmF1ZGlvLmdldERhdGFVUkwoZnVuY3Rpb24oYXVkaW9EYXRhVVJMKSB7XG4gICAgICAgICAgICBEaXNrU3RvcmFnZS5TdG9yZSh7XG4gICAgICAgICAgICAgICAgYXVkaW9CbG9iOiBhdWRpb0RhdGFVUkxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMudmlkZW8pIHtcbiAgICAgICAgb3B0aW9ucy52aWRlby5nZXREYXRhVVJMKGZ1bmN0aW9uKHZpZGVvRGF0YVVSTCkge1xuICAgICAgICAgICAgRGlza1N0b3JhZ2UuU3RvcmUoe1xuICAgICAgICAgICAgICAgIHZpZGVvQmxvYjogdmlkZW9EYXRhVVJMXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChvcHRpb25zLmdpZikge1xuICAgICAgICBvcHRpb25zLmdpZi5nZXREYXRhVVJMKGZ1bmN0aW9uKGdpZkRhdGFVUkwpIHtcbiAgICAgICAgICAgIERpc2tTdG9yYWdlLlN0b3JlKHtcbiAgICAgICAgICAgICAgICBnaWZCbG9iOiBnaWZEYXRhVVJMXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbi8vIF9fX19fX19fX19fX19cbi8vIE1SZWNvcmRSVEMuanNcblxuLyoqXG4gKiBNUmVjb3JkUlRDIHJ1bnMgdG9wIG92ZXIge0BsaW5rIFJlY29yZFJUQ30gdG8gYnJpbmcgbXVsdGlwbGUgcmVjb3JkaW5ncyBpbiBzaW5nbGUgcGxhY2UsIGJ5IHByb3ZpZGluZyBzaW1wbGUgQVBJLlxuICogQHN1bW1hcnkgTVJlY29yZFJUQyBzdGFuZHMgZm9yIFwiTXVsdGlwbGUtUmVjb3JkUlRDXCIuXG4gKiBAbGljZW5zZSB7QGxpbmsgaHR0cHM6Ly93d3cud2VicnRjLWV4cGVyaW1lbnQuY29tL2xpY2VuY2UvfE1JVH1cbiAqIEBhdXRob3Ige0BsaW5rIGh0dHBzOi8vd3d3Lk11YXpLaGFuLmNvbXxNdWF6IEtoYW59XG4gKiBAdHlwZWRlZiBNUmVjb3JkUlRDXG4gKiBAY2xhc3NcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgTVJlY29yZFJUQygpO1xuICogcmVjb3JkZXIuYWRkU3RyZWFtKE1lZGlhU3RyZWFtKTtcbiAqIHJlY29yZGVyLm1lZGlhVHlwZSA9IHtcbiAqICAgICBhdWRpbzogdHJ1ZSxcbiAqICAgICB2aWRlbzogdHJ1ZSxcbiAqICAgICBnaWY6IHRydWVcbiAqIH07XG4gKiByZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xuICogQHNlZSBGb3IgZnVydGhlciBpbmZvcm1hdGlvbjpcbiAqIEBzZWUge0BsaW5rIGh0dHBzOi8vZ2l0aHViLmNvbS9tdWF6LWtoYW4vUmVjb3JkUlRDL3RyZWUvbWFzdGVyL01SZWNvcmRSVEN8TVJlY29yZFJUQyBTb3VyY2UgQ29kZX1cbiAqL1xuXG5mdW5jdGlvbiBNUmVjb3JkUlRDKG1lZGlhU3RyZWFtKSB7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBhdHRhY2hlcyBNZWRpYVN0cmVhbSBvYmplY3QgdG8ge0BsaW5rIE1SZWNvcmRSVEN9LlxuICAgICAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gQSBNZWRpYVN0cmVhbSBvYmplY3QsIGVpdGhlciBmZXRjaGVkIHVzaW5nIGdldFVzZXJNZWRpYSBBUEksIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5hZGRTdHJlYW0oTWVkaWFTdHJlYW0pO1xuICAgICAqL1xuICAgIHRoaXMuYWRkU3RyZWFtID0gZnVuY3Rpb24oX21lZGlhU3RyZWFtKSB7XG4gICAgICAgIGlmIChfbWVkaWFTdHJlYW0pIHtcbiAgICAgICAgICAgIG1lZGlhU3RyZWFtID0gX21lZGlhU3RyZWFtO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgcHJvcGVydHkgY2FuIGJlIHVzZWQgdG8gc2V0IHJlY29yZGluZyB0eXBlIGUuZy4gYXVkaW8sIG9yIHZpZGVvLCBvciBnaWYsIG9yIGNhbnZhcy5cbiAgICAgKiBAcHJvcGVydHkge29iamVjdH0gbWVkaWFUeXBlIC0ge2F1ZGlvOiB0cnVlLCB2aWRlbzogdHJ1ZSwgZ2lmOiB0cnVlfVxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgcmVjb3JkZXIgPSBuZXcgTVJlY29yZFJUQygpO1xuICAgICAqIHJlY29yZGVyLm1lZGlhVHlwZSA9IHtcbiAgICAgKiAgICAgYXVkaW86IHRydWUsXG4gICAgICogICAgIHZpZGVvOiB0cnVlLFxuICAgICAqICAgICBnaWYgIDogdHJ1ZVxuICAgICAqIH07XG4gICAgICovXG4gICAgdGhpcy5tZWRpYVR5cGUgPSB7XG4gICAgICAgIGF1ZGlvOiB0cnVlLFxuICAgICAgICB2aWRlbzogdHJ1ZVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBzdGFydHMgcmVjb3JkaW5nLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTVJlY29yZFJUQ1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RhcnRSZWNvcmRpbmcoKTtcbiAgICAgKi9cbiAgICB0aGlzLnN0YXJ0UmVjb3JkaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghaXNDaHJvbWUgJiYgbWVkaWFTdHJlYW0gJiYgbWVkaWFTdHJlYW0uZ2V0QXVkaW9UcmFja3MgJiYgbWVkaWFTdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5sZW5ndGggJiYgbWVkaWFTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIEZpcmVmb3ggaXMgc3VwcG9ydGluZyBib3RoIGF1ZGlvL3ZpZGVvIGluIHNpbmdsZSBibG9iXG4gICAgICAgICAgICB0aGlzLm1lZGlhVHlwZS5hdWRpbyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubWVkaWFUeXBlLmF1ZGlvKSB7XG4gICAgICAgICAgICB0aGlzLmF1ZGlvUmVjb3JkZXIgPSBuZXcgUmVjb3JkUlRDKG1lZGlhU3RyZWFtLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2F1ZGlvJyxcbiAgICAgICAgICAgICAgICBidWZmZXJTaXplOiB0aGlzLmJ1ZmZlclNpemUsXG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZTogdGhpcy5zYW1wbGVSYXRlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9SZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubWVkaWFUeXBlLnZpZGVvKSB7XG4gICAgICAgICAgICB0aGlzLnZpZGVvUmVjb3JkZXIgPSBuZXcgUmVjb3JkUlRDKG1lZGlhU3RyZWFtLCB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ3ZpZGVvJyxcbiAgICAgICAgICAgICAgICB2aWRlbzogdGhpcy52aWRlbyxcbiAgICAgICAgICAgICAgICBjYW52YXM6IHRoaXMuY2FudmFzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMudmlkZW9SZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMubWVkaWFUeXBlLmdpZikge1xuICAgICAgICAgICAgdGhpcy5naWZSZWNvcmRlciA9IG5ldyBSZWNvcmRSVEMobWVkaWFTdHJlYW0sIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnZ2lmJyxcbiAgICAgICAgICAgICAgICBmcmFtZVJhdGU6IHRoaXMuZnJhbWVSYXRlIHx8IDIwMCxcbiAgICAgICAgICAgICAgICBxdWFsaXR5OiB0aGlzLnF1YWxpdHkgfHwgMTBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5naWZSZWNvcmRlci5zdGFydFJlY29yZGluZygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHN0b3AgcmVjb3JkaW5nLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24gaXMgaW52b2tlZCB3aGVuIGFsbCBlbmNvZGVycyBmaW5pc2ggdGhlaXIgam9icy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIE1SZWNvcmRSVENcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24ocmVjb3JkaW5nKXtcbiAgICAgKiAgICAgdmFyIGF1ZGlvQmxvYiA9IHJlY29yZGluZy5hdWRpbztcbiAgICAgKiAgICAgdmFyIHZpZGVvQmxvYiA9IHJlY29yZGluZy52aWRlbztcbiAgICAgKiAgICAgdmFyIGdpZkJsb2IgICA9IHJlY29yZGluZy5naWY7XG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zdG9wUmVjb3JkaW5nID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBmdW5jdGlvbigpIHt9O1xuXG4gICAgICAgIGlmICh0aGlzLmF1ZGlvUmVjb3JkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9SZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKGJsb2JVUkwpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhibG9iVVJMLCAnYXVkaW8nKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudmlkZW9SZWNvcmRlcikge1xuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLnN0b3BSZWNvcmRpbmcoZnVuY3Rpb24oYmxvYlVSTCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGJsb2JVUkwsICd2aWRlbycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5naWZSZWNvcmRlcikge1xuICAgICAgICAgICAgdGhpcy5naWZSZWNvcmRlci5zdG9wUmVjb3JkaW5nKGZ1bmN0aW9uKGJsb2JVUkwpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhibG9iVVJMLCAnZ2lmJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBtYW51YWxseSBnZXQgYWxsIHJlY29yZGVkIGJsb2JzLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQWxsIHJlY29yZGVkIGJsb2JzIGFyZSBwYXNzZWQgYmFjayB0byBcImNhbGxiYWNrXCIgZnVuY3Rpb24uXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5nZXRCbG9iKGZ1bmN0aW9uKHJlY29yZGluZyl7XG4gICAgICogICAgIHZhciBhdWRpb0Jsb2IgPSByZWNvcmRpbmcuYXVkaW87XG4gICAgICogICAgIHZhciB2aWRlb0Jsb2IgPSByZWNvcmRpbmcudmlkZW87XG4gICAgICogICAgIHZhciBnaWZCbG9iICAgPSByZWNvcmRpbmcuZ2lmO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRoaXMuZ2V0QmxvYiA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSB7fTtcblxuICAgICAgICBpZiAodGhpcy5hdWRpb1JlY29yZGVyKSB7XG4gICAgICAgICAgICBvdXRwdXQuYXVkaW8gPSB0aGlzLmF1ZGlvUmVjb3JkZXIuZ2V0QmxvYigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudmlkZW9SZWNvcmRlcikge1xuICAgICAgICAgICAgb3V0cHV0LnZpZGVvID0gdGhpcy52aWRlb1JlY29yZGVyLmdldEJsb2IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmdpZlJlY29yZGVyKSB7XG4gICAgICAgICAgICBvdXRwdXQuZ2lmID0gdGhpcy5naWZSZWNvcmRlci5nZXRCbG9iKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKG91dHB1dCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gbWFudWFsbHkgZ2V0IGFsbCByZWNvcmRlZCBibG9icycgRGF0YVVSTHMuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBBbGwgcmVjb3JkZWQgYmxvYnMnIERhdGFVUkxzIGFyZSBwYXNzZWQgYmFjayB0byBcImNhbGxiYWNrXCIgZnVuY3Rpb24uXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5nZXREYXRhVVJMKGZ1bmN0aW9uKHJlY29yZGluZyl7XG4gICAgICogICAgIHZhciBhdWRpb0RhdGFVUkwgPSByZWNvcmRpbmcuYXVkaW87XG4gICAgICogICAgIHZhciB2aWRlb0RhdGFVUkwgPSByZWNvcmRpbmcudmlkZW87XG4gICAgICogICAgIHZhciBnaWZEYXRhVVJMICAgPSByZWNvcmRpbmcuZ2lmO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRoaXMuZ2V0RGF0YVVSTCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuZ2V0QmxvYihmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgICBnZXREYXRhVVJMKGJsb2IuYXVkaW8sIGZ1bmN0aW9uKF9hdWRpb0RhdGFVUkwpIHtcbiAgICAgICAgICAgICAgICBnZXREYXRhVVJMKGJsb2IudmlkZW8sIGZ1bmN0aW9uKF92aWRlb0RhdGFVUkwpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soe1xuICAgICAgICAgICAgICAgICAgICAgICAgYXVkaW86IF9hdWRpb0RhdGFVUkwsXG4gICAgICAgICAgICAgICAgICAgICAgICB2aWRlbzogX3ZpZGVvRGF0YVVSTFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBmdW5jdGlvbiBnZXREYXRhVVJMKGJsb2IsIGNhbGxiYWNrMDApIHtcbiAgICAgICAgICAgIGlmICghIXdpbmRvdy5Xb3JrZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgd2ViV29ya2VyID0gcHJvY2Vzc0luV2ViV29ya2VyKGZ1bmN0aW9uIHJlYWRGaWxlKF9ibG9iKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKG5ldyBGaWxlUmVhZGVyU3luYygpLnJlYWRBc0RhdGFVUkwoX2Jsb2IpKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHdlYldvcmtlci5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazAwKGV2ZW50LmRhdGEpO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UoYmxvYik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKGJsb2IpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazAwKGV2ZW50LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwcm9jZXNzSW5XZWJXb3JrZXIoX2Z1bmN0aW9uKSB7XG4gICAgICAgICAgICB2YXIgYmxvYiA9IFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW19mdW5jdGlvbi50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICd0aGlzLm9ubWVzc2FnZSA9ICBmdW5jdGlvbiAoZSkge3JlYWRGaWxlKGUuZGF0YSk7fSdcbiAgICAgICAgICAgIF0sIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCdcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoYmxvYik7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAgICAgICAgcmV0dXJuIHdvcmtlcjtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBhc2sge0BsaW5rIE1SZWNvcmRSVEN9IHRvIHdyaXRlIGFsbCByZWNvcmRlZCBibG9icyBpbnRvIEluZGV4ZWREQiBzdG9yYWdlLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTVJlY29yZFJUQ1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIud3JpdGVUb0Rpc2soKTtcbiAgICAgKi9cbiAgICB0aGlzLndyaXRlVG9EaXNrID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFJlY29yZFJUQy53cml0ZVRvRGlzayh7XG4gICAgICAgICAgICBhdWRpbzogdGhpcy5hdWRpb1JlY29yZGVyLFxuICAgICAgICAgICAgdmlkZW86IHRoaXMudmlkZW9SZWNvcmRlcixcbiAgICAgICAgICAgIGdpZjogdGhpcy5naWZSZWNvcmRlclxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgY2FuIGJlIHVzZWQgdG8gaW52b2tlIHNhdmUtYXMgZGlhbG9nIGZvciBhbGwgcmVjb3JkZWQgYmxvYnMuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGFyZ3MgLSB7YXVkaW86ICdhdWRpby1uYW1lJywgdmlkZW86ICd2aWRlby1uYW1lJywgZ2lmOiAnZ2lmLW5hbWUnfVxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTVJlY29yZFJUQ1xuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc2F2ZSh7XG4gICAgICogICAgIGF1ZGlvOiAnYXVkaW8tZmlsZS1uYW1lJyxcbiAgICAgKiAgICAgdmlkZW86ICd2aWRlby1maWxlLW5hbWUnLFxuICAgICAqICAgICBnaWYgIDogJ2dpZi1maWxlLW5hbWUnXG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zYXZlID0gZnVuY3Rpb24oYXJncykge1xuICAgICAgICBhcmdzID0gYXJncyB8fCB7XG4gICAgICAgICAgICBhdWRpbzogdHJ1ZSxcbiAgICAgICAgICAgIHZpZGVvOiB0cnVlLFxuICAgICAgICAgICAgZ2lmOiB0cnVlXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCEhYXJncy5hdWRpbyAmJiB0aGlzLmF1ZGlvUmVjb3JkZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYXVkaW9SZWNvcmRlci5zYXZlKHR5cGVvZiBhcmdzLmF1ZGlvID09PSAnc3RyaW5nJyA/IGFyZ3MuYXVkaW8gOiAnJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISFhcmdzLnZpZGVvICYmIHRoaXMudmlkZW9SZWNvcmRlcikge1xuICAgICAgICAgICAgdGhpcy52aWRlb1JlY29yZGVyLnNhdmUodHlwZW9mIGFyZ3MudmlkZW8gPT09ICdzdHJpbmcnID8gYXJncy52aWRlbyA6ICcnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoISFhcmdzLmdpZiAmJiB0aGlzLmdpZlJlY29yZGVyKSB7XG4gICAgICAgICAgICB0aGlzLmdpZlJlY29yZGVyLnNhdmUodHlwZW9mIGFyZ3MuZ2lmID09PSAnc3RyaW5nJyA/IGFyZ3MuZ2lmIDogJycpO1xuICAgICAgICB9XG4gICAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBnZXQgYWxsIHJlY29yZGVkIGJsb2JzIGZyb20gSW5kZXhlZERCIHN0b3JhZ2UuXG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtICdhbGwnIG9yICdhdWRpbycgb3IgJ3ZpZGVvJyBvciAnZ2lmJ1xuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiB0byBnZXQgYWxsIHN0b3JlZCBibG9icy5cbiAqIEBtZXRob2RcbiAqIEBtZW1iZXJvZiBNUmVjb3JkUlRDXG4gKiBAZXhhbXBsZVxuICogTVJlY29yZFJUQy5nZXRGcm9tRGlzaygnYWxsJywgZnVuY3Rpb24oZGF0YVVSTCwgdHlwZSl7XG4gKiAgICAgaWYodHlwZSA9PT0gJ2F1ZGlvJykgeyB9XG4gKiAgICAgaWYodHlwZSA9PT0gJ3ZpZGVvJykgeyB9XG4gKiAgICAgaWYodHlwZSA9PT0gJ2dpZicpICAgeyB9XG4gKiB9KTtcbiAqL1xuTVJlY29yZFJUQy5nZXRGcm9tRGlzayA9IFJlY29yZFJUQy5nZXRGcm9tRGlzaztcblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBjYW4gYmUgdXNlZCB0byBzdG9yZSByZWNvcmRlZCBibG9icyBpbnRvIEluZGV4ZWREQiBzdG9yYWdlLlxuICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgLSB7YXVkaW86IEJsb2IsIHZpZGVvOiBCbG9iLCBnaWY6IEJsb2J9XG4gKiBAbWV0aG9kXG4gKiBAbWVtYmVyb2YgTVJlY29yZFJUQ1xuICogQGV4YW1wbGVcbiAqIE1SZWNvcmRSVEMud3JpdGVUb0Rpc2soe1xuICogICAgIGF1ZGlvOiBhdWRpb0Jsb2IsXG4gKiAgICAgdmlkZW86IHZpZGVvQmxvYixcbiAqICAgICBnaWYgIDogZ2lmQmxvYlxuICogfSk7XG4gKi9cbk1SZWNvcmRSVEMud3JpdGVUb0Rpc2sgPSBSZWNvcmRSVEMud3JpdGVUb0Rpc2s7XG4vLyBfX19fX19fX19fX19fX19fX19fX19fX19fX19fX1xuLy8gQ3Jvc3MtQnJvd3Nlci1EZWNsYXJhdGlvbnMuanNcblxuLy8gYW5pbWF0aW9uLWZyYW1lIHVzZWQgaW4gV2ViTSByZWNvcmRpbmdcbmlmICghd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG59XG5cbmlmICghd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LndlYmtpdENhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tb3pDYW5jZWxBbmltYXRpb25GcmFtZTtcbn1cblxuLy8gV2ViQXVkaW8gQVBJIHJlcHJlc2VudGVyXG5pZiAoIXdpbmRvdy5BdWRpb0NvbnRleHQpIHtcbiAgICB3aW5kb3cuQXVkaW9Db250ZXh0ID0gd2luZG93LndlYmtpdEF1ZGlvQ29udGV4dCB8fCB3aW5kb3cubW96QXVkaW9Db250ZXh0O1xufVxuXG53aW5kb3cuVVJMID0gd2luZG93LlVSTCB8fCB3aW5kb3cud2Via2l0VVJMO1xubmF2aWdhdG9yLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEgfHwgbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYTtcblxuaWYgKHdpbmRvdy53ZWJraXRNZWRpYVN0cmVhbSkge1xuICAgIHdpbmRvdy5NZWRpYVN0cmVhbSA9IHdpbmRvdy53ZWJraXRNZWRpYVN0cmVhbTtcbn1cblxudmFyIGlzQ2hyb21lID0gISFuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhO1xuXG4vLyBNZXJnZSBhbGwgb3RoZXIgZGF0YS10eXBlcyBleGNlcHQgXCJmdW5jdGlvblwiXG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IG1lcmdlaW4gLSBNZXJnZSBhbm90aGVyIG9iamVjdCBpbiB0aGlzIG9iamVjdC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBtZXJnZXRvIC0gTWVyZ2UgdGhpcyBvYmplY3QgaW4gYW5vdGhlciBvYmplY3QuXG4gKiBAcmV0dXJucyB7b2JqZWN0fSAtIG1lcmdlZCBvYmplY3RcbiAqIEBleGFtcGxlXG4gKiB2YXIgbWVyZ2VkT2JqZWN0ID0gbWVyZ2VQcm9wcyh7fSwge1xuICogICAgIHg6IDEwLCAvLyB0aGlzIHdpbGwgYmUgbWVyZ2VkXG4gKiAgICAgeTogMTAsIC8vIHRoaXMgd2lsbCBiZSBtZXJnZWRcbiAqICAgICBhZGQ6IGZ1bmN0aW9uKCkge30gLy8gdGhpcyB3aWxsIGJlIHNraXBwZWRcbiAqIH0pO1xuICovXG5mdW5jdGlvbiBtZXJnZVByb3BzKG1lcmdlaW4sIG1lcmdldG8pIHtcbiAgICBtZXJnZXRvID0gcmVmb3JtYXRQcm9wcyhtZXJnZXRvKTtcbiAgICBmb3IgKHZhciB0IGluIG1lcmdldG8pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBtZXJnZXRvW3RdICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBtZXJnZWluW3RdID0gbWVyZ2V0b1t0XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2Vpbjtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge29iamVjdH0gb2JqIC0gSWYgYSBwcm9wZXJ0eSBuYW1lIGlzIFwic2FtcGxlLXJhdGVcIjsgaXQgd2lsbCBiZSBjb252ZXJ0ZWQgaW50byBcInNhbXBsZVJhdGVcIi5cbiAqIEByZXR1cm5zIHtvYmplY3R9IC0gZm9ybWF0dGVkIG9iamVjdC5cbiAqIEBleGFtcGxlXG4gKiB2YXIgbWVyZ2VkT2JqZWN0ID0gcmVmb3JtYXRQcm9wcyh7XG4gKiAgICAgJ3NhbXBsZS1yYXRlJzogNDQxMDAsXG4gKiAgICAgJ2J1ZmZlci1zaXplJzogNDA5NlxuICogfSk7XG4gKlxuICogbWVyZ2VkT2JqZWN0LnNhbXBsZVJhdGUgPT09IDQ0MTAwXG4gKiBtZXJnZWRPYmplY3QuYnVmZmVyU2l6ZSA9PT0gNDA5NlxuICovXG5mdW5jdGlvbiByZWZvcm1hdFByb3BzKG9iaikge1xuICAgIHZhciBvdXRwdXQgPSB7fTtcbiAgICBmb3IgKHZhciBvIGluIG9iaikge1xuICAgICAgICBpZiAoby5pbmRleE9mKCctJykgIT09IC0xKSB7XG4gICAgICAgICAgICB2YXIgc3BsaXR0ZWQgPSBvLnNwbGl0KCctJyk7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHNwbGl0dGVkWzBdICsgc3BsaXR0ZWRbMV0uc3BsaXQoJycpWzBdLnRvVXBwZXJDYXNlKCkgKyBzcGxpdHRlZFsxXS5zdWJzdHIoMSk7XG4gICAgICAgICAgICBvdXRwdXRbbmFtZV0gPSBvYmpbb107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdXRwdXRbb10gPSBvYmpbb107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbn1cblxuaWYgKGxvY2F0aW9uLmhyZWYuaW5kZXhPZignZmlsZTonKSA9PT0gMCkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1BsZWFzZSBsb2FkIHRoaXMgSFRNTCBmaWxlIG9uIEhUVFAgb3IgSFRUUFMuJyk7XG59XG5cbi8vIGJlbG93IGZ1bmN0aW9uIHZpYTogaHR0cDovL2dvby5nbC9CM2FlOGNcbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IGJ5dGVzIC0gUGFzcyBieXRlcyBhbmQgZ2V0IGZvcm1hZnRlZCBzdHJpbmcuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSAtIGZvcm1hZnRlZCBzdHJpbmdcbiAqIEBleGFtcGxlXG4gKiBieXRlc1RvU2l6ZSgxMDI0KjEwMjQqNSkgPT09ICc1IEdCJ1xuICovXG5mdW5jdGlvbiBieXRlc1RvU2l6ZShieXRlcykge1xuICAgIHZhciBrID0gMTAwMDtcbiAgICB2YXIgc2l6ZXMgPSBbJ0J5dGVzJywgJ0tCJywgJ01CJywgJ0dCJywgJ1RCJ107XG4gICAgaWYgKGJ5dGVzID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnMCBCeXRlcyc7XG4gICAgfVxuICAgIHZhciBpID0gcGFyc2VJbnQoTWF0aC5mbG9vcihNYXRoLmxvZyhieXRlcykgLyBNYXRoLmxvZyhrKSksIDEwKTtcbiAgICByZXR1cm4gKGJ5dGVzIC8gTWF0aC5wb3coaywgaSkpLnRvUHJlY2lzaW9uKDMpICsgJyAnICsgc2l6ZXNbaV07XG59XG4vLyBfX19fX19fX19fICh1c2VkIHRvIGhhbmRsZSBzdHVmZiBsaWtlIGh0dHA6Ly9nb28uZ2wveG1FNWVnKSBpc3N1ZSAjMTI5XG4vLyBTdG9yYWdlLmpzXG5cbi8qKlxuICogU3RvcmFnZSBpcyBhIHN0YW5kYWxvbmUgb2JqZWN0IHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gc3RvcmUgcmV1c2FibGUgb2JqZWN0cyBlLmcuIFwibmV3IEF1ZGlvQ29udGV4dFwiLlxuICogQGV4YW1wbGVcbiAqIFN0b3JhZ2UuQXVkaW9Db250ZXh0ID09PSB3ZWJraXRBdWRpb0NvbnRleHRcbiAqIEBwcm9wZXJ0eSB7d2Via2l0QXVkaW9Db250ZXh0fSBBdWRpb0NvbnRleHQgLSBLZWVwcyBhIHJlZmVyZW5jZSB0byBBdWRpb0NvbnRleHQgb2JqZWN0LlxuICovXG5cbnZhciBTdG9yYWdlID0ge1xuICAgIEF1ZGlvQ29udGV4dDogd2luZG93LkF1ZGlvQ29udGV4dCB8fCB3aW5kb3cud2Via2l0QXVkaW9Db250ZXh0XG59O1xuLy8gX19fX19fX19fX19fX19fX19fX19fX1xuLy8gTWVkaWFTdHJlYW1SZWNvcmRlci5qc1xuXG4vLyB0b2RvOiBuZWVkIHRvIHNob3cgYWxlcnQgYm94ZXMgZm9yIGluY29tcGF0aWJsZSBjYXNlc1xuLy8gZW5jb2RlciBvbmx5IHN1cHBvcnRzIDQ4ay8xNmsgbW9ubyBhdWRpbyBjaGFubmVsXG5cbi8qXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBodHRwczovL2R2Y3MudzMub3JnL2hnL2RhcC9yYXctZmlsZS9kZWZhdWx0L21lZGlhLXN0cmVhbS1jYXB0dXJlL01lZGlhUmVjb3JkZXIuaHRtbFxuICogVGhlIE1lZGlhUmVjb3JkZXIgYWNjZXB0cyBhIG1lZGlhU3RyZWFtIGFzIGlucHV0IHNvdXJjZSBwYXNzZWQgZnJvbSBVQS4gV2hlbiByZWNvcmRlciBzdGFydHMsXG4gKiBhIE1lZGlhRW5jb2RlciB3aWxsIGJlIGNyZWF0ZWQgYW5kIGFjY2VwdCB0aGUgbWVkaWFTdHJlYW0gYXMgaW5wdXQgc291cmNlLlxuICogRW5jb2RlciB3aWxsIGdldCB0aGUgcmF3IGRhdGEgYnkgdHJhY2sgZGF0YSBjaGFuZ2VzLCBlbmNvZGUgaXQgYnkgc2VsZWN0ZWQgTUlNRSBUeXBlLCB0aGVuIHN0b3JlIHRoZSBlbmNvZGVkIGluIEVuY29kZWRCdWZmZXJDYWNoZSBvYmplY3QuXG4gKiBUaGUgZW5jb2RlZCBkYXRhIHdpbGwgYmUgZXh0cmFjdGVkIG9uIGV2ZXJ5IHRpbWVzbGljZSBwYXNzZWQgZnJvbSBTdGFydCBmdW5jdGlvbiBjYWxsIG9yIGJ5IFJlcXVlc3REYXRhIGZ1bmN0aW9uLlxuICogVGhyZWFkIG1vZGVsOlxuICogV2hlbiB0aGUgcmVjb3JkZXIgc3RhcnRzLCBpdCBjcmVhdGVzIGEgXCJNZWRpYSBFbmNvZGVyXCIgdGhyZWFkIHRvIHJlYWQgZGF0YSBmcm9tIE1lZGlhRW5jb2RlciBvYmplY3QgYW5kIHN0b3JlIGJ1ZmZlciBpbiBFbmNvZGVkQnVmZmVyQ2FjaGUgb2JqZWN0LlxuICogQWxzbyBleHRyYWN0IHRoZSBlbmNvZGVkIGRhdGEgYW5kIGNyZWF0ZSBibG9icyBvbiBldmVyeSB0aW1lc2xpY2UgcGFzc2VkIGZyb20gc3RhcnQgZnVuY3Rpb24gb3IgUmVxdWVzdERhdGEgZnVuY3Rpb24gY2FsbGVkIGJ5IFVBLlxuICovXG5cbi8qKlxuICogTWVkaWFTdHJlYW1SZWNvcmRlciBpcyBhbiBhYnN0cmFjdGlvbiBsYXllciBmb3IgXCJNZWRpYVJlY29yZGVyIEFQSVwiLiBJdCBpcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIHJlY29yZCBNZWRpYVN0cmVhbShzKSBpbiBGaXJlZm94LlxuICogQHN1bW1hcnkgUnVucyB0b3Agb3ZlciBNZWRpYVJlY29yZGVyIEFQSS5cbiAqIEB0eXBlZGVmIE1lZGlhU3RyZWFtUmVjb3JkZXJcbiAqIEBjbGFzc1xuICogQGV4YW1wbGVcbiAqIHZhciByZWNvcmRlciA9IG5ldyBNZWRpYVN0cmVhbVJlY29yZGVyKE1lZGlhU3RyZWFtKTtcbiAqIHJlY29yZGVyLm1pbWVUeXBlID0gJ3ZpZGVvL3dlYm0nOyAvLyBhdWRpby9vZ2cgb3IgdmlkZW8vd2VibVxuICogcmVjb3JkZXIucmVjb3JkKCk7XG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcbiAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICpcbiAqICAgICAvLyBvclxuICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcbiAqIH0pO1xuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXG4gKi9cblxuZnVuY3Rpb24gTWVkaWFTdHJlYW1SZWNvcmRlcihtZWRpYVN0cmVhbSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIC8vIGlmIHVzZXIgY2hvc2VuIG9ubHkgYXVkaW8gb3B0aW9uOyBhbmQgaGUgdHJpZWQgdG8gcGFzcyBNZWRpYVN0cmVhbSB3aXRoXG4gICAgLy8gYm90aCBhdWRpbyBhbmQgdmlkZW8gdHJhY2tzO1xuICAgIC8vIHVzaW5nIGEgZGlydHkgd29ya2Fyb3VuZCB0byBnZW5lcmF0ZSBhdWRpby1vbmx5IHN0cmVhbSBzbyB0aGF0IHdlIGNhbiBnZXQgYXVkaW8vb2dnIG91dHB1dC5cbiAgICBpZiAoc2VsZi5taW1lVHlwZSAmJiBzZWxmLm1pbWVUeXBlICE9PSAndmlkZW8vd2VibScgJiYgbWVkaWFTdHJlYW0uZ2V0VmlkZW9UcmFja3MgJiYgbWVkaWFTdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGgpIHtcbiAgICAgICAgdmFyIGNvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICAgIHZhciBtZWRpYVN0cmVhbVNvdXJjZSA9IGNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1Tb3VyY2UobWVkaWFTdHJlYW0pO1xuXG4gICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IGNvbnRleHQuY3JlYXRlTWVkaWFTdHJlYW1EZXN0aW5hdGlvbigpO1xuICAgICAgICBtZWRpYVN0cmVhbVNvdXJjZS5jb25uZWN0KGRlc3RpbmF0aW9uKTtcblxuICAgICAgICBtZWRpYVN0cmVhbSA9IGRlc3RpbmF0aW9uLnN0cmVhbTtcbiAgICB9XG5cbiAgICB2YXIgZGF0YUF2YWlsYWJsZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xuICAgICAqL1xuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGh0dHA6Ly9keHIubW96aWxsYS5vcmcvbW96aWxsYS1jZW50cmFsL3NvdXJjZS9jb250ZW50L21lZGlhL01lZGlhUmVjb3JkZXIuY3BwXG4gICAgICAgIC8vIGh0dHBzOi8vd2lraS5tb3ppbGxhLm9yZy9HZWNrbzpNZWRpYVJlY29yZGVyXG4gICAgICAgIC8vIGh0dHBzOi8vZHZjcy53My5vcmcvaGcvZGFwL3Jhdy1maWxlL2RlZmF1bHQvbWVkaWEtc3RyZWFtLWNhcHR1cmUvTWVkaWFSZWNvcmRlci5odG1sXG5cbiAgICAgICAgLy8gc3RhcnRpbmcgYSByZWNvcmRpbmcgc2Vzc2lvbjsgd2hpY2ggd2lsbCBpbml0aWF0ZSBcIlJlYWRpbmcgVGhyZWFkXCJcbiAgICAgICAgLy8gXCJSZWFkaW5nIFRocmVhZFwiIGFyZSB1c2VkIHRvIHByZXZlbnQgbWFpbi10aHJlYWQgYmxvY2tpbmcgc2NlbmFyaW9zXG4gICAgICAgIG1lZGlhUmVjb3JkZXIgPSBuZXcgd2luZG93Lk1lZGlhUmVjb3JkZXIobWVkaWFTdHJlYW0pO1xuXG4gICAgICAgIC8vIERpc3BhdGNoaW5nIE9uRGF0YUF2YWlsYWJsZSBIYW5kbGVyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgaWYgKGRhdGFBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZS5kYXRhLnNpemUpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXNlbGYuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdSZWNvcmRpbmcgb2YnLCBlLmRhdGEudHlwZSwgJ2ZhaWxlZC4nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkYXRhQXZhaWxhYmxlID0gdHJ1ZTtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAcHJvcGVydHkge0Jsb2J9IGJsb2IgLSBSZWNvcmRlZCBmcmFtZXMgaW4gdmlkZW8vd2VibSBibG9iLlxuICAgICAgICAgICAgICogQG1lbWJlcm9mIE1lZGlhU3RyZWFtUmVjb3JkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLmJsb2IgPSBuZXcgQmxvYihbZS5kYXRhXSwge1xuICAgICAgICAgICAgICAgIHR5cGU6IGUuZGF0YS50eXBlIHx8IHNlbGYubWltZVR5cGUgfHwgJ2F1ZGlvL29nZydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoc2VsZi5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIHNlbGYuY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBtZWRpYVJlY29yZGVyLm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgaWYgKCFzZWxmLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2hlbiB0aGUgc3RyZWFtIGlzIFwiZW5kZWRcIiBzZXQgcmVjb3JkaW5nIHRvICdpbmFjdGl2ZScgXG4gICAgICAgICAgICAvLyBhbmQgc3RvcCBnYXRoZXJpbmcgZGF0YS4gQ2FsbGVycyBzaG91bGQgbm90IHJlbHkgb24gXG4gICAgICAgICAgICAvLyBleGFjdG5lc3Mgb2YgdGhlIHRpbWVTbGljZSB2YWx1ZSwgZXNwZWNpYWxseSBcbiAgICAgICAgICAgIC8vIGlmIHRoZSB0aW1lU2xpY2UgdmFsdWUgaXMgc21hbGwuIENhbGxlcnMgc2hvdWxkIFxuICAgICAgICAgICAgLy8gY29uc2lkZXIgdGltZVNsaWNlIGFzIGEgbWluaW11bSB2YWx1ZVxuXG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcbiAgICAgICAgICAgIHNlbGYucmVjb3JkKDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIHZvaWQgc3RhcnQob3B0aW9uYWwgbG9uZyBtVGltZVNsaWNlKVxuICAgICAgICAvLyBUaGUgaW50ZXJ2YWwgb2YgcGFzc2luZyBlbmNvZGVkIGRhdGEgZnJvbSBFbmNvZGVkQnVmZmVyQ2FjaGUgdG8gb25EYXRhQXZhaWxhYmxlXG4gICAgICAgIC8vIGhhbmRsZXIuIFwibVRpbWVTbGljZSA8IDBcIiBtZWFucyBTZXNzaW9uIG9iamVjdCBkb2VzIG5vdCBwdXNoIGVuY29kZWQgZGF0YSB0b1xuICAgICAgICAvLyBvbkRhdGFBdmFpbGFibGUsIGluc3RlYWQsIGl0IHBhc3NpdmUgd2FpdCB0aGUgY2xpZW50IHNpZGUgcHVsbCBlbmNvZGVkIGRhdGFcbiAgICAgICAgLy8gYnkgY2FsbGluZyByZXF1ZXN0RGF0YSBBUEkuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RhcnQoMCk7XG5cbiAgICAgICAgLy8gU3RhcnQgcmVjb3JkaW5nLiBJZiB0aW1lU2xpY2UgaGFzIGJlZW4gcHJvdmlkZWQsIG1lZGlhUmVjb3JkZXIgd2lsbFxuICAgICAgICAvLyByYWlzZSBhIGRhdGFhdmFpbGFibGUgZXZlbnQgY29udGFpbmluZyB0aGUgQmxvYiBvZiBjb2xsZWN0ZWQgZGF0YSBvbiBldmVyeSB0aW1lU2xpY2UgbWlsbGlzZWNvbmRzLlxuICAgICAgICAvLyBJZiB0aW1lU2xpY2UgaXNuJ3QgcHJvdmlkZWQsIFVBIHNob3VsZCBjYWxsIHRoZSBSZXF1ZXN0RGF0YSB0byBvYnRhaW4gdGhlIEJsb2IgZGF0YSwgYWxzbyBzZXQgdGhlIG1UaW1lU2xpY2UgdG8gemVyby5cblxuICAgICAgICBpZiAoc2VsZi5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQpIHtcbiAgICAgICAgICAgIHNlbGYub25BdWRpb1Byb2Nlc3NTdGFydGVkKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIE1lZGlhU3RyZWFtLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIC8vIG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdyZWNvcmRpbmcnIG1lYW5zIHRoYXQgbWVkaWEgcmVjb3JkZXIgaXMgYXNzb2NpYXRlZCB3aXRoIFwic2Vzc2lvblwiXG4gICAgICAgIC8vIG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdzdG9wcGVkJyBtZWFucyB0aGF0IG1lZGlhIHJlY29yZGVyIGlzIGRldGFjaGVkIGZyb20gdGhlIFwic2Vzc2lvblwiIC4uLiBpbiB0aGlzIGNhc2U7IFwic2Vzc2lvblwiIHdpbGwgYWxzbyBiZSBkZWxldGVkLlxuXG4gICAgICAgIGlmIChtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncmVjb3JkaW5nJykge1xuICAgICAgICAgICAgLy8gXCJzdG9wXCIgbWV0aG9kIGF1dG8gaW52b2tlcyBcInJlcXVlc3REYXRhXCIhXG4gICAgICAgICAgICAvLyBtZWRpYVJlY29yZGVyLnJlcXVlc3REYXRhKCk7XG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgTWVkaWFTdHJlYW1SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcbiAgICAgKi9cbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdyZWNvcmRpbmcnKSB7XG4gICAgICAgICAgICBtZWRpYVJlY29yZGVyLnBhdXNlKCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5kaXNhYmxlTG9ncykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1BhdXNlZCByZWNvcmRpbmcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBNZWRpYVN0cmVhbVJlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZXN1bWUoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncGF1c2VkJykge1xuICAgICAgICAgICAgbWVkaWFSZWNvcmRlci5yZXN1bWUoKTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnUmVzdW1lZCByZWNvcmRpbmcuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gUmVmZXJlbmNlIHRvIFwiTWVkaWFSZWNvcmRlclwiIG9iamVjdFxuICAgIHZhciBtZWRpYVJlY29yZGVyO1xufVxuLy8gX19fX19fX19fX19fX19fX19cbi8vIFN0ZXJlb1JlY29yZGVyLmpzXG5cbi8qKlxuICogU3RlcmVvUmVjb3JkZXIgaXMgYSBzdGFuZGFsb25lIGNsYXNzIHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gYnJpbmcgYXVkaW8tcmVjb3JkaW5nIGluIGNocm9tZS4gSXQgcnVucyB0b3Agb3ZlciB7QGxpbmsgU3RlcmVvQXVkaW9SZWNvcmRlcn0uXG4gKiBAc3VtbWFyeSBKYXZhU2NyaXB0IHN0YW5kYWxvbmUgb2JqZWN0IGZvciBzdGVyZW8gYXVkaW8gcmVjb3JkaW5nLlxuICogQHR5cGVkZWYgU3RlcmVvUmVjb3JkZXJcbiAqIEBjbGFzc1xuICogQGV4YW1wbGVcbiAqIHZhciByZWNvcmRlciA9IG5ldyBTdGVyZW9SZWNvcmRlcihNZWRpYVN0cmVhbSk7XG4gKiByZWNvcmRlci5yZWNvcmQoKTtcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xuICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gKiB9KTtcbiAqIEBwYXJhbSB7TWVkaWFTdHJlYW19IG1lZGlhU3RyZWFtIC0gTWVkaWFTdHJlYW0gb2JqZWN0IGZldGNoZWQgdXNpbmcgZ2V0VXNlck1lZGlhIEFQSSBvciBnZW5lcmF0ZWQgdXNpbmcgY2FwdHVyZVN0cmVhbVVudGlsRW5kZWQgb3IgV2ViQXVkaW8gQVBJLlxuICovXG5cbmZ1bmN0aW9uIFN0ZXJlb1JlY29yZGVyKG1lZGlhU3RyZWFtKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZWNvcmQoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlY29yZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBtZWRpYVJlY29yZGVyID0gbmV3IFN0ZXJlb0F1ZGlvUmVjb3JkZXIobWVkaWFTdHJlYW0sIHRoaXMpO1xuICAgICAgICBtZWRpYVJlY29yZGVyLm9uQXVkaW9Qcm9jZXNzU3RhcnRlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKHNlbGYub25BdWRpb1Byb2Nlc3NTdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbWVkaWFSZWNvcmRlci5yZWNvcmQoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIE1lZGlhU3RyZWFtLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xuICAgICAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICghbWVkaWFSZWNvcmRlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbWVkaWFSZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaXRlbSBpbiBtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICAgICAgc2VsZltpdGVtXSA9IG1lZGlhUmVjb3JkZXJbaXRlbV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgU3RlcmVvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnBhdXNlKCk7XG4gICAgICovXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIW1lZGlhUmVjb3JkZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1lZGlhUmVjb3JkZXIucGF1c2UoKTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9SZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XG4gICAgICovXG4gICAgdGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFtZWRpYVJlY29yZGVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtZWRpYVJlY29yZGVyLnJlc3VtZSgpO1xuICAgIH07XG5cbiAgICAvLyBSZWZlcmVuY2UgdG8gXCJTdGVyZW9BdWRpb1JlY29yZGVyXCIgb2JqZWN0XG4gICAgdmFyIG1lZGlhUmVjb3JkZXI7XG59XG4vLyBzb3VyY2UgY29kZSBmcm9tOiBodHRwOi8vdHlwZWRhcnJheS5vcmcvd3AtY29udGVudC9wcm9qZWN0cy9XZWJBdWRpb1JlY29yZGVyL3NjcmlwdC5qc1xuLy8gaHR0cHM6Ly9naXRodWIuY29tL21hdHRkaWFtb25kL1JlY29yZGVyanMjbGljZW5zZS1taXRcbi8vIF9fX19fX19fX19fX19fX19fX19fX19cbi8vIFN0ZXJlb0F1ZGlvUmVjb3JkZXIuanNcblxuLyoqXG4gKiBTdGVyZW9BdWRpb1JlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIFwic3RlcmVvXCIgYXVkaW8tcmVjb3JkaW5nIGluIGNocm9tZS5cbiAqIEBzdW1tYXJ5IEphdmFTY3JpcHQgc3RhbmRhbG9uZSBvYmplY3QgZm9yIHN0ZXJlbyBhdWRpbyByZWNvcmRpbmcuXG4gKiBAdHlwZWRlZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gKiBAY2xhc3NcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgU3RlcmVvQXVkaW9SZWNvcmRlcihNZWRpYVN0cmVhbSwge1xuICogICAgIHNhbXBsZVJhdGU6IDQ0MTAwLFxuICogICAgIGJ1ZmZlclNpemU6IDQwOTZcbiAqIH0pO1xuICogcmVjb3JkZXIucmVjb3JkKCk7XG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcbiAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICogfSk7XG4gKiBAcGFyYW0ge01lZGlhU3RyZWFtfSBtZWRpYVN0cmVhbSAtIE1lZGlhU3RyZWFtIG9iamVjdCBmZXRjaGVkIHVzaW5nIGdldFVzZXJNZWRpYSBBUEkgb3IgZ2VuZXJhdGVkIHVzaW5nIGNhcHR1cmVTdHJlYW1VbnRpbEVuZGVkIG9yIFdlYkF1ZGlvIEFQSS5cbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWcgLSB7c2FtcGxlUmF0ZTogNDQxMDAsIGJ1ZmZlclNpemU6IDQwOTZ9XG4gKi9cblxudmFyIF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGU7XG5cbmZ1bmN0aW9uIFN0ZXJlb0F1ZGlvUmVjb3JkZXIobWVkaWFTdHJlYW0sIGNvbmZpZykge1xuICAgIGlmICghbWVkaWFTdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5sZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgJ1lvdXIgc3RyZWFtIGhhcyBubyBhdWRpbyB0cmFja3MuJztcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyB2YXJpYWJsZXNcbiAgICB2YXIgbGVmdGNoYW5uZWwgPSBbXTtcbiAgICB2YXIgcmlnaHRjaGFubmVsID0gW107XG4gICAgdmFyIHJlY29yZGluZyA9IGZhbHNlO1xuICAgIHZhciByZWNvcmRpbmdMZW5ndGggPSAwO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xuICAgICAqL1xuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHJlc2V0IHRoZSBidWZmZXJzIGZvciB0aGUgbmV3IHJlY29yZGluZ1xuICAgICAgICBsZWZ0Y2hhbm5lbC5sZW5ndGggPSByaWdodGNoYW5uZWwubGVuZ3RoID0gMDtcbiAgICAgICAgcmVjb3JkaW5nTGVuZ3RoID0gMDtcblxuICAgICAgICByZWNvcmRpbmcgPSB0cnVlO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBtZXJnZUxlZnRSaWdodEJ1ZmZlcnMoY29uZmlnLCBjYWxsYmFjaykge1xuICAgICAgICBmdW5jdGlvbiBtZXJnZUF1ZGlvQnVmZmVycyhjb25maWcpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0QnVmZmVycyA9IGNvbmZpZy5sZWZ0QnVmZmVycztcbiAgICAgICAgICAgIHZhciByaWdodEJ1ZmZlcnMgPSBjb25maWcucmlnaHRCdWZmZXJzO1xuICAgICAgICAgICAgdmFyIHNhbXBsZVJhdGUgPSBjb25maWcuc2FtcGxlUmF0ZTtcblxuICAgICAgICAgICAgbGVmdEJ1ZmZlcnMgPSBtZXJnZUJ1ZmZlcnMobGVmdEJ1ZmZlcnNbMF0sIGxlZnRCdWZmZXJzWzFdKTtcbiAgICAgICAgICAgIHJpZ2h0QnVmZmVycyA9IG1lcmdlQnVmZmVycyhyaWdodEJ1ZmZlcnNbMF0sIHJpZ2h0QnVmZmVyc1sxXSk7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIG1lcmdlQnVmZmVycyhjaGFubmVsQnVmZmVyLCByTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDY0QXJyYXkockxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgdmFyIGxuZyA9IGNoYW5uZWxCdWZmZXIubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsbmc7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYnVmZmVyID0gY2hhbm5lbEJ1ZmZlcltpXTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0LnNldChidWZmZXIsIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgICAgIG9mZnNldCArPSBidWZmZXIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGludGVybGVhdmUobGVmdENoYW5uZWwsIHJpZ2h0Q2hhbm5lbCkge1xuICAgICAgICAgICAgICAgIHZhciBsZW5ndGggPSBsZWZ0Q2hhbm5lbC5sZW5ndGggKyByaWdodENoYW5uZWwubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDY0QXJyYXkobGVuZ3RoKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbnB1dEluZGV4ID0gMDtcblxuICAgICAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBsZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtpbmRleCsrXSA9IGxlZnRDaGFubmVsW2lucHV0SW5kZXhdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRbaW5kZXgrK10gPSByaWdodENoYW5uZWxbaW5wdXRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGlucHV0SW5kZXgrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZnVuY3Rpb24gd3JpdGVVVEZCeXRlcyh2aWV3LCBvZmZzZXQsIHN0cmluZykge1xuICAgICAgICAgICAgICAgIHZhciBsbmcgPSBzdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbG5nOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50OChvZmZzZXQgKyBpLCBzdHJpbmcuY2hhckNvZGVBdChpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpbnRlcmxlYXZlIGJvdGggY2hhbm5lbHMgdG9nZXRoZXJcbiAgICAgICAgICAgIHZhciBpbnRlcmxlYXZlZCA9IGludGVybGVhdmUobGVmdEJ1ZmZlcnMsIHJpZ2h0QnVmZmVycyk7XG5cbiAgICAgICAgICAgIHZhciBpbnRlcmxlYXZlZExlbmd0aCA9IGludGVybGVhdmVkLmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gY3JlYXRlIHdhdiBmaWxlXG4gICAgICAgICAgICB2YXIgcmVzdWx0aW5nQnVmZmVyTGVuZ3RoID0gNDQgKyBpbnRlcmxlYXZlZExlbmd0aCAqIDI7XG5cbiAgICAgICAgICAgIHZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIocmVzdWx0aW5nQnVmZmVyTGVuZ3RoKTtcblxuICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyKTtcblxuICAgICAgICAgICAgLy8gUklGRiBjaHVuayBkZXNjcmlwdG9yL2lkZW50aWZpZXIgXG4gICAgICAgICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDAsICdSSUZGJyk7XG5cbiAgICAgICAgICAgIC8vIFJJRkYgY2h1bmsgbGVuZ3RoXG4gICAgICAgICAgICB2YXIgYmxvY2tBbGlnbiA9IDQ7XG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMihibG9ja0FsaWduLCA0NCArIGludGVybGVhdmVkTGVuZ3RoICogMiwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vIFJJRkYgdHlwZSBcbiAgICAgICAgICAgIHdyaXRlVVRGQnl0ZXModmlldywgOCwgJ1dBVkUnKTtcblxuICAgICAgICAgICAgLy8gZm9ybWF0IGNodW5rIGlkZW50aWZpZXIgXG4gICAgICAgICAgICAvLyBGTVQgc3ViLWNodW5rXG4gICAgICAgICAgICB3cml0ZVVURkJ5dGVzKHZpZXcsIDEyLCAnZm10ICcpO1xuXG4gICAgICAgICAgICAvLyBmb3JtYXQgY2h1bmsgbGVuZ3RoIFxuICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMTYsIDE2LCB0cnVlKTtcblxuICAgICAgICAgICAgLy8gc2FtcGxlIGZvcm1hdCAocmF3KVxuICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMjAsIDEsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBzdGVyZW8gKDIgY2hhbm5lbHMpXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQxNigyMiwgMiwgdHJ1ZSk7XG5cbiAgICAgICAgICAgIC8vIHNhbXBsZSByYXRlIFxuICAgICAgICAgICAgdmlldy5zZXRVaW50MzIoMjQsIHNhbXBsZVJhdGUsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBieXRlIHJhdGUgKHNhbXBsZSByYXRlICogYmxvY2sgYWxpZ24pXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMigyOCwgc2FtcGxlUmF0ZSAqIGJsb2NrQWxpZ24sIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBibG9jayBhbGlnbiAoY2hhbm5lbCBjb3VudCAqIGJ5dGVzIHBlciBzYW1wbGUpIFxuICAgICAgICAgICAgdmlldy5zZXRVaW50MTYoMzIsIGJsb2NrQWxpZ24sIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBiaXRzIHBlciBzYW1wbGUgXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQxNigzNCwgMTYsIHRydWUpO1xuXG4gICAgICAgICAgICAvLyBkYXRhIHN1Yi1jaHVua1xuICAgICAgICAgICAgLy8gZGF0YSBjaHVuayBpZGVudGlmaWVyIFxuICAgICAgICAgICAgd3JpdGVVVEZCeXRlcyh2aWV3LCAzNiwgJ2RhdGEnKTtcblxuICAgICAgICAgICAgLy8gZGF0YSBjaHVuayBsZW5ndGggXG4gICAgICAgICAgICB2aWV3LnNldFVpbnQzMig0MCwgaW50ZXJsZWF2ZWRMZW5ndGggKiAyLCB0cnVlKTtcblxuICAgICAgICAgICAgLy8gd3JpdGUgdGhlIFBDTSBzYW1wbGVzXG4gICAgICAgICAgICB2YXIgb2Zmc2V0ID0gNDQsXG4gICAgICAgICAgICAgICAgbGVmdENoYW5uZWw7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGludGVybGVhdmVkTGVuZ3RoOyBpKyssIG9mZnNldCArPSAyKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpemUgPSBNYXRoLm1heCgtMSwgTWF0aC5taW4oMSwgaW50ZXJsZWF2ZWRbaV0pKTtcbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudENoYW5uZWwgPSBzaXplIDwgMCA/IHNpemUgKiAzMjc2OCA6IHNpemUgKiAzMjc2NztcblxuICAgICAgICAgICAgICAgIGlmIChjb25maWcubGVmdENoYW5uZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRDaGFubmVsICE9PSBsZWZ0Q2hhbm5lbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRJbnQxNihvZmZzZXQsIGN1cnJlbnRDaGFubmVsLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBsZWZ0Q2hhbm5lbCA9IGN1cnJlbnRDaGFubmVsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0SW50MTYob2Zmc2V0LCBjdXJyZW50Q2hhbm5lbCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgYnVmZmVyOiBidWZmZXIsXG4gICAgICAgICAgICAgICAgdmlldzogdmlld1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdlYldvcmtlciA9IHByb2Nlc3NJbldlYldvcmtlcihtZXJnZUF1ZGlvQnVmZmVycyk7XG5cbiAgICAgICAgd2ViV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBjYWxsYmFjayhldmVudC5kYXRhLmJ1ZmZlciwgZXZlbnQuZGF0YS52aWV3KTtcbiAgICAgICAgfTtcblxuICAgICAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UoY29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwcm9jZXNzSW5XZWJXb3JrZXIoX2Z1bmN0aW9uKSB7XG4gICAgICAgIHZhciBibG9iID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbX2Z1bmN0aW9uLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAndGhpcy5vbm1lc3NhZ2UgPSAgZnVuY3Rpb24gKGUpIHsnICsgX2Z1bmN0aW9uLm5hbWUgKyAnKGUuZGF0YSk7fSdcbiAgICAgICAgXSwge1xuICAgICAgICAgICAgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgd29ya2VyID0gbmV3IFdvcmtlcihibG9iKTtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChibG9iKTtcbiAgICAgICAgcmV0dXJuIHdvcmtlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcgTWVkaWFTdHJlYW0uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcbiAgICAgKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICB0aGlzLnN0b3AgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAvLyBzdG9wIHJlY29yZGluZ1xuICAgICAgICByZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgICAgICAvLyB0byBtYWtlIHN1cmUgb25hdWRpb3Byb2Nlc3Mgc3RvcHMgZmlyaW5nXG4gICAgICAgIGF1ZGlvSW5wdXQuZGlzY29ubmVjdCgpO1xuXG4gICAgICAgIG1lcmdlTGVmdFJpZ2h0QnVmZmVycyh7XG4gICAgICAgICAgICBzYW1wbGVSYXRlOiBzYW1wbGVSYXRlLFxuICAgICAgICAgICAgbGVmdENoYW5uZWw6IGNvbmZpZy5sZWZ0Q2hhbm5lbCxcbiAgICAgICAgICAgIGxlZnRCdWZmZXJzOiBbbGVmdGNoYW5uZWwsIHJlY29yZGluZ0xlbmd0aF0sXG4gICAgICAgICAgICByaWdodEJ1ZmZlcnM6IFtyaWdodGNoYW5uZWwsIHJlY29yZGluZ0xlbmd0aF1cbiAgICAgICAgfSwgZnVuY3Rpb24oYnVmZmVyLCB2aWV3KSB7XG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFRoZSByZWNvcmRlZCBibG9iIG9iamVjdC5cbiAgICAgICAgICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLmJsb2IgPSBuZXcgQmxvYihbdmlld10sIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYXVkaW8vd2F2J1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQHByb3BlcnR5IHtBcnJheUJ1ZmZlcn0gYnVmZmVyIC0gVGhlIHJlY29yZGVkIGJ1ZmZlciBvYmplY3QuXG4gICAgICAgICAgICAgKiBAbWVtYmVyb2YgU3RlcmVvQXVkaW9SZWNvcmRlclxuICAgICAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAqICAgICB2YXIgYnVmZmVyID0gcmVjb3JkZXIuYnVmZmVyO1xuICAgICAgICAgICAgICogfSk7XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHNlbGYuYnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKHZpZXcpO1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7RGF0YVZpZXd9IHZpZXcgLSBUaGUgcmVjb3JkZWQgZGF0YS12aWV3IG9iamVjdC5cbiAgICAgICAgICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICogICAgIHZhciB2aWV3ID0gcmVjb3JkZXIudmlldztcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBzZWxmLnZpZXcgPSB2aWV3O1xuXG4gICAgICAgICAgICBzZWxmLnNhbXBsZVJhdGUgPSBzYW1wbGVSYXRlO1xuICAgICAgICAgICAgc2VsZi5idWZmZXJTaXplID0gYnVmZmVyU2l6ZTtcblxuICAgICAgICAgICAgLy8gcmVjb3JkZWQgYXVkaW8gbGVuZ3RoXG4gICAgICAgICAgICBzZWxmLmxlbmd0aCA9IHJlY29yZGluZ0xlbmd0aDtcblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaXNBdWRpb1Byb2Nlc3NTdGFydGVkID0gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBpZiAoIVN0b3JhZ2UuQXVkaW9Db250ZXh0Q29uc3RydWN0b3IpIHtcbiAgICAgICAgU3RvcmFnZS5BdWRpb0NvbnRleHRDb25zdHJ1Y3RvciA9IG5ldyBTdG9yYWdlLkF1ZGlvQ29udGV4dCgpO1xuICAgIH1cblxuICAgIHZhciBjb250ZXh0ID0gU3RvcmFnZS5BdWRpb0NvbnRleHRDb25zdHJ1Y3RvcjtcblxuICAgIC8vIGNyZWF0ZXMgYW4gYXVkaW8gbm9kZSBmcm9tIHRoZSBtaWNyb3Bob25lIGluY29taW5nIHN0cmVhbVxuICAgIHZhciBhdWRpb0lucHV0ID0gY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShtZWRpYVN0cmVhbSk7XG5cbiAgICB2YXIgbGVnYWxCdWZmZXJWYWx1ZXMgPSBbMCwgMjU2LCA1MTIsIDEwMjQsIDIwNDgsIDQwOTYsIDgxOTIsIDE2Mzg0XTtcblxuICAgIC8qKlxuICAgICAqIEZyb20gdGhlIHNwZWM6IFRoaXMgdmFsdWUgY29udHJvbHMgaG93IGZyZXF1ZW50bHkgdGhlIGF1ZGlvcHJvY2VzcyBldmVudCBpc1xuICAgICAqIGRpc3BhdGNoZWQgYW5kIGhvdyBtYW55IHNhbXBsZS1mcmFtZXMgbmVlZCB0byBiZSBwcm9jZXNzZWQgZWFjaCBjYWxsLlxuICAgICAqIExvd2VyIHZhbHVlcyBmb3IgYnVmZmVyIHNpemUgd2lsbCByZXN1bHQgaW4gYSBsb3dlciAoYmV0dGVyKSBsYXRlbmN5LlxuICAgICAqIEhpZ2hlciB2YWx1ZXMgd2lsbCBiZSBuZWNlc3NhcnkgdG8gYXZvaWQgYXVkaW8gYnJlYWt1cCBhbmQgZ2xpdGNoZXNcbiAgICAgKiBUaGUgc2l6ZSBvZiB0aGUgYnVmZmVyIChpbiBzYW1wbGUtZnJhbWVzKSB3aGljaCBuZWVkcyB0b1xuICAgICAqIGJlIHByb2Nlc3NlZCBlYWNoIHRpbWUgb25wcm9jZXNzYXVkaW8gaXMgY2FsbGVkLlxuICAgICAqIExlZ2FsIHZhbHVlcyBhcmUgKDI1NiwgNTEyLCAxMDI0LCAyMDQ4LCA0MDk2LCA4MTkyLCAxNjM4NCkuXG4gICAgICogQHByb3BlcnR5IHtudW1iZXJ9IGJ1ZmZlclNpemUgLSBCdWZmZXItc2l6ZSBmb3IgaG93IGZyZXF1ZW50bHkgdGhlIGF1ZGlvcHJvY2VzcyBldmVudCBpcyBkaXNwYXRjaGVkLlxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlciA9IG5ldyBTdGVyZW9BdWRpb1JlY29yZGVyKG1lZGlhU3RyZWFtLCB7XG4gICAgICogICAgIGJ1ZmZlclNpemU6IDQwOTZcbiAgICAgKiB9KTtcbiAgICAgKi9cblxuICAgIC8vIFwiMFwiIG1lYW5zLCBsZXQgY2hyb21lIGRlY2lkZSB0aGUgbW9zdCBhY2N1cmF0ZSBidWZmZXItc2l6ZSBmb3IgY3VycmVudCBwbGF0Zm9ybS5cbiAgICB2YXIgYnVmZmVyU2l6ZSA9IHR5cGVvZiBjb25maWcuYnVmZmVyU2l6ZSA9PT0gJ3VuZGVmaW5lZCcgPyA0MDk2IDogY29uZmlnLmJ1ZmZlclNpemU7XG5cbiAgICBpZiAobGVnYWxCdWZmZXJWYWx1ZXMuaW5kZXhPZihidWZmZXJTaXplKSA9PT0gLTEpIHtcbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignTGVnYWwgdmFsdWVzIGZvciBidWZmZXItc2l6ZSBhcmUgJyArIEpTT04uc3RyaW5naWZ5KGxlZ2FsQnVmZmVyVmFsdWVzLCBudWxsLCAnXFx0JykpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBUaGUgc2FtcGxlIHJhdGUgKGluIHNhbXBsZS1mcmFtZXMgcGVyIHNlY29uZCkgYXQgd2hpY2ggdGhlXG4gICAgICogQXVkaW9Db250ZXh0IGhhbmRsZXMgYXVkaW8uIEl0IGlzIGFzc3VtZWQgdGhhdCBhbGwgQXVkaW9Ob2Rlc1xuICAgICAqIGluIHRoZSBjb250ZXh0IHJ1biBhdCB0aGlzIHJhdGUuIEluIG1ha2luZyB0aGlzIGFzc3VtcHRpb24sXG4gICAgICogc2FtcGxlLXJhdGUgY29udmVydGVycyBvciBcInZhcmlzcGVlZFwiIHByb2Nlc3NvcnMgYXJlIG5vdCBzdXBwb3J0ZWRcbiAgICAgKiBpbiByZWFsLXRpbWUgcHJvY2Vzc2luZy5cbiAgICAgKiBUaGUgc2FtcGxlUmF0ZSBwYXJhbWV0ZXIgZGVzY3JpYmVzIHRoZSBzYW1wbGUtcmF0ZSBvZiB0aGVcbiAgICAgKiBsaW5lYXIgUENNIGF1ZGlvIGRhdGEgaW4gdGhlIGJ1ZmZlciBpbiBzYW1wbGUtZnJhbWVzIHBlciBzZWNvbmQuXG4gICAgICogQW4gaW1wbGVtZW50YXRpb24gbXVzdCBzdXBwb3J0IHNhbXBsZS1yYXRlcyBpbiBhdCBsZWFzdFxuICAgICAqIHRoZSByYW5nZSAyMjA1MCB0byA5NjAwMC5cbiAgICAgKiBAcHJvcGVydHkge251bWJlcn0gc2FtcGxlUmF0ZSAtIEJ1ZmZlci1zaXplIGZvciBob3cgZnJlcXVlbnRseSB0aGUgYXVkaW9wcm9jZXNzIGV2ZW50IGlzIGRpc3BhdGNoZWQuXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyID0gbmV3IFN0ZXJlb0F1ZGlvUmVjb3JkZXIobWVkaWFTdHJlYW0sIHtcbiAgICAgKiAgICAgc2FtcGxlUmF0ZTogNDQxMDBcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICB2YXIgc2FtcGxlUmF0ZSA9IHR5cGVvZiBjb25maWcuc2FtcGxlUmF0ZSAhPT0gJ3VuZGVmaW5lZCcgPyBjb25maWcuc2FtcGxlUmF0ZSA6IGNvbnRleHQuc2FtcGxlUmF0ZSB8fCA0NDEwMDtcblxuICAgIGlmIChzYW1wbGVSYXRlIDwgMjIwNTAgfHwgc2FtcGxlUmF0ZSA+IDk2MDAwKSB7XG4gICAgICAgIC8vIFJlZjogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjYzMDM5MTgvNTUyMTgyXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ3NhbXBsZS1yYXRlIG11c3QgYmUgdW5kZXIgcmFuZ2UgMjIwNTAgYW5kIDk2MDAwLicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvbnRleHQuY3JlYXRlSmF2YVNjcmlwdE5vZGUpIHtcbiAgICAgICAgX19zdGVyZW9BdWRpb1JlY29yZGVySmF2YWNyaXB0Tm9kZSA9IGNvbnRleHQuY3JlYXRlSmF2YVNjcmlwdE5vZGUoYnVmZmVyU2l6ZSwgMiwgMik7XG4gICAgfSBlbHNlIGlmIChjb250ZXh0LmNyZWF0ZVNjcmlwdFByb2Nlc3Nvcikge1xuICAgICAgICBfX3N0ZXJlb0F1ZGlvUmVjb3JkZXJKYXZhY3JpcHROb2RlID0gY29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IoYnVmZmVyU2l6ZSwgMiwgMik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgJ1dlYkF1ZGlvIEFQSSBoYXMgbm8gc3VwcG9ydCBvbiB0aGlzIGJyb3dzZXIuJztcbiAgICB9XG5cbiAgICAvLyBjb25uZWN0IHRoZSBzdHJlYW0gdG8gdGhlIGdhaW4gbm9kZVxuICAgIGF1ZGlvSW5wdXQuY29ubmVjdChfX3N0ZXJlb0F1ZGlvUmVjb3JkZXJKYXZhY3JpcHROb2RlKTtcblxuICAgIGJ1ZmZlclNpemUgPSBfX3N0ZXJlb0F1ZGlvUmVjb3JkZXJKYXZhY3JpcHROb2RlLmJ1ZmZlclNpemU7XG5cbiAgICBpZiAoIWNvbmZpZy5kaXNhYmxlTG9ncykge1xuICAgICAgICBjb25zb2xlLmxvZygnc2FtcGxlLXJhdGUnLCBzYW1wbGVSYXRlKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2J1ZmZlci1zaXplJywgYnVmZmVyU2l6ZSk7XG4gICAgfVxuXG4gICAgdmFyIGlzUGF1c2VkID0gZmFsc2U7XG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcGF1c2VzIHRoZSByZWNvcmRpbmcgcHJvY2Vzcy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnBhdXNlKCk7XG4gICAgICovXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpc1BhdXNlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKCFjb25maWcuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1BhdXNlZCByZWNvcmRpbmcuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBTdGVyZW9BdWRpb1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZXN1bWUoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpc1BhdXNlZCA9IGZhbHNlO1xuXG4gICAgICAgIGlmICghY29uZmlnLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZXN1bWVkIHJlY29yZGluZy4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgaXNBdWRpb1Byb2Nlc3NTdGFydGVkID0gZmFsc2U7XG5cbiAgICBfX3N0ZXJlb0F1ZGlvUmVjb3JkZXJKYXZhY3JpcHROb2RlLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoaXNQYXVzZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIE1lZGlhU3RyZWFtKCkuc3RvcCgpIG9yIE1lZGlhU3RyZWFtVHJhY2suc3RvcCgpIGlzIGludm9rZWQuXG4gICAgICAgIGlmIChtZWRpYVN0cmVhbS5lbmRlZCkge1xuICAgICAgICAgICAgX19zdGVyZW9BdWRpb1JlY29yZGVySmF2YWNyaXB0Tm9kZS5vbmF1ZGlvcHJvY2VzcyA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXJlY29yZGluZykge1xuICAgICAgICAgICAgYXVkaW9JbnB1dC5kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhpcyBtZXRob2QgaXMgY2FsbGVkIG9uIFwib25hdWRpb3Byb2Nlc3NcIiBldmVudCdzIGZpcnN0IGludm9jYXRpb24uXG4gICAgICAgICAqIEBtZXRob2Qge2Z1bmN0aW9ufSBvbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWRcbiAgICAgICAgICogQG1lbWJlcm9mIFN0ZXJlb0F1ZGlvUmVjb3JkZXJcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogcmVjb3JkZXIub25BdWRpb1Byb2Nlc3NTdGFydGVkOiBmdW5jdGlvbigpIHsgfTtcbiAgICAgICAgICovXG4gICAgICAgIGlmICghaXNBdWRpb1Byb2Nlc3NTdGFydGVkKSB7XG4gICAgICAgICAgICBpc0F1ZGlvUHJvY2Vzc1N0YXJ0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHNlbGYub25BdWRpb1Byb2Nlc3NTdGFydGVkKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vbkF1ZGlvUHJvY2Vzc1N0YXJ0ZWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsZWZ0ID0gZS5pbnB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcbiAgICAgICAgdmFyIHJpZ2h0ID0gZS5pbnB1dEJ1ZmZlci5nZXRDaGFubmVsRGF0YSgxKTtcblxuICAgICAgICAvLyB3ZSBjbG9uZSB0aGUgc2FtcGxlc1xuICAgICAgICBsZWZ0Y2hhbm5lbC5wdXNoKG5ldyBGbG9hdDMyQXJyYXkobGVmdCkpO1xuICAgICAgICByaWdodGNoYW5uZWwucHVzaChuZXcgRmxvYXQzMkFycmF5KHJpZ2h0KSk7XG5cbiAgICAgICAgcmVjb3JkaW5nTGVuZ3RoICs9IGJ1ZmZlclNpemU7XG4gICAgfTtcblxuICAgIC8vIHRvIHByZXZlbnQgc2VsZiBhdWRpbyB0byBiZSBjb25uZWN0ZWQgd2l0aCBzcGVha2Vyc1xuICAgIF9fc3RlcmVvQXVkaW9SZWNvcmRlckphdmFjcmlwdE5vZGUuY29ubmVjdChjb250ZXh0LmRlc3RpbmF0aW9uKTtcbn1cbi8vIF9fX19fX19fX19fX19fX19fXG4vLyBDYW52YXNSZWNvcmRlci5qc1xuXG4vKipcbiAqIENhbnZhc1JlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIEhUTUw1LUNhbnZhcyByZWNvcmRpbmcgaW50byB2aWRlbyBXZWJNLiBJdCB1c2VzIEhUTUwyQ2FudmFzIGxpYnJhcnkgYW5kIHJ1bnMgdG9wIG92ZXIge0BsaW5rIFdoYW1teX0uXG4gKiBAc3VtbWFyeSBIVE1MMkNhbnZhcyByZWNvcmRpbmcgaW50byB2aWRlbyBXZWJNLlxuICogQHR5cGVkZWYgQ2FudmFzUmVjb3JkZXJcbiAqIEBjbGFzc1xuICogQGV4YW1wbGVcbiAqIHZhciByZWNvcmRlciA9IG5ldyBDYW52YXNSZWNvcmRlcihodG1sRWxlbWVudCk7XG4gKiByZWNvcmRlci5yZWNvcmQoKTtcbiAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xuICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gKiB9KTtcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGh0bWxFbGVtZW50IC0gcXVlcnlTZWxlY3Rvci9nZXRFbGVtZW50QnlJZC9nZXRFbGVtZW50c0J5VGFnTmFtZVswXS9ldGMuXG4gKi9cblxuZnVuY3Rpb24gQ2FudmFzUmVjb3JkZXIoaHRtbEVsZW1lbnQpIHtcbiAgICBpZiAoIXdpbmRvdy5odG1sMmNhbnZhcykge1xuICAgICAgICB0aHJvdyAnUGxlYXNlIGxpbms6IC8vY2RuLndlYnJ0Yy1leHBlcmltZW50LmNvbS9zY3JlZW5zaG90LmpzJztcbiAgICB9XG5cbiAgICB2YXIgaXNSZWNvcmRpbmc7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZWNvcmRzIENhbnZhcy5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIENhbnZhc1JlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZWNvcmQoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlY29yZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpc1JlY29yZGluZyA9IHRydWU7XG4gICAgICAgIHdoYW1teS5mcmFtZXMgPSBbXTtcbiAgICAgICAgZHJhd0NhbnZhc0ZyYW1lKCk7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHN0b3BzIHJlY29yZGluZyBDYW52YXMuXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBDYW52YXNSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICogfSk7XG4gICAgICovXG4gICAgdGhpcy5zdG9wID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgaXNSZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHByb3BlcnR5IHtCbG9ifSBibG9iIC0gUmVjb3JkZWQgZnJhbWVzIGluIHZpZGVvL3dlYm0gYmxvYi5cbiAgICAgICAgICogQG1lbWJlcm9mIENhbnZhc1JlY29yZGVyXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKSB7XG4gICAgICAgICAqICAgICB2YXIgYmxvYiA9IHJlY29yZGVyLmJsb2I7XG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5ibG9iID0gd2hhbW15LmNvbXBpbGUoKTtcblxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMuYmxvYik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGlzUGF1c2VkUmVjb3JkaW5nID0gZmFsc2U7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBwYXVzZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgQ2FudmFzUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnBhdXNlKCk7XG4gICAgICovXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpc1BhdXNlZFJlY29yZGluZyA9IHRydWU7XG5cbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdQYXVzZWQgcmVjb3JkaW5nLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHJlc3VtZXMgdGhlIHJlY29yZGluZyBwcm9jZXNzLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgQ2FudmFzUmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlc3VtZSgpO1xuICAgICAqL1xuICAgIHRoaXMucmVzdW1lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlzUGF1c2VkUmVjb3JkaW5nID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVMb2dzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdSZXN1bWVkIHJlY29yZGluZy4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBkcmF3Q2FudmFzRnJhbWUoKSB7XG4gICAgICAgIGlmIChpc1BhdXNlZFJlY29yZGluZykge1xuICAgICAgICAgICAgbGFzdFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGRyYXdDYW52YXNGcmFtZSwgMTAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdpbmRvdy5odG1sMmNhbnZhcyhodG1sRWxlbWVudCwge1xuICAgICAgICAgICAgb25yZW5kZXJlZDogZnVuY3Rpb24oY2FudmFzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGR1cmF0aW9uID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsYXN0VGltZTtcbiAgICAgICAgICAgICAgICBpZiAoIWR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkcmF3Q2FudmFzRnJhbWUoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB2aWEgIzIwNiwgYnkgSmFjayBpLmUuIEBTZXltb3VyclxuICAgICAgICAgICAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgICAgICAgICB3aGFtbXkuZnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS93ZWJwJylcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmIChpc1JlY29yZGluZykge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd0NhbnZhc0ZyYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBsYXN0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXG4gICAgdmFyIHdoYW1teSA9IG5ldyBXaGFtbXkuVmlkZW8oMTAwKTtcbn1cbi8vIF9fX19fX19fX19fX19fX19fXG4vLyBXaGFtbXlSZWNvcmRlci5qc1xuXG4vKipcbiAqIFdoYW1teVJlY29yZGVyIGlzIGEgc3RhbmRhbG9uZSBjbGFzcyB1c2VkIGJ5IHtAbGluayBSZWNvcmRSVEN9IHRvIGJyaW5nIHZpZGVvIHJlY29yZGluZyBpbiBDaHJvbWUuIEl0IHJ1bnMgdG9wIG92ZXIge0BsaW5rIFdoYW1teX0uXG4gKiBAc3VtbWFyeSBWaWRlbyByZWNvcmRpbmcgZmVhdHVyZSBpbiBDaHJvbWUuXG4gKiBAdHlwZWRlZiBXaGFtbXlSZWNvcmRlclxuICogQGNsYXNzXG4gKiBAZXhhbXBsZVxuICogdmFyIHJlY29yZGVyID0gbmV3IFdoYW1teVJlY29yZGVyKG1lZGlhU3RyZWFtKTtcbiAqIHJlY29yZGVyLnJlY29yZCgpO1xuICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gKiAgICAgdmlkZW8uc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAqIH0pO1xuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXG4gKi9cblxuZnVuY3Rpb24gV2hhbW15UmVjb3JkZXIobWVkaWFTdHJlYW0pIHtcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCByZWNvcmRzIHZpZGVvLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgV2hhbW15UmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnJlY29yZCgpO1xuICAgICAqL1xuICAgIHRoaXMucmVjb3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy53aWR0aCkge1xuICAgICAgICAgICAgdGhpcy53aWR0aCA9IDMyMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5oZWlnaHQpIHtcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gMjQwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLnZpZGVvKSB7XG4gICAgICAgICAgICB0aGlzLnZpZGVvID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuY2FudmFzKSB7XG4gICAgICAgICAgICB0aGlzLmNhbnZhcyA9IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogdGhpcy53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgY2FudmFzLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGg7XG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQ7XG5cbiAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIC8vIHNldHRpbmcgZGVmYXVsdHNcbiAgICAgICAgaWYgKHRoaXMudmlkZW8gJiYgdGhpcy52aWRlbyBpbnN0YW5jZW9mIEhUTUxWaWRlb0VsZW1lbnQpIHtcbiAgICAgICAgICAgIHZpZGVvID0gdGhpcy52aWRlby5jbG9uZU5vZGUoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbiAgICAgICAgICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwobWVkaWFTdHJlYW0pO1xuXG4gICAgICAgICAgICB2aWRlby53aWR0aCA9IHRoaXMudmlkZW8ud2lkdGg7XG4gICAgICAgICAgICB2aWRlby5oZWlnaHQgPSB0aGlzLnZpZGVvLmhlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZpZGVvLm11dGVkID0gdHJ1ZTtcbiAgICAgICAgdmlkZW8ucGxheSgpO1xuXG4gICAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIHdoYW1teSA9IG5ldyBXaGFtbXkuVmlkZW8oKTtcblxuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjYW52YXMgcmVzb2x1dGlvbnMnLCBjYW52YXMud2lkdGgsICcqJywgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygndmlkZW8gd2lkdGgvaGVpZ2h0JywgdmlkZW8ud2lkdGggfHwgY2FudmFzLndpZHRoLCAnKicsIHZpZGVvLmhlaWdodCB8fCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGRyYXdGcmFtZXMoKTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZHJhd0ZyYW1lcygpIHtcbiAgICAgICAgdmFyIGR1cmF0aW9uID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBsYXN0VGltZTtcbiAgICAgICAgaWYgKCFkdXJhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZHJhd0ZyYW1lcywgMTApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGlzUGF1c2VkUmVjb3JkaW5nKSB7XG4gICAgICAgICAgICBsYXN0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZHJhd0ZyYW1lcywgMTAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZpYSAjMjA2LCBieSBKYWNrIGkuZS4gQFNleW1vdXJyXG4gICAgICAgIGxhc3RUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgaWYgKHZpZGVvLnBhdXNlZCkge1xuICAgICAgICAgICAgLy8gdmlhOiBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1dlYlJUQy1FeHBlcmltZW50L3B1bGwvMzE2XG4gICAgICAgICAgICAvLyBUd2VhayBmb3IgQW5kcm9pZCBDaHJvbWVcbiAgICAgICAgICAgIHZpZGVvLnBsYXkoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKHZpZGVvLCAwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB3aGFtbXkuZnJhbWVzLnB1c2goe1xuICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICAgICAgaW1hZ2U6IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3dlYnAnKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIWlzU3RvcERyYXdpbmcpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZHJhd0ZyYW1lcywgMTApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogcmVtb3ZlIGJsYWNrIGZyYW1lcyBmcm9tIHRoZSBiZWdpbm5pbmcgdG8gdGhlIHNwZWNpZmllZCBmcmFtZVxuICAgICAqIEBwYXJhbSB7QXJyYXl9IF9mcmFtZXMgLSBhcnJheSBvZiBmcmFtZXMgdG8gYmUgY2hlY2tlZFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBfZnJhbWVzVG9DaGVjayAtIG51bWJlciBvZiBmcmFtZSB1bnRpbCBjaGVjayB3aWxsIGJlIGV4ZWN1dGVkICgtMSAtIHdpbGwgZHJvcCBhbGwgZnJhbWVzIHVudGlsIGZyYW1lIG5vdCBtYXRjaGVkIHdpbGwgYmUgZm91bmQpXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IF9waXhUb2xlcmFuY2UgLSAwIC0gdmVyeSBzdHJpY3QgKG9ubHkgYmxhY2sgcGl4ZWwgY29sb3IpIDsgMSAtIGFsbFxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBfZnJhbWVUb2xlcmFuY2UgLSAwIC0gdmVyeSBzdHJpY3QgKG9ubHkgYmxhY2sgZnJhbWUgY29sb3IpIDsgMSAtIGFsbFxuICAgICAqIEByZXR1cm5zIHtBcnJheX0gLSBhcnJheSBvZiBmcmFtZXNcbiAgICAgKi9cbiAgICAvLyBwdWxsIzI5MyBieSBAdm9sb2RhbGV4ZXlcbiAgICBmdW5jdGlvbiBkcm9wQmxhY2tGcmFtZXMoX2ZyYW1lcywgX2ZyYW1lc1RvQ2hlY2ssIF9waXhUb2xlcmFuY2UsIF9mcmFtZVRvbGVyYW5jZSkge1xuICAgICAgICB2YXIgbG9jYWxDYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICAgICAgbG9jYWxDYW52YXMud2lkdGggPSBjYW52YXMud2lkdGg7XG4gICAgICAgIGxvY2FsQ2FudmFzLmhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG4gICAgICAgIHZhciBjb250ZXh0MmQgPSBsb2NhbENhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB2YXIgcmVzdWx0RnJhbWVzID0gW107XG5cbiAgICAgICAgdmFyIGNoZWNrVW50aWxOb3RCbGFjayA9IF9mcmFtZXNUb0NoZWNrID09PSAtMTtcbiAgICAgICAgdmFyIGVuZENoZWNrRnJhbWUgPSAoX2ZyYW1lc1RvQ2hlY2sgJiYgX2ZyYW1lc1RvQ2hlY2sgPiAwICYmIF9mcmFtZXNUb0NoZWNrIDw9IF9mcmFtZXMubGVuZ3RoKSA/XG4gICAgICAgICAgICBfZnJhbWVzVG9DaGVjayA6IF9mcmFtZXMubGVuZ3RoO1xuICAgICAgICB2YXIgc2FtcGxlQ29sb3IgPSB7XG4gICAgICAgICAgICByOiAwLFxuICAgICAgICAgICAgZzogMCxcbiAgICAgICAgICAgIGI6IDBcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIG1heENvbG9yRGlmZmVyZW5jZSA9IE1hdGguc3FydChcbiAgICAgICAgICAgIE1hdGgucG93KDI1NSwgMikgK1xuICAgICAgICAgICAgTWF0aC5wb3coMjU1LCAyKSArXG4gICAgICAgICAgICBNYXRoLnBvdygyNTUsIDIpXG4gICAgICAgICk7XG4gICAgICAgIHZhciBwaXhUb2xlcmFuY2UgPSBfcGl4VG9sZXJhbmNlICYmIF9waXhUb2xlcmFuY2UgPj0gMCAmJiBfcGl4VG9sZXJhbmNlIDw9IDEgPyBfcGl4VG9sZXJhbmNlIDogMDtcbiAgICAgICAgdmFyIGZyYW1lVG9sZXJhbmNlID0gX2ZyYW1lVG9sZXJhbmNlICYmIF9mcmFtZVRvbGVyYW5jZSA+PSAwICYmIF9mcmFtZVRvbGVyYW5jZSA8PSAxID8gX2ZyYW1lVG9sZXJhbmNlIDogMDtcbiAgICAgICAgdmFyIGRvTm90Q2hlY2tOZXh0ID0gZmFsc2U7XG5cbiAgICAgICAgZm9yICh2YXIgZiA9IDA7IGYgPCBlbmRDaGVja0ZyYW1lOyBmKyspIHtcbiAgICAgICAgICAgIHZhciBtYXRjaFBpeENvdW50LCBlbmRQaXhDaGVjaywgbWF4UGl4Q291bnQ7XG5cbiAgICAgICAgICAgIGlmICghZG9Ob3RDaGVja05leHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgICAgICBpbWFnZS5zcmMgPSBfZnJhbWVzW2ZdLmltYWdlO1xuICAgICAgICAgICAgICAgIGNvbnRleHQyZC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgdmFyIGltYWdlRGF0YSA9IGNvbnRleHQyZC5nZXRJbWFnZURhdGEoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBtYXRjaFBpeENvdW50ID0gMDtcbiAgICAgICAgICAgICAgICBlbmRQaXhDaGVjayA9IGltYWdlRGF0YS5kYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBtYXhQaXhDb3VudCA9IGltYWdlRGF0YS5kYXRhLmxlbmd0aCAvIDQ7XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBwaXggPSAwOyBwaXggPCBlbmRQaXhDaGVjazsgcGl4ICs9IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRDb2xvciA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHI6IGltYWdlRGF0YS5kYXRhW3BpeF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBnOiBpbWFnZURhdGEuZGF0YVtwaXggKyAxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGI6IGltYWdlRGF0YS5kYXRhW3BpeCArIDJdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2xvckRpZmZlcmVuY2UgPSBNYXRoLnNxcnQoXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLnBvdyhjdXJyZW50Q29sb3IuciAtIHNhbXBsZUNvbG9yLnIsIDIpICtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1hdGgucG93KGN1cnJlbnRDb2xvci5nIC0gc2FtcGxlQ29sb3IuZywgMikgK1xuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5wb3coY3VycmVudENvbG9yLmIgLSBzYW1wbGVDb2xvci5iLCAyKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAvLyBkaWZmZXJlbmNlIGluIGNvbG9yIGl0IGlzIGRpZmZlcmVuY2UgaW4gY29sb3IgdmVjdG9ycyAocjEsZzEsYjEpIDw9PiAocjIsZzIsYjIpXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xvckRpZmZlcmVuY2UgPD0gbWF4Q29sb3JEaWZmZXJlbmNlICogcGl4VG9sZXJhbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaFBpeENvdW50Kys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZG9Ob3RDaGVja05leHQgJiYgbWF4UGl4Q291bnQgLSBtYXRjaFBpeENvdW50IDw9IG1heFBpeENvdW50ICogZnJhbWVUb2xlcmFuY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygncmVtb3ZlZCBibGFjayBmcmFtZSA6ICcgKyBmICsgJyA7IGZyYW1lIGR1cmF0aW9uICcgKyBfZnJhbWVzW2ZdLmR1cmF0aW9uKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2ZyYW1lIGlzIHBhc3NlZCA6ICcgKyBmKTtcbiAgICAgICAgICAgICAgICBpZiAoY2hlY2tVbnRpbE5vdEJsYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvTm90Q2hlY2tOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmVzdWx0RnJhbWVzLnB1c2goX2ZyYW1lc1tmXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXN1bHRGcmFtZXMgPSByZXN1bHRGcmFtZXMuY29uY2F0KF9mcmFtZXMuc2xpY2UoZW5kQ2hlY2tGcmFtZSkpO1xuXG4gICAgICAgIGlmIChyZXN1bHRGcmFtZXMubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIC8vIGF0IGxlYXN0IG9uZSBsYXN0IGZyYW1lIHNob3VsZCBiZSBhdmFpbGFibGUgZm9yIG5leHQgbWFuaXB1bGF0aW9uXG4gICAgICAgICAgICAvLyBpZiB0b3RhbCBkdXJhdGlvbiBvZiBhbGwgZnJhbWVzIHdpbGwgYmUgPCAxMDAwIHRoYW4gZmZtcGVnIGRvZXNuJ3Qgd29yayB3ZWxsLi4uXG4gICAgICAgICAgICByZXN1bHRGcmFtZXMucHVzaChfZnJhbWVzW19mcmFtZXMubGVuZ3RoIC0gMV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdEZyYW1lcztcbiAgICB9XG5cbiAgICB2YXIgaXNTdG9wRHJhd2luZyA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2Qgc3RvcHMgcmVjb3JkaW5nIHZpZGVvLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgV2hhbW15UmVjb3JkZXJcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oYmxvYikge1xuICAgICAqICAgICB2aWRlby5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGlzU3RvcERyYXdpbmcgPSB0cnVlO1xuXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIC8vIGFuYWx5c2Ugb2YgYWxsIGZyYW1lcyB0YWtlcyBzb21lIHRpbWUhXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBlLmcuIGRyb3BCbGFja0ZyYW1lcyhmcmFtZXMsIDEwLCAxLCAxKSAtIHdpbGwgY3V0IGFsbCAxMCBmcmFtZXNcbiAgICAgICAgICAgIC8vIGUuZy4gZHJvcEJsYWNrRnJhbWVzKGZyYW1lcywgMTAsIDAuNSwgMC41KSAtIHdpbGwgYW5hbHlzZSAxMCBmcmFtZXNcbiAgICAgICAgICAgIC8vIGUuZy4gZHJvcEJsYWNrRnJhbWVzKGZyYW1lcywgMTApID09PSBkcm9wQmxhY2tGcmFtZXMoZnJhbWVzLCAxMCwgMCwgMCkgLSB3aWxsIGFuYWx5c2UgMTAgZnJhbWVzIHdpdGggc3RyaWN0IGJsYWNrIGNvbG9yXG4gICAgICAgICAgICB3aGFtbXkuZnJhbWVzID0gZHJvcEJsYWNrRnJhbWVzKHdoYW1teS5mcmFtZXMsIC0xKTtcblxuICAgICAgICAgICAgLy8gdG8gZGlzcGxheSBhZHZlcnRpc2VtZW50IGltYWdlcyFcbiAgICAgICAgICAgIGlmICh0aGlzLmFkdmVydGlzZW1lbnQgJiYgdGhpcy5hZHZlcnRpc2VtZW50Lmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHdoYW1teS5mcmFtZXMgPSB0aGlzLmFkdmVydGlzZW1lbnQuY29uY2F0KHdoYW1teS5mcmFtZXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFJlY29yZGVkIGZyYW1lcyBpbiB2aWRlby93ZWJtIGJsb2IuXG4gICAgICAgICAgICAgKiBAbWVtYmVyb2YgV2hhbW15UmVjb3JkZXJcbiAgICAgICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAgICAgKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcbiAgICAgICAgICAgICAqIH0pO1xuICAgICAgICAgICAgICovXG4gICAgICAgICAgICB3aGFtbXkuY29tcGlsZShmdW5jdGlvbihibG9iKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuYmxvYiA9IGJsb2I7XG5cbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMuYmxvYi5mb3JFYWNoKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmJsb2IgPSBuZXcgQmxvYihbXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3ZpZGVvL3dlYm0nXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhfdGhpcy5ibG9iKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgMTApO1xuICAgIH07XG5cbiAgICB2YXIgaXNQYXVzZWRSZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcbiAgICAgKi9cbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlzUGF1c2VkUmVjb3JkaW5nID0gdHJ1ZTtcblxuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1BhdXNlZCByZWNvcmRpbmcuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBXaGFtbXlSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XG4gICAgICovXG4gICAgdGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaXNQYXVzZWRSZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Jlc3VtZWQgcmVjb3JkaW5nLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdmFyIHZpZGVvO1xuICAgIHZhciBsYXN0VGltZTtcbiAgICB2YXIgd2hhbW15O1xufVxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2FudGltYXR0ZXIxNS93aGFtbXkvYmxvYi9tYXN0ZXIvTElDRU5TRVxuLy8gX19fX19fX19fXG4vLyBXaGFtbXkuanNcblxuLy8gdG9kbzogRmlyZWZveCBub3cgc3VwcG9ydHMgd2VicCBmb3Igd2VibSBjb250YWluZXJzIVxuLy8gdGhlaXIgTWVkaWFSZWNvcmRlciBpbXBsZW1lbnRhdGlvbiB3b3JrcyB3ZWxsIVxuLy8gc2hvdWxkIHdlIHByb3ZpZGUgYW4gb3B0aW9uIHRvIHJlY29yZCB2aWEgV2hhbW15LmpzIG9yIE1lZGlhUmVjb3JkZXIgQVBJIGlzIGEgYmV0dGVyIHNvbHV0aW9uP1xuXG4vKipcbiAqIFdoYW1teSBpcyBhIHN0YW5kYWxvbmUgY2xhc3MgdXNlZCBieSB7QGxpbmsgUmVjb3JkUlRDfSB0byBicmluZyB2aWRlbyByZWNvcmRpbmcgaW4gQ2hyb21lLiBJdCBpcyB3cml0dGVuIGJ5IHtAbGluayBodHRwczovL2dpdGh1Yi5jb20vYW50aW1hdHRlcjE1fGFudGltYXR0ZXIxNX1cbiAqIEBzdW1tYXJ5IEEgcmVhbCB0aW1lIGphdmFzY3JpcHQgd2VibSBlbmNvZGVyIGJhc2VkIG9uIGEgY2FudmFzIGhhY2suXG4gKiBAdHlwZWRlZiBXaGFtbXlcbiAqIEBjbGFzc1xuICogQGV4YW1wbGVcbiAqIHZhciByZWNvcmRlciA9IG5ldyBXaGFtbXkoKS5WaWRlbygxNSk7XG4gKiByZWNvcmRlci5hZGQoY29udGV4dCB8fCBjYW52YXMgfHwgZGF0YVVSTCk7XG4gKiB2YXIgb3V0cHV0ID0gcmVjb3JkZXIuY29tcGlsZSgpO1xuICovXG5cbnZhciBXaGFtbXkgPSAoZnVuY3Rpb24oKSB7XG4gICAgLy8gYSBtb3JlIGFic3RyYWN0LWlzaCBBUElcblxuICAgIGZ1bmN0aW9uIFdoYW1teVZpZGVvKGR1cmF0aW9uKSB7XG4gICAgICAgIHRoaXMuZnJhbWVzID0gW107XG4gICAgICAgIHRoaXMuZHVyYXRpb24gPSBkdXJhdGlvbiB8fCAxO1xuICAgICAgICB0aGlzLnF1YWxpdHkgPSAxMDA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGFzcyBDYW52YXMgb3IgQ29udGV4dCBvciBpbWFnZS93ZWJwKHN0cmluZykgdG8ge0BsaW5rIFdoYW1teX0gZW5jb2Rlci5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIFdoYW1teVxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIgPSBuZXcgV2hhbW15KCkuVmlkZW8oMC44LCAxMDApO1xuICAgICAqIHJlY29yZGVyLmFkZChjYW52YXMgfHwgY29udGV4dCB8fCAnaW1hZ2Uvd2VicCcpO1xuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmcmFtZSAtIENhbnZhcyB8fCBDb250ZXh0IHx8IGltYWdlL3dlYnBcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gLSBTdGljayBhIGR1cmF0aW9uIChpbiBtaWxsaXNlY29uZHMpXG4gICAgICovXG4gICAgV2hhbW15VmlkZW8ucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGZyYW1lLCBkdXJhdGlvbikge1xuICAgICAgICBpZiAoJ2NhbnZhcycgaW4gZnJhbWUpIHsgLy9DYW52YXNSZW5kZXJpbmdDb250ZXh0MkRcbiAgICAgICAgICAgIGZyYW1lID0gZnJhbWUuY2FudmFzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCd0b0RhdGFVUkwnIGluIGZyYW1lKSB7XG4gICAgICAgICAgICBmcmFtZSA9IGZyYW1lLnRvRGF0YVVSTCgnaW1hZ2Uvd2VicCcsIHRoaXMucXVhbGl0eSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoISgvXmRhdGE6aW1hZ2VcXC93ZWJwO2Jhc2U2NCwvaWcpLnRlc3QoZnJhbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyAnSW5wdXQgbXVzdCBiZSBmb3JtYXR0ZWQgcHJvcGVybHkgYXMgYSBiYXNlNjQgZW5jb2RlZCBEYXRhVVJJIG9mIHR5cGUgaW1hZ2Uvd2VicCc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mcmFtZXMucHVzaCh7XG4gICAgICAgICAgICBpbWFnZTogZnJhbWUsXG4gICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24gfHwgdGhpcy5kdXJhdGlvblxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc0luV2ViV29ya2VyKF9mdW5jdGlvbikge1xuICAgICAgICB2YXIgYmxvYiA9IFVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW19mdW5jdGlvbi50b1N0cmluZygpLFxuICAgICAgICAgICAgJ3RoaXMub25tZXNzYWdlID0gIGZ1bmN0aW9uIChlKSB7JyArIF9mdW5jdGlvbi5uYW1lICsgJyhlLmRhdGEpO30nXG4gICAgICAgIF0sIHtcbiAgICAgICAgICAgIHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdmFyIHdvcmtlciA9IG5ldyBXb3JrZXIoYmxvYik7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwoYmxvYik7XG4gICAgICAgIHJldHVybiB3b3JrZXI7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gd2hhbW15SW5XZWJXb3JrZXIoZnJhbWVzKSB7XG4gICAgICAgIGZ1bmN0aW9uIEFycmF5VG9XZWJNKGZyYW1lcykge1xuICAgICAgICAgICAgdmFyIGluZm8gPSBjaGVja0ZyYW1lcyhmcmFtZXMpO1xuICAgICAgICAgICAgaWYgKCFpbmZvKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgY2x1c3Rlck1heER1cmF0aW9uID0gMzAwMDA7XG5cbiAgICAgICAgICAgIHZhciBFQk1MID0gW3tcbiAgICAgICAgICAgICAgICAnaWQnOiAweDFhNDVkZmEzLCAvLyBFQk1MXG4gICAgICAgICAgICAgICAgJ2RhdGEnOiBbe1xuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDEsXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDI4NiAvLyBFQk1MVmVyc2lvblxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxLFxuICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDQyZjcgLy8gRUJNTFJlYWRWZXJzaW9uXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDQsXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDJmMiAvLyBFQk1MTWF4SURMZW5ndGhcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICdkYXRhJzogOCxcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0MmYzIC8vIEVCTUxNYXhTaXplTGVuZ3RoXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6ICd3ZWJtJyxcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0MjgyIC8vIERvY1R5cGVcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICdkYXRhJzogMixcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg0Mjg3IC8vIERvY1R5cGVWZXJzaW9uXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDIsXG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NDI4NSAvLyBEb2NUeXBlUmVhZFZlcnNpb25cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICdpZCc6IDB4MTg1MzgwNjcsIC8vIFNlZ21lbnRcbiAgICAgICAgICAgICAgICAnZGF0YSc6IFt7XG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4MTU0OWE5NjYsIC8vIEluZm9cbiAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBbe1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxZTYsIC8vZG8gdGhpbmdzIGluIG1pbGxpc2VjcyAobnVtIG9mIG5hbm9zZWNzIGZvciBkdXJhdGlvbiBzY2FsZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4MmFkN2IxIC8vIFRpbWVjb2RlU2NhbGVcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnd2hhbW15JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NGQ4MCAvLyBNdXhpbmdBcHBcbiAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnd2hhbW15JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4NTc0MSAvLyBXcml0aW5nQXBwXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogZG91YmxlVG9TdHJpbmcoaW5mby5kdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDQ0ODkgLy8gRHVyYXRpb25cbiAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICdpZCc6IDB4MTY1NGFlNmIsIC8vIFRyYWNrc1xuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGFlLCAvLyBUcmFja0VudHJ5XG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFt7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4ZDcgLy8gVHJhY2tOdW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg3M2M1IC8vIFRyYWNrVUlEXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4OWMgLy8gRmxhZ0xhY2luZ1xuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogJ3VuZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHgyMmI1OWMgLy8gTGFuZ3VhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6ICdWX1ZQOCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg4NiAvLyBDb2RlY0lEXG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiAnVlA4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweDI1ODY4OCAvLyBDb2RlY05hbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHg4MyAvLyBUcmFja1R5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGUwLCAvLyBWaWRlb1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW3tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2RhdGEnOiBpbmZvLndpZHRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnaWQnOiAweGIwIC8vIFBpeGVsV2lkdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogaW5mby5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdpZCc6IDB4YmEgLy8gUGl4ZWxIZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfV07XG5cbiAgICAgICAgICAgIC8vR2VuZXJhdGUgY2x1c3RlcnMgKG1heCBkdXJhdGlvbilcbiAgICAgICAgICAgIHZhciBmcmFtZU51bWJlciA9IDA7XG4gICAgICAgICAgICB2YXIgY2x1c3RlclRpbWVjb2RlID0gMDtcbiAgICAgICAgICAgIHdoaWxlIChmcmFtZU51bWJlciA8IGZyYW1lcy5sZW5ndGgpIHtcblxuICAgICAgICAgICAgICAgIHZhciBjbHVzdGVyRnJhbWVzID0gW107XG4gICAgICAgICAgICAgICAgdmFyIGNsdXN0ZXJEdXJhdGlvbiA9IDA7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBjbHVzdGVyRnJhbWVzLnB1c2goZnJhbWVzW2ZyYW1lTnVtYmVyXSk7XG4gICAgICAgICAgICAgICAgICAgIGNsdXN0ZXJEdXJhdGlvbiArPSBmcmFtZXNbZnJhbWVOdW1iZXJdLmR1cmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICBmcmFtZU51bWJlcisrO1xuICAgICAgICAgICAgICAgIH0gd2hpbGUgKGZyYW1lTnVtYmVyIDwgZnJhbWVzLmxlbmd0aCAmJiBjbHVzdGVyRHVyYXRpb24gPCBjbHVzdGVyTWF4RHVyYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgdmFyIGNsdXN0ZXJDb3VudGVyID0gMDtcbiAgICAgICAgICAgICAgICB2YXIgY2x1c3RlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ2lkJzogMHgxZjQzYjY3NSwgLy8gQ2x1c3RlclxuICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IGdldENsdXN0ZXJEYXRhKGNsdXN0ZXJUaW1lY29kZSwgY2x1c3RlckNvdW50ZXIsIGNsdXN0ZXJGcmFtZXMpXG4gICAgICAgICAgICAgICAgfTsgLy9BZGQgY2x1c3RlciB0byBzZWdtZW50XG4gICAgICAgICAgICAgICAgRUJNTFsxXS5kYXRhLnB1c2goY2x1c3Rlcik7XG4gICAgICAgICAgICAgICAgY2x1c3RlclRpbWVjb2RlICs9IGNsdXN0ZXJEdXJhdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGdlbmVyYXRlRUJNTChFQk1MKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGdldENsdXN0ZXJEYXRhKGNsdXN0ZXJUaW1lY29kZSwgY2x1c3RlckNvdW50ZXIsIGNsdXN0ZXJGcmFtZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgICAgICdkYXRhJzogY2x1c3RlclRpbWVjb2RlLFxuICAgICAgICAgICAgICAgICdpZCc6IDB4ZTcgLy8gVGltZWNvZGVcbiAgICAgICAgICAgIH1dLmNvbmNhdChjbHVzdGVyRnJhbWVzLm1hcChmdW5jdGlvbih3ZWJwKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJsb2NrID0gbWFrZVNpbXBsZUJsb2NrKHtcbiAgICAgICAgICAgICAgICAgICAgZGlzY2FyZGFibGU6IDAsXG4gICAgICAgICAgICAgICAgICAgIGZyYW1lOiB3ZWJwLmRhdGEuc2xpY2UoNCksXG4gICAgICAgICAgICAgICAgICAgIGludmlzaWJsZTogMCxcbiAgICAgICAgICAgICAgICAgICAga2V5ZnJhbWU6IDEsXG4gICAgICAgICAgICAgICAgICAgIGxhY2luZzogMCxcbiAgICAgICAgICAgICAgICAgICAgdHJhY2tOdW06IDEsXG4gICAgICAgICAgICAgICAgICAgIHRpbWVjb2RlOiBNYXRoLnJvdW5kKGNsdXN0ZXJDb3VudGVyKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNsdXN0ZXJDb3VudGVyICs9IHdlYnAuZHVyYXRpb247XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogYmxvY2ssXG4gICAgICAgICAgICAgICAgICAgIGlkOiAweGEzXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHN1bXMgdGhlIGxlbmd0aHMgb2YgYWxsIHRoZSBmcmFtZXMgYW5kIGdldHMgdGhlIGR1cmF0aW9uXG5cbiAgICAgICAgZnVuY3Rpb24gY2hlY2tGcmFtZXMoZnJhbWVzKSB7XG4gICAgICAgICAgICBpZiAoIWZyYW1lc1swXSkge1xuICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6ICdTb21ldGhpbmcgd2VudCB3cm9uZy4gTWF5YmUgV2ViUCBmb3JtYXQgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGUgY3VycmVudCBicm93c2VyLidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGZyYW1lc1swXS53aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQgPSBmcmFtZXNbMF0uaGVpZ2h0LFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uID0gZnJhbWVzWzBdLmR1cmF0aW9uO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uICs9IGZyYW1lc1tpXS5kdXJhdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIG51bVRvQnVmZmVyKG51bSkge1xuICAgICAgICAgICAgdmFyIHBhcnRzID0gW107XG4gICAgICAgICAgICB3aGlsZSAobnVtID4gMCkge1xuICAgICAgICAgICAgICAgIHBhcnRzLnB1c2gobnVtICYgMHhmZik7XG4gICAgICAgICAgICAgICAgbnVtID0gbnVtID4+IDg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkocGFydHMucmV2ZXJzZSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIHN0clRvQnVmZmVyKHN0cikge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHN0ci5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZS5jaGFyQ29kZUF0KDApO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gYml0c1RvQnVmZmVyKGJpdHMpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gW107XG4gICAgICAgICAgICB2YXIgcGFkID0gKGJpdHMubGVuZ3RoICUgOCkgPyAobmV3IEFycmF5KDEgKyA4IC0gKGJpdHMubGVuZ3RoICUgOCkpKS5qb2luKCcwJykgOiAnJztcbiAgICAgICAgICAgIGJpdHMgPSBwYWQgKyBiaXRzO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiaXRzLmxlbmd0aDsgaSArPSA4KSB7XG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKHBhcnNlSW50KGJpdHMuc3Vic3RyKGksIDgpLCAyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZW5lcmF0ZUVCTUwoanNvbikge1xuICAgICAgICAgICAgdmFyIGVibWwgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwganNvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0ganNvbltpXS5kYXRhO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICBkYXRhID0gZ2VuZXJhdGVFQk1MKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGJpdHNUb0J1ZmZlcihkYXRhLnRvU3RyaW5nKDIpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEgPSBzdHJUb0J1ZmZlcihkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgbGVuID0gZGF0YS5zaXplIHx8IGRhdGEuYnl0ZUxlbmd0aCB8fCBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB2YXIgemVyb2VzID0gTWF0aC5jZWlsKE1hdGguY2VpbChNYXRoLmxvZyhsZW4pIC8gTWF0aC5sb2coMikpIC8gOCk7XG4gICAgICAgICAgICAgICAgdmFyIHNpemVUb1N0cmluZyA9IGxlbi50b1N0cmluZygyKTtcbiAgICAgICAgICAgICAgICB2YXIgcGFkZGVkID0gKG5ldyBBcnJheSgoemVyb2VzICogNyArIDcgKyAxKSAtIHNpemVUb1N0cmluZy5sZW5ndGgpKS5qb2luKCcwJykgKyBzaXplVG9TdHJpbmc7XG4gICAgICAgICAgICAgICAgdmFyIHNpemUgPSAobmV3IEFycmF5KHplcm9lcykpLmpvaW4oJzAnKSArICcxJyArIHBhZGRlZDtcblxuICAgICAgICAgICAgICAgIGVibWwucHVzaChudW1Ub0J1ZmZlcihqc29uW2ldLmlkKSk7XG4gICAgICAgICAgICAgICAgZWJtbC5wdXNoKGJpdHNUb0J1ZmZlcihzaXplKSk7XG4gICAgICAgICAgICAgICAgZWJtbC5wdXNoKGRhdGEpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoZWJtbCwge1xuICAgICAgICAgICAgICAgIHR5cGU6ICd2aWRlby93ZWJtJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiB0b0JpblN0ck9sZChiaXRzKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhZCA9IChiaXRzLmxlbmd0aCAlIDgpID8gKG5ldyBBcnJheSgxICsgOCAtIChiaXRzLmxlbmd0aCAlIDgpKSkuam9pbignMCcpIDogJyc7XG4gICAgICAgICAgICBiaXRzID0gcGFkICsgYml0cztcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYml0cy5sZW5ndGg7IGkgKz0gOCkge1xuICAgICAgICAgICAgICAgIGRhdGEgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChiaXRzLnN1YnN0cihpLCA4KSwgMikpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBtYWtlU2ltcGxlQmxvY2soZGF0YSkge1xuICAgICAgICAgICAgdmFyIGZsYWdzID0gMDtcblxuICAgICAgICAgICAgaWYgKGRhdGEua2V5ZnJhbWUpIHtcbiAgICAgICAgICAgICAgICBmbGFncyB8PSAxMjg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmludmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIGZsYWdzIHw9IDg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmxhY2luZykge1xuICAgICAgICAgICAgICAgIGZsYWdzIHw9IChkYXRhLmxhY2luZyA8PCAxKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRhdGEuZGlzY2FyZGFibGUpIHtcbiAgICAgICAgICAgICAgICBmbGFncyB8PSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGF0YS50cmFja051bSA+IDEyNykge1xuICAgICAgICAgICAgICAgIHRocm93ICdUcmFja051bWJlciA+IDEyNyBub3Qgc3VwcG9ydGVkJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG91dCA9IFtkYXRhLnRyYWNrTnVtIHwgMHg4MCwgZGF0YS50aW1lY29kZSA+PiA4LCBkYXRhLnRpbWVjb2RlICYgMHhmZiwgZmxhZ3NdLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoZSk7XG4gICAgICAgICAgICB9KS5qb2luKCcnKSArIGRhdGEuZnJhbWU7XG5cbiAgICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBwYXJzZVdlYlAocmlmZikge1xuICAgICAgICAgICAgdmFyIFZQOCA9IHJpZmYuUklGRlswXS5XRUJQWzBdO1xuXG4gICAgICAgICAgICB2YXIgZnJhbWVTdGFydCA9IFZQOC5pbmRleE9mKCdcXHg5ZFxceDAxXFx4MmEnKTsgLy8gQSBWUDgga2V5ZnJhbWUgc3RhcnRzIHdpdGggdGhlIDB4OWQwMTJhIGhlYWRlclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGMgPSBbXTsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGNbaV0gPSBWUDguY2hhckNvZGVBdChmcmFtZVN0YXJ0ICsgMyArIGkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd2lkdGgsIGhlaWdodCwgdG1wO1xuXG4gICAgICAgICAgICAvL3RoZSBjb2RlIGJlbG93IGlzIGxpdGVyYWxseSBjb3BpZWQgdmVyYmF0aW0gZnJvbSB0aGUgYml0c3RyZWFtIHNwZWNcbiAgICAgICAgICAgIHRtcCA9IChjWzFdIDw8IDgpIHwgY1swXTtcbiAgICAgICAgICAgIHdpZHRoID0gdG1wICYgMHgzRkZGO1xuICAgICAgICAgICAgdG1wID0gKGNbM10gPDwgOCkgfCBjWzJdO1xuICAgICAgICAgICAgaGVpZ2h0ID0gdG1wICYgMHgzRkZGO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB3aWR0aDogd2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgICAgICAgICAgZGF0YTogVlA4LFxuICAgICAgICAgICAgICAgIHJpZmY6IHJpZmZcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBnZXRTdHJMZW5ndGgoc3RyaW5nLCBvZmZzZXQpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChzdHJpbmcuc3Vic3RyKG9mZnNldCArIDQsIDQpLnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oaSkge1xuICAgICAgICAgICAgICAgIHZhciB1bnBhZGRlZCA9IGkuY2hhckNvZGVBdCgwKS50b1N0cmluZygyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gKG5ldyBBcnJheSg4IC0gdW5wYWRkZWQubGVuZ3RoICsgMSkpLmpvaW4oJzAnKSArIHVucGFkZGVkO1xuICAgICAgICAgICAgfSkuam9pbignJyksIDIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcGFyc2VSSUZGKHN0cmluZykge1xuICAgICAgICAgICAgdmFyIG9mZnNldCA9IDA7XG4gICAgICAgICAgICB2YXIgY2h1bmtzID0ge307XG5cbiAgICAgICAgICAgIHdoaWxlIChvZmZzZXQgPCBzdHJpbmcubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlkID0gc3RyaW5nLnN1YnN0cihvZmZzZXQsIDQpO1xuICAgICAgICAgICAgICAgIHZhciBsZW4gPSBnZXRTdHJMZW5ndGgoc3RyaW5nLCBvZmZzZXQpO1xuICAgICAgICAgICAgICAgIHZhciBkYXRhID0gc3RyaW5nLnN1YnN0cihvZmZzZXQgKyA0ICsgNCwgbGVuKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgKz0gNCArIDQgKyBsZW47XG4gICAgICAgICAgICAgICAgY2h1bmtzW2lkXSA9IGNodW5rc1tpZF0gfHwgW107XG5cbiAgICAgICAgICAgICAgICBpZiAoaWQgPT09ICdSSUZGJyB8fCBpZCA9PT0gJ0xJU1QnKSB7XG4gICAgICAgICAgICAgICAgICAgIGNodW5rc1tpZF0ucHVzaChwYXJzZVJJRkYoZGF0YSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNodW5rc1tpZF0ucHVzaChkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY2h1bmtzO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gZG91YmxlVG9TdHJpbmcobnVtKSB7XG4gICAgICAgICAgICByZXR1cm4gW10uc2xpY2UuY2FsbChcbiAgICAgICAgICAgICAgICBuZXcgVWludDhBcnJheSgobmV3IEZsb2F0NjRBcnJheShbbnVtXSkpLmJ1ZmZlciksIDApLm1hcChmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUoZSk7XG4gICAgICAgICAgICB9KS5yZXZlcnNlKCkuam9pbignJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd2VibSA9IG5ldyBBcnJheVRvV2ViTShmcmFtZXMubWFwKGZ1bmN0aW9uKGZyYW1lKSB7XG4gICAgICAgICAgICB2YXIgd2VicCA9IHBhcnNlV2ViUChwYXJzZVJJRkYoYXRvYihmcmFtZS5pbWFnZS5zbGljZSgyMykpKSk7XG4gICAgICAgICAgICB3ZWJwLmR1cmF0aW9uID0gZnJhbWUuZHVyYXRpb247XG4gICAgICAgICAgICByZXR1cm4gd2VicDtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHBvc3RNZXNzYWdlKHdlYm0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVuY29kZXMgZnJhbWVzIGluIFdlYk0gY29udGFpbmVyLiBJdCB1c2VzIFdlYldvcmtpbnZva2UgdG8gaW52b2tlICdBcnJheVRvV2ViTScgbWV0aG9kLlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIC0gQ2FsbGJhY2sgZnVuY3Rpb24sIHRoYXQgaXMgdXNlZCB0byBwYXNzIHJlY29yZGVkIGJsb2IgYmFjayB0byB0aGUgY2FsbGVlLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgV2hhbW15XG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlciA9IG5ldyBXaGFtbXkoKS5WaWRlbygwLjgsIDEwMCk7XG4gICAgICogcmVjb3JkZXIuY29tcGlsZShmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgLy8gYmxvYi5zaXplIC0gYmxvYi50eXBlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgV2hhbW15VmlkZW8ucHJvdG90eXBlLmNvbXBpbGUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgd2ViV29ya2VyID0gcHJvY2Vzc0luV2ViV29ya2VyKHdoYW1teUluV2ViV29ya2VyKTtcblxuICAgICAgICB3ZWJXb3JrZXIub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihldmVudC5kYXRhLmVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYWxsYmFjayhldmVudC5kYXRhKTtcbiAgICAgICAgfTtcblxuICAgICAgICB3ZWJXb3JrZXIucG9zdE1lc3NhZ2UodGhpcy5mcmFtZXMpO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQSBtb3JlIGFic3RyYWN0LWlzaCBBUEkuXG4gICAgICAgICAqIEBtZXRob2RcbiAgICAgICAgICogQG1lbWJlcm9mIFdoYW1teVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiByZWNvcmRlciA9IG5ldyBXaGFtbXkoKS5WaWRlbygwLjgsIDEwMCk7XG4gICAgICAgICAqIEBwYXJhbSB7P251bWJlcn0gc3BlZWQgLSAwLjhcbiAgICAgICAgICogQHBhcmFtIHs/bnVtYmVyfSBxdWFsaXR5IC0gMTAwXG4gICAgICAgICAqL1xuICAgICAgICBWaWRlbzogV2hhbW15VmlkZW9cbiAgICB9O1xufSkoKTtcbi8vIF9fX19fX19fX19fX19fIChpbmRleGVkLWRiKVxuLy8gRGlza1N0b3JhZ2UuanNcblxuLyoqXG4gKiBEaXNrU3RvcmFnZSBpcyBhIHN0YW5kYWxvbmUgb2JqZWN0IHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gc3RvcmUgcmVjb3JkZWQgYmxvYnMgaW4gSW5kZXhlZERCIHN0b3JhZ2UuXG4gKiBAc3VtbWFyeSBXcml0aW5nIGJsb2JzIGludG8gSW5kZXhlZERCLlxuICogQGV4YW1wbGVcbiAqIERpc2tTdG9yYWdlLlN0b3JlKHtcbiAqICAgICBhdWRpb0Jsb2I6IHlvdXJBdWRpb0Jsb2IsXG4gKiAgICAgdmlkZW9CbG9iOiB5b3VyVmlkZW9CbG9iLFxuICogICAgIGdpZkJsb2IgIDogeW91ckdpZkJsb2JcbiAqIH0pO1xuICogRGlza1N0b3JhZ2UuRmV0Y2goZnVuY3Rpb24oZGF0YVVSTCwgdHlwZSkge1xuICogICAgIGlmKHR5cGUgPT09ICdhdWRpb0Jsb2InKSB7IH1cbiAqICAgICBpZih0eXBlID09PSAndmlkZW9CbG9iJykgeyB9XG4gKiAgICAgaWYodHlwZSA9PT0gJ2dpZkJsb2InKSAgIHsgfVxuICogfSk7XG4gKiAvLyBEaXNrU3RvcmFnZS5kYXRhU3RvcmVOYW1lID0gJ3JlY29yZFJUQyc7XG4gKiAvLyBEaXNrU3RvcmFnZS5vbkVycm9yID0gZnVuY3Rpb24oZXJyb3IpIHsgfTtcbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IGluaXQgLSBUaGlzIG1ldGhvZCBtdXN0IGJlIGNhbGxlZCBvbmNlIHRvIGluaXRpYWxpemUgSW5kZXhlZERCIE9iamVjdFN0b3JlLiBUaG91Z2gsIGl0IGlzIGF1dG8tdXNlZCBpbnRlcm5hbGx5LlxuICogQHByb3BlcnR5IHtmdW5jdGlvbn0gRmV0Y2ggLSBUaGlzIG1ldGhvZCBmZXRjaGVzIHN0b3JlZCBibG9icyBmcm9tIEluZGV4ZWREQi5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IFN0b3JlIC0gVGhpcyBtZXRob2Qgc3RvcmVzIGJsb2JzIGluIEluZGV4ZWREQi5cbiAqIEBwcm9wZXJ0eSB7ZnVuY3Rpb259IG9uRXJyb3IgLSBUaGlzIGZ1bmN0aW9uIGlzIGludm9rZWQgZm9yIGFueSBrbm93bi91bmtub3duIGVycm9yLlxuICogQHByb3BlcnR5IHtzdHJpbmd9IGRhdGFTdG9yZU5hbWUgLSBOYW1lIG9mIHRoZSBPYmplY3RTdG9yZSBjcmVhdGVkIGluIEluZGV4ZWREQiBzdG9yYWdlLlxuICovXG5cblxudmFyIERpc2tTdG9yYWdlID0ge1xuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIG11c3QgYmUgY2FsbGVkIG9uY2UgdG8gaW5pdGlhbGl6ZSBJbmRleGVkREIgT2JqZWN0U3RvcmUuIFRob3VnaCwgaXQgaXMgYXV0by11c2VkIGludGVybmFsbHkuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBEaXNrU3RvcmFnZVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBleGFtcGxlXG4gICAgICogRGlza1N0b3JhZ2UuaW5pdCgpO1xuICAgICAqL1xuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBpbmRleGVkREIgPSB3aW5kb3cuaW5kZXhlZERCIHx8IHdpbmRvdy53ZWJraXRJbmRleGVkREIgfHwgd2luZG93Lm1vekluZGV4ZWREQiB8fCB3aW5kb3cuT0luZGV4ZWREQiB8fCB3aW5kb3cubXNJbmRleGVkREI7XG4gICAgICAgIHZhciBkYlZlcnNpb24gPSAxO1xuICAgICAgICB2YXIgZGJOYW1lID0gdGhpcy5kYk5hbWUgfHwgbG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXC98OnwjfCV8XFwufFxcW3xcXF0vZywgJycpLFxuICAgICAgICAgICAgZGI7XG4gICAgICAgIHZhciByZXF1ZXN0ID0gaW5kZXhlZERCLm9wZW4oZGJOYW1lLCBkYlZlcnNpb24pO1xuXG4gICAgICAgIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdFN0b3JlKGRhdGFCYXNlKSB7XG4gICAgICAgICAgICBkYXRhQmFzZS5jcmVhdGVPYmplY3RTdG9yZShzZWxmLmRhdGFTdG9yZU5hbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gcHV0SW5EQigpIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2FjdGlvbiA9IGRiLnRyYW5zYWN0aW9uKFtzZWxmLmRhdGFTdG9yZU5hbWVdLCAncmVhZHdyaXRlJyk7XG5cbiAgICAgICAgICAgIGlmIChzZWxmLnZpZGVvQmxvYikge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHNlbGYuZGF0YVN0b3JlTmFtZSkucHV0KHNlbGYudmlkZW9CbG9iLCAndmlkZW9CbG9iJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmdpZkJsb2IpIHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzZWxmLmRhdGFTdG9yZU5hbWUpLnB1dChzZWxmLmdpZkJsb2IsICdnaWZCbG9iJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzZWxmLmF1ZGlvQmxvYikge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHNlbGYuZGF0YVN0b3JlTmFtZSkucHV0KHNlbGYuYXVkaW9CbG9iLCAnYXVkaW9CbG9iJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEZyb21TdG9yZShwb3J0aW9uTmFtZSkge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uLm9iamVjdFN0b3JlKHNlbGYuZGF0YVN0b3JlTmFtZSkuZ2V0KHBvcnRpb25OYW1lKS5vbnN1Y2Nlc3MgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jYWxsYmFjayhldmVudC50YXJnZXQucmVzdWx0LCBwb3J0aW9uTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnZXRGcm9tU3RvcmUoJ2F1ZGlvQmxvYicpO1xuICAgICAgICAgICAgZ2V0RnJvbVN0b3JlKCd2aWRlb0Jsb2InKTtcbiAgICAgICAgICAgIGdldEZyb21TdG9yZSgnZ2lmQmxvYicpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVxdWVzdC5vbmVycm9yID0gc2VsZi5vbkVycm9yO1xuXG4gICAgICAgIHJlcXVlc3Qub25zdWNjZXNzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkYiA9IHJlcXVlc3QucmVzdWx0O1xuICAgICAgICAgICAgZGIub25lcnJvciA9IHNlbGYub25FcnJvcjtcblxuICAgICAgICAgICAgaWYgKGRiLnNldFZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICBpZiAoZGIudmVyc2lvbiAhPT0gZGJWZXJzaW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzZXRWZXJzaW9uID0gZGIuc2V0VmVyc2lvbihkYlZlcnNpb24pO1xuICAgICAgICAgICAgICAgICAgICBzZXRWZXJzaW9uLm9uc3VjY2VzcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3JlYXRlT2JqZWN0U3RvcmUoZGIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcHV0SW5EQigpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHB1dEluREIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHB1dEluREIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgY3JlYXRlT2JqZWN0U3RvcmUoZXZlbnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgIH07XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBmZXRjaGVzIHN0b3JlZCBibG9icyBmcm9tIEluZGV4ZWREQi5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIERpc2tTdG9yYWdlXG4gICAgICogQGludGVybmFsXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBEaXNrU3RvcmFnZS5GZXRjaChmdW5jdGlvbihkYXRhVVJMLCB0eXBlKSB7XG4gICAgICogICAgIGlmKHR5cGUgPT09ICdhdWRpb0Jsb2InKSB7IH1cbiAgICAgKiAgICAgaWYodHlwZSA9PT0gJ3ZpZGVvQmxvYicpIHsgfVxuICAgICAqICAgICBpZih0eXBlID09PSAnZ2lmQmxvYicpICAgeyB9XG4gICAgICogfSk7XG4gICAgICovXG4gICAgRmV0Y2g6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgdGhpcy5pbml0KCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9yZXMgYmxvYnMgaW4gSW5kZXhlZERCLlxuICAgICAqIEBtZXRob2RcbiAgICAgKiBAbWVtYmVyb2YgRGlza1N0b3JhZ2VcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIERpc2tTdG9yYWdlLlN0b3JlKHtcbiAgICAgKiAgICAgYXVkaW9CbG9iOiB5b3VyQXVkaW9CbG9iLFxuICAgICAqICAgICB2aWRlb0Jsb2I6IHlvdXJWaWRlb0Jsb2IsXG4gICAgICogICAgIGdpZkJsb2IgIDogeW91ckdpZkJsb2JcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBTdG9yZTogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHRoaXMuYXVkaW9CbG9iID0gY29uZmlnLmF1ZGlvQmxvYjtcbiAgICAgICAgdGhpcy52aWRlb0Jsb2IgPSBjb25maWcudmlkZW9CbG9iO1xuICAgICAgICB0aGlzLmdpZkJsb2IgPSBjb25maWcuZ2lmQmxvYjtcblxuICAgICAgICB0aGlzLmluaXQoKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFRoaXMgZnVuY3Rpb24gaXMgaW52b2tlZCBmb3IgYW55IGtub3duL3Vua25vd24gZXJyb3IuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBEaXNrU3RvcmFnZVxuICAgICAqIEBpbnRlcm5hbFxuICAgICAqIEBleGFtcGxlXG4gICAgICogRGlza1N0b3JhZ2Uub25FcnJvciA9IGZ1bmN0aW9uKGVycm9yKXtcbiAgICAgKiAgICAgYWxlcm90KCBKU09OLnN0cmluZ2lmeShlcnJvcikgKTtcbiAgICAgKiB9O1xuICAgICAqL1xuICAgIG9uRXJyb3I6IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoSlNPTi5zdHJpbmdpZnkoZXJyb3IsIG51bGwsICdcXHQnKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBkYXRhU3RvcmVOYW1lIC0gTmFtZSBvZiB0aGUgT2JqZWN0U3RvcmUgY3JlYXRlZCBpbiBJbmRleGVkREIgc3RvcmFnZS5cbiAgICAgKiBAbWVtYmVyb2YgRGlza1N0b3JhZ2VcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIERpc2tTdG9yYWdlLmRhdGFTdG9yZU5hbWUgPSAncmVjb3JkUlRDJztcbiAgICAgKi9cbiAgICBkYXRhU3RvcmVOYW1lOiAncmVjb3JkUlRDJyxcbiAgICBkYk5hbWU6IG51bGxcbn07XG4vLyBfX19fX19fX19fX19fX1xuLy8gR2lmUmVjb3JkZXIuanNcblxuLyoqXG4gKiBHaWZSZWNvcmRlciBpcyBzdGFuZGFsb25lIGNhbHNzIHVzZWQgYnkge0BsaW5rIFJlY29yZFJUQ30gdG8gcmVjb3JkIHZpZGVvIGFzIGFuaW1hdGVkIGdpZiBpbWFnZS5cbiAqIEB0eXBlZGVmIEdpZlJlY29yZGVyXG4gKiBAY2xhc3NcbiAqIEBleGFtcGxlXG4gKiB2YXIgcmVjb3JkZXIgPSBuZXcgR2lmUmVjb3JkZXIobWVkaWFTdHJlYW0pO1xuICogcmVjb3JkZXIucmVjb3JkKCk7XG4gKiByZWNvcmRlci5zdG9wKGZ1bmN0aW9uKGJsb2IpIHtcbiAqICAgICBpbWcuc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcbiAqIH0pO1xuICogQHBhcmFtIHtNZWRpYVN0cmVhbX0gbWVkaWFTdHJlYW0gLSBNZWRpYVN0cmVhbSBvYmplY3QgZmV0Y2hlZCB1c2luZyBnZXRVc2VyTWVkaWEgQVBJIG9yIGdlbmVyYXRlZCB1c2luZyBjYXB0dXJlU3RyZWFtVW50aWxFbmRlZCBvciBXZWJBdWRpbyBBUEkuXG4gKi9cblxuZnVuY3Rpb24gR2lmUmVjb3JkZXIobWVkaWFTdHJlYW0pIHtcbiAgICBpZiAoIXdpbmRvdy5HSUZFbmNvZGVyKSB7XG4gICAgICAgIHRocm93ICdQbGVhc2UgbGluazogaHR0cHM6Ly9jZG4ud2VicnRjLWV4cGVyaW1lbnQuY29tL2dpZi1yZWNvcmRlci5qcyc7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVjb3JkcyBNZWRpYVN0cmVhbS5cbiAgICAgKiBAbWV0aG9kXG4gICAgICogQG1lbWJlcm9mIEdpZlJlY29yZGVyXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiByZWNvcmRlci5yZWNvcmQoKTtcbiAgICAgKi9cbiAgICB0aGlzLnJlY29yZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIXRoaXMud2lkdGgpIHtcbiAgICAgICAgICAgIHRoaXMud2lkdGggPSB2aWRlby5vZmZzZXRXaWR0aCB8fCAzMjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IHZpZGVvLm9mZnNldEhlaWdodCB8fCAyNDA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMudmlkZW8pIHtcbiAgICAgICAgICAgIHRoaXMudmlkZW8gPSB7XG4gICAgICAgICAgICAgICAgd2lkdGg6IHRoaXMud2lkdGgsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmhlaWdodFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5jYW52YXMpIHtcbiAgICAgICAgICAgIHRoaXMuY2FudmFzID0ge1xuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoLFxuICAgICAgICAgICAgICAgIGhlaWdodDogdGhpcy5oZWlnaHRcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBjYW52YXMud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aDtcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodDtcblxuICAgICAgICB2aWRlby53aWR0aCA9IHRoaXMudmlkZW8ud2lkdGg7XG4gICAgICAgIHZpZGVvLmhlaWdodCA9IHRoaXMudmlkZW8uaGVpZ2h0O1xuXG4gICAgICAgIC8vIGV4dGVybmFsIGxpYnJhcnkgdG8gcmVjb3JkIGFzIEdJRiBpbWFnZXNcbiAgICAgICAgZ2lmRW5jb2RlciA9IG5ldyB3aW5kb3cuR0lGRW5jb2RlcigpO1xuXG4gICAgICAgIC8vIHZvaWQgc2V0UmVwZWF0KGludCBpdGVyKSBcbiAgICAgICAgLy8gU2V0cyB0aGUgbnVtYmVyIG9mIHRpbWVzIHRoZSBzZXQgb2YgR0lGIGZyYW1lcyBzaG91bGQgYmUgcGxheWVkLiBcbiAgICAgICAgLy8gRGVmYXVsdCBpcyAxOyAwIG1lYW5zIHBsYXkgaW5kZWZpbml0ZWx5LlxuICAgICAgICBnaWZFbmNvZGVyLnNldFJlcGVhdCgwKTtcblxuICAgICAgICAvLyB2b2lkIHNldEZyYW1lUmF0ZShOdW1iZXIgZnBzKSBcbiAgICAgICAgLy8gU2V0cyBmcmFtZSByYXRlIGluIGZyYW1lcyBwZXIgc2Vjb25kLiBcbiAgICAgICAgLy8gRXF1aXZhbGVudCB0byBzZXREZWxheSgxMDAwL2ZwcykuXG4gICAgICAgIC8vIFVzaW5nIFwic2V0RGVsYXlcIiBpbnN0ZWFkIG9mIFwic2V0RnJhbWVSYXRlXCJcbiAgICAgICAgZ2lmRW5jb2Rlci5zZXREZWxheSh0aGlzLmZyYW1lUmF0ZSB8fCAyMDApO1xuXG4gICAgICAgIC8vIHZvaWQgc2V0UXVhbGl0eShpbnQgcXVhbGl0eSkgXG4gICAgICAgIC8vIFNldHMgcXVhbGl0eSBvZiBjb2xvciBxdWFudGl6YXRpb24gKGNvbnZlcnNpb24gb2YgaW1hZ2VzIHRvIHRoZSBcbiAgICAgICAgLy8gbWF4aW11bSAyNTYgY29sb3JzIGFsbG93ZWQgYnkgdGhlIEdJRiBzcGVjaWZpY2F0aW9uKS4gXG4gICAgICAgIC8vIExvd2VyIHZhbHVlcyAobWluaW11bSA9IDEpIHByb2R1Y2UgYmV0dGVyIGNvbG9ycywgXG4gICAgICAgIC8vIGJ1dCBzbG93IHByb2Nlc3Npbmcgc2lnbmlmaWNhbnRseS4gMTAgaXMgdGhlIGRlZmF1bHQsIFxuICAgICAgICAvLyBhbmQgcHJvZHVjZXMgZ29vZCBjb2xvciBtYXBwaW5nIGF0IHJlYXNvbmFibGUgc3BlZWRzLiBcbiAgICAgICAgLy8gVmFsdWVzIGdyZWF0ZXIgdGhhbiAyMCBkbyBub3QgeWllbGQgc2lnbmlmaWNhbnQgaW1wcm92ZW1lbnRzIGluIHNwZWVkLlxuICAgICAgICBnaWZFbmNvZGVyLnNldFF1YWxpdHkodGhpcy5xdWFsaXR5IHx8IDEwKTtcblxuICAgICAgICAvLyBCb29sZWFuIHN0YXJ0KCkgXG4gICAgICAgIC8vIFRoaXMgd3JpdGVzIHRoZSBHSUYgSGVhZGVyIGFuZCByZXR1cm5zIGZhbHNlIGlmIGl0IGZhaWxzLlxuICAgICAgICBnaWZFbmNvZGVyLnN0YXJ0KCk7XG5cbiAgICAgICAgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgZnVuY3Rpb24gZHJhd1ZpZGVvRnJhbWUodGltZSkge1xuICAgICAgICAgICAgaWYgKGlzUGF1c2VkUmVjb3JkaW5nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRyYXdWaWRlb0ZyYW1lKHRpbWUpO1xuICAgICAgICAgICAgICAgIH0sIDEwMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxhc3RBbmltYXRpb25GcmFtZSA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShkcmF3VmlkZW9GcmFtZSk7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgbGFzdEZyYW1lVGltZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbGFzdEZyYW1lVGltZSA9IHRpbWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIH4xMCBmcHNcbiAgICAgICAgICAgIGlmICh0aW1lIC0gbGFzdEZyYW1lVGltZSA8IDkwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmlkZW8ucGF1c2VkKSB7XG4gICAgICAgICAgICAgICAgLy8gdmlhOiBodHRwczovL2dpdGh1Yi5jb20vbXVhei1raGFuL1dlYlJUQy1FeHBlcmltZW50L3B1bGwvMzE2XG4gICAgICAgICAgICAgICAgLy8gVHdlYWsgZm9yIEFuZHJvaWQgQ2hyb21lXG4gICAgICAgICAgICAgICAgdmlkZW8ucGxheSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb250ZXh0LmRyYXdJbWFnZSh2aWRlbywgMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICAgICAgICAgICAgaWYgKHNlbGYub25HaWZQcmV2aWV3KSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vbkdpZlByZXZpZXcoY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnaWZFbmNvZGVyLmFkZEZyYW1lKGNvbnRleHQpO1xuICAgICAgICAgICAgbGFzdEZyYW1lVGltZSA9IHRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICBsYXN0QW5pbWF0aW9uRnJhbWUgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZHJhd1ZpZGVvRnJhbWUpO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBzdG9wcyByZWNvcmRpbmcgTWVkaWFTdHJlYW0uXG4gICAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayBmdW5jdGlvbiwgdGhhdCBpcyB1c2VkIHRvIHBhc3MgcmVjb3JkZWQgYmxvYiBiYWNrIHRvIHRoZSBjYWxsZWUuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIuc3RvcChmdW5jdGlvbihibG9iKSB7XG4gICAgICogICAgIGltZy5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgICAqIH0pO1xuICAgICAqL1xuICAgIHRoaXMuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAobGFzdEFuaW1hdGlvbkZyYW1lKSB7XG4gICAgICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShsYXN0QW5pbWF0aW9uRnJhbWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW5kVGltZSA9IERhdGUubm93KCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwcm9wZXJ0eSB7QmxvYn0gYmxvYiAtIFRoZSByZWNvcmRlZCBibG9iIG9iamVjdC5cbiAgICAgICAgICogQG1lbWJlcm9mIEdpZlJlY29yZGVyXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIHJlY29yZGVyLnN0b3AoZnVuY3Rpb24oKXtcbiAgICAgICAgICogICAgIHZhciBibG9iID0gcmVjb3JkZXIuYmxvYjtcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmJsb2IgPSBuZXcgQmxvYihbbmV3IFVpbnQ4QXJyYXkoZ2lmRW5jb2Rlci5zdHJlYW0oKS5iaW4pXSwge1xuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL2dpZidcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gYnVnOiBmaW5kIGEgd2F5IHRvIGNsZWFyIG9sZCByZWNvcmRlZCBibG9ic1xuICAgICAgICBnaWZFbmNvZGVyLnN0cmVhbSgpLmJpbiA9IFtdO1xuICAgIH07XG5cbiAgICB2YXIgaXNQYXVzZWRSZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIHBhdXNlcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucGF1c2UoKTtcbiAgICAgKi9cbiAgICB0aGlzLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlzUGF1c2VkUmVjb3JkaW5nID0gdHJ1ZTtcblxuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1BhdXNlZCByZWNvcmRpbmcuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgcmVzdW1lcyB0aGUgcmVjb3JkaW5nIHByb2Nlc3MuXG4gICAgICogQG1ldGhvZFxuICAgICAqIEBtZW1iZXJvZiBHaWZSZWNvcmRlclxuICAgICAqIEBleGFtcGxlXG4gICAgICogcmVjb3JkZXIucmVzdW1lKCk7XG4gICAgICovXG4gICAgdGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaXNQYXVzZWRSZWNvcmRpbmcgPSBmYWxzZTtcblxuICAgICAgICBpZiAoIXRoaXMuZGlzYWJsZUxvZ3MpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ1Jlc3VtZWQgcmVjb3JkaW5nLicpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgdmFyIHZpZGVvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndmlkZW8nKTtcbiAgICB2aWRlby5tdXRlZCA9IHRydWU7XG4gICAgdmlkZW8uYXV0b3BsYXkgPSB0cnVlO1xuICAgIHZpZGVvLnNyYyA9IFVSTC5jcmVhdGVPYmplY3RVUkwobWVkaWFTdHJlYW0pO1xuICAgIHZpZGVvLnBsYXkoKTtcblxuICAgIHZhciBsYXN0QW5pbWF0aW9uRnJhbWUgPSBudWxsO1xuICAgIHZhciBzdGFydFRpbWUsIGVuZFRpbWUsIGxhc3RGcmFtZVRpbWU7XG5cbiAgICB2YXIgZ2lmRW5jb2Rlcjtcbn1cbiJdfQ==
