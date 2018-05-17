(function(){
    "use strict";
    angular.module('app').directive('alphabetFilter',['$modal',
        function($modal){
            return {
                restrict:'E',
                require: 'ngModel',
                scope:{
                    ngChanged:'=?'
                },
                templateUrl:'/public/views/directives/glossary/alphabet-filter.html?v='+window.currentJsVersion,
                link:function(scope,el,attr,ngModel){
                    scope.setLetter = function(letter){
                        ngModel.$setViewValue(letter);
                        scope.ngChanged && scope.ngChanged(letter);
                        scope.currentLetter = letter;
                    }
                    scope.alphabet =['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','All'];
                    var unWatch = scope.$watch('ngModel',function(){
                        if(!_.isString(scope.ngModel)){
                            scope.setLetter('All');
                        }
                    })
                    scope.$on('$destroy',function(){
                        unWatch();
                    })
                }
            }
        }])

}());
