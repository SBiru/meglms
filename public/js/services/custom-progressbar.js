
angular.module('app').service('CustomProgressBar',function(){
        var ShowGradeType = function(class_,scope,location){

            var CompletedGradeType = function(){
                this.getCustomBarPoints = function(){
                    var p = scope.progressReport;
                    if(!p) return {}
                    return {
                        score: p.totalScore,
                        max: p.totalWorkedScore,
                        perc: p.percCompletedScore,
                        letter: p.letterCompletedScore
                    }
                }
                this.gradeText = function(){
                    return class_.perc_completed_tasks?"Grade on completed work":'';
                }
            }
            var ActualGradeType = function(){
                this.getCustomBarPoints = function(){
                    var p = scope.progressReport;
                    if(!p) return {}
                    return {
                        score: p.totalScore,
                        max: p.totalWorkedScore,
                        perc: p.percCompletedScore,
                        letter: p.letterCompletedScore
                    }
                }
                this.gradeText = function(){
                    return class_.perc_completed_tasks?"Actual grade":''
                }
            }
            var OverallGradeType = function(){
                this.getCustomBarPoints = function(){
                    var p = scope.progressReport;
                    if(!p) return {}
                    return {
                        score: p.totalScore,
                        max: p.totalExpectedOrCompletedScore,
                        perc: p.percExpectedOrCompletedScore,
                        letter: p.letterExpectedOrCompletedScore
                    }
                }
                this.gradeText = function(){
                    return class_.perc_completed_tasks?"Overall grade":''
                }
            }
            function getGradeType(){
                var c = class_.custom_progress_bar;
                if(!c) return;
                return location=='course_view'? c.gradeTypeSplashPage : c.gradeTypeCourseView
            }

            var type = getGradeType() || 'completed'

            if(type=='completed'){
                return new CompletedGradeType();
            }
            if(type=='actual'){
                return new ActualGradeType();
            }
            if(type=='overall'){
                return new OverallGradeType();
            }
        }
        var ProgressBar = function(class_,scope,location){
            var self = this;
            self.class =class_;
            self.showGradeType = new ShowGradeType(class_,scope,location);
            function barBackground(){

                if(!(shouldUseCustomProgressBar() && self.class && self.class.custom_progress_bar ))
                    return '#2FA108';
                var progress = currentProgressVsExpected()
                if(progress>=0){
                    return barBackgroundAhead(Math.abs(progress))
                }else{
                    return barBackgroundBehind(Math.abs(progress))
                }
            }
            function shouldUseCustomProgressBar(){
                return self.class && self.class.use_custom_progress_bar && self.class.show_dates== '1';
            }
            function shoulUseCustomGrade(){
                return shouldUseCustomProgressBar() && self.class.perc_completed_tasks;
            }
            function currentProgressVsExpected(){
                return self.class?self.class.perc_completed_tasks - self.class.perc_expected_tasks:0
            }
            function barBackgroundAhead(progress){
                return findRangeColor(progress,self.class.custom_progress_bar.Ahead)
            }
            function barBackgroundBehind(progress){
                return findRangeColor(progress,self.class.custom_progress_bar.Behind)
            }
            function findRangeColor(progress,ranges){
                if(ranges)
                    for(var i = 0;i<ranges.length;i++){
                        if(progress>=ranges[i].min && progress<=ranges[i].max)
                            return ranges[i].color
                    }
            }
            function currentProgressText(){
                var p = currentProgressVsExpected()
                if(p==0){
                    return 'On track'
                }else if(p>0){
                    return p + '% ahead';
                }else{
                    return Math.abs(p) + '% behind';
                }
            }
            function gradeText(){
                var type = getGradeType() || 'completed'
            }
            function formatGrade(){
                if(!scope.progressReport ||  !self.class.perc_completed_tasks) return '';
                var points = self.showGradeType.getCustomBarPoints()

                var grade ="";
                if (class_.show_grades_as_score == 1) {
                    grade += points.score + "/" + points.max;
                }
                if (class_.show_grades_as_percentage == 1) {
                    grade += "(" + points.perc + "%)"
                }
                if (class_.show_grades_as_letter == 1) {
                    grade += " " + points.letter;
                }
                return grade == "" ? points.score + "/" + points.max + "(" + points.perc + "%)" : grade
            }

            return {
                currentProgressText: currentProgressText,
                currentProgressVsExpected: currentProgressVsExpected,
                barBackground:barBackground,
                shouldUseCustomProgressBar: shouldUseCustomProgressBar,
                formatGrade:formatGrade,
                gradeText: self.showGradeType.gradeText
            }
        }
    return {
        init: function(class_,scope,location){
            return new ProgressBar(class_,scope,location)
        }
    }


})
