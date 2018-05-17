'use strict';
window.currentJsVersion = '18.03.30';
toastr.options = {
    positionClass: 'toast-bottom-left'
};

navigator.sayswho= (function(){
    var ua= navigator.userAgent, tem,
        M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1]=== 'Chrome'){
        tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
    return M.join(' ');
})();

function isModuleLoaded(module){

    try {
        window.angular.module(module);
    } catch(e) {
        return false;
    }
    return true;
}
var base_modules=[
    'ui.router',
    'ui.bootstrap',
    'ui.sortable',
    'angularFileUpload',
    'ngAnimate',
    'nsPopover',
    'selectize',
    'selectize2',
    'nvd3ChartDirectives',
    'timer',
    'ui.bootstrap-slider',
    'toggle-switch',
    'app.utils',
    'app.filters',
    'app.services',
    'app.directives',
    'app.controllers',
    'template/popover/popover-html.html',
    'flashItStuff',
	'timedReviewStuff',
	'automatedAlerts',
    'ui-rangeSlider',
    'angularTreeview',
    'ngImgCrop',
    'ngFileUpload',
    'naif.base64',
    'ngFabric'
]
/*if (navigator.sayswho.substr(0,2)!="IE")
    base_modules.push('timed-review')*/
angular.isUndefinedOrNull = function(val) {
    return angular.isUndefined(val) || val === null
}
if(isModuleLoaded('minicolors'))
    base_modules.push('minicolors');


