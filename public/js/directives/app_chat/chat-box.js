'use strict';
(function(angular,$) {
    angular.module('app').directive('e3ChatBox', ['e3ChatLog', 'E3ChatActions', 'E3ChatApi', 'e3UnreadThreads','E3ChatUsers', function (e3ChatLog, actions, api, e3UnreadThreads,users) {
        return {
            restrict: 'E',
            templateUrl: '/public/views/directives/app_chat/e3-chat-box.html?v='+window.currentJsVersion,
            scope: {
                user: '=?',
                close: '=?'
            },
            link: function (scope, el) {
                if($(window).width() < 768){
                        scope.inputAreaheight = {
                            "height" : " 121px"
                        }
                }
                scope.users = scope.user.users;
                var ws = scope.$root.e3Ws,
                    shiftDown = false,
                    textarea = el.find('textarea'),
                    conversationBox = el.find('.conversation'),
                    myId = scope.$root.user.id,
                    to = scope.users ? 'group' : scope.user.id,
                    fromName = scope.$root.user.fname + ' ' + scope.$root.user.lname,
                    room = actions.buildRoom(myId, to, scope.users),
                    lastRoomMessage = room;
                scope.myId = myId;
                scope.preparedUserName = prepareUserName();
                updateTextAreaPlaceholder()
                function updateTextAreaPlaceholder(){
                    if(scope.user.closed)
                        scope.textAreaPlaceholder ='This conversation was closed by the user';
                    else if(someTeacher() && !isTeacherOnline())
                        scope.textAreaPlaceholder ='Teacher is not online';
                    else
                        scope.textAreaPlaceholder = 'Type your message here';
                }
                function someTeacher(){
                    return users.someTeacher(scope.users || [scope.user]);
                }
                function prepareUserName(){
                    if(scope.users && scope.users.length){
                        var userNames = _.map(angular.copy(scope.users),function(u){return fullName(u)});
                        return userNames.join(', ');
                    }else{
                        return fullName(scope.user)
                    }

                }
                function fullName(user){
                    return user.firstName + ' ' + user.lastName;
                }

                loadLog();
                checkAndProcessUnreadMessages()

                function loadLog() {
                    if (e3ChatLog[room]) {
                        return scope.log = e3ChatLog[room];
                    } else {
                        scope.loadingLog = true;
                        api.loadLog({room: room}).$promise.then(function (log) {
                            scope.loadingLog = false;
                            e3ChatLog[room] = log;
                            scope.log = e3ChatLog[room];
                        })
                    }

                }

                function checkAndProcessUnreadMessages() {
                    if (e3UnreadThreads.unreadThreads[room]) {
                        actions.sendMessageHasBeenRead(room);
                    }
                    e3UnreadThreads.removeRoom(room);
                }

                scope.addUser = function(user){
                    scope.users = scope.users || [scope.user];
                    scope.users.push(user);
                    scope.log.push({isInfo:true,message:fullName(user) + ' was added to the chat.'})
                    scope.showAddUser = false;
                }

                textarea[0].addEventListener('keydown', onKeydown);
                textarea[0].addEventListener('keyup', onKeyup);

                function onKeydown($event) {
                    if ($event.keyCode == 16) //shift
                        shiftDown = true;
                    if ($event.keyCode == 13 && !shiftDown) { //shift
                        sendMessage();
                        $event.stopPropagation()
                    }
                }

                function onKeyup($event) {
                    if ($event.keyCode == 16) //shift
                        shiftDown = false;
                }

                function sendMessage() {
                    if (!textarea.val()) return;
                    var msg = textarea.val(),
                        message = {
                            event: 'message',
                            data: {
                                from: myId,
                                to: to,
                                message: msg,
                                room: room,
                                fromFullName:fromName
                            }
                        }
                    actions.sendMessage(message);
                    e3ChatLog[room].push(message.data);
                    if(lastRoomMessage && lastRoomMessage != room && scope.users){
                        users.addNewGroup(scope.users);
                    }
                    lastRoomMessage = room;
                    actions.updateScope();
                    setTimeout(function () {
                        textarea.val(null)
                    });
                }


                function scrollConversationBox() {
                    setTimeout(function () {
                        conversationBox[0].scrollTop = conversationBox[0].scrollHeight
                    })
                }

                function prepareLog(log) {
                    var days = {};
                    log = _.sortBy(log, 'created');
                    log.forEach(function (msg) {
                        var day = moment(msg.created).format("LL");
                        days[day] = days[day] || {messages:[],day:day,datetime:msg.created}
                        msg.sentAt = formatTime(msg.created)
                        days[day].messages.push(msg);
                    })
                    scope.logGroupedByDays = _.map(days,function(d){return d});
                }
                scope.isStudent = function(){
                    return !scope.$root.user.is_teacher
                };
                scope.canType = function(){
                    return !scope.user.closed && (!someTeacher() || isTeacherOnline())
                };
                function isTeacherOnline(){
                    return scope.$root.user.is_teacher || users.isGroupTeacherOnline(scope.users || [scope.user])
                }
                function canTalkToStudents(){
                    users.canTalkToStudents(scope.users || [scope.user])
                }
                scope.downloadLog = function(){
                    actions.downloadLog(room)
                }
                scope.toggleConversationStatus = function(){
                    scope.user.closed = !scope.user.closed
                    var message = {
                        event: 'openCloseConversation',
                        data: {
                            room:room,
                            closed:scope.user.closed
                        }
                    }
                    actions.sendMessage(message);
                };
                function formatTime(timestamp) {
                    return moment(timestamp).format("HH:mm")
                }
                var watchClosed = scope.$watch('user.closed',function(){
                    updateTextAreaPlaceholder()
                })
                var watchLog = scope.$watch('log', function (log) {
                    if (log && log.length) {
                        scrollConversationBox();
                        prepareLog(log);
                    }
                }, true)
                var watchUsers = scope.$watch('users', function (users) {
                    if (users && users.length) {
                        to = scope.users ? 'group' : scope.user.id;
                        var newRoom =actions.buildRoom(myId, to, scope.users);
                        if(newRoom != room){
                            e3ChatLog[newRoom] = angular.copy(e3ChatLog[room]);
                            scope.log = e3ChatLog[newRoom]
                            room = newRoom
                        }

                        scope.preparedUserName = prepareUserName();
                    }
                }, true);

                scope.$on('$destroy', cleanUp);
                function cleanUp() {
                    textarea[0].removeEventListener('keydown', onKeydown);
                    textarea[0].removeEventListener('keyup', onKeyup);
                    watchLog();
                    watchUsers();
                    watchClosed();
                }


            }
        }
    }])
}(angular,jQuery));