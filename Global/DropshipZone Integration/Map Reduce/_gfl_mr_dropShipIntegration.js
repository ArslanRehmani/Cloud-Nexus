/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/https', 'N/search', '../lib/dropship_request_lib.js', '../lib/dropship_ns_data_lib.js'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{https} https
 * @param{search} search
 */
    (log, record, https, search, requestLib, nsDataLib) => {

        const getInputData = (inputContext) => {
            var title = 'getInputData[::]';
            try {
                //Get Dropship Orders List
                var dropShipOrderData = requestLib.HELPERS.getDropShipOrders();
                if (dropShipOrderData && dropShipOrderData.length > 0) {
                    return dropShipOrderData;
                } else {
                    return [];
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        const map = (mapContext) => {
            var title = 'map[::]';
            try {
                var data = JSON.parse(mapContext.value);
                var customerObj = data.shipping_info;
                log.debug({
                    title: 'customerObj',
                    details: customerObj
                });
                var firstName = customerObj.firstname;
                var lasttName = customerObj.lastname;
                var fullName = firstName + ' ' + lasttName;

                //Function to check customer exits ot not
                var customerFoundResult = nsDataLib.HELPERS.customerFound(fullName);
                
                if (customerFoundResult == 0) {// customer not found
                    
                    var custId = nsDataLib.HELPERS.createCustomerRecord(fullName, customerObj);

                    //Create Sales Order
                    nsDataLib.HELPERS.createSalesOrder(data, custId);
                } else {
                    //create Sales Order if Customer exit
                    log.debug({
                        title: 'if Customer exits',
                        details: 'YES'
                    });
                    nsDataLib.HELPERS.createSalesOrder(data, customerFoundResult);
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }
        return { getInputData, map, reduce, summarize }
    });
