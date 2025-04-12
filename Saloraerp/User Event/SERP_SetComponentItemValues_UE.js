/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/format'], (record, runtime, search, format) => {

    /**
     * Defines the function definition that is executed after record is submitted.
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
     * @since 2015.2
     */
    const afterSubmit = (scriptContext) => {
        try {
            var objNewRecord = scriptContext.newRecord;
            var intRecordId = objNewRecord.id;
            var intItemCount = objNewRecord.getLineCount({
                sublistId: 'item'
            });
            log.debug('intRecordId', intRecordId);
            log.debug('intItemCount', intItemCount);

            // Retrieve values
            var arrItemDetails = [];
            for (var i = 0; i < intItemCount; i++) {
                var objItemDetail = {};
                objItemDetail.custcol_i5_item_pallet = objNewRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_i5_item_pallet',
                    line: i
                });
                objItemDetail.custcol_i5_pallet_weight = objNewRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_i5_pallet_weight',
                    line: i
                });
                objItemDetail.custcol_sys_pallet_height = objNewRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sys_pallet_height',
                    line: i
                });
                objItemDetail.custcol_sys_pallet_length = objNewRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sys_pallet_length',
                    line: i
                });
                objItemDetail.custcol_sys_pallet_width = objNewRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_sys_pallet_width',
                    line: i
                });
                arrItemDetails.push(objItemDetail);
            }
            log.debug('arrItemDetails', JSON.stringify(arrItemDetails));

            // Set values
            var objRecord = record.load({
                type: record.Type.ITEM_FULFILLMENT,
                id: intRecordId
            });
            for (var j = 0; j < arrItemDetails.length; j++) {
                var objItemDetail = arrItemDetails[j];
                log.debug('objItemDetail', JSON.stringify(objItemDetail));
                for (var field in objItemDetail) {
                    objRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: field,
                        value: objItemDetail[field],
                        line: j
                    });
                }
            }
            objRecord.save({
                ignoreMandatoryFields: true
            });
            log.debug('Record Updated', `Record ${intRecordId} has been updated.`);
        } catch (ex) {
            const stError = ex.getCode != null ? `${ex.getCode()}\n${ex.getDetails()}\n` : ex.toString();
            log.error('Error: afterSubmit()', stError);
        }
    }

    return { afterSubmit }

});