if(window.location.href.indexOf("testbank")<0){
    var app= angular.module('app',base_modules)

    app.filter('percentage', ['$filter', function ($filter) {
        return function (input, decimals) {
            return $filter('number')(input, decimals) + '%';
        };
    }])
        .filter('orderObjectBy', function() {
            return function(items, field, reverse) {
                var filtered = [];
                angular.forEach(items, function(item) {
                    filtered.push(item);
                });
                filtered = _.sortBy(filtered,function(f){
                    if(f[field] && f[field].toLowerCase){
                        return f[field].toLowerCase();
                    }else return f[field];
                });

                if(reverse) filtered.reverse();
                return filtered;
            };
        });


//No Recorder...

    app.run(['$rootScope', '$state', '$stateParams',
        function ($rootScope, $state, $stateParams) {
            // Add ui-router parameters to $rootScope
            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;
        }
    ]);

    app.config(['$stateProvider', '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {
            $urlRouterProvider.otherwise('/');
            $stateProvider
                .state("no_license", {
                    url: '/no-license',
                    templateUrl: '/public/views/partials/no-license.html',
                    controller: 'NewLicenseController'
                });
            $stateProvider
                .state("expired", {
                    url: '/expired',
                    templateUrl: '/public/views/partials/license-expired.html',
                    controller: 'NewLicenseController'
                });
            $stateProvider
                .state("vocab", {
                    url: '/vocab/:vocabId',
                    templateUrl: '/public/views/partials/student/vocab.html',
                    controller: 'VocabController'
                });

            $stateProvider
                .state("lesson_listening", {
                    url: '/lesson_listening/:contentId',
                    templateUrl: '/public/views/partials/student/lesson_listening.html',
                    controller: 'LessonListeningController'
                });

            $stateProvider
                .state("listening_practice", {
                    url: '/listening_practice/:contentId',
                    templateUrl: '/public/views/partials/student/listening_practice.html',
                    controller: 'ListeningPracticeController'
                });

            $stateProvider
                .state("reading_practice", {
                    url: '/reading_practice/:contentId',
                    templateUrl: '/public/views/partials/student/reading_practice.html',
                    controller: 'ReadingPracticeController'
                });

            $stateProvider
                .state("timed_review", {
                    url: '/timed_review/:contentId',
                    templateUrl: '/public/views/partials/student/timed_review.html?v='+window.currentJsVersion,
                    //in src/js/time-review/index.js
                    controller: 'TimedReviewController'
                });


            $stateProvider
                .state("class_summary", {
                    url: '/class_summary/:contentId',
                    templateUrl: '/public/views/partials/student/class_summary.html',
                    // in src/js/time-review/index.js
                    controller: 'ClassSummaryController'
                });
            $stateProvider
                .state("journal", {
                    url: '/journal/:contentId',
                    templateUrl: '/public/views/partials/student/journal.html',
                    controller: 'JournalController'
                });
            $stateProvider
                .state("forum", {
                    url: '/forum/:contentId',
                    controller:'ForumController',
                    templateUrl: '/public/views/partials/student/forum/index.html',

                });
            $stateProvider
                .state("forum.dashboard", {
                    url: '/dashboard/:classId',
                    controller:'ForumDashboardController',
                    controllerAs:'dashVC',
                    templateUrl: '/public/views/partials/student/forum/dashboard.html',
                });
            $stateProvider
                .state("forum.topics", {
                    url: '/topics/:pageId',
                    controller:'ForumTopicsController',
                    controllerAs:'topicsVC',
                    templateUrl: '/public/views/partials/student/forum/topics.html',
                });
            $stateProvider
                .state("forum.topic_details", {
                    url: '/topic/:topicId',
                    controller:'ForumTopicDetailsController',
                    controllerAs:'topicVC',
                    templateUrl: '/public/views/partials/student/forum/topic_details.html',
                });
            $stateProvider
                .state("forum.participants", {
                    url: '/participants/:topicId',
                    controller:'ForumParticipantsController',
                    controllerAs:'vc',
                    templateUrl: '/public/views/partials/student/forum/participants.html',
                });
            $stateProvider
                .state("quiz", {
                    url: '/quiz/:quizId',
                    templateUrl: '/public/views/partials/student/quiz.html?v'+window.currentJsVersion,
                    controller: 'QuizController as qc',
                    controllerAs: 'qc'
                });
            $stateProvider
                .state("survey", {
                    url: '/survey/:quizId',
                    templateUrl: '/public/views/partials/student/quiz.html?v'+window.currentJsVersion,
                    controller: 'QuizController'
                });
            $stateProvider
                .state("vocab_quiz", {
                    url: '/vocab_quiz/:quizId',
                    templateUrl: '/public/views/partials/student/quiz.html?v'+window.currentJsVersion,
                    controller: 'VocabQuizController'
                });
            $stateProvider
                .state("quiz_list", {
                    url: '/quiz_list/:quizId',
                    templateUrl: '/public/views/partials/student/quiz_list.html',
                    controller: 'QuizListController'
                });


            $stateProvider
                .state("content", {
                    url: '/content/:contentId',
                    templateUrl: '/public/views/partials/student/content.html?v='+window.currentJsVersion,
                    controller: 'ContentController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("glossary", {
                    url: '/glossary/:contentId',
                    templateUrl: '/public/views/partials/student/content.html',
                    controller: 'ContentController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("scorm", {
                    url: '/scorm/:contentId',
                    templateUrl: '/public/views/partials/student/content.html',
                    controller: 'ContentController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("welcome", {
                    url: '/welcome/:contentId',
                    templateUrl: '/public/views/partials/student/content.html',
                    controller: 'ContentController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("picture", {
                    url: '/picture/:contentId',
                    templateUrl: '/public/views/partials/student/content.html?v='+window.currentJsVersion,
                    controller: 'ContentController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("user_info_form", {
                    url: '/user_info_form/:contentId',
                    templateUrl: '/public/views/partials/student/user_information.html',
                    controller: 'UserInformationController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("coursedescription", {
                    url: '/course_description/:contentId',
                    templateUrl: '/public/views/partials/student/coursedescription.html',
                    controller: 'CourseDescriptionController',
                    controllerAs: 'CC',
                    onExit: ['$rootScope','$stateParams' ,  function($rootScope,$stateParams){
                        $rootScope.beforeLeavePage.openModal($stateParams.contentId,$rootScope.user.id);

                    }]
                });
            $stateProvider
                .state("not_allowed", {
                    url: '/not_allowed',
                    templateUrl: '/public/views/partials/student/not_allowed.html',
                    controller: 'NotAllowedController'
                });

            $stateProvider
                .state("external_link", {
                    url: '/external_link/:externalLinkId',
                    templateUrl: '/public/views/partials/student/external_link.html',
                    controller: 'ExternalLinkController'
                });

            $stateProvider
                .state("notification", {
                    url: '/notification/',
                    templateUrl: '/public/views/partials/notification.html',
                    controller: 'NotificationMessagesController'
                });

            $stateProvider
                .state("notificationgradepost ", {
                    url: '/notificationgradepost/:gradePostId',
                    templateUrl: '/public/views/partials/notificationgradepost.html',
                    controller: 'NotificationGradePostMessagesController'
                });
            //$stateProvider
            //    .state("account", {
            //        url: '/:userId',
            //        templateUrl: '/public/views/account/content.html',
            //        controller: 'AccountController'
            //    });
            $stateProvider
                .state('singlepage', {
                    url: '/singlepage/:pageId',
                    templateUrl: '/public/views/singlepage/index.html',
                    controller: 'SinglePageController'
                });


            //gradebook

            $stateProvider
                .state('gradebook', {
                    url: '/gradebook',
                    views: {
                        'sidebar': {
                            templateUrl: '/public/views/gradebook/sidebar.html',
                            controller: 'GradebookSidebarController'
                        },
                        'content': {
                            template: '<ui-view></ui-view>'
                        }
                    }
                })
                .state('gradebook.gradebookByClassId', {
                    url: '/:classId',
                    templateUrl: '/public/views/gradebook/content.html?v='+window.currentJsVersion,
                    controller: 'GradebookContentController'
                });
            $stateProvider
                .state('inputAttendance',{
                    url: '/input'
                })
            //grader content

            $stateProvider
                .state("gradervocab", {
                    url: '/gradervocab/:vocabId',
                    templateUrl: '/public/views/partials/grader/gradervocab.html',
                    controller: 'GraderVocabController'
                });

            $stateProvider
                .state("gradertimed_review", {
                    url: '/gradertimed_review/:contentId',
                    templateUrl: '/public/views/partials/grader/gradercontenttimed.html',
                    controller: 'GraderContentTimedController'
                });
            $stateProvider
                .state("graderarchivetimed_review", {
                    url: '/graderarchivetimed_review/:contentId',
                    templateUrl: '/public/views/partials/grader/graderarchivetimed.html',
                    controller: 'GraderContentTimedController'
                });
            $stateProvider
                .state("gradercontent", {
                    url: '/gradercontent/:contentId',
                    templateUrl: '/public/views/partials/grader/gradercontent.html?v=' + window.currentJsVersion,
                    controller: 'GraderContentController'
                });
            $stateProvider
                .state("graderquiz", {
                    url: '/graderquiz/:contentId',
                    resolve: {
                        isArchive: function(){return false}
                    },
                    templateUrl: '/public/views/partials/grader/graderquiz.html',
                    controller: 'GraderQuizController'
                });
            $stateProvider
                .state("graderarchivequiz", {
                    url: '/graderarchivequiz/:contentId',
                    templateUrl: '/public/views/partials/grader/graderquiz.html',
                    resolve: {
                        isArchive: function(){return true}
                    },
                    controller: 'GraderQuizController'
                });
            $stateProvider
                .state("graderarchivesurvey", {
                    url: '/graderarchivesurvey/:contentId',
                    templateUrl: '/public/views/partials/grader/graderquiz.html',
                    resolve: {
                        isArchive: function(){return true}
                    },
                    controller: 'GraderQuizController'
                });
            $stateProvider
                .state("graderforum", {
                    url: '/graderforum/:contentId',
                    templateUrl: '/public/views/partials/grader/graderforum.html',
                    resolve: {
                        isArchive: function(){return false}
                    },
                    controller: 'ForumGraderController',
                    controllerAs:'graderVC'
                });
            $stateProvider
                .state("graderarchiveforum", {
                    url: '/graderarchiveforum/:contentId',
                    templateUrl: '/public/views/partials/grader/graderforum.html',
                    resolve: {
                        isArchive: function(){return true}
                    },
                    controller: 'ForumGraderController',
                    controllerAs:'graderVC'
                });
            $stateProvider
                .state("graderjournal", {
                    url: '/graderjournal/:contentId',
                    resolve: {
                        isArchive: function(){return false}
                    },
                    templateUrl: '/public/views/partials/grader/graderjournal.html',
                    controller: 'GraderJournalController'
                });
            $stateProvider
                .state("graderarchivejournal", {
                    url: '/graderarchivejournal/:contentId',
                    templateUrl: '/public/views/partials/grader/graderjournal.html',
                    resolve: {
                        isArchive: function(){return true}
                    },
                    controller: 'GraderJournalController'
                });
            $stateProvider
                .state("graderquiz_list", {
                    url: '/graderquiz_list/:contentId',
                    templateUrl: '/public/views/partials/grader/graderquiz.html',
                    resolve: {
                        isArchive: function(){return false}
                    },
                    controller: 'GraderQuizController'
                });
            $stateProvider
                .state("graderarchivequiz_list", {
                    url: '/graderarchivequiz_list/:contentId',
                    templateUrl: '/public/views/partials/grader/graderquiz.html',
                    resolve: {
                        isArchive: function(){return true}
                    },
                    controller: 'GraderQuizController'
                });

            $stateProvider
                .state("graderarchivecontent", {
                    url: '/graderarchivecontent/:contentId',
                    templateUrl: '/public/views/partials/grader/graderarchivecontent.html?v=' + window.currentJsVersion,
                    controller: 'GraderArchiveContentController'
                });

            $stateProvider
                .state("graderexternal_link", {
                    url: '/graderexternal_link/:externalLinkId',
                    templateUrl: '/public/views/partials/grader/graderexternal_link.html',
                    controller: 'GraderExternalLinkController'
                });

            $stateProvider
                .state("graderall", {
                    url: '/graderall/:courseId',
                    templateUrl: '/public/views/partials/grader/graderall.html',
                    controller: 'GraderContentController'
                });

            $stateProvider
                .state("graderarchive", {
                    url: '/graderarchive/:courseId',
                    templateUrl: '/public/views/partials/grader/graderarchive.html?v=' + window.currentJsVersion,
                    controller: 'GraderArchiveController'
                })


            // end grader content

            $stateProvider
                .state("profile", {
                    url: '/profile',
                    templateUrl: '/public/views/partials/editor/profile.html',
                    controller: 'TeacherInfoController'
                });
            $stateProvider
                .state("editsuperunit", {
                    url: '/editsuperunit/:unitId',
                    templateUrl: '/public/views/partials/editor/editsuperunit.html',
                    controller: 'EditSuperUnitController'
                });
            $stateProvider
                .state("addsuperunit", {
                    url: '/addsuperunit',
                    templateUrl: '/public/views/partials/editor/editsuperunit.html',
                    controller: 'EditSuperUnitController'
                });
            $stateProvider
                .state("editunit", {
                    url: '/editunit/:unitId',
                    templateUrl: '/public/views/partials/editor/editunit.html',
                    controller: 'EditUnitController'
                });

            $stateProvider
                .state("addunit", {
                    url: '/addunit/',
                    templateUrl: '/public/views/partials/editor/addunit.html?v='+window.currentJsVersion,
                    controller: 'AddUnitController'
                });

            $stateProvider
                .state("importcourse", {
                    url: '/importCourse/:courseId',
                    templateUrl: '/public/views/partials/editor/import/main.html',
                    controller: 'ImportCourseController'
                });
            $stateProvider
                .state("clonecourse", {
                    url: '/cloneCourse/:courseId',
                    templateUrl: '/public/views/partials/editor/import/clone.html',
                    controller: 'CloneCourseController'
                });
            $stateProvider
                .state("addcoursedescription", {
                    url: '/addcourse_description/:unitId',
                    templateUrl: '/public/views/partials/editor/coursedescription.html',
                    controller: 'EditCourseDescriptionController'
                });
            $stateProvider
                .state("editcoursedescription", {
                    url: '/editcourse_description/:contentId',
                    templateUrl: '/public/views/partials/editor/coursedescription.html',
                    controller: 'EditCourseDescriptionController'
                });
            $stateProvider
                .state("addcontent", {
                    url: '/addcontent/:unitId',
                    templateUrl: '/public/views/partials/editor/addcontent.html',
                    controller: 'AddContentController'
                });

            $stateProvider
                .state("edittimed_review", {
                    url: '/edittimed_review/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editforum", {
                    url: '/editforum/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editclass_summary", {
                    url: '/editclass_summary/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("editlesson_listening", {
                    url: '/editlesson_listening/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("editreading_practice", {
                    url: '/editreading_practice/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("editlistening_practice", {
                    url: '/editlistening_practice/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("editcontent", {
                    url: '/editcontent/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editjournal", {
                    url: '/editjournal/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editvocab", {
                    url: '/editvocab/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editquiz_list", {
                    url: '/editquiz_list/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("editquiz", {
                    url: '/editquiz/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editsurvey", {
                    url: '/editsurvey/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editvocab_quiz", {
                    url: '/editvocab_quiz/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("editexternal_link", {
                    url: '/editexternal_link/:contentId',
                    templateUrl: '/public/views/partials/editor/editexternal_link.html',
                    controller: 'EditExternalLinkController'
                });

            $stateProvider
                .state("editheader", {
                    url: '/editheader/:contentId',
                    templateUrl: '/public/views/partials/editor/editheader.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("edituser_info_form", {
                    url: '/edituser_info_form/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editpicture", {
                    url: '/editpicture/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editglossary", {
                    url: '/editglossary/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });
            $stateProvider
                .state("editscorm", {
                    url: '/editscorm/:contentId',
                    templateUrl: '/public/views/partials/editor/editcontent.html',
                    controller: 'EditContentController',
                    controllerAs: 'ec'
                });

            $stateProvider
                .state("superadmindash", {
                    url: '/superadmindash/',
                    templateUrl: '/public/views/partials/admin/superadmindash.html'
                });

            $stateProvider
                .state("viewcourseclassusers", {
                    url: '/viewcourseclassusers/:classId',
                    templateUrl: '/public/views/partials/admin/viewcourseclassusers.html',
                    controller: 'ViewCourseClassUsersController'
                });


            $stateProvider
                .state("addcourseclassuser", {
                    url: '/addcourseclassuser/:classId',
                    templateUrl: '/public/views/partials/admin/addcourseclassuser.html',
                    controller: 'AddCourseClassUserController',

                });

            $stateProvider
                .state("addgroupuser", {
                    url: '/addgroupuser/:classId/:groupId',
                    templateUrl: '/public/views/partials/admin/addcourseclassuser.html',
                    controller: 'AddCourseClassUserController'
                });
            $stateProvider
                .state("licenses", {
                    url: '/licenses/:org_id',
                    templateUrl: '/public/views/partials/admin/licenses.html',
                    controller: 'AdminLicensesController'
                });
            $stateProvider
                .state("enrollcourseclassuser", {
                    url: '/enrollcourseclassuser/:classId',
                    templateUrl: '/public/views/partials/admin/enrollcourseclassuser.html',
                    controller: 'EnrollCourseClassUserController'
                });
            $stateProvider
                .state("enrollcourseclassusermodal", {
                    views:{
                        'modalcontent@':{
                            templateUrl: '/public/views/partials/admin/enrollcourseclassuser.html',
                            controller: 'EnrollCourseClassUserController'
                        }
                    },
                    params: ['classId','isModal']

                });
            $stateProvider
                .state("enrollgroupuser", {
                    url: '/enrollgroupuser/:classId/:groupId',
                    templateUrl: '/public/views/partials/admin/enrollcourseclassuser.html',
                    controller: 'EnrollCourseClassUserController'
                });
            $stateProvider
                .state("enrollgroupusermodal", {
                    views:{
                        'modalcontent@':{
                            templateUrl: '/public/views/partials/admin/enrollcourseclassuser.html',
                            controller: 'EnrollCourseClassUserController'
                        }
                    },
                    params: ['classId','groupId','isModal']

                });


            $stateProvider
                .state("courseclasses", {
                    url: '/courseclasses/',
                    templateUrl: '/public/views/partials/admin/courseclasses.html',
                    controller: 'CourseClassController'
                });

            $stateProvider
                .state("addcourseclass", {
                    url: '/addcourseclass/:departmentId',
                    templateUrl: '/public/views/partials/admin/addcourseclass.html',
                    controller: 'AddCourseClassController'
                });
            $stateProvider
                .state("editcourseclass", {
                    url: '/editcourseclass/:classId',
                    templateUrl: '/public/views/partials/admin/editcourseclass.html?v='+window.currentJsVersion,
                    controller: 'EditCourseClassController'
                });
            $stateProvider
                .state("editcourseclassuser", {
                    url: '/editcourseclassuser/:classId/:userId',
                    templateUrl: '/public/views/partials/admin/editcourseclassuser.html',
                    controller: 'EditCourseClassUserController'
                });

            $stateProvider
                .state("editgroupuser", {
                    url: '/editgroupuser/:classId/:groupId/:userId',
                    templateUrl: '/public/views/partials/admin/editcourseclassuser.html',
                    controller: 'EditCourseClassUserController'
                });
            $stateProvider
                .state("organizationusers", {
                    url: '/organizationusers/',
                    templateUrl: '/public/views/partials/admin/organizationusers.html',
                    controller: 'OrganizationUsersController'
                });

            $stateProvider
                .state("addorganizationuser", {
                    url: '/addorganizationuser/',
                    templateUrl: '/public/views/partials/admin/addorganizationuser.html',
                    controller: 'AddOrganizationUsersController'
                });
            $stateProvider
                .state("editorganizationuser", {
                    url: '/editorganizationuser/:userId',
                    templateUrl: '/public/views/partials/admin/editorganizationuser.html?v='+window.currentJsVersion,
                    controller: 'EditOrganizationUsersController'
                });


            $stateProvider
                .state("addorganization", {
                    url: '/addorganization/',
                    templateUrl: '/public/views/partials/admin/addorganization.html',
                    controller: 'AddOrganizationController'
                });

            $stateProvider
                .state("editorganization", {
                    url: '/editorganization/:organizationId',
                    templateUrl: '/public/views/partials/admin/editorganization.html?v='+window.currentJsVersion,
                    controller: 'EditOrganizationController'
                });
            $stateProvider
                .state("adminexports", {
                    url: '/exports/:organizationId',
                    templateUrl: '/public/views/partials/admin/exports/exports.html?v='+window.currentJsVersion,
                    controller: 'AdminExportsController'
                });


            $stateProvider
                .state("editdepartment", {
                    url: '/editdepartment/:departmentId',
                    templateUrl: '/public/views/partials/admin/editdepartment.html',
                    controller: 'EditDepartmentController'
                });

            $stateProvider
                .state("editcourse", {
                    url: '/editcourse/:courseId',
                    templateUrl: '/public/views/partials/admin/editcourse.html',
                    controller: 'EditCourseController'
                });

            $stateProvider
                .state("adddepartment", {
                    url: '/adddepartment/',
                    templateUrl: '/public/views/partials/admin/adddepartment.html',
                    controller: 'AddDepartmentController'
                });

            $stateProvider
                .state("addcourse", {
                    url: '/addcourse/:departmentId',
                    templateUrl: '/public/views/partials/admin/addcourse.html',
                    controller: 'AddCourseController'
                });
            $stateProvider
                .state("addterm", {
                    url: '/addterm/',
                    templateUrl: '/public/views/partials/admin/addterm.html',
                    controller: 'AddTermController'
                });
            $stateProvider
                .state("editterm", {
                    url: '/editterm/:termId',
                    templateUrl: '/public/views/partials/admin/editterm.html',
                    controller: 'EditTermController'
                });

            $stateProvider
                .state("translations", {
                    url: '/translations/:languageId',
                    templateUrl: '/public/views/partials/admin/translations.html',
                    controller: 'TranslationsController'
                });

            $stateProvider
                .state("manageclasses", {
                    url: '/manageclasses/',
                    templateUrl: '/public/views/partials/admin/translations.html',
                    controller: 'ManageClassesController'
                });
            // $stateProvider
            //     .state("dashboard_old", {
            //         url: '/:classId',
            //         views:{
            //             'dashboard-content':{
            //                 template: '<div test-dashboard></div>'
            //             }
            //         }
            //
            //     });
            $stateProvider
                .state("test_details", {
                    url: '/test/:studentId/:classId',
                    views: {
                        'dashboard-content': {
                            template: '<div test-dashboard-details></div>'
                        }
                    }
                });
            $stateProvider
                .state("home",{
                    url:'/home',
                    template:'<ui-view />'
                });
            $stateProvider
                .state("home.no_tabs",{
                    templateUrl:'/public/views/splash/home-no-tabs.html?v= ' + window.currentJsVersion
                });
            $stateProvider
                .state("home.with_tabs",{
                    templateUrl:'/public/views/splash/home-with-tabs.html'
                });
            $stateProvider
                .state("home.no_tabs.dashboard",{
                   url:'/1/dashboard',
                   template:'<div class="test-dashboard-container"><div ui-view="dashboard-content"' +
                   ' class="test-dashboard"></div></div>'
                });
            $stateProvider
                .state("home.no_tabs.dashboard.summary", {
                    url: '/:classId',
                    views:{
                        'dashboard-content':{
                            template: '<div test-dashboard></div>'
                        }
                    }

                });

            $stateProvider
                .state("home.with_tabs.dashboard",{
                   url:'/2/dashboard',
                   template:'<div class="test-dashboard-container"><div ui-view="dashboard-content"' +
                   ' class="test-dashboard"></div></div>'
                });
            $stateProvider
                .state("home.with_tabs.dashboard.summary", {
                    url: '/:classId',
                    views:{
                        'dashboard-content':{
                            template: '<div test-dashboard></div>'
                        }
                    }

                });


            function proficiencyDashboardStates(type){
                var uppercase = type.toUpperCase(),
                    lowercase = type.toLowerCase();
                $stateProvider.state("home.with_tabs."+lowercase+"_dashboard", {
                    url: '/2/'+lowercase+'-dashboard',
                    template:'<div class="flat-dashboard-container" ' +
                    '><div class="hide-menu-icon"><div class="collapsed btn btn-xs btn-default" ng-show="$root.windowWidth<768" ng-click="vc_dash.toggleSidebar()">'+
                    '<span class="fa fa-list-ul" style="cursor:pointer; font-size: 20px;"> </span>'+
                    '</div></div><div ng-hide="vc_dash.sidebarCollapsed" ng-click="vc_dash.toggleSidebar()" class="emptydiv"></div>' +
                    '<div ui-view="sidebar"/></div>',
                    controller:uppercase + 'DashboardController',
                    controllerAs:'vc_dash'
                });
                $stateProvider.state("home.with_tabs."+lowercase+"_dashboard.nav",  {
                    url: '/:classId',
                    views: {
                        sidebar:{
                            controller:uppercase + 'SidebarController',
                            controllerAs:'vc_sidebar',
                            templateUrl:'/public/views/j1-dashboard/sidebar.html?v='+window.currentJsVersion
                        }
                    }
                });
                $stateProvider.state("home.with_tabs."+lowercase+"_dashboard.nav.applicant", {
                    url: '/applicant/:studentId',
                    views: {
                        content:{
                            controller:uppercase + 'ContentController',
                            controllerAs:'vc_content',
                            templateUrl:'/public/views/'+lowercase+'-dashboard/content.html'
                        }
                    }
                });

                $stateProvider.state("home.no_tabs."+lowercase+"_dashboard", {
                    url: '/1/'+lowercase+'-dashboard',
                    template:'<div class="flat-dashboard-container" ' +
                    '><div ui-view="sidebar"/></div>',
                    controller:uppercase + 'DashboardController',
                    controllerAs:'vc_dash'
                });
                $stateProvider.state("home.no_tabs."+lowercase+"_dashboard.nav",  {
                    url: '/:classId',
                    views: {
                        sidebar:{
                            controller:uppercase + 'SidebarController',
                            controllerAs:'vc_sidebar',
                            templateUrl:'/public/views/j1-dashboard/sidebar.html'
                        }
                    }
                });
                $stateProvider.state("home.no_tabs."+lowercase+"_dashboard.nav.applicant", {
                    url: '/applicant/:studentId',
                    views: {
                        content:{
                            controller:uppercase + 'ContentController',
                            controllerAs:'vc_content',
                            templateUrl:'/public/views/'+lowercase+'-dashboard/content.html'
                        }
                    }
                });
            }
            proficiencyDashboardStates('j1');
            proficiencyDashboardStates('e3pt');
            $stateProvider.state("home.with_tabs.compliance", {
                url: '/2/compliance',
                template:'<div class="flat-dashboard-container with-tabs compliance" ' +
                '><div class="hide-menu-icon"><div class="collapsed btn btn-xs btn-default" ng-show="$root.windowWidth<768" ng-click="vc_dash.toggleSidebar()">'+
                '<span class="fa fa-list-ul" style="cursor:pointer; font-size: 20px;"> </span>'+
                '</div></div><div ng-hide="vc_dash.sidebarCollapsed" ng-click="vc_dash.toggleSidebar()" class="emptydiv"></div>' +
                '<div ui-view="sidebar"/></div>',
                controller:'ComplianceDashboardController',
                controllerAs:'vc_dash'
            });
            $stateProvider.state("home.with_tabs.compliance.users_nav",  {
                url: '/users',
                views: {
                    sidebar:{
                        controller:'ComplianceUsersSidebarController',
                        controllerAs:'vc_sidebar',
                        templateUrl:'/public/views/compliance/sidebar.html?v='+window.currentJsVersion
                    }
                }
            });
            $stateProvider.state("home.with_tabs.compliance.classes_nav",  {
                url: '/classes',
                views: {
                    sidebar:{
                        controller:'ComplianceClassesSidebarController',
                        controllerAs:'vc_sidebar',
                        templateUrl:'/public/views/compliance/sidebar.html?v='+window.currentJsVersion
                    }
                }
            });

            $stateProvider.state("home.with_tabs.compliance.users_nav.user", {
                url: '/:id',
                views: {
                    content:{
                        controller:'ComplianceUsersContentController',
                        controllerAs:'vc_content',
                        templateUrl:'/public/views/compliance/content.html'
                    }
                }
            });
            $stateProvider.state("home.with_tabs.compliance.classes_nav.class", {
                url: '/:id',
                views: {
                    content:{
                        controller:'ComplianceClassesContentController',
                        controllerAs:'vc_content',
                        templateUrl:'/public/views/compliance/content.html'
                    }
                }
            });



        }
    ]);

    /* Keyboard Events (jQuery) */

    /*$(document).keydown(function(e) {
     if (e.keyCode == 38 || e.keyCode == 40) {
     $('.flip .card').toggleClass('flipped');
     $('.flip .card .back').toggleClass('flipped');
     }
     if (e.keyCode == 37 || e.keyCode == 39) {
     $('.flip .card').toggleClass('flipped');
     $('.flip .card .back').toggleClass('flipped');
     }
     });/

     /* Enable Bootstrap Buttons */

    $('.btn').button();

}
