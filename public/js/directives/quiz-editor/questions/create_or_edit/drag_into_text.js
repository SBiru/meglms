//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    var INSTRUCTIONS = 'Drag and drop into text question gives you the option of adding blanks in the middle of texts into which the student must drag words or phrases to complete the text. To create a blank, use [[1]], [[2]], [[3]], ...  as placeholders to be replaced by the correct choice answers 1, 2, 3 ...  respectively.';
    var NUMBER_OF_DEFAULT_CHOICES = 6;
    app.directive('editDragintotextInModal', [
        function(){
            return {
                restrict:'E',
                scope:{
                    question:'=?'
                },
                templateUrl:'/public/views/directives/quiz-editor/questions/create_or_edit/drag_into_text.html?v='+window.currentJsVersion,
                link:function($scope){
                    $scope.question.instructions = INSTRUCTIONS;
                    startDefaultChoices();
                    function startDefaultChoices(){
                        $scope.choices = _.map(_.range(NUMBER_OF_DEFAULT_CHOICES),function(){return {}});
                        fillCurrentOptions();
                    }
                    function fillCurrentOptions(){
                        for(var i = 0;i<$scope.question.options.length;i++){
                            if($scope.choices.length-1<i){
                                $scope.choices.push({});
                            }
                            $scope.choices[i].text = $scope.question.options[i];
                        }
                    }
                    $scope.question.prepareQuestion = function(){
                        $scope.question.options = _.filter(_.map($scope.choices,function(choice){
                            return choice.text
                        }),function(option){
                            return !_.isUndefined(option) && !_.isNull(option) && option != '';
                        })
                    }
                    $scope.addNew = function(){
                        $scope.choices.push({});
                    }
                    $scope.removeChoice = function(i){
                        $scope.choices.splice(i,1);
                    }
                }

            }
        }
    ]);
}());
