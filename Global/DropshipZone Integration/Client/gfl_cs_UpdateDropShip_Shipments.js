/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/https', '../lib/dropship_request_lib.js'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{https} https
     * @param{requestLib} requestLib
     */
    function (log, record, runtime, search, https, requestLib) {

        function validateDelete(scriptContext) {
            var title = 'validateDelete[::]';
            try {
                var rec = scriptContext.currentRecord;
                var sublistId = scriptContext.sublistId;
                var createdFromSalesOrder = rec.getText({
                    fieldId: 'createdfrom'
                });
                if (createdFromSalesOrder.includes('Sales Order')) {
                    var createdFromSalesOrderID = rec.getValue({
                        fieldId: 'createdfrom'
                    });
                    var dropShipOrderNum = search.lookupFields({
                        type: search.Type.SALES_ORDER,
                        id: createdFromSalesOrderID,
                        columns: ['custbody_gfl_dropship_order_no']
                    }).custbody_gfl_dropship_order_no;
                    if (dropShipOrderNum) {
                        if (sublistId == 'package') {
                            var trackingNum = rec.getCurrentSublistValue({
                                sublistId: 'package',
                                fieldId: 'packagetrackingnumber'
                            });
                            var token = requestLib.HELPERS.getToken();
                            var headers = {};
                            headers['Content-Type'] = 'application/json';
                            headers['Authorization'] = 'jwt ' + token;
                            var response = https.delete({
                                url: 'https://services.dropshipzone.com.au/admin/api/supplier/v1/shipments?order_id='+dropShipOrderNum+'&tracking_number='+trackingNum+'',
                                headers: headers
                            });
                            log.debug({
                                title: 'Delete response',
                                details: response
                            });
                        }
                    }
                }
                return true;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return {
            validateDelete: validateDelete
        };

    });
