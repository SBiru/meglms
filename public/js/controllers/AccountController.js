appControllers.controller('AccountController', [ '$scope','$modal','$q','$modalInstance','UserMeta','UserV2','userId','role',
    function($scope,$modal,$q,$modalInstance,UserMeta,UserV2,userId,role){
        $scope.userId = userId;
        $scope.open = open;
        $scope.save = save;
        $scope.cancel = cancel;
        $scope.canEdit = canEdit;
        $scope.checkRole = checkRole;
        $scope.isObserver =  $scope.$root.user.id != userId;

            $q.all({
            user:UserV2.getUser($scope.userId),
            meta:UserMeta.get({userId:$scope.userId}).$promise
        })
            .then(handlePromises);

        function canEdit(){
            $scope.me = $scope.$root.user;
            if(!$scope.$root.user || $scope.isObserver)
                return false;

            if(
                $scope.me.is_super_admin ||
                $scope.me.is_organization_admin ||
                $scope.me.is_observer ||
                $scope.me.teacher_supervisor ||
                $scope.me.is_teacher ||
                $scope.me.is_edit_teacher ||
                $scope.me.is_guardian ||
                $scope.me.is_advisor
            ) return true;
            else{
                return $scope.me.org.can_edit_profile;
            }
        }
        function checkRole(roles){
            if(!$scope.$root.user) return false;
            if($scope.me.is_super_admin ||
                $scope.me.is_organization_admin)
            return true;
            for(var i = 0;i<roles.length;i++){
                if(role == roles[i])
                    return true;
            }
            return false;
        }
        function handlePromises(res){
            $scope.user = res.user;
            $scope.user.fname=$scope.user.firstName;
            $scope.user.lname=$scope.user.lastName;
            $scope.user.data = res.meta;
        }
        function open(size) {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/editor/photo-modal.html',
                controller: 'ProfilePhotoModalController',
                size: size,
                windowClass: 'photo-modal-window'
            });
            modalInstance.result.then(function(result){
                if(!angular.isDefined($scope.user.data.profile_picture))
                    $scope.user.data.profile_picture={};
                $scope.user.data.profile_picture.meta_value = result;
            });
        };

        function save(){
            $scope.saving=true;
            var metadata = {userId:$scope.userId};
            for(var i in $scope.user.data){
                if(angular.isDefined($scope.user.data[i].meta_value))
                    metadata[i]=$scope.user.data[i].meta_value;
            }
            UserV2.updateUser($scope.userId,$scope.user);
            UserMeta.save(metadata,function(){$scope.saving=false; $modalInstance.close($scope.user)});
            if($scope.user.data.profile_picture.meta_value)
            $scope.$root.user.profileImageSrc = $scope.user.data.profile_picture.meta_value;
        }
        function cancel(){
            $modalInstance.dismiss('cancel');
        };

    }
]);