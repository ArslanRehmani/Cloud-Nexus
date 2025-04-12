/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
 define(['N/search', 'N/record'],
 /**
  * @param{search} search
  * @param{record} record
  */
 function(search, record) {
     function afterSubmit(context) {
         try{
            var objRecord = context.newRecord;
            var currentRecord = record.load({
                type : 'estimate',
                id : objRecord.id
            })
            var paymentLink = '';
            var linkField = objRecord.getValue('custbody18');
            var simplyPaidDeposit = objRecord.getValue('custbody_sp_deposit_amount');
            if (!!simplyPaidDeposit) {
                paymentLink = 'https://simplypaid.ezycollectuat.io/Ezypayhub/directlaunch?tkn=dKlRRCuGWxGA3qFTXeGAlEb1oCpaGpBOxlAyPqmGFwcHf9gAJPVx2FcYCPAjeuQYH-R_C0IeNWIvT3gLijelTFdjSmnMAf-c-1QNPBcTdHEgJdPUpU_6UxSbOGpmmlhuWNN3aggODZP_1GLRqehF2w&' +
                    '&cstnm=' + encodeURIComponent(currentRecord.getText('entity')) + '&pymntamnt=' + objRecord.getValue('custbody_sp_deposit_amount') + '&trt=Quote+' + currentRecord.getValue('tranid') +
                    '&td=NS[internalid=' + objRecord.getValue('id') + '+and+location=null+and+type=quote]';
                log.debug('paymentLink', paymentLink);
                if (!linkField) {
                    currentRecord.setValue('custbody18', paymentLink);
                    currentRecord.save({ignoreFieldChanged:true});
                }
            }
             }
        catch (e) {
             log.debug("Exception",e);
         }
     }

     return {
        afterSubmit:afterSubmit
        }

 });