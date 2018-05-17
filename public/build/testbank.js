/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nvar _interopRequire = __webpack_require__(4)[\"default\"];\n\nvar TimedEditor = _interopRequire(__webpack_require__(3\n\n// TODO put full testbank builder logic here.\n));\n\n/*****************\n ** WEBPACK FOOTER\n ** ./run/testbank.js\n ** module id = 0\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./run/testbank.js?");

/***/ },
/* 1 */,
/* 2 */,
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nvar _interopRequire = __webpack_require__(4)[\"default\"];\n\n__webpack_require__(14);\n\nvar timedEditorHTML = _interopRequire(__webpack_require__(16));\n\nvar TimedEditorController = _interopRequire(__webpack_require__(10));\n\n__webpack_require__(11);\n\nangular.module(\"timed-editor\", [\"ui.sortable\"]).directive(\"timedEditor\", function timedEditor() {\n  return {\n    scope: {\n      data: \"=\",\n      onSave: \"=\",\n      onRemove: \"=\" },\n    template: timedEditorHTML,\n    controller: TimedEditorController };\n});\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/index.js\n ** module id = 3\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/index.js?");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nexports[\"default\"] = function (obj) {\n  return obj && obj.__esModule ? obj[\"default\"] : obj;\n};\n\nexports.__esModule = true;\n\n/*****************\n ** WEBPACK FOOTER\n ** ./~/babel-runtime/helpers/interop-require.js\n ** module id = 4\n ** module chunks = 0 1 3 4\n **/\n//# sourceURL=webpack:///./~/babel-runtime/helpers/interop-require.js?");

