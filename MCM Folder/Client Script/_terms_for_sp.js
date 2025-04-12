/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
 define(['N/record', 'N/search'],
 /**
  * @param{record} record
  * @param{search} search
  */
 function(record, search) {
     function pageInit(context) {
         try{
          if(context.mode == 'create'){
         var currentRecord = context.currentRecord;
         var terms = currentRecord.getValue('terms');
         log.debug('terms',terms);
            if(terms == 14){
              currentRecord.setValue('custbody_sp_deposit_percent',100);
            }
            else if(terms == 7){
              currentRecord.setValue('custbody_sp_deposit_percent',50);
            }
            else{
               currentRecord.setValue('custbody_sp_deposit_percent','');
            }
          }
          }
        catch(e){
            log.debug('Exception',e);
        }
 
     }
   	   function fieldChanged(context){
             try{
         var currentRecord = context.currentRecord;
		var fieldId = context.fieldId;
        if(fieldId == 'terms'){
         var terms = currentRecord.getValue('terms');
         log.debug('terms',terms);
            if(terms == 14){
              currentRecord.setValue('custbody_sp_deposit_percent',100);
            }
             else if(terms == 7){
              currentRecord.setValue('custbody_sp_deposit_percent',50);
            }
           else{
               currentRecord.setValue('custbody_sp_deposit_percent','');
            }
          }
             }
        catch(e){
            log.debug('Exception',e);
        }
 
     }
   function saveRecord(context) {
      try {
        var currentRecord = context.currentRecord;
        var depositPercentage = currentRecord.getValue('custbody_sp_deposit_percent');
        if(depositPercentage == 50){
          var total = currentRecord.getValue('total');
          if(total){
            total = total/2;
            currentRecord.setValue('custbody_sp_deposit_amount',total);
          }
        }
          return true;
      }
      catch (e) {
        log.debug('Exception', e);
        return true;
      }

    }

     return {
        pageInit: pageInit,
       fieldChanged : fieldChanged,
       saveRecord : saveRecord
     };
     
 });
 