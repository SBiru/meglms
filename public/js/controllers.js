'use strict';
var _global_chat_users = [];

var ON_MOBILE = (function (a, b) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
        return true;
})(navigator.userAgent || navigator.vendor || window.opera);
if (typeof ON_MOBILE === 'undefined')
    ON_MOBILE = false
//Golabs fixed modules
var modulesArray = ['ui.bootstrap', 'ui.keypress', 'ang-drag-drop'];

//Golabs add modules based pathname
if (window.location.pathname.match(/\Wgrader\W/i)) {
    modulesArray.push('ngFileUpload');
}

var appControllers = angular.module('app.controllers', modulesArray);
/*
 DSerejo 2015-01-31
 Enabling the use of $location.search()
 Golabs 01/02/2015 Server.js not set for html5mode
 Probably a good idea to remove the # for now leave in.
 */
appControllers.config(function ($locationProvider) {
    $locationProvider.html5Mode(false);
});

// Nav controller has been moved to ./controllers/nav.js

// Grader nav controller has been moved to ./controllers/grader/gradernav.js
/**
 * format("some {thing}", {thing: 'dog'})
 *    -> 'some dog'
 */
function format(str, dct) {
    return str.replace(/{([^}]+)}/g, function (full, name) {
        return dct[name]
    })
}

// factory for making simple controllers that integrate with nimble knowledge
function makeNimbleController(name, model, app, hasExtra) {

    appControllers.controller(name, ['$rootScope', '$scope', model, 'User', '$sce', 'Currentpageid', 'Page', 'NimbleknowledgeLesson',
        function ($rootScope, $scope, ModelLoader, User, $sce, Currentpageid, Page, NimbleknowledgeLesson) {

            $scope.loading = true
            $scope.contentid = $rootScope.$stateParams.contentId
            $scope.checkPassword = checkPassword;

            User.get({
                userId: 'me'
            }, function (user) {
                ModelLoader.get({
                    pageId: $rootScope.$stateParams.contentId
                }, function (data) {
                    Currentpageid.RecordingPageAccess($rootScope.$stateParams.contentId);
                    $scope.loading = false;
                    $rootScope.pagename = '';
                    if (typeof $rootScope.currentPage != 'undefined') {
                        // If the ENG checkbox is checked, make the title be in English, otherwise, translate the title
                        if (document.getElementById('english-language-selector').checked) {
                            $rootScope.pagename = $rootScope.currentPage.label;
                        } else {
                            $rootScope.pagename = $rootScope.currentPage.subtitle;
                        }
                    }
                    // $rootScope.pagename = '';
                    data.email = encodeURIComponent(user.email).replace(/\.com$/, '');
                    data.fname = encodeURIComponent(user.fname);
                    data.app = app;
                    $scope.need_password = data.need_password;
                    var template = 'http://dev.nimbleknowledge.com/english3/Login/{email}/{fname}/{nativeLang}/{targetLang}/{app}' +
                        (hasExtra ? '/{course}/{lesson}/{numEx}' : '');
                    $scope.src = $sce.trustAsResourceUrl(format(template, data))
                    NimbleknowledgeLesson.post({
                        email: data.email,
                        page_id: $rootScope.$stateParams.contentId
                    }, function (postResponse) {
                        console.log(postResponse)
                    });

                })
            })

            function checkPassword() {
                if ($scope.need_password) {
                    Page.get({
                        id: $scope.contentid,
                        password: $scope.user_password
                    }, function (res) {
                        if (!res.error) {
                            $scope.need_password = false;
                        }
                    })
                }
            }

        }

    ])
}

makeNimbleController('ListeningPracticeController', 'ListeningPractice', 'listening', false);
makeNimbleController('ReadingPracticeController', 'ReadingPractice', 'reading', false);
makeNimbleController('LessonListeningController', 'LessonListening', 'lessonListening', true);

// Course Class Controller
appControllers.controller('CourseClassController', ['$rootScope', '$scope', '$timeout', 'CurrentCourseId', 'CourseClass',
    function ($rootScope, $scope, $timeout, CurrentCourseId, CourseClass) {
        $rootScope.pagename = '';
        if (typeof $rootScope.currentPage.label != 'undefined') {
            if ($rootScope.isEnglishCurrentlySelected) {
                $scope.courseName = $rootScope.currentPage.label;
            } else {
                $scope.courseName = $rootScope.currentPage.subtitle;
            }
        }
        $scope.classes = new Array();

        CourseClass.get({
            courseId: CurrentCourseId.getCourseId()
        }, function (classes) {

            $scope.classes = classes.classes;

            if (angular.isDefined($scope.classes) && angular.isDefined($scope.classes.length) && $scope.classes.length > 0) {
                $scope.courseName = $scope.classes[0].course_name;
            }
        });
    }
]);

// View Course Class Users Controller
appControllers.controller('ViewCourseClassUsersController', ['$rootScope', '$scope', '$timeout', 'OrganizationUser',
    function ($rootScope, $scope, $timeout, OrganizationUser) {
        $scope.className = '';
        $scope.classId = 0;
        $scope.users = new Array();

        OrganizationUser.getclassusers({
            class_id: $rootScope.$stateParams.classId
        }, function (users) {

            $scope.users = users.users;

            if (angular.isDefined($scope.users) && angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                $scope.className = $scope.users[0].class_name;
                $scope.classId = $scope.users[0].class_id;
            }
        });
    }
]);

// Organization User Controller
//moved to controllers/admin/admin.js

// Add Course Class User Controller
appControllers.controller('AddCourseClassUserController', ['$rootScope', '$scope', '$timeout', 'EditCourseClassUser',
    function ($rootScope, $scope, $timeout, EditCourseClassUser) {
        $scope.className = "";
        $scope.userToEnroll = {};
        $scope.users = new Array();
        $scope.types = new Array({
                name: 'student'
            }, {
                name: 'teacher'
            }

        );
        $scope.is_content_editor = false;

        EditCourseClassUser.getavailableusers({
            class_id: $rootScope.$stateParams.classId
        }, function (users) {

            if (angular.isDefined(users.users)) {
                $scope.users = users.users;
            }

            if (angular.isDefined($scope.users.length) && $scope.users.length > 0) {
                $scope.className = $scope.users[0].name;
            }
        });

        $scope.addUser = function () {
            if (angular.isDefined($scope.userToEnroll) && angular.isDefined($scope.userToEnroll.id) && $scope.userToEnroll.id > 0 && angular.isDefined($scope.userType) && angular.isDefined($scope.userType.name)) {

                EditCourseClassUser.submit({
                    class_id: $rootScope.$stateParams.classId,
                    user_id: $scope.userToEnroll.id,
                    type: $scope.userType.name,
                    is_content_editor: $scope.is_content_editor
                }, function (courseclassuser) {

                    if (courseclassuser.message == 'successful') {
                        toastr.success('Enrolled User');
                    } else {
                        toastr.error(courseclassuser.message);
                    }
                });
            } else {
                toastr.error('Please Provide Both User And Type.');
            }
        }
    }
]);


appControllers.controller('SigninPageController', ['$rootScope', '$scope', '$location','$timeout', 'EditOrganizationUser', 'Signin', 'Licenses',
    'Alerts',
    function ($rootScope, $scope, $location,$timeout, EditOrganizationUser, Signin, Licenses,Alerts) {
        var defaultTemplate;
        $scope.commercial_site_url = window.COMMERCIAL_SITE_URL;
        if(typeof window.SIGNIN_TEMPLATE !== 'undefined'){
            defaultTemplate = window.SIGNIN_TEMPLATE;
        }else{
            defaultTemplate = useCustomBackground()?'/public/views/partials/singin-default-e3.html':'/public/views/partials/singin-default.html';
        }
        if(typeof window.DOMAIN_CONF !== 'undefined')
            $scope.domainConf = DOMAIN_CONF;

        var parseUrlParameters = function () {
            var match,
            // Regex for replacing addition symbol with a space
                pl = /\+/g,
                decode = function (s) {
                    return decodeURIComponent(s.replace(pl, " "));
                },
            /*
             Parsing parameters:
             -first captured group(key) -> one or more of anything but '&' or '='
             -followed by = (optional)
             -second captured group(value)-> zero or more of anything but '&'
             */
                search = /([^&=]+)=?([^&]*)/g,

            //starting after the '?' char on url
                query = window.location.search.substring(1);

            var urlParams = {};
            while (match = search.exec(query))
                urlParams[decode(match[1])] = decode(match[2]);
            return urlParams;
        };

        Signin.query({}, function (data) {
            if (data.licenseExpired) {
                $scope.userid = data.userid;
                $scope.signInTemplate = '/public/views/partials/singin-license-expired.html';
            } else if (data.tempPassword == 0) {
                $scope.signInTemplate = defaultTemplate;
            } else {
                $scope.pwd_expired=data.pws_expired
                $scope.signInTemplate = '/public/views/partials/singin-changepassword.html';
            }
        });
        $scope.user = {};
        var params = parseUrlParameters();
        if (params.error !== undefined) {
            $scope.msgError = params.error.replace(/_/g, " ");
        }
        $scope.validate = function () {
            Licenses.validate({
                license: $scope.user.license,
                user_id: $scope.userid
            }, function (res) {
                if (res.error) {
                    $scope.msgError = res.error;
                    return;
                }
                Signin.validate({}, function () {
                    window.location.reload();
                })
            });
        }
        $scope.changeTempPassword = function () {
            Signin.update({
                password: $scope.user.password
            }, function (data) {
                switch (data.error) {
                    case 0:
                        toastr.success('You have successfully changed your password');
                        window.location.reload();
                        break;
                    case 1:
                        toastr.error('You are not logged in');
                        $scope.signInTemplate = defaultTemplate;
                        break;
                    case 2:
                        toastr.success('Temporary password already changed');
                        break;
                    case 3:
                        toastr.error('Your password is invalid');
                        break;
                    case 4:
                        toastr.error('An unexpected error has ocurred');
                        break;
                    default:
                    {}
                }
            });
        };
        $scope.resetPassword = function () {

            var options = {
                title: 'Reset password',
                contentHtml:'<p>Enter your email and we will send you a new password.</p><div><label for="username">Email</label>\n' +
                '    <input type="email" id="username" name="username"  ng-model="options.user.email" class="form-control"  autofocus></div>',
                textOk: 'Send Password',
                textCancel:'Cancel',
                user:{email:''}
            }
            Alerts.warning(options,function(){
                EditOrganizationUser.resetpassword({
                    email: $('.modal input').val()
                }, function (user) {
                    if (user.message == 'successful') {
                        toastr.success('Your password was reset');
                    }
                    else{
                        toastr.error(user.message)
                    }
                });
            },function(){

            });

        };
        $scope.showRegisterWithLicenseButton = function(){
            var showButton = true
            var domainsToHideButtonFrom = ['myedkey.org','dev.meglms.com']
            angular.forEach(domainsToHideButtonFrom,function(domain){
                if($location.host() == domain){
                    showButton = false;
                }
            })
            return showButton;
        };
        function useCustomBackground(){
            var domainsToUseBackground = ['localhost','192.168.0.103','dev.english3.com','elearn.english3.com','yingwen3.cn']
            var useBackground = false
            angular.forEach(domainsToUseBackground,function(domain){
                if($location.host().indexOf(domain)>=0){
                    useBackground = true;
                }
            })
            return useBackground;
        };
        $scope.useCustomBackground = useCustomBackground
        $scope.customBackground = function(){
            return $scope.useCustomBackground()?"url('/public/img/e3_login_3.jpg')":'';
        }
    }

]);
// Add Organization User Controller
//moved to /controllers/admin/admin.js

// Organization Controller

// Department Controller
appControllers.controller('DepartmentController', ['$rootScope', '$scope', '$timeout', 'Department', 'CurrentOrganizationId', 'CurrentDepartmentId', 'Cookiecutter',
    function ($rootScope, $scope, $timeout, Department, CurrentOrganizationId, CurrentDepartmentId, Cookiecutter) {
        $scope.currentname = '';
        $scope.$on('NavOrganizationUpdate', function (event, data) {

            Department.getOrgDepartments({
                orgId: CurrentOrganizationId.getOrganizationId()
            }, function (departments) {

                $scope.departments = departments;

                if ($scope.departments.length > 0) {
                    CurrentDepartmentId.setDepartmentId(Cookiecutter.returndepartmentid($scope.departments));
                    $scope.currentid = CurrentDepartmentId.getDepartmentId();
                    $scope.currentname = _.findWhere(departments, {
                        id: $scope.currentid
                    }).name

                    $rootScope.$broadcast('NavDepartmentUpdate');
                } else {
                    CurrentDepartmentId.setDepartmentId(0);
                    $scope.currentname = '';

                    $rootScope.$broadcast('NavDepartmentUpdate');
                }
            });
        });

        $scope.changeDepartment = function (departmentId) {

            for (var i = 0; i < $scope.departments.length; i++) {
                if ($scope.departments[i].id == departmentId) {
                    CurrentDepartmentId.setDepartmentId($scope.departments[i].id);
                    $scope.currentid = CurrentDepartmentId.getDepartmentId();
                    $scope.currentname = $scope.departments[i].name;

                    $rootScope.$broadcast('NavDepartmentUpdate');
                }
            }
        }
    }
]);

//CourseAdmin Controller
appControllers.controller('CourseAdminController', ['$rootScope', '$scope', '$timeout', 'CourseAdmin', 'CurrentDepartmentId', 'CurrentCourseId', 'Cookiecutter',
    function ($rootScope, $scope, $timeout, CourseAdmin, CurrentDepartmentId, CurrentCourseId, Cookiecutter) {
        $scope.currentname = '';

        $scope.$on('NavDepartmentUpdate', function (event, data) {
            $scope.departmentId = CurrentDepartmentId.getDepartmentId();
            CourseAdmin.get({
                departmentId: CurrentDepartmentId.getDepartmentId()
            }, function (courses) {

                $scope.courses = courses.courses;

                if (angular.isDefined($scope.courses) && angular.isDefined($scope.courses.length) && $scope.courses.length > 0) {
                    CurrentCourseId.setCourseId(Cookiecutter.returncourseid($scope.courses));

                    //returncourename(CurrentCourseId.getCourseId(), $scope.courses);
                    $scope.currentname = Cookiecutter.returncourename(CurrentCourseId.getCourseId(), $scope.courses);
                    $scope.currentid = CurrentCourseId.getCourseId();

                    $rootScope.$broadcast('NavUpdate');
                } else {
                    CurrentCourseId.setCourseId(0);
                    $scope.currentname = '';

                    $rootScope.$broadcast('NavUpdate');

                }
            });
        });

        $scope.changeCourse = function (courseId) {
            if (courseId == CurrentCourseId.getCourseId())
                return

            for (var i = 0; i < $scope.courses.length; i++) {
                if ($scope.courses[i].id == courseId) {
                    CurrentCourseId.setCourseId($scope.courses[i].id);
                    $scope.currentname = $scope.courses[i].name;

                    $rootScope.$emit('NavForceReload');
                }
            }
            $scope.currentid = CurrentCourseId.getCourseId();
        }
    }
]);





// UtilityController moved to ./controllers/utility.js NOTE: It was broken code

appControllers.controller('NotificationModalController', ['$scope', '$modalInstance', 'notification', function ($scope, $modalInstance, notification) {

}]);

