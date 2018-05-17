'use strict';

angular.module('app')

.controller('AlertModalsController',
	[ '$scope',
		'$modalInstance',
		'$sce',
		'options',
		'callback',
		'callbackCancel',
		function($scope, $modalInstance, $sce,options, callback,callbackCancel){
			$scope.options = options;
			$scope.title = options.title;
			$scope.content = options.content;
			$scope.contentHtml = options.contentHtml;
			$scope.cssClass = options.cssClass;
			$scope.noCancel = options.noCancel;
			$scope.noOk = options.noOk;
			$scope.textOk = (options.textOk)? options.textOk : 'Ok';
			$scope.textCancel = (options.textCancel)? options.textCancel : 'Cancel';
			$scope.closeButtonOnTop = options.closeButtonOnTop
			$scope.trustAsHtml = $sce.trustAsHtml
			$scope.ok = function(){
				callback($scope.options);
				$modalInstance.close();
			};
			$scope.cancel = function(){
				if(callbackCancel)
					callbackCancel();
				$modalInstance.dismiss('cancel');
			};
		}
	]
)

.factory('Alerts',
	[	'$modal',
		function($modal){
			var factory = {};
			/*
			options = {
				type: info, danger, warning, success
				size: lg,md,sm
				title: <string>
				content: <string>
				buttons: ok, cancel, continue, yes, no,,
				windowClass: <string>
			 	closeButtonOnTop: <boolean> default: false
			}
			*/

			var open = function(options, callback,callbackCancel){
				$modal.open({
					templateUrl: '/public/views/alerts.html',
					controller: 'AlertModalsController',
					size: options.size||'md',
					windowClass:options.windowClass,
                    backdrop: 'static',
					resolve: {
						options: function(){
							return options;
						},
						callback: function(){
							return callback;
						},
						callbackCancel: function(){
							return callbackCancel;
						}
					}
				});
			};

			/*some pre-built alerts*/
			/* all need: options.title, options.content */

			factory.warning = function(options, callback,callbackCancel) {
				options.cssClass = 'btn-warning';
				open(options, callback,callbackCancel);
			};

			factory.danger = function(options, callback,callbackCancel) {
				options.cssClass = 'btn-danger';
				open(options, callback,callbackCancel);
			};

			factory.info = function(options, callback,callbackCancel) {
				options.cssClass = 'btn-info';
				options.noCancel = true;
				open(options, callback);
			};

			factory.success = function(options, callback,callbackCancel) {
				options.cssClass = 'btn-success';
				options.noCancel = true;
				open(options, callback);
			};

			return factory;
		}
	]
);