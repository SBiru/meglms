//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayDragintotextEditor', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/editor/drag_into_text.html?v='+window.currentJsVersion,
                link:function($scope,$element){
                    $scope.prepareQuestion=function(){
                        $scope.question.options = _.filter($scope.question.options,function(option){
                            return !_.isUndefined(option) && !_.isNull(option) && option != '';
                        })
                    };
                    $scope.getHighestWidth=function(){
                        var maxWidth=0;
                        $element.find('.option').each(function(i,option){
                            maxWidth = Math.max(totalWidth(angular.element(option)),maxWidth);
                        })
                        return maxWidth+'px';
                    }
                    function totalWidth(element){
                        var totalWidth = element.width();
                        totalWidth += parseInt(element.css("padding-left"), 10) + parseInt(element.css("padding-right"), 10); //Total Padding Width
                        totalWidth += parseInt(element.css("borderLeftWidth"), 10) + parseInt(element.css("borderRightWidth"), 10); //Total Border Width
                        return totalWidth;
                    }
                }
            }
        }
    ]);
}());
