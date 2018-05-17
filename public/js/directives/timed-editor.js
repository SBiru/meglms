var DEV_ENV = window.location.hostname=='locahost';
	var app = angular.module('timedReviewStuff', []);
	app.directive('timedReviewVideo',['$compile',function($compile){
		return {
			restrict: 'E',
			scope: {
				currentVideoFile:'=?',
				onLoadBegin:'=?',
				onLoadDone:'=?',
				position:'=?'
			},
			link:function(scope,el){

				var VIDEO_ELEMENT = '<video ng-if= "currentVideoFile" style="max-width: 480px"  class="prompt_video" onmouseout="this.removeAttribute(\'controls\')"  onmouseover="this.setAttribute(\'controls\', \'controls\')">'+
					'<source ng-src="{{currentVideoFile}}" type="video/mp4" >'+
					'Your browser does not support the HTML5 video tag.'+
					'</video>' +
					'<div class="loading-video" ng-show="loading" style="font-size: 16px">Loading video <span class="fa' +
					' fa-spinner fa-pulse"></span></div>'
				function reloadElement(){
					el.find('video').remove();
					el.find('.loading-video').remove();
                    scope.loading = true;
					var newVideoEl = $compile(VIDEO_ELEMENT)(scope);
					el.append(newVideoEl);
					setTimeout(function(){
						var video = el.find('video');
						if(!video.length) return;
                        video[0].load();

                        video[0].addEventListener('loadeddata', function() {
                            scope.loading = false;
                            scope.onLoadDone && scope.onLoadDone(scope.position);
                            video[0].play()
                        }, false);
					})

				}
				var unWatch = scope.$watch('currentVideoFile',function(newValue,oldValue){
					if(newValue){
						reloadElement();
					}
				})
				scope.$on("$destroy",function(){
					unWatch();
				})
			}
		}
	}]);
	app.directive('flashWidget', function(){
		return{
			restrict: 'E',
			scope: {fileName: '&'},

			link: function(scope, elem, attrs) {

				function updateDom(fileName){
					console.log('fileName',fileName);
					if (fileName == undefined)
						return;
					elem.html(
						['<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="272px" height="224px">',
						'<param name="movie" value="/public/flash/megec2.swf?videofile=' ,fileName, '&rtmpserver="rtmp://ec2-52-8-129-175.us-west-1.compute.amazonaws.com/webcamrecording">',
						'<param name="wmode" value="transparent">' ,
						'<!--[if !IE]>-->' ,
						'<object id="bob" type="application/x-shockwave-flash" data="/public/flash/megec2.swf?videofile=' ,fileName, '&rtmpserver=rtmp://ec2-52-8-129-175.us-west-1.compute.amazonaws.com/webcamrecording" width="272px" height="224px"">' ,
						'<param name="wmode" value="transparent">' ,
						'<!--<![endif]-->' ,
						'<table style="margin-top:10px">' ,
						'<tbody>' ,
						'<tr>' ,
						'<td><p>Flash object is not working on your browser. If your using a mobile device, click on upload to record your video. If not, then flash has not been set up correctly.</p></td>' ,
						'</tr>',
						'</tbody>',
						'</table>',
						'<!--[if !IE]>-->',
						'</object>',
						'<!--<![endif]-->',
						'</object>'].join("")
					);

				}

				scope.$watch(scope.fileName, function(value) {
					updateDom(value)
				});
			}
		}
	});

