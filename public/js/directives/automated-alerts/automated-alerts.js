

(function () {
"use strict";
function getRawTimeString(dateObject){
   return (new Date(dateObject)).toTimeString().split(' ')[0]
}
var app = angular.module('automatedAlerts', ['ngResource']);
app.directive('automatedAlerts',[
'automatedAlertsService',
'availableAlerts',
'E3WsAutomatedAlerts',
'Alerts',
function(automatedAlertsService,availableAlerts,ws,Alerts){
return {
    restrict:'E',
    templateUrl:'/public/views/directives/automated-alerts/automated-alerts.html',
    scope:{
        orgId:'=?'
    },
    link:function(scope,element){

        function init(){
            if(!ws.ready)
                ws.init(scope.$root.e3Ws);
            getAlerts();
        }
        function getAlerts(){
            scope.loading=true;
            scope.alerts = automatedAlertsService.queryOrgAlerts(
                {orgId:scope.orgId},
                function(){
                    scope.loading=false;
                    prepareAvailableAlerts()
                }
            );
        }
        function prepareAvailableAlerts (){
            scope.availableAlerts = _.union([],availableAlerts);
        }
        scope.addAlert = function(alert){
            if(!alert) return;
            scope.adding = 1;
            alert.org_id = scope.orgId;
            automatedAlertsService.save(alert).$promise.then(function(res){
                scope.adding =0
                scope.alerts.push(res);
            },function(err){
                scope.adding =2
                toastr.error("Something went wrong")
            })
        }
        scope.deleteAlert = function(id,index){
            Alerts.warning({
                title:'Delete Alert',
                content:'Are you sure you want to delete this alert',
                textOk:'Ok',
                textCancel:'Cancel'
            },function(){
                automatedAlertsService.remove({id:id},function(){
                    scope.alerts.splice(index,1);
                },function(err){
                    toastr.error("Something went wrong.");
                });
            });

        }

        scope.testingMessage = "<p>This alert is being tested and the emails won't be automatically sent to the users.</p>" +
            '<p>You can help test it by sending a test email to yourself and checking the results.</p>'

        init();
    }
}
}]).controller('AutomatedAlertController',['$scope','automatedAlertsService','Alerts','EditAlertTemplate',function($scope,automatedAlertsService,Alerts,EditAlertTemplate){

    $scope.$watch('alert',alertHasChanged,true);
    var timeout;
    function alertHasChanged(newValue,oldValue) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(function () {
            if (oldValue && !angular.equals(newValue, oldValue)) {
                var options = _.extend({}, $scope.alert);
                options.frequency = _.extend({}, options.frequency, {time: getRawTimeString(options.frequency.time)});
                automatedAlertsService.save(options, function () {
                    toastr.options.timeOut = 1000
                    toastr.success("Your changes were saved.");
                });
            }
        }, 1000);
    }
    $scope.editTemplate = function(alert){
        EditAlertTemplate.open(alert);
    }
    $scope.preview = function(alert){
        if(!alert.addressees.length){
            toastr.warning('Please, add at least one group of recipients',{timeOut:3000,messageClass:'toast-message preview-warning'});
            return;
        }
        $scope.loadingPreview=true;
        automatedAlertsService.run(
            {
                id:alert.id,
                preview:true
            },function(res){
                $scope.loadingPreview = false
                Alerts.info({
                    title:'Preview',
                    contentHtml:res.preview,
                    closeButtonOnTop:true,
                    windowClass:'modal-90',
                    noCancel:true,
                    noOk:true
                },function(){});
        },function(error){
                $scope.loadingPreview=false;
                handleError(error);
            })
    }
    $scope.run = function(){
        $scope.running=true;
        automatedAlertsService.run(
            {
                id:$scope.alert.id,
                'send-to':$scope.testEmail.input?undefined:$scope.testEmail
            },
            function(){
                $scope.running=false;
                if($scope.alert.isTestVersion)
                    toastr.options.timeOut=1000
                    toastr.success("The test emails were sent to your email");
            },
            function(error){
                $scope.running=false;
                handleError(error);
            }
        )
    }
        function handleError(error){
            if(error.data.showToUser){
                toastr.options.timeOut=10000
                toastr.error(error.data.error);
            }
            else{
                toastr.options.timeOut=1000
                toastr.error("Something went wrong");
            }
        }

}]).value('availableAlerts',[
    {
        'name':'behindInCourses',
        'description':'Students behind in courses',
        test_version:1,
        options:{
            "percBehind":{"label":"Min (%) behind","value":"20","unit":"%","description":"Percentage behind in the course"},
            "descriptions":{
                "texts":["<p>The following students are more than {percBehind}% behind in their courses</p>"],
                "roles":{
                    'all':0
                }
            }
        }
    },{
        'name':'missingAttendance',
        'description':'Students missing attendance',
        test_version:1,
        options:{
            "period":{"label":"Check ","value":"one week",options:['one week','more than one week'],"description":"Time range of the report"},
            "descriptions":{
                "texts":["<p>The following students' attendance report is late</p>"],
                "roles":{
                    'all':0
                }
            }
        }
    },{
        'name':'gradeBelowTarget',
        'description':'Students with grades below target',
        test_version:1,
        options:{"targetGrade":{"label":"Target grade","value":65,"unit":"%","description":"Target grade"}},
        "descriptions":{
            "texts":["<p>Students with grades below {targetGrade}</p>"],
            "roles":{
                'all':0
            }
        }
    },{
        'name':'attendanceReminder',
        'description':'Attendance reminder',
        test_version:1,
        options:null,
        "descriptions":{
            "texts":["<p>Attendance reminder</p>"],
            "roles":{
                'all':0
            }
        }
    }
])


}());