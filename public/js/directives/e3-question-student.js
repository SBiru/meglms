angular.module('app').directive(
    'e3QuestionStudent', [ '$interval', '$http','$sce', '$compile', 'Currentpageid', 'Post', 'ReEncodeHtml', 'mathJaxConvert',
    function ( $interval, $http, $sce, $compile, Currentpageid, Post, ReEncodeHtml, mathJaxConvert) {
        return {
            require: "?ngModel",
            restrict:'E',
            scope:{
                question:'=?',
                options:'=?'
            },
            templateUrl:'/public/views/directives/e3-question-student.html',
            link:function($scope,$element,$attrs,ngModel){

                $scope.$watch('question.response',function(response){
                    ngModel.$setViewValue(response);
                })
                $scope.sendResponse = function(response, question, multiple_response) {

                    if (question.type === "blank") {
                        response = '';
                        for (var i = 0; i < question.blankids.length; i++) {
                            if(!document.getElementById(question.blankids[i])) return;
                            response += document.getElementById(question.blankids[i]).value.trim() + ',';
                        }
                        response = response.replace(/\,$/, '');
                        question.optionSelected = response;
                    } else if ((question.type === "truefalse") || (question.type === "single")) {
                        response = question.mapOptions[response];

                        question.responseUser = multiple_response
                        question.response=response;

                    }
                    if (angular.isDefined(multiple_response)) {
                        question.optionSelected = multiple_response;
                    }
                    question.response=response;

                }
                if($scope.question)
                    prepareQuestion($scope.question);
                $scope.trustAsHtml = function(html) {
                    if (typeof html === 'undefined') {
                        html = '';
                    }
                    if (html !== '') {
                        return $sce.trustAsHtml(html.trim())
                    }
                    return $sce.trustAsHtml(html);
                };
                function arrayRandomizer(arrayToRandomize) {
                    //randomize our array
                    for (var i = arrayToRandomize.length - 1; i >= 0; i--) {

                        var randomIndex = Math.floor(Math.random() * (i + 1));
                        var itemAtIndex = arrayToRandomize[randomIndex];
                        arrayToRandomize[randomIndex] = arrayToRandomize[i];
                        arrayToRandomize[i] = itemAtIndex;
                    }
                    return arrayToRandomize;
                };
                function randomizeOptions(question) {
                    var options = question.options;
                    var oldOptions = _.clone(question.options);
                    arrayRandomizer(options);
                    var mapOptions = {};
                    var newSolution = [];

                    for (var i in oldOptions) {
                        var idx;
                        _.find(options, function(option, optIdx) {
                            if (option == oldOptions[i]) {
                                idx = optIdx;
                                return true;
                            };
                        });
                        mapOptions[idx] = i;
                    }
                    question.mapOptions = mapOptions;
                }

                $scope.optionsSelected = function(question) {
                    var response = question.response.split(",");
                    var optionSelected = [];
                    for (var i in response) {
                        for (var j in question.mapOptions) {
                            if (response[i] == question.mapOptions[j]) {
                                optionSelected.push(j);
                            }
                        }
                    }
                    question.optionSelected = optionSelected.join(',');
                    question.response = question.optionSelected;
                };
                function prepareQuestion (question){


                    question.prompt = ReEncodeHtml.restoreHTML(question.prompt);


                    question.options = angular.fromJson(question.options);
                    //Golabs ReEncodeHtml Start
                    if ((angular.isDefined(question.options)) && (typeof question.options === 'object'))
                        angular.forEach(question.options, function(value, key) {
                            question.options[key] = ReEncodeHtml.restoreHTML(value);
                        });


                    randomizeOptions(question);
                    if (question.is_correct >= 1) {
                        question.isCorrect = true;
                    }
                    if (question.attemptedanswers != null&&question.attemptedanswers !== undefined) {
                        if (question.type == 'multiple'){
                            if(question.attemptedanswers!=''){
                                question.response=question.attemptedanswers;
                                $scope.optionsSelected(question);
                            }

                            else
                                question.response=',';
                        }


                        //question.optionSelected = question.response;


                    }
                    if (question.type === 'essay') {
                        if(question.attemptedanswers!==undefined && question.attemptedanswers!==null){
                            question.response=question.attemptedanswers;
                            question.htmlSafeoption = $sce.trustAsHtml(question.response);
                        }

                    }
                    if ((question.type === 'oneword')) {
                        if(question.isCorrect === true)
                            question.displayoneword = ' The Correct word is : "' + question.options[0] + '"';
                        if(question.attemptedanswers!==undefined &&question.attemptedanswers!==null){
                            question.response=question.attemptedanswers
                            question.text=question.attemptedanswers
                        }
                    } else if (question.type === 'blank') {
                        //var text = question.prompt.replace(/<[a-z].*?>|<\/[a-z].*?>/gi, '');
                        var text = question.prompt;
                        var tmp = text.match(/_\(.*?\)_/g),
                            id = '',
                            blankids = [];
                        if(question.attemptedanswers!==undefined && question.attemptedanswers!==null){
                            question.response=question.attemptedanswers;
                            question.optionSelected=question.attemptedanswers;
                            question.attemptedanswers=question.attemptedanswers.split(',')
                        }else question.attemptedanswers={};
                        if (typeof question.response === "string") {
                            var responsearray = question.response.split(',');
                        }

                        for (var t = 0; t < tmp.length; t++) {
                            id = 'id' + question.id.toString() + t;
                            if (typeof question.response !== "string") {
                                text = text.replace(/_\(.*?\)_/, '<input type="text" ng-model="question.attemptedanswers['+t+']" id="' + id + '" ng-keyup="sendResponse(\'' + id + '\', question)"\\>')
                            } else {
                                text = text.replace(/_\(.*?\)_/, ' <input type="text" value="' + responsearray[t] + '" disabled readonly> ')
                            }
                            blankids.push(id);
                        }
                        question.blankids = blankids;
                        question.prompt = text;
                        if(question.attemptedanswers&&blankids.length)
                            $scope.sendResponse(blankids[0], question);

                    }  else if (question.type === 'matching') {
                        question.imgdata = angular.fromJson(ReEncodeHtml.rawCorrection(question.extra).replace(/\n/g,''));

                        for (var x = 0; x < question.imgdata.matching.imagesCordinates.length; x++) {
                            question.imgdata.matching.imagesCordinates[x].textvalue =
                                question.imgdata.matching.imagesCordinates[x].textvalue.replace(/\&quot\;/g, '"');
                        }

                        //We will need to find the longest textvalue in order to tell the image creation
                        //quiz/crop the length to go to...
                        var extra = angular.fromJson(ReEncodeHtml.rawCorrection(question.extra).replace(/\n/g,''));

                        //Just making sure...
                        if (
                            (typeof extra !== 'undefined') &&
                            (typeof extra.matching !== 'undefined') &&
                            (typeof extra.matching.imagesCordinates !== 'undefined')
                        ) {
                            var imagesCordinates = extra.matching.imagesCordinates;
                        }
                        var longest = 0;
                        if (typeof imagesCordinates !== 'undefined') {
                            for (var x = 0; x < imagesCordinates.length; x++) {
                                if (imagesCordinates[x].textvalue.length > longest) {
                                    longest = imagesCordinates[x].textvalue.length;
                                }

                            }
                        }
                        question.longest = longest

                        if ((typeof question.response !== 'undefined') && (quiz.questions[0].response !== null)) {
                            if (question.response !== "")
                                question.responseData = angular.fromJson(question.response)
                        }if ((typeof question.attemptedanswers !== 'undefined') && (quiz.questions[0].attemptedanswers !== null)) {
                            question.response=question.attemptedanswers;
                            if(question.attemptedanswers!='')
                                question.responseData = angular.fromJson(question.attemptedanswers)


                        }
                    } else if (question.type === 'multipart') {
                        $scope.$watch('questions['+0+']',function(q,old_q){
                            if(q && q.answers && !angular.equals(q.answers,old_q.answers)){
                                var data = {};
                                data.question_id = q.question_id;
                                data.type = q.type;
                                data.answers = q.answers;
                                if (typeof q.multipartRadio === "number") {
                                    data.multipartRadio = 1;
                                }
                                $scope.sendResponse(data,q);
                            }
                        }, true);
                        question.multipartquestion = $sce.trustAsHtml(question.extra);
                        if ((typeof question.attemptedanswers === 'string') && (question.attemptedanswers !== 'null')) {
                            if(question.attemptedanswers!='')
                                question.answers = angular.fromJson(question.attemptedanswers);
                            question.response=question.attemptedanswers;
                        }else if((question.attemptedanswers === 'null')){
                            question.response=question.attemptedanswers;
                        }
                    } else if (question.type === 'klosequestions') {
                        var tmp = question.extra.studentview;
                        /*
                         Golabs 10th of April 2015
                         Adding in capture answer model for each input for questions.
                         *ALSO* see compiletemplate directive
                         */
                        tmp = tmp.replace(/u2265/g, '≥');
                        tmp = tmp.replace(/u2264/g, '≤');
                        tmp = tmp.replace(/id="(.*?)"/g, 'ng-model="question.answers.$1"');
                        tmp = tmp.replace(/&#39;/g, '\'');
                        tmp = tmp.replace(/&#34;/g, '"');
                        question.answers = {};
                        if (question.type === 'klosequestions') {
                            question.klosequestion = $sce.trustAsHtml(tmp + question.extra.img);
                        }


                    } else if (question.type === 'studentvideoresponse') {
                        if ((typeof question.attemptedanswers !== 'undefined') && (question.attemptedanswers !== null)) {
                            question.response=question.attemptedanswers
                            if(question.attemptedanswers!='')
                                var tmp = angular.fromJson(question.attemptedanswers);
                            if ((tmp !== 'undefined') && (tmp !== null)) {
                                question.thumbnailfilename = tmp.thumbnailfilename ? tmp.thumbnailfilename.replace(/\\/g, '') : '';
                                question.videofilename = tmp.videofilename ? tmp.videofilename.replace(/\\/g, '') : '';
                                question.video_comment = tmp.video_comment;
                            }
                        }
                    } else if (question.type === 'single' || question.type === 'truefalse') {
                        if(question.attemptedanswers!==undefined && question.attemptedanswers!==null){
                            var index = 0;
                            var found = false;
                            for(j in question.mapOptions  ){
                                if(question.mapOptions[j]==question.attemptedanswers){
                                    found=true;
                                    break;
                                }
                                index++;
                            }
                            if(found){
                                question.attemptedanswers=index;
                                question.response=index;

                            }else{
                                question.response=-1;
                            }

                        }


                    } else if (question.type === 'wordmatching') {
                        var extra = angular.fromJson(question.extra),
                            tmp1 = [],
                            tmp2 = [],
                            tmp3 = [],
                            tmp = {},
                            c = 0,
                            lettercounter = 0;
                        question.wordmatchingRight = [];
                        question.wordmatchingLeft = [];
                        question.wordmatchingall = {}
                        for (var id in extra) {
                            c = 0;
                            for (var value in extra[id]) {
                                if(['target','matches','tmpanswers'].indexOf(value)>=0)
                                    continue;
                                tmp = {};
                                if (!extra[id][value]) {
                                    lettercounter = 0;
                                    continue;
                                } else if (extra[id][value].length > lettercounter) {
                                    lettercounter = extra[id][value].length;
                                }
                                if (c === 1) {
                                    tmp.name = value;
                                    extra[id][value] = angular.element('<textarea />').html(extra[id][value]).text();
                                    tmp.value = $sce.trustAsHtml(extra[id][value]);
                                    tmp.testvalue = extra[id][value]
                                    question.wordmatchingall[tmp.name] = tmp.value;
                                    if (tmp.testvalue.match(/\w/)) {
                                        tmp.show = 'visible'
                                    }
                                    tmp1.push(tmp);
                                    c += 1;
                                    continue;
                                }
                                tmp.name = value;
                                extra[id][value] = angular.element('<textarea />').html(extra[id][value]).text();
                                tmp.value = $sce.trustAsHtml('<div style="width:100%">' + extra[id][value] + '</div>');
                                question.wordmatchingall[tmp.name] = tmp.value;
                                tmp2.push(tmp);
                                c += 1;
                            }

                        }
                        tmp1 = shufflearray(tmp1);
                        tmp2 = shufflearray(tmp2);
                        if (tmp1.length !== tmp2.length) {
                            var dif = tmp2.length - tmp1.length;
                            tmp = {}
                            tmp.show = 'hidden';
                            tmp.name = '';
                            tmp.value = 'hide';
                            tmp.noSafe = 1;
                            for (var x = 0; x < dif; x++) {
                                tmp1.push(tmp);
                            }
                        }
                        question.wordmatchingRight.push(tmp1);
                        question.wordmatchingLeft.push(tmp2);
                        delete question.extra;
                        $scope.lettercounter = (lettercounter * 9);

                        //Adding in our answers from the response if no answers.
                        if ((typeof question.response !== 'undefined') && (question.response !== null)) {
                            if (typeof question.answers === 'undefined') {
                                question.answers = angular.fromJson(question.response);
                            }
                        }
                        if(question.attemptedanswers!==undefined && question.attemptedanswers!==null){
                            question.response=question.attemptedanswers;
                            fillWordmatchWithAttempt(question.attemptedanswers,question);
                        }


                    }
                    question.htmlSafeprompt = $sce.trustAsHtml(question.prompt);

                    if (parseInt(question.pagebreak) === 1) {
                        quizpagepage += 1;
                    }
                    if (question.response === "") {
                        question.response = 1;
                    }

                }
                $scope.getRemainingAttempts = function(){
                    return Math.max(0,$scope.remainingAttempts);
                }
                function shufflearray (array) {
                    var currentIndex = array.length,
                        temporaryValue, randomIndex;

                    // While there remain elements to shuffle...
                    while (0 !== currentIndex) {

                        // Pick a remaining element...
                        randomIndex = Math.floor(Math.random() * currentIndex);
                        currentIndex -= 1;

                        // And swap it with the current element.
                        temporaryValue = array[currentIndex];
                        array[currentIndex] = array[randomIndex];
                        array[randomIndex] = temporaryValue;
                    }

                    return array;
                }
                $scope.createCKEditor = function(question) {
                    if (question.type === "essay") {
                        if (typeof question.CKEditor === 'undefined') {
                            var ck = CKEDITOR.replace("A" + question.id, {
                                toolbar: [{
                                    name: 'basicstyles',
                                    groups: ['basicstyles', 'cleanup'],
                                    items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat', 'Smiley']
                                }, {
                                    name: 'paragraph',
                                    groups: ['list', 'indent', 'blocks', 'align', 'bidi'],
                                    items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
                                }, {
                                    name: 'colors',
                                    items: ['TextColor', 'BGColor']
                                }, {
                                    name: 'tools',
                                    items: ['Maximize']
                                },

                                ],
                                filebrowserUploadUrl: '/uploadckeditormedia/'
                            });
                            ck.on('blur',function(evt){
                                var answer=ck.getData();
                                if (!answer.match(/\w/)) {
                                    answer = 'No Answer give by Student';
                                }
                                $scope.sendResponse(answer,question);
                            })

                            ck.on('paste', function(evt) {
                                var data = evt.data;
                                data.dataValue = E3replaceUrl(data.dataValue);
                                // Text could be pasted, but you transformed it into HTML so update that.
                                data.type = 'html';
                            });
                            question.CKEditor = 1;
                            if(question.attemptedanswers)
                                ck.setData(question.attemptedanswers);
                        }
                    }
                }


                $scope.multipleAnswers = function(question) {
                    var responsein = false;
                    /*
                     Golabs 1/03/2015
                     We are going to deal with multipe answers in a question. Start
                     */
                    response = '';
                    multiple_response = '';
                    for (var i = 0; i < question.options.length; i++) {
                        if (document.getElementById(question.id.toString() + question.options[i]).checked) {
                            response += question.mapOptions[i].toString() + ',';
                            multiple_response += i.toString() + ',';
                        }

                    }
                    response = response.replace(/,$/, '');
                    multiple_response = multiple_response.replace(/,$/, '');
                    /*
                     multipe answers in a question. End
                     */

                }





                $scope.setheight = function(question) {
                    if ((question.type === "matching") && (typeof question.imgdata.matching !== 'undefined')) {
                        return {
                            height: parseInt(question.imgdata.matching.matchedImage.height) + 150
                        };
                    }
                }

                $scope.reverseMatchHandler = function(question_id, name, index) {
                    var toremove = ['answer', 'dropindex', 'dropped'],
                        tmp = [],
                        question = _.find($scope.questions, function(question, optIdx) {
                            if (question.id == question_id) {
                                return question;
                            };
                        });
                    for (var i in toremove) {
                        delete $scope.pastQuestions[question_id][name].imagesCordinates[toremove[i]];
                    }
                    $('[name="' + name + '"]').attr('ui-draggable', true);
                    $('[name="' + name + '"]').attr('drag-channel', true);
                    $("#" + $scope.pastQuestions[question_id][name].dropname).attr('drop-channel', true);
                    $("#" + $scope.pastQuestions[question_id][name].dropname).attr('ui-on-Drop', true);
                    $("#" + $scope.pastQuestions[question_id][name].dropname).css('width', $scope.pastQuestions[question_id][name].width);
                    angular.element("#" + name).html($scope.pastQuestions[question_id][name].imgcontent);
                    for (var i = 0; i < question.dropnames.length; i++) {
                        if (name !== question.dropnames[i]) {
                            tmp.push(question.dropnames[i]);
                        }
                    }
                    question.dropnames = tmp;
                }

                $scope.dropSuccessHandler = function(question, name, index) {
                    if (typeof question.dropnames === 'undefined') {
                        question.dropnames = [];
                        $scope.pastQuestions = [question.id];
                        $scope.pastQuestions[question.id] = [];
                    }
                    if (question.dropnames.indexOf(question.dropname) < 0) {
                        $scope.pastQuestions[question.id][question.dropname] = {};
                        $scope.pastQuestions[question.id][question.dropname].dropname = question.dropname;
                        $scope.pastQuestions[question.id][question.dropname].imgcontent = angular.element("#" + question.dropname).html();
                        $scope.pastQuestions[question.id][question.dropname].imagesCordinates = question.imgdata.matching.imagesCordinates[index];
                        $scope.pastQuestions[question.id][question.dropname].width = $("#" + question.dropname).css('width');
                        question.imgdata.matching.imagesCordinates[question.dropindex].answer = question.imgdata.matching.imagesCordinates[index].name;
                        question.imgdata.matching.imagesCordinates[question.dropindex].answerStudent = question.imgdata.matching.imagesCordinates[index].textvalue;
                        question.imgdata.matching.imagesCordinates[index].dropindex = question.dropindex;
                        question.imgdata.matching.imagesCordinates[index].dropped = 1;
                        angular.element("#" + question.dropname).html($compile('<span title="Reset Placement" class="btn btn-sm btn-warning" ng-click="reverseMatchHandler(' + question.id + ', \'' + question.dropname + '\', ' + index + ')"><span class="fa fa-expand"></span></span>')($scope));
                        $('[name="' + name + '"]').appendTo($("#" + question.dropname));
                        $("#" + question.dropname).css('cursor', 'initial')
                        if (typeof question.zindex === 'undefined') {
                            question.zindex = 100;
                        } else {
                            question.zindex += 1;
                        }
                        $("#" + question.dropname).css('z-index', question.zindex)
                        $('[name="' + name + '"]').attr('ui-draggable', false);
                        $('[name="' + name + '"]').attr('drag-channel', false);
                        $("#" + question.dropname).attr('drop-channel', false);
                        $("#" + question.dropname).attr('ui-on-Drop', false);
                        question.dropnames.push(question.dropname);
                        $("#" + question.dropname).css('width', '');
                    }
                }

                $scope.dropSuccesswordmatching = function(question, name, index) {


                    if ((typeof question.answers === 'undefined') || (question.answers === null)) {
                        question.answers = [];
                        question.indexedAnswers = {};
                    }

                    var tmp = {}
                    tmp.name1 = name;
                    tmp.name2 = question.dropname;

                    question.answers.push(tmp);
                    question.indexedAnswers[question.dropindex] = question.answers.length - 1;

                    if(!$("#" + question.dropname).length) return;
                    if (!question.wordmatchingLeft[0][question.dropindex].matched) {
                        //testleft.remove();
                        question.wordmatchingLeft[0][question.dropindex].matched = true;
                    } else {
                        toastr.warning('Question already answered');
                        return
                    }


                    var front = $("#" + question.dropname).html().trim();
                    //Getting the width of our text for display
                    var donotremovesecret = document.getElementById("donotremovesecret");
                    donotremovesecret.innerHTML = $("#" + question.dropname).text().trim();
                    var frontWidth = (donotremovesecret.clientWidth + 10);
                    if (frontWidth > 500) frontWidth = 500

                    var back = $("#" + name).html().trim();
                    //$("#" +question.wordmatchingLeft).html(front + " " + back);
                    if (typeof $scope.dropped === 'undefined') {
                        $scope.dropped = {};
                    }
                    tmp = {}
                    tmp.name = question.wordmatchingLeft[0][question.dropindex].name;
                    tmp.value = question.wordmatchingLeft[0][question.dropindex].value;
                    var testleft = document.getElementById(question.wordmatchingLeft[0][question.dropindex].name)
                    question.wordmatchingLeft[0][question.dropindex].originalName = name;
                    question.wordmatchingLeft[0][question.dropindex].originalValue = $sce.trustAsHtml(back);
                    question.wordmatchingLeft[0][question.dropindex].name = ''
                    question.wordmatchingLeft[0][question.dropindex].value = $sce.trustAsHtml('<span>-</span>');
                    question.wordmatchingLeft[0][index].value = tmp.value;
                    question.wordmatchingLeft[0][index].name = tmp.name;
                    question.wordmatchingLeft[0][index].noSafe = 1;
                    //document.getElementById(question.dropname).style.visibility = 'hidden';
                    //document.getElementById(question.dropname).innerHTML  =
                    question.wordmatchingRight[0][question.dropindex].originalValue = $sce.trustAsHtml(front)
                    question.wordmatchingRight[0][question.dropindex].value = $sce.trustAsHtml('<div class="btn matched">' + front + "</div> " + '<div class="btn matched"> ' + back + '</div>');
                    document.getElementById(question.dropname).style.width = '90%'
                    document.getElementById(question.dropname).style.backgroundColor = '#ccc';
                    document.getElementById(question.dropname).style.borderColor = '#ccc';
                    document.getElementById(question.dropname).style.cursor = 'initial';
                    document.getElementById(question.dropname).style.marginLeft = '0px';
                    $('[name="' + question.dropname + '"]').removeAttr('drop-channel');
                    $('[name="' + question.dropname + '"]').removeAttr('ui-on-drop');
                    question.response = question.answers;
                    respondWordmatch(question)
                    // document.getElementById(name).style.visibility = 'hidden';
                }
                $scope.unMatch = function(question, index) {
                    question.answers.splice(question.indexedAnswers[index], 1);

                    var rightButton = document.getElementById(question.wordmatchingRight[0][index].name);
                    rightButton.style.width = "35%";
                    rightButton.style.backgroundColor = "#fff";
                    rightButton.style.marginLeft = '100px';
                    rightButton.style.cursor = 'help';
                    $(rightButton).attr('drop-channel', 'wordmatching');
                    $(rightButton).attr('ui-on-drop', "onDrop(question,'{{question.wordmatchingRight[0][$index].name}}',$index)");

                    question.wordmatchingRight[0][index].value = question.wordmatchingRight[0][index].originalValue
                    question.wordmatchingLeft[0][index].value = question.wordmatchingLeft[0][index].originalValue;
                    question.wordmatchingLeft[0][index].name = question.wordmatchingLeft[0][index].originalName;
                    delete question.wordmatchingLeft[0][index].matched
                    question.response = question.answers;
                    respondWordmatch(question)

                }

                function respondWordmatch(question){
                    if(!$scope.quizStarted) return;
                    var data = {};
                    data.answers = question.answers;
                    data.question_id = question.id;
                    data.type = question.type;

                }
                $scope.onDrop = function(question, name, index) {
                    question.dropname = name
                    question.dropindex = index
                }



                $scope.newPost = function(question) {
                    reply_to_id = 0;
                    $scope.allow_video_post = 1;
                    $scope.allow_upload_post = false;

                    $scope.submitting = false;
                    $scope.showSaving = false;
                    $scope.showSubmit = false;
                    $("#submitted").addClass("ng-hide");
                    $(".modal").draggable({
                        handle: ".modal-header"
                    });

                    $scope.reply_to_id = reply_to_id;
                    $scope.video_comment = '';
                    document.getElementById('comments').value = '';
                    $scope.check_is_private = 0;
                    $scope.currentQuestion = question

                    if (typeof CKEDITOR.instances.commentsText === "object") {
                        $scope.video_comment = CKEDITOR.instances.commentsText.getData();
                        $scope.text_comment = CKEDITOR.instances.commentsText.getData();
                        $scope.commentsText = '';
                    }

                    $scope.post = Post.get({
                        postId: 'new'
                    }, function(post) {
                        $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                        $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                        $scope.videoFileName = post.file_name;
                        $scope.submitting = false;
                        $scope.showSaving = false;
                        $scope.showSubmit = false;
                    });
                }

                $scope.submitPost = function (postType) {
                    postType = typeof postType !== 'undefined' ? postType : 0;
                    //console.log($scope.showSubmit);
                    $scope.submitting = true;
                    $scope.showSaving = true;
                    $scope.showSubmit = false;
                    //console.log($scope.showSubmit);

                    if (!angular.isDefined($scope.reply_to_id)) {
                        $scope.reply_to_id = 0;
                    }
                    $scope.flushCounterFortimer = 0;
                    if (videoFlushed != true && postType == 'video') {

                        $scope.videoFlushedTimer = $interval(function () {
                            $scope.flushCounterFortimer++;
                            //console.log(videoFlushed);
                            if (videoFlushed || $scope.flushCounterFortimer > 10) {

                                if (videoFlushed == true) {
                                    //console.log('about to submit');
                                    $scope.finallySubmitPost();
                                } else {
                                    $scope.submitting = false;
                                    $scope.showSaving = false;
                                    $scope.showSubmit = true;
                                    toastr.warning('If you already recorded a video, wait a few moments and try submitting again.');
                                }
                                $interval.cancel($scope.videoFlushedTimer);
                            }
                        }, 500);

                    } else {

                        $scope.finallySubmitPost();

                    }


                }

                $scope.finallySubmitPost = function () {
                    $scope.video_comment = document.getElementById('comments').value;

                    $scope.post.contentid = $scope.contentid;
                    $scope.post.videoFileName = $scope.videoFileName;
                    $scope.post.reply_to_id = $scope.reply_to_id;
                    $scope.post.video_comment = $scope.video_comment;
                    $scope.post.check_is_private = $scope.check_is_private;

                    if (typeof CKEDITOR.instances.commentsText === "object") {
                        //$scope.video_comment = CKEDITOR.instances.commentsText.getData();
                        $scope.post.video_comment = CKEDITOR.instances.commentsText.getData();
                        $scope.commentsText = '';
                    }
                    if ($scope.post.video_comment == "") $scope.post.video_comment = $scope.video_comment;

                    $scope.post.$quizSubmit(function (post) {

                        if (post.message == 'successful') {

                            $scope.videoExistsTimer = $interval(function () {
                                $http.head(post.videofilename).then(function (response) {
                                    $interval.cancel($scope.videoExistsTimer);
                                    $scope.submitting = false;
                                    $scope.showSaving = false;
                                    $scope.showSubmit = false;
                                    //$scope.$apply();
                                    videoFlushed = false;
                                    $scope.currentQuestion.videofilename = post.videofilename;
                                    $scope.currentQuestion.thumbnailfilename = post.thumbnailfilename;
                                    $scope.currentQuestion.video_comment = $scope.video_comment;
                                    $scope.currentQuestion.videoCommentSafe = $sce.trustAsHtml($scope.video_comment);

                                    $scope.$root.$emit('NavRootUpdate');
                                    $scope.currentQuestion.answered = 1;
                                    $scope.currentQuestion.is_correct = -1;
                                    $('#basicFileUploadModal').modal('hide');
                                }, function (response) { });

                            }, 1000);



                        } else {
                            $scope.submitting = false;
                            $scope.showSaving = false;
                            $scope.showSubmit = false;
                            toastr.error(post.message);
                        }
                    });
                    $scope.$root.$emit('NavRootUpdate');
                }


                $scope.multipartRadio = function(question, radioValue, name) {
                    question.multipartRadio = 1;
                    question.answers = {};
                    question.answers[name] = radioValue;
                    question.response=question.answers;
                }

                $scope.checktoshowF = function(index, currentShow) {

                    if (angular.isDefined($scope.allMultipa)) {
                        if (currentShow === index) {
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return true;
                    }
                }

                $scope.FillQuiz = function(by) {
                    triggerclicksnow();
                }

                $scope.Trimthis = function(text) {
                    return text.replace(/<.*?>|&\w+\;/g, '').replace(/\W/g, '');
                }



                $scope.isidrandom = function(question) {
                    if ((typeof question.randomQuestion === "number") && (typeof $scope.randomquestions !== 'undefined')) {
                        //Golabs we hide on true.
                        for (var i = 0; i < $scope.randomquestions.length; i++) {
                            if (question.id === $scope.randomquestions[i].question_id) {
                                return false;
                            }
                        }
                        return true;
                    }

                    return false;
                }
            }
        }


    }

])