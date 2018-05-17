(function(){
    "use strict";
    angular.module('app').directive('glossaryTagsList',[function(){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-tags-list.html?v='+window.currentJsVersion,
            scope:{
                tags:'=?',
                word:'=?',
                callbacks:'=?',
                paginationConfig:'=?',
                showSelect:'=?',
                showEdit:'=?',
                showDelete:'=?'
            },
            link:function(scope){
                var unWatch = scope.$watch('tags',prepareColumns,true);
                function prepareColumns(){
                    scope.columns=[];
                    if(scope.tags && scope.tags.length){
                        var itemsPerColumn = Math.ceil(scope.paginationConfig.itemsPerPage/3);
                        for (var i=0; i<scope.tags.length; i += itemsPerColumn) {
                            var col = {start:i, end: Math.min(i + itemsPerColumn, scope.tags.length) };
                            scope.columns.push(col);
                        }
                    }
                    _.each(scope.tags,toggleIsSelected);
                }
                function toggleIsSelected(tag){
                    tag.selected = scope.callbacks.selectedTags.indexOf(tag.id)>=0;
                }

                scope.$on('$destroy',function(){
                    unWatch();
                })
            }
        }
    }])

}());
