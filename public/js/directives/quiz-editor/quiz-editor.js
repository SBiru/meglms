"use strict";
(function () {
angular.module('app')

.directive('quizEditor', [
    'Quiz',
    '$sce',
    'ReEncodeHtml',
    '$modal',
    'TestbankQuestionService',
    'TestbankTestService',
    'Gradebook',
function(Quiz,$sce,ReEncodeHtml,$modal,TestbankQuestionService,TestbankTestService,Gradebook){
    return {
        restrict:'E',
        templateUrl:'/public/views/directives/quiz-editor/quiz-editor.html?v='+window.currentJsVersion,
        scope:{
            'quizId': '=?',
            'loadingQuiz' : '=?',
            'disabled':'=?'
        },
        link:function(scope,element,attrs){
            scope.disabled = scope.disabled==undefined?true:scope.disabled;

            scope.$watch('quizId',getQuiz);
            scope.$root.$on('reloadQuiz',getQuiz);

            function getQuiz(){
                if(scope.loadingQuiz){
                    return;
                }
                scope.loadingQuiz=true;
                if(!scope.quizId) return;
                Quiz.details({
                    quizId:scope.quizId
                },prepareQuestions)
            }
            function CheckisInt(n) {
                return n % 1 === 0;
            }
            function prepareQuestions(testDetails){
                scope.testDetails = testDetails;
                var test = testDetails.test
                testDetails.questionsRandom = testDetails.questions
                for (var i = 0; i < testDetails.questions.length; i++) {
                    testDetails.questions[i].quizz_id = scope.quizId;
                    testDetails.questions[i].needGradebookRecalculation = testDetails.needGradebookRecalculation


                    if (typeof testDetails.questions[i].extra !== 'undefined') {
                        testDetails.questions[i].extra = ReEncodeHtml.rawCorrection(testDetails.questions[i].extra);
                    }


                    if (typeof testDetails.questions[i].bankname === 'undefined') {
                        if (typeof testDetails.questions[i].ChangedBank)
                            if (testDetails.questions[i].ChangedBank === null) {
                                testDetails.questions[i].ChangedBank = testDetails.questions[i].bank_id;
                                //testDetails.questions[i].bankname = '- No:' +testDetails.questions[i].bank_id;
                            } else {
                                testDetails.questions[i].bankName = '- No:' + testDetails.questions[i].ChangedBank;
                            }
                    }



                    if (testDetails.questions[i].type === "multiple") {
                        testDetails.questions[i].solution = testDetails.questions[i].solution.split(',');
                        testDetails.questions[i].optionsmatch = []
                        for (var o = 0; o < testDetails.questions[i].options.length; o++) {
                            if (testDetails.questions[i].solution.indexOf(o.toString()) !== -1) {
                                testDetails.questions[i].optionsmatch[o] = true
                            } else {
                                testDetails.questions[i].optionsmatch[o] = false
                            }
                        }
                    }

                    if (testDetails.questions[i].type === "matching") {
                        testDetails.questions[i].imgdata = angular.fromJson(testDetails.questions[i].extra);
                        //Converting back
                        var tmp = testDetails.questions[i].imgdata.matching.imagesCordinates
                        for (var x = 0; x < tmp.length; x++) {
                            tmp[x].textvalue = tmp[x].textvalue.replace(/\&quot\;/g, '"');
                        }
                    }

                    /*
                     Golabs Setting our Question number so that we cater for pagebreak as we want the user to see
                     1,2,3... right order....
                     */
                    if (testDetails.questions[i].type !== "pagebreak") {
                        if (typeof number === 'undefined') {
                            var number = 1;
                        } else {
                            number += 1;
                        }
                        testDetails.questions[i].qnumber = number
                    }

                    //Golabs Encoding back Start
                    testDetails.questions[0].prompt = ReEncodeHtml.restoreHTML(testDetails.questions[0].prompt);


                    if ((angular.isDefined(testDetails.questions[0].options)) && (typeof testDetails.questions[0].options === 'object'))
                        angular.forEach(testDetails.questions[0].options, function(value, key) {
                            if(typeof testDetails.questions[0].options[key] === 'string')
                                testDetails.questions[0].options[key] = ReEncodeHtml.restoreHTML(value);
                        });
                    //Golabs Encoding back End

                    if (testDetails.questions[0].bankName === null) {
                        testDetails.questions[0].bankName = '- No:' + testDetails.questions[0].ChangedBank
                    }

                    //console.log(testDetails.questions[i].prompt);
                    testDetails.questions[i].htmlSafeprompt = $sce.trustAsHtml(testDetails.questions[i].prompt);
                    if(testDetails.questionsRandom)
                        testDetails.questionsRandom[i].htmlSafeprompt = $sce.trustAsHtml(testDetails.questionsRandom[i].prompt);
                    /*
                     Golabs 19/03/2015
                     Setting to safe html for display
                     */
                    if (testDetails.questions[i].type === "essay") {
                        testDetails.questions[i].htmlSafeoption = $sce.trustAsHtml(testDetails.questions[i].options[0]);
                    } else if ((testDetails.questions[i].type === "klosequestions") || (testDetails.questions[i].type === 'multipart')) {

                        /*testDetails.questions[i].xmlquestion = angular.fromJson(testDetails.questions[i].extra);
                         var tmp = testDetails.questions[i].xmlquestion.questionhtml;
                         tmp = tmp.replace(/<br><br>/, '');
                         tmp = tmp.replace(/<span\s+id="Question">.*?<\/span><br>/, '');
                         tmp = tmp.replace(/u2265/g, '≥');
                         tmp = tmp.replace(/u2264/g, '≤');

                         tmp = tmp.replace(/&#39;/g, '\'');
                         tmp = tmp.replace(/&#34;/g, '"');
                         */
                        testDetails.questions[i].htmlSafeoption = $sce.trustAsHtml(ReEncodeHtml.restoreHTML(testDetails.questions[i].extra));
                    } else if (testDetails.questions[i].type === "wordmatching") {
                        testDetails.questions[i].extraOriginal = testDetails.questions[i].extra;
                        var extra = angular.fromJson(testDetails.questions[i].extra);
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

                        testDetails.questions[i].extra = angular.toJson(extra);
                        /*Golabs fixing up any doubles in extra for edit start*/

                        testDetails.questions[i].wordmatchingInputs = [];

                        for (var id in extra) {
                            var tmp = {};
                            tmp.id=id;


                            for (var value in extra[id]) {
                                if (['tmpanswers','target','matches'].indexOf(value)>=0) {
                                    continue;
                                };
                                extra[id][value] = (extra[id][value]) ? extra[id][value].replace(/\\/g, '') : extra[id][value];
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
                            testDetails.questions[i].wordmatchingInputs.push(tmp);
                        }
                        _.each(testDetails.questions[i].wordmatchingInputs,function(o){
                            if(o.value2.matches && o.value2.matches.length>1){
                                var groupId = o.value2.matches[0];
                                var lastOption;
                                _.each(o.value2.matches,function(m){
                                    var option = _.find(testDetails.questions[i].wordmatchingInputs,function(f){
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

                test.questions = testDetails.questions
                scope.test = test;
                scope.test.advancedSettings = scope.test.advancedSettings || {};
                scope.loadingQuiz=false
            }



            scope.$root.$on('questionWasDeleted',function(event,questionId){
                for(var i = 0; i<scope.test.questions.length;i++){
                    if(scope.test.questions[i].id==questionId){
                        scope.test.questions.splice(i,1);
                        break;
                    }
                }
            })
            scope.startMoving = function(question){
                scope.test.moving = question;
            }
            scope.cancelMoving = function(){
                delete scope.test.moving;
            }
            scope.moveToPosition = function(index){
                var initialIndex = scope.test.questions.indexOf(scope.test.moving);
                var finalIndex = Math.min(scope.test.questions.length-1,index+1);
                scope.test.questions.move(initialIndex,finalIndex);
                var positions = {};
                for(var i=0;i< scope.test.questions.length;i++){
                    var question = scope.test.questions[i];
                    if(question.quiz_question_id)
                        positions[question.quiz_question_id]=i;
                }
                TestbankTestService.questionPositions(0,positions);
                delete scope.test.moving;
            }
            scope.question_Spread_Points = function(recalculate) {
                var Max_points_Spread = parseFloat(scope.Max_points_Spread)
                if ((typeof Max_points_Spread === 'undefined') || (Max_points_Spread <= 0)) {
                    alert('Number must be a whole number only');
                    return;
                }

                //testing for a reasoible divisible number
                //We need to da count and also include number of random questions...
                var qcount = 0
                for (var i = 0; i < scope.test.questions.length;i++)
                {

                    if (scope.test.questions[i].type === 'Random'){
                        qcount += parseInt(scope.test.questions[i].random)
                    }
                    else{
                        qcount +=1;
                    }
                }
                var question_spread = scope.Max_points_Spread / qcount;
                if ((!CheckisInt(question_spread)) && (!CheckisInt(question_spread - .5))) {
                    alert('Number must easily divisible amongst questions');
                    return;
                }
                if(!recalculate && scope.testDetails.needGradebookRecalculation){
                    Gradebook.openRecalculationWarning(
                        function(){
                            scope.question_Spread_Points('now')
                        },
                        function(){
                            scope.question_Spread_Points('later')
                        }
                    )
                }else{
                    TestbankTestService.pointsSpread(0, {
                        'max_points': scope.Max_points_Spread,
                        'questions': scope.test.questions,
                        'old_max_points':scope.getTotalPoints(),
                        'quiz_id':scope.test.id,
                        recalculate:recalculate
                    })
                        .success(function(response) {
                            if (angular.isDefined(response.error)) {
                                scope.error = response.error;
                            }else{
                                scope.editTotal = false;
                                getQuiz();
                            }

                        })
                        .error(function(error) {
                            console.log(error);
                        });
                }



            }
            scope.canSaveQuestion = function(question) {
                return !isNaN(parseFloat(question.max_points)) && question.max_points > 0;
            }
            scope.updateQuestionPoints = function(question,recalculate) {
                if(!recalculate && scope.testDetails.needGradebookRecalculation){
                    Gradebook.openRecalculationWarning(
                        function(){
                            scope.updateQuestionPoints(question,'now')
                        },
                        function(){
                            scope.updateQuestionPoints(question,'later')
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
            scope.change_privacy = function() {
                TestbankTestService.make_private(scope.test.id, {
                    is_private: scope.test.is_private
                });
            }
            scope.change_survey = function() {
                TestbankTestService.make_survey(scope.test.id, {
                    is_survey: scope.test.is_survey
                });
            }
            scope.set_keep_highest = function(keep_highest_score) {
                TestbankTestService.set_keep_highest(scope.test.id, {
                    keep_highest_score: keep_highest_score
                });
            }
            scope.set_sort_mode = function(mode){
                TestbankTestService.set_sort_mode(scope.test.id, {
                    sort_mode: mode
                });
            }
            scope.set_questions_per_page = function(){
                TestbankTestService.set_questions_per_page(scope.test.id, {
                    questions_per_page : scope.test.questions_per_page
                });
            }
            scope.getTotalPoints = function() {
                var total = 0;
                if(!scope.test) return 0;
                angular.forEach(scope.test.questions, function(question) {
                    var points = question.random ? parseFloat(question.max_points) * question.random : parseFloat(question.max_points);
                    total += isNaN(points) ? 0 : points;
                });
                return Math.ceil(parseFloat(total));
            }
            scope.startEditing = function(){
                if(scope.test.pages.length>1){
                    $modal.open({
                        templateUrl: '/public/views/directives/quiz-editor/modals/usage.warning.modal.html',
                        controller: 'ModalQuizUsageWarningController',
                        resolve: {
                            pages: function(){return scope.test.pages},
                            quiz: function(){return {id:scope.test.id,title:scope.test.title}}
                        }
                    }).result.then(function(resp){
                            if(resp=='ok')
                                scope.disabled = false;
                            else{
                                scope.quizId = resp;
                                getQuiz();
                                scope.disabled = false;
                            }
                        });
                }
                else
                    scope.disabled = false;
            }
            scope.canChangeTotalPoints = function(){
                for(var i = 0, q=scope.test.questions[0]; i< scope.test.questions.length;i++,q=scope.test.questions[i]){
                    var extra = q.extra || {};
                    extra = typeof extra !== 'object'?JSON.parse(extra):extra;
                    if(extra.useRubric)
                        return false;
                }
                return true;
            }
            element.on('$destroy',function(){
                scope.$destroy();

            })

        }
    }
}
])
}());