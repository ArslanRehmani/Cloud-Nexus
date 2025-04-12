/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/search'],
    /**
     * @param {search} search
     * @param {record} record
     */
    function (log, search) {

        /**
         * Function called upon sending a GET request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.1
         */
        function doGet(requestParams) {
            var title = 'doGet(::)';
            try {
                var pageNo = requestParams.page;
                var results = getCustomerList(pageNo);
                var result = {
                    "error": {
                        "code": "0",
                        "message": ""
                    },
                    "data": results
                };
                return JSON.stringify(result);
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
        }

        /**
         * Function called upon sending a PUT request to the RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPut(requestBody) {

        }

        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doPost(requestBody) {
            log.debug('Hello, World', requestBody);
            return JSON.stringify("HEllo");
            //netsuite save 
        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {

        }
        function getCustomerList(pageNo) {
            var title = 'getCustomerList(::)';
            var obj;
            var array = [];
            try {
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                        [
                            ["isinactive", "is", "F"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "datecreated", label: "Date Created" }),
                            search.createColumn({ name: "firstname", label: "First Name" })
                        ]
                });
                var startIndex = 0;
                var RANGECOUNT = 1000;
                if (pageNo) {
                    if (pageNo == 1) {
                        startIndex = 1000;
                    } else if (pageNo == 2) {
                        startIndex = 2000;
                    } else if (pageNo == 3) {
                        startIndex = 3000;
                    } else if (pageNo == 4) {
                        startIndex = 4000;
                    }
                }
                var pagedResults = customerSearchObj.run().getRange({
                    start: parseInt(startIndex),
                    end: parseInt(startIndex + RANGECOUNT)
                });
                for (var k = 0; k < pagedResults.length; k++) {
                    var result = pagedResults[k];
                    obj = {};
                    obj.dateCreated = result.getValue({ name: 'datecreated' });
                    obj.firstName = result.getValue({ name: 'firstname' });
                    array.push(obj);
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return array || [];
        }
        return {
            'get': doGet,
            'put': doPut,
            'post': doPost,
            'delete': doDelete
        };

    });