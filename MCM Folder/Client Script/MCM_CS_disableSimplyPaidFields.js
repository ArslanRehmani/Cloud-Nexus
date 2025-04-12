/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'], function (log, record, search, runtime) {

    function fieldChanged(context) {
        var title = 'fieldChanged(::)';
        try {
            var currentRecord = context.currentRecord;
            var fieldId = context.fieldId;
            log.debug('fieldId',fieldId);
            if (fieldId == 'currency') {
                alert('working');
                // var customFormID = currentRecord.getValue({ fieldId: 'customform' });//205
                // var userObj = runtime.getCurrentUser();
                // log.debug('customFormID',customFormID);
                // log.debug('userObj',userObj);
            }

        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    return {
        fieldChanged: fieldChanged
    }
});
