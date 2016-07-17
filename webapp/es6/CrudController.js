'use strict';

class CrudCommom {

	constructor($location, serviceManager, serviceName, dbId, id, editMode) {
		this.$location = $location;
		this.serviceManager = serviceManager;
		this.crudService = this.serviceManager.services[serviceName];
		
		if (this.crudService == undefined) {
			console.log("[CrudCommom] invalid service:", serviceName);
		}
		
		this.dbId = dbId == undefined ? 0 : dbId;
		this.crudService.setDb(this.dbId);
		this.id = id == undefined ? 0 : id;
		this.editMode = editMode == undefined ? false : editMode;
		this.formId = this.crudService.params.name + "Form";
		this.instance = this.instance || {};
		this.fields = angular.copy(this.crudService.params.fields);// type: "i", service: "serviceName", defaultValue: null, hiden: false, flags: ["a", "b"], readOnly: false
		this.filterResults = this.crudService.list;
		this.filterResultsStr = this.crudService.listStr;
		// faz uma referencia local a field.filterResultsStr, para permitir opção filtrada, sem alterar a referencia global
		for (var fieldName in this.fields) {
			var field = this.fields[fieldName];
			
			if (field.service != undefined) {
				field.crudService = this.serviceManager.services[field.service];
				field.filterResultsStr = field.crudService.listStr;
			}
		}
		
		this.filter = new Filter();
		this.pagination = new Pagination(10);
		this.paginate();
		
		if (this.crudService.primaryKey == "id" && (id != 0 || editMode == true)) {
			this.fields["id"].hiden = true;
		}
		
		if (this.crudService.params.template != undefined) {
			this.template = "templates/impl/crud-" + this.crudService.params.template + ".html";
		} else {
			this.template = "templates/crud-model_form_body.html";
		}
	}

	setFieldOptions(fieldName, list) {
		var field = this.fields[fieldName];
		
		if (field != undefined) {
			if (field.crudService != undefined) {
				field.filterResultsStr = field.crudService.buildListStr(list);
			} else {
				field.filterResultsStr = list;
			}
		}
	}
	
	setFieldId(fieldName, str) {
    	var pos = str.indexOf(" - ");
		var id = str.substring(0, pos);
		var crudService = this.fields[fieldName].crudService; 
		
		if (crudService != undefined) {
			id = crudService.primaryKeyTypeConvert(id);
		}
		
		this.instance[fieldName] = id;
		
		if (this.selectCallback != undefined && this.selectCallback != null) {
			this.selectCallback(fieldName, this.instance[fieldName]);
		}
	}
	
	isClean() {
		return angular.equals(this.original, this.instance);
	}
	
	clear(form) {
		if (form != undefined) {
			  form.$setPristine();
//			  form.$setUntouched();
		}

		this.instance = {};
		
		for (var fieldName in this.fields) {
			var field = this.fields[fieldName];
			field.externalReferencesStr = undefined;
			
			if (field.type == "i" && field.defaultValue != undefined) {
				this.instance[fieldName] = Number.parseInt(field.defaultValue);
			} else {
				this.instance[fieldName] = field.defaultValue;
			}
		}
	}
	
	goToView(id) {
		var url = "/app/" + this.crudService.path + "/" + this.dbId + "/" + id + "/0";
		this.$location.path(url);
	}
	
	goToEdit(id) {
		var url = "/app/" + this.crudService.path + "/" + this.dbId + "/" + id + "/1";
		this.$location.path(url);
	}
	
	goToNew() {
		var url = "/app/" + this.crudService.path + "/" + this.dbId + "/0/1";
		this.$location.path(url);
	}
	
    goToField(obj, fieldName, edit) {
    	var valRef = obj[fieldName];
    	var service = this.fields[fieldName].crudService;
    	var ret = "";
    	
		if (service != undefined) {
			// neste caso, valRef contém o id do registro de referência
			ret = "#/app/" + service.path + "/0/" + valRef;
		} else {
			ret = "#/app/" + this.crudService.path + "/0/" + obj[this.crudService.primaryKey];
		}
		
		if (edit == true) {
			ret = ret + "/1";
		} else {
			ret = ret + "/0";
		}
    	
    	return ret;
    }
    
	goToSearch() {
		var url = "/app/" + this.crudService.path + "/" + this.dbId + "/0/0";
		this.$location.path(url);
	}

	remove(id) {
		if (id == undefined) {
			id = this.id;
		}
		
		var scope = this;
		
		var callback = function(data) {
			if (scope.removeCallback != undefined) {
				scope.removeCallback();
			} else {
				scope.goToSearch();
			}
		}
		
		this.crudService.remove({id: id}, callback);
	}
	
