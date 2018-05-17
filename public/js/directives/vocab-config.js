"use strict";

(function () {

angular.module('app').directive('vocabConfig',
[
'Vocab',
'VocabConfig',
'$timeout',
'$sce',
function(Vocab,VocabConfig,$timeout,$sce){
return {
    restrict:'E',
    require:'ngModel',
    templateUrl:'/public/views/directives/vocab-config.html',
    scope:{
        'vocabId':'=?'
    },
    link:function(scope,element,attrs,ctrl){
        var defaultOptions = {
            questionFormat:VocabConfig.formatType.word,
            questionType:VocabConfig.optionType.text,
            optionFormat:VocabConfig.formatType.definition,
            optionType:VocabConfig.optionType.text
        }
        scope.config = VocabConfig;
        scope.trustAsHtml = function(html){
            return $sce.trustAsHtml(html);
        }
        scope.changeQuestionFormat = function(format){
            scope.options.questionFormat = format;
            if(format == VocabConfig.formatType.word){
                scope.options.optionFormat = VocabConfig.formatType.definition;
                scope.options.optionType = VocabConfig.optionType.text
            }
            else if(format == VocabConfig.formatType.definition){
                scope.options.optionFormat = VocabConfig.formatType.word;
                scope.options.questionType = VocabConfig.optionType.text
            }
            update()
        };
        scope.changeOptionFormat = function(format){
            scope.options.optionFormat = format;
            if(format == VocabConfig.formatType.word){
                scope.options.questionFormat = VocabConfig.formatType.definition;
                scope.options.questionType = VocabConfig.optionType.text
            }
            else if(format == VocabConfig.formatType.definition){
                scope.options.questionFormat = VocabConfig.formatType.word;
                scope.options.optionType = VocabConfig.optionType.text
            }
            update()
        };
        scope.previewQuestion = function(){
            if(!scope.options || !scope.preview) return;
            if(scope.options.questionType==VocabConfig.optionType.audio){
                return '<audio controls="controls"><source src="'+ scope.preview.question.audio[0] +'">Your browser does not support the HTML5 audio tag.</audio>';
            }else{
                return (scope.options.questionFormat == VocabConfig.formatType.definition)?scope.preview.question.info.translation:scope.preview.question.info.phrase;
            }

        }
        scope.previewOption = function(option){
            if(!scope.options || !scope.preview) return;
            if(scope.options.optionType==VocabConfig.optionType.audio){
                return '<audio controls="controls"><source src="'+ option.audio[0] +'">Your browser does not support the HTML5 audio tag.</audio>';
            }else{
                return (scope.options.optionFormat == VocabConfig.formatType.definition)?option.info.translation:option.info.phrase;
            }
        }
        function getPreview(){
            if(!scope.vocabId) return;
            Vocab.details({
                vocabId:scope.vocabId
            },function(module){
                if(!module.vocabs || !module.vocabs.length) return;
                var count = Math.min(module.vocabs.length,4);

                scope.preview = {options:module.vocabs.slice(0,count)};
                scope.preview['question'] = scope.preview.options[0];
            })
        }
        scope.update = update;
        function update(){
            ctrl.$setViewValue(scope.options);
            ctrl.$render();
            $timeout(function(){scope.$apply()});
        }
        scope.$watch(
            function(){
                return ctrl.$modelValue;
            }, function(data, oldValue){
                if(data){
                    scope.options = data
                }else{
                    scope.options = defaultOptions
                }

            }, true);
        getPreview();
    }
}}])
.factory('VocabConfig',function(){
    return {
        formatType:{
            word:'word',
            definition:'definition'
        },
        optionType:{
            audio:'audio',
            text:'text'
        },
    }
})
}());