angular.module('app')
    .service('PageVersions',['$resource',function($resource){
        var baseUrl = '/api/pages/:id/versions'
        return $resource(baseUrl,{id:'@id'});
    }])
    .directive('pageVersionsButton',['$modal',function($modal){
    return {
        restrict: 'E',
        scope:{
            pageId:'=?',
            pageName:'=?',
            ready:'=?',
            click:'=?',
            save:'=?'
        },
        template:'<button class="btn btn-sm btn-info" data-ng-disabled="!ready" ng-click="clicked()">See page' +
        ' versions <span class="fa fa-pulse fa-spinner" ng-show="!ready"></span></button>',
        link:function(scope,el){
            scope.clicked = function(){
                scope.click && scope.click(scope.openModal)
            };
            scope.openModal = function(){
                $modal.open({
                    controller:['$scope','$filter','PageVersions',function($scope,$filter,PageVersions){
                        $scope.pageName = scope.pageName
                        $scope.versions = null;
                        $scope.selected = {}
                        if (angular.isDefined(CKEDITOR) && angular.isDefined(CKEDITOR.instances) && angular.isDefined(CKEDITOR.instances.editor1)) {
                            $scope.page_content = CKEDITOR.instances.editor1.getData()
                        }
                        PageVersions.query({'id':scope.pageId}).$promise.then(function(versions){
                            $scope.versions = versions;
                            $scope.minDate = new Date(versions[0].modified_on);
                            $scope.maxDate = new Date(versions[versions.length-1].modified_on);
                            $scope.select(versions[versions.length-1]);
                            $scope.filters.startDate = $scope.minDate;
                            $scope.filters.endDate = $scope.maxDate;
                            update($scope.sort)
                        });

                        $scope.sort = {
                            by:'modified_on',
                            reverse:false
                        };
                        $scope.filters = {
                            startDate:null,
                            endDate:null
                        };
                        $scope.setSortBy = function(id){
                            if($scope.sort.by==id)
                                $scope.sort.reverse = !$scope.sort.reverse;
                            else{
                                $scope.sort.by = id;
                            }
                        };
                        $scope.save = function(){
                            scope.save($scope.selected.content);
                            $scope.$dismiss();
                        }


                        $scope.select = function(v){
                            $scope.selected = v
                        }
                        $scope.filterFn = function(){
                            $scope.filteredItems =  _.filter($scope.versions,$scope.filter);

                        }
                        $scope.filter = function(version){

                            if($scope.filters.startDate &&
                                moment(version.modified_on).format('YYYYMMDD') < moment($scope.filters.startDate).format('YYYYMMDD'))
                                return false;
                            if($scope.filters.endDate &&
                                moment(version.modified_on).format('YYYYMMDD') > moment($scope.filters.endDate).format('YYYYMMDD'))
                                return false;
                            if($scope.filters.author){
                                var pattern = new RegExp('.*' + $scope.filters.author + '.*' ,'i');
                                if(!version.name.match(pattern))
                                    return false;
                            }
                            return true
                        };
                        $scope.$watch('sort', update,true)
                        function update(sort){
                            if(!sort) return;
                            $scope.versions = $filter('orderBy')($scope.versions,sort.by,sort.reverse)
                            $scope.filterFn($scope.versions);
                        }
                        $scope.$watch('filters.startDate',$scope.filterFn);
                        $scope.$watch('filters.endDate',$scope.filterFn);
                        $scope.$watch('filters.author',$scope.filterFn);
                        $scope.pagConfig = {
                            itemsPerPage: 20,
                            showOnTop:true,
                            showOnBottom:false
                        };
                        setTimeout(function(){
                            $('.page-versions .right_side > div').css('max-height',window.innerHeight-200);
                            $('.page-versions .left_side [e3-pagination] .table-wrapper').css('max-height',window.innerHeight-450);
                        },200)
                    }],
                    templateUrl:'/public/views/directives/editor/page-versions-modal.html?v=' + window.currentJsVersion,
                    windowClass: 'modal-flat modal-template-select'
                }).result.then(function(template){
                    scope.canvasTemplate = template;
                });
            }
        }
    }
}]).directive('e3Datepicker',[function(){
    return {
        require: "?ngModel",
        restrict:'E',
        scope: {
            ngDisabled: '=?',
            minDate:'=?',
            maxDate:'=?'
        },
        templateUrl:'/public/views/directives/e3-datepicker.html?v='+window.currentJsVersion,
        link:function(scope,el,attrs,ngModel){
            if (!ngModel) return;

            ngModel.$render = function(){
                scope.value = ngModel.$modelValue;
            };
            scope.changed = function(){
                ngModel.$setViewValue(moment(scope.value).format('YYYY-MM-DD'));
            }
            scope.openDatePicker = openDatePicker;
            function openDatePicker($event){
                $event.preventDefault();
                $event.stopPropagation();
                scope.datepickerOpened = true;
            }
            scope.format = 'dd-MMM-yyyy';
            scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };


        }
    }
}]);