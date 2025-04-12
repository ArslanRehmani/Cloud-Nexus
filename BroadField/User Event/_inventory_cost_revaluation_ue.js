/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log'], function (record, log) {
    function afterSubmit(context) {
        try {
            var currentRecord = context.newRecord;

            var oldRecord = context.oldRecord;

            var itemId = currentRecord.id;

            var purchasePrice = currentRecord.getValue('cost') || 0.00;

            var costcategory = currentRecord.getValue('costcategory');

            if (context.type === context.UserEventType.CREATE) {

                createCostRev(itemId, 2, purchasePrice, costcategory);

                createCostRev(itemId, 12, purchasePrice, costcategory);

            }
            if (context.type === context.UserEventType.EDIT) {

                var purchasePriceOLD = oldRecord.getValue({ fieldId: 'cost' }) || 0.00;

                var purchasePriceNEW = currentRecord.getValue({ fieldId: 'cost' }) || 0.00;

                if (purchasePriceNEW != purchasePriceOLD) {

                    createCostRev(itemId, 2, purchasePrice, costcategory);

                    createCostRev(itemId, 12, purchasePrice, costcategory);
                }

            }
        } catch (e) {

            log.error('AfterSubmit Exception', e.message);
        }
    }
    function createCostRev(itemId, locationId, purchasePrice, costcategory) {
        try {

            var invCostRevaluationRecord = record.create({
                type: 'inventorycostrevaluation'
            });

            invCostRevaluationRecord.setValue({
                fieldId: 'subsidiary',
                value: 2
            });

            invCostRevaluationRecord.setValue({
                fieldId: 'item',
                value: itemId
            });


            invCostRevaluationRecord.setValue({
                fieldId: 'account',
                value: 535
            });

            invCostRevaluationRecord.setValue({
                fieldId: 'location',
                value: locationId
            });

            invCostRevaluationRecord.setSublistValue({
                sublistId: 'costcomponent',
                fieldId: 'costcategory',
                line: 0,
                value: costcategory || 1

            });

            invCostRevaluationRecord.setSublistValue({
                sublistId: 'costcomponent',
                fieldId: 'cost',
                line: 0,
                value: purchasePrice || 0.00

            });


            var recordId = invCostRevaluationRecord.save({ ignoreMandatoryFields: true });

            log.debug('Record Id', recordId);

        } catch (e) {

            log.error('createCostRev execption', e.message);

        }
    }
    return {
        afterSubmit: afterSubmit
    };
});
