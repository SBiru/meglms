"use strict";

(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch (err) {
        app = angular.module('app');
    }
    app.controller('ModalDeleteQuestionController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'utils', '$sce',
        function ($rootScope, $scope, $modal, $state, nav, utils, $sce) {
            $scope.open = function (question) {

                var modalInstance = $modal.open({
                    templateUrl: '/public/views/directives/quiz-editor/modals/question.delete.modal.html',
                    controller: 'ModalDeleteQuestionInstanceController',
                    resolve: {
                        //Golabs add in our question to the global options in the ModalCreateQuestionInstanceController
                        //singlequestion is our question object all we need
                        question: function () {
                            return question.singlequestion;
                        },
                        bankortest: function () {
                            if ($scope.test)
                                return 'test';
                            return 'bank';
                        }
                    }
                });
                modalInstance.result.then(function (response) {
                    // find the test by id and increment the count
                    $scope.$root.$emit('questionWasDeleted',response);
                    if ($scope.test && nav.allTests) {
                        var t = utils.findById(nav.allTests, $scope.test.id);
                        if (t && t.count)
                            t.count--;
                    }

                    if ($scope.bank) {
                        var t = utils.findById(nav.allBanks, $scope.bank.id);
                        if (t && t.count)
                            t.count--;
                    }

                    if ($scope.bank && $scope.bank.questions) {
                        var tmp = [];
                        for (var i = 0; i < $scope.bank.questions.length; i++) {
                            if (parseInt($scope.bank.questions[i].id) != parseInt(response)) {
                                tmp.push($scope.bank.questions[i])
                            }
                        }
                        $scope.bank.questions = tmp;
                        $scope.bank.count = $scope.bank.questions.length;
                    }

                    if ($scope.test && $scope.test.questions) {
                        var tmpq = new Array();
                        var deletedId = $scope.question.id || $scope.question.quiz_question_id;
                        for (var i = 0; i < $scope.test.questions.length; i++) {
                            var questionId = $scope.test.questions[i].id || $scope.test.questions[i].quiz_question_id
                            if (questionId !== deletedId) {
                                tmpq.push($scope.test.questions[i])
                            }
                        }
                        $scope.test.questions = tmpq;
                        $scope.$root.test_questions = $scope.test.questions;
                        // $scope.test.questions.push(response.question);
                        $scope.test.count = $scope.test.questions.length;
                    }
                });

            };

            $scope.checkboxclicked = function (id) {
                $scope.selectedQuestions.push(id);
            }
        }
    ])
    .controller('ModalDeleteQuestionInstanceController', ['$rootScope', '$scope', '$modal', '$modalInstance', 'TestbankQuestionService', 'question', '$sce', '$location', 'nav', 'bankortest',
            function($rootScope, $scope, $modal, $modalInstance, TestbankQuestionService, question, $sce, $location, nav, bankortest) {

                $scope.question = question;
                $scope.question.bankortest = bankortest
                $scope.question.htmlSafeprompt = $sce.trustAsHtml($scope.question.prompt);
                $scope.error = null;
                $scope.question.url = $location.$$path;
                $scope.ok_Delete = function() {
                    TestbankQuestionService.delete($scope.question.id || $scope.question.quiz_question_id, $scope.question)
                        .success(function(response) {
                            if (response.error) {
                                $scope.error = response.error;
                            } else {
                                $modalInstance.close(response);
                            }
                        })
                        .error(function(error) {
                            console.log(error);
                        });
                };
                $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                };

            }
        ])
}());