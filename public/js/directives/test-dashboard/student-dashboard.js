'use strict';
(function(angular){
    var ClassesToHideSubmitButton = [1066];
    angular.module('app').directive('testStudentDashboard',['ProficiencyTestService','CurrentCourseId','$modal',function(ProficiencyTestService,CurrentCourseId,$modal){
        return{
            restrict:'A',
            template:'<div ng-include="getContentUrl()"></div>',
            link:function(scope){
                scope.getContentUrl = function(){
                    if(DASHBOARD_STATUS.proficiency['j1-available'])
                        return '/public/views/j1-dashboard/student-j1-dashboard.html';
                    else
                        return '/public/views/directives/test-dashboard/student-dashboard.html';
                };
                ProficiencyTestService.all({studentId:'me'}).$promise.then(init)
                function init(tests){
                    if(!tests.length) return;
                    scope.highestTest = getHighestScore(tests);
                    scope.studentName = tests[0].name;
                    scope.pageGroups = tests[0].pageGroups;
                    scope.email = tests[0].email;
                    scope.isJ1 = tests[0].isJ1;

                    for(var i = 0;i<tests.length;i++){
                        if(tests[i].studentId === scope.$root.user.id)
                            scope.practiceTest = tests[i].practiceTest;
                    }

                    scope.tests = prepareTests(tests);
                    prepareTestAgainButton();

                    setScoreColumnWidth()
                }
                function prepareTests(tests){
                    tests.forEach(function(t){
                        t.submittedOn = moment(t.submittedOn).format('MMMM DD, YYYY')
                    })
                    return tests;
                }
                function prepareTestAgainButton(){

                    var lastTest = getLastTest(scope.tests);
                    scope.testAgain = {text:'Test Again','display':true};
                    scope.testAgainUrl='/signout?redirect='+window.COMMERCIAL_SITE_URL + lastTest.commercialUrl
                    scope.eslURL=window.COMMERCIAL_SITE_URL + '/english-courses.php';
                    scope.feedbackUrl=window.COMMERCIAL_SITE_URL + '/studentCheckout.php?buy=E3PTPF';
                    if(!lastTest) {
                        scope.testAgain.display = false;
                        return;g
                    }
                    if(lastTest.commercialUrl){
                        scope.testAgain.action='redirects';
                        scope.testAgain.url='/signout?redirect='+window.COMMERCIAL_SITE_URL + lastTest.commercialUrl + '?new_attempt=true';

                    }
                    if(lastTest.hasStarted && !lastTest.finishedGradeClass && !lastTest.hasFinishedSubmitting){
                        scope.testAgain.text = 'Resume Test'
                        scope.testAgain.action = 'go_to_course'

                    }else if(!lastTest.hasStarted && !lastTest.hasFinishedSubmitting){
                        scope.testAgain.text = scope.isJ1?'Start Interview':'Start Test';
                        scope.testAgain.action = 'go_to_course'
                    }
                    scope.lastTest = lastTest;
                }
                scope.showStartTest = function(){
                    return scope.testAgain && (scope.testAgain.display && !scope.isJ1 || (!scope.lastTest.hasStarted && !scope.$root.user.hasOnlyProficiencyClasses))
                }
                function getLastTest(tests){
                    var t = _.sortBy(tests,function(test){
                        var date = test.submittedOn?moment(test.submittedOn):moment()
                        return -1*date.format('X');
                    });
                    if(t)
                        return t[0];
                }
                function getHighestScore(tests){
                    var highestScoreTest = null;
                    _.forEach(tests,function(t){
                        if(!highestScoreTest || t.actualTotalScore>highestScoreTest.actualTotalScore)
                            highestScoreTest = t;
                    })
                    return highestScoreTest
                }
                scope.viewReport = function(){
                    $modal.open({
                        template:'<a class="btn btn-xs btn-info download" ng-href="/e3pt-report?userid={{studentId}}&classid={{testId}}" download >Download</a><span class="fa fa-close" ng-click="cancel()"></span><proficiency-test-report class="padding-10" cancel="cancel" student-id="studentId" test-id="testId"></proficiency-test-report>',
                        controller:['$modalInstance','$scope',function($modalInstance,$scope){
                            $scope.cancel = $modalInstance.dismiss;
                            $scope.testId = scope.highestTest.classId
                            $scope.studentId = scope.highestTest.id

                        }],
                        windowClass:'modal-flat test-report',
                    })
                };
                scope.orderStudents = new OrderStudents();
                function setScoreColumnWidth(){
                    var STATIC_COLUMNS_COUNT = 3,
                        DYNAMIC_COLUMNS_COUNT =scope.pageGroups.length;
                    scope.scoreColumnWidth = (DYNAMIC_COLUMNS_COUNT*100/(DYNAMIC_COLUMNS_COUNT + STATIC_COLUMNS_COUNT))/DYNAMIC_COLUMNS_COUNT + '%';
                }

                scope.testAgainBtnClicked = function(){
                    if(scope.testAgain.action=='go_to_course'){
                        var courseId = scope.lastTest.courseId;
                        if(scope.lastTest.groupId){
                            courseId+='-'+scope.lastTest.groupId;
                        }
                        CurrentCourseId.setCourseId(courseId);
                        window.location.href = '/';
                    }
                }
                scope.startPracticeInterview =function(){
                    var courseId = scope.practiceTest.courseId;
                    if(scope.practiceTest.groupId){
                        courseId+='-'+scope.practiceTest.groupId;
                    }
                    CurrentCourseId.setCourseId(courseId);
                    window.location.href = '/';
                }
                scope.hideSubmitButton = function(test){
                    return ClassesToHideSubmitButton.indexOf(test.classId)>=0
                }

                scope.openSubmitModal = function(test){
                    if(!test.finishedGradeClass || !test.pageGroups.length){
                        toastr.danger('You need to complete the test and receive a grade before you can submit it to a school.');
                        return
                    }
                    $modal.open({
                        template:"<div test-submit-to-school user-id='userId' class-id='classId' cancel='cancel'></div>",
                        controller:['$scope','data','$modalInstance',function($scope,data,$modalInstance){
                            $scope.userId = data.userId;
                            $scope.classId = data.classId;
                            $scope.cancel = $modalInstance.dismiss
                        }],
                        resolve:{
                            data:function(){
                                return{
                                    userId:test.id,
                                    classId:test.classId
                                }
                            }
                        },
                        windowClass:'submit-to-school-modal modal-flat'
                    })
                }
            }
        }
    }]);
    function OrderStudents(){
        this.selected = 'name'
        this.orderBy = function(by){
            if(by==this.selected)
                this.selected='-'+this.selected;
            else
                this.selected =by;
        }
    }
}(angular))
