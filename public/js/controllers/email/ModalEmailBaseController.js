
appControllers.controller('ModalEmailBaseController',['$rootScope', '$scope','$sce','$timeout','Email','$filter','Notification',
    function($rootScope,$scope,$sce,$timeout,Email,$filter,Notification) {

        $scope.emails_temp=[];
        $scope.receivedOk=false;
        $scope.sentOk=false;
        $scope.content ={};
        $scope.changeToMode = function(type){
            $scope.currentMode=type;
        };
        $scope.reply = function(email){
            $scope.currentMode = 'new';
            var user = {
                fname : email.fname,
                lname : email.lname,
                email : email.email,
                id : email.sender_id
            };
            $scope.userList = [user];
            $scope.subject = email.subject

        }
        $scope.showGuardians = function(){
            if ($scope.$root.user.org.disallow_email){
                return false
            }
            if($scope.showSpecificUser)
                return true;
            for(var i in $scope.userList){
                var user =  $scope.userList[i];
                if(!user.is_teacher)
                    return true;
            }
            return false;
        }
        $scope.ok_private = function(to){
            var toArray = []
            for(var i in to){
                var user ={
                    email:to[i].email,
                    fname:to[i].fname,
                    lname:to[i].lname,
                    id: to[i].user_id
                }
                toArray.push(user);
            }
            var options = {
                to:toArray,
                subject:$scope.content.subject,

                text:CKEDITOR.instances.editor_email.getData()
            };
            if($scope.addGuardians){
                var cc = [];
                for(var i in to){
                    var user = to[i];
                    if(user.guardians){
                        cc.push.apply(cc, user.guardians);
                    }
                }
                if(cc.length)
                    options['cc']=cc;
            }
            Email.sendEmail(options,function(response){
                $scope.response = {};
                $scope.response = response;
                if(!angular.isDefined(response.error))
                    $timeout(function(){
                        $scope.changeToMode('sent');
                        $scope.response={};
                    },1000);

            });

            $scope.response = {message:"Sending.."};
        }

    }

]);