/***/ },
/* 5 */,
/* 6 */,
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nmodule.exports = TimedEditorController;\n\nfunction TimedEditorController($scope) {\n\n  $scope.saved = false;\n\n  // to fix css transition strangeness\n  setTimeout(function (_) {\n    $scope.tick = true;\n    $scope.$digest();\n  }, 100);\n\n  $scope.sortableOptions = {\n    handle: \".TimedEditor_handle\" };\n\n  $scope.isInvalid = function () {\n    return $scope.data.dialog_json.some(function (item) {\n      return !item.prompt.trim() || !item.answers[0].trim();\n    });\n  };\n\n  $scope.remove = function (index) {\n    $scope.data.dialog_json.splice(index, 1);\n  };\n\n  $scope.addNew = function () {\n    $scope.data.dialog_json.push({\n      prompt: \"\",\n      answers: [\"\"] });\n  };\n\n  $scope.really_remove = false;\n\n  $scope.removeReview = function () {\n    $scope.really_remove = true;\n  };\n\n  $scope.save = function () {\n    $scope.saving = true;\n    $scope.onSave($scope.data, function (_) {\n      console.log(\"done!\");\n      $scope.saving = false;\n      $scope.saved = true;\n      try {\n        $scope.$digest();\n      } catch (e) {}\n      setTimeout(function (_) {\n        $scope.saved = false;\n        try {\n          $scope.$digest();\n        } catch (e) {}\n      }, 1500);\n    });\n  };\n}\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/controller.js\n ** module id = 10\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/controller.js?");

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nvar _interopRequire = __webpack_require__(4)[\"default\"];\n\nvar appMenuTemplate = _interopRequire(__webpack_require__(20));\n\nvar appContentTemplate = _interopRequire(__webpack_require__(21));\n\n__webpack_require__(22);\n\nvar modalTemplate = _interopRequire(__webpack_require__(23));\n\nvar modalController = _interopRequire(__webpack_require__(24));\n\nvar appMenuController = _interopRequire(__webpack_require__(25));\n\nangular.module(\"app.timed-editor\", [\"app.timed-editor.service\", \"ui.router\", \"timed-editor\"]).config([\"$stateProvider\", \"$urlRouterProvider\", function ($stateProvider, $urlRouterProvider) {\n\n  $stateProvider.state(\"timedReviews\", {\n    parent: \"nav.course\", // required to link to the main (top) navigation\n    url: \"timed-review\",\n    views: {\n      \"menu@\": {\n        template: appMenuTemplate,\n        controller: appMenuController },\n      \"content@\": {\n        template: appContentTemplate,\n        controller: [\"$rootScope\", \"$scope\", \"$state\", \"$stateParams\", \"nav\", function ($rootScope, $scope, $state, $stateParams, nav) {\n\n          // give this controller 'a little more scope'\n          $scope.nav = nav;\n          $scope.course = nav.selected_course;\n        }]\n      }\n    }\n  }).state(\"timedReviews.detail\", {\n    url: \":{reviewId:[0-9]{1,11}}\",\n    views: {\n      \"content@\": {\n        template: \"<timed-editor data=\\\"data\\\" on-remove=\\\"onRemove\\\" on-save=\\\"onSave\\\">The Timed Review</timed-editor>\",\n        resolve: {\n          reviewDetails: [\"$stateParams\", \"TimedReviewService\", function ($stateParams, TimedReviewService) {\n            return TimedReviewService.details($stateParams.reviewId);\n          }]\n        },\n        controller: [\"$rootScope\", \"$scope\", \"$state\", \"$stateParams\", \"reviewDetails\", \"nav\", \"TimedReviewService\", \"$sce\", function ($rootScope, $scope, $state, $stateParams, reviewDetails, nav, TimedReviewService, $sce) {\n          $scope.data = reviewDetails.data;\n\n          $scope.onRemove = function () {\n            TimedReviewService[\"delete\"]($scope.data.id).success(function (respose) {\n              var ix = null;\n              nav.data.timedReviews.forEach(function (r, i) {\n                if (r.id === $scope.data.id) ix = i;\n              });\n              if (!ix) return console.warn(\"TimedReview not in nav list\", $scope.data.id);\n              nav.data.timedReviews.splice(ix, 1);\n              $state.go(\"timedReviews\");\n            });\n          };\n\n          $scope.onSave = function (data, done) {\n            TimedReviewService.update($scope.data.id, data).success(function (respose) {\n              done();\n            });\n          };\n        }]\n      }\n    }\n  });\n}]).controller(\"ModalAddTimedReviewController\", function ($scope, $state, $modal, nav, TimedReviewService) {\n\n  $scope.open = function (size) {\n\n    var modalInstance = $modal.open({\n      template: modalTemplate,\n      controller: modalController,\n      size: size,\n      resolve: {}\n    });\n\n    modalInstance.result.then(function (response) {\n      if (!response.id) return;\n\n      nav.data.timedReviews.push(response);\n\n      // change state to the newly created bank\n      $state.go(\"timedReviews.detail\", {\n        reviewId: response.id\n      });\n    }, function (_) {});\n  };\n});\n\n/*\r\ncourse: function() {\r\nreturn nav.selected_course;\r\n}\r\n*/\n/* cancel */\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/app.js\n ** module id = 11\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/app.js?");

/***/ },
/* 12 */,
/* 13 */,
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	eval("// removed by extract-text-webpack-plugin\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/index.less\n ** module id = 14\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/index.less?");

