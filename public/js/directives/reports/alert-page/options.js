'use strict';
(function(angular){
var possibleCategories = [
    {
        label:'Student',
        alerts:[
            {type:'PERC_BEHIND',sortBy:'classes',label:'Students that are >= x% behind',available:true,panel_color:'panel-info',params:{x:null},configDirective:'alert-config-default'},
            {type:'NOT_LOGGED_IN',sortBy:'students',label:'Has not logged in for more than D days',available:true,panel_color:'panel-info',params:{D:null},configDirective:'alert-config-default'},
        ],
        roles:['admin','teacher','advisor']
    },
    {
        label:'Course',
        alerts:[
            {type:'AVG_COURSE_GRADE',label:'Average course grade is < G%',available:true,panel_color:'panel-default',params:{G:null},configDirective:'alert-config-default'},
            {type:'ASSIGNMENT_AVG',label:'Assignment A has an average score < S%',available:true,panel_color:'panel-default',params:{assignments:null},configDirective:'alert-config-assignment-avg'},
            {type:'TARGET_BEHIND',label:'P% of students are > T% behind in this course',available:true,panel_color:'panel-default',params:{P:null,T:null},configDirective:'alert-config-default'},
            {type:'FINAL_EXAM',sortBy:'classes',label:'Students that have completed the final exam',params:{assignments:null},available:true,panel_color:'panel-default',configDirective:'alert-config-final-exam'}
        ],
        roles:['admin','teacher']
    },
    {
        label:'Admin',
        alerts:[
            {type:'MISSING_ATTENDANCE',sortBy:'classes',label:'Student has not submitted attendance for course C',available:true,panel_color:'panel-warning',params:{classes:null},configDirective:'alert-config-missing-attendance'},
            {type:'NEW_STUDENTS',sortBy:'students',label:'New students for the last D days',available:true,params:{D:7},paramTypes:{D:{type:'list',options:[7,14,30]}},panel_color:'panel-warning',configDirective:'alert-config-default'},
            {type:'WITHDRAWN_STUDENTS',sortBy:'students',label:'Withdrawn students for the last D days',available:true,params:{D:7},paramTypes:{D:{type:'list',options:[7,14,30]}},panel_color:'panel-warning',configDirective:'alert-config-default'},
        ],
        roles:['admin']
    },
]
angular.module('app').value('alertPossibleCategories',possibleCategories).factory('alertPageOptions',['UserAlertsService','AlertValidator','UserV2','UserRoles','alertPossibleCategories',function(UserAlertsService,AlertValidator,UserV2,UserRoles,alertPossibleCategories){
    var self = {
        started:false,
        alerts:[]
    }, me;
    UserV2.getUser().then(function(user){me = user});

    function init(){
        self.started = true;
        preparePossibleCategories();
        preparePossibleLayouts();
        loadAlerts();
    }

    function preparePossibleCategories(){
        self.possibleCategories = _.filter(angular.copy(alertPossibleCategories),checkRole);
    }
    function checkRole(alertCategory){
        for(var i = 0;i<alertCategory.roles.length;i++){
            if(UserRoles.checkPermission(alertCategory.roles[i])===true){
                return true;
            }
        }
        return false;
    }
    function preparePossibleLayouts(){
        self.possibleLayouts = [
            {label:'1 column',class:'col-xs-12'},
            {label:'2 columns',class:'col-xs-6'},
            {label:'3 columns',class:'col-xs-4'},
            {label:'4 columns',class:'col-xs-3'}
        ]
        self.layout=self.possibleLayouts[0];
    }
    function loadAlerts(){
        self.alerts.$loading = true;
        UserAlertsService.get({},function(res){
            delete self.alerts.$loading;
            fillAlerts(res.alerts);
            if(res.layout)
                self.layout = _.find(self.possibleLayouts,{label:res.layout.label});
        });
    }
    function fillAlerts(alerts){
        angular.forEach(alerts,function(a){
            var alertIndex = getAlertIndex(a);
            if(alertIndex){
                var alert = self.possibleCategories[alertIndex[0]].alerts[alertIndex[1]];
                alert.params = a.params;
                prepareAlertLabel(alert)
                self.addAlert(alert,true);
                if(alert.available)
                    self.validateAndLoad(alert);
            }
        })
    }
    function getAlertIndex(alert){
        for(var i = 0;i<self.possibleCategories.length;i++){
            for(var j = 0;j<self.possibleCategories[i].alerts.length;j++){
                var testAlert = self.possibleCategories[i].alerts[j];
                if(testAlert.type==alert.type)
                    return [i,j];
            }
        }
    }
    function prepareAlertLabel(alert){
        var labelReplaced = alert.label;
        _.each(alert.params,function(value,key){
            if(value){
                var pattern = new RegExp('([^A-z]|^)'+key+'([^A-z]|$)')
                labelReplaced = labelReplaced.replace(pattern,"$1"+value+"$2");
            }
        })
        alert.labelReplaced = labelReplaced;
    }
    self.addAlert = function(alert,skipSave){
        if(!alert.allowMoreThanOne) alert.used=true;
        self.alerts.push(alert);
        if(!skipSave)
            self.saveAlerts();
    }
    self.saveAlerts = function(){
        self.alerts.$saving = true;
        var alerts = angular.copy(self.alerts);
        _.each(alerts,function(a){delete a.data});
        UserAlertsService.save({},{alerts:alerts,layout:self.layout},function(){
            delete self.alerts.$saving;
        },function(error){
            delete self.alerts.$saving;
            toastr.error('Could not save alerts');
        });
        _.each(self.alerts,prepareAlertLabel);
    }
    self.removeAlert = function(i){
        delete self.alerts[i].used;
        var index = getAlertIndex(self.alerts[i]);
        self.alerts.splice(i,1);
        self.possibleCategories[index[0]].alerts[index[1]]=angular.copy(alertPossibleCategories[index[0]].alerts[index[1]]);
        self.saveAlerts();
    }
    self.validateAndLoad = function (alert){
        AlertValidator.validate(alert).then(loadAlert,function(error){toastr.error(error.message)})
    }
    function loadAlert (alert){
        alert.$loading = true;
        var a = angular.copy(alert);
        if(a.params)
            a.params = angular.extend(a.params,extraOptions());
        UserAlertsService.load({},{alert:a}).$promise.then(function(res){
            delete alert.$loading;
            alert['data'] = res['data'];
            alert['tableHeader'] = res['tableHeader'];
        },function(error){
            delete alert.$loading;
            toastr.error("Could not load " + alert.label);
        })
    }

    function extraOptions(){
        return {
            classIds : _.map(me.classes,function(c){return c.id})
        }
    }
    self.init = init;



    return self;
}]).factory("AlertValidator",['$q',function($q){
    var self = {};

    self.validate = function(alert){
        var defer = $q.defer()
        try{
            validateParams(alert);
            defer.resolve(alert)
        }catch(e){
            defer.reject(e)
        }
        return defer.promise;
    }
    function validateParams(alert){
        _.each(alert.params,function(value,key){
            if(_.isNull(value) || _.isUndefined(value) || value == '')
                throw new UserAlertException("Invalid paramater " + key  + ". Please make sure you have defined all required parameters");
        })
    }

    function UserAlertException(message,options) {
        this.message = message;
        this.options = options;
        this.name = "AlertValidatorException";
    }
    return self;
}])

}(angular))
