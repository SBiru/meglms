'use strict';
//required angular, jQuery
(function(angular,$){
    var fabric;
    var LASTID = 0;
    angular.module('ngFabric',['ui.bootstrap','ngResource']).value('FABRIC_EXTENSIONS',[
        {
            url:"/public/js/directives/app_fabric/extensions/textarea.class.js",
            loaded:false
        },
        {
            url:"/public/js/directives/app_fabric/extensions/linearrow.class.js",
            loaded:false
        },
        {
            url:"/public/js/directives/app_fabric/extensions/util.Matrix.js",
            loaded:false
        },
        {
            url:"/public/js/directives/app_fabric/extensions/util.Guid.js",
            loaded:false
        }])
        .value('fabricAppConfig',{})
        .value('canvasInstances',{})
        .factory('FabricSharedInitializer',['FABRIC_EXTENSIONS','$rootScope','canvasInstances','fabricAppConfig',function(FABRIC_EXTENSIONS,$rootScope,canvasInstances,appConfig){
            return {
                init: function(success,el){
                    if(!appConfig.loaded){
                        $.getScript('/public/lib/fabric.js',loadExtensions)
                        appConfig.loaded = true;
                    }
                    else{
                        init();
                    }
                    function init(){
                        var canvasEl;
                        if(el){
                            canvasEl = el.find('canvas')[0];
                        }
                        var instanceId = ++LASTID;

                        canvasInstances[instanceId] = {
                            canvas:new window.fabric.Canvas(canvasEl || 'c',{ width: 800, height: 400 }),
                            config:{}
                        };
                        canvasInstances[instanceId].canvas.lowerCanvasEl.id = 'canvas_'+instanceId;
                        $rootScope.$emit('FABRIC_CANVAS_READY',instanceId);
                        if(success)
                            success(canvasInstances[instanceId],instanceId);
                    }

                    function loadExtensions(){
                        if(FABRIC_EXTENSIONS.length==0){
                            return init();
                        }
                        _.each(FABRIC_EXTENSIONS,function(e){
                            $.getScript(e.url,function(){
                                e.loaded = true;
                                checkLoadedAll()
                            });
                        })

                    }
                    function checkLoadedAll(){
                        for(var i =0;i<FABRIC_EXTENSIONS.length;i++){
                            if(!FABRIC_EXTENSIONS[i].loaded)
                                return;
                        }
                        init();
                    }
                }
            }

        }])
        .directive('fabricEditor',['FabricSharedInitializer','canvasInstances','fabricFileActions','fabricCanvasActions','fabricMenus','$modal',function(initializer,instances,fabricFileActions,fabricCanvasActions,fabricMenus,$modal){
        return{
            restrict:'A',
            template:'<div class="wrapper"><fabric-top-nav instance-id="instanceId"></fabric-top-nav ><fabric-nav instance-id="instanceId"></fabric-nav><fabric-content instance-id="instanceId"></fabric-content></div>',
            scope:{
                templateId:'=?',
                config:'=?'
            },
            link:function(scope,el,attrs){

                setTimeout(function(){initializer.init(function(canvas,id){
                    scope.instanceId = id;
                    instances[id].info = {};
                    instances[id].config = _.extend({},scope.config);
                    instances[id].properties = {};
                    if(scope.templateId){
                        fabricFileActions.getActionsFor(id).open(scope.templateId,function(){
                            if(scope.config.useStudentFilter){
                                instances[id].info.id = null;
                            }
                            scope.$root.saveFile = function(callBack){
                                $modal.open(
                                    _.extend({'windowClass':'modal-flat template-menu-modal'},fabricMenus['save'])
                                ).result.then(function(){
                                    if(callBack){
                                        callBack(instances[id])
                                    }
                                });
                            }
                        });
                    }

                    setTimeout(function(){scope.$apply()})
                })});
                scope.$on("$destroy",function(){
                    fabricCanvasActions.dispose(scope.instanceId)
                })
            }
        }

    }])

}(angular,jQuery))

'use strict';
(function(angular,$){

    angular.module('ngFabric').factory('FabricActions',[
        'fabricCanvasActions',
        'fabricObjectActions',
        'fabricFileActions',
        'fabricToolsActions',
        function(Canvas,Objects,File,Tools){
            var Actions = function(id){
                this.objects = Objects.getActionsFor(id);
                this.file = File.getActionsFor(id);
                this.canvasAction = Canvas.getActionsFor(id);
                this.tools = Tools.getActionsFor(id);
                return this;
            }
            return {
                getActionsFor: function(id){ return new Actions(id)}
            }

    }])


}(angular,jQuery))

