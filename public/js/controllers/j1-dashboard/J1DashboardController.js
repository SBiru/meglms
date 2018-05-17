angular.module('app')
    .factory('SharedTestDashboardController',function(){
        var Controller = function($scope,ProficiencyTestService,params){
            this.toggleSidebar = function(){
                this.sidebarCollapsed = !this.sidebarCollapsed;
                var xValue = this.sidebarCollapsed?"-100%":"0";
                $('.sidebar').css({"transform": "translateX("+xValue+")"});
            };

            ProficiencyTestService.getClasses({isJ1:params.isJ1,isE3PT:params.isE3PT}).$promise.then((function(classes){
                if(($scope.$state.includes('home.with_tabs.' + params.dashboardState) || $scope.$state.includes('home.no_tabs.'+ params.dashboardState))
                    && !$scope.$state.params.classId){
                    $scope.$state.go($scope.$state.$current.path[2].self.name + '.nav',{classId:classes[0].id});
                }
                if(classes.length>1){
                    this.classes = classes;
                    setTimeout(function(){$('.applicants-container').css('height','calc(100% - 106px)')})
                }
            }).bind(this));
            this.height = (window.innerHeight - 130) + 'px';
            this.sidebarCollapsed = true;
        };
        return Controller;

    })
    .controller('J1DashboardController',['$scope','ProficiencyTestService','SharedTestDashboardController',function($scope,ProficiencyTestService,SharedTestDashboardController){
        SharedTestDashboardController.call(this,$scope,ProficiencyTestService,{
            dashboardState:'j1_dashboard',
            isJ1:1,
            isE3PT:0
        });
    }]);