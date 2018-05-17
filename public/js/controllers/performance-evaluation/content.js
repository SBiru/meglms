'use strict';
angular.module('app')
.controller('PerformanceEvaluationController',
['$scope','$modal','$window','Categories','UserV2',
function($scope,$modal,$window,Categories,UserV2){

    $scope.selected = {};

    $scope.updatePerformance = updatePerformance;
    $scope.moveTableToLeft = moveTableToLeft;
    $scope.moveTableToRight = moveTableToRight;
    $scope.openModal = openModal;

    $scope.$watch('selected.class',classChanged);

    var w = angular.element($window);

    $scope.loading = true;
    $scope.translate = 0;
    $scope.transform = '0px';

    getClasses();
    function getClasses(){
        Categories.user.classes(
            {userId:'me'},
            function(classes){
                $scope.classesToFilter = classes
                $scope.classesToFilter.push({
                    id:'all',
                    name:'All'
                })
                $scope.selected.class = $scope.classesToFilter[0]
            }
        )
    }
    function getData(classId){
        Categories.user.performance(
            {
                userId:'me',
                classId:classId
            },
            function(data){
                $scope.originalData = angular.copy(data);
                $scope.data = data;
                //$scope.selected.class=$scope.originalData.classes[0]
                $scope.loading = false;
            },function(error){
                $scope.loading = false;
            });
    }

    function updatePerformance(studentId,classId,catId,isCompleted){
        Categories.user.updatePerformance({
            studentId:studentId,
            classId:classId,
            catId:catId,
            isCompleted:isCompleted,
        })
    }

    function classChanged(class_){
        if(!class_) return;
        $scope.loading = true;
        getData(class_.id);

        //if(class_.id=='all') $scope.data = angular.copy($scope.originalData);
        //else{
        //    $scope.loading = true;
        //    var studentsIds = [];
        //    var categories = $scope.originalData.userClasses[class_.id].categories;
        //    _.each(categories,function(c){
        //        _.each(Object.keys(c.students),function(sId){
        //            if(studentsIds.indexOf(sId)<0) studentsIds.push(sId);
        //        })
        //    })
        //    var students = _.filter($scope.originalData.students,function(s){
        //        return studentsIds.indexOf(s.id)>=0
        //    })
        //    var classes = [_.findWhere($scope.originalData.classes,{id:class_.id})];
        //    var userClasses = {};
        //    userClasses[class_.id]=$scope.originalData.userClasses[class_.id];
        //
        //    $scope.data = {
        //        classes:classes,
        //        students:students,
        //        userClasses:userClasses
        //    }
        //    $scope.loading = false;
        //}

    }
    function moveTableToLeft(){
        $scope.translate=Math.min(0,$scope.translate+100)
        $scope.transform = "translateX("+$scope.translate+"px)";

    }
    function moveTableToRight(){
        $scope.translate = $scope.translate-100;
        $scope.transform = "translateX("+$scope.translate+"px)";
    }
    function getWindowDimensions() {
        return {
            'h': w.height(),
            'w': w.width()
        };
    };
    function updateStudentBox(result){
        var params=  result.params
        var studentInfo = $scope.data.userClasses[params.class.id].categories[params.cat.id].students[params.student.id];
        studentInfo.completed=params.page.scoreOverride!==null;
        studentInfo.page.score = params.page.scoreOverride
        if(studentInfo.page.minimum_score_for_completion && params.page.score!==null){
            studentInfo.notAchievedMinimum = params.page.scoreOverride*100/params.page.maxScore<studentInfo.page.minimum_score_for_completion;
            updatePerformance(params.student.id,params.class.id,params.cat.id,!studentInfo.notAchievedMinimum)
        }else{
            updatePerformance(params.student.id,params.class.id,params.cat.id,studentInfo.completed)
        }


    }

    function openModal(type, params,$event) {
        if($event) $event.stopPropagation();
        var types = {
            goal: {
                controller: 'PEModalGoalsController',
                size: 'lg',
                view: 'goal.html'
            },
            'all-work': {
                controller: 'PEModalAllWorkController',
                size: 'lg',
                view: 'all-work.html'
            },
            'score': {
                controller: 'PEModalScoreController',
                size: 'lg',
                view: 'score.html',
                callback:updateStudentBox
            }
        };
        var instance = $modal.open({
            templateUrl: '/public/views/performance-evaluation/modal/' + types[type].view,
            controller: types[type].controller,
            size: types[type].size,
            resolve: {
                params: function () {
                    return params;
                }
            }
        });
        instance.result.then(types[type].callback)
    };

}]
).directive('peTables',
[ '$timeout','$compile','$sce',function($timeout,$compile,$sce) {
    return {
        restrict: 'A',
        link: function ($scope, $element,$attrs) {
            $scope.$watch(tableDataLoaded, function(isTableDataLoaded) {
                if (isTableDataLoaded) {
                    transformTable();
                }
            });
            function tableDataLoaded() {
                var firstCell = $element[0].querySelector('tbody tr:first-child td:first-child');
                return firstCell && !firstCell.style.width;
            }
            function transformTable() {
                $timeout(function () {
                    var headers = $element.find(('.pe-header > .table-gradebook > thead > tr > th'))
                    var bodyColumns = angular.element('.pe-body > .table-gradebook > tbody > tr:first-child > td');
                    for(var i =0;i<headers.length;i++){
                        var w = headers[i].offsetWidth;
                        angular.element(bodyColumns[i]).css('min-width',w);
                    }
                })
            }
        }
    }}
]);