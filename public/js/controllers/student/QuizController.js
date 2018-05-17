appControllers.controller('QuizController', ['$rootScope', '$interval','$q', '$http','$scope', '$sce', 'Quiz', 'Nav', '$compile', 'Currentpageid', 'QuizData', 'Post', 'ReEncodeHtml', 'mathJaxConvert','StudentVideoRecorder',
    function ($rootScope, $interval,$q, $http,$scope, $sce, Quiz, Nav, $compile, Currentpageid, QuizData, Post, ReEncodeHtml, mathJaxConvert,StudentVideoRecorder) {
        //console.log(angular.toJson($rootScope.$state));

        $scope.quizid = $rootScope.$stateParams.quizId;
        $scope.quizStarted = false;
        $scope.quizEnded = false;
        $scope.quizTitle = '';
        $scope.quizScore = 0;
        $scope.quizDescription = '';
        $scope.isUnlimitedAttempts = true;
        $scope.allowedTakes = null;
        $scope.attemptsCompleted = 0;
        $scope.hasMoreAttempts = true;
        $scope.isTimed = false;
        $scope.isQuizDescriptionAvailable = false;
        $scope.timeLeftString = '';
        $scope.isPasswordProtected = false;
        $scope.password = null;
        $scope.remainingAttempts = 0;
        $rootScope.pagename = '';
        $scope.data = {};
        $scope.submitting = false;
        $scope.showSaving = false;
        $scope.showSubmit = false;
        $scope.data.responseQueue={};

        $scope.addCK = function(question){
            question.ck = 1;
            $scope.ckeditorOptions = {
                toolbar: 'essay'
            }
        }
        $scope.uCanTrust = function(text){
            return $sce.trustAsHtml(text);
        }
        var shufflearray = function(array) {
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


        if (typeof $rootScope.currentPage != 'undefined') {
            // If the ENG checkbox is checked, make the title be in English, otherwise, translate the title
            if (document.getElementById('english-language-selector').checked) {
                $rootScope.pagename = $rootScope.currentPage.label;
            } else {
                $rootScope.pagename = $rootScope.currentPage.subtitle;
            }
        }
        $scope.trustAsHtml = function(html) {
            if (typeof html === 'undefined') {
                html = '';
            }
            if (html !== '') {
                return $sce.trustAsHtml(html.trim())
            }
            return $sce.trustAsHtml(html);
        };
        $scope.arrayRandomizer = function(arrayToRandomize) {
            //randomize our array
            for (var i = arrayToRandomize.length - 1; i >= 0; i--) {

                var randomIndex = Math.floor(Math.random() * (i + 1));
                var itemAtIndex = arrayToRandomize[randomIndex];
                arrayToRandomize[randomIndex] = arrayToRandomize[i];
                arrayToRandomize[i] = itemAtIndex;
            }
            return arrayToRandomize;
        };

        // Get the data for this quiz
        $scope.getquizzes = function(Quiz, startQuiz) {
            $scope.randomizeOptions = function(question,skip) {
                var options = question.options;
                var oldOptions = _.clone(question.options);
                if(!skip)
                    $scope.arrayRandomizer(options);
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
            $scope.gettingQuiz=true;
            Quiz.get({
                quizId: $scope.quizid,
                fromListId: QuizData.getId(),
                starting:startQuiz?1:undefined
            }, function(quiz) {
                $scope.pageOptions = quiz.meta;
                if(quiz.new_post_text)
                    $scope.pageOptions.custom_new_post_text = quiz.new_post_text;
                $scope.data.responseQueue={};
                $scope.gettingQuiz=false;
                delete $scope.loadingPrevious;
                $scope.starting=0;
                if (!quiz.questions)
                    return;
                $scope.isSurvey = quiz.isSurvey;
                $scope.questionsPerPage = parseInt(quiz.questionsPerPage);
                $scope.quizPagination = {
                    totalNumberOfQuestions : quiz.questions.length,
                    questionsPerPage : $scope.questionsPerPage,
                    currentPage : 0,
                    showNav : quiz.questions.length>$scope.questionsPerPage && $scope.questionsPerPage > 0
                };
                $scope.waitingForGrade = quiz.waitingForGrade
                $scope.randomquiz_id = quiz.quiz_id;
                var matchingdecoded;
                //console.log(angular.toJson(quiz));
                var quizpagepage = 0;
                for (var i = 0; i < quiz.questions.length; i++) {

                    if (quiz.questions[i].is_correct == -1) {
                        $scope.waitingForGrade = true;
                    }

                    quiz.questions[i].prompt = ReEncodeHtml.restoreHTML(quiz.questions[i].prompt);

                    //if (typeof quiz.questions[i].extra !== 'undefined'){
                    //quiz.questions[i].extra = ReEncodeHtml.restoreHTML(quiz.questions[i].extra);
                    //}

                    quiz.questions[i].options = angular.fromJson(quiz.questions[i].options);
                    //Golabs ReEncodeHtml Start
                    if ((angular.isDefined(quiz.questions[i].options)) && (typeof quiz.questions[i].options === 'object'))
                        angular.forEach(quiz.questions[i].options, function(value, key) {
                            quiz.questions[i].options[key] = ReEncodeHtml.restoreHTML(value);
                        });


                    $scope.randomizeOptions(quiz.questions[i],quiz.questions[i].type=='truefalse');
                    if (quiz.questions[i].is_correct >= 1) {
                        quiz.questions[i].isCorrect = true;
                    }
                    if (quiz.questions[i].attemptedanswers != null&&quiz.questions[i].attemptedanswers !== undefined) {
                        if (quiz.questions[i].type == 'multiple'){
                            if(quiz.questions[i].attemptedanswers!=''){
                                quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                                $scope.optionsSelected(quiz.questions[i]);
                            }

                            else
                                quiz.questions[i].response=',';
                        }


                        //quiz.questions[i].optionSelected = quiz.questions[i].response;


                    }
                    if (quiz.questions[i].type === 'essay') {
                        if(quiz.questions[i].attemptedanswers!==undefined && quiz.questions[i].attemptedanswers!==null){
                            var json;
                            try{
                                json = JSON.parse(quiz.questions[i].attemptedanswers);
                            }catch(e){}
                            if(json){
                                quiz.questions[i].response = json.text;
                                quiz.questions[i].uploadedFile = json.uploadedFile
                            }else
                                quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                            quiz.questions[i].htmlSafeoption = $sce.trustAsHtml(quiz.questions[i].response);
                        }

                    }
                    if ((quiz.questions[i].type === 'oneword')) {
                        if(quiz.questions[i].isCorrect === true)
                            quiz.questions[i].displayoneword = ' The Correct word is : "' + quiz.questions[i].options[0] + '"';
                        if(quiz.questions[i].attemptedanswers!==undefined &&quiz.questions[i].attemptedanswers!==null){
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers
                            quiz.questions[i].text=quiz.questions[i].attemptedanswers
                        }
                    } else if (quiz.questions[i].type === 'blank') {
                        //var text = quiz.questions[i].prompt.replace(/<[a-z].*?>|<\/[a-z].*?>/gi, '');
                        var text = quiz.questions[i].prompt;
                        var tmp = text.match(/_\(.*?\)_/g),
                            id = '',
                            blankids = [];
                        if(quiz.questions[i].attemptedanswers!==undefined && quiz.questions[i].attemptedanswers!==null){
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                            quiz.questions[i].optionSelected=quiz.questions[i].attemptedanswers;
                            quiz.questions[i].attemptedanswers=quiz.questions[i].attemptedanswers.split(',')
                        }else quiz.questions[i].attemptedanswers={};
                        if (typeof quiz.questions[i].response === "string") {
                            var responsearray = quiz.questions[i].response.split(',');
                        }

                        for (var t = 0; t < tmp.length; t++) {
                            id = 'id' + quiz.questions[i].question_id.toString() + t;
                            if (typeof quiz.questions[i].response !== "string") {
                                text = text.replace(/_\(.*?\)_/, '<input type="text" ng-model="question.attemptedanswers['+t+']" id="' + id + '" ng-keyup="sendResponse(\'' + id + '\', question)"\\>')
                            } else {
                                text = text.replace(/_\(.*?\)_/, ' <input type="text" value="' + responsearray[t] + '" disabled readonly> ')
                            }
                            blankids.push(id);
                        }
                        quiz.questions[i].blankids = blankids;
                        quiz.questions[i].prompt = text;
                        if(quiz.questions[i].attemptedanswers&&blankids.length && quiz.showPrevious)
                            $scope.sendResponse(blankids[0], quiz.questions[i]);

                    }  else if (quiz.questions[i].type === 'matching') {
                        quiz.questions[i].imgdata = angular.fromJson(ReEncodeHtml.rawCorrection(quiz.questions[i].extra).replace(/\n/g,''));

                        for (var x = 0; x < quiz.questions[i].imgdata.matching.imagesCordinates.length; x++) {
                            quiz.questions[i].imgdata.matching.imagesCordinates[x].textvalue =
                                quiz.questions[i].imgdata.matching.imagesCordinates[x].textvalue.replace(/\&quot\;/g, '"');
                        }

                        //We will need to find the longest textvalue in order to tell the image creation
                        //quiz/crop the length to go to...
                        var extra = angular.fromJson(ReEncodeHtml.rawCorrection(quiz.questions[i].extra).replace(/\n/g,''));

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
                        quiz.questions[i].longest = longest

                        if ((typeof quiz.questions[i].response !== 'undefined') && (quiz.questions[0].response !== null)) {
                            if (quiz.questions[i].response !== "")
                                quiz.questions[i].responseData = angular.fromJson(quiz.questions[i].response)
                        }if ((typeof quiz.questions[i].attemptedanswers !== 'undefined') && (quiz.questions[0].attemptedanswers !== null)) {
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                            if(quiz.questions[i].attemptedanswers!='')
                                quiz.questions[i].responseData = angular.fromJson(quiz.questions[i].attemptedanswers)


                        }
                    } else if (quiz.questions[i].type === 'multipart') {
                        $scope.$watch('questions['+i+']',function(q,old_q){
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
                        quiz.questions[i].multipartquestion = $sce.trustAsHtml(quiz.questions[i].extra);
                        if ((typeof quiz.questions[i].attemptedanswers === 'string') && (quiz.questions[i].attemptedanswers !== 'null')) {
                            if(quiz.questions[i].attemptedanswers!='')
                                quiz.questions[i].answers = angular.fromJson(quiz.questions[i].attemptedanswers);
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                        }else if((quiz.questions[i].attemptedanswers === 'null')){
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                        }
                    } else if (quiz.questions[i].type === 'klosequestions') {
                        var tmp = quiz.questions[i].extra.studentview;
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
                        quiz.questions[i].answers = {};
                        if (quiz.questions[i].type === 'klosequestions') {
                            quiz.questions[i].klosequestion = $sce.trustAsHtml(tmp + quiz.questions[i].extra.img);
                        }


                    } else if (quiz.questions[i].type === 'studentvideoresponse') {
                        if ((typeof quiz.questions[i].attemptedanswers !== 'undefined') && (quiz.questions[i].attemptedanswers !== null)) {
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers
                            if(quiz.questions[i].attemptedanswers!='')
                                var tmp = angular.fromJson(quiz.questions[i].attemptedanswers);
                            if ((tmp !== 'undefined') && (tmp !== null)) {
                                quiz.questions[i].thumbnailfilename = tmp.thumbnailfilename ? tmp.thumbnailfilename.replace(/\\/g, '') : '';
                                quiz.questions[i].videofilename = tmp.videofilename ? tmp.videofilename.replace(/\\/g, '') : '';
                                quiz.questions[i].video_comment = tmp.video_comment;
                            }
                        }
                    } else if (quiz.questions[i].type === 'single' || quiz.questions[i].type === 'truefalse') {
                        if(quiz.questions[i].attemptedanswers!==undefined && quiz.questions[i].attemptedanswers!==null){
                            var index = 0;
                            var found = false;
                            for(j in quiz.questions[i].mapOptions  ){
                                if(quiz.questions[i].mapOptions[j]==quiz.questions[i].attemptedanswers){
                                    found=true;
                                    break;
                                }
                                index++;
                            }
                            if(found){
                                quiz.questions[i].attemptedanswers=index;
                                quiz.questions[i].response=index;
                                if(quiz.showPrevious)
                                    $scope.sendResponse(index,quiz.questions[i],quiz.questions[i].options[index])
                            }else{
                                quiz.questions[i].response=-1;
                            }

                        }


                    } else if (quiz.questions[i].type === 'wordmatching') {
                        var extra = angular.fromJson(quiz.questions[i].extra),
                            tmp1 = [],
                            tmp2 = [],
                            tmp3 = [],
                            tmp = {},
                            c = 0,
                            lettercounter = 0;
                        quiz.questions[i].wordmatchingRight = [];
                        quiz.questions[i].wordmatchingLeft = [];
                        quiz.questions[i].wordmatchingall = {}
                        for (var id in extra) {
                            c = 0;
                            for (var value in extra[id]) {
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
                                    quiz.questions[i].wordmatchingall[tmp.name] = tmp.value;
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
                                quiz.questions[i].wordmatchingall[tmp.name] = tmp.value;
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
                        quiz.questions[i].wordmatchingRight.push(tmp1);
                        quiz.questions[i].wordmatchingLeft.push(tmp2);
                        delete quiz.questions[i].extra;
                        $scope.lettercounter = (lettercounter * 9);

                        //Adding in our answers from the response if no answers.
                        if ((typeof quiz.questions[i].response !== 'undefined') && (quiz.questions[i].response !== null)) {
                            if (typeof quiz.questions[i].answers === 'undefined') {
                                quiz.questions[i].answers = angular.fromJson(quiz.questions[i].response);
                            }
                        }
                        if(quiz.questions[i].attemptedanswers!==undefined && quiz.questions[i].attemptedanswers!==null){
                            quiz.questions[i].response=quiz.questions[i].attemptedanswers;
                            fillWordmatchWithAttempt(quiz.questions[i].attemptedanswers,quiz.questions[i]);
                        }


                    }
                    quiz.questions[i].htmlSafeprompt = $sce.trustAsHtml(quiz.questions[i].prompt);
                    quiz.questions[i].currentpage = quizpagepage;
                    if (parseInt(quiz.questions[i].pagebreak) === 1) {
                        quizpagepage += 1;
                    }
                    if (quiz.questions[i].response === "") {
                        quiz.questions[i].response = 1;
                    }

                }
                $scope.radioModel = '';
                $scope.currentPage = 0;

                if (quizpagepage === 0) {
                    $scope.pagebreaks = false;
                } else {
                    $scope.pagebreaks = true;
                }

                //If we have MathsJax start
                for (var i = 0; i < quiz.questions.length; i++) {
                    /*
                     Golabs
                     If angular code in question can Cause the browser to chrash.
                     */
                    if ( quiz.questions.prompt && quiz.questions.prompt.match(/class="ng-scope"|ng-\w+="|<script/)) {
                        quiz.questions.prompt = "<span style='color:red;font-weight:bold;font-size:x-large'>Illegal code found in Question remove please report</span>";
                    }
                    quiz.questions[i] = mathJaxConvert.parseQuestion(quiz.questions[i]);
                }
                //If we have Mathsjax end

                $scope.questionNumber = quiz.questions.length - 1;
                $scope.questions = quiz.questions;
                if (typeof quiz.randomquestions === "object")
                    $scope.randomquestions = quiz.randomquestions;
                $scope.quiz = quiz;

                // $scope.randomQuestionSetup(quiz);
                var testallMulti = 1;
                if (typeof $scope.randomquestions !== 'undefined')
                    for (var i = 0; i < $scope.randomquestions.length; i++) {

                        if ($scope.randomquestions[i].prompt.match(/class="ng-scope"|ng-\w+="|<script/)) {

                            //$scope.randomquestions[i].prompt = $scope.randomquestions[i].prompt.replace(/\<\w.*?\>/g,'');
                            //$scope.randomquestions[i].prompt = "<span style='color:red'>Illegal code found in Question</span>";
                        }

                        $scope.randomquestions[i] = mathJaxConvert.parseQuestion($scope.randomquestions[i]);
                        if ($scope.randomquestions[1].type != 'multipart') {
                            testallMulti = 0;
                        }
                        $scope.randomquestions[i].htmlSafeprompt = $sce.trustAsHtml($scope.randomquestions[i].prompt);
                    }

                if (typeof $scope.questions !== 'undefined')
                    for (var i = 0; i < $scope.questions.length; i++) {
                        if ($scope.questions[i].type != 'multipart') {
                            testallMulti = 0;
                        } else if (quiz.questions[i].type !== 'blank') {
                            $scope.questions[i].htmlSafeprompt = $sce.trustAsHtml($scope.questions[i].prompt);
                        }
                    }

                if (testallMulti === 1) {
                    $scope.allMultipa = true;
                }

                if (typeof $scope.randomquestions !== 'undefined')
                    $scope.totalQuestions = $scope.randomquestions.length;
                else
                    $scope.totalQuestions = quiz.questions.length;
                if (quiz.maxPoints)
                    $scope.maxPoints = quiz.maxPoints || $scope.totalQuestions;

                $scope.quizTitle = quiz.quizTitle;
                if ((typeof quiz.teacher_true == 'boolean') && (quiz.teacher_true)) {
                    $scope.teacher_true = true;
                }
                $rootScope.pagename = quiz.pagename;
                if (quiz.quizDescription !== null) {
                    $scope.quizDescription = quiz.quizDescription;
                    $scope.isQuizDescriptionAvailable = true;
                }
                $scope.quizDataReady = true;
                if (quiz.allowed_takes !== null) {
                    $scope.allowedTakes = parseInt(quiz.allowed_takes);
                    // If 0 takes was selected, this means unlimited takes.
                    if ($scope.allowedTakes == 0) {

                    } else {
                        $scope.isUnlimitedAttempts = false;
                        $scope.remainingAttempts = parseInt(quiz.allowed_takes);
                        if (quiz['attempts_completed'] !== null) {
                            $scope.attemptsCompleted = parseInt(quiz['attempts_completed']);
                            $scope.remainingAttempts -= $scope.attemptsCompleted;
                            if ($scope.attemptsCompleted >= $scope.allowedTakes && quiz.isStudent) {
                                $scope.hasMoreAttempts = false;
                            }
                        }
                    }
                }
                if (quiz.time_limit !== null) {
                    if (quiz.time_limit > 0) {
                        $scope.timeLimit = quiz.time_limit;
                        $scope.remainingAttempts = true;
                        $scope.isTimed=true;
                        $scope.quizTimer = 'Starting timer...';
                    }
                }

                if (quiz.password != null && quiz.password != "" && !$scope.insertedCorrectAnswer) {
                    $scope.password = quiz.password;
                    $scope.isPasswordProtected = true;
                }

                if (quiz.score != null) {
                    if (!quiz.score % 1 != 0) {
                        quiz.score = parseInt(quiz.score);
                    }

                    $scope.quizScore = quiz.score;
                }
                if (startQuiz === 1) {
                    $scope.startQuiznow();
                    quiz.is_finished=0;
                }
                if (quiz.is_finished == 1) {
                    // $scope.finishQuiz();
                    $scope.quizEnded = true;
                    $scope.$root.ended=true;
                }else{
                    $scope.quizEnded = false;
                    $scope.$root.ended=false;
                }
                quiz.showPrevious = false;
                if(quiz.meta.auto_start == 1 && !$scope.showRetake()){
                    $scope.startQuiz()
                }



            });
        }
        $scope.Quiz = Quiz;
        $scope.getquizzes(Quiz, 0);
        $scope.getRemainingAttempts = function(){
            return Math.max(0,$scope.remainingAttempts);
        }
        $scope.createCKEditor = function(question) {
            if (question.type === "essay") {
                if (typeof question.CKEditor === 'undefined') {
                    var ck = CKEDITOR.replace("A" + question.question_id, {
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

        $scope.showStandards = function(){
            return $scope.quiz &&
                $scope.quiz.show_objectives &&
                $scope.quiz.objectives.length &&
                $scope.quizEnded &&
                $scope.quiz.questions.length &&
                $scope.quiz.questions[0].is_correct!== undefined;
        }
        $scope.objectivePoints = function(objective){
            return _.reduce(
                $scope.quiz.questions,
                function(memo,q){
                    if(objective.questions.indexOf(q.quizQuestionId)>=0)
                        return memo+ Math.max(0,q.is_correct);
                    return memo;
                },
                0
            )
        }
        $scope.objectiveMaxPoints = function(objective){
            return _.reduce(
                $scope.quiz.questions,
                function(memo,q){
                    if(objective.questions.indexOf(q.quizQuestionId)>=0)
                        return memo+ q.maxPoints;
                    return memo;
                },
                0
            )
        }
        $scope.objectivePercentage = function(objective){
            return parseInt(100*$scope.objectivePoints(objective)/$scope.objectiveMaxPoints(objective))
        }

        /*
         Golabs 20/01/2015 Amended
         We send back the answer if it is write or wrong we then
         fill in the question scope and the quizScore.
         */
        $scope.sendResponse = function(response, question, multiple_response,isFinishing) {
            if(!$scope.quiz) return;

            if(!$scope.quiz.canReturn){
                $scope.data.responseQueue[question.id]=([angular.copy(response),question,angular.copy(multiple_response)]);
            }
            if (question.type === "essay" && question.extra && question.extra.uploadedFile ) {
                response = JSON.stringify({'text':response,file:question.extra.uploadedFile});
            }
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

            }
            if (angular.isDefined(multiple_response)) {
                question.optionSelected = multiple_response;
            }


            var submitParams = {
                quiz_id: parseInt($scope.quizid),
                response: response,
                question_id: parseInt(question.question_id),
                randomquiz_id: $scope.randomquiz_id,
                quizQuestionId: question.quizQuestionId,
                fromRandomGroup: question.fromRandomGroup,
                attempt_id:$scope.attempt_id,
                isFinishing:isFinishing
            };
            if(!$scope.quizStarted)return;
            return Quiz.submit(submitParams, function(response) {
                $scope.quizScore = response.newScore;
                if (typeof response.fully_correct !== 'undefined') {
                    question.fully_correct = response.fully_correct;
                }
                question.is_correct = response.is_correct;
                question.isCorrectPartially = response.isCorrectPartially;
                if ((parseInt(response.is_correct) >= 1 && !response.isCorrectPartially) || response.isCorrect) {
                    question.isCorrect = true;
                } else {
                    question.isCorrect = false;
                }
                question.response = 1;

                if ((question.type === 'oneword') && (question.isCorrect === true)) {
                    question.displayoneword = ' The Correct word is : "' + question.options[0] + '"';
                }
            }).$promise;
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
                if (jQuery('#' + question.question_id.toString() + '_' + i + ' input')[0].checked) {
                    response += question.mapOptions[i].toString() + ',';
                    multiple_response += i.toString() + ',';
                }

            }
            response = response.replace(/,$/, '');
            multiple_response = multiple_response.replace(/,$/, '');
            /*
             multipe answers in a question. End
             */
            $scope.sendResponse(response, question, multiple_response);
        }

        $scope.startQuiz = function() {
            $scope.currentpagebreak = 0;
            $scope.starting = 1;
            $scope.getquizzes($scope.Quiz, 1);
            Currentpageid.RecordingPageAccess($rootScope.$stateParams.quizId);
        }

        //$scope.randomQuestionSetup($scope.quiz);
        $scope.maxTime = function() {
            return parseInt($scope.timeLimit) * 60;
        }
        $scope.startQuiznow = function() {
            for (var i = 0; i < $scope.questions.length; i++) {
                if (typeof $scope.questions[i].isCorrect === "boolean")
                    delete $scope.questions[i].isCorrect;

                if (typeof $scope.questions[i].response !== "undefined")
                    delete $scope.questions[i].response;
            }

            /*
             Golabs we are clearing our response table for this quizid and user.
             */
            Quiz.start({
                quiz_id: parseInt($scope.quizid),
                currentCourseID: $rootScope.currentCourseID
            },function(response){
                $scope.attempt_id  = response.attempt_id
                $scope.timeRemaining = $scope.maxTime();
                $scope.quizStarted = true;
                $scope.$broadcast('quizStarted');
                $scope.$root.started=true;
            },function(error){
                $scope.error = error.error;
            });

        }

        $scope.setheight = function(question) {
            //if ((question.type === "matching") && (typeof question.imgdata.matching !== 'undefined')) {
            //    return {
            //        height: parseInt(question.imgdata.matching.matchedImage.height) + 150
            //    };
            //}
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
            $("#" + $scope.pastQuestions[question_id][name].dropname).attr('drop-channel', 'here');
            $("#" + $scope.pastQuestions[question_id][name].dropname).attr('ui-on-Drop', true);
            $("#" + $scope.pastQuestions[question_id][name].dropname).css('width', $scope.pastQuestions[question_id][name].width);
            if($scope.pastQuestions[question_id][name].hasOpacity50){
                $("#" + question.dropname).addClass('opacity50');
            }
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
                if(!$scope.pastQuestions)
                    $scope.pastQuestions = {};
                $scope.pastQuestions[question.id] = [];
            }
            if (question.dropnames.indexOf(question.dropname) < 0) {
                if(!$scope.pastQuestions[question.id]) $scope.pastQuestions[question.id] = []
                $scope.pastQuestions[question.id][question.dropname] = {};
                $scope.pastQuestions[question.id][question.dropname].dropname = question.dropname;
                $scope.pastQuestions[question.id][question.dropname].imgcontent = angular.element("#" + question.dropname).html();
                $scope.pastQuestions[question.id][question.dropname].imagesCordinates = question.imgdata.matching.imagesCordinates[index];
                $scope.pastQuestions[question.id][question.dropname].width = $("#" + question.dropname).css('width');
                $scope.pastQuestions[question.id][question.dropname].hasOpacity50 = $("#" + question.dropname).hasClass('opacity50');
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
                $("#" + question.dropname).removeClass('opacity50');
                question.dropnames.push(question.dropname);
                //$("#" + question.dropname).css('width', '');
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
            respondWordmatch(question)

        }
        function fillWordmatchWithAttempt(response,question){
            try{
                var response = JSON.parse(response);
                _.each(response,function(pair){
                    var iLeft = 0;
                    _.find(question.wordmatchingLeft[0],function(p){
                        iLeft++;
                        return p.name==pair.name1;
                    })
                    iLeft--;
                    var iRight=0;
                    _.find(question.wordmatchingRight[0],function(p){
                        iRight++;
                        return p.name==pair.name2;
                    })
                    iRight--;
                    question.dropname = pair.name2
                    question.dropindex = iRight
                    $scope.dropSuccesswordmatching(question,pair.name1,iLeft,false);
                })
            }catch(e){

            }
        }
        function respondWordmatch(question){
            if(!$scope.quizStarted) return;
            var data = {};
            data.answers = question.answers;
            data.question_id = question.question_id;
            data.type = question.type;
            $scope.sendResponse(data,question);
        }
        $scope.onDrop = function(question, name, index) {
            question.dropname = name
            question.dropindex = index
        }

        /*
         Golabs 20/04/2015
         When next page button is clicked.

         */
        $scope.nextpage = function() {
            $scope.currentPage += 1;
        }

        $scope.previouspage = function() {
            $scope.currentPage -= 1;
        }
        $scope.p={
            scope:$scope
        }
        $scope.studentVideoRecorder = StudentVideoRecorder;
        $scope.togglePostBox = function(owner,show){
            if($scope.postBoxOwner && !angular.equals($scope.postBoxOwner,owner)){
                $scope.postBoxOwner.showTextBox=false;
            }
            $scope.postBoxOwner = owner;
            if(show!==undefined)
                $scope.postBoxOwner.showTextBox = show;
            else
                $scope.postBoxOwner.showTextBox = !$scope.postBoxOwner.showTextBox;
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

            $scope.check_is_private = 0;
            $scope.currentQuestion = question

            if (typeof CKEDITOR.instances.commentsText === "object") {
                $scope.video_comment = CKEDITOR.instances.commentsText.getData();
                $scope.text_comment = CKEDITOR.instances.commentsText.getData();
                $scope.commentsText = '';
            }
            $scope.post = Post.get({
                postId: 'new'
            });

        };
        $scope.$watch('studentVideoRecorder.videoData',function(videoData){
            if(videoData){
                $scope.video_comment=videoData.videoComment;
                $scope.post.videoFileNameReady=videoData.videoFile;
                $scope.post.videoThumbnailFileNameReady=videoData.videoThumbnailFile;
                if(videoData.upload){
                    videoFlushed=true;
                }
                $scope.submitPost('video');
            }
        })
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
                    $scope.currentQuestion.showTextBox=false;
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

        }

        $scope.chengednow = function() {
            alert(1);
        }
        function multipartChanged(question){

        }
        $scope.multipartRadio = function(question, radioValue, name) {
            question.multipartRadio = 1;
            question.answers = {};
            question.answers[name] = radioValue;
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

        $scope.finishQuiz = function(reallyFinish) {
            var extra = [];
            var data = {};
            for (var i = 0; i < $scope.questions.length; i++) {
                data = {};
                extra.quizQuestionId = $scope.questions[i].quizQuestionId


                if ($scope.questions[i].type === "essay") {
                    try {
                        data.answer = $('#essay'+$scope.questions[i].question_id)[0].value;
                        if(!data.answer)
                            data.answer = $('#essay'+$scope.questions[i].question_id)[0].innerHTML;
                    } catch (err) {
                        data.answer = 'No Answer give by Student';
                    }

                    if (!data.answer.match(/\w/)) {
                        data.answer = 'No Answer give by Student';
                    }
                    $scope.questions[i].myanswer = data.answer;
                    data.question_id = $scope.questions[i].question_id;
                    if($scope.questions[i].extra && $scope.questions[i].extra.uploadedFile){
                        data.uploadedFile = $scope.questions[i].extra.uploadedFile;
                    }
                    data.type = 'essay';
                    extra.push(data);
                } else if ($scope.questions[i].type === "studentvideoresponse") {
                    data.question_id = $scope.questions[i].question_id;
                    data.type = $scope.questions[i].type;
                    data.thumbnailfilename = $scope.questions[i].thumbnailfilename;
                    data.videofilename = $scope.questions[i].videofilename;
                    data.video_comment = $scope.questions[i].video_comment;
                    extra.push(data);
                    //return;
                } else if ($scope.questions[i].type === "matching") {
                    data.question_id = $scope.questions[i].question_id;
                    data.type = $scope.questions[i].type;
                    data.matching = $scope.questions[i].imgdata.matching;
                    extra.push(data);
                } else if ($scope.questions[i].type === "klosequestions") {
                    data.answers = $scope.questions[i].answers;
                    data.question_id = $scope.questions[i].question_id;
                    data.type = $scope.questions[i].type;
                    extra.push(data);
                } else if ($scope.questions[i].type === "multipart") {
                    data = {};
                    data.question_id = $scope.questions[i].question_id;
                    data.type = $scope.questions[i].type;
                    data.answers = $scope.questions[i].answers;
                    if (typeof $scope.questions[i].multipartRadio === "number") {
                        data.multipartRadio = 1;
                    }
                    extra.push(data);
                } else if ($scope.questions[i].type === "wordmatching") {
                    data = {};
                    data.answers = $scope.questions[i].answers;
                    data.question_id = $scope.questions[i].question_id;
                    data.type = $scope.questions[i].type;
                    extra.push(data);
                }
            }
            $scope.finishing = true;
            if(reallyFinish!==true && !$scope.quiz.canReturn && Object.keys($scope.data.responseQueue).length){
                var allPromises = [];
                for(var id in $scope.data.responseQueue){
                    var params = $scope.data.responseQueue[id];
                    allPromises.push($scope.sendResponse(params[0],params[1],params[2],true));
                }
                $q.all(allPromises).then(function(){
                        $scope.finishQuiz(true);
                    }
                )
            }
            else{
                reallyFinish=true;
            }
            if(reallyFinish!==true){
                return;
            }
            Quiz.finalize({
                quiz_id: parseInt($scope.quizid),
                course_id: $rootScope.currentCourseID,
                extra: extra,
                questions: $scope.questions,
                attempt_id:$scope.attempt_id
            }, function(response) {
                $scope.finishing = false;

                $scope.maxPoints = response.maxPoints;
                if (typeof response.extra !== 'undefined') {
                    response.extraData = angular.fromJson(response.extra);
                    for (var i = 0; i < response.extraData.length; i++) {
                        if (response.extraData[i].type === "matching") {
                            for (var z = 0; z < $scope.questions.length; z++) {
                                if ($scope.questions[z].question_id === response.extraData[i].question_id) {
                                    $scope.questions[z].responseData = response.extraData[i].matching.imagesCordinates;
                                    if (response.extraData[i].is_correct > 0) {
                                        if (parseInt(response.extraData[i].fully_correct) === 0) {
                                            $scope.questions[z].isCorrectPartially = 1;
                                        } else {
                                            $scope.questions[z].isCorrect = 1;
                                        }
                                    }
                                    $scope.questions[z].response = 1;
                                    break;
                                }
                            }

                        } else if (response.extraData[i].type === "wordmatching") {
                            for (var z = 0; z < $scope.questions.length; z++) {
                                if ($scope.questions[z].question_id === response.extraData[i].question_id) {
                                    if (response.extraData[i].correct > 0) {
                                        if (parseInt(response.extraData[i].fully_correct) === 0) {
                                            $scope.questions[z].isCorrectPartially = 1;
                                        } else {
                                            $scope.questions[z].isCorrect = 1;
                                        }
                                    }
                                    $scope.questions[z].response = 1;
                                    break;
                                }
                            }
                        } else if (response.extraData[i].type == "multipart") {
                            for (var z = 0; z < $scope.questions.length; z++) {
                                if ($scope.questions[z].question_id === response.extraData[i].question_id) {

                                    if (parseInt(response.extraData[i].correct) > 0) {

                                        if (parseInt(response.extraData[i].fully_correct) === 0) {
                                            $scope.questions[z].isCorrectPartially = 1;
                                        } else {
                                            $scope.questions[z].isCorrect = 1;
                                        }
                                    }
                                    $scope.questions[z].response = 1;
                                    break;
                                }
                            }

                            //$scope.questions[i].multipartquestion = $sce.trustAsHtml($scope.questions[i].extra);
                        } else if (response.extraData[i].type === "studentvideoresponse") {
                            for (var z = 0; z < $scope.questions.length; z++) {
                                if ($scope.questions[z].question_id === response.extraData[i].question_id) {
                                    $scope.questions[z].response = 1;
                                    break;
                                }

                            }
                        } else if (response.extraData[i].type === "klosequestions") {
                            var tmp = response.extraData[i].studentview;
                            tmp = tmp.replace(/u2265/g, '≥');
                            tmp = tmp.replace(/u2264/g, '≤');
                            tmp = tmp.replace(/id="(.*?)"/g, 'ng-model="question.answers.$1"');
                            tmp = tmp.replace(/value=""/g, '');
                            for (var key in response.extraData[i].answers) {
                                var re = new RegExp('ng-model="question\.answers\.' + key + '" style="(.*?)"');
                                if (response.extraData[i].answers[key] === response.extraData[i].real[key]) {
                                    tmp = tmp.replace(re, 'style="color:green;$1" value="' + response.extraData[i].answers[key] + '"')
                                } else {
                                    tmp = tmp.replace(re, 'style="color:red;$1" value="' + response.extraData[i].answers[key] + '"')
                                }
                            }
                            for (var z = 0; z < $scope.questions.length; z++) {
                                if ($scope.questions[z].question_id === response.extraData[i].question_id) {
                                    $scope.questions[z].klosequestion = $sce.trustAsHtml(tmp + response.extraData[i].img);
                                    if (parseInt(response.extraData[i].is_correct) === 1) {
                                        $scope.questions[z].isCorrect = 1;
                                    }
                                    $scope.questions[z].response = 1;
                                    break;
                                }
                            }
                        }
                    }
                }

                /*
                 Resetting safprompt for display for blank
                 */
                for (var i = 0; i < $scope.questions.length; i++) {

                    if (($scope.questions[i].type === "multiple") || ($scope.questions[i].type === "oneword")) {
                        if (angular.isDefined($scope.questions[i].fully_correct)) {
                            if ($scope.questions[i].fully_correct === 0) {
                                $scope.questions[i].isCorrectPartially = 1;
                                delete $scope.questions[i].isCorrect;
                            } else {
                                delete $scope.questions[i].isCorrectPartially;
                                $scope.questions[i].isCorrect = $scope.questions[i].type === "oneword"?$scope.questions[i].is_correct:1;
                            }
                        }
                        if($scope.questions[i].is_correct==0) $scope.questions[i].isCorrect = false;

                    }

                    else if ($scope.questions[i].type === "essay") {

                        $scope.questions[i].is_correct = -1
                        $scope.questions[i].isCorrect = false;
                        $scope.questions[i].htmlSafeoption = $sce.trustAsHtml($scope.questions[i].myanswer);
                        $scope.questions[i].response = 1;
                    } else if ($scope.questions[i].type === "studentvideoresponse") {
                        $scope.questions[i].is_correct = -1
                        $scope.questions[i].isCorrect = false;
                        $scope.questions[i].htmlSafeoption = '';
                        $scope.questions[i].response = 1;
                    } else if ($scope.questions[i].type === "blank") {
                        var id = '',
                            filter, optionSelected;
                        if (angular.isDefined($scope.questions[i].optionSelected))
                            optionSelected = $scope.questions[i].optionSelected.split(',');
                        else optionSelected = "";
                        for (var t = 0; t < $scope.questions[i].blankids.length; t++) {
                            id = $scope.questions[i].blankids[t];
                            filter = new RegExp('id="' + id + '"');
                            $scope.questions[i].prompt = $scope.questions[i].prompt.replace(filter, 'id="' + id + '" value="' + optionSelected[t] + '" disabled readonly')
                        }
                        $scope.questions[i].htmlSafeprompt = $sce.trustAsHtml($scope.questions[i].prompt);
                    }
                    if ($scope.questions[i].is_correct == -1) {
                        $scope.waitingForGrade = true;
                    }
                }

                $scope.quizScore = response.newScore;
                $scope.attemptsCompleted = $scope.attemptsCompleted + 1;
                $scope.remainingAttempts -= 1;
                if ($scope.attemptsCompleted >= $scope.allowedTakes && !$scope.isUnlimitedAttempts && $scope.quiz.isStudent) {
                    $scope.hasMoreAttempts = false;
                }

                $scope.quizStarted = false;
                $scope.quizEnded = true;
                $scope.quiz.is_finished = 1;
                $scope.quizJustEnded = true;
                $scope.$root.ended=true;

                $scope.$root.$emit('NavRootUpdate');

                //we will check if we have a response for each question if not
                //we will set it to incorrect and response = ' ';
                angular.forEach($scope.questions, function(question, key) {
                    if (typeof question.response === "undefined") {
                        question.response = 1;
                        question.isCorrect = 0;
                        question.is_correct = -1;
                        question.optionSelected = '';
                        question.prompt = question.prompt.replace(/value="undefined"/, 'value=""');
                        question.htmlSafeprompt = $sce.trustAsHtml(question.prompt);
                        question.klosequestion = '';
                        question.htmlSafeoption = '';
                        if(question.extra.gradeType == 'manual'){
                            $scope.waitingForGrade = true;
                        }
                    }
                })
            });
        }
        $scope.showRetake = function(){

            if(!$scope.quiz) return false;
            if(!$scope.isUnlimitedAttempts){
                return $scope.quiz.hasQuizScores &&  $scope.hasMoreAttempts;
            }else{
                return $scope.quiz.hasQuizScores;
            }

        }
        $scope.retakeQuiz = function() {
            if($scope.quiz && $scope.quiz.is_finished===0 && $scope.quiz.canReturn){
                $scope.loadingPrevious = true;
            }
            Quiz.retake({
                quiz_id: parseInt($scope.quizid),
                currentCourseID: $rootScope.currentCourseID
            }, function(response) {
                $scope.quizScore = 0;
                $scope.quizEnded = false;
                $scope.quizJustEnded = false;
                $scope.$root.ended=false
                $scope.startQuiz();
            });
        }

        $scope.canShowQuestion = function (questionIndex) {
            if($scope.quizPagination.showNav){
                return ($scope.quizPagination.currentPage*$scope.quizPagination.questionsPerPage)<=questionIndex && questionIndex<(($scope.quizPagination.currentPage+1)*$scope.quizPagination.questionsPerPage)
            }
            return true;
        };

        $scope.isSelected = function(option, question) {
            //Golabs striping out html
            //var tmp = document.createElement("DIV");
            //tmp.innerHTML = option;
            //option = tmp.textContent.trim() || tmp.innerText.trim() || option.trim;


            if (question.type === "multiple") {
                if (typeof question.response.split === "undefined") {
                    question.response = question.optionSelected.trim();
                }
                var explode = question.response.split(/,/);
                for (var i = 0; i < explode.length; i++) {
                    if (explode[i] !== '') {
                        if (question.options[explode[i]].trim() === option.trim())
                            return true;
                    }
                }
                return false;
            } else if ((question.type === "truefalse") || (question.type === "single")) {
                if (typeof question.responseUser !== 'undefined') {
                    question.optionSelected = question.responseUser;
                } else {
                    question.optionSelected = question.response;
                }
            }

            return (question.optionSelected == option);
        }

        $scope.checkPassword = function() {
            if (document.getElementById('quiz_password_field').value == $scope.password) {
                $scope.isPasswordProtected = false;
                $scope.insertedCorrectAnswer=true;
            }
        }
        $scope.minute = function(timeLeft) {
            return timeLeft == 1 ? 'minute' : 'minutes';
        }

        $scope.checkPasswordFailed = function() {
            if (document.getElementById('quiz_password_field_failed').value == $scope.password) {
                $scope.isPasswordProtected = false;
                $scope.insertedCorrectAnswer=true;
            }
        }

        $scope.isidrandom = function(question) {
            if ((typeof question.randomQuestion === "number") && (typeof $scope.randomquestions !== 'undefined')) {
                //Golabs we hide on true.
                for (var i = 0; i < $scope.randomquestions.length; i++) {
                    if (question.question_id === $scope.randomquestions[i].question_id) {
                        return false;
                    }
                }
                return true;
            }

            return false;
        }
        window.onbeforeunload = function() {
            if ($scope.$root.started && !$scope.$root.ended) {
                if(!$scope.quiz.canReturn){
                    return 'If you leave, your answers will be automatically submitted. Are you sure you want to leave?'
                }else{
                    return 'You have unsaved changes, are you sure you want to leave?'
                }

            }
        }
        $scope.$on("$locationChangeStart", confirmLeavePage);

        function confirmLeavePage(event) {
            if ($scope.quizStarted && !$scope.quizEnded)
                if(!$scope.quiz.canReturn){
                    if(!confirm('If you leave, your answers will be automatically submitted. Are you sure you want to leave?')){
                        event.preventDefault();
                    }else{
                        $scope.finishQuiz();
                        event.stopPropagation();
                    }
                }else{
                    if (!confirm('You have unsaved changes, are you sure you want to leave?')) {
                        event.preventDefault();
                    }
                }

        }


    }

]).directive("myBlank", function($compile) {
    return {
        link: function(scope, element) {
            if(element[0].innerText!=""){
                return;
            }
            var html = scope.$eval('question.prompt').toString();
            var template = '<span>' + html + '</span>';
            var linkFn = $compile(template);
            var content = linkFn(scope);
            element.append(content);
            jQuery.data(element,'started',true);
        }
    }
}).directive("quizzesPagination",function () {
    return {
        restrict:'E',
        templateUrl:'/public/views/directives/quizzes-pagination.html',
        scope:{
            quizInfo:'=?'
        },
        link:function(scope,element){
            var unWatchPag = scope.$watch('quizInfo',update,true);
            function update(){
                if(!scope.quizInfo.showNav) return;
                scope.pagedItems = Math.ceil(scope.quizInfo.totalNumberOfQuestions/scope.quizInfo.questionsPerPage);
                scope.pageNumberButtons = updatePageButtonsToShow()
            }
            function updatePageButtonsToShow(){
                var maxPageButtons = 5;
                if(scope.pagedItems<=maxPageButtons){
                    return _.range(0,scope.pagedItems);
                }
                if(shouldNotMoveLeft(maxPageButtons)){
                    return _.range(0,maxPageButtons);
                }
                if(shouldNotMoveRight(maxPageButtons)){
                    return _.range(scope.pagedItems-maxPageButtons,scope.pagedItems);
                }
                var start = (scope.quizInfo.currentPage)-Math.floor(maxPageButtons/2)
                return _.range(start,start+maxPageButtons)
            }
            function shouldNotMoveLeft(maxPageButtons){
                var pagesLeftHalf = Math.floor(maxPageButtons/2);
                return scope.quizInfo.currentPage<pagesLeftHalf
            }
            function shouldNotMoveRight(maxPageButtons){
                var pagesRightHalf = Math.floor(maxPageButtons/2);
                return scope.pagedItems - pagesRightHalf <= scope.quizInfo.currentPage
            }
            scope.previousPage = function(){
                if(scope.quizInfo.currentPage>0) scope.quizInfo.currentPage--;
            }
            scope.nextPage = function(){
                if(scope.quizInfo.currentPage < scope.pagedItems - 1) scope.quizInfo.currentPage++;
            }
            element.on('$destroy',function(){
                scope.$destroy();
                unWatchPag();
            })
        }
    }
})
    /*
     Golabs 10th of April 2015
     We need to set up a change so that when we render our html we will pick up the input moels so
     the answer object in each question is updated with the id.
     */
    .directive('compileTemplate', function($compile, $parse) {
        return {
            link: function(scope, element, attr) {
                var parsed = $parse(attr.ngBindHtml);

                function getStringValue() {
                    return (parsed(scope) || '').toString();
                }

                //Recompile if the template changes
                scope.$watch(getStringValue, function() {
                    $compile(element, null, -9999)(scope); //The -9999 makes it skip directives so that we do not recompile ourselves
                });
            }
        }
    });