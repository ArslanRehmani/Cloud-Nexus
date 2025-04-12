/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record'], function (log, search, record) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var allInternalIdArray = [];
            var allINternalIdSearch = search.load({
                id: 'customsearch794'
            });
            var allResults = [];
            var startIndex = 0;
            var RANGECOUNT = 1000;
            do {
                var pagedResults = allINternalIdSearch.run().getRange({
                    start: parseInt(startIndex),
                    end: parseInt(startIndex + RANGECOUNT)
                });
                allResults = allResults.concat(pagedResults);
                var pagedResultsCount = pagedResults != null ? pagedResults.length : 0;
                startIndex += pagedResultsCount;
            }
            while (pagedResultsCount == RANGECOUNT);
            var internalIdArray = [];
            for (var k = 0; k < allResults.length; k++) {
                var result = allResults[k];
                obj = {};
                obj.id = result.getValue({name: 'internalid'});
                internalIdArray.push(obj);
            }
            for (var j = 0; j < internalIdArray.length; j++) {
                var recordID = internalIdArray[j];
                var allRecordsIDs = Object.keys(recordID).map(function (k) { return recordID[k] }).join(",");
                allInternalIdArray.push(allRecordsIDs);
            }
            log.debug('allInternalIdArray', allInternalIdArray);
            return allInternalIdArray || [];
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function map(context) {
        var title = 'map(::)';
        try {
            var data = JSON.parse(context.value);
            var featureRecord = record.delete({
                type: 'customrecord_rec_opened',
                id: data,
               });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function reduce(context) {

    }

    function summarize(summary) {

    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
