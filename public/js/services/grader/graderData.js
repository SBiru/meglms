var appServices = angular.module('app.services');
appServices.factory('GraderData',[function(){

    var factory =  {
        graders:[],
        students:[],
        currentSelectedStudentId:null,
        currentVisibleStudents:null,
        studentsSelectUpdate:null,
        dateRange:{
            max:null,
            min:null,
        },
        pagination:{
            itemsPerPage:5,
            currentPage:0
        },
        pages:[],
        setStudents:function(students){
            students.unshift({
                disabled:false,
                user_id:'all',
                name:' All'
            });
            this.students = students;
            this.updateVisibleStudents();
        },
        getStudents:function(){
            return this.students
        },
        setGraders:function(graders){
            this.graders = graders;
        },
        getGraders:function(){
            return this.graders
        },
        setPages:function(pages){
            this.pages = pages;
        },
        getPages:function(){
            return this.pages
        },
        updateVisibleStudents:function(visibleStudents,setAllVisible){
            visibleStudents = visibleStudents || this.currentVisibleStudents;
            this.currentVisibleStudents=visibleStudents;
            if(!visibleStudents) return;
            _.each(this.students,function(s){
                s.disabled = !isVisible(s);
            })
            function isVisible(s){
                return setAllVisible || s.user_id=='all' || _.some(visibleStudents,function(vs){
                    return  s.user_id == vs.user_id
                })
            }
            var self = this;
            var currentStudentId = null;
            if (this.currentSelectedStudentId == 'all' || _.some(this.students,function(s){return s.user_id==self.currentSelectedStudentId})){
                currentStudentId = this.currentSelectedStudentId
            }
            this.studentsSelectUpdate && this.studentsSelectUpdate(this.students,true);
            if(currentStudentId){
                self.currentSelectedStudentId = currentStudentId
            }
        }
    }



    return factory;
}]);

function GraderMessages(){}
GraderMessages.prototype.preparePostedMessages = function($scope, $rootScope, messages, $sce, $http){
    this.prepareTeachers(messages)

}
GraderMessages.prototype.prepareTeachers= function(messages){
    if (messages['teachers']) {
        var distinctTeachers = this.prepareDistinctTeachers(messages);
        this.addTeacherIdToMessages(messages)
        return _.map(distinctTeachers,function(t){return t});
    }
}
GraderMessages.prototype.prepareDistinctTeachers = function(messages){
    var distinctTeachers = {};
    for (var i = 0; i < messages['teachers'].length; i++) {
        var teacher = messages['teachers'][i];
        teacher.name = teacher.fname + ' ' + teacher.lname;
        if(!distinctTeachers[teacher.user_id]){
            distinctTeachers.push(teacher)
        }
    }
    return distinctTeachers;
}
GraderMessages.prototype.addTeacherIdToMessages = function(messages){
    for (var i = 0; i < messages.postmessages.length; i++) {
        var teacherPostIdFromMessage = messages.postmessages[i].teacher_post_id;
        for (var j = 0; j < messages['teachers'].length; j++) {
            if (messages['teachers'][j].post_id == teacherPostIdFromMessage) {
                messages.postmessages[i].teacher_user_id = messages['teachers'][j].user_id;
            }
        }
    }
}