angular.module('app')

    /*
    * All current students report
    * */

.directive('allCurrentStudents',
[ 'Report',
    'Organization',
    function(Report,Organization) {
        return {
            restrict: 'E',
            scope: {

            },
            templateUrl: '/public/views/directives/reports/allcurrentusers.html',
            link: function ($scope, $element,$attrs) {
                $scope.tableHeader = [
                    {id:'name',label:'Class'},
                    {id:'grade',label:'Grade'},
                    {id:'percCompletedTasks',label:'Current course progress (%)'},
                    {id:'percExpectedTasks',label:'Expected course progress (%)'},
                    {id:'expectedEndDate',label:'Expected completion date',functions:{'formatDate':formatDate},rowTemplate:'{{functions.formatDate(data.expectedEndDate)}}'},
                    {id:'projectedEndDate',label:'Projected end date',functions:{'formatDate':formatDate},rowTemplate:'{{functions.formatDate(data.projectedEndDate)}}'},
                ]
                getReport();
                $scope.user = $scope.$root.user;
                $scope.filterOrg = filterOrg
                if($scope.$root.user.is_super_admin){
                    getOrgs();
                }

                $scope.toggleOpenAll = function(){
                    for(var i=0;i<$scope.report.length;i++){
                        $scope.report[i].show=$scope.openAll;
                    }
                }
                $scope.getClassesLength = function(student){
                    return Object.keys(student.classes).length;
                }
                function filterOrg(student){
                    if(!$scope.filterOrganization)
                        return true;
                    return student.organizationid===$scope.filterOrganization;
                }
                function formatDate(time){
                    return moment(time).format("MM/DD/YYYY");
                };
                function getOrgs(){
                    Organization.query({userId:'me'},function(result){
                        var orgs = _.map(result.organizations,function(org){org.id=parseInt(org.id);return org; });
                        orgs.unshift({name:'All'});
                        $scope.organizations = orgs
                    });
                }
                function getReport(){
                    $scope.loading = true;
                    Report.retrieve('students').then(
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
])
