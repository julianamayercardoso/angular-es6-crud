'use strict';

class CrudService {
	
	constructor($resource, $location, serviceManager, params) {
		// params.fields = {"field": {"flags": ["label 1", "label 2", ...], "type": "text"}}
		params.fields = (params.fields != undefined && params.fields != null) ? JSON.parse(params.fields) : {};
		params.filterFields = (params.filterFields != undefined && params.filterFields != null) ? params.filterFields.split(",") : [];
        this.$resource = $resource;
        this.$location = $location;
        this.serviceManager = serviceManager;
        this.params = params;
        //
        this.path = Utils.convertCaseCamelToUnderscore(params.name);
		this.isOnLine = params.isOnLine;
        this.dbId = 0;
		this.label = (params.title == undefined || params.title == null) ? Utils.convertCaseAnyToLabel(this.path) : params.title;
		
		for (var fieldName in this.params.fields) {
			var field = this.params.fields[fieldName];
			var type = field.type;
			
			if (type == "b") {
				field.htmlType = "checkbox";
			} else if (type == "i") {
				field.htmlType = "number";
			} else if (type == "n") {
				field.htmlType = "number";
			} else if (type == "p") {
				field.htmlType = "password";
			} else {
				field.htmlType = "text";
			}
			
			var label = Utils.convertCaseAnyToLabel(fieldName);
			
			if (field.label == undefined) {
				field.label = label;
			}			
			
			console.log("[CrudService] path:", this.path, "- fieldName =", fieldName, "- field =", field);
		}

        console.log("[CrudService] constructor : path = " + this.path + ", fields = " + params.fields + ", filterFields = " + params.filterFields);
        
		if (this.params.fields == undefined) {
			this.primaryKey = "id";
		} else {
			this.primaryKey = Object.keys(this.params.fields)[0];
		}
		// filterFields
        this.filterFields = params.filterFields;
        // END PARAMS
        var restPath = CrudService.getRestPath($location);
    	var paramDefaults = {path: this.path, primaryKey: this.primaryKey};
	    this.resource = $resource(restPath, paramDefaults, {
	    	'postResponseText': {method:'POST', transformResponse: function(data) {return {content: data};}},
	    	'getResponseText': {method:'GET', transformResponse: function(data) {return {content: data};}},
	    	'update': {method:'PUT'}
	    });
	    
		this.list = [];
		this.listStr = [];
	}
	
	getStrFromId(id) {
		var str = "";
		
		for (var i = 0; i < this.list.length; i++) {
			var item = this.list[i];
			var _id = item[this.primaryKey];
			
			if (_id == id) {
				str = this.listStr[i];
				break;
			}
		}
		
		return str;
	}

	primaryKeyTypeConvert(value) {
		var type = this.params.fields[this.primaryKey].type;

		if (type == "i" && typeof value === "string") {
			value = parseInt(value);
		}

		return value;
	}
    
	onMessage(action, id) {
		if (action == "delete") {
            var pos = this.findById(this.list, id); 

            if (pos >= 0) {
            	this.list.splice(pos, 1);
            	this.listStr.splice(pos, 1);
                this.forceAngularScopeApply();
            }
		} else {
			this.getRemote({id: id});
		}
	}
	
	static getRestPath($location) {
    	var restPath = "rest/:path/:method/:id";
    	// necessário para rodar em porta diferente do webservice,
    	// por exemplo quando as páginas estão hospedadas em nodejs e o rest está em j2ee)
    	if ($location == undefined || $location == null || $location.$$protocol == "chrome-extension") {
        	restPath = 'https://localhost:8444/financialWeb/' + restPath;
    	} else if ($location.$$port != 443 && $location.$$port != 8443 && $location.$$port != 8444) {
        	restPath = '/' + restPath;
        }
    	
    	return restPath;
	}
	
    getStrValue(item, fieldName) {
    	var ret = "";
    	var value = item[fieldName];
    	var field = this.params.fields[fieldName];
    	
    	if (field == undefined) {
    		console.error("[CrudService]", this.params.name, ": don't found field :", fieldName);
    		return null;
    	}
    	
		var serviceName = field.service;
    	
		if (serviceName != undefined) {
			// neste caso, valRef contém o id do registro de referência
			var service = this.serviceManager.services[serviceName];
			var primaryKeyName = service.primaryKey; 
			var list = service.list;
	    	
	    	for (var i = 0; i < list.length; i++) {
	    		var _item = list[i];

	    		if (_item[primaryKeyName] == value) {
		    		ret = service.listStr[i];
	    			break;
	    		}
	    	}
		} else if (fieldName == "id") {
			ret = Utils.padLeft(value.toString(), 4, '0');
		} else {
			ret = value;
		}
    	
    	return ret;
    }
    
    buildItemStr(item) {
		var str = "";
		
		for (var fieldName of this.filterFields) {
			str = str + this.getStrValue(item, fieldName) + " - ";
		}
		
    	return str;
    }

    buildListStr(list) {
    	var ret = [];
    	
    	for (var i = 0; i < list.length; i++) {
    		var item = list[i];
    		var str = this.buildItemStr(item);
    		ret.push(str);
    	}
    	
    	return ret;
    }

	setDb(dbId) {
		this.dbId = dbId;
	}
	
	findById(list, id, callback) {
		var pos = -1;
		
        for (var i = 0; i < list.length; i++) {
        	var item = list[i];
        	var _id = item[this.primaryKey];
        	
        	if (_id == id) {
        		pos = i;
        		
        		if (callback != undefined && callback != null) {
        			callback(pos, item);
        		}
        		
        		break;
        	}
        }
        
        return pos;
	}
	
