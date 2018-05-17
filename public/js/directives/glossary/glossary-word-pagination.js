(function(){
    "use strict";
    angular.module('app').factory('GlossaryWordPagination',function(){
    function Search(){
        var self = this;
        this.updatePaginationData = function(result,cb){
            this.words = result.data;
            this.paginationConfig.currentPage = result.page-1;
            this.paginationConfig.total = result.total;
            this.paginationConfig.restart && this.paginationConfig.restart();
            if(this.paginationConfig.selectAll)
                selectAll();
            if(this.paginationConfig.selectedIds)
                selectWords();
        }
        function selectAll(){
            _.each(self.words,function(w){
                if(!self.paginationConfig.ignoreIds || self.paginationConfig.ignoreIds.indexOf(w.id)<0)
                    w.selected = true;
            })
        }
        function selectWords(){
            _.each(self.words,function(w){
                w.selected = self.paginationConfig.selectedIds.indexOf(w.id)>=0;
            })
        }

        this.paginationConfig = {
            itemsPerPage:5,
            perPageRange:[5,10,15,20],
            currentPage:0,
            showNav: false,
            showOnBottom:false,
            showTotal:true,
            selectAll:false,
            toggleSelectAll :function(force){
                self.paginationConfig.selectAll = force===undefined?!self.paginationConfig.selectAll:force;
                _.each(self.words,function(w){
                    w.selected = self.paginationConfig.selectAll;
                });
                delete self.paginationConfig.ignoreIds;
                delete self.paginationConfig.selectedIds;
            }
        };
    }
    return {
        create:function(){
            return new Search();
        }
    }
})
}());