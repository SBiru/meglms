'use strict';

try {
    var app = angular.module('app.testbank');
}
catch(err) {
    var app = angular.module('app');
}
app.service('PagePasswordExpiration',[
    '$modal',
    '$location',
    function($modal,$location){
    var instance={
        started:false
    }
    instance.init = function(user){
        this.user = user;
        this.started = true;
    }
    instance.openModal = function(){
        if(!this.started || !this.user.classPasswordsAboutToExpire || this.isOpened || $location.path()=="/password")
            return;
        var self = this;
        var modalInstance = $modal.open({
            templateUrl:'/public/views/partials/password-about-to-expire.html',
            controller:['$scope','$modalInstance','$window','$location','classes',function($scope,$modalInstance,$window,$location,classes){
                $scope.classes = classes;
                $scope.cancel = function(){
                    $modalInstance.dismiss('cancel');
                }
                $scope.go = function(){
                    $location.reload();
                }
            }],
            resolve:{
                classes:function(){
                    return self.user.classPasswordsAboutToExpire;
                }
            }
        })
        this.isOpened = true;
        return modalInstance;
    }
    return instance
}]);