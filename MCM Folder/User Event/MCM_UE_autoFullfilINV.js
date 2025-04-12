/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {
    function afterSubmit(context) {
        var title = 'afterSubmit(::)';
        try {
            var rec = context.newRecord;
            var recID = rec.id;
            var createdPOArray = [];
            var obj;
            var dropShip = rec.getValue({ fieldId: 'custbody9' });
            log.debug('dropShip', dropShip);
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", recID],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "purchaseorder", label: "Purchase Order" }),
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "location", label: "Location" })
                    ]
            });
            salesorderSearchObj.run().each(function (result) {
                obj = {};
                obj.item = result.getValue({ name: 'item' });
                obj.purchaseorder = result.getValue({ name: 'purchaseorder' });
                obj.location = result.getValue({ name: 'location' });
                createdPOArray.push(obj);
                return true;
            });
            log.debug('createdPOArray', createdPOArray);
            var lineCount = rec.getLineCount({
                sublistId: 'item'
            });
            for (var i = 0; i < lineCount; i++) {
                var firstLine = createdPOArray[i];
                var lineItem = firstLine.item;
                var createdFromPO = firstLine.purchaseorder;
                var lineLocation = firstLine.location;
                if (dropShip == true && !!lineItem && !!createdFromPO && ((lineLocation == 10 || lineLocation == 11))) {
                    log.debug({
                        title: 'first LIne',
                        details: 'YES'
                    });
                    // var itemFulFillmentRecord = record.create({
                    //     type: 'itemfulfillment'
                    // });
                    // itemFulFillmentRecord.setValue({fieldId : 'entity', value: customer});
                    // itemFulFillmentRecord.setValue({fieldId : 'createdfrom', value: recID});
                    // itemFulFillmentRecord.setText({fieldId : 'shipstatus', value: 'Shipped'});
                    // itemFulFillmentRecord.setSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'item',
                    //     line: 0,
                    //     value: lineItem,
                    //     forceSyncSourcing: true
                    // });
                    // var ID = itemFulFillmentRecord.save({
                    //     enableSourcing: true,
                    //     ignoreMandatoryFields: true
                    // });

                    var itemFulFillmentRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: recID,
                        toType: 'itemfulfillment'
                    });
                    var IFID = itemFulFillmentRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug({
                        title: 'itemFulfillmentId IFID',
                        details: IFID
                    });
                    var IFObj = record.load({
                        type: 'itemfulfillment',
                        id: IFID
                    });
                    IFObj.setValue({ fieldId: 'shipstatus', value: 'C' });
                    var IFstatusID = IFObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug({
                        title: 'IFstatusID',
                        details: IFstatusID
                    });
                }
            }
            var invoiceRecordID = record.transform({
                fromType: record.Type.SALES_ORDER,
                fromId: recID,
                toType: 'invoice',
                isDynamic: true,
            });
            var INVID = invoiceRecordID.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug({
                title: 'invoiceRecordID ID',
                details: INVID
            });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }
    return {
        afterSubmit: afterSubmit
    }
});
