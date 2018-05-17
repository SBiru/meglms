"use strict";
//Directive to edit/create groups and prompts for timed review
//Needs to be called after timedReviewStuff module is declared
(function () {

    var app = angular.module('timedReviewStuff');

    app.directive('timedReviewGroupsContent', ['$rootScope', 'FlashITAudio', '$interval', '$timeout', '$http', 'Post', '$sce', function ($rootScope, FlashIT, $interval, $timeout, $http, Post, $sce,TimedGroupEditor) {

        var controller = ['$rootScope', '$scope', 'FlashITAudio', '$interval', '$timeout', '$http', 'fileUpload2', 'Post', '$sce','TimedGroupEditor', function ($rootScope, $scope, FlashIT, $interval, $timeout, $http, fileUpload2, Post, $sce,TimedGroupEditor) {
            $scope.timedGroupEditor = TimedGroupEditor;


            $scope.$watch('timedGroupEditor.currentGroup',currentGroupChanged)
            $rootScope.$on('removePrompt',removePrompt);

            function currentGroupChanged(groupId){

                if(groupId=='new')
                    $scope.newGroup();
                else{
                    $scope.loadGroup();
                }
            }
            function removePrompt(event,id){
                delete $scope.group.prompts[id]
            }
            function init() {
                $scope.loading={}
                $scope.filter={
                    type:'name'
                }
                $scope.filterPrompts = function(p){
                    console.log(p);
                }
                $scope.newGroup = function(){
                    $scope.group={
                        classId:$scope.$root.courseInfo.data.classId,
                        orgId:$scope.$root.courseInfo.data.orgId,
                        id:'new',
                        prompts:{},
                    }
                    $scope.loading.group=0;
                }
                $scope.teste = function(el){
                    console.log(el)
                }
                $scope.canSaveGroup = function(){
                    return $scope.group && typeof $scope.group.title =='string' && $scope.group.title!='';
                };
                $scope.saveGroup = function(){
                    $scope.loading.saveGroup=1
                    TimedGroupEditor.saveGroup(
                        $scope.group,
                        function(id){

                            $scope.group.id=id.id;
                            $scope.group.editing=false;
                            $scope.loading.saveGroup=0;
                            $scope.group.numPrompts=Object.keys($scope.group.prompts).length;
                            TimedGroupEditor.updateGroups($scope.group);
                        },function(error){
                            $scope.loading.saveGroup=2
                        }
                    )
                };
                $scope.loadGroup = function(scrollTo){
                    if(!TimedGroupEditor.currentGroup){
                        $scope.group=undefined
                        return;
                    }
                    $scope.loading.group=1

                    TimedGroupEditor.getGroup(
                        {
                            id:TimedGroupEditor.currentGroup
                        },
                        function(group){
                            $scope.group=group;
                            if(scrollTo)
                                setTimeout(function(){scrollToPrompt(scrollTo)},200);
                            $scope.loading.group=0
                        },
                        function(error){
                            $scope.loading.group=2
                        }

                    )
                }
                function scrollToPrompt(id){

                    var el = angular.element('#prompt_'+id)[0];
                    if(el){
                        el.scrollIntoView(true);
                    }
                }
                $scope.newPrompt = function(){
                    $scope.prompt={"type":'text',"answer":'',"prompt":'',id:'new',groupid:$scope.group.id}
                    $scope.group.prompts['new']=$scope.prompt;
                }
                $scope.clonePrompt = function(prompt){
                    TimedGroupEditor.clonePrompt({id:prompt.id}).$promise.then(function(res){
                        var group = _.where(TimedGroupEditor.groups,{id:$scope.group.id})[0];
                        group.numPrompts=Object.keys($scope.group.prompts).length+1;
                        $scope.loadGroup(res.id);
                    });
                }
            }

            init();


        }];

        return {
            restrict: 'EA', //Default in 1.3+
            scope: {
                prompts: '=',
                timelimit: '=',
                pauseduration: '=',
            },
            controller: controller,
            templateUrl: '/public/views/timed-review/editor/timed-prompts-groups-content.html?v='+window.currentJsVersion,
        };
    }]);
    app.directive('timedReviewGroupsSidebar',['TimedGroupEditor','Alerts',function(TimedGroupEditor,Alerts){
        return {
            restrict: 'EA', //Default in 1.3+
            templateUrl: '/public/views/timed-review/editor/timed-prompts-groups-sidebar.html',
            link:function($scope, $element) {
                $scope.timedGroupEditor = TimedGroupEditor;
                $scope.loading = {}
                $scope.onDropPrompt = onDropPrompt;
                $scope.removeGroup = removeGroup;
                $scope.cloneGroup = cloneGroup;

                function cloneGroup(i,group){
                    TimedGroupEditor.cloneGroup({id:group.id}).$promise.then(function(newGroup){
                        $scope.timedGroupEditor.groups.splice(i+1,0,newGroup);
                    })
                }
                function removeGroup(i,group){
                    Alerts.danger({
                        title:'Delete Group',
                        content:'Are you sure you want to delete this Group',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },function(){
                        $scope.loading.removeGroup = 1;

                        TimedGroupEditor.removeGroup(
                            {'id':group.id},
                            function(ok){
                                if(TimedGroupEditor.currentGroup==group.id)
                                    TimedGroupEditor.currentGroup=null
                                TimedGroupEditor.groups.splice(i,1)
                                $scope.loading.removeGroup = 0
                            },function(error){
                                $scope.loading.removeGroup = 2
                            }
                        )
                    });
                }
                function loadGroups(){
                    $scope.loading.groups=1
                    TimedGroupEditor.queryGroups(
                        {orgId:$scope.$root.courseInfo.data.orgId},
                        function(groups){
                            $scope.timedGroupEditor.groups = groups;
                            $scope.loading.groups=0
                        },
                        function(error){
                            $scope.loading.groups=2
                        }
                    )
                }
                function onDropPrompt(dragEl,dropEl,data,scopeDest){

                    var srcGroup = _.find(TimedGroupEditor.groups,function(g){
                        return g.id==data.srcGroupId
                    })
                    var destGroup = _.find(TimedGroupEditor.groups,function(g){
                        return g.id==scopeDest.$parent.group.id
                    })
                    if(srcGroup.id==destGroup.id)
                        return;
                    destGroup.moving=true;
                    TimedGroupEditor.movePrompt({
                        srcGroup:srcGroup.id,
                        destGroup:destGroup.id,
                        id:data.srcPromptId
                    },function(ok){
                        destGroup.numPrompts=parseInt(destGroup.numPrompts)+1;

                        srcGroup.numPrompts=parseInt(srcGroup.numPrompts)-1;
                        $scope.$root.$emit('removePrompt',data.srcPromptId);
                        destGroup.moving=false;
                    },function(error){
                        destGroup.moving=false;
                    })


                }
                $scope.$root.$on("E3-DRAG-START", function() {
                    angular.element('body').addClass('dragging-prompt')

                });

                $scope.$root.$on("E3-DRAG-END", function() {
                    angular.element('body').removeClass('dragging-prompt')
                });

                loadGroups();
            }
        }
    }]);
    app.directive('timedReviewPrompt', ['$rootScope', 'FlashITAudio', '$interval', '$timeout', '$http', 'Post', '$sce','TimedGroupEditor','Alerts', function ($rootScope, FlashIT, $interval, $timeout, $http, Post, $sce,TimedGroupEditor,Alerts) {

        var controller = ['$rootScope', '$scope', 'FlashITAudio', '$interval', '$timeout', '$http', 'fileUpload2', 'Post', '$sce','TimedGroupEditor','Alerts', function ($rootScope, $scope, FlashIT, $interval, $timeout, $http, fileUpload2, Post, $sce,TimedGroupEditor,Alerts) {
            function init() {

                $scope.loading={}
                $scope.setType = function(key,type){
                    if (type != 'text' && type != 'audio' && type != 'video') {
                        type = 'text';
                    }
                    $scope.value.type=type;
                    for (var i = 0, len = $scope.prompts.length; i < len; i++) {
                        if (key == i) {
                            $scope.prompts[key].type = type;
                            break;
                        }
                    }

                };
                $scope.canSavePrompt = function(){
                    if($scope.value.type=='audio'){
                        return typeof $scope.value.audioFile =='string' && $scope.value.audioFile!=''
                    }else if($scope.value.type=='video') {
                        return typeof $scope.value.videoFile == 'string' && $scope.value.videoFile != ''
                    }
                    return $scope.loading.savePrompt!=1;
                }
                $scope.savePrompt = function(){
                    $scope.loading.savePrompt = 1
                    delete $scope.value.editing
                    TimedGroupEditor.savePrompt(
                        $scope.value,
                        function(id){
                            if($scope.key=='new'){
                                $scope.value.id=id.id;
                                delete $scope.prompts[$scope.key];
                                $scope.prompts[id.id]=angular.copy($scope.value);
                                $scope.group.numPrompts=Object.keys($scope.prompts).length;
                                TimedGroupEditor.updateGroups($scope.group);
                            }
                            $scope.loading.savePrompt = 0
                        },function(error){
                            $scope.loading.savePrompt = 2
                        }
                    )
                }
                $scope.removePrompt = function(){
                    Alerts.danger({
                        title:'Delete Prompt',
                        content:'Are you sure you want to delete this prompt',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },function(){
                        $scope.loading.removePrompt = 1;

                        TimedGroupEditor.removePrompt(
                            {'id':$scope.value.id},
                            function(ok){
                                delete $scope.prompts[$scope.key];
                                $scope.group.numPrompts=Object.keys($scope.prompts).length;
                                TimedGroupEditor.updateGroups($scope.group);
                                $scope.loading.removePrompt = 0
                            },function(error){
                                $scope.loading.removePrompt = 2
                            }
                        )
                    });

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

                    if ($scope.prompts[key] && $scope.prompts[key].audioFile != '' && typeof $scope.prompts[key].audioFile !== 'undefined') {
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
                            Recorder.play({

                            });
                        } else {
                            //audioFile
                            new Howl({
                                src: ['/public/useruploads/'+$scope.prompts[key].audioFile]
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


                $scope.stopRecordingAudio = function (playAfter,key) {
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

                $scope.setField = function (key, type,field,value) {
                    if (type != 'text' && type != 'audio' && type != 'video') {
                        type = 'text';
                    }
                    $scope.value[field]=value;
                    for (var i = 0, len = $scope.prompts.length; i < len; i++) {
                        if (key == i) {
                            $scope.prompts[key][field] = value;
                            break;
                        }
                    }
                    //console.log($scope.prompts);
                };
                $scope.getVideoWidget = function(){
                    $scope.post = Post.get({
                        postId: 'new'
                    }, function (post) {
                        //console.log(post);
                        $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                        $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                        //$scope.videoRecordButton = $sce.trustAsHtml(post.button);
                        $scope.videoFileName = post.file_name;
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
                $scope.submitVideo = function(){
                    $scope.post.$saveVideo(function(post){
                        if (post.message == 'successful') {
                            $scope.value.videoFile=post.videofilename
                            $scope.value.videoThumbnailFile=post.thumbnailfilename
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

                $scope.$on('fetchedReviewPrompts', function (event, mass) {
                    $scope.pageData = mass;
                    if (!mass.time_review_data || mass.time_review_data.length == 0) {
                        $scope.prompts = [{"answer":'',"type":"text","prompt":"","audioFile":""}];
                    }
                });

                $scope.uploadFile = function (scope,key,type) {
                    type=type||'audio'
                    //get the model set in the directive
                    $scope.keyCurrentFileUploading = key;
                    if(type=='audio'){
                        var file = document.getElementsByName('timed_audioFile_' + key)[0].files[0];
                        delete  this['timed_audioFile_' + key];


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
                            document.getElementById('timed_audioFile_' + key).value='';
                        });
                    }else if(type=='video'){
                        $scope.uploadingFileVideo = true;
                        var file = document.getElementsByName('timed_videoFile_' + key)[0].files[0];
                        delete this['timed_videoFile_' + key];
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
                            document.getElementById('timed_videoFile_' + key).value='';
                        })
                    }

                    //console.log(response);

                };

                toastr.options = {
                    positionClass: 'toast-bottom-left'
                };


            }

            init();


        }];

        return {
            restrict: 'EA', //Default in 1.3+
            scope: {
                key: '=?',
                prompts:'=?',
                value: '=?',
                group:'=?'
            },
            controller: controller,
            templateUrl: '/public/views/timed-review/editor/timed-prompt.html',
        };
    }])
        .directive('e3Draggable', ['$rootScope', 'uuid', function($rootScope, uuid) {
            return {
                restrict: 'A',
                scope: {
                    callbackStartDrag: '&e3StartDrag',
                    dragData:'='
                },
                link: function(scope, el, attrs, controller) {
                    angular.element(el).attr("draggable", "true");
                    var id = attrs.id;
                    if (!attrs.id) {
                        id = uuid.new()
                        angular.element(el).attr("id", id);
                    }

                    el.bind("dragstart", function(e) {
                        e.dataTransfer.setData('text', id);
                        e.dataTransfer.setData('data', JSON.stringify(scope.dragData));
                        $rootScope.$emit("E3-DRAG-START");
                    });

                    el.bind("dragend", function(e) {
                        $rootScope.$emit("E3-DRAG-END");
                    });
                }
            }
        }])
        .directive('e3DropTarget', ['$rootScope', 'uuid', function($rootScope, uuid) {
            return {
                restrict: 'A',
                scope: {
                    onDrop: '&'
                },
                link: function(scope, el, attrs, controller) {
                    var id = attrs.id;
                    if (!attrs.id) {
                        id = uuid.new()
                        angular.element(el).attr("id", id);
                    }

                    el.bind("dragover", function(e) {
                        if (e.preventDefault) {
                            e.preventDefault(); // Necessary. Allows us to drop.
                        }

                        e.dataTransfer.dropEffect = 'move';  // See the section on the DataTransfer object.
                        return false;
                    });

                    el.bind("dragenter", function(e) {
                        // this / e.target is the current hover target.
                        angular.element(e.target).addClass('e3-over');
                    });

                    el.bind("dragleave", function(e) {
                        angular.element(e.target).removeClass('e3-over');  // this / e.target is previous target element.
                    });

                    el.bind("drop", function(e) {
                        if (e.preventDefault) {
                            e.preventDefault(); // Necessary. Allows us to drop.
                        }

                        if (e.stopPropogation) {
                            e.stopPropogation(); // Necessary. Allows us to drop.
                        }
                        var data = e.dataTransfer.getData("text");
                        var dataToTransfer = JSON.parse(e.dataTransfer.getData("data"));
                        var dest = document.getElementById(id);
                        var src = document.getElementById(data);
                        angular.element(e.target).removeClass('e3-over');
                        scope.onDrop({dragEl: src, dropEl: dest,data:dataToTransfer,scope:scope});
                    });

                    $rootScope.$on("E3-DRAG-START", function() {
                        var el = document.getElementById(id);
                        angular.element(el).addClass("e3-target");
                    });

                    $rootScope.$on("E3-DRAG-END", function() {
                        var el = document.getElementById(id);
                        angular.element(el).removeClass("e3-target");
                        angular.element(el).removeClass("e3-over");
                    });
                }
            }
        }])
        .directive('scrollToPrompt',['TimedGroupEditor','$timeout','$window',function(TimedGroupEditor,$timeout,$window){
            return function(scope, element, attrs) {
                function doDomStuff() {
                    $timeout(function() {
                        var width = parseInt($window.getComputedStyle(element[0]).width, 10);

                        if (width) {
                            if(attrs.scrollToPrompt && attrs.scrollToPrompt==TimedGroupEditor.currentPrompt){
                                var parent = angular.element(element).parent();
                                parent.animate({ scrollTop:element[0].offsetTop }, 200);

                            }
                        } else {
                            doDomStuff();
                        }
                    }, 100);
                }

                doDomStuff();

            };
        }])
        .controller('TimedFiterDatepickerController',['$scope',function($scope){
            $scope.today = function() {
                $scope.filter.text = new Date();
            };
            $scope.clear = function () {
                $scope.filter.text = null;
            };
            $scope.open = function($event) {
                $event.preventDefault();
                $event.stopPropagation();

                $scope.opened = true;
            };
            $scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };
            $scope.format='yyyy-MM-dd';
        }])
        .filter('filterPromptsWith', function() {
            return function(items, options) {
                if(!options.text) return items;
                var result = {};
                if(options.type=='modifiedOn')
                    options.text = moment(options.text).format('YYYY-MM-DD');
                for(var i in items){
                    if(items[i][options.type] &&
                        items[i][options.type].match &&
                        options.text &&
                        items[i][options.type].match(new RegExp(options.text,'i'))
                    ){
                        result[i]=items[i]
                    }
                }
                return result;
            };
        });



}());