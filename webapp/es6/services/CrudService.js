'use strict';

class CrudService {
	
	constructor($resource, path, searchFields) {
        console.log("[CrudService] constructor : path = " + path + ", searchFields = " + searchFields);
        this.path = path;
        this.searchFields = searchFields;
    	var restPath = 'rest/private/:path/:method/:id';
    	// necessário para rodar em porta diferente do webservice,
    	// por exemplo quando as páginas estão hospedadas em nodejs e o rest está em j2ee)
//        if ($location != undefined && $location.$$port != 443 && $location.$$port != 8443 && $location.$$port != 8444) {
//        	restPath = '/' + restPath;
//        }
        
    	var paramDefaults = {path: path};
	    this.resource = $resource(restPath, paramDefaults, {
	    	'postResponseText': {method:'POST', transformResponse: function(data) {return {content: data};}},
	    	'getResponseText': {method:'GET', transformResponse: function(data) {return {content: data};}},
	    	'update': {method:'PUT'}
	    });
	    
		this.query({});
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
	
	get(restParams, externalSuccessCallback, externalErrorCallback) {
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] get : successCallback : response : " + JSON.stringify(response));
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
    	this.resource.get(restParams, successCallback, errorCallback);
	}
	
	save(restParams, dataOut, externalSuccessCallback, externalErrorCallback) {
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] save : successCallback : response : " + JSON.stringify(response));
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
    	this.resource.save(restParams, dataOut, successCallback, errorCallback);
	}
	
	update(restParams, dataOut, externalSuccessCallback, externalErrorCallback) {
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] update : successCallback : response : " + JSON.stringify(response));
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
    	this.resource.update(restParams, dataOut, successCallback, errorCallback);
	}
	
	remove(restParams, externalSuccessCallback, externalErrorCallback) {
        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] remove : successCallback : response : " + JSON.stringify(response));
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
    	this.resource.remove(restParams, successCallback, errorCallback);
	}
	
	query(restParams, externalSuccessCallback, externalErrorCallback) {
	    var scope = this;

        var successCallback = function(response, responseHeaders) {
            console.log("[CrudService] query : successCallback", scope.path);
			scope.list = response;
			
			if (scope.searchFields != undefined) {
	    		scope.listStr = CrudService.getListStr(response, scope.searchFields);
			}
            
        	if (externalSuccessCallback != null) {
            	externalSuccessCallback(response, responseHeaders);
        	}
        };
  	
        var errorCallback = function(response) {
            console.log("[CrudService] query : errorCallback");
            
        	if (externalErrorCallback != null) {
        		externalErrorCallback(response);
        	}
        };
        
        console.log("[CrudService] query : params :", restParams);
    	this.resource.query(restParams, successCallback, errorCallback);
	}
	
	getStrFromId(id) {
		var str = "";
		
		for (var i = 0; i < this.listStr.length; i++) {
			var _str = this.listStr[i];
			var _id = CrudService.getId(_str);
			
			if (_id == id) {
				str = _str;
				break;
			}
		}
		
		return str;
	}
    
    static getId(str) {
    	var pos = str.indexOf(" - ");
		var id = str.substring(0, pos);
    	return id;
    }
    
    static getStr(item, fields) {
		var str = "";
		
		for (var i = 0; i < fields.length; i++) {
			var field = fields[i];
			str = str + item[field] + " - ";
		}
		
    	
    	return str;
    }

    static getListStr(list, fields) {
    	var ret = [];
    	
    	for (var i = 0; i < list.length; i++) {
    		ret.push(CrudService.getStr(list[i], fields));
    	}
    	
    	return ret;
    }
}
