var mvfid;

function beforeLoad() {
    try {
        addField();
        // hideSubtlist();    
        // disableField();
    } catch (e) {
        nlapiLogExecution("ERROR", e.name, e.message);
    }
}


function afterSubmit() {
    try {
        var vendors = nlapiGetLineItemCount('itemvendor');
        var itemid = nlapiGetRecordId();

        for (var i = 0; vendors != null && i < vendors; i++) {
            var vendorid = nlapiGetLineItemValue('itemvendor', 'vendor', i + 1);
            var customfield = nlapiGetLineItemValue('itemvendor', 'custpagecustom', i + 1);

            if (checkMVF(itemid, vendorid)) {
                nlapiSubmitField('customrecord_multi_vendor_fields', mvfid, 'custrecord_custom_field_1', customfield);
            }
            else {
                var rec = nlapiCreateRecord('customrecord_multi_vendor_fields');
                if(!isEmpty(itemid)){
                    rec.setFieldValue('custrecord_item1', itemid);
                }
                if(!isEmpty(vendorid)){
                    rec.setFieldValue('custrecord_vendor', vendorid);
                }
                if(!isEmpty(customfield)){
                    rec.setFieldValue('custrecord_custom_field_1', customfield);
                }
                nlapiSubmitRecord(rec);
            }
        }
    } catch (e) {
        nlapiLogExecution("ERROR", e.name, e.message);
    }
}

function addField() {
    var sublist = form.getSubList('itemvendor');
    sublist.addField('custpagecustom', 'text', 'Ranking');
    var vendors = nlapiGetLineItemCount('itemvendor');
    var itemid = nlapiGetRecordId();

    for (var i = 0; vendors != null && i < vendors; i++) {
        var vendorid = nlapiGetLineItemValue('itemvendor', 'vendor', i + 1);

        if (checkMVF(itemid, vendorid)) {
            nlapiLogExecution('DEBUG', 'mvfid', mvfid);
            var customfield = nlapiLookupField('customrecord_multi_vendor_fields', mvfid, 'custrecord_custom_field_1');
            nlapiSetLineItemValue('itemvendor', 'custpagecustom', i + 1, customfield);
        }
    }
}

function hideSubtlist() {
    form.getSubList('itemvendor').getField('vendor').setDisplayType('hidden');
}

function disableField() {
    form.getSubList('itemvendor').getField('purchaseprice').setDisplayType('disabled');
    form.getSubList('itemvendor').getField('vendor').setDisplayType('disabled');
}

function checkMVF(item, vendor) {
    var itemFilters = new Array();
    itemFilters[0] = new nlobjSearchFilter('custrecord_item1', null, 'is', item);
    itemFilters[1] = new nlobjSearchFilter('custrecord_vendor', null, 'is', vendor);
    var itemColumns = new Array();
    itemColumns[0] = new nlobjSearchColumn('internalid', null, null);
    var searchresults = nlapiSearchRecord('customrecord_multi_vendor_fields', null, itemFilters, itemColumns);

    if (numRows(searchresults) > 0) {
        mvfid = searchresults[0].getValue('internalid');
        return true;
    }
    else {
        return false;
    }
}

function numRows(obj) {
    var ctr = 0;
    for (var k in obj) {
        if (obj.hasOwnProperty(k)) {
            ctr++;
        }
    }
    return ctr;
}
function isEmpty(stValue) {

    if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0)) {
      return true;
    }
    return false;
  }