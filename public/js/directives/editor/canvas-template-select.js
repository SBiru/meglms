'use strict';
(function(angular){
    angular.module('app').controller('CanvasTemplateSelectModal',['$scope','fabricFileActions','CurrentCourseId','fabricMenuOpenShared','$filter',function($scope,fabricFileActions,CurrentCourseId,shared,$filter){

        $scope.selected = {tab:'open'};

        $scope.filter = {id:'class',value:CurrentCourseId.data.classId}
        shared.extend($scope);
        $scope.ok = function(){
            $scope.$close(_.findWhere($scope.templates,{id:$scope.selected.row}));
        }
    }]).directive('canvasTemplateSelect',['$modal',function($modal){
        return {
            restrict: 'A',
            scope:{
                canvasTemplate:'=?'
            },
            templateUrl:'/public/views/directives/editor/canvas-template-select.html',
            link:function(scope,el){
                scope.openModal = function(){
                    $modal.open({
                        controller:'CanvasTemplateSelectModal',
                        templateUrl:'/public/views/directives/editor/canvas-template-select-modal.html',
                        backdrop: 'static',
                        windowClass: 'modal-flat modal-template-select'
                    }).result.then(function(template){
                        scope.canvasTemplate = template;
                    });
                }
            }
        }
    }])
}(angular));