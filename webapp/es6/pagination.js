'use strict';

class Pagination {
	
    constructor(pageSize) {
    	this.pageSize = pageSize;
    	this.currentPage = 0;
    	this.numPages = 0;
    	this.pageRange = [];
    }

    process(list) {
        var result = Math.ceil(list.length/this.pageSize);
        this.numPages = (result == 0) ? 1 : result;
        this.pageRange = [];
        
        for(var i = 0; i < this.numPages; i++) {
        	this.pageRange.push(i);
        }
    }
    
    previous() {
        if (this.currentPage > 0) {
     	   this.currentPage--;
        }
     }
     
     next() {
        if (this.currentPage < (this.numPages - 1)) {
     	   this.currentPage++;
        }
     }
     
     setPage(n) {
     	this.currentPage = n;
     }

}
