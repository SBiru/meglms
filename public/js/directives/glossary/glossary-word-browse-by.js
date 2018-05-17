(function(){
    "use strict";
    angular.module('app').directive('glossaryWordBrowseBy',['GlossaryWords','Glossary','GlossaryTags','$timeout',function(GlossaryWords,Glossary,GlossaryTags,$timeout){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-word-browse-by.html?v='+window.currentJsVersion,
            scope:{
                by:'=?',
                callbacks:'=?',
                paginationConfig:'=?',
                selected:'=?',
                orgId:'=?',
                pageId:'=?',
                searchTerm:'=?',
                fullText:'=?',
                limitToPage:'=?'
            },
            link:function(scope){
                var queryFn = scope.limitToPage?Glossary.get:GlossaryWords.query;
                scope.callbacks = scope.callbacks || {};
                scope.callbacks.changePage = changePage;

                function changePage(){
                    $timeout(startSearchWords,100);
                }
                function startSearchWords(){
                    scope.loadingWords = true;
                    var promise = startSearchBy();
                    promise && promise.$promise.then(
                        function(result){
                            scope.callbacks.updateResult && scope.callbacks.updateResult(result)
                            scope.loadingWords = false;

                        },function(){
                            toastr.error("Could not load words");
                            scope.loadingWords = false;
                        }
                    )
                }
                function startSearchBy(){
                    if(scope.by!=='term')
                        scope.searchTerm = '';
                    if(scope.by==='alphabet')
                        return startSearchByAlphabet();
                    if(scope.by==='tags')
                        return startSearchByTags();
                    if(scope.by==='term'){
                        return startSearchTerm();
                    }
                    if(scope.by==='author'){
                        return startSearchAuthor();
                    }
                }
                function startSearchByAlphabet(){
                    var letter = scope.selected.filter==='All'?'':scope.selected.filter;
                    scope.paginationConfig.lastSearch = {
                        fn:queryFn,
                        params:_.extend({
                            term:'^'+letter+'.*',
                            isRegex:1
                        },defaultQueryParams())
                    }
                    return redoLastSearch();
                }
                function startSearchByTags(){
                    if(!_.isArray(scope.selected.filter) || !scope.selected.filter.length) return false;
                    scope.paginationConfig.lastSearch = {
                        fn:scope.limitToPage?queryFn:GlossaryTags.filterWords,
                        params:_.extend({
                            tags:scope.selected.filter
                        },defaultQueryParams())
                    }
                    return redoLastSearch();
                }
                function startSearchTerm(){
                    scope.paginationConfig.lastSearch = {
                        fn:queryFn,
                        params:_.extend(prepareTermParams(),defaultQueryParams())
                    };
                    return redoLastSearch();
                }
                function startSearchAuthor(){
                    scope.paginationConfig.lastSearch = {
                        fn:queryFn,
                        params:_.extend({
                            author:scope.selected.filter||'none',
                            term:'',
                        },defaultQueryParams())
                    };
                    return redoLastSearch();
                }
                function prepareTermParams(){

                    if(scope.fullText){
                        return {
                            term:"^"+scope.searchTerm+"$",
                            isRegex:1
                        }
                    }else{
                        return {
                            term:scope.searchTerm
                        }
                    }
                }
                function defaultQueryParams(){
                    return {
                        page: scope.paginationConfig.currentPage + 1,
                        limit: scope.paginationConfig.itemsPerPage,
                        orgId:scope.orgId,
                        pageId:scope.pageId,
                        ignoreIds: scope.paginationConfig.ignoreIds,
                        id:scope.limitToPage?scope.pageId:undefined
                    }
                }
                function redoLastSearch(){
                    return scope.paginationConfig.lastSearch.fn(scope.paginationConfig.lastSearch.params)
                }


                var unWatch1 = scope.$watch('by',function(newV,oldV){
                    if(!scope.by) return;
                    scope.paginationConfig.toggleSelectAll(false);
                    changePage()
                });
                scope.by = 'alphabet';
                scope.selected = {};
                var unWatch2 = scope.$watch('selected.filter',function(newV,oldV){
                    if(!scope.selected.filter) return;
                    scope.paginationConfig.toggleSelectAll(false);
                    changePage()
                });

                scope.$on('$destroy',function(){
                    unWatch1();
                    unWatch2();
                })
            }
        }
    }])

}());
