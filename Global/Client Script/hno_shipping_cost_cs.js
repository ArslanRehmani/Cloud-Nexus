/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/dialog', 'N/currentRecord'], function (log, record, search, dialog, currentRecord) {

    function pageInit(context) {
        var title = 'pageInit[::]';
        try {
            var rec = context.currentRecord;

            var status = rec.getValue({ fieldId: 'custbody_hno_shipping_cost_status' });

            if (status == 2) {//Needs Checking

                var options = {
                    title: 'SKU csv Missing',
                    message: 'There are item(s) with blank shipping costs. Please ensure that File Cabinet > HNO Shipping Cost has the corresponding SKU csv file. Contact Account Manager to resolve.'
                };

                function success(result) {

                    log.debug({
                        title: 'Success with value ',
                        details: 'Success with value ' + result
                    });
                }

                function failure(reason) {

                    log.debug({
                        title: 'Failure: ',
                        details: 'Failure: ' + reason
                    });
                }

                dialog.alert(options).then(success).catch(failure);

                var ordertype = rec.getField({
                    fieldId: 'ordertype'
                });
                ordertype.isDisabled = true;
            }

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    // function saveRecord(context) {

    // }

    // function validateField(context) {

    // }

    function fieldChanged(context) {
        var title = 'fieldChanged[::]';
        try {
            var rec = context.currentRecord;

            var fieldId = context.fieldId;

            if (fieldId == 'custbody_hno_shipping_cost_status') {

                var status = rec.getValue({ fieldId: 'custbody_hno_shipping_cost_status' });

                var ordertype = rec.getField({
                    fieldId: 'ordertype'
                });

                if (status == 2) {//Needs Checking

                    ordertype.isDisabled = true;
                } else {
                    ordertype.isDisabled = false;
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    // function postSourcing(context) {

    // }

    // function lineInit(context) {

    // }

    // function validateDelete(context) {

    // }

    // function validateInsert(context) {

    // }

    // function validateLine(context) {

    // }

    // function sublistChanged(context) {

    // }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        fieldChanged: fieldChanged
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
