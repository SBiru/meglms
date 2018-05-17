'use strict';

angular.module('app')
    .controller('ClonePromptsFlagController',
    [	'$scope',
        '$modalInstance',
        function($scope,$modalInstance){
            $scope.clonePrompts=0;
            $scope.ok = function(){
                $modalInstance.close($scope.clonePrompts);
            }
            $scope.cancel = function(){
                $modalInstance.dismiss('cancel');
            }
        }
    ]
);