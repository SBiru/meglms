(function(){
    "use strict";
    angular.module('app').directive('glossaryWordList',[function(){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-word-list.html?v='+window.currentJsVersion,
            scope:{
                words:'=?',
                callbacks:'=?',
                paginationConfig:'=?',
                showSelect:'=?',
                showEdit:'=?',
                showTags:'=?',
                readOnly:'=?',
                showDelete:'=?'
            },
            link:function(scope){
                scope.toggleSelectAll = scope.paginationConfig.toggleSelectAll
            }
        }
    }])

}());
