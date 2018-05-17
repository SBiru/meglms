/**
 * Created by Denny on 04/02/2015.
 */
// Organization User Controller


/******************************************************************************
 * EditOrganization Controller
 *****************************************************************************/
//moved to controllers/admin/admin.js
appControllers.controller('EditOrganizationController', ['$rootScope', '$scope', '$timeout','$sce', '$location', 'EditOrganization','CurrentOrganizationId','UserInformation','UploadFile','$modal',
    function($rootScope, $scope,$timeout, $sce, $location, EditOrganization,CurrentOrganizationId,UserInformation,UploadFile,$modal) {
        $scope.userInfo = UserInformation;
        $scope.org={};

        CurrentOrganizationId.setOrganizationId($rootScope.$stateParams.organizationId);
        $scope.organizationid = CurrentOrganizationId.getOrganizationId();

        $scope.pageTypes = [
            {
                name: 'Grouping',
                id: 1
            },
            {
                name: 'Page: Content',
                id: 2
            },  {
                name: 'Page: External Link',
                id: 4
            }, {
                name: 'Page: Vocabulary',
                id: 8
            }, {
                name: 'Page: Quiz/Test',
                id: 16
            }, {
                name: 'Page: Quiz List',
                id: 32
            }, {
                name: 'Page: Vocabulary Quiz',
                id: 64
            }, {
                name: 'Page: Lesson Specific Listening Activity',
                id: 128
            }, {
                name: 'Page: General Listening Practice',
                id: 256
            }, {
                name: 'Page: General Reading Practice',
                id: 512
            }, {
                name: 'Page: Timed Review',
                id: 1024
            }, {
                name: 'Page: Class Summary',
                id: 2048
            },{
                name: 'Page: Survey',
                id: 4096
            },{
                name: 'Page: Journal',
                id: 8192
            },{
                name: 'Page: Welcome',
                id: 16384
            },{
                name: 'Page: Glossary',
                id: 32768
            },{
                name: 'Page: SCORM',
                id: 65536
            },{
                name: 'Page: Forum',
                id: 131072
            },{
                name: 'Page: Take Picture',
                id: 262144
            },{
                name: 'Page: Additional User Information Form',
                id: 524288
            }];

        EditOrganization.get({
            organizationId: $scope.organizationid
        }, function(organization) {
            $scope.organizationName = organization.organization.name;
            $scope.organizationDomain = organization.organization.domain;
            $scope.organizationEmail = organization.organization.email;
            $scope.organizationPhone = organization.organization.phone;
            $scope.org.placement_class_id = organization.organization.placement_class_id;
            $scope.sessionTime = organization.organization.session_time;
            $scope.logo = organization.organization.logo;
            $scope.org.white_label = organization.organization.white_label==1;
            $scope.org.use_splash = organization.organization.use_splash==1;
            $scope.org.sort_users_by = organization.organization.sort_users_by==1;
            $scope.organizationPageTypePermissions = parseInt(organization.organization.page_type_permissions);
        });

        $scope.updateOrganization = function() {
            if($scope.logoImage){
                if(!confirm("It seems like you didn't upload your logo image. Do you want to proceed anyway?"))
                    return;
            }
            EditOrganization.update({
                id: $scope.organizationid,
                name: $scope.organizationName,
                domain: $scope.organizationDomain,
                email: $scope.organizationEmail,
                phone: $scope.organizationPhone,
                page_type_permissions: $scope.organizationPageTypePermissions,
                placement_class_id:$scope.org.placement_class_id,
                logo:$scope.logo,
                white_label:$scope.org.white_label,
                use_splash:$scope.org.use_splash,
                session_time:$scope.sessionTime

            }, function(organization) {
                console.log(angular.toJson(organization));

                if (organization.message == 'successful') {
                    $rootScope.$broadcast('NavAddedOrganizationUpdate');
                    toastr.success('Updated Organization');
                } else {
                    toastr.error(organization.message);
                }
            });
        };

        $scope.deleteOrganization = function() {
            if (confirm("Are You Sure You Want To Delete This Organization?") == true) {
                EditOrganization.delete({
                    id: $scope.organizationid
                }, function(organization) {
                    console.log(angular.toJson(organization));

                    if (organization.message == 'successful') {
                        $rootScope.$broadcast('NavAddedOrganizationUpdate');
                        toastr.success('Deleted Organization');
                        $location.url('/superadmindash/');
                    } else {
                        toastr.error(organization.message);
                    }
                });
            }
        }
        $scope.togglePageType = function (page){
            if($scope.organizationPageTypePermissions & page.id)
                $scope.organizationPageTypePermissions-=page.id;
            else
                $scope.organizationPageTypePermissions+=page.id;
        }
        $scope.isPageChecked = function (page){
            return (page.id & $scope.organizationPageTypePermissions)>0;
        };

        $scope.$watch('organizationPageTypePermissions',function(){
            for(i in $scope.pageTypes){
                var page =$scope.pageTypes[i];
                page.checked=$scope.isPageChecked(page);
            }
        });
        $scope.openProgressReport = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/admin/progressreportmodal.html',
                controller: 'ProgressReportModalController',
                resolve:{
                    orgid:function(){
                        return $rootScope.$stateParams.organizationId
                    },
                },
                size: 'lg',
                windowClass: 'progress-report-window',
            });
        }
        $scope.openAutomatedAlerts = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/directives/automated-alerts/automated-alerts-modal.html',
                controller: ['$scope','$modalInstance','orgid',function($scope,$modalInstance,orgid){
                    $scope.cancel = $modalInstance.dismiss;
                    $scope.orgId = orgid;
                }],
                resolve:{
                    orgid:function(){
                        return $rootScope.$stateParams.organizationId
                    },
                },
                size: 'lg',
                windowClass: 'automated-alerts-modal',
            });
        }
        $scope.openEditTestClasses = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/admin/edittestclasses.html',
                controller: 'EditProficiencyClassesController',
                windowClass: 'edit-test-classes-modal',
            });
        };
        $scope.openEditTestSchools = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/directives/admin/proficiency_test_schools/test_schools_container.html',
                controller: 'TestSchoolsContainer',
                windowClass: 'test-schools-container',
            });
        };


    }
]);
appControllers.controller('AddOrganizationUsersController', ['$rootScope', '$scope', '$timeout', 'CurrentOrganizationId', 'EditOrganizationUser','User','Languages',
    function($rootScope, $scope, $timeout, CurrentOrganizationId, EditOrganizationUser,User,Languages) {
        $scope.organizationId = CurrentOrganizationId.getOrganizationId();
        $scope.userFirstName = '';
        $scope.userLastName = '';
        $scope.userEmail = '';
        $scope.userPassword = '';
        $scope.userExternalId = '';
        $scope.userPhone='';
        $scope.systemGeneratePassword = false;
        $scope.is_super_admin = false;
        $scope.is_organization_admin = false;
        $scope.can_add_super_admin = false;
        $scope.can_add_organization_admin = false;
        $scope.can_add_user = false;
        $scope.can_edit_course = false;
        $scope.use_license=false;
        $scope.languages;

        //We need a object to store our variables, since this controller is also used as child scope
        $scope.scope=$scope;
        $scope.editorUser={};

        Languages.get({}, function(data) {
            $scope.languages = data.languages;
            $scope.preferred_language = _.findWhere($scope.languages,{language_id:'en'});
        });
        User.get({userId:'me'},
            function(user){
                $scope.editorUser = user;
            }
        );
        $scope.addUser = function() {
            var generate_password = 0;

            if ($scope.systemGeneratePassword) {
                generate_password = 1;
            }

            EditOrganizationUser.submit({
                organization_id: CurrentOrganizationId.getOrganizationId(),
                fname: $scope.userFirstName,
                lname: $scope.userLastName,
                email: $scope.userEmail,
                phone: $scope.userPhone,
                password: $scope.userPassword,
                external_id: $scope.userExternalId,
                generate_password: generate_password,
                is_super_admin:$scope.is_super_admin,
                is_organization_admin:$scope.is_organization_admin,
                can_add_super_admin:$scope.can_add_super_admin,
                can_add_organization_admin:$scope.can_add_organization_admin,
                can_add_user:$scope.can_add_user,
                can_edit_course:$scope.can_edit_course,
                preferred_language:$scope.preferred_language.language_id,
                use_license:$scope.use_license
            }, function(user) {
                // console.log(angular.toJson(user));

                if (user.status == 'successful') {
                    if(window.location.hash == '#/addorganizationuser/'){
                        window.location.href='#/editorganizationuser/'+user.user_id;
                    }
                    $rootScope.$broadcast('Added_User',user);
                } else {
                    toastr.error(user.message);
                }
            });
        }
    }
]);
// EditOrganizationUsersController has been moved to \public\js\admin\EditOrganizationUsersController.js

