/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log','N/record'], function(log,record) {

    function beforeSubmit(context) {
        var title = 'beforeSubmit(::)';
        try{
            var newValue = context.newRecord;
            var newStatus = newValue.getValue('shipstatus');
            log.debug({
                title: 'newStatus',
                details: newStatus
            });
          var invoiceDate = newValue.getValue('custbody_if_invoice_date');
                if(newStatus == 'C' && !invoiceDate){
                    var shipSatatusDate = new Date();
                        var thirdDayDate = shipSatatusDate.setDate(shipSatatusDate.getDate() + 3);
                        newValue.setValue('custbody_if_invoice_date', new Date(thirdDayDate));
                }else if(newStatus != 'C'){
                    newValue.setValue('custbody_if_invoice_date', '');
                }
        } catch(e) {
            log.debug('Exception ' +title, e.message);
        }
    }
    function afterSubmit(context) {
        var title = 'afterSubmit(::)';
        try{
            var rec = context.newRecord;
            var obj;
            var itemArray = [];
            if(context.type == context.UserEventType.CREATE){
                var createFromID = rec.getValue({
                    fieldId : 'createdfrom'
                });
                var createFrom = rec.getText({
                    fieldId : 'createdfrom'
                });
                var transferOrd = createFrom.substring(0, 8);
                if(!!transferOrd && transferOrd == 'Transfer' ){
                    var transferOrdOBJ = record.load({
                        type: 'transferorder',
                        id: createFromID
                    });
                    var toLocation = transferOrdOBJ.getValue({
                        fieldId: 'transferlocation'
                    });
                    if(!!toLocation && toLocation == '4'){
                        log.debug('test',toLocation);
                        var linCount = rec.getLineCount({
                            sublistId: 'item'
                        });
                        for(var i=0;i<linCount;i++){
                            obj = {};
                            obj.item = rec.getSublistValue({
                                sublistId:'item',
                                fieldId: 'item',
                                line: i
                            });
                            obj.qty = rec.getSublistValue({
                                sublistId:'item',
                                fieldId: 'quantity',
                                line: i
                            }); 
                            obj.location = rec.getSublistValue({
                                sublistId:'item',
                                fieldId: 'location',
                                line: i
                            }); 
                            itemArray.push(obj);
                        }
                    }
                    log.debug('itemArray',itemArray);
                    if(!!itemArray && itemArray.length){
                        var title = 'craeteRecord(::)';
                        try{
                            var itemAdjustment = record.create({
                                type: 'inventoryadjustment',
                                isDynamic: true
                            });
                            itemAdjustment.setValue({
                                fieldId: 'customform',
                                value: 10
                            });
                            itemAdjustment.setValue({
                                fieldId: 'trandate',
                                value: new Date()
                            });
                            itemAdjustment.setValue({
                                fieldId: 'account',
                                // value: 235,SB
                                value: 589,
                                ignoreFieldChange : true,
                                fireSlavingSync : true
                            });
                            //inventory:Object
                            itemAdjustment.selectNewLine({
                                sublistId: 'inventory'
                            });
                            for(var j=0;j<itemArray.length;j++){
                                itemAdjustment.setCurrentSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'item',
                                    value: parseInt(itemArray[j]['item']),
                                    ignoreFieldChange: true
                                });
                                itemAdjustment.setCurrentSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'location',
                                    value: parseInt(itemArray[j]['location']),
                                    ignoreFieldChange: true
                                });
                                itemAdjustment.setCurrentSublistValue({
                                    sublistId: 'inventory',
                                    fieldId: 'adjustqtyby',
                                    value: parseInt((itemArray[j]['qty'])*(-1)),
                                    ignoreFieldChange: true
                                });
                                itemAdjustment.commitLine({
                                    sublistId: 'inventory'
                                });
                            }
                            var recordId = itemAdjustment.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });
                            log.debug({
                                title: 'Record create In NetSuite  ID',
                                details: recordId
                            });
                        } catch(e) {
                            log.debug('Exception ' +title, e.message);
                        }
                    }
                }
            }

        } catch(e) {
            log.debug('Exception ' +title, e.message);
        }
        
    }
    return {
        beforeSubmit: beforeSubmit,
        afterSubmit:afterSubmit
    }
});
