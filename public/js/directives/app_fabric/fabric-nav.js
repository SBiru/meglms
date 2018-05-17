'use strict';
(function(angular){
    var fabric = window.fabric;
    angular.module('ngFabric').directive('fabricNav',['FabricActions',function(FabricActions){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-nav.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope,el){
                scope.$watch('instanceId',function(id){
                    if(id){
                        _.extend(scope,FabricActions.getActionsFor(scope.instanceId).objects);
                    }

                })

            }
        }

    }]).directive('fabricImgUploader',['fabricObjectActions','canvasInstances',function(fabricObjectActions,instances){
      return{
          restrict:'E',
          templateUrl:'/public/views/directives/app_fabric/menus/imgUploader.html',
          scope:{
              instanceId:'=?'
          },
          link:function(scope,el){
              function init(){
                  listenInputChanges();
              }
              function listenInputChanges(){
                  var input = el.find('input[type="file"]')[0];
                  if(input)
                      input.addEventListener("change", function (e) {
                          var file = e.target.files[0];
                          var reader = new FileReader();
                          reader.onload = function (f) {
                              var data = f.target.result;
                              var image = new Image();
                              image.src = data;

                              image.onload = function() {
                                  var size = checkMaxPermSize(this.width,this.height);
                                  fabricObjectActions.getActionsFor(scope.instanceId).addImage(data,size.width,size.height);
                              };

                          };
                          reader.readAsDataURL(file);
                      });
              }
              function checkMaxPermSize(w,h){
                  var canvas = instances[scope.instanceId].canvas;
                  if(w>canvas.width){
                      var ratio = canvas.width/w;
                      w = w * ratio
                      h = h * ratio
                  }
                  if(h>canvas.height){
                      var ratio = canvas.height/h;
                      w = w * ratio
                      h = h * ratio
                  }
                  return {width:w,height:h}
              }
              scope.$watch('instanceId',function(id){
                  if(id)
                    scope.toggleInput = function(){
                          $(el.find('input[type="file"]')).click();
                    }
              })

              init();
          }
      }
    }])
}(angular))
