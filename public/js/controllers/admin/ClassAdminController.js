appControllers.controller('ClassAdminController', ['$rootScope', '$scope', '$timeout', 'CourseClass', 'CurrentClassId', 'CurrentDepartmentId', 'Cookiecutter','CurrentTermId','CurrentOrganizationId',
    function($rootScope, $scope, $timeout, CourseClass, CurrentClassId, CurrentDepartmentId, Cookiecutter,CurrentTermId,CurrentOrganizationId) {
        $scope.currentname = '';

        $scope.$on('NavDepartmentUpdate', function(event, data) {
            $scope.departmentId=CurrentDepartmentId.getDepartmentId();

            CourseClass.terms({
                departmentId: CurrentDepartmentId.getDepartmentId()
            },function(response){
                $scope.terms = response.terms;
                var non_selected_term = {
                    name:"Not selected",
                    id:0
                }
                $scope.terms.splice(0,0,non_selected_term);
                if ($scope.terms.length > 0) {

                    $scope.currentid=CurrentTermId.getTermId(Cookiecutter.returntermid($scope.terms));
                    if($scope.currentid>0)
                        $scope.currenttermname=_.findWhere($scope.terms,{id:$scope.currenttermid}).name;
                    $rootScope.$broadcast('NavTermUpdate');
                } else {
                    CurrentDepartmentId.setDepartmentId(0);
                    $scope.currenttermname = '';

                    $rootScope.$broadcast('NavTermUpdate');
                }
            });




            CourseClass.get({
                departmentId: CurrentDepartmentId.getDepartmentId()
            }, function(classes) {
                // console.log("CourseAdmin: " + angular.toJson(courses));

                $scope.$root.classes = classes.classes;

                if (angular.isDefined($scope.classes) && angular.isDefined($scope.classes.length) && $scope.classes.length > 0) {
                    CurrentClassId.setClassId(Cookiecutter.returncourseid($scope.classes));

                    //returncourename(CurrentClassId.getClassId(), $scope.classes);
                    $scope.currentname = Cookiecutter.returnclassname(CurrentClassId.getClassId(), $scope.classes);
                    $scope.currentid=CurrentClassId.getClassId();
                    $scope.$root.currentClassid=CurrentClassId.getClassId();
                    // console.log("Course SERVICE CURRENT COURSE ID: " + CurrentCourseId.getCourseId());

                    //$rootScope.$broadcast('NavUpdate');
                } else {
                    CurrentClassId.getClassId(0);
                    $scope.currentname = '';
                    // console.log("Course SERVICE CURRENT COURSE ID: " + CurrentCourseId.getCourseId());

                    //$rootScope.$broadcast('NavUpdate');

                }
            });
        });
        $scope.isActive = function(class_){
            return $scope.$root.$stateParams.classId==class_.id
        }
        $scope.changeTerm= function(termId){
            if(termId==0){
                delete $scope.currenttermid;
                $scope.currenttermname = $scope.terms[0].name;
            }
            if (termId == CurrentTermId.getTermId()) return;
            var term = _.findWhere($scope.terms,{id:termId});
            CurrentClassId.setClassId(term.id);
            $scope.currenttermname= term.name;

            $scope.currenttermid=term.id;
        };
        //$scope.changeClass = function(classId) {
        //    // console.log("Change To Course ID: " + courseId);
        //    if (classId == CurrentClassId.getClassId()) return
        //
        //    for (var i = 0; i < $scope.classes.length; i++) {
        //        if ($scope.classes[i].id == classId) {
        //            CurrentClassId.setClassId($scope.classes[i].id);
        //            $scope.currentname = $scope.classes[i].name;
        //            // console.log("Course Change SERVICE CURRENT COURSE ID: " + CurrentCourseId.getCourseId());
        //
        //            //$rootScope.$broadcast('NavUpdate');
        //        }
        //    }
        //    $scope.currentid=CurrentClassId.getClassId();
        //}
    }
]);