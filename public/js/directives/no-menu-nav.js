'use restrict';
(function(angular){
angular.module('app').directive('noMenuNav',['Nav','noMenuFooterOptions',function(Nav,noMenuFooterOptions){
    return{
        restrict:'EA',
        templateUrl:'/public/views/directives/no-menu-nav.html',
        link:function(scope){
            var self = this,
                attemptsToLoad= 0,
                MAXATTEMPTS=10;
            function init(){
                if(!isDataAvailable())
                    return;
                scope.nav = Nav;
                Nav.showNoMenuInstructions = false;
                noMenuFooterOptions.lastPageOfCourse = Nav.navData.isLastPage;
                self.currentId = getContentId();
                prepareNavData()
            }
            function isDataAvailable(){
                if(!Nav.navData.units){
                    if(attemptsToLoad<MAXATTEMPTS){
                        setTimeout(init,200);
                        attemptsToLoad++;
                    }
                    return false;
                }
                return true;
            }

            function prepareNavData(){
                var units = [];
                var pageGroupsById = {};
                angular.forEach(scope.nav.navData.units,function(u){
                    var u_ = addUnit(u);
                    angular.forEach(u.pages,function(p){
                        addPageGroupIfNotExists(u_,p);
                        addPageIfNecessary(u_,p);
                        if(isCurrentPage(p)){
                            scope.currentPageGroupId = p.header_id
                        }
                    })
                });

                scope.units = units;

                function addUnit(u){
                    var u_ = angular.extend({pageGroups : []},u);
                    units.push(u_);
                    return u_;
                }
                function addPageGroupIfNotExists(u,p){
                    if(p.header_id==0 && !pageGroupsById[p.id]){
                        pageGroupsById[p.id]=angular.extend({pages:[]},p);
                        u.pageGroups.push(pageGroupsById[p.id])
                    }
                }
                function addPageIfNecessary(u,p){
                    if(p.layout!='header'){
                        var pagegroupId = p.header_id==0? p.id : p.header_id;
                        preparePage(p)
                        pageGroupsById[pagegroupId].pages.push(p);

                    }
                }
            }
            function preparePage(p){
                p.checked=addCheckMark(p)
                p.active =  isCurrentPage(p)
            }
            function addCheckMark(p){
                return p.isSubmitted || p.isGraded || (p.number_of_attempts > 0) || (p.is_gradeable==0 && p.isViewed)
            }
            function isCurrentPage(p){
                return p.id == self.currentId
            }
            function getContentId(){
                return scope.$stateParams.contentId || scope.$stateParams.vocabId || scope.$stateParams.quizId;
            }

            function submittingIsNeeded(page){

                return page.allow_video_post == '1' ||
                    page.allow_text_post == '1' ||
                    page.is_gradeable_post == '1' ||
                    page.is_gradeable_post == '1'  ||
                    page.layout.indexOf('quiz')>=0 ||
                    page.layout.indexOf('survey')>=0

            }
            init();

            scope.$watch('nav.navData',function(){setTimeout(init,200)},true);

        }
    }
}])
}(angular));