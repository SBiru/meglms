"use strict";

(function () {
var app;
try {
    app = angular.module('app.testbank');
}
catch(err) {
    app = angular.module('app');
}
app
    /*
     Golabs 15/01/2015:
     When a user clicks on Select Questions from Banks this is the modal contoler we
     we will present to the user the banks that they can choose from with the ability to click on a name
     When a name of a bank is clicked this will then display a list of questions to choose that can be added to
     The Quiz
     */
    .controller('ModalSelectQuestionsBanksController', ['$rootScope', '$scope', '$modal', '$state', '$sce', 'nav', 'utils', 'TestbankQuestionService', 'SelectedQuestions','WordmatchingUtil',
        function($rootScope, $scope, $modal, $state, $sce, nav, utils, TestbankQuestionService, SelectedQuestions,WordmatchingUtil) {

            //$scope.course = nav.selected_course;
            if(!$scope.course){
                $scope.course = {id:$scope.$root.currentCourseID}
            }
            function init(){
                $scope.open = function(from,test) {
                    if(test)
                        $scope.test = test;
                    //Resetting our selected question
                    SelectedQuestions.reset();

                    var modalInstance = $modal.open({
                        templateUrl: '/public/views/directives/quiz-editor/modals/question.frombanks.modal.html',
                        controller: 'ModalQuestionInstanceInstanceController',
                        resolve: {
                            course: function() {
                                return nav.selected_course;
                            },
                            from: function() {
                                return from;
                            },
                            parent_title: function() {
                                if (typeof $scope.test === 'undefined')
                                    return;
                                if (typeof $scope.test.title !== 'undefined')
                                    return $scope.test.title;
                            },
                            bank: function() {
                                if (from == 'selectQuestions') {
                                    return nav.allBanks[0];
                                } else if (from == 'randomQuestions') {
                                    return nav.allBanks[0];
                                } else if (from == 'randomGroupQuestions') {
                                    return nav.allBanks[0];
                                }
                            },
                            default_values: function() {
                                if (from == 'bank')
                                    return {
                                        bank_id: $scope.bank.id,
                                        objective_id: $scope.data.original_objective_id,
                                        selection: from
                                    }

                                if (typeof $scope.test.id !== 'undefined')
                                    return {
                                        test_id: $scope.test.id,
                                        selection: from
                                    }
                                return {};
                            }
                        }
                    });

                    //Our placedquestions are set when the modal is closed.
                    modalInstance.result.then(function(response) {
                        if(response.questions){
                            response.questions.forEach(function(question){
                                if(question.type=='wordmatching')
                                    WordmatchingUtil.prepareForDisplayEditor(question);
                            })
                        }

                        /*
                         Golabs we have created our random response
                         now we select it and load it left hanb panel

                         */
                        if (typeof response.random !== "number") {
                            // find the test by id and increment the count
                            if (response.test_id && nav.allTests) {
                                var t = utils.findById(nav.allTests, response.test_id);
                                if (t && t.count)
                                    t.count++;
                            }

                            // find the bank by id and increment the count
                            if (response.bank_id && nav.selected_course && nav.selected_course.banks) {
                                var b = utils.findById(nav.selected_course.banks, response.bank_id);
                                if (b && b.count)
                                    b.count++;
                            }

                            /*
                             Golabs 10/02/2015
                             We will test for placedquestions and if so
                             We will do a count of them and change the left side counter
                             We will also replace the $scope.test.questions array with the
                             returned questions.

                             */
                            if (typeof response.placedquestions !== 'undefined') {
                                if(nav.allTests){
                                    if (typeof response.utils !== 'undefined') {
                                        var t = response.utils.findById(nav.allTests, response.test_id);
                                    } else {
                                        var t = utils.findById(nav.allTests, response.test_id);
                                    }
                                    t.count = response.questions.length;
                                }

                                /*
                                 Golabs 28/02/2015
                                 Cateting for random....
                                 */
                                if (response.test.qtype === "random") {
                                    $scope.test.random = response.test.random;
                                    for (var i = 0; i < response.questions.length; i++) {
                                        if (!response.questions[i].id) {
                                            response.questions[i].type = "Random";
                                            response.questions[i].prompt = "From : '" + response.questions[i].bankName + "' Bank Randomised by " + response.questions[i].random + ' of ' + response.questions[i].totalBankQuestions
                                            response.questions[i].htmlSafeprompt = $sce.trustAsHtml(response.questions[i].prompt);
                                        }
                                    }
                                }

                                $scope.test.questions = response.questions;
                                $scope.$root.test_questions = $scope.test.questions;
                                $scope.test.count = response.questions.length;
                                for (var i = 0; i < $scope.test.questions.length; i++) {
                                    $scope.test.questions[i].htmlSafeprompt = $sce.trustAsHtml($scope.test.questions[i].prompt);
                                }
                                //Golabs 27/02/2015 We are adding count to our tests for the left side counter
                                if(nav.data && nav.data.tests)
                                    utils.findById(nav.data.tests, response.test_id)['count'] = $scope.test.count;

                                return;
                            }
                            // @TODO: use myArray.sort(utils.keySort)
                            if (response.question) {
                                if ($scope.bank && $scope.bank.questions) {
                                    $scope.bank.questions.push(response.question);
                                    $scope.bank.count = $scope.bank.questions.length;
                                }
                                if ($scope.test && $scope.test.questions) {
                                    $scope.test.questions.push(response.question);
                                    $scope.test.count = $scope.test.questions.length;
                                }
                            }
                        } else {
                            /*
                             Golabs 27/02/2015
                             Pushing new random test to and of data for left hand display
                             */
                            nav.data.tests.push(response.test);
                            // change state to the newly created test
                            /*
                             Golabs.com 27/02/2015
                             Changing state so that new test is hightlighted.
                             */
                            $state.go('tests.detail', {
                                testId: response.test.id
                            });
                        }

                    }, function() {
                        console.log('Modal closed');
                        if (typeof nav.closetype !== 'undefined') {
                            $scope.open(nav.closetype);
                            delete nav.closetype;
                        }
                        // nothing to do if closed without a valid submit
                    });
                };
            }
            if(nav.allBanks)
                init()
            else
                nav.loadBanks(init);

        }
    ])

    /*
     Golabs 15/01/2015:
     This is used to control and display the modal window for the user to see the banks avalaible.
     The user will be able to click a bank and then show the questions in the bank.
     The Quiz
     */
    .controller('ModalQuestionInstanceInstanceController', ['$rootScope', '$scope', '$state', 'nav', '$modal', '$modalInstance', 'course', 'from', 'parent_title', 'default_values', 'TestbankQuestionService', 'bank', 'SelectedQuestions', 'TestbankTestService', '$sce', 'utils', 'TestbankBankService',
        function($rootScope, $scope, $state, nav, $modal, $modalInstance, course, from, parent_title, default_values, TestbankQuestionService, bank, SelectedQuestions, TestbankTestService, $sce, utils, TestbankBankService) {

            /*
             Golabs 11/02/2015
             If we have a random slection for user we do not want to
             dislay any question initially.
             */

            if (default_values.selection === 'randomQuestions') {
                $scope.randeomquestion = [];
                //$scope.bank.questionsRandom = course.tests
            }
            if (default_values.selection === 'randomGroupQuestions') {
                $scope.randeomquestion = [];
                //$scope.bank.questionsRandom = course.tests
            }
            if(course)
                $scope.course = course;
            else
                $scope.course = {id:$scope.$root.currentCourseID}
            $scope.from = from;
            $scope.values = default_values;
            $scope.parent_title = parent_title;
            $scope.error = null;
            $scope.selectedQuestions = [];
            $scope.test_id = default_values.test_id
            $scope.data = {};
            $scope.filterEmptyBanks = filterEmptyBanks;

            function filterEmptyBanks(bank) {
                return bank.count > 0;
            }
            /*
             Golabs 10/02/2015
             Checking and selecting bank question information to see if a question is selected.
             */
            var isQuestionSelected = function() {
                var selectedQuestions = SelectedQuestions.get();
                for (var i = 0; i < $scope.bank.questions.length; i++) {
                    if (typeof selectedQuestions[$scope.bank.questions[i].id] !== 'undefined') {
                        $scope.bank.questions[i].selected = 1;
                    }
                }
            }

            /*
             Golabs 11/02/2015
             We will take our qty of question fo make random
             The rndtmp array is used to make sure we do not
             choose the same question twice.
             */
            var selectedrandom = function(qty) {
                var rndtmp = [];
                SelectedQuestions.reset();
                $scope.bank.questionsRandom = [];
                for (var i = 0; i < $scope.bank.questions.length; i++) {
                    rndtmp.push($scope.bank.questions[i]);
                }

                for (var i = 0; i < qty; i++) {
                    var key = Math.floor(Math.random() * rndtmp.length);
                    if (typeof rndtmp[key] === 'undefined')
                        break;
                    rndtmp[key].selected = 1;
                    SelectedQuestions.set(rndtmp[key]);
                    $scope.bank.questionsRandom.push(rndtmp[key]);
                    rndtmp.splice(key, 1);
                }
            }
            /*
             Golabs 11/02/2015
             We are going to watch our values.counter for our select "Random Number"
             This is so a user can choose a random number of questions from a bank.
             */
            $scope.$watch(
                "values.counter",
                function(newValue, oldValue) {
                    if (typeof newValue === 'undefined') {
                        return
                    }
                    if (newValue === '?') {
                        newValue = Math.floor((Math.random() * $scope.course.tests.length)) + 1;
                        $scope.values.counter = newValue
                    } else
                        selectedrandom(parseInt(newValue));
                    return;
                }
            );
            //Checking for questions that have already been added to the test
            function questionsFilter(bank) {
                var temp = [];
                for (var i = 0; i < bank.questions.length; i++) {
                    if (!_.findWhere($scope.$root.test_questions, {
                            id: bank.questions[i].id
                        })) {
                        temp.push(bank.questions[i])
                    } else {
                        if (!$scope.hasUsedQuestions)
                            $scope.hasUsedQuestions = true;
                    }
                }

                return temp;
            }
            /*
             Golabs 09/02/2015
             We are going to out and get our list of questions associated with the bank.
             */
            var bankdetails = function(id) {
                TestbankQuestionService.bankdetails(id)
                    .success(function(response) {
                        if (response.error) {
                            $scope.error = response.error;

                        } else {
                            $scope.hasUsedQuestions = false;
                            response.questions = questionsFilter(response);
                            $scope.bank = response;

                            /*
                             Golabs creating a simple opttions list.
                             */
                            $scope.bank.dropDownoptions = [];
                            if ($scope.bank.questions) {
                                for (var i = 1; i <= $scope.bank.questions.length; i++) {
                                    /*
                                     if ((i < $scope.bank.questions.length) && (i <= 5)) {
                                     $scope.bank.dropDownoptions.push(i);
                                     }
                                     else if ((i < $scope.bank.questions.length) && (i === 15) || (i === 25)) {
                                     $scope.bank.dropDownoptions.push(i);
                                     }
                                     else if ((i < $scope.bank.questions.length) && (i % 10 == 0)) {
                                     $scope.bank.dropDownoptions.push(i);
                                     }
                                     */
                                    if (i > 50) {
                                        break
                                    }
                                    $scope.bank.dropDownoptions.push(i);
                                }
                                // $scope.bank.dropDownoptions.push($scope.bank.questions.length);

                                for (var i = 0; i < $scope.bank.questions.length; i++) {
                                    $scope.bank.questions[i].htmlSafeprompt = $sce.trustAsHtml($scope.bank.questions[i].prompt);
                                }
                                if (($scope.from === "randomQuestions") || ($scope.from === "randomGroupQuestions")) {
                                    if (typeof $scope.values.counter === 'undefined') {
                                        selectedrandom(1);
                                        $scope.values.counter = '1';
                                    } else {
                                        selectedrandom(parseInt($scope.values.counter));
                                    }
                                }
                                isQuestionSelected();
                            }

                        }
                    })
                    .error(function(error) {
                        console.log(error);
                    });
            }

            /*
             Golabs 09/02/2015
             Our bank has been selected from the selection dropdown
             we will now grab the questions associated with the back
             */
            $scope.selectbank = function() {

                if ((angular.isDefined($scope.values)) && (angular.isDefined($scope.values.bank_id))) {
                    SelectedQuestions.reset();
                    if ($scope.values.selection === "randomQuestions") {
                        delete $scope.values.counter;
                    }
                    if ($scope.values.selection === "randomGroupQuestions") {
                        delete $scope.values.counter;
                    }
                    bankdetails($scope.values.bank_id);
                }
            }
            /*
             Golabs 10/02/2015
             We are simply returning the window height so we can set
             the modal model window overflow
             */
            $scope.modallistoverflow = function() {
                if ($scope.values.selection !== "randomGroupQuestions") {
                    return "height:" + TestbankQuestionService.getHeight() * .4 + "px";
                }
            }
            //Golabs setting all banks
            if (angular.isDefined(nav.allBanks)) {
                if (!angular.isDefined($scope.allBanks)) {
                    /*
                     Golabs 28/05/2015
                     Adding in title and counter
                     */
                    angular.forEach(nav.allBanks, function(bank, key) {
                        bank.titleCounter = bank.title + ' (' + bank.count + ')';
                    })
                    $scope.allBanks = nav.allBanks;
                    $scope.values.bank_id = null;
                }
            }
            /*
             Golabs 10/02.2015
             We are going to set get and set our default bank questions
             We have grabed our default bank from our modal modalInstance on the midal open fireing.
             */
            if (bank && typeof bank.id !== 'undefined') {
                bankdetails(bank.id);
            }

            /*
             Golabs 10/02/2015
             We may need this if we want to set the system so the questions move to another bank
             There will be a bit of fiddling to do if this is the case!
             */
            // if the user selects "Add new Bank" option in the bank selector for CreateQuestion
            $scope.detectNewBankSelect = function() {
                if ($scope.values.bank_id == 0) {
                    // open new AddBankContent modal within a modal
                    var modalInstance = $modal.open({
                        templateUrl: 'banks.add.modal.html',
                        controller: 'ModalAddBankInstanceController',
                        size: null,
                        resolve: {
                            course: function() {
                                return $scope.course;
                            }
                        }
                    });

                    modalInstance.result.then(function(response) {
                        // @TODO: use myArray.sort(utils.keySort)
                        course.banks.push(response.bank);
                        $scope.values.bank_id = response.bank.id;
                        // bring back the objective_id (if it's zero/"None" don't change anything)
                        if (response.bank.default_objective_id > 0) {
                            $scope.values.objective_id = response.bank.default_objective_id;
                        }

                    }, function() {

                        // if closed without createing a bank, then reset the bank selector on the underlying page
                        $scope.values.bank_id = null;
                    });

                }
            }

            $scope.ok = function() {
                // convert to options to json array
                var options = [];
                angular.forEach($scope.values.options, function(value, key) {
                    this.push(value);
                }, options);

                // add the simplified array to the value list to be submitted
                $scope.values.options_array = options;

                TestbankQuestionService.createFor($scope.course.id, $scope.values)
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

            $scope.cancel = function(type) {
                if (typeof type === "string")
                    nav.closetype = type;
                $modalInstance.dismiss('cancel');
            };
            $scope.selectAll = function(bank) {
                var lambda;
                if (!angular.isDefined(bank.allSelected) || bank.allSelected == false) {
                    lambda = function(question) {
                        question.selected = 1;
                        SelectedQuestions.set(question)
                    };
                    bank.allSelected = true;
                } else {
                    lambda = function(question) {
                        question.selected = 0;
                        SelectedQuestions.remove(question)
                    };
                    bank.allSelected = false;
                }
                angular.forEach(bank.questions, lambda);
            };
            $scope.setquestions = function() {
                /*
                 Golabs 12/02/2015
                 If we have randomGroupQuestions we want to create
                 our question with the type random so when a student
                 we do this by first creating a test first and then coming back
                 here and setting all the questions from the bank.
                 based on the selection.
                 */
                if (from == 'randomGroupQuestions') {
                    var options = {}

                    if (!angular.isDefined($scope.values.counter)) {
                        $scope.values.counter = $scope.bank.questions.length
                    }

                    angular.forEach($scope.values, function(value, key) {
                        this[key] = value
                    }, options);

                    options.bank_id = $scope.bank.bank.id;
                    options.course_id = $scope.course.id;
                    options.quizzes_id = $scope.test_id
                    angular.forEach($scope.data, function(value, key) {
                        this[key] = value
                    }, options);

                    //This is the send to create the quizz
                    TestbankTestService.randomQuiz($scope.course.id, options)
                        .success(function(response) {
                            if (angular.isDefined(response.error)) {
                                $scope.error = response.error;

                            } else {
                                response.test_id = $scope.test_id
                                response.utils = utils;
                                response.placedquestions = 1;
                                $modalInstance.close(response);
                            }
                        })
                        .error(function(error) {
                            console.log(error);
                        });

                    //alert('Random System is in Develoment will be ready shortly....');
                    return;
                }
                var selected = SelectedQuestions.get(),
                    ids = [],
                    data = {};
                for (var id in selected) {
                    ids.push(id);
                }
                if (ids.length > 0) {
                    data.question_ids = ids;
                }
                TestbankQuestionService.placequestions($scope.test_id, data)
                    .success(function(response) {
                        if (response.error) {
                            $scope.error = response.error;

                        } else {
                            if (typeof response === 'string') {
                                response = {};
                            }
                            response.test_id = $scope.test_id;
                            response.placedquestions = 1;
                            $modalInstance.close(response);
                        }
                    })
                    .error(function(error) {
                        console.log(error);
                    });
            }
        }
    ])
    .controller('ModalSelectQuestionController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'utils', 'SelectedQuestions',
        function($rootScope, $scope, $modal, $state, nav, utils, SelectedQuestions) {
            $scope.selectquestion = function(question) {
                if (typeof $scope.question.selected === 'undefined') {
                    $scope.question.selected = 1;
                    SelectedQuestions.set($scope.question);
                } else {
                    SelectedQuestions.remove($scope.question);
                    delete $scope.question.selected;
                }
            };
        }
    ])
}());