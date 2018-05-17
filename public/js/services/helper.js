(function(){
    var appServices = angular.module('app.services');

    appServices.factory('HelperService', function () {
        return {
            buildFileFromData: function(content, filename,fileType){
                fileType = fileType || 'csv';
                var a = document.createElement('a');
                a.href = 'data:attachment/'+fileType+',' + encodeURIComponent(content);
                a.target = '_blank';
                if(filename)
                    a.download = filename;

                document.body.appendChild(a);
                a.click();
            },
            runAsyncCall: function(method,params,loading,callBack,callBackError){
                loading.obj[loading.flag] = 1;
                method(params).$promise.then(function(response){
                    if(callBack)
                        callBack(response);
                    delete loading.obj[loading.flag];
                },function(error){
                    loading.obj[loading.flag] = 2;
                    if(error.data.showToUser){
                        toastr.error(error.data.error)
                    }else{
                        toastr.error('Something went wrong');
                    }
                    if(callBackError)
                        callBackError(error);
                })
            }
        }
    });
}())
