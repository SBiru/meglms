"use strict";

(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch (err) {
        app = angular.module('app');
    }
app.controller('ModalMoveBankController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'utils', '$sce',
    function($rootScope, $scope, $modal, $state, nav, utils, $sce) {

        if ($scope.bank) {
            $scope.test = $scope.bank;
        }

        $scope.open = function(question) {

            var modalInstance = $modal.open({
                templateUrl: 'move.bank.modal.html',
                controller: 'ModalMoveBankInstanceController',
                resolve: {
                    //Golabs add in our question to the global options in the ModalCreateQuestionInstanceController
                    //singlequestion is our question object all we need
                    question: function() {
                        return question.singlequestion;
                    },
                    bankortest: function() {
                        if ($scope.test)
                            return 'test';
                        return 'bank';
                    }
                }
            });
            modalInstance.result.then(function(response) {
                if ($scope.bank) {
                    var t = utils.findById(nav.data.banks, response.new_bank_id);
                    if (t && t.count) {
                        t.count = parseInt(t.count) + 1;
                    }
                    var bank = utils.findById(nav.allBanks, response.new_bank_id);
                    if (bank) {
                        bank.titleCounter = bank.title + ' (' + t.count + ')';
                        bank.count = t.count
                    }

                    t = utils.findById(nav.data.banks, response.old_bank_id);
                    if (t && t.count) {
                        t.count = parseInt(t.count) - 1
                    }

                    bank = utils.findById(nav.allBanks, response.old_bank_id);
                    if (bank) {
                        bank.titleCounter = bank.title + ' (' + t.count + ')';
                        bank.count = t.count
                    }
                }

                if ($scope.bank && $scope.bank.questions) {
                    var tmp = [];
                    for (var i = 0; i < $scope.bank.questions.length; i++) {
                        if (parseInt($scope.bank.questions[i].id) !== parseInt(response.question_id)) {
                            tmp.push($scope.bank.questions[i]);
                        }
                    }
                    $scope.bank.questions = tmp;
                    // $scope.test.questions.push(response.question);
                    $scope.bank.count = $scope.bank.questions.length;
                }
            });

        };

        $scope.checkboxclicked = function(id) {
            $scope.selectedQuestions.push(id);
        }
    }
])





    /*
     Golabs 02/06/2015:
     Allows a user to move questions to different banks.
     */
    .controller('ModalMoveBankInstanceController', ['$rootScope', '$scope', '$modal', '$modalInstance', 'TestbankQuestionService', 'question', '$sce', '$location', 'nav', 'bankortest',
        function($rootScope, $scope, $modal, $modalInstance, TestbankQuestionService, question, $sce, $location, nav, bankortest) {
            $scope.question = question;
            $scope.nav = nav;

            angular.forEach(nav.allBanks, function(bank, key) {
                bank.titleCounter = bank.title + ' (' + bank.count + ')';
            })
            $scope.allBanks = nav.allBanks;

            $scope.detectNewBankSelect = function() {
                $scope.moveTobankid = $scope.values.bank_id;
                $scope.Currentquestionid = $scope.question.id;
                $scope.ok_Move()

            }

            $scope.ok_Move = function() {
                var data = {
                    'Currentquestionid': $scope.Currentquestionid
                }
                TestbankQuestionService.movequestion($scope.moveTobankid, data)
                    .success(function(response) {
                        if (response.error) {
                            $scope.cancel();
                            alert(response.error);
                        } else {
                            $modalInstance.close(response)
                            //$scope.cancel();
                        }
                    })
                    .error(function(error) {
                        console.log(error);
                    });
            }

            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ])
}());