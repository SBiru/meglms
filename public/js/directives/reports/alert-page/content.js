'use strict';
(function(){
angular.module('app').directive('alertPage',['alertPageOptions','UserAlertsService','HelperService','$filter',function(alertPageOptions,UserAlertsService,HelperService,$filter){
   return{
       restrict: 'E',
       templateUrl:'/public/views/directives/reports/alert-page/content.html',
       scope:{
           userId:'='
       },
       link:function($scope,$element,$attrs){
           $scope.options = alertPageOptions;
           if(!$scope.options.started) loadAlerts();
           $scope.startMoving = function(i){
               $scope.startMovingAt = i
           }
           $scope.removeAlert = function(i){
               $scope.options.removeAlert(i);
           }
           $scope.sortableOptions = {
               change:$scope.options.saveAlerts
           };
           $scope.download = function(alert){
               alert.data = $filter('orderBy')(alert.data,'name');
               UserAlertsService.download({alert:alert},function(response){
                   HelperService.buildFileFromData(response.content,downloadFileName(alert));
               });
           }
           function downloadFileName(alert){
               var filename = alert.labelReplaced || alert.label;
               filename = filename.replace(/ /g,'_');
               filename+= moment().format('YYYYMMDDHHmmss') + '.csv';
               return filename;
           }
           function loadAlerts(){
               $scope.options.init();
               setTimeout(function(){$scope.$apply()});
           }
           UserAlertsService.log();

       }
   }
}]).directive('alertContent',['$compile',function($compile){
    return{
        restrict:'A',
        scope:{
            content:'=?'
        },
        link:function(scope,element){
            var unWatchType = scope.$watch('content.type',reloadContent);
            function reloadContent(){
                element.empty();
                var directive = prepareDirectiveName(scope.content.type);
                var directiveEl = '<'+ directive+' data="content.data" table-header="content.tableHeader"></'+directive +'>';
                var compiled = $compile(directiveEl)(scope);
                element.append(compiled);
            }
            function prepareDirectiveName(type){
                type = type.toLowerCase().replace(/_/g,'-');
                return 'alert-'+type;
            }
            element.on('$destroy',function(){
                unWatchType();
                scope.$destroy();
            })
        }
    }
}]).directive('alertConfig',['$compile',function($compile){
    return{
        restrict:'A',
        link:function(scope,element){
            var unWatchType = scope.$watch('alert.configDirective',reloadContent);
            function reloadContent(directive){
                element.empty();
                if(!directive) return;
                var directiveEl = '<div ' +directive + '></div>';
                var compiled = $compile(directiveEl)(scope);
                element.append(compiled);
            }

            element.on('$destroy',function(){
                unWatchType();
                scope.$destroy();
            })
        }
    }
}]).directive('alertOkButton',function(){
    return {
        restrict:'E',
        template:'<span class="btn btn-sm btn-primary pull-right config-ok-btn " ng-click="options.saveAlerts();options.validateAndLoad(alert);alert.openConfig=false">Ok</span>'
    }
}).directive('alertBox',function(){
    return{
        restrict: 'A',
        link:function(s,element){
            function adjustBodyHeight(){
                setTimeout(function(){
                    var headerHeight = element.find('.panel-heading').outerHeight();
                    var maxHeight = 'calc(100% - ' + headerHeight + 'px)'
                    element.find('.panel-body').css('max-height',maxHeight);
                })
            }
            var unWatch = s.$watch(function(){
                return element[0].className
            },function(newValue,oldValue){
                if(newValue && newValue != oldValue){
                    adjustBodyHeight()
                }
            })
            element.on('$destroy',function(){
                unWatch();
                s.$destroy();
            })

        }
    }
});

}());