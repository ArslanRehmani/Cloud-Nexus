/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

    function getInputData() {
        var title = 'titleName[::]';
        try {
            var trackLandedCost = search.load({
                id: 'customsearch3855'
            });

        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return trackLandedCost || [];
    }

    function map(context) {
        var title = 'titleName[::]';
        try {
            var searchResult = JSON.parse(context.value);
            log.debug("searchResult", searchResult)

            var internalId = searchResult.id;

            log.debug('Processing Item ID', internalId);

            updateRecordCheckbox(internalId);

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function updateRecordCheckbox(internalId) {
        try {
            var itemRecord = record.load({
                type: record.Type.INVENTORY_ITEM,
                id: internalId
            });

            itemRecord.setValue({
                fieldId: 'tracklandedcost',
                value: true
            });

            // Save the record
            itemRecord.save({
                ignoreMandatoryFields: true
            });

            log.debug('Track Landed Cost set to true for Item ID', internalId);
        } catch (e) {
            log.error('Error in updateRecordCheckbox function for Item ID ' + internalId, e.toString());
        }
    }

    function reduce(context) {
        // Optional: Implement reduce logic if needed
    }

    function summarize(summary) {
        try {

        } catch (e) {
            log.error('Error in summarize function', e.toString());
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
