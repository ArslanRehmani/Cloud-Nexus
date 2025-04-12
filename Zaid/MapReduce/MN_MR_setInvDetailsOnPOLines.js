/**
 *@NApiVersion 2.0
*@NScriptType MapReduceScript
*/
define(['N/runtime', 'N/log', 'N/search', 'N/record'], function (runtime, log, search, record) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var schedule = runtime.getCurrentScript().getParameter({
                name: 'custscript_am_scheduled'
            });
            if (schedule) {
                var pendingPOArray = pendingPoArraySearch();
                var obj;
                var array = [];
                if (pendingPOArray && pendingPOArray.length) {
                    for (var k = 0; k < pendingPOArray.length; k++) {
                        obj = {};
                        var data = pendingPOArray[k].idArray;
                        var ar = JSON.parse(data);
                        log.debug({
                            title: 'ar',
                            details: ar
                        });
                        obj.id = ar[0]['id'];
                        obj.type = ar[0]['type'];
                        array.push(obj);
                    }
                }
                return array || [];
            } else {
                var recId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_po_id'
                });
                var recType = runtime.getCurrentScript().getParameter({
                    name: 'custscript_po_type'
                });
                var POIdTypeArray = [{ 'id': recId, 'type': recType }];
                return POIdTypeArray || [];
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function map(context) {
        var title = '(::)';
        try {
            var poIdArray = JSON.parse(context.value);
            var recId = poIdArray.id;
            var recType = poIdArray.type;
            var poObj = record.load({
                type: recType,
                id: recId,
                isDynamic: true
            });
            var location = poObj.getValue({ fieldId: 'location' });

            //////IF LOCATION IS ABC, Mississauga & ABC, Montreal (this location doesn't use Bin Number)
            //////ABC, Edmonton = 4
            //////ABC, Vancouver = 3
            ////// ABCUS, Dallas = 10
            //////ABCUS, Chicago = 12
            //////ABCUS, Los Angeles = 20

            if (location == 1 || location == 2 || location == 3 || location == 4 || location == 10 || location == 12 || location == 20) {
                var lineItemCount = poObj.getLineCount({
                    sublistId: 'item'
                });
                log.debug({
                    title: 'MN_UE_SetInvtDetails_AS function',
                    details: 'lineItemCount: ' + lineItemCount
                });
                var updateRecord = true;

                var binNumber = '';

                if (location == 1) {
                    binNumber = '104';
                }
                else if (location == 4) {
                    binNumber = '105';///?EDM
                }
                else if (location == 12) {
                    binNumber = '106';///?CHI
                }
                var lotNumber = 'GOLIVE05132022'

                for (var i = 0; i < lineItemCount; i++) {
                    poObj.selectLine({
                        sublistId: "item",
                        line: i
                    });
                    var qty = poObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });
                    var shpqty = poObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantityonshipments'
                    });
                    var itemId = poObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    var rate = poObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate'
                    });
                    var description = " Duplicate Item Split Due to partial Inbound shipment, Orig qty:" + qty

                    if (shpqty && Number(shpqty) != Number(qty)) {

                        var diff = Number(qty) - Number(shpqty)
                        log.debug({
                            title: 'diff',
                            details: diff
                        });
                        poObj.removeCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });
                        poObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: shpqty
                        });
                        poObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_line_description',
                            value: 'Original Item Split Qty:' + qty
                        });
                        poObj.commitLine({
                            sublistId: 'item'
                        });
                        
                        poObj.selectNewLine({
                            sublistId: 'item'
                        });
                        poObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: itemId
                        });//MISS
                        poObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: rate
                        });
                        poObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: diff
                        });
                        poObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_line_description',
                            value: description
                        });
                        poObj.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
                poObj.save({
                    ignoreMandatoryFields: true
                });
                var poObj = record.load({
                    type: recType,
                    id: recId,
                    isDynamic: true
                });
                var lineItemCount1 = poObj.getLineCount({
                    sublistId: 'item'
                });
                for(var k = 0; k < lineItemCount1; k++){
                    poObj.selectLine({
                        sublistId: "item",
                        line: k
                    });
                    var qty = poObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity'
                    });
                    var hasSubrecord = false;
                    try {
                        hasSubrecord = poObj.hasCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });
                    } catch (ex) {
                        log.error("error123", ex.toString());
                    }
                    var objSubRecord = poObj.getCurrentSublistSubrecord({
                        sublistId: 'item',
                        fieldId: 'inventorydetail'
                    });
                    var invQty = 0;
                    var subRecLineCount = objSubRecord.getLineCount({ sublistId: "inventoryassignment" });
                    if (subRecLineCount > 0) {
                        invQty = objSubRecord.getSublistValue({
                            sublistId: "inventoryassignment",
                            fieldId: "quantity",
                            line: 0
                        });
                    }
                    if (hasSubrecord && invQty > 0 && (invQty != qty)) {
                        objSubRecord.selectLine({ sublistId: "inventoryassignment", line: 0 });
                        objSubRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'binnumber',
                            value: binNumber
                        });
                        objSubRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'receiptinventorynumber',
                            value: 'GOLIVE05132022'
                        });//Serial / Lot Number
                        objSubRecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: qty
                        });
                        objSubRecord.commitLine({
                            sublistId: 'inventoryassignment'
                        });
                        poObj.commitLine({ sublistId: "item" });
                    }
                    if (!hasSubrecord) {
                        var qty = poObj.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity'
                        });
                        var itemId = poObj.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });

                        var islotitem = search.lookupFields({
                            type: 'item',
                            id: itemId,
                            columns: ['islotitem']
                        }).islotitem;
                        log.debug({
                            title: 'islotitem',
                            details: 'islotitem: ' + islotitem
                        });

                        if (!isEmpty(islotitem) && islotitem == true) {
                            var isInventoryAvail = poObj.getCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'inventorydetailavail'
                            });
                            var invDetailSubrecord;

                            if (isInventoryAvail == 'F' || isInventoryAvail == false) {
                                //////create line item sub records
                                invDetailSubrecord = poObj.getCurrentSublistSubrecord({
                                    sublistId: 'item',
                                    fieldId: 'inventorydetail'
                                });
                                invDetailSubrecord.selectNewLine({ sublistId: "inventoryassignment"});
                                invDetailSubrecord.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    value: binNumber
                                });
                                invDetailSubrecord.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'receiptinventorynumber',
                                    value: 'GOLIVE05132022'
                                });//Serial / Lot Number
                                invDetailSubrecord.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: qty
                                });
                                invDetailSubrecord.commitLine({
                                    sublistId: 'inventoryassignment'
                                });
                                poObj.commitLine({ sublistId: "item" });
                            } else {
                                invDetailSubrecord = poObj.getCurrentSublistSubrecord({
                                    sublistId: 'item',
                                    fieldId: 'inventorydetail'
                                });

                                if (!invDetailSubrecord) {
                                    invDetailSubrecord = poObj.getCurrentSublistSubrecord({
                                        sublistId: 'item',
                                        fieldId: 'inventorydetail'
                                    });
                                }
                                var subRecLines = invDetailSubrecord.getLineCount({
                                    sublistId: 'inventoryassignment'
                                });
                                log.debug({
                                    title: 'MN_UE_SetInvtDetails_AS function',
                                    details: 'subRecLines: ' + subRecLines
                                });


                                if (subRecLines <= 0) {
                                    //////create line item sub records
                                    invDetailSubrecord.selectNewLine({ sublistId: "inventoryassignment"});
                                    invDetailSubrecord.setCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'binnumber',
                                        value: binNumber
                                    });
                                    invDetailSubrecord.setCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'receiptinventorynumber',
                                        value: 'GOLIVE05132022'
                                    });//Serial / Lot Number 
                                    invDetailSubrecord.setCurrentSublistValue({
                                        sublistId: 'inventoryassignment',
                                        fieldId: 'quantity',
                                        value: qty
                                    });
                                    invDetailSubrecord.commitLine({
                                        sublistId: 'inventoryassignment'
                                    });
                                    poObj.commitLine({ sublistId: "item" });
                                }else{
                                    invDetailSubrecord.commitLine({
                                        sublistId: 'inventoryassignment'
                                    });
                                    poObj.commitLine({ sublistId: "item" });
                                }
                            }
                        }
                    }
                }
                if (updateRecord) {
                    poObj.save({
                        ignoreMandatoryFields: true
                    });
                }
                var remaining = parseInt(runtime.getCurrentScript().getRemainingUsage());
                log.debug({
                    title: 'remaining',
                    details: remaining
                });
            }
        } catch (e) {
            log.debug('Exception', e);
        }
    }
    /**
     * Return true if object is empty
    */
    function isEmpty(value) {
        if (value == null || value == 'null' || value == undefined || value == 'undefined' || value == '' || value == "" || value.length <= 0) {
            return true;
        }
        return false;
    }
    function pendingPoArraySearch() {
        var title = 'pendingPoArraySearch(::)';
        try {
            var obj;
            var array = [];
            var customrecord_amcan_pending_po_recSearchObj = search.create({
                type: "customrecord_amcan_pending_po_rec",
                filters:
                    [
                        ["custrecord151", "is", "Pending"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord150", label: "Pending PO" }),
                        search.createColumn({ name: "custrecord151", label: "PO Status" })
                    ]
            });
            customrecord_amcan_pending_po_recSearchObj.run().each(function (result) {
                obj = {};
                obj.idArray = result.getValue({ name: 'custrecord150' });
                array.push(obj);
                record.submitFields({
                    type: 'customrecord_amcan_pending_po_rec',
                    id: result.id,
                    values: {
                        'custrecord151': 'Completed'
                    }
                });
                return true;
            });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return array || [];
    }
    return {
        getInputData: getInputData,
        map: map
    }
});
