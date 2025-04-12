/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
 define(['N/log', 'N/file', 'N/record', 'N/format'], function (log, file, record, format) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var ifCsvData = file.load({ id: "SuiteScripts/MCM Customization/IF | CSV | Import Customization/MCM_INVOICE_REPORT CSV.csv" });
            var ifCsvDataArray = [];
            ifCsvData.lines.iterator().each(function (line) {
                var w = line.value.split(",");
                ifCsvDataArray.push({
                    internalId: w[0],
                    JobDate: w[1],
                    DTSERVICE: w[2],
                    DTPOSTCODE: w[3],
                    DTCBM: w[4],
                    DTITEMQTY: w[5],
                    DTGST: w[6],
                    DTINVOICENUMBER: w[7],
                    DTDR: w[8]
                    // DTS2A: w[9]
                });
                return true;
            });
            /* log.debug({
                 title: 'ifCsvDataArray',
                 details: ifCsvDataArray
             });*/
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return ifCsvDataArray;
        // return ifCsvDataArray[0];
    }

    function map(context) {
        var title = 'map(::)';
        try {
            var array = JSON.parse(context.value);
            var invoiceIdasNumber = /^\d+$/.test(array.internalId);
            if (!!array.internalId && !!invoiceIdasNumber) {
                // log.debug({
                //     title: 'array.JobDate',
                //     details: array.JobDate
                // });
                var itemFulfillObj = record.load({
                    type: 'itemfulfillment',
                    id: parseInt(array.internalId)
                });
                // itemFulfillObj.setValue({
                //     fieldId: 'custbody21',
                //     value: array.DTS2A
                // });
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_delivery_reference',
                    value: array.DTDR
                });
                var DTGST = '$' + array.DTGST;
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_charge',
                    value: DTGST
                });
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_inv_no',
                    value: array.DTINVOICENUMBER
                });
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_cbm',
                    value: array.DTCBM
                });
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_postcode',
                    value: array.DTPOSTCODE
                });
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_service',
                    value: array.DTSERVICE
                });
                itemFulfillObj.setValue({
                    fieldId: 'custbody_dt_item_qty',
                    value: array.DTITEMQTY
                });
                var d = (array.JobDate).toString();
                if (d) {
                    var a = d.split('/');
                    var dd = a[0];
                    var mm = a[1];
                    var yyyy = a[2];
                    var date = mm + '/' + dd + '/' + yyyy;
                    var date1 = new Date(date);
                }
                else {
                    date1 = '';
                }
                itemFulfillObj.setValue({
                    fieldId: 'custbodyms_despatch_date',
                    value: date1
                });
                var recordId = itemFulfillObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug({
                    title: 'recordId',
                    details: recordId
                });
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    return {
        getInputData: getInputData,
        map: map
    }
});
