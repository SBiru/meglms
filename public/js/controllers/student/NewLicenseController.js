
appControllers.controller('NewLicenseController', [ '$scope','$http','Licenses','EditOrganizationUser','UserV2','EditCourseClassUser','Languages',
    function($scope,$http,Licenses,EditOrganizationUser,UserV2,EditCourseClassUser,Languages){
        $scope.validate = validate;
        $scope.validateEmail =validateEmail;
        $scope.signup = validate_and_signup;

        $scope.user={
            preferred_language:'en'
        };
        Languages.query(function(res){
            $scope.languages = res.languages;
        });
        function handleLicenseResponse(res){
            if(!res.error){
                $scope.msgError='Your license is active. Expiry date: ' + res.expiry_date;
            }
            else{
                $scope.msgError=res.message;
                $scope.license_required=true;
            }
        }
        function validateEmail(){
            $scope.new_user=false;
            $scope.license_required=false;
            UserV2.getUser('','email='+$scope.user.email)
                .then(function(res){
                    if(res.useLicense==0){
                        $scope.noNeed=true;
                        $scope.msgError = "You don't need a license";
                        return;
                    }
                    $scope.userData=res;
                    Licenses.get({userId:res.userId,orgId:res.orgId},handleLicenseResponse);
                },function(reason){
                    $scope.new_user =true;
                    $scope.license_required=true;
                });
        }
        function login(){
            var req = {
                method: 'POST',
                url: '/signin/',
                headers: {
                    'Content-Type': undefined
                },
                data: {username:$scope.user.email,password:$scope.user.password}
            }
            $http(req).success(function(res){
                window.location='/';
                $scope.signingUp = false;
            }).error(function(){
                $scope.signingUp = false;
            });
        }
        function validate(userid){

            $scope.validating=true;

            Licenses.validate({license:$scope.user.license,user_id:userid},function(res){
                $scope.validating=false;
                if(angular.isDefined(res.error)){
                    $scope.is_valid=false;
                    $scope.signingUp = false;
                    $scope.msgError=res.error;
                }

                if(res.status=='success'){
                    $scope.is_valid=true;
                    $scope.msgError='';
                    if(userid){
                        login();

                    }

                }
            });
        }
        function validate_and_signup(){
            Licenses.validate({license:$scope.user.license},function(res){
                if(res.error){
                    $scope.msgError = res.error;
                    return;
                }

                signup(res.org_id,res.classes,res.created_by);
            });
        }
        function signup(org_id,classes,created_by){
            $scope.signingUp = true;
            if(!$scope.user.password||($scope.user.password!=$scope.user.cpassword)){
                $scope.msgError="Invalid password";
                $scope.signingUp = false;
                return;
            }
            $scope.user.org_id = org_id;
            $scope.user.use_license = 1;
            $scope.user.created_by=created_by
            EditOrganizationUser.submit(
                $scope.user,function(res){
                    if(res.status=='success'){
                        $scope.userData={
                            userId:res.userId
                        };
                        validate(res.userId);
                        EditCourseClassUser.enroll_placement({userId:res.userId,classes:classes});
                    }
                    else{
                        $scope.signingUp = false;
                        $scope.msgError=res.error;
                    }
                }
            );
        }


    }
]);