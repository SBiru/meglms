angular.module('app')
    .directive('addQuestion', [
        'QuestionBank',
        function(QuestionBank){
        return {
            restrict: 'E',
            require: "?ngModel",
            scope:{
                'banks':'=?',
                'courseId':'=?',
                'orgId':'=?',
                'options':'=?',
            },
            templateUrl:'/public/views/directives/testbank/add-question.html',
            link:function(scope,element,attrs,ngModel){

                scope.current={
                    type:'selectQuestions'
                };
                if(!scope.banks) getBanks();
                scope.orgId=scope.orgId || (scope.courseId?0:scope.$root.user.org.id)

                scope.setQuestions=setQuestions;
                scope.cancel=cancel;



                scope.$watch('current.bankId',getBank)
                scope.$watch('current.howManyRandoms',function(howMany){
                    if(howMany){
                        scope.bank.randomQuestions = getRandomQuestions((howMany=='all'?undefined:howMany));
                    }
                })

                getBanks();

                function setQuestions(){
                    if(!scope.bank) return cancel();
                    var questions = scope.current.type=='selectQuestions'?scope.bank.questions:scope.bank.randomQuestions;
                    if(!scope.current.isRandom)
                        ngModel.$setViewValue(_.filter(questions,function(q){return q.selected==true}));
                    else{
                        ngModel.$setViewValue([{bankId:scope.current.bankId,isRandom:true}]);
                    }
                }
                function cancel(){
                    ngModel.$setViewValue(false);
                }

                function getBanks(){

                    QuestionBank.getByOrg({
                        id:scope.orgId,
                        courseId:scope.courseId
                    },function(res){
                        if(res.banks)
                            scope.banks = res.banks;
                    },function(error){})
                }
                function getBank(id){
                    if(!id) return;
                    QuestionBank.details(
                        {id:id},
                        function(res){
                            scope.bank = res.bank;
                            scope.bank.questions=res.questions;
                            if(scope.current.type=='randomQuestions'){
                                scope.bank.randomQuestions  = getRandomQuestions(scope.current.howManyRandoms)
                            }
                        },function(error){

                        }
                    )
                }
                function getRandomQuestions(howMany){
                    return _.map(shuffle(scope.bank.questions,howMany),function(q){q.selected=true;return q;});
                }
                function shuffle(array,howMany) {
                    var newArray = [],original = angular.copy(array),randomIndex;

                    howMany = howMany!==undefined?Math.min(array.length,Math.max(howMany,1)):array.length;

                    while(howMany>0){
                        randomIndex=Math.floor(Math.random() * original.length);
                        newArray.push(original[randomIndex]);
                        original.splice(randomIndex,1);
                        howMany--;
                    }

                    return newArray;
                }
            }

        }
}])