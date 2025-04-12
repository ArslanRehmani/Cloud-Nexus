/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
 define(['N/search', 'N/record', 'N/ui/serverWidget', 'N/runtime', 'N/render'],
 /**
  * @param{search} search
  * @param{record} record
  */
 function(search, record, serverWidget, runtime, render) {
     function beforeLoad(context) {
         try{
            if (context.type !== context.UserEventType.VIEW) {
            var contact= context.form.addField({
                id: 'custpage_ebiz_contact',
                label: 'Contact',
                type: serverWidget.FieldType.SELECT
            });
            var contactField = context.form.getField('custpage_ebiz_contact')
               context.form.insertField({
                field : contact,
                nextfield : 'custbody_cust_phone'
            });
            var contactUI = context.form.getField('custbody2');
           contactUI.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            }); 
        }
             }
        catch (e) {
             log.debug("Exception",e);
         }
     }
   function beforeSubmit(context){
    try{
        var currentRecord = context.newRecord;
        var shippingCost = currentRecord.getValue({
            fieldId : 'shippingcost'
        });
        if(shippingCost){
            currentRecord.setValue('custbody_shipping_cost',shippingCost);
        }
       if(currentRecord.type == 'salesorder'){ 
        currentRecord.setValue('custbody_door_insert_count','0');
        currentRecord.setValue('custbody_entry_door_count','0');
        var count = currentRecord.getLineCount({
            sublistId : 'item'
        });
        var doorInsertCount = 0;
        var entryDoorCount = 0;
        for(var i = 0; i<count; i++){
            var itemClass = currentRecord.getSublistValue({
                sublistId : 'item',
                fieldId : 'class',
                line : i
            });
            if(itemClass == '19'){
                doorInsertCount = 1
            }
            if(itemClass == '18'){
                entryDoorCount = 1
            }
        }
        currentRecord.setValue('custbody_door_insert_count',doorInsertCount);
        currentRecord.setValue('custbody_entry_door_count',entryDoorCount);
        }
    }
    catch(e){
        log.debug('Before Submit Exception',e);
    }
   }
   function afterSubmit(context){
    try{
    var currentRecord = context.newRecord;
    if(currentRecord.type == 'salesorder'){
        var transactionFile = render.transaction({
            entityId: currentRecord.id,
            printMode: render.PrintMode.PDF,
            inCustLocale: true
            });
            transactionFile.name = 'SO'+currentRecord.id+'.pdf';
            transactionFile.folder = '2607';
            var transactionFileId = transactionFile.save();
            record.attach({
                record:{
                    type:'file',
                    id:transactionFileId
                },
                to:{
                    type:'transaction', 
                    id:currentRecord.id
                }
            });
        }
    }
    catch(e){
        log.debug('After Submit Exception',e);
    }
   }
     return {
         beforeLoad:beforeLoad,
         beforeSubmit:beforeSubmit,
         afterSubmit : afterSubmit
        }

 });