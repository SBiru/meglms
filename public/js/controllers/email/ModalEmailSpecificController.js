appControllers.controller('ModalEmailSpecificController', ['$rootScope', '$scope','$sce','$timeout','Email','$modalInstance','user','$controller','$filter','UserV2',
    function($rootScope,$scope,$sce,$timeout,Email,$modalInstance,user,$controller,$filter,UserV2) {
        //inheriting BaseController
        $controller('ModalEmailBaseController', {$scope: $scope});
        $scope.modes= $filter('filter')(email_modes,{type:'new'});
        $scope.currentMode='new';
        $scope.showUsers=false;
        $scope.showClasses=false;
        $scope.showSpecificUser=true;



        //if user is defined, we don't need to call grades for student
        if(angular.isDefined(user)){
            UserV2.getUser(user.user_id).then(function(u) {
                u.fname = u.firstName;
                u.lname = u.lastName;
                u.guardians = u.guardiansV2;

                $scope.student=u;
            });

        }
        else{
            //function $on returns a function used for unregister the listener
            //we need to use that since it'll create a new listener for each instance of the modal
            var unregister;
            unregister  = $scope.$root.$on('studentChanged',function(event,student){
                UserV2.getUser(null,{email:student.email}).then(function(u) {
                    $scope.student=u;
                });
                unregister();
            });
            //emitting signal to get current user;
            $scope.$root.$emit('getStudent');
        }

        $scope.ok = function(){
            $scope.ok_private([$scope.student])
        };
        $scope.cancel = function (){
            $modalInstance.dismiss('cancel');
        };



    }
]);