'use strict';
(function(angular){

    angular.module('ngFabric').directive('fabricContent',['FabricActions','canvasInstances','fabricCanvasActions',function(FabricActions,instances,fabricCanvasActions){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-content.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope,el){
                var canvas = el.find('canvas');
                var isCanvasLoaded = false;
                canvas.attr('width',el.parent().outerWidth()+'px');
                canvas.attr('height',el.parent().outerHeight()+'px');
                scope.$root.$on('FABRIC_CANVAS_READY',canvasLoaded)

                function canvasLoaded(event,id){
                    var actions = FabricActions.getActionsFor(id);
                    scope.instanceId = id
                    isCanvasLoaded = true;
                    instances[id].canvas.on('object:moving', function (e) {
                        var obj = e.target;
                        // if object is too big ignore
                        if(obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width){
                            return;
                        }
                        obj.setCoords();
                        // top-left  corner
                        if(obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0){
                            obj.top = Math.max(obj.top, obj.top-obj.getBoundingRect().top);
                            obj.left = Math.max(obj.left, obj.left-obj.getBoundingRect().left);
                        }
                        // bot-right corner
                        if(obj.getBoundingRect().top+obj.getBoundingRect().height  > obj.canvas.height || obj.getBoundingRect().left+obj.getBoundingRect().width  > obj.canvas.width){
                            obj.top = Math.min(obj.top, obj.canvas.height-obj.getBoundingRect().height+obj.top-obj.getBoundingRect().top);
                            obj.left = Math.min(obj.left, obj.canvas.width-obj.getBoundingRect().width+obj.left-obj.getBoundingRect().left);
                        }
                    });
                    angular.element(window).keydown(actions.canvasAction.keydown.bind(actions.canvasAction));
                    angular.element(window).keyup(actions.canvasAction.keyup.bind(actions.canvasAction));

                }

                function outputsize() {
                    if(!isCanvasLoaded)
                        return;
                    var wd = rex.offsetWidth-20;
                    var ht= rex.offsetHeight-20
                    var action=FabricActions.getActionsFor(scope.instanceId);
                    action.canvasAction.resize(wd, ht);
                }
               outputsize();
                new ResizeObserver(outputsize).observe(rex);
            }
        }

    }])
}(angular))

'use strict';
(function(angular){

    angular.module('ngFabric').directive('fabricPreviewer',['FabricSharedInitializer','FabricActions','canvasInstances','fabricCanvasActions',function(initializer,FabricActions,canvasInstances,fabricCanvasActions){
        return{
            restrict:'E',
            scope:{
                previewId:'=',
                loadedCallback:'=?',
            },
            templateUrl:'/public/views/directives/app_fabric/fabric-content.html?v=' + window.currentJsVersion,
            link:function(scope,el){
                function initPreviewer(canvas,id){
                    if(!scope.previewId) return;

                    if (typeof canvas != 'object'){

                        if(scope.instanceId && scope.instanceId != id) fabricCanvasActions.dispose(scope.instanceId);
                        scope.instanceId = id || scope.instanceId;
                        initializer.init(initPreviewer,el);
                        return;
                    }
                    scope.instanceId = id || scope.instanceId;
                    var actions = FabricActions.getActionsFor(id);

                    actions.file.open(scope.previewId,function(){
                        setTimeout(function(){actions.canvasAction.disableControls()})
                        if(scope.loadedCallback)
                            setTimeout(function(){scope.loadedCallback()});
                    });
                    scaleToParentSize();
                }
                function scaleToParentSize(){

                }
                var unWatchId = scope.$watch('previewId',function(){
                    initPreviewer()
                });

                scope.$on('$destroy',cleanUp)

                function cleanUp(){
                    unWatchId();
                    fabricCanvasActions.dispose(scope.instanceId);

                }


            }
        }

    }])
}(angular))

'use strict';
(function(angular){

    angular.module('ngFabric').controller('FabricNewPost',['$scope','templateId','FabricTemplatesApi',function($scope,templateId,api){
        $scope.saveFile = null;
        $scope.templateId = templateId;
        $scope.submit = $scope.$close
        $scope.ready = false;
        api.getProperties({id:$scope.templateId}).$promise.then(function(properties){
            if(properties && properties.studentCanEdit){
                $scope.allowEditor=true;
            }
            $scope.ready = true;
        });

    }]).directive('fabricNewPost',['Alerts',function(Alerts){
        return {
            restrict:'A',
            link:function(scope,el){
                var originalContent = JSON.stringify(getTextareaContent());
                scope.ok = function(){
                    if(scope.allowEditor){
                        scope.$root.saveFile(function(res){
                            scope.submit({templateContent:getTextareaContent(),id:res.info.id});
                        })
                    }else{
                        scope.submit({templateContent:getTextareaContent()});
                    }
                }
                function getTextareaContent(){
                    var templateContent = {}
                    _.each(el.find('textarea'),function(textarea){
                        templateContent[textarea.id] = textarea.value;
                    })
                    return templateContent;
                }

                scope.cancel = function(){
                    if(originalContent !==  JSON.stringify(getTextareaContent())){
                        Alerts.warning({
                            title:'Unsaved changes',
                            content:'You have unsaved changes. Are you sure you want to close this window?',
                            textOk:'Ok',
                            textCancel:'Cancel'
                        },function(){
                            scope.$dismiss();
                        });
                    }else
                    scope.$dismiss();
                }
            }
        }
    }])
}(angular))

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

