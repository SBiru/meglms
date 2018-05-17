(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    var randomString = function(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    app.directive('displayEssayGrader', [
        function(){
            return {
                restrict:'E',
                scope:{
                    question: '=?',
                    quiz: '=?'

                },
                templateUrl:'/public/views/directives/quiz-editor/questions/display/grader/essay.html',
                link:function($scope){
                    $scope.question.useRubric = false;
                    $scope.question.prepareQuestion=function(){
                        var json;
                        try{
                            json = JSON.parse($scope.question.response);
                        }catch(e){}
                        if(json){
                            $scope.question.response = json.text;
                            $scope.question.uploadedFile = json.file
                        }

                        if($scope.question.extra){
                            $scope.question.extra = typeof $scope.question.extra =='object'?$scope.question.extra:JSON.parse($scope.question.extra);
                            $scope.question.extra.rubricid = $scope.question.extra.rubricId;

                            $scope.question.useRubric = $scope.question.extra.useRubric;
                            $scope.message = $scope.question.extra;
                            $scope.message.rubricType='quiz';
                            $scope.message.id=$scope.question.response_id;
                            $scope.message.update_id = $scope.question.response_id;
                            $scope.message.user_id = $scope.quiz.user.user_id;
                            $scope.rubricData = {};
                        }
                        else $scope.question.extra = {};
                    };

                    $scope.question.prepareBeforeSave =function(){
                        if (!$scope.question.useRubric) return Promise.resolve();
                        return new Promise(function(resolve,reject){
                            var rejected = false;
                            var rejectTimeout = setTimeout(function(){
                                rejected = true;
                                reject();
                            },4000);
                            var eventId = randomString(10);
                            $scope.$broadcast('gradeRubric',{type:'quiz',eventId: eventId,postid:$scope.question.response_id,userid:$scope.quiz.user.user_id});
                            var unsubscribe = $scope.$root.$on('gradeRubricCompleted',function(event,data){
                                if(eventId === data.eventId){
                                    unsubscribe();
                                    clearTimeout(rejectTimeout);
                                    if(!rejected)
                                        resolve();
                                }
                            })
                        })
                    }
                    var unsubscribeGrade = $scope.$watch('question.extra.grade',function(val){
                        if(val){
                            $scope.question.is_correct = val;

                        }
                    })
                    $scope.question.beforeChange = function(){
                        return new Promise(function(resolve){

                            $scope.question.useRubric = false;
                            setTimeout(function(){
                                $scope.$apply();
                                $scope.$destroy();
                                resolve();
                            })
                        })
                    }
                    $scope.$on('$destroy',function(){
                        unsubscribeGrade();

                    })


                }
            }
        }
    ]);
}());