	postResponseText(restParams, dataOut, externalSuccessCallback, externalErrorCallback) {
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] postResponseText : successCallback");
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response.content, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
            console.log("[CrudService] postResponseText : errorCallback");
            
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
    	this.resource.postResponseText(restParams, dataOut, successCallback, errorCallback);
	}
	
	getResponseText(restParams, externalSuccessCallback, externalErrorCallback) {
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] getResponseText : successCallback");
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response.content, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
            console.log("[CrudService] getResponseText : errorCallback");
            
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
    	this.resource.getResponseText(restParams, successCallback, errorCallback);
	}
	
	getRemote(params, externalSuccessCallback, externalErrorCallback) {
        console.log("[CrudService] getRemote : params :", params);
	    var scope = this;

        var successCallback = function(item, responseHeaders) {
            console.log("[CrudService] getRemote : successCallback :", scope.path, params, "response :", JSON.stringify(item));
            var pos = scope.findById(scope.list, params.id); 

            if (pos >= 0) {
            	scope.list[pos] = item;
        		scope.listStr[pos] = scope.buildItemStr(item);
            } else {
            	scope.list.push(item);
        		scope.listStr.push(scope.buildItemStr(item));
            }
            
            scope.forceAngularScopeApply();
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(item, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
            console.log("[CrudService] getRemote : errorCallback");
            
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
        params.db = this.dbId;
    	this.resource.get(params, successCallback, errorCallback);
	}
	
	get(params, externalSuccessCallback, externalErrorCallback) {
        console.log("[CrudService] get : params :", params);
        var pos = this.findById(this.list, params.id); 

        if (pos < 0) {
        	this.getRemote(params, externalSuccessCallback, externalErrorCallback);
        } else {
        	if (externalSuccessCallback != null && externalSuccessCallback != undefined) {
            	externalSuccessCallback(this.list[pos]);
        	}
        }
	}
	
	save(restParams, itemSend, externalSuccessCallback, externalErrorCallback) {
	    var scope = this;

        var successCallback = function(itemReceived, responseHeaders) {
            console.log("[CrudService] save : successCallback : itemReceived : " + JSON.stringify(itemReceived));
    		scope.list.push(itemReceived);
    		scope.listStr.push(scope.buildItemStr(itemReceived));
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(itemReceived, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
        restParams.dbId = this.dbId;
        console.log("[CrudService] save : successCallback : itemSend : " + JSON.stringify(itemSend));
    	this.resource.save(restParams, itemSend, successCallback, errorCallback);
	}
	
	update(restParams, itemSend, externalSuccessCallback, externalErrorCallback) {
	    var scope = this;

        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] update : successCallback : response : " + JSON.stringify(response));
            
            scope.findById(scope.list, restParams.id, function(pos) {
            	scope.list[pos] = itemSend;
        		scope.listStr[pos] = scope.buildItemStr(itemSend);
            });
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
        restParams.dbId = this.dbId;
        // TODO : atualizar na lista se isOnLine
    	this.resource.update(restParams, itemSend, successCallback, errorCallback);
	}
	
	remove(restParams, externalSuccessCallback, externalErrorCallback) {
		var scope = this;
		
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] remove : successCallback : response : " + JSON.stringify(response));
            // depois que removeu no servidor, remove também na lista local
            scope.findById(scope.list, restParams.id, function(pos) {
        		scope.list.splice(pos, 1);
        		scope.listStr.splice(pos, 1);
                externalSuccessCallback(scope.list);
            });
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
        restParams.dbId = this.dbId;
    	this.resource.remove(restParams, successCallback, errorCallback);
	}
	
	forceAngularScopeApply() {
		if (this.serviceManager.activeControllerScope != undefined) {
			// TODO : verificar se o comportamento está funcionando
//			this.$scope.$apply();
//			this.$scope.$apply(function() {
//			});
		}
	}
	
	queryRemote(params, externalSuccessCallback, externalErrorCallback) {
//		var params = {fieldQuery:this.fieldId, valueQuery:this.id};
		if (params == undefined || params == null) {
			params = {};
		}
		
        console.log("[CrudService] query :", this.params.name, "- params :", params);
	    var scope = this;

        var successCallback = function(list, responseHeaders) {
            console.log("[CrudService] queryRemote : successCallback", scope.path, ",list.size =", list.length);
            scope.list = list;
    		scope.listStr = scope.buildListStr(scope.list);
            // também atualiza a lista de nomes de todos os serviços que dependem deste
			for (var serviceName in scope.serviceManager.services) {
				var service = scope.serviceManager.services[serviceName];
				
				for (var fieldName in service.params.fields) {
					var field = service.params.fields[fieldName];
					
					if (field.service == scope.params.name) {
			    		service.listStr = service.buildListStr(service.list);
						break;
					}
				}
			}
            
            if (externalSuccessCallback != undefined) {
	            externalSuccessCallback(scope.list);
            }
            
            scope.forceAngularScopeApply();
        };
  	
        var errorCallback = function(response) {
            console.log("[CrudService] query : errorCallback");
            
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
        params.db = this.dbId;
    	this.resource.query(params, successCallback, errorCallback);
	}

	query(params, externalSuccessCallback, externalErrorCallback) {
//		var params = {fieldQuery:this.fieldId, valueQuery:this.id};
        console.log("[CrudService] query : params :", params);
        // {primaryKey: this.primaryKey, dbId: this.dbId}
        // se this.isOnLine == false : apenas aplica o filtro e dispara o callback com a lista filtrada 
        if (this.isOnLine == true) {
        	this.queryRemote(params, externalSuccessCallback, externalErrorCallback)
        } else {
	        console.log("[CrudService] query : ERROR just On Line !!!");
        }
	}

}
