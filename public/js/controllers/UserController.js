appControllers.controller('UserController', ['$rootScope', '$scope', '$modal', '$timeout', '$compile', 'User', 'UserMeta',
    function ($rootScope, $scope, $modal, $timeout, $compile, User, UserMeta) {
        $scope.openAccount = openAccount;
        $scope.logout = logout;
        $scope.returnToMyAccount = returnToMyAccount;
        User.get({
            userId: 'me'
        }, function (user) {

            $scope.$root.user = user;
            if(user.admin_as_user) showFloatingBox()
            getProfile();
            if (typeof user.org.logo !== 'undefined') {
                if (user.org.logo === null) {
                    delete user.org.logo
                }
            }

            if (user.license && user.license.timeleft < 0)
                logout();

        });
        
        function showFloatingBox() {
            angular.element(document.body).append( $compile("<div class='floatingBox' ng-click='returnToMyAccount()' >Return to my account</div>")($scope))
        }

        function getProfile() {
            UserMeta.get({
                userId:$scope.$root.user.id
            }, function (data) {
                if(data.profile_picture.meta_value){
                    $scope.$root.user.profileImageSrc = data.profile_picture.meta_value;
                }
            })
        }

        function openAccount() {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/account/account-modal.html',
                windowClass: 'account-modal',
                controller: 'AccountController',
                resolve: {
                    userId: function () {
                        return $scope.user.id || $scope.user.userId;
                    },
                    role:'me'
                }
            });
            modalInstance.result.then(function (user) {
                $scope.user = user;
            });
        }

        function returnToMyAccount() {
            if(!confirm("Are you sure you want to return"))
                return;
            User.returnTO(function(){
                    window.location='/';
                },function(error){
                    console.log(error);
                }
            )
        }

        function logout() {
            window.location = '/signout/';
        }

    }
]);