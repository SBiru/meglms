if(typeof DASHBOARD_STATUS === 'undefined')
    window.DASHBOARD_STATUS = {}
var Dashboards = function(status){
    this.status = status;
    this.needMove = window.location.pathname.indexOf('/home') >= 0;
    this.getState = function(){
        if(!this.needMove) return null;
        if(this.useProficiency()){
            var state = this.getProficiencyState();
            if(state)
                return state;
        }

        if(this.useCompliance()){
            var state = this.getComplianceState();
            if(state)
                return state;
        }
        return this.getHomeState();

    };
    this.useProficiency = function(){
        return typeof this.status.proficiency !== 'undefined' && this.status.proficiency.used
    };
    this.useCompliance = function(){
        return this.status.compliance
    };
    this.getProficiencyState = function(){
        if(this.status.proficiency.roles.length === 1 && this.status.proficiency.roles.indexOf('student')>=0 ){
            return {state:'home.with_tabs.dashboard.summary'};
        }else{
            if(window.location.hash.indexOf('dashboard')<0){
                var stateTabs = this.status.proficiency.onlyProficiencyClasses?'no_tabs':'with_tabs';
                if(this.status.proficiency['j1-available'] && this.status.j1)
                    return {state:'home.'+stateTabs+'.j1_dashboard.nav'};
                else if(this.status.e3pt)
                    return {state:'home.'+stateTabs+'.e3pt_dashboard.nav',params:{classId:0}};
            }

        }
    };
    this.getComplianceState = function(){
        return {state:'home.with_tabs.compliance.users_nav'}
    }
    this.getHomeState = function(){
        if(this.status.isOnlyStudent || !this.status.any)
            return {state:'home.no_tabs'};
        else return {state:'home.with_tabs'};
    }
};
appControllers.controller('PreferenceController', ['$rootScope', '$scope', '$timeout', 'Preference','$location','UserV2','ProficiencyTestService','E3WsCurrentJob',
    function($rootScope, $scope, $timeout, Preference,$location,UserV2,ProficiencyTestService,E3WsCurrentJob) {
        $scope.preference = {};
        $rootScope.preference={};
        $scope.language_direction = 'ltr';
        $scope.$root.prepareUserName = UserV2.prepareUserName;
        UserV2.getUser();
        Preference.get({userId: 'me'}, function(preference){
            $rootScope.preference = preference;
            $scope.preference = preference;

            if(preference.rtl == "1"){
                $scope.language_direction = "rtl";
            }

            /*
            DSerejo 2015-02-02
            Broadcasting data so child controllers can use it.
             */
            $scope.$broadcast('preference',preference);
        });
        $scope.getExpandSidebarIconCls = function(){
            if($scope.language_direction = 'ltr'){
                return "sidebar-expand-icon-left";
            } else {
                return "sidebar-expand-item-right";
            }
        }
        window.dashboards = new Dashboards(DASHBOARD_STATUS);
        $scope.$root.proficiencyTestStatus = DASHBOARD_STATUS;
        var newState = window.dashboards.getState();
        if(newState){
            setTimeout(function(){
                $scope.$state.go(newState.state,newState.params)
            })

        }




        $scope.$on('ChangeToRTLCourse', function(event, data) {
            $scope.language_direction = "rtl";
            $rootScope.$broadcast('MoveTaskStatusToLeft');
        });

        $scope.$on('ChangeToLTRCourse', function(event, data) {
            $scope.language_direction = "ltr";
            $rootScope.$broadcast('MoveTaskStatusToRight');
        });
        $scope.$root.$watch('user',function(user){
            if(user && !$scope.$root.e3Ws){
                $scope.$root.e3Ws = new E3Ws(user.id);
                window.e3Ws = $scope.$root.e3Ws;
                E3WsCurrentJob.setRoutScope($scope.$root);
                E3WsCurrentJob.init($scope.$root.e3Ws);

            }
        });
        $scope.backgroundImage = function(){
            if($scope.$root.backgroundUrl && $rootScope.$stateParams.contentId && $scope.$root.backgroundUrl[$rootScope.$stateParams.contentId])
                return 'url("'+$scope.$root.backgroundUrl[$rootScope.$stateParams.contentId]+'")';
        }
        $scope.$root.windowWidth = $(window).width();
        $(window).resize( function(){
            $scope.$root.windowWidth = $(window).width();
            $scope.$apply();
        } )

    }
]);
