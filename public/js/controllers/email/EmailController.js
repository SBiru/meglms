'use strict';

var customSort = function(a,by){

    var swapped;
    do {
        swapped = false;
        for (var i=0; i < a.length-1; i++) {
            if (a[i][by] > a[i+1][by]) {
                var temp = a[i];
                a[i] = a[i+1];
                a[i+1] = temp;
                swapped = true;
            }
        }
    } while (swapped);

}

var email_modes=[
    {
        name: "Teacher Feedback",
        type: "feedback"
    },
    {
        name: "Student Feedback",
        type: "student_feedback"
    },
    {
        name: "All Messages",
        type: "sent"
    },
    {
        name: "New Email",
        type: "new"
    },

];
var preview_list = function(receivers,max_names){
    if(!angular.isDefined(receivers))
        return '';
    var resp = {
        preview:'',
        list:''
    };
    for(var i=0;i<receivers.length;i++){
        if(receivers.length<=2)
        {
            resp.preview += receivers[i].fname + ' ' + receivers[i].lname + ','
        }
        else if(i<max_names){
            resp.preview += ' ' + receivers[i].fname + ','
        }
        resp.list += receivers[i].fname + ' ' + receivers[i].lname + ', '
    }
    resp.preview = resp.preview.substring(0,resp.preview.length-1)
    resp.list = resp.list.substring(0,resp.list.length-2)
    if(receivers.length>=max_names)
        resp.preview+='...'
    return resp;



}
var preview_html = function (html,max_length){
    var tmp = document.createElement("DIV");
    var preview
    tmp.innerHTML = html;
    var preview =tmp.textContent || tmp.innerText || "";
    preview = preview.replace(/(\r\n|\n|\r|\t)/gm,"");
    preview=preview.substring(0, max_length);
    if(preview.length==max_length)
        preview+='...'
    return preview;
}




appControllers.controller('EmailController', ['$rootScope', '$scope','$modal','Email','$timeout',
    function($rootScope,$scope,$modal,Email,$timeout) {

        var refreshTimer = function(delay) {
            $timeout(function(){
               countNewEmails();
            },delay);

        };
        var countNewEmails = function(){
            Email.getNewEmailsCount({},function(response){
                if(angular.isDefined(response.count)){
                    $scope.new_emails_count = response.count;
                }
                refreshTimer(60000);
            });
        };       
        
        countNewEmails();
        $scope.open = function(user,size,isGrader) {
            //For now we are marking all messages as read when an user opens the modal
            var controller;
            if($scope.specificUser){
                controller='ModalEmailSpecificController'
                if(isGrader===false){
                    user.user_id=user.id;
                }
            }
            else{
                controller='ModalEmailController'
            }
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/email-modal.html?v='+window.currentJsVersion,
                controller: controller,
                size: size,
                windowClass: 'email-modal-window',
                resolve:{
                    user:function () {
                        return user;
                    },
                    new_messages: function(){
                        return angular.isDefined($scope.new_emails_count)
                    }
                }

            });
            $rootScope.mailModal = modalInstance;
        };
        $scope.$root.$on('refreshCounter',function(){
            countNewEmails();
        });
    }
]);