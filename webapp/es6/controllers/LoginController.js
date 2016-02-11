'use strict';

var appModuleCommom = angular.module('app');

var loginResource = appModuleCommom.factory('LoginResource', ['$resource', function($resource) {
    return function(newUser) {
        return $resource('rest/private/:dest', {}, {
        login: {method: 'POST', params: {dest:"authc"}, headers:{"Authorization": "Basic " + btoa(newUser.username + ":" + newUser.password)} },
    });
}}]);

class LoginController {

    /*@ngInject*/
    constructor($scope, $location, LoginResource, SecurityService) {
  	  this.loginData = {};
  	  this.$location = $location;
  	  this.LoginResource = LoginResource;
  	  this.SecurityService = SecurityService;
//  	  LoginController.$inject = ['$scope', '$location', 'LoginResource', 'SecurityService'];
    }

    ok () {
        console.log('Doing login', this.loginData);
        var scope = this;
        
        var callback = function (data) {
        	scope.SecurityService.initSession(data);
        	console.log('suscefull login !');
        	scope.$location.path("/app/tools");
        } 

        if (this.loginData.username != undefined && this.loginData.password != undefined) {
            this.LoginResource(this.loginData).login(this.loginData, callback);
        } else {
           console.log('empty login data');
        }
    }

}

angular.module('app').controller('LoginController', function funcController($scope, $location, LoginResource, SecurityService) {
	$scope.vm = new LoginController($scope, $location, LoginResource, SecurityService);
});

var securityService = appModuleCommom.factory('SecurityService', ['$rootScope', function($rootScope) {

    var SecurityService = function() {
        var userName, password;

        this.initSession = function(response) {
            console.log("[INFO] Initializing user session.");
            console.log("[INFO] Token is :" + response.authctoken);
            console.log("[INFO] Token Stored in session storage.");
            // persist token, user id to the storage
            sessionStorage.setItem('token', response.authctoken);
        };

        this.endSession = function() {
            console.log("[INFO] Ending User Session.");
            sessionStorage.removeItem('token');
            console.log("[INFO] Token removed from session storage.");
        };

        this.getToken = function() {
            return sessionStorage.getItem('token');
        };

        this.secureRequest = function(requestConfig) {
            var token = this.getToken();

            if(token != null && token != '' && token != 'undefined') {
                console.log("[INFO] Securing request.");
                console.log("[INFO] Setting x-session-token header: " + token);
                requestConfig.headers['Authorization'] = 'Token ' + token;
            }
        };
    };

    return new SecurityService();
}]);

var factoryAuthHttpResponseInterceptor = appModuleCommom.factory('authHttpResponseInterceptor', ['$q', '$rootScope', '$location', 'SecurityService', 'MessageService', function($q, $rootScope, $location, SecurityService, MessageService) {
   return {
		'request' : function(config) {
		    SecurityService.secureRequest(config);
		    return config || $q.when(config);
		},

		'response' : function(response) {
		    return response || $q.when(response);
		},
		
		'responseError' : function(rejection) {
                 console.log("Server Response Status: " + rejection.status);
                 console.log(rejection);
 
                 if (rejection.data && rejection.data.message) {
                     MessageService.setMessages(rejection.data.message);
                 } else {
                     MessageService.setMessages(["Unexpected error from server."]);
                 }
     
                 if (rejection.status === 401) {
                     console.log("[INFO] Unauthorized response.");
                     SecurityService.endSession();
                     MessageService.setMessages(["Please, provide your credentials."]);
                     $location.path('/app/login');
//                     LoginCtrl.login();
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
} ]).config([ '$httpProvider', function($httpProvider) {
         //Http Intercpetor to check auth failures for xhr requests
         $httpProvider.interceptors.push('authHttpResponseInterceptor');
} ]).run(function($rootScope, $location, MessageService) {

         // register listener to watch route changes
         $rootScope.$on("$routeChangeStart", function(event, next, current) {
             MessageService.clearMessages();
         });
});
