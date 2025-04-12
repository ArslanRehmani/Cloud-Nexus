/*
 ***********************************************************************
 * Author:		Muhammad Waqas
 * File:		CNL_ZG_UE_BinPutAwayWorkSheetAMCAN.js
 * Date:		07 Feb 2024
 ************************************************************************/
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (log, record, runtime, search) => {

        /**
         * On save Create a Bin Put-Away Worksheet record and create inventory subrecord on line level.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            var title = 'afterSubmit[*_*]'
            try {
                var rec = scriptContext.newRecord;
                var locationId = runtime.getCurrentScript().getParameter({ name: 'custscript_bin_putaway_loc' });
                switch (locationId) { // MISS: 104 , 105	EDM, 106	CHI
                    case '1':  //Mississauga MISS
                        PutAwayBin = 104;
                        log.debug({ title: 'Location->Bin', details: 'MISS->' + PutAwayBin });
                        break;
                    case '4': //Edmonton EDM
                        PutAwayBin = 105;
                        log.debug({ title: 'Location->Bin', details: 'EDM->' + PutAwayBin });
                        break;
                    case '12': //Chicago CHI
                        PutAwayBin = 106;
                        log.debug({ title: 'Location->Bin', details: 'CHI->' + PutAwayBin });
                        break;
                    default:
                        log.error({ title: 'DEFAULT CASE:', details: 'SWITCH Default ran' });
                        break;
                }

                // log.debug({ title: 'locationId', details: locationId });
                var binPutAway = record.create({
                    type: 'binworksheet',
                    isDynamic: true,
                    defaultValues: {
                        location: locationId
                    }
                });

                var itemCount = binPutAway.getLineCount({
                    sublistId: 'item'
                });
                if (itemCount && itemCount > 0) {
                    for (var i = 0; i < itemCount; i++) {

                        var quantity = binPutAway.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var itemName = binPutAway.getSublistValue({ sublistId: 'item', fieldId: 'itemname', line: i });
                        var itemID = binPutAway.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                        //if (itemID != 117680)
                        //continue;
                        binPutAway.selectLine({ sublistId: 'item', line: i });


                        var serialnumbers = searchLotNumbersFromItem(itemID, locationId);

                        log.debug({ title: 'serialnumbers.length', details: serialnumbers.length });

                        var inventoryDetails = binPutAway.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });

                        //line item 1 subrecord 1 bin 1


                        if (serialnumbers.length > 0) {
                            var loopQty = 0;
                            for (k = 0; k < serialnumbers.length; k++) { //k<serialnumbers.length
                                log.debug({ title: 'k', details: k });
                                log.debug({ title: 'loopQty', details: loopQty });
                                log.debug({ title: 'serialnumbers[k]', details: serialnumbers[k] });
                                loopQty += parseInt(serialnumbers[k].quantity);

                                inventoryDetails.selectNewLine({
                                    sublistId: 'inventoryassignment'
                                });
                                log.debug({ title: 'serialnumbers[k].quantity', details: serialnumbers[k].quantity });
                                log.debug({ title: 'loopQty', details: loopQty });

                                inventoryDetails.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'issueinventorynumber',
                                    value: serialnumbers[k].inventorynumber
                                });
                                inventoryDetails.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'binnumber',
                                    value: PutAwayBin
                                });
                                inventoryDetails.setCurrentSublistValue({
                                    sublistId: 'inventoryassignment',
                                    fieldId: 'quantity',
                                    value: serialnumbers[k].quantity
                                });
                                inventoryDetails.commitLine({
                                    sublistId: 'inventoryassignment'
                                });

                                if (loopQty >= quantity) {
                                    loopQty = 0;
                                    break;
                                    //k=serialnumbers.length;
                                }
                            }

                            // inventoryDetails.commit();
                            binPutAway.commitLine({
                                sublistId: 'item'
                            });
                        }
                        else {
                            inventoryDetails.selectNewLine({
                                sublistId: 'inventoryassignment'
                            });
                            inventoryDetails.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'quantity',
                                value: quantity
                            });
                            inventoryDetails.setCurrentSublistValue({
                                sublistId: 'inventoryassignment',
                                fieldId: 'binnumber',
                                value: PutAwayBin
                            });
                            inventoryDetails.commitLine({
                                sublistId: 'inventoryassignment'
                            });

                            // inventoryDetails.commit();
                            binPutAway.commitLine({
                                sublistId: 'item'
                            });
                        }
                    }

                    var id = binPutAway.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    log.debug({ title: 'Bin Worksheet Id', details: id });
                }
            } catch (e) {
                log.error({ title: title + ' ' + e.name, details: e.message });
            }
        }
        function searchLotNumbersFromItem(itemID, locationId) {
            var title = 'searchLotNumbersFromItem[*_*]';
            var obj;
            var array = [];
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["type", "anyof", "Assembly", "InvtPart"],
                            "AND",
                            ["islotitem", "is", "T"],
                            "AND",
                            ["inventorydetail.binnumber", "anyof", "@NONE@"],
                            "AND",
                            ["inventorydetail.location", "anyof", locationId],
                            "AND",
                            ["internalid", "anyof", itemID]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "inventorynumber",
                                join: "inventoryDetail",
                                label: " Number"
                            }),
                            search.createColumn({
                                name: "binnumber",
                                join: "inventoryDetail",
                                label: "Bin Number"
                            }),
                            search.createColumn({
                                name: "location",
                                join: "inventoryDetail",
                                label: "Location"
                            }),
                            search.createColumn({
                                name: "quantity",
                                join: "inventoryDetail",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "lineid",
                                join: "inventoryDetail",
                                label: "Line ID"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "inventoryDetail",
                                label: "Internal ID"
                            })
                        ]
                });
                itemSearchObj.run().each(function (result) {
                    obj = {};
                    obj.inventorynumber = result.getValue({ name: 'inventorynumber', join: 'inventoryDetail' });
                    obj.binnumber = result.getValue({ name: 'binnumber', join: 'inventoryDetail' });
                    obj.location = result.getValue({ name: 'location', join: 'inventoryDetail' });
                    obj.quantity = result.getValue({ name: 'quantity', join: 'inventoryDetail' });
                    obj.lineid = result.getValue({ name: 'lineid', join: 'inventoryDetail' });
                    obj.internalid = result.getValue({ name: 'internalid', join: 'inventoryDetail' });
                    array.push(obj);
                    return true;
                });
            } catch (e) {
                log.error({ title: title + ' ' + e.name, details: e.message });
            }
            return array || [];
        }
        return { afterSubmit }

    });
