/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', '../eBay_dao/eBay_confiq_dao.js'], function (log, record, eBayConfig) {

    const beforeSubmit = (context) => {
        let title = 'beforeSubmit[::]';
        try {
            let rec = context.newRecord;

            let soId = rec.getValue({ fieldId: 'createdfrom' });

            let status = rec.getValue({ fieldId: 'status' });

            let soText = rec.getText({ fieldId: 'createdfrom' });

            let result = soText.includes('Sales Order') ? 'YES' : 'NO';

            if (result == 'YES' && status == 'Shipped') {

                let soObj = record.load({
                    type: 'salesorder',
                    id: soId
                });

                var trackingNum = soObj.getValue({ fieldId: 'linkedtrackingnumbers' });

                let shipVia = soObj.getText({ fieldId: 'shipmethod' });

                let orderNumber = soObj.getText({ fieldId: 'custbody1' });

                if (trackingNum && trackingNum != '' && shipVia && shipVia != '') {

                    // Generate eBay Token
                    let eBayConfigToken = eBayConfig.CONFIG.getEbayConfigurations();

                    // send data on oneFm to shiped IF
                    let responce = eBayConfig.CONFIG.shipedIFineBay(eBayConfigToken, orderNumber, shipVia, trackingNum)
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        beforeSubmit: beforeSubmit
    }
});
