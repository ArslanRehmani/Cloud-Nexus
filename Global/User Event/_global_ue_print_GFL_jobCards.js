/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search'], function (record, log, search) {
    /**
     * Entry point function
     * @param context
     */
    function beforeLoad(context) {
        var title = 'beforeLoad(::)';
        try {
            var currentRecord, recID, type;
            currentRecord = context.newRecord;
            recID = currentRecord.id;
            type = currentRecord.getValue({fieldId : 'custrecord_gfl_job_card_type'});
            if (context.type == context.UserEventType.VIEW) {
                if(type == '1' || type == '3'){
                    addbutton(context, recID);
                }
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    /**
     * This function calls CS script and call printGFLjobCard function
     * @param context
     * @param recID 
     */
    function addbutton(context, recID) {
        var title = 'addbutton(::)';
        try {
            log.debug('addbutton recID', recID);
            var form = context.form;
            form.clientScriptFileId = 20099216;
            form.addButton({ id: "custpage_printgfl_job_card", label: "Print GFL Job Card", functionName: "printGFLjobCard(' " + recID + "')" });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    return {
        beforeLoad: beforeLoad
    }
});
