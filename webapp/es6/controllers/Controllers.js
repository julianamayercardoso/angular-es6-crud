'use strict';

// Person
class PersonService extends CrudService {
	
    constructor($resource) {
    	var searchFields = ["id", "name", "cnpjCpf", "ieRg", "phone"];
    	super($resource, "person", searchFields);
    }
    
    static factory($resource) {
    	return new PersonService($resource);
    }
}

class PersonController extends CrudController {
	
    constructor(crudService, $location) {
    	var fields = ["id", "name", "cnpjCpf", "ieRg", "zip", "uf", "city", "district", "address", "phone", "fax", "email", "site", "credit", "additionalData"];
    	super(crudService, fields, $location);
    }
    
    static factory(PersonService, $location) {
    	return new PersonController(PersonService, $location);
    }
}

angular.module('app').service('PersonService', PersonService.factory);
angular.module('app').controller('PersonController', PersonController.factory);

// Service
class ServiceService extends CrudService {
	
    constructor($resource) {
    	var searchFields = ["id", "name", "description", "aditionalData"];
    	super($resource, "service", searchFields);
    }
    
    static factory($resource) {
    	return new ServiceService($resource);
    }
}

class ServiceController extends CrudController {
	
    constructor(crudService, $location) {
    	var fields = ["id", "name", "description", "unit", "value", "taxIss", "aditionalData"];
    	super(crudService, fields, $location);
    }
    
    static factory(ServiceService, $location) {
    	return new ServiceController(ServiceService, $location);
    }
}

angular.module('app').service('ServiceService', ServiceService.factory);
angular.module('app').controller('ServiceController', ServiceController.factory);

// Product
class ProductService extends CrudService {
	
    constructor($resource) {
    	var searchFields = ["id", "name", "description", "model", "manufacturer"];
    	super($resource, "product", searchFields);
    }
    
    static factory($resource) {
    	return new ProductService($resource);
    }
}

class ProductController extends CrudController {
	
    constructor(crudService, $location, $resource, serviceService) {
    	var fields = ["id", "name", "description", "unit", "barcode", "category", "manufacturer", "model", "clFiscal", "departament", "imageUrl", "weight", "taxIpi", "taxIcms", "taxIss", "additionalData"];
    	super(crudService, fields, $location);
    	this.$resource = $resource;
    	this.serviceService = serviceService;
    }
    
    getCallback(data) {
    	this.listItemCrud.push(new CrudItem(this.$resource, "product_assemble_product", this.id, "productOut", {productIn: this.crudService, amountIn:1, factorLoseInAssemble:0, factorLoseInDisassemble:0}, 'Componentes para Fabricação/Montagem'));
    	this.listItemCrud.push(new CrudItem(this.$resource, "product_assemble_product", this.id, "productIn", {productOut: this.crudService, amountIn:1, factorLoseInAssemble:0, factorLoseInDisassemble:0}, 'Produtos que utilizam este componente na Fabricação/Montagem'));
    	this.listItemCrud.push(new CrudItem(this.$resource, "product_assemble_service", this.id, "productOut", {serviceIn: this.serviceService, amountIn:1}, 'Serviços para Fabricação/Montagem'));
    }

    static factory(ProductService, $location, $resource, ServiceService) {
    	return new ProductController(ProductService, $location, $resource, ServiceService);
    }
}

angular.module('app').service('ProductService', ProductService.factory);
angular.module('app').controller('ProductController', ProductController.factory);

// Account
class AccountService extends CrudService {
	
    constructor($resource) {
    	var searchFields = ["id", "bank", "agency", "account", "description"];
    	super($resource, "account", searchFields);
    }
    
    static factory($resource) {
    	return new AccountService($resource);
    }
}

class AccountController extends CrudController {
	
    constructor(crudService, $location) {
    	var fields = ["id", "bank", "agency", "account", "description"];
    	super(crudService, fields, $location);
    }
    
    static factory(AccountService, $location) {
    	return new AccountController(AccountService, $location);
    }
}

angular.module('app').service('AccountService', AccountService.factory);
angular.module('app').controller('AccountController', AccountController.factory);

//RequestType
class RequestTypeService extends CrudService {
	
    constructor($resource) {
    	var searchFields = ["id", "name", "description"];
    	super($resource, "request_type", searchFields);
    }
    
    static factory($resource) {
    	return new RequestTypeService($resource);
    }
}

class RequestTypeController extends CrudController {
	
    constructor(crudService, $location) {
    	var fields = ["id", "name", "description"];
    	super(crudService, fields, $location);
    }
    
    static factory(RequestTypeService, $location) {
    	return new RequestTypeController(RequestTypeService, $location);
    }
}

angular.module('app').service('RequestTypeService', RequestTypeService.factory);
angular.module('app').controller('RequestTypeController', RequestTypeController.factory);

class Request extends CrudController {
	
    constructor(crudService, $location, $resource, personService, requestTypeService, productService, serviceService, accountService) {
    	var fields = ["id", "person", "date", "type", "additionalData"];
    	super(crudService, fields, $location);
    	this.$resource = $resource;
    	this.personService = personService;
    	this.requestTypeService = requestTypeService;
    	this.productService = productService;
    	this.accountService = accountService;
    	this.instance.date = new Date();
    	this.instance.date.setMilliseconds(0);
    }
    
    getCallback(data) {
    	this.instance.date = new Date(this.instance.date);
    	this.personStr = this.personService.getStrFromId(this.instance.person);
    	this.requestTypeStr = this.requestTypeService.getStrFromId(this.instance.type);
    	this.listItemCrud.push(new CrudItem(this.$resource, "request_product", this.id, "request", {product: this.productService, quantity:1, value:0, serial:""}, 'Produtos'));
    	this.listItemCrud.push(new CrudItem(this.$resource, "request_freight", this.id, "request", {person : this.personService, payBy:0, value:0, containerType:"", logo:"", quantity:0, weight:0, licensePlate:"", licensePlateUf:""}, 'Transportador'));
    	this.listItemCrud.push(new CrudItem(this.$resource, "request_payment", this.id, "request", {account: this.accountService, value:0, type:0, number:"", dueDate:"", payday:""}, 'Pagamentos'));
    }
    
    static factory(RequestService, $location, $resource, PersonService, RequestTypeService, ProductService, ServiceService, AccountService) {
    	return new Request(RequestService, $location, $resource, PersonService, RequestTypeService, ProductService, ServiceService, AccountService);
    }
}

angular.module('app').controller('RequestController', Request.factory);

// Freight
angular.module('app').controller('FreightController', function funcController($scope, $location, $resource, $routeParams) {
	var fields = ["id", "request", "payBy", "value", "containerType", "logo", "quantity", "weight", "licensePlate", "licensePlateUf"];
	$scope.vm = new CrudController($resource, $scope, $location, $location.$$path, fields);
});

// ItemPayment
angular.module('app').controller('ItemPaymentController', function funcController($scope, $location, $resource, $routeParams) {
	var fields = ["id", "request", "account", "number", "type", "value", "dueDate", "payday"];
	$scope.vm = new CrudController($resource, $scope, $location, $location.$$path, fields);
});
