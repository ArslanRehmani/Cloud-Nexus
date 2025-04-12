/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/log', 'N/currentRecord'], function (log, currentRecord) {
    function pageInit(context) {
        try {
        }
        catch (e) {
            log.error('Error', e.message);
        }
    }
    function fieldChanged(context) {
        try {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var fieldName = context.fieldId;
            var currIndex = currentRecord.getCurrentSublistIndex({
                sublistId: 'custpage_sublist'
            });
            if (sublistName === 'custpage_sublist' && fieldName === 'custpage_accept_reject') {

                var acceptRejectValue = currentRecord.getSublistValue({
                    sublistId: 'custpage_sublist',
                    fieldId: 'custpage_accept_reject',
                    line: currIndex
                });

                if (acceptRejectValue === 'accept' || !acceptRejectValue) {
                    currentRecord.getSublistField({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_rejection_reason',
                        line: currIndex
                    }).isDisabled = true;

                    currentRecord.setCurrentSublistValue({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_rejection_reason',
                        line: currIndex,
                        value: "",
                        ignoreFieldChange: true
                    });

                }

                else if (acceptRejectValue === 'reject') {

                    currentRecord.getSublistField({
                        sublistId: 'custpage_sublist',
                        fieldId: 'custpage_rejection_reason',
                        line: currIndex
                    }).isDisabled = false;

                }
            }
        } catch (e) {
            console.log('Error: ' + e.message);
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    };

});
