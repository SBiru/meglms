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
     Golabs 14/01/2015:
     When a user clicks on the the Edit this "ModalEditQuestionController" set up the modal window.
     We are sending the whole question and populating the appropriate edit modal window
     Depending on Question type ie Multiple Choice "Still to be done."
     Edit button in testbank.html
     */
    .controller('ModalEditQuestionController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'utils', '$sce',
        function($rootScope, $scope, $modal, $state, nav, utils, $sce) {
            $scope.open = function(question,quiz) {
                var modalInstance = $modal.open({
                    templateUrl: '/public/views/directives/quiz-editor/modals/question.edit.modal.html',
                    controller: 'ModalEditQuestionInstanceController',
                    windowClass:'edit-question',
                    resolve: {
                        //Golabs add in our question to the global options in the ModalCreateQuestionInstanceController
                        //singlequestion is our question object all we need
                        question: function() {
                            return question.singlequestion;
                        },
                        quiz:function(){
                            return quiz
                        }
                    }
                });


                modalInstance.result.then(function(response) {
                    if (response.type === 'multipart') {
                        $scope.question.htmlSafeoption = $sce.trustAsHtml(response.extra);
                    }
                    if($state.includes('tests')){
                        $state.go('tests.detail', {
                            testId: $state.params.testId
                        });
                    }

                }, function() {

                });
            };
            $scope.checkboxclicked = function(id) {
                $scope.selectedQuestions.push(id);
            }
        }
    ])
    /*
     Golabs 14/01/2015:
     This is used when and engaged by ModalEditQuestionController
     We set question in our resolve object for $scope.open in

     */
    .controller('ModalEditQuestionInstanceController', ['$rootScope', '$scope', '$modal', '$modalInstance', 'TestbankQuestionService', 'question', '$sce', 'modifiedMatching', 'mathJaxConvert', 'nav', 'Alerts', 'ReEncodeHtml', 'multipartAnswerFormat', 'IllegalQuestion','Gradebook','quiz',
        function($rootScope, $scope, $modal, $modalInstance, TestbankQuestionService, question, $sce, modifiedMatching, mathJaxConvert, nav, Alerts, ReEncodeHtml, multipartAnswerFormat, IllegalQuestion,Gradebook,quiz) {
            function init() {
                $scope.question = question;
                $scope.quiz = quiz;
                var original = angular.copy(question);
                $scope.shared={error:null};
                $scope.matchedImageset = false;
                $scope.allBanks = nav.allBanks;
                if(quiz)
                $scope.$root.course = {id:quiz.course_id};

                $scope.question.bank_id = $scope.question.ChangedBank
                $scope.question.bankChanged = false;
                for (var i = 0; i < $scope.allBanks.length; i++) {
                    if ($scope.allBanks[i].id == $scope.question.bank_id) {
                        $scope.bankey = i;
                        break;
                    }
                }
                if ($scope.question.type === "matching") {
                    var test = angular.fromJson($scope.question.extra);
                    $scope.matchedImage = test.matching.matchedImage;
                    $scope.recordedEvents = test.matching.imagesCordinates;
                    $scope.matchedImage.selectedtick = $scope.question.imgdata.matching.matchedImage.selectedtick;
                    $scope.matchedImage.selectcolortext = $scope.question.imgdata.matching.matchedImage.selectcolortext;

                    //Reverting &quot; back to "
                    for (var x = 0; x < $scope.recordedEvents.length; x++) {
                        $scope.recordedEvents[x].textvalue = $scope.recordedEvents[x].textvalue.replace(/\&quot\;/g, '"');
                    }
                    //matchedImage();
                } else if ($scope.question.type === 'multipart') {
                    //$scope.question.essay = CKEDITOR.instances.multipartEdit.getData();
                    if (typeof $scope.question.edit !== 'object') {
                        $scope.question.edit = $sce.trustAsHtml($scope.question.edit);
                    }
                }
                $scope.trustAsHtml = function (html) {
                    return $sce.trustAsHtml(html)
                }
                $scope.SetmatchedImage = function () {
                    if (!$scope.matchedImageset) {
                        $scope.matchedImageset = true;

                        if (typeof $scope.recordedEvents === "object") {
                            /*
                             Golabs 01/04/2015
                             Grabbing our first item and setting the cropper values
                             */
                            SetmatchedImage($scope.recordedEvents[0].matchedImagewidth, $scope.recordedEvents[0].matchedImageheight, 100, 100);
                            modifiedMatching.createModifyelements($scope);
                        }
                    }
                }

                /*
                 Golabs 1st of April 2015 calling our clearlastCordinates in testbank-service.js
                 */
                $scope.clearlastCordinates = function (coords) {
                    modifiedMatching.clearlastCordinates($scope, coords, question);
                }

                $scope.selecttick = function (tick) {
                    $scope.matchedImage.selectedtick = tick;
                    modifiedMatching.createModifyelements($scope);
                }

                $scope.selectcolortext = function (tick) {
                    $scope.matchedImage.selectcolortext = tick;
                }

                /*
                 Golabs 1st of April 2015 calling our setCordinates in testbank-service.js
                 */
                $scope.setCordinates = function () {
                    modifiedMatching.setCordinates($scope);
                }

                /*
                 Golabs 11/03/2015
                 When a user clicks on a checkbox in multiple answer questions
                 We will set out the solution and optionsmatch for solution and display.
                 */
                $scope.editmulti = function (response, question) {
                    question.solutiontmp = [];
                    question.optionsmatchtmp = [];
                    for (var i = 0; i < question.options.length; i++) {
                        if (document.getElementById(question.id.toString() + question.options[i]).checked) {
                            question.solutiontmp.push(i.toString());
                            question.optionsmatchtmp[i] = true;
                        } else {
                            question.optionsmatchtmp[i] = false;
                        }
                    }
                }

                $scope.matching_Edit = function () {
                    $scope.question.prompt = CKEDITOR.instances.modalPrompt.getData();

                }

                $scope.wordmatchextra = function (tmp) {
                    $scope.tmp = tmp;
                    if (angular.isDefined($scope.question.extraOriginal)) {
                        $scope.question.extra = $scope.question.extraOriginal.replace(/\\n|\\/g, '');
                    }
                    var extra = angular.fromJson($scope.question.extra);
                    angular.forEach(extra, function (obj, key) {
                        if (obj[$scope.tmp.id])
                            obj[$scope.tmp.id] = $scope.tmp.value
                    })
                    $scope.question.extra = angular.toJson(extra);
                    $scope.question.extraOriginal = $scope.question.extra;
                }
                $scope.addMultipleWordSet = function (count) {
                    for (var i = 0; i < count; i++) {
                        $scope.addWordSet();
                    }
                }
                var randomid = function () {
                    var id = "A";
                    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                    for (var i = 0; i < Math.random() * (15 - 8) + 8; i++)
                        id += possible.charAt(Math.floor(Math.random() * possible.length));
                    return id;
                }
                $scope.addWordSet = function (parent, i) {

                    var id = randomid(),
                        tmp = {},
                        tmpanswers = {},
                        matched1 = randomid(),
                        matched2 = randomid(),
                        matched3 = randomid();
                    tmp[matched1] = parent ? parent.value1.value : '';
                    tmp[matched2] = '';
                    tmp[matched3] = '';
                    tmp['tmpanswers'] = matched1 + matched2;

                    var option = {
                        id: id,
                        value1: {
                            id: matched1,
                            value: tmp[matched1]
                        },
                        value2: {
                            id: matched2,
                            value: tmp[matched2],
                            matches: parent ? parent.value2.matches.concat([matched1]) : [matched1]
                        }, value3: {
                            id: matched1,
                            value: tmp[matched3]
                        }, tmpanswers: tmp['tmpanswers'],

                    }
                    if (parent) {
                        option.static = true;
                        option.groupId = parent.groupId || parent.id
                        parent.groupId = parent.groupId || parent.id
                        question.wordmatchingInputs.splice(i + 1, 0, option);
                        toggleWordMathGroup(option.groupId, matched1, true);
                    }
                    else
                        question.wordmatchingInputs.push(option);


                }
                $scope.resetckshow = function () {
                    for (var i = 0; i < question.wordmatchingInputs.length; i++) {
                        if (angular.isDefined(question.wordmatchingInputs[i])) {
                            question.wordmatchingInputs[i].ck = 0;
                        }
                    }
                }
                function toggleWordMathGroup(groupId, matched1, add, matches) {
                    var lastOption = undefined;
                    _.each(question.wordmatchingInputs, function (o) {
                        if (o.groupId == groupId) {
                            o.hideButton = true;
                            lastOption = o;
                            if (add) {
                                if (o.value2.matches.indexOf(matched1) < 0)
                                    o.value2.matches.push(matched1)
                            } else {
                                if (o.value2.matches.indexOf(matched1) >= 0)
                                    o.value2.matches.splice(o.value2.matches.indexOf(matched1), 1);
                            }
                        }
                    })
                    lastOption.hideButton = false;

                }

                $scope.RemoveWordmatching = function (id) {
                    var row = _.findWhere(question.wordmatchingInputs, {id: id});
                    var index = question.wordmatchingInputs.indexOf(row);
                    question.wordmatchingInputs.splice(index, 1);
                    if (row.groupId)
                        toggleWordMathGroup(row.groupId, row.value1.id, false);
                }
                $scope.wordmathingedit = function (i, value) {
                    var tmp = {};
                    tmp.id = question.wordmatchingInputs[i][value].id;
                    tmp.ckeobj = document.getElementById(tmp.id).children[1].id.replace(/cke_/, '');
                    tmp.value = CKEDITOR.instances[tmp.ckeobj].getData();
                    tmp.value = tmp.value.replace(/\r\n|\r|\n/g, '');
                    //tmp.value = tmp.value.replace(/"/g, '\\"');
                    tmp.value = ReEncodeHtml.provisionHTML(tmp.value);
                    $scope.wordmatchextra(tmp);
                    return ReEncodeHtml.restoreHTML(tmp.value);
                }

                $scope.BankChanged = function () {
                    $scope.question.bankChanged = true;
                }


                $scope.ok_Edit = function (recalculate) {
                    if ($scope.question.type === 'multiple') {
                        question.solution = question.solutiontmp;
                        question.optionsmatch = question.optionsmatchtmp;
                    }

                    if ($scope.question.type === 'multipart') {
                        $scope.question.extra = multipartAnswerFormat.checknow(question.edit);
                        $scope.question.htmlSafeoption = $sce.trustAsHtml($scope.question.extra);
                    }

                    // convert to options to json array
                    var options = [];
                    var id = '',
                        ckeobj = {},
                        value;
                    angular.forEach($scope.question.options, function (value, key) {
                        this.push(value);
                    }, options);
                    // add the simplified array to the question list to be submitted
                    $scope.question.options_array = options;
                    $scope.question.prompt = CKEDITOR.instances.modalPrompt.getData();

                    if ($scope.question.type === 'essay') {
                        if (typeof CKEDITOR.instances.modalPromptessay !== "undefined") {
                            $scope.question.essay = CKEDITOR.instances.modalPromptessay.getData();
                        } else {
                            $scope.question.essay = CKEDITOR.instances.modalPrompt.getData();
                        }
                        //$scope.question.htmlSafeoption = $sce.trustAsHtml($scope.question.essay);
                        $scope.question.essay = '';
                    }

                    if ($scope.question.type === 'matching') {
                        $scope.question.imgdata.matching.imagesCordinates = $scope.recordedEvents;
                        $scope.question.imgdata.matching.matchedImage.selectedtick = $scope.matchedImage.selectedtick;
                        $scope.question.imgdata.matching.matchedImage.selectcolortext = $scope.matchedImage.selectcolortext;
                        $scope.question.imgdata.matching.matchedImage.imgtext = $scope.matchedImage.imgtext;
                        for (var i = 0; i < $scope.question.imgdata.matching.imagesCordinates.length; i++) {
                            $scope.question.imgdata.matching.imagesCordinates[i].textvalue =
                                $scope.question.imgdata.matching.imagesCordinates[i].textvalue.replace(/"/g, '&quot;');
                        }

                        $scope.question.extra = angular.toJson($scope.question.imgdata);
                    } else if ($scope.question.type === 'wordmatching') {
                        $scope.question.wordmatching = {}
                        var extra = {};
                        for (var i = 0; i < $scope.question.wordmatchingInputs.length; i++) {
                            var row = $scope.question.wordmatchingInputs[i];
                            if (row.value1.value) {
                                if (!row.value2.value) {
                                    $scope.question.wordmatching.error = 2;
                                    return;
                                }
                                extra[row.id] = {}
                                extra[row.id][row.value1.id] = row.value1.value;
                                extra[row.id][row.value2.id] = row.value2.value;
                                extra[row.id].target = row.value2.id
                                extra[row.id].matches = row.value2.matches
                                if (row.value3 && row.value3.value && $scope.question.enable_distractors) {
                                    extra[row.id][row.value3.id] = row.value3.value;
                                }
                                extra[row.id].tmpanswers = row.value1.id + row.value2.id;
                            }
                            else {
                                $scope.question.wordmatching.error = 2;
                                return;
                            }
                        }

                        question.extra = angular.toJson(extra);
                        /*Golabs fixing up any doubles in extra for edit start*/

                    } else if ($scope.question.type === 'blank') {
                        $scope.question.solution = '';
                        $scope.question.options = [];
                        var text = $scope.question.prompt.replace(/<[a-z].*?>|<\/[a-z].*?>/gi, ''),
                            tmp = text.match(/_\(.*?\)_/g);
                        for (var i = 0; i < tmp.length; i++) {
                            tmp[i] = tmp[i].replace(/_\(|\)_/g, '') + ',';
                            $scope.question.options.push(tmp[i].replace(/\,/g, ''));
                            $scope.question.solution += tmp[i];
                        }
                        $scope.question.solution = $scope.question.solution.replace(/\,$/, '');
                    }


                    //Golabs ReEncodeHtml Start
                    if ((angular.isDefined($scope.question.options)) && (typeof $scope.question.options === 'object'))
                        angular.forEach($scope.question.options, function (value, key) {
                            $scope.question.options[key] = ReEncodeHtml.restoreHTML(value);
                        });
                    //Encoding back into html formant
                    $scope.question.prompt = ReEncodeHtml.restoreHTML($scope.question.prompt);
                    //Golabs ReEncodeHtml End

                    //We are updating our edit information....
                    $scope.question.htmlSafeprompt = $sce.trustAsHtml($scope.question.prompt);
                    //Golabs 13/07/2015 Checking for MathJax insertion into question.
                    $scope.question = mathJaxConvert.parseQuestion($scope.question);
                    if ($scope.$state.includes('tests')) {
                        $scope.question.testId = $scope.$state.params.testId;
                    }

                    //Checking data for illegal content.
                    if (IllegalQuestion.checknow($scope.question)) {
                        return;
                    }


                    if (!recalculate && $scope.question.needGradebookRecalculation && original.max_points != $scope.question.max_points) {
                        Gradebook.openRecalculationWarning(
                            function () {
                                $scope.ok_Edit('now')
                            },
                            function () {
                                $scope.ok_Edit('later')
                            }
                        )
                    } else {
                        $scope.question.recalculate = recalculate
                        if($scope.question && $scope.question.prepareQuestion)
                            $scope.question.prepareQuestion();
                        TestbankQuestionService.update($scope.question.id, $scope.question)
                            .success(function (response) {
                                if (response.error) {
                                    $scope.question.error = response.error;
                                } else {
                                    $modalInstance.close(response);
                                }
                            })
                            .error(function (error) {

                            });
                    }

                };
                $scope.canSave = function(){
                    if($scope.question && $scope.question.canSave)
                        return $scope.question.canSave()
                    return true;
                }
                $scope.cancel = function () {
                    $modalInstance.dismiss('cancel');
                };
                $scope.modallistoverflow = function () {
                    return "height:" + TestbankQuestionService.getHeight() * .4 + "px";
                }
            }
            if(nav.allBanks)
                init()
            else
                nav.loadBanks(init);
        }

    ])
}());