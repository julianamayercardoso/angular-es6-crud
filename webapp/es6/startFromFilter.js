'use strict';

angular.module('app').filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int

        var list = [];

        if (input != undefined) {
            list = input.slice(start);
        }

        return list;
    };
});