angular.module('app')
.directive('grades', [
    '$q','$sce','$modal','ShowDatesGrades',
    function($q,$sce,$modal, ShowDatesGrades){
        return {
            restrict: 'E',
            scope: {
                studentId:'=?',
                'class':'=?'
            },
            templateUrl: '/public/views/directives/grades.html',
            link: function ($scope, $element) {
                $scope.units = $scope.class.units;

                $scope.getAssignmentsForUnit = function(unit) {
                    var assignments = [];
                    for(var p in unit.pagegroups){
                        var page = unit.pagegroups[p];
                        if(page.pages){
                            for(var c in page.pages){
                                var child = page.pages[c];
                                assignments.push(child);
                            }
                        }else{
                            assignments.push(page);
                        }
                    }
                    return assignments;
                };
                $scope.getLetterGrade = function(percentage){
                    percentage = Math.round(Math.max(0,Math.min(percentage,100)));
                    return ShowDatesGrades.getGradeLetterString(percentage, ShowDatesGrades.gradeScale);
                }//getLetterGrade;
                $scope.isWaitingGrade = function(assignment){
                    return !(assignment.score !== null && assignment !== 'undefined') && assignment.hasUngradedPost;
                };
                $scope.getScore = function(assignment) {

                    if(!assignment.maxScore){
                        return '--'
                    }
                    var isOverriden = (assignment.isOverrideScore);
                    var score = assignment.score;
                    var max = assignment.maxScore;
                    var grade ="";
                    var class_= $scope.class;
                    if(!class_) return;
                    assignment.isGraded = score===null || score===undefined;
                    if(class_.showGradesAsScore){
                        if ((assignment.isGraded) && (parseInt(score) === 0)){
                            grade+=(score||'0') + "/" + max;
                        }
                        grade+=(score||'--') + "/" + max;
                    }
                    if(class_.showGradesAsPercentage){
                        if(score)
                            grade+="("+getScorePerc(score,max)+"%)"
                    }
                    if(class_.showGradesAsLetter){
                        if(score)
                            grade+=" " + $scope.getLetterGrade(getScorePerc(score,max));
                    }

                    if ((assignment.isGraded) && (parseFloat(score) === 0)){
                        return  grade==""?(score||'0') + "/" + max:grade;


                    }
                    return  grade==""?(score||'--') + "/" + max:grade;

                };

                function getScorePerc(score,max){
                    return Math.round((score/max)*100)
                }

                $scope.openFeedback = function (feedback){
                    //Is integer?
                    if(typeof feedback !== "object")
                        feedback={id:feedback};

                    var templateUrl,
                        controller,
                        windowClass;
                    if(feedback.type=='quiz'){
                        templateUrl = '/public/views/partials/notificationgradequiz.html'
                        controller = 'NotificationQuizController'
                        windowClass='feedback-quiz-modal'
                        feedback.page_id = feedback.id;
                    }
                    else{
                        feedback.id = feedback.postFeedbackId;
                        templateUrl = '/public/views/partials/notificationgradepost.html?cachesmash=5'
                        controller = 'NotificationGradePostMessagesController'
                        windowClass='feedback-modal'

                    }


                    var modalInstance = $modal.open({
                        templateUrl: templateUrl,
                        windowClass: windowClass,
                        controller: controller,
                        resolve: {
                            notification: function () {
                                return feedback;
                            }
                        }
                    });
                };
                $scope.openRubric = function(assignment){

                    var modalInstance = $modal.open({
                        templateUrl: '/public/views/partials/student/rubric-modal.html',
                        controller: 'RubricStudentController',
                        resolve:{
                            data:function(){
                                return {
                                    pageid:assignment.id,
                                    rubricid:assignment.rubricId,
                                    userid:$scope.studentId
                                }
                            }
                        }

                    });
                }
                $scope.assignmentDueDate = function(assignment){
                    if(assignment.due_date)
                        return moment(assignment.due_date).format('D MMM')
                }

            }
        }
    }
])