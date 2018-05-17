
try {
    var appServices = angular.module('app.testbank.service');
}
catch(err) {
    var appServices = angular.module('app.services');
}
appServices.factory('Email', ['$resource',
    function ($resource) {
        return $resource('/email/:userId', {}, {
            query: {
                method: 'GET',
            },
            userclasses:{
                url: '/email/userclasses/'
            },
            sendEmail:{
                url: '/email/send-email/',
                method: 'POST'
            },
            getSentEmails:{
                url: '/email/sent-emails/',
                method: 'POST'
            },
            getReceivedEmails:{
                url: '/email/received-emails/',
                method: 'POST'
            },
            getFeedbackEmails:{
                url: '/email/feedback-emails/',
                method: 'POST'
            }
            ,
            getAllEmails:{
                url: '/email/all-emails/',
                method: 'POST'
            }
            ,

            getNewEmailsCount:{
                url: '/email/new-emails/',
                method: 'POST'
            },
            markAsRead:{
                url: '/email/mark-as-read/',
                method: 'POST'
            },
            markFeedbackAsViewed:{
                url: '/email/mark-feedback-as-viewed/',
                method: 'POST'
            }
            ,
            markTeacherFeedbackAsViewed:{
                url: '/email/mark-teacher-feedback-as-viewed/',
                method: 'POST'
            }
            ,
            markQuizFeedbackAsViewed:{
                url: '/email/mark-quiz-feedback-as-viewed/',
                method: 'POST'
            },
            markForumFeedbackAsViewed:{
                url: '/email/mark-forum-feedback-as-viewed/',
                method: 'POST'
            },
            markStudentFeedbackAsViewed:{
                url: '/email/mark-student-feedback-as-viewed/',
                method: 'POST'
            }

        });
    }
]);