(function(){
    "use strict";

    angular.module('app').directive('glossaryImport',['$modal','GlossaryImport','Upload','Alerts',
        function($modal,GlossaryImport,Upload,Alerts){
            return {
                restrict:'E',
                templateUrl:'/public/views/directives/glossary/glossary-import.html?v='+window.currentJsVersion,
                scope:{
                    orgId:'=?',
                    close:'=?'
                },
                link:function(scope){
                    var file;
                    var originalData;
                    scope.data = null;	// after upload
                    scope.selected = null;	// file
                    scope.inProgress = false;	// upload
                    scope.complete = false;	// upload
                    scope.retrieving = false;	// retrieving previous upload
                    scope.fromPrevious = false;	// retrieving previous upload
                    scope.importAll = false;	// use original data from upload
                    scope.importComplete = false;	// import (after upload and selection)
                    scope.selectedFileToImport = null; // file to be imported (uploaded or selected from previous)
                    scope.fakeWord = {tags:[],org_id:scope.orgId}; // used to add tags to all words in the uploaded file

                    loadPreviousUploads();

                    function loadPreviousUploads(){
                        GlossaryImport.previousUploads({orgId:scope.orgId}).$promise.then(function(uploads) {
                            scope.previousUploads = uploads;
                        });
                    }
                    scope.check = function(files) {
                        if(!files.length) {
                            return;
                        }
                        file = files[0];
                        var type = 'unknown';
                        scope.selected = {
                            'name': file.name,
                            'type': file.name.substring(file.name.lastIndexOf('.'), file.name.length),
                            'size': humanFileSize(file.size,true),
                            'ready': false
                        };
                        // add other types here
                        switch(scope.selected.type) {
                            case '.xml':
                                type = 'XML';
                                scope.selected.ready = true;
                                break;
                            default:
                                type = (file.type)? file.type : 'unknown';
                                break;
                        }
                        scope.selected.type = type;
                    };
                    scope.isReady = function() {
                        return scope.selected && scope.selected.ready;
                    };

                    scope.isBusy = function() {
                        return scope.inProgress || scope.complete;
                    };
                    scope.isReadyToImport = function(){
                        return scope.selectedFileToImport !== null;
                    };

                    scope.upload = function(){
                        var url = '/api/glossary/import/upload';
                        Upload.upload({
                            'url': url,
                            'fields': {orgId:scope.orgId},
                            'file': file
                        }).progress(onUploadProgress).success(onUploadSuccess).error(onUploadError);
                    };
                    function onUploadProgress(evt) {
                        scope.inProgress = true;
                        scope.progress = parseInt(100.0 * evt.loaded / evt.total);
                    }
                    function onUploadSuccess(data){
                        originalData = angular.copy(data);
                        scope.complete = true;
                        scope.selectedFileToImport = data;
                    }
                    function onUploadError(){
                        toastr.error('An error ocurred while uploading file');
                    }
                    scope.selectFromPrevious = function (upload){
                        scope.selectedFileToImport=upload;
                        scope.complete = true;
                    };
                    scope.discard = function(upload) {
                        Alerts.danger(
                            {
                                title: 'Discard upload',
                                content: 'Are you sure you want to discard this file? You will need to re-upload the file if discarded.',
                                textOk: 'Yes, Discard File'
                            },
                            function(){
                                GlossaryImport.remove({id:upload.id}).$promise.then(loadPreviousUploads);
                            }
                        );
                    };

                    scope.import = function(){
                        scope.importing = true;
                        GlossaryImport.save({
                            id:scope.selectedFileToImport.id,
                            tags:_.map(scope.fakeWord.tags,function(t){return t.id})
                        }).$promise.then(function(){
                            scope.close && scope.close();
                        },function(){
                            scope.importing = false;
                            toastr.error("Something when wrong :(");
                        })
                    }
                }
            }
        }])
    function humanFileSize(bytes, si) {
        var thresh = si ? 1000 : 1024;
        if(Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si
            ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
            : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while(Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1)+' '+units[u];
    }

}());
