angular.module('app')

    /*
    * All current students report
    * */

.directive('notLoggedIn',
[ 'Report',
    'Organization',
    function(Report,Organization) {
        return {
            restrict: 'E',
            scope: {

            },
            templateUrl: '/public/views/directives/reports/not-logged-in.html?v='+window.currentJsVersion,
            link: function ($scope, $element,$attrs) {

                $scope.user = $scope.$root.user;
                $scope.selected = {};
                if($scope.$root.user.is_super_admin){
                    getOrgs();
                }else{
                    getReport();
                }
                $scope.$watch('filterOrganization',function(orgId){
                    if(orgId){
                        getReport();
                    }
                });
                $scope.$watch('selected.class',function(classId){
                    if(classId){
                        getReport();
                    }
                });
                function getOrgs(){
                    Organization.query({userId:'me'},function(result){
                        $scope.organizations = _.map(result.organizations,function(org){org.id=parseInt(org.id);return org; });
                        $scope.filterOrganization = $scope.organizations[0].id;
                    });
                }
                function getReport(){
                    $scope.loading = true;
                    var orgId = $scope.filterOrganization && $scope.filterOrganization!=='all'?$scope.filterOrganization:undefined;
                    var classId = $scope.selected.class && $scope.filterOrganization!=='all'?$scope.selected.class:undefined;
                    Report.retrieve('notloggedin',{orgId:orgId,classId:classId}).then(
                        function(report){
                            $scope.report = report;
                            $scope.loading = false;
                        },
                        function(error){
                            $scope.loading = false;
                            $scope.error = error;
                        }
                    )
                }


            }
        }
    }
]);
