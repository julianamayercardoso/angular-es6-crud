'use strict';

var app = angular.module('app', ['ngRoute', 'ngResource', 'ngWebSocket', 'ui.bootstrap']);

app.config(['$routeProvider', function($routeProvider) {
	$routeProvider
		// Tools
		.when('/app/buy/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestController', controllerAs: "vm"})
		.when('/app/request/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestController', controllerAs: "vm"})
		.when('/app/assemble/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestController', controllerAs: "vm"})
		.when('/app/disassemble/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestController', controllerAs: "vm"})
		.when('/app/repair/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'RequestWithRepairController', controllerAs: "vm"})
		// Cadastros personalizados
		.when('/app/product/0/:id/:editMode',{templateUrl:'templates/crud.html',controller:'ProductController', controllerAs: "vm"})
		//
		.when('/app/login',{templateUrl:'templates/login.html', controller:'LoginController', controllerAs: "vm"})
		.when('/app/start',{templateUrl:'templates/start.html', controller:'StartController', controllerAs: "vm"})
		.when("/app/crud_service/:db/:id/:editMode", {templateUrl: "templates/crud.html", controller: "CrudServiceController", controllerAs: "vm"})
		.when("/app/crud_user/:db/:id/:editMode", {templateUrl: "templates/crud.html", controller: "UserController", controllerAs: "vm"})
		.when("/app/:name/:db/:id/:editMode", {templateUrl: "templates/crud.html", controller: "CrudController", controllerAs: "vm"})
		.otherwise({redirectTo: '/app/login'});
}]);

app.controller("CrudController", CrudController.factory);

var messageServiceFactory = app.factory('MessagesService', ['$rootScope', function($rootScope) {
    $rootScope.messages = [];

    var MessagesService = function() {
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

    return new MessagesService();
}]);

var messageDisplayCtrl = app.controller('MessageDisplayCtrl', function(MessagesService, $scope) {
    $scope.hasMessages = function() {
        return MessagesService.hasMessages();
    };

    $scope.clearMessages = function() {
        MessagesService.clearMessages();
    };
    
});

var navCtrl = app.controller('NavCtrl', function NavController($scope, $location, ServiceManagerService) {
	$scope.serviceManager = ServiceManagerService;
//	$scope.serviceManager.setMenuScope($scope);
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

var crudItemJsonDirective = app.directive('crudItemJson', function() {
	return {
		restrict: 'E',
		
		scope: {
			vm: '=',
			edit: '='
		},
		
		templateUrl: 'templates/crud-item-json.html'
	};
});

// 		<crud-reference ng-repeat="(fieldName,item) in vm.crudService.externalReferences" vm="vm" field="fieldName" str="vm.fields[fieldName].externalReferencesStr" list="item.service.listStr" label="item.label" edit="false"></crud-reference>

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

class CrudServiceController extends CrudController {

    constructor($scope, $location, serviceManager) {
    	super($scope, $location, serviceManager);
    }

    getCallback(data) {
    	var types = Utils.getFieldTypes();
		// params.fields = {"field": {"flags": ["label 1", "label 2", ...], "type": "text"}}
    	var serviceOptions = [];
    	
    	for (var item of this.serviceManager.services.crudService.list) {
    		serviceOptions.push(item.name);
    	}
    	
    	var fields = {
    			"type":{"options": types},
    			"service":{"options": serviceOptions},
    			"defaultValue": {},
    			"hiden":{"options": [true, false]},
    			"flags":{},
    			"readOnly":{"options": [true, false]}
    			};
    	
    	this.listItemCrudJson.push(new CrudItemJson(fields, this.instance, "fields", "Campos dos formulários"));
    }

    static factory($scope, $location, ServiceManagerService) {
    	return new CrudServiceController($scope, $location, ServiceManagerService);
    }
}

angular.module("app").controller("CrudServiceController", CrudServiceController.factory);

class ProductController extends CrudController {

    constructor($scope, $location, serviceManager) {
    	super($scope, $location, serviceManager);
    }

    getCallback(data) {
    	this.listItemCrud.push(new CrudItem(this.$location, this.serviceManager, "productAssembleProduct", "productOut", this.id, 'Componentes para Fabricação/Montagem'));
    	this.listItemCrud.push(new CrudItem(this.$location, this.serviceManager, "productAssembleService", "productOut", this.id, 'Serviços para Fabricação/Montagem'));
    	this.listItemCrud.push(new CrudItem(this.$location, this.serviceManager, "productAssembleProduct", "productIn", this.id, 'Produtos que utilizam este componente na Fabricação/Montagem'));
    }

    static factory($scope, $location, ServiceManagerService) {
    	return new ProductController($scope, $location, ServiceManagerService);
    }
}

angular.module("app").controller("ProductController", ProductController.factory);

class UserController extends CrudController {

    constructor($scope, $location, serviceManager) {
    	super($scope, $location, serviceManager);
    }

    getCallback(data) {
    	var fieldsRoles = {
    			"read":{"defaultValue":true, "options":[false,true]},
    			"query":{"defaultValue":true, "options":[false,true]},
    			"create":{"defaultValue":true, "options":[false,true]},
    			"update":{"defaultValue":true, "options":[false,true]},
    			"delete":{"defaultValue":true, "options":[false,true]}
    			};
    	
    	var nameOptionsRoles = [];
    	
    	for (var item of this.serviceManager.services.crudService.list) {
    		nameOptionsRoles.push(item.name);
    	}
    	
    	this.listItemCrudJson.push(new CrudItemJson(fieldsRoles, this.instance, "roles", "Controle de Acesso", nameOptionsRoles));
    }

    static factory($scope, $location, ServiceManagerService) {
    	return new UserController($scope, $location, ServiceManagerService);
    }
}

angular.module("app").controller("UserController", UserController.factory);
