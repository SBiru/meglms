//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayEssayEditor', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/editor/default-question.html',
                link:function($scope){
                    $scope.prepareQuestion=function(){
                        $scope.question.ready = true;
                        if($scope.question.options.length && $scope.question.options[0].id){
                            $scope.question.options = _.map($scope.question.options,function(o){return o.text});
                        }
                        if($scope.question.extra && $scope.question.type=='truefalse' && typeof  $scope.question.extra === 'string'){
                            $scope.question.extra = JSON.parse($scope.question.extra)
                            if($scope.question.extra && $scope.question.extra.font && $scope.question.extra.font.size)
                                $scope.question.size = $scope.question.extra.font.size
                            else $scope.question.size = $scope.test.advancedSettings.font_size
                        }
                    };
                }
                
            }
        }
    ]);
}());
