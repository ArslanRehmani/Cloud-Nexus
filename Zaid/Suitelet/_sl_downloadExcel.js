/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/file'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{file} file
 */
    (log, record, search, serverWidget, file) => {

        const onRequest = (scriptContext) => {
            var title = 'onRequest[::]';
            try {
                if (scriptContext.request.method === 'GET') {
                    var response = scriptContext.response;
                    var params = scriptContext.request.parameters;
                    var vendorID = params.id;
                    // log.debug(title + "vendorID", vendorID);
                    var vendorPoResults = vendorRelatedPO(vendorID);
                    var POIdandItemArray = vendorRelatedPOandItem(vendorID);
                    log.debug({
                        title: 'Backorder So items on Vendor POs',
                        details: POIdandItemArray
                    });
                    var itemsOnSOResults = itemsOnSo(vendorPoResults);
                    log.debug({
                        title: 'Backordered Items on SO',
                        details: itemsOnSOResults
                    });
                    var csvFileId = combineResultsandCreateCSV(itemsOnSOResults, POIdandItemArray);
                    if (csvFileId != 0) {
                        // Write the file to the response
                        var fileObj = file.load({ id: csvFileId });
                        response.writeFile(fileObj);
                    } else {
                        response.writeFile('No Data is Available');
                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function vendorRelatedPO(id) {
            var title = 'titleName[::]';
            var obj;
            var array = [];
            try {
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "PurchOrd"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["status", "anyof", "PurchOrd:B", "PurchOrd:D", "PurchOrd:E"],
                            "AND",
                            ["item", "noneof", "@NONE@"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["formulanumeric: {quantity}-NVL({quantityshiprecv},0)-NVL({quantityonshipments},0)", "greaterthanorequalto", "1"],
                            "AND",
                            ["closed", "is", "F"],
                            "AND",
                            ["vendor.internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({
                                name: "altname",
                                join: "vendor",
                                label: "Name"
                            }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({ name: "quantityshiprecv", label: "Quantity Fulfilled/Received" }),
                            search.createColumn({ name: "quantityonshipments", label: "Quantity on Shipments" })
                        ]
                });
                purchaseorderSearchObj.run().each(function (result) {
                    obj = {};
                    // obj.internalId = result.getValue({ name: 'item' });
                    array.push(result.getValue({ name: 'item' }));
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }
        function vendorRelatedPOandItem(id) {
            var title = 'titleName[::]';
            var obj;
            var array = [];
            try {
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "PurchOrd"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["status", "anyof", "PurchOrd:B", "PurchOrd:D", "PurchOrd:E"],
                            "AND",
                            ["item", "noneof", "@NONE@"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["formulanumeric: {quantity}-NVL({quantityshiprecv},0)-NVL({quantityonshipments},0)", "greaterthanorequalto", "1"],
                            "AND",
                            ["closed", "is", "F"],
                            "AND",
                            ["vendor.internalid", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "GROUP",
                                label: "Internal ID"
                            }),
                            search.createColumn({
                                name: "tranid",
                                summary: "GROUP",
                                label: "Document Number"
                            }),
                            search.createColumn({
                                name: "item",
                                summary: "GROUP",
                                label: "Item"
                            }),
                            search.createColumn({
                                name: "altname",
                                join: "vendor",
                                summary: "GROUP",
                                label: "Vendor"
                            }),
                            search.createColumn({
                                name: "memo",
                                summary: "GROUP",
                                label: "Memo"
                            }),
                            search.createColumn({
                                name: "quantity",
                                summary: "SUM",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "quantityshiprecv",
                                summary: "SUM",
                                label: "Quantity Fulfilled/Received"
                            }),
                            search.createColumn({
                                name: "formulanumeric",
                                summary: "SUM",
                                formula: "NVL({quantityonshipments},0)",
                                label: "Qty on Shipments"
                            }),
                            search.createColumn({
                                name: "formulanumeric1",
                                summary: "SUM",
                                formula: "{quantity}-NVL({quantityshiprecv},0)-NVL({quantityonshipments},0)",
                                label: "Quantity Remaining"
                            })
                        ]
                });
                purchaseorderSearchObj.run().each(function (result) {
                    obj = {};
                    obj.poId = result.getValue({ name: 'tranid', summary: search.Summary.GROUP });
                    obj.item = result.getText({ name: 'item', summary: search.Summary.GROUP });
                    obj.quantityOrder = result.getValue({ name: 'quantity', summary: search.Summary.SUM });
                    obj.qtyFullyReceived = result.getValue({ name: 'quantityshiprecv', summary: search.Summary.SUM });
                    obj.qtyOnShip = result.getValue({ name: 'formulanumeric', summary: search.Summary.SUM });
                    obj.qtyRemain = result.getValue({ name: 'formulanumeric1', summary: search.Summary.SUM });
                    obj.memo = result.getValue({ name: 'memo', summary: search.Summary.GROUP });
                    array.push(obj);
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }
        function itemsOnSo(arr) {
            var title = 'itemsOnSo[::]';
            try {
                var obj;
                var array = [];
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["item", "noneof", "@NONE@"],
                            "AND",
                            ["taxline", "is", "F"],
                            "AND",
                            ["shipping", "is", "F"],
                            "AND",
                            ["mainline", "is", "F"],
                            "AND",
                            ["formulanumeric: {quantity}-NVL({quantitycommitted},0)-NVL({quantityshiprecv},0)", "greaterthanorequalto", "1"],
                            "AND",
                            ["closed", "is", "F"],
                            "AND",
                            ["item", "noneof", "457", "131357"],
                            "AND",
                            // ["item", "anyof", "129524"],
                            ["item", "anyof"].concat(arr),
                            "AND",
                            ["status", "anyof", "SalesOrd:D", "SalesOrd:E", "SalesOrd:B"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "statusref", label: "Status" }),
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({ name: "quantitycommitted", label: "Quantity Committed" }),
                            search.createColumn({ name: "quantityshiprecv", label: "Quantity Fulfilled/Received" }),
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "{quantity}-NVL({quantitycommitted},0)-NVL({quantityshiprecv},0)",
                                label: "Qty BackOrdered"
                            })
                        ]
                });
                salesorderSearchObj.run().each(function (result) {
                    obj = {};
                    obj.soId = result.getValue({ name: 'tranid' });
                    obj.item = result.getText({ name: 'item' });
                    // obj.quantity = result.getValue({ name: 'quantity' });
                    // obj.qtyCommited = result.getValue({ name: 'quantitycommitted' });
                    // obj.qtyReceived = result.getValue({ name: 'quantityshiprecv' });
                    obj.qtyBackOrder = result.getValue({ name: 'formulanumeric' });
                    array.push(obj);
                    return true;
                });
                return array || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function combineResultsandCreateCSV(itemOnSo, itemOnPO) {
            var title = 'combineResultsandCreateCSV[::]';
            try {
                var matchedItems = {};

                itemOnSo.forEach(function (so) {
                    itemOnPO.forEach(function (po) {
                        if (so.item === po.item) {
                            if (!matchedItems[so.item]) {
                                matchedItems[so.item] = [];
                            }

                            matchedItems[so.item].push({
                                soId: `${so.soId}(${so.qtyBackOrder})`,
                                poId: po.poId,
                                qtyOrder: po.quantityOrder,
                                qtyFullyReceived: po.qtyFullyReceived,
                                qtyOnShip: po.qtyOnShip,
                                qtyRemain: po.qtyRemain,
                                memo: po.memo
                            });
                        }
                    });
                });

                // Remove items with empty poId array
                Object.keys(matchedItems).forEach(function (item) {
                    if (matchedItems[item].length === 0) {
                        delete matchedItems[item];
                    }
                });

                // Convert matchedItems to the required format
                var formattedItems = {};
                Object.keys(matchedItems).forEach(function (item) {
                    matchedItems[item].forEach(function (entry, index) {
                        formattedItems[`${item} (${entry.poId})`] = {
                            soId: [entry.soId],
                            poId: [entry.poId],
                            qtyOrder: entry.qtyOrder,
                            qtyFullyReceived: entry.qtyFullyReceived,
                            qtyOnShip: entry.qtyOnShip,
                            qtyRemain: entry.qtyRemain,
                            memo: entry.memo
                        };
                    });
                });


                if (Object.keys(formattedItems)) {
                    var data = formattedItems;

                    // Prepare CSV content
                    var csvContent = 'Item,SOID,POID,Qty Order, Qty Received,Qty Shipped,Qty Remaining,Memo\n';

                    for (var itemId in data) {
                        if (data.hasOwnProperty(itemId)) {
                            var itemData = data[itemId];
                            var poIds = itemData.poId.join('|');
                            var soIds = itemData.soId.join('|');
                            var qtyOrder = itemData.qtyOrder;
                            var qtyFullyReceived = itemData.qtyFullyReceived;
                            var qtyOnShip = itemData.qtyOnShip;
                            var qtyRemain = itemData.qtyRemain;
                            var memo = itemData.memo;
                            // csvContent += itemId + ',' + poIds + ',' + soIds + '\n';
                            csvContent += itemId + ',' + soIds + ',' + poIds + ',' + qtyOrder + ',' + qtyFullyReceived + ',' + qtyOnShip + ',' + qtyRemain + ',' + memo + '\n';
                        }
                    }
                    var currentDateAndTime = new Date();
                    // Create CSV file
                    var csvFile = file.create({
                        name: 'PO SO Report ' + currentDateAndTime + '.csv',
                        fileType: file.Type.CSV,
                        contents: csvContent,
                        folder: 418935
                    });

                    // Save the CSV file in the File Cabinet
                    var fileId = csvFile.save();
                    log.debug({
                        title: 'fileId',
                        details: fileId
                    });
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return fileId || 0;
        }

        return { onRequest }

    });
