"use strict";

(function () {
    var app = angular.module('app');
    app.factory('AttendanceReportDatepicker',[function(){
        var self = this;
        var scope;
        function init(scope_){
            scope = scope_;
            scope.datePicker = {}
            scope.datePicker.today = function() {
                scope.selected.date = new Date();
            };

            scope.datePicker.clear = function () {
                scope.selected.date = null;
            };

            // Disable weekend selection
            scope.datePicker.disabled = function(date, mode) {
                return false
            };


            scope.datePicker.open = function($event,el) {
                $event.preventDefault();
                $event.stopPropagation();
                if(el){
                    if(!scope.datePicker[el])
                        scope.datePicker[el]={}
                    scope.datePicker[el].opened = true;
                }
                else
                    scope.datePicker.opened = true;
            };
            scope.datePicker.options= {
                beforeShowDay:beforeShowDay,
                firstDay:1,
                maxDate: new Date()
            };
            scope.datePicker.dateOptions = {
                formatYear: 'yy',
                startingDay: 1,
                maxDate:moment()
            };

            scope.datePicker.format = 'MM/dd/yyyy';
            scope.datePicker.ready = true;

        }

        function changeDate (date){
            if(!date) return;
            if(scope.selected.type=='week')
                selectWeek(date);
            if(scope.selected.type=='day'){

                scope.download.options.data.startdate=moment(date).format('YYYY-MM-DD')
                scope.download.options.data.enddate=moment(date).format('YYYY-MM-DD')

            }
            else{

                scope.download.options.data.startdate=moment(scope.datePicker.startWeek).format('YYYY-MM-DD')
                scope.download.options.data.enddate=moment(scope.datePicker.endWeek).format('YYYY-MM-DD')

            }
            if(scope.firstReportCreated){
                scope.reloadAdvisees();
            }
            scope.filterWithdrawnStudents();
        }

        function beforeShowDay(date){
            var d = date,
                DOMClasses = [],
                tooltip = ""
            if(isDateInSelectedWeekRange(date)){
                DOMClasses.push('ui-state-active');
            }
            if(hasPendingAttendances(date)){
                DOMClasses.push('text-danger')
                tooltip = "Pending"
            }
            return [true,DOMClasses.join(" "),tooltip];
        }
        function isDateInSelectedWeekRange(date){
            return scope.selected.type=='week' && date>=scope.datePicker.startWeek &&  date<=scope.datePicker.endWeek
        }
        function hasPendingAttendances(date){
            if(!isWeekend(date) && scope.pendingDays){
                return scope.pendingDays.indexOf(moment(date).format('YYYY-MM-DD'))>=0;
            }
        }
        function isWeekend(date){
            return date.getDay()==0 ||date.getDay()==6
        }
        function selectWeek(date){
            date = moment(date)._d;
            scope.datePicker.startWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 1);
            scope.datePicker.endWeek = new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 7);
        }


        function getDayColumn(day,full){
            if(scope.selected.type=='week')
                if(full)
                    return moment(getDateString(day)).format('MM/DD/YYYY');
                else{
                    return moment(getDateString(day)).format('dddd');
                }

            else{
                if(full)
                    return moment(scope.selected.date).format('MM/DD/YYYY');
                else{
                    return moment(scope.selected.date).format('dddd');
                }

            }
        }
        function formatTime(student,time){
            if(student.timeUnit=='hours')
                return moment.duration(time*1000).asHours().toFixed(2);
            if(student.timeUnit=='minutes')
                return moment.duration(time*1000).asMinutes().toFixed(2);
        }
        function formatMissingDate(date){
            return moment(date).format("dddd, MMMM Do YYYY");
        }
        function isBeyondToday(day,isString){
            var date =  typeof day == 'string' || typeof day == 'number'?moment(getDateString(day))._d:day
            return date > moment()._d;
        }
        function isNotValidFiscalDate(day){
            var date =  typeof day == 'string' || typeof day == 'number'?moment(getDateString(day))._d:day,
                lastJulyFirst = moment().month(7).day(1).hour(0).minute(0).year(moment().year()-1)


            return date < lastJulyFirst._d || isBefore60Days(date);
        }
        function isBefore60Days(date,applyAdmins){
            var me = scope.$root.user;
            if(applyAdmins || (me.is_guardian && !(me.is_super_admin || me.is_organization_admin || me.is_sites_admin || me.is_advisor)))
            {
                var sixtyDaysAgo = moment().hour(0).minute(0).subtract(60,'days');
                return date < sixtyDaysAgo._d;
            }else{
                return false;
            }

        }

        function isBeyondWithdraw(day,student){
            if(!student.attendanceWithdrawDate) return false;
            var date= _.isDate(day)?day:moment(getDateString(day))
            var withdrawnDate= _.isDate(student.attendanceWithdrawDate)?student.attendanceWithdrawDate:moment(student.attendanceWithdrawDate);
            return date > withdrawnDate
        }
        function isBeforeWithdraw(day,student){
            if(!student.attendanceWithdrawDate) return true;
            var date= _.isDate(day)?day:moment(day)
            return date < moment(student.attendanceWithdrawDate)
        }

        function isOutsideClassDateRange(class_,day,date_){
            var date =  moment((date_||getDateString(day)))
            var startedDate = moment(class_.attendanceStartedDate)
            var dateLeft = moment((class_.dateLeft || '1969-01-01'))
            if(dateLeft.isBefore(moment('2000-01-01'))) return date < startedDate;
            return date >= dateLeft || date < startedDate;
        }
        function getDateString(day){
            var date = new Date(scope.selected.date);
            if(scope.selected.type=='week'){
                date = new Date(scope.datePicker.startWeek);
                date.setDate(date.getDate()+(day-1));

            }else{
                if(typeof scope.selected.date == 'string')
                    return scope.selected.date
                date = scope.selected.date;
            }
            return date.toJSONString().substr(0,10);


        }
        return {
            init : init,
            isOutsideClassDateRange:isOutsideClassDateRange,
            getDateString:getDateString,
            isBeyondToday:isBeyondToday,
            isBeyondWithdraw:isBeyondWithdraw,
            isBeforeWithdraw:isBeforeWithdraw,
            formatTime:formatTime,
            getDayColumn:getDayColumn,
            changeDate:changeDate,
            selectWeek:selectWeek,
            formatMissingDate:formatMissingDate,
            isNotValidFiscalDate:isNotValidFiscalDate,
            isBefore60Days:isBefore60Days
        }
    }])
}());