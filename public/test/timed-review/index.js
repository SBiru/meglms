
angular.module('test-timed-review', ['timed-review'])
  .service('getTimedReviewConversation', function ($q) {
    return function (id) {
      var p = $q.defer()
      p.resolve({
        "dialog": [
          {
            "prompt": "Hello, what is your name?", 
            "answer_audio": "myname.wav", 
            "answer_duration": 2.375, 
            "answers": [
              "My name is Stephen."
            ], 
            "prompt_audio": "what-name.wav", 
            "prompt_duration": 2.625
          }, 
          {
            "prompt": "How old are you?", 
            "answer_audio": "myage.wav", 
            "answer_duration": 3.625, 
            "answers": [
              "I am 17 years old."
            ], 
            "prompt_audio": "how-old.wav", 
            "prompt_duration": 1.75
          }, 
          {
            "prompt": "How many brothers and sisters do you have?", 
            "answer_audio": "mysiblings.wav", 
            "answer_duration": 3.5, 
            "answers": [
              "I have 2 brothers and 1 sister."
            ], 
            "prompt_audio": "how-siblings.wav", 
            "prompt_duration": 3.5
          }, 
          {
            "prompt": "Who do you work for?", 
            "answer_audio": "myemployer.wav", 
            "answer_duration": 2.875, 
            "answers": [
              "I work for a school."
            ], 
            "prompt_audio": "who-employer.wav", 
            "prompt_duration": 2.0
          }, 
          {
            "prompt": "What do you do in your job?", 
            "answer_audio": "myjob.wav", 
            "answer_duration": 4.125, 
            "answers": [
              "I teach math to third grade students."
            ], 
            "prompt_audio": "what-job.wav", 
            "prompt_duration": 2.125
          }
        ], 
        "title": "First Conversation"
      })
      return p.promise
    }
  });

