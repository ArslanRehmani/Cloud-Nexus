
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
        function pageInit(context) {
            try {
                var objRecord = context.currentRecord;
                var paymentLink = '';
                var linkField = objRecord.getValue('custbody_payment_link');
                var simplyPaidDeposit = objRecord.getValue('custbody_sp_deposit_amount');
                if (!!simplyPaidDeposit) {
                    paymentLink = 'https://simplypaid.ezycollectuat.io/Ezypayhub/directlaunch?tkn=dKlRRCuGWxGA3qFTXeGAlEb1oCpaGpBOxlAyPqmGFwcHf9gAJPVx2FcYCPAjeuQYH-R_C0IeNWIvT3gLijelTFdjSmnMAf-c-1QNPBcTdHEgJdPUpU_6UxSbOGpmmlhuWNN3aggODZP_1GLRqehF2w&' +
                        '&cstnm=' + encodeURIComponent(objRecord.getText('entity')) + '&pymntamnt=' + objRecord.getValue('custbody_sp_deposit_amount') + '&trt=Quote+' + objRecord.getValue('tranid') +
                        '&td=NS[internalid=' + objRecord.getValue('id') + '+and+location=null+and+type=quote]';
                    log.debug('paymentLink', paymentLink);
                    if (!linkField) {
                        objRecord.setValue('custbody_payment_link', paymentLink);
                    }
                }
            }
        catch (e) {
                    log.debug('Exception', e);
                }
            }
     return {
                pageInit: pageInit
            };

        });
