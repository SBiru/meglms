(function(){
    "use strict";
    angular.module('app').directive('glossaryTagsListItem',['$sce',function($sce){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-tags-list-item.html?v='+window.currentJsVersion,
            scope:{
                tag:'=?',
                edit:'=?',
                delete:'=?',
                select:'=?',
                showSelect:'=?',
                showEdit:'=?',
                showDelete:'=?',
                paginationConfig:'=?'

            },
            link:function(scope){
                scope.trustAsHtml = $sce.trustAsHtml;
            }
        }
    }])

}());
