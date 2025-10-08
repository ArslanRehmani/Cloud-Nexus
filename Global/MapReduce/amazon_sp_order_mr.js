/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['./amazon_sp_lib', 'N/runtime', 'N/search'],

    function (lib, runtime, search) {

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
            const dealerId = runtime.getCurrentScript().getParameter('custscript_amz_sp_order_mr_dealer')
            const orderIds = runtime.getCurrentScript().getParameter('custscript_amz_sp_order_mr_order')
            const amzsp = new lib.AmzSP(dealerId)
            let orders;
            if (orderIds) {
            	orders = [];
            	let orderId = orderIds.split(',');
            	for (var i = 0; i < orderId.length; i++) {
            		log.audit('orderid', orderId[i])
            		orders.push(amzsp.getOrder(orderId[i]))
            	}
            } else {
                orders = amzsp.getOrders()
            }


            return (util.isArray(orders) ? orders : [orders]).filter(Boolean)
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         * 
         * for dsco order must post shipment first then invoice
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            log.debug(`map ${context.key}`, context.value)

            var logObj = JSON.parse(context.value);
            if(util.isArray(logObj)) {
            	log.audit('order array', JSON.stringify(logObj));
            	logObj = logObj[0];
            	log.audit('order after array', JSON.stringify(logObj));
            }

            const dealerId = runtime.getCurrentScript().getParameter('custscript_amz_sp_order_mr_dealer')
            const amzspOrder = new lib.AmzSPOrder(dealerId, null, logObj)
            log.debug('amzspOrder', amzspOrder)
            amzspOrder.generateSalesorder()
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
            const errArr = [];
            log.debug('summary input', summary.inputSummary);

            var mapSum = summary.mapSummary;
            mapSum.errors.iterator().each(function (key, value) {
                log.error('error in map stage ' + key + typeof value, value);
                errArr.push(value)
                return true;
            });

            var reduSum = summary.reduceSummary;
            reduSum.errors.iterator().each(function (key, value) {
                log.error('error in reduce stage ' + key, value);
                errArr.push(value)
                return true;
            });

            const errMsg = []
            errArr.filter(Boolean).forEach(err => {
                try {
                    errMsg.push(JSON.parse(err).message)
                } catch (error) {
                    errMsg.push(err)
                }
            })

            if (errMsg.length > 0) {
                const dealerId = runtime.getCurrentScript().getParameter('custscript_amz_sp_order_mr_dealer')
                const amzsp = new lib.AmzSP(dealerId)
                amzsp.noticeEmail({
                    subject: `[Notification][${amzsp.name}] error in order syncing`
                    , body: errMsg.join('\n')
                })
            }

        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        };

    });
