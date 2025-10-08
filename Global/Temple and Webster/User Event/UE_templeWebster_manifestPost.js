/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/https', '../lib/temple_and_webster_lib'], function (log, record, https, tempWebLIB) {


    function afterSubmit(context) {
        var title = 'afterSubmit[::]';
        try {
            var rec = context.newRecord;
            var recId = rec.id;
            var manifiest = rec.getValue({fieldId: 'custbody_templewebster_readytoship'});
            var printLable = rec.getValue({fieldId: 'custbody_gfl_print_lable'});
            var ifStatus = rec.getValue({fieldId: 'shipstatus'});
            var customer = rec.getValue({fieldId: 'entity'});
            log.debug({
                title: 'ifStatus',
                details: ifStatus
            });
            var twOrderId = rec.getValue({fieldId: 'custbody1'});

            // if(!manifiest && twOrderId && ifStatus == 'C' && customer == 1410049 && printLable == true){
            if(!manifiest && twOrderId && ifStatus == 'C' && customer == 1410049){
                log.debug({
                    title: 'manifiest',
                    details: manifiest
                });

                var manifiestOrder = tempWebLIB.updateManifiestOrder(twOrderId);
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        afterSubmit: afterSubmit
    }
});
