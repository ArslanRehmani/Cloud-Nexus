/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/log', 'N/currentRecord', 'N/record', 'N/url'], function(log, currentRecord, record, url) {

    function pageInit(context) {}

    function onClickSalesOrder() {
        try {
            var internalId = currentRecord.get().id;
            var currRec = record.load({
                type: 'job',
                id: internalId
            });
            
            var customerId = currRec.getValue('parent');
            var projectManager = currRec.getValue('projectmanager');
            log.debug('customer',customerId);
            log.debug('project Manager',projectManager);

            var salesOrderURL = url.resolveRecord({
                recordType: record.Type.SALES_ORDER,
                isEditMode: true,
                params: {
                    entity: customerId,
                    'record.job': internalId,
                    'record.custbody6': projectManager
                }
            });

            window.open(salesOrderURL, '_blank');

        } catch (error) {
            log.error('Error:', error.message);
        }
    }

    return {
        pageInit: pageInit,
        onClickSalesOrder: onClickSalesOrder
    };

});
