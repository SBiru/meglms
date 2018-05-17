"use strict";

(function () {
    var app = angular.module('app');
    app.factory('AttendanceReportSync', ['Attendance',function (Attendance) {
        var AttendanceSync = function(){
            this.syncHistory = Attendance.getSyncHistory();
        }
        AttendanceSync.prototype.formatDate = function(dateString){
            return moment(dateString).format('LLLL');
        }
        AttendanceSync.prototype.refreshQueue = function(){
            this.queue = Attendance.syncQueue()
        }

        return {
            init: function(){
                return new AttendanceSync();
            }
        }
    }]);
}())