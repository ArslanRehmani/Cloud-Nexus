/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(['N/log', 'N/record', 'N/redirect'],
 /**
  * @param {log} log
  * @param {record} record
  */
 function(log, record, redirect) {
    
     /**
      * Definition of the Suitelet script trigger point.
      *
      * @param {Object} context
      * @param {ServerRequest} context.request - Encapsulation of the incoming request
      * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
      * @Since 2015.2
      */
     function onRequest(context) {
       try{
         var requestparam = context.request.parameters;
 
         log.debug({
             title: 'Parameter: donationRecord',
             details: requestparam.customerid
         });
       
        log.debug({
             title: 'Parameter: recordType',
             details: requestparam.recordType
         });
       
        log.debug({
             title: 'Parameter: donationRecord',
             details: requestparam.donationRecord
         });

         
        
         // Refresh Entity record 
         var donorRecord = record.load({
             type: record.Type.CUSTOMER,
             id: requestparam.customerid
         });
         donorRecord.save();
        
         redirect.toRecord({
            type : requestparam.recordType,
            id : requestparam.donationRecord,
            isEditMode: false
        });
       }catch(e){
         log.error('ERROR', e);
       }
         
 
        
     }
 
     return {
         onRequest: onRequest
     };
     
 });
 