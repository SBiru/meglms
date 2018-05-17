
appControllers.controller('VocabQuizController', ['$rootScope', '$scope', '$sce', 'Quiz', 'Vocab','Currentpageid','Page',
    function($rootScope, $scope, $sce, Quiz, Vocab,Currentpageid,Page) {
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
        $scope.notReady = true;
        $rootScope.pagename = '';
        $scope.currentPage = 0;
        var quizConfig;
        $scope.checkPassword = checkPassword;
        var question_id = 0;
        if (typeof $rootScope.currentPage != 'undefined') {
            if ($rootScope.isEnglishCurrentlySelected) {

                $rootScope.pagename = $rootScope.currentPage.label;
            } else {
                $rootScope.pagename = $rootScope.currentPage.subtitle;
            }
        }
        $scope.trustAsHtml = function(html){
            return $sce.trustAsHtml(html.trim());
        }
        Vocab.get(
            {
                vocabId: $rootScope.$stateParams.quizId
            }, function(response) {
                quizConfig = response.quizConfig;
                if(response.meta && response.meta.length !== undefined)
                    response.meta = {}
                $scope.pageOptions = response.meta || {};

                $scope.vocabItems = response.content;
                $scope.maxPoints = $scope.vocabItems.length
                $scope.totalQuestions = $scope.maxPoints;
                $scope.notReady = false;
                $scope.need_password=response.need_password;
                $scope.remainingAttempts = response.allowed_takes || 0;
                $scope.quiz={isStudent:true};
                $scope.quiz.meta = $scope.pageOptions;
                $scope.isUnlimitedAttempts = response.isUnlimitedAttempts;
                if (response.time_limit !== null) {
                    if (response.time_limit > 0) {
                        $scope.timeLimit = response.time_limit;
                        $scope.isTimed = true;
                        $scope.quizTimer = 'Starting timer...';
                    }
                }

            }
        );
        function checkPassword() {
            if ($scope.need_password) {
                Page.get({
                    pageId: $scope.quizid,
                    password:$scope.user_password
                },function(res){
                    if(!res.error){
                        $scope.need_password=false;
                    }
                })
            }
        }

        //array randomizer
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
        $scope.retakeQuiz = function() {
            $scope.quizEnded = false;
            $scope.quizStarted = false;
            $scope.remainingAttempts -= 1;
            $scope.startQuiz();
        }
        $scope.getRemainingAttempts = function(){
            return Math.max(0,$scope.remainingAttempts);
        }
        $scope.minute = function(timeLeft) {
            return timeLeft == 1 ? 'minute' : 'minutes';
        }
        var maxTime = function() {
            return parseInt($scope.timeLimit) * 60;
        }
        $scope.canShowQuestion = function (questionIndex) {
            if($scope.quizPagination.showNav){
                return ($scope.quizPagination.currentPage*$scope.quizPagination.questionsPerPage)<=questionIndex && questionIndex<(($scope.quizPagination.currentPage+1)*$scope.quizPagination.questionsPerPage)
            }
            return true;
        };
        $scope.startQuiz = function() {
            Currentpageid.RecordingPageAccess( $rootScope.$stateParams.quizId)
            //initializing questions array
            $scope.questions = [];
            $scope.timeRemaining = maxTime();

            //getting the number of wrong choices
            var num_choices = Math.min(3, $scope.vocabItems.length - 1);

            //First, we randomize our vocab items
            $scope.vocabItems = $scope.arrayRandomizer($scope.vocabItems);

            //We iterate through items, creating questions
            for (var i = 0; i < $scope.vocabItems.length; i++) {
                //initialize question choices
                var choices = [];

                //We clone our array
                var vocabItems = _.clone($scope.vocabItems);

                //Pick our right answer
                var rightAnswer = vocabItems[i];
                choices.push(rightAnswer);

                //and remove it from array, so it can't be chosen again
                vocabItems.splice(i, 1);

                //Now we randomize it, to get our wrong answers
                vocabItems = $scope.arrayRandomizer(vocabItems);
                for (var j = 0; j < num_choices; j++)
                    choices.push(vocabItems[j]);

                //
                $scope.makeQuestion(choices, rightAnswer);
            }
            $scope.quizStarted = true
        }
        function getHtmlFromOption(option,type,format){
            if(type=='audio'){
                return '<audio controls="controls" class="vocab-quiz-audio"><source src="'+ option.urls[0] +'">Your browser does not support the HTML5 audio tag.</audio>'
            }else{
                return format=='definition'?option.translation:option.phrase;
            }
        }
        $scope.makeQuestion = function(choices, rightAnswer) {
            var question = {};
            question.rightAnswer = rightAnswer;
            question.htmlSafeprompt = $sce.trustAsHtml("Select the best match for: " + getHtmlFromOption(rightAnswer,quizConfig.questionType,quizConfig.questionFormat));
            question.prompt = "Select the best match for: " + getHtmlFromOption(rightAnswer,quizConfig.questionType,quizConfig.questionFormat);
            question.rightAnswer.answer = getHtmlFromOption(rightAnswer,quizConfig.optionType,quizConfig.optionFormat);
            question.title = rightAnswer.phrase;
            question.type = "single";
            question.options = [];
            question.question_id=question_id++;
            question.response=true;
            question.currentpage = 0;
            for (var i in choices){
                var answer =getHtmlFromOption(choices[i],quizConfig.optionType,quizConfig.optionFormat);
                question.options.push(answer);

            }

            question.options=$scope.arrayRandomizer(question.options);
            $scope.questions.push(question);
        }
        $scope.sendResponse = function(optiontext, question) {
            if (question.rightAnswer.answer == question.options[optiontext])
                question.isCorrect = true;
            else
                question.isCorrect = false;
            question.response=question.options[optiontext];
        }
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

        $scope.finishQuiz = function() {

            $scope.quizScore = 0;
            for (var i in $scope.questions)
                $scope.quizScore = $scope.questions[i].isCorrect ? $scope.quizScore + 1 : $scope.quizScore;
            Quiz.storescore(
                {
                    score: $scope.quizScore,
                    quiz_id: $rootScope.$stateParams.quizId
                }, function() {
                    $scope.quizJustEnded=true;
                }
            );
            $scope.remainingAttempts -= 1;
            $scope.$root.$emit('NavRootUpdate');
            $scope.quizEnded = true
        }
        //necessary since we use the same view as QuizController
        $scope.checktoshowF = function($index,currentShow){
            return true;
        }
    }
]);