appControllers.controller('NotificationController', ['$rootScope', '$scope', '$sce', '$timeout', 'Notification',
    '$filter', '$modal', 'CurrentCourseId', 'ShowDatesGrades',
    function ($rootScope, $scope, $sce, $timeout, Notification, $filter, $modal, CurrentCourseId, ShowDatesGrades) {
        $scope.notifications = new Array();
        $scope.CurrentCourseId = CurrentCourseId;
        $scope.ShowDatesGrades = ShowDatesGrades;

        Notification.get({
            notificationId: 'me'
        }, function (notifications) {
            $scope.notificationCallback(notifications);
            $scope.refreshTimer(30000);
        });

        $scope.refresh = function () {
            Notification.get({
                notificationId: 'me'
            }, function (notifications) {
                $scope.notificationCallback(notifications);
            });
        }

        $scope.refreshTimer = function (delay) {
            $timeout(function () {
                Notification.get({
                    notificationId: 'me'
                }, function (notifications) {
                    $scope.notificationCallback(notifications);
                    $scope.refreshTimer(delay);
                });
            }, delay);
        }

        $scope.open = function (notification) {
            var modalInstance = $modal.open({
                templateUrl: 'public/views/partials/notificationgradepost.html?cachesmash=5',
                windowClass: 'feedback-modal',
                controller: 'NotificationGradePostMessagesController',
                resolve: {
                    notification: function () {
                        return notification;
                    }
                }
            });
        };

        $scope.notificationCallback = function (notifications) {
            if (angular.isDefined(notifications.notifications)) {
                $scope.notifications = notifications.notifications;
                /*
                 Golabs 16/01/2015:
                 We get our ShowDatesGrades by the $scope.ShowDatesGrades found in services 'ShowDatesGrades' function
                 This is achieved when a call is made to the function SetDatesGrades found in the CourseController
                 ShowDatesGrades is set to scope in the NotificationController conroller which run this function.
                 */
                for (var i = 0; i < $scope.notifications.length; i++) {
                    var secondLineOfNotification = "";
                    if (angular.isDefined($rootScope.preference.navs.click_for_feedback)) {
                        if ($scope.notifications[i].teacher_notes != null && $scope.notifications[i].teacher_notes.length > 0) {
                            secondLineOfNotification = '<br/><i>' + $rootScope.preference.navs.click_for_feedback.translation;
                        }
                        if ($scope.ShowDatesGrades.getDates() === 0 && $scope.ShowDatesGrades.getGrades() === 0) {
                            $scope.notifications[i].htmlSafe = $sce.trustAsHtml('<a data-ng-click="open(notification)">' +
                                $rootScope.preference.navs.task.translation +
                                ': ' + $scope.notifications[i].page_name + secondLineOfNotification + '</i></a>');
                        }
                    } else {
                        $scope.notifications[i].htmlSafe = $sce.trustAsHtml('<a data-ng-click="open(notification)">' +
                            $rootScope.preference.navs.task.translation +
                            ': ' + $scope.notifications[i].page_name + ' ' + $rootScope.preference.navs.score.translation + ": " + $scope.notifications[i].grade + secondLineOfNotification + '</i></a>');
                    }
                }
                var count = $filter('filter')(notifications.notifications, {
                    viewed: '0'
                }).length;
                if (count > 0) {
                    $scope.uncheckedNotifications = '(' + count + ')';
                } else {
                    $scope.uncheckedNotifications = '';
                }
            }
        }
    }
]);

appControllers.controller('NotificationMessagesController', ['$rootScope', '$scope', '$timeout', 'Notification',
    function ($rootScope, $scope, $timeout, Notification) {
        console.log("Notification Messages");
    }
]);

appControllers.controller('NotificationGradePostMessagesController', ['$rootScope', '$scope', '$timeout', '$sce', 'Post', 'Notification', 'ShowDatesGrades', 'notification', '$modalInstance',
    function ($rootScope, $scope, $timeout, $sce, Post, Notification, ShowDatesGrades, notification, $modalInstance) {
        $scope.ok = function () {
            $modalInstance.close();
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        $scope.trustAsHtml = function (html) {
            return $sce.trustAsHtml(html);
        }
        $scope.reply = function (to) {
            if (!angular.isDefined(to)) {
                to = 0;
            }

            $scope.reply_to_id = to;
            $rootScope.mailModal.dismiss();
            $rootScope.feedbackModal.dismiss();
            $scope.alternateReplies = 1;
            $rootScope.$broadcast('replyToId', {'reply_to_id':$scope.reply_to_id,'alternateReplies':$scope.alternateReplies});
        }

        $scope.show_dates = ShowDatesGrades.getDates() == 1;
        $scope.show_grades = ShowDatesGrades.getGrades() == 1;
        $scope.show_grades_as_score = ShowDatesGrades.getShowGradesAsScore() == 1;
        $scope.show_grades_as_letter = ShowDatesGrades.getShowGradesAsLetter() == 1;
        $scope.show_grades_as_percentage = ShowDatesGrades.getShowGradesAsPercentage() == 1;

        function getTeacherNotification(notification){
            $scope.grade_post = {}
            $scope.teacher_posts=[notification];
            $scope.grade_post.student_message = $sce.trustAsHtml(notification.teacherMessage);

        }

        function getStudentNotification(notification){
            Notification.getNotificationGradePost({
                notificationId: notification.id
            }, function (res) {

                if (!res.grade_post) { // failed to retrieve for some reason
                    return
                }

                $scope.grade_post = res.grade_post;
                if (angular.isDefined(res.grade_post.student_message))
                    $scope.grade_post.student_message = $sce.trustAsHtml($scope.grade_post.student_message);
                $scope.teacher_posts = res.teacher_posts;
                $scope.hide_reply = res.hide_reply
            });
        }


        if(notification.isTeacher){
            $scope.isTeacher = true;
            getTeacherNotification(notification)
        }

        else
            getStudentNotification(notification)

    }
]);



appControllers.controller('PostedMessagesController', ['$rootScope', '$scope', '$timeout', '$sce', 'Post', 'CurrentCourseId', '$http','PostsLimitingService','PostViews','$modal',
    function ($rootScope, $scope, $timeout, $sce, Post, CurrentCourseId, $http,PostsLimitingService,PostViews,$modal) {

        $scope.current_video_player = '';

        //Preparing themplates for view.
        $scope.checkprepareHtml = function (messages,allowTemplate) {
            
            if(!messages)
                messages =[];
            messages = $.grep(messages, function (e) {

                e.isTemplate = allowTemplate;
                e.htmlSafeprompt = $sce.trustAsHtml(e.message)
                return true;
            });
            return messages
        }

        if(CurrentCourseId.getCourseId()){
            $scope.posted = Post.query({
                    postId: $scope.contentid,
                    courseId: CurrentCourseId.getCourseId()
                },
                function (messages) {
                    //console.log(messages);
                    $scope.canViewMessageButton = messages.canViewMessageButton;
                    $scope.showUserProfile = messages.showUserProfile;
                    $scope.numberofposts = messages.number_of_posts;
                    PostsLimitingService.setnumberOfPostSubmitted($scope.numberofposts);
                    if (typeof messages.postmessages !== 'undefined') {
                        $scope.postedMessages = $scope.checkprepareHtml(messages.postmessages,messages.allowTemplate);;

                        if($scope.$root)
                            $scope.$root.postedMessages=$scope.postedMessages;

                    } else {
                        $scope.postedMessages = {}
                    }
                    if (typeof messages.archive !== 'undefined') {
                        $scope.$root.archiveMessages = $scope.checkprepareHtml(messages.archive,messages.allowTemplate);

                    }
                });
        }else{
            $scope.currentCourseId = CurrentCourseId;
            $scope.$watch('currentCourseId.course_id',function(){
                $scope.$broadcast('reloadPostedMessages');
            })
        }



        $scope.$on('reloadPostedMessages', function (event, data) {
            $scope.posted = Post.query({
                postId: $scope.contentid,
                courseId: CurrentCourseId.getCourseId()
            }, function (messages) {
                $scope.postedMessages = $scope.checkprepareHtml(messages.postmessages,messages.allowTemplate);
                $scope.$root.postedMessages=$scope.postedMessages;
                if (typeof messages.archive !== 'undefined') {
                    $scope.$root.archiveMessages = $scope.checkprepareHtml(messages.archive,messages.allowTemplate);
                }
            });
        });

        $scope.replyTo = function (reply_to_id) {
            if (!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }

            $scope.reply_to_id = reply_to_id;
            $scope.$emit('replyToId', $scope.reply_to_id);
        }


        $scope.deletePost = function (delete_id) {
            if (!angular.isDefined(delete_id)) {
                return;
            }

            if (confirm("Are You Sure You Want To Delete Post") == true) {
                $scope.delete_id = delete_id;

                $scope.$emit('deleteId', $scope.delete_id);
                window.location.reload();
            }
        }
        $scope.openProfile = function(user_id){
            if(!$scope.showUserProfile) return;
            $modal.open({
                templateUrl: '/public/views/account/account-modal.html',
                windowClass: 'account-modal',
                controller: 'AccountController',
                resolve: {
                    userId: function () {
                        return user_id
                    },
                    role:function(){
                        return $scope.courseInfo.data.is_student==1?'student':'teacher'
                    }
                }
            });

        };
        $scope.openVideoPlayer = function (message, modal_id) {
            var video_message_id = message.id
            PostViews.save({id: video_message_id }).$promise.then(function(res){
                if(res.affected)
                    message.views++;
            });
            for (var i = 0; $scope.postedMessages.length; i++) {
                if ($scope.postedMessages[i].id == video_message_id) {
                    $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');

                    break;
                } else if ($scope.postedMessages[i].children.length > 0) {
                    var found_in_child = false;
                    for (var j = 0; j < $scope.postedMessages[i].children.length; j++) {
                        if ($scope.postedMessages[i].children[j].id == video_message_id) {
                            $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].children[j].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');

                            found_in_child = true;
                        }
                    }

                    if (found_in_child) {
                        break;
                    }
                }
            }

            $('#' + modal_id).modal('show');
            $('#' + modal_id).on('hide.bs.modal', function () {
                document.getElementById('defaultVideoPlayer').pause();
            })
        }

        $scope.indentClass = function (indent_count) {
            if($(window).width()<=767){
                return "indent-1";
            }
            return "indent-" + indent_count;
        }
    }
]);

/******************************************************************************
 * Vocabulary Controller
 *****************************************************************************/

