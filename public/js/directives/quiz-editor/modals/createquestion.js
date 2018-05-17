//SHOULD MOVE ALL QUESTION IMPLEMENTATIONS TO THE QUESTIONS DIRECTIVES
"use strict";

(function () {
var app;
try {
    app = angular.module('app.testbank');
}
catch(err) {
    app = angular.module('app');
}
app.controller('ModalCreateQuestionController', ['$rootScope', '$scope', '$modal', '$state', 'nav', 'utils', '$sce','CurrentCourseId',
function($rootScope, $scope, $modal, $state, nav, utils, $sce,CurrentCourseId) {

    //$scope.course = nav.selected_course;
    if ($scope.bank) {
        $scope.test = $scope.bank;
    }

    $scope.create_New_Open = function(from) {

        // from:[bank|test] (helps with angular directive markup)

        var modalInstance = $modal.open({
            backdrop: 'static',
            templateUrl: '/public/views/directives/quiz-editor/modals/question.create.modal.html',
            controller: 'ModalCreateQuestionInstanceController',
            windowClass:'modal-create-question',
            resolve: {
                course: function() {
                    var course = {id:$scope.$root.currentCourseID,name:CurrentCourseId.data.name}
                    if(!course.id){
                        course = {id:$scope.test.course_id}
                    }

                    return course;
                },
                default_tags:function(){
                    return [(CurrentCourseId.data.name || $scope.test.courseName),$scope.$root.user.fname + ' ' + $scope.$root.user.lname]
                },
                from: function() {
                    return from;
                },
                parent_title: function() {
                    if (from == 'bank')
                        return $scope.bank.title;
                    if (from == 'test')
                        return $scope.test.title;
                },
                default_values: function() {
                    if (from == 'bank')
                        return {
                            bank_id: $scope.bank.id,
                            objective_id: $scope.data.original_objective_id
                        };

                    if (from == 'test') {
                        return {
                            test_id: $scope.test.id
                        };
                    }
                    return {};
                }
            }
        });

        modalInstance.result.then(function(response) {
            // find the test by id and increment the count
            if (response.test_id && nav.allTests ) {
                var t = utils.findById(nav.allTests, response.test_id);
                if (t && t.count)
                    t.count++;

                $state.go('tests.detail', {
                    testId: $state.params.testId
                },{
                    reload: true,
                    inherit: false
                });

            }

            // find the bank by id and increment the count
            if(from == 'bank'&& !response.bank_id){
                response.bank_id = $scope.bank.id
            }
            if (response.bank_id && nav.data && nav.selected_course && nav.selected_course.banks) {
                var b = utils.findById(nav.data.banks, response.bank_id);
                if (b && b.count)
                    b.count++;
            }

            // @TODO: use myArray.sort(utils.keySort)
            if (response.question) {
                /*
                 Golabs 10/03/2015
                 Testing for multiple and setting up solution for display.
                 */
                if (response.question.type === "multiple") {
                    response.question.solution = response.question.solution.split(',');
                    response.question.optionsmatch = [];
                    for (var o = 0; o < response.question.options.length; o++) {
                        if (response.question.solution.indexOf(o.toString()) !== -1) {
                            response.question.optionsmatch[o] = true;
                        } else {
                            response.question.optionsmatch[o] = false;
                        }
                    }
                }
                /*
                 Golabs 7th of April 2015
                 Display after creation of image map
                 */
                else if (response.question.type === "matching") {
                    response.question.imgdata = angular.fromJson(response.question.extra);
                }


                if ($scope.bank && $scope.bank.questions) {
                    $scope.bank.questions.push(response.question);
                    $scope.bank.count = $scope.bank.questions.length;
                }
                else if ($scope.test && $scope.test.questions) {
                    $scope.test.questions.push(response.question);
                    for (var i = 0; i < $scope.test.questions.length; i++) {

                        if ($scope.test.questions[i].type === "essay") {
                            $scope.test.questions[i].htmlSafeoption = $sce.trustAsHtml($scope.test.questions[i].options[0]);
                        } else
                            $scope.test.questions[i].htmlSafeprompt = $sce.trustAsHtml($scope.test.questions[i].prompt);
                        $scope.test.count = $scope.test.questions.length;
                    }
                }
            }
            if (typeof response.kloseQuestions !== 'undefined') {
                for (var i = 0; i < response.questionsresponse.length; i++) {
                    var tmp = response.questionsresponse[i].questionhtml;
                    tmp = tmp.replace(/<br><br>/, '');
                    tmp = tmp.replace(/<span\s+id="Question">.*?<\/span><br>/, '');
                    response.questionsresponse[i].htmlSafeoption = $sce.trustAsHtml(tmp);
                    response.questionsresponse[i].htmlSafeprompt = $sce.trustAsHtml(response.questionsresponse[i].prompt);
                    $scope.test.questions.push(response.questionsresponse[i]);
                }
            } else if (typeof response.action === 'string') {
                if (response.action === "word-matching") {
                    response.wordmatchingInputs = [];
                    var extra = angular.fromJson(response.wordMatching);
                    for (var id in extra) {
                        var tmp = {}
                        for (var value in extra[id]) {
                            if (['tmpanswers','matches','target'].indexOf(value)>=0) continue;
                            extra[id][value] = extra[id][value].replace(/\\/g, '')
                            if (typeof tmp.value2 === 'undefined') {
                                tmp.value2 = {}
                                tmp.value2.value = $sce.trustAsHtml(extra[id][value]);
                                tmp.value2.id = value;
                                continue;
                            }
                            if (typeof tmp.value1 === 'undefined') {
                                tmp.value1 = {};
                                tmp.value1.value = $sce.trustAsHtml(extra[id][value]);
                                tmp.value1.id = value;
                                continue;
                            }
                            tmp.value3 = {};
                            tmp.value3.value = $sce.trustAsHtml(extra[id][value]);
                            tmp.value3.id = value;
                        }
                        response.wordmatchingInputs.push(tmp);
                    }
                    response.htmlSafeprompt = $sce.trustAsHtml(response.prompt);
                    response.type = 'wordmatching';
                    $scope.test.questions.push(response);
                } else if (response.action === "multipart") {
                    response.htmlSafeprompt = $sce.trustAsHtml(response.prompt);
                    response.htmlSafeoption = $sce.trustAsHtml(response.extra);

                    $scope.test.questions.push(response);
                }

                if (typeof response.type === 'undefined') {
                    if (typeof response.question === "object") {
                        response.question.htmlSafeprompt = $sce.trustAsHtml(response.question.prompt);
                    }
                }
            }
            $scope.$root.$emit('questionWasCreated',response.question);
        }, function() {

            // nothing to do if closed without a valid submit
        });

    };
}
])
.controller('ModalCreateQuestionInstanceController', ['$rootScope', '$scope', '$modal', '$modalInstance', 'course', 'from', 'parent_title', 'default_values',
    'TestbankQuestionService', 'nav', '$upload', 'modifiedMatching', '$sce', 'multipartAnswerFormat', 'IllegalQuestion','default_tags','QuestionTags',
    function($rootScope, $scope, $modal, $modalInstance, course, from, parent_title, default_values,
             TestbankQuestionService, nav, $upload, modifiedMatching, $sce, multipartAnswerFormat, IllegalQuestion,default_tags,QuestionTags) {
        function init(){
            $scope.course = course;
            $scope.$root.course = course;


            /*
             Golabs 28/05/2015
             Adding in title and counter
             */
            angular.forEach(nav.allBanks, function(bank, key) {
                bank.titleCounter = bank.title + ' (' + bank.count + ')';
            })
            $scope.allBanks = nav.allBanks;
            $scope.from = from;
            $scope.questionTypes = TestbankQuestionService.questionTypes()

            $scope.values = default_values;

            $scope.values.options = [];
            $scope.values.custom_tags = [];
            $scope.values.fixed_tags = angular.copy(default_tags);
            $scope.values.max_points = 1;
            $scope.values.type = 'single';
            $scope.values.resultvalue={};
            $scope.values.edit = '__{1:MC:~red~=blue~green~purple~orange}__';

            $scope.values.bank_id = $scope.$stateParams.bankId || $scope.allBanks[0].id; //Default bank for dropdown.
            $scope.parent_title = parent_title;

            if(from=='bank'){
                $scope.values.fixed_tags.push(parent_title);
            }

            $scope.matchedImage = {};
            $scope.matchedImage.baselocation = '../public/img/clear.png';
            $scope.trustAsHtml=function(html){return $sce.trustAsHtml(html)}
            $scope.recordedEvents = [];

            var randomid = function() {
                var id = "A";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < Math.random() * (15 - 8) + 8; i++)
                    id += possible.charAt(Math.floor(Math.random() * possible.length));
                return id;
            }

            /*
             Golabs 7th of April 2015
             Returning as Dome element html or xml content.
             */
            $scope.returnDom = function(txt) {
                if (window.DOMParser) {
                    var parser = new DOMParser();
                    var xmlDoc = parser.parseFromString(txt, "text/xml");
                } else // Internet Explorer
                {
                    var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(txt);
                }
                return xmlDoc;
            }
            $scope.sortQuestionTypes = function (e){
                console.log('sorting', arguments);
            }

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
            $scope.ckeditorOptions = {
                toolbar: 'simple'
            }
            var createQuestion = function() {


                if ($scope.values.type === "single") {
                    if ($scope.values.solution === undefined || $scope.values.solution == '') {
                        alert('Error you need to provide a solution');
                        return;
                    }
                }
                if ($scope.values.type === "multiple") {
                    $scope.values.solution = '';

                    if (typeof $scope.values.resultvalue !== "object") {
                        alert('Error you need to provide a solution');
                        return;
                    }

                    for (var currentvalue in $scope.values.resultvalue) {
                        if ($scope.values.resultvalue[currentvalue]) {
                            $scope.values.solution += currentvalue + ',';
                        }
                    }
                    $scope.values.solution = $scope.values.solution.replace(/\,$/, '');
                } else if ($scope.values.type === "blank") {
                    /*
                     Golabs 11/03/2015
                     Getting our solutions to fill in the blanks
                     */
                    $scope.values.solution = '';
                    $scope.values.options = [];
                    var text = $scope.values.prompt.replace(/<[a-z].*?>|<\/[a-z].*?>/gi, ''),
                        tmp = text.match(/_\(.*?\)_/g);
                    for (var i = 0; i < tmp.length; i++) {
                        tmp[i] = tmp[i].replace(/_\(|\)_/g, '') + ',';
                        $scope.values.options.push(tmp[i].replace(/\,/g, ''));
                        $scope.values.solution += tmp[i];
                    }
                    $scope.values.solution = $scope.values.solution.replace(/\,$/, '');
                }


                else if ($scope.values.type === 'essay') {

                    $scope.values.solution = '';
                } else if ($scope.values.type === 'matching') {

                    if (typeof $scope.matching.matchedImage.height === "number") {
                        var width = $scope.matching.matchedImage.width;
                        var height = $scope.matching.matchedImage.height;
                    } else {
                        var width = $scope.matching.matchedImage.size[0];
                        var height = $scope.matching.matchedImage.size[1];
                    }

                    delete $scope.matching.matchedImage.size;
                    $scope.matching.matchedImage.height = height;
                    $scope.matching.matchedImage.width = width;
                    delete $scope.matching.matchedImage.tmp_name;
                    $scope.values.matching = $scope.matching;


                    /*
                     Golabs 14/04/2015
                     Making Sure the user fills in the text if it has been checked.
                     */
                    if ($scope.values.matching.matchedImage.imgtext === "1") {
                        var alltext = 1;
                        for (var i = 0; i < $scope.values.matching.imagesCordinates.length; i++) {
                            if ($scope.values.matching.imagesCordinates[i].textvalue == "") {
                                alltext = 0;
                            }

                            //looking for " and ' in text values.
                            $scope.values.matching.imagesCordinates[i].textvalue =
                                $scope.values.matching.imagesCordinates[i].textvalue.replace(/\"/g, '&quot;');
                        }
                        if (alltext === 0) {
                            //Reverting back if error for presentation.
                            for (var i = 0; i < $scope.values.matching.imagesCordinates.length; i++) {
                                $scope.values.matching.imagesCordinates[i].textvalue =
                                    $scope.values.matching.imagesCordinates[i].textvalue.replace(/&quot;/g, '"');
                            }
                            $scope.matchedImage.error = 2;
                            return;
                        }

                    }

                } else if (($scope.values.type === 'klosequestions')) {
                    $scope.values.questions = $scope.xmlquestions;
                    var create = 'createKlose';
                } else if (($scope.values.type === 'multipart')) {
                    $scope.values.prompt = multipartAnswerFormat.checknow($scope.values.prompt);
                    $scope.values.extra = multipartAnswerFormat.checknow($scope.values.edit);
                    var create = 'multipart';
                } else if ($scope.values.type === 'pagebreak') {
                    var create = 'pagebreak';
                } else if ($scope.values.type === 'wordmatching') {

                    //$scope.wordmatching = {};
                    if (angular.isDefined($scope.wordmatching.error)) {
                        delete $scope.wordmatching.error;
                    }

                    if ($scope.values.prompt === '') {
                        $scope.wordmatching.error = 1;
                        return;
                    }

                    if (!angular.isDefined($scope.values.wordmatchingInputs)) {
                        $scope.wordmatching.error = 3;
                        return;
                    }

                    $scope.values.wordMatching={};
                    for (var i=0;i<$scope.values.wordmatchingInputs.length;i++){
                        var row = $scope.values.wordmatchingInputs[i];
                        if(row.value1.value){
                            if(!row.value2.value){
                                $scope.wordmatching.error = 2;
                                return;
                            }
                            $scope.values.wordMatching[row.id]={}
                            $scope.values.wordMatching[row.id][row.value1.id]=row.value1.value;
                            $scope.values.wordMatching[row.id][row.value2.id]=row.value2.value;
                            $scope.values.wordMatching[row.id].tmpanswers = row.tmpanswers;
                            $scope.values.wordMatching[row.id].target=row.value2.id
                            $scope.values.wordMatching[row.id].matches=row.value2.matches
                            if(row.value3.value && $scope.values.enable_distractors){
                                $scope.values.wordMatching[row.id][row.value3.id]=row.value3.value;
                            }
                        }
                    }
                    var create = 'wordmatching';
                    //nothing to do here.
                } else if ($scope.values.type === 'studentvideoresponse') {

                    $scope.values.solution = '';
                } else if ($scope.values.type === 'information') {

                    $scope.values.solution = '';

                }

                if (typeof create === 'undefined') {
                    var create = 'createFor';
                }


                //Checking data for illegal content.
                if (IllegalQuestion.checknow($scope.values)) {
                    return;
                }
                if($scope.values.prepareQuestion)
                    $scope.values.prepareQuestion();
                saveQuestion(create);
            };
            function saveQuestion(create){
                TestbankQuestionService[create]($scope.course.id, $scope.values)
                    .success(handleCreateQuestionResponse)
                    .error(function(error) {console.log(error);});
            }
            function handleCreateQuestionResponse(response){
                {

                    if (response.error) {
                        if(response.show_error){
                            $scope.values.error=response.error;
                        }
                        if(response.error=='missing_correct_answer'){
                            $scope.values.error="This question has no correct answer. Make sure you have an '=' in the beginning of any of the options"
                        }
                        else{
                            $scope.matchedImage.error = 1;
                        }

                    } else {
                        response.question = response.question || {id:response.id};
                        $scope.values.custom_tags = $scope.values.custom_tags.concat(response.tags);
                        saveTags(response.question).then(function(){
                            $scope.matchedImage.error = 0;
                            $modalInstance.close(response);
                            $scope.$root.$broadcast('reloadQuiz');
                        })
                    }
                }
            }
            function saveTags(question){
                var callback,
                    tags = _.map($scope.values.custom_tags,function(tag){
                        return tag.id
                    });

                QuestionTags.save({id: question.id,tags:tags}).$promise.then(
                    function(tags){
                        question.custom_tags = tags;
                        question.fixed_tags = default_tags;
                        callback && callback();
                    },
                    function(error){
                        toastr.error("Something went wrong :(");
                    }
                );
                return {
                    then:function(fn){
                        callback = fn;
                    }
                }
            }

            $scope.changeType = function() {
                if ($scope.values.type === "truefalse") {
                    $scope.values.options = ['True', 'False'];
                } else {
                    $scope.values.options = [];
                }

                if (($scope.values.type === "klosequestions") || ($scope.values.type === "pagebreak")) {
                    $scope.noshowprompt = 1;
                } else {
                    if (angular.isDefined($scope.noshowprompt)) {
                        delete $scope.noshowprompt
                    }
                }

                if (($scope.values.type === "matching") || ($scope.values.type === "pagebreak")) {
                    $scope.noshowfeedback = 1;
                } else {
                    if (angular.isDefined($scope.noshowfeedback)) {
                        delete $scope.noshowfeedback
                    }
                }

                if ($scope.values.type === "pagebreak") {
                    document.getElementsByClassName("modal-dialog")[0].style.height = '250px';
                } else {
                    document.getElementsByClassName("modal-dialog")[0].style.height = '100%';
                }
                if (($scope.values.type === "wordmatching")) {
                    if(!$scope.values.wordMatching){
                        $scope.addMultipleWordSet(5);
                    }
                }
                if (($scope.values.type === "information")) {
                    $scope.values.max_points = 0;
                } else {
                    $scope.values.max_points = $scope.values.max_points == 0 ? 1 : $scope.values.max_points;
                }
            };

            $scope.onFileSelect = function($files) {
                $scope.selectedFiles = $files;
                var _URL = window.URL || window.webkitURL;
                var img = new Image();
                img.src = _URL.createObjectURL($files[0]);
                img.onload = function() {
                    $scope.matchedImage.size = [this.width, this.height];
                    $scope.uploadPost();

                    if ((this.width > 1024) || (this.height > 768)) {
                        $scope.errorsize = 1;
                        delete $scope.matchedImage.savedname;
                        delete $scope.is_uploading;
                        return;
                    } else {
                        if (angular.isDefined($scope.errorsize)) {
                            delete $scope.errorsize;
                        }
                        if (angular.isDefined($scope.errortype)) {
                            delete $scope.errortype;
                        }
                    }
                };
            };

            $scope.uploadPost = function() {
                $scope.is_uploading = true;
                $scope.progress_upload = 0;

                //$files: an array of files selected, each file has name, size, and type.
                var $files = $scope.selectedFiles
                for (var i = 0; i < $files.length; i++) {
                    var file = $files[i];

                    $scope.upload = $upload.upload({
                        url: '/post/createImage/', //upload.php script, node.js route, or servlet url
                        //method: 'POST' or 'PUT',
                        //headers: {'header-key': 'header-value'},
                        //withCredentials: true,
                        data: {},
                        file: file,
                    }).progress(function(evt) {
                        $scope.progress_upload = parseInt(100.0 * evt.loaded / evt.total);
                        $('.progress-bar').width($scope.progress_upload + '%')
                    }).success(function(data, status, headers, config) {

                        if (!data.savedname.match(/\.png|\.jpg|\.jpeg|\.bmp/i)) {
                            $scope.errortype = 1;
                            return;
                        } else if (typeof $scope.errorsize !== 'undefined') {
                            if (angular.isDefined($scope.errortype)) {
                                delete $scope.errortype;
                            }
                            return;
                        }
                        // file is uploaded successfully
                        if (data.message == 'successful') {
                            data.baselocation = data.baselocation.replace(/^\W/, '../');
                            $scope.matchedImage = data;
                            matchedImage();
                            $scope.matchedImage.selectedtick = 'blank';
                            $scope.matchedImage.selectcolortext = 'matchingblank';
                            $scope.matchedImage.imgtext = 0;
                            $scope.matchedImage.error = 0;

                        } else {
                            alert(data.message);
                        }
                    });
                }
            };

            /*
             Golabs 1st of April 2015 calling our clearlastCordinates in testbank-service.js
             */
            $scope.clearlastCordinates = function(coords) {
                modifiedMatching.clearlastCordinates($scope, coords);
            }

            /*
             Golabs 1st of April 2015 calling our setCordinates in testbank-service.js
             */
            $scope.setCordinates = function() {
                if (modifiedMatching.setCordinates($scope) === 'error') {
                    alert('ERROR :No cordiates selected');
                };

            }

            $scope.clearCordinates = function() {
                $scope.recordedEvents = [];
            }

            $scope.matching_Create = function() {
                $scope.matching = {},
                    $scope.matching.imagesCordinates = $scope.recordedEvents;
                $scope.matching.matchedImage = $scope.matchedImage;
                createQuestion();
            }

            $scope.selecttick = function(tick) {
                $scope.matchedImage.selectedtick = tick;
                modifiedMatching.createModifyelements($scope);
            }

            $scope.selectcolortext = function(tick) {
                $scope.matchedImage.selectcolortext = tick;
            }

            /*
             Golabs 8th of April 2015
             Remove all xmlquestions
             */
            $scope.resetxmlquestions = function() {
                delete $scope.xmlquestions;
            }
            /*
             Golabs 8th of April 2015
             Remove a single question from xmlquestions.
             */
            $scope.kloseRemove = function(index) {
                var questions = [];
                index = parseInt(index);
                for (var i = 0; i < $scope.xmlquestions.length; i++) {
                    if (i !== index) {
                        questions.push($scope.xmlquestions[i]);
                    }
                }

                $scope.xmlquestions = questions;
            }

            /*
             Golabs 8th of April 2015
             This is our heavy lifter function for preparing the Klose Question for display
             */

            $scope.SetQuestionReference = function(question) {
                var re = new RegExp("/\{1:(\w{2}):(.*?)\}/", "g");
                question = question.replace(/\{1:(\w{2}):(.*?)\}/g, function(match, shortHand, reference) {
                    var embeded = '';

                    var randomid = function() {
                        var id = "A";
                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                        for (var i = 0; i < Math.random() * (15 - 8) + 8; i++)
                            id += possible.charAt(Math.floor(Math.random() * possible.length));
                        return id;
                    }

                    switch (shortHand) {
                        //Answer to question or part
                        case 'NM':
                            reference = reference.replace(/~=/, '');
                            var randomid = randomid();
                            $scope.data.answers[randomid] = reference;
                            reference = '<input id="' + randomid + '" style="width:30px;height:27px" value="' + reference + '">';
                            break;
                        //Multiple Choice creation
                        case 'MC':
                            var data = reference.split(/~/),
                                reference = '<select style="height:27px">',
                                datatrim = '';;
                            for (var i = 0; i < data.length; i++) {
                                datatrim = data[i].trim();
                                if (datatrim) {
                                    if (datatrim.match(/^=/)) {
                                        var randomid = randomid();
                                        $scope.data.answers[randomid] = datatrim.replace(/^=/, '');

                                    }
                                    reference += '<option>' + data[i].trim() + '</option>';
                                }
                            }
                            reference += '</select>';
                            break;
                    }
                    //console.log(shortHand + ' ' + reference);
                    return reference;
                });

                return question.replace(/__/g, '');
            }

            $scope.SetQuestionLifter = function(data, type) {
                $scope.data = data;
                $scope.data.answers = {};
                $scope.data.questionhtml = '';
                //removing all html in quesiont...
                var question = $scope.data.question.replace(/\\w/g, '\\\\');
                //question = question.replace(/<\w+.*?>|<\/\w+>/g,'');
                question = question.replace(/\s+/g, ' ');
                question = question.
                    replace(/&amp;/g, "&").
                    replace(/&gt;/g, ">").
                    replace(/&lt;/g, "<").
                    replace(/&nbsp;/g, " ").
                    replace(/&ge;/g, "≥").
                    replace(/&le;/g, "≤").
                    replace(/&quot;/g, '"');

                question = question.replace(/\$.*?\$/, '');
                var questionRef = $scope.SetQuestionReference(question),
                    questionStudent = questionRef.replace(/value=".*?"/g, 'value=""');
                $scope.data.questionhtml += '<br><br><span id="Question">Question : <input style="width: 70%" value="' + $scope.data.title + '"></span><br>';

                if (type === 'klose') {
                    $scope.data.questionhtml += '<span><br><strong>Pre Prepaird Question</strong><br><table><tr><td style="width:75px;white-space: nowrap;vertical-align:middle">f(x) = </td>' +
                        '<td style="font-size:500%;vertical-align:middle;width:60px">{</td>' +
                        '<td style="vertical-align:middle">' + question + '</td></tr></table></span>';
                    $scope.data.questionhtml += '<span><br><strong>Teacher View</strong><br><table><tr><td style="width:75px;white-space: nowrap;vertical-align:middle">f(x) = </td>' +
                        '<td style="font-size:500%;vertical-align:middle;width:60px">{</td>' +
                        '<td style="vertical-align:middle">' + questionRef + '</td></tr></table></span>';
                    $scope.data.studentview = '<table><tr><td style="width:75px;white-space: nowrap;vertical-align:middle">f(x) = </td>' +
                        '<td style="font-size:500%;vertical-align:middle;width:60px">{</td>' +
                        '<td style="vertical-align:middle">' + questionStudent + '</td></tr></table>';
                } else if (type === 'multi') {
                    questionStudent = questionStudent.replace(/<option>=/g, '<option>');
                    $scope.data.questionhtml += '<span><br><strong>Pre Prepaird Question</strong><br><table><tr>' +
                        '<td style="vertical-align:middle">' + question + '</td></tr></table></span>';
                    $scope.data.questionhtml += '<span><br><strong>Teacher View</strong><br><table><tr>' +
                        '<td style="vertical-align:middle">' + questionRef + '</td></tr></table></span>';
                    $scope.data.studentview = '<table><tr>' +
                        '<td style="vertical-align:middle">' + questionStudent + '</td></tr></table>';
                }

                $scope.data.questionhtml += '<span><br><strong>Student View</strong><br>' + $scope.data.studentview + '</span>';

                if (typeof $scope.data.imgsrc !== 'undefined') {
                    $scope.data.img = '<img src="' + $scope.data.imgsrc + '" border="0" alt="">';
                }
                if (typeof $scope.data.questionhtml !== 'undefined') {
                    $scope.data.questionhtml += $scope.data.img;
                }
                if (typeof $scope.data.questionhtml !== 'undefined') {
                    $scope.data.htmlSafeprompt = $sce.trustAsHtml($scope.data.questionhtml);
                }
                delete data.question;
                return data;
            }

            /*
             Golabs 7th of April 2015
             This will take in a Klose question mainly piecewise function
             and parse the content.
             */
            $scope.parsexml = function(txt) {
                var xmlDoc = $scope.returnDom(txt);
                var children = xmlDoc.children[0].childNodes,
                    questions = new Array(),
                    question, data = {};
                for (var i = 0; i < children.length; i++) {
                    if (children[i].tagName === "question") {
                        if (typeof children[i].attributes === "object") {
                            for (var j in children[i].attributes) {
                                if (typeof children[i].attributes[j].nodeName === "string")
                                    if ((children[i].attributes[j].nodeName === "type") && (children[i].attributes[j].nodeValue === "cloze")) {
                                        data = {};
                                        question = $scope.returnDom(children[i].outerHTML).getElementsByTagName('questiontext')[0].getElementsByTagName('text')[0].outerHTML.replace(/\n\n|\n|\r/g, '')
                                        data.title = question.match(/<h4 class="text">(.*?)</)[1];
                                        data.question = question.match(/<p id="piecewise" class="eqn text">(.*?)<\/p>/)[1];
                                        data.imgsrc = question.match(/<img\s+src="(.*?)"/)[1];
                                        questions.push($scope.SetQuestionLifter(data, 'klose'));
                                        delete $scope.data;
                                    }
                            }
                        }
                    }
                }
                $scope.xmlquestions = questions;
            }

            /*
             Golabs 21st of April 2015
             Creating new wordmathing paid
             */
            $scope.addMultipleWordSet = function(count) {
                for(var i = 0;i<count;i++){
                    $scope.addWordSet();
                }
            }
            $scope.addWordSet = function(parent,i) {

                $scope.wordmatching = {};

                var id = randomid(),
                    tmp = {},
                    tmpanswers = {},
                    matched1 = randomid(),
                    matched2 = randomid(),
                    matched3 = randomid();
                tmp[matched1] = parent?parent.value1.value:'';
                tmp[matched2] = '';
                tmp[matched3] = '';
                tmp['tmpanswers'] = matched1 + matched2;
                if (!angular.isDefined($scope.textHhtml)) {
                    $scope.textHhtml = '';
                }

                if (typeof $scope.values.wordMatching === 'undefined') {
                    $scope.values.wordMatching = {};
                    $scope.html = '';
                    $scope.values.answers = [];
                    $scope.values.wordmatchingInputs=[];
                }
                $scope.values.wordMatching[id] = tmp;
                var option = {
                    id:id,
                    value1:{
                        id:matched1,
                        value:tmp[matched1]
                    },
                    value2:{
                        id:matched2,
                        value:tmp[matched2],
                        matches:parent?parent.value2.matches.concat([matched1]):[matched1]
                    },value3:{
                        id:matched1,
                        value:tmp[matched3]
                    },tmpanswers:tmp['tmpanswers'],

                }
                if(parent){
                    option.static=true;
                    option.groupId=parent.groupId||parent.id
                    parent.groupId=parent.groupId||parent.id
                    $scope.values.wordmatchingInputs.splice(i+1,0,option);
                    toggleWordMathGroup(option.groupId,matched1,true);
                }
                else
                    $scope.values.wordmatchingInputs.push(option);

            }
            function toggleWordMathGroup(groupId,matched1,add,matches){
                var lastOption=undefined;
                _.each($scope.values.wordmatchingInputs,function(o){
                    if(o.groupId==groupId){
                        o.hideButton=true;
                        lastOption=o;
                        if(add){
                            if(o.value2.matches.indexOf(matched1)<0)
                                o.value2.matches.push(matched1)
                        }else{
                            if(o.value2.matches.indexOf(matched1)>=0)
                                o.value2.matches.splice(o.value2.matches.indexOf(matched1),1);
                        }
                    }
                })
                lastOption.hideButton=false;

            }
            $scope.resetckshow = function(){
                for (var i = 0; i < $scope.values.wordmatchingInputs.length;i++)
                {
                    if (angular.isDefined($scope.values.wordmatchingInputs[i])){
                        $scope.values.wordmatchingInputs[i].ck = 0;
                    }
                }
            }


            $scope.RemoveWordmatching = function(id) {

                var row = _.findWhere($scope.values.wordmatchingInputs,{id:id});
                var index = $scope.values.wordmatchingInputs.indexOf(row);
                $scope.values.wordmatchingInputs.splice(index,1);
                if(row.groupId)
                    toggleWordMathGroup(row.groupId,row.value1.id,false);
            }

            $scope.modalAnswerChange = function(text) {
                $scope.Answer = text
            }
            $scope.canSave = function(){
                if($scope.values&&$scope.values.canSave)
                    return $scope.values.canSave()
                return true;
            }
            $scope.ok_Create = function() {
                // convert to options to json array
                var options = [];
                angular.forEach($scope.values, function(value, key) {
                    this.push(value);
                }, options);
                // add the simplified array to the value list to be submitted
                $scope.values.options_array = options;

                /*Golabs 09/02/2015
                 Testing for a bank_id if we do not have one we will use the default
                 if default does not exist we will create and gets its id.
                 */
                if (typeof $scope.values.bank_id === 'undefined') {
                    var banks = $scope.course.banks,
                        def = false;
                    for (var i = 0; i < banks.length; i++) {
                        if (banks[i].title === 'default') {
                            $scope.values.bank_id = banks[i].id;
                            def = true;
                            //We can go ahead and create our question
                            createQuestion();
                        }
                    }
                    if (def === false) {
                        var data = {
                            objective_id: 0,
                            title: "default"
                        };
                        return;
                        TestbankQuestionService.bankcreateFor($scope.course.id, data)
                            .success(function(response) {
                                if (angular.isDefined(response.error)) {
                                    alert(response.error);
                                    return;
                                } else {
                                    //Success with creation creation.
                                    $scope.values.bank_id = response.bank.id;
                                    //Creating our question now we have our bank id
                                    createQuestion();
                                }
                            })
                            .error(function(error) {
                                alert(error);
                                return;
                            });
                    }
                } else {
                    createQuestion();
                }
            };

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

            $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
            };
        }

        if(nav.allBanks)
            init()
        else
            nav.loadBanks(init);
    }
]);

}());