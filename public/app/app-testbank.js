'use strict';
if(window.location.href.indexOf("testbank")>=0){
	angular.module('app', [
		'ui.router',
		'ui.bootstrap',
		'app.nav',
		'angularFileUpload',
		'app.testbank',
		'app.timed-editor',
		'selectize',
		'ck'
	])

		.run(
		['$rootScope', '$state', '$stateParams',
			function($rootScope, $state, $stateParams) {
				$rootScope.$state       = $state;
				$rootScope.$stateParams = $stateParams;
			}]
	)
}



