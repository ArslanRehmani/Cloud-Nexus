/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([], function () {

    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.VIEW) {
                var form = context.form;
                form.clientScriptModulePath = './MTP_CS_mtpServiceCall_SO_Btn.js';
                form.addButton({
                    id: 'custpage_sales_order_button',
                    label: 'Sales Order',
                    functionName: 'onClickSalesOrderBtn'
                });
                form.addButton({
                    id: 'custpage_po_workorder',
                    label: 'Work Order',
                    functionName: 'workOrderBtn'
                });
                form.addButton({
                    id: 'custpage_po_btn',
                    label: 'Purchase Order',
                    functionName: 'purchaseOrderBtn'
                });
            }
        } catch (e) {
            log.error({
                title: e.title + 'Exception',
                details: e.message
            });
        }
    }

    function beforeSubmit(context) {

    }

    function afterSubmit(context) {

    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
