angular.module('app')

    /*
    * Sortable table
    * Required:
    *   header: array of Objects (
    *   {
    *       id:'headerid',
    *       label:'headerlabel',
    *       (optional) functions:{} //external functions to be used in the th template
    *       (optional) rowTemplate:string //template of the td element in each row
    *       (optional) headerTemplate:string //template of the th element in <thead>
*       })
    *   rows: array of Objects. Will be only displayed columns containing the headerId
    **/

.directive('asyncSortableTable',
[ '$timeout','$compile','$sce','$filter',function($timeout,$compile,$sce,$filter) {
        return {
            restrict: 'E',
            scope: {
                header:'=',
                rows:'=?',
                maxHeight:'=',
                externalFilter:'&',
                data:'=?',
                perPage:'=?',
                showFilter:'=?',
                defaultSort:'=?',
                defaultDescending:'=?',
                onPageChange:'=?' // (currentPageIndex,itemsPerPage,searchNeedle) => promise
            },
            templateUrl: '/public/views/directives/sortabletableasync.html',
            link: function ($scope, $element,$attrs) {
                $scope.$watch('header',function(h){
                    if(h) init();
                });
                $scope.perPage = $scope.perPage || 20;
                $scope.paginationConfig = {
                    itemsPerPage:$scope.perPage,
                    currentPage:0,
                    showNav: false,
                    showOnBottom:false
                };
                function init(){
                    var elem = $element.find('table')[0];
                    if($scope.showFilter===undefined){
                        $scope.showFilter=true;
                    }
                    if($scope.header)
                        $scope.sortBy=$scope.header[0].id;
                    if($scope.defaultSort){

                        $scope.sortBy=($scope.defaultDescending?'-':'') + $scope.defaultSort;
                    }

                    // wait for data to load and then transform the table
                    $scope.$watch(tableDataLoaded, function(isTableDataLoaded) {
                        if (isTableDataLoaded) {
                            transformTable();
                        }
                    });

                    $scope.$watch('sortBy',function(sortBy){
                        $scope.rows = _.map($filter('orderBy')($scope.rows,sortBy),function(i){ return i});

                    });
                    $scope.changePage = function(){
                        var promise = $scope.onPageChange && $scope.onPageChange($scope.paginationConfig.currentPage+1,$scope.paginationConfig.itemsPerPage,null);
                        promise && promise.then(
                            function(result){
                                $scope.rows = result.data;
                                updatePaginationData(result)
                            },function(){
                                toastr.error("Could not load data");
                            }
                        )
                    }
                    function updatePaginationData(result){
                        $scope.paginationConfig.currentPage = result.page-1;
                        $scope.paginationConfig.total = result.total;
                        $scope.paginationConfig.restart && $scope.paginationConfig.restart();
                    }

                    $scope.isAscending = function(){
                        if(!$scope.sortBy) return;
                        return $scope.sortBy[0]!=='-';
                    };
                    $scope.setSortBy = function(id){
                        var pattern = new RegExp('^\-?'+id);
                        if($scope.sortBy.match(pattern)){
                            $scope.sortBy=$scope.isAscending()?'-'+id:id;
                        }
                        else{
                            $scope.sortBy=id;
                        }
                    };

                    function tableDataLoaded() {
                        // first cell in the tbody exists when data is loaded but doesn't have a width
                        // until after the table is transformed
                        var firstCell = elem.querySelector('tbody tr:first-child td:first-child');
                        return firstCell && !firstCell.style.width;
                    }

                    function transformTable() {
                        // reset display styles so column widths are correct when measured below
                        angular.element(elem.querySelectorAll('thead, tbody, tfoot')).css('display', '');

                        // wrap in $timeout to give table a chance to finish rendering
                        $timeout(function () {
                            // set widths of columns
                            angular.forEach(elem.querySelectorAll('tr:first-child th'), function (thElem, i) {

                                var tdElems = elem.querySelector('tbody tr:first-child td:nth-child(' + (i + 1) + ')');
                                var tfElems = elem.querySelector('tfoot tr:first-child td:nth-child(' + (i + 1) + ')');

                                var columnWidth = tdElems ? tdElems.offsetWidth : thElem.offsetWidth;
                                if (tdElems) {
                                    tdElems.style.width = columnWidth + 'px';
                                }
                                if (thElem) {
                                    thElem.style.width = columnWidth + 'px';
                                }
                                if (tfElems) {
                                    tfElems.style.width = columnWidth + 'px';
                                }
                            });

                            // set css styles on thead and tbody
                            angular.element(elem.querySelectorAll('thead, tfoot')).css('display', 'block');

                            angular.element(elem.querySelectorAll('tbody')).css({
                                'display': 'block',
                                'max-height': $attrs.tableHeight || 'inherit',
                                'overflow': 'auto'
                            });

                            // reduce width of last column by width of scrollbar
                            var tbody = elem.querySelector('tbody');
                            var scrollBarWidth = tbody.offsetWidth - tbody.clientWidth;
                            if (scrollBarWidth > 0) {
                                // for some reason trimming the width by 2px lines everything up better
                                scrollBarWidth -= 2;
                                var lastColumn = elem.querySelector('tbody tr:first-child td:last-child');
                                lastColumn.style.width = (lastColumn.offsetWidth - scrollBarWidth) + 'px';
                            }
                        });
                    }
                }


            }
        }
    }
]).filter('startFrom', function() {
        return function(input, start) {
            start = +start; //parse to int
            return input.slice(start);
        }
});