app.directive('timedReview', ['$rootScope', 'FlashITAudio', '$interval', '$timeout', '$http', 'Post', '$sce','$q','CurrentCourseId', 'Nav','$compile', function ($rootScope, FlashIT, $interval, $timeout, $http, Post, $sce,$q,CurrentCourseId, Nav,$compile) {

		var controller = ['$rootScope', '$scope', 'FlashITAudio', '$interval', '$timeout', '$http', 'fileUpload2', 'Post', '$sce', 'Nav','$compile', function ($rootScope, $scope, FlashIT, $interval, $timeout, $http, fileUpload2, Post, $sce, Nav,$compile) {

        function init() {
            Array.prototype.move = function (old_index, new_index) {
                if (new_index >= this.length) {
                    var k = new_index - this.length;
                    while ((k--) + 1) {
                        this.push(undefined);
                    }
                }
                this.splice(new_index, 0, this.splice(old_index, 1)[0]);
                return this; // for testing purposes
            };
            var answerTimePositions = []
            $scope.instructions = $scope.pageData.timed_instruction;
            $scope.double_check_cam_audio = $scope.pageData.double_check_cam_audio == "1";
            $scope.defineInitOptions = function(){
                $scope.readyToBegin = false;
                $scope.started = false;
                $scope.showVideo = true;
                $scope.currentPromptPosition = 0;
                $scope.currentQuestionPromptPosition = 0;
                $scope.currentType = 'validateWebcam';
                $scope.timerActive = false;
                $scope.timeLimitActive = ($scope.timelimit > 0);
                $scope.timeLimitPause = ($scope.pauseduration > 0);
                $scope.timeLimitPrepare = ($scope.pageData.timed_prepare)>0;
                $scope.currentText = '';
                $scope.firstQuestion = true;
                $scope.promptProgress = 0;
                $scope.alreadyRecording = false;
                $scope.frompausetimer = false;
                $scope.recording = false;
                $scope.prepareTimeLeft = 0;
                $scope.seconds = 0;
                $scope.recordingTimer = false;
                $scope.recordingTime = "00:00";
                $scope.videoLoadingPromises = [];
                $scope.totalQuestionPrompts = _.filter($scope.prompts,function(p){return !p.isInformation}).length;
                $scope.isMobile = (isMobile.any() && isMobile.any().length);
                $scope.newPost();
            }
            function intializeVideos() {
                $timeout(function () {
                    angular.forEach(angular.element('video'), function (video) {
                        if(video.parentElement.tagName === "WEBRTC-VIDEO-RECORDER") return;checkHeightAndWidth(video);
                        angular.element('video').data('player',videojs(video, {
                            flash: {
                                swf: '/public/lib/video-js.swf'
                            },
                            preload: "none"
                        }));
                    });
                }, 100)
            }
            function checkHeightAndWidth(video){
                if(!angular.element(video).attr('width'))
                    angular.element(video).attr('width','640px');
                if(!angular.element(video).attr('height')){
                    angular.element(video).attr('height','320px');
                    angular.element(video).css('height','320px');
                }

                }

				toastr.options = {
					positionClass: 'toast-bottom-left'
				};

				$scope.closeActivePrompt = function(){
					if(!$scope.started){
                        $scope.close();
                        return;
					}
					if($scope.pageData.is_cant_leave == "1") {
                        if(!$scope.submitting && $scope.started && confirm("Do you want to finish and submit the section?")){
							document.getElementById('videoWidget').style.opacity = 0;
                            $scope.currentPromptPosition = $scope.prompts.length;
                            $scope.currentType = 'end';
                            $scope.timerActive=false;
                            videoFlushed = false;
							if($scope.recording == true) {
								$scope.stopRecording();
								$scope.recording = false;
							}
                            $scope.submitPost();
                            return;
                        }
                    }
                    else {
                        $scope.close();
                        return;
                    }
				}
				$scope.close = function(){
					if($scope.audioPlayer){
						$scope.audioPlayer.stop();
						delete $scope.audioPlayer;
						$scope.$destroy();
					}
					if($scope.timedAnswerInterval) $interval.cancel($scope.timedAnswerInterval);
					$scope.modalInstance.dismiss();
				}
				$scope.playAudio = function () {

					/*if ($scope.timeLimitActive) {
						$scope.startQuestionTimer();
					}*/

					//audioFile
					$scope.audioPlayer = new Howl({
						src: ['/public/useruploads/' + $scope.prompts[$scope.currentPromptPosition].audioFile]
					})
					$scope.audioPlayer.once('load',function(){
                        $scope.audioPlayer.play();
                        $scope.resolveVideoLoadingPromise($scope.currentPromptPosition);
					})


            }
            $scope.secondsToTimeString = function(seconds) {
                if(!seconds){
                    return '...';
                }var minutes = 0, hours = 0;
                if (seconds / 60 > 0) {
                    minutes = parseInt(seconds / 60, 10);
                    seconds = seconds % 60;
                }
                return ('0' + minutes).slice(-2) + ':' + ('0' + seconds).slice(-2);
            }
            $scope.startRecordingTimer = function () {
                if($scope.timedRcordingInterval) $interval.cancel($scope.timedRcordingInterval	);
                $scope.seconds = 0;
                $scope.recordingTimer = true;
                $scope.recordingTime = "00:00";
                $scope.timedRcordingInterval = $interval(function () {
                    $scope.seconds++;
                    $scope.recordingTime = $scope.secondsToTimeString($scope.seconds);
                }, 1000);
            }
            $scope.startPrepareTimer = function (timeLimitActive) {
                $scope.prepareTimeLeft =jQuery.isNumeric($scope.prompts[$scope.currentPromptPosition].time_prepare)?$scope.prompts[$scope.currentPromptPosition].time_prepare:$scope.pageData.timed_prepare;
                $scope.timerActive = true;
                $scope.timedPrepareInterval = $interval(function () {
                    $scope.prepareTimeLeft--;
                    if ($scope.prepareTimeLeft == 0 ) {
                        $interval.cancel($scope.timedPrepareInterval);
                        $scope.timerActive = false;
                        if($scope.prompts[$scope.currentPromptPosition].isInformation){


                        	$scope.nextQuestion();
						}else{
                            if(timeLimitActive) {
                                $scope.startQuestionTimer();
                            }else{
                                $scope.startRecordingTimer();}
                            $scope.record().then(function(){

                            });
						}


                    }
                }, 1000);
            }
            $scope.startQuestionTimer = function () {
                if($scope.timedRcordingInterval) $interval.cancel($scope.timedRcordingInterval);
                $scope.recordingTimer = false;
                $scope.answerTimeLeft = jQuery.isNumeric($scope.prompts[$scope.currentPromptPosition].time_limit)?$scope.prompts[$scope.currentPromptPosition].time_limit:$scope.timelimit;
                $scope.timerActive = true;
                if($scope.timedAnswerInterval) $interval.cancel($scope.timedAnswerInterval)
                $scope.timedAnswerInterval = $interval(function () {
                    $scope.answerTimeLeft--;
                    if ($scope.answerTimeLeft == 0) {
                        $interval.cancel($scope.timedAnswerInterval);
                        $scope.timerActive = false;
                        $scope.nextQuestion();
                    }
                }, 1000);
            }
            $scope.startPauseTimer = function () {
                $scope.pauseTimeLeft =jQuery.isNumeric($scope.prompts[$scope.currentPromptPosition].time_pause)?$scope.prompts[$scope.currentPromptPosition].time_pause:$scope.pauseduration;
                $scope.timerActive = true;
                $scope.timedPauseInterval = $interval(function () {
                    $scope.pauseTimeLeft--;
                    if ($scope.pauseTimeLeft == 0) {
                        $interval.cancel($scope.timedPauseInterval);
                        $scope.timerActive = false;
                        $scope.frompausetimer = true;
                        $scope.nextQuestion();
                    }
                }, 1000);
            }
            $scope.updateProgress = function () {
                $scope.promptProgress = ($scope.currentPromptPosition / $scope.prompts.length) * 100;
            }

				$scope.doneAnswering = function(){

				}
				$scope.getButtonName = function(){
					if($scope.prepareTimeLeft > 0){
						document.getElementById("buttonspan").innerHTML = "START RECORDING";
					}else if($scope.prompts && ($scope.currentPromptPosition + 1) == $scope.prompts.length){
						document.getElementById("buttonspan").innerHTML = "FINISH AND SUBMIT";
					}else{
						document.getElementById("buttonspan").innerHTML = "NEXT";
					}
				}
				$scope.startTimer = function(timeLimitPrepare,timeLimitActive) {
					if(timeLimitPrepare) {
						$scope.startPrepareTimer(timeLimitActive);
					}else if(timeLimitActive) {
                        if(!$scope.isInformation) {
                            $scope.startQuestionTimer();
                            $scope.record().then(function () {
                            });
                        }
                    }else {
						if(!$scope.isInformation){

                            $scope.startQuestionTimer();
                            $scope.record().then(function(){});
						}
                    }
				}
				$scope.nextQuestion = function () {
					if($scope.currentType == 'error'){
						return;
					}
					if($scope.audioPlayer && $scope.audioPlayer.playing()&&(!$scope.prepareTimeLeft)) $scope.audioPlayer.stop();if($scope.prepareTimeLeft > 0) {
						$interval.cancel($scope.timedPrepareInterval);
						$scope.prepareTimeLeft = 0;

						if($scope.timeLimitActive) {
							$scope.startQuestionTimer();
						}else{
							$scope.startRecordingTimer();
						}
						$scope.record().then(function(){

                    });return;}
                if($scope.recording){
                    var promise = $scope.stopRecording();
                    if(promise){
                        promise.then($scope.nextQuestion);
                        return;
                    }
					}
					$scope.prepareTimeLeft = 0;
					if($scope.timedPrepareInterval) $interval.cancel($scope.timedPrepareInterval);
					if($scope.timedAnswerInterval) $interval.cancel($scope.timedAnswerInterval);
					if($scope.currentPromptPosition>=$scope.prompts.length){
						$scope.currentType = 'end'
						$scope.timerActive=false;
						return;
					}
					if($scope.firstQuestion == false && $scope.frompausetimer == false && ($scope.currentPromptPosition + 1) != $scope.prompts.length ) {
						if($scope.currentType != 'end' && ($scope.timeLimitPause ||(parseInt($scope.prompts[$scope.currentPromptPosition+1].time_prepare) > 0)||($scope.pageData.timed_prepare > 0) )) {
							if($scope.recording == true) {
								$scope.stopRecording();
								$scope.recording = false;
							}
						}
					}
					$scope.frompausetimer = false;
					if ($scope.firstQuestion == false && $scope.timeLimitPause && $scope.currentType != 'break' && ($scope.currentPromptPosition + 1) != $scope.prompts.length) {
						//console.log('log1');
						$scope.currentType = 'break';
						$scope.currentText = $scope.prompts[$scope.currentPromptPosition].answer
						if ($scope.timeLimitPause) {
							$scope.startPauseTimer();
						}
						return;
					}
					//console.log($scope.currentPromptPosition);
					//go into a question
					if ($scope.firstQuestion == true || (($scope.currentType == 'break'  || $scope.timeLimitPause == false) && ($scope.currentPromptPosition + 1) != $scope.prompts.length)) {
						//console.log('log2');
						//if ($scope.alreadyRecording == false) {
						//$scope.record();
						//}
						if ($scope.firstQuestion!=true){
							$scope.currentPromptPosition++;

						} else {
							$scope.firstQuestion = false;
						}
                        if(!$scope.prompts[$scope.currentPromptPosition].isInformation)
                            $scope.currentQuestionPromptPosition++;
						if(jQuery.isNumeric($scope.prompts[$scope.currentPromptPosition].time_limit)){
							$scope.timeLimitActive =parseInt($scope.prompts[$scope.currentPromptPosition].time_limit) > 0;
						}else{
							$scope.timeLimitActive = $scope.timelimit>0;
						}
						if(jQuery.isNumeric($scope.prompts[$scope.currentPromptPosition].time_pause)){
							$scope.timeLimitPause =parseInt($scope.prompts[$scope.currentPromptPosition].time_pause) > 0;
						}else{
							$scope.timeLimitPause = $scope.pauseduration>0;
						}
						if(jQuery.isNumeric($scope.prompts[$scope.currentPromptPosition].time_prepare)){
							$scope.timeLimitPrepare =parseInt($scope.prompts[$scope.currentPromptPosition].time_prepare) > 0;
						}else{
							$scope.timeLimitPrepare = $scope.pageData.timed_prepare>0;
						}
						$scope.currentType = $scope.prompts[$scope.currentPromptPosition].type;
						$scope.currentText = $scope.prompts[$scope.currentPromptPosition].prompt;
						$scope.isInformation = $scope.prompts[$scope.currentPromptPosition].isInformation;
						if($scope.isInformation){
                            answerTimePositions.push([]);
						}
						$scope.currentVideoFile=undefined;
                        if ($scope.currentType == 'text') {
                            startAndUpdate()
                        }
                        else{
                            if ($scope.currentType == 'video') {
                                $scope.currentVideoFile = $sce.trustAsResourceUrl($scope.prompts[$scope.currentPromptPosition].videoFile) ;
                                $scope.loadingVideo = true;
                                waitForVideoLoad($scope.currentPromptPosition).then(function(){
                                    $scope.loadingVideo = false;
                                	startAndUpdate()
                                })

                            }
                            if ($scope.currentType == 'audio') {
                                $scope.playAudio();
                                $scope.loadingAudio = true;
                                waitForVideoLoad($scope.currentPromptPosition).then(function(){
                                    $scope.loadingAudio = false;
                                    startAndUpdate()
                                })
                            }

						}

						return;
					}
					//end
					if (($scope.currentPromptPosition + 1) == $scope.prompts.length) {
						document.getElementById('videoWidget').style.opacity = 0;
						$scope.currentPromptPosition++;
						//console.log('log3');
						$scope.currentType = 'end';
						$scope.timerActive=false;
						//$scope.timedPauseInterval = $timeout(function () {

						if($scope.recording == true) {
							$scope.stopRecording();
							$scope.recording = false;
						}

						//}, 3000);

						$scope.submitPost();
						return;
					}

					//console.log($scope.currentPromptPosition);
				}
				function startAndUpdate(){
                    $scope.startTimer($scope.timeLimitPrepare,$scope.timeLimitActive);
                    $scope.updateProgress();
				}
				function waitForVideoLoad(position){
					$scope.videoLoadingPromises[position] = $q.defer();
                    return $scope.videoLoadingPromises[position].promise;
				}
				$scope.resolveVideoLoadingPromise = function(position){
					$scope.videoLoadingPromises[position].resolve();
				};

				$scope.play = function () {
					$scope.videoObject.playback($scope.videoFileName);
				}

            $scope.stopRecording = function () {
                //console.log('stopped video');
                $scope.recordingTimer = false;
                $interval.cancel($scope.timedRcordingInterval);
                $scope.recordingTime = "00:00";
                $scope.answerTimeLeft = undefined;
                if(!DEV_ENV)
                    videoFlushed = false;
                var promise;
                if($scope.recordingType==='webrtc'){
                    promise = $scope.videoObject.recordstop();

                }
                else{
                    $scope.videoObject.recordstop()
                    promise = Promise.resolve()
                }
                if(promise.then)
                    promise.then(function(){
                        $scope.recording = false;
                    });

                prepareAnswerPositionStop();
                $scope.alreadyRecording = false;
                return promise;
            }

            $scope.record = function () {
                $scope.recording = true;
                if($scope.videoObject.recordstart){
                    prepareAnswerPositionStart()
                    if($scope.alreadyRecording == false){
                        $scope.videoObject.option = 'version';

                        var promise =  $scope.videoObject.recordstart($scope.currentPromptPosition===0?'overwrite':undefined);
                        if($scope.recordingType!=='webrtc')
                            promise = Promise.resolve();
                        $scope.alreadyRecording = true;
                        return promise;
                    }
                }else{
                    toastr.error("Sorry, something went wrong. Please, refresh the page and try again");
                    $scope.notWorking();
                    throw "";
                }

				};
				function prepareAnswerPositionStart(){
					if(answerTimePositions.length && !answerTimePositions[answerTimePositions.length-1].timeStopped)
						prepareAnswerPositionStop();
					var newAnswer = {
						timeStarted : (new Date()).getTime()
					}

					answerTimePositions.push(newAnswer);
				}
				function prepareAnswerPositionStop(){
					var currentAnswer = answerTimePositions[answerTimePositions.length-1];
					currentAnswer.timeStopped = (new Date()).getTime();
					currentAnswer.duration = currentAnswer.timeStopped - currentAnswer.timeStarted;
				}
				$scope.canBegin = function(){
					if(DEV_ENV)
						return true;
					var isStreamReady;
					if($scope.recordingType!=='webrtc'){
					    isStreamReady = true;
                    }else{
					    isStreamReady = $scope.videoObject && $scope.videoObject.isStreamReady;
                    }
					return $scope.videoObject && $scope.videoObject.recordstart && isStreamReady;
				}

                // $scope.validateCam =  {recording: true};
                $scope.validateCamRecording = true;
				$scope.recordWebcam = function(){
					console.log($scope.videoObject);
					function record() {
						if($scope.videoObject.recordstart){
							$scope.videoObject.recordstart();
						}else{
							$timeout(record,100);
						}
					}
                    // $scope.validateCam.recording = false;
					if (document.getElementById('button').src.match($scope.recordingType!=='webrtc'?"redo":"play")) {
						$scope.validateCamRecording = false;
					}else {
						$scope.validateCamRecording = true;
					}
				};

				$scope.validateCamRandomName = function () {
					return 'webcam-validate-id-' + new Date().getTime();
				}

				$scope.validateCamId = $scope.validateCamRandomName();
				$scope.validateCamBtn = $sce.trustAsHtml('<img src="/public/img/recordbttn.png" id="button" onclick="callAS(bob,\'' + $scope.validateCamId + '\')">');

				$scope.confirmWebcamIsWorking = function(){
					$scope.currentType='instructions';
				}
				$scope.notWorking = function(){
					$scope.modalInstance.close('notWorking');
				}
				$scope.beginTimedReview = function () {

					if($scope.pageData.is_cant_leave =="1")
					{
                        $http({
                            method: 'POST',
                            url: '/studentactivity/save',
                            data: JSON.stringify({courseId: CurrentCourseId.data.id, activityId: $scope.pageData.id}),
                            headers: {'Content-Type': 'application/json'}
                        }).then(function(response) {
							nextprocess();
                        }, function(error) {
                            alert("sorry something went wrong in server");
                        });
					}
					else
					{
						nextprocess();
					}



					//$scope.showVideo = !$scope.showVideo;
				}
				function nextprocess() {
                    $scope.started = true;
                    $scope.timeLimitActive = ($scope.timelimit > 0) ? true : false;
                    $scope.timeLimitPause = ($scope.pauseduration > 0) ? true : false;
					$scope.timeLimitPrepare = ($scope.pageData.timed_prepare > 0)? true : false;
                    $scope.nextQuestion();
                }

				$scope.$on('newTimedReviewPost', function (event, mass) {
					//console.log('here');
					$scope.newPost();
				});


				$scope.newPost = function (reply_to_id) {
					if (!angular.isDefined(reply_to_id)) {
						reply_to_id = 0;
					}

					$('#basicModal2').modal({
						backdrop: 'static'
					});

					$(".modal").draggable({
						handle: ".modal-header"
					});

					$scope.reply_to_id = reply_to_id;
					$scope.video_comment = '';
					$scope.check_is_private = 0;

					$scope.trustAsHtml = function(html){
						return $sce.trustAsHtml(html);
					}
					$scope.post = Post.get({
						postId: 'newTimed',
                        orgId:$scope.$root.currentCourse.orgId
					}, function (post) {
						console.log('post',post);
						//console.log(post);
						$scope.videoWidget = $sce.trustAsHtml(post.video_widget);
						//$scope.videoRecordButton = $sce.trustAsHtml(post.button);
						$scope.videoFileName = post.file_name;
						$scope.objectId = post.object;
						$scope.recordingType = post.object!==undefined?'flash':'webrtc';
                        if($scope.recordingType === 'webrtc'){
                            $scope.validateCamBtn = $scope.trustAsHtml(post.button);
                        }
                    $scope.offsetVideo($scope.currentType,300);
                    setTimeout(function(){
                        var webrtcContainer = angular.element('webrtc-video-recorder');
                        if(webrtcContainer.length){
                            webrtcContainer.replaceWith($compile(webrtcContainer)($scope));
                        }
                        validateObject()

                    })
						//wait for the object to be valid in the dom


					});
				}
				var validated = false;
				function validateObject(){
					if (eval($scope.objectId)) {
						$scope.videoObject = eval($scope.objectId);
					}
					else{
						if(validated) return;
                        $scope.videoObject = window.recorders[$scope.videoFileName]
                        $scope.videoObject.onStreamReady.then(function(){
                            $('#videoWidget').hide();
                            $('#videoWidgetContainer').css('display','');
                            setTimeout(function(){
                                $scope.$apply();
                                setTimeout(function() {
                                    $scope.offsetVideo($scope.currentType);
                                });
                            })

                        })
						//
						validated = true;
                    }
				}
                var removeWatcher = $scope.$watch(isVideoWidgetLoaded,function(obj){
                    if(obj && obj.length){
                        validateObject();
                        removeWatcher();
                    }
                })

				function isVideoWidgetLoaded(){
					if($scope.objectId)
						return angular.element('#'+$scope.objectId);
                else if ($scope.videoFileName){
                    return angular.element('#'+$scope.videoFileName);
                }
				}


				$scope.$watch('currentType',function(type){
					if(!type) return;
					$scope.offsetVideo(type);

            })
            $scope.offsetVideo = function(type,time){
                time = time || 100;
                $timeout(function(){
                    var widget = $('#videoWidget');
                    widget.show();
                    if(type=='validateWebcam' && $scope.double_check_cam_audio && $scope.recordingType !== 'webrtc'){
                        widget.css('visibility','hidden');
                        $('#videoWidgetContainer').css('display','none');
                    }else if(type=='validateWebcam'){
                        widget.width($('#videoWidgetContainer').width());
                        widget.offset($('#videoWidgetContainer').offset());
                        widget.css('visibility','visible');
                    }else if(type=='instructions'){
                        widget.css('visibility','hidden');
                        intializeVideos();
                    }else if($scope.started){

                            widget.width($('#videoWidgetContainer2').width());

                        widget.offset($('#videoWidgetContainer2').offset());
                        widget.css('visibility','visible');}


                },time);

            }

				$scope.submitPost = function () {
					var LIMIT_FLUSH_COUNTER = 30,
						flushCounterFortimer = 0;
					if(videoFlushed != true){
						var videoFlushedTimer = $interval(function(){
							flushCounterFortimer++;
							if(flushCounterFortimer>LIMIT_FLUSH_COUNTER)
							{
								toastr.error("Could not process the video");
								$interval.cancel(videoFlushedTimer);
								return;
							}
							if (videoFlushed == true) {
								finallySubmitPost();
								$interval.cancel(videoFlushedTimer);
							} else {
								$scope.submitting = false;
								$scope.showSaving = false;
								$scope.showSubmit = true;
							}
						},100);
					}
					else{
						finallySubmitPost();
					}
				}
				function finallySubmitPost(){
					if (!angular.isDefined($scope.reply_to_id)) {
						$scope.reply_to_id = 0;
					}

					if ($scope.video_comment == 'Type Message Here') {
						$scope.video_comment = '';
					}


					$scope.post.contentid = $scope.pageData.id;
					$scope.post.videoFileName = $scope.videoFileName;
					$scope.post.reply_to_id = $scope.reply_to_id;
					$scope.post.video_comment = $scope.video_comment;
					$scope.post.check_is_private = $scope.check_is_private;



					if ($scope.post.video_comment == ""){
						$scope.post.video_comment = $scope.video_comment;
					}
					if($scope.audioPlayer){
						$scope.audioPlayer.stop();
						delete $scope.audioPlayer;
						if($scope.timedAnswerInterval) $interval.cancel($scope.timedAnswerInterval);

					}
					$scope.post.courseId = CurrentCourseId.data.id;
					//answerTimePositions = [{"timeStarted":1468329681398,"timeStopped":1468329692413,"duration":11015},{"timeStarted":1468329694498,"timeStopped":1468329721354,"duration":26856}]
					$scope.post.answerTimePositions = answerTimePositions;
					$scope.inputPrompts = $scope.prompts.slice();
					// if($scope.inputPrompts.length>answerTimePositions.length) {
					// 	$scope.inputPrompts.splice(answerTimePositions.length,($scope.inputPrompts.length-1));
					// }
					$scope.post.prompts = $scope.inputPrompts;
					var tempArray = new Array();
					for(i=0;$scope.inputPrompts.length>i;i++) {
						tempArray[i] =jQuery.isNumeric($scope.inputPrompts[i].time_prepare)?$scope.prompts[i].time_prepare:$scope.pageData.timed_prepare;
					}
					$scope.post.timeToPrepareValues = tempArray;
					$scope.post.$submit(function (post) {
						if (post.message == 'successful') {
							$scope.submitted=true
							$scope.$root.$emit('reloadPostedMessages', true);
							$scope.$root.$emit('NavRootUpdate');
							$scope.defineInitOptions();
							$scope.close();
							$scope.$destroy();
						} else {
							toastr.error(post.message);
							$scope.error = true;
							$scope.$destroy();
						}
					}).then(function(){
							if(!Nav.classMeta){
								window.location.reload();
							}else {
								if(Nav.classMeta.no_menu && !(Nav.classMeta.no_menu.meta_value=='1')){
									window.location.reload();
								}
							}
						});
				}
				$scope.defineInitOptions();
			}

			init();


		}];

		return {
			restrict: 'EA', //Default in 1.3+
			scope: {
				prompts: '=',
				timelimit: '=',
				pauseduration: '=',
				orgId:'=',
				modalInstance: '=',
				pageData:'='
			},
			controller: controller,
			templateUrl: '/public/js/directives/timed-review.html?v='+window.currentJsVersion,
		};
	}]);

	app.directive('timedEditor', ['FlashITAudio', '$interval', '$timeout', '$http', 'fileUpload2','TimedGroupEditor','$modal','Post','$sce', '$rootScope', function (FlashIT, $interval, $timeout, $http, fileUpload2,TimedGroupEditor,$modal,Post,$sce,$rootScope) {

		var link = function ($scope,$element) {
			$element.on('$destroy',function(){
				$scope.$destroy();

			});
			function init() {
                Array.prototype.move = function (old_index, new_index) {
					if (new_index >= this.length) {
						var k = new_index - this.length;
						while ((k--) + 1) {
							this.push(undefined);
						}
					}
					this.splice(new_index, 0, this.splice(old_index, 1)[0]);
					return this; // for testing purposes
				};
				$scope.loading = {groupId: {}}
				$scope.selected = {}
				$scope.timedGroupEditor = TimedGroupEditor
				$scope.move = function (old_index, new_index) {
					console.log(old_index);
					console.log(new_index);
					$scope.prompts.move(old_index, new_index);
				}

				$scope.setType = function (key, type) {
					if (type != 'text' && type != 'audio' && type != 'video') {
						type = 'text';
					}
					for (var i = 0, len = $scope.prompts.length; i < len; i++) {
						if (key == i) {
							$scope.prompts[key].type = type;
							break;
						}
					}

				};

				$scope.add = function (option) {
					if (option == 'promptFromGroup') {
						$scope.prompts[$scope.prompts.length] = {"type": 'promptFromGroup', "isRandom": false}
					} else if (option == 'randomFromGroup') {
						$scope.prompts[$scope.prompts.length] = {"type": 'randomFromGroup', "isRandom": true}
					} else
						$scope.prompts[$scope.prompts.length] = {
							"type": 'text',
							"answer": '',
							"prompt": '',
							'new': true
						};

				};
				$scope.openTimedGroupEditor = function (value) {
					TimedGroupEditor.currentGroup = value.selected.group;
					TimedGroupEditor.currentPrompt = value.selected.prompt;
					var modalInstance = $modal.open({
						templateUrl: '/public/views/timed-review/editor/timed-prompt-groups-modal.html',
						controller: function ($scope, $modalInstance, courseInfo) {
                            $rootScope.promptsSidebarCollapsed = false;
							$scope.cancel = function () {
								$modalInstance.close('cancel')
							}
                            $rootScope.togglePromptsSidebar = function () {
                                if(!$rootScope.promptsSidebarCollapsed && $(window).width()>767){
                                    $(".timed-groups-content-wrapper").css("cssText", "width: 100% !important");
                                }else{
                                    $(".timed-groups-content-wrapper").css("cssText", "height :100%");
                                }
                                $rootScope.promptsSidebarCollapsed = !$rootScope.promptsSidebarCollapsed;
                            };
							$scope.$root.courseInfo = courseInfo;

						},
						size: 'lg',
						windowClass: 'timed-group-editor',
						resolve: {
							courseInfo: function () {
								return $scope.courseInfo
							},
						}
					})
					modalInstance.result.then(function () {
						var tmp = $scope.timedGroupEditor.groups;
						$scope.timedGroupEditor.groups = undefined;
						$timeout(function () {
							$scope.timedGroupEditor.groups = tmp
						})

					})
				}
				$scope.loadPrompts = function (groupId, value) {
					if (!groupId) return;
					var group = _.find($scope.timedGroupEditor.groups, function (g) {
						return g.id == groupId
					});
					if (!group) {
						$scope.needLoadPrompts = true;
						return;
					}
					;
					if (value.selected.groupObject && value.selected.groupObject.id != groupId) {
						delete value.selected.prompt
					}
					if (value && value.selected) {
						value.selected.groupObject = group;
						if (value.selected.group != groupId)
							delete value.selected.prompt
					}
					if (!group.prompts ||
						Object.prototype.toString.call(group.prompts) === '[object Array]' ||
						(Object.prototype.toString.call(group.prompts) === '[object Object]' && !Object.keys(group.prompts).length)
					) {
						if ($scope.loading.groupId[group.id]) return;
						$scope.loading.group = true
						$scope.loading.groupId[group.id] = true;
						TimedGroupEditor.getGroup(
							{
								id: group.id
							},
							function (g) {
								group.prompts = _.map(g.prompts, function (o) {
									return o
								});
								$scope.loading.group = false
								$scope.loading.groupId[group.id] = false
							},
							function (error) {
								$scope.loading.group = false
								$scope.loading.groupId[group.id] = false
							}
						)
					} else {
						group.prompts = _.map(group.prompts, function (o) {
							return o
						});
					}
				}
				$scope.loadGroups = function () {
					if (!(TimedGroupEditor.groups && TimedGroupEditor.groups.length)) {
						if ($scope.loading.groups == 1) return;
						$scope.loading.groups = 1

						TimedGroupEditor.queryGroups(
							{orgId: $scope.orgId},
							function (groups) {
								$scope.timedGroupEditor.groups = groups;
								$scope.loading.groups = 0
								if ($scope.needLoadPrompts) {
									$scope.needLoadPrompts = false;
									_.each($scope.prompts, function (prompt) {
										if (prompt.selected && prompt.selected.group)
											$scope.loadPrompts(prompt.selected.group, prompt)
									})
								}
							},
							function (error) {
								$scope.loading.groups = 2
							}
						)
					}

				}
				$scope.recording = false;
				$scope.uploadingRecording = false;
				$scope.keyCurrentFileUploading = false;
				$scope.uploadingFileAudio = false;

				$scope.isRecording = function (key) {
					key = typeof key !== 'undefined' ? key : false;
					if (key == $scope.keyCurrentRecording) {
						if ($scope.recording) {
							return 'active';
						}
					}

					return false;
				};

				$scope.isRecorded = function (key) {
					key = typeof key !== 'undefined' ? key : false;
					if (key == $scope.keyCurrentRecording) {
						if ($scope.alreadyRecorded) {
							return '#428bca';
						}
					}

					if ($scope.prompts[key].audioFile != '' && typeof $scope.prompts[key].audioFile !== 'undefined') {
						return '#428bca';
					}

					return 'gray';
				};


				$scope.playFullAudio = function () {
					if ($scope.alreadyRecorded) {
						Recorder.play({
							finished: function () {

								$scope.playAudio();
							}
						});

					} else {
						$scope.playAudio();
					}
					//

				}

				$scope.playRecordedAudio = function (key) {
					key = typeof key !== 'undefined' ? key : false;
					if ($scope.recording) {
						$scope.recordAudio(true, key);
					} else {
						if (key == $scope.keyCurrentRecording && $scope.keyCurrentRecording !== false) {
							Recorder.play({});
						} else {
							//audioFile
							new Howl({
								src: ['/public/useruploads/' + $scope.prompts[key].audioFile]
							}).play();
						}
					}
				}
				$scope.recordingObjectInitialized = false;
				$scope.recordObjectReady = false;
				$scope.recordingLength = 0;
				$scope.alreadyRecorded = false;
				$scope.setFinishedRecording = false;
				$scope.keyCurrentRecording = false;
				$scope.recordAudio = function (playAfter, key) {
					playAfter = typeof playAfter !== 'undefined' ? playAfter : false;
					key = typeof key !== 'undefined' ? key : false;
					if ($scope.keyCurrentRecording != key) {
						$scope.recordingLength = 0;
						$scope.alreadyRecorded = false;
						$scope.setFinishedRecording = false;
						$scope.keyCurrentRecording = false;
					}
					$scope.keyCurrentRecording = key;
					if (!$scope.recordingObjectInitialized) {
						Recorder.initialize({
							swfSrc: "/public/lib/recorder.swf",
							onFlashInitialized: function () {
								$scope.recordObjectReady = true;
							}
						});
						$scope.recordingObjectInitialized = true;
						$scope.recordObjectTimer = $interval(function () {

							if (!$scope.recordObjectReady) {
								$interval.cancel($scope.recordObjectTimer);
								$scope.recordAudio(playAfter, key);
							}
						}, 500);
						return;
					}


					$scope.recording = !$scope.recording;

					if ($scope.recording) {
						$scope.alreadyRecorded = true;
						Recorder.record({
							finished: function () {

								//console.log("Recording Finished");
							}
						});
					} else {
						$scope.stopRecordingAudio(playAfter);
					}
				}

				$scope.stopRecordingAudio = function (playAfter, key) {
					playAfter = typeof playAfter !== 'undefined' ? playAfter : false;
					key = typeof key !== 'undefined' ? key : false;

					$scope.recordTimeout = $interval(function () {

						$interval.cancel($scope.recordTimeout);
						Recorder.stop();
						$scope.setFinishedRecording = true;
						if (playAfter) {
							$scope.playRecordedAudio(key);
							//$scope.playAudio();
						}
					}, 200);

				}

				$scope.setField = function (key, type, field, value) {
					if (type != 'text' && type != 'audio' && type != 'video') {
						type = 'text';
					}
					for (var i = 0, len = $scope.prompts.length; i < len; i++) {
						if (key == i) {
							$scope.prompts[key][field] = value;
							break;
						}
					}
					//console.log($scope.prompts);
				};
				$scope.getVideoWidget = function (key) {
					$scope.post = Post.get({
						postId: 'new'
					}, function (post) {
						//console.log(post);
						$scope.prompts[key].videoWidget = $sce.trustAsHtml(post.video_widget);
						$scope.prompts[key].videoRecordButton = $sce.trustAsHtml(post.button);
						//$scope.videoRecordButton = $sce.trustAsHtml(post.button);
						$scope.prompts[key].videoFileName = post.file_name;
						//wait for the object to be valid in the dom
						var interval = $interval(function () {
							if (eval(post.object)) {
								$scope.videoObject = eval(post.object);
								$interval.cancel(interval);
								$scope.readyToBegin = true;
							}
						}, 100);

					});
				}
				$scope.submitVideo = function (key) {
					$scope.post.$saveVideo(function (post) {
						if (post.message == 'successful') {
							$scope.prompts[key].videoFile = post.videofilename
							$scope.prompts[key].videoThumbnailFile = post.thumbnailfilename
						} else {
							toastr.error(post.message);
						}
					})
				}
				$scope.uploadRecording = function (key) {
					$scope.uploadingRecording = true;
					Recorder.upload({
						url: "/filesupload/timedAudio",
						audioParam: "file",

						success: function (responseText) {
							var track = $.parseJSON(responseText);
							$scope.setField(key, 'audio', 'audioFile', track.showfilename);
							$scope.recordingLength = 0;
							$scope.alreadyRecorded = false;
							$scope.setFinishedRecording = false;
							$scope.keyCurrentRecording = false;
							$scope.uploadingRecording = false;
							$scope.$apply();
							toastr.success("Recording Uploaded! Please remember to click Save Changes or your recording will be lost.");
						}
					});

				};
				$scope.uploadFile = function (scope, key, type) {
					type = type || 'audio'
					//get the model set in the directive
					$scope.keyCurrentFileUploading = key;
					if (type == 'audio') {
						var file = this['timed_audioFile_' + key];


						$scope.uploadingFileAudio = true;

						//console.log('file is ' + JSON.stringify(file));
						//send the request
						var uploadUrl = "/filesupload/timedAudio";
						var response = fileUpload2.uploadFileToUrl(file, uploadUrl, key, this);
						//wait for the ajax event to happen
						this.$on('uploadedNewTimedAudio', function (event, mass) {
							//console.log(mass);
							$scope.setField(mass.key, 'audio', 'audioFile', mass.response.showfilename);
							$scope.keyCurrentFileUploading = false;
							$scope.uploadingFileAudio = false;
							toastr.success("File uploaded! Please remember to click Save Changes or your upload will be lost.");
						});
					} else if (type == 'video') {
						$scope.uploadingFileVideo = true;
						var file = this['timed_videoFile_' + key];
						//console.log('file is ' + JSON.stringify(file));
						//send the request
						var uploadUrl = "/filesupload/video";
						var response = fileUpload2.uploadFileToUrl(file, uploadUrl, key, this);
						this.$on('uploadedNewTimedAudio', function (event, mass) {
							$scope.setField(mass.key, 'video', 'videoFile', mass.response.videofilename);
							$scope.setField(mass.key, 'video', 'videoThumbnailFile', mass.response.thumbnailfilename);
							$scope.setField(mass.key, 'video', 'playVideoFile', undefined);
							$scope.keyCurrentFileUploading = false;
							$scope.uploadingFileVideo = false;
							toastr.success("File uploaded! Please remember to click Save Changes or your upload will be lost.");
						})
					}

					//console.log(response);

				};


				$scope.uploadFile = function (scope, key, type) {
					//get the model set in the directive
					type = type || 'audio'
					$scope.keyCurrentFileUploading = key;
					if (type == 'audio') {
						var file = this['timed_audioFile_' + key];


						$scope.uploadingFileAudio = true;

						//console.log('file is ' + JSON.stringify(file));
						//send the request
						var uploadUrl = "/filesupload/timedAudio";
						var response = fileUpload2.uploadFileToUrl(file, uploadUrl, key, this);
						//wait for the ajax event to happen
						this.$on('uploadedNewTimedAudio', function (event, mass) {
							//console.log(mass);
							$scope.setField(mass.key, 'audio', 'audioFile', mass.response.showfilename);
							$scope.keyCurrentFileUploading = false;
							$scope.uploadingFileAudio = false;
							toastr.success("File uploaded! Please remember to click Save Changes or your upload will be lost.");
						});
					} else if (type == 'video') {
						$scope.uploadingFileVideo = true;
						var file = this['timed_videoFile_' + key];
						//console.log('file is ' + JSON.stringify(file));
						//send the request
						var uploadUrl = "/filesupload/video";
						var response = fileUpload2.uploadFileToUrl(file, uploadUrl, key, this);
						this.$on('uploadedNewTimedAudio', function (event, mass) {
							$scope.setField(mass.key, 'video', 'videoFile', mass.response.videofilename);
							$scope.setField(mass.key, 'video', 'videoThumbnailFile', mass.response.thumbnailfilename);
							$scope.setField(mass.key, 'video', 'playVideoFile', undefined);
							$scope.keyCurrentFileUploading = false;
							$scope.uploadingFileVideo = false;
							toastr.success("File uploaded! Please remember to click Save Changes or your upload will be lost.");
						})
					}


					//console.log(response);

				};


				toastr.options = {
					positionClass: 'toast-bottom-left'
				};


			}

			init();

		}

		return {
			restrict: 'EA', //Default in 1.3+
			scope: {
				prompts: '=',
				orgId:'='
			},
			link: link,
			templateUrl: '/public/js/directives/timed-editor.html?v='+window.currentJsVersion,
		};
	}]);

	app.directive('showtab',
		function () {
			return {
				link: function (scope, element, attrs) {
					element.click(function (e) {
						e.preventDefault();
						$(element).tab('show');
					});
				}
			};
		});

	app.directive('fileModel', ['$parse', function ($parse) {
		return {
			restrict: 'A',
			link: function (scope, element, attrs) {
				var model = $parse(attrs.fileModel);
				var modelSetter = model.assign;

				element.bind('change', function () {
					scope.$apply(function () {
						//console.log('here');
						modelSetter(scope, element[0].files[0]);
					});
				});
			}
		};
	}]);

	app.service('fileUpload2', ['Upload', function (Upload) {
		this.uploadFileToUrl = function (file, uploadUrl, key, scope,then) {
			var promise = Upload.upload({
				url: uploadUrl,
				file: file,
			}).progress(function (evt) {
				scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);
				var progressBar = $('#upload-progress-bar.progress-bar');
				if(progressBar.length)
					progressBar.width(scope.progress_upload + '%')
			}).success(function(response) {
				if(then)
					then(response);
				scope.$emit('uploadedNewTimedAudio', { "key": key, "response": response });
			});

			return promise;


		}
	}]);
