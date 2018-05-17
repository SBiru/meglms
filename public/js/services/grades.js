var appServices = angular.module('app.services');

appServices.factory('Grades', function () {
    return {
        totalTime:0,
        selectedClass:{},

        setTotalTime:function(time){ this.totalTime=time},
        getTotalTime:function(){ return this.totalTime},

        setClass:function(class_){this.selectedClass=class_},
        getClass:function(){return this.selectedClass}
    }
});

