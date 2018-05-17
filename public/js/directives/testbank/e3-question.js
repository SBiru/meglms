angular.module('app')
.directive('e3Question', function($sce){
        return {
            restrict: 'E',
            templateUrl:'/public/views/directives/testbank/e3-question.html',
            scope: {
                question:'=?',
                options:'=?',
                '$index':'=?',
            },
            link:function(scope,element,attrs){
                scope.trustAsHtml = function(html){
                    return $sce.trustAsHtml(html)
                }
            }
        }
})