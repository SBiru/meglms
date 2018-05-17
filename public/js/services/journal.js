angular.module('app')
    .service('Journal',
    [	'$q',
        '$http',
        '$resource',
        function ($q, $http, $resource) {
            var rootUrl = '/api/journal'
            var resource = $resource(rootUrl+'/:id',{id:'@id'},{});
            return resource;
        }
    ]
)