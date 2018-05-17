angular.module('app')
    .controller('E3PTDashboardController',['$scope','ProficiencyTestService','SharedTestDashboardController',function($scope,ProficiencyTestService,SharedTestDashboardController){
        SharedTestDashboardController.call(this,$scope,ProficiencyTestService,{
            dashboardState:'e3pt_dashboard',
            isJ1:0,
            isE3PT:1
        });
    }])