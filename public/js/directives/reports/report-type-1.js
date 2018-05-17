angular.module('app')

    .directive('reportType1',
    [ '$q','UserV2','Report','OrganizationV2','Organization',
        function($q,UserV2,Report,OrganizationV2,Organization) {
            var REQUIRED_CONFIG = [
                'endpoint',
                'right_panel_label',
                'chart_bottom_text',
                'studentTableHeader'
            ];
            return {
                restrict: 'E',
                scope: {
                    config:'=?'
                },
                templateUrl: '/public/views/directives/reports/report-type-1.html?v='+window.currentJsVersion,
                link: function ($scope, $element,$attrs) {
                    checkConfig();
                    if(!$scope.$root.me){
                        UserV2.getUser().then(function(me){$scope.$root.me=me});
                    }if($scope.$root.user.is_super_admin){
                        getOrgs();
                    }

                    var original;

                    $scope.amIAdmin = $scope.$root.amIAdmin;
                    $scope.teachers = $scope.$root.teachers;
                    $scope.selectStudent=selectStudent;
                    $scope.closeSelectedGroup=closeSelectedGroup;
                    $scope.getRightPanelLabelValue = $scope.config.getRightPanelLabelValue || getRightPanelLabelValue;

                    $scope.onClick=onClick;

                    $scope.$watch('selected.class',getClass);


                    $scope.report={};
                    $scope.selected={};

                    function getOrgs(){
                        Organization.query({userId:'me'},function(result){
                            $scope.organizations = _.map(result.organizations,function(org){org.id=parseInt(org.id);return org; });
                            $scope.filterOrganization = $scope.organizations[0].id;
                        });
                    }

                    function getClass(){
                        if(!$scope.selected.class) return;
                        $scope.loading=true;
                        delete $scope.report;
                        delete $scope.selectedGroup;
                        var promise = Report.retrieve($scope.config.endpoint+'/'+$scope.selected.class);
                        promise.then(
                            function(resp){
                                original = angular.copy(resp);
                                $scope.loading=false;

                                $scope.report=resp;
                                selectStudent('all');

                            },
                            function(error){
                                $scope.error =error.error;
                                $scope.loading=false;
                            }
                        );
                        
                    }
                    function onClick(group, evt) {

                        $scope.selectedGroup={
                            label:group[0].label,
                            students:_.map($scope.report.groupedData[group[0].label],function(studentIndex){
                                return $scope.report.students[studentIndex];
                            })
                        };
                        selectStudent('all');
                    }
                    function selectStudent(student){
                        var isAll = student=='all';
                        if(isAll){
                            student=$scope.report;
                            $scope.selected.studentId='all';
                            $scope.selected.student=$scope.report;
                        }else{
                            if(student){
                                $scope.selected.studentId=student.id
                                $scope.selected.student=student
                            }else{
                                student=$scope.selected.student
                            }
                        }
                        if(!student) return;
                        if(!student.hasPreparedPages && !isAll)
                            preparePages(student)
                    }
                    function preparePages(student){
                        student.pages = _.map(student.pages,function(p){
                            return $scope.report.pages[p];
                        })
                        student.hasPreparedPages = true
                    }
                    function checkConfig(){
                        if(!$scope.config)
                            throw "config attr is required";
                        _.each(REQUIRED_CONFIG,function(c){
                            if(!$scope.config[c]){
                                throw c+" is required in the config attr"
                            }
                        })
                    }
                    function closeSelectedGroup(){
                        delete $scope.selectedGroup;
                        selectStudent('all');
                    }
                    function getRightPanelLabelValue(page){
                        return page.itemsPerPage;
                    }


                }
            }
        }
    ]);

