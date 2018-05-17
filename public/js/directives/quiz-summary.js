angular.module('app')


.directive('quizSummary', [
'$sce',
'GraderQuiz',
'$modal',
'Alerts',
function($sce,GraderQuiz,$modal, Alerts) {
    return {
        restrict: 'E',
        scope: {
            pageInfo: '=?'
        },
        templateUrl: '/public/views/directives/quizSummary.html',
        link: function($scope, $element) {
            getAttempts();
            $scope.filteredTodos = [] ,$scope.currentPage = 1 ,$scope.numPerPage = 50;
            var initialUserTypes = [
                {
                    'id':'active',
                    'label': 'Show active students'
                },
                {
                    'id':'all',
                    'label': 'Show all students'
                },
                {
                    'id':'removed',
                    'label': 'Show archived students'
                }
            ]
            function prepareNumberOfStudents(classInfo){
                $scope.showUsersTypes =  angular.copy(initialUserTypes);
                _.find($scope.showUsersTypes,{id:'active'}).label += ' (' + classInfo.activeStudentsCount + ')';
                _.find($scope.showUsersTypes,{id:'all'}).label += ' (' + classInfo.totalStudentsCount + ')';
                _.find($scope.showUsersTypes,{id:'removed'}).label += ' (' + classInfo.inactiveStudentsCount + ')';
            }
            $scope.showUsersType='active';

            $scope.openQuestionPreview = function(question,studentId){
                if(!question.id)
                    return;
                question.studentId = studentId;
                question.pageId = $scope.pageInfo.id;
                $modal.open({
                    templateUrl:'/public/views/partials/grader/questionpreviewmodal.html',
                    controller:'ModalQuestionPreview',
                    size:'lg',
                    resolve:{
                        question:function () {
                            return question;
                        }
                    }
                })
            };

            function getAttempts(){
                GraderQuiz.allAttempts(
                    {pageId:$scope.pageInfo.id,
                     user:$scope.showUsersType ? $scope.showUsersType : 'active'},
                    function(quiz){
                        $scope.quiz = quiz;
                        $scope.students = quiz.students;
                        prepareNumberOfStudents(quiz);
                        $scope.maxSize = Math.ceil($scope.students.length / $scope.numPerPage);
                        pagination();
                    },function(error){

                    }
                )
            }
            function pagination(){
                var begin = (($scope.currentPage - 1) * $scope.numPerPage)
                    , end = begin + $scope.numPerPage;

                $scope.filteredStudents = $scope.students.slice(begin, end);
            }
            $scope.$watch('showUsersType',getAttempts);
            $scope.$watch('currentPage', pagination);
        }
    }
}])