'use strict';
(function(angular){
    angular.module('ngFabric').value('fabricMenus',{}).directive('fabricTopNav',['fabricMenus','$modal','canvasInstances',function(fabricMenus,$modal,instances){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-top-nav.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.openMenu = function(menu){
                    var menuOptions = fabricMenus[menu];
                    if(!menuOptions) return;
                    $modal.open(_.extend({
                        'windowClass':'modal-flat template-menu-modal'
                    },menuOptions))
                }
                scope.$watch('instanceId',function(id){
                    if(id)
                        scope.instance = instances[scope.instanceId];
                })
                scope.canSave = function(){
                    if(scope.instance && scope.instance.config.onlyOwnerCanSave){
                        return scope.instance.info.created_by == scope.$root.user.id
                    }
                    return true;
                }

            }
        }

    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbar',['canvasInstances',function(instances){
        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/fabric-toolbar.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                var AVAILABLE_TOOLS = {
                    stroke:'fabric-toolbar-stroke',
                    font:'fabric-toolbar-font',
                    background:'fabric-toolbar-background',
                    'stroke-shape':'fabric-toolbar-stroke-shape',
                    'drawing':'fabric-toolbar-drawing'
                }

                scope.hideToolbar = true;

                scope.addAttrAndCompile = function(attr,$event){
                    var el = angular.element($event.target);
                    el.attr(attr, '');
                    $compile(el)(scope);
                };

                function enableToolbar(event){
                    var object = event.target
                    scope.hideToolbar = false;
                    if(!object.tools){
                        return;
                    }
                    scope.tools = null;
                    setTimeout(function(){scope.$apply()})
                    setTimeout(function(){
                        scope.tools = _.filter(AVAILABLE_TOOLS,function(v,tool){
                            return object.tools.indexOf(tool)>=0;
                        })
                        setTimeout(function(){scope.$apply()})
                    })
                }
                function disableToolbar(){
                    if(!instances[scope.instanceId].canvas.isDrawingMode){scope.hideToolbar = true;}
                    //scope.hideToolbar = true;
                    setTimeout(function(){scope.$apply()})
                }


                scope.$watch('config.canvas',function(){
                    if(scope.config && scope.config.canvas && scope.config.canvas.on){
                        instances[scope.instanceId].canvas.on('object:selected',enableToolbar)
                        instances[scope.instanceId].canvas.on('selection:cleared',disableToolbar)
                    }
                })
                scope.$watch('instanceId',function(id){
                    if(id)
                        scope.config = instances[scope.instanceId];
                })
                scope.$on('destroy',cleanUp)
                function cleanUp(){

                }

            }
        }

    }]).directive('fabricTool',['$compile',function($compile){
        return{
            restrict:'A',
            scope:{
                fabricTool:'=?',
                instanceId:'='
            },
            link:function(scope,el,attrs){
                el.append($compile('<div '+scope.fabricTool+' instance-id="instanceId"></div>')(scope));

            }
        }
    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuCanvasSize',['FabricActions','fabricMenus','canvasInstances',function(FabricActions,fabricMenus,instances){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'canvas_size';
                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/image/canvas-size.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){

                        var actions = FabricActions.getActionsFor(scope.instanceId),
                            canvas = instances[scope.instanceId].canvas

                        $scope.width = canvas.width
                        $scope.height = canvas.height
                        $scope.ok = function(){
                            if(!($scope.width == canvas.width && $scope.height == canvas.height)){
                               document.getElementById('rex').style.width = (parseInt($scope.width)+20)+'px';
                                document.getElementById('rex').style.height =(parseInt($scope.height)+20)+'px';
                                actions.canvasAction.resize($scope.width,$scope.height);
                            }
                            return $instance.dismiss();
                        }
                    }]
                }
            }
        }

    }])
}(angular))
'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuSetBackgroundImg',['fabricObjectActions','canvasInstances',function(fabricObjectActions,instances){

        return{
            restrict:'E',
            templateUrl:'/public/views/directives/app_fabric/menus/image/set-background.html',
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
                                    fabricObjectActions.getActionsFor(scope.instanceId).addBckground(data,size.width,size.height);
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
'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuSave',['FabricActions','canvasInstances','fabricMenus','fabricMenuSaveShared',function(FabricActions,instances,fabricMenus,shared){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'save';

                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/saveas.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        var actions = FabricActions.getActionsFor(scope.instanceId);
                        if(instances[scope.instanceId].info && instances[scope.instanceId].info.id){
                            actions.file.save();
                            setTimeout($scope.$close);
                        }
                        $scope.instanceId = scope.instanceId
                        shared.extend($scope);

                    }]
                }
            }
        }

    }]).factory('fabricMenuSaveShared',['canvasInstances','Class','FabricActions',function(instances,Class,FabricActions){
        return {
            extend: function($scope){
                var actions = FabricActions.getActionsFor($scope.instanceId);
                instances[$scope.instanceId].info = instances[$scope.instanceId].info || {}
                $scope.file = instances[$scope.instanceId].info;
                $scope.classes  = Class.query({
                        as:instances[$scope.instanceId].config.useStudentFilter?'student':'edit-teacher'
                    },function(classes){
                        $scope.classes = classes;
                    },function(error){
                        $scope.error = error.error;
                    }
                )
                $scope.save = function(){
                    actions.file.save(function(){
                        $scope.$close()
                    });
                }
            }
        }
    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuSaveas',['FabricActions','canvasInstances','fabricMenus','fabricMenuSaveShared','CurrentCourseId',function(FabricActions,instances,fabricMenus,shared,CurrentCourseId){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'saveas';
                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/saveas.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        if(instances[scope.instanceId].info && instances[scope.instanceId].info.id){
                            instances[scope.instanceId].info.id=undefined;
                        }
                        instances[scope.instanceId].info.classId = CurrentCourseId.data.class_id || CurrentCourseId.data.classId
                        $scope.instanceId = scope.instanceId
                        shared.extend($scope);
                    }]
                }
            }
        }

    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuOpen',['FabricActions','fabricMenus','fabricMenuOpenShared','canvasInstances','CurrentCourseId',function(FabricActions,fabricMenus,shared,canvasInstances,CurrentCourseId){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'open';

                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/open.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        var actions = FabricActions.getActionsFor(scope.instanceId);
                        $scope.selected = {}
                        $scope.filter = [{id:'class',value:CurrentCourseId.data.classId || CurrentCourseId.data.class_id}];
                        $scope.instanceId = scope.instanceId
                        $scope.config = canvasInstances[scope.instanceId];
                        $scope.useStudentFilter = $scope.config.config.useStudentFilter
                        shared.extend($scope);
                        $scope.open = function(){
                            actions.file.open($scope.selected.row);
                            $instance.dismiss();
                        }
                    }]
                }
            }
        }

    }]).factory('fabricMenuOpenShared',['fabricFileActions','FabricTemplatesApi','$filter','Alerts',function(fabricFileActions,api,$filter,Alerts){
        return {
            extend: function($scope){
                $scope.sort = {
                    by:'name',
                    reverse:false
                }
                function loadTemplates(filter){
                    filter = filter || $scope.filter;

                    if(!filter.length) return;
                    $scope.loading = true;
                    $scope.filter = filter;
                    fabricFileActions.loadAll({
                        filter:JSON.stringify(filter),
                        isPrivate:$scope.useStudentFilter
                    },function(templates){
                        $scope.loading = false;
                        $scope.templates = templates;
                        $scope.filteredTemplates = $scope.templates;
                        updateSortedTemplates($scope.sort)
                    })
                }
                $scope.edit = function(id,$event){
                    $event.stopPropagation()
                    $scope.selected.tab='edit'
                    $scope.selected.row=id
                }
                $scope.clone = function(id,$event){
                    $event.stopPropagation()
                    api.clone({id:id}).$promise.then(function(){
                        loadTemplates();
                    });
                }
                $scope.remove = function(id,$event){
                    $event.stopPropagation()
                    Alerts.warning({
                        title:'Delete template',
                        content:'Are you sure you want to delete this template',
                        textOk:'Ok',
                        textCancel:'Cancel'
                    },function(){
                        api.delete({id:id}).$promise.then(function(){
                            loadTemplates();
                        });
                    });


                }
                $scope.setSortBy = function(id){
                    if($scope.sort.by==id)
                        $scope.sort.reverse = !$scope.sort.reverse;
                    else{
                        $scope.sort.by = id;
                    }
                }

                $scope.$watch('sort', updateSortedTemplates,true)
                function updateSortedTemplates(sort){
                    if(!sort) return;
                    $scope.filteredTemplates = $filter('orderBy')($scope.filteredTemplates,sort.by,sort.reverse)
                }

                $scope.$watch('selected.filter',function(filter){
                    if(!filter)
                        $scope.filteredTemplates = $scope.templates;
                    else
                        $scope.filteredTemplates = $filter('filter')($scope.templates,filter);
                })

                $scope.onChangeFilter = loadTemplates;

                $scope.pagConfig = {showOnTop:false,showOnBottom:true,itemsPerPage:10};
            }
        }
    }]).directive('sortArrowIndicator',function(){
        return {
            restrict:'E',
            template:'<span class="fa" ng-class="arrowClass" ng-if="showArrow"></span>',
            scope:{
                sort:'=',
                sortId:'='
            },
            link:function(scope){
                scope.$watch('sort',function(){
                    if(!scope.sort){
                        scope.showArrow = false;
                        return;
                    }
                    if(scope.sort.by==scope.sortId){
                        scope.showArrow = true;
                        scope.arrowClass = scope.sort.reverse?'fa-long-arrow-down':'fa-long-arrow-up'
                        return;
                    }
                    scope.showArrow = false;
                },true)
            }
        }
    })
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricMenuProperties',['canvasInstances','fabricMenus',function(instances,fabricMenus){

        return{
            restrict:'A',
            link:function(scope){
                scope.menu = 'properties';
                fabricMenus[scope.menu] = {
                    templateUrl:'/public/views/directives/app_fabric/menus/file/properties.html?v='+window.currentJsVersion,
                    controller:['$modalInstance','$scope',function($instance,$scope){
                        instances[scope.instanceId].properties = instances[scope.instanceId].properties || {
                                studentCanEdit:false
                            }
                        $scope.instanceId = scope.instanceId
                        $scope.properties = _.clone(instances[scope.instanceId].properties);
                        $scope.save = function(){
                            instances[scope.instanceId].properties = _.extend({},instances[scope.instanceId].properties,$scope.properties);
                            $instance.dismiss()
                        }
                    }]
                }
            }
        }

    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarStroke',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/stroke.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.changeWidth = function(newWidth){
                    newWidth = parseFloat(newWidth);
                    if(_.isNaN(newWidth) || newWidth<0){
                        newWidth = 0
                        scope.width = newWidth;
                    }
                    fabricToolsActions.getActionsFor(scope.instanceId).setStrokeWidth(newWidth);
                }
                scope.changeColor = fabricToolsActions.getActionsFor(scope.instanceId).setStroke;
                if(instances[scope.instanceId].canvas._activeObject){
                    scope.width = instances[scope.instanceId].canvas._activeObject.getStrokeWidth();
                    scope.color = instances[scope.instanceId].canvas._activeObject.getStroke();
                }

            }
        }

    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarDrawing',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/drawing.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.changeBrushSize = function(newWidth){
                    newWidth = parseFloat(newWidth);
                    if(_.isNaN(newWidth) || newWidth<0){
                        newWidth = 0
                        scope.width = newWidth;
                    }
                    instances[scope.instanceId].canvas.freeDrawingBrush.width=newWidth;
                    fabricToolsActions.getActionsFor(scope.instanceId).setStrokeWidth(newWidth);
                }
                 scope.changeBrushColor = function(newColor){
                    if(!instances[scope.instanceId].canvas.isDrawingMode){
                        scope.changeBrushColor =fabricToolsActions.getActionsFor(scope.instanceId).setStroke;
                    }
                     instances[scope.instanceId].canvas.freeDrawingBrush.color=newColor;
                }

                if(instances[scope.instanceId].canvas._activeObject){
                    scope.width = instances[scope.instanceId].canvas._activeObject.getStrokeWidth();
                    scope.color = instances[scope.instanceId].canvas._activeObject.getStroke();
                }
            }
        }

    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarFont',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/font.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                var actions = fabricToolsActions.getActionsFor(scope.instanceId)
                scope.AVAILABLE_FONTS = AvailableFonts();
                scope.changeFontFamily = actions.setFontFamily;
                scope.changeFontSize = actions.setFontSize;
                scope.changeColor = actions.setColor;

                if(instances[scope.instanceId].canvas._activeObject){
                    scope.fontFamily = instances[scope.instanceId].canvas._activeObject.getFontFamily();
                    scope.fontSize = instances[scope.instanceId].canvas._activeObject.getFontSize();
                    scope.fontWeigth = instances[scope.instanceId].canvas._activeObject.getFontWeight();
                    scope.fontColor = instances[scope.instanceId].canvas._activeObject.getColor();
                }

            }
        }

        function AvailableFonts(){
            return [
                'Arial, Arial, Helvetica, sans-serif',
                'Arial Black, Arial Black, Gadget, sans-serif',
                'Comic Sans MS, Comic Sans MS5, cursive',
                'Courier New, Courier New, Courier6, monospace',
                'Georgia1, Georgia, serif',
                'Impact, Impact5, Charcoal6, sans-serif',
                'Lucida Console, Monaco5, monospace',
                'Lucida Sans Unicode, Lucida Grande, sans-serif',
                'Palatino Linotype, Book Antiqua3, Palatino6, serif',
                'Tahoma, Geneva, sans-serif',
                'Times New Roman, Times, serif',
                'Trebuchet MS1, Helvetica, sans-serif',
                'Verdana, Verdana, Geneva, sans-serif',
                'Symbol, Symbol (Symbol2, Symbol2)',
                'Webdings, Webdings (Webdings2, Webdings2)',
                'Wingdings, Zapf Dingbats (Wingdings2, Zapf Dingbats2)',
                'MS Sans Serif4, Geneva, sans-serif',
                'MS Serif4, New York6, serif',
            ]
        }
    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarBackground',['canvasInstances','fabricToolsActions',function(instances,actions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/background.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                scope.changeColor = actions.getActionsFor(scope.instanceId).setFill;

                if(instances[scope.instanceId].canvas._activeObject){
                    scope.fillColor = instances[scope.instanceId].canvas._activeObject.getFill();
                }

            }
        }

    }])
}(angular))

