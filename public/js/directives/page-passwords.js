angular.module('app').directive('pagePasswords',
[
    'Class','WordBank','$filter','$window','$location','$timeout',
    function(Class,WordBank,$filter,$window,$location,$timeout){
        return{
            restrict:'E',
            templateUrl: '/public/views/directives/page-passwords.html',
            link: function ($scope, $element) {
                var w = angular.element($window);

                $scope.data={};
                $scope.loading={};
                $scope.selected={
                    classes:{}
                }


                $scope.loadDict=loadDict;
                $scope.addWord=addWord;
                $scope.deleteWord=deleteWord;
                $scope.hasChange=hasChange;
                $scope.getRandomWords=getRandomWords;
                $scope.canSave=canSave;
                $scope.save=save;
                $scope.removeClass=removeClass;

                initSelectizeConfig();
                getClasses();

                function getClassInfo(classId){
                    if($scope.selected.classes[classId].assignments)
                        return;
                    $scope.selected.classes[classId].loading = true;
                    Class.getPasswords({id:classId},function(assignments){
                        $scope.selected.classes[classId].loading = false;
                        $scope.selected.classes[classId].assignments = _.filter(_.map(assignments,function(a){
                            a.originalPwd = a.password;
                            a.daysToExpiration = Math.floor(a.timeUntilExpiration/(24*60*60));
                            return a;
                        }),function(a){
                            return a.password!="";
                        });
                    },function(error){
                        $scope.selected.classes[classId].loading = false;
                    })
                }
                function save(class_){
                    var pages = _.filter(class_.assignments,function(a){return a.enabled});
                    $scope.loading.savingClass = 1
                    Class.updatePasswords({
                        id:class_.id,
                        pages:pages
                    },function(ok){
                            $scope.loading.savingClass = 0;
                            for(var i = 0; i<class_.assignments.length;i++){
                                if(hasChange(class_.assignments[i]))
                                    class_.assignments[i].willExpire=false;
                            }
                        },
                      function(error){$scope.loading.savingClass = 2}
                    );
                }
                function canSave(class_){
                    if(!class_.assignments) return false;
                    for(var i = 0; i<class_.assignments.length;i++){
                        if(hasChange(class_.assignments[i]))
                            return true;
                    }
                    return false;
                }
                function getClasses(){
                    Class.query({
                        as: 'teacher'
                    },function(classes){
                        $scope.data.classes= $filter('orderBy')(classes,'name');
                    });
                }
                function onClassesChange(classes){
                    classes=classes||[]
                    angular.forEach($scope.selected.classes,function(c,key){
                        if(classes.indexOf(key)<0)
                            delete $scope.selected.classes[key];
                    });
                    angular.forEach(classes,function(id){
                        if(!$scope.selected.classes[id])
                            $scope.selected.classes[id]= _.findWhere($scope.data.classes,{id:id});
                        getClassInfo(id);
                    })
                }
                function loadDict(){
                    var f = first($scope.selected.classes);
                    var orgId = f?f.orgId:$scope.$root.user.org.id;
                    WordBank.query({
                        'orgId': orgId
                    },function(dict){
                        $scope.data.dict = dict;
                    },function(error){

                    });
                }
                function removeClass(key){
                    $scope.selected.classId.splice($scope.selected.classId.indexOf(key),1)

                }
                function checkScroll(a,b,c){
                    if(w.scrollTop()>40){
                        $element.addClass('fixed');
                    }else{
                        $element.removeClass('fixed');
                    }

                }
                function first(obj) {
                    for (var a in obj) return obj[a];

                }
                function addWord(word){
                    var f = first($scope.selected.classes);
                    var orgId = f?f.orgId:$scope.$root.user.org.id;
                    WordBank.save({
                        'orgId':orgId,
                        'word':word
                    },function(newWord){
                        $scope.data.dict.push(newWord);
                        $scope.data.adding = false;
                    },function(error){
                        if(error.data.error==1062){
                            toastr.error('Word already exists');
                        }
                    })
                }
                function deleteWord(word,$index){
                    WordBank.delete(word,
                        function(ok){
                            $scope.data.dict.splice($index,1);
                        },function(error){

                        }
                    )
                }
                function getRandomWords(class_){

                    WordBank.randomWords({
                        orgId:class_.orgId,
                        limit: _.countBy(class_.assignments,function(a){return a.enabled}).true
                    },function(words){
                       angular.forEach(class_.assignments,function(a){
                           if(words.length && a.enabled){
                               a.password = words.pop().word;
                           }
                       })
                    });
                }
                function initSelectizeConfig(){
                    if(!$scope.config) $scope.config={};
                    $scope.config.selectize={
                        valueField: 'id',
                        labelField: 'name',
                        searchField:'name'
                    }
                }

                function hasChange(page){
                    return page.originalPwd!=page.password;
                }

                $scope.$watch('selected.classId',onClassesChange);

                angular.element($window).bind('scroll',checkScroll);

                if($location.path()=="/password"){
                    $scope.selectPasswordTab = true;
                }
            }
        }
    }
])