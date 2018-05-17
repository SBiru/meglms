'use strict';

angular.module('app')
.service('TimedGroupEditor',['$resource',
    function($resource){
        var resourceUrl = '/api/timed-review';
        var factory = $resource(resourceUrl,{},{
            saveGroup:{
                method:'POST',
                url:resourceUrl+'/groups/:id',
                params:{
                    id:'@id'
                }
            },
            queryGroups:{
                isArray:true,
                url:resourceUrl+'/groups'
            },
            getGroup:{
                params:{
                    id:'@id'
                },
                url:resourceUrl+'/groups/:id'
            },
            savePrompt:{
                method:'POST',
                url:resourceUrl+'/prompts/:id',
                params:{
                    id:'@id'
                }
            },
            movePrompt:{
                method:'POST',
                url:resourceUrl+'/prompts/:id/move',
                params:{
                    id:'@id'
                }
            },
            removePrompt:{
                method:'DELETE',
                url:resourceUrl+'/prompts/:id',
                params:{
                    id:'@id'
                }
            },
            removeGroup:{
                method:'DELETE',
                url:resourceUrl+'/groups/:id',
                params:{
                    id:'@id'
                }
            },
            cloneGroup:{
                method:'POST',
                url:'/api/clone/timed_group/:id',
                params:{
                    id:'@id'
                }
            },
            clonePrompt:{
                method:'POST',
                url:'/api/clone/timed_prompt/:id',
                params:{
                    id:'@id'
                }
            }
        })
        angular.extend(factory,{
            currentGroup:null,
            currentPrompt:null,
            groups:[],
            updateGroups: function(group){
                var i;
                if(this.groups.some(function(g,index){
                        if(g.id==group.id){
                            i=index;
                            return true;
                        }

                    })){
                    this.groups[i]=group;
                }
                else{
                    this.groups.push(angular.copy(group));
                }
            }
        })
        return factory
    }
])
    .factory('uuid', function() {
        var svc = {
            new: function() {
                function _p8(s) {
                    var p = (Math.random().toString(16)+"000000000").substr(2,8);
                    return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
                }
                return _p8() + _p8(true) + _p8(true) + _p8();
            },

            empty: function() {
                return '00000000-0000-0000-0000-000000000000';
            }
        };

        return svc;
    })
