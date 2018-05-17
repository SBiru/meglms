'use strict';

(function(){

    var summary = {
        totalTasks: 0 ,
        completedTasks: 0 ,
        expectedTasks: 0 ,
        percCompletedTasks: 0 ,
        percExpectedTasks: 0 ,
        totalScore: 0 ,
        totalMaxScore: 0 ,
        totalWorkedScore: 0 ,
        letterCompletedScore: 0 ,
        percCompletedScore: 0 ,
        letterTotalScore: 0 ,
        percTotalScore: 0 ,
        expectedEndDate: 0 ,
        projectedEndDate: 0 ,
        letterExpectedOrCompletedScore: 0 ,
        percExpectedOrCompletedScore: 0 ,
        totalExpectedOrCompletedScore: 0 ,
        percBehind: 0
    }
    angular.module('app').factory('SuperunitGradesCalculator',['$q','$timeout','ShowDatesGrades',function($q,$timeout,ShowDatesGrades){
        var ClassSuperunitGradeStore = {};
        var superUnitGradeStore,
            _gradebook;
        function init(classId,gradebook){
            ClassSuperunitGradeStore[classId] = ClassSuperunitGradeStore[classId] || {}
            superUnitGradeStore = ClassSuperunitGradeStore[classId];
            _gradebook = gradebook;
        }
        function getSuperunitGrades(superUnitId){
            var defer = $q.defer();
            if(superUnitGradeStore[superUnitId]){
                defer.resolve(superUnitGradeStore[superUnitId])
            }else{
                $timeout(function(){
                    superUnitGradeStore[superUnitId] = calculateGradesForSuperunit(superUnitId);
                    defer.resolve(superUnitGradeStore[superUnitId])
                })
            }
            return defer.promise;
        }
        function calculateGradesForSuperunit(id){
            var units = _.map(_gradebook.superunits[id].units,function(i){
                return _gradebook.units[i];
            })
            var _summary = angular.extend({},summary);
            _.reduce(units,function(summary,unit){_.reduce(unit.pagegroups,function(summary,pg){_.reduce(pg.pages,function(summary,page){
                if(page.isExempt) return;
                calculateTotalTasks(page,_summary);
                calculateExpectedTasks(page,_summary);
                calculateCompletedTasks(page,_summary);
                calculateFakeEnrollmentDate(page,_summary);
                calculateExpectedEndDate(page,_summary);
            },0)},0)},0);

            calculatePercentagesAndLetters(_summary);
            calculateProjectedEndDate(_summary);
            return _summary;
            function calculateTotalTasks(page,summary){
                summary.totalTasks++;
                summary.totalMaxScore += Number(page.maxScore);
            }
            function calculateExpectedTasks(page,summary){
                if(moment(page.due_date)<moment()){
                    summary.expectedTasks++;
                    if(!page.score) {
                        summary.totalExpectedOrCompletedScore += Number(page.maxScore);
                        summary.daysBehind =moment().diff(moment(page.due_date),'days');
                    }
                }
            }
            function calculateCompletedTasks(page,summary){
                if(page.score){
                    summary.completedTasks++;
                    summary.totalScore += Number(page.score);
                    summary.totalWorkedScore += Number(page.maxScore);
                    summary.totalExpectedOrCompletedScore += Number(page.maxScore);
                }
            }

            function calculateFakeEnrollmentDate(page,summary){
                summary.enrollmentDate = summary.enrollmentDate || page.due_date;
            }
            function calculateExpectedEndDate(page,summary){
                summary.expectedEndDate = page.due_date;
            }
            function calculatePercentagesAndLetters(summary){
                summary.percCompletedTasks = Number((summary.completedTasks*100/summary.totalTasks).toFixed(2));
                summary.percExpectedTasks = Number((summary.expectedTasks*100/summary.totalTasks).toFixed(2));
                summary.percExpectedTasks = Number((summary.expectedTasks*100/summary.totalTasks).toFixed(2));
                summary.percBehind = Math.ceil(summary.percExpectedTasks - summary.percCompletedTasks);

                summary.percCompletedScore = Number((summary.totalScore*100/summary.totalWorkedScore).toFixed(2));
                summary.percExpectedOrCompletedScore = Number((summary.totalScore*100/summary.totalExpectedOrCompletedScore).toFixed(2));
                summary.percTotalScore = Number((summary.totalScore*100/summary.totalMaxScore).toFixed(2));

                summary.letterCompletedScore = ShowDatesGrades.getGradeLetterString(summary.percCompletedScore, ShowDatesGrades.gradeScale);
                summary.letterExpectedOrCompletedScore = ShowDatesGrades.getGradeLetterString(summary.percExpectedOrCompletedScore, ShowDatesGrades.gradeScale);
                summary.letterTotalScore = ShowDatesGrades.getGradeLetterString(summary.percTotalScore, ShowDatesGrades.gradeScale);
            }
            function calculateProjectedEndDate(summary){
                if(summary.percBehind>0){
                    summary.projectedEndDate = moment(summary.expectedEndDate).add(summary.daysBehind,'days').format('YYYY-MM-DD hh:mm:ss');
                }else if(summary.percBehind<0){
                    var percAhead = -summary.percBehind,
                        daysLeft = moment(summary.expectedEndDate).diff(moment(),'days');
                    var projectedDaysLeft = Math.floor(daysLeft*(1-(percAhead/100)));
                    summary.projectedEndDate = moment(summary.expectedEndDate).subtract(projectedDaysLeft,'days').format('YYYY-MM-DD hh:mm:ss');
                }


            }
        }
        return {
            init:init,
            getSuperunitGrades:getSuperunitGrades
        }
    }])
}())