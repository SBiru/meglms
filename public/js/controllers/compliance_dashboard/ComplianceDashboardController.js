angular.module('app')
    .controller('ComplianceDashboardController',['$scope','ProficiencyTestService',function($scope,ProficiencyTestService){
        this.toggleSidebar = function(){
            this.sidebarCollapsed = !this.sidebarCollapsed;
            var xValue = this.sidebarCollapsed?"-100%":"0";
            $('.sidebar').css({"transform": "translateX("+xValue+")"});
        };

        // ProficiencyTestService.getClasses({isJ1:true}).$promise.then((function(classes){
        //     if(($scope.$state.includes('home.with_tabs.compliance') || $scope.$state.includes('home.no_tabs.compliance'))
        //         && !$scope.$state.params.classId){
        //         $scope.$state.go($scope.$state.$current.path[2].self.name + '.nav',{classId:classes[0].id});
        //     }
        //     if(classes.length>1){
        //         this.classes = classes;
        //         setTimeout(function(){$('.applicants-container').css('height','calc(100% - 106px)')})
        //     }
        // }).bind(this));
        // this.height = (window.innerHeight - 130) + 'px';
        this.sidebarCollapsed = true;

        // if(isMobile.any()){
        //     setTimeout(this.toggleSidebar.bind(this),500)
        // }
    }])
    .service('ComplianceDashboard',['$resource',function($resource){
        var rootUrl = '/api/compliance-dashboard';
        return $resource(rootUrl,{userId:'@userId',classId:'@classId'},{
            getUsers:{
                url:rootUrl+'/users'
            },
            getUser:{
                url:rootUrl+'/users/:userId'
            },
            getClasses:{
                url:rootUrl+'/classes'
            },
            getClass:{
                url:rootUrl+'/classes/:classId'
            }
        })
    }])
;