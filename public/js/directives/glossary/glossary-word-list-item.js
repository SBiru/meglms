(function(){
    "use strict";
    angular.module('app').directive('glossaryWordListItem',['$sce',function($sce){
        return {
            restrict:'E',
            template:'<div ng-include="templateUrl"></div>',
            scope:{
                word:'=?',
                edit:'=?',
                delete:'=?',
                deleteDefinition:'=?',
                editDefinition:'=?',
                createDefinition:'=?',
                canSelectDefinition:'=?',
                toggleDefinition:'=?',
                showSelect:'=?',
                showEdit:'=?',
                showDelete:'=?',
                showTags:'=?',
                readOnly:'=?',
                paginationConfig:'=?'

            },
            link:function(scope){
                selectTemplate();

                function selectTemplate(){
                    if(scope.readOnly){
                        scope.templateUrl = '/public/views/directives/glossary/glossary-word-list-item-student.html?v='+window.currentJsVersion
                    }else{
                        scope.templateUrl = '/public/views/directives/glossary/glossary-word-list-item.html?v='+window.currentJsVersion
                    }
                }

                scope.trustAsHtml = $sce.trustAsHtml;
                scope.toggleSelect = function(){
                    scope.word.selected = !scope.word.selected
                    if(scope.paginationConfig.selectAll){
                        if(!scope.word.selected){
                            scope.paginationConfig.ignoreIds = scope.paginationConfig.ignoreIds || [];
                            scope.paginationConfig.ignoreIds.push(scope.word.id);
                        }else if(scope.paginationConfig.ignoreIds.indexOf(scope.word.id)>=0){
                            scope.paginationConfig.ignoreIds.splice(scope.paginationConfig.ignoreIds.indexOf(scope.word.id),1);
                        }
                    }else{
                        if(scope.word.selected){
                            scope.paginationConfig.selectedIds = scope.paginationConfig.selectedIds || [];
                            scope.paginationConfig.selectedIds.push(scope.word.id)
                        }else if(scope.paginationConfig.selectedIds && scope.paginationConfig.selectedIds.indexOf(scope.word.id)>=0){
                            scope.paginationConfig.selectedIds.splice(scope.paginationConfig.selectedIds.indexOf(scope.word.id),1);
                        }


                    }

                }
            }
        }
    }])

}());
