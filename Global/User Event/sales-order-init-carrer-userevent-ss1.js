/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       19 Sep 2017     G
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
  
    // if (type == 'create') {
        var count = nlapiGetLineItemCount('item');
        nlapiLogExecution('ERROR', 'line count', count);

        var lineItemCarrierArray = new Array();

        for (var i = 1; i <= count; i++) {
            var carrier = nlapiGetLineItemValue('item', 'custcol22', i);
            nlapiLogExecution('ERROR', 'carrier', carrier); 
            if (!carrier) {
                var itemId = nlapiGetLineItemValue('item', 'item', i);
                var itemCarrier = nlapiLookupField('item', itemId, 'custitem_cubic_carrier');
                nlapiLogExecution('ERROR', 'item carrrier', JSON.stringify(itemCarrier));
                
                // doesn't work on after submit, can be used when loading
                // nlapiSetLineItemValue('item', 'custcol22', i, itemCarrier);
                // nlapiSelectLineItem('item', i);
                // nlapiSetCurrentLineItemValue('item', 'custcol22', itemCarrier);
                if (itemCarrier) {
                    lineItemCarrierArray.push({
                        'line': i,
                        'carrier_value': itemCarrier,
                        'carrier_text': nlapiLookupField('customrecord_shipping_carrier', itemCarrier, 'name')
                    })
                }
            }
        }

        nlapiLogExecution('ERROR', 'line item carrier', JSON.stringify(lineItemCarrierArray));
        var recordId = nlapiGetRecordId();
        nlapiLogExecution('ERROR', 'order id', recordId);
        var record = nlapiLoadRecord(nlapiGetRecordType(), recordId);
        nlapiLogExecution('ERROR', 'set item line carrier', 'start');
        for (var j = 0; j < lineItemCarrierArray.length; j++ ) {
            var line = lineItemCarrierArray[j];
            record.setLineItemValue('item', 'custcol22', line.line, line.carrier_text);
        }
        nlapiLogExecution('ERROR', 'set item line carrier', 'end');
        nlapiSubmitRecord(record, true, true);
    // }
}
