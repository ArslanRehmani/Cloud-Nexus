/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/task', 'N/ui/serverWidget'], (log, task, serverWidget) => {

    const beforeLoad = (context) => {
        var title = 'beforeLoad[::]';
        try {
            var form = context.form;

            var field = form.addField({
                id: 'custpage_famasset_update',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'FAM Asset Updated'
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    const afterSubmit = (context) => {
        try {
            if (context.type !== context.UserEventType.CREATE) {
                return;
            }
            const newRecord = context.newRecord;
            const recId = newRecord.id;
            const recType = newRecord.type;

            const name = newRecord.getValue('name');
            const altName = newRecord.getValue('altname');
            const assetDescr = newRecord.getValue('custrecord_assetdescr');
            const assetType = newRecord.getText('custrecord_assettype');
            const assetStatus = newRecord.getText('custrecord_assetstatus');
            const deprStartDate = newRecord.getValue('custrecord_assetdeprstartdate');

            log.debug('Depreciation Start Date', deprStartDate);

            // if (deprStartDate) {
            //     const jsDate = new Date(deprStartDate);
            //     const isMatch = jsDate.getDate() === 23 &&
            //         jsDate.getMonth() === 5 &&
            //         jsDate.getFullYear() === 2025;

            //     if (!isMatch) {
            //         log.debug('Date does not match 23/06/2025. Skipping MR script.');
            //         return;
            //     }
            // } else {
            //     log.debug('No depreciation start date. Skipping MR script.');
            //     return;
            // }

            if (deprStartDate) {
                const jsDate = new Date(deprStartDate);
                const compareDate = new Date(2025, 5, 23); // Month is 0-indexed: 5 = June

                if (jsDate < compareDate) {
                    log.debug('Date is before 23/06/2025. Skipping MR script.');
                    return;
                }
            } else {
                log.debug('No depreciation start date. Skipping MR script.');
                return;
            }

            const paramData = {
                recordId: recId,
                recordType: recType,
                name,
                altName,
                assetDescr,
                assetType,
                assetStatus
            };

            log.debug('Asset Field Values', paramData);

            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscriptrichy_mr_postassetdata',
                deploymentId: 'customdeployrichy_mr_postassetdata',
                params: {
                    custscript_assetdata_json: JSON.stringify(paramData)
                }
            });

            const mrTaskId = mrTask.submit();
            log.debug('Map/Reduce Task Submitted', `Task ID: ${mrTaskId}`);

            if (mrTaskId) {
                var assetRecObj = record.load({
                    type: recType,
                    id: recId
                });

                assetRecObj.setValue({ fieldValue: 'custpage_famasset_update', value: true });
                assetRecObj.save();
            }

        } catch (e) {
            log.error('Error in afterSubmit', e.message);
        }
    };

    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };

});
