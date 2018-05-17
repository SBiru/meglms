(function () {
    var app;
    try {
        app = angular.module('app.testbank');
    }
    catch (err) {
        app = angular.module('app');
    }
    app.factory('WordmatchingUtil',['ReEncodeHtml',function(ReEncodeHtml){
        return {
            prepareForDisplayEditor:function(question){
                question.extraOriginal = question.extra;
                var a = angular.copy(question.extra);
                var b = /(<[^>]*)([^\\|>])(")([^>]*>)/
                var extra = a.replace(b,'$1$2\\"$4'); while(a!=extra){a=extra;extra = a.replace(b,'$1$2\\"$4')}
                extra = angular.fromJson(extra);
                var tmpobject = {}
                for (var key in extra) {
                    tmpobject = extra[key];
                    for (var tmpkey in tmpobject) {
                        tmpobject[tmpkey] = ReEncodeHtml.restoreHTML(tmpobject[tmpkey]);
                    }
                }

                /*Golabs fixing up any doubles in extra for edit start*/
                var newextra = {};
                for (var id in extra) {
                    newextra.target=extra[id].target
                    newextra.matches=extra[id].matches
                    for (var key in extra[id]) {
                        newextra[key] = extra[id][key];
                        if (key === 'tmpanswers') {
                            extra[id] = newextra;
                            newextra = {};
                            break;
                        }
                    }

                }

                question.extra = angular.toJson(extra);
                /*Golabs fixing up any doubles in extra for edit start*/

                question.wordmatchingInputs = [];

                for (var id in extra) {
                    var tmp = {};
                    tmp.id=id;


                    for (var value in extra[id]) {
                        if (['tmpanswers','target','matches'].indexOf(value)>=0) {
                            continue;
                        };
                        extra[id][value] = (extra[id][value] && extra[id][value].replace) ? extra[id][value].replace(/\\/g, '') : extra[id][value];
                        if (typeof tmp.value1 === 'undefined') {
                            tmp.value1 = {}
                            tmp.value1.id = value;
                            tmp.value1.value = extra[id][value];
                            continue;
                        }
                        if (typeof tmp.value2 === 'undefined') {
                            extra[id].matches=extra[id].matches||[tmp.value1.id]
                            tmp.value2 = {}
                            tmp.value2.id = value
                            tmp.value2.matches=extra[id].matches;
                            tmp.value2.value = extra[id][value];
                            continue;
                        }

                        tmp.value3 = {};
                        tmp.value3.id = value;
                        tmp.value3.value = extra[id][value];

                    }
                    question.wordmatchingInputs.push(tmp);
                }
                _.each(question.wordmatchingInputs,function(o){
                    if(o.value2.matches && o.value2.matches.length>1){
                        var groupId = o.value2.matches[0];
                        var lastOption;
                        _.each(o.value2.matches,function(m){
                            var option = _.find(question.wordmatchingInputs,function(f){
                                return f.value1.id==m;
                            })
                            if(option){
                                option.groupId=option.groupId||groupId;
                                option.hideButton=true;
                                lastOption=option;
                            }

                        })
                        if(lastOption)
                            lastOption.hideButton=false;
                    }
                })
            }
        }
    }])
}())