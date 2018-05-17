(function(){
    "use strict";
    angular.module('app').factory('GlossaryTagsPagination',function(){
        function Search(){
            var self = this;
            this.updatePaginationData = function(result){
                this.tags = result.data;
                this.paginationConfig.currentPage = result.page-1;
                this.paginationConfig.total = result.total;
                this.paginationConfig.restart && this.paginationConfig.restart();
            }
            this.paginationConfig = {
                itemsPerPage:15,
                perPageRange:[15,30,45,60],
                currentPage:0,
                showOnBottom:false,
                showTotal:true

            };
        }
        return {
            create:function(){
                return new Search();
            }
        }
    })
}());