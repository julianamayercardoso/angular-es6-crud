'use strict';

class ServiceManagerService {

    constructor($websocket) {
    	this.isCollapsed = true;
    	this.services = {};
    	var scope = this;
		// Open a WebSocket connection
		var dataStream = $websocket('wss://localhost:8443/badmt/websocket');

		dataStream.onMessage(function(message) {
			var item = JSON.parse(message.data);
            console.log("[ServiceManagerService] onMessage :", item);
            var service = item.service;
            service = service.charAt(0).toLowerCase() + service.substring(1);
            console.log("[ServiceManagerService] service :", service);
            
            if (scope.services[service] != undefined) {
                scope.services[service].onMessage(item.action, item.id);
            }
		});
    }

    setActiveControllerScope($scope) {
    	this.activeControllerScope = $scope; 
    }
    
    static factory($websocket) {
    	return new ServiceManagerService($websocket);
    }
}

angular.module('app').service("ServiceManagerService", ServiceManagerService.factory);

class IdentityService {
	
    constructor($resource, $location, $route, serviceManager) {
    	this.$resource = $resource;
    	this.$location = $location;
    	this.$route = $route;
    	this.serviceManager = serviceManager;
    	// var restPath = "rest/:path/:method/:id";
        var restPath = CrudService.getRestPath($location);
    	this.resource = $resource(restPath, {}, {
            login: {
            	method: 'POST', params: {path:"authc"}, 
/*        		headers: {
        			'Content-Type':"application/x-authc-username-password+json"
        		}*/
            },
        });
    }
    
    logout() {
    	delete this.user;
        this.serviceManager.menu = {};
        // limpa todos os dados da sessão anterior
        for (var serviceName in this.serviceManager.services) {
        	delete this.serviceManager.services[serviceName];
        }
        
        console.log("[INFO] Ending User Session.");
        sessionStorage.removeItem('token');
        console.log("[INFO] Token removed from session storage.");
//    	this.$location.path("/app/login");
//    	this.$route.reload();
        location.reload();
    };
    
    processLoginResponse(loginResponse) {
    	console.log('suscefull login !');
        console.log("[INFO] Token is :" + loginResponse.user.authctoken);
        sessionStorage.setItem('token', loginResponse.user.authctoken);
        this.user = loginResponse.user;
        var acess = JSON.parse(this.user.roles);
        // depois carrega os serviços autorizados
        for (var params of loginResponse.crudServices) {
    		params.access = acess[params.name];
    		params.name = Utils.convertCaseCamelUpToCamelLower(params.name);
        	var service = new CrudService(this.$resource, this.$location, this.serviceManager, params);
        	this.serviceManager.services[service.params.name] = service;
        	
    		if (service.isOnLine != true) {
    			service.queryRemote();
    		}
        }
        // depois monta o menu
        this.serviceManager.menu = {user:[{path:"login", label:"Exit"}]};
        // menu do sistema
        for (var params of loginResponse.crudServices) {
        	var menu = params.menu;
        	
        	if (menu != undefined && menu != null && menu.length > 0) {
            	if (this.serviceManager.menu[menu] == undefined) {
            		this.serviceManager.menu[menu] = [];
            	}
            	
            	var menuItem = {path: Utils.convertCaseCamelToUnderscore(params.name)+"/0/0/0", label: Utils.convertCaseAnyToLabel(params.name)};
            	this.serviceManager.menu[menu].unshift(menuItem);
                console.log("[INFO] this.serviceManager.menu[", menu, "] :", this.serviceManager.menu[menu]);
        	}
        }
        // menu do usuario
        if (this.user.menu != undefined && this.user.menu.length > 0) {
            var menus = JSON.parse(this.user.menu);
            
            for (var menu in menus) {
            	if (this.serviceManager.menu[menu] == undefined) {
            		this.serviceManager.menu[menu] = [];
            	}
            	
            	for (var menuItem of menus[menu]) {
                	this.serviceManager.menu[menu].unshift(menuItem);
                    console.log("[INFO] this.serviceManager.menu[", menu, "] :", this.serviceManager.menu[menu]);
            	}
            }
        }
        
        var path;
        
        if (loginResponse.user.path != undefined && loginResponse.user.path.length > 0) {
        	path = loginResponse.user.path;
        } else {
        	path = "/app/start";
        }
        
        this.$location.path(path);
    }

    login(data) {
        var scope = this;
        
        var callback = function(data) {
        	scope.processLoginResponse(data);
        }
        
    	this.resource.login(data, callback);
    }
    
    static factory($resource, $location, $route, ServiceManagerService) {
    	return new IdentityService($resource, $location, $route, ServiceManagerService);
    }
}

angular.module('app').service('IdentityService', IdentityService.factory);

class LoginController {

    constructor(identityService, serviceManager) {
		this.identityService = identityService;
		this.serviceManager = serviceManager;
		this.loginData = {userId: "guest", password: "123456"};
//  	  this.loginData = {userId: "admin", password: "123456"};
		
	  	if (this.identityService.user != undefined) {
	    	this.identityService.logout();
		}
    }

    ok () {
        console.log('Doing login', this.loginData);

        if (this.loginData.userId != undefined && this.loginData.password != undefined) {
        	this.identityService.login(this.loginData);
        } else {
           console.log('empty login data');
        }
    }
    
    static factory(IdentityService, ServiceManagerService) {
    	return new LoginController(IdentityService, ServiceManagerService);
    }
}

angular.module('app').controller('LoginController', LoginController.factory);

angular.module('app').factory('authHttpResponseInterceptor', ['$q', 'MessagesService', function($q, MessagesService) {
   return {
		'request' : function(config) {
	        var token = sessionStorage.getItem('token');

	        if (token != null && token != '' && token != 'undefined') {
	            console.log("[INFO] Securing request.");
	            console.log("[INFO] Setting x-session-token header: " + token);
	            config.headers['Authorization'] = 'Token ' + token;
	        }
	        
		    return config || $q.when(config);
		},

		'response' : function(response) {
		    return response || $q.when(response);
		},
		
		'responseError' : function(rejection) {
                 console.log("Server Response Status: " + rejection.status);
                 console.log(rejection);
 
                 if (rejection.data && rejection.data.message) {
                     MessagesService.setMessages(rejection.data.message);
                 } else {
                     MessagesService.setMessages(["Unexpected error from server."]);
                 }
     
                 if (rejection.status === 401) {
                     console.log("[INFO] Unauthorized response.");
                     MessagesService.setMessages(["Please, provide your credentials."]);
//                   IdentityService.logout();
                 } else if (rejection.status == 400) {
                     console.log("[ERROR] Bad request response from the server.");
                 } else if (rejection.status == 500) {
                     console.log("[ERROR] Internal server error.");
                 } else {
                     console.log("[ERROR] Unexpected error from server.");
                 }

		    return $q.reject(rejection);
		}
	}
} ]);

angular.module('app').config(['$httpProvider', function($httpProvider) {
         //Http Intercpetor to check auth failures for xhr requests
         $httpProvider.interceptors.push('authHttpResponseInterceptor');
}]);

angular.module('app').run(function($rootScope, MessagesService) {
         // register listener to watch route changes
         $rootScope.$on("$routeChangeStart", function(event, next, current) {
             MessagesService.clearMessages();
         });
});
