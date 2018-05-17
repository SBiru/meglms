'use strict';

(function(){
    var app = angular.module('app');
    app.controller('EditSuperUnitController',[
        '$scope',
        'SuperUnit',
        'CurrentCourseId',
        'Alerts',
        'Nav',
        function($scope,SuperUnit,CurrentCourseId,Alerts,Nav){
        var self = this;
        $scope.superUnitService = SuperUnit;
        $scope.navService  = Nav;


        function init(stateName,classId){
            self.classId = classId;
            self.stateName = stateName;

            setupTitle()
            if(stateName=='editsuperunit'){
                getUnit($scope.$stateParams.unitId)
            }else{
                getUnit(0)
            }
        }
        function setupTitle(){
            $scope.title = self.stateName=='addsuperunit'?'Add Super Unit':'Edit Super Unit';
        }
        function getUnit(id){
            SuperUnit.getSuperUnit({
                'classId': self.classId,
                'id':id
            },function(unit){
                $scope.unit=unit;
                unit.classid= self.classId
                if($scope.unit.required_pages && $scope.unit.required_pages.length){
                    $scope.showRequiredPages = true;
                }
            });
        }
        $scope.updateUnit = function(){
            $scope.unit.$save().then(function(){
                toastr.success('Updated!')
            },function(){
                toastr.error('Something went wrong');
            });
        }
        $scope.cloneUnit = function(){
            $scope.unit.$clone();
        }
        $scope.deleteUnit = function(){
            Alerts.warning({
                title:'Delete Group',
                content:'Are you sure you want to delete everything in this super unit',
                textOk:'Ok',
                textCancel:'Cancel'
            },function(){
                $scope.unit.$remove().then(function(){
                    SuperUnit.loadSuperUnits(self.classId);
                });
            });
        }

        $scope.$watch('superUnitService.currentUnit.id',function(id,oldId){
            if(id && id!=oldId ){
                $scope.$state.go('editsuperunit',{unitId:id});
            }
        })

        init(
            $scope.$state.current.name,
            CurrentCourseId.data.classId
        );
    }])
}());