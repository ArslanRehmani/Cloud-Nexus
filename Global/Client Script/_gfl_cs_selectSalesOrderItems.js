/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search'],
    function (record, search) {
        /**
             * @param{record} record
             * @param{search} search
             */
        function pageInit(context) {
            var title = 'pageInit(::)';
            try {
                var rec = context.currentRecord;
                    var salesOrderId = rec.getValue({ fieldId: 'custrecord_gfl_job_card_sales' });
                    if (salesOrderId){
                        var searchResult = searchResults(salesOrderId);
                        var ref = searchResult[0].reference;
                            rec.setValue({ fieldId: 'custrecord_gfl_reference', value: ref });
                            var customer = searchResult[0].custId;
                            log.debug({
                                title: 'customer',
                                details: customer
                            });
                            rec.setValue({ fieldId: 'custrecord_gfl_job_card_customer', value: customer });
                        for (var i = 0; i < searchResult.length; i++) {
                            var data = searchResult[i];
                            log.debug({
                                title: 'i',
                                details: i
                            });
                            rec.selectNewLine({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                            })
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord_item_id',
                                value: data.sku
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord_glf_item_description',
                                value: data.description
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord_gfl_job_card_item_quantity',
                                value: data.quantity
                            });
                            var assemblyHour, ScopeOfWorks = '';
                            assemblyHour = data.assemblyHour;
                            if (assemblyHour !== '') {
                                var x = parseInt(assemblyHour);
                                if (x <= 0.7) {
                                    ScopeOfWorks = 'Standard Bike Assembly';
                                } else if (0.7 < x <= 0.9) {
                                    ScopeOfWorks = 'Electric Bike Assembly';
                                } else if (0.9 < x <= 1.5) {
                                    ScopeOfWorks = 'E-Trike/Trike Assembly';
                                }
                            }
                            if (type == '4') {
                                rec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_glf_job_card_link',
                                    fieldId: 'custrecord_gfl_job_card_sow',
                                    value: ScopeOfWorks
                                });
                            } else {
                                rec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_glf_job_card_link',
                                    fieldId: 'custrecord_gfl_job_card_sow',
                                    value: ''
                                });
                            }
                            rec.commitLine({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                            })
                        }
                    }

            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
        }
        function fieldChanged(context) {
            try {
                var rec = context.currentRecord;
                var fieldid = context.fieldId;
                var type = rec.getValue({ fieldId: 'custrecord_gfl_job_card_type' });
                if (fieldid == 'custrecord_gfl_job_card_sales' || fieldid == 'custrecord_gfl_job_card_type') {
                    var soId = rec.getValue({ fieldId: 'custrecord_gfl_job_card_sales' });
                    if (soId) {
                        var searchResult = searchResults(soId);
                        log.debug({
                            title: 'searchResult',
                            details: searchResult
                        });
                        var ref = searchResult[0].reference;
                        rec.setValue({ fieldId: 'custrecord_gfl_reference', value: ref });
                        var customer = searchResult[0].custId;
                        log.debug({
                            title: 'customer',
                            details: customer
                        });
                        rec.setValue({ fieldId: 'custrecord_gfl_job_card_customer', value: customer });
                        for (var i = 0; i < searchResult.length; i++) {
                            var data = searchResult[i];
                            log.debug({
                                title: 'i',
                                details: i
                            });
                            rec.selectNewLine({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                            })
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord_item_id',
                                value: data.sku
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord_glf_item_description',
                                value: data.description
                            });
                            rec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                                fieldId: 'custrecord_gfl_job_card_item_quantity',
                                value: data.quantity
                            });
                            var assemblyHour, ScopeOfWorks = '';
                            assemblyHour = data.assemblyHour;
                            if (assemblyHour !== '') {
                                var x = parseInt(assemblyHour);
                                if (x <= 0.7) {
                                    ScopeOfWorks = 'Standard Bike Assembly';
                                } else if (0.7 < x <= 0.9) {
                                    ScopeOfWorks = 'Electric Bike Assembly';
                                } else if (0.9 < x <= 1.5) {
                                    ScopeOfWorks = 'E-Trike/Trike Assembly';
                                }
                            }
                            if (type == '4') {
                                rec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_glf_job_card_link',
                                    fieldId: 'custrecord_gfl_job_card_sow',
                                    value: ScopeOfWorks
                                });
                            } else {
                                rec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_glf_job_card_link',
                                    fieldId: 'custrecord_gfl_job_card_sow',
                                    value: ''
                                });
                            }
                            rec.commitLine({
                                sublistId: 'recmachcustrecord_glf_job_card_link',
                            })
                        }
                    }
                }
            }
            catch (e) {
                log.debug('Exception', e);
            }

        }
        function searchResults(soId) {
            try {
                var obj;
                var array = [];
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["internalid", "anyof", soId],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["item", "noneof", "@NONE@"],
                            "AND",
                            ["item.type", "anyof", "InvtPart", "Kit"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                join: "item",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "salesdescription",
                                join: "item",
                                label: "Description"
                            }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({
                                name: "custitem_assemblyhours",
                                join: "item",
                                label: "Assembly Hours"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "item",
                                label: "Internal ID"
                            }),
                            search.createColumn({ name: "custbody1", label: "Reference" }),
                            search.createColumn({
                                name: "altname",
                                join: "customer",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "customer",
                                label: "Internal ID"
                            })
                        ]
                });
                salesorderSearchObj.run().each(function (result) {
                    obj = {};
                    obj.sku = result.getValue({ name: 'internalid', join: 'item' });
                    obj.description = result.getValue({ name: 'salesdescription', join: 'item' });
                    obj.assemblyHour = result.getValue({ name: 'custitem_assemblyhours', join: 'item' });
                    obj.quantity = result.getValue({ name: 'quantity' });
                    obj.reference = result.getValue({ name: 'custbody1' });
                    obj.custId = result.getValue({ name: 'internalid', join: 'customer' });
                    array.push(obj);
                    return true;
                });
                return array || [];
            } catch (e) {
                log.debug('Exception', e);
            }
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged
        };

    });
