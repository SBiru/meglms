angular.module('app')
    .factory('SharedTestSidebarController',function(){
        var Controller = function($scope,Gradebook,ProficiencyTestService,HelperService,params){
            var dashboardCtrl = $scope.vc_dash;
            var vc_sidebar = this;

            dashboardCtrl.classId = $scope.$state.params.classId;

            function getGradebook(classId){
                if(!classId) return;
                resetData();
                Gradebook.getCachedClassGrades({classId:classId},prepareGradebook);
            }
            function resetData(){
                delete this.students;
            }
            function prepareGradebook(gradebook){
                $scope.testName = gradebook.name;
                vc_sidebar.students = _.filter(_.map(gradebook.students,prepareStudentGrades));
                vc_sidebar.uniqueStudentCount = _.chain(vc_sidebar.students).map(function(s){return s.name}).unique().value().length
                // if(!$scope.$stateParams.applicantId){
                //     $scope.$state.go('j1_dashboard.nav.applicant',{classId:$scope.$stateParams.classId,'applicantId':vc_sidebar.students[0].id});
                // }
            }

            function prepareStudentGrades(student,i,gradebook){

                var percTotalScore = 0,
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
                            score = score.toFixed(1);
                            currentScore = currentScore;
                            percTotalScore+=score;
                            maxTotalScore+=total;
                            actualTotalScore+=currentScore;
                        }

                    })
                });
                if(($scope.$root.user.is_only_test_admin && !finishedGradeClass))
                    return null;
                return{
                    id:student.id,
                    testId:student.testId,
                    rawDate:submittedToAllActivities&&lastWorkedDate?moment(lastWorkedDate):null,
                    date:submittedToAllActivities&&lastWorkedDate?moment(lastWorkedDate).format('MMM DD, YYYY'):null,
                    groupName:student.groupName,
                    name: student.lastName + ', '+ student.firstName ,
                    email:student.email,
                    maxTotalScore:maxTotalScore.toFixed(1),
                    actualTotalScore:Math.round(actualTotalScore*10)/10,
                    submittedToAllActivities:submittedToAllActivities,
                    accountCreatedTime: student.accountCreatedTime,
                    finishedGradeClass:finishedGradeClass
                }
            }
            function parseValidFloat(n){
                return _.isNaN(parseFloat(n))?0:Math.round( parseFloat(n) * 10 ) / 10;
            }
            $scope.round = function(num){
                return Math.round(num * 100) / 100
            }
            this.activeColumn = null;
            this.sortBy = function(col) {
                this.columns.forEach(function(c){if(c.id!==col.id)c.resetSymbol()})
                col.activate();
                this.activeColumn = col;

            };

            var Column = function(label,id){
                this.label = label
                this.id = id;
                this.orderBy = '';
                this.symbol = ''
                this.order = 1;
                this.isActive = false;
                this.resetSymbol = function(){
                    this.symbol = ''
                    this.isActive = false;
                };
                this.activate = function(){
                    if(this.isActive){
                        this.order *= -1
                    }
                    this.isActive = true;

                    if(this.order>0){
                        this.orderBy = this.id;
                        this.symbol = 'fa fa-caret-up';
                    }else{
                        this.orderBy = '-'+this.id;
                        this.symbol = 'fa fa-caret-down';
                    }
                }
            };
            this.columns = [
                new Column('Applicant','name'),
                new Column('Date','rawDate'),
                new Column('Score','actualTotalScore')
            ];

            this.sortBy(this.columns[1]);
            this.sortBy(this.columns[1]);

            this.checkSidebar = function(){
                if(window.innerWidth<768){
                    dashboardCtrl.toggleSidebar()
                }
            };

            this.studentInitials = function(student){
                var parts = student.name.split(' ');
                if(parts.length>1)
                    return parts[0][0] + parts[1][0];
                return parts[0][0] + parts[0][1]
            }
            this.changeClass = function(classId){
                dashboardCtrl.classId && $scope.$state.go($scope.$state.$current.path[1].self.name+'.'+ params.dashboardState +'.nav',{classId:dashboardCtrl.classId})
                dashboardCtrl.sidebarCollapsed = !!classId;
            };
            if(dashboardCtrl.classes){
                setTimeout(function(){$('.applicants-container').css('height','calc(100% - 106px)')})
            }
            if($scope.$state.includes('home.with_tabs')){
                setTimeout(function(){
                    $('.sidebar').css('top','102px');
                    $('.sidebar').css('height','calc(100% - 102px)');
                })
            }
            setTimeout(function(){
                $('body').attr('style', 'background: rgb(249,249,249) !important');
            })
            this.navState = $scope.$state.$current.path[3].self.name;
            if(!params.gradebook)
                getGradebook($scope.$stateParams.classId);
            else prepareGradebook(params.gradebook);

            $scope.export = function(){
                ProficiencyTestService.exportClass({
                    classId:dashboardCtrl.classId,
                    data:{
                        className: $scope.testName,
                        students:_.map(_.sortBy(vc_sidebar.students,'accountCreatedTime').reverse(),function(s){
                            return [s.id,s.name,s.date,s.actualTotalScore,s.email]
                        }),
                        studentCount: vc_sidebar.uniqueStudentCount
                    }
                }).$promise.then(function(response){
                    HelperService.buildFileFromData(response.content,response.filename);
                })
            }
        }
        return Controller;

    })
    .controller('J1SidebarController',['$scope','Gradebook','ProficiencyTestService','HelperService','SharedTestSidebarController',function($scope,Gradebook,ProficiencyTestService,HelperService,SharedTestSidebarController){
        SharedTestSidebarController.call(this,$scope,Gradebook,ProficiencyTestService,HelperService,{
            dashboardState:'j1_dashboard',
            isJ1:true
        })

    }]);