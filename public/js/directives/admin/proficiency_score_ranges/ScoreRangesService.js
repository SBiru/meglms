'use strict';
(function(angular){
    angular.module('app').service("ScoreRangesService",['$resource',function($resource){
        return $resource('/api/proficiency-test/:testId/score-ranges/:categoryId',{categoryId:'@categoryId','testId':'@testId'},{
            saveLevel:{
                url:'/api/proficiency-test/score-ranges/:categoryId/level',
                method:'POST'
            },
            removeLevel:{
                url:'/api/proficiency-test/score-ranges/level/:id',
                params:{id:'@id'},
                method:'DELETE',

            }


        });
    }])
}(angular))