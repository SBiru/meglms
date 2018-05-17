
var startSpeech = require('./speech')
  , recorder = require('./recnew')

module.exports = DialogItem

function DialogItem({data, stream, pauseDuration, timeLimit, onUpdate, onData}) {
  this.data = data
  this.stream = stream
  this.finalWords = []
  this.interimWords = []
  this.onUpdate = onUpdate
  this.onData = onData
  this.state = 'prompt'
  // this.start()
  this.onStart = function () {
    this.start()
    this.onUpdate()
  }.bind(this)
  this.start = this.start.bind(this)
  this.stop = this.stop.bind(this)
  this.promptAudio = '/public/coursecontent/timed-review/audio/' + data.prompt_audio
  this.answerAudio = '/public/coursecontent/timed-review/audio/' + data.answer_audio
  this.promptTime = pauseDuration // data.prompt_duration
  if (timeLimit) {
    this.isTimed = true
    this.timeLimit = timeLimit // data.answer_duration * time
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

  doneRecording: function (err, {audio, video}) {
    this.onData(audio, video)
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

  /** disabled for now
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
  */

  validate: function () {
    console.log('done')
    this.state = 'done-valid'
  }
}

