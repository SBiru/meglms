'use strict';
Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this;
};

angular.module('app.testbank', [
    'app.utils',
    'app.testbank.service',
    'ui.router',
    'ui.bootstrap',
    'selectize',
    'selectize2',
    'timer', 'ngFileUpload'
])
    .config(
    ['$stateProvider', '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

            $stateProvider

                .state('banks', {
                    parent: 'nav.course', // required to link to the main (top) navigation
                    url: 'bank',
                    views: {

                        'menu@': {
                            templateUrl: 'banks.menu.html',
                            controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav', 'TestbankBankService', 'Organization', 'User', 'OrganizationV2',
                                function($rootScope, $scope, $state, $stateParams, nav, TestbankBankService, Organization, User, OrganizationV2) {
                                    User.get({
                                        userId: 'me'
                                    }, function(user) {
                                        $scope.$root.user = user;

                                    });

                                    // give this controller 'a little more scope'
                                    $scope.nav = nav;
                                    $scope.course = nav.selected_course;
                                    $scope.data = {};

                                    $scope.delete = function(item) {
                                        if (confirm("Are you sure you want to delete this bank?")) {
                                            TestbankBankService.delete(item.id).then(function(res) {
                                                if (res.data.status == 'success') {
                                                    var i;
                                                    for (i = 0; i < $scope.data.banks.length; i++) {
                                                        if ($scope.data.banks[i].id == item.id)
                                                            break;
                                                    }
                                                    $scope.data.banks.splice(i, 1);

                                                } else {
                                                    alert(res.data.status);
                                                }
                                            })
                                        }
                                    };
                                    // no bank id was provided (clicked on tab) so choose one for the visitor
                                    function courseChanged(course) {
                                        if ((course === null) || (typeof course === 'undefined')) {
                                            return
                                        }
                                        TestbankBankService.getByCourse(course)
                                            .success(function(response) {
                                                $scope.data = response;
                                                nav.data = response;
                                                if ($state.current.name == "banks") {
                                                    if (angular.isDefined($scope.data.banks)) {
                                                        TestbankBankService.setBanks($scope.data.banks);
                                                        $state.go("banks.detail", {
                                                            bankId: $scope.data.banks[0].id
                                                        });
                                                    }
                                                }
                                            })
                                            .error(function(error) {
                                                console.log(error)
                                            });
                                    }

                                    function orgChanged(org) {
                                        if (org) {
                                            nav.org_id = org;
                                            $scope.classes = OrganizationV2.getClasses({
                                                id: org,
                                                isEditTeacher: true
                                            });
                                        }
                                    }
                                    Organization.get({
                                        userId: 'me'
                                    }, function(organizations) {
                                        $scope.organizations = organizations.organizations;
                                        if (angular.isDefined($scope.$root.user)) {
                                            $scope.org_id = $scope.$root.user.org.id;
                                        }
                                    });
                                    $scope.$watch('org_id', orgChanged);
                                    $scope.$watch('course_id', courseChanged);
                                }
                            ]
                        },
                        'content@': {
                            template: '<p style="margin-top:4.5em"><span class="glyphicon glyphicon-arrow-left"></span> To add a new Question Bank use the menu on the left.</p>',
                            controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav',
                                function($rootScope, $scope, $state, $stateParams, nav) {

                                    // give this controller 'a little more scope'
                                    $scope.nav = nav;
                                    $scope.course = nav.selected_course;
                                }
                            ]
                        }
                    }
                })

                .state('banks.detail', {
                    url: ':{bankId:[0-9]{1,11}}',
                    views: {
                        'content@': {
                            templateUrl: 'bank.details.html',
                            resolve: {
                                bankDetails: ['$stateParams', 'TestbankBankService',
                                    function($stateParams, TestbankBankService) {
                                        return TestbankBankService.details($stateParams.bankId);
                                    }
                                ]
                            },
                            controller: ['$location','$rootScope', '$scope', '$stateParams', 'bankDetails', 'nav', 'TestbankBankService', '$sce', 'mathJaxConvert','ReEncodeHtml',
                                function($location,$rootScope, $scope, $stateParams, bankDetails, nav, TestbankBankService, $sce, mathJaxConvert,ReEncodeHtml) {
                                    if (typeof bankDetails.data.bank === 'undefined')
                                        return;
                                    var urlParams = $location.search();
                                    if(urlParams.question){
                                        $scope.selectedQuestion=urlParams.question;
                                    }
                                    $scope.bank = bankDetails.data.bank;
                                    $scope.bank.questions = bankDetails.data.questions;
                                    var tmphtml = '';
                                    for (var i = 0; i < $scope.bank.questions.length; i++) {


                                        if ($scope.bank.questions[i].prompt.match(/class="ng-scope"|ng-\w+="|<script/)) {
                                            $scope.bank.questions[i].prompt = "<span style='color:red;font-weight:bold;font-size:x-large'>Illegal code found in Question remove and re-do</span>";
                                        }

                                        $scope.bank.questions[i] = mathJaxConvert.parseQuestion($scope.bank.questions[i]);
                                        if (!$scope.bank.questions[i].prompt) {
                                            $scope.bank.questions[i].prompt = 'This question has no prompt';
                                        }
                                        tmphtml = $scope.bank.questions[i].prompt;
                                        /*
                                         Golabs May 18 2015
                                         fixing up audio cache issue.
                                         We will only load the audio and video onmouse enter.
                                         */
                                        tmphtml = tmphtml.replace(
                                            /<audio/gi,
                                            '<audio preload="none"'
                                        );
                                        /*
                                         Golabs May 18 2015
                                         Video cache.
                                         */
                                        tmphtml = tmphtml.replace(
                                            /<video/gi,
                                            '<video preload="none"'
                                        );

                                        if ($scope.bank.questions[i].type === "wordmatching") {
                                            $scope.bank.questions[i].extraOriginal = $scope.bank.questions[i].extra;
                                            var a = angular.copy($scope.bank.questions[i].extra);
                                            var b = /(<[^>]*)([^\\|>])(")([^>]*>)/
                                            var extra = a.replace(b,'$1$2\\"$4'); while(a!=extra){a=extra;extra = a.replace(b,'$1$2\\"$4')}
                                            extra = angular.fromJson(extra);
                                            var tmpobject = {}
                                            for (var key in extra) {
                                                tmpobject = extra[key];
                                                for (var tmpkey in tmpobject) {
                                                    tmpobject[tmpkey] = ReEncodeHtml.restoreHTML(tmpobject[tmpkey]);
                                                }
                                            }

                                            /*Golabs fixing up any doubles in extra for edit start*/
                                            var newextra = {};
                                            for (var id in extra) {
                                                newextra.target=extra[id].target
                                                newextra.matches=extra[id].matches
                                                for (var key in extra[id]) {
                                                    newextra[key] = extra[id][key];
                                                    if (key === 'tmpanswers') {
                                                        extra[id] = newextra;
                                                        newextra = {};
                                                        break;
                                                    }
                                                }

                                            }

                                            $scope.bank.questions[i].extra = angular.toJson(extra);
                                            /*Golabs fixing up any doubles in extra for edit start*/

                                            $scope.bank.questions[i].wordmatchingInputs = [];

                                            for (var id in extra) {
                                                var tmp = {};
                                                tmp.id=id;


                                                for (var value in extra[id]) {
                                                    if (['tmpanswers','target','matches'].indexOf(value)>=0) {
                                                        continue;
                                                    };
                                                    extra[id][value] = (extra[id][value] && extra[id][value].replace) ? extra[id][value].replace(/\\/g, '') : extra[id][value];
                                                    if (typeof tmp.value1 === 'undefined') {
                                                        tmp.value1 = {}
                                                        tmp.value1.id = value;
                                                        tmp.value1.value = extra[id][value];
                                                        continue;
                                                    }
                                                    if (typeof tmp.value2 === 'undefined') {
                                                        extra[id].matches=extra[id].matches||[tmp.value1.id]
                                                        tmp.value2 = {}
                                                        tmp.value2.id = value
                                                        tmp.value2.matches=extra[id].matches;
                                                        tmp.value2.value = extra[id][value];
                                                        continue;
                                                    }

                                                    tmp.value3 = {};
                                                    tmp.value3.id = value;
                                                    tmp.value3.value = extra[id][value];

                                                }
                                                $scope.bank.questions[i].wordmatchingInputs.push(tmp);
                                            }
                                            _.each($scope.bank.questions[i].wordmatchingInputs,function(o){
                                                if(o.value2.matches && o.value2.matches.length>1){
                                                    var groupId = o.value2.matches[0];
                                                    var lastOption;
                                                    _.each(o.value2.matches,function(m){
                                                        var option = _.find($scope.bank.questions[i].wordmatchingInputs,function(f){
                                                            return f.value1.id==m;
                                                        })
                                                        if(option){
                                                            option.groupId=option.groupId||groupId;
                                                            option.hideButton=true;
                                                            lastOption=option;
                                                        }

                                                    })
                                                    if(lastOption)
                                                        lastOption.hideButton=false;
                                                }
                                            })
                                        } else if ($scope.bank.questions[i].type === "multipart") {

                                            $scope.bank.questions[i].htmlSafeoption = $sce.trustAsHtml($scope.bank.questions[i].extra);

                                        } else if ($scope.bank.questions[i].type === "multiple") {
                                            var tmps = $scope.bank.questions[i].solution.split(',');
                                            $scope.bank.questions[i].optionsmatch = [];
                                            for (var x = 0; x < tmps.length; x++) {
                                                $scope.bank.questions[i].optionsmatch[tmps[x]] = 1;
                                            }
                                        } else if ($scope.bank.questions[i].type === "matching") {
                                            try{
                                                $scope.bank.questions[i].imgdata = angular.fromJson($scope.bank.questions[i].extra);
                                            }catch(e){
                                                if(e.name== "SyntaxError"){
                                                    var promptRegExp = /prompt":"(.*>)",/g;
                                                    var match = promptRegExp.exec($scope.bank.questions[i].extra);
                                                    if(match){
                                                        var promptString = match[1];
                                                        var promptEscaped = promptString.replace(/"/g,'\\"');
                                                        $scope.bank.questions[i].extra = $scope.bank.questions[i].extra.replace(promptString,promptEscaped);
                                                        $scope.bank.questions[i].imgdata = angular.fromJson($scope.bank.questions[i].extra);
                                                    }

                                                }
                                                console.log($scope.bank.questions[i].extra);
                                            }

                                        }

                                        $scope.bank.questions[i].htmlSafeprompt = $sce.trustAsHtml(tmphtml);
                                    }

                                    $scope.data = {
                                        objective_id: $scope.bank.default_objective_id,
                                        original_objective_id: $scope.bank.default_objective_id // this is always the db-value
                                    };

                                    $scope.course = nav.selected_course;

                                    $scope.detectNewObjectiveSelectOrSave = function() {
                                        $rootScope.detectNewObjectiveSelect($scope.course, $scope.data, {
                                            autosave_to_bank: $scope.bank.id
                                        });
                                    };

                                    $scope.saveObjective = function() {
                                        TestbankBankService.update($scope.bank.id, {
                                            default_objective_id: $scope.data.objective_id
                                        })
                                            .success(function(response) {
                                                if (response.bank && response.bank.default_objective_id >= 0) {
                                                    $scope.bank.default_objective_id = response.bank.default_objective_id;
                                                    $scope.data.objective_id = response.bank.default_objective_id;
                                                    $scope.data.original_objective_id = response.bank.default_objective_id;
                                                }
                                            });
                                    };

                                }
                            ]
                        }
                    }
                })
                .state('tests', {

                    parent: 'nav.course', // required to link to the main (top) navigation
                    url: 'test',
                    views: {
                        'menu@': {
                            templateUrl: 'tests.menu.html',
                            controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav', 'TestbankTestService', 'Organization', 'User', 'OrganizationV2',
                                function($rootScope, $scope, $state, $stateParams, nav, TestbankTestService, Organization, User, OrganizationV2) {

                                    User.get({
                                        userId: 'me'
                                    }, function(user) {
                                        $scope.$root.user = user;

                                    });
                                    // give this controller 'a little more scope'
                                    $scope.nav = nav;
                                    //$scope.course = nav.selected_course;
                                    $scope.data = {}
                                    $scope.delete = function(item) {
                                        if (confirm("Are you sure you want to delete this test?")) {
                                            TestbankTestService.delete(item.id).then(function(res) {
                                                if (res.data.status == 'success') {
                                                    var i;
                                                    for (i = 0; i < $scope.data.tests.length; i++) {
                                                        if ($scope.data.tests[i].id == item.id)
                                                            break;
                                                    }
                                                    $scope.data.tests.splice(i, 1);

                                                } else {
                                                    alert(res.data.status);
                                                }
                                            })
                                        }
                                    }
                                    $scope.$watch('filter', function(filter) {

                                        if (!(filter && filter.length)) return;
                                        var params = {};
                                        _.each(filter,function(f){
                                            params[f.id + 'Id'] = f.value;
                                        })

                                        TestbankTestService.getTests(params,
                                            function(response) {
                                                $scope.data = response;
                                                nav.data = response;
                                                if (($state.current.name == "tests") &&
                                                    (angular.isObject($scope.data))) {
                                                    $state.go("tests.detail", {
                                                        testId: $scope.data.tests[0].id
                                                    });
                                                }

                                            },
                                            function(error) {
                                                console.warn(error);
                                            }
                                        )
                                    }, true);

                                    function routingInfo(test) {
                                        if (test) {
                                            $scope.org_id = test.organizationid;

                                        }

                                    }
                                    $scope.$root.$watch('test', routingInfo, true);

                                }
                            ]
                        },
                        'content@': {
                            template: '<p style="margin-top:4.5em"><span class="glyphicon glyphicon-arrow-left"></span> To add a new Test use the menu on the left.</p>',
                            controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav',
                                function($rootScope, $scope, $state, $stateParams, nav) {
                                    // give this controller 'a little more scope'
                                    $scope.nav = nav;
                                    $scope.course = nav.selected_course;
                                }
                            ]
                        }
                    }
                })
                .state('tests.detail', {
                    url: ':{testId:[0-9]{1,11}}',
                    views: {
                        'content@': {
                            templateUrl: 'test.details.html',
                            resolve: {
                                testDetails: ['$stateParams', 'TestbankTestService',
                                    function($stateParams, TestbankTestService) {
                                        return TestbankTestService.details($stateParams.testId);
                                    }
                                ]
                            },
                            controller: ['$scope', '$stateParams', 'testDetails', 'nav', '$sce', 'TestbankTestService', 'utils', 'mathJaxConvert', 'ReEncodeHtml', 'TestbankQuestionService','Gradebook',
                                function($scope, $stateParams, testDetails, nav, $sce, TestbankTestService, utils, mathJaxConvert, ReEncodeHtml, TestbankQuestionService,Gradebook) {
                                    if (typeof testDetails.data.test === 'undefined')
                                        return;
                                    $scope.test = testDetails.data.test;
                                    $scope.$root.test = $scope.test;

                                    function CheckisInt(n) {
                                        return n % 1 === 0;
                                    }

                                    //Spreading the new MAxpoints for all questings....
                                    $scope.question_Spread_Points = function(recalculate) {
                                        var Max_points_Spread = parseFloat($scope.Max_points_Spread)
                                        if ((typeof Max_points_Spread === 'undefined') || (Max_points_Spread <= 0)) {
                                            alert('Number must be a whole number only');
                                            return;
                                        }

                                        //testing for a reasoible divisible number
                                        //We need to da count and also include number of random questions...
                                        var qcount = 0
                                        for (var i = 0; i < $scope.test.questions.length;i++)
                                        {

                                            if ($scope.test.questions[i].type === 'Random'){
                                                qcount += parseInt($scope.test.questions[i].random)
                                            }
                                            else{
                                                qcount +=1;
                                            }
                                        }
                                        var question_spread = $scope.Max_points_Spread / qcount;
                                        if ((!CheckisInt(question_spread)) && (!CheckisInt(question_spread - .5))) {
                                            alert('Number must easily divisible amongst questions');
                                            return;
                                        }
                                        if(!recalculate && testDetails.data.needGradebookRecalculation){
                                            Gradebook.openRecalculationWarning(
                                                function(){
                                                    $scope.question_Spread_Points('now')
                                                },
                                                function(){
                                                    $scope.question_Spread_Points('later')
                                                }
                                            )
                                        }else{
                                            TestbankTestService.pointsSpread(0, {
                                                'max_points': $scope.Max_points_Spread,
                                                'questions': $scope.test.questions,
                                                'old_max_points':$scope.getTotalPoints(),
                                                'quiz_id':$scope.test.id,
                                                recalculate:recalculate
                                            })
                                                .success(function(response) {
                                                    if (angular.isDefined(response.error)) {
                                                        $scope.error = response.error;
                                                    }
                                                    $scope.$state.go($scope.$state.current, {}, {
                                                        reload: true
                                                    });
                                                })
                                                .error(function(error) {
                                                    console.log(error);
                                                });
                                        }



                                    }
                                    $scope.canSaveQuestion = function(question) {
                                        return !isNaN(parseFloat(question.max_points)) && question.max_points > 0;
                                    }
                                    $scope.updateQuestionPoints = function(question,recalculate) {
                                        if(!recalculate && testDetails.data.needGradebookRecalculation){
                                            Gradebook.openRecalculationWarning(
                                                function(){
                                                    $scope.updateQuestionPoints(question,'now')
                                                },
                                                function(){
                                                    $scope.updateQuestionPoints(question,'later')
                                                }
                                            )
                                        }else{
                                            TestbankQuestionService.updateV2({
                                                quizQuestionId: question.quiz_question_id,
                                                points: question.max_points,
                                                recalculate:recalculate
                                            });
                                            question.editing = false;
                                        }
                                    }
                                    $scope.change_privacy = function() {
                                        TestbankTestService.make_private($stateParams.testId, {
                                            is_private: $scope.test.is_private
                                        });
                                    }
                                    $scope.change_survey = function() {
                                        TestbankTestService.make_survey($stateParams.testId, {
                                            is_survey: $scope.test.is_survey
                                        }).success(function(res){
                                            if(res.error){
                                                toastr.error(res.msg)
                                                $scope.test.is_survey = !$scope.test.is_survey
                                            }
                                        });
                                    }
                                    $scope.set_keep_highest = function() {
                                        TestbankTestService.set_keep_highest($stateParams.testId, {
                                            keep_highest_score: $scope.test.keep_highest_score
                                        });
                                    }
                                    $scope.set_sort_mode = function(mode){
                                        TestbankTestService.set_sort_mode($stateParams.testId, {
                                            sort_mode: mode
                                        });
                                    }
                                    $scope.set_questions_per_page = function(){
                                        TestbankTestService.set_questions_per_page($stateParams.testId, {
                                            questions_per_page : $scope.test.questions_per_page
                                        });
                                    }
                                    $scope.getTotalPoints = function() {
                                        var total = 0;
                                        angular.forEach($scope.test.questions, function(question) {
                                            var points = question.random ? parseFloat(question.max_points) * question.random : parseFloat(question.max_points);
                                            total += isNaN(points) ? 0 : points;
                                        });
                                        return Math.ceil(parseFloat(total));
                                    }

                                    /*
                                     Golabs 10/03/2015
                                     Testing for multiple or matching and setting up solution for display.
                                     */
                                    for (var i = 0; i < testDetails.data.questions.length; i++) {

                                        testDetails.data.questions[i].needGradebookRecalculation = testDetails.data.needGradebookRecalculation


                                        if (typeof testDetails.data.questions[i].extra !== 'undefined') {
                                            testDetails.data.questions[i].extra = ReEncodeHtml.rawCorrection(testDetails.data.questions[i].extra);
                                        }

                                        for (var x = 0; x < nav.allBanks.length; x++) {
                                            if (nav.allBanks[x].id == testDetails.data.questions[i].ChangedBank) {
                                                testDetails.data.questions[i].bankName = nav.allBanks[x].title;
                                                break;
                                            }
                                        }

                                        if (typeof testDetails.data.questions[i].bankname === 'undefined') {
                                            if (typeof testDetails.data.questions[i].ChangedBank)
                                                if (testDetails.data.questions[i].ChangedBank === null) {
                                                    testDetails.data.questions[i].ChangedBank = testDetails.data.questions[i].bank_id;
                                                    //testDetails.data.questions[i].bankname = '- No:' +testDetails.data.questions[i].bank_id;
                                                } else {
                                                    testDetails.data.questions[i].bankName = '- No:' + testDetails.data.questions[i].ChangedBank;
                                                }
                                        }



                                        if (testDetails.data.questions[i].type === "multiple") {
                                            testDetails.data.questions[i].solution = testDetails.data.questions[i].solution.split(',');
                                            testDetails.data.questions[i].optionsmatch = []
                                            for (var o = 0; o < testDetails.data.questions[i].options.length; o++) {
                                                if (testDetails.data.questions[i].solution.indexOf(o.toString()) !== -1) {
                                                    testDetails.data.questions[i].optionsmatch[o] = true
                                                } else {
                                                    testDetails.data.questions[i].optionsmatch[o] = false
                                                }
                                            }
                                        }

                                        if (testDetails.data.questions[i].type === "matching") {
                                            testDetails.data.questions[i].imgdata = angular.fromJson(testDetails.data.questions[i].extra);
                                            //Converting back
                                            var tmp = testDetails.data.questions[i].imgdata.matching.imagesCordinates
                                            for (var x = 0; x < tmp.length; x++) {
                                                tmp[x].textvalue = tmp[x].textvalue.replace(/\&quot\;/g, '"');
                                            }
                                        }

                                        /*
                                         Golabs Setting our Question number so that we cater for pagebreak as we want the user to see
                                         1,2,3... right order....
                                         */
                                        if (testDetails.data.questions[i].type !== "pagebreak") {
                                            if (typeof number === 'undefined') {
                                                var number = 1;
                                            } else {
                                                number += 1;
                                            }
                                            testDetails.data.questions[i].qnumber = number
                                        }

                                    }


                                    //If we have MathsJax start
                                    for (var i = 0; i < testDetails.data.questions.length; i++) {
                                        testDetails.data.questions[i] = mathJaxConvert.parseQuestion(testDetails.data.questions[i]);
                                    }

                                    //If we have Mathsjax end
                                    if (typeof testDetails.data.pageId === 'string') {
                                        $scope.pageId = testDetails.data.pageId;
                                    }


                                    $scope.test.questions = testDetails.data.questions;
                                    $scope.$root.test_questions = $scope.test.questions;
                                    $scope.test.questionsRandom = testDetails.data.questions;
                                    $scope.startMoving = function(question){
                                        $scope.test.moving = question;
                                    }
                                    $scope.cancelMoving = function(){
                                        delete $scope.test.moving;
                                    }
                                    $scope.moveToPosition = function(index){
                                        var initialIndex = $scope.test.questions.indexOf($scope.test.moving);
                                        var finalIndex = Math.min($scope.test.questions.length-1,index+1);
                                        $scope.test.questions.move(initialIndex,finalIndex);
                                        var positions = {};
                                        for(var i=0;i< $scope.test.questions.length;i++){
                                            var question = $scope.test.questions[i];
                                            if(question.quiz_question_id)
                                                positions[question.quiz_question_id]=i;
                                        }
                                        TestbankTestService.questionPositions(0,positions);
                                        delete $scope.test.moving;
                                    }
                                    $scope.course = nav.selected_course;
                                    for (var i = 0; i < $scope.test.questions.length; i++) {

                                        //Looking for Random so we can let the user know that they are in a random question.
                                        if (typeof $scope.test.questions[i].random !== 'undefined') {
                                            if (parseInt($scope.test.questions[i].random) > 0) {
                                                $scope.test.questions[i].type = "Random";
                                            }
                                        }

                                        //Golabs Encoding back Start
                                        $scope.test.questions[0].prompt = ReEncodeHtml.restoreHTML($scope.test.questions[0].prompt);


                                        if ((angular.isDefined($scope.test.questions[0].options)) && (typeof $scope.test.questions[0].options === 'object'))
                                            angular.forEach($scope.test.questions[0].options, function(value, key) {
                                                if(typeof $scope.test.questions[0].options[key] === 'string')
                                                    $scope.test.questions[0].options[key] = ReEncodeHtml.restoreHTML(value);
                                            });
                                        //Golabs Encoding back End

                                        if ($scope.test.questions[0].bankName === null) {
                                            $scope.test.questions[0].bankName = '- No:' + $scope.test.questions[0].ChangedBank
                                        }

                                        //console.log($scope.test.questions[i].prompt);
                                        $scope.test.questions[i].htmlSafeprompt = $sce.trustAsHtml($scope.test.questions[i].prompt);
                                        $scope.test.questionsRandom[i].htmlSafeprompt = $sce.trustAsHtml($scope.test.questionsRandom[i].prompt);
                                        /*
                                         Golabs 19/03/2015
                                         Setting to safe html for display
                                         */
                                        if ($scope.test.questions[i].type === "essay") {
                                            $scope.test.questions[i].htmlSafeoption = $sce.trustAsHtml($scope.test.questions[i].options[0]);
                                        } else if (($scope.test.questions[i].type === "klosequestions") || ($scope.test.questions[i].type === 'multipart')) {

                                            /*$scope.test.questions[i].xmlquestion = angular.fromJson($scope.test.questions[i].extra);
                                             var tmp = $scope.test.questions[i].xmlquestion.questionhtml;
                                             tmp = tmp.replace(/<br><br>/, '');
                                             tmp = tmp.replace(/<span\s+id="Question">.*?<\/span><br>/, '');
                                             tmp = tmp.replace(/u2265/g, '≥');
                                             tmp = tmp.replace(/u2264/g, '≤');

                                             tmp = tmp.replace(/&#39;/g, '\'');
                                             tmp = tmp.replace(/&#34;/g, '"');
                                             */
                                            $scope.test.questions[i].htmlSafeoption = $sce.trustAsHtml(ReEncodeHtml.restoreHTML($scope.test.questions[i].extra));
                                        } else if ($scope.test.questions[i].type === "wordmatching") {
                                            $scope.test.questions[i].extraOriginal = $scope.test.questions[i].extra;
                                            var extra = angular.fromJson($scope.test.questions[i].extra);
                                            var tmpobject = {}
                                            for (var key in extra) {
                                                tmpobject = extra[key];
                                                for (var tmpkey in tmpobject) {
                                                    tmpobject[tmpkey] = ReEncodeHtml.restoreHTML(tmpobject[tmpkey]);
                                                }
                                            }

                                            /*Golabs fixing up any doubles in extra for edit start*/
                                            var newextra = {};
                                            for (var id in extra) {
                                                newextra.target=extra[id].target
                                                newextra.matches=extra[id].matches
                                                for (var key in extra[id]) {
                                                    newextra[key] = extra[id][key];
                                                    if (key === 'tmpanswers') {
                                                        extra[id] = newextra;
                                                        newextra = {};
                                                        break;
                                                    }
                                                }

                                            }

                                            $scope.test.questions[i].extra = angular.toJson(extra);
                                            /*Golabs fixing up any doubles in extra for edit start*/

                                            $scope.test.questions[i].wordmatchingInputs = [];

                                            for (var id in extra) {
                                                var tmp = {};
                                                tmp.id=id;


                                                for (var value in extra[id]) {
                                                    if (['tmpanswers','target','matches'].indexOf(value)>=0) {
                                                        continue;
                                                    };
                                                    extra[id][value] = (extra[id][value] && extra[id][value].replace) ? extra[id][value].replace(/\\/g, '') : extra[id][value];
                                                    if (typeof tmp.value1 === 'undefined') {
                                                        tmp.value1 = {}
                                                        tmp.value1.id = value;
                                                        tmp.value1.value = extra[id][value];
                                                        continue;
                                                    }
                                                    if (typeof tmp.value2 === 'undefined') {
                                                        extra[id].matches=extra[id].matches||[tmp.value1.id]
                                                        tmp.value2 = {}
                                                        tmp.value2.id = value
                                                        tmp.value2.matches=extra[id].matches;
                                                        tmp.value2.value = extra[id][value];
                                                        continue;
                                                    }

                                                    tmp.value3 = {};
                                                    tmp.value3.id = value;
                                                    tmp.value3.value = extra[id][value];

                                                }
                                                $scope.test.questions[i].wordmatchingInputs.push(tmp);
                                            }
                                            _.each($scope.test.questions[i].wordmatchingInputs,function(o){
                                                if(o.value2.matches && o.value2.matches.length>1){
                                                    var groupId = o.value2.matches[0];
                                                    var lastOption;
                                                    _.each(o.value2.matches,function(m){
                                                        var option = _.find($scope.test.questions[i].wordmatchingInputs,function(f){
                                                            return f.value1.id==m;
                                                        })
                                                        if(option){
                                                            option.groupId=option.groupId||groupId;
                                                            option.hideButton=true;
                                                            lastOption=option;
                                                        }

                                                    })
                                                    if(lastOption)
                                                        lastOption.hideButton=false;
                                                }
                                            })
                                        }
                                    }
                                }
                            ]
                        }
                    }

                })
                .state('vocabs', {
                    parent: 'nav.course', // required to link to the main (top) navigation
                    url: 'vocab',
                    views: {
                        'menu@': {
                            templateUrl: '/public/views/testbank/vocab.menu.html',
                            controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav', 'Vocab',
                                function($rootScope, $scope, $state, $stateParams, nav, Vocab) {
                                    // give this controller 'a little more scope'

                                    $scope.nav = nav;
                                    //$scope.course = nav.selected_course;
                                    function restartData() {
                                        $scope.data = {
                                            languages: [],
                                            language: ''
                                        };
                                        $scope.vocabs = [];
                                    }
                                    restartData()


                                    $scope.$watch('filter', function(filter) {
                                        restartData()
                                        if (!(filter && filter.length)) return;
                                        var params = {};
                                        _.each(filter,function(f){
                                            params[f.id + 'Id'] = f.value;
                                        })

                                        Vocab.all(params,
                                            function(response) {
                                                $scope.data.languages = response;
                                                nav.data = response;
                                                $scope.data.language = 'en'; //default
                                            },
                                            function(error) {
                                                console.warn(error);
                                            }
                                        )
                                    }, true);
                                    $scope.$watch('data.language', function(newValue) {
                                        if (newValue)
                                            $scope.vocabs = jQuery.grep($scope.data.languages, function(l) {
                                                return l.language_id == newValue;
                                            })[0].vocabs;
                                    });
                                }
                            ]
                        },
                        'content@': {
                            template: '<p style="margin-top:4.5em"><span class="glyphicon glyphicon-arrow-left"></span> To add a new Vocab use the menu on the left.</p>',
                            controller: ['$rootScope', '$scope', '$state', '$stateParams', 'nav',
                                function($rootScope, $scope, $state, $stateParams, nav) {
                                    // give this controller 'a little more scope'
                                    $scope.nav = nav;
                                    $scope.course = nav.selected_course;
                                }
                            ]
                        }
                    }
                }).state('vocabs.detail', {
                    url: ':{vocabId:[0-9]{1,11}}',
                    views: {
                        'content@': {
                            templateUrl: '/public/views/testbank/vocab.details.html',
                            resolve: {
                                vocabDetails: ['$stateParams', 'Vocab',
                                    function($stateParams, Vocab) {
                                        return Vocab.details({
                                            vocabId: $stateParams.vocabId
                                        });
                                    }
                                ],
                                languages: ['$http',
                                    function($http) {
                                        return $http.get('/languages/');
                                    }
                                ]
                            },
                            controller: ['$scope', '$stateParams','$state', 'vocabDetails', 'nav', '$sce', '$upload', 'Vocab', 'languages',
                                function($scope, $stateParams,$state, vocabDetails, nav, $sce, $upload, Vocab, languages) {
                                    $scope.classes = nav.classes;
                                    $scope.vocabId = $stateParams.vocabId;
                                    if ($scope.vocabId > 0) {

                                        vocabDetails.$promise.then(function() {
                                            $scope.data = {
                                                base_language: vocabDetails.info.base_language,
                                                target_language: vocabDetails.info.target_language,
                                                vocabs: vocabDetails.vocabs,
                                                title: vocabDetails.info.name,
                                                id: vocabDetails.info.id,
                                                courseId:vocabDetails.info.course_id,
                                                description: vocabDetails.info.description,
                                            };
                                        })

                                    } else {
                                        $scope.data = {
                                            id: 0,
                                            vocabs: [],
                                            title: "",
                                            target_language: 'en',
                                        }
                                    }
                                    $scope.vocabImageTooltip = function(vocab){
                                        if(vocab.image){
                                            return "<img src='"+vocab.image+"'>";
                                        }else
                                            return "Upload image";
                                    }
                                    $scope.vocabMp3Tooltip = function(vocab){
                                        if(vocab.audio && vocab.audio[0]){
                                            return vocab.audio[0];
                                        }else
                                            return "Upload mp3";
                                    }
                                    $scope.vocabOggTooltip = function(vocab){
                                        if(vocab.audio && vocab.audio[1]){
                                            return vocab.audio[1];
                                        }else
                                            return "Upload ogg";
                                    }
                                    $scope.languages = languages.data.languages;
                                    $scope.save = function() {
                                        Vocab.save($scope.data).$promise
                                            .then(function(response) {
                                                if(response.message=='successful'){
                                                    toastr.success('Saved');
                                                    if($scope.data.id==0){
                                                        $state.go('vocabs.detail',{vocabId:response.id},{ reload: true});
                                                    }
                                                }else{
                                                    toastr.error('Something went wrong');
                                                }
                                            });
                                    }
                                    $scope.addNew = function() {
                                        $scope.data.vocabs.push({
                                            info: {},
                                            audio: ["", ""]
                                        })
                                    }
                                    $scope.remove = function(index) {
                                        $scope.data.vocabs.splice(index, 1);
                                    }
                                    $scope.upload = function($event, vocab) {
                                        angular.element($event.target).find('input').trigger('click');
                                        $scope.currenctVocab = vocab
                                    }
                                    $scope.toggleAudio = function(item, type, $event) {
                                        if (item.audio[type] == "")
                                            return;

                                        if (!angular.isDefined(item.audiostate))
                                            item.audiostate = [false, false]
                                        if (item.audiostate[type] == false || item.audiostate[type] == 'pause') {
                                            item.audiostate[type] = 'play';
                                            var audio = angular.element($event.target).find('audio');
                                            if (audio.length > 0)
                                                audio[0].play();
                                            return;
                                        }

                                        item.audiostate[type] = 'pause';
                                        var audio = angular.element($event.target).find('audio');
                                        if (audio.length > 0)
                                            audio[0].pause();

                                    }
                                    $scope.audioClassControl = function(item, type) {
                                        if (angular.isDefined(item.audiostate) && item.audiostate[type] == 'play')
                                            return 'fa-pause';
                                        return 'fa-play';
                                    }
                                    $scope.onFileSelect = function($files,type) {
                                        type= type|| 'audio'
                                        for (var i = 0; i < $files.length; i++) {
                                            var file = $files[i],
                                                url = '/upload/' + type + '/'
                                            $upload.upload({
                                                url: url, //upload.php script, node.js route, or servlet url
                                                data: {},
                                                file: file,
                                            }).progress(function(evt) {
                                                $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);
                                            }).success(function(data, status, headers, config) {
                                                if (data.message == 'successfull') {
                                                    var ext = data.name.substr(-3);
                                                    switch(ext){
                                                        case 'mp3':
                                                            $scope.currenctVocab.audio[0] = data.destination_file
                                                            break;
                                                        case 'ogg':
                                                            $scope.currenctVocab.audio[1] = data.destination_file
                                                            break
                                                        default:
                                                            $scope.currenctVocab.image = data.destination_file
                                                    }
                                                } else
                                                    alert(data.message);
                                            });
                                        }

                                    }


                                }
                            ]
                        }
                    }
                });
        }
    ]
)

    .controller('TestbankController', ['$rootScope', '$scope', '$sce', '$state', '$modal', '$location', 'nav', 'TestbankObjectiveService', 'TestbankBankService',
        function($rootScope, $scope, $sce, $state, $modal, $location, nav, TestbankObjectiveService, TestbankBankService) {

            // give this controller 'a little more scope'
            $scope.nav = nav;
            $scope.course = nav.selected_course;
            // how we know the navigation has changed
            $scope.$on('NavUpdate', function(event, data) {
                // here is our default state
                if ($state.current.name == "nav.course") {
                    $state.go('banks');
                }

            });

            $scope.trustAsHtml = function(html) {
                if(html && html.trim)
                return $sce.trustAsHtml(html.trim())
                return html;
            };

            // if the user selects "Add new Objective" option in a page, or in a modal selector
            $rootScope.detectNewObjectiveSelect = function(course, values, options) {
                if (values.objective_id == "new") {
                    // open new AddBankContent modal within a modal
                    var modalInstance = $modal.open({
                        templateUrl: 'objective.add.modal.html',
                        controller: 'ModalAddObjectiveInstanceController',
                        size: null,
                        resolve: {
                            course: function() {
                                return course;
                            }
                        }
                    });

                    modalInstance.result.then(function(response) {

                        // save back to the course objectives array
                        if (angular.isDefined(course.objectives)) {
                            // @TODO: use myArray.sort(utils.keySort)
                            course.objectives.push(response.objective);
                        }
                        values.objective_id = response.objective.id;

                        // autosave the selected option if requested
                        //if(options && options.autosave_to_bank > 0 && values.objective_id >= 0) {
                        //  TestbankBankService.update(options.autosave_to_bank, {default_objective_id:values.objective_id});
                        //}

                    }, function() {

                        // if closed without creating a bank, then reset the bank selector on the underlying page
                        values.objective_id = values.original_objective_id;
                    });
                } else if (options && options.autosave_to_bank > 0 && values.objective_id >= 0) {
                    // autosave the selected option
                    //TestbankBankService.update(options.autosave_to_bank, {default_objective_id:values.objective_id});
                }

            };

            $scope.import = function(orgId) {
                $modal.open({
                    templateUrl: '/public/views/testbank/importtestbankmodal.html',
                    controller: 'ImportTestbankModal',
                    size: 'md',
                    resolve: {
                        courses: function() {
                            return $scope.nav.courses;
                        }
                    }
                });
            };
        }
    ])

    .controller('ModalAddObjectiveInstanceController', ['$scope', '$modalInstance', 'course', 'TestbankObjectiveService',
        function($scope, $modalInstance, course, TestbankObjectiveService) {

            $scope.course = course;
            $scope.$root.course = course;

            $scope.error = null;
            $scope.data = {};

            $scope.ok = function() {
                TestbankObjectiveService.createFor($scope.course.id, $scope.data)
                    .success(function(response) {
                        console.log("ModalAddObjectiveInstanceController callback: " + angular.toJson(response));

                        if (angular.isDefined(response.error)) {
                            $scope.error = response.error;

                        } else {
                            // update the core list of?
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

    .controller('ModalAddBankController', ['$rootScope', '$scope', '$modal', '$state', 'nav',
        function($rootScope, $scope, $modal, $state, nav) {

            $scope.open = function(size) {

                var modalInstance = $modal.open({
                    templateUrl: 'banks.add.modal.html',
                    controller: 'ModalAddBankInstanceController',
                    size: size,
                    resolve: {
                        course: function() {
                            return nav.selected_course;
                        },
                        orgId: function() {
                            return nav.org_id;
                        }
                    }
                });

                modalInstance.result.then(function(response) {

                    if (response.bank) {

                        // for now we can just push to end of array
                        // @TODO: use myArray.sort(utils.keySort)
                        //nav.selected_course.banks.push(response.bank);

                        //Golabs target changes name
                        nav.data.banks.push(response.bank);

                        // change state to the newly created bank
                        $state.go('banks.detail', {
                            bankId: response.bank.id
                        });
                        // @TODO: is this bug when creating a bank through the "Tests"/"Create New Question" controller?

                    }

                }, function() {
                    console.log('ModalAddBankController dismissed');
                });

            };
        }
    ])
    .controller('ModalCloneTestController', ['$rootScope', '$scope', '$modal', '$state', 'nav',
        function($rootScope, $scope, $modal, $state, nav) {
            $scope.open = function(size) {
                var modalInstance = $modal.open({
                    templateUrl: 'tests.clone.modal.html',
                    controller: 'ModalCloneTestInstanceController',
                    windowClass: 'clone-test-modal-window',
                    size: size,

                });
            }
        }
    ])
    .controller('ModalCloneTestInstanceController', ['$scope', '$modalInstance', 'TestbankTestService', 'Class',
        function($scope, $modalInstance, TestbankTestService, Class) {

            $scope.error = null;
            $scope.data = {};

            function restartData() {
                $scope.data.tests = [];
            }

            $scope.$watch('data.filter', function(filter) {

                if (!(filter && filter.length)) return;
                var params = {};
                _.each(filter,function(f){
                    params[f.id + 'Id'] = f.value;
                })

                $scope.filterParams = params;
                TestbankTestService.getTests(params,
                    function(response) {
                        $scope.data = response;

                    },
                    function(error) {
                        console.warn(error);
                    }
                )
            }, true);
            $scope.getCourses = function() {
                Class.query({
                    'as': 'edit_teacher'
                }, function(classes) {
                    $scope.classes = classes
                }, function(error) {

                })
            }

            $scope.selectTarget = function(test, goBack) {
                $scope.selectedTest = test;
                if (!goBack)
                    $scope.select_target = true;
                else $scope.select_target = false;
            }
            $scope.clone = function(test) {
                var tests = [];
                if (!angular.isDefined(test)) {
                    for (var i in $scope.data.tests) {
                        if ($scope.data.tests[i].cloning)
                            tests.push($scope.data.tests[i]);
                    }
                } else {
                    tests.push(test);
                }
                angular.forEach(tests, function(test) {
                    if ($scope.data.targetCourse) {
                        test.targetCourse = $scope.data.targetCourse
                    }
                    TestbankTestService.cloneQuiz(test.id, test)
                        .success(function(response) {
                            if (angular.isDefined(response.error)) {
                                $scope.error = response.error;

                            } else {
                                toastr.success('Cloned')
                                $modalInstance.dismiss()
                            }
                            test.cloning = false;
                            $rootScope.$broadcast('NavUpdate');
                            reloadNav()
                        })
                        .error(function(error) {
                            console.log(error);
                        });

                })
                function reloadNav(){
                    TestbankTestService.getTests($scope.filterParams,
                        function(response) {
                            $scope.data.tests = response.tests;

                        },
                        function(error) {
                            console.warn(error);
                        }
                    )
                }
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }
    ])
    .controller('ModalAddTestController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'CurrentOrganizationId', 'CurrentCourseId',
        function($rootScope, $scope, $modal, $state, nav, CurrentOrganizationId, CurrentCourseId) {
            $scope.edit = function(item) {
                var modalInstance = $modal.open({
                    templateUrl: 'tests.add.modal.html',
                    controller: 'ModalAddTestInstanceController',

                    resolve: {
                        item: function() {
                            return item
                        },
                        course: function() {
                            return nav.selected_course;
                        },
                        orgId: function() {
                            return nav.org_id;
                        }
                    }
                });
                modalInstance.result.then(function(response) {

                    if (response.test) {

                        $state.go('tests.detail', {
                            testId: response.test.id
                        }, {
                            reload: true,
                            inherit: false,
                            notify: true
                        });

                    }

                }, function() {
                    //console.log('ModalAddTestController dismissed');
                });
            };
            $scope.open = function(size) {

                var modalInstance = $modal.open({
                    templateUrl: 'tests.add.modal.html',
                    controller: 'ModalAddTestInstanceController',
                    size: size,
                    resolve: {
                        course: function() {
                            return nav.selected_course;
                        },
                        item: function() {
                            return null;
                        }
                    }
                });

                modalInstance.result.then(function(response) {

                    if (response.test) {

                        // for now we can just push to end of array
                        // @TODO: use myArray.sort(utils.keySort)
                        //nav.selected_course.tests.push(response.test);

                        if (typeof response.allTests === 'object') {
                            nav.allTests = response.allTests
                        }

                        //Adding Quizz end of array.
                        if (!response.test.editing)
                            nav.data.tests.push(response.test);

                        // change state to the newly created test
                        $state.go('tests.detail', {
                            testId: response.test.id
                        }, {
                            reload: true,
                            inherit: false,
                            notify: true
                        });

                    }

                }, function() {
                    //console.log('ModalAddTestController dismissed');
                });

            };
        }
    ])

    .controller('ModalAddBankInstanceController', ['$rootScope', '$scope', '$modalInstance', 'course', 'orgId', 'TestbankBankService', 'OrganizationV2', 'Cookiecutter',
        function($rootScope, $scope, $modalInstance, course, orgId, TestbankBankService, OrganizationV2, Cookiecutter) {

            $scope.course = course;
            $scope.$root.course = course;

            $scope.error = null;
            $scope.data = {
                objective_id: 0
            };
            $scope.selected = {};
            $scope.classes = OrganizationV2.getClasses({
                id: orgId,
                isEditTeacher: true
            }, function(ok) {
                $scope.selected.courseid = Cookiecutter.getCookiebyname('course_id');
            });



            $scope.detectNewObjectiveSelect = function() {
                $rootScope.detectNewObjectiveSelect($scope.course, $scope.data);
            }

            $scope.ok = function() {
                TestbankBankService.createFor($scope.selected.courseid, $scope.data)
                    .success(function(response) {
                        if (angular.isDefined(response.error)) {
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

    .controller('ModalAddTestInstanceController', ['$scope', '$modalInstance', 'course', 'item', 'TestbankTestService', 'OrganizationV2', 'Cookiecutter', 'Organization',
        function($scope, $modalInstance, course, item, TestbankTestService, OrganizationV2, Cookiecutter, Organization) {

            $scope.course = course;
            $scope.$root.course = course;

            $scope.error = null;

            $scope.data = item || {};

            $scope.selected = {};
            $scope.ckeditorOptions = {
                toolbar: 'simple'
            }

            function getClasses(orgId) {
                $scope.classes = OrganizationV2.getClasses({
                    id: orgId,
                    isEditTeacher: true
                }, function(ok) {
                    if (item)
                        $scope.selected.courseid = item.courseId;
                    else
                        $scope.selected.courseid = Cookiecutter.getCookiebyname('course_id');
                });
            }

            function getOrgs() {
                Organization.get({
                    userId: 'me'
                }, function(organizations) {
                    $scope.organizations = organizations.organizations;
                    if (item) {
                        $scope.selected.orgId = item.orgId;
                    } else {
                        if (angular.isDefined($scope.$root.user)) {
                            $scope.selected.orgId = $scope.$root.user.org_id;
                        }
                    }

                });
            }
            if ($scope.$root.user.is_super_admin) {
                getOrgs();
                $scope.$watch('selected.orgId', function(orgId) {
                    if (orgId) {
                        getClasses(orgId);
                    }
                })
            } else {
                getClasses($scope.$root.user.org.id)
            }



            $scope.ok = function() {
                TestbankTestService.createFor($scope.selected.courseid, $scope.data)
                    .success(function(response) {
                        if (angular.isDefined(response.error)) {
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













    /*
     Golabs 14/01/2015:
     This is used when and engaged by ModalEditQuestionController
     We set question in our resolve object for $scope.open in

     */

    .controller('UtilityController', ['$rootScope', '$scope', 'User', 'ShowDatesGrades', 'topMenuOptions', 'CurrentCourseId', 'PostV2',
        function($rootScope, $scope, User, ShowDatesGrades, topMenuOptions, CurrentCourseId, PostV2) {

            User.get({
                userId: 'me'
            }, function(user) {
                $scope.user = user;
                if (!$scope.preference.navs || !$scope.menuOptions.length) {
                    fillMenuOptions($scope.preference, user);
                }

            });

            $scope.can_edit = false;
            $scope.can_grade = false;
            $scope.currentPath = window.location.pathname;
            $scope.showDates = ShowDatesGrades.showDates;
            $scope.showGrades = ShowDatesGrades.showGrades;
            $scope.showGradesAsScore = ShowDatesGrades.showGradesAsScore;
            $scope.showGradesAsLetter = ShowDatesGrades.showGradesAsLetter;
            $scope.showGradesAsPercentage = ShowDatesGrades.showGradesAsPercentage;
            $scope.showGradesPage = function(){return true;}

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
                        href: userInformation.org.use_splash ? "/home" : '/',
                        text: "Home",
                        show: true,
                        faicon: 'fa-home'
                    }, {
                        href: "/superadmin/",
                        text: $scope.preference.navs.admin.translation,
                        show: userInformation.is_super_admin || userInformation.is_organization_admin,
                        faicon: 'fa-user'
                    }, {
                        href: "/testbank/#/",
                        text: $scope.preference.navs.test_bank_builder.translation,
                        show: userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                        faicon: userInformation.org.id==10?'fa-question-circle':'fa-tasks'
                    }, {
                        href: "/editor/",
                        text: $scope.preference.navs.course_builder.translation,
                        show: userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                        faicon: 'fa-edit'
                    }, {
                        href: "/Folder/",
                        text: 'Files & Folders',
                        modal: '1',
                        show: userInformation.is_edit_teacher || userInformation.is_super_admin || userInformation.is_organization_admin,
                        faicon: 'fa-folder-open',
                        type: 'folder'
                    }, {
                        href: "/grader/",
                        text: $scope.preference.navs.grader.translation,
                        show: userInformation.is_super_admin || userInformation.is_teacher || userInformation.is_organization_admin,
                        faicon: 'fa-check',
                        type: 'grader'
                    },
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

            PostV2.countNeedingGrade({}, function(res) {
                $scope.grader = {
                    counter: res.count
                };
            })

        }
    ]).controller('PreferenceController', ['$rootScope', '$scope', '$timeout', 'Preference',
        function($rootScope, $scope, $timeout, Preference) {
            $scope.preference = {};

            Preference.get({
                userId: 'me'
            }, function(preference) {
                $rootScope.preference = preference;
                $scope.preference = preference;
            });

        }
    ]).controller('UserController', ['$rootScope', '$scope', '$timeout', 'User',
        function($rootScope, $scope, $timeout, User) {
            User.get({
                userId: 'me'
            }, function(user) {
                $scope.$root.user = user;

            });
            $scope.logout = function() {
                windown.location = '/signout';
            }

        }

    ])
    .controller('NotificationController', ['$rootScope', '$scope', '$sce', '$timeout', 'Notification',
        '$filter', '$modal', 'CurrentCourseId', 'ShowDatesGrades',
        function($rootScope, $scope, $sce, $timeout, Notification, $filter, $modal, CurrentCourseId, ShowDatesGrades) {
            $scope.notifications = new Array();
            $scope.CurrentCourseId = CurrentCourseId;
            $scope.ShowDatesGrades = ShowDatesGrades;

            Notification.get({
                notificationId: 'me'
            }, function(notifications) {
                $scope.notificationCallback(notifications);
                $scope.refreshTimer(2000);
            });

            $scope.refresh = function() {
                Notification.get({
                    notificationId: 'me'
                }, function(notifications) {
                    $scope.notificationCallback(notifications);
                });
            }

            $scope.refreshTimer = function(delay) {
                $timeout(function() {
                    Notification.get({
                        notificationId: 'me'
                    }, function(notifications) {
                        $scope.notificationCallback(notifications);
                        $scope.refreshTimer(delay);
                    });
                }, delay);
            }

            $scope.open = function(notification) {
                var modalInstance = $modal.open({
                    templateUrl: 'public/views/partials/notificationgradepost.html?cachesmash=5',
                    windowClass: 'feedback-modal',
                    controller: 'NotificationGradePostMessagesController',
                    resolve: {
                        notification: function() {
                            return notification;
                        }
                    }
                });
            };

            $scope.notificationCallback = function(notifications) {
                // console.log("Notifications: " +  angular.toJson(notifications));
                if (angular.isDefined(notifications.notifications)) {
                    $scope.notifications = notifications.notifications;
                    /*
                     Golabs 16/01/2015:
                     We get our ShowDatesGrades by the $scope.ShowDatesGrades found in services 'ShowDatesGrades' function
                     This is achieved when a call is made to the function SetDatesGrades found in the CourseController
                     ShowDatesGrades is set to scope in the NotificationController conroller which run this function.
                     */
                    for (var i = 0; i < $scope.notifications.length; i++) {
                        if ($scope.ShowDatesGrades.getDateGrades() === 0) {
                            $scope.notifications[i].htmlSafe = $sce.trustAsHtml('<a data-ng-click="open(notification)">' +
                                $rootScope.preference.navs.notification_no_score_pre_name.translation + '<i>' +
                                $scope.notifications[i].fname + ' ' + $scope.notifications[i].lname +
                                $rootScope.preference.navs.notification_no_score_post_name.translation + '</i></a>');
                        } else {
                            $scope.notifications[i].htmlSafe = $sce.trustAsHtml('<a data-ng-click="open(notification)">' +
                                $rootScope.preference.navs.notification_with_score_pre_name.translation + '<i>' +
                                $scope.notifications[i].fname + ' ' + $scope.notifications[i].lname + '</i>' +
                                $rootScope.preference.navs.notification_with_score_post_name.translation + '<br/>' +
                                $rootScope.preference.navs.notification_with_score_pre_score.translation + '<i>' +
                                $scope.notifications[i].grade +
                                $rootScope.preference.navs.notification_with_score_post_score.translation + '</i></a>');
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
    ])

// MODIFICATION OF angular-bootstrap-select-0.0.4
// see: https://github.com/joaoneto/angular-bootstrap-select
    .directive('selectpicker', ['$parse', function($parse) {
        return {
            restrict: 'A',
            require: '?ngModel',
            priority: 10,
            link: function(scope, element, attrs, controller) {
                element.selectpicker($parse(attrs.selectpicker)());
                element.selectpicker('refresh');

                if (!controller)
                    return;

                scope.$watch(attrs.ngModel, function(newVal, oldVal) {
                    scope.$evalAsync(function() {
                        if (!attrs.ngOptions || /track by/.test(attrs.ngOptions))
                            element.val(newVal);
                        element.selectpicker('refresh');
                    });
                });

                controller.$render = function() {
                    scope.$evalAsync(function() {
                        element.selectpicker('refresh');
                    });
                }
            }
        };
    }])

    .directive('autofocus', ['$timeout',
        function($timeout) {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    $timeout(function() {
                        element.focus();
                    }, 200);
                }
            };
        }
    ])

    .directive('dynamic', function($compile) {
        return {
            restrict: 'A',
            replace: true,
            link: function(scope, ele, attrs) {
                scope.$watch(attrs.dynamic, function(html) {
                    ele.html(html);
                    $compile(ele.contents())(scope);
                });
            }
        };
    })
    /*
     Golabs 30/06/2015 incorporating MAthhjax
     */
    .directive("mathjaxBind", function() {
        return {
            restrict: "A",
            controller: ["$scope", "$element", "$attrs", function($scope, $element, $attrs) {
                $scope.$watch($attrs.mathjaxBind, function(value) {
                    var $script = angular.element("<script type='math/tex'>")
                        .html(value == undefined ? "" : value);
                    $element.html("");
                    $element.append($script);
                    MathJax.Hub.Queue(["Reprocess", MathJax.Hub, $element[0]]);
                });
            }]
        };
    })
    .directive('scrollToQuestion', function () {
        return{
            scope: {
                questionId: '=?',
                scrollToQuestion: '=?'
            },
            link:function (scope, element, attributes) {
                setTimeout(function () {
                    var selectedQuestionId = scope.scrollToQuestion;
                    if (selectedQuestionId && selectedQuestionId==scope.questionId) {
                        window.scrollTo(0, element[0].offsetTop - 20)
                    }
                });
            }
        }

    });