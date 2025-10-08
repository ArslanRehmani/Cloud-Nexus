/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/runtime', 'N/log', './RL_Helper'],
    (record, search, runtime, log, RL_Helper) => {

        const getInputData = () => {
            try {
                const token = RL_Helper.authenticate();
                const inventoryList = RL_Helper.getInventory(token);
                // log.debug('Inventory Fetched', inventoryList.length + ' records');
                // log.debug('inventoryList', inventoryList);

                var merged = Object.values(
                    inventoryList.reduce((acc, item) => {
                        let key = item.RegalItemNumber;

                        if (!acc[key]) {
                            // Clone the item into accumulator
                            acc[key] = { ...item };
                        } else {
                            // If already exists, sum up numeric fields
                            acc[key].OnHand += item.OnHand;
                            acc[key].OnHandPCS += item.OnHandPCS;
                            acc[key].Allocated += item.Allocated;
                            acc[key].AllocatedPCS += item.AllocatedPCS;
                            acc[key].Available += item.Available;
                            acc[key].AvailablePCS += item.AvailablePCS;
                            acc[key].Intransit += item.Intransit;
                            acc[key].IntransitPCS += item.IntransitPCS;
                        }

                        return acc;
                    }, {})
                );

                return merged;
                // return inventoryList;
                // return [{ "IsHazardousMaterial": "N", "IsNotCompatibleForSPS": "N", "RegalItemNumber": "302-19-02B", "CustomerItemNumber": null, "SAPMaterialNumber": null, "Pack": 1, "OnHand": 20, "OnHandPCS": 20, "Allocated": 0, "AllocatedPCS": 0, "Available": 20, "AvailablePCS": 20, "Intransit": 0, "IntransitPCS": 0, "UPC": "810119029447", "SKU": null, "Description": "SOMA STEEL BOTTLE - WHITE" }];
            } catch (e) {
                log.error('getInputData Error', e.message);
                return [];
            }
        };

        const map = (context) => {
            try {
                const data = JSON.parse(context.value);
                // log.debug('data', data);
                // log.debug('Processing RegalItemNumber', data.RegalItemNumber);

                const script = runtime.getCurrentScript();
                const subsidiaryId = 14;//FC Brands LLC
                const accountId = 223;
                let itemId, itemType;
                const itemSearch = search.create({
                    type: search.Type.ITEM,
                    filters: [
                        ["formulatext: CASE WHEN {itemid} = '" + data.RegalItemNumber + "' THEN 'YES' ELSE 'NO' END", "is", "YES"],
                        // ["formulatext: CASE WHEN {itemid} = '402-01-01W' THEN 'YES' ELSE 'NO' END", "is", "YES"],
                        'AND',
                        ['type', 'anyof', ['InvtPart', 'Kit', "Assembly"]]
                    ],
                    // columns: ['internalid', 'type']
                    columns: [
                        search.createColumn({name: "type", label: "Type"}),
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                    ]
                }).run().getRange({ start: 0, end: 1 });

                if (itemSearch?.length) {
                    itemId = itemSearch[0].getValue('internalid');
                    itemType = itemSearch[0].getText('type');
                }

                log.debug({
                    title: 'itemType',
                    details: itemType
                });

                if (!itemId) {
                    log.error('Item not found for RegalItemNumber', data.RegalItemNumber);
                    return;
                }

                log.debug("Item Found", `ID: ${itemId} | Type: ${itemType}`);

                if (itemType === "Kit/Package") {
                    adjustKitItem(itemId, data, subsidiaryId, accountId);
                    return;
                }

                adjustInventoryItem(itemId, data, subsidiaryId, accountId);

            } catch (e) {
                log.error('map Error', e.message);
            }
        };

        /**
         * Adjust Inventory for Kit Items
         */
        const adjustKitItem = (kitId, data, subsidiaryId, accountId) => {
            const kitRecord = record.load({
                type: record.Type.KIT_ITEM,
                id: kitId
            });

            const lineCount = kitRecord.getLineCount({ sublistId: 'member' });
            if (!lineCount) {
                log.audit("Empty Kit", `No members found for Kit ID ${kitId}`);
                return;
            }

            const invAdj = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });

            invAdj.setValue({ fieldId: 'subsidiary', value: subsidiaryId });
            invAdj.setValue({ fieldId: 'account', value: accountId });

            for (let i = 0; i < lineCount; i++) {
                const memberId = kitRecord.getSublistValue({ sublistId: 'member', fieldId: 'item', line: i });
                const memberQty = kitRecord.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: i });
                const adjQty = data.Available;

                const loc1 = 36;
                const loc2 = 28;

                if (adjQty !== 0) {
                    invAdj.selectNewLine({ sublistId: 'inventory' });
                    invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: memberId });
                    invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: loc1 });
                    invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: adjQty });
                    invAdj.commitLine({ sublistId: 'inventory' });
                }
            }

            const invAdjId = invAdj.save();
            log.audit('Kit Inventory Adjustment Created 1', `ID: ${invAdjId} for Kit: ${kitId}`);








            const invAdj2 = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });

            invAdj2.setValue({ fieldId: 'subsidiary', value: subsidiaryId });
            invAdj2.setValue({ fieldId: 'account', value: accountId });

            for (let i = 0; i < lineCount; i++) {
                const memberId2 = kitRecord.getSublistValue({ sublistId: 'member', fieldId: 'item', line: i });
                const memberQty = kitRecord.getSublistValue({ sublistId: 'member', fieldId: 'quantity', line: i });

                const adjQty2 = data.Available;
                const loc1 = 36;
                const loc2 = 28;

                if (adjQty2 !== 0) {
                    invAdj2.selectNewLine({ sublistId: 'inventory' });
                    invAdj2.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: memberId2 });
                    invAdj2.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: loc2 });
                    invAdj2.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: adjQty2 });
                    invAdj2.commitLine({ sublistId: 'inventory' });
                }
            }

            const invAdjId2 = invAdj2.save();
            log.audit('Kit Inventory Adjustment Created 2', `ID: ${invAdjId2} for Kit: ${kitId}`);
        };

        /**
         * Adjust Inventory for Inventory Items
         */
        const adjustInventoryItem = (itemId, data, subsidiaryId, accountId) => {

            const adjQty = data.Available;

            if (adjQty === 0) {
                log.audit("No Adjustment Needed", `Item: ${itemId} already matches quantity.`);
                return;
            }

            const loc1 = 36;
            const loc2 = 28;

            const invAdj = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });



            invAdj.setValue({ fieldId: 'subsidiary', value: subsidiaryId });
            invAdj.setValue({ fieldId: 'account', value: accountId });

            invAdj.selectNewLine({ sublistId: 'inventory' });
            invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: itemId });
            invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: loc1 });


            var onHand = invAdj.getCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'quantityonhand',
            });

            var adjustmentQty = adjQty - parseFloat(onHand);

            invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: adjustmentQty });
            invAdj.commitLine({ sublistId: 'inventory' });

            const invAdjId = invAdj.save();
            log.audit('Inventory Adjustment Created 1 INV', `ID: ${invAdjId} for Item: ${itemId}`);


            const invAdj2 = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });

            invAdj2.setValue({ fieldId: 'subsidiary', value: subsidiaryId });
            invAdj2.setValue({ fieldId: 'account', value: accountId });

            invAdj2.selectNewLine({ sublistId: 'inventory' });
            invAdj2.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: itemId });
            invAdj2.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: loc2 });


            var onHand2 = invAdj2.getCurrentSublistValue({
                sublistId: 'inventory',
                fieldId: 'quantityonhand',
            });

            var adjustmentQty2 = adjQty - parseFloat(onHand2);

            invAdj2.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: adjustmentQty2 });
            // invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'newquantity', value: adjQty });
            invAdj2.commitLine({ sublistId: 'inventory' });

            const invAdjId2 = invAdj2.save();
            log.audit('Inventory Adjustment Created 2 INV', `ID: ${invAdjId2} for Item: ${itemId}`);
        };

        return {
            getInputData,
            map
            // reduce, summarize can be added if needed
        };

    });
