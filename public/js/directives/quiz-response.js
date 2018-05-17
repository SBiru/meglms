var decodeEntities = (function() {
        // this prevents any overhead from creating the object each time
        var element = document.createElement('div');

        function decodeHTMLEntities(str) {
            if (str && typeof str === 'string') {
                // strip script/html tags
                str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
                str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
                element.innerHTML = str;
                str = element.textContent;
                element.textContent = '';
            }

            return str;
        }

        return decodeHTMLEntities;
    }
)();

angular.module('app')


    .directive('quizResponse', [
        '$sce',
        'GraderQuiz',
        'Alerts',
        function($sce, GraderQuiz, Alerts) {
            return {
                restrict: 'E',
                scope: {
                    quiz: '=',
                    question: '=?',
                    graderView: '@',
                    needingFeedback: '=?',
                    pageInfo: '=?'
                },
                templateUrl: '/public/views/directives/quizResponse.html?v='+window.currentJsVersion,
                link: function($scope, $element) {

                    $scope.getQuestion = getQuestion;
                    $scope.deleteAttempt = deleteAttempt;
                    $scope.openPreview = $scope.$parent.openPreview;
                    $scope.isArchive = $scope.$parent.isArchive&&$scope.$parent.isArchive.call?$scope.$parent.isArchive():$scope.$parent.isArchive;
                    $scope.isGraderAll = $scope.$root.$state.current.name=='graderall';
                    $scope.quizzes = $scope.$parent.quizzes;
                    var original;
                    $scope.loading = {};
                    $scope.errors = {};
                    $scope.$watch("quiz", function(quiz) {
                            if (quiz){
                                if(!$scope.graderView){
                                    $scope.getAttempt({attempt_id:quiz.attempt_id});
                                }
                                init();
                            }
                        }
                    );


                    $scope.ckeditorOptions = {
                        toolbar: 'simple',
                        disableNativeSpellChecker: false
                    };

                    function init() {
                        if(!$scope.quiz.questions) return;
                        if ($scope.question) {
                            var index = 0;
                            for (var i = 0; i < $scope.quiz.questions.length; i++) {
                                if ($scope.quiz.questions[i].id == $scope.question) {
                                    index = i;
                                    break;
                                }
                            }
                            $scope.quiz.current_index = index;
                        } else
                            $scope.quiz.current_index = 0;
                        var tempQuestions = []

                        for (var i = 0; i < $scope.quiz.questions.length; i++) {
                            var question;
                            if($scope.needingFeedback && $scope.quiz.questions[i].is_correct!=-1){
                                continue;
                            }else{
                                question = $scope.quiz.questions[i];
                                tempQuestions.push(question);
                            }
                            if (question.type === "studentvideoresponse") {
                                var tmp = angular.fromJson(question.response)
                                if (!tmp)
                                    continue;
                                question.thumbnailfilename = tmp.thumbnailfilename ? tmp.thumbnailfilename.replace(/\\/g, '') : '';
                                question.videofilename = tmp.videofilename ? tmp.videofilename.replace(/\\/g, '') : '';
                                question.video_comment = tmp.video_comment;
                            }  else if (question.type === "matching") {
                                question.imgdata = angular.fromJson(question.extra);
                                question.Studentresponse = angular.fromJson(question.response);
                            }
                        }
                        $scope.quiz.questions = tempQuestions;
                        if ($scope.graderView) {
                            original = angular.copy($scope.quiz);
                        }

                    }
                    $scope.getTotalScore = function(quiz) {
                        var total = 0;
                        angular.forEach(quiz.questions, function(q) {
                                var val = parseFloat(q.is_correct);
                                if (val >= 0)
                                    total += val;
                            }
                        );
                        if(total>0 && Math.round(Math.round(total * 100) / 100)!=Math.round(quiz.user.score)){
                            $scope.$root.showWarning=true;
                        }

                        return Math.round(total * 100) / 100;
                    }

                    $scope.saveChanges = function(quiz,isFinishing) {
                        var saving = [];
                        var promises = [];
                        for (var i in quiz.questions) {
                            if (!angular.equals(quiz.questions[i], original.questions[i])) {
                                if(typeof quiz.questions[i].prepareBeforeSave === 'function'){
                                    promises.push(quiz.questions[i].prepareBeforeSave());
                                }else{
                                    promises.push(Promise.resolve());
                                }
                            }

                        }
                        Promise.all(promises).then(function(){
                            for (var i in quiz.questions) {
                                if (!angular.equals(quiz.questions[i], original.questions[i])) {
                                    $scope.loading.question = 1;

                                    var question = quiz.questions[i];
                                    saving.push(question.id);
                                    GraderQuiz.save({
                                            response_id: question.response_id,
                                            score_id: quiz.user.score_id,
                                            totalScore: $scope.getTotalScore(quiz),
                                            score: parseFloat(question.is_correct),
                                            question_id: question.id,
                                            quiz_id: quiz.user.quiz_id,
                                            user_id: quiz.user.user_id,
                                            attempt_id:quiz.attempt_id,
                                            quiz_question_id: question.quiz_question_id,
                                            feedback: question.feedback

                                        }, function(response) {
                                            saving.splice(saving.indexOf(response.question_id), 1);
                                            if(isFinishing)
                                                removeAttempt(quiz.attempt_id);
                                            if (!saving.length)
                                                $scope.loading.question = 0
                                        }
                                        , function(error) {
                                            $scope.loading.question = 2
                                            Alerts.danger({
                                                    title: 'Error',
                                                    content: 'Changes could not be saved',
                                                    textOk: 'Ok'
                                                }, function() {}
                                            );
                                        }
                                    );
                                }
                            }
                        }).catch(function(){
                            toastr.error('Could not save questions');
                        })


                    }
                    function removeAttempt(attemptId){
                        var index = _.findIndex($scope.quiz.attempts,{attempt_id:attemptId});
                        if(index>=0){
                            $scope.quiz.attempts.splice(index,1);
                            if($scope.quiz.attempts.length==0){
                                if($scope.$parent.filteredQuizzes){
                                    $scope.$parent.filteredQuizzes.splice(_.findIndex($scope.$parent.$index,1))
                                }
                            }
                        }

                    }
                    $scope.addToIndex = function(quiz, num) {
                        var newVal = quiz.current_index + num;
                        quiz.current_index = Math.max(0, Math.min(quiz.questions.length - 1, newVal));

                    }
                    $scope.getScore = function(question) {
                        if (question.is_correct == -1)
                            return 'Not graded'
                        if (question.is_correct == null )
                            return 0
                        return question.is_correct
                    }
                    $scope.$root.safeHtml = function(html) {
                        return $sce.trustAsHtml(html)
                    }
                    $scope.removeForwardSlashes = function(string) {
                        return string.replace(/\\/, '');


                    }


                    $scope.editScore = function(quiz) {
                        quiz.questions[quiz.current_index].editing = true;
                    }
                    $scope.canFinishGrading = function(quiz) {
                        for (var i in quiz.questions) {
                            var question = quiz.questions[i];
                            if (question.is_correct == -1) {
                                return false;
                            }
                        }
                        return true;
                    }
                    $scope.canEdit = function() {
                        var me = $scope.$root.user;
                        return me &&
                            (me.is_edit_teacher ||
                            me.is_super_admin ||
                            me.is_organization_admin)
                    }
                    $scope.finishGrading = function(quiz) {
                        $scope.saveChanges(quiz,true);
                        if($scope.quizzes)
                            $scope.quizzes.splice($scope.quizzes.indexOf(quiz), 1);
                        $scope.$root.$broadcast('NavUpdateMenuStatic', true);
                        var data = $scope.$root.$state.current.name=='graderall'?$scope.$root.$stateParams:true;
                        $scope.$root.$broadcast('reloadPostedMessages', data);
                    }


                    function getQuestionType(message){
                        var question = getQuestion(message);
                        if(!question) return;
                        if (question.type === 'single'){
                            return 'Multiple Choice';
                        }
                        else{
                            return question.type;
                        }
                    }

                    function getQuestion(quiz) {

                        if (!(quiz  && quiz.questions && quiz.questions.length))
                            return;
                        if (!quiz.current_index) {
                            quiz.current_index = 0
                        }
                        if(quiz.questions[quiz.current_index].is_correct === null){
                            quiz.questions[quiz.current_index].is_correct = 0;
                        }
                        return quiz.questions[quiz.current_index];
                    }



                    function deleteAttempt(){
                        var attempt = _.findWhere($scope.quiz.attempts,{attempt_id:$scope.quiz.attempt_id});
                        if(attempt.highest){
                            if(!confirm("This attempt has the highest score, are you sure you want to delete?"))
                                return;
                        }
                        else{
                            if(!confirm("Are you sure you want to delete this attempt?")){
                                return;
                            }
                        }
                        var user = $scope.quiz.user;
                        GraderQuiz.deleteAttempt({
                                attemptId : attempt.attempt_id,
                                userId: user.user_id,
                                pageId: user.page_id,
                                keepHighest:user.keep_highest_score
                            },
                            function(ok){
                                $scope.$root.$broadcast('NavUpdateMenuStatic', true);
                                $scope.quiz.attempts.splice(
                                    $scope.quiz.attempts.indexOf(attempt),
                                    1
                                );
                                if(ok.highest_attempt_id){
                                    for(var i =0;i<$scope.quiz.attempts.length;i++){
                                        if($scope.quiz.attempts[i]==ok.highest_attempt_id)
                                            $scope.quiz.attempts[i].highest=true;
                                    }
                                }
                            },
                            function(error){
                            }
                        )
                    }
                    $scope.getAttempt = function (attempt){
                        if($scope.lastLoadedAttempt==attempt.attempt_id)
                            return;
                        $scope.lastLoadedAttempt = attempt.attempt_id;
                        $scope.quiz.attempt_id =attempt.attempt_id;
                        var user = $scope.quiz.user;
                        GraderQuiz.getAttempt({
                                attemptId : attempt.attempt_id,
                                userId: user.user_id,
                                pageId: user.page_id,
                                quizId: parseInt(user.quiz_id)>0?user.quiz_id:user.randomquiz_id,
                                isGraderView:$scope.graderView
                            },function(quiz){
                                $scope.quiz.questions = quiz.questions;
                                init();
                            },function(error){}
                        )
                    }
                    if($scope.quiz && $scope.quiz.questions)
                        init();
                }
            }
        }
    ]);
