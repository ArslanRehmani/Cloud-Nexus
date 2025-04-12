/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log'], function(record, search, log) {

    function beforeSubmit(context) {      
    try {
        var customerRecord = context.newRecord;
        var childFieldValue = customerRecord.getValue({
            fieldId: 'parent'
        });
        log.debug("fchildFieldValue" ,childFieldValue)
        if(childFieldValue)
        {
           var fieldLookUp = search.lookupFields({
               type: search.Type.CUSTOMER,
               id: childFieldValue,
               columns: ['category']
           });
           var categoryValue = fieldLookUp.category[0].value;
           log.debug("fieldLookUp==" ,fieldLookUp.category[0].value)
           if (categoryValue)
           {
              customerRecord.setValue({
                   fieldId: 'category',
                   value: categoryValue
               });
           }
        }
    } catch (e) {
        log.error({ title: e.name, details: e.name });
    }

    }
    return {
        beforeSubmit: beforeSubmit,
    };

});
