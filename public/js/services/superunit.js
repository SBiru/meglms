'use strict';

angular.module('app')
    .service('SuperUnit',
    [	'$resource','$filter','$q','CurrentSuperUnitId',
        function ($resource,$filter,$q,CurrentSuperUnitId) {
            var rootUrl = '/api/super-unit/:id',
                rootResource = $resource(rootUrl,{classId:'@classId',id:'@id'},{
                    save:{
                        method:'POST',
                        interceptor:{responseError:handleError,response:function(unit){
                                updateUnit(unit.data);
                                return unit.data
                            }
                        }
                    },
                    query:{
                        url:'/classes/:classId/super-units/:id',
                        isArray:true
                    }
                }),
                factory = {};
            function handleError(rejection){
                if(rejection.data.showToUser){
                    toastr.error(rejection.data.error)
                }else{
                    toastr.error('Something went wrong');
                }
                return $q.reject(rejection)
            }
            function updateUnit(unit){
                var found = false;
                for(var i = 0; i<factory.units.length;i++){
                    if(factory.units[i].id==unit.id){
                        found = i;
                        factory.units[i] = unit;
                        factory.currentUnit = unit;
                        break;
                    }
                }
                if(found===false){
                    factory.units.push(unit);
                }
                factory.units = $filter('orderBy')(factory.units,'position');
                setCurrentUnitUsingId(unit.id)
            }
            function setCurrentUnitUsingId(currentId){
                factory.currentUnit = currentId?_.findWhere(factory.units,{id:currentId}):factory.units[0];
                if(!factory.currentUnit)
                    factory.currentUnit = factory.units[0]
            }
            factory.loadSuperUnits = function(classId){
                rootResource.query({'classId':classId},function(units){
                    factory.units = units;
                    var currentId = CurrentSuperUnitId.getIdFromCookie();
                    setCurrentUnitUsingId(currentId);
                });

            }
            factory.getSuperUnit = function(params,onSuccess,onFail,forceReload){
                if(factory.units && !forceReload){
                    var unit = _.findWhere(factory.units,{id:params.id})

                    if(unit && unit.$promise){
                        return onSuccess(unit);
                    }

                }
                return rootResource.get(params,onSuccess,onFail);
            }
            factory.changeSuperUnit = function(unit){
                CurrentSuperUnitId.setInfo(unit);
            }
            factory.model = rootResource;
            return factory
        }
    ]
);