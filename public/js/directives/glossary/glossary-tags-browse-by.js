(function(){
    "use strict";
    angular.module('app').directive('glossaryTagsBrowseBy',['GlossaryTags','$timeout',function(GlossaryTags,$timeout){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/glossary/glossary-tags-browse-by.html?v='+window.currentJsVersion,
            scope:{
                by:'=?',
                callbacks:'=?',
                paginationConfig:'=?',
                selected:'=?',
                orgId:'=?',
                searchTerm:'=?',
                fullText:'=?'

            },
            link:function(scope){
                scope.callbacks = scope.callbacks || {};
                scope.callbacks.changePage = changePage;
                function changePage(){
                    $timeout(startSearch,100);
                }
                function startSearch(){
                    scope.loading = true;
                    var promise = startSearchBy();
                    promise && promise.$promise.then(
                        function(result){

                            scope.callbacks.updateResult && scope.callbacks.updateResult(result)
                            scope.loading = false;

                        },function(){
                            toastr.error("Could not load tags");
                            scope.loading = false;
                        }
                    )
                }

                function startSearchBy(){
                    if(scope.by!=='term')
                        scope.searchTerm = '';
                    if(scope.by==='alphabet')
                        return startSearchByAlphabet();
                    if(scope.by==='term'){
                        return startSearchTerm();
                    }
                    if(scope.by==='author'){
                        return startSearchAuthor();
                    }
                    if(scope.by==='date'){
                        return startSearchDate();
                    }
                }
                function startSearchByAlphabet(){
                    var letter = scope.selected.filter==='All'?'':scope.selected.filter;
                    scope.paginationConfig.lastSearch = {
                        fn:GlossaryTags.query,
                        params:_.extend({
                            term:'^'+letter+'.*',
                            isRegex:1
                        },defaultQueryParams())
                    }
                    return redoLastSearch();
                }
                function startSearchDate(){
                    scope.paginationConfig.lastSearch = {
                        fn:GlossaryTags.query,
                        params:_.extend({term:'',period:scope.selected.filter},defaultQueryParams())
                    };
                    return redoLastSearch();
                }
                function startSearchTerm(){
                    scope.paginationConfig.lastSearch = {
                        fn:GlossaryTags.query,
                        params:_.extend(prepareTermParams(),defaultQueryParams())
                    };
                    return redoLastSearch();
                }
                function startSearchAuthor(){
                    scope.paginationConfig.lastSearch = {
                        fn:GlossaryTags.query,
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
                        page: (scope.paginationConfig.currentPage||0) + 1,
                        limit: scope.paginationConfig.itemsPerPage,
                        orgId:scope.orgId,
                        ignoreIds: scope.paginationConfig.ignoreIds
                    }
                }
                function redoLastSearch(){
                    return scope.paginationConfig.lastSearch.fn(scope.paginationConfig.lastSearch.params)
                }


                var unWatch1 = scope.$watch('by',function(newV,oldV){
                    if(!scope.by) return;

                    changePage()
                });
                scope.selected = {};
                scope.by = 'alphabet';
                var unWatch2 = scope.$watch('selected.filter',function(newV,oldV){
                    if(!scope.selected.filter) return;

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