appControllers.controller('VocabController', ['$rootScope', '$scope', '$document', '$interval', '$timeout', 'Vocab', 'SeeIT', 'FlashIT', 'Currentpageid', 'Page',

    function ($rootScope, $scope, $document, $interval, $timeout, Vocab, SeeIT, FlashIT, Currentpageid, Page) {
        $scope.currentItem = 0;
        $scope.vocabAudios = new Array();
        $scope.checkPassword = checkPassword;
        $scope.vocabItems;
        $scope.totalItems;

        $rootScope.pagename = '';
        if (typeof $rootScope.currentPage != 'undefined') {
            // If the ENG checkbox is checked, make the title be in English, otherwise, translate the title
            if (document.getElementById('english-language-selector').checked) {
                $rootScope.pagename = $rootScope.currentPage.label;
            } else {
                $rootScope.pagename = $rootScope.currentPage.subtitle;
            }
        }

        $document.bind('keydown', function (e) {
            if (e.keyCode == 38 || e.keyCode == 40) {
                $scope.$apply(function () {
                    $scope.flip()
                });
            } else if (e.keyCode == 37) {
                $scope.$apply(function () {
                    $scope.prevItem()
                });
            } else if (e.keyCode == 39) {
                $scope.$apply(function () {
                    $scope.nextItem()
                });
            }
        });

        $scope.vocabArray = Vocab.get({
            vocabId: $rootScope.$stateParams.vocabId
        }, function (vocab) {

            Currentpageid.RecordingPageAccess($rootScope.$stateParams.vocabId);

            $scope.vocabAudios = new Array();
            $scope.vocabItems = vocab.content;
            $scope.totalItems = vocab.content.length;
            $scope.need_password = vocab.need_password;

            for (var i = 0; i < vocab.content.length; i++) {
                var urls = [vocab.content[i].urls[1],vocab.content[i].urls[0]];
                $scope.vocabAudios[i] = {
                    id: vocab.content[i].id,
                    howler: new Howl({
                        src: urls
                    })
                };
            }
        });

        function checkPassword() {
                if ($scope.need_password) {
                    Page.get({
                        id: $rootScope.$stateParams.vocabId,
                        password: $scope.user_password
                    }, function (res) {
                        if (!res.error) {
                            $scope.need_password = false;
                        }
                    })
                }
            }
            /* Star Filter */

        $scope.starred = [];

        $scope.setStarred = function () {
            var id = this.vocab.id;
            if (_.contains($scope.starred, id)) {
                // Remove Star
                $scope.starred = _.without($scope.starred, id);
                if ($rootScope.enableFilter) {
                    if ($scope.currentItem > $scope.starred.length - 1 && $scope.starred.length > 0) {
                        $scope.currentItem = $scope.starred.length - 1;
                    }
                }
            } else {
                // Add Star
                $scope.starred.push(id);
            }
            return false;
        };

        $scope.isStarred = function (id) {
            if (_.contains($scope.starred, id)) {
                return 'active';
            }
            return false;
        };
        $scope.textWrapClass = function (text) {
            if (text.length > 430) {
                return 'card-text-font-24';
            }
            if (text.length > 255)
                return 'card-text card-text-font-24';
            if (text.length > 190)
                return '';
            return 'card-text';
        }

        $scope.enableStarFilter = function () {
            if ($scope.starred.length > 0) {
                $rootScope.enableFilter = true;
                $scope.currentItem = 0;
            }
        }

        $scope.disableStarFilter = function () {
            $rootScope.enableFilter = false;
        }

        $scope.starFilter = function (vocab) {
            if ($scope.starred.length > 0 && !_.contains($scope.starred, vocab.id) && $rootScope.enableFilter) {
                return false;
            } else {
                return true;
            }
        }

        /* Vocabulary Flashcards */

        $scope.prevItem = function () {
            $scope.alreadyRecorded = false;
            $scope.currentItem = $scope.currentItem - 1;
        }

        $scope.nextItem = function () {
            $scope.alreadyRecorded = false;
            $scope.currentItem = $scope.currentItem + 1;
        }

        $scope.flip = function () {
            $('.flip .card').toggleClass('flipped');
            $('.flip .card .back').toggleClass('flipped');

            for (var i = 0; i < $scope.vocabAudios.length; i++) {
                if ($scope.vocabAudios[i].id == this.vocab.id) {
                    $scope.vocabAudios[i].howler.play();
                }
            }
        }

        /* Audio Playback */
        // FIXME: deferred execution
        /*
         for (var i = 0; i < $scope.vocabAudios.length; i++) {
         if ($scope.vocabAudios[i].id == this.vocab.id) {
         // $scope.vocabAudios[i].howler.play();
         }
         }
         */
        $scope.playAudio = function (localVocabID) {
            localVocabID = typeof localVocabID !== 'undefined' ? localVocabID : false;

            if (localVocabID == false) {
                var vocabToFind = $scope.currentVocabObject.id;
            } else {
                var vocabToFind = localVocabID;
            }

            for (var i = 0; i < $scope.vocabAudios.length; i++) {

                if ($scope.vocabAudios[i].id == vocabToFind) {
                    $scope.vocabAudios[i].howler.play();
                    break;
                }
            }
        }

        /* Audio Recording */
        $scope.currentVocabObject;
        $scope.setVocabObject = function (vocab) {

            $scope.currentVocabObject = vocab;
        };
        /*Recorder.initialize({
         swfSrc: "/public/lib/recorder.swf"
         }); */

        $scope.recording = false;

        $scope.isRecording = function () {
            if ($scope.recording) {
                return 'active';
            }
            return false;
        };

        $scope.isRecorded = function () {
            if ($scope.alreadyRecorded) {
                return '#428bca';
            }
            return 'gray';
        };

        $scope.playFullAudio = function () {
            if ($scope.alreadyRecorded) {
                Recorder.play({
                    finished: function () {

                        $scope.playAudio();
                    }
                });

            } else {
                $scope.playAudio();
            }
            //

        }

        $scope.playRecordedAudio = function () {

            if ($scope.recording) {
                $scope.recordAudio(true);
            } else {
                Recorder.play({

                });
            }
        }
        $scope.recordingObjectInitialized = false;
        $scope.recordObjectReady = false;
        $scope.recordingLength = 0;
        $scope.alreadyRecorded = false;
        $scope.setFinishedRecording = false;
        $scope.recordAudio = function (playAfter) {
            playAfter = typeof playAfter !== 'undefined' ? playAfter : false;

            if (!$scope.recordingObjectInitialized) {
                Recorder.initialize({
                    swfSrc: "/public/lib/recorder.swf",
                    onFlashInitialized: function () {
                        $scope.recordObjectReady = true;
                    }
                });
                $scope.recordingObjectInitialized = true;
                $scope.recordObjectTimer = $interval(function () {

                    if (!$scope.recordObjectReady) {
                        $interval.cancel($scope.recordObjectTimer);
                        $scope.recordAudio(playAfter);
                    }
                }, 500);
                return;
            }

            $scope.recording = !$scope.recording;

            if ($scope.recording) {
                $scope.alreadyRecorded = true;
                Recorder.record({
                    finished: function () {

                        console.log("Recording Finished");
                    }
                });
            } else {
                $scope.stopRecordingAudio(playAfter);
            }
        }

        $scope.stopRecordingAudio = function (playAfter) {
            playAfter = typeof playAfter !== 'undefined' ? playAfter : false;
            $scope.recordTimeout = $interval(function () {

                $interval.cancel($scope.recordTimeout);
                Recorder.stop();
                $scope.setFinishedRecording = true;
                if (playAfter) {
                    $scope.playRecordedAudio();
                    //$scope.playAudio();
                }
            }, 200);

        }

        /* Begin See it and write it */
        var beginSeeIt;
        var seeAttempts = {};

        /* Keep track of correct and skipped answers */
        $scope.seeAnswered = [];
        $scope.seeSkipped = [];

        $scope.vocabArray.$promise.then(function (result) {
            /* Reset the activity */
            beginSeeIt = function (updateCircleText) {
                    /* Seeit activity */
                    $scope.remainingQuestions = $scope.totalItems;
                    $scope.vocabContentRandom = (function () {

                        var newArray = []
                        for (var key in $scope.vocabItems) {

                            newArray.push($scope.vocabItems[key]);
                        }
                        for (var i = newArray.length - 1; i >= 0; i--) {

                            var randomIndex = Math.floor(Math.random() * (i + 1));
                            var itemAtIndex = newArray[randomIndex];
                            newArray[randomIndex] = newArray[i];
                            newArray[i] = itemAtIndex;
                            seeAttempts[i] = 0; //use this loop set all the counts to zero
                        }
                        return newArray;
                    })();
                    $scope.seeAnswerLocation = 0;
                    $scope.seeCurrentQuestion = $scope.vocabContentRandom[$scope.seeAnswerLocation].translation;
                    $scope.seeAnswer = $scope.vocabContentRandom[$scope.seeAnswerLocation].phrase;
                    $scope.seeAnswerID = $scope.vocabContentRandom[$scope.seeAnswerLocation].id;
                    $scope.seeIncomplete = true;
                    $scope.seeResponse = '';
                    $scope.correct = 0;
                    $scope.incorrect = 0;

                    $scope.seeItHighScoreText = $rootScope.preference.navs.writeit_perfect.translation;
                    $scope.seeitCurrentGameText = $rootScope.preference.navs.flashit_currentgame.translation;
                    setPieGraph(0, $scope.totalItems);
                    $scope.seeAnswered = [];
                    $scope.seeSkipped = [];
                    $scope.seeNotStarted = false;
                    if (updateCircleText) {

                        var svg = d3.select("svg");
                        var donut = svg.selectAll("g.nv-pie").filter(
                            function (d, i) {
                                return i == 1;
                            });

                        // Update the circle text
                        donut.select("text").text(0);

                    }
                }
                //beginSeeIt(false);

        });

        toastr.options = {
            positionClass: 'toast-bottom-right'
        };

        $scope.seeGetQuestionCount = function (vocabID) {

            return seeAttempts[vocabID];

        }

        /* Reset the activity */
        $scope.startSeeOver = function () {
                beginSeeIt(true);

            }
            /* Determine if a question was correct or skipped */
        $scope.checkAnswer = function (answerPosition) {

            var testArray = function (needle, array) {
                for (var i in array) {
                    if (array[i] == needle)
                        return true;
                }
                return false;
            }

            if (testArray(answerPosition, $scope.seeAnswered)) {
                return 'correct';
            }
            if (testArray(answerPosition, $scope.seeSkipped)) {
                return 'skipped';
            }

        }

        $scope.skipQuestion = function () {
            seeAttempts[$scope.seeAnswerLocation] ++;
            seeAttempts[$scope.seeAnswerLocation] ++;
            $scope.incorrect++;
            $scope.seeSkipped.push($scope.seeAnswerLocation);
            $scope.seeAnswerLocation++;
            if ($scope.vocabContentRandom[$scope.seeAnswerLocation] != null) {

                $scope.seeCurrentQuestion = $scope.vocabContentRandom[$scope.seeAnswerLocation].translation;
                $scope.seeAnswer = $scope.vocabContentRandom[$scope.seeAnswerLocation].phrase;
                $scope.seeAnswerID = $scope.vocabContentRandom[$scope.seeAnswerLocation].id;
            }
            $scope.seeResponse = '';
            $scope.remainingQuestions--;
            toastr.info($rootScope.preference.navs.write_nexttime.translation);

            if ($scope.seeAnswerLocation == $scope.vocabContentRandom.length) {
                $scope.seeIncomplete = false;
            }

            $scope.seeItHighScoreText = $rootScope.preference.navs.writeit_nummistakes.translation;

            $scope.exampleData = [{
                    key: "One",
                    y: $scope.incorrect
                }, {
                    key: "Two",
                    y: parseInt((($scope.totalItems - $scope.incorrect) < 0) ? 0 : ($scope.totalItems - $scope.incorrect))
                }

            ];

            var svg = d3.select("svg");
            var donut = svg.selectAll("g.nv-pie").filter(
                function (d, i) {
                    return i == 1;
                });

            // Update the circle text
            donut.select("text").text($scope.incorrect);

            SeeIT.update({
                vocabID: $rootScope.$stateParams.vocabId
            }, {
                correct: $scope.correct,
                incorrect: $scope.incorrect,
                remaining: $scope.remainingQuestions
            });

        }

        $scope.submitAnswer = function () {

            seeAttempts[$scope.seeAnswerLocation] ++;
            //check if the answer is correct
            if ($scope.seeResponse == $scope.seeAnswer) {

                //correct answer
                $scope.correct++;
                $scope.seeAnswered.push($scope.seeAnswerLocation);

                $scope.seeAnswerLocation++;

                if ($scope.vocabContentRandom[$scope.seeAnswerLocation] != null) {
                    $scope.seeCurrentQuestion = $scope.vocabContentRandom[$scope.seeAnswerLocation].translation;
                    $scope.seeAnswer = $scope.vocabContentRandom[$scope.seeAnswerLocation].phrase;
                    $scope.seeAnswerID = $scope.vocabContentRandom[$scope.seeAnswerLocation].id;

                }
                $scope.seeResponse = '';
                toastr.success($rootScope.preference.navs.writeit_greatwork.translation);
                $scope.remainingQuestions--;

                //deal with the circle score and oonly update if new score

                if ($scope.seeAnswerLocation == $scope.vocabContentRandom.length) {
                    $scope.seeIncomplete = false;
                }

            } else {
                $scope.incorrect++;
                //if ($scope.seeExistingCorrect < $scope.correct) {
                $scope.seeItHighScoreText = $rootScope.preference.navs.writeit_perfect.translation;

                $scope.seeItHighScoreText = $rootScope.preference.navs.writeit_nummistakes.translation;

                $scope.seeItHighScoreText = 'Number of Mistakes';

                var svg = d3.select("svg");
                var donut = svg.selectAll("g.nv-pie").filter(
                    function (d, i) {
                        return i == 1;
                    });

                // Update the circle text
                donut.select("text").text($scope.incorrect);
                //}

                toastr.error($rootScope.preference.navs.writeit_tryagain.translation);
            }

            $scope.exampleData = [{
                    key: "One",
                    y: $scope.incorrect
                }, {
                    key: "Two",
                    y: parseInt((($scope.totalItems - $scope.incorrect) < 0) ? 0 : ($scope.totalItems - $scope.incorrect))
                }

            ];

            //update the database with the new score
            SeeIT.update({
                vocabID: $rootScope.$stateParams.vocabId
            }, {
                correct: $scope.correct,
                incorrect: $scope.incorrect,
                remaining: $scope.remainingQuestions
            });
            return false;
        }

        var colorArray = ['#d9534f', '#5cb85c'];
        $scope.colorFunction = function () {
            return function (d, i) {
                return colorArray[i];
            };
        }

        $scope.yFunction = function () {
            return function (d) {
                return d.y;
            };
        }

        $scope.xFunction = function () {
            return function (d) {
                return d.key;
            };

        }

        function setPieGraph(first, second) {

            $scope.exampleData = [{
                    key: "One",
                    y: first
                }, {
                    key: "Two",
                    y: second
                }

            ];
        }
        setPieGraph(0, 0);
        $rootScope.$on('preference', function (event, preference) {
            $scope.seeItHighScoreText = $rootScope.preference.navs.writeit_perfect.translation;

        });

        $scope.seeNotStarted = true;

        //var vocabArray = Vocab.get({vocabId: $rootScope.$stateParams.vocabId}, function(vocab) {
        var scoreArray = SeeIT.get({
            vocabID: $rootScope.$stateParams.vocabId
        }, function (response) {
            $scope.seeExistingCorrect = response.incorrectAnswers;

            $scope.vocabArray.$promise.then(function (result) {
                if (parseInt(response.incorrectAnswers) >= parseInt(result.content.length)) {
                    var startTotal = 0;
                } else {
                    var startTotal = parseInt(result.content.length);
                }

                $scope.seeitCurrentGameText = $rootScope.preference.navs.writeit_previous.translation;
                $scope.correct = response.correctAnswers;
                $scope.incorrect = response.incorrectAnswers;
                if (response.incorrectAnswers > 0) {
                    $scope.seeItHighScoreText = $rootScope.preference.navs.writeit_nummistakes.translation;
                }
                $scope.remainingQuestions = response.remainingQuestions;

                setPieGraph(parseInt(response.incorrectAnswers), startTotal);
                /*
                 $scope.exampleData = [
                 { key: "One", y: parseInt(response.correctAnswers) },
                 { key: "Two", y: startTotal }

                 ];
                 */
                var svg = d3.select("svg");
                var donut = svg.selectAll("g.nv-pie").filter(
                    function (d, i) {
                        return i == 1;
                    });

                // Inserting text
                donut.select("text").text(response.incorrectAnswers);
            });

        });

        $scope.callbackFunction = function () {
            return function (graph) {
                var svg = d3.select("svg");
                var donut = svg.selectAll("g.nv-pie").filter(
                    function (d, i) {
                        return i == 1;
                    });

                // Inserting text
                donut.insert("text", "g")
                    .text(0)
                    .attr("class", "css-label-class")
                    .attr("text-anchor", "middle")
                    .attr("dy", 20);
            }

        };

        /* time see it */
        /*
         var slider = new Slider('#flashStartTimeSlider', {
         formatter: function (value) {
         return 'Current Speed: ' + value + ' Seconds';
         }
         });
         */
        $scope.flashitShowAnswerFeedback = true;
        $scope.flashItGameStarted = false;
        $scope.flashitCorrect = 0;
        $scope.flashitIncorrectScore = 0;
        $scope.flashitHighScore = 0;

        var scoreArray = FlashIT.get({
            vocabID: $rootScope.$stateParams.vocabId
        }, function (response) {
            $scope.flashitHighScore = response.correctAnswers;

        });

        $scope.flashStartSpeedSlide = {
            min: 2,
            max: 15,
            step: 1
        };

        $scope.range = true;

        $scope.flashStartTime = 10;

        $scope.flashLanguageFlip = false;
        var flashPreviousRandomPick;
        $rootScope.$on('preference', function (event, preference) {
            $scope.flashitCurrentGameText = $rootScope.preference.navs.writeit_previous.translation;

        });

        $scope.flashIncomplete = false;

        //array randomizer
        $scope.flashitArrayRandomizer = function (arrayToRandomize) {
            //randomize our array
            for (var i = arrayToRandomize.length - 1; i >= 0; i--) {

                var randomIndex = Math.floor(Math.random() * (i + 1));
                var itemAtIndex = arrayToRandomize[randomIndex];
                arrayToRandomize[randomIndex] = arrayToRandomize[i];
                arrayToRandomize[i] = itemAtIndex;
                //seeAttempts[i] = 0;//use this loop set all the counts to zero
            }
            return arrayToRandomize;
        };

        //pick a random question or phrase
        $scope.flashRandomizer = function () {
            //convert our object to an array so we can work with it
            var newArray = [];
            for (var key in $scope.vocabItems) {

                newArray.push($scope.vocabItems[key]);
            }
            return $scope.flashitArrayRandomizer(newArray);
        };

        //convert our data to an array
        $scope.vocabArray.$promise.then(function (result) {
            $scope.flashitContentRandom = $scope.flashRandomizer();
        });

        //select a number of possible incorrect answers and insert the correct answer, then shuffle
        $scope.flashitCreatePossibleAnswers = function (pickedAnswer) {

            //if ($scope.flashitContentRandom.length > 5) {
            //select 4 randoms
            var pick;
            var newArray = [];
            if ($scope.flashitContentRandom.length > 5) {
                var maxLoopLength = 4;
            } else {
                var maxLoopLength = $scope.flashitContentRandom.length - 1;
            }
            for (var i = 0; i < maxLoopLength; i++) {
                pick = Math.floor(Math.random() * $scope.flashitContentRandom.length);
                if ((pick != pickedAnswer)) {
                    var skipThisOne = false;
                    for (var ii = 0, x = newArray.length; ii < x; ii++) {
                        skipThisOne = false;
                        if (newArray[ii].id == $scope.flashitContentRandom[pick].id) {
                            i--;
                            skipThisOne = true;
                            break;
                        }

                    }

                    if (!skipThisOne) {
                        newArray.push($scope.flashitContentRandom[pick]);
                    }
                } else {
                    i--;
                }
            }
            newArray.push($scope.flashitContentRandom[pickedAnswer]);
            return $scope.flashitArrayRandomizer(newArray);

        };

        $scope.refreshFlashItGame = function () {
            $scope.flashitGameTransitioning = false;
            $scope.flashItGameStarted = true;
            $scope.flashitCurrentGameText = $rootScope.preference.navs.flashit_currentgame.translation;

            //pick a random question
            var flashRandomPicker = function (previousPick) {
                var pick;
                for (var i = 0; i < 10; i++) {
                    pick = Math.floor(Math.random() * $scope.flashitContentRandom.length);
                    if (pick != previousPick) {
                        return pick;
                    }
                }

            };

            var flashRandomPick = flashRandomPicker(flashPreviousRandomPick);

            flashPreviousRandomPick = flashRandomPick;

            $scope.flashitSelectedQuery = $scope.flashitContentRandom[parseInt(flashRandomPick)];

            $scope.flashitPossibleanswers = $scope.flashitCreatePossibleAnswers(flashRandomPick);

        }

        $scope.callbackFunction2 = function () {
            return function (graph) {
                var svg = d3.select("svg#flashitSVG");
                var donut = svg.selectAll("g.nv-pie").filter(
                    function (d, i) {
                        return i == 1;
                    });

                // Inserting text
                donut.insert("text", "g")
                    .text(60)
                    .attr("class", "css-label-class")
                    .attr("text-anchor", "middle")
                    .attr("dy", 20);
            }
        };

        var colorArray2 = ['#d9534f', '#5cb85c'];
        $scope.colorFunction2 = function () {
            return function (d, i) {
                return colorArray2[i];
            };
        }

        function setflashitPieGraph(first, second) {
            $scope.flashitPieData = [{
                    key: "One",
                    y: first
                }, {
                    key: "Two",
                    y: second
                }

            ];
        }

        $scope.random = function () {

            //$scope.stacked = [];
            $scope.interval = 0;

            $scope.flashitCurrentInterval = $interval(function () {
                $scope.interval = ($scope.interval + 1) % $scope.flashStartTime;
                var type;
                var value = ($scope.interval / $scope.flashStartTime) * 100;

                if (value == 0) {
                    value = 100;
                }

                if (value <= 30) {
                    type = 'success';
                } else if (value <= 50) {
                    type = 'info';
                } else if (value <= 80) {
                    type = 'warning';
                } else {
                    type = 'danger';

                }
                if (value == 100) {
                    $scope.flashitAnswerFlashing = 'incorrect_icon_64_64.png';
                    $scope.flashitShowAnswerFeedbackProcessor();
                    $scope.resetFlashItGame();

                }

                $scope.flashitQuestionProgress = value;
                $scope.type = type;

            }, 1000);
        };

        $scope.beginFlashItGame = function () {
            $scope.flashitCorrect = 0;
            $scope.flashitIncorrectScore = 0;
            $scope.flashitCurrentGameText = $rootScope.preference.navs.writeit_previous.translation;
            $scope.flashitShowAnswerFeedback = true;
            $scope.refreshFlashItGame();
            $scope.flashitTimeLeft = 60;
            setflashitPieGraph(0, 0);
            $scope.flashitGameInterval = $interval(function () {
                $scope.flashitTimeLeft--;
                setflashitPieGraph((60 - $scope.flashitTimeLeft), $scope.flashitTimeLeft);

                var svg = d3.select("svg#flashitSVG");
                var donut = svg.selectAll("g.nv-pie").filter(
                    function (d, i) {
                        return i == 1;
                    });

                // Inserting text
                donut.select("text").text($scope.flashitTimeLeft);

                if ($scope.flashitTimeLeft == 0) {

                    $interval.cancel($scope.flashitGameInterval);
                    $scope.endFlashItGame();
                }
            }, 1000);
        }

        $scope.$on("$destroy", function () {
            if ($scope.flashItGameStarted) {
                $scope.endFlashItGame();
            }
        });

        $scope.startFlashitOver = function () {
            $scope.flashitGameEnded = false;
            $scope.flashItGameStarted = false;
            $scope.flashitQuestionProgress = 0;

        }

        $scope.endFlashItGame = function () {
            $scope.flashitGameEnded = true;
            //$interval.cancel($scope.flashitCurrentInterval);
            $interval.cancel($scope.flashitGameInterval);
            $scope.chatCollapsed = true;

        }

        $scope.resetFlashItGame = function () {
            $scope.flashitGameTransitioning = true;
            $scope.flashitQuestionProgress = 0;
            $scope.flashStartTime = (($scope.flashStartTime - 1) < 2) ? 2 : ($scope.flashStartTime - 1);

            var start = new Date().getTime();
            for (var i = 0; i < 1e7; i++) {
                if ((new Date().getTime() - start) > 10) {
                    break;
                }
            }

            $scope.refreshFlashItGame();
        };

        $scope.processQuestionBeforeNew = function (selectedAnswer) {
            for (var i in $scope.flashitPossibleanswers) {
                if ($scope.flashitPossibleanswers[i].phrase == selectedAnswer.phrase) {
                    $scope.flashitPossibleanswers[i].incorrectAnswer = true;
                } else {
                    $scope.flashitPossibleanswers[i].incorrectAnswer = false;
                }

                if ($scope.flashitPossibleanswers[i].phrase == $scope.flashitSelectedQuery.phrase) {
                    $scope.flashitPossibleanswers[i].correctAnswer = true;
                } else {
                    $scope.flashitPossibleanswers[i].correctAnswer = false;
                }

            }
        };

        $scope.flashitShowAnswerFeedbackProcessor = function () {
            $scope.flashitShowAnswerFeedback = false;
            $timeout(function () {
                $scope.flashitShowAnswerFeedback = true;
            }, 2000);
        }

        $scope.flashitProcessAnswer = function (selectedAnswer) {

            $('.flashItAnswerButton').on('click', function () {
                $(this).removeClass("active");
                $(this).blur();
            });
            if (selectedAnswer.phrase == $scope.flashitSelectedQuery.phrase) {
                $scope.resetFlashItGame();
                $scope.flashitCorrect++;
                if ($scope.flashitCorrect > $scope.flashitHighScore) {
                    $scope.flashitHighScore = $scope.flashitCorrect;
                    FlashIT.update({
                        vocabID: $rootScope.$stateParams.vocabId
                    }, {
                        correct: $scope.flashitCorrect,
                        incorrect: 0,
                        remaining: 0
                    });
                }
                $scope.flashitAnswerFlashing = 'correct_icon2_64_64.png';
                $scope.flashitShowAnswerFeedbackProcessor();

            } else {
                $scope.flashitIncorrectScore++;
                $scope.processQuestionBeforeNew(selectedAnswer);
                $scope.resetFlashItGame();
                $scope.flashitAnswerFlashing = 'incorrect_icon_64_64.png';
                $scope.flashitShowAnswerFeedbackProcessor();
            }

        };

        //select local or native translation

        //create the random word list for this question... include one correct answer

        //take the starting speed, divide it by the number of vocan questions and each time something gets answered correctly, lower the speed to a max a quarter second

        //if the answer is incorrect, the game ends

    }
]);

