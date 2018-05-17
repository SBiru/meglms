'use strict';
(function(angular){
    angular.module('app').directive('inputAttendancePanel',function(){
        return {
            restrict: 'E',
            templateUrl: 'public/views/directives/reports/input-attendance-panel.html?v='+window.currentJsVersion
        }
    }).directive('attendanceTable',function(){
        return {
            restrict:'E',
            templateUrl:'/public/views/directives/reports/attendance-table.html?v='+window.currentJsVersion,
            link:function(scope,element,attrs){
                scope.days = angular.copy(scope.$eval(attrs.days));
                scope.transformTableIfLast = function($last) {
                    if($last) setTimeout(transformTable);
                }
                $(window).on('resize orientationChange', function(event) {
                    setTimeout(transformTable);
                })
                function transformTable() {

                    //firstRowFirstColumnHeight();
                    scrollableTableColumnsHeight();
                    scrollableTableLeft();
                    totalsTableRight();
                    fixedTop();
                    inputPanelMaxHeight();
                }
                function firstRowFirstColumnHeight(){
                    var scrollableColumnHeight = element.find('.right-table tr:first-child td:first-child').height()
                    var firstRowFirstColumn =  element.find('.fixed-first-column tr:first-child td:first-child')
                    var firstRowLastColumn =  element.find('.fixed-right-table tr:first-child td:first-child')
                    firstRowFirstColumn.height(scrollableColumnHeight);
                    firstRowLastColumn.height(scrollableColumnHeight);
                }
                function scrollableTableColumnsHeight(){
                    var columns = element.find('.fixed-first-column tr:not(:first-child):not(:last-child) td');
                    _.each(columns,function(col,$index){
                        $index = $index + 2;
                        reasonInputBoxWidth($(col))
                        var columnHeight =  $(col).height();
                        var scrollableTableColumns =  element.find('.scrollable-table.input-table-content tr:nth-child('+($index-1)+') td')
                        var fixedRightTableColumns =  element.find('.fixed-right-table tr:nth-child('+$index+') td')
                        scrollableTableColumns.height(columnHeight-($(col).hasClass('expand-first-column')?4:10));
                        fixedRightTableColumns.height(columnHeight)
                    })
                }
                function reasonInputBoxWidth(col){
                    var labelwidth = col.find('.reason-label').width();
                    if(labelwidth){
                        var input = col.find('.reason-input');
                        var inputWidth = Math.max(Math.min(130,208 - labelwidth - 30),70);
                        input.width(inputWidth);
                    }
                }
                function scrollableTableLeft(){
                    var fixedLeftColumnWidth = parseInt(element.find('.fixed-first-column').width());
                    var fixedRightColumnWidth = parseInt(element.find('.fixed-right-table').width())
                    var width = fixedLeftColumnWidth+fixedRightColumnWidth;
                    element.find('.scrollable-table').css('left',fixedLeftColumnWidth + 'px');
                    element.find('.custom-scrollbar-wrapper').css('left',fixedLeftColumnWidth + 'px');
                    element.find('.scrollable-table').css('width','calc(100% - ' + width + 'px)');
                    element.find('.custom-scrollbar-wrapper').css('width','calc(100% - ' + width + 'px)');
                    element.find('.custom-scrollbar').width(element.find('.scrollable-table table').width());
                    bindScrollEvents();
                }
                function bindScrollEvents(){
                    element.find('.custom-scrollbar-wrapper').scroll(function(){
                        element.find('.scrollable-table').scrollLeft(element.find('.custom-scrollbar-wrapper').scrollLeft())
                    })
                    element.find('.scrollable-table.input-table-content').scroll(function(){
                        element.find('.custom-scrollbar-wrapper').scrollLeft(element.find('.scrollable-table.input-table-content').scrollLeft())
                        element.find('.scrollable-table.class-names').scrollLeft(element.find('.scrollable-table.input-table-content').scrollLeft())
                    })
                }
                function totalsTableRight(){
                    var panelWidth = element.width(),
                        scrollTableWidh = element.find('.scrollable-table table').width(),
                        totalTableWidh = element.find('.fixed-right-table').width(),
                        firstTableWidh = element.find('.fixed-first-column').width(),
                        scrollTableRight = panelWidth - firstTableWidh - totalTableWidh - scrollTableWidh;
                    if(scrollTableRight>0){
                        element.find('.fixed-right-table').css('right',scrollTableRight + 'px');
                    }
                }
                function fixedTop(){
                    //var useCustomScrollBar = element.find('.custom-scrollbar-wrapper').width() > element.find('.custom-scrollbar')
                    //if(useCustomScrollBar){
                    //    element.find('.fixed-right-table').css('top','16px')
                    //    element.find('.fixed-first-column').css('top','17px')
                    //}
                }
                function inputPanelMaxHeight(){
                    element.find('.input-table-body').css('max-height',(window.innerHeight - 240) + 'px');
                }

                element.on('$destroy',function(){

                    scope.$destroy()
                })
            }
        }
    })
}(angular))