'use strict';
(function(angular){
    angular.module('ngFabric').directive('fabricToolbarStrokeShape',['canvasInstances','fabricToolsActions',function(instances,fabricToolsActions){
        return{
            restrict:'A',
            templateUrl:'/public/views/directives/app_fabric/tools/strokeShape.html?v=' + window.currentJsVersion,
            scope:{
                instanceId:'='
            },
            link:function(scope){
                var SHAPES = {
                    'full':null,
                    'dotted':[1,1],
                    'dashed-1':[3,3],
                    'dashed-2':[5,5],
                    'dashed-3':[7,7]
                }
                scope.availableShapes = SHAPES;
                scope.changeShape = function(shape){
                    fabricToolsActions.getActionsFor(scope.instanceId).strokeDashArray(shape);
                }
                scope.changeColor = fabricToolsActions.getActionsFor(scope.instanceId).setStroke;
                if(instances[scope.instanceId].canvas._activeObject){
                    var dashArray = instances[scope.instanceId].canvas._activeObject.strokeDashArray;
                    scope.shape = dashArray;
                }

            }
        }

    }])
}(angular))

'use strict';
(function(angular,$){
        angular.module('ngFabric').factory('fabricObjectActions',['canvasInstances',function(instances){
        var TOOLS = {
            textarea:['background','stroke','font'],
            circle:['background','stroke','stroke-shape'],
            rect:['background','stroke','stroke-shape'],
            'i-text':['font'],
            'lineArrow':['stroke'],
            'triangle':['stroke','background','stroke-shape'],
            'line':['drawing']
        }
        
        function ObjectActions(id){
            var temp=null;
            return{
                addTools:function(obj){
                    obj.tools = TOOLS[obj.type];
                },
                addCircle: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.Circle({radius: 20,left:10,right:10,fill:'transparent',strokeWidth:1,stroke:'#000'});
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    instances[id].canvas.setActiveObject(obj);
                },
                addRect: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.Rect({width:50,height:50,left:10,right:10,fill:'transparent',strokeWidth:1,stroke:'#000'});
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    instances[id].canvas.setActiveObject(obj);
                },
                addTextbox: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.Textarea({width:50,height:50,fill:'transparent',left:10,top:50});
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    instances[id].canvas.setActiveObject(obj);
                },
                addText: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.IText('Text',{left:300,top:300});
                    this.addTools(obj);
                    obj.getColor = obj.getFill;
                    instances[id].canvas.add(obj);
                    instances[id].canvas.setActiveObject(obj);
                },
                addArrow: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.LineArrow([10,10,10,110]);
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    instances[id].canvas.setActiveObject(obj);
                },
                addLine: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.Line([10,10,10,110],{
                        stroke:'rgb(0,0,0)',
                        strokeWidth:1
                    });
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    window.debugLine = obj;
                    instances[id].canvas.setActiveObject(obj);
                },
                addTriangle: function(){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    var obj = new fabric.Triangle({
                        fill:'transparent',
                        stroke:'rgb(0,0,0)',
                        top: 50,
                        left: 50,
                        height: 50,
                        width: 50,
                        originX: 'center',
                        originY: 'center',
                    });
                    this.addTools(obj);
                    instances[id].canvas.add(obj);
                    instances[id].canvas.setActiveObject(obj);
                },
                 addPencil: function(){
                     if(!instances[id].canvas.isDrawingMode){
                         var obj = new fabric.Line([0,0,0,0]);
                         this.addTools(obj);
                         instances[id].canvas.add(obj);
                         instances[id].canvas.setActiveObject(obj);
                     }
                     instances[id].canvas.isDrawingMode = !instances[id].canvas.isDrawingMode;
                     temp=instances[id];
                },
                addImage: function(data,w,h){
                    if(temp&&temp.canvas.isDrawingMode)
                    {
                        temp.canvas.isDrawingMode=false;
                    }
                    w = w || 100;
                    h = h || 100;
                    var canvas = instances[id].canvas;
                    fabric.Image.fromURL(data, function (img) {
                        var oImg = img.set({left: 0, top: 0, angle: 0,width:w, height:h});
                        canvas.add(oImg).renderAll();
                        var a = canvas.setActiveObject(oImg);
                        canvas.toDataURL({format: 'png', quality: 0.8});
                    });
                },
                addBckground: function(data,w,h){
                    w = w || 100;
                    h = h || 100;
                    var canvas = instances[id].canvas;
                    var image = new Image();
                    image.onload = function() {
                        canvas.setBackgroundImage(data, canvas.renderAll.bind(canvas), {
                           width:w,
                           height:h
                        });

                    };
                    image.src = data;
                }
            }            
        }
        return {
            getActionsFor: function(id){return new ObjectActions(id)}
        }


    }])
}(angular,jQuery))

