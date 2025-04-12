/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/ui/message', 'N/log', 'N/search'], function (record, message, log, search) {
    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        var fieldId = context.fieldId;
        var subCustomer = 'custentity_sub_customer';
        var customFieldId = 'custentity24';
        var customForm = currentRecord.getValue({ fieldId: 'customform' });
        var customer = currentRecord.getValue({ fieldId: 'parent' });
        var subCustomer = currentRecord.getValue({ fieldId: 'custentity_sub_customer' });

        if (fieldId === subCustomer) {
            var subCustomerId = currentRecord.getValue({ fieldId: subCustomer });
            if (subCustomerId) {
                try {
                    var customerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: subCustomerId
                    });

                    // Get the number of lines in the addressbook sublist
                    var lineCount = customerRecord.getLineCount({
                        sublistId: 'addressbook'
                    });

                    log.debug("lineCount", lineCount);

                    for (var i = 0; i < lineCount; i++) {
                        // Get the defaultshipping value from the current line
                        var isDefaultShipping = customerRecord.getSublistValue({
                            sublistId: 'addressbook',
                            fieldId: 'defaultshipping',
                            line: i
                        });

                        if (isDefaultShipping) {
                            var address = customerRecord.getSublistValue({
                                sublistId: 'addressbook',
                                fieldId: 'addrtext_initialvalue',
                                line: i
                            });
                            if (address) {
                                // Set the value of the custom field custentity24 to the address
                                currentRecord.setValue({
                                    fieldId: customFieldId,
                                    value: address
                                });

                                // Log the new value
                                log.debug({
                                    title: "Set custom field",
                                    details: "Field " + customFieldId + " set to: " + address
                                });

                            } else {
                                log.error({
                                    title: "Address not found",
                                    details: "Address for default shipping is empty"
                                });
                            }
                        }
                    }

                } catch (e) {
                    log.error({
                        title: "Error loading customer record",
                        details: e.message
                    });
                }
            }
        }
        if (fieldId == 'parent' && customForm == 341) {//MTP Master Project Form

            var customerExits = checkCustomer(customer);
            if(customerExits == true){

                var comment = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: customer,
                    columns: ['comments']
                }).comments;
                currentRecord.setValue({fieldId: 'comments', value: comment});

            }else{
                currentRecord.setValue({fieldId: 'comments', value: ''});
            }

        }else if(fieldId == 'custentity_sub_customer' && customForm == 338){//MTP Site Project Form

            var customerExits = checkCustomer(subCustomer);
            if(customerExits == true){

                var comment = search.lookupFields({
                    type: search.Type.CUSTOMER,
                    id: subCustomer,
                    columns: ['comments']
                }).comments;
                currentRecord.setValue({fieldId: 'comments', value: comment})

            }else{
                currentRecord.setValue({fieldId: 'comments', value: ''});
            }
        }
    }
    function checkCustomer(id) {
        var title = 'checkCustomer[::]';
        var custExist = false;
        var custInternalId;
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                [
                   ["internalid","anyof",id]
                ],
                columns:
                [
                   search.createColumn({name: "entityid", label: "ID"}),
                   search.createColumn({name: "altname", label: "Name"})
                ]
             });
             customerSearchObj.run().each(function(result){
                custInternalId =  result.id;
                if(custInternalId){
                    custExist = true;
                }
                return true;
             });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return custExist;
    }
    return {
        fieldChanged: fieldChanged
    };
});
