/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
 define(['N/task'],

    function(task) {
       
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            let results;
            const recid = context.request.parameters.recid
            if (recid) {
                const mpTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    deploymentId: 'customdeploy3',
                    scriptId: 'customscript_dealer_stock_feed_mr',
                    params: {
                        custscript_dealer_stock_feed_dealer: recid
                    },
                }).submit()
                log.debug('mpTask', mpTask)
                results = {
                    task: mpTask
                }
            } else {
                throw new Error(`Mssing record id from Dealer Stock Feed Send Now button`)
            }
            
            context.response.setHeader({
                name: 'Content-Type',
                value: 'application/json'
            })
            context.response.write(JSON.stringify(results || {}))
        }
    
        return {
            onRequest: onRequest
        };
        
    });
    