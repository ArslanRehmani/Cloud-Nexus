/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/query', 'N/ui/serverWidget', 'N/search', 'N/task', 'N/runtime', '../eBay_dao/eBay_confiq_dao.js', 'N/redirect'], 
    (query, serverWidget, search, task, runtime, eBayConfig, redirect) => {

    const onRequest = (context) => {
        if (context.request.method === 'GET') {
            try {
                let form = serverWidget.createForm({ title: 'eBay Orders Processing' });
                form.clientScriptModulePath = '/SuiteScripts/eBay Integration/Client Script/ebay_sync_orders_cs.js';

                let sublist = form.addSublist({
                    id: 'custpage_ebay_orders',
                    type: serverWidget.SublistType.LIST,
                    label: 'eBay Orders'
                });

                sublist.addField({ id: 'custpage_select', type: serverWidget.FieldType.CHECKBOX, label: 'Select' });
                sublist.addField({ id: 'custpage_orderid', type: serverWidget.FieldType.TEXT, label: 'Order ID' });
                sublist.addField({ id: 'custpage_creationdate', type: serverWidget.FieldType.TEXT, label: 'Creation Date' });
                sublist.addField({ id: 'custpage_status', type: serverWidget.FieldType.TEXT, label: 'Status' });
                sublist.addField({ id: 'custpage_fulfillmentstatus', type: serverWidget.FieldType.TEXT, label: 'Fulfillment Status' });
                sublist.addField({ id: 'custpage_buyername', type: serverWidget.FieldType.TEXT, label: 'Buyer Name' });
                sublist.addField({ id: 'custpage_email', type: serverWidget.FieldType.EMAIL, label: 'Email' });
                sublist.addField({ id: 'custpage_total', type: serverWidget.FieldType.CURRENCY, label: 'Total' });

                let eBayConfigToken = eBayConfig.CONFIG.getEbayConfigurations();
                let ebayOrderArray = eBayConfig.CONFIG.getEbayOrders(eBayConfigToken).orders || [];
                let orderIds = ebayOrderArray.map(order => order.orderId);

                let syncStatusMap = getBulkOrderSyncStatus(orderIds);
                let lines = ebayOrderArray.map((order, i) => ({
                    custpage_orderid: order.orderId,
                    custpage_creationdate: order.creationDate,
                    custpage_status: syncStatusMap[order.orderId] || 'Not Sync',
                    custpage_fulfillmentstatus: order.orderFulfillmentStatus,
                    custpage_buyername: order.buyer.buyerRegistrationAddress.fullName,
                    custpage_email: order.buyer.buyerRegistrationAddress.email,
                    custpage_total: order.pricingSummary.total.value
                }));

                lines.forEach((line, i) => {
                    Object.keys(line).forEach(field => {
                        sublist.setSublistValue({ id: field, line: i, value: line[field] });
                    });
                });

                form.addSubmitButton({ label: 'Submit' });
                context.response.writePage(form);
            } catch (e) {
                log.error({ title: 'GET Request Error', details: e });
            }
        } else if (context.request.method === 'POST') {
            try {
                let request = context.request;
                let selectedOrders = [];
                let lineCount = request.getLineCount({ group: 'custpage_ebay_orders' });
                
                for (let i = 0; i < lineCount; i++) {
                    if (request.getSublistValue({ group: 'custpage_ebay_orders', name: 'custpage_select', line: i }) === 'T') {
                        selectedOrders.push(request.getSublistValue({ group: 'custpage_ebay_orders', name: 'custpage_orderid', line: i }));
                    }
                }

                if (selectedOrders.length > 0) {
                    let mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_mr_ebay_update_salesorder', 
                        deploymentId: 'customdeploy_mr_ebay_update_salesorder', 
                        params: { custscript_selected_orders: JSON.stringify(selectedOrders) }
                    });
                    
                    log.debug({ title: 'Map/Reduce Task Submitted', details: { taskId: mrTask.submit() } });
                 redirect.toSuitelet({
                     scriptId: runtime.getCurrentScript().id,
                     deploymentId: runtime.getCurrentScript().deploymentId
                     });
                }
            } catch (e) {
                log.error({ title: 'POST Request Error', details: e });
            }
        }
    };

    function getBulkOrderSyncStatus(orderIds) {
    let syncStatusMap = {};
    try {
        if (orderIds.length === 0) return syncStatusMap;

        let queryStr = `
            SELECT memo 
            FROM transaction 
            WHERE type = 'SalesOrd'
            AND (${orderIds.map(id => `memo LIKE '%${id}%'`).join(' OR ')})
        `;

        let resultSet = query.runSuiteQL({ query: queryStr }).asMappedResults();

        resultSet.forEach(row => {
            syncStatusMap[row.memo] = 'Sync';
        });

    } catch (e) {
        log.error({ title: 'Error in getBulkOrderSyncStatus', details: e });
    }
    return syncStatusMap;
}


    return { onRequest };
});
