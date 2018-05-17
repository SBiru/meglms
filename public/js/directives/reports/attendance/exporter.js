"use strict";

(function () {
    var app = angular.module('app');
    var MissingAttendanceExporter = function(helper){
        this.export = function(data,flags){
            var csvData = prepareCSVFromData(data,flags),
                filename = buildFileName(data);
            if(!filename){
                toastr.error("Something went wrong. Are you selecting at least one student?")
                return;
            }
            helper.buildFileFromData(csvData,filename);
        }
        function prepareCSVFromData(data,flags){
            var content = buildHeader(flags) ;
            for(var sId in data){
                if(data.hasOwnProperty(sId)){
                    content += createCSVTableForUser(data[sId],flags)
                }
            }
            return content;
        }
        function buildHeader(flags){
            var header = 'Name';
            if(flags.includeDates)
                header += ',Missing date';
            if(flags.showPhone)
                header += ',Phone';
            if(flags.showHours)
                header += ',Total hours reported';

            return header + "\n"
        }
        function createCSVTableForUser(user,flags){
            var table = '';

            if(flags.includeDates){
                for(var i = 0;i<user.dates.length;i++){
                    table+='"' + user.name + '"'
                    table += "," + user.dates[i];
                    if(flags.showPhone)
                        table += "," + user.phone
                    if(flags.showHours)
                        table += "," + user.totalAttendance/3600;
                    table+="\n";
                }
            }else{
                table+='"' + user.name + '"'
                if(flags.showPhone)
                    table += "," + user.phone
                if(flags.showHours)
                    table += "," + user.totalAttendance/3600;
                table+="\n";
            }
            return table;
        }


        function buildFileName(data){
            var numberOfStudents = Object.keys(data).length,
                now = moment().format('YYYY-MM-DD');

            if(numberOfStudents>1){
                return 'missing_attendance_multiple_students_' + now + '.csv';
            }else if(numberOfStudents==1){
                var studentId = Object.keys(data)[0];
                return 'missing_attendance_' + data[studentId].name + '_' + now + '.csv';
            }
        }

    }


    app.factory('AttendanceReportExporter',['HelperService','Attendance',function(HelperService,Attendance){
        var missingAttendance = new MissingAttendanceExporter(HelperService);
        var AttendanceExporter = function(scope){
            this.scope = scope;
        }
        AttendanceExporter.prototype.download = function(){
            var self = this
            self.scope.loading.download = true;
            var data = _.extend({all:this.scope.selected.site.value=='all'?true:undefined},this.scope.download.options.data)
            var options = {
                data:{
                    content:JSON.stringify(data),
                    type:'json'
                },
                httpMethod:'POST',
                successCallback:function(){
                    self.scope.loading.download = false;
                    if(self.scope.download.options.data.exportType.removeFromSyncQueue){
                        self.scope.Sync.refreshQueue()
                    }
                },
                failCallback:function(){
                    toastr.error('Something went wrong')
                    self.scope.loading.download = false;
                }
            }
            jQuery.fileDownload('/api/attendance/export',options)

        }
        AttendanceExporter.prototype.previewDownload = function(){
            var options = angular.extend({},this.scope.download.options.data,{
                preview:true,
                all:this.scope.selected.site.value=='all'?true:undefined
            })
            var self = this
            self.scope.loading.preview = true;
            delete self.previewTable
            Attendance.export(options,function(response){
                var rawTable = d3.csv.parseRows(response.content);
                self.previewTable = prepareTable(rawTable)
                self.scope.loading.preview = false;
            },function(){
                toastr.error('Something went wrong')
                self.scope.loading.preview = false;
            });
            function prepareTable(rawTable){
                if(!rawTable.length) return rawTable;
                var header = _.map(rawTable.splice(0,1)[0],function(col,i){
                    return {
                        id:i+'',
                        label:col
                    }
                });
                return {
                    header:header,
                    rows:rawTable
                }

            }
        }
        return {
            missingAttendance:missingAttendance,
            attendanceExporter: function(scope){
                return new AttendanceExporter(scope);
            }
        }
    }])
}())