//ClassAdmin Controller


appControllers.controller('ImportStudentDataController', [
    '$scope',
    '$modalInstance',
    'Import',
    'classId',
    function($scope, $modalInstance, Import, classId) {
        var file = null;

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };

        $scope.select = function(files) {
            $scope.error = null;
            if(!files.length) {
                return;
            }
            file = files[0];
            $scope.ready = true;
        };

        $scope.import = function () {
            Import.keepAlive.start();
            if(!$scope.ready) {
                $scope.error = 'An error ocurred while checking compatibility. Please reload the page.';
                return;
            }
            $scope.importing = true;
            $scope.progressPerc = 0;
            Import.uploadMoodleData(
                file,
                classId,
                // on progress:
                function(evt) {
                    $scope.progressPerc = parseInt((evt.loaded/evt.total)*100);
                },
                // on success:
                function(data) {
                    $scope.finished = true;
                },
                // on error
                function(error) {
                    $scope.importing = $scope.ready = false;
                    file = null;
                    Import.keepAlive.stop();
                    $scope.error = error.error;
                },
                'no'
            );
        };
    }
]);


/*
 DSerejo 2015-02-10
 Merging courses and classes.
 For now, we are eliminating course level.

 */

appControllers.controller('CourseClassUsersController', ['$rootScope', '$scope', '$timeout', 'CurrentClassId', 'OrganizationUser', '$upload', 'EditOrganizationUser', 'CurrentOrganizationId','EditCourseClassUser','CurrentGroupId','Class','HelperService',
    function($rootScope, $scope, $timeout, CurrentClassId, OrganizationUser, $upload, EditOrganizationUser, CurrentOrganizationId,EditCourseClassUser,CurrentGroupId,Class,HelperService) {
        $scope.className = '';
        $scope.$root.users = new Array();
        $scope.currentGroup = CurrentGroupId;
        $scope.classId = $scope.classId || $rootScope.$stateParams.classId;


        function getUsers(){
            OrganizationUser.getclassusers({
                class_id: $scope.classId,
                group_id: $scope.currentGroup.group_id

            }, function(users) {
                // console.log("User: " + angular.toJson(users));
                $scope.$root.users = users.users;
                if (angular.isDefined($scope.$root.users) && angular.isDefined($scope.$root.users.length) && $scope.$root.users.length > 0) {
                    $scope.className = $scope.$root.users[0].class_name;
                    $scope.groupName = $scope.$root.users[0].group_name;
                }
            });
        }
        $scope.$watch('currentGroup',getUsers,true);

        $scope.enrollUserHref = function(){
            if($scope.currentGroup.group_id && $scope.currentGroup.group_id>0){
                return '#/enrollgroupuser/'+$scope.classId+'/'+$scope.currentGroup.group_id;

            }
            else{
                return '#/enrollcourseclassuser/'+$scope.classId;
            }
        }
        $scope.enrollUserState = function(){
            $scope.$root.$stateParams.classId=$scope.classId;
            if($scope.currentGroup.group_id && $scope.currentGroup.group_id>0)
                $scope.$root.$stateParams.groupId=$scope.currentGroup.group_id;
            $scope.$root.isEnrollModalBusy=true;

        }
        $scope.addUserHref = function(){
            if($scope.currentGroup.group_id && $scope.currentGroup.group_id>0){
                return '#/addgroupuser/'+$scope.classId+'/'+$scope.currentGroup.group_id;

            }
            else{
                return '#/addcourseclassuser/'+$scope.classId;
            }
        }
        $scope.exportEnrollmentAsCsv = function(){
            Class.exportEnrollmentAsCsv({
                id:$scope.classId,
                filename: 'enrollment_'+$scope.className
            },function(response){
                HelperService.buildFileFromData(response.content,response.filename);
            })

        }
        $scope.editUserHref = function(user){
            if($scope.currentGroup.group_id && $scope.currentGroup.group_id>0){
                return '#/editgroupuser/'+$scope.classId+'/'+$scope.currentGroup.group_id +'/'+user.id;

            }
            else{
                return '#/editcourseclassuser/'+$scope.classId+'/'+user.id;
            }
        }
        $scope.editUserView = function(user){
            $scope.$root.$stateParams.groupId =$scope.currentGroup.group_id;
            $scope.$root.$stateParams.classId =$scope.classId;
            $scope.$root.$stateParams.userId =user.id;
            $scope.$root.isEditModalBusy=true;
        }
        $scope.updateUser = function(user){
            EditCourseClassUser.update({
                class_id: $scope.classId,
                user_id:user.id,
                is_teacher:user.is_teacher==1,
                is_student:user.is_student==1,
                is_edit_teacher:user.is_edit_teacher==1,
                is_suspended:user.is_suspended,
                is_finished:user.is_finished
            });
        };
        $scope.onCsvFileSelect = function($files) {
            console.log('here')
            $scope.is_uploading = true;
            $scope.progress_upload = 0;

            if (!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if ($scope.file_upload_comment == 'Type Message Here') {
                $scope.file_upload_comment = '';
            }


            if ($scope.check_is_private) {
                $scope.check_is_private = 1;
            }

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];

                $scope.upload = $upload.upload({
                    url: '/editcourseclassuser/upload/', //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,
                    data: {
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        file_upload_comment: $scope.file_upload_comment,
                        check_is_private: $scope.check_is_private
                    },
                    file: file // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name.
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function(evt) {
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);


                    $('.progress-bar').width($scope.progress_upload + '%')
                }).success(function(data, status, headers, config) {

                    console.log(data);
                    if(data.length > 0){
                        var columnHeaders = data[0],
                            allUsers = [];
                        for(var i = 1; i < data.length; i++){
                            var newUser = {
                                include: true,
                                password: "",
                                preferred_language: 'eng',
                                is_organization_admin: false,
                                can_add_organization_admin: false,
                                can_add_user: false,
                                can_edit_courses: false,
                                classes: ""
                            };
                            for(var j = 0; j < columnHeaders.length; j++) {
                                var currentColumnHeader = columnHeaders[j].toLowerCase().trim();
                                if(currentColumnHeader == "user id"){
                                    newUser.id = data[i][j];
                                } else if (currentColumnHeader == "first name" || currentColumnHeader == "given name" || currentColumnHeader == "first") {
                                    newUser.fname = data[i][j];
                                } else if (currentColumnHeader == "last name" || currentColumnHeader == "family name" || currentColumnHeader == "last" || currentColumnHeader == "surname") {
                                    newUser.lname = data[i][j];
                                } else if (currentColumnHeader == "email" || currentColumnHeader == "e-mail" || currentColumnHeader == "e mail") {
                                    newUser.email = data[i][j];
                                } else if (currentColumnHeader == "password" || currentColumnHeader == "pass word" || currentColumnHeader == "passphrase") {
                                    newUser.password = data[i][j];
                                } else if (currentColumnHeader == "preferred language" || currentColumnHeader == "language" || currentColumnHeader == "native language") {
                                    newUser.preferred_language = data[i][j];
                                } else if (currentColumnHeader == "is organization admin" || currentColumnHeader == "organization admin") {
                                    newUser.is_organization_admin = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "can add organization admin") {
                                    newUser.can_add_organization_admin = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "can add users") {
                                    newUser.can_add_user = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "can edit courses") {
                                    newUser.can_edit_courses = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if(currentColumnHeader == "classes" || currentColumnHeader == "class ids") {
                                    newUser.classes = data[i][j];
                                }
                            }
                            allUsers.push(newUser);
                        }
                        $scope.bulkUserUpload(allUsers);
                    } else {
                        toastr.error('Invalid data provided')
                    }
                    // file is uploaded successfully


                    if (data.message == 'successful') {
                        $scope.$broadcast('reloadPostedMessages', true);

                        $('#basicFileUploadModal').modal('hide');
                        $scope.is_uploading = false;
                        $scope.progress_upload = 0;
                    } else {
                        toastr.error(data.message);
                    }

                });
                //.error(...)
                //.then(success, error, progress);
                // access or attach event listeners to the underlying XMLHttpRequest.
                //.xhr(function(xhr){xhr.upload.addEventListener(...)})
            }
            /* alternative way of uploading, send the file binary with the file's content-type.
             Could be used to upload files to CouchDB, imgur, etc... html5 FileReader is needed.
             It could also be used to monitor the progress of a normal http post/put request with large data*/
            // $scope.upload = $upload.http({...})  see 88#issuecomment-31366487 for sample code.
        };

        $scope.bulkUserUpload = function(usersArray){
            var errorMessage = "Done. ";
            var orgId = CurrentOrganizationId.getOrganizationId();
            if(!orgId){
                orgId = $scope.classInfo.orgId;
            }
            for(var i = 0; i < usersArray.length; i++) {
                EditOrganizationUser.submit({
                    organization_id: orgId,
                    fname: usersArray[i].fname,
                    lname: usersArray[i].lname,
                    email: usersArray[i].email,
                    password: usersArray[i].password,

                    generate_password: usersArray[i].password.length == 0,
                    is_super_admin: usersArray[i].is_super_admin,
                    is_organization_admin: usersArray[i].is_organization_admin,
                    can_add_super_admin: usersArray[i].can_add_super_admin,
                    can_add_organization_admin: usersArray[i].can_add_organization_admin,
                    can_add_user: usersArray[i].can_add_user,
                    can_edit_course: usersArray[i].can_edit_course,
                    preferred_language: usersArray[i].preferred_language.language_id
                }, function (user) {
                    if (user.message.toLowerCase().indexOf('successful')>=0) {
                        $rootScope.$broadcast('Added_User', user);
                        toastr.success('User was succesfully added')
                    } else {
                        errorMessage += user.message + " ";
                    }
                });
            }
            toastr.error(errorMessage);
        }


        $scope.resolveUserImportBooleanColumn = function(cellValue){
            var value = cellValue.toLowerCase();
            if(value == 'true'||value == '1'||value == 'yes'){
                return true
            }
            return false;
        }
        $scope.$root.$on('reloadUsers',function(){
            getUsers();
        });
    }
]);
appControllers.controller('EditCourseClassUserController', ['$rootScope', '$scope', '$timeout', '$state', 'CurrentClassId', 'OrganizationUser','CurrentOrganizationId','EditCourseClassUser', '$upload','Class','Gradebook','EditOrganizationUser', 'User',
    function($rootScope, $scope, $timeout, $state, CurrentClassId, OrganizationUser,CurrentOrganizationId,EditCourseClassUser, $upload,Class,Gradebook, EditOrganizationUser, User) {
        $scope.user={};
        $scope.editorUser = {};
        $scope.classId = $rootScope.$stateParams.classId;
        $scope.userId = $rootScope.$stateParams.userId;
        $scope.groupId = $rootScope.$stateParams.groupId;
        EditCourseClassUser.userinformation({
            class_id: $scope.classId,
            user_id: $scope.userId,
            group_id:$scope.groupId

        }, function(response) {
            $scope.user=response.user;
            $scope.user.is_teacher=$scope.user.is_teacher=='1';
            $scope.user.is_edit_teacher=$scope.user.is_edit_teacher=='1';
            $scope.user.is_student=$scope.user.is_student=='1';
            $scope.user.is_finished=$scope.user.finished_class=='1' || $scope.user.final_score;
            $scope.user.is_observer=$scope.user.is_observer=='1';
            if(response.user.manual_start_date || response.user.manual_end_date){
                $scope.user.editDates = true;
            }
            $scope.user.ready =true;
        });

        User.get({userId:'me'}, function(user){
            EditCourseClassUser.userinformation({class_id: $scope.classId, user_id: user.id, group_id:$scope.groupId}, function(response) {
                $scope.editorUser = user;
                $scope.editorUser.is_teacher_of_this_class = response.user?response.user.is_teacher=='1':false;
            });
        });

        $scope.showDeleteUserData = function(){
            return $scope.$root.user &&
                ($scope.$root.user.is_super_admin || $scope.$root.user.is_organization_admin)
        }
        $scope.deleteUserData = function(recalculate){
            if(recalculate || confirm('Are you sure you want to delete all user data from this class?')){
                if(!recalculate){
                    Gradebook.openRecalculationWarning(
                        function(){$scope.deleteUserData('now')},
                        function(){$scope.deleteUserData('later')}
                    )
                }
                else {
                    $scope.deleting = 1;
                    Class.deleteUserData({
                        id:$scope.classId,
                        userId:$scope.userId,
                        recalculate:recalculate
                    },function(ok){
                        $scope.deleting = 0;
                    },function(error){
                        $scope.error = error.error
                        $scope.deleting = 2;
                    });
                }
            }
        };
        function prepareStartEndDates(){
            if(!$scope.user.editDates){
                $scope.user.manual_start_date = '';
                $scope.user.manual_expected_end_date = '';
            }else{
                $scope.user.manual_start_date = prepareDate($scope.user.showedStartDate);
                $scope.user.manual_expected_end_date = prepareDate($scope.user.showedExpectedEndDate);
            }
        }
        function prepareDate(date){
            return moment(date).format('YYYY-MM-DD');
        }
        $scope.updateUser = function(){
            if($scope.user.is_teacher || $scope.user.is_edit_teacher) {
                $scope.user.is_student = 0;
            }
            prepareStartEndDates();
            EditCourseClassUser.update({
                class_id: $scope.classId,
                user_id: $scope.userId,
                is_teacher:$scope.user.is_teacher,
                is_edit_teacher:$scope.user.is_edit_teacher,
                is_student:$scope.user.is_student,
                group_id:$scope.groupId,
                is_finished: $scope.user.finished_class,
                unset_final_score: $scope.user.unset_final_score,
                manual_start_date: $scope.user.manual_start_date,
                manual_expected_end_date: $scope.user.manual_expected_end_date,
                is_observer:$scope.user.is_observer,
                final_score:$scope.user.final_score
            }, function(response) {
                if(response.message=='successful' || response.message=='No changes were made') {
                    $scope.goBack();
                }
            });
        };

        $scope.canShowLoginAsBtn = function () {
            if(JSON.stringify($scope.editorUser) == '{}' || JSON.stringify($scope.user) == '{}')  return false;
            var org = $scope.editorUser.org;
            if($scope.editorUser.is_super_admin){
                return true;
            } else if(org.allow_users_to_log_in_as_others){
                var adminAccess = ($scope.editorUser.is_organization_admin || $scope.editorUser.is_site_admin) && org.allowedUsersToLogInAsOthers.allow_organization_and_site_admins_to_log_in_as_others,
                    teacherAccess = $scope.editorUser.is_teacher_of_this_class && $scope.user.is_student && org.allowedUsersToLogInAsOthers.allow_teachers_to_log_in_as_others;
                return adminAccess || teacherAccess;
            } else{
                return false;
            }
        };

        $scope.loginAs = function(){
            if(!confirm("Are you sure you want to log in as this user?"))
                return;
            EditOrganizationUser.loginAs({
                    id:$scope.userId,
                    classId: $scope.classId
                },function(){
                    window.location='/';
                },function(error){
                    console.log(error);
                }
            )
        }

        $scope.goBack = function(){
            if(!$scope.$root.isEditModalBusy)
                $state.go('editcourseclass', {classId: $scope.classId});
            else{
                $scope.$root.isEditModalBusy=false;
                $scope.$root.$broadcast('reloadUsers');
            }
        };

        $scope.checkboxTeacherChange = function(){
            if($scope.user.is_teacher || $scope.user.is_edit_teacher) {
                $scope.user.is_student = 0;
                $scope.user.is_observer = 0;
            }
        };

        $scope.checkboxStudentChange = function(){
            if($scope.user.is_student) {
                $scope.user.is_teacher = 0;
                $scope.user.is_edit_teacher = 0;
                $scope.user.is_observer = 0;
            }
        };
        $scope.checkboxObserverChange = function(){
            if($scope.user.is_observer) {
                $scope.user.is_teacher = 0;
                $scope.user.is_edit_teacher = 0;
                $scope.user.is_student = 0;
            }
        };


        $scope.toggleFinished = function(){
            $scope.user.removeFinished = !$scope.user.removeFinished;
            if($scope.user.finished_class && $scope.user.removeFinished) {
                $scope.user.is_finished = false;
            } else if($scope.user.finished_class) {
                $scope.user.is_finished = true;
            } else {
                $scope.user.is_finished = false;
            }
        };


    }
]);
appControllers.controller('EnrollCourseClassUserController', ['$rootScope', '$scope','$state', '$timeout', 'CurrentClassId', 'OrganizationUser','CurrentOrganizationId','EditCourseClassUser','User','Class',
    function($rootScope, $scope,$state, $timeout, CurrentClassId, OrganizationUser,CurrentOrganizationId,EditCourseClassUser,User,Class) {
        //TODO add comments


        $scope.organizationName = '';
        $scope.users = new Array();
        $scope.classId = $rootScope.$stateParams.classId;
        $scope.groupId = $rootScope.$stateParams.groupId;
        $scope.goBack = goBack;
        $scope.getUsers = getUsers;
        $scope.getUsers();
        classInfo();


        function goBack(){
            if(!$scope.$root.isEnrollModalBusy)
                $state.go('editcourseclass', {classId: $scope.classId});
            else {
                $scope.$root.isEnrollModalBusy = false;
                $scope.$root.$broadcast('reloadUsers')

            }
        };
        function classInfo(){
            $scope.classInfo = Class.get({
                id:$scope.classId
            });
            if($scope.groupId)
                $scope.groupInfo = Class.getGroup({
                    id:$scope.classId,
                    groupId: $scope.groupId
                });
        }
        function getUsers(all){

            EditCourseClassUser.getavailableusers({
                class_id: $scope.classId,
                group_id: $scope.groupId,
                all_users:all
            }, function(users) {
                // console.log("User: " + angular.toJson(users));

                $scope.users = users.users;
                $scope.groupId=$scope.groupId||null;
                for(var user in $scope.users){
                    $scope.users[user].is_student=$scope.users[user].is_student=='1' && $scope.groupId==$scope.users[user].groupid;
                    $scope.users[user].is_teacher=$scope.users[user].is_teacher=='1' && $scope.groupId==$scope.users[user].groupid;
                    $scope.users[user].is_edit_teacher=$scope.users[user].is_edit_teacher=='1' && $scope.groupId==$scope.users[user].groupid;
                    $scope.users[user].is_observer=$scope.users[user].is_observer=='1' && $scope.groupId==$scope.users[user].groupid;
                }
                if (angular.isDefined($scope.users) && angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                    $scope.organizationName = $scope.users[0].organization_name;
                }
            });
        };

        User.get({userId:'me'},function(res){
            $scope.isAdmin = res.is_super_admin
        });
        $scope.toggleEditing = function(user,flag){
            if(typeof flag==='undefined'){
                flags=['is_student','is_teacher','is_edit_teacher','is_observer'];
                for( i in flags){
                    flag = flags[i];
                    var key = 'editing_' + flag;
                    delete user[key];
                }

            }
            else {
                var key = 'editing_' + flag;
                if (typeof user[key] === 'undefined') {
                    user[key] = true;
                } else {
                    delete user[key];
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
        $scope.updateUser=function(user){
            user.user_id=user.id;
            user.class_id=$scope.classId;
            user.group_id=$scope.groupId;
            var inserting=false;
            if(user.is_student||
                user.is_teacher||
                user.is_edit_teacher||
                user.is_observer)
            {
                inserting = true;
            }
            if(user.is_enrolled=='1'){
                if(inserting){
                    EditCourseClassUser.update(
                        user,function(response){
                            $scope.toggleEditing(user);
                        }
                    )
                }
                else{
                    EditCourseClassUser.delete(
                        user,function(response){
                            user.is_enrolled='0'
                            $scope.toggleEditing(user);
                        }
                    )
                }

            }
            else{
                if(inserting){
                    EditCourseClassUser.submit({
                        users:[user]
                    },function(response){
                        if (response.message == 'successful') {
                            user.is_enrolled='1';
                            $scope.toggleEditing(user);
                        } else {
                            toastr.error(response.message);
                        }
                    });
                }
            }

        };
        $scope.enrollUsers = function(user){
            var selectedUsers=[]
            if(typeof user === 'undefined'){
                for(var i in $scope.users){
                    if($scope.users[i].is_student||
                        $scope.users[i].is_teacher||
                        $scope.users[i].is_edit_teacher){
                        selectedUsers.push($scope.users[i])
                    }
                }
                for(user in selectedUsers){
                    selectedUsers[user].user_id=selectedUsers[user].id;
                    selectedUsers[user].class_id=$scope.classId;
                    selectedUsers[user].group_id=$scope.groupId;
                }
            }
            else{
                user.user_id=user.id;
                user.class_id=$scope.classId;
                user.group_id=$scope.groupId;

                selectedUsers.push(user);
            }

            EditCourseClassUser.submit({
                users:selectedUsers
            },function(response){
                if (response.message == 'successful') {
                    toastr.success('Enrolled Users');
                    window.location.href='#/editcourseclass/'+$scope.classId;
                } else {
                    toastr.error(response.message);
                }
            })

        }
        $scope.$watch('show_all_users',function(newValue){
            if(angular.isDefined(newValue)&& newValue!= null){
                $scope.users=[];
                if(newValue)
                    getUsers(true);
                else getUsers();
            }
        });

    }
]);

// Add Course Class User Controller
appControllers.controller('AddCourseClassUserController', ['$rootScope', '$scope', '$timeout', 'EditCourseClassUser','Class',
    function($rootScope, $scope, $timeout, EditCourseClassUser,Class) {
        $scope.className = "";
        $scope.userToEnroll = {};



        $scope.classId = $rootScope.$stateParams.classId;
        $scope.groupId = $rootScope.$stateParams.groupId;

        $scope.users = new Array();
        $scope.types = new Array(
            {
                name: 'student'
            },
            {
                name: 'teacher'
            }

        );
        $scope.is_content_editor=false;
        $rootScope.$on('Added_User', function(event, data){
            $scope.userAdded=true;
            $scope.user_id=data.user_id;
        });

        if($scope.groupId)
            $scope.groupInfo = Class.getGroup({
                id:$scope.classId,
                groupId: $scope.groupId
            });

        EditCourseClassUser.getavailableusers({
            class_id: $scope.classId,

        }, function(users) {
            // console.log("Available Users: " + angular.toJson(users));

            if (angular.isDefined(users.users)) {
                $scope.users = users.users;
            }

            if (angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                $scope.className = $scope.users[0].name;
            }
        });

        $scope.addUser = function() {
            if(!angular.isDefined($scope.userAdded))
            {
                toastr.error('Please add a user first');
                return;
            }
            //if (angular.isDefined($scope.userToEnroll) && angular.isDefined($scope.userToEnroll.id) && $scope.userToEnroll.id > 0 && angular.isDefined($scope.userType) && angular.isDefined($scope.userType.name)) {
            // console.log("Class ID: " + $rootScope.$stateParams.classId);
            // console.log("User ID: " + $scope.userToEnroll.id);
            // console.log("Type: " + $scope.userType.name);

            EditCourseClassUser.submit({
                class_id: $rootScope.$stateParams.classId,
                group_id: $scope.groupId,
                user_id: $scope.user_id,
                is_student:$scope.is_student,
                is_teacher:$scope.is_teacher,
                is_edit_teacher:$scope.is_edit_teacher,
            }, function(courseclassuser) {
                // console.log(angular.toJson(courseclassuser));

                if (courseclassuser.message == 'successful') {
                    toastr.success("Enrolled User");
                    window.location.href='#/editcourseclass/'+$rootScope.$stateParams.classId;
                } else {
                    toastr.error(courseclassuser.message);
                }
            });
            //} else {
            //    toastr.success('Please Provide Both User And Type.');
            //}
        }
    }
]);
appControllers.controller('AddTermController', ['$rootScope', '$scope', '$timeout','EditTerm',
    function($rootScope, $scope, $timeout ,EditTerm) {
        $scope.term={};

        jQuery('.date').datepicker({
            dateFormat: 'yy-mm-dd',
            beforeShow: function (input, inst) {
                var offset = $(input).offset();
                var height = $(input).height();
                window.setTimeout(function () {
                    inst.dpDiv.css({ top: (offset.top + height + 4) + 'px', left: offset.left + 'px' })
                }, 1);
            }

        });

        $scope.addTerm = function(){
            EditTerm.save(
                $scope.term
                ,function(response){
                    if(response.message=='successful'){
                        toastr.success("Added term")
                        window.location.href='#/editterm/'+response.term_id;
                    }

                    else
                        toastr.error(response.message);
                });
        }
    }]);
appControllers.controller('EditTermController', ['$rootScope', '$scope', '$timeout','EditTerm','CourseClass','CurrentDepartmentId','Cookiecutter',
    function($rootScope, $scope, $timeout ,EditTerm,CourseClass,CurrentDepartmentId,Cookiecutter) {
        $scope.term={};
        $scope.departmentId = CurrentDepartmentId.getDepartmentId()==0?Cookiecutter.getCookiebyname('term_id'):CurrentDepartmentId.getDepartmentId();
        jQuery('.date').datepicker({
            dateFormat: 'yy-mm-dd',
            beforeShow: function (input, inst) {
                var offset = $(input).offset();
                var height = $(input).height();
                window.setTimeout(function () {
                    inst.dpDiv.css({ top: (offset.top + height + 4) + 'px', left: offset.left + 'px' })
                }, 1);
            }

        });
        CourseClass.get({
            departmentId:$scope.departmentId
        },function(response){
            $scope.classes=response.classes
        });
        EditTerm.get({
            termId:$rootScope.$stateParams.termId
        },function(response){
            $scope.term=response.term
        });
        $scope.dateFormat = function(isoString){
            var dateList = isoString.split('-');
            return dateList[1].concat('/',dateList[2],'/',dateList[0].substring(2,4));
        }
        $scope.dates = function(class_){
            if(class_.term_id !== null){
                console.log(String(class_.term_name) + " ("+ $scope.dateFormat(class_.term_start_date) + ' - ' + $scope.dateFormat(class_.term_end_date)+ ")");
                return   "("+ $scope.dateFormat(class_.term_start_date) + ' - ' + $scope.dateFormat(class_.term_end_date)+ ") " + String(class_.term_name) ;
            }
        };
        $scope.updateTerm = function(){
            EditTerm.update(
                $scope.term
                ,function(response){
                    if(response.message=='successful')
                        toastr.success("Updated")
                    else
                        toastr.error(response.message);
                });
        }
        $scope.updateClass = function(class_){
            EditTerm.addclass({
                classId:class_.id,
                termId:$scope.term.id
            },function(response){
                if(response.message='successful'){
                    class_.editing=false;
                    class_.has_term = '1';
                    class_.term_name = $scope.term.name;
                    class_.term_id = $scope.term.id;

                }

                else
                    toastr.error(response);

            });
        }
    }]);