/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/task', 'N/record'], function (log, task, record) {

    function beforeLoad(context) {

    }

    function beforeSubmit(context) {

    }

    function afterSubmit(context) {
        var title = 'afterSubmit[::]';
        try {
            // if (context.type !== context.UserEventType.CREATE) {
            //     return;
            // }
            const newRecord = context.newRecord;
            const recId = newRecord.id;
            const recType = newRecord.type;

            const cashSalesObj = record.load({
                type: recType,
                id: recId
            });
            const trandate = cashSalesObj.getValue('trandate');

            log.debug({
                title: 'trandate',
                details: trandate
            })

            if (trandate) {
                const jsDate = new Date(trandate);          // Parsed from ISO format
                const currentDate = new Date();             // Current date and time

                if (currentDate <= jsDate) {
                    log.debug('Current date is not after trandate. Skipping MR script.');
                    return;
                }

                // Run your logic here — current date is after trandate
                log.debug('Current date is after trandate. Running MR script.');

            } else {
                log.debug('No depreciation start date. Skipping MR script.');
                return;
            }

            const cashSalesUpdate = cashSalesObj.getValue('custbody_richy_cash_sale_updated');
            const entityId = cashSalesObj.getValue('entity');
            const internalId = cashSalesObj.getValue('id');

            const paramData = {
                transactionId: internalId,
                recordType: recType,
                entityId: entityId
            }

            log.debug('Cash Sales Values', paramData);

            if (cashSalesUpdate == false) {
                const mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_post_lamode_mrs',
                    deploymentId: 'customdeploy_post_lamode_mrs',
                    params: {
                        custscript_cashsales_json: JSON.stringify(paramData)
                    }
                });

                const mrTaskId = mrTask.submit();
                log.debug('Map/Reduce Task Submitted', 'Task ID' + mrTaskId);
            }

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        // beforeLoad: beforeLoad,
        // beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
