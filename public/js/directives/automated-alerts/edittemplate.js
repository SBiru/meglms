

(function () {
    "use strict";

    var app = angular.module('automatedAlerts');
    app.directive('editAlertTemplate',[
        function(){
            return {
                restrict:'E',
                templateUrl:'/public/views/directives/automated-alerts/edittemplate.html',
                scope:{
                    alert:'=automatedAlert',
                    close:'=?'
                },
                link:function(scope,element){
                    function checkHasVariables(){
                        _.some(scope.alert.options,function(val,id){
                            if(id!='descriptions'){
                                scope.hasVariables = true;
                                return true;
                            }
                        })
                    }
                    scope.text = scope.alert.options.descriptions.texts[0]
                    checkHasVariables();

                }
            }
    }])
    app.factory('EditAlertTemplate',['$modal',function($modal){
        return {
            open:function(alert){
                $modal.open({
                    template:'<div class="modal-header btn-info"><h4 ng-bind="title" style="margin: 0;"></h4></div><div class="modal-body"><edit-alert-template automated-alert="alert" close="close"></edit-alert-template></div>',
                    controller:['$scope',function($scope){
                        $scope.title = "Edit template";
                        $scope.alert = alert;
                        $scope.close = function(text){
                            if(text!==false){
                                $scope.alert.options.descriptions.texts[0]=text;
                            }
                            $scope.$close();
                        }
                    }],
                    size:'lg',
                    windowClass:'modal-90'
                })
            }
        }
    }])

}());