(function () {
angular.module('app')
.controller('ModalQuizUsageWarningController',[
    '$scope',
    '$modalInstance',
    'TestbankTestService',
    'pages',
    'quiz',
    function($scope,modalInstance,TestbankTestService,pages,quiz){
        $scope.cancel = function(){
            return modalInstance.dismiss('cancel');
        }
        $scope.pages = pages;
        $scope.quiz = quiz;
        $scope.quiz.title+=' CLONED';
        $scope.state = 'warning';

        $scope.next = function(){
            $scope.state = 'cloning';
        }
        $scope.back = function(){
            $scope.state = 'warning';
        }
        $scope.continue = function(){
            modalInstance.close('ok');
        }
        $scope.cloneQuiz = function(){
            $scope.cloning =true;
            TestbankTestService.cloneQuiz(quiz.id,{
                new_title:$scope.quiz.title,
                id:quiz.id,
                courseId:$scope.$root.currentCourseID
            }).then(function(resp){
                resp = resp.data;
                $scope.cloning =false;
                if(resp.error){
                    toastr.error(resp.error);
                }
                else{

                    toastr.success("The new quiz was created. Don't forget to save the page changes!");
                    modalInstance.close(resp.newQuizId);
                }

            })
        }

    }
])
}());