'use strict';

var app = angular.module('app', ['ngRoute', 'ngResource', 'ngTouch', 'ui.bootstrap']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		.when('/app/login',{templateUrl:'templates/login-bootstrap.html',controller:'LoginController'})
		.when('/app/person/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'PersonController',controllerAs: "vm"})
		.when('/app/product/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'ProductController', controllerAs: "vm"})
		.when('/app/service/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'ServiceController',controllerAs: "vm"})
		.when('/app/account/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'AccountController',controllerAs: "vm"})
		.when('/app/request_type/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestTypeController',controllerAs: "vm"})
		.when('/app/request/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestController',controllerAs: "vm"})
		.when('/app/repair/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RepairController',controllerAs: "vm"})
		.otherwise({redirectTo: '/app/product/0/0/0'});
}]);

var messageServiceFactory = app.factory('MessageService', ['$rootScope', function($rootScope) {
    $rootScope.messages = [];

    var MessageService = function() {
        this.setMessages = function(messages) {
            console.log(messages);
            $rootScope.messages = messages;
        };

        this.hasMessages = function() {
            return $rootScope.messages && $rootScope.messages.length > 0;
        }

        this.clearMessages = function() {
            $rootScope.messages = [];
        }
    };

    return new MessageService();
}]);

var messageDisplayCtrl = app.controller('MessageDisplayCtrl', function(MessageService, $scope) {
    $scope.hasMessages = function() {
        return MessageService.hasMessages();
    };

    $scope.clearMessages = function() {
        MessageService.clearMessages();
    };
    
});

var landingPageCtrl = app.controller('LandingPageCtrl', function LandingPageController() {
});

var navCtrl = app.controller('NavCtrl', function NavController($scope, $location) {
	$scope.isCollapsed = true;
	
    $scope.matchesRoute = function(route) {
        var path = $location.path();
        return (path === ("/" + route) || path.indexOf("/" + route + "/") == 0);
    };
});

var crudTableDirective = app.directive('crudTable', function() {
	return {
		restrict: 'E',
		
		scope: {
			vm: '=crud'
		},
		
		templateUrl: 'templates/crud-table.html'
	};
});

var crudItemDirective = app.directive('crudItem', function() {
	return {
		restrict: 'E',
		
		scope: {
			vm: '=',
			edit: '='
		},
		
		templateUrl: 'templates/crud-item.html'
	};
});

var crudReferenceDirective = app.directive('crudReference', function() {
	return {
		restrict: 'E',
		
		scope: {
			vm: '=',
			field: '=',
			label: '=',
			list: '=',
			str: '=',
			edit: '='
		},
		
		templateUrl: 'templates/crud-reference.html'
	};
});
