var ScrollLoader = function(className,loadFn,properties){
    var elem;

    elem = $(className);
    this.lastLoadedIndex = 1;

    properties = Object.assign({itemHeight:10},properties);


    this.loadFn = loadFn;
    this.loading = false;
    this.isEnd = false;

    this.elemHeight = function(){
        return elem.height();
    };
    this.shouldLoadMore = function(){
        return !this.loading && !this.isEnd && elem[0].scrollHeight - elem.scrollTop() - elem.outerHeight() < properties.itemHeight
    };
    this.load = function(mult,options){
        mult = mult || 1;
        options = options || {term:this.lastTerm};
        var callback = options.callback;
        delete options.callback;
        this.loading = true;
        var self = this;
        this.shouldRefresh = options.shouldRefresh || false;
        if(this.shouldRefresh)
            this.lastLoadedIndex = 1;
        this.lastTerm = options.term;

        this.loadFn(_.extend({limit:_calculateLimit() * mult,startIndex:this.lastLoadedIndex},options),function(result){
            self.shouldRefresh = false;
            self.loading = false;
            self.lastLoadedIndex += result.length;
            self.isEnd = result.length === 0;
            callback && callback();
        });

    };
    function _calculateLimit(){
        var elemHeight, itemHeight;
        elemHeight = elem.height();
        itemHeight = properties.itemHeight;
        return Math.max(10,Math.round(elemHeight/itemHeight));
    }
    this.onScroll = function(){
        if(this.shouldLoadMore())
            this.load()
    };

    this.destroy = function(){
        elem.off('scroll');
    };
    elem.scroll(this.onScroll.bind(this));

};
appControllers.controller('AnnouncementsController',['$scope','$modal','$sce','Announcements','Alerts','Nav',
    function($scope,$modal,$sce,Announcements,Alerts,Nav){
        $scope.open=open;
        $scope.remove = remove;
        $scope.isViewed = isViewed;
        $scope.showButtons = showButtons;
        $scope.showViewedButton = showViewedButton;
        $scope.toggleViewed = toggleViewed;

        $scope.trustAsHtml = trustAsHtml;
        $scope.$watch('user',userChanged);
        $scope.nav = Nav;
        $scope.searchTerm = ''

        function trustAsHtml(html){
            return $sce.trustAsHtml(html);
        }
        var scrollLoader;
        function userChanged(user){
            if(user && !($scope.$root.announcements || $scope.$root.class_announcements)){
                scrollLoader = new ScrollLoader('.panel-announcements .body',getAnnouncements.bind(null,user.org.id),{itemHeight:80})
                scrollLoader.load();
            }
        }
        $scope.expand = function($event){
            $event.stopPropagation()
            $scope.announcementExpanded = !$scope.announcementExpanded;
            setTimeout(function(){

                scrollLoader.onScroll({term:$scope.searchTerm});
            })
        };
        var searchTimeout;
        $scope.changedSearchTerm = function($event){
            $event.preventDefault();$event.stopPropagation()
            $scope.searching = true;
            scrollLoader.load(null,{term:$scope.searchTerm,shouldRefresh:true,callback:function(){
                $scope.searching = false;
            }})
        };
        function getAnnouncements(org,params,callback){
            params = params || {}
            var me = $scope.$root.user;
            $scope.loadingAnnouncements = true;
            if(me.is_super_admin
                || me.is_organization_admin
                || me.is_teacher
                || me.is_edit_teacher
            )
                Announcements.query(Object.assign({orgid:org},params),function(result){
                    if(scrollLoader.lastLoadedIndex === 1 || scrollLoader.shouldRefresh)
                        $scope.announcements = result;
                    else{
                        $scope.announcements = $scope.announcements.concat(result);
                    }
                    $scope.loadingAnnouncements = false;

                    setTimeout(function(){$scope.$apply();callback && callback(result);})
                });
            else
                Announcements.general({orgid:org},function(result){
                    $scope.announcements = result;
                    $scope.loadingAnnouncements = false;
                    setTimeout(function(){$scope.$apply()})
                });


        }
        $scope.highlightSearch = function(text){
            if($scope.searchTerm)
                return text.replace(new RegExp('(?<!<[^>]*)' + $scope.searchTerm, 'ig'),function(a,b){
                    return "<span style=\"background: yellow;color:red\">" + a + "</span>"
                })
            return text;
        }

        function remove(announcement){
            Alerts.warning({
                title:'Delete announcement',
                content:'Are you sure you want to delete this announcement?',
                textOk:'Ok',
                textCancel:'Cancel'
            },function(){
                var announc = {
                    orgid:announcement.orgid,
                    id:announcement.id
                }
                Announcements.remove(announc,function(){
                    for(var i = 0;i<$scope.announcements.length;i++){
                        if($scope.announcements[i].id==announcement.id){
                            $scope.announcements.splice(i,1);
                            break;
                        }
                    }
                });
            });

        }
        function showButtons(announcement){
            var user = $scope.$root.user;
            if(!user) return;
            if(announcement && !announcement.class_name){
                return user.is_super_admin || user.is_organization_admin
            }
            return user.is_super_admin || user.is_organization_admin || user.is_teacher;
        }

        function open (announcement,$event) {
            $event.stopPropagation();
            //For now we are marking all messages as read when an user opens the modal
            var modalInstance = $modal.open({
                templateUrl: '/public/views/splash/announcement-modal.html',
                controller: 'AnnouncementModalController',
                windowClass: 'announcement-modal-window',
                size:'lg',
                resolve:{
                    announcement: function(){
                        return angular.copy(announcement);
                    }
                }

            });
            $scope.$root.$emit('stopDigest');
            modalInstance.result.then(announcementChanged,function(){
                $scope.$root.$emit('resumeDigest');
            });
        }
        function toggleViewed(announcement){
            Announcements.viewed(
                {
                    orgid:announcement.orgid,
                    id:announcement.id
                }
            );
            announcement.isViewed=!announcement.isViewed;
        }
        function showViewedButton(){
            return $scope.nav.navData && $scope.nav.navData.isStudent
        }
        function isViewed(announcement){
            if($scope.nav.navData && $scope.nav.navData.isStudent)
                return announcement.isViewed?1:0
        }
        function announcementChanged(result){
            $scope.$root.$emit('resumeDigest');
            if(result){
                scrollLoader.lastLoadedIndex = 1;
                scrollLoader.load(null,{term:$scope.searchTerm});
            }
        }
    }
]);
appControllers.controller('AnnouncementModalController', ['$scope','$modalInstance','Course','Announcements','announcement','$modal',
    function($scope,$modalInstance,Course,Announcements,announcement,$modal){
        $scope.cancel = cancel;
        $scope.ok = ok;

        $scope.openModal = openModal;


        $scope.msgError="";

        $scope.ckeditorOptions={
            toolbar:'simple',
            disableNativeSpellChecker : false
        }


        if(!announcement)
            getClasses();

        $scope.announcement = announcement||{orgid:$scope.$root.user.org.id};


        $scope.announcement.mode='custom';
        if($scope.announcement.expiration_date){
            $scope.announcement.addExpirationDate=true;
        }
        if($scope.announcement.start_date){
            $scope.announcement.addStartDate=true;
        }

        if($scope.announcement.id && $scope.announcement.classid){
            loadStudents()
        }

        $scope.classes=[];
        $scope.action = announcement?'Edit':'Create New';



        function getClasses(){
            Course.getTaught({
                userId:'me',
                asTeacher:true,
                includeStudents:true

            },function(res){
                $scope.classes=_.filter(res.courses,function(c){return c.students.length});
            });
        }

        function cancel(){
            $modalInstance.dismiss('cancel');
        }
        function ok(){
            $scope.msgError=""
            if($scope.announcement.text==""){
                $scope.msgError="The announcement must not be empty"
            }
            if(!$scope.announcement.addStartDate){
                $scope.announcement.start_date = null;
            }
            validate().then(function(){
                if ($scope.announcement.id){
                    if(!$scope.announcement.students.selectAllStudents){
                        $scope.announcement.studentIds = prepareStudentIds($scope.announcement);
                        $scope.announcement.students = prepareStudents($scope.announcement);
                        $scope.announcement.studentCount = $scope.announcement.students.length;
                    }

                    Announcements.update($scope.announcement,function(){close(true)},handleError);
                }

                else Announcements.save(prepareMode(),function(){close(true)},handleError);
            },handleError);
        }

        function handleError(error){
            error = error || {};
            $scope.msgError=error.msgError || "Sorry, an error has occured. If you are a teacher, make sure you" +
                " selected a valid" +
            " class"
        }
        function updateVideoInfo(response){
            if(!$scope.announcement.text) $scope.announcement.text = '';
            $scope.announcement.text+='<p><video controls="" style="height:240px; width:320px"><source src="'+response.videoFile+'" type="video/mp4" />Your browser does not support the HTML5 video tag.</video></p><p>&nbsp;</p>'

        }
        function validate(){
            return new Promise(function(resolve,reject){
                if(!$scope.announcement.id && $scope.announcement.addStartDate && !$scope.announcement.start_date){
                    return reject({msgError:'Please, enter a valid start date'})
                }
                if(!$scope.announcement.id && $scope.announcement.addStartDate && moment($scope.announcement.start_date).format('YYYYMMDD') < moment().format('YYYYMMDD')){
                    return reject({msgError:'Start date can not be before today'})
                }
                if(!$scope.announcement.id && $scope.announcement.addExpirationDate && !$scope.announcement.expiration_date){
                    return reject({msgError:'Please, enter a valid expiration date'})
                }
                if(!$scope.announcement.text)
                    return reject({msgError:'Please, enter a valid text for the announcement'})
                resolve();
            })
        }
        function prepareMode(){
            if($scope.announcement.mode==='custom'){
                $scope.announcement.classes = _.chain($scope.classes)
                    .filter({selected:true})
                    .map(function(c){
                        var ids = prepareStudentIds(c)
                        if(ids.length && ids.length != c.students.length){
                            return {
                                id:c.class_id,
                                studentIds: ids
                            }
                        }
                        return c.class_id
                    })
                    .value()
            }
            return $scope.announcement;
        }
        function prepareStudentIds(class_){

            return _.chain(class_.students)
                .filter({selected:true})
                .map(function(s){return s.id})
                .value()
        }
        function prepareStudents(class_){
            return _.chain(class_.students)
                .filter({selected:true})
                .value()
        }
        function loadStudents(){
            $scope.announcement.loadingStudents = true
            Announcements.students({orgid:0,id:$scope.announcement.id}).$promise.then(function(res) {
                $scope.announcement.loadingStudents = false;
                if (res.allSelected)
                    res.students.map(function (c) {
                        c.selected = res.allSelected;
                    })
                $scope.announcement.students = res.students;
                $scope.announcement.students.selectAllStudents = res.allSelected;
            })

        }
        function openModal(type,params){
            var types = {
                'record-video': {
                    controller: 'RecordVideoModalController',
                    size: 'md',
                    view: '/public/views/partials/record-video-modal.html',
                    callback:updateVideoInfo
                }

            };
            var instance = $modal.open({
                templateUrl: types[type].view,
                controller: types[type].controller,
                size: types[type].size,
                resolve: {
                    params: function () {
                        return params;
                    }
                }
            });
            instance.result.then(types[type].callback)
        }

        function close(res){
            $modalInstance.close(res);
        }
        $scope.minDate = moment().add(1,'day').toDate()
        $scope.startTime = moment().hours(0).minutes(0).seconds(0)
        $scope.endTime = moment().hours(23).minutes(59).seconds(0)

    }
]);
appControllers.directive('announcementDatepicker',[function(){
    return {
        require: "?ngModel",
        restrict:'E',
        scope: {
            ngDisabled: '=?',
            minDate:'=?',
            startTime:'=?',
            startDate:'=?'
        },
        templateUrl:'/public/views/directives/splash-page/announcement-datepicker.html?v='+window.currentJsVersion,
        link:function(scope,el,attrs,ngModel){
            if (!ngModel) return;

            ngModel.$render = function(){
                scope.value = ngModel.$modelValue?moment(ngModel.$modelValue).format('YYYY-MM-DD'):moment(scope.startDate || moment()).format('YYYY-MM-DD');

                scope.mytime = moment(ngModel.$modelValue || scope.startTime ).toDate();
                if(!ngModel.$modelValue)
                    scope.changed();
            };
            scope.changed = function(){

                var date = moment(scope.value).format('YYYY-MM-DD');
                var time = moment(scope.mytime).format('HH:mm:ss');
                ngModel.$setViewValue(date + ' ' + time);
            };
            scope.openDatePicker = openDatePicker;
            function openDatePicker($event){
                if(scope.ngDisabled) return;
                $event.preventDefault();
                $event.stopPropagation();
                scope.datepickerOpened = true;
            }
            scope.format = 'dd-MMM-yyyy';
            scope.dateOptions = {
                formatYear: 'yy',
                startingDay: 1
            };
            scope.minDate = scope.minDate || moment().toDate();

        }
    }
}]).directive('announcementsStudentClassSelector',[function(){
    return {
        restrict: 'E',
        templateUrl:'announcement-student-class-selector.html',
        scope:{
            classes:'=?'
        },
        link:function(scope){
            scope.selectAllChanged = function(flag){
                scope.classes.map(function(c){
                    c.selected = flag;
                })
            };

            scope.startEditing = function(class_){
                if(class_.editStudents){
                    return collapse(class_);
                }
                class_.editStudents = true;
                if(!class_.selectedCount){
                    class_.selectAllStudents = true;
                    scope.selectAllStudentsChanged(class_,true);
                }
            }
            function collapse(class_){
                var count = 0;
                class_.editStudents = false;
                class_.students.map(function(c){
                    if(c.selected) count++;
                })
                class_.selectedCount = count;
                class_.editStudents = false;
            };
            scope.selectAllStudentsChanged = function(class_,flag){
                class_.students.map(function(c){
                    c.selected = flag;
                })
            }
        }
    }
}]).directive('announcementsStudentSelector',[function(){
    return {
        restrict: 'E',
        templateUrl:'announcement-student-selector.html',
        scope:{
            students:'=?'

        },
        link:function(scope){
            scope.selectAllChanged = function(flag){
                scope.students.map(function(s){
                    s.selected = flag;
                })
            };
        }
    }
}]);