appControllers.controller('OrganizationDetailsButtonController', [
    '$scope',
    '$modal',
    function ($scope, $modal) {

        $scope.open = function () {
            var modalInstance = $modal.open({
                templateUrl: '/public/views/partials/admin/organization_details.html',
                controller: 'OrganizationDetailsController',
                size: 'lg',
                windowClass: 'organization-preferences-window',
            });
        }

    }
]);

appControllers.controller('OrganizationDetailsController', [
    '$scope',
    '$modalInstance',
    'CurrentOrganizationId',
    'OrganizationV2',
    '$timeout',
    'UploadFile',
    function ($scope, $modalInstance, CurrentOrganizationId, OrganizationV2,$timeout,UploadFile) {
        $scope.cancel = cancel;
        $scope.update = update;
        $scope.loading = {};
        $scope.uploadLogo =uploadLogo;
        $scope.removeLogo = removeLogo;
        $scope.selectFile = selectFile;

        var id = CurrentOrganizationId.getOrganizationId();

        function cancel() {
            $modalInstance.dismiss('cancel');
        }

        function getInfo() {
            $scope.org = OrganizationV2.get({id: id},function(org){
                if(!$scope.org.password_expiration_users){
                    $scope.org.password_expiration_users={}
                }
                prepareOrgPreferences();
            })

        }

        function update() {
            $scope.$root.user.org.disallow_email = $scope.org.disallow_email;
            $scope.loading.update=1;
            $scope.org.$save().then(
                function(ok){
                    $scope.loading.update=0;
                    $modalInstance.close();
                },
                function(error){
                    $scope.loading.update=2;
                }
            );
        }
        function prepareOrgPreferences(){
            if($scope.org.preferences){
                var pref = {};
                _.each($scope.org.editable_preferences_in_details,function(key){
                    pref[key] = $scope.org.preferences[key];
                })
                $scope.org.preferences = pref;
            }
        }
        function selectFile($event) {
            $timeout(function(){
                angular.element($event.target).find('input').trigger('click');
            },10);
        }
        function removeLogo(){
            $scope.org.logo = '';
            $scope.logoImage = undefined;

        }
        function uploadLogo(){
            if(!$scope.logoImage){
                toastr.warning("Please, select an image");
                return;
            }
            UploadFile.imageData({
                imageData:$scope.logoImage.base64
            },function(res) {
                $scope.org.logo = res.filename;
                delete $scope.logoImage;
            });
        }

        getInfo();
    }
]).directive('passwordDates',function(){
    return {
        restrict: 'E',
        require:'ngModel',
        template:'<div data-ng-repeat="date in dates track by $index" class="password-date">' +
        '<span data-ng-bind="date"></span><span class="fa fa-remove" ng-click="removeDate($index)"></span></div>' +
        '<div class="btn btn-sm btn-default add-date" ng-click="openDatePicker($event)" datepicker-popup="{{format}}" is-open="datepickerOpened" ng-model="expirationDate" min-date="minDate" close-text="Close" datepicker-options="dateOptions"><span class="fa fa-plus"></span>Add date</div>',
        link:function(scope,element,attrs,ngModel){
            scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };
            scope.format = 'dd-MMMM-yyyy';
            scope.minDate = new Date();
            scope.openDatePicker=openDatePicker;
            scope.removeDate=removeDate;

            scope.$watch(
                function(){
                    return ngModel.$modelValue;
                },
                function(dates,oldDates){
                    scope.dates = dates;
                }
            );
            scope.$watch('expirationDate',addDate);
            function openDatePicker($event){
                $event.preventDefault();
                $event.stopPropagation();
                scope.datepickerOpened = true;
            }
            function addDate(date){
                if(date){
                    if(!scope.dates) scope.dates=[];
                    scope.dates.push(moment(date).format('YYYY-MM-DD'));
                    scope.expirationDate=undefined;
                    ngModel.$setViewValue(scope.dates);
                }
            }
            function removeDate(index){
                scope.dates.splice(index,1);
                ngModel.$setViewValue(scope.dates);
            }
        }
    }
})
;