	save(forceReload) {
		for (var fieldName in this.fields) {
			var field = this.fields[fieldName];
			// primeiro, parseia as flags
			if (field.flagsInstance != undefined) {
				// field.flags -> tipagem : String[]
				// field.flagsInstance -> tipagem : Boolean[]
				this.instance[fieldName] = Utils.flagsToStrAsciiHex(field.flagsInstance);
			}
			// depois parseia os campos json
			if (field.strJson != undefined) {
				this.instance[fieldName] = field.strJson;
			}
		}
		
		var scope = this;
		
		var callback = function(data) {
			if (scope.saveCallback != undefined) {
				scope.saveCallback();
			} else if (forceReload != true && scope.crudService.params.saveAndExit == true) {
				scope.goToSearch();
			} else {
				scope.goToEdit(data[scope.crudService.primaryKey]);
			}
		}
		
		if (this.id != "0") {
			this.crudService.update({id: this.id}, this.instance, callback);
		} else {
			this.instance[this.crudService.primaryKey] = undefined;
			this.crudService.save({}, this.instance, callback);
		}
	}
	
	saveAsNew() {
		this.id = "0";
		this.save(true);
	}

	paginate() {
		this.pagination.process(this.filterResults);
	}
	
	getFilteredItems(objFilter) {
		var list = [];
		
		if (objFilter != undefined && objFilter != null) {
			list = this.filter.process(objFilter, this.crudService.list);
		} else {
			list = this.list;
		}
		
		return list;
	}
	
	clearFilter() {
		if (this.filterResults != this.crudService.list) {
			this.filterResults = this.crudService.list;
			this.filterResultsStr = this.crudService.listStr;
			this.paginate();
		}
	}
	
	applyFilter(obj, callback) {
		this.filterResults = this.getFilteredItems(obj);
		this.filterResultsStr = this.crudService.buildListStr(this.filterResults);
		this.paginate();
        
    	if (callback != null) {
        	callback(this.filterResults);
    	}
	}
}

class CrudItem extends CrudCommom {

	constructor($location, serviceManager, serviceName, fieldName, fieldValue, title, numMaxItems, queryCallback, selectCallback) {
    	super($location, serviceManager, serviceName, 0, 0, 1);
		this.title = title;
		this.numMaxItems = (numMaxItems != undefined && numMaxItems != null) ? numMaxItems : 999;
		this.queryCallback = queryCallback;
		this.selectCallback = selectCallback;
		this.fields[fieldName].hiden = true;
		this.fieldName = fieldName;
		this.fieldValue = fieldValue;
		this.query();
	}
	
	removeCallback() {
		this.query();
	}

	saveCallback() {
		this.query();
	}

	query() {
		var objFilter = {}
		objFilter[this.fieldName] = this.fieldValue;
		this.filterResults = Filter.process(objFilter, this.crudService.list);
		// pagina e monta a listStr
		this.paginate();
		
		if (this.queryCallback != undefined && this.queryCallback != null) {
			this.queryCallback(this.filterResults);
		}
		// aproveita e limpa os campos de inserção de novo instance
		this.clear();
		this.instance[this.fieldName] = this.fieldValue;
	}

}

class CrudBase extends CrudCommom {

	constructor($scope, $location, serviceManager, serviceName, dbId, id, editMode) {
    	super($location, serviceManager, serviceName, dbId, id, editMode);
		this.$scope = $scope;
		this.editMode = editMode == undefined ? 0 : editMode;
		this.listItemCrud = [];
		this.listItemCrudJson = [];
		
		this.message = {};
		this.disabled = false;
		this.isCollapsedForm = false;
		this.clear();
		this.required = "false";
		
		if (this.id == "0") {
			if (this.editMode == "0") {
				this.templateModel = "templates/crud-model_search.html";
				this.isCollapsedForm = true;
				// TODO : paginate
			} else {
				this.templateModel = "templates/crud-model_new.html";
				this.required = "true";
			}
		} else {
			if (this.editMode == "0") {
				this.templateModel = "templates/crud-model_view.html";
			} else {
				this.templateModel = "templates/crud-model_edit.html";
				this.required = "true";
			}
			
			this.get(this.id);
		}
	}
	
	setValue(fieldName, fieldValue) {
		var field = this.crudService.params.fields[fieldName];
		
		if (field.service != undefined) {
			var service = this.serviceManager.services[field.service];
			this.fields[fieldName].externalReferencesStr = service.getStrFromId(fieldValue);				
		}
		// field.flags -> tipagem : String[]
		if (field.flags != undefined) {
			this.flags[fieldName] = Utils.strAsciiHexToFlags(fieldValue);
		}
		
		this.instance[fieldName] = fieldValue;
	}

