    "use strict";

(function () {
    var app = angular.module('app');
    app.factory('AttendanceReportValidator',['$q','Alerts',function($q,Alerts){
        var defer,
            self = this,
            ATTENDANCE_LIMIT_PER_DAY_IN_SECONDS = 15*3600;

        function validate(student,classes,days,hasAttendance){
            var absentDays = student.absent, reasons = student.reason;
            defer = $q.defer();
            try{
                if(hasAttendance){
                    validateSumOfAttendancePerDay(absentDays,classes,days);
                    validateEmptyAbsentReason(absentDays,reasons);
                }
                defer.resolve();
            }catch(e){
                defer.reject(e);
            }

            return defer.promise;
        }
        function isWeekend(day){
            return moment(day).weekday()==0||moment(day).weekday()==6
        }
        function validateSumOfAttendancePerDay(absentDays,classes,days){
            var totalAttendanceDays = sumAttendancesPerDay(classes,days);
            var invalidDays = []
            for(var day in totalAttendanceDays){
                if(totalAttendanceDays.hasOwnProperty(day)){
                    if(!absentDays[day])
                        noDayAddUpToZero(totalAttendanceDays[day],day,invalidDays);
                    noDayAddUpToMoreThanLimit(totalAttendanceDays[day],day,invalidDays);
                }
            }
            if(invalidDays.length){
                throw new AttendanceValidatorExecption(
                    getExeceptions(invalidDays),
                    {days: _.map(invalidDays,function(d){return d.day})}
                )
            }

        }
        function getExeceptions(invalidDays){
            var execptions = [];
            _.each(invalidDays,function(day){
                if(execptions.indexOf(day.error)<0)
                    execptions.push(day.error)
            })
            return execptions.join(' - ');
        }
        function sumAttendancesPerDay(classes,days){
            var totalAttendanceDays = {};
            _.each(days,function(day){
                addAttendance(0,day);
            })
            _.each(classes,function(c){
                _.each(c.dates,function(d){
                    addAttendance(d.time, d.date);
                })
            })

            function addAttendance(time,day){
                if(!totalAttendanceDays.hasOwnProperty(day))
                    totalAttendanceDays[day]=0;
                totalAttendanceDays[day]+=time;
            }
            return totalAttendanceDays;
        }
        function noDayAddUpToZero(totalAttendance,day,invalidDays){
            if(totalAttendance==0 && !isWeekend(day)){
                invalidDays.push({day:day,error:'Cannot submit a weekday without inputting hours. If the student was absent, please use the “Absent” checkbox'})
            }
        }
        function noDayAddUpToMoreThanLimit(totalAttendance,day,invalidDays){

            if(totalAttendance>ATTENDANCE_LIMIT_PER_DAY_IN_SECONDS){
                invalidDays.push({day:day,error:'The sum of maximum daily attendance is ' +ATTENDANCE_LIMIT_PER_DAY_IN_SECONDS/3600 + ' hours'})
            }
        }
        function validateEmptyAbsentReason(absentDays,reasons){
            var invalidDays = []
            for(var day in absentDays){
                if(absentDays.hasOwnProperty(day) && absentDays[day]){
                    if(!reasons[day]){
                        invalidDays.push(day)
                    }
                }
            }
            if(invalidDays.length){
                throw new AttendanceValidatorExecption(
                    'Must select a reason when absent',
                    {days:invalidDays}
                )
            }
        }
        function acknowledge60Days(){
            var defer = $q.defer();
            Alerts.warning({
                title: 'Entering old attendance data',
                content:"I acknowledge that I'm entering data that is past 60 natural days",
                textOk: 'Ok',
                textCancel:'Cancel'
            },function(){
                defer.resolve()
            },function(){
                defer.reject()
            });

            return defer.promise;
        }
        function AttendanceValidatorExecption(message,options) {
            this.message = message;
            this.options = options;
            this.name = "AttendanceValidatorExecption";
        }
        return {
            validate: validate,
            acknowledge60Days:acknowledge60Days,
        }
    }])
}());