/******************************************************************************
 * Grader Vocabulary Controller
 *****************************************************************************/

appControllers.controller('GraderVocabController', ['$rootScope', '$scope', '$document', 'Vocab',
    function ($rootScope, $scope, $document, Vocab) {
        $scope.currentItem = 0;
        $scope.vocabAudios = new Array();

        var vocabArray = Vocab.get({
            vocabId: $rootScope.$stateParams.vocabId
        }, function (vocab) {
            $scope.vocabAudios = new Array();

            $scope.vocabItems = vocab.content;
            $scope.totalItems = vocab.content.length;

            for (var i = 0; i < vocab.content.length; i++) {
                var urls = [vocab.content[i].urls[1],vocab.content[i].urls[0]];
                $scope.vocabAudios[i] = {
                    id: vocab.content[i].id,
                    howler: new Howl({
                        src: urls
                    })
                };
            }
        });

        /* Star Filter */

        $scope.starred = [];

        $scope.setStarred = function () {
            var id = this.vocab.id;
            if (_.contains($scope.starred, id)) {
                // Remove Star
                $scope.starred = _.without($scope.starred, id);
                if ($rootScope.enableFilter) {
                    if ($scope.currentItem > $scope.starred.length - 1 && $scope.starred.length > 0) {
                        $scope.currentItem = $scope.starred.length - 1;
                    }
                }
            } else {
                // Add Star
                $scope.starred.push(id);
            }
            return false;
        };

        $scope.isStarred = function (id) {
            if (_.contains($scope.starred, id)) {
                return 'active';
            }
            return false;
        };
        $scope.textWrapClass = function (text) {
            if (text.length > 190)
                return '';
            return 'card-text';
        }

        $scope.enableStarFilter = function () {
            if ($scope.starred.length > 0) {
                $rootScope.enableFilter = true;
                $scope.currentItem = 0;
            }
        }

        $scope.disableStarFilter = function () {
            $rootScope.enableFilter = false;
        }

        $scope.starFilter = function (vocab) {
            if ($scope.starred.length > 0 && !_.contains($scope.starred, vocab.id) && $rootScope.enableFilter) {
                return false;
            } else {
                return true;
            }
        }

        /* Vocabulary Flashcards */

        $scope.prevItem = function () {
            $scope.currentItem = $scope.currentItem - 1;
        }

        $scope.nextItem = function () {
            $scope.currentItem = $scope.currentItem + 1;
        }

        $scope.flip = function () {
            $('.flip .card').toggleClass('flipped');
            $('.flip .card .back').toggleClass('flipped');

            for (var i = 0; i < $scope.vocabAudios.length; i++) {
                if ($scope.vocabAudios[i].id == this.vocab.id) {
                    $scope.vocabAudios[i].howler.play();
                }
            }
        }

        /* Audio Playback */

        $scope.playAudio = function () {
            for (var i = 0; i < $scope.vocabAudios.length; i++) {
                if ($scope.vocabAudios[i].id == this.vocab.id) {
                    $scope.vocabAudios[i].howler.play();
                }
            }
        }

        /* Audio Recording */

        $scope.recording = false;

        $scope.isRecording = function () {
            if ($scope.recording) {
                return 'active';
            }
            return false;
        };

        $scope.recordAudio = function () {
            $scope.recording = !$scope.recording;
            if ($scope.recording) {
                Recorder.record({
                    start: function () {
                        console.log("Recording Started");
                    },
                    progress: function (milliseconds) {
                        // TODO: show timer
                    }
                });
            } else {
                Recorder.stop();
                console.log("Recording Stopped");
                Recorder.play({
                    progress: function (milliseconds) {
                        // TODO: show timer
                    }
                });
                // FIXME: deferred execution
                for (var i = 0; i < $scope.vocabAudios.length; i++) {
                    if ($scope.vocabAudios[i].id == this.vocab.id) {
                        $scope.vocabAudios[i].howler.play();
                    }
                }
            }
        }

    }
]);

/******************************************************************************
 * Chat Controller
 *****************************************************************************/

appControllers.controller('ChatController', ['$http', '$rootScope', '$scope', '$sce', 'Chat', 'CurrentCourseId', '$interval',
    function ($http, $rootScope, $scope, $sce, Chat, CurrentCourseId, $interval) {
        $scope.users = new Array();

        Chat.get({
            courseId: CurrentCourseId.getCourseId()
        }, function (chat) {
            $scope.users = chat.users;
        });

        $scope.notification = {
            oscillator: false
        };
        var oscillator_promise = null;

        $interval(function () {
            $http.get('/notification?userid=me').then(function (response) {
                var count = response.data.newChatMessagesCount;
                if (count > 0) {
                    oscillator_promise = $interval(function () {
                        $scope.notification.oscillator = !$scope.notification.oscillator;
                    }, 1000);
                    $scope.uncheckedMessagesQuantityString = '(' + count + ')';
                }
            });
        }, 5000);

        $scope.$on('NavUpdate', function (event, data) {

            Chat.get({
                courseId: CurrentCourseId.getCourseId()
            }, function (chat) {
                $scope.users = chat.users;
            });

        });

        $scope.chatTo = function (user) {
            $rootScope.$broadcast('ChatTo', user);
        };

        $scope.refresh = function () {
            $interval.cancel(oscillator_promise);
            $scope.notification.oscillator = false;
            $scope.uncheckedMessagesQuantityString = '';

            //$(function () {
            //    $.get("/chat/" + CurrentCourseId.getCourseId(), function(data){
            //        var usersArray = data.users;
            //        var chatUsers = [];
            //        if(usersArray) {
            //            for (var i = 0; i < usersArray.length; i++) {
            //                chatUsers.push({
            //                    Id: usersArray[i].id,
            //                    RoomId: DemoAdapterConstants.DEFAULT_ROOM_ID,
            //                    Name: usersArray[i].fname + ' ' + usersArray[i].lname,
            //                    Email: 'whatever@whatever.com',
            //                    ProfilePictureUrl: "/public/img/chatuserdefault.png",
            //                    Status: 1
            //                })
            //            }
            //            _global_chat_users = chatUsers;
            //        }
            //        $.chat({
            //            // your user information
            //            userId: 1,
            //            // id of the room. The friends list is based on the room Id
            //            roomId: 1,
            //            // text displayed when the other user is typing
            //            typingText: ' is typing...',
            //            // title for the rooms window
            //            roomsTitleText: 'Rooms',
            //            // title for the 'available rooms' rab
            //            availableRoomsText: 'Available rooms',
            //            // text displayed when there's no other users in the room
            //            emptyRoomText: "There's no one around here. You can still open a session in another browser and chat with yourself :)",
            //            // the adapter you are using
            //            chatJsContentPath: '/basics/chatjs/',
            //            friendsTitleText: 'Chat',
            //            allowRoomSelection: false,
            //            adapter: new MegLmsAdapter()
            //        });
            //    });
            //});

            Chat.get({
                courseId: CurrentCourseId.getCourseId()
            }, function (chat) {
                $scope.users = chat.users;
            });
        };

        $scope.refreshTimer = function (delay) {
            $timeout(function () {
                Chat.getchat({
                    chatter_id: $scope.chatter.id,
                    course_id: CurrentCourseId.getCourseId()
                }, function (chat) {
                    if ($scope.previousMessagesLength != null) {
                        if ($scope.previousMessagesLength < chat.chats.length) {
                            $rootScope.$broadcast('NewChatMessage', chat.chats[chat.chats.length - 1]);
                        }
                    }

                    $scope.messages = chat.chats;
                    $scope.previousMessagesLength = chat.chats.length;

                    $scope.refreshTimer(delay);
                });
            }, delay);
        }

        $scope.uncheckedMessagesQuantityString = '';

        $scope.$on('NewChatMessage', function (event, uncheckedNewMessage) {
            $scope.refresh();
        });
    }
]);

/******************************************************************************
 * ChatBox Controller
 *****************************************************************************/

