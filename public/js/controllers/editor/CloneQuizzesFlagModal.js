'use strict';

angular.module('app')
    .controller('CloneQuizzesFlagController',
    [	'$scope',
        '$modalInstance',
        function($scope,$modalInstance){
            $scope.cloneQuizzes=0;
            $scope.ok = function(){
                $modalInstance.close($scope.cloneQuizzes);
            }
            $scope.cancel = function(){
                $modalInstance.dismiss('cancel');
            }
        }
    ]
);