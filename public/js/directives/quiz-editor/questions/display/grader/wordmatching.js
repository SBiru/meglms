(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayWordmatchingGrader', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/grader/wordmatching.html',
                link:function($scope){
                    $scope.prepareQuestion=function(){
                        mapWordmatchingQuestion($scope.question)
                    };
                    function mapWordmatchingQuestion(question) {
                        var extra = JSON.parse(question.extra.replace(/[\n\r]/g, ''))
                        try {
                            if(!question.response) return;
                            var response = JSON.parse(question.response);
                        } catch (e) {
                            return;
                        }


                        question.studentResponses = [];

                        if (!response.length)
                            return;

                        var allOptions = {};
                        for (var i in extra) {
                            var wordmatchrow = extra[i];
                            for (var j in wordmatchrow) {
                                allOptions[j] = wordmatchrow[j];
                            }
                        }
                        for (var i in extra) {
                            var wordmatchrow = extra[i];
                            if (!wordmatchrow.tmpanswers) {
                                var keys = Object.keys(wordmatchrow);
                                wordmatchrow.tmpanswers = keys[0] + keys[1]
                            }



                            var studentRowResponse = {};
                            for (var j in response) {
                                if(wordmatchrow.target){
                                    if (wordmatchrow.target==response[j].name2) {
                                        studentRowResponse = response[j];
                                        break;
                                    }
                                }else{
                                    if (wordmatchrow.hasOwnProperty(response[j].name1)) {
                                        studentRowResponse = response[j];
                                        break;
                                    }
                                }

                            }
                            var studentResponse = {};

                            //if null, student did not respond to this word
                            if (!angular.equals({}, studentRowResponse)) {

                                var studentRowResponsekey = studentRowResponse.name1 + studentRowResponse.name2;


                                studentResponse.name1 = hasMedia(allOptions[studentRowResponse.name1])?allOptions[studentRowResponse.name1]:decodeEntities(allOptions[studentRowResponse.name1]);
                                studentResponse.name2 = hasMedia(allOptions[studentRowResponse.name2])?allOptions[studentRowResponse.name2]:decodeEntities(allOptions[studentRowResponse.name2]);
                                studentResponse.isCorrect = studentRowResponsekey == wordmatchrow.tmpanswers || (wordmatchrow.matches && wordmatchrow.matches.indexOf(studentRowResponse.name1)>=0) ;

                            } else {
                                var expected;
                                for (var word in wordmatchrow) {
                                    if (wordmatchrow.tmpanswers.indexOf(word) > 1) {
                                        expected = word;
                                        break;
                                    }
                                }


                                studentResponse.name1 = hasMedia(allOptions[expected])?allOptions[expected]:decodeEntities(allOptions[expected]);
                                studentResponse.name2 = '';
                                studentResponse.isCorrect = false;
                            }
                            studentResponse.isCorrect = studentResponse.isCorrect||false;
                            question.studentResponses.push(studentResponse);
                        }
                    }
                    function hasMedia(option){
                        return option.indexOf('<audio')>=0 || option.indexOf('<img')>=0 || option.indexOf('<video')>=0
                    }
                }
            }
        }
    ]);
}());
