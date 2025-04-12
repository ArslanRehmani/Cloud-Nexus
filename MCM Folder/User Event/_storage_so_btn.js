/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
 define(['N/search', 'N/record'],
 /**
  * @param{search} search
  * @param{record} record
  */
 function(search, record) {
     function beforeLoad(context) {
         try{
            var currentRecord = context.newRecord;
            var cid = currentRecord.id;
           	var shipStatus = currentRecord.getValue('shipstatus');
           	var storatgeEndDate = currentRecord.getValue('custbody_stoarge_end');
           	var storageStartDate = currentRecord.getValue('custbody_storage_start');
           	log.debug('shipStatus',shipStatus);
           	log.debug('storatgeEndDate',storatgeEndDate);
           	log.debug('storageStartDate',storageStartDate);
           	var soCreated = currentRecord.getValue('custbody_so_created');
            log.debug('soCreated',soCreated);
            if (context.type === context.UserEventType.VIEW && shipStatus != 'C' && !soCreated && !!storatgeEndDate && !!storageStartDate) {
                    context.form.addButton({
                        id : 'custpage_btn_storage_so',
                        label : 'Storage Sales Order',
                        functionName: 'storageSo("' + cid + '")'
                    });
                 context.form.clientScriptModulePath = "./storage_so_cs.js";
            }
             }
        catch (e) {
             log.debug("Exception",e);
         }
     }

     return {
         beforeLoad:beforeLoad
        }

 });