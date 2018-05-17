appControllers.controller('EditOrganizationUsersController', ['$rootScope', '$scope','$stateParams', '$timeout', 'CurrentOrganizationId', 'EditOrganizationUser','User','Languages','EditCourseClassUser','SiteAdmin',
    function($rootScope, $scope,$stateParams, $timeout, CurrentOrganizationId, EditOrganizationUser,User,Languages,EditCourseClassUser,SiteAdmin) {
        $scope.organizationId = CurrentOrganizationId.getOrganizationId();
        $scope.userId= $scope.$stateParams.userId;
        $scope.userExternalId= null;
        $scope.userFirstName = '';
        $scope.userLastName = '';
        $scope.userEmail = '';
        $scope.userPhone='';
        $scope.userPassword = '';
        $scope.is_disabled=false;
        $scope.systemGeneratePassword = false;
        $scope.is_super_admin = false;
        $scope.is_organization_admin = false;
        $scope.can_add_super_admin = false;
        $scope.can_add_organization_admin = false;
        $scope.can_add_user = false;
        $scope.teacher_supervisor = false;
        $scope.private_student = false;
        $scope.can_edit_course = false;
        $scope.datepickerOpened = false;



        $scope.editorUser={};
        $scope.format = 'dd-MMMM-yyyy';
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        $scope.minDate = new Date();
        $scope.openDatePicker = function($event){
            $event.preventDefault();
            $event.stopPropagation();
            $scope.datepickerOpened = true;
        }
        $scope.delete = function(){
            if(!confirm("Are you sure you want to delete this user?"))
                return;
            EditOrganizationUser.delete({
                user_id:$scope.userId
            },function(res){
                if(res.status && res.status=='success'){
                    window.location.href='/superadmin/';
                }
                else{
                    toastr.error('An error has occurred');
                }
            })
        };
        $scope.canShowLoginAsBtn = function () {
            if(JSON.stringify($scope.editorUser) == '{}')  return false;
            var org = $scope.editorUser.org;
            if($scope.editorUser.is_super_admin){
                return true;
            } else if(org.allow_users_to_log_in_as_others){
                return ($scope.editorUser.is_organization_admin || $scope.editorUser.is_site_admin) && org.allowedUsersToLogInAsOthers.allow_organization_and_site_admins_to_log_in_as_others
            } else {
                return false;
            }
        };
        $scope.loginAs = function(){
            if(!confirm("Are you sure you want to log in as this user?"))
                return;
            EditOrganizationUser.loginAs({
                    id:$scope.userId
                },function(){
                    window.location='/';
                },function(error){
                    console.log(error);
                }
            )
        }
        $scope.toggleAdminRole = function(role,is_admin){
            if(role=='is_sites_admin' && $scope[role]){
                $scope.is_organization_admin=false;
            }
            if(role=='is_organization_admin' && $scope[role]){
                $scope.is_sites_admin=false;
            }
        }
        $scope.toggleEditing = function(class_,flag){
            if(typeof flag==='undefined'){
                flags=['is_student','is_teacher','is_edit_teacher','is_observer'];
                for( i in flags){
                    flag = flags[i];
                    var key = 'editing_' + flag;
                    delete class_[key];
                }
            }
            else {
                var key = 'editing_' + flag;
                if (typeof class_[key] === 'undefined') {
                    class_[key] = true;
                } else {
                    delete class_[key];
                }
                if(flag==='is_student'){
                    user.is_teacher=false;
                    user.is_edit_teacher=false;
                    user.is_observer=false;
                }
                else if(flag==='is_teacher' || flag==='is_edit_teacher'){
                    user.is_student=false;
                    user.is_observer=false;
                }
                if(flag==='is_observer'){
                    user.is_teacher=false;
                    user.is_edit_teacher=false;
                    user.is_student=false;
                }
            }
        };

        User.get({userId:'me'},
            function(user){

                $scope.editorUser = user;
            }
        );

        Languages.get({}, function(data) {
            $scope.languages = data.languages;
        });

        EditOrganizationUser.query({
            userId: $scope.$stateParams.userId
        }, function(response) {
            $scope.expirationDate = response.user.expiration_date?new Date(response.user.expiration_date):'';
            $scope.userExternalId = response.user.external_id;
            $scope.userFirstName = response.user.fname;
            $scope.userLastName = response.user.lname;
            $scope.organizationId = response.user.organizationid;
            $scope.userEmail = response.user.email;
            $scope.userPhone = response.user.phone;
            $scope.is_sites_admin=response.user.is_sites_admin;
            $scope.is_super_admin=response.user.is_super_admin=="1";
            $scope.is_organization_admin = response.user.is_organization_admin=="1";
            $scope.can_add_super_admin = response.user.can_create_super_users=="1";
            $scope.can_add_organization_admin = response.user.can_add_admin_users=="1";
            $scope.can_add_user = response.user.can_add_users=="1";
            $scope.can_edit_course = response.user.can_edit_courses=="1";
            $scope.teacher_supervisor = response.user.teacher_supervisor=="1";
            $scope.private_student = response.user.is_private_student=="1";
            $scope.is_disabled=response.user.is_active=="0";
            $scope.use_license=response.user.use_license=="1";
            $scope.classes = response.classes;
            for(i in $scope.classes){
                $scope.classes[i].is_student=$scope.classes[i].is_student=='1';
                $scope.classes[i].is_teacher=$scope.classes[i].is_teacher=='1';
                $scope.classes[i].is_edit_teacher=$scope.classes[i].is_edit_teacher=='1';
                $scope.classes[i].is_observer=$scope.classes[i].is_observer=='1';
            }
            $scope.preferred_language= _.findWhere($scope.languages,{language_id:response.user.preferred_language}) || _.findWhere($scope.languages,{language_id:'en'});


        });
        EditOrganizationUser.userguardians({
                user_id: $scope.$stateParams.userId,
            },
            function(users){
                $scope.users = users;

                for(i in users.all_users){
                    var user = users.all_users[i];
                    user.is_guardian=$scope.is_guardian(user.id);
                    user.guardianFilter=user.is_guardian?'1':'0';

                    user.is_dependent=$scope.is_dependent(user.id);
                    user.dependentFilter=user.is_dependent?'1':'0';

                    user.editing=false;
                }

            }
        );
        $scope.$watch('is_sites_admin',function(newValue, oldValue){
            if(newValue===false && oldValue ===true)
                SiteAdmin.removeAllFromUser({userId:$scope.userId})
        })
        $scope.guardianFilter = function(user){

            if($scope.guardianStatus=='')
                return '';
            var b =  user.is_guardian == ($scope.guardianStatus=='1');
            return b?'':false
        }
        $scope.is_guardian = function(guardian_id){
            if(typeof $scope.users === 'undefined') return false;
            if($scope.users.guardians==false) return false;
            return typeof _.findWhere($scope.users.guardians,{id:guardian_id}) !== 'undefined';
        };
        $scope.is_dependent = function(dependent_id){
            if($scope.users.children==false) return false;
            return typeof _.findWhere($scope.users.children,{id:dependent_id}) !== 'undefined';
        };

        $scope.updateDependentUser = function(user){
            EditOrganizationUser.updateguardianuser({
                guardian_id:$scope.$stateParams.userId,
                dependent_id:user.id
            },function(response){
                if(response.message='successful'){
                    user.editing=false;
                    if($scope.is_dependent(user.id)){
                        var userItem = _.findWhere($scope.users.children,{id:user.id});
                        var index = $scope.users.children.indexOf(userItem);
                        $scope.users.children.splice(index,1);
                        user.dependentFilter='0';
                    }
                    else{
                        $scope.users.children.push({id:user.id});
                        user.dependentFilter='1';
                    }
                }
            });
        };
        $scope.updateGuardianUser = function(user){
            EditOrganizationUser.updateguardianuser({
                guardian_id:user.id,
                dependent_id:$scope.$stateParams.userId
            },function(response){
                if(response.message='successful'){
                    user.editing=false;
                    if($scope.is_guardian(user.id)){
                        var userItem = _.findWhere($scope.users.guardians,{id:user.id});
                        var index = $scope.users.guardians.indexOf(userItem);
                        $scope.users.guardians.splice(index,1);
                        user.guardianFilter='0'
                    }
                    else{
                        $scope.users.guardians.push({id:user.id});
                        user.guardianFilter='1'
                    }
                }
            });
        };
        $scope.updateClass=function(class_){
            class_.class_id=class_.id;
            class_.user_id=$scope.userId;
            var inserting=false;
            if(class_.is_student||
                class_.is_teacher||
                class_.is_edit_teacher||
                class_.is_observer
            )
            {
                inserting = true;
            }
            if(class_.is_enrolled=='1'){
                if(inserting){
                    EditCourseClassUser.update(
                        class_,function(response){
                            $scope.toggleEditing(class_);
                        }
                    )
                }
                else{
                    EditCourseClassUser.delete(
                        class_,function(response){
                            class_.is_enrolled='0'
                            $scope.toggleEditing(class_);
                        }
                    )
                }

            }
            else{
                if(inserting){
                    EditCourseClassUser.submit({
                        users:[class_]
                    },function(response){
                        if (response.message == 'successful') {
                            class_.is_enrolled='1';
                            $scope.toggleEditing(class_);
                        } else {
                            toastr.error(response.message);
                        }
                    });
                }
            }

        };
        $scope.updateUser = function() {
            var generate_password = 0;

            if ($scope.systemGeneratePassword) {
                generate_password = 1;
            }

            EditOrganizationUser.update({
                user_id:$scope.$stateParams.userId,
                organization_id: CurrentOrganizationId.getOrganizationId(),
                expiration_date:$scope.expirationDate,
                fname: $scope.userFirstName,
                lname: $scope.userLastName,
                email: $scope.userEmail,
                phone: $scope.userPhone,
                external_id: $scope.userExternalId,
                password: $scope.userPassword,
                generate_password: generate_password,
                is_super_admin:$scope.is_super_admin,
                is_organization_admin:$scope.is_organization_admin,
                can_add_super_admin:$scope.can_add_super_admin,
                can_add_organization_admin:$scope.can_add_organization_admin,
                can_add_user:$scope.can_add_user,
                can_edit_course:$scope.can_edit_course,
                teacher_supervisor:$scope.teacher_supervisor,
                is_private_student:$scope.private_student,
                preferred_language:$scope.preferred_language.language_id,
                is_active:!$scope.is_disabled,
                use_license:$scope.use_license
            }, function(user) {
                // console.log(angular.toJson(user));

                if (user.message == 'successful') {
                    toastr.success('Updated User');
                } else {
                    toastr.error(user.message);
                }
            });
        }
    }
]);