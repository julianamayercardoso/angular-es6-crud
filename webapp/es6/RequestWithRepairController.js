'use strict';

// Request With Repair
class RequestWithRepairController extends RequestController {
	// TODO : adaptar com o metodo filterProductsAndServices
	applyFilterIds(listIds) {
		this.filterResults = [];
		
		for (var item of this.list) {
			for (var id of listIds) {
				if (item[this.primaryKey] == id) {
					this.filterResults.push(item);
					break;
				}
			}
		}
		
		this.paginate();
	}
	
    filterProductsAndServices(productOut) {
    	var productOutFilter = {productOut: productOut};
    	var productsInIds = [];
    	var servicesInIds = [];
    	
    	this.serviceManager.services.productAssembleProduct.applyFilter(productOutFilter, function(list) {
    		for (var item of list) {
    			productsInIds.push(item.productIn);
    		}
    	});
    	
    	this.serviceManager.services.productAssembleService.applyFilter(productOutFilter, function(list) {
    		for (var item of list) {
    			servicesInIds.push(item.serviceIn);
    		}
    	});
    	// TODO : adaptar com o metodo this.applyFilterIds
    	this.serviceManager.services.product.applyFilterIds(productsInIds);
    	this.serviceManager.services.service.applyFilterIds(servicesInIds);
    }
    
    onProductRepairSelected(productOut) {
		this.filterProductsAndServices(productOut);
		this.enableRequestFields();
    }
    
    enableProductToRepair() {
    	var scope = this;
    	
        var repairQueryCallback = function(list) {
        	if (list.length == 1) {
        		scope.onProductRepairSelected(list[0].product);
        	} else {
        		scope.serviceManager.services.requestProduct.clearFilter();
        		scope.serviceManager.services.requestService.clearFilter();
        	}
        }

        this.crudItemRepair = new CrudItem(this.$location, this.serviceManager, "requestRepair", "request", this.id, 'Equipamento para conserto', 1, repairQueryCallback);
    	this.listItemCrud.unshift(this.crudItemRepair);
    }

	enable() {
       	this.enableProductToRepair();
	}
    
    static factory($scope, $location, ServiceManagerService) {
    	return new RequestWithRepairController($scope, $location, ServiceManagerService);
    }
}

angular.module('app').controller('RequestWithRepairController', RequestWithRepairController.factory);
