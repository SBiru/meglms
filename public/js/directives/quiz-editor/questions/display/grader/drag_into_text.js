(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayDragintotextGrader', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/display/grader/only_prompt.html',
                link:function($scope){
                    $scope.prepareQuestion=function(){
                        $scope.question.response = JSON.parse($scope.question.response);
                        dragIntoTextSolution($scope.question);
                    };

                    function dragIntoTextSolution(question){
                        var pattern = /(?:\[\[)([^\]]+)(?:\]\])/g
                        var match = pattern.exec(question.prompt);
                        question.solution = [];
                        var i = 0;
                        while (match != null) {
                            var placeHolder = match[1];
                            var optionIndex = parseInt(placeHolder)-1;
                            question.solution.push(question.options[optionIndex].text);
                            var response = question.response?question.response[i]:'';
                            question.prompt = question.prompt.replace(match[0],createEmptyBoxElementWithText(response,i,question))
                            i++;
                            match = pattern.exec(question.prompt);
                        }
                    }


                    function createEmptyBoxElementWithText(text,i,question){
                        return '<span class="empty-box" style="min-width: 10px"><span class="btn-xs '+boxClass(text,i,question)+'">'+text+'</span></span>';
                    }
                    function boxClass(text,i,question){
                        if(!($scope.graderView && text)) return '';
                        return text.trim().toLowerCase()==question.solution[i].trim().toLowerCase()?'correct':'incorrect';
                    }

                    function getHighestWidth(){
                        var maxWidth=0;
                        angular.element.find('.empty-box').forEach(function(option,i){
                            maxWidth = Math.max(totalWidth(angular.element(option)),maxWidth);
                        })
                        return maxWidth+'px';
                    }
                    $scope.$watch(getHighestWidth,function(highestWidth){
                        if(!_.isUndefined(highestWidth)){
                            angular.element.find('.empty-box').forEach(function(box,i){
                                box = angular.element(box);
                                box.css('min-width',highestWidth);
                            })
                        }
                    });
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