'use strict';
(function(angular,$){
    angular.module('ngFabric').factory('fabricCanvasActions',['fabricObjectActions','canvasInstances',function(fabricObjectActions,canvasInstances){

        var CanvasActions =  function(id){
            var ctrlDown = false,
                objectActions = fabricObjectActions.getActionsFor(id),
                _this = this;
            this.id = id;
            function selectedObject(){
                return canvasInstances[_this.id].canvas._activeObject || canvasInstances[_this.id].canvas._activeGroup
            }
            function deleteObject(object){
                if(['INPUT','TEXTAREA'].indexOf(document.activeElement.tagName)>=0) return;

                if(object){
                    return object.remove();
                }
                if(canvasInstances[_this.id].canvas._activeObject)
                    return deleteObject(canvasInstances[_this.id].canvas._activeObject);
                if(canvasInstances[_this.id].canvas._activeGroup){
                    var group = canvasInstances[_this.id].canvas._activeGroup._objects
                    _.each(group,deleteObject);
                }
            }
            function copyToFakeClipboard(){
                canvasInstances[_this.id].canvas.fakeClipboard = selectedObject().toObject();
            }
            function paste(){
                var obj = canvasInstances[_this.id].canvas.fakeClipboard;
                window.fabric.util.enlivenObjects([obj],function(objects){
                    objects.forEach(function(o) {

                        if(o.type=='group'){
                            var newGroup = new window.fabric.Group()
                            o.forEachObject(function(object){
                                var center = o.getCenterPoint();
                                pasteOne(object,center);
                            })
                        }else{
                            canvasInstances[_this.id].canvas.setActiveObject(pasteOne(o))
                        }
                    });
                })
                canvasInstances[_this.id].canvas.renderAll();
            }
            function pasteOne(obj,center){
                o = window.fabric.util.object.clone(obj);
                if(obj.type=='textarea'){
                    setTimeout(o._initRemovedHandler.bind(o))
                    setTimeout(o._createTextarea.bind(o))
                }


                o.left = center?center.x + o.left  + 5:o.left  + 5
                o.top = center?center.x + o.top  + 5:o.top  + 5
                objectActions.addTools(o);
                canvasInstances[_this.id].canvas.add(o);
                return o
            }
            function findActiveCanvas(){
                var canvases = $(document.activeElement).find('.lower-canvas'),
                    canvasId
                if(canvases.length){
                    canvasId = canvases[0].id.replace('canvas_','');
                }
                return canvasId;
            }
            return {
                disableControls: function(){
                    canvasInstances[id].canvas.selection = false;
                    canvasInstances[id].canvas.forEachObject(function(o) {
                        o.selectable = false;
                    });
                },
                resize: function (w, h) {
                    //alert();
                    var canvas = canvasInstances[id].canvas;
                    var container = $(canvas.wrapperEl),
                        upper = $(canvas.upperCanvasEl),
                        lower = $(canvas.lowerCanvasEl)

                    container.css('width', w);
                    container.css('height', h);
                    upper.attr('width', w);
                    upper.attr('height', h);
                    lower.attr('width', w);
                    lower.attr('height', h);

                    canvasInstances[id].canvas.setWidth(w);
                    canvasInstances[id].canvas.setHeight(h);
                    canvasInstances[id].canvas.calcOffset();
                },
                scaleTo: function (w, h) {
                    var canvas = canvasInstances[id].canvas;
                    var container = $(canvas.wrapperEl),
                        lower = $(canvas.lowerCanvasEl)

                    container.css('width', w);
                    container.css('height', h);
                    lower.attr('width', w);
                    lower.attr('height', h);
                },
                keydown: function (event,_id) {
                    _this.id = findActiveCanvas();
                    switch (event.keyCode) {
                        case 17: //ctrl
                        case 91: //cmd
                            ctrlDown = true;
                            break;
                        case 46: //delete
                        case 8: //backspace / delete
                            deleteObject();
                            break;
                        case 67: // c
                            if(ctrlDown && selectedObject()) copyToFakeClipboard();
                            break;
                        case 86: // v
                            if(ctrlDown && canvasInstances[id].canvas.fakeClipboard) paste();
                            break;
                        default:
                            return;
                    }
                },
                keyup:function(event){
                    _this.id = findActiveCanvas();
                    switch (event.keyCode) {
                        case 17: //ctrl
                        case 91: //cmd
                            ctrlDown = false;
                            break
                        default:
                            return;
                    }
                },

            };
        }
        return {
            getActionsFor: function(id){
                return new CanvasActions(id);
            },
            dispose:function (id){
                var instance = canvasInstances[id];
                if(!instance) return;
                var canvas = canvasInstances[id].canvas;
                var canvasEl = $(canvas.lowerCanvasEl).detach();
                $(canvas.upperCanvasEl).remove();
                $(canvas.wrapperEl).parent().append(canvasEl)
                $(canvas.wrapperEl).find('textarea').remove();
                $(canvas.wrapperEl).remove();
                if (canvas)
                    canvas.clear();
                canvas = null;
                delete canvasInstances[id];
            }
        }

    }])
}(angular,jQuery))

