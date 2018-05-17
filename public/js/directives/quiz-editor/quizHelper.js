"use strict";
(function () {
    try {
        var app = angular.module('app.testbank');
    }
    catch(err) {
        var app = angular.module('app');
    }
app.factory("QuizHelper",['$sce',function($sce){
    var ExtendScope = {}
    ExtendScope.radioIcon = function(question, option) {
        if (question.response !==null && (question.response === option.order || question.response === option.sort_order || question.response === option.text || question.response == option))
            return '/public/img/radiobutton_selected.png';
        return '/public/img/radiobutton_unselected.png';
    };
    ExtendScope.TestSelected = function(question, option) {
        if (question.response == option.sort_order || question.response == option.text)
            return true;
        return false
    }
    ExtendScope.safeHtml = function(html) {
        return $sce.trustAsHtml(html)
    }
    ExtendScope.getTotalScore = function(quiz) {
        var total = 0;
        angular.forEach(quiz.questions, function(q) {
                var val = parseFloat(q.is_correct);
                if (val >= 0)
                    total += val;
            }
        );

        return Math.round(total * 100) / 100;
    }
    ExtendScope.getSolution = function (question) {
        return question.options[0].text;
    }
    ExtendScope.isCorrectAnswer = function (question, index) {
        return question.solution.split(',').indexOf(String(index)) >= 0
    }
    ExtendScope.isSelected = function(question, index) {

        if (question.response && question.response.split && question.response.split(',').indexOf(String(index)) >= 0)
            return '/public/img/radiobutton_selected.png';
        else
            return '/public/img/radiobutton_unselected.png';
    }
    ExtendScope.getQuestionSrc = function (question) {

        try{
            var response = angular.fromJson(question.response)
        }catch(e){
            return ''
        }

        return response.videofilename;
    }
    function getUserid(message) {
        if (!message)
            return;
        if (!message.current_index) {
            message.current_index = 0
        }
        return 'E3User' + message.user.user_id.toString();
    }
    function getQuestionId(message) {
        if (!message && message.questions && message.questions.length)
            return;
        if (!message.current_index) {
            message.current_index = 0
        }
        var questionid = message.questions[message.current_index].id.toString()
            ,
            userid = message.user.user_id.toString();
        return 'E3Video' + userid + questionid;
    }
    ExtendScope.multipleChoiceIsCorrectClass = function (question,option,isGraderView){
        option.sort_order = option.order || option.sort_order;
        if(isGraderView && option.sort_order==question.solution)
            return 'correct';
        if(isGraderView && ExtendScope.TestSelected(question,option) && option.sort_order!=question.solution){
            return 'incorrect'
        }
    }
    return ExtendScope
}])

}());