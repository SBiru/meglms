
(function($){
    "use strict";
    var E3Ws,E3wSBrokerStats;
    var localIp = '192.168.0.103';
    var url = window.location.hostname + '/wsapp';
    var INVALID_TOKEN = 'Invalid token';
    E3Ws = function(userId){
        this.client = Stomp.client('wss://'+url);
        this.client.debug = null;
        this.userId = userId;
        E3Util.addCallbacks(this);
        this.connect();
    };

    E3Ws.prototype.connect = function(){
        this.client.connect({
            login:'user-'+this.userId,
            passcode:'user-'+this.userId
        },this.callbackConnected.bind(this))
    };

    E3Ws.prototype.callbackConnected = function(){
        if(this.callbacks && this.callbacks.onConnected){
            this.callbacks.onConnected.forEach(function(callback){
                callback();
            })
        }
    }
    E3wSBrokerStats= {
        Topic:'Topic'
    }
    this.E3Ws = E3Ws,
    this.E3wSBrokerStats = E3wSBrokerStats;

}).call(this,jQuery);