'use strict';
(function(angular,$){
    angular.module('ngFabric').factory('fabricFileActions',['fabricCanvasActions','fabricObjectActions','FabricTemplatesApi','canvasInstances',function(fabricCanvasActions,fabricObjectActions,api,canvasInstances){
        function handleError (error,callBackError){
            if(error.data.showToUser){
                toastr.error(error.data.error)
            }else{
                toastr.error('Something went wrong');
            }
            if(callBackError)
                callBackError(error);
        }
        var FileActions = function(id){


            return{
                open: function(templateId,callback){
                    var canvasActions = fabricCanvasActions.getActionsFor(id),
                        objectActions = fabricObjectActions.getActionsFor(id)
                    api.get({id:templateId}).$promise.then(function(fileData){
                        if(fileData.size){
                            document.getElementById('rex').style.width = (parseInt(fileData.size.width)+20)+'px';
                            document.getElementById('rex').style.height =(parseInt(fileData.size.height)+20)+'px';
                            canvasActions.resize(fileData.size.width,fileData.size.height);
                        }

                        canvasInstances[id].info = fileData.info;
                        canvasInstances[id].properties = fileData.properties;
                        delete fileData.size;
                        delete fileData.properties;
                        delete fileData.info;
                        canvasInstances[id].canvas.loadFromDatalessJSON(JSON.parse(JSON.stringify(fileData)));
                        canvasInstances[id].canvas.getObjects().forEach(function(o){
                            objectActions.addTools(o);
                        })
                        setTimeout(function(){canvasInstances[id].canvas.renderAll();})
                        if(callback)
                            callback();

                    },handleError)
                },
                save: function(then){
                    var datalessJson = canvasInstances[id].canvas.toDatalessJSON();
                    datalessJson.size = {width:canvasInstances[id].canvas.getWidth(),height:canvasInstances[id].canvas.getHeight()};
                    datalessJson.properties = canvasInstances[id].properties
                    var options = _.extend({},
                        canvasInstances[id].info,
                        {canvasJson:datalessJson}
                    );
                    options.is_private = canvasInstances[id].config.useStudentFilter;
                    if(!options.classid){
                        toastr.error('Please, select a valid classid')
                        throw 'Class id is required';
                    }

                    api.save(options).$promise.then(function(res){
                        if(res.id){
                            canvasInstances[id].info.id=res.id
                        }
                        toastr.success('Saved','',{timeOut:1000})
                        if(then) then();
                    },handleError)
                }

            }
        }
        return {
            getActionsFor: function(id){return new FileActions(id)},
            loadAll: function(filter,then){
                api.query(filter).$promise.then(then,handleError);
            }

        }

    }])
}(angular,jQuery))

