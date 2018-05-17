'use strict';

try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.recorders = {}
app.directive('webrtcVideoRecorder',
[
function(){
    return{
        template:'<video autoplay muted id="{{streamName}}"></video>',
        restrict:'E',
        scope:{
            videoBitrate:'@',
            audioBitrate:'@',
            videoFramerate:'@',
            streamName:'@',
            segment:'=',
            appName:'@',
            option:'@',
            sdpUrl:'@'
        },
        link:function(scope,el){

            window.recorders[scope.streamName] = new WebrtcRecorder(el.find('video')[0],
                scope.sdpUrl,
                {
                    audioBitrate:scope.audioBitrate,
                    videoBitrate:scope.videoBitrate,
                    videoFrameRate:scope.videoFramerate,
                    option:scope.option
                },
                {
                    sessionId:"[empty]",
                    applicationName:scope.appName,
                    streamName:scope.streamName
                }
            )
            var unwatch = scope.$watch('segment',function(segment){
                if(segment)
                window.recorders[scope.streamName].streamInfo.streamName =
                    scope.streamName + "_" + scope.segment;

            })
            scope.$on("$destroy",function(){
                window.recorders[scope.streamName].destroy();

                delete window.recorders[scope.streamName];
            })
        }
    }

}]);

var WebrtcRecorder = function(videoEl,wsUrl,videoData,streamInfo){

    this.videoEl = videoEl;
    this.wsURL = wsUrl;
    this.peerConnection = null;
    this.peerConnectionConfig = {'iceServers': []};
    this.wsConnection = null;
    this.userData = {param1:"value1"};
    this.streamInfo = streamInfo;
    this.videoData = videoData;
    this.audioBitrate = videoData.audioBitrate;
    this.videoBitrate = videoData.videoBitrate;
    this.videoFrameRate = videoData.videoFrameRate;
    this.delayBeforeRecord = 5000 //This is used to unsure the streaming is fully ready to start recording (time in ms).
    this.delayStreamingCheck = 1000.
    this.maxConnectAttempts = 40;
    this.currentState = 'initiating';
    var self = this;

    this.onStreamReady = new Promise(function(resolve){self.streamReadyResolve = resolve});
    this.onStreamStopped = new Promise(function(resolve){self.streamStoppedResolve = resolve});

    this.newAPI = false;
    var constraints =
        {
            video: true,
            audio: true,
        };
    if(navigator.mediaDevices.getUserMedia)
    {
        navigator.mediaDevices.getUserMedia(constraints).then(this.getUserMediaSuccess.bind(this)).catch(this.errorHandler);
        this.newAPI = false;
    }
    else if (navigator.getUserMedia)
    {
        navigator.getUserMedia(constraints,this. getUserMediaSuccess.bind(this), this.errorHandler);
    }
    else
    {
        alert('Your browser does not support getUserMedia API');
    }
    this.isStreamReady = false;
    this.checkStreamIsReady();

};
WebrtcRecorder.prototype.streamingStopped = function(){

    $(this.videoEl).replaceWith('<div style="    padding-top: calc(50% - 31px);font-size: 18px;color: red;">Connection Lost</div>');
    this.streamStoppedResolve();
    this.destroy();

};
WebrtcRecorder.prototype.checkStreamingIsRunning = function(){
    var self = this;
    this.checkStreaming().then(function(){
        if(self.peerConnection)
            setTimeout(self.checkStreamingIsRunning.bind(self),self.delayStreamingCheck);
    }).catch(function(){
        self.streamingStopped();
    })
};
WebrtcRecorder.prototype.checkStreamIsReady = function(){
    var self = this;

    if(this.isStreamReady)
        return;
    $('#button').hide();
    $('#' + this.streamInfo.streamName).hide();
    $('#' + this.streamInfo.streamName).closest('#record-video').hide();
    $('.loading-stream').show()
    $('#button + .fa').show();
    this.checkStreaming().then(function(){
        self.readyTimeout =  setTimeout(function(){
            self.isStreamReady = true;
            self.streamReadyResolve();
            $('#button').show();
            $('#' + self.streamInfo.streamName).show();
            $('#' + self.streamInfo.streamName).closest('#record-video').show();
            $('#button + .fa').hide();
            $('.loading-stream').hide()
            self.checkStreamingIsRunning();
        },self.delayBeforeRecord)

    },function(){
        self.connectAttempts = self.connectAttempts || 0;
        self.connectAttempts++;
        if(self.connectAttempts > self.maxConnectAttempts){
            toastr.error('We could not connect your webcam to the server. Please, check your connection and try again.');
            self.destroy();
            $('.loading-stream').text('Could not connect the camera');
            return;
        }
        setTimeout(function() {
            self.checkStreamIsReady();
        },500)
    })

}
WebrtcRecorder.prototype.getUserMediaSuccess = function(stream)
{
    this.localStream = stream;
    this.videoEl.srcObject = stream
    this.currentState = 'stream_set';
    this.startPublisher(function(){});
}
WebrtcRecorder.prototype.errorHandler = function errorHandler(error)
{
    if(error.name == "NotAllowedError"){
        toastr.error('You need to allow ' + window.location.host + ' to access your camera and microphone.')
    }
}
WebrtcRecorder.prototype.wsConnect = function(url)
{
    this.wsConnection = new WebSocket(url);
    var wsConnection = this.wsConnection,
        peerConnection = this.peerConnection,
        peerConnectionConfig = this.peerConnectionConfig,
        localStream = this.localStream


    wsConnection.binaryType = 'arraybuffer';
    var self = this;
    wsConnection.onopen = function()
    {
        console.log("wsConnection.onopen");

        peerConnection = new RTCPeerConnection(peerConnectionConfig);
        peerConnection.onicecandidate = this.gotIceCandidate;

        if (this.newAPI)
        {
            var localTracks = localStream.getTracks();
            for(var localTrack in localTracks)
            {
                peerConnection.addTrack(localTracks[localTrack], localStream);
            }
        }
        else
        {
            peerConnection.addStream(localStream);
        }
        self.peerConnection =peerConnection;
        peerConnection.createOffer(self.gotDescription.bind(self), self.errorHandler.bind(self));

    }

    wsConnection.onmessage = function(evt)
    {

        var msgJSON = JSON.parse(evt.data);

        var msgStatus = Number(msgJSON['status']);
        var msgCommand = msgJSON['command'];

        if (msgStatus != 200)
        {
            // $("#sdpDataTag").html(msgJSON['statusDescription']);
            self.stopPublisher(function(){});
        }
        else
        {
            // $("#sdpDataTag").html("");

            var sdpData = msgJSON['sdp'];
            if (sdpData !== undefined)
            {
                peerConnection.setRemoteDescription(new RTCSessionDescription(sdpData), function() {
                    //peerConnection.createAnswer(gotDescription, errorHandler);
                }, self.errorHandler);
            }

            var iceCandidates = msgJSON['iceCandidates'];
            if (iceCandidates !== undefined)
            {
                for(var index in iceCandidates)
                {
                    if(index === 'move') continue;
                    peerConnection.addIceCandidate(new RTCIceCandidate(iceCandidates[index]));
                }
            }
            self.ready = true;

        }

        if (wsConnection != null)
            wsConnection.close();
        wsConnection = null;

    }

    wsConnection.onclose = function()
    {
        console.log("wsConnection.onclose");
    }

    wsConnection.onerror = function(evt)
    {
        console.log("wsConnection.onerror: "+JSON.stringify(evt));

        // $("#sdpDataTag").html('WebSocket connection failed: '+wsURL);
        self.stopPublisher(function(){});
    }
}
WebrtcRecorder.prototype.gotIceCandidate = function(event){
    if(event.candidate != null)
    {
        console.log('gotIceCandidate: '+JSON.stringify({'ice': event.candidate}));
    }
}
WebrtcRecorder.prototype.gotDescription = function(description){
    var enhanceData = new Object();

    if (this.audioBitrate !== undefined)
        enhanceData.audioBitrate = Number(this.audioBitrate);
    if (this.videoBitrate !== undefined)
        enhanceData.videoBitrate = Number(this.videoBitrate);
    if (this.videoFrameRate !== undefined)
        enhanceData.videoFrameRate = Number(this.videoFrameRate);


    description.sdp = this.enhanceSDP(description.sdp, enhanceData);
    var self = this;
    this.peerConnection.setLocalDescription(description, function () {

        self.wsConnection.send('{"direction":"publish", "command":"sendOffer", "streamInfo":'+JSON.stringify(self.streamInfo)+', "sdp":'+JSON.stringify(description)+', "userData":'+JSON.stringify(self.userData)+'}');

    }, function() {console.log('set description error')});
}


