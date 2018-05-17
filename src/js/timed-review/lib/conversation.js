
var DialogItem = require('./dialog-item')

/*let getUserMedia = (function() {
	navigator.getUserMedia.bind(navigator) ||
	navigator.webkitGetUserMedia.bind(navigator)  || 
                          navigator.mozGetUserMedia.bind(navigator) || 
                          navigator.msGetUserMedia.bind(navigator)
})();
*/
let mediaNoBinding = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
if(mediaNoBinding){
	var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia).bind(navigator);
}


module.exports = Conversation

function Conversation(data, onUpdated, onDone) {
  this.dialog = data
  this.state = 'unstarted'
  this.index = 0
  this.length = this.dialog.length
  this.onUpdated = onUpdated
  this.onDone = onDone
  // this.dialogs = data.dialog.map(function (data) {return new DialogItem(data)})
  this.score = 0;
  this.next = this.next.bind(this)
  this.onData = this.onData.bind(this)
  // this.state = 'finished'
  this.recorded = []
  this.start()
}

Conversation.prototype = {
  start: function (speed) {
    this.state = 'starting'
    this.speed = speed

    getUserMedia(
      {audio: true, video: true},
      this.onStarted.bind(this),
      function onError(error) {
        this.state = 'error'
        this.error = error
        this.onUpdated()
      }.bind(this)
    );
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

  onData(audio, video) {
    this.recorded[this.index] = {audio, video}
  },

  submitVideos(done) {
    this.onDone(this.recorded, done)
  },

  end: function () {
    if (this.state === 'finished') return
    this.state = 'finishing'
    this.mediaStream.stop()
    this.submitVideos(error => {
      this.state = error ? 'upload-error' : 'finished'
      this.onUpdated()
    })
  }
}