'use strict';
(function(angular,$){
    angular.module('ngFabric').factory('fabricToolsActions',['canvasInstances',function(instances){
        var ToolsActions = function(id){
            function checkAndSetProperty(property,value,isFunc){
                var object = instances[id].canvas._activeObject;
                if(!object) return;
                if(isFunc)
                    object[property](value);
                else
                    object[property] = value;
                instances[id].canvas.renderAll();
            }

            var DEFAULT_ACTIONS = ['setStrokeWidth','setStroke','setFontFamily','setFontSize','setFill','setColor',{prop:'strokeDashArray',isFunc:false}];
            function createDefaultHandlers(){
                var handlers = {};
                DEFAULT_ACTIONS.forEach(function(action){
                    if(typeof action == 'object')
                        handlers[action.prop]= function(value){checkAndSetProperty(action.prop,value,action.isFunc);}
                    else
                        handlers[action]= function(value){checkAndSetProperty(action,value,true);}
                })
                return handlers
            }
            return _.extend({},createDefaultHandlers());

        }
        return {
            getActionsFor: function(id){ return new ToolsActions(id)}
        }
        
    }])
}(angular,jQuery))

'use strict';
(function(angular){
    angular.module('ngFabric').service('FabricTemplatesApi',['$resource',function($resource){
        var rootUrl = '/api/canvas-templates';
        return $resource(rootUrl,{id:'@id'},{
            'get':{
                url:rootUrl+'/:id'
            },
            'getProperties':{
                url:rootUrl+'/:id/properties'
            },
            'clone':{
                url:rootUrl+'/:id/clone',
                method:'POST'
            },
            'delete':{
                url:rootUrl+'/:id',
                method:'DELETE'
            }

        });

    }])
}(angular))
