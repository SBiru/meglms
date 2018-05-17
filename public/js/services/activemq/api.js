var appServices = angular.module('app.services');
appServices.factory('E3WsApi',['$resource',function($resource){
    var rootUrl = 'http://' + window.location.hostname + ':8161/api/jolokia',
        brokerName = 'amq-broker';
    return $resource(rootUrl,{}, {
        brokerStatistic:{
            url:rootUrl+'/read/org.apache.activemq:brokerName='+brokerName+',type=Broker/:statistic',
            params:{statistic:'@statistic'}
        }
    });
}]);