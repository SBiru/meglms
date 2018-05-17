'use strict';
(function(angular){
angular.module('app').controller('EditProficiencyClassesController',
[
    '$scope',
    '$modalInstance',
    '$modal',
    '$q',
    'UserV2',
    'ProficiencyTestService',
    'Class',
    'OrganizationV2',
    function($scope,$modalInstance,$modal,$q,UserV2,ProficiencyTestService,Class,OrganizationV2){
    var orgId = $scope.$state.params.organizationId;
    $scope.classes = []
    $scope.nav = {
        location:'tests'
    }
    $scope.selectedTest = {}
    function init(){
        getTestClasses();
        getAvailableClasses();
    }
    function getAvailableClasses(){
        OrganizationV2.getClasses({id:orgId}).$promise.then(function(classes){
            $scope.availableClasses = classes;
        })
    }
    function getTestClasses(){
        ProficiencyTestService.getClasses().$promise.then(function(classes){
            $scope.classes=classes;
            getGroups(_.map(classes,function(c){return c.id}));
        })
    }
    function getGroups(classIds){
        _.each(classIds,function(classId){
            var class_ = _.where($scope.classes,{id:classId});
            if(!class_.length)
                return;
            class_ = class_[0];
            class_.loading = true;
            Class.getGroups({id:classId,includeTestAdmins:true}).$promise.then(function(groups){
                delete class_.loading;
                class_.groups = groups;
            })
        });
    }

    $scope.addClass = function(){
        ProficiencyTestService.addClass({classId:$scope.class.id});
        $scope.classes.push($scope.class);
        getGroups([$scope.class.id]);
    };
    $scope.removeClass = function(class_){
        var index = $scope.classes.indexOf(class_);
        if(index<0) throw "Invalid class";
        $scope.classes.splice(index,1);
        ProficiencyTestService.removeClass({classId:class_.id});
    };
    $scope.saveTag = function(class_){
        ProficiencyTestService.saveTag({classId:class_.id,tag:class_.tag});
        class_.editing = false;
    }

    $scope.removeAdmin = function(group,userId){
        var index = _.findIndex(group.admins,function(a){return a.id == userId});
        if(index<0) throw "Invalid admin";
        group.admins.splice(index,1);
        ProficiencyTestService.removeAdmin({groupId:group.id,userId:userId});
    }
    $scope.openAddUsers = function(group){
        $modal.open({
            controller:'AddTestAdminController',
            templateUrl:'/public/views/partials/admin/addtestadminmodal.html',
            windowClass: 'edit-test-classes-modal',
            resolve:{
                usersDefer:getAllUsers
            }
        }).result.then(function(user){addAdmin(group,user)})
    }
    $scope.editScoreRange = function(class_){
        $scope.nav.location='scores'
        $scope.selectedTest = class_
    }
    function getAllUsers(){
        var defer = $q.defer()
        if($scope.allUsers) defer.resolve($scope.allUsers);
        else {
            UserV2.getUsers({}).$promise.then(function(users){
                $scope.allUsers = users;
                defer.resolve(users);
            })
        }
        return defer;
    }
    function addAdmin(group,user){
        user.fullAddress = user.firstName + ' ' + user.lastName + " (" + user.email + ")";
        ProficiencyTestService.addAdmin({groupId:group.id,userId:user.id});
        group.admins.push(user);
    }
    $scope.cancel = $modalInstance.dismiss;
    init();
}
]).controller('AddTestAdminController',['$scope','usersDefer','$modalInstance',function($scope,usersDefer,$modalInstance){
        $scope.loading = true;
        usersDefer.promise.then(function(users){
            delete $scope.loading;
            $scope.users = users;
        })
        $scope.add = function(){
            $modalInstance.close($scope.user);
        }
        $scope.cancel = $modalInstance.dismiss;
    }])
}(angular));