'use strict';
(function(angular){
angular.module('app').directive('graderPagination',function(){
    return {
        restrict:'A',
        link:function($scope,$element,$attrs){
            var cleanUp = []
            var isQuiz = $scope.$eval($attrs.isQuiz);
            cleanUp.push($scope.$watch('pagination.itemsPerPage',updateShowedItems))
            cleanUp.push($scope.$watch('pagination.currentPage',updateShowedItems))
            if(isQuiz)
                cleanUp.push($scope.$watch('filteredQuizzes',updateShowedItems))
            else
                cleanUp.push($scope.$watch('postedMessages',updateShowedItems))


            $scope.pagination = $scope.pagination || {itemsPerPage:10,currentPage:0}

            function updateShowedItems(){
                var posts = isQuiz?$scope.filteredQuizzes:$scope.postedMessages

                if(!posts || !posts.length) {
                    $scope.pagination.showNav = false;
                    return;
                }
                var boxCount = 0, usedBoxes = [];
                angular.forEach(posts,function(m){
                    if(!m) return;
                    var bInfo =boxInfo(m);
                    if(usedBoxes.indexOf(bInfo)<0){
                        usedBoxes.push(bInfo); boxCount++
                    }
                    m.show=isInCurrentPage(usedBoxes.indexOf(bInfo));
                })
                $scope.pagination.totalItems = boxCount;
                $scope.pagination.currentPage = Math.min(boxCount-1,$scope.pagination.currentPage);
                $scope.pagination.showNav = shouldShowNav();
                setTimeout(function(){$scope.$apply()})
            }
            function boxInfo(message){
                var user = message.user || (message.quiz?message.quiz.user:null);
                return message.type=='quiz'||isQuiz? user.user_id+'-'+(message.pageInfo?message.pageInfo.id:''):message.user_id + '-' + (message.page_name)
            }
            function shouldShowNav(){
                return $scope.pagination.totalItems>$scope.pagination.itemsPerPage
            }

            function isInCurrentPage(boxCount){
                var pageStart = $scope.pagination.itemsPerPage*$scope.pagination.currentPage ;
                var pageEnd = $scope.pagination.itemsPerPage*($scope.pagination.currentPage+1);
                return boxCount >= pageStart && boxCount < pageEnd;
            }

            $element.on('$destroy',function(){
                angular.forEach(cleanUp,function(fn){fn()});
                cleanUp = [];
            })
        }
    }
}).directive('graderPaginationNav',function(){
    return {
        restrict:'E',
        templateUrl:'/public/views/directives/grader-pagination-nav.html',
        scope:{
            pagInfo:'=?'
        },
        link:function(scope,element){
            var unWatchPag = scope.$watch('pagInfo',update,true);
            function update(){
                if(!scope.pagInfo.showNav) return;
                scope.pagedItems = Math.ceil(scope.pagInfo.totalItems/scope.pagInfo.itemsPerPage);
                scope.pageNumberButtons = updatePageButtonsToShow()
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
                var start = (scope.pagInfo.currentPage)-Math.floor(maxPageButtons/2)
                return _.range(start,start+maxPageButtons)
            }
            function shouldNotMoveLeft(maxPageButtons){
                var pagesLeftHalf = Math.floor(maxPageButtons/2);
                return scope.pagInfo.currentPage<pagesLeftHalf
            }
            function shouldNotMoveRight(maxPageButtons){
                var pagesRightHalf = Math.floor(maxPageButtons/2);
                return scope.pagedItems - pagesRightHalf <= scope.pagInfo.currentPage
            }
            scope.previousPage = function(){
                if(scope.pagInfo.currentPage>0) scope.pagInfo.currentPage--;
            }
            scope.nextPage = function(){
                if(scope.pagInfo.currentPage < scope.pagedItems - 1) scope.pagInfo.currentPage++;
            }
            element.on('$destroy',function(){
                scope.$destroy();
                unWatchPag();
            })
        }

    }
})
}(angular))