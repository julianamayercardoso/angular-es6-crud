'use strict';

class Filter {
	
    matchObjectProperties(expectedObject, actualObject) {
        var flag = true;
        
        for(var key in expectedObject) {
            if(expectedObject.hasOwnProperty(key)) {
                var expectedProperty = expectedObject[key];
                
                if (expectedProperty == null || expectedProperty === "") {
                    continue;
                }
                
                var actualProperty = actualObject[key];
                
                if (angular.isUndefined(actualProperty)) {
                    continue;
                }
                
                if (actualProperty == null) {
                    flag = false;
                } else if (angular.isObject(expectedProperty)) {
                    flag = flag && matchObjectProperties(expectedProperty, actualProperty);
                } else {
                    flag = flag && (actualProperty.toString().indexOf(expectedProperty.toString()) != -1);
                }
            }
        }
        
        return flag;
    }

	process(expectedObject, list) {
    	var filteredResults = [];
        
        for (var ctr = 0; ctr < list.length; ctr++) {
            var actualObject = list[ctr];
            var flag = this.matchObjectProperties(expectedObject, actualObject);
            
            if (flag == true) {
            	filteredResults.push(actualObject);
            }
        }
        
        return filteredResults;
	}
	
}
	