	// o CrudService decide se vai fazer o get online ou offline
	get(restId) {
		var scope = this;
		
		var successCallback = function(data) {
			scope.original = data;
			scope.instance = angular.copy(data);
			scope.isCollapsedForm = false;
			// atualiza as strings de referência
			for (var fieldName in scope.crudService.params.fields) {
				var fieldValue = scope.instance[fieldName];
				scope.setValue(fieldName, fieldValue);
			}
			
			if (scope.getCallback != undefined) {
				scope.getCallback(data);
			}
		};
		
		this.crudService.get({id: restId}, successCallback);
	}
	
	applyFilter() {
		this.applyFilter(this.instance);
	}

}

class CrudController extends CrudBase {

    constructor($scope, $location, serviceManager) {
    	serviceManager.isCollapsed = true;
    	serviceManager.setActiveControllerScope($scope);
		var path = $location.$$path;
		var list = path.split('/');
		var editMode = list[list.length-1];
		var id = list[list.length-2];
		var dbId = list[list.length-3];
		var serviceName = Utils.convertCaseUnderscoreToCamel(list[list.length-4]);
		id = serviceManager.services[serviceName].primaryKeyTypeConvert(id);
    	super($scope, $location, serviceManager, serviceName, dbId, id, editMode);
    }

    static factory($scope, $location, ServiceManagerService) {
    	return new CrudController($scope, $location, ServiceManagerService);
    }
    
}

class CrudItemJson {
//	var fields = {
//			"type":{"options":["integer", "string", "password", "datetime", "date", "hour"]},
//			"service":{},
//			"defaultValue":{},
//			"hiden":{},
//			"readOnly":{}
//			};
	
// objItems = {"id":{"type":"i"},"menu":{},"name":{},"filterFields":{},"fields":{"readOnly":true}}	
	
	// obj, this.instance.fields, "Campos dos formulários"
	constructor(fields, instanceExternal, fieldNameExternal, title, nameOptions) {
		this.fields = angular.copy(fields);
		this.instanceExternal = instanceExternal;
		this.fieldNameExternal = fieldNameExternal;
		this.formId = this.fieldNameExternal;
		this.title = title;
		this.nameOptionsOriginal = nameOptions;
		this.list = [];
		
		for (var fieldName in this.fields) {
			var field = this.fields[fieldName];
			field._label = Utils.convertCaseAnyToLabel(fieldName);
		}
		
		var objItems = JSON.parse(this.instanceExternal[this.fieldNameExternal]);
		
		for (var itemName in objItems) {
			var objItem = objItems[itemName];
			var item = {};
			item._name = itemName;
			
			for (var fieldName in this.fields) {
				var field = this.fields[fieldName];
				item[fieldName] = objItem[fieldName];
			}
			
			this.list.push(item);
		}
		
		this.clear();
	}
	
	clear(form) {
		if (form != undefined) {
			  form.$setPristine();
//			  form.$setUntouched();
		}
		
		if (this.nameOptionsOriginal != undefined) {
			this.nameOptions = angular.copy(this.nameOptionsOriginal);
			
			for (var item of this.list) {
				var index = Utils.findInList(this.nameOptions, item._name);
				
				if (index >= 0) {
					this.nameOptions.splice(index, 1);
				}
			}
		}

		this.instance = {_name:""};
		
		for (var fieldName in this.fields) {
			var field = this.fields[fieldName];
			
			if (field.type == "i" && field.defaultValue != undefined) {
				this.instance[fieldName] = Number.parseInt(field.defaultValue);
			} else {
				this.instance[fieldName] = field.defaultValue;
			}
		}
	}
	
	// private, use in addItem, updateItem and removeItem
	updateExternal() {
		var objItems = {};
		
		for (let item of this.list) {
			objItems[item._name] = Utils.clone(item, Object.keys(this.fields));
		}
		
		this.instanceExternal[this.fieldNameExternal] = JSON.stringify(objItems);
	}
	
	save() {
		// já verifica se é um item novo ou um update
		var isNewItem = true;

		for (var i = 0; i < this.list.length; i++) {
			var item = this.list[i];
			
			if (item._name == this.instance._name) {
				this.list[i] = this.instance;
				isNewItem = false;
				break;
			}
		}

		if (isNewItem == true) {
			this.list.push(this.instance);
		}
		
		this.updateExternal();
		this.clear();
	}

	remove(index) {
		this.list.splice(index, 1);
		this.updateExternal();
	}

	edit(index) {
		var item = this.list[index];
		this.instance = angular.copy(item);
	}

	moveUp(index) {
		if (index > 0) {
			var tmp = this.list[index-1];
			this.list[index-1] = this.list[index];
			this.list[index] = tmp;
		}
		
		this.updateExternal();
	}

	moveDown(index) {
		if (index < (this.list.length-1)) {
			var tmp = this.list[index+1];
			this.list[index+1] = this.list[index];
			this.list[index] = tmp;
		}
		
		this.updateExternal();
	}

}
