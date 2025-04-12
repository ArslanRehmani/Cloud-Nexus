/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/runtime','N/record'], function (log, runtime,record) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var poId = runtime.getCurrentScript().getParameter({
                name: 'custscript_pims_selected_po_id'
            });
            var poIdArray = JSON.parse(poId);
            log.debug({
                title: 'poIdArray',
                details: poIdArray
            });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return poIdArray;
    }

    function map(context) {
        var title = 'map(::)';
        try {
            var poIdArrayMAP = JSON.parse(context.value);
            log.debug({
                title: 'poIdArrayMAP',
                details: poIdArrayMAP
            });
            var poID = poIdArrayMAP.id;
            var date = poIdArrayMAP.date;
            var billRecord = record.transform({
                fromType: record.Type.PURCHASE_ORDER,
                fromId: parseInt(poID),
                toType: record.Type.VENDOR_BILL
            });
            billRecord.setValue({
                fieldId: 'trandate',
                value: new Date(date)
            });
            // Save the new bill record
            var billId = billRecord.save({
                ignoreMandatoryFields: true
            });
            log.debug('selected billId', billId);
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
