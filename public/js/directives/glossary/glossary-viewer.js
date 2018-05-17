(function(){
    "use strict";
    angular.module('app').directive('glossaryViewer',['$modal','Glossary','GlossaryWordPagination',
        function($modal,Glossary,GlossaryWordPagination){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-viewer.html?v='+window.currentJsVersion,
            scope:{
                pageId:'=?',
                orgId:'=?'
            },
            link:function(scope){
                scope.pagination = GlossaryWordPagination.create();
                scope.filter = {};
                scope.search = loadGlossary
                if(scope.filter.type!=='term')
                    scope.filter.type = 'term';
                else{
                    scope.callbacks.changePage && scope.callbacks.changePage();
                }

                scope.selected = {};
                scope.callbacks = {
                    updateResult:scope.pagination.updatePaginationData.bind(scope.pagination),
                    startSearchTags:startSearchTags
                };

                loadAvailableTags();
                function loadAvailableTags(){
                    Glossary.getTags({
                        id:scope.pageId
                    }).$promise.then(function(tags){
                        scope.callbacks.tagOptions = tags;
                        scope.loadedTags = true;
                    })
                }
                function startSearchTags(term,cb){
                    return cb(scope.callbacks.tagOptions);
                }
                function loadGlossary(){
                    scope.loading = true;
                    Glossary.get(_.extend({
                        id:scope.pageId,
                        limit:scope.pagination.paginationConfig.itemsPerPage,
                        page:scope.pagination.paginationConfig.currentPage+1
                    },prepareTermParams())).$promise.then(function(result){
                        scope.loading = false;
                        scope.pagination.updatePaginationData(result);
                    });
                }
                function prepareTermParams(){
                    if(!scope.selected.searchTerm) return {};
                    if(scope.full_text){
                        return {
                            term:"^"+scope.selected.searchTerm+"$",
                            isRegex:1
                        }
                    }else{
                        return {
                            term:scope.selected.searchTerm
                        }
                    }
                }
            }
        }
    }])

}());
