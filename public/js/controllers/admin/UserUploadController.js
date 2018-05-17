'use strict';

angular.module('app')
.controller('UserUploadController',
[	'$scope',
    'Import',
    'UserUpload',
    'Alerts',
    function($scope, Import, UserUpload,Alerts){
        var file;
        var orgId = $scope.$state.params.organizationId;
        $scope.preview = {}
        $scope.options = {
            limit:'10',
            delimiter:',',
            encoding:'UTF-8',
            type:2,
            existing_details:1,
            existing_password:1
        };

        $scope.selectFile = function(files) {
            $scope.error = null;
            if(!files.length) {
                return;
            }
            file = files[0];
            $scope.ready = true;

            $scope.filename = file.name;
            $scope.dataFinished = null;
            $scope.importFinished = null;
            $scope.filesize = (file.size/1000000).toFixed(2);
        };
        $scope.runImport = function (forceDelete,forceErrors) {

            if($scope.preview.hasErrors && ! forceErrors){
                Alerts.warning({
                        title:'The file contains errors',
                        content:'Rows with errors will be ignored. Are you sure you want to continue?',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },$scope.runImport.bind(this,forceDelete,true)
                )
                return;
            }else{
                forceErrors=true;
            }
            if($scope.preview.hasDeleteUser.length && !forceDelete){
                Alerts.danger({
                        title:'Deleting user accounts',
                        contentHtml:'<p>You are about the delete following user accounts: </p><ul><li>'+$scope.preview.hasDeleteUser.join('</li><li>')+'</li></ul><p>Are you sure you want to continue?</p>',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },$scope.runImport.bind(this,true,forceErrors)
                )
                return;
            }else{
                forceDelete=true;

            }

            function then(data){
                $scope.importFinished = data;
                $scope.finished = true;
                $scope.dataFinished=null;
                $scope.importing = $scope.ready = false;
            }
            function error(error){
                $scope.importing = false;
            }

            if(forceDelete && forceErrors){
                $scope.importing = true;


                if($scope.previewingWholeFile){
                    UserUpload.import({
                        orgId:orgId,
                        'userActions':$scope.dataFinished,
                        options:$scope.options
                    },then,error)
                }else{
                    UserUpload.importUpload(
                        file,
                        orgId,
                        {options:$scope.options,userActions:'reloadFile'},
                        // on progress:
                        function(evt) {},
                        // on success:
                        then,
                        // on error
                        error
                    )
                }
            }


        }
        $scope.getPreview = function () {
            Import.keepAlive.start();
            if(!$scope.ready) {
                $scope.error = 'An error ocurred while checking compatibility. Please reload the page.';
                return;
            }
            $scope.importing = true;
            UserUpload.preview(
                file,
                orgId,
                $scope.options,
                // on progress:
                function(evt) {},
                // on success:
                function(data) {
                    $scope.dataFinished = data.users
                    $scope.previewingWholeFile = data.all
                    $scope.finished = true;
                    $scope.importing = $scope.ready = false;
                    preparePreviewData(data.users);

                },
                // on error
                function(error) {
                    $scope.importing = $scope.ready = false;
                    file = null;
                    Import.keepAlive.stop();
                    $scope.error = error.error;
                }
            );
            $scope.filterPreviewRows = function(row){
                if($scope.preview.filterErrors && !row.errors)
                    return false;
                if($scope.preview.filterExisting && !row.userExists)
                    return false;
                return true;
            }

            function preparePreviewData(data){
                if(!data) return;
                var first = true;
                $scope.preview={};
                $scope.preview.rows = [];
                $scope.preview.hasDeleteUser = [];
                for(var email in data){
                    if(data[email].db){
                        $scope.preview.hasExistingUser = true;
                    }
                    for(var i = 0;i<data[email].actions.length;i++){
                        if(data[email].actions[i].action=='D'){
                            if($scope.preview.hasDeleteUser.indexOf(email) == -1) {
                                $scope.preview.hasDeleteUser.push(email);
                            }
                        }
                        if(first){
                            $scope.preview.header= Object.keys(data[email].actions[i]);
                            if((e = $scope.preview.header.indexOf('errors'))>=0){
                                $scope.preview.header.splice(e,1);
                            }
                            if((e = $scope.preview.header.indexOf('csvRowIndex'))>=0){
                                $scope.preview.header.splice(e,1);
                            }
                            first = false;
                        }
                        if(data[email].db){
                            data[email].actions[i].userExists = data[email].db.id;
                        }
                        if(data[email].actions[i].errors){
                            $scope.preview.hasErrors=true;
                            data[email].actions[i].errorTooltip = createTooltip(data[email].actions[i].errors)
                        }
                        $scope.preview.rows.push(data[email].actions[i]);
                    }
                }
                $scope.showPreview = true;
            }
            function createTooltip(errors){
                var html = '<ul>'
                for(var i =0; i<errors.length;i++){
                    html += '<li>'+errors[i]+'</li>'
                }
                html += '</ul>'
                return html;
            }

        }
    }
]
);

//if(languageValueProvided == "arabic" || languageValueProvided == "ar"){
//    newUserPreferredLanguage = "ar";
//}
//else if(languageValueProvided == "german" || languageValueProvided == "de"){
//    newUserPreferredLanguage = "de";
//}
//else if(languageValueProvided == "english" || languageValueProvided == "en"){
//    newUserPreferredLanguage = "en";
//}
//else if(languageValueProvided == "spanish" || languageValueProvided == "es"){
//    newUserPreferredLanguage = "es";
//}
//else if(languageValueProvided == "french" || languageValueProvided == "fr"){
//    newUserPreferredLanguage = "fr";
//}
//else if(languageValueProvided == "japanese" || languageValueProvided == "jp"){
//    newUserPreferredLanguage = "jp";
//}
//else if(languageValueProvided == "cambodian" || languageValueProvided == "km"){
//    newUserPreferredLanguage = "km";
//}
//else if(languageValueProvided == "korean" || languageValueProvided == "ko"){
//    newUserPreferredLanguage = "ko";
//}
//else if(languageValueProvided == "portuguese" || languageValueProvided == "pt"){
//    newUserPreferredLanguage = "pt";
//}
//else if(languageValueProvided == "thai" || languageValueProvided == "th"){
//    newUserPreferredLanguage = "th";
//}
//else if(languageValueProvided == "vietnamese" || languageValueProvided == "vi"){
//    newUserPreferredLanguage = "vi";
//}
//else if(languageValueProvided == "chinese" || languageValueProvided == "zh"){
//    newUserPreferredLanguage = "zh";
//}