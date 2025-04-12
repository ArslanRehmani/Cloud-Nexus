/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
 define(['N/currentRecord','N/record', 'N/search'],
 /**
  * @param{currentRecord} currentRecord
  * @param{record} record
  * @param{search} search
  * @param {nsUrl} nsUrl
  * @param https
  */
 function(currentRecord,record, search){
     function pageInit(context) {
        
     }
 
     function storageSo(cid){
        try{
            var currentRecord =record.load({
                type : 'itemfulfillment',
                id : cid
            });
            var storageStartDate = currentRecord.getValue({
                fieldId : 'custbody_storage_start'
            });
            log.debug('storageStartDate',storageStartDate);
            var storageEndDate = currentRecord.getValue({
                fieldId : 'custbody_stoarge_end'
            });
            log.debug('storageEndDate',storageEndDate);

            var orderCBM = currentRecord.getValue({
                fieldId : 'custbody_order_cbm'
            });
            log.debug('orderCBM',orderCBM);

            var salesOrderId = currentRecord.getValue({
                fieldId : 'createdfrom'
            });
            log.debug('salesOrderId',salesOrderId);
            if(!!storageStartDate && !!storageEndDate && !!orderCBM){
                storageStartDate = new Date(storageStartDate);
                storageEndDate = new Date(storageEndDate);
                var difference = storageEndDate.getTime() - storageStartDate.getTime();
                var TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
                var totalStorage = Math.round(TotalDays * orderCBM * 2.85);
                log.debug('totalStorage',totalStorage);

            }
            if(salesOrderId && totalStorage){
                var salesOrderRecord = record.load({
                    type : 'salesorder',
                    id : salesOrderId
                });
                var customer = salesOrderRecord.getValue('entity');
                var salesOrderRecord = record.create({
                    type : 'salesorder'
                });
                salesOrderRecord.setValue('entity',customer);
                salesOrderRecord.setValue('department',5);
                salesOrderRecord.setValue('location',33);
                salesOrderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'item',
                    value : 24677,
                    line : 0,
                    forceSyncSourcing: true
                });
                salesOrderRecord.setSublistValue({
                    sublistId : 'item',
                    fieldId : 'amount',
                    value : totalStorage,
                    line : 0,

                });
                var soCreated = salesOrderRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug('soCreted',soCreated);
                currentRecord.setValue('custbody_so_created',soCreated);
                currentRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });
            //   location.reload();
            location.href = "https://5679695-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?id="+soCreated+"&whence=";
            // location.href = "https://5679695-sb1.app.netsuite.com/app/accounting/transactions/salesord.nl?id="+soCreated+"";
            }

    }
    catch(e){
        log.debug('storageSo Exception',e);
    }
     }
 
     return {
         pageInit: pageInit,
         storageSo: storageSo
     };
     
 });
 