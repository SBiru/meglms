if (!angular.isDefined(appControllers))
    appControllers = angular.module('app.testbank');
appControllers.controller('RubricsMenuController', [
    '$scope',
    '$state',
    'Rubrics',
    'Organization',
    'RubricService',
    'User',
    'OrganizationV2',
    'CurrentOrganizationId',
    'CurrentClassId',
    'Cookiecutter',
    function ($scope, $state, Rubrics, Organization, RubricService, User,OrganizationV2,CurrentOrganizationId,CurrentClassId,Cookiecutter) {
        $scope.rubrcService = RubricService;


        function getRubricsByOrg(newValue) {
            $scope.loading = true;
            if (angular.isDefined(newValue)) {
                Rubrics.getOrgRubrics({
                    org_id: newValue
                }, function (response) {
                    $scope.rubrics = response.rubrics;
                    if ($scope.waitingRubrics) {
                        $scope.waitingRubrics = false
                        $scope.finish();
                    }
                    $scope.loading = false;
                })
            }
        }
        function getRubricsByClass(newValue) {
            if(!newValue) return;
            $scope.loading = true;
            if (angular.isDefined(newValue) && newValue) {
                CurrentClassId.setClassId(newValue );
                RubricService.class_id = newValue;
                Rubrics.query({
                    org_id: $scope.org_id,
                    classid:newValue
                }, function (response) {
                    $scope.rubrics = response.rubrics;
                    if ($scope.waitingRubrics) {
                        $scope.waitingRubrics = false
                        $scope.finish();
                    }
                    $scope.loading = false;
                })
            }
        }
        function getClassesByOrg(org) {
            //if (org) {
            //   CurrentOrganizationId.setOrganizationId(org);
            //    $scope.$state.params.org_id=org;
            //    $scope.classes = OrganizationV2.getClasses({
            //        id:org,
            //        isEditTeacher:true
            //    },function(ok){
            //        if($scope.classes.length){
            //            var currentClass = Cookiecutter.getCookiebyname('class_id');
            //            if(currentClass){
            //                $scope.class_id=currentClass;
            //            }else{
            //                $scope.class_id=$scope.classes[0].id;
            //            }
            //
            //        }
            //
            //
            //    });
            //}
        }
        $scope.$watch('filter',function(filter){

            if(!filter) return;
            if (!(filter && filter.length)) return;
            var params = {};
            _.each(filter,function(f){
                params[f.id + 'Id'] = f.value;
            })
            $scope.loading = true;
            Rubrics.query(params, function (rubrics) {
                $scope.rubrics = rubrics;
                if ($scope.waitingRubrics) {
                    $scope.waitingRubrics = false
                    $scope.finish();
                }
                $scope.loading = false;
            })
        },true);

        if ($scope.$state && $scope.$state.includes('rubrics')) {
            $scope.$watch('org_id', getClassesByOrg);
            $scope.$watch('class_id', getRubricsByClass);
            if ($scope.$state.params.org_id) {
                $scope.org_id = $scope.$state.params.org_id;
            }

        } else {
            $scope.$watch('$parent.org_id', getRubricsByOrg);
            $scope.org_id = $scope.$parent.org_id;

        }

        $scope.$watch('selected_id', function (newValue) {
            if (angular.isDefined(newValue) && newValue != null)
                RubricService.data.selected_id = newValue;
        });


        $scope.$watch('RubricService.data.stored_id', function(){
            if (angular.isDefined(RubricService.data.stored_id)) {
                $scope.selected_id = RubricService.data.stored_id;
                RubricService.data.id = RubricService.data.stored_id;
                $scope.finish();
            }
        });

        Organization.get({
            userId: 'me'
        }, function (organizations) {
            $scope.organizations = organizations.organizations;
            var currentOrg = Cookiecutter.getCookiebyname('organization_id');
            if(currentOrg){
                $scope.org_id=currentOrg
            }else{
                $scope.org_id = $scope.$root.user.org_id;
            }

        });
        $scope.create = function () {
            $scope.$root.$broadcast('create_new');
        };
        $scope.save = function () {
            $scope.$parent.$broadcast('saveRubric');
        };
        $scope.delete = function (id) {
            if (!angular.isDefined(id))
                id = $scope.selected_id;
            if (confirm('Are you sure you want to delete this rubric?') == true) {
                $scope.loading = true;
                Rubrics.delete({
                    id: id
                }, function (response) {
                    $scope.loading = false;
                    $scope.$root.$emit('delete', {
                        id: id
                    });

                });
            }
        }
        $scope.finish = function () {
            if (!angular.isDefined($scope.rubrics)) {
                $scope.waitingRubrics = true;
                return;
            }

            if (RubricService.data.id == 0 || RubricService.data.id == undefined) {
                return true;
            }
            RubricService.data.selected = _.findWhere($scope.rubrics, {
                id: RubricService.data.id
            });
            return false;
        }

        $scope.$root.$on('delete', function (event, data) {
            $scope.rubrics = _.without($scope.rubrics, _.findWhere($scope.rubrics, {
                id: data.id
            }));
        });
        $scope.$root.$on('create', function (event, data) {
            $scope.rubrics.push(data);
            $scope.selected_id = data.id;
            if ($state && $state.current.name.indexOf('rubrics') >= 0)
                $state.go('rubrics.edit', {
                    org_id: $scope.org_id,
                    id: data.id
                });
        });
        $scope.$root.$on('update', function (event, data) {
            for (var i in $scope.rubrics) {
                if ($scope.rubrics[i].id == data.id) {
                    $scope.rubrics[i].name = data.name;
                    break;
                }
            }

        });


        $scope.$watch('rubricService.data.id', function () {
            $scope.finish();
        });
        if(RubricService.data.stored_id){
            if (angular.isDefined(RubricService.data.stored_id)) {
                $scope.selected_id = RubricService.data.stored_id;
                RubricService.data.id = RubricService.data.stored_id;
                $scope.finish();
            }
        }

    }
]);