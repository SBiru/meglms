appControllers.controller('PostsSummaryController', ['$scope','$q', '$modalInstance','Organization','PostV2','Class',
    function ($scope,$q, $modalInstance,Organization,PostV2,Class) {
        $scope.loading = {};
        $scope.selected = {};
        $scope.classesData = {};
        $scope.classes=[];


        $scope.cancel = cancel;
        $scope.getTotalCount=getTotalCount;
        $scope.getTeachers = getTeachers;


        $scope.$watch('selected.org_id',orgChanged);
        $scope.$watch('selected.class_id',classChanged);

        Organization.get({userId:'me'},function(res){
            $scope.orgs=res.organizations
        });


        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function getTeachers(classId){
            var classData = $scope.classesData[classId];
            if(classData){
                var teachers = [];
                _.each(classData.users.teachers,function(teacher){
                    teachers.push(teacher.firstName + ' ' + teacher.lastName)
                })
                return teachers.join(', ');
            }
        }
        function getClassesInfo(classes){
            var query = {}
            _.each(classes,function(class_){
                if(class_.id)
                    query[class_.id] = Class.get({id:class_.id,includeUsers:1}).$promise;
            });
            $q.all(query).then(function(info){
                $scope.classesData = info;
            });
        }

        function handleClasses(classes){
            getClassesInfo(classes);
            var resp = [];
            for(var c = 0;c<classes.length;c++){
                var class_ = classes[c];
                if(angular.isDefined(class_.groups)){
                    var tmpName = class_.name;
                    for(var i =0;i<class_.groups.length;i++){
                        var group = class_.groups[i];
                        var name = tmpName + ' - ' + group.name;
                        if(i==0){
                            class_.name=name;
                            class_.groupId = group.id;
                            resp.push(class_);
                        }else{
                            var newClass = _.clone(class_);
                            newClass.name=name;
                            newClass.groupId = group.id;
                            resp.push(newClass);
                        }
                    }
                }else{
                    resp.push(class_);
                }

            }
            return resp;
        }
        function classChanged(newValue){
            if(!newValue){
                $scope.units = [];

            }
            else{

                var class_ = _.findWhere($scope.classes,{id:newValue});
                $scope.units=class_.units;
            }
        }
        function orgChanged(newValue){
            if(!newValue)
                return;
            $scope.classes=[];
            $scope.selected.class_id=undefined;
            $scope.loading.classes=true;
            PostV2.needingGrade.byOrg({id:newValue},
                function(res){
                    var all = {name:' - All'}
                    res.classes.splice(0,0,all);
                    $scope.classes = handleClasses(res.classes);
                    $scope.loading.classes=false;
                },
                function(error){
                    $scope.loading.classes=false;
                })
        }

        function getTotalCount(by,params){
            if(by=='class'){

                var class_ = params.class
                var groupId = params.groupId;
                var units = class_.units || _.findWhere(class_.groups,{id:groupId}).units;
                return byUnit(units);

            }
            if(by=='unit'){
                return byPages(params);
            }
            if(by=='page'){
                return byUser(params);
            }

            function byUser(users){
                total=0;
                for(var u in users){
                    total+=users[u].posts.length;
                }
                return total;
            }
            function byPage(pages){
                total=0;
                for(var p in pages){
                    total+=byUser(pages[p].users);
                }
                return total;
            }
            function byUnit(units){
                total=0;
                for(var u in units){
                    total+=byPage(units[u].pages);
                }
                return total;
            }
        }

    }
]);