/***/ },
/* 15 */,
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	eval("module.exports = \"<div class=\\\"TimedEditor\\\">\\r\\n    <h1 class=\\\"TimedEditor_title\\\"><input ng-model=\\\"data.title\\\" placeholder=\\\"Title\\\"/></h1>\\r\\n    <textarea ng-model=\\\"data.description\\\"\\r\\n        class=\\\"TimedEditor_description\\\"\\r\\n        placeholder=\\\"Description\\\"></textarea>\\r\\n    <ul ui-sortable=\\\"sortableOptions\\\" ng-model=\\\"data.dialog_json\\\" class=\\\"TimedEditor_dialog\\\">\\r\\n        <li ng-repeat=\\\"item in data.dialog_json\\\">\\r\\n            <span class=\\\"TimedEditor_handle\\\">|||</span>\\r\\n            <input type=\\\"text\\\" ng-model=\\\"item.prompt\\\" placeholder=\\\"Prompt text\\\"/>\\r\\n            <input type=\\\"text\\\" ng-model=\\\"item.answers[0]\\\" placeholder=\\\"Example response\\\"/>\\r\\n            <button ng-click=\\\"remove($index)\\\" class=\\\"TimedEditor_remove\\\">&times;</button>\\r\\n        </li>\\r\\n    </ul>\\r\\n    <div ng-hide=\\\"data.dialog_json.length\\\" class=\\\"TimedEditor_empty\\\">\\r\\n        There are no dialog items for this review.\\r\\n    </div>\\r\\n    <button class=\\\"TimedEditor_btn\\\" ng-click=\\\"addNew()\\\">Add new item</button>\\r\\n    <button class=\\\"TimedEditor_btn\\\" ng-disabled=\\\"isInvalid()\\\" ng-click=\\\"save()\\\">Save</button>\\r\\n    <button class=\\\"TimedEditor_btn\\\" ng-hide=\\\"really_remove\\\" ng-click=\\\"removeReview()\\\">Delete</button>\\r\\n    <button class=\\\"TimedEditor_btn\\\" ng-show=\\\"really_remove\\\" ng-click=\\\"onRemove()\\\">Really delete?</button>\\r\\n    <span ng-class=\\\"{visible: tick, saved: saved, TimedEditor_saver: true}\\\">Saved</span>\\r\\n</div>\\r\\n\\r\\n\"\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/template.html\n ** module id = 16\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/template.html?");

