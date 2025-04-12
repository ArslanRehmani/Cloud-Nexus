/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/record'], function(record) {

    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.VIEW) {
                var form = context.form;
                form.clientScriptModulePath = './projectSalesOrder.js'; 
                form.addButton({
                    id: 'custpage_sales_order_button',
                    label: 'Sales Order',
                    functionName: 'onClickSalesOrder'
                });
            }
        } catch (e) {
            log.error('Error Adding Button', e);
        }
    }

    return {
        beforeLoad: beforeLoad
    };

});
