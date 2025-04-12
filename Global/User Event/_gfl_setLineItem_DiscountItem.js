/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (log, record, runtime, search) => {

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            var title = 'afterSubmit[::]';
            try {
                var rec = scriptContext.newRecord;
                var lineCount = rec.getLineCount({
                    sublistId: 'item'
                });
                if(lineCount > 0){
                    for(var m = 0; m<=lineCount; m++){
                        var getDiscountItem = rec.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'itemtype',
                            line: m
                        });
                        log.debug({
                            title: 'getDiscountItem',
                            details: getDiscountItem
                        });
                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return { afterSubmit }

    });
