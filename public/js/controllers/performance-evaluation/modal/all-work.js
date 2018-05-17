angular.module('app')
    .controller('PEModalAllWorkController',
    [	'$scope',
        '$modalInstance',
        '$stateParams',
        'params',
        'Gradebook',
        function($scope, $modalInstance, $stateParams, params,Gradebook){
            $scope.params = params;
            $scope.loading = {};
            $scope.selected = {};

            getGradebook();

            $scope.cancel=function(){
                $modalInstance.dismiss('cancel');
            }
            function getGradebook(){
                $scope.loading.gradebook = true;
                Gradebook.getGradebookForUser(
                    {'userId':params.student.id},
                    function(gradebook){
                        $scope.gradebook=gradebook;
                        $scope.loading.gradebook = false;
                    },function(error){
                        $scope.loading.gradebook = false;
                    }
                )
            }

        }

    ]
)