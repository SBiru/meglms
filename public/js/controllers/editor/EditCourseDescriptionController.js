'use strict';

(function(){
    var app = angular.module('app');
    app.controller('EditCourseDescriptionController',[
        '$scope',
        'EditPage',
        'CurrentCourseId',
        'Alerts',
        'UserV2',
        'OrganizationV2',
        '$filter',
        'CurrentUnitId',
        'EditorClasses',
        'UploadFile',
        'Page',
        '$modal',
        'Pagebackground',
        function($scope,EditPage,CurrentCourseId,Alerts,UserV2,OrganizationV2,$filter,CurrentUnitId,EditorClasses,UploadFile,Page,$modal,Pagebackground){
            $scope.pageData = {}
            $scope.loading = {}
            $scope.addToMetaData = ['backgroundUrl','imageUrl','welcome','description','satisfies','credit','prerequisite','designer','badges'];

            $scope.Pagebackground = Pagebackground;

            function init(){
                prepareAddOrEdit();
                setTimeout(function(){bindTextareaFocusEvent()},200);
                getTeachers();
            }


            function prepareAddOrEdit(){
                if($scope.$stateParams.unitId){
                    $scope.editor_title="Add Course Description"
                    defaultValues();
                }else{
                    $scope.editor_title="Edit Course Description"

                    getPageData();
                }


            }
            function defaultValues(){
                _.extend($scope.pageData,{
                    page_title: "Course Description",
                    page_sub_title: "Course Description",
                    page_type:'course_description',
                    credit: "1/2",
                    description:"Description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here description goes here.",
                    satisfies:'Elective',
                    prerequisite:'0',
                })
                $scope.satisfies = [
                    'English',
                    'Math',
                    'Science',
                    'Social Studies',
                    'Fine Arts',
                    'Foreign Language',
                    'Elective',
                ]


                $scope.editingDescription = false;
            }
            function getPageData(){
                EditPage.get({pageId:$scope.$stateParams.contentId}).$promise.then(function(page){
                    defaultValues();
                    _.extend($scope.pageData,page);
                    $scope.pageData.page_title = page.pagename;
                    $scope.pageData.page_sub_title = page.subtitle;
                    $scope.pageData.page_id = $scope.$stateParams.contentId;
                    if(page.meta)
                    _.extend($scope.pageData,page.meta);
                })
            }
            function bindTextareaFocusEvent(){
                var textarea = jQuery('textarea#description');
                textarea.blur(function(){$scope.stopEditingDescription()})
            }
            function getPrerequisites(){
                if(!$scope.classes){
                    if(!_.isEmpty(EditorClasses.classes))
                        return $scope.classes = EditorClasses.classes;

                    $scope.loading.classes = true
                    OrganizationV2.getClasses(
                        {id:CurrentCourseId.data.orgId}
                    ).$promise.then(function(classes){

                        $scope.classes = $filter('orderBy')(classes,'name');
                        $scope.classes.splice(0,0,{
                                id:'0',
                                name:'None'
                            }
                        )
                            $scope.loading.classes = false;
                        EditorClasses.classes = angular.copy($scope.classes)
                    })
                }
            }
            function getTeachers(){
                UserV2.getUsers({role:'teacher'}).$promise.then(function(teachers){
                    $scope.teachers = teachers;
                })
            }
            $scope.startEditingDescription = function(){
                $scope.pageData.editingDescription = true;
                setTimeout(function(){jQuery('textarea#description').focus()})
            }
            $scope.stopEditingDescription = function(){
                $scope.pageData.editingDescription = false;
                setTimeout(function(){$scope.$apply()});
            }
            $scope.selectFile = function($event) {
                setTimeout(function(){
                    angular.element($event.target).closest('.course_description_image').find('#imageinput').trigger('click');
                },10);
            }
            $scope.backgroundImage = function(){
                if($scope.pageData.backgroundUrl)
                    return 'url("'+$scope.pageData.backgroundUrl+'")';
            }
            $scope.saveChanges = function(callBack){
                $scope.loading.editPage=1;
                if($scope.pageData.imageData){
                    return uploadImage($scope.saveChanges);
                }
                var method =$scope.$stateParams.unitId?'submit':'update';

                EditPage[method](prepareParams()).$promise.then(function(page){
                    if (page.message == 'successful') {
                        $scope.loading.editPage=0;

                        if(method=='submit'){
                            Page.movePage({
                                    id:page.id,
                                    toUnit:$scope.$stateParams.unitId,
                                    toPosition:1
                                },
                                function(ok){

                                        toastr.success("Saved!");
                                        $scope.$root.$broadcast('NavForceReload');



                                },
                                function(error){
                                    Alerts.danger({
                                        title:'Page could not be moved',
                                        content:error.statusText,
                                        textOk:'Ok'
                                    },function(){});
                                }
                            );
                        }else{
                            if(callBack){
                                callBack();
                            }else{
                                $scope.$root.$broadcast('NavForceReload');
                                toastr.success("Saved!");
                            }

                        }
                    }
                    else {
                        $scope.loading.editPage=2;
                        Alerts.danger({
                            title:'Changes could not be saved',
                            content:page.message,
                            textOk:'Ok'
                        },function(){});
                    }
                })

            }
            function uploadImage(callback){
                UploadFile.imageData({
                    imageData:$scope.pageData.imageData.base64
                },function(res) {
                    $scope.pageData.imageUrl = res.filename;
                    delete $scope.pageData.imageData;
                    if(callback)
                        callback(res.filename);
                });
            }
            function prepareParams(){
                var params = _.extend({},$scope.pageData);
                params.meta = {}
                $scope.addToMetaData.forEach(function(prop){
                    if(!_.isNull($scope.pageData[prop]) && !_.isUndefined($scope.pageData[prop])){
                        params.meta[prop] =$scope.pageData[prop];
                    }
                })
                params.meta.backgroundUrl = params.meta.backgroundUrl || ''
                return params
            }
            $scope.$watch('$root.user',function(me){
                if(me)
                    $scope.pageData.designer = me.id;
            })
            $scope.$watch(getClassName,function(className){
                if(className){
                    $scope.pageData.welcome = "Welcome to " + className;
                    getPrerequisites();
                    $scope.pageData.unit_id = CurrentUnitId.getUnitId();
                    $scope.pageData.class_id = CurrentCourseId.data.classId;
                }

            })
            $scope.$watch('pageData.imageData',function(imageData){
                if(imageData)
                    delete $scope.pageData.imageUrl;

            })
            $scope.showPreviewButton = function(){
                return $scope.$stateParams.contentId
            }
            $scope.openPreview = function () {
                $scope.loading.preview = 1
                $scope.saveChanges(function(){
                    $scope.loading.preview = 0;
                    var addhash = '/#';
                    var url ="../.."+addhash+"/"+$scope.pageData.page_type.toLowerCase()+"/" + $scope.$stateParams.contentId;
                    var modalInstance   = $modal.open({
                        templateUrl: '/public/views/partials/edit.page.preview.html',
                        controller: 'EditPagePreviewController',
                        size: 'lg',
                        resolve: {
                            previewurl: function () {
                                return url
                            }
                        }
                    });
                })
            };
            function getClassName(){
                return CurrentCourseId.data.name;
            }
            init();
        }]).directive('textareaFocusable',function(){
        return {
            restrict:'A',
            link:function(scope,element){
                function display(){
                    return element.css('display');
                }
                scope.$watch(display,function(cssDisplay){
                    console.log(cssDisplay);
                })
            }
        }
    }).factory('EditorClasses',function(){
        return {
            classes:[]
        }
    }).factory('Pagebackground',function(){
        return {
            backgroundConfig :{
                maxItems: 1,
                valueField: 'url',
                labelField: 'url',
                render: {
                    item: function(item, escape) {
                        if(item.url){
                            return '<div>' +
                                '<img style="width: 50px; height: 50px;" src="' + item.url + '">' +
                                '</div>';
                        }else{
                            return '<div>' +
                                '<div style="width: 50px; height: 50px; background: white"></div>'+
                                '</div>'
                        }

                    },
                    option: function(item, escape) {
                        if(item.url){
                            return '<div>' +
                                '<img style="width: 50px; height: 50px;" src="' + item.url + '">' +
                                '</div>';
                        }else{
                            return '<div>' +
                                    '<div style="width: 50px; height: 50px; background: white"></div>'+
                                '</div>'
                        }
                    }
                },
            },
            backgroundOptions : [
                {url:''},
                {url:'/public/coursecontent/2016-09-20-16-mbcxgdubwmxxwnhaaaea.png'},
                {url:'/public/coursecontent/2016-09-20-27-okekxdzhwlfpyaxbvvsx.png'},
                {url:'/public/coursecontent/2016-09-20-47-rncsgnilsmnosyslphvm.png'},
                {url:'/public/coursecontent/2016-09-20-00-kphodykewlidwicxzgvc.png'},
                {url:'/public/coursecontent/2016-09-20-11-arapxmreodvdolrodkai.png'},
                {url:'/public/coursecontent/2016-09-20-24-tutbveloajjivpbdnngg.png'},
                {url:'/public/coursecontent/2016-09-20-34-iokekgmsvlakiwwhxyxj.png'},
            ]
        }
    })
}());