appControllers.controller('ChatBoxController', ['$rootScope', '$scope', '$sce', '$timeout', 'Chat', 'CurrentCourseId',
    function ($rootScope, $scope, $sce, $timeout, Chat, CurrentCourseId) {
        $scope.chatter = new Array();
        $scope.chat_message = '';
        $scope.messages = new Array();
        $scope.previousMessagesLength = null;

        $scope.refreshTimer = function (delay) {
            $timeout(function () {
                Chat.getchat({
                    chatter_id: $scope.chatter.id,
                    course_id: CurrentCourseId.getCourseId()
                }, function (chat) {
                    if ($scope.previousMessagesLength != null) {
                        if ($scope.previousMessagesLength < chat.chats.length) {
                            $rootScope.$broadcast('NewChatMessage', chat.chats[chat.chats.length - 1]);
                        }
                    }

                    $scope.messages = chat.chats;
                    $scope.previousMessagesLength = chat.chats.length;

                    $scope.refreshTimer(delay);
                });
            }, delay);
        }

        $scope.$on('ChatTo', function (event, data) {
            $scope.chat_message = '';

            $scope.chatter = data;

            Chat.getchat({
                chatter_id: $scope.chatter.id,
                course_id: CurrentCourseId.getCourseId()
            }, function (chat) {
                $scope.messages = chat.chats;
            });

            $scope.refreshTimer(10000);

        });

        $scope.send = function () {
            Chat.send({
                chatter_id: $scope.chatter.id,
                course_id: CurrentCourseId.getCourseId(),
                message: $scope.chat_message
            }, function (chat) {
                $scope.chat_message = '';
                Chat.getchat({
                    chatter_id: $scope.chatter.id,
                    course_id: CurrentCourseId.getCourseId()
                }, function (chat) {
                    $scope.messages = chat.chats;
                });
            });
        }

        $scope.chatCollapsed = false;

        $scope.collapseToggle = function () {
            $scope.chatCollapsed = !$scope.chatCollapsed;
        };

        $scope.hasClass = function (element, cls) {
            return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
        }
    }
]);

/******************************************************************************
 * Quiz Controller
 *****************************************************************************/

/******************************************************************************
 * QuizController has been moved to ../public/js/controllers/student/QuizController.js
 *****************************************************************************/

/******************************************************************************
 * Content Controller
 *****************************************************************************/



/******************************************************************************
 * Grader Content Controller
 *****************************************************************************/

appControllers.controller('GraderAllController', ['$rootScope', '$scope', '$sce', 'graderactivity','GraderSortOrder','GraderData','CurrentCourseId',
    function ($rootScope, $scope, $sce, graderactivity,GraderSortOrder,GraderData,CurrentCourseId) {
        $scope.courseid = $rootScope.$stateParams.courseId;


        $scope.pagination = GraderData.pagination
        $scope.ChangecurrentMessageId = function (messageid, pagename) {
            $scope.currentMessageId = messageid;
            $scope.pagename = pagename;
        }
        function updateSortOrderText(){
            if($scope.currentSortOrder=='desc')
                $scope.sortOrderText = 'Sort oldest to newest'
            else $scope.sortOrderText = 'Sort newest to oldest';

        }
        $scope.$watch('$root.user',function(user){
            if(!user) return;
            $scope.currentSortOrder = GraderSortOrder.getMode() || user.org.sort_posts_grader || 'asc';
            GraderSortOrder.setMode($scope.currentSortOrder)
        })
        $scope.changeSortOrder = function(by){
            $scope.currentSortOrder=by;
            updateSortOrderText();
            GraderSortOrder.setMode($scope.currentSortOrder);
            $scope.$root.$broadcast('reloadPostedMessagesSilent');
        }
        $scope.isJ1Class = function(){
            return CurrentCourseId.getCourseInfo().is_j1_class == 1;
        }
    }
]);

appControllers.controller('GraderContentTimedController', ['$rootScope', '$scope', '$sce', 'Content', 'graderactivity',
    function ($rootScope, $scope, $sce, Content, graderactivity) {
        $scope.contentid = $rootScope.$stateParams.contentId;
        //console.log('here');
        if (!graderactivity.getgradercontent()) {
            var contentArray = Content.get({
                contentId: $rootScope.$stateParams.contentId
            }, function (content) {
                console.log(content);
                graderactivity.setgradercontent($scope, $rootScope, $sce, content);
            });
        }

        /*
         Golabs 01/02/2015
         We are changing our currentMessageId this is so we can
         do things like tab changes.
         */
        $scope.ChangecurrentMessageId = function (messageid, pagename) {
            $scope.currentMessageId = messageid;
            $scope.pagename = pagename;
        }
    }
]);

appControllers.controller('GraderContentController', ['$rootScope', '$scope', '$sce', 'Content', 'graderactivity',
    function ($rootScope, $scope, $sce, Content, graderactivity) {
        $scope.contentid = $rootScope.$stateParams.contentId;

        if (!graderactivity.getgradercontent()) {
            var contentArray = Content.get({
                contentId: $rootScope.$stateParams.contentId
            }, function (content) {
                graderactivity.setgradercontent($scope, $rootScope, $sce, content);
            });
        }

        /*
         Golabs 01/02/2015
         We are changing our currentMessageId this is so we can
         do things like tab changes.
         */
        $scope.ChangecurrentMessageId = function (messageid, pagename) {
            $scope.currentMessageId = messageid;
            $scope.pagename = pagename;
        }
    }
]);

appControllers.controller('GraderArchiveContentController', ['$rootScope', '$scope', '$sce', '$window', 'Content', 'graderactivity',
    function ($rootScope, $scope, $sce, $window, Content, graderactivity) {
        graderactivity.windowwatcher($scope, $window);
        $scope.contentid = $rootScope.$stateParams.contentId;
        var contentArray = Content.get({
            contentId: $rootScope.$stateParams.contentId
        }, function (content) {
            graderactivity.setgradercontent($scope, $rootScope, $sce, content);
        });
        /*
         Golabs 01/02/2015
         We are changing our currentMessageId this is so we can
         do things like tab changes.
         */
        $scope.ChangecurrentMessageId = function (messageid, pagename) {
            $scope.currentMessageId = messageid;
            $scope.pagename = pagename;
        }
    }
]);

appControllers.controller('ExternalLinkController', ['$rootScope', '$scope', '$sce', '$window', 'ExternalLink', 'Currentpageid',
    function ($rootScope, $scope, $sce, $window, ExternalLink, Currentpageid) {
        $scope.contentid = $rootScope.$stateParams.externalLinkId;
        $scope.checkPassword = checkPassword;
        var contentArray = ExternalLink.get({
            externalLinkId: $rootScope.$stateParams.externalLinkId
        }, function (content) {
            Currentpageid.RecordingPageAccess($scope.contentid);
            //$window.open(content.contenthtml);
            $scope.contenthtml = $sce.trustAsHtml(content.contenthtml);
            $scope.pagename = content.pagename;
            $rootScope.pagename = content.pagename;
            $scope.is_mobile = ON_MOBILE;
            $scope.allow_video_post = content.allow_video_post;
            $scope.allow_text_post = content.allow_text_post;
            $scope.allow_upload_post = content.allow_upload_post;
            $scope.allow_template_post = content.allow_template_post;
            $scope.page_is_private = content.page_is_private;
            $scope.page_is_gradeable = content.page_is_gradeable;
            $scope.need_password = content.need_password;
            if (typeof content.template !== 'undefined') {
                $scope.selectedTemplate = content.template;
            }

        });

        function checkPassword() {
            if ($scope.need_password) {
                Page.get({
                    id: $scope.contentid,
                    password: $scope.user_password
                }, function (res) {
                    if (!res.error) {
                        $scope.need_password = false;
                    }
                })
            }
        }

    }
]);

appControllers.controller('GraderExternalLinkController', ['$rootScope', '$scope', '$sce', '$window', 'ExternalLink',
    function ($rootScope, $scope, $sce, $window, ExternalLink) {
        $scope.contentid = $rootScope.$stateParams.externalLinkId;

        var contentArray = ExternalLink.get({
            externalLinkId: $rootScope.$stateParams.externalLinkId
        }, function (content) {
            //$window.open(content.contenthtml);
            $scope.contenthtml = $sce.trustAsHtml(content.contenthtml);
            $scope.pagename = content.pagename;
            $rootScope.pagename = content.pagename;
            $scope.is_mobile = ON_MOBILE;
            $scope.allow_video_post = content.allow_video_post;
            $scope.allow_text_post = content.allow_text_post;
            $scope.allow_upload_post = content.allow_upload_post;
            $scope.allow_template_post = content.allow_template_post;
            $scope.page_is_private = content.page_is_private;
            $scope.page_is_gradeable = content.page_is_gradeable;
        });
    }
]);

/******************************************************************************
 * EditUnit Controller
 *****************************************************************************/

appControllers.controller('EditUnitController', ['$rootScope', '$scope', '$sce','EditUnit', 'EditPage', 'CurrentCourseId','Gradebook','Nav','SuperUnit','$modal','$q','UploadFile','$compile',
    function ($rootScope, $scope, $sce, EditUnit, EditPage, CurrentCourseId,Gradebook,Nav,SuperUnit,$modal,$q,UploadFile,$compile) {
        $scope.unitid = $rootScope.$stateParams.unitId;
        $scope.useSuperUnits = CurrentCourseId.data.use_super_units==1
        $scope.superUnit = SuperUnit;
        EditUnit.get({
            unitId: $scope.unitid
        }, function (unit) {
            $scope.unitid = unit.unit.id;
            $scope.unit_number = unit.unit.name;
            $scope.unit_title = unit.unit.description;
            $scope.tabName = unit.unit.tab_name;
            $scope.unitImageUrl = unit.unit.image_url;
            $scope.hide_from_student = unit.unit.hide_from_student;
            $scope.superUnitId = unit.unit.superUnitId
            $scope.is_intro_unit = unit.unit.name==-1;
        });
        $scope.toggleIntroUnit = function(isIntroUnit){
            $scope.unit_title = isIntroUnit?'Introduction':'';
            $scope.unit_number = isIntroUnit?'-1':'';
        }
        $scope.getLastUnit = function () {
            return EditUnit.all({
                courseid: CurrentCourseId.getCourseId(),
                orderBy: 'name desc',
                limit: 1
            }).$promise;
        }
        $scope.removeImage = function() {
            reloadInput()
            $scope.unitImageUrl = undefined;
            $scope.unitImage = undefined;
        };
        function reloadInput(){
            var input = jQuery('#unitInputfile').val('').clone(true);
            $compile(input)($scope);
            input.replaceWith(input.val('').clone(true));

        }
        $scope.selectFile = function($event) {
            setTimeout(function(){
                angular.element('#unitInputfile').trigger('click');
            },10);
            $event.stopPropagation()
        }
        $scope.onFileChange = function(){

        }
        function uploadImage(callBack){
            UploadFile.imageData({
                imageData:$scope.unitImage.base64
            },function(res) {
                $scope.unitImageUrl = res.filename;
                delete $scope.unitImage;
                if(callBack){
                    callBack($scope.unitImageUrl)
                }
            });
        }
        function openCloneQuizFlag(){
            var defer = $q.defer()
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonequizzesflag.html',
                controller: 'CloneQuizzesFlagController',

            });
            modalInstance.result.then(function(cloneQuizzes){
                defer.resolve(cloneQuizzes);
            },function(){
                console.log(arguments)
            });
            return defer.promise;
        }
        function hasAnyQuiz(pages){
            return _.some(pages,function(p){
                return p.layout=='QUIZ'
            })
        }
        function openClonePromptsFlag(){
            var defer = $q.defer()
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/modalclonepromptsflag.html',
                controller: 'ClonePromptsFlagController',

            });
            modalInstance.result.then(function(cloneQuizzes){
                defer.resolve(cloneQuizzes);
            });
            return defer.promise;
        }
        function hasAnyPrompt(pages){
            return _.some(pages,function(p){
                return p.layout=='TIMED_REVIEW'
            })
        }

        $scope.cloneUnit = function (cloneQuizzes) {

            $scope.cloning = true;
            $scope.getLastUnit().then(insertNewAfterLastUnit)

        }
        function insertNewAfterLastUnit(res){
            var newUnitPosition = parseInt(res.units[0].name) + 1;
            var newUnitDesc = $scope.unit_title;
            EditUnit.submit({
                course_id: CurrentCourseId.getCourseId(),
                unit_number: newUnitPosition,
                unit_title: newUnitDesc,
                tab_name: $scope.tabName,
                image_url: $scope.unitImageUrl,
                superUnitId:$scope.superUnitId
            },getAllPagesFromSourceUnit );
        }
        function getAllPagesFromSourceUnit (res) {
            $scope.newUnitId = res.id;
            EditPage.all({
                unitid: $scope.unitid
            }, cloneContentIntoNewUnit)

        }
        function cloneContentIntoNewUnit(res) {
            var pages = res.pages;
            for (var i in pages) {
                pages[i].cloned_name = pages[i].name;
            }

            var checkFlags = {};
            if( hasAnyQuiz(res.pages)){
                checkFlags['cloneQuizzes']= openCloneQuizFlag()
            }
            if( hasAnyPrompt(res.pages)){
                checkFlags['clonePrompts']= openClonePromptsFlag()
            }
            $q.all(checkFlags).then(function(flags){finishCloning(flags,pages)});

        }
        function finishCloning(flags,pages){
            var cloneQuizzes = flags.cloneQuizzes,
                clonePrompts = flags.clonePrompts
            EditUnit.clone({
                id: $scope.newUnitId,
                pages: pages,
                cloneQuizzes: cloneQuizzes,
                clonePrompts: clonePrompts
            }, function (res) {
                if (res.message == 'successful') {
                    $scope.cloning = false;
                    $rootScope.$broadcast('NavForceReload');
                }
            })
        }
        $scope.updateUnit = function () {
            if($scope.unitImage){
                return uploadImage($scope.updateUnit);
            }
            EditUnit.update({
                unitid: $scope.unitid,
                unit_number: $scope.unit_number,
                unit_title: $scope.unit_title,
                tab_name: $scope.tabName,
                image_url: $scope.unitImageUrl,
                hide_from_student: $scope.hide_from_student,
                superUnitId:$scope.superUnitId
            }, function (unit) {
                if (unit.message == 'successful') {
                    $rootScope.$broadcast('NavForceReload');
                    toastr.success('Updated Unit');
                } else {
                    toastr.error(unit.message);
                }
            });
        }

        $scope.handleDeleteReponse = function (unit,recalculate) {
            if (unit.message == 'successful') {
                $rootScope.$broadcast('NavForceReload');
                toastr.success('Deleted Unit');
            } else {
                if (unit.message = 'has_children') {
                    if(typeof recalculate !== 'string' && unit.needGradebookRecalculation && Nav.navData.orgDetails.calculate_progress){
                        Gradebook.openRecalculationWarning(
                            function(){
                                $scope.handleDeleteReponse(unit,'now')
                            },
                            function(){
                                $scope.handleDeleteReponse(unit,'later')
                            }
                        )
                    }else{
                        EditUnit.delete({
                            unitid: $scope.unitid,
                            forceDelete: true
                        }, $scope.handleDeleteReponse);
                    }
                }
            }
        }
        $scope.deleteUnit = function () {
            if (confirm("Are You Sure You Want To Delete This Unit?") == true) {
                EditUnit.delete({
                    unitid: $scope.unitid
                }, $scope.handleDeleteReponse);
            }
        }

    }
]);

/******************************************************************************
 * EditOrganization Controller
 *****************************************************************************/
//moved to controllers/admin/admin.js

/******************************************************************************
 * EditOrganization Controller
 *****************************************************************************/

appControllers.controller('EditDepartmentController', ['$rootScope', '$scope', '$sce', '$location', 'EditDepartment',
    function ($rootScope, $scope, $sce, $location, EditDepartment) {
        $scope.departmentid = $rootScope.$stateParams.departmentId;
        EditDepartment.get({
            departmentId: $scope.departmentid
        }, function (department) {
            $scope.departmentName = department.department.name;
            $scope.departmentDomain = department.department.subdomain;
        });

        $scope.updateDepartment = function () {
            EditDepartment.update({
                id: $scope.departmentid,
                name: $scope.departmentName,
                domain: $scope.departmentDomain
            }, function (department) {
                if (department.message == 'successful') {
                    $rootScope.$broadcast('NavOrganizationUpdate');
                    toastr.success('Updated Department');
                } else {
                    toastr.success(department.message);
                }
            });
        }

        $scope.deleteDepartment = function () {
            if (confirm("Are You Sure You Want To Delete This Department?") == true) {
                EditDepartment.delete({
                    id: $scope.departmentid
                }, function (department) {
                    if (department.message == 'successful') {
                        $rootScope.$broadcast('NavOrganizationUpdate');
                        toastr.success('Deleted Department');
                        $location.url('/superadmindash/');
                    } else {
                        toastr.error(department.message);
                    }
                });
            }
        }

    }
]);

