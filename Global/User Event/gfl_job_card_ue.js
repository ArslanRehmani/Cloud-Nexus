/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record'],

    function (search, record) {

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @param {Form} scriptContext.form - Current form
         * @Since 2015.2
         */
        function beforeLoad(scriptContext) {

            var trigType = scriptContext.type;
            log.debug('trigger type', trigType);
            var currentForm = scriptContext.form;
            log.debug('current form', JSON.stringify(currentForm));
            var newRecord = scriptContext.newRecord;
            var jobType = newRecord.getValue('custrecord_gfl_job_card_type');
            log.debug('job type', jobType);

            var emailAddress = newRecord.getValue('custrecord_gfl_job_card_email');

            var emailSent = newRecord.getValue('custrecord_gfl_job_card_email_sent');
            log.debug('email sent', emailSent);

            var printButton = currentForm.getButton('print');
            log.debug('print button', JSON.stringify(printButton));
            currentForm.removeButton('print');

            // can only have one client script, so this one has to be custom (saying remove line @NScriptType ClientScript)
            currentForm.clientScriptModulePath = './gfl_job_card_client.js';
            // currentForm.clientScriptFileId = 3065527;

            if (trigType == 'view') {
                currentForm.addButton({
                    id: 'custpage_gfl_job_card_print',
                    label: 'Print PDF',
                    functionName: 'printPDF(' + newRecord.id + ',' + jobType + ')'
                });

                // can't pass more than three parameters ? strange

                if (emailSent == false) {
                    currentForm.addButton({
                        id: 'custpage_gfl_job_card_email',
                        label: 'Email PDF',
                        functionName: 'emailPDF(' + newRecord.id + ',' + jobType + ')'
                    });
                }
            }

        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            var title = 'beforeSubmit(::)';
            try {
                var rec = scriptContext.newRecord;
                var linkeCount = rec.getLineCount({
                    sublistId: 'recmachcustrecord_glf_job_card_link'
                });
                for (var m = 0; m < linkeCount; m++) {
                    var itemId = rec.getSublistValue({
                        sublistId: 'recmachcustrecord_glf_job_card_link',
                        fieldId: 'custrecord_item_id',
                        line: m
                    });
                    var itemSearch = itemTypeSearch(itemId);
                    var itemType = itemSearch.type;
                    log.debug({
                        title: 'itemType',
                        details: itemType
                    });
                    if (itemType == 'InvtPart') {
                        var fieldLookUp = search.lookupFields({
                            type: 'inventoryitem',
                            id: itemId,
                            columns: ['custitem_shipping_label_description']
                        }).custitem_shipping_label_description;
                        log.debug({
                            title: 'itemType fieldLookUp Data',
                            details: fieldLookUp
                        });
                        if(fieldLookUp){
                            rec.setSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord61',
                                line: m,
                                value: fieldLookUp
                            });
                        }
                    } else if (itemType == 'Kit') {
                        var kitSearchResults = kitSearch(itemId);
                        log.debug({
                            title: 'itemType KIT Data',
                            details: kitSearchResults
                        });
                        if(kitSearchResults.data){
                            rec.setSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord61',
                                line: m,
                                value: kitSearchResults.data
                            });
                        }
                    }
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            /**
            var lookupFields = new Array();
    
            var currentRecord = scriptContext.newRecord;
            var address = currentRecord.getValue('custrecord_gfl_job_card_address');
            log.debug('address', address);
            if (address == '' || address == null) {
                lookupFields.push({
                    job_f: 'custrecord_gfl_job_card_address',
                    case_f: 'custevent1'
                }); // System Shipping Address
            }
    
            var phone = currentRecord.getValue('custrecord_gfl_job_card_phone');
            log.debug('phone', phone);
            if (phone == '' || phone == null) {
                lookupFields.push({
                    job_f: 'custrecord_gfl_job_card_phone',
                    case_f: 'phone'
                }); // System Phone
            }
    
            var email = currentRecord.getValue('custrecord_gfl_job_card_email');
            log.debug('email', email);
            if (email == '' || email == null) {
                lookupFields.push({
                    job_f: 'custrecord_gfl_job_card_email',
                    case_f: 'custevent38'
                }); // System Email
            }
    
            var caseId = currentRecord.getValue('custrecord_gfl_job_card_case');
            if(caseId && lookupFields.length > 0) {
    
                // use load record instead of search, because some of the field can't fetch value like custevent 
                // phone is not search column in case, it's sourced from contact, so use join search
    
                // if (lookupFields.length > 0) {
                //     var caseFields = search.lookupFields({
                //         type: 'supportcase',
                //         id: caseId,
                //         columns: lookupFields
                //     });
    
                //     log.debug('case field', caseFields);
                //     // {"custevent1":"","company.phone":"041 555 7032"}
                // }
    
                var caseRecord = record.load({
                    type: 'supportcase',
                    id: caseId,
                    isDynamic: true
                });
    
                for (var i = 0; i < lookupFields.length; i++) {
                    var caseFieldValue = caseRecord.getValue(lookupFields[i].case_f);
                    log.debug('case field Value ' + lookupFields[i].case_f, caseFieldValue);
    
                    currentRecord.setValue({
                        fieldId: lookupFields[i].job_f,
                        value: caseFieldValue
                    });
                }
            }
            */
        }

        /**
         * Function definition to be triggered before record is loaded.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function afterSubmit(scriptContext) {

        }
        function itemTypeSearch(id) {
            var title = '(::)';
            var obj;
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({ name: "custitem_shipping_label_description", label: "Shipping Label Description" })
                        ]
                });
                itemSearchObj.run().each(function (result) {
                    obj = {};
                    obj.type = result.getValue({ name: 'type' });
                    obj.CartonCode = result.getValue({ name: 'custitem_shipping_label_description' });
                    return true;
                });
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return obj;
        }
        function kitSearch(id) {
            var title = 'kitSearch(::)';
            var obj;
            try {
                var customrecord_avt_ifs_item_packageSearchObj = search.create({
                    type: "customrecord_avt_ifs_item_package",
                    filters:
                        [
                            ["custrecord_avt_ifs_item_package_item", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custitem_shipping_label_description",
                                join: "CUSTRECORD_AVT_IFS_ITEM_PACKAGE_INV_ITEM",
                                label: "Shipping Label Description"
                            })
                        ]
                });
                var dataLength = customrecord_avt_ifs_item_packageSearchObj.run().getRange({
                    start: 0,
                    end: 1
                });
                for (var b = 0; b < dataLength.length; b++) {
                    obj = {};
                    obj.data = dataLength[b].getValue({name: 'custitem_shipping_label_description', join: 'CUSTRECORD_AVT_IFS_ITEM_PACKAGE_INV_ITEM'});
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return obj;
        }
        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        };

    });
