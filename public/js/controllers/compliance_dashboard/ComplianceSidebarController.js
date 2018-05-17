
angular.module('app')
    .controller('ComplianceUsersSidebarController',['$scope','ComplianceDashboard','ComplianceSidebarShared',function($scope,ComplianceDashboard,ComplianceSidebarShared){
        var dashboardCtrl = $scope.vc_dash;
        var vc_sidebar = this;

        vc_sidebar.nextState = 'user';
        vc_sidebar.placeholder = 'Search for a user';
        vc_sidebar.badgeTooltip = 'Number of incomplete courses';

        ComplianceSidebarShared.init(vc_sidebar,'getUsers',dashboardCtrl,'User Name');

        this.getData();

        this.navState = $scope.$state.$current.path[3].self.name


    }])
    .controller('ComplianceClassesSidebarController',['$scope','ComplianceDashboard','ComplianceSidebarShared',function($scope,ComplianceDashboard,ComplianceSidebarShared){
        var dashboardCtrl = $scope.vc_dash;
        var vc_sidebar = this;

        vc_sidebar.placeholder = 'Search for a class';
        vc_sidebar.nextState = 'class';
        vc_sidebar.badgeTooltip = 'Number of users who are in progress';

        ComplianceSidebarShared.init(vc_sidebar,'getClasses',dashboardCtrl,'Class')

        this.getData();

        this.navState = $scope.$state.$current.path[3].self.name
    }])
    .factory('ComplianceSidebarShared',['ComplianceDashboard',function(ComplianceDashboard){
        var Column = function(label,id){
            this.label = label
            this.id = id;
            this.orderBy = '';
            this.symbol = ''
            this.order = 1;
            this.isActive = false;
            this.resetSymbol = function(){
                this.symbol = ''
                this.isActive = false;
            };
            this.activate = function(){
                if(this.isActive){
                    this.order *= -1
                }
                this.isActive = true;

                if(this.order>0){
                    this.orderBy = this.id;
                    this.symbol = 'fa fa-caret-up';
                }else{
                    this.orderBy = '-'+this.id;
                    this.symbol = 'fa fa-caret-down';
                }
            }
        };
        var method,vc;

        return {
            rowInitials: function(row){
                var parts = row.name.split(' ');
                if(parts.length>1)
                    return parts[0][0] + parts[1][0];
                return parts[0][0] + parts[0][1]
            },
            sortBy:function(col) {
                this.columns.forEach(function(c){if(c.id!==col.id)c.resetSymbol()})
                col.activate();
                this.activeColumn = col;

            },
            getData:function(){
                if(vc.loading) return;
                vc.loading = true;

                ComplianceDashboard[method]({limit:20,page:vc.paginationConfig.currentPage+1,term:vc.searchText}).$promise.then(function(res){
                    vc.loading = false;
                    vc.navData = res;
                    vc.paginationConfig.total = res.total
                    vc.paginationConfig.currentPage = res.page-1
                    vc.paginationConfig.restart()
                    if(res.totalPages>1){
                        $('.applicants-container').addClass('with-pagination');
                    }else $('.applicants-container').removeClass('with-pagination');
                },function(){
                    vc.loading = false;
                });
            },
            init:function(_vc,_m,dashboardCtrl,title){
                method = _m;
                vc = _vc;
                vc.textChanged = function(){
                    vc.textTimeout && clearTimeout(vc.textTimeout);
                    vc.textTimeout = setTimeout(vc.getData,500);
                };
                vc.paginationConfig = {
                    itemsPerPage: 20,
                    showOnTop:true,
                    showOnBottom:false,
                    currentPage:0

                };
                vc.getData = this.getData.bind(vc);

                vc.activeColumn = null;
                vc.sortBy = this.sortBy.bind(vc);
                vc.columns = [
                    new Column(title,'name'),
                    new Column('Progress','inProgress')
                ];
                vc.sortBy(vc.columns[0]);

                vc.checkSidebar = function(){
                    if(window.innerWidth<768){
                        dashboardCtrl.toggleSidebar()
                    }
                };
                vc.rowInitials = this.rowInitials;
            }

    }
    }])
;