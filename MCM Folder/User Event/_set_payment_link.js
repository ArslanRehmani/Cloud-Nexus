/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/log', 'N/currentRecord', 'N/record'], function (serverWidget, log, currentRecord, record) {


    function beforeLoad(context) {
        try {
            var simplyPaidDeposit = context.newRecord.getValue('custbody_sp_deposit_amount');
            if (context.type === context.UserEventType.VIEW && simplyPaidDeposit > 0) {
                var currentRecord = context.newRecord;
                var cid = currentRecord.id;
                log.debug({
                    title: 'Rec',
                    details: cid
                });

                context.form.addButton({
                    id: 'custpage_btn_pay_deposit',
                    label: 'Pay Now',
                    functionName: 'simplyPaid("' + cid + '")'
                });

                context.form.clientScriptModulePath = "./pay_now_cs.js";
            }
        }
        catch (e) {
            log.debug('beforeLoad Exception', e);
        }

    }


    return {

        beforeLoad: beforeLoad

    };

});
