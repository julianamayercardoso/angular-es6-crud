'use strict';

// Request
class RequestController extends CrudController {
	
    enableRequestFields() {
    	var scope = this;
    	
        var productsQueryCallback = function(list) {
    		scope.onProductsChanged(list);
        }
        
        var servicesQueryCallback = function(list) {
    		scope.onServicesChanged(list);
        }
        
        var transportQueryCallback = function(list) {
    		scope.onTransportChanged(list);
        }
        
        var paymentsQueryCallback = function(list) {
    		scope.onPaymentsChanged(list);
        }
        
        var productsSelectCallback = function(field, id) {
    		scope.onProductSelected(id);
        }
        
        var servicesSelectCallback = function(field, id) {
        	if (field == "service") {
        		scope.onServiceSelected(id);
        	}
        }
        
        var paymentsSelectCallback = function(field, id) {
    		scope.onAccountSelected(id);
        }
        
        // $location, serviceManager, serviceName, fieldName, fieldValue, title, numMaxItems, queryCallback, selectCallback
        this.crudItemProduct = new CrudItem(this.$location, this.serviceManager, "requestProduct", "request", this.id, 'Produtos', null, productsQueryCallback, productsSelectCallback);
        this.crudItemService = new CrudItem(this.$location, this.serviceManager, "requestService", "request", this.id, 'Serviços', null, servicesQueryCallback, servicesSelectCallback);
		this.listItemCrud.push(this.crudItemProduct);
		this.listItemCrud.push(this.crudItemService);
		
		if (this.serviceManager.services.requestFreight.params.access.update != false) {
	        this.crudItemFreight = new CrudItem(this.$location, this.serviceManager, "requestFreight", "request", this.id, 'Transportador', 1, transportQueryCallback);
			this.listItemCrud.push(this.crudItemFreight);
		}
		
		if (this.serviceManager.services.requestPayment.params.access.update != false) {
	        this.crudItemPayment = new CrudItem(this.$location, this.serviceManager, "requestPayment", "request", this.id, 'Pagamentos', null, paymentsQueryCallback, paymentsSelectCallback);
			this.listItemCrud.push(this.crudItemPayment);
		}
		
		if (this.serviceManager.services.requestInvoice.params.access.update != false) {
	        this.crudItemInvoice = new CrudItem(this.$location, this.serviceManager, "requestInvoice", "request", this.id, 'Nota Fiscal', 1);
			this.listItemCrud.push(this.crudItemInvoice);
		}
    }
    
    getSumValues(list) {
    	var sum = 0.0;
    	
    	for (var i = 0; i < list.length; i++) {
    		var item = list[i];
    		var quantity = (item.quantity != undefined && item.quantity != null) ? item.quantity : 1.0;
    		var value = (item.value != undefined && item.value != null) ? item.value : 0.0;
    		sum += quantity * value;
    	}
    	
    	return sum;
    }
    
    onProductsChanged(list) {
    	this.instance.productsValue = this.getSumValues(list);
    	this.instance.sumValue = this.instance.productsValue + this.instance.servicesValue + this.instance.transportValue;
    }
    
    onServicesChanged(list) {
    	this.instance.servicesValue = this.getSumValues(list);
    	this.instance.sumValue = this.instance.productsValue + this.instance.servicesValue + this.instance.transportValue;
    }
    
    onTransportChanged(list) {
    	this.instance.transportValue = this.getSumValues(list);
    	this.instance.sumValue = this.instance.productsValue + this.instance.servicesValue + this.instance.transportValue;
    }
    
    onPaymentsChanged(list) {
    	this.instance.paymentsValue = this.getSumValues(list);
    }
    
    onProductSelected(id) {
    	var list = this.services.stock.getFilteredItems({product:id});
		this.crudItemProduct.item.value = list.length > 0 ? list[0].value : 0.0;
    }
    
    onServiceSelected(id) {
    	var list = this.serviceManager.services.stockService.getFilteredItems({service:id});
		this.crudItemService.item.value = list.length > 0 ? list[0].value : 0.0;
		// carrega o empregado baseado no empregado do último serviço inserido
		if (this.crudItemService.list.length > 0) {
			var lastItemServiceIndex = this.crudItemService.list.length - 1;
			var lastEmployedId = this.crudItemService.list[lastItemServiceIndex].employed;
			this.crudItemService.item.employed = this.serviceManager.services.employed.getStrFromId(lastEmployedId);
		}
    }
    
    onAccountSelected(id) {
		this.crudItemPayment.item.value = this.instance.sumValue - this.instance.paymentsValue;
    }
    
    getCallback(data) {
    	this.instance.date = new Date(this.instance.date);
    }
    
	enable() {
       	this.enableRequestFields();
	}
	
	filterRequestState() {
		var filterResults = [];
		var list = this.fields.state.crudService.list;
		
		for (var j = 0; j < list.length; j++) {
			var itemRef = list[j];
			
			if (itemRef.id == this.instance.state) {
				filterResults.push(itemRef);
				
				for (var i = 0; i < list.length; i++) {
					var item = list[i];
					
					if ((item.type & this.instance.type) != 0) {
						if ((item.id & itemRef.parent) != 0 || (item.parent & itemRef.id) != 0) {
							filterResults.push(item);
						}
					}
				}
				
				break;
			}
		}
		
		this.setFieldOptions("state", filterResults);
	}
    
    constructor($scope, $location, serviceManager) {
    	var type = 2;
    	var state = 8;
    	
    	if ($location.$$path.startsWith("/app/buy") == true) {
    		type = 1;
    		state = 1;
    		$location.$$path = "/app/request" + $location.$$path.substring(8);
    	} else if ($location.$$path.startsWith("/app/repair") == true) {
    		type = 4;
    		state = 2;
    		$location.$$path = "/app/request" + $location.$$path.substring(11);
    	} else if ($location.$$path.startsWith("/app/assemble") == true) {
    		type = 8;
    		state = 32768;
    		$location.$$path = "/app/request" + $location.$$path.substring(13);
    	} else if ($location.$$path.startsWith("/app/disassemble") == true) {
    		type = 16;
    		state = 32768;
    		$location.$$path = "/app/request" + $location.$$path.substring(16);
    	}
    	
    	super($scope, $location, serviceManager);
    	this.saveAndExit = false;
    	
    	if (this.id > 0) {
        	this.enable();
    	} else {
        	this.instance.date = new Date();
        	this.instance.date.setMilliseconds(0);
        	this.setValue("type", type);
        	this.setValue("state", state);
    	}
    	
    	this.filterRequestState();
    }
    
    static factory($scope, $location, ServiceManagerService) {
    	return new RequestController($scope, $location, ServiceManagerService);
    }
}

angular.module('app').controller('RequestController', RequestController.factory);
