
appControllers.controller('AdminLicensesController', ['$scope','UserInformation','Licenses',
    function($scope,UserInformation,Licenses){
        $scope.org_id = $scope.$stateParams.org_id||0;
        if(!$scope.org_id)
            return;

        $scope.createNewBatch = createNewBatch;
        $scope.addClass = addClass;
        $scope.removeClass = removeClass;
        $scope.new={};
        $scope.licenseClasses=[];
        $scope.userInfo = UserInformation;
        $scope.batches = Licenses.query({orgId:$scope.org_id});

        $scope.$watch('new.classid',classChanged);

        $scope.types =[
            {name:'days'},
            {name:'hours'},
        ];

        function removeClass(index){
            $scope.licenseClasses.splice(index,1);
        }
        function addClass(){
            if($scope.groups && $scope.groups.length>0){
                if(!$scope.new.groupid){
                    toastr.warning("Please, select a group");
                    return;
                }
            }
            var group = _.findWhere($scope.groups,{id:$scope.new.groupid});
            $scope.class['group']=group;

            $scope.licenseClasses.push($scope.class);
        }

        function createNewBatch(){

            if($scope.new.classid && !$scope.licenseClasses.length){
                if(!confirm("Are you sure you want to proceed without adding any classes?"))
                    return;
            }

            $scope.new.org_id=$scope.org_id;
            $scope.createNewError = "Creating..";

            if($scope.licenseClasses.length){
                var classes = [];
                _.each($scope.licenseClasses,function(class_){
                    var c = {id:class_.id};
                    if(class_.group){
                        c.groupid = class_.group.id;
                    }
                   classes.push(c);
                });
                $scope.new.classes=classes;
            }
            Licenses.generate($scope.new,function(res){
                if(res.status && res.status=='success'){
                    $scope.createNewError = "";
                    $scope.batches = Licenses.query({orgId:$scope.org_id});
                    $scope.new = {};
                    $scope.licenseClasses = [];

                }
                else
                    $scope.createNewError = res.error;
            },function(error){
                $scope.createNewError = "Could not create. Please, try again";
            });
        }
        function classChanged(){
            $scope.groups=[];
            var class_ = _.findWhere($scope.$root.classes,{id:$scope.new.classid});
            if(!class_)
                return;
            $scope.class= class_;
            if(class_.groups.length>0){
                $scope.groups=class_.groups;
            }
        }
    }
]);