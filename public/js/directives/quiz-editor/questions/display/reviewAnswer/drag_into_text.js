
//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var MIN_WIDTH_OF_EMPTY_BOX = 15
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayDragintotextReview', [
        '$compile',
        'DragIntoTextShared',
        function($compile,DragIntoTextShared){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/drag_into_text.html',
                link:function($scope,$element){
                    $scope.prepareQuestion=replacePlaceholdersWithEmptyBoxes;
                    var sharedController = DragIntoTextShared.init($element);
                    function replacePlaceholdersWithEmptyBoxes(){
                        var prompt = $scope.question.prompt.replace(/\[\[_\]\]/g, createEmptyBoxElement())
                        prompt = $compile(prompt)($scope);
                        prompt = setAnswers(prompt);
                        $element.find('.prompt').replaceWith(prompt);
                        $scope.fixedSize = sharedController.getHighestSize('.empty-box',6);
                        readjustBoxes();
                    }
                    function createEmptyBoxElement(){
                        return '<span class="empty-box" style="min-height:'+sharedController.getHighestSize().height+';min-width:'+sharedController.getHighestSize().width+'" ></span>';
                    }
                    function setAnswers(prompt){
                        angular.element(prompt).find('.empty-box').each(function(i,box){
                            if($scope.question.answers&&$scope.question.answers[i]){
                                angular.element(box).addClass('answered')
                                angular.element(box).html('<span class="btn-xs">'+$scope.question.answers[i]+'</span>');
                            }

                        })
                        return prompt;
                    }
                    function readjustBoxes(prompt){
                        $element.find('.empty-box').each(function(i,box){
                            angular.element(box).css('min-width',$scope.fixedSize.width);
                            angular.element(box).css('min-height',$scope.fixedSize.height);
                        });
                    }


                    $scope.hideChoices=true;
                }
            }
        }
    ]);
}());
