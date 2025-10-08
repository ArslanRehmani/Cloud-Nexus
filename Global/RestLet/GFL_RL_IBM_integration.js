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
            var title = 'doGet[::]';
            
            try {
                //netsuite ka data dosri app mn bhej raha ho mn
                // return requestParams.ssid;
                var dataType = requestParams.type;
                var offset = requestParams.offset;
                var date = requestParams.date;
                if (dataType == 'item') {
                    log.debug({
                        title: 'Item Data',
                        details: 'Yes'
                    });
                    var data = returnDataFromNS('customsearch3299',offset, date, dataType);
                    return data;
                } else if(dataType == 'itemFulfilment'){
                    log.debug({
                        title: 'Item Fulfilment Data',
                        details: 'Yes'
                    });
                    var data = returnDataFromNS('customsearch3300',offset, date, dataType);
                    return data;
                } else if(dataType == 'salesOrder'){
                    log.debug({
                        title: 'Sales Order Data',
                        details: 'Yes'
                    });
                    var data = returnDataFromNS('customsearch3301',offset, date, dataType);
                    return data;
                } else if(dataType == 'purchaseOrder'){
                    log.debug({
                        title: 'Purchase Order Data',
                        details: 'Yes'
                    });
                    var data = returnDataFromNS('customsearch3304',offset, date, dataType);
                    return data;
                } else if(dataType == 'inventoryItem'){
                    log.debug({
                        title: 'Item Set Data',
                        details: 'Yes'
                    });
                    var data = returnDataFromNS('customsearch3305',offset, date, dataType);
                    return data;
                } else {
                    return "Connection Successful! With No Data"
                }
            } catch (e) {
                log.error(title + e.name, e.message);
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
            var title = 'doPut[::]';
            try {
                // type code
            } catch (e) {
                log.error(title + e.name, e.message);
            }

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
            var title = 'doPost[::]';
            try {
                // log.debug('Hello, World', requestBody);
                // return JSON.stringify("HEllo");
                //netsuite save 
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        /**
         * Function called upon sending a DELETE request to the RESTlet.
         *
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function doDelete(requestParams) {
            var title = 'doDelete[::]';
            try {
                // type code
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function returnDataFromNS(searchId, offset, date, dataType){
            var title = 'returnDataFromNS[::]';
            var result;
            try {
            var nsQuery = search.load({
                id: searchId
            });
            if(date){

                if(dataType == 'item'){
                    var searchFilters = nsQuery.filters;
                    searchFilters.push(search.createFilter({
                        name: 'created',
                        operator: search.Operator.ONORAFTER,
                        values: [date]
                    }));
                }else if (dataType == 'itemFulfilment' || dataType == 'salesOrder' || dataType == 'purchaseOrder' || dataType == 'inventoryItem'){
                    var searchFilters = nsQuery.filters;
                    searchFilters.push(search.createFilter({
                        name: 'datecreated',
                        operator: search.Operator.ONORAFTER,
                        values: [date]
                    }));
                }
                
            }
            var savedSearchId = searchId;
            var PAGE_SIZE = 1000;
            var pageNo;
            var offset = offset;
            var totalPages = 0;
            var totalRecordsCount = 0;
            var resultLines = [];
            var results = [], label, columns, resultLine;

            var searchResultSet = nsQuery.runPaged({
                pageSize: PAGE_SIZE
            });

            // log.debug({
            //         title: "Search Result Set",
            //         details: searchResultSet
            // });
            pageNo = !!offset ? (offset / PAGE_SIZE) : 0;
            if (!!searchResultSet) {
                totalPages = searchResultSet.pageRanges.length;
                totalRecordsCount = searchResultSet.count;
            }
            log.debug({
                title: "Page No",
                details: pageNo
            });
            log.debug({
                title: "totalPages",
                details: totalPages
            });
            log.debug({
                title: "totalRecordsCount",
                details: totalRecordsCount
            });
            if (pageNo < 0 || pageNo >= totalPages) {
                totalPages = totalPages > 0 ? totalPages : 0;
                totalRecordsCount = totalRecordsCount > 0 ? totalRecordsCount : 0;
                resultLines = 0;
                //     throw error.create({
                //             name: 'INVALID OFFSET',
                //             message: 'Invalid offset'
                //     });
            }
            if (totalRecordsCount > 0) {
                var currentPage = searchResultSet.fetch(pageNo);
                log.debug({
                    title: "Current Page",
                    details: currentPage
                });
                if (savedSearchId) {
                    results = currentPage.data;
                } else {
                    results = currentPage.data.results;
                }
                if (!!results && results.length > 0) {
                    // log.debug({
                    //         title: "Results",
                    //         details: results
                    // });
                    columns = nsQuery.columns;
                    for (var i = 0; i < results.length; i++) {
                        resultLine = {};
                        lineResult = results[i];
                        if (savedSearchId) {
                            columns.forEach(function (column) {
                                if (lineResult.getText(column)) {
                                    resultLine[column.label] = lineResult.getText(column);
                                } else {
                                    resultLine[column.label] = lineResult.getValue(column);
                                }
                            });
                        }
                        else {
                            for (var c = 0; c < columns.length; c++) {
                                label = columns[c].label;
                                label = label.replace(/\s/g, "");
                                resultLine[label] = results[i].values[c];
                            }
                        }

                        resultLines.push(resultLine);
                    }
                }

            }
            // log.debug({
            //     title: 'resultLines(::)',
            //     details: resultLines
            // });
            log.debug({
                title: 'resultLines.length(::)',
                details: resultLines.length
            });

            result = {
                "data": {
                    totalPages: totalPages,
                    grandCountRecords: totalRecordsCount,
                    "lines": (!!resultLines ? resultLines.length : 0),
                    dataLines: resultLines
                }
            };

            
            } catch (e) {
            log.error(title + e.name, e.message);
            }
            // return "Connection Successful!"
            return result
        }

        return {
            'get': doGet,
            'put': doPut,
            'post': doPost,
            'delete': doDelete
        };

    });