/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/https', './bigw_lib', 'N/runtime', 'N/search'],

function(https, bigwLib, runtime, search) {
   
    var _ = bigwLib._;

    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {
        var orders = [];

        var orderSubmitted = runtime.getCurrentScript().getParameter('custscript_bigw_order_mr_submitted');
        try {
            if (orderSubmitted) {
                orderSubmitted = JSON.parse(orderSubmitted);
                if (util.isArray(orderSubmitted)) {
                    orders = orderSubmitted;
                }
            } else {
                var ordersRequest = https.post({
                    // url: 'https://shopify.gflgroup.com.au/bigw-orders',
                    // url: 'https://kpgidmzvb9.execute-api.ap-southeast-2.amazonaws.com/default/bigwFetchOrders',
                    url: 'https://toolset-gfl.herokuapp.com/bigw-orders',
                    headers: {
                        'X-From': 'suitescript',
                        'x-api-key': 'cqLa6EGSXtdA0N6Sfjhc236zKvwsx9I5kVr9fwq4',
                    },
                    body: {}
                });
                log.audit('check request', ordersRequest)
                if (ordersRequest.code == 200) {
                    var ordersBody = JSON.parse(ordersRequest.body);
                    if (util.isArray(ordersBody)) {
                        util.each(ordersBody, function(ob) {
                            if (_.has(ob, 'orders')) {
                                orders = orders.concat(ob.orders);
                            } else {
                                orders = _.concat(orders, ob);
                            }
                        });
                    }
                }

                var logSearch = search.create({
                    type: bigwLib.log_records.id,
                    filters: [
                        ['isinactive', 'is', 'F'],
                        'AND',
                        [
                            ['custrecord_bigw_order_salesorder', 'is','@NONE@'],
                            'OR',
                            ['custrecord_bigw_order_customer', 'is','@NONE@']
                        ],
                        'AND',
                        ['custrecord_bigw_order_source_code', 'isnotempty', ''],
                        'AND',
                        ['custrecord_bigw_order_fulfilled', 'is', 'F']
                    ],
                    columns: [
                        'internalid',
                        'name',
                        'custrecord_bigw_order_source_code',
                    ]
                });

                logSearch.run().each(function(logResult) {
                    log.debug('logResult', logResult);
                    orders.push(JSON.parse(logResult.getValue('custrecord_bigw_order_source_code')));
                    
                    return true;
                });
            }
        } catch (error) {
            log.error('orderrequest error', error);   
        }
        log.audit('orders', orders)
        return orders;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        log.debug(context.key, context.value);

        var bigOrder = new bigwLib.bigwOrder(JSON.parse(context.value));
        log.debug('bigw order', bigOrder);
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug('input summary', summary.inputSummary);
        var mapSum = summary.mapSummary;
        mapSum.errors.iterator().each(function(key, value) {
            log.error('error in map stage ' + key, value);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
