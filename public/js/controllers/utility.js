appControllers.controller('UtilityController', ['$rootScope', '$scope', '$timeout', '$sce','$modal','User','UserRoles', 'topMenuOptions','ShowDatesGrades','UserInformation','CurrentCourseId','PostV2','Nav','Announcements','BeforeLeavePage','PagePasswordExpiration','UserV2','StudentsMissingAttendance','Alerts',
    function($rootScope, $scope, $timeout,$sce,$modal, User,UserRoles, topMenuOptions, ShowDatesGrades,UserInformation,CurrentCourseId,PostV2,Nav,Announcements,BeforeLeavePage,PagePasswordExpiration,UserV2,StudentsMissingAttendance,Alerts) {

        $scope.can_edit = false;
        $scope.can_grade = false;
        $scope.currentPath = window.location.pathname;
        $scope.showDates = ShowDatesGrades.showDates;
        $scope.showGrades = ShowDatesGrades.showGrades;
        $scope.showGradesAsScore = ShowDatesGrades.showGradesAsScore;
        $scope.showGradesAsLetter = ShowDatesGrades.showGradesAsLetter;
        $scope.showGradesAsPercentage = ShowDatesGrades.showGradesAsPercentage;
        $scope.selected = {
            menu:'left'
        }

        $scope.$root.trustAsHtml = function(html){
            return $sce.trustAsHtml(html);
        }
        $scope.setMenuPreference = function(menu){
            UserV2.setMenuPreference({
                id:$scope.$root.user.id,
                menu:menu
            }).$promise.then(function(){
                    window.location.reload();
                })
        }
        $scope.setGraderMenuPreference = function(menu){
            UserV2.setGraderMenuPreference({
                id:$scope.$root.user.id,
                menu:menu
            }).$promise.then(function(){
                    window.location.reload();
                })
        }
        $scope.openAnnouncements = function(){
            delete $scope.$root.class_announcements;
            delete $scope.$root.announcements;
            $scope.$root.class_announcements = Announcements.forClass(
                {
                    orgid:0,
                    classid:'all'
                },function(result){
                    if(result.length){
                        var currentClassAnnouncements = _.findWhere(
                            $scope.$root.class_announcements,
                            {
                                id:parseInt($scope.$root.currentCourse.class_id)
                            }
                        )
                        if(currentClassAnnouncements){
                            $scope.$root.announcements = currentClassAnnouncements.announcements;
                        }

                    }
                    $modal.open({
                        templateUrl: '/public/views/partials/student/class_announcements.html?v='+window.currentJsVersion,
                        controller:'ClassAnnouncementsModalController',
                        size:'lg',
                        backdrop: 'static',
                        windowClass:'class-announcements-modal'
                    })
                }
            )
        }
        $scope.showAnnouncementsButton = function(){
            if(!Nav.navData) return false;
            return !$scope.$root.user.hasOnlyProficiencyClasses
        }
        $scope.showGradesPage = function(){
            if(!$scope.$root.user)
                return false;
            me = $scope.$root.user;

            if(me.is_only_test_admin || me.school_admin || me.hasOnlyProficiencyClasses) return false;

            if(
                (me.is_super_admin ||
                me.is_organization_admin ||
                me.is_observer ||
                me.teacher_supervisor ||
                me.is_teacher ||
                me.is_edit_teacher)
            ) return true;
            else{
                return !me.org.hide_grades_page;
            }


        }
        /*
         DSerejo 2015-02-02
         Adding topleft-menu.
         We need to wait until PreferenceController is loaded.
         PreferenceController will broadcast preference data
         */
        var fillMenuOptions = function(preference, userInformation) {
            if (!userInformation || !preference)
                return;
            if (Object.keys(preference).length > 0)
                $scope.preference = preference;
            if (Object.keys(userInformation).length == 0)
                return;
            if (typeof $scope.preference.navs === 'undefined') {
                return;
            }
            $scope.menuOptions = [
                //    href: "/",
                //    text: $scope.preference.navs.student.translation,
                //    show: !userInformation.is_student || userInformation.is_teacher || userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                //    faicon: 'fa-graduation-cap'
                //},
                {
                    href: userInformation.org.use_splash?"/home":'/',
                    text: "Home",
                    show: true,
                    faicon: 'fa-home'
                },
                {
                    href: "/performance-evaluation",
                    text: "Performance evaluation",
                    show: userInformation.org.category_dashboard && (userInformation.is_super_admin || userInformation.teacher_supervisor || userInformation.is_teacher || userInformation.is_organization_admin),
                    faicon: 'fa-line-chart'
                },
                {
                    href: "/attendance",
                    text: "Attendance",
                    show: userInformation.org.enable_attendance && (userInformation.is_super_admin || userInformation.is_organization_admin || userInformation.is_advisor || (userInformation.is_guardian && userInformation.can_enter_attendance)),
                    faicon: 'fa-clock-o'
                },
                {
                    href: "/superadmin/",
                    text: $scope.preference.navs.admin.translation,
                    show: userInformation.is_super_admin || userInformation.is_organization_admin,
                    faicon: 'fa-user'
                },
                {
                    href: "/testbank/#/",
                    text: $scope.preference.navs.test_bank_builder.translation,
                    show: userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                    faicon: userInformation.org.id==10?'fa-question-circle':'fa-tasks'
                }, {
                    href: "/editor/",
                    text: $scope.preference.navs.course_builder.translation,
                    show: $scope.userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                    faicon: 'fa-edit'
                },
                {
                    href: "/Folder/",
                    text: 'Files & Folders',
                    modal: '1',
                    show: userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                    faicon: 'fa-folder-open',
                    type:'folder'

                },
                {
                    href: "/grader/",
                    text: $scope.preference.navs.grader.translation,
                    show: (userInformation.is_super_admin || userInformation.teacher_supervisor || userInformation.is_non_proficiency_teacher  || userInformation.is_organization_admin),
                    faicon: 'fa-check',
                    type:'grader'
                },
                {
                    href: "/grader/",
                    text: $scope.preference.navs.grader.translation,
                    show: userInformation.is_super_admin || userInformation.is_proficiency_teacher || userInformation.is_organization_admin && userInformation.org.id != 10,
                    faicon: 'fa-check-square-o',
                    type:'nomenu_grader',
                    counter:userInformation.noMenuGraderCount
                }
            ];

            //golabs 02/02/2015
            //Seeting our topMenuOptions
            topMenuOptions.set($scope.menuOptions);
        };

        $scope.$on('preference', function(event, preference) {
            fillMenuOptions(preference, $scope.userInformation);
        });

        /*
         Golabs 02/02/2015
         We need to capture our menuOptions
         We do this by setting it in a serice called topMenuOptions.set(menuOptions)
         if we have our menuOptions the scope was being set to [] with out and causing
         the menu in admin to fail.
         */
        $scope.menuOptions = topMenuOptions.get();

        function getNeedingGrade(){
            PostV2.countNeedingGrade({},function(res){
                $scope.grader={
                    counter:res.count
                };
            })
        }
        var missingAttendanceReady = false;
        $scope.$watch('user',function(user){
            if(!user)
                return;
            PagePasswordExpiration.init(user);
            PagePasswordExpiration.openModal();
            $scope.selected.menu = user.menuPreference;
            $scope.selected.gradermenu = user.graderMenuPreference;


            if(user.is_super_admin || user.is_teacher || user.is_observer || user.is_organization_admin || user.teacher_supervisor){
                getNeedingGrade();
            }
            $scope.$root.amIAdmin = function(){
                return user.is_super_admin || user.is_organization_admin
            }
            $scope.$root.user=user;
            UserRoles.setUser(user);
            $scope.userInformation = user;
            UserInformation.data=user;
            if (!$scope.preference.navs || !$scope.menuOptions.length) {
                fillMenuOptions($scope.preference, user);
            }
            UserV2.getUser().then(function(user){
                if(missingAttendanceReady) return;
                if(UserRoles.checkPermission('admin')){
                    StudentsMissingAttendance.load({
                        orgId:10
                    });
                }
                if(UserRoles.checkPermission('advisor')){
                    StudentsMissingAttendance.load({
                        students:_.map(user.advisees,function(a){return a.id}).join(',')
                    },true);
                }
                if(UserRoles.checkPermission('teacher')){
                    UserV2.getStudents({id:'me'},function(students){
                        StudentsMissingAttendance.load({
                            students:_.map(students,function(a){return a.id}).join(',')
                        },true);
                    })

                }
                missingAttendanceReady = true;
            })
            if(user.showMissingAttendanceWarning!==false){
                showMissingAttendanceWarning(user.showMissingAttendanceWarning)
            }


        })
        function showMissingAttendanceWarning(days){
            Alerts.danger({
                title:'Missing Attendance',
                content:"Your attendance reporting is now "+days+" day(s) late. Please submit your attendance immediately.",
                textOk:'Ok'
            },function(){});
        }
        $scope.$root.isMissingAttendance = StudentsMissingAttendance.isStudentMissingAttendance

        UserV2.getUser()
        $scope.$root.beforeLeavePage = BeforeLeavePage;
    }

]);