/***/ },
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	eval("module.exports = \"<div ng-show=\\\"$state.includes('timedReviews')\\\" style=\\\"margin-top:.6em\\\">\\r\\n    <ul class=\\\"nav nav-pills nav-stacked\\\" role=\\\"tablist\\\">\\r\\n        <li role=\\\"presentation\\\" ng-controller=\\\"ModalAddTimedReviewController\\\"><a ng-click=\\\"open()\\\"><span class=\\\"glyphicon glyphicon-plus\\\"></span> Add New Timed Review</a></li>\\r\\n        <li role=\\\"presentation\\\" class=\\\"nav-divider\\\"></li>\\r\\n        <li role=\\\"presentation\\\" ><div style=\\\"width:60%;margin: auto\\\"><input style=\\\"width: 100%\\\" type=\\\"text\\\" ng-model=\\\"inputFilter\\\" placeholder=\\\"Search test\\\"></div></li>\\r\\n        <li role=\\\"presentation\\\" class=\\\"nav-divider\\\"></li>\\r\\n        <li role=\\\"presentation\\\" ng-repeat=\\\"item in data.timedReviews | filter:inputFilter\\\" ui-sref-active=\\\"active\\\"><a ui-sref=\\\"timedReviews.detail({reviewId:item.id})\\\">{{item.title}} </a></li>\\r\\n    </ul>\\r\\n</div>\\r\\n\\r\\n\"\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/menu.html\n ** module id = 20\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/menu.html?");

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	eval("module.exports = \"'<p style=\\\"margin-top:4.5em\\\"><span class=\\\"glyphicon glyphicon-arrow-left\\\"></span> To add a new Timed Review use the menu on the left.</p>\\r\\n\"\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/content.html\n ** module id = 21\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/content.html?");

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nangular.module(\"app.timed-editor.service\", [\"ngResource\"]).factory(\"TimedReviewService\", [\"$http\", function ($http) {\n  var url = \"/timed_reviews/\";\n  return {\n    list: function list() {\n      return $http.get(url);\n    },\n    details: function details(id) {\n      return $http.get(url + id);\n    },\n    create: function create(data) {\n      return $http.post(url, data);\n    },\n    \"delete\": function _delete(id, data) {\n      return $http[\"delete\"](url + id);\n    },\n    update: function update(id, data) {\n      return $http.post(url + id, data);\n    } };\n}]);\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/service.js\n ** module id = 22\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/service.js?");

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	eval("module.exports = \"<div class=\\\"modal-header\\\">\\r\\n    <button type=\\\"button\\\" class=\\\"close\\\" ng-click=\\\"cancel()\\\"><span aria-hidden=\\\"true\\\">&times;</span><span class=\\\"sr-only\\\">Close</span></button>\\r\\n    <h4 class=\\\"modal-title\\\">Add New Timed Review</h4>\\r\\n</div>\\r\\n<div class=\\\"modal-body\\\">\\r\\n    <div ng-show=\\\"error\\\" class=\\\"alert alert-danger\\\" role=\\\"alert\\\">{{ error }}</div>\\r\\n    <form role=\\\"form\\\" ng-submit=\\\"create()\\\">\\r\\n        <div class=\\\"form-group\\\">\\r\\n            <label for=\\\"new-objective-name\\\" class=\\\"control-label\\\">Title</label>\\r\\n            <input type=\\\"text\\\" class=\\\"form-control\\\" id=\\\"new-objective-name\\\" placeholder=\\\"Title of timed review\\\" ng-model=\\\"data.title\\\" autofocus>\\r\\n        </div>\\r\\n    </form>\\r\\n</div>\\r\\n<div class=\\\"modal-footer\\\">\\r\\n    <button type=\\\"button\\\" class=\\\"btn btn-default\\\" ng-click=\\\"cancel()\\\">Close</button>\\r\\n    <button type=\\\"button\\\" class=\\\"btn btn-primary\\\" ng-click=\\\"create()\\\">Save</button>\\r\\n</div>\\r\\n\\r\\n\"\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/modal.html\n ** module id = 23\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/modal.html?");

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nmodule.exports = ModalController;\n\nfunction ModalController($modalInstance, $scope, TimedReviewService) {\n  $scope.data = {\n    title: \"\",\n    description: \"\" };\n  $scope.create = function (_) {\n    TimedReviewService.create($scope.data).success(function (response) {\n      if (response.error) {\n        return $scope.error = response.error;\n      }\n\n      $modalInstance.close(response);\n    });\n  };\n  $scope.cancel = function () {\n    $modalInstance.dismiss(\"cancel\");\n  };\n}\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/modal.js\n ** module id = 24\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/modal.js?");

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	eval("\"use strict\";\n\nmodule.exports = AppMenuController;\n\nfunction AppMenuController($rootScope, $scope, $state, $stateParams, nav, TimedReviewService) {\n  // give this controller 'a little more scope'\n  $scope.nav = nav;\n  $scope.course = nav.selected_course;\n  $scope.data = [];\n  // no bank id was provided (clicked on tab) so choose one for the visitor\n  TimedReviewService.list().success(function (response) {\n    $scope.data = { timedReviews: response };\n    nav.data = { timedReviews: response };\n  }).error(function (error) {\n    console.log(error);\n  });\n  /*\r\n  TestbankBankService.getByOrg(0)\r\n  .success(function(response) {\r\n    $scope.data = response;\r\n    nav.data = response;\r\n    if ($state.current.name == \"banks\") {\r\n      if (angular.isDefined($scope.data.banks)) {\r\n        TestbankBankService.setBanks($scope.data.banks);\r\n        $state.go(\"banks.detail\", {\r\n          bankId: $scope.data.banks[0].id\r\n        });\r\n      }\r\n      }\r\n  })\r\n  */\n}\n\n/*****************\n ** WEBPACK FOOTER\n ** ./timed-editor/menu.js\n ** module id = 25\n ** module chunks = 3\n **/\n//# sourceURL=webpack:///./timed-editor/menu.js?");

/***/ }
/******/ ]);