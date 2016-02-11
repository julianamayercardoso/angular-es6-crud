'use strict';

class CrudItem {

	constructor($resource, restName, id, fieldId, objDefault, title, queryCallback) {
		this.rest = new CrudService($resource, restName);
		this.restName = restName;
		this.id = id;
		this.fieldId = fieldId;
		this.objDefault = objDefault;
		this.title = title;
		this.list = [];
		this.fields = Object.keys(objDefault);
		this.labels = [];
		this.listService = [];
		this.formId = restName + "Form";
		this.pagination = new Pagination(10);
		this.queryCallback = queryCallback;

		for (var i = 0; i < this.fields.length; i++) {
			var field = this.fields[i];
			this.labels[i] = CrudController.convertToLabel(field);
			var val = objDefault[field];
			
			if (angular.isObject(val) == true) {
				this.listService[i] = val; 
			} else {
				this.listService[i] = null;
			}
		}
		
		this.query();
	}
	
    getValue(obj, fieldRef, fieldIndex) {
    	var valRef = obj[fieldRef];
		var service = this.listService[fieldIndex];
    	var ret = "";
    	
		if (service != null) {
			// neste caso, valRef contém o id do registro de referência
			var fieldId = service.searchFields[0]; 
			var listService = service.list;
	    	
	    	for (var i = 0; i < listService.length; i++) {
	    		var data = listService[i];
	    		// TODO : trocar "id" por primaryKey
	    		if (data[fieldId] == valRef) {
		    		ret = service.listStr[i];
	    			break;
	    		}
	    	}
		} else {
			ret = valRef;
		}
    	
    	return ret;
    }
    
    goToField(obj, fieldRef, fieldIndex, edit) {
    	// restName, id, fieldId
    	var valRef = obj[fieldRef];
    	var crudService = this.listService[fieldIndex];
    	var ret = "";
    	
		if (crudService != null) {
			// neste caso, valRef contém o id do registro de referência
			ret = "#/app/" + crudService.path + "/0/" + valRef;
		} else {
			ret = "#/app/" + this.restName + "/0/" + obj.id;
		}
		
		if (edit == true) {
			ret = ret + "/1";
		} else {
			ret = ret + "/0";
		}
    	
    	return ret;
    }
    
	remove(item) {
		var id = item.id;
		
		if (id == undefined || id == null) {
			id = item._id;
		}
		
		var scope = this;
		
		var successCallback = function(data) {
			scope.displayError = false;
			scope.query();
		};
		
		var params = {id: id};
		this.rest.remove(params, successCallback);
	}

	save() {
		var scope = this;
		
		var successCallback = function(data) {
			scope.displayError = false;
			scope.query();
		};
		
		for (var i = 0; i < this.fields.length; i++) {
			var field = this.fields[i];
			
			if (this.listService[i] != null) {
				this.item[field] = CrudService.getId(this.item[field]);
			} 
		}
		
		var params = {path: this.restName};
		this.rest.save(params, this.item, successCallback);
	}

	query() {
		var scope = this;
		
		var successCallback = function(data) {
			scope.list = data;
			
			if (scope.queryCallback != undefined && scope.queryCallback != null) {
				scope.queryCallback(data);
			}
		};
		
		this.list = [];
		var params = {path:this.restName, fieldQuery:this.fieldId, valueQuery:this.id};
        console.log("[CrudItem] query : params :", params);
		this.rest.query(params, successCallback);
		// aproveita e limpa os campos de inserção de novo item
		this.item = this.objDefault;
		this.item[this.fieldId] = this.id;
		
		for (var i = 0; i < this.fields.length; i++) {
			var field = this.fields[i];
			
			if (this.listService[i] != null) {
				this.item[field] = "";
			} 
		}
	}
	
    errorCallback(scope, data) {
    	scope.displayError = true;
    };
}
