'use strict';
(function(angular){
    angular.module('app').directive('testDashboardSummary',['Gradebook','TestSchoolsSubmitted','$filter',function(Gradebook,TestSchoolsSubmitted,$filter){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/test-dashboard/test-summary.html?v='+window.currentJsVersion,
            scope: {
                classId: '=',//Use classId to load all tests for a class
                schoolId: '=?'//Use schoolId to load all tests submitted to a class
            },
            link:function(scope){
                scope.pagedStudents = [];
                scope.updateFilteredStudents = function(students){
                    if(!isEqual(scope.pagedStudents,students))
                        scope.pagedStudents = students;
                }
                scope.setPaginationItems = scope.setPaginationItems || function(){};
                function getGradebook(classId){
                    if(!classId) return;
                    resetData();
                    Gradebook.getCachedClassGrades({classId:classId},prepareGradebook);
                }
                function getSchoolGradebook(schoolId){
                    if(!schoolId) return;
                    resetData();
                    TestSchoolsSubmitted.query({includeGradebook:true,schoolId:schoolId}).$promise.then(function(tests){
                        tests[0].students = _.chain(tests).map(function(t){return t.students}).flatten().value();
                        prepareGradebook(tests[0]);
                    });
                }
                function resetData(){
                    delete scope.students;
                    delete scope.pageGroups;
                }
                function prepareGradebook(gradebook){
                    scope.testName = gradebook.name;
                    scope.isJ1 = gradebook.isJ1;
                    scope.students = _.filter(_.map(gradebook.students,prepareStudentGrades));
                    setScoreColumnWidth()
                }
                function prepareStudentGrades(student,i,gradebook){

                    var pageGroups = [],
                        percTotalScore = 0,
                        maxTotalScore = 0,
                        actualTotalScore = 0,
                        lastWorkedDate = null,
                        submittedToAllActivities = true,
                        finishedGradeClass=true;
                    _.each(student.units,function(unit){
                        _.each(unit.pagegroups,function(pg){
                            if(!pg.id) return;
                            var total = 0, currentScore = 0,finishedGrade = true;

                            _.each(pg.pages,function(page){
                                total+=parseValidFloat(page.maxScore);
                                currentScore+= parseValidFloat(page.score);


                                if(_.isNull(page.score)){
                                    finishedGrade = false;
                                    finishedGradeClass = false;
                                    if(page.needingGrade==false){
                                        submittedToAllActivities = false;
                                    }
                                }
                                lastWorkedDate = page.submittedOn || lastWorkedDate
                            });
                            if(total>0){
                                var score = Math.round(parseValidFloat(currentScore*100/total) * 100) / 100;
                                pageGroups.push({
                                    name:pg.name,
                                    maxScore:total,
                                    score:score,
                                    actualScore:currentScore,
                                    finishedGrade:finishedGrade
                                });
                                percTotalScore+=score;
                                maxTotalScore+=total;
                                actualTotalScore+=currentScore;
                            }

                        })
                    });
                    scope.pageGroups = pageGroups;
                    if((scope.$root.user.is_only_test_admin && !finishedGradeClass))
                        return null;
                    return{
                        id:student.id,
                        testId:student.testId,
                        rawDate:submittedToAllActivities&&lastWorkedDate?moment(lastWorkedDate):null,
                        date:submittedToAllActivities&&lastWorkedDate?moment(lastWorkedDate).format('DD-MMM-YYYY'):null,
                        groupName:student.groupName,
                        name: student.lastName + ', '+ student.firstName ,
                        pageGroups: pageGroups,
                        percTotalScore:Math.ceil(parseValidFloat(percTotalScore/pageGroups.length)),
                        maxTotalScore:maxTotalScore,
                        actualTotalScore:actualTotalScore,
                        submittedToAllActivities:submittedToAllActivities,
                        finishedGradeClass:finishedGradeClass
                    }
                }
                function parseValidFloat(n){
                    return _.isNaN(parseFloat(n))?0:parseFloat(n);
                }
                function setScoreColumnWidth(){
                    var STATIC_COLUMNS_COUNT = 4,
                        DYNAMIC_COLUMNS_COUNT =scope.pageGroups?scope.pageGroups.length:0;
                    scope.scoreColumnWidth = (DYNAMIC_COLUMNS_COUNT*100/(DYNAMIC_COLUMNS_COUNT + STATIC_COLUMNS_COUNT))/DYNAMIC_COLUMNS_COUNT + '%';
                }
                scope.round = function(num){
                    return Math.round(num * 100) / 100
                }
                scope.orderStudents = new OrderStudents();
                scope.orderStudents.orderBy('date');
                scope.filterInput = '';
                function orderedStudents(i){
                    var order = scope.orderStudents.selected?scope.orderStudents.selected.replace('date','rawDate'):scope.orderStudents.selected;
                    var ordered = $filter('orderBy')(scope.students,order);
                    // scope.filteredStudents =
                    scope.setPaginationItems($filter('byFields')(ordered,{fields:['name','groupName'],input:scope.filterInput}));
                }
                scope.paginationConfig = {
                    itemsPerPage:50,
                    showOnTop:true,
                    showOnBottom:true,
                    showTotal:true
                };
                scope.viewStudent = function(student,classId){
                    scope.$root.$state.go(scope.$root.$state.$current.path[1].self.name + '.dashboard.details',{studentId:student.id,classId:classId||student.testId})
                }

                scope.$watch('classId',getGradebook);
                scope.$watch('schoolId',getSchoolGradebook);
                scope.$watch('orderStudents.selected',orderedStudents);
                scope.$watch('filterInput',orderedStudents);
                scope.$watch('students',orderedStudents);
            }
        }
    }]).filter('byFields', function() {
        return function(students,filterOptions) {
            return _.filter(students,function(s){
                var notRemove = false;
                for(var i = 0; i<filterOptions.fields.length; i++){
                    var field = filterOptions.fields[i];

                    if(s[field].toLowerCase && s[field].toLowerCase().indexOf(filterOptions.input.toLowerCase())>=0){
                        notRemove = true;
                        break;
                    }
                }
               return notRemove
            });
        }
    });
    function OrderStudents(){
        this.selected = 'date'
        this.orderBy = function(by){
            if(by==this.selected)
                this.selected='-'+this.selected;
            else
                this.selected =by;
        }
    }
}(angular))
