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
.directive('dynamicTemplate', function($compile){
    return {
        restrict: 'E',
        scope: {
            data:'=?',
            template:'=?',
            functions:'=?'
        },
        link: function(scope, element){
            element.html(scope.template).show();
            $compile(element.contents())(scope);
        }
    }
})
.directive('sortableTable',
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
                onSelect:"=?"
            },
            templateUrl: '/public/views/directives/sortabletable.html',
            link: function ($scope, $element,$attrs) {
                $scope.$watch('header',function(h){
                    if(h) init();
                });
                $scope.onSelect = $scope.onSelect || function(){};
                $scope.perPage = $scope.perPage || 20;
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
                    $scope.$watch('perPage',function(perPage){
                        if(perPage){
                            startPagination(perPage);
                        }
                    });
                    $scope.$watch('rows',function(rows){
                        if(rows){
                            startPagination($scope.perPage);
                            $scope.filteredRows = _.map($filter('orderBy')($scope.rows,$scope.sortBy),function(i){ return i});
                            groupToPages()
                        }
                    })
                    $scope.$watch('filter',function(filter){
                        $scope.filteredRows = _.map($filter('filter')($scope.rows,filter),function(i){return i});
                        groupToPages()
                        if($scope.currentPage>$scope.pagedItems.length-1){
                            $scope.currentPage = 0;
                        }

                    })
                    $scope.$watch('sortBy',function(sortBy){
                        $scope.filteredRows = _.map($filter('orderBy')($scope.filteredRows,sortBy),function(i){ return i});
                        groupToPages()
                    })
                    function startPagination(perPage){
                        $scope.currentPage=0;
                        $scope.pageSize = perPage;
                        $scope.numberOfPages=Math.ceil($scope.rows.length/$scope.pageSize);
                        if($scope.numberOfPages>1){
                            $scope.showPagination = true;
                        }
                        groupToPages()
                    }
                    function groupToPages(){
                        $scope.pagedItems = [];
                        if(!$scope.filteredRows) return;
                        for (var i = 0; i < $scope.filteredRows.length; i++) {
                            if (i % $scope.pageSize === 0) {
                                $scope.pagedItems[Math.floor(i / $scope.pageSize)] = [ $scope.filteredRows[i] ];
                            } else {
                                $scope.pagedItems[Math.floor(i / $scope.pageSize)].push($scope.filteredRows[i]);
                            }
                        }
                    }

                    $scope.nextPage = function(){
                        $scope.currentPage = Math.min($scope.currentPage+1,$scope.numberOfPages);
                    }
                    $scope.previousPage = function(){
                        $scope.currentPage = Math.max($scope.currentPage-1,0);
                    }
                    $scope.range = function(max){
                        var limitRange = 5;
                        if(max>limitRange){
                            var start = Math.min($scope.currentPage,max-limitRange)
                            return _.range(start,start+limitRange);
                        }else{
                            return _.range(max);
                        }

                    }
                    $scope.setPage = function(n){
                        $scope.currentPage=n
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