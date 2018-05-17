angular.module('app')
    .directive('filterClassReport',
        [ '$q','UserV2','Report','OrganizationV2','Class',
            function($q,UserV2,Report,OrganizationV2,Class) {
                return {
                    restrict: 'E',
                    require: ['ngModel'],
                    scope: {
                        orgId:'=?'
                    },
                    templateUrl: '/public/views/directives/reports/filter-class-report.html',
                    link: function ($scope, $element,$attrs,ctrls) {
                        var ngModel = ctrls[0];
                        if(!$scope.$root.me){
                            UserV2.getUser().then(function(me){$scope.$root.me=me});
                        }
                        $scope.amIAdmin = $scope.$root.amIAdmin;
                        $scope.isTeacher=isTeacher;
                        $scope.$watch('class.selected',getClass);

                        $scope.$root.$watch('me',function(){
                            if($scope.amIAdmin() || $scope.$root.user.is_advisor){
                                if(!$scope.$root.allClasses){
                                    $scope.loading = true;
                                    if($scope.amIAdmin())
                                        OrganizationV2.getClasses({id:$scope.$root.me.orgId}).$promise.then(handleResult);
                                    else
                                        Class.getForAdvisor().$promise.then(handleResult);
                                    function handleResult(classes){
                                        $scope.loading = false;
                                        $scope.$root.allClasses = classes;
                                        setClasses($scope.$root.allClasses);
                                    }
                                }else{
                                    setClasses($scope.$root.allClasses);
                                }
                            }
                            else{
                                setClasses($scope.$root.me.classes)
                            }
                        });

                        $scope.$watch('orgId',filterOrg)
                        $scope.class={};
                        function setClasses(classes){
                            $scope.originalClasses = addAllLabel(prepareClasses(classes));
                            filterOrg();
                        }
                        function filterOrg(){
                            if($scope.orgId){
                                $scope.classes = _.filter($scope.originalClasses,function(c){
                                    return c.id=='all' || c.orgId == $scope.orgId
                                })
                            }else{
                                $scope.classes = $scope.originalClasses;
                            }
                        }
                        function isTeacher(c){
                            return $scope.amIAdmin()||$scope.$root.user.is_advisor||c.isTeacher;
                        }
                        function prepareClasses(classes){
                            var classesWithGroups = {};
                            _.each(classes,function(c){
                                if((c.id+'').indexOf('-')<0){
                                    if(c.groupId){
                                        if(!classesWithGroups[c.id]){
                                            classesWithGroups[c.id] = {
                                                id:c.id,
                                                name:(c.className || c.name) + ' - All Groups',
                                                isTeacher:c.isTeacher,
                                                orgId:c.orgId
                                            }
                                        }
                                    }
                                    c.id = c.groupId?c.id+'-'+c.groupId:c.id;

                                }
                                c.name = c.fullname || c.name
                            });
                            _.each(classesWithGroups,function(c){
                                classes.unshift(c);
                            });

                            return _.sortBy(classes,'name');
                        }
                        function addAllLabel(classes){
                            if(!classes) return classes;
                            var cs = angular.copy(classes);
                            cs.unshift({
                                id:'all',
                                name:"-All",
                                isTeacher:true
                            });
                            return cs;
                        }
                        function getClass(id) {
                            ngModel.$setViewValue(id);
                        }

                    }
                }
            }
        ]);

