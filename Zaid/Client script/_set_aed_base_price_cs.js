/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['./_set_aed_price_helper'],

    (HELPER) => {
        const fieldChanged = (context) => {
            var title = 'fieldChanged(::)';
            try {
                var cr = context.currentRecord;
                var sublistid = context.sublistId;
                var fieldid = context.fieldId;
                if (sublistid == 'item' && fieldid == 'item') {
                    var itemId = cr.getCurrentSublistValue({
                        sublistId: sublistid,
                        fieldId: fieldid
                    });
                    HELPER.HELPERS.setAEDBasePriceCs(context, itemId);
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
        }

        return {
            fieldChanged
        }
    });