/******************************************************************************
 * EditCourse Controller
 *****************************************************************************/

appControllers.controller('EditCourseController', ['$rootScope', '$scope', '$sce', '$location', 'EditCourse',
    function ($rootScope, $scope, $sce, $location, EditCourse) {
        $scope.courseid = $rootScope.$stateParams.courseId;
        // Get a list of all languages supported by the system
        // for use in language drop-down selector.
        EditCourse.languages({}, function (language) {
            $scope.languages = language.list;
        });

        EditCourse.get({
            courseId: $scope.courseid
        }, function (course) {
            $scope.courseName = course.course.name;
            $scope.courseDescription = course.course.description;
        });

        $scope.updateCourse = function () {
            EditCourse.update({
                id: $scope.courseid,
                name: $scope.courseName,
                description: $scope.courseDescription,
                native_language: $scope.nativeLanguage.language_id
            }, function (course) {
                if (course.message == 'successful') {
                    $rootScope.$broadcast('NavDepartmentUpdate');
                    toastr.success('Updated Course');
                } else {
                    toastr.error(course.message);
                }
            });
        }

        $scope.deleteCourse = function () {
            if (confirm("Are You Sure You Want To Delete This Course?") == true) {
                EditCourse.delete({
                    id: $scope.courseid
                }, function (course) {
                    if (course.message == 'successful') {
                        $rootScope.$broadcast('NavDepartmentUpdate');
                        toastr.success('Deleted Course');
                        $location.url('/superadmindash/');
                    } else {
                        toastr.error(course.message);
                    }
                });
            }
        }

    }
]);

/******************************************************************************
 * AddOrganization Controller
 *****************************************************************************/

appControllers.controller('AddOrganizationController', ['$rootScope', '$scope', '$sce', '$location', 'CurrentOrganizationId', 'EditOrganization',
    function ($rootScope, $scope, $sce, $location, CurrentOrganizationId, EditOrganization) {
        $scope.addOrganization = function () {
            EditOrganization.submit({
                name: $scope.organizationName,
                domain: $scope.organizationDomain,
                email: $scope.organizationEmail,
                phone: $scope.organizationPhone
            }, function (organization) {
                if (organization.message == 'successful') {
                    $rootScope.$broadcast('NavAddedOrganizationUpdate');
                    toastr.success('Added Organization');
                    $location.url('/superadmindash/');
                } else {
                    toastr.error(organization.message);
                }
            });
        }

    }
]);

/******************************************************************************
 * AddDepartment Controller
 *****************************************************************************/

appControllers.controller('AddDepartmentController', ['$rootScope', '$scope', '$sce', 'CurrentOrganizationId', 'EditDepartment',
    function ($rootScope, $scope, $sce, CurrentOrganizationId, EditDepartment) {
        $scope.addDepartment = function () {
            EditDepartment.submit({
                organization_id: CurrentOrganizationId.getOrganizationId(),
                name: $scope.departmentName,
                domain: $scope.departmentDomain
            }, function (department) {
                if (department.message == 'successful') {
                    $rootScope.$broadcast('NavOrganizationUpdate');
                    toastr.success('Added Department');
                } else {
                    toastr.error(department.message);
                }
            });
        }

    }
]);

/******************************************************************************
 * AddCourse Controller
 *****************************************************************************/
//This feature was moved to AddCourseClassController
//It's not being maintained anymore
appControllers.controller('AddCourseController', ['$rootScope', '$scope', '$sce', 'EditDepartment', 'CurrentDepartmentId', 'EditCourse',
    function ($rootScope, $scope, $sce, EditDepartment, CurrentDepartmentId, EditCourse) {
        $scope.departmentId = $rootScope.$stateParams.departmentId || CurrentDepartmentId.getDepartmentId();
        $scope.checkingAll = false;
        // Get a list of all languages supported by the system
        // for use in language drop-down selector.
        EditCourse.languages({}, function (language) {
            $scope.languages = language.list;
        });
        EditCourse.getavailablecourses({
            id: $scope.departmentId
        }, function (response) {
            if (typeof response.message === 'undefined') {
                var text = '';
                for (var i in response)
                    text += response[i];
                return;
            }
            if (response.message == 'successful')
                $scope.courses = response.courses;
            else
                toastr.error(response.message);
        });
        $scope.clone = function (course) {
            var courses
            if (typeof course === 'undefined')
                courses = _.where($scope.courses, {
                    cloning: true
                });
            else
                courses = [course];
            EditCourse.clone({
                courses: courses
            }, function (response) {
                if (typeof response.message === 'undefined') {
                    var text = '';
                    for (var i in response)
                        text += response[i];
                    return;
                }
                if (response.message == 'successful')
                    toastr.success('Cloned!!');
                else
                    toastr.error(response.message);
            });
        };
        $scope.checkAll = function () {
            if ($scope.checkingAll) {
                for (var i in $scope.courses)
                    $scope.courses[i].cloning = false;
            } else {
                for (var i in $scope.courses)
                    $scope.courses[i].cloning = true;
            }
            $scope.checkingAll = !$scope.checkingAll;
        };
        $scope.addCourse = function () {
            EditCourse.submit({
                department_id: $scope.departmentId,
                name: $scope.courseName,
                description: $scope.courseDescription,
                native_language: $scope.nativeLanguage.language_id
            }, function (course) {
                if (course.message == 'successful') {
                    $rootScope.$broadcast('NavDepartmentUpdate');
                    toastr.success('Added Course');
                } else {
                    toastr.error(course.message);
                }
            });
        }

    }
]);

/******************************************************************************
 * AddUnit Controller
 *****************************************************************************/

appControllers.controller('AddUnitController', ['$rootScope', '$scope', '$window', '$sce', 'CurrentCourseId', 'EditUnit','SuperUnit','UploadFile',
    function ($rootScope, $scope, $window, $sce, CurrentCourseId, EditUnit,SuperUnit,UploadFile) {
        $scope.useSuperUnits = CurrentCourseId.data.use_super_units==1
        $scope.superUnit = SuperUnit
        $scope.toggleIntroUnit = function(isIntroUnit){
            $scope.unit_title = isIntroUnit?'Introduction':'';
            $scope.unit_number = isIntroUnit?'-1':'';
            $scope.is_intro_unit=isIntroUnit;
        }
        $scope.removeImage = function() {
            $scope.unitImageUrl = undefined;
            $scope.unitImage = undefined;
        }
        $scope.selectFile = function($event) {
            setTimeout(function(){
                angular.element($event.target).find('input').trigger('click');
            },10);
        }
        function uploadImage(callBack){
            UploadFile.imageData({
                imageData:$scope.unitImage.base64
            },function(res) {
                $scope.unitImageUrl = res.filename;
                delete $scope.unitImage;
                if(callBack){
                    callBack($scope.unitImageUrl)
                }
            });
        }
        $scope.addUnit = function () {
            if($scope.unit_number=='' || $scope.unit_number == null || $scope.unit_number == undefined){
                toastr.error("Please insert a valid number for the unit")
                return;
            }
            if($scope.unitImage){
                return uploadImage($scope.addUnit);
            }

            EditUnit.submit({
                course_id: CurrentCourseId.getCourseId(),
                unit_number: $scope.unit_number,
                unit_title: $scope.unit_title,
                image_url: $scope.unitImageUrl,
                tab_name: $scope.tabName,
                superUnitId:$scope.superUnitId
            }, function (unit) {
                if (unit.message == 'successful') {
                    $rootScope.$broadcast('NavUpdate');
                    toastr.success('Added unit!');
                    $window.location.reload();
                } else {
                    toastr.error(unit.message);
                }
            });
        }

    }
]);

/******************************************************************************
 * AddPage Controller
 *****************************************************************************/
//moving to /public/js/controllers/editor/AddContentController.js

/******************************************************************************
 * EditPage Controller
 *****************************************************************************/
//moving to /public/js/controllers/editor/EditContentController.js

/******************************************************************************
 * Edit External Link Controller
 *****************************************************************************/

appControllers.controller('EditExternalLinkController', ['$rootScope', '$scope', '$sce', '$timeout', 'CurrentUnitId', 'EditPage',
    function ($rootScope, $scope, $sce, $timeout, CurrentUnitId, EditPage) {
        $scope.contentid = $rootScope.$stateParams.contentId;

        $scope.page_title = '';
        $scope.page_sub_title = '';
        $scope.page_type = '';
        $scope.page_content = '';
        $scope.external_link = '';
        $scope.allow_video_post = false;
        $scope.allow_text_post = false;
        $scope.allow_upload_post = false;
        $scope.allow_template_post = false;
        $scope.is_private_post = false;
        $scope.is_gradeable_post = false;
        $scope.hide_activity = false;
        $scope.page_group = {
            id: 0,
            name: ''
        };
        $scope.page_group_id = 0;
        $scope.subunits = new Array();

        EditPage.get({
            pageId: $scope.contentid
        }, function (page) {
            $scope.page_title = page.pagename;
            $rootScope.pagename = content.pagename;
            $scope.page_sub_title = page.subtitle;
            $scope.page_content = page.contenthtml;
            $scope.external_link = page.contenthtml;
            $scope.allow_video_post = page.allow_video_post;
            $scope.allow_text_post = page.allow_text_post;
            $scope.allow_upload_post = page.allow_upload_post;
            $scope.allow_template_post = page.allow_template_post;
            $scope.is_private_post = page.page_is_private;
            $scope.is_gradeable_post = page.page_is_gradeable;
            $scope.hide_activity = page.hide_activity;
            $scope.page_group_id = page.pagegroupid;

            if ($scope.allow_video_post == 1) {
                $scope.allow_video_post = true;
            } else {
                $scope.allow_video_post = false;
            }

            if ($scope.allow_text_post == 1) {
                $scope.allow_text_post = true;
            } else {
                $scope.allow_text_post = false;
            }

            if ($scope.allow_upload_post == 1) {
                $scope.allow_upload_post = true;
            } else {
                $scope.allow_upload_post = false;
            }

            if ($scope.allow_template_post == 1) {
                $scope.allow_template_post = true;
            } else {
                $scope.allow_template_post = false;
            }

            if ($scope.is_private_post == 1) {
                $scope.is_private_post = true;
            } else {
                $scope.is_private_post = false;
            }

            if ($scope.is_gradeable_post == 1) {
                $scope.is_gradeable_post = true;
            } else {
                $scope.is_gradeable_post = false;
            }

            if ($scope.hide_activity == 1) {
                $scope.hide_activity = true;
            } else {
                $scope.hide_activity = false;
            }

            $timeout(function () {
                if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                    CKEDITOR.instances.editor1.setData($scope.page_content);
                }
            }, 1300);

            EditPage.getsubunits({
                unit_id: CurrentUnitId.getUnitId()
            }, function (subunits) {

                $scope.subunits = subunits.subunits;
                for (var i = 0; i < $scope.subunits.length; i++) {
                    if ($scope.subunits[i].id == $scope.page_group_id) {
                        $scope.page_group = $scope.subunits[i];
                        break;
                    }
                }
            });
        });
        $scope.deletePage = function () {
            if (confirm("Are You Sure You Want To Delete This Page") == true) {
                EditPage.del({
                    page_id: $scope.contentid
                }, function (page) {
                    if (page.message == 'successful') {
                        $rootScope.$broadcast('NavForceReload');
                        toastr.success("Deleted Page");
                    } else {
                        toastr.error(page.message);
                    }
                });
            }
        }
        $scope.editPage = function () {
            $scope.page_content = $scope.external_link;
            var page_group_id = 0;

            if (angular.isDefined($scope.page_group) && angular.isDefined($scope.page_group.id) && $scope.page_group.id > 0) {
                page_group_id = $scope.page_group.id;
            }

            var allow_video_post = 0;
            var allow_text_post = 0;
            var allow_upload_post = 0;
            var allow_template_post = 0;
            var is_private_post = 0;
            var is_gradeable_post = 0;
            var hide_activity = 0;

            if ($scope.allow_video_post == true) {
                allow_video_post = 1;
            }

            if ($scope.allow_text_post == true) {
                allow_text_post = 1;
            }

            if ($scope.allow_upload_post == true) {
                allow_upload_post = 1;
            }

            if ($scope.allow_template_post == true) {
                allow_template_post = 1;
            }

            if ($scope.is_private_post == true) {
                is_private_post = 1;
            }

            if ($scope.is_gradeable_post == true) {
                is_gradeable_post = 1;
            }

            if ($scope.hide_activity == true) {
                hide_activity = 1;
            }

            EditPage.update({
                page_id: $scope.contentid,
                page_title: $scope.page_title,
                page_sub_title: $scope.page_sub_title,
                page_group_id: page_group_id,
                page_content: $scope.page_content,
                allow_video_post: allow_video_post,
                allow_text_post: allow_text_post,
                allow_upload_post: allow_upload_post,
                allow_template_post: allow_template_post,
                is_private_post: is_private_post,
                is_gradeable_post: is_gradeable_post,
                hide_activity: hide_activity
            }, function (page) {
                if (page.message == 'successful') {
                    $rootScope.$broadcast('NavForceReload');
                    toastr.success("Updated Page");
                } else {
                    toastr.error(page.message);
                }
            });

        }
    }
]);

/******************************************************************************
 * Edit Header Controller
 *****************************************************************************/

