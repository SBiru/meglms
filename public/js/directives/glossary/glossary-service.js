angular.module('app').service("Glossary",['$resource',function($resource){
    var rootUrl = '/api/glossary/:id';
    return $resource(rootUrl,{'id':'@id'},{
        removeWords:{
            url: rootUrl + '/remove',
            method:"POST"
        },
        saveLinkOptions:{
            url: rootUrl + '/link',
            method:"POST"
        },
        getTags:{
            url: rootUrl + '/tags',
            isArray:true
        },
        toggleDefinition:{
            url: rootUrl + '/toggle-definition'
        }
    });

}]).service("GlossaryWords",['$resource',function($resource){
    return $resource('/api/glossary/words/:id',{'id':'@id'},{
        create:{
            method:"POST"
        },
        query:{
            isArray:false
        },
        authors:{
            url:'/api/glossary/words/authors',
            isArray:true
        },
        updateDefinition:{
            url:'/api/glossary/definitions/:id',
            method:"POST"
        },
        deleteDefinition:{
            url:'/api/glossary/definitions/:id',
            method:"DELETE"
        }
    })

}]).service("GlossaryTags",['$resource',function($resource){
    return $resource('/api/glossary/tags',{'id':'@id'},{
        create:{
            method:"POST"
        },
        save:{
            method:"POST",
            url:"/api/glossary/:id/tags",
            isArray:true
        },
        filterWords:{
            url:'/api/glossary/tags/filter'
        },
        query:{
            url:'/api/glossary/tags'
        },
        queryArray:{
            url:'/api/glossary/tags',
            isArray:true
        },
        authors:{
            url:'/api/glossary/tags/authors',
            isArray:true
        },
        update:{
            url:'/api/glossary/tags/:id',
            method:"PUT"
        },
        delete:{
            url:'/api/glossary/tags/:id',
            method:"DELETE"
        }
    })
}]).service("GlossaryImport",['$resource',function($resource){
    return $resource('/api/glossary/import/:id',{'id':'@id'},{
        previousUploads:{
            url:'/api/glossary/import/upload/previous',
            isArray:true
        }
    })
}]);
