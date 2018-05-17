appControllers.controller('MoveToUnitController', ['$scope','Page','CurrentUnitId','Alerts',
    function($scope,Page,CurrentUnitId,Alerts){
        $scope.isMoving = isMoving;
        $scope.startMoving = startMoving;
        $scope.moveToPosition = moveToPosition;
        $scope.cancelMoving = cancel;

        var moving = false;
        function isMoving(id){
            if(id)
                return id==moving;
            else
                return moving;
        }
        function startMoving(id){
            moving = id;
        }
        function cancel(){
            moving =false;
        }
        function moveToPosition(position){
            var unit = CurrentUnitId.getUnitId();
            if(!unit || !moving)
                return;
            Page.movePage({
                id:moving,
                toUnit:unit,
                toPosition:position
            },
                function(ok){
                    moving = false;
                    $scope.$root.$broadcast('NavForceReload');
                },
                function(error){
                    moving = false;
                    Alerts.danger({
                        title:'Page could not be moved',
                        content:error.statusText,
                        textOk:'Ok'
                    },function(){});
                }
            );
            moving = false;
        }

    }
]);
