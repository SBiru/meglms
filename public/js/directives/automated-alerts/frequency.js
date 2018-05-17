

(function () {
    "use strict";

    var app = angular.module('automatedAlerts');
    app.directive('alertFrequency',[
        function(){
            return {
                restrict:'E',
                templateUrl:'/public/views/directives/automated-alerts/frequency.html',
                scope:{
                    alert:'=automatedAlert'
                },
                link:function(scope,element){
                    var frequency = alert.frenquency;
                    scope.daysOfMonth = _.range(1,32);
                    scope.alert.frequency.offset = scope.alert.frequency.offset||0;
                    scope.range = _.range
                }
            }
    }])
    app.controller('alertTimepickerController',['$scope',function($scope){
        $scope.hstep = 1;
        $scope.mstep = 15;
    }])

}());