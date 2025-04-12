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
     function saveRecord(context) {
         try {
             var currentRecord = context.currentRecord;
             var keyCustomer = currentRecord.getValue('custbody17');
             log.debug('Key Customer', keyCustomer);
             var earlyDelivery = currentRecord.getValue('custbody16');
             log.debug('earlyDelivery', earlyDelivery);
             var partShip = currentRecord.getValue('custbody15');
             log.debug('partShip', partShip);
             var leadTime = currentRecord.getValue('custbody14');
             log.debug('leadTime', leadTime);
             var notRequiredDate = currentRecord.getValue('custbody2');
             log.debug('notRequiredDate', notRequiredDate);
             var itemLineCount = currentRecord.getLineCount({
                 sublistId: 'item'
             });
             log.debug('itemLineCount', itemLineCount);
             for (var i = 0; i < itemLineCount; i++) {
                 currentRecord.selectLine({
                     sublistId: 'item',
                     line: i
                 });
                 if (!keyCustomer && !!earlyDelivery && !!partShip && !notRequiredDate) {
                     currentRecord.setCurrentSublistValue({
                         sublistId: 'item',
                         fieldId: 'orderallocationstrategy',
                         value: '3',
                         line: i,
                         ignoreFieldChange: true
                     });
                 }
                 else if (!keyCustomer && !!earlyDelivery && !partShip && !notRequiredDate) {
                     currentRecord.setCurrentSublistValue({
                         sublistId: 'item',
                         fieldId: 'orderallocationstrategy',
                         value: '6',
                         line: i,
                         ignoreFieldChange: true
                     });

                 }
                 else if (!keyCustomer && !earlyDelivery && !partShip && !!notRequiredDate) {
                     currentRecord.setCurrentSublistValue({
                         sublistId: 'item',
                         fieldId: 'orderallocationstrategy',
                         value: '5',
                         line: i,
                         ignoreFieldChange: true
                     });
                 }
                 else if (!!keyCustomer) {
                     currentRecord.setCurrentSublistValue({
                         sublistId: 'item',
                         fieldId: 'orderallocationstrategy',
                         value: '8',
                         line: i,
                         ignoreFieldChange: true
                     });
                 }
                 if(!!leadTime && !! notRequiredDate){
                    if(notRequiredDate.getTime() > leadTime.getTime()){
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'requesteddate',
                            value: notRequiredDate,
                            line: i,
                            ignoreFieldChange: true
                        });
                     }else{
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'requesteddate',
                            value: leadTime,
                            line: i,
                            ignoreFieldChange: true
                        });
                     }
                 }
                 if(!!notRequiredDate && !leadTime){
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'requesteddate',
                        value: notRequiredDate,
                        line: i,
                        ignoreFieldChange: true
                    });
                 }
                 if(!notRequiredDate && !!leadTime){
                    currentRecord.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'requesteddate',
                        value: leadTime,
                        line: i,
                        ignoreFieldChange: true
                    });
                 }
                 currentRecord.commitLine({
                     sublistId: 'item'
                 });

             }
             return true;
         }
         catch (e) {
             log.debug('Exception', e);
         }

     }

     return {
         saveRecord: saveRecord
     };

 });
