appControllers.controller('CloneUnitController', ['$scope','EditPage','Course','EditUnit','CurrentCourseId','Nav','Gradebook','$q','$modal',
    function($scope,EditPage,Course,EditUnit,CurrentCourseId,Nav,Gradebook,$q,$modal){
        $scope.getCourses = getCourses;
        $scope.getUnits = getUnits;
        $scope.getPages = getPages;
        $scope.finish = finish;
        $scope.handleNewUnit = handleNewUnit;
        $scope.handleClonedResponse = handleClonedResponse;
        $scope.parenController = $scope.$parent.$parent.$parent;
        $scope.getCourses();

        function getCourses(){
            $scope.loading_courses = true;
            Course.getTaught({},function(response){
                $scope.loading_courses = false;
                $scope.courses = response.courses;
            });
        }
        function getUnits(courseid){
            $scope.loading_units=true;
            EditUnit.all({courseid:courseid},function(res){
                $scope.loading_units=false;
                $scope.units=res.units;
            });

        }
        function getPages(unitid){
            $scope.loading_pages=true;
            $scope.pages=[];
            EditPage.all({
                unitid:unitid
            },function(res){
                $scope.loading_pages=false;
                $scope.pages = res.pages
            });
        }
        function hasAnyQuiz(pages){
            return _.some(pages,function(p){
                return p.layout=='QUIZ'
            })
        }
        function hasAnyTimedReview(pages){
            return _.some(pages,function(p){
                return p.layout=='TIMED_REVIEW'
            })
        }
        function openCloneQuizFlag(){
            var defer = $q.defer()
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonequizzesflag.html',
                controller: 'CloneQuizzesFlagController',

            });
            modalInstance.result.then(function(cloneQuizzes){
                defer.resolve(cloneQuizzes);
            });
            return defer.promise;
        }
        function openClonePromptsFlag(){
            var defer = $q.defer()
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonepromptsflag.html',
                controller: 'ClonePromptsFlagController',

            });
            modalInstance.result.then(function(clonePrompts){
                defer.resolve(clonePrompts);
            });
            return defer.promise;
        }
        function finish(recalculate,cloneQuizzes,clonePrompts) {
            $scope.cloning = true;
            if($scope.unit_number=='' || $scope.unit_number == null || $scope.unit_number == undefined){
                toastr.error("Please insert a valid number for the unit")
                return;
            }
            $scope.selectedPages = $.grep($scope.pages, function (p) {
                return p.clone;
            });

            if( cloneQuizzes === undefined && hasAnyQuiz($scope.selectedPages)){
                openCloneQuizFlag().then(function(cloneQuizzes) {
                    finish(recalculate, cloneQuizzes)
                })
                return;
            }
            if( clonePrompts === undefined && hasAnyTimedReview($scope.selectedPages)){
                openClonePromptsFlag().then(function(clonePrompts) {
                    finish(recalculate, cloneQuizzes,clonePrompts)
                })
                return;
            }
            $scope.cloneQuizzes = cloneQuizzes;
            $scope.clonePrompts = clonePrompts;



            if ($scope.selectedPages.length == 0) {
                if (!confirm("There are no selected pages, are you sure you want to continue?"))
                    return;
            }
            var needGradebookRecalculation = false;
            if (Nav.navData.orgDetails && Nav.navData.orgDetails.calculate_progress) {
                for (var i = 0; i < $scope.selectedPages.length; i++) {
                    var page = $scope.selectedPages[i];
                    if (page.is_gradeable == 1 || page.layout.indexOf('QUIZ') >= 0){
                        needGradebookRecalculation=true;
                        break;
                    }
                }
            }

            if(needGradebookRecalculation && !recalculate){
                Gradebook.openRecalculationWarning(
                    function(){
                        finish('now',cloneQuizzes,clonePrompts)
                    },
                    function(){
                        finish('later',cloneQuizzes,clonePrompts)
                    }
                )
            }else{
                EditUnit.submit({
                    course_id: CurrentCourseId.getCourseId(),
                    unit_number: $scope.unit_number,
                    unit_title: $scope.unit_title,
                    image_url:$scope.unitImageUrl,
                    superUnitId: $scope.superUnitId,
                    recalculate:recalculate
                },$scope.handleNewUnit);
            }
        }
        function handleNewUnit(unit){

            if (unit.message == 'successful') {

                EditUnit.clone({
                    id:unit.id,
                    recalculate:unit.recalculate,
                    pages:$scope.selectedPages,
                    cloneQuizzes:$scope.cloneQuizzes,
                    clonePrompts:$scope.clonePrompts
                },$scope.handleClonedResponse);
            } else {
                toastr.error(unit.message);
            }
        }
        function handleClonedResponse(res){
            if (res.message == 'successful'){
                $scope.cloning=false;
                $scope.$root.$broadcast('NavForceReload');
            }
            else {
                toastr.error(res.message);
            }
        }

        $scope.$watch('course',function(newValue){
            if(angular.isDefined(newValue) && newValue!=null){
                $scope.getUnits(newValue);
            }
        });
        $scope.$watch('unit',function(newValue){
            if(angular.isDefined(newValue) && newValue!=null){
                var selectedUnit = _.findWhere($scope.units,{id:newValue});
                if(selectedUnit.name==-1){
                    $scope.toggleIntroUnit(true);
                }
                $scope.parenController.unit_title=selectedUnit.description
                $scope.parenController.unit_number=selectedUnit.name
                $scope.parenController.unitImageUrl=selectedUnit.image_url
                $scope.getPages(newValue);
            }
        });
        $scope.$watch('select_all',function(newValue){
            if(angular.isDefined(newValue) && newValue!=null){
                for(var i in $scope.pages){
                    $scope.pages[i].clone = newValue;
                }
            }
        });
    }
]);