app.service('Forum', ['$resource',function($resource){
    var baseUrl  = '/api/classes/:classId/forum'
    return $resource(baseUrl,{classId:'@classId',id:'@id'},{
        savePost:{
            url:baseUrl + '/post',
            method:'POST'
        },
        editPost:{
            url:baseUrl + '/post',
            method:'PUT'
        },
        deletePost:{
            url:baseUrl + '/post/:id',
            method:'DELETE'
        },
        loadTopics:{
            url:baseUrl + '/:pageId/topics'
        },
        loadTopic:{
            url:baseUrl + '/topic/:topicId'
        },
        loadParticipants:{
            url:baseUrl + '/:pageId/participants',
            isArray:true
        }
    })
}]);