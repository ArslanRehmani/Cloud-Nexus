/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/search', 'N/record'], function (log, search, record) {
    /**
    * @param{log} log
    * @param{search} search
    * @param{record} record
    */
    function afterSubmit(context) {
        var title = 'afterSubmit(::)';
        try {
            var newRec = context.newRecord;
            // var sublistName = context.sublistId;
            // var fieldName = context.fieldId;
            var recordType = newRec.type;
            log.debug('recordType', recordType);
            if (recordType === 'salesorder') {

                var nsRecordObj = record.load({
                    type: 'salesorder',
                    id: newRec.id
                });
                var customer = nsRecordObj.getValue({
                    fieldId: 'entity'
                });

                var exchangeRate = nsRecordObj.getValue({
                    fieldId: 'exchangerate'
                });
                var lineCount = nsRecordObj.getLineCount({
                    sublistId: 'item'
                });
                for (var p = 0; p < lineCount; p++) {

                    if (customer == '6913' || customer == '9577' || customer == '9579' || customer == '9578' || customer == '16568' || customer == '6918' || customer == '8862' || customer == '20487' || customer == '20486') {

                        nsRecordObj.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: '-1',
                            line: p
                        });
                        log.debug('YES', 'YES');
                        // log.debug('fieldName', fieldName);
                        // if (fieldName !== 'rate') { //  ||fieldName == 'averagecost'

                            var avgCost = nsRecordObj.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'averagecost',
                                line: p
                                // ignoreFieldChange: true
                            });
                            if (avgCost) {
                                var lineQty = nsRecordObj.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: p
                                    // ignoreFieldChange: true
                                });
                                //     log.debug('lineQty',lineQty);
                                //      log.debug('exchangeRate',exchangeRate);
                                if (exchangeRate != null) {
                                    var newRate = avgCost / exchangeRate;
                                } else {
                                    var newRate = avgCost;
                                }
                                var newAmount = newRate * lineQty;
                                //      log.debug('new average cost',newAmount);
                                nsRecordObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    value: newRate,
                                    line: p
                                });
                                nsRecordObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'location',
                                    value: nsRecordObj.getValue({ fieldId: 'location' }),
                                    line: p
                                });

                                nsRecordObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: newAmount,
                                    line: p
                                    //ignoreFieldChange: true
                                });
                                nsRecordObj.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: newAmount,
                                    line: p
                                    //ignoreFieldChange: true
                                });
                            }
                        // }
                        var forInvoicingGroup = nsRecordObj.getValue({
                            fieldId: 'forinvoicegrouping'
                        });

                        if (forInvoicingGroup) {
                            nsRecordObj.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_profit',
                                value: 0,
                                line: p
                            });
                        }
                    }
                }
                nsRecordObj.save();
            }
        } catch (e) {
            log.error('Exception ' + title, e.message);
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
