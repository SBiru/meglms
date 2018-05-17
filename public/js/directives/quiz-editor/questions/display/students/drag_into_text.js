(function () {
    var app;
    var MIN_WIDTH_OF_EMPTY_BOX = 15;
    var MIN_HEIGHT_OF_EMPTY_BOX = 20;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('displayDragintotextStudent', [
        '$compile',
        'DragIntoTextShared',
        '$timeout',
        function($compile,DragIntoTextShared,$timeout){
            return {
                restrict:'E',
                scope:{
                    question:'='
                },
                templateUrl:'/public/views/directives/quiz-editor/questions/display/students/drag_into_text.html',
                controller:function($scope,$element){
                    var that = this;
                    var choicesInUse = [];
                    var sharedController = DragIntoTextShared.init($element),
                        unWatch

                    this.replacePlaceholdersWithEmptyBoxes = function(){
                        $scope.question.options = _.filter($scope.question.options,function(option){
                            return !_.isUndefined(option) && !_.isNull(option) && option.text != '';
                        })
                        var prompt = $scope.question.prompt.replace(/\[\[_\]\]/g, createEmptyBoxElement())
                        prompt = $compile(prompt)($scope);
                        $element.find('.prompt').replaceWith(prompt);
                        unWatch = $scope.$watch(boxesHasBeenLoaded,function(newValue,oldValue){
                            if(newValue){
                                replacePromptBoxes();
                            }
                        })
                    }
                    function boxesHasBeenLoaded(){
                        return $element.find('.option').length && $element.find('.option').width()>0;
                    }
                    function replacePromptBoxes(){
                        $timeout(function(){
                            $scope.fixedSize = sharedController.getHighestSize();
                        },200)
                    }
                    $scope.question.prepareQuestion=this.replacePlaceholdersWithEmptyBoxes;
                    

                    function createEmptyBoxElement(){
                        return '<span class="empty-box" ng-style="{\'min-height\':fixedSize.height,\'min-width\':fixedSize.width}" drop-validate="validateDrop($channel)" ui-on-drop="blankBoxReceivedChoice($data,$event)" drop-channel="{{question.id}}"></span>';
                    }
                   $scope.updateFixedSizeIfLast = function($last){
                       if(!$last) return;
                       $scope.fixedSize = sharedController.getHighestSize();
                    }
                    
                    $scope.validateDrop = function(event){
                        return true;
                    }
                    $scope.blankBoxReceivedChoice = function(choice,event){
                        hideFromAvailableChoices(choice)
                        var i = findChoiceIndex(choice);
                        if(choicesInUse.indexOf(i)>=0)
                            return;
                        choicesInUse.push(i);
                        var droppedEl = $compile(createDroppedElement(choice,i))($scope);
                        var blankBoxEl = angular.element(event.currentTarget);
                        blankBoxEl.attr('drop-channel','closed');
                        blankBoxEl.attr('dropped-choice',i);
                        if(!blankBoxEl.find('[dropped-choice]').length)
                            blankBoxEl.append(droppedEl);
                        updateResposes()
                        event.stopPropagation();
                    }
                    $scope.unMatchChoice = function(choiceIndex){
                        choicesInUse.splice(choicesInUse.indexOf(choiceIndex),1);
                        var blankBoxEl = angular.element('[dropped-choice="'+choiceIndex+'"]');
                        blankBoxEl.empty();
                        blankBoxEl.attr('drop-channel',$scope.question.id);
                        $scope.question.options[choiceIndex].isDropped=false;
                        updateResposes()
                    }
                    function hideFromAvailableChoices(choice){
                        var c = findChoice(choice);
                        c.isDropped = true;

                    }
                    function updateResposes(){
                        var answers = [];
                        $element.find('.empty-box').each(function(i,box){
                            var droppedText = angular.element(box).find('.dropped-text');
                            if(droppedText.length){
                                answers.push($scope.question.options[droppedText.attr('selected-option')].text);
                            }else{
                                answers.push('');
                            }
                        })
                        $scope.question.answers=answers;
                        $scope.$parent.$eval('sendResponse')(answers, $scope.question);
                    }
                    function createDroppedElement(choice,i){
                        return '<span class="btn btn-xs btn-warning unmatch-btn " ng-click="unMatchChoice('+i+')"><i class="fa fa-expand"></i></span><span class="dropped-text" selected-option="'+i+'" >'+choice.text+'</span>'
                    }
                    function findChoice(choice){
                        for(var i = 0;$scope.question.options.length;i++){
                            var sOption = $scope.question.options[i];
                            if(choice.id==sOption.id){
                                return sOption;
                            }
                        }
                    }
                    function findChoiceIndex(choice){
                        for(var i = 0;$scope.question.options.length;i++){
                            var sOption = $scope.question.options[i];
                            if(choice.id==sOption.id){
                                return i;
                            }
                        }
                    }
                    $element.on('destroy',function(){
                        unWatch();
                    })
                }
            }
        }
    ]).factory('DragIntoTextShared',function(){
        var self = this;
        var DragIntoTextSharedController = function($element){
            this.$element = $element;
        }
        DragIntoTextSharedController.prototype.getHighestSize = function(selector,offset){
            var maxWidth = MIN_WIDTH_OF_EMPTY_BOX;
            var maxHeight = MIN_HEIGHT_OF_EMPTY_BOX
            selector = selector || '.option'
            offset = offset || 0
            this.$element.find(selector).each(function (i, option) {
                maxWidth = Math.max(totalWidth(angular.element(option)), maxWidth);
                maxHeight = Math.max(angular.element(option).find('span').height(), maxHeight);
            })
            return {
                width: ((isNaN(maxWidth)?MIN_WIDTH_OF_EMPTY_BOX:maxWidth) + offset) + 'px',
                height: (maxHeight + offset) + 'px'
            }
        }
        function totalWidth(element){
            var totalWidth = element.width();
            totalWidth += parseInt(element.css("padding-left"), 10) + parseInt(element.css("padding-right"), 10); //Total Padding Width
            totalWidth += parseInt(element.css("borderLeftWidth"), 10) + parseInt(element.css("borderRightWidth"), 10); //Total Border Width
            return totalWidth;
        }
        return {
            init:function($element){
                return new DragIntoTextSharedController($element);
            }
        }
    })
    
}());
