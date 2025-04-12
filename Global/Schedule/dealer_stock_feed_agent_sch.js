/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
 define(['N/task', 'N/runtime'],

    function(task, runtime) {
       
        /**
         * Definition of the Scheduled script trigger point.
         *
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
         * @Since 2015.2
         */
        function execute(scriptContext) {
            const dealer = runtime.getCurrentScript().getParameter('custscript_dealerstockfeed_dealer')
            const mpTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                // deploymentId: 'customdeploy4',
                scriptId: 'customscript_dealer_stock_feed_mr',
                params: {
                    custscript_dealer_stock_feed_dealer: dealer
                },
            }).submit()
            log.debug('mpTask', mpTask)
        }
    
        return {
            execute: execute
        };
        
    });
    