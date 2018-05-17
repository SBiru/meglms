

function addCustomCssForHost(){
    var domains = [{url:'myedkey.org','cssClass':'edkey'}];
    angular.forEach(domains,function(domain){
        if(window.location.host == domain.url){
            angular.element('body').addClass(domain.cssClass);
        }
    })

}
angular.element( document ).ready(function() {
    addCustomCssForHost();
});


