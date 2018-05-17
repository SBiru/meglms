'use strict';
var sharedController =
    [	'$scope',
        '$stateParams',
        'UserV2',
        'Class',
        'Gradebook'
    ]
var sharedControllerFn = function($scope, $stateParams, UserV2, Class,Gradebook,params,$modalInstance){
    if(typeof params ==='undefined'){
    	params = $scope.studentClass;
	}

    var classId = $stateParams.classId || params.class.id;
    $scope.isInline = params.isInline;
    if(!classId || !params.student) {
        $scope.error = 'Some parameters are missing. Please reload the page and try again.';
        return;
    }
    $scope.classId = classId;
    $scope.student = params.student;
	if($scope.classInfo)
	    init()
    else{
        Gradebook.getClass(classId).then(
            function(classInfo){
                $scope.classInfo = classInfo;
                $scope.$root.classInfo = classInfo;
                init();
            },
            function(){
                $scope.error = 'ERROR: You must be a teacher in this class or an admin';
            }
        );
    }

    function init(){
        // some global containers (per tab)
        $scope.profile = {};
        $scope.gradeTypes = [];
        $scope.enableCreditedAssignments = params.enableCreditedAssignments || $scope.classInfo.enableCreditedAssignments
        $scope.totalScore = params.student.percTotalScore;
        $scope.finalize = {
            manual: {},
            override: {}
        };

        //getting possible grade types
        getGradeTypes();

        $scope.loading = 'Loading student data';
        $scope.studentData = params.student;

        UserV2.getUser($scope.student.id).then(function(student){
            $scope.student = student;
            $scope.loading = 'Selecting class';
            angular.forEach(student.classes, function(c){ // c = class
                if(c.id === parseInt(classId)) {
                    $scope.currentClass = c;
                    return;	// no need to keep searching
                }
            });
            // if error occurs
            if(!$scope.currentClass) {
                $scope.error = 'An error ocurred while selecting the class. Please close this modal and try again.';
            } else {
                $scope.loading = 'Checking final scores';
                if($scope.currentClass.finalized) {
                    UserV2.getUser($scope.currentClass.finalized.by).then(function(user){
                        $scope.currentClass.finalized.by = user;
                        $scope.loading = false;
                    });
                } else {
                    $scope.loading = false;
                }
            }
        });


        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.finalize.continue = function(){
            if($scope.finalize.mode === 'auto') {
                $scope.loading = 'Saving';
                Class.finalizeGrade(
                    {'id': classId, 'userId': params.student.id, 'grade': $scope.totalScore},
                    function(){
                        $scope.isInline?params.updateFn():location.reload();
                    }
                );
            } else if($scope.finalize.mode === 'manual') {
                $scope.finalize.manual.enabled = true;
                $scope.finalize.manual.score = $scope.totalScore;
            }
        };

        $scope.finalize.manual.canSave = function(){
            var rubricItem = _.find($scope.classInfo.rubric,{'gradeLetter':$scope.finalize.manual.score});
            return $scope.finalize.manual.score >= 0 || rubricItem;
        };

        $scope.finalize.manual.save = function(){
            $scope.loading = 'Saving';
            if(!$scope.finalize.manual.score) {
                $scope.finalize.manual.score = 0;
            }
            Class.finalizeGrade(
                {'id': classId, 'userId': params.student.id, 'grade': $scope.finalize.manual.score},
                function(){
                    $scope.isInline?params.updateFn():location.reload();
                }
            );
        };

        $scope.finalize.override.enable = function(){
            $scope.finalize.override.enabled = true;
            $scope.finalize.override.score = $scope.currentClass.finalized.score;
        };

        $scope.finalize.override.canSave = function(){
            var rubricItem = _.find($scope.classInfo.rubric,{'gradeLetter':$scope.finalize.manual.score});
            return $scope.finalize.override.comments &&
                ($scope.finalize.override.score >= 0 || rubricItem)&&
                $scope.finalize.override.score !== $scope.currentClass.finalized.score;
        };

        $scope.finalize.override.save = function(){
            $scope.loading = 'Saving';
            if(!$scope.finalize.override.score) {
                $scope.finalize.override.score = 0;
            }
            Class.finalizeGrade(
                {'id': classId, 'userId': params.student.id, 'grade': $scope.finalize.override.score, 'comments': $scope.finalize.override.comments},
                function(){
                    $scope.isInline?params.updateFn():location.reload();
                }
            );
        };
        $scope.recalculate = function(){
            Gradebook.recalculateGrades(
                {'classId': classId, 'userId': params.student.id},
                function(result){
                    $scope.isInline?params.updateFn():location.reload();
                }
            )
        }
        function getGradeTypes(){
            if(!$scope.classInfo.showGrades.score && !$scope.classInfo.showGrades.percentage && !$scope.classInfo.showGrades.letter )
                $scope.classInfo.showGrades.score=true;

            if($scope.classInfo.showGrades.score)
                $scope.gradeTypes.push({
                    type:'score',
                    text:'Grade as score'
                })
            if($scope.classInfo.showGrades.percentage)
                $scope.gradeTypes.push({
                    type:'percentage',
                    text:'Grade as percentage'
                })
            if($scope.classInfo.showGrades.letter)
                $scope.gradeTypes.push({
                    type:'letter',
                    text:'Grade as letter'
                })
            $scope.finalize.gradeType=$scope.gradeTypes[0].type;
        }
        $scope.onExemptSave = function() {
            $scope.isInline?params.updateFn():location.reload();
        };
    }


};


function createController(isModal){
    var ctrl = angular.copy(sharedController);
	if(isModal){
        ctrl.push('params')
        ctrl.push('$modalInstance')
	}
    ctrl.push(sharedControllerFn)
    return ctrl;
}

angular.module('app')
.controller('GradebookModalStudentController',createController(true))
.directive('gradebookInlineStudent',[function(){
    return {
        restrict:'E',
        templateUrl:'/public/views/gradebook/modals/student-body.html',
        scope:{
            studentClass:'=?'
        },
        controller:createController(false)
    }
}])
.controller('GradebookInlineStudentController',createController(false));
