/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 *@NScriptType UserEventScript
 */


define(['N/record', 'N/search', 'N/runtime', 'N/url', 'N/https', 'N/search'],
    function (record, search, runtime, url, https, search) {
        function afterSubmit(context) {
            try {
                const type = context.type;
                var objRecord = context.newRecord;
                var recordId = context.newRecord.id;
                var rectype = context.newRecord.type
                if (type === context.UserEventType.CREATE || type === context.UserEventType.EDIT) {
                    log.debug('recordId', recordId);
                    log.debug('rectype', rectype);
                    var invoiceRec = record.load({
                        type: rectype,
                        id: recordId,
                    });

                    invoiceDate = new Date(invoiceRec.getValue('trandate')) || '';
                    invoiceDateText = new Date(invoiceRec.getText('trandate')) || '';
                    custId = invoiceRec.getValue('entity') || '';
                    var lookupResults = search.lookupFields({
                        type: search.Type.ENTITY,
                        id: custId,
                        columns: ['recordtype']
                    })
                    entityIdRecType = lookupResults.recordtype;
                    if (entityIdRecType == 'customer') {
                        var custRec = record.load({
                            type: entityIdRecType,
                            id: custId
                        })
                        var curLatestInvDate = new Date(custRec.getValue({
                            fieldId: 'custentity_lastinvoice_date'
                        }))
                        var curLatestInvDateText = new Date(custRec.getText({
                            fieldId: 'custentity_lastinvoice_date'
                        }))

                        if (curLatestInvDate) {
                            log.debug('curLatestInvDate', curLatestInvDate);
                            log.debug('invoiceDate', invoiceDate);
                            var dateToSet = (invoiceDateText < curLatestInvDateText) ? curLatestInvDate : invoiceDate
                           // var dateToSetText = (invoiceDateText < curLatestInvDateText) ? curLatestInvDateTextText : invoiceDate

                            log.debug('dateToSet', dateToSet);
                          //  log.debug('dateToSetText', dateToSetText);
                            custRec.setValue({
                                fieldId: 'custentity_lastinvoice_date',
                                value: dateToSet
                            })
                        } else {
                            log.debug('invoiceDate', invoiceDate);

                            custRec.setValue({
                                fieldId: 'custentity_lastinvoice_date',
                                value: invoiceDate
                            })
                        }
                        log.debug('beforeSet', custRec.getValue({
                            fieldId: 'custentity_lastinvoice_date'
                        }));

                        var invDate = custRec.getValue({
                            fieldId: 'custentity_lastinvoice_date'
                        });

                        var custRec = custRec.save();

                        log.debug('custRec', custRec);

                        if (custRec) {

                            setParentCustomerLastInvoiceDate(custRec, invDate, invoiceDateText);
                        }
                    }
                }
            } catch (error) {

                log.debug('error', error);
            }

        }

        function setParentCustomerLastInvoiceDate(custRec, invDate, invoiceDateText) {
            try {

                var customerSearch = search.create({
                    type: "customer",
                    filters:
                        [
                            ["internalid", "anyof", custRec]
                        ],
                    columns:
                        [
                            "entityid",
                            search.createColumn({
                                name: "internalid",
                                join: "parentCustomer"
                            }),
                            search.createColumn({
                                name: "entityid",
                                join: "parentCustomer"
                            }),
                            search.createColumn({
                                name: "parent",
                                join: "parentCustomer"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "topLevelParent"
                            })
                        ]
                });

                var searchResult = customerSearch.run().getRange({ start: 0, end: 1 });

                if (searchResult.length > 0) {

                    var parentCustomer = searchResult[0].getValue({
                        name: "internalid",
                        join: "parentCustomer"
                    }) || '';

                    if (parentCustomer) {

                        setInvDate(invDate, parentCustomer, invoiceDateText);
                    }

                    var nextParentCustomer = searchResult[0].getValue({
                        name: "parent",
                        join: "parentCustomer"
                    }) || '';

                    if (nextParentCustomer != parentCustomer) {

                        setInvDate(invDate, nextParentCustomer, invoiceDateText);
                    }

                    var topLevelParentCustomer = searchResult[0].getValue({
                        name: "internalid",
                        join: "topLevelParent"
                    }) || '';

                    if (topLevelParentCustomer != nextParentCustomer) {

                        setInvDate(invDate, topLevelParentCustomer, invoiceDateText);
                    }
                }

            }
            catch (e) {
                log.error('setParentCustomerLastInvoiceDate Exception', e.message);
            }
        }

        function setInvDate(invoiceDate, custId, invoiceDateText) {

            try {

                log.debug('Customer ID', custId);

                var custRec = record.load({
                    type: 'customer',
                    id: custId
                })

                var curLatestInvDate = new Date(custRec.getValue({
                    fieldId: 'custentity_lastinvoice_date'
                }))

                var curLatestInvDateText = new Date(custRec.getText({
                    fieldId: 'custentity_lastinvoice_date'
                }))

                if (curLatestInvDate) {

                    var dateToSet = (invoiceDateText < curLatestInvDateText) ? curLatestInvDate : invoiceDate

                    custRec.setValue({
                        fieldId: 'custentity_lastinvoice_date',
                        value: dateToSet
                    })

                } else if (invoiceDate) {
                    custRec.setValue({
                        fieldId: 'custentity_lastinvoice_date',
                        value: invoiceDate
                    })
                }

                custRec.save({ ignoreMandatoryFields: true });

            }
            catch (e) {

            }
        }
        return {
            afterSubmit: afterSubmit
        }
    });