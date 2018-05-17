

(function () {
    "use strict";

    var app = angular.module('automatedAlerts');
    app.directive('alertAddressees',[
        function(){
            return {
                restrict:'E',
                templateUrl:'/public/views/directives/automated-alerts/addressees.html',
                scope:{
                    alert:'=automatedAlert'
                },
                link:function(scope,element){
                    scope.default = [
                        'Advisors',
                        'Admins',
                        'Parents',
                        'Students',
                        'Teachers'

                    ]
                    function init(){
                        checkDefaults();
                    }
                    function checkDefaults(){
                        scope.currentDefault = angular.copy(scope.default);
                        angular.forEach(scope.alert.addressees,function(addr){
                            if(scope.currentDefault.indexOf(addr)>=0){
                                scope.currentDefault.splice(scope.currentDefault.indexOf(addr),1);
                            }
                        })
                        resetCurrentSelectedAddressee();
                    }
                    function resetCurrentSelectedAddressee(){
                        if(scope.currentDefault.length){
                            scope.currentSelectedAddressee = scope.currentDefault[0]
                        }else{
                            scope.currentSelectedAddressee=null;
                        }
                    }

                    scope.addAddressee = function(){
                        if(!scope.currentSelectedAddressee) return;
                        var addressee = scope.currentSelectedAddressee;
                        removeFromDefaults(addressee)
                        scope.alert.addressees.push(addressee);
                    }
                    function removeFromDefaults(addressee){
                        if(scope.default.indexOf(addressee)>=0){
                            scope.currentDefault.splice(scope.currentDefault.indexOf(addressee),1);
                            resetCurrentSelectedAddressee();
                        }
                    }
                    scope.addCustomEmail = function(customEmail){
                        if(!customEmail){
                            toastr.error("Please, insert a valid email");
                            return;
                        }
                        scope.alert.addressees.push(customEmail);
                        element.find('.btn-add-addressee').removeClass('open');
                    }
                    scope.removeAddressee = function(addressee,index){
                        addBackToDefaults(addressee)
                        scope.alert.addressees.splice(index,1);
                    }
                    function addBackToDefaults(addressee){
                        if(scope.default.indexOf(addressee)>=0){
                            scope.currentDefault.push(addressee);
                        }
                    }
                    scope.stopClickPropagation = function(e){
                        e.stopPropagation();
                    }

                    init()
                }
            }
        }])


}());