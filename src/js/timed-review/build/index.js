(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/jared/clone/meglms/public/app/converse/controllers/conversation.js":[function(require,module,exports){

module.exports = function ($scope) {
}


},{}],"/home/jared/clone/meglms/public/app/converse/controllers/list-conversations.js":[function(require,module,exports){

module.exports = function ($scope, conversations) {
  $scope.loading = true;
  conversations.then(function (conversations) {
    $scope.conversations = conversations
  })
  debugger;
}


},{}],"/home/jared/clone/meglms/public/app/converse/data/conversations.json":[function(require,module,exports){
module.exports=[
    {
        "title": "First Conversation",
        "dialog": [
            {
                "prompt": "Hello, what is your name?",
                "answers": [
                    "My name is {*|Joseph}."
                ]
            },
            {
                "prompt": "How old are you?",
                "answers": [
                    "I am {number} years old."
                ]
            },
            {
                "prompt": "How many brothers and sisters do you have?",
                "answers": [
                    "I have {number} [brothers and sisters | siblings].",
                    "I have {number} brothers [and {number} sisters].",
                    "I have {number} sisters [and {number} sisters]."
                ]
            },
            {
                "prompt": "Who do you work for?",
                "answers": [
                    "I work [for|at] {*|Apple}."
                ]
            },
            {
                "prompt": "What do you do in your job?",
                "answers": [
                    "I {*}."
                ]
            }
        ]
    }
]
},{}],"/home/jared/clone/meglms/public/app/converse/index.js":[function(require,module,exports){

var SimpleDirective = require('./lib/simple-directive')

function iPromised($q, data) {
  var p = $q.defer()
  p.resolve(data)
  return p.promise
}

var app = angular.module('converse', ['ui.router'])
  // TODO make this talk to a backend endpoint
  .service('getConversations', function ($q) {
    return function () {
      return iPromised($q, require('./data/conversations.json'))
    }
  })
  .service('getConversation', function ($q) {
    return function (id) {
      return iPromised($q, require('./data/conversations.json')[id])
    }
  })

  /*
  .controller('MainPage', ['$scope', function ($scope) {
    console.log('hi');
  }])

  .directive('mainPage', SimpleDirective('MainPage', require('./views/main-page.html')))
  */

  .config(function($stateProvider, $urlRouterProvider) {
    //
    // For any unmatched url, redirect to /state1
    $urlRouterProvider.otherwise("/conversations/list");

    // Now set up the states
    $stateProvider
      .state('conversations', {
        url: "/conversations",
        templateUrl: "views/conversations.html",
        controller: function () {
          debugger;
        },
      })
      .state('list', {
        url: "/conversations/list",
        templateUrl: "views/conversations.list.html",
        controller: require('./controllers/list-conversations'),
        resolve: {
          conversations: function (getConversations) {
            return getConversations()
          },
        },
      })
      .state('conversations.play', {
        url: '/conversations/{id:int}',
        templateUrl: 'views/conversation.html',
        controller: require('./controllers/conversation'),
        resolve: {
          conversation: function (getConversation, $stateParams) {
            return getConversation($stateParams.id)
          },
        },
      })
    });


},{"./controllers/conversation":"/home/jared/clone/meglms/public/app/converse/controllers/conversation.js","./controllers/list-conversations":"/home/jared/clone/meglms/public/app/converse/controllers/list-conversations.js","./data/conversations.json":"/home/jared/clone/meglms/public/app/converse/data/conversations.json","./lib/simple-directive":"/home/jared/clone/meglms/public/app/converse/lib/simple-directive.js"}],"/home/jared/clone/meglms/public/app/converse/lib/simple-directive.js":[function(require,module,exports){

module.exports = function (controller, template) {
  return ['$compile', function SimpleDirective($compile) {
    return {
      scope: {},
      template: template,
      controller: controller,
    }
  }]
}


},{}]},{},["/home/jared/clone/meglms/public/app/converse/index.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy5udm0vdjAuMTAuMzMvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiY29udHJvbGxlcnMvY29udmVyc2F0aW9uLmpzIiwiY29udHJvbGxlcnMvbGlzdC1jb252ZXJzYXRpb25zLmpzIiwiZGF0YS9jb252ZXJzYXRpb25zLmpzb24iLCJpbmRleC5qcyIsImxpYi9zaW1wbGUtZGlyZWN0aXZlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkc2NvcGUpIHtcbn1cblxuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgkc2NvcGUsIGNvbnZlcnNhdGlvbnMpIHtcbiAgJHNjb3BlLmxvYWRpbmcgPSB0cnVlO1xuICBjb252ZXJzYXRpb25zLnRoZW4oZnVuY3Rpb24gKGNvbnZlcnNhdGlvbnMpIHtcbiAgICAkc2NvcGUuY29udmVyc2F0aW9ucyA9IGNvbnZlcnNhdGlvbnNcbiAgfSlcbiAgZGVidWdnZXI7XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzPVtcbiAgICB7XG4gICAgICAgIFwidGl0bGVcIjogXCJGaXJzdCBDb252ZXJzYXRpb25cIixcbiAgICAgICAgXCJkaWFsb2dcIjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwicHJvbXB0XCI6IFwiSGVsbG8sIHdoYXQgaXMgeW91ciBuYW1lP1wiLFxuICAgICAgICAgICAgICAgIFwiYW5zd2Vyc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiTXkgbmFtZSBpcyB7KnxKb3NlcGh9LlwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInByb21wdFwiOiBcIkhvdyBvbGQgYXJlIHlvdT9cIixcbiAgICAgICAgICAgICAgICBcImFuc3dlcnNcIjogW1xuICAgICAgICAgICAgICAgICAgICBcIkkgYW0ge251bWJlcn0geWVhcnMgb2xkLlwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInByb21wdFwiOiBcIkhvdyBtYW55IGJyb3RoZXJzIGFuZCBzaXN0ZXJzIGRvIHlvdSBoYXZlP1wiLFxuICAgICAgICAgICAgICAgIFwiYW5zd2Vyc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiSSBoYXZlIHtudW1iZXJ9IFticm90aGVycyBhbmQgc2lzdGVycyB8IHNpYmxpbmdzXS5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJJIGhhdmUge251bWJlcn0gYnJvdGhlcnMgW2FuZCB7bnVtYmVyfSBzaXN0ZXJzXS5cIixcbiAgICAgICAgICAgICAgICAgICAgXCJJIGhhdmUge251bWJlcn0gc2lzdGVycyBbYW5kIHtudW1iZXJ9IHNpc3RlcnNdLlwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInByb21wdFwiOiBcIldobyBkbyB5b3Ugd29yayBmb3I/XCIsXG4gICAgICAgICAgICAgICAgXCJhbnN3ZXJzXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJJIHdvcmsgW2ZvcnxhdF0geyp8QXBwbGV9LlwiXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcInByb21wdFwiOiBcIldoYXQgZG8geW91IGRvIGluIHlvdXIgam9iP1wiLFxuICAgICAgICAgICAgICAgIFwiYW5zd2Vyc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIFwiSSB7Kn0uXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICB9XG5dIiwiXG52YXIgU2ltcGxlRGlyZWN0aXZlID0gcmVxdWlyZSgnLi9saWIvc2ltcGxlLWRpcmVjdGl2ZScpXG5cbmZ1bmN0aW9uIGlQcm9taXNlZCgkcSwgZGF0YSkge1xuICB2YXIgcCA9ICRxLmRlZmVyKClcbiAgcC5yZXNvbHZlKGRhdGEpXG4gIHJldHVybiBwLnByb21pc2Vcbn1cblxudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdjb252ZXJzZScsIFsndWkucm91dGVyJ10pXG4gIC8vIFRPRE8gbWFrZSB0aGlzIHRhbGsgdG8gYSBiYWNrZW5kIGVuZHBvaW50XG4gIC5zZXJ2aWNlKCdnZXRDb252ZXJzYXRpb25zJywgZnVuY3Rpb24gKCRxKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBpUHJvbWlzZWQoJHEsIHJlcXVpcmUoJy4vZGF0YS9jb252ZXJzYXRpb25zLmpzb24nKSlcbiAgICB9XG4gIH0pXG4gIC5zZXJ2aWNlKCdnZXRDb252ZXJzYXRpb24nLCBmdW5jdGlvbiAoJHEpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGlkKSB7XG4gICAgICByZXR1cm4gaVByb21pc2VkKCRxLCByZXF1aXJlKCcuL2RhdGEvY29udmVyc2F0aW9ucy5qc29uJylbaWRdKVxuICAgIH1cbiAgfSlcblxuICAvKlxuICAuY29udHJvbGxlcignTWFpblBhZ2UnLCBbJyRzY29wZScsIGZ1bmN0aW9uICgkc2NvcGUpIHtcbiAgICBjb25zb2xlLmxvZygnaGknKTtcbiAgfV0pXG5cbiAgLmRpcmVjdGl2ZSgnbWFpblBhZ2UnLCBTaW1wbGVEaXJlY3RpdmUoJ01haW5QYWdlJywgcmVxdWlyZSgnLi92aWV3cy9tYWluLXBhZ2UuaHRtbCcpKSlcbiAgKi9cblxuICAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAvL1xuICAgIC8vIEZvciBhbnkgdW5tYXRjaGVkIHVybCwgcmVkaXJlY3QgdG8gL3N0YXRlMVxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoXCIvY29udmVyc2F0aW9ucy9saXN0XCIpO1xuXG4gICAgLy8gTm93IHNldCB1cCB0aGUgc3RhdGVzXG4gICAgJHN0YXRlUHJvdmlkZXJcbiAgICAgIC5zdGF0ZSgnY29udmVyc2F0aW9ucycsIHtcbiAgICAgICAgdXJsOiBcIi9jb252ZXJzYXRpb25zXCIsXG4gICAgICAgIHRlbXBsYXRlVXJsOiBcInZpZXdzL2NvbnZlcnNhdGlvbnMuaHRtbFwiLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgZGVidWdnZXI7XG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICAgLnN0YXRlKCdsaXN0Jywge1xuICAgICAgICB1cmw6IFwiL2NvbnZlcnNhdGlvbnMvbGlzdFwiLFxuICAgICAgICB0ZW1wbGF0ZVVybDogXCJ2aWV3cy9jb252ZXJzYXRpb25zLmxpc3QuaHRtbFwiLFxuICAgICAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL2xpc3QtY29udmVyc2F0aW9ucycpLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgY29udmVyc2F0aW9uczogZnVuY3Rpb24gKGdldENvbnZlcnNhdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRDb252ZXJzYXRpb25zKClcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICAgIC5zdGF0ZSgnY29udmVyc2F0aW9ucy5wbGF5Jywge1xuICAgICAgICB1cmw6ICcvY29udmVyc2F0aW9ucy97aWQ6aW50fScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAndmlld3MvY29udmVyc2F0aW9uLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiByZXF1aXJlKCcuL2NvbnRyb2xsZXJzL2NvbnZlcnNhdGlvbicpLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgY29udmVyc2F0aW9uOiBmdW5jdGlvbiAoZ2V0Q29udmVyc2F0aW9uLCAkc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRDb252ZXJzYXRpb24oJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgIH0pO1xuXG4iLCJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRyb2xsZXIsIHRlbXBsYXRlKSB7XG4gIHJldHVybiBbJyRjb21waWxlJywgZnVuY3Rpb24gU2ltcGxlRGlyZWN0aXZlKCRjb21waWxlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNjb3BlOiB7fSxcbiAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgIGNvbnRyb2xsZXI6IGNvbnRyb2xsZXIsXG4gICAgfVxuICB9XVxufVxuXG4iXX0=
