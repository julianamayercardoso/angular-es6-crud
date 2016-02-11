'use strict';

class CrudController {

	constructor(crudService, fields, $location) {
		this.crudService = crudService;
		this.path = $location.$$path;
		var list = this.path.split('/');
		this.editMode = list[list.length-1];
		this.id = list[list.length-2];
		this.dbId = list[list.length-3];
		this.name = list[list.length-4];
		this.title = CrudController.convertToLabel(this.name);
		this.fields = fields;
		this.labels = [];
		this.listItemCrud = [];

		for (var i = 0; i < fields.length; i++) {
			this.labels[i] = CrudController.convertToLabel(fields[i]);
		}

		this.template = "templates/impl/crud-" + this.name + ".html";
		
		if (fields == undefined || fields.length == 0) {
			this.primaryKey = "id";
		} else {
			this.primaryKey = fields[0];
		}
		
		this.$location = $location;
		this.message = {};
		this.searchResults = [];
		this.filteredResults = [];
		this.instance = this.instance || {};
		this.disabled = false;
		this.isCollapsedForm = false;
		this.clear();
		this.required = "false";
		this.filter = new Filter();
		this.pagination = new Pagination(10);
		this.saveAndExit = true;
		
		if (this.id == "0") {
			if (this.editMode == "0") {
				this.templateModel = "templates/crud-model_search.html";
				this.isCollapsedForm = true;
				// TODO : implementar o WebSocket no CrudService
				this.query();
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
	
	isClean() {
		return angular.equals(this.original, this.instance);
	}
	
	clear(form) {
		if (form) {
			  form.$setPristine();
//			  form.$setUntouched();
		}

		this.instance = {};
	}
	
	goToView(id) {
		var url = "/app/" + this.name + "/" + this.dbId + "/" + id + "/0";
		this.$location.path(url);
	}
	
	goToEdit(id) {
		var url = "/app/" + this.name + "/" + this.dbId + "/" + id + "/1";
		this.$location.path(url);
	}
	
	goToNew() {
		var url = "/app/" + this.name + "/" + this.dbId + "/0/1";
		this.$location.path(url);
	}
	
	goToSearch() {
		var url = "/app/" + this.name + "/" + this.dbId + "/0/0";
		this.$location.path(url);
	}

	remove() {
		this.crudService.remove({id: this.id, primaryKey: this.primaryKey, dbId: this.dbId}, this.goToSearch());
	}

	save() {
		var scope = this;
		
		var goTo = function(data) {
			if (scope.saveAndExit == true) {
				scope.goToSearch();
			} else {
				scope.goToEdit(data[scope.primaryKey]);
			}
		}
		
		if (this.id != "0") {
			this.crudService.update({id: this.id, primaryKey: this.primaryKey, dbId: this.dbId}, this.instance, goTo);
		} else {
			this.instance[this.primaryKey] = undefined;
			this.crudService.save({primaryKey: this.primaryKey, dbId: this.dbId}, this.instance, goTo);
		}
	}
	
	saveAsNew() {
		this.id = "0";
		this.save();
	}
	
	get(restId) {
		var scope = this;
		
		var successCallback = function(data){
			scope.original = data;
			scope.instance = angular.copy(data);
			scope.isCollapsedForm = false;
			
			if (scope.getCallback != undefined) {
				scope.getCallback(data);
			}
		};
		
		var errorCallback = function(scope) {
			if (scope.getCallbackError != undefined) {
				scope.getCallbackError(data);
			}
		};
		
		this.crudService.get({id: restId, primaryKey: this.primaryKey, dbId: this.dbId}, successCallback, errorCallback);
	}
	
	applyFilter() {
		this.filterResults = this.filter.process(this.instance, this.searchResults);
		this.pagination.process(this.filterResults);
	}

	query() {
		var scope = this;
		
		var successCallback = function(data) {
			scope.filterResults = scope.searchResults = data;
			scope.pagination.process(scope.filterResults);
		}
		
		var errorCallback = function(scope) {
			if (scope.queryCallbackError != undefined) {
				scope.queryCallbackError(data);
			}
		};
		
		this.crudService.query({primaryKey: this.primaryKey, dbId: this.dbId}, successCallback, errorCallback);
	}
	
	setFieldId(field, str) {
		this.instance[field] = CrudService.getId(str)
	}

	static convertToLabel(str) {
		var ret = "";
		var nextIsUpper = true;
		
		for (var i = 0; i < str.length; i++) {
			var ch = str[i];
			
			if (nextIsUpper == true) {
				ret = ret + ch.toUpperCase();
				nextIsUpper = false;
			} else if (ch >= 'A' && ch <= 'Z') {
				ret = ret + ' ' + ch;
			} else if (ch == '-' || ch == '_') {
				ret = ret + ' ';
				nextIsUpper = true;
			} else {
				ret = ret + ch;
			}
		}
		
		return ret;
	}
}
