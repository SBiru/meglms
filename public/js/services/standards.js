
var prependTab = function (str,n){
    for(var i =0;i<n;i++){
        str = '-- ' + str;
    }
    return str;
}
var flatterHelper = function(node,n){
    node.fakeName = prependTab(node.name,n)
    var array = [node]
    for(i in node.children){
        var temp = flatterHelper(node.children[i],n+1)
        Array.prototype.push.apply(array,temp);
    }
    return array;
}
var flatter = function(tree){
    var root = {children:tree,name:"No parent",fakeName:"No parent",id:0};
    var resp = flatterHelper(root,-1);

    return resp;
}

var appServices = angular.module('app.services');
appServices.factory('Standard',['$resource',function($resource){
    return $resource('/standards/', {org_id:'@org_id',id:'@id'}, {
        query:{
            url:'/standards/:org_id',
            method: 'GET'
        },
        get:{
            url:'/standards/:org_id/:id',
            method: 'GET'
        },
        create:{
            url:'/standards/:org_id/',
            method: 'POST'
        },
        update:{
            url:'/standards/:org_id/:id',
            method: 'POST'
        },
        delete:{
            url:'/standards/:id',
            method: 'DELETE'
        },
        link:{
            url:'/standard-links/',
            method: 'POST'
        },
        unlink:{
            url:'/standard-links/',
            method: 'DELETE'
        },
        linked:{
            url:'/standard-links/',
            method: 'GET'
        }
    });
}]);

appServices.factory('StandardData', ['Standard',function (Standard) {
    return {
        data: [],
        links:[],
        org_id:0,
        setData: function (data) {
            this.data = data;
        },
        getData: function () {
            return this.data;
        },
        refresh: function(courseId) {
            var that = this;
            courseId = courseId || 0;
            Standard.query({org_id:this.org_id,courseId:courseId},function(data){
                that.data=data.standards;
            });
        },
        flattened: function(){
            return flatter(this.data);
        }

    }
}]);
