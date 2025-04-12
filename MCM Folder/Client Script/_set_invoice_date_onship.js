/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search) {
        function fieldChanged(context) {
            try {
                var currentRecord = context.currentRecord;
                var fieldId = context.fieldId;
                if (fieldId == 'shipstatus') {
                    var status = currentRecord.getValue('shipstatus');
                    if (status == 'C') {
                        var shipSatatusDate = new Date();
                        thirdDayDate = shipSatatusDate.setDate(shipSatatusDate.getDate() + 3);
                        currentRecord.setValue('custbody_if_invoice_date', new Date(thirdDayDate));
                    }
                    else{
                        currentRecord.setValue('custbody_if_invoice_date', '');

                    }
                }
            }
            catch (e) {
                log.debug('Exception', e);
            }

        }

        return {
            fieldChanged: fieldChanged
        };

    });
