appControllers.controller('OrganizationUsersController', ['$rootScope', '$scope', '$timeout', 'CurrentOrganizationId', 'OrganizationUser','EditOrganizationUser', '$upload', 'EditCourseClass', 'ShowDatesGrades', 'EditCourse', 'CurrentDepartmentId', 'EditEnrollment',
    function($rootScope, $scope, $timeout, CurrentOrganizationId, OrganizationUser, EditOrganizationUser, $upload, EditCourseClass, ShowDatesGrades, EditCourse, CurrentDepartmentId,EditEnrollment) {
        $scope.organizationName = '';
        $scope.users = new Array();

        OrganizationUser.get({
            organizationId: CurrentOrganizationId.getOrganizationId()
        }, function(users) {
            // console.log("User: " + angular.toJson(users));
            for(var i in users.users)
                users.users[i].is_disabled=users.users[i].is_active=='0'
            $scope.users = users.users;
            if (angular.isDefined($scope.users) && angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                $scope.organizationName = $scope.users[0].organization_name;
            }

        });
        $scope.disableUser = function(user){
            EditOrganizationUser.disable({
                user_id:user.id,
                is_active:!user.is_disabled
            })
        }
        /**
         * onCsvFileSelect() is called when a user uploads a user import CSV file, it will call the server to
         * convert this CSV into a Javascript Array. It will then save all users in that array.
         *
         * @param $files
         */
        $scope.onCsvFileSelect = function($files) {
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
                    url: '/editcourseclassuser/upload/',
                    data: {
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        file_upload_comment: $scope.file_upload_comment,
                        check_is_private: $scope.check_is_private
                    },
                    file: file
                }).progress(function(evt) {
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);


                    $('.progress-bar').width($scope.progress_upload + '%')
                }).success(function(data) {
                    // data should be an Array of Arrays representing the cells that were in the CSV file.
                    if(data.length > 0){
                        var columnHeaders = data[0],
                            allUsers = [];
                        // For every user import row that was in the CSV file, try to save all of the new information
                        // for that user.
                        for(var i = 1; i < data.length; i++){
                            // Create an object with default values to contain data about the imported user
                            var newUser = {
                                include: true,
                                password: "",
                                preferred_language: 'en',
                                is_organization_admin: false,
                                can_add_organization_admin: false,
                                can_add_user: false,
                                can_edit_courses: false,
                                newClasses: [],
                                error_msg: ""
                            };
                            // Test the value of every column header, looking for a match to user attributes that our
                            // system recognizes. If a column header is encountered that is not recognized, do not
                            // import data for that user and give an error message.
                            for(var j = 0; j < columnHeaders.length; j++) {
                                var currentColumnHeader = columnHeaders[j].toLowerCase().trim();
                                if (currentColumnHeader == "first name" || currentColumnHeader == "given name" || currentColumnHeader == "first") {
                                    newUser.fname = data[i][j];
                                } else if (currentColumnHeader == "last name" || currentColumnHeader == "family name" || currentColumnHeader == "last" || currentColumnHeader == "surname") {
                                    newUser.lname = data[i][j];
                                } else if (currentColumnHeader == "email" || currentColumnHeader == "e-mail" || currentColumnHeader == "e mail") {
                                    newUser.email = data[i][j];
                                } else if (currentColumnHeader == "password" || currentColumnHeader == "pass word" || currentColumnHeader == "passphrase") {
                                    newUser.password = data[i][j];
                                } else if (currentColumnHeader == "preferred language" || currentColumnHeader == "language" || currentColumnHeader == "native language") {
                                    var languageValueProvided = data[i][j];
                                    var newUserPreferredLanguage = null;
                                    if(languageValueProvided == "arabic" || languageValueProvided == "ar"){
                                        newUserPreferredLanguage = "ar";
                                    }
                                    else if(languageValueProvided == "german" || languageValueProvided == "de"){
                                        newUserPreferredLanguage = "de";
                                    }
                                    else if(languageValueProvided == "english" || languageValueProvided == "en"){
                                        newUserPreferredLanguage = "en";
                                    }
                                    else if(languageValueProvided == "spanish" || languageValueProvided == "es"){
                                        newUserPreferredLanguage = "es";
                                    }
                                    else if(languageValueProvided == "french" || languageValueProvided == "fr"){
                                        newUserPreferredLanguage = "fr";
                                    }
                                    else if(languageValueProvided == "japanese" || languageValueProvided == "jp"){
                                        newUserPreferredLanguage = "jp";
                                    }
                                    else if(languageValueProvided == "cambodian" || languageValueProvided == "km"){
                                        newUserPreferredLanguage = "km";
                                    }
                                    else if(languageValueProvided == "korean" || languageValueProvided == "ko"){
                                        newUserPreferredLanguage = "ko";
                                    }
                                    else if(languageValueProvided == "portuguese" || languageValueProvided == "pt"){
                                        newUserPreferredLanguage = "pt";
                                    }
                                    else if(languageValueProvided == "thai" || languageValueProvided == "th"){
                                        newUserPreferredLanguage = "th";
                                    }
                                    else if(languageValueProvided == "vietnamese" || languageValueProvided == "vi"){
                                        newUserPreferredLanguage = "vi";
                                    }
                                    else if(languageValueProvided == "chinese" || languageValueProvided == "zh"){
                                        newUserPreferredLanguage = "zh";
                                    }
                                    if(newUser.preferred_language == null){
                                        newUser.error_msg = " - Cannot find language matching value " + columnHeaders[j] +
                                            " valid values include any of Arabic, ar, German, de, English, en, Spanish, es, French, fr, Japanese, jp, Cambodian, km, Korean, ko, Portuguese, pt, Thai, th, Vietnamese, vi, Chinese, zh - "
                                    } else {
                                        newUser.preferred_language = newUserPreferredLanguage;
                                    }
                                } else if (currentColumnHeader == "is organization admin" || currentColumnHeader == "organization admin") {
                                    newUser.is_organization_admin = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "can add organization admin") {
                                    newUser.can_add_organization_admin = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "can add users") {
                                    newUser.can_add_user = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "can edit courses" || currentColumnHeader == "can edit classes") {
                                    newUser.can_edit_courses = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if(currentColumnHeader == "classes" || currentColumnHeader == "courses"){
                                    newUser.classes = data[i][j].split(";");
                                } else if(currentColumnHeader == "external user id" || currentColumnHeader == "external id" || currentColumnHeader == "external identifier"){
                                    newUser.external_id = data[i][j];
                                } else if(currentColumnHeader == "group"){
                                    newUser.group = data[i][j];
                                }else {
                                    var userNotAdded = "";
                                    if(newUser.fname){
                                        userNotAdded = newUser.fname + " " + newUser.lname;
                                    } else {
                                        userNotAdded = " with email " + newUser.email;
                                    }
                                    newUser.error_msg += " - Cannot find system field match for the column named " + columnHeaders[j] + " so user " + userNotAdded + " will not be added - ";
                                }
                            }
                            if((!newUser.fname || newUser.fname.length == 0) && newUser.email){
                                newUser.error_msg += " - No first name was provided so user with email " + newUser.email + " will not be added - ";
                            } else if((!newUser.lname || newUser.lname.length == 0) && newUser.email){
                                newUser.error_msg += " - No last name was provided so user with email " + newUser.email + " will not be added - ";
                            } else if(!newUser.email || newUser.email.length == 0){
                                newUser.error_msg += " - No user email address was provided so user " + newUser.fname + " " + newUser.lname + " will not be added - ";
                            }
                            allUsers.push(newUser);
                        }
                        $scope.bulkUserUpload(allUsers);
                    } else {
                        toastr.error('Invalid data provided')
                    }
                    // file is uploaded successfully

                        $('#userImportModal').modal('hide');
                        $scope.is_uploading = false;
                        $scope.progress_upload = 0;

                });
            }
        };

        /**
         * bulkUserUpload() will attempt to save data for every user in the provided usersArray using
         * EditOrganizationUser.submit
         * @param usersArray
         */
        $scope.bulkUserUpload = function(usersArray){
            var errorMessage = "*** Done *** ";
            var outstandingAjaxCalls = 0;
            var orgId = CurrentOrganizationId.getOrganizationId();
            if(!orgId){
                orgId = $scope.classInfo.orgId;
            }
            for(var i = 0; i < usersArray.length; i++) {
                if(usersArray[i].error_msg.length > 0){
                    errorMessage += usersArray[i].error_msg
                } else {
                    ++outstandingAjaxCalls;
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
                        preferred_language: usersArray[i].preferred_language,
                        external_id: usersArray[i].external_id,
                        classes: usersArray[i].classes,
                        group:usersArray[i].group
                    }, function (user) {
                        if (user.message == ' - Successful - ') {
                            $rootScope.$broadcast('Added_User', user);
                        } else {
                            errorMessage += user.message + " ";
                        }
                        --outstandingAjaxCalls
                        if(outstandingAjaxCalls == 0){
                            toastr.error(errorMessage);
                            OrganizationUser.get({
                                organizationId: CurrentOrganizationId.getOrganizationId()
                            }, function(users) {
                                // console.log("User: " + angular.toJson(users));

                                $scope.users = users.users;

                                if (angular.isDefined($scope.users) && angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                                    $scope.organizationName = $scope.users[0].organization_name;
                                }
                            });
                        }
                    });
                }
            }
            if(outstandingAjaxCalls == 0){
                toastr.error(errorMessage);
                OrganizationUser.get({
                    organizationId: CurrentOrganizationId.getOrganizationId()
                }, function(users) {
                    // console.log("User: " + angular.toJson(users));

                    $scope.users = users.users;

                    if (angular.isDefined($scope.users) && angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                        $scope.organizationName = $scope.users[0].organization_name;
                    }
                });
            }
        };

        $scope.bulkEnrollmentUpload = function (enrollmentArray) {
            console.log(enrollmentArray);
            var errorMessage = "*** Done *** ";
            var outstandingAjaxCalls = 0;
            for (var i = 0; i < enrollmentArray.length; i++) {
                ++outstandingAjaxCalls;
                var submitData = {
                    class_id: enrollmentArray[i].class_id,
                    user_id: enrollmentArray[i].user_id,
                    is_student: enrollmentArray[i].is_student,
                    is_teacher: enrollmentArray[i].is_teacher,
                    is_edit_teacher: enrollmentArray[i].is_edit_teacher,
                    index: i
                };
                console.log(submitData)
                EditEnrollment.submit(submitData, function (enrollment) {

                });

            }
        };

        $scope.onCsvFileSelectForClasses = function($files) {
            $scope.gradeScale = ShowDatesGrades.gradeScale;
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
                    if(data.length > 0){
                        var columnHeaders = data[0],
                            allClasses = [];
                        for(var i = 1; i < data.length; i++){
                            var newCourse = {
                                name: 'New Class',
                                show_dates: true,
                                show_grades: true,
                                show_grades_as_score: true,
                                show_grades_as_letter: false,
                                show_grades_as_percentage: false,
                                chat_mode_code: 2,
                                error_msg: ""
                            };
                            for(var j = 0; j < columnHeaders.length; j++) {
                                var currentColumnHeader = columnHeaders[j].toLowerCase().trim();
                                if (currentColumnHeader == "name" || currentColumnHeader == "class name" || currentColumnHeader == "title") {
                                    newCourse.name = data[i][j];
                                } else if (currentColumnHeader == "id" || currentColumnHeader == "class id" || currentColumnHeader == "class identifier") {
                                    newCourse.id = data[i][j];
                                } else if (currentColumnHeader == "external id") {
                                    newCourse.external_id = data[i][j];
                                } else if (currentColumnHeader == "show dates") {
                                    newCourse.show_dates = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "show grades") {
                                    newCourse.show_grades = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "show grades as score") {
                                    newCourse.show_grades_as_score = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "show grades as letter") {
                                    newCourse.show_grades_as_letter = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader == "show grades as percentage") {
                                    newCourse.show_grades_as_percentage = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if(currentColumnHeader == "description" || currentColumnHeader == "class description"){
                                    newCourse.description = data[i][j]
                                } else if(currentColumnHeader == "user ids"){
                                    newCourse.userIds = data[i][j].split(";");
                                }else if(currentColumnHeader == "external user ids"){
                                    newCourse.externalUserIds = data[i][j].split(";");
                                } else {
                                    newCourse.error_msg += " - Cannot find system field match for the column named " + columnHeaders[j] + " course will not be added - ";
                                }
                            }
                            allClasses.push(newCourse);
                        }
                        $scope.bulkClassUpload(allClasses);
                    } else {
                        toastr.error('Invalid data provided')
                    }
                    // file is uploaded successfully

                    $('#classImportModal').modal('hide');
                    $scope.is_uploading = false;
                    $scope.progress_upload = 0;

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

        $scope.onCsvFileSelectForEnrollments = function($files){
            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];

                $scope.upload = $upload.upload({
                    url: '/editcourseclassuser/upload/', //upload.php script, node.js route, or servlet url
                    data: {
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        file_upload_comment: $scope.file_upload_comment,
                        check_is_private: $scope.check_is_private
                    },
                    file: file
                }).progress(function(evt) {
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);


                    $('.progress-bar').width($scope.progress_upload + '%')
                }).success(function(data, status, headers, config) {
                    console.log(data);
                    if (data.length > 0) {
                        var columnHeaders = data[0],
                            allEnrollments = [];
                        for(var i = 1; i < data.length; i++){
                            var newEnrollment = {};
                            for(var j = 0; j < columnHeaders.length; j++) {
                                var currentColumnHeader = columnHeaders[j].toLowerCase().trim();
                                if (currentColumnHeader.indexOf('class') > -1 || currentColumnHeader.indexOf('course') > -1) {
                                    newEnrollment.class_id = data[i][j];
                                } else if (currentColumnHeader.indexOf('user') > -1) {
                                    newEnrollment.user_id = data[i][j];
                                } else if (currentColumnHeader.indexOf('student') > -1) {
                                    newEnrollment.is_student = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader.indexOf('edit teacher') > -1) {
                                    newEnrollment.is_edit_teacher = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader.indexOf('teacher') > -1) {
                                    newEnrollment.is_teacher = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                } else if (currentColumnHeader.indexOf('observer') > -1) {
                                    newEnrollment.is_observer = $scope.resolveUserImportBooleanColumn(data[i][j]);
                                }
                            }
                            allEnrollments.push(newEnrollment);
                        }
                        $scope.bulkEnrollmentUpload(allEnrollments);
                    } else {
                        toastr.error('Invalid data provided')
                    }
                    // file is uploaded successfully

                    $('#enrollmentImportModal').modal('hide');
                    $scope.is_uploading = false;
                    $scope.progress_upload = 0;
                });
            }
        };

        $scope.resolveUserImportBooleanColumn = function(cellValue){
            var value = cellValue.toLowerCase();
            if(value == 'true'||value == '1'||value == 'yes'){
                return true
            }
            return false;
        };

        $scope.bulkClassUpload = function(classesArray){
            console.log(classesArray);
            var errorMessage = "*** Done *** ";
            var outstandingAjaxCalls = 0;
            for(var i = 0; i < classesArray.length; i++) {
                if(classesArray[i].error_msg.length > 0){
                    errorMessage += classesArray[i].error_msg
                } else {
                    ++outstandingAjaxCalls;

                    EditCourse.submit({
                        department_id: CurrentDepartmentId.getDepartmentId(),
                        name: classesArray[i].name,
                        description: classesArray[i].description,
                        native_language: 'en',
                        index: i
                    }, function (course) {
                        console.log(angular.toJson(course));
                        EditCourseClass.submit(ShowDatesGrades.addGradeScaleVariablesToObject({
                            id: classesArray[course.index].id,
                            name: classesArray[course.index].name,
                            external_id: classesArray[course.index].external_id,
                            show_dates: classesArray[course.index].show_dates ? '1': '0',
                            show_grades: classesArray[course.index].show_grades ? '1': '0',
                            show_grades_as_score: classesArray[course.index].show_grades_as_score ? '1': '0',
                            show_grades_as_letter: classesArray[course.index].show_grades_as_letter ? '1': '0',
                            show_grades_as_percentage: classesArray[course.index].show_grades_as_percentage ? '1': '0',
                            chat_mode_code: 2,
                            user_ids: classesArray[course.index].userIds,
                            external_user_ids: classesArray[course.index].externalUserIds,
                            course_id: course.course_id
                        }, $scope), function (courseClass) {
                            if (courseClass.message == ' - Successful - ') {
                                $rootScope.$broadcast('Added_User', courseClass);
                            } else {
                                errorMessage += courseClass.message + " ";
                            }
                            --outstandingAjaxCalls
                            if (outstandingAjaxCalls == 0) {
                                toastr.error(errorMessage);
                            }
                        });
                    });

                }
            }
            if(outstandingAjaxCalls == 0){
                toastr.error(errorMessage);
            }
        }
    }
]);