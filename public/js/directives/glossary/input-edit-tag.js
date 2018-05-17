"use strict";

(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch(err) {
        app = angular.module('app');
    }
    app.directive('inputEditTag',['GlossaryTags',function(GlossaryTags){
        return{
            restrict:'E',
            scope:{
                tag:'=?',

            },
            templateUrl:'/public/views/directives/glossary/input-edit-tag.html?v=' + window.currentJsVersion,
            link:function(scope){
                scope.save = function(name){
                    return GlossaryTags.update({name:name,id:scope.tag.id}).$promise;
                };
            }
        }
    }]).directive('inputEdit',[function(){
        return{
            restrict:'E',
            require:'^ngModel',
            scope:{
                ngModel:'=?',
                savePromise:'=?',
                isEditing:'=?'
            },
            template:'<input ng-model="tempModel"><span class="fa fa-pulse fa-spinner" ng-show="saving"></span><span' +
            ' class="btn btn-xs btn-primary" ng-hide="saving" ' +
            ' ng-click="save()">Ok</span><span' +
            ' ng-hide="saving" class="btn btn-xs btn-default"' +
            ' ng-click="cancel()">Cancel</span>',
            link:function(scope,el,attrs,ngModel){
                scope.tempModel = scope.ngModel;
                scope.save = function(){
                    scope.saving = true;
                    scope.savePromise(scope.tempModel).then(function(){
                        scope.saving = false;
                        updateModel();
                        scope.cancel();
                    },function(){
                        toastr.error("Something went wrong :(");
                        scope.saving = false;
                    })
                };
                scope.cancel = function(){
                    scope.isEditing = false;
                }
                function updateModel(){
                    ngModel.$setViewValue(scope.tempModel)
                }
            }
        }
    }])
}());