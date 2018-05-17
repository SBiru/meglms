'use strict';
(function($) {
    $.fn.goTo = function(offset) {
        offset = offset || 0
        $('html, body').animate({
            scrollTop: $(this).offset().top + offset + 'px'
        }, 'fast');
        return this; // for chaining...
    }
})(jQuery);
(function(angular,$){
    window.isEqual = function(a,b){
        if(!isArrayOrObject(a) || !isArrayOrObject(b))
            return a === b;
        for(var i in a){
            if(i.startsWith && i.startsWith('$$'))
                continue;
            if(!isEqual(a[i],b[i])){
                return false;
            }
        }
        for(var i in b){
            if(i.startsWith && i.startsWith('$$'))
                continue;
            if(!isEqual(a[i],b[i])){
                return false;
            }
        }
        return true;
    };
    var isArrayOrObject = function(a){
        return _.isArray(a) || _.isObject(a)
    };
    //usage example: public/views/directives/app_fabric/menus/file/select-template-table.html
    angular.module('app').directive('e3Pagination',['$compile','$http',function($compile,$http){
        return{
            restrict:'EA',
            scope:{
                items:'=?',
                config:'=?',
                ngModel:'=?',
                setModel:'=?',
                setItems:'=?',
            },
            link:function(scope,element,attr){
                scope.config = _.extend({},DefaultConfig(),scope.config);
                var unWatchPag;
                if(scope.items !== undefined)
                 unWatchPag = scope.$watch('items',function(newVal,oldVal){
                    if(!scope.pagedItems ||!isEqual(newVal,oldVal))
                        update();
                    scope.items = newVal
                },true);
                scope.$parent.setPaginationItems = function(items){
                    scope.items = items;
                    update();
                }
                scope.$watch('config.currentPage',function(newVal,oldVal){
                    if(!scope.pagedItems || !isEqual(newVal,oldVal))
                        update()
                },true);
                function update(){
                    if(!scope.items) return;
                    scope.pagedItems = Math.ceil(scope.items.length/scope.config.itemsPerPage);
                    if(scope.config.currentPage){
                        scope.config.currentPage = Math.min(scope.config.currentPage,scope.pagedItems-1)
                    }else{
                        scope.config.currentPage=0;
                    }
                    scope.pageNumberButtons = updatePageButtonsToShow()
                    scope.config.showNav = scope.pagedItems>1;
                    setModel();
                }
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
                    if(scope.setModel)
                        scope.setModel(scope.items.slice(firstItem,lastItem));
                    else
                        scope.ngModel=(scope.items.slice(firstItem,lastItem));


                }
                scope.previousPage = function(){
                    if(scope.config.currentPage>0) scope.config.currentPage--;
                    scrollTop()
                }
                scope.nextPage = function(){
                    if(scope.config.currentPage < scope.pagedItems - 1) scope.config.currentPage++;
                    scrollTop()
                }
                scope.changePage = function(n){
                    scope.config.currentPage=n;
                    scrollTop()
                }
                scope.changeItemsPerPage = function(){
                    if(scope.config.itemsPerPage==-1){
                        scope.config.itemsPerPage = scope.items.length
                    }
                }
                scope.forceUpdate = function(){
                    update()
                }
                function scrollTop(){
                    $($('.pagination')[0]).goTo(-150);
                }
                scope.currentTotalText = function(){
                    if(!scope.items) return;
                    var start = (scope.config.currentPage*scope.config.itemsPerPage + 1);
                    var total = (scope.items.length)
                    var end = Math.min(((scope.config.currentPage + 1)*(scope.config.itemsPerPage)),total);

                    return  start +  '-' + end + ' of '  + total;
                }
                element.on('$destroy',function(){
                    scope.$destroy();
                    unWatchPag && unWatchPag();
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
                itemsPerPage: 10,
                showOnTop:true,
                showOnBottom:true
            }
        }
    }])
}(angular,jQuery))

