//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('editEssayInModal', [
        'RubricService',
        function(RubricService){
            return {
                restrict:'E',
                scope:{
                    question:'=?'
                },
                templateUrl:'/public/views/directives/quiz-editor/questions/create_or_edit/essay.html',
                link:function($scope){
                    var default_ = {allow_text_response: true, hide_advanced_editor:true};
                    $scope.rubricService = RubricService;
                    $scope.rubricService.data = _.clone(RubricService.initialData);
                    $scope.is_gradeable_post = true;
                    $scope.question.extra = $scope.question.extra || default_;
                    $scope.grade = $scope.question;
                    $scope.question.prepareBeforeEdit = function(){
                        if($scope.question.extra){
                            $scope.question.extra = typeof $scope.question.extra =='object'?$scope.question.extra:JSON.parse($scope.question.extra);
                            if($scope.question.extra.rubricId)
                                $scope.rubricService.data.stored_id=$scope.question.extra.rubricId;
                            if($scope.question.extra.allow_text_response === undefined)
                                $scope.question.extra.allow_text_response = true;
                        }
                        else $scope.question.extra = default_;

                        $scope.useRubric = $scope.question.extra.useRubric;
                        $scope.use_rubric = $scope.useRubric?1:0;
                    };
                    $scope.question.prepareQuestion = function(){
                        if($scope.rubricService.data.selected!=0 && $scope.useRubric){
                            $scope.question.extra.useRubric = true;
                            $scope.question.extra.rubricId = $scope.rubricService.data.id;
                        }
                        $scope.question.extra = JSON.stringify($scope.question.extra);
                    }
                }
            }
        }
    ]);
}());
