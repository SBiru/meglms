//THIS FILE IS TEMPORARY!! NEED TO MOVE ALL THE CURRENT TYPES TO ITS OWN DIRECTIVE
(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('editDefaultInModal', [
        function(){
            return {
                restrict:'E',
                scope:false,
                templateUrl:'/public/views/directives/quiz-editor/questions/create_or_edit/default-question.html',
                link:function(scope){
                    scope.font_names = _.map(CKEDITOR.config.font_names.split(';'),function(n){
                        var parts = n.split('/');
                        return {
                            label: parts[0],
                            family: parts[1],
                        }
                    });
                    scope.font_sizes = _.map(CKEDITOR.config.fontSize_sizes.split(';'),function(n){
                        var parts = n.split('/');
                        return {
                            label: parts[0],
                            size: parts[1],
                        }
                    });
                    scope.font = {
                        family:scope.font_names[8].family,
                        size:scope.quiz.advancedSettings.font_size
                    }
                    if(scope.values.type=='truefalse' && scope.values.extra){
                        var extra = typeof scope.values.extra==='string'?JSON.parse(scope.values.extra):scope.values.extra
                        scope.font = extra.font;
                    }
                    scope.values.prepareQuestion = function(){
                        if(scope.values.type=='truefalse'){
                            scope.values.extra = {font:scope.font};
                        }
                    }
                }
            }
        }
    ]);
}());