WebrtcRecorder.prototype.enhanceSDP = function(sdpStr, enhanceData)
{
    var sdpLines = sdpStr.split(/\r\n/);
    var sdpSection = 'header';
    var hitMID = false;
    var sdpStrRet = '';

    for(var sdpIndex in sdpLines)
    {
        var sdpLine = sdpLines[sdpIndex];
        if(!sdpLine.indexOf)
            continue;
        if (sdpLine.length <= 0)
            continue;

        sdpStrRet += sdpLine;

        if (sdpLine.indexOf("m=audio") === 0)
        {
            sdpSection = 'audio';
            hitMID = false;
        }
        else if (sdpLine.indexOf("m=video") === 0)
        {
            sdpSection = 'video';
            hitMID = false;
        }
        else if (sdpLine.indexOf("a=rtpmap") == 0 )
        {
            sdpSection = 'bandwidth';
            hitMID = false;
        }

        if (sdpLine.indexOf("a=mid:") === 0 || sdpLine.indexOf("a=rtpmap") == 0 )
        {
            if (!hitMID)
            {
                if ('audio'.localeCompare(sdpSection) == 0)
                {
                    if (enhanceData.audioBitrate !== undefined)
                    {
                        sdpStrRet += '\r\nb=CT:' + (enhanceData.audioBitrate);
                        sdpStrRet += '\r\nb=AS:' + (enhanceData.audioBitrate);
                    }
                    hitMID = true;
                }
                else if ('video'.localeCompare(sdpSection) == 0)
                {
                    if (enhanceData.videoBitrate !== undefined)
                    {
                        sdpStrRet += '\r\nb=CT:' + (enhanceData.videoBitrate);
                        sdpStrRet += '\r\nb=AS:' + (enhanceData.videoBitrate);
                        if ( enhanceData.videoFrameRate !== undefined )
                        {
                            sdpStrRet += '\r\na=framerate:'+enhanceData.videoFrameRate;
                        }
                    }
                    hitMID = true;
                }
                else if ('bandwidth'.localeCompare(sdpSection) == 0 )
                {
                    var rtpmapID;
                    rtpmapID = this.getrtpMapID(sdpLine);
                    if ( rtpmapID !== null  )
                    {
                        var match = rtpmapID[2].toLowerCase();
                        if ( ('vp9'.localeCompare(match) == 0 ) ||  ('vp8'.localeCompare(match) == 0 ) || ('h264'.localeCompare(match) == 0 ) ||
                            ('red'.localeCompare(match) == 0 ) || ('ulpfec'.localeCompare(match) == 0 ) || ('rtx'.localeCompare(match) == 0 ) )
                        {
                            if (enhanceData.videoBitrate !== undefined)
                            {
                                sdpStrRet+='\r\na=fmtp:'+rtpmapID[1]+' x-google-min-bitrate='+(enhanceData.videoBitrate)+';x-google-max-bitrate='+(enhanceData.videoBitrate);
                            }
                        }

                        if ( ('opus'.localeCompare(match) == 0 ) ||  ('isac'.localeCompare(match) == 0 ) || ('g722'.localeCompare(match) == 0 ) || ('pcmu'.localeCompare(match) == 0 ) ||
                            ('pcma'.localeCompare(match) == 0 ) || ('cn'.localeCompare(match) == 0 ))
                        {
                            if (enhanceData.audioBitrate !== undefined)
                            {
                                sdpStrRet+='\r\na=fmtp:'+rtpmapID[1]+' x-google-min-bitrate='+(enhanceData.audioBitrate)+';x-google-max-bitrate='+(enhanceData.audioBitrate);
                            }
                        }
                    }
                }
            }
        }
        sdpStrRet += '\r\n';
    }
    return sdpStrRet;
}
WebrtcRecorder.prototype.getrtpMapID = function(line)
{
    var findid = new RegExp('a=rtpmap:(\\d+) (\\w+)/(\\d+)');
    var found = line.match(findid);
    return (found && found.length >= 3) ? found: null;
}
WebrtcRecorder.prototype.startPublisher = function(callback)
{

    this.wsConnect(this.wsURL);
    callback();
}
WebrtcRecorder.prototype.startRecorder = function(option){
    var self = this;

    $.get('/api/webrtc-recorder/'+this.streamInfo.streamName+'/start',{option:option||self.option,segment:self.segment}).done(function(result){
        var data = JSON.parse(result);
        var timeout;
        function checkRecorder(){
            $.get('/api/webrtc-recorder/'+self.streamInfo.streamName+'/status').done(function(data){

                if(data.recorder){
                    clearTimeout(self.startTimeout);

                    self.currentState = 'recording';
                    self.resolveStart()
                }else
                    self.startCheckTimeout = setTimeout(checkRecorder,500);
            });

        }
        checkRecorder();


    }).fail(self.rejectStart);
};
WebrtcRecorder.prototype.stopRecorder = function(){
    var self = this;
    $.get('/api/webrtc-recorder/'+this.streamInfo.streamName+'/stop').done(function(result){
        var data = JSON.parse(result);
        if(data.success){
            this.currentState = 'streaming';
            self.resolveStop();
            markVideoAsFlushed();
        }

        else
            self.resolveStop();
    }).fail(function(){
        self.checkStreamSize().then(function(size){
            if(size>200){
                this.currentState = 'streaming';
                self.resolveStop();
                markVideoAsFlushed();
            }else{
                self.rejectStop();
            }

        },self.rejectStop)
    })
};
WebrtcRecorder.prototype.stopPublisher = function(callback){
    if (this.peerConnection != null)
        this.peerConnection.close();
    this.peerConnection = null;

    if (this.wsConnection != null)
        this.wsConnection.close();
    this.wsConnection = null;


    callback();
}
WebrtcRecorder.prototype.destroy = function(){
    this.stopRecorder();
    this.stopPublisher(function(){})

    clearTimeout(this.readyTimeout);
    this.localStream.getTracks().forEach(function(t){t.stop()});
}

