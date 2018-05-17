'use strict';
(function(angular){
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    //usage example: public/views/directives/quiz-editor/modals/question.fromtags.modal.html
    app.directive('e3PaginationAsync',['$compile','$http',function($compile,$http){
        return{
            restrict:'A',
            scope:{
                config:'=?',
                update:'=?'
            },
            link:function(scope,element,attr,ngModel){
                scope.config = _.extend({},DefaultConfig(),scope.config);

                function update(){
                    scope.pagedItems = Math.ceil(scope.config.total/scope.config.itemsPerPage);
                    if(scope.config.currentPage){
                        scope.config.currentPage = Math.min(scope.config.currentPage,scope.pagedItems-1)
                    }else{
                        scope.config.currentPage=0;
                    }
                    scope.pageNumberButtons = updatePageButtonsToShow()
                    scope.config.showNav = scope.pagedItems>1;
                }
                scope.config.restart = update;
                function updatePageButtonsToShow(){
                    var maxPageButtons = 5;
                    if(scope.pagedItems<=maxPageButtons){
                        return _.range(0,scope.pagedItems);
                    }
                    if(shouldNotMoveLeft(maxPageButtons)){
                        return _.range(0,maxPageButtons);
                    }
                    if(shouldNotMoveRight(maxPageButtons)){
                        return _.range(scope.pagedItems-maxPageButtons,scope.pagedItems);
                    }
                    var start = (scope.config.currentPage)-Math.floor(maxPageButtons/2)
                    return _.range(start,start+maxPageButtons)
                }
                function shouldNotMoveLeft(maxPageButtons){
                    var pagesLeftHalf = Math.floor(maxPageButtons/2);
                    return scope.config.currentPage<pagesLeftHalf
                }
                function shouldNotMoveRight(maxPageButtons){
                    var pagesRightHalf = Math.floor(maxPageButtons/2);
                    return scope.pagedItems - pagesRightHalf <= scope.config.currentPage
                }
                function setModel(){
                    var firstItem = scope.config.itemsPerPage*scope.config.currentPage,
                        lastItem = (scope.config.itemsPerPage)*(scope.config.currentPage+1)
                    ngModel.$setViewValue(scope.items.slice(firstItem,lastItem));

                }
                scope.previousPage = function(){
                    if(scope.config.currentPage>0) {
                        scope.config.currentPage--;
                                            }
                }
                scope.nextPage = function(){
                    if(scope.config.currentPage < scope.pagedItems - 1) {
                        scope.config.currentPage++;

                    }
                }
                scope.changePage = function(n){
                    scope.config.currentPage = n;
                }
                scope.forceUpdate = function(){
                    scope.update && scope.update(scope.config);
                }
                var unWatch = scope.$watch('config.currentPage',function(){
                    scope.forceUpdate();
                },true);
                var unWatch2 = scope.$root.$on('reload',function(){
                    scope.forceUpdate();
                })
                element.on('$destroy',function(){
                    unWatch();
                    scope.$destroy();
                })



                $http.get('/public/views/directives/pagination-nav.html').then(function(template) {
                    if(scope.config.showOnTop){
                        element.prepend($compile(template.data)(scope))
                    }
                    if(scope.config.showOnBottom){
                        element.append($compile(template.data)(scope))
                    }
                }, function(error) {});

            }


        }
        function DefaultConfig(){
            return {
                showOnTop:true,
                showOnBottom:true
            }
        }
    }])
}(angular))