appControllers.controller('EditHeaderController', ['$rootScope', '$scope', '$sce', '$timeout', 'CurrentUnitId', 'EditPage',
    function ($rootScope, $scope, $sce, $timeout, CurrentUnitId, EditPage) {
        $scope.contentid = $rootScope.$stateParams.contentId;

        $scope.page_title = '';
        $scope.page_sub_title = '';
        $scope.page_type = '';
        $scope.page_content = '';
        $scope.external_link = '';
        $scope.allow_video_post = false;
        $scope.allow_text_post = false;
        $scope.allow_upload_post = false;
        $scope.allow_template_post = false;
        $scope.is_private_post = false;
        $scope.is_gradeable_post = false;
        $scope.hide_activity = false;
        $scope.max_points = 0;
        $scope.page_group = {
            id: 0,
            name: ''
        };
        $scope.page_group_id = 0;
        $scope.subunits = new Array();

        EditPage.get({
            pageId: $scope.contentid
        }, function (page) {
            $scope.page_title = page.pagename;
            $rootScope.pagename = content.pagename;
            $scope.page_sub_title = page.subtitle;
            $scope.page_content = page.contenthtml;
            $scope.external_link = page.contenthtml;
            $scope.allow_video_post = page.allow_video_post;
            $scope.allow_text_post = page.allow_text_post;
            $scope.allow_upload_post = page.allow_upload_post;
            $scope.allow_template_post = page.allow_template_post;
            $scope.is_private_post = page.page_is_private;
            $scope.is_gradeable_post = page.page_is_gradeable;
            $scope.hide_activity = page.hide_activity;
            $scope.max_points = page.max_points;
            $scope.page_group_id = page.pagegroupid;
            $scope.children_count = parseInt(page.children_count);

            if ($scope.allow_video_post == 1) {
                $scope.allow_video_post = true;
            } else {
                $scope.allow_video_post = false;
            }

            if ($scope.allow_text_post == 1) {
                $scope.allow_text_post = true;
            } else {
                $scope.allow_text_post = false;
            }

            if ($scope.allow_upload_post == 1) {
                $scope.allow_upload_post = true;
            } else {
                $scope.allow_upload_post = false;
            }

            if ($scope.allow_template_post == 1) {
                $scope.allow_template_post = true;
            } else {
                $scope.allow_template_post = false;
            }
            if ($scope.is_private_post == 1) {
                $scope.is_private_post = true;
            } else {
                $scope.is_private_post = false;
            }

            if ($scope.is_gradeable_post == 1) {
                $scope.is_gradeable_post = true;
            } else {
                $scope.is_gradeable_post = false;
            }

            if ($scope.hide_activity == 1) {
                $scope.hide_activity = true;
            } else {
                $scope.hide_activity = false;
            }

            $timeout(function () {
                if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                    CKEDITOR.instances.editor1.setData($scope.page_content);
                }
            }, 1300);

            EditPage.getsubunits({
                unit_id: CurrentUnitId.getUnitId()
            }, function (subunits) {

                $scope.subunits = subunits.subunits;
                for (var i = 0; i < $scope.subunits.length; i++) {
                    if ($scope.subunits[i].id == $scope.page_group_id) {
                        $scope.page_group = $scope.subunits[i];
                        break;
                    }
                }
            });
        });
        $scope.deletePage = function () {
            if (confirm("Are You Sure You Want To Delete This Page") == true) {
                EditPage.del({
                    page_id: $scope.contentid
                }, function (page) {
                    if (page.message == 'successful') {
                        $rootScope.$broadcast('NavForceReload');
                        toastr.success("Deleted Page");
                    } else {
                        toastr.error(page.message);
                    }
                });
            }
        }
        $scope.editPage = function () {
            var page_group_id = 0;

            if (angular.isDefined($scope.page_group) && angular.isDefined($scope.page_group.id) && $scope.page_group.id > 0) {
                page_group_id = $scope.page_group.id;
            }

            var allow_video_post = 0;
            var allow_text_post = 0;
            var allow_upload_post = 0;
            var allow_template_post = 0;
            var is_private_post = 0;
            var is_gradeable_post = 0;
            var hide_activity = 0;

            if ($scope.allow_video_post == true) {
                allow_video_post = 1;
            }

            if ($scope.allow_text_post == true) {
                allow_text_post = 1;
            }

            if ($scope.allow_upload_post == true) {
                allow_upload_post = 1;
            }

            if ($scope.allow_template_post == true) {
                allow_template_post = 1;
            }

            if ($scope.is_private_post == true) {
                is_private_post = 1;
            }

            if ($scope.is_gradeable_post == true) {
                is_gradeable_post = 1;
            }

            if ($scope.hide_activity == true) {
                hide_activity = 1;
            }

            EditPage.update({
                page_id: $scope.contentid,
                page_title: $scope.page_title,
                page_sub_title: $scope.page_sub_title,
                page_group_id: page_group_id,
                page_content: $scope.page_content,
                allow_video_post: allow_video_post,
                allow_text_post: allow_text_post,
                allow_upload_post: allow_upload_post,
                allow_template_post: allow_template_post,
                is_private_post: is_private_post,
                is_gradeable_post: is_gradeable_post,
                hide_activity: hide_activity,
                max_points: $scope.max_points
            }, function (page) {
                if (page.message == 'successful') {
                    $rootScope.$broadcast('NavForceReload');
                    toastr.success("Updated Page");
                } else {
                    toastr.error(page.message);
                }
            });

        }

        $scope.delete = function () {
            var callback = function (page) {
                if (page.message == 'successful') {
                    $rootScope.$broadcast('NavForceReload');
                    toastr.success("Deleted Page");
                } else if (page.message == 'has_children') {
                    if (confirm("Are you sure you want to delete everything in this group") == true) {
                        EditPage.del({
                            page_id: $scope.contentid,
                            confirm_delete: true
                        }, callback);
                    }
                } else
                    toastr.error(page.message);

            };
            if (confirm("Are You Sure You Want To Delete This Page") == true) {
                EditPage.del({
                    page_id: $scope.contentid
                }, callback);
            }
        };
    }
]);

// GraderPostController has been moved to /public/js/controllers/graderpost.js

// GraderPostedMessagesController has been moved to ./controllers/grader/gradermessages.js

appControllers.controller('GraderArchivePostedMessagesController', ['$rootScope', '$scope', '$timeout', '$sce','GraderSortOrder', 'GraderPost', 'graderactivity', 'CurrentCourseId', '$http','$filter','GraderData',
    function ($rootScope, $scope, $timeout, $sce,GraderSortOrder, GraderPost, graderactivity, CurrentCourseId, $http,$filter,GraderData) {
        $scope.studentsNeedingGrading = new Array(); //So we can have a list of students to filter by.
        $scope.teachersThatHaveGraded = new Array(); // So we can have a list of teachers to filter by.
        $scope.allPostedMessages = new Array(); // Store a list of all posted messages so a filter can be undone without another AJAX call
        $scope.isGraderArchiveView = true;
        $scope.graderactivity = graderactivity;

        if ($scope.courseid > 0) {
            graderactivity.windowwatcher($scope, $window);
            $scope.current_video_player = '';
            $scope.posted = GraderPost.archive({
                courseid: $scope.courseid,
                sortOrder:GraderSortOrder.getMode()
            }, function (messages) {
                graderactivity.setPostedMessages($scope, $rootScope, messages, $sce, $http);
                graderactivity.updateRubrics($scope)
            });
        } else {
            $scope.current_video_player = '';
            graderactivity.clear();
            $scope.posted = GraderPost.pageArchive({
                postId: $scope.contentid,
                courseId: CurrentCourseId.getCourseId(),
                sortOrder:GraderSortOrder.getMode()
            }, function (messages) {
                graderactivity.setPostedMessages($scope, $rootScope, messages, $sce, $http);
                graderactivity.updateRubrics($scope)
            });
        }

        $scope.$on('reloadPostedMessages', reloadPostedMessages);
        $scope.$on('reloadPostedMessagesSilent', reloadPostedMessages);
        function reloadPostedMessages(event,data){
            if ($scope.courseid > 0) {
                $scope.posted = GraderPost.archive({
                    courseid: $scope.courseid,
                    sortOrder:GraderSortOrder.getMode()
                }, function (messages) {
                    graderactivity.setPostedMessages($scope, $rootScope, messages, $sce, $http);
                });

            } else {
                graderactivity.clear();
                $scope.posted = GraderPost.pageArchive({
                    postId: $scope.contentid,
                    sortOrder:GraderSortOrder.getMode(),
                    courseId:CurrentCourseId.getCourseId()
                }, function (messages) {

                    graderactivity.setPostedMessages($scope, $rootScope, messages, $sce, $http);
                });
            }
        }
        $scope.replyTo = function (reply_to_id) {
            if (!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }

            $scope.reply_to_id = reply_to_id;

            $scope.$emit('replyToId', $scope.reply_to_id);
        }

        $scope.deletePost = function (delete_id) {
            if (!angular.isDefined(delete_id)) {
                return;
            }

            if (confirm("Are You Sure You Want To Delete Post") == true) {
                $scope.delete_id = delete_id;

                $scope.$emit('deleteId', $scope.delete_id);
            }
        }

        $scope.openVideoPlayer = function (video_message_id, modal_id) {
            for (var i = 0; $scope.postedMessages.length; i++) {
                if ($scope.postedMessages[i].id == video_message_id) {
                    $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');

                    break;
                } else if ($scope.postedMessages[i].children.length > 0) {
                    var found_in_child = false;
                    for (var j = 0; j < $scope.postedMessages[i].children.length; j++) {
                        if ($scope.postedMessages[i].children[j].id == video_message_id) {
                            $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].children[j].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');

                            found_in_child = true;
                        }
                    }

                    if (found_in_child) {
                        break;
                    }
                }
            }
            $('#' + modal_id).modal('show');
            $('#' + modal_id).on('hide.bs.modal', function () {
                document.getElementById('defaultVideoPlayer').pause();
            })
        }

        $scope.indentClass = function (indent_count) {
            return "indent-" + indent_count;
        }

        /*
         Golabs 01/02/2015
         We are testing to see what tab "Messageid" we are on.
         this is for a ng-class call to set the active tab.
         */
        $scope.messageClassActive = function (messageid, morethenone,message) {
            if (messageid === $scope.currentMessageId) {
                return 'active';
            }
            if(!(message && message.grouped && message.grouped.length)){
                if (morethenone === 1) {
                    return 'active';
                }
            }
            if(message && !_.some(message.grouped,function(m){
                    return m.id == $scope.currentMessageId
                })){
                if (morethenone === 1) {
                    return 'active';
                }
            }


        }

        /*
         Golabs 01/02/2015
         We are changing our currentMessageId this is so we can
         do things like tab changes.
         Basically what we are doing so when the user clicks on a tab is
         to switch the current selected and the new selcted around in the
         postedMessages array this is so Angular can get the frist instanace
         and display NOTE: the morethenone is needed see in services setPostedMessages
         in messagegrouper
         */
        $scope.ChangecurrentMessageId = function (messageid, pagename, $event) {
                var current;
                $($event.target).closest('ul').find('li').each(
                        function () {
                            if ($(this).hasClass('active'))
                                current = $(this).find('a').first().attr('data-id');
                        }
                    )
                    //we will grab our current and switch it with our new message so that
                    //angular will display before this doing a switch is best as we just switch our keys around.
                $scope.currentMessageId = messageid;
                $scope.pagename = pagename;
                var oldkey, newkey, tmpmsg
                for (var i = 0; i < $scope.postedMessages.length; i++) {
                    if ($scope.postedMessages[i].id === current) {
                        oldkey = i;
                    }
                    if ($scope.postedMessages[i].id === $scope.currentMessageId) {
                        newkey = i;
                    }
                }
            graderactivity.updateRubrics($scope)

            $scope.postedMessages[oldkey].morethenone = 2;
            tmpmsg = $scope.postedMessages[oldkey];
            $scope.postedMessages[oldkey] = $scope.postedMessages[newkey];
            $scope.postedMessages[oldkey].morethenone = 1
            $scope.postedMessages[newkey] = tmpmsg;


            }
            /**
             $scope.applyStudentFilter is called right after the user makes a selection in the student filter. It will
             re-render the list of grading to only include grading for this student.
             @param selectedStudent the object for the student that was selected in the filter.
             **/
        $scope.applyStudentFilter = function (selectedStudent) {
            graderactivity.applyStudentFilter($scope, selectedStudent);
            graderactivity.updateRubrics($scope)
        }

        /**
         $scope.applyActivityTypeFilter is called right after the user makes a selection in the activity type filter. It will
         re-render the list of grading to only include grading for this activity type.
         @param selectedActivityType the object for the activity type that was selected in the filter.
         **/
        $scope.applyActivityTypeFilter = function (selectedActivityType) {
            graderactivity.applyActivityTypeFilter($scope, selectedActivityType);
        }

        /**
         $scope.applyTeacherFilter is called right after the user makes a selection in the teacher filter. It will
         re-render the list of grading to only include grading that the selected teacher has completed.
         @param selectedTeacher the object for the activity type that was selected in the filter.
         **/
        $scope.applyTeacherFilter = function (selectedTeacher) {
            graderactivity.applyTeacherFilter($scope, selectedTeacher);
        }

        $scope.dateFilter = {}
        $scope.openStartDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.dateFilter.openedStartDate = true;
        };

        // openEndDate is called when a user clicks on the calendar button under the end date range filter field
        $scope.openEndDate = function($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.dateFilter.openedEndDate = true;
        };

        // dateOptions for the start and end date range filter fields.
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };
        $scope.$watch('graderactivity.postedMessages',function(postedMessages){
            $scope.postedMessages = $scope.graderactivity.postedMessages;
        },true)
        $scope.graderData = GraderData;
        $scope.$watch('graderData.dateRange.max',function(){
            graderactivity.applyStartDateFilter($scope);
        })
        $scope.$watch('graderData.dateRange.min',function(){
            graderactivity.applyStartDateFilter($scope);
        })
        $scope.endDateChanged = function (date) {
            graderactivity.applyEndDateFilter($scope, date);
        }

        $scope.startDateChanged = function (date) {
            graderactivity.applyStartDateFilter($scope, date);
        }
        $scope.advancedGrader = {}
        $scope.clearGradeMessage = function(){
            $scope.advancedGrader.gradeComments = '';
            $scope.currentMessageBeingEdited = null;
        };
        $scope.applyGradeMessage = function(){
            $scope.currentMessageBeingEdited.grade_comments = $scope.advancedGrader.gradeComments;
            $scope.clearGradeMessage();
        }
        $scope.setCurrentMessageBeingEdited = function(message){
            $scope.currentMessageBeingEdited = message;
            $scope.advancedGrader.gradeComments = $scope.currentMessageBeingEdited.grade_comments;
        }

        // Use a localized date format for the field value
        $scope.format = _global_localized_date_formats[navigator.language] || 'dd/MM/yy';
    }
]);

appControllers.controller('GraderArchiveController', ['$rootScope', '$scope', '$timeout', '$sce', '$window', 'GraderPost', 'graderactivity', 'CurrentCourseId',
    function ($rootScope, $scope, $timeout, $sce, $window, GraderPost, graderactivity, CurrentCourseId) {
        $scope.studentsNeedingGrading = new Array();
        $scope.teachersThatHaveGraded = new Array();
        $scope.allPostedMessages = new Array(); // Store a list of all posted messages so a filter can be undone without another AJAX call
        $scope.isGraderArchiveView = true;
        $scope.courseid = $scope.$stateParams.courseId;

        graderactivity.windowwatcher($scope, $window);

        if ($scope.courseid) {
            $scope.current_video_player = '';
            //$scope.posted = GraderPost.archive({
            //    courseid: $scope.courseid
            //}, function(messages) {
            //    graderactivity.setPostedMessages($scope, $rootScope, messages,$sce);
            //});

            $rootScope.$broadcast('GraderArchiveMenu');
        } else {
            $scope.current_video_player = '';
            $scope.posted = GraderPost.pageArchive({
                postId: $scope.contentid
            }, function (messages) {
                graderactivity.setPostedMessages($scope, $rootScope, messages, $sce);
            });
        }

        $scope.$on('reloadPostedMessages', function (event, data) {
            if ($scope.courseid > 0) {

                if (!window.location.href.match(/graderarchive|graderarchivecontent/)) {
                    $scope.posted = GraderPost.all({
                        courseid: $scope.courseid
                    }, function (messages) {
                        $scope.currentMessageId = messages.postmessages[0].id;
                        graderactivity.setPostedMessages($scope, $rootScope, messages, $sce);
                    });
                } else {

                    if (window.location.href.match(/graderarchive/)) {
                        var type = 'archive';
                        courseid: $scope.courseid
                    } else {
                        var type = 'pageArchive';
                        postId: $scope.postId
                    }

                    $scope.posted = GraderPost[type]({

                        courseid: $scope.courseid

                    }, function (messages) {
                        $scope.currentMessageId = messages.postmessages[0].id;
                        graderactivity.setPostedMessages($scope, $rootScope, messages, $sce);
                    });
                }
            } else {
                $scope.posted = GraderPost.query({
                    postId: $scope.contentid,
                    courseId: CurrentCourseId.getCourseId()
                }, function (messages) {
                    $scope.currentMessageId = messages.postmessages[0].id;
                    $scope.postedMessages = messages.postmessages;
                    $scope.currentMessageId = messages.postmessages[0].id
                });
            }
        });

        $scope.replyTo = function (reply_to_id) {
            if (!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }
            $scope.reply_to_id = reply_to_id;
            $scope.$emit('replyToId', $scope.reply_to_id);
        }

        $scope.deletePost = function (delete_id) {
            if (!angular.isDefined(delete_id)) {
                return;
            }

            if (confirm("Are You Sure You Want To Delete Post") == true) {
                $scope.delete_id = delete_id;
                $scope.$emit('deleteId', $scope.delete_id);
            }
        }

        $scope.openVideoPlayer = function (video_message_id, modal_id) {
            for (var i = 0; $scope.postedMessages.length; i++) {
                if ($scope.postedMessages[i].id == video_message_id) {
                    $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');
                    break;
                } else if ($scope.postedMessages[i].children.length > 0) {
                    var found_in_child = false;
                    for (var j = 0; j < $scope.postedMessages[i].children.length; j++) {
                        if ($scope.postedMessages[i].children[j].id == video_message_id) {
                            $scope.current_video_player = $sce.trustAsHtml('<video id="defaultVideoPlayer" width="320" height="240" controls><source src="' + $scope.postedMessages[i].children[j].video_url + '" type="video/mp4">Your browser does not support the video tag!</video>');
                            found_in_child = true;
                        }
                    }

                    if (found_in_child) {
                        break;
                    }
                }
            }
            $('#' + modal_id).modal('show');
            $('#' + modal_id).on('hide.bs.modal', function () {
                document.getElementById('defaultVideoPlayer').pause();
            })
        }

        $scope.indentClass = function (indent_count) {
            return "indent-" + indent_count;
        }

        /*
         Golabs 01/02/2015
         We are testing to see what tab "Messageid" we are on.
         this is for a ng-class call to set the active tab.
         */
        $scope.messageClassActive = function (messageid, morethenone) {
            if (morethenone === 1) {
                return 'active';
            }
            if (messageid === $scope.currentMessageId) {
                return 'active';
            }
        }

        /*
         Golabs 01/02/2015
         We are changing our currentMessageId this is so we can
         do things like tab changes.
         Basically what we are doing so when the user clicks on a tab is
         to switch the current selected and the new selcted around in the
         postedMessages array this is so Angular can get the frist instanace
         and display NOTE: the morethenone is needed see in services setPostedMessages
         in messagegrouper
         */
        $scope.ChangecurrentMessageId = function (messageid, pagename, $event) {
            var current;
            $($event.target).parents().eq(1).find('li').each(
                    function () {
                        if ($(this).hasClass('active'))
                            current = $(this).find('a').first().attr('data-id');
                    }
                )
                //we will grab our current and switch it with our new message so that
                //angular will display before this doing a switch is best as we just switch our keys around.
            $scope.currentMessageId = messageid;
            $scope.pagename = pagename;
            var oldkey, newkey, tmpmsg
            for (var i = 0; i < $scope.postedMessages.length; i++) {
                if ($scope.postedMessages[i].id === current) {
                    oldkey = i;
                }
                if ($scope.postedMessages[i].id === $scope.currentMessageId) {
                    newkey = i;
                }
            }
            //Doing our switch around....
            $scope.postedMessages[oldkey].morethenone = 2;
            tmpmsg = $scope.postedMessages[oldkey];
            $scope.postedMessages[oldkey] = $scope.postedMessages[newkey];
            $scope.postedMessages[oldkey].morethenone = 1
            $scope.postedMessages[newkey] = tmpmsg;
        }

        /**
         $scope.applyStudentFilter is called right after the user makes a selection in the student filter. It will
         re-render the list of grading to only include grading for this student.
         @param selectedStudent the object for the student that was selected in the filter.
         **/
        $scope.applyStudentFilter = function (selectedStudent) {
            graderactivity.applyStudentFilter($scope, selectedStudent);
        }

        /**
         $scope.applyActivityTypeFilter is called right after the user makes a selection in the activity type filter. It will
         re-render the list of grading to only include grading for this activity type.
         @param selectedActivityType the object for the activity type that was selected in the filter.
         **/
        $scope.applyActivityTypeFilter = function (selectedActivityType) {
            graderactivity.applyActivityTypeFilter($scope, selectedActivityType);
        }

        /**
         $scope.applyTeacherFilter is called right after the user makes a selection in the teacher filter. It will
         re-render the list of grading to only include grading that the selected teacher has completed.
         @param selectedTeacher the object for the activity type that was selected in the filter.
         **/
        $scope.applyTeacherFilter = function (selectedTeacher) {
            graderactivity.applyTeacherFilter($scope, selectedTeacher);
        }

        // openStartDate is called when a user clicks on the calendar button under the start date range filter field
        $scope.openStartDate = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.openedStartDate = true;
        };

        // openEndDate is called when a user clicks on the calendar button under the end date range filter field
        $scope.openEndDate = function ($event) {
            $event.preventDefault();
            $event.stopPropagation();

            $scope.openedEndDate = true;
        };

        // dateOptions for the start and end date range filter fields.
        $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
        };

        $scope.endDateChanged = function () {
            graderactivity.applyEndDateFilter($scope, $scope.submission_end_date_select);
        }

        $scope.startDateChanged = function () {
            graderactivity.applyStartDateFilter($scope, $scope.submission_start_date_select);
        }

        // Use a localized date format for the field value
        $scope.format = _global_localized_date_formats[navigator.language] || 'MM/dd/yy';
    }
]);

appControllers.controller('GraderHelperController', ['$rootScope', '$scope', '$timeout', '$sce', '$templateCache', '$upload', 'GraderPost', 'Currentpageid', 'graderactivity', '$modal', 'CurrentCourseId',
    function ($rootScope, $scope, $timeout, $sce, $templateCache, $upload, GraderPost, Currentpageid, graderactivity, $modal, CurrentCourseId) {
        if (typeof $scope.contentid !== 'undefined') {
            Currentpageid.SetCurrentpageid($scope.contentid)
        }
        $scope.reply_to_id = 0;
        $scope.video_comment = '';
        $scope.video_upload_comment = '';
        $scope.file_upload_comment = '';
        $scope.is_uploading = false;
        $scope.progress_upload = 0;
        $scope.check_is_private = 0;
        $scope.pageId=$scope.$state.params.contentId
        $scope.$templateCache = $templateCache;
        $scope.rubricData = {
            selectedScore: {},
        }

        $scope.showReplyTeacherButton = function () {
            var user = $scope.$root.user;
            if (!user) return false;
            return user.is_super_admin || user.is_organization_admin || user.teacher_supervisor;
        }
        $scope.$on('replyToId', function (event, data) {
            $(".modal").draggable({
                handle: ".modal-header"
            });

            $scope.reply_to_id = data;
            $scope.video_comment = '';
            $scope.video_upload_comment = '';
            $scope.file_upload_comment = '';
            $scope.is_uploading = false;
            $scope.progress_upload = 0;
            $scope.check_is_private = 0;

            $scope.post = GraderPost.get({
                postId: 'new'
            }, function (post) {
                $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                $scope.videoFileName = post.file_name;
            });
        });

        $scope.$on('deleteId', function (event, data) {
            $scope.post = GraderPost.delete({
                delete_id: data
            }, function (post) {
                if (post.message == 'successful') {
                    $scope.$broadcast('reloadPostedMessages', true);
                } else {
                    toastr.error(post.message);
                }
            });
        });

        /*
         Golabs needed to record our form data.
         Do not remove.
         */
        $scope.addGradeComments = function (id, value, type) {
            graderactivity.addGradeComments($scope, id, value, type);
        }

        $scope.showNewPost = function () {
            if ($scope.allow_video_post == 1 || $scope.allow_text_post == 1 || $scope.allow_upload_post == 1 || $scope.allow_template_post == 1) {
                return true;
            }
            return false;
        }
        $scope.canSavePost = function(){
            return $scope.loadingPost!==1;
        }
        $scope.applyGradeTo = function (message) {
            if (!angular.isDefined(message)) {
                return;
            }

            if (window.location.href.match(/graderarchive|graderarchivecontent/)||message.update_id) {
                var archive = message.update_id;
            } else {
                var archive = 0;
            }
            $rootScope.removemessageGradeComments = 1;

            if (typeof message.uploadedfileid === 'undefined') {
                message.uploadedfileid = '';
            }
            //message.grade_comments = CKEDITOR.instances['grade_comments_'+message.id].getData().replace('\n','');
            $scope.loadingPost=1
            var gradeData = {
                post_id: message.id,
                grade: message.grade,
                feedback: message.grade_comments || '',
                notes: message.teacher_notes || '',
                uploadedfileid: message.uploadedfileid,
                archive: archive,
                class_assignment_id: message.class_assignment_id,
                rubric: $scope.rubricData,
                courseId: CurrentCourseId.getCourseId(),
                page_id:$scope.pageId,
                user_id:message.user_id
            }
            if(message.rubricid > 0){
                var unsubscribe = $scope.$root.$on('gradeRubricGridCompleted',function(evt,data){
                    unsubscribe();
                    gradeData.grid = data.grid;
                    finallyGrade();
                })
                $scope.$broadcast('gradeRubricGrid',{});

            }else{
                finallyGrade()
            }
            function finallyGrade(){
                GraderPost.grade(gradeData, function (post) {

                    if (post.message == 'successful') {
                        $scope.loadingPost=0
                        message.grade_comments = ''
                        $scope.$broadcast('gradeRubric', {
                            postid: post.post_id,
                            teacherid: post.teacherid
                        });
                        var returned = $rootScope.$emit('reloadPostedMessages', 'RemoveCurrent');
                        if (!window.location.href.match(/graderarchive|graderarchivecontent/)) {
                            $rootScope.$broadcast('NavUpdateMenuStatic', true);
                        }
                        delete message.scoreOverride;
                        $rootScope.$broadcast('posted', CurrentCourseId.getCourseId());

                    } else {
                        $scope.loadingPost=2
                        toastr.error(post.message);
                    }
                });
            }


        }

        $scope.templateContentOnly = function (postmessage) {
            postmessage.htmlSafe = postmessage.htmlSafeContent;
            postmessage.contentView = 1;
        }

        $scope.templatePreviewOnly = function (postmessage) {
            postmessage.htmlSafe = postmessage.htmlSafeTemplate;
            postmessage.contentView = 0;
        }

        $scope.videoFeedBackTo = function (post_id) {
            if (!angular.isDefined(post_id)) {
                return;
            }
            $rootScope.scrolltop = $(document).scrollTop()
            $rootScope.$broadcast('videoGradeModal', {
                post_id: post_id,
                grade: $scope.grade,
                grade_comments: $scope.grade_comments,
                teacher_notes: $scope.teacher_notes,

            });
        };

        $scope.newPost = function (reply_to_id) {
            if (!angular.isDefined(reply_to_id)) {
                reply_to_id = 0;
            }

            $(".modal").draggable({
                handle: ".modal-header"
            });

            $scope.reply_to_id = reply_to_id;
            $scope.video_comment = '';
            $scope.check_is_private = 0;
            $scope.post = GraderPost.get({
                postId: 'new'
            }, function (post) {
                $scope.videoWidget = $sce.trustAsHtml(post.video_widget);
                $scope.videoRecordButton = $sce.trustAsHtml(post.button);
                $scope.videoFileName = post.file_name;
            });
        }

        $scope.submitPost = function () {
            if (!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if ($scope.video_comment == 'Type Message Here') {
                $scope.video_comment = '';
            }
            $scope.post.contentid = $scope.contentid;
            $scope.post.videoFileName = $scope.videoFileName;
            $scope.post.reply_to_id = $scope.reply_to_id;
            $scope.post.video_comment = $scope.video_comment;
            $scope.post.check_is_private = $scope.check_is_private;
            $scope.submitting = true;
            $scope.post.$submit(function (post) {
                $scope.submitting = false;
                if (post.message == 'successful') {
                    $scope.$broadcast('reloadPostedMessages', true);

                    $('#basicModal').modal('hide');
                } else {
                    toastr.error(post.message);
                }
            });
        }

        $scope.onFileSelect = function ($files) {
            $scope.is_uploading = true;
            $scope.progress_upload = 0;

            if (!angular.isDefined($scope.reply_to_id)) {
                $scope.reply_to_id = 0;
            }

            if ($scope.video_upload_comment == 'Type Message Here') {
                $scope.video_upload_comment = '';
            }
            if ($scope.check_is_private) {
                $scope.check_is_private = 1;
            }

            //$files: an array of files selected, each file has name, size, and type.
            for (var i = 0; i < $files.length; i++) {
                var file = $files[i];
                $scope.submitting = true;
                $scope.upload = $upload.upload({
                    url: '/graderpost/upload/', //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,
                    data: {
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        video_upload_comment: $scope.video_upload_comment,
                        check_is_private: $scope.check_is_private
                    },
                    file: file, // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name.
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function (evt) {
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);

                    $('#upload-progress-bar.progress-bar').width($scope.progress_upload + '%')
                }).success(function (data, status, headers, config) {
                    // file is uploaded successfully
                    $scope.submitting = false;
                    if (data.message == 'successful') {

                        $scope.$broadcast('reloadPostedMessages', true);

                        $('#basicModal').modal('hide');
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

        $scope.onFileUploadGenericSelect = function ($files) {
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
                $scope.submitting = true;
                $scope.upload = $upload.upload({
                    url: '/graderpost/fileupload/', //upload.php script, node.js route, or servlet url
                    //method: 'POST' or 'PUT',
                    //headers: {'header-key': 'header-value'},
                    //withCredentials: true,
                    data: {
                        contentid: $scope.contentid,
                        reply_to_id: $scope.reply_to_id,
                        file_upload_comment: $scope.file_upload_comment,
                        check_is_private: $scope.check_is_private
                    },
                    file: file, // or list of files ($files) for html5 only
                    //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
                    // customize file formData name ('Content-Disposition'), server side file variable name.
                    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'
                    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
                    //formDataAppender: function(formData, key, val){}
                }).progress(function (evt) {
                    $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);

                    $('#upload-progress-bar.progress-bar').width($scope.progress_upload + '%')
                }).success(function (data, status, headers, config) {
                    // file is uploaded successfully
                    $scope.submitting = false;
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

        $scope.GraderHelperController = function (hasvideo) {
            if (hasvideo) {
                return 'GraderHelperController'
            }
            return '';
        }

    }
]);
/*
Golabs 04/03/2015 incorporating dynamic content in our bind
*/
appControllers.directive('dynamic', function ($compile) {
    return {
        restrict: 'A',
        replace: true,
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.dynamic, function (html) {
                ele.html(html);
                $compile(ele.contents())(scope);
            });
        }
    };
});
/*
Golabs 30/06/2015 incorporating MAthhjax in our bind
*/
appControllers.directive("mathjaxBind", function () {
    return {
        restrict: "A",
        controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
            $scope.$watch($attrs.mathjaxBind, function (value) {
                var $script = angular.element("<script type='math/tex'>")
                    .html(value == undefined ? "" : value);
                $element.html("");
                $element.append($script);
                MathJax.Hub.Queue(["Reprocess", MathJax.Hub, $element[0]]);
            });
        }]
    };
});