WebrtcRecorder.prototype.start = WebrtcRecorder.prototype.recordstart =  function(option){
    var self = this;
    self.resetVideoEl();
    return new Promise(function(resolve,reject){
        self.resolveStart = resolve;
        self.rejectStart = reject;
        self.startTimeout = setTimeout(function(){
            console.log('Failed to start');
            clearTimeout(self.startCheckTimeout);
            reject()
        },5000);
        if (self.peerConnection == null){
            self.currentState = 'starting';
            self.startPublisher(function(){});
        }else{
            var maxTries = 8;
            var ready = false;
            var interval;
            var startRecording = function(){
                if(ready || maxTries==0){
                    self.startRecorder(option);
                    clearInterval(interval)
                }
                maxTries--;
            }
            interval = setInterval(function(){
                self.checkStreaming().then(function(){
                    ready = true;
                    startRecording()
                },startRecording)

            },500);

        }
    })
}
WebrtcRecorder.prototype.checkStreaming = function(){
    var self = this;
    return new Promise(function(resolve,reject){
        $.get('/api/webrtc-recorder/'+self.streamInfo.streamName+'/status').done(function(data){
            if(data.stream){
                self.readyToStream = true;
                resolve()
            }
            else reject()
        }).fail(reject)
    })

}
WebrtcRecorder.prototype.checkStreamSize = function () {
    var self = this;
    return new Promise(function(resolve,reject){
        $.get('/api/webrtc-recorder/'+self.streamInfo.streamName+'/size').done(function(data){
            if(data.size)
                resolve(data.size)
            else reject()
        }).fail(reject)
    })

}
WebrtcRecorder.prototype.stop = WebrtcRecorder.prototype.recordstop = function(){
    var self = this;

    return new Promise(function(resolve,reject){
        self.resolveStop = resolve;
        self.rejectStop = reject;
        self.stopRecorder();
    })
}
WebrtcRecorder.prototype.playback = function(){
    var self =this;
    return new Promise(function(resolve,reject){
        $.get('/api/webrtc-recorder/'+self.streamInfo.streamName+'/mp4').done(function(result){
            if(result.file){
                var version = 'v='+(new Date()).getTime()
                var playerEl = $('<video controls>' +
                    '<source src="/public/wowzaTmpVideos/'+self.streamInfo.streamName +'.mp4?'+version+
                    '" type="video/mp4"></video>');
                $(self.videoEl).replaceWith(playerEl);
                self.videoEl = playerEl[0];
                self.videoEl.play();
            }
            resolve();
        })
    })
}
WebrtcRecorder.prototype.resetVideoEl = function(){
    var el = $('<video autoplay muted></video>');
    $(this.videoEl).replaceWith(el);
    this.videoEl = el[0];
    this.videoEl.srcObject = this.localStream;
}