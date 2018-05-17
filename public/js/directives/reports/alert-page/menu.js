'use strict';
(function(){
    angular.module('app').directive('alertPageMenu',['alertPageOptions',function(alertPageOptions){
        return{
            restrict: 'E',
            templateUrl:'/public/views/directives/reports/alert-page/menu.html',
            link:function($scope,$element,$attrs){
                $scope.properties = {
                    expanded:false,
                    currentMenu:{}
                };
                $scope.options = alertPageOptions;
                if(!$scope.options.started) loadAlerts();
                function loadAlerts(){
                    $scope.options.init();
                    setTimeout(function(){$scope.$apply()});
                }
                $scope.menus = {
                    ADD:{
                        id:'add',
                        icon:'fa-plus-square',
                        tooltip:'Subscribe to new alert'
                    },
                    LAYOUT:{
                        id:'layout',
                        icon:'fa-th-large',
                        tooltip:'Change page layout'
                    }
                };


                $scope.changeMenuTo = function(to){ //@to = menus type
                    if(to!=$scope.properties.currentMenu){
                        $scope.properties.currentMenu = to
                        if(!$scope.properties.expanded)
                            toggleMenuExpand()
                    }else{
                        if($scope.properties.expanded){
                            toggleMenuExpand()
                            $scope.properties.currentMenu={};
                        }

                    }

                }
                function toggleMenuExpand(){
                    $scope.properties.expanded = !$scope.properties.expanded;
                    if($scope.properties.expanded)
                        $element.addClass('expanded')
                    else{
                        $element.removeClass('expanded')
                        $scope.properties.currentMenu={};
                    }

                }
                $scope.addAlert = function(alert){
                    if(alert.used) return;
                    $scope.options.addAlert(alert);
                    toggleMenuExpand()
                }
                $scope.changeLayout = function(layout){
                    $scope.options.layout = layout;
                    $scope.options.saveAlerts()
                    refreshAlerts();
                    toggleMenuExpand()
                }
                function refreshAlerts(){
                    var tempAlerts = $scope.options.alerts;
                    $scope.options.alerts=[];
                    setTimeout(function(){
                        $scope.options.alerts = tempAlerts;
                        setTimeout(function(){$scope.$apply()});
                    })
                }
                $element.css('min-height',angular.element(window).height());
            }
        }
    }]).directive('alertPageMenuItem',function(){
        return{
            restrict:'E',
            replace:true,
            template:'<span class="fa" ng-class="menu.icon" tooltip="{{menu.tooltip}}" tooltip-placement="right" tooltip-append-to-body="true" ng-click="$parent.changeMenuTo(menu)"></span>',
            scope:{
                menu:'='
            }
        }
    })
}());