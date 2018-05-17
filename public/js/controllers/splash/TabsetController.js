appControllers.controller('HomeTabsetController',['$scope',
    function($scope){
        var self = this;
        this.active = 0;
        this.selectTab = function(index){
            this.active = index;
            $tabController = $('.tab-content').scope();
            $tabController.tabs[index].active = true;
            setTimeout(function(){$tabController.$apply()});

        }
        this.onSelect = function(tab){
            if(tab==='j1')
                self.active = 1;
            if(tab==='e3pt')
                self.active = 2;
            if(tab==='users')
                self.active = 3;
            if(tab==='classes')
                self.active = 4;
            setTimeout(changeState);
        };
        function changeState(){
            if(self.active==1 && !$scope.$state.$current.includes["home.with_tabs.j1_dashboard.nav"]){
                if($scope.$root.proficiencyTestStatus.proficiency.roles.length === 1 && $scope.$root.proficiencyTestStatus.proficiency.roles.indexOf('student')>=0 ){
                    $scope.$state.go('home.with_tabs.dashboard.summary');
                }else{
                    $scope.$state.go('home.with_tabs.j1_dashboard.nav');
                }
            }

            else if(self.active==2){
                if($scope.$root.proficiencyTestStatus.proficiency.roles.length === 1 && $scope.$root.proficiencyTestStatus.proficiency.roles.indexOf('student')>=0 ){
                    $scope.$state.go('home.with_tabs.dashboard.summary');
                }else{
                    $scope.$state.go('home.with_tabs.e3pt_dashboard.nav');
                }

            }
            else if(self.active===3)
                $scope.$state.go('home.with_tabs.compliance.users_nav');
            else if(self.active===4)
                $scope.$state.go('home.with_tabs.compliance.classes_nav');
        }
        if($scope.$state.includes('home.with_tabs.j1_dashboard'))
            setTimeout(this.selectTab.bind(this,1));
        if($scope.$state.includes('home.with_tabs.e3pt_dashboard'))
            setTimeout(this.selectTab.bind(this,2));
        if($scope.$state.includes('home.with_tabs.compliance'))
            setTimeout(this.selectTab.bind(this,3));

    }
])