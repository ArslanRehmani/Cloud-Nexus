/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/file', 'N/runtime'],
    /**
     * @param{search} search
     * @param{record} record
     * @param{file} file
     * @param{runtime} runtime
     */
    function (search, record, file, runtime) {
        function beforeLoad(context) {
            try {
                if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {

                    var currentRecord = context.newRecord;

                    if (currentRecord.type == 'salesorder' || currentRecord.type == 'invoice' || currentRecord.type == 'cashsale' || currentRecord.type == 'estimate') {

                        var itemLineCount = currentRecord.getLineCount({ sublistId: 'item' });

                        var itemArray = [];

                        itemArray.push("internalid");

                        itemArray.push("anyof");

                        for (var i = 0; i < itemLineCount; i++) {

                            var itemId = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                line: i
                            });

                            if (itemId) {
                                itemArray.push(itemId.toString())
                            }
                        }

                        var itemAvalStock = getItemAvailableStock(itemArray);

                        setAvailableStock(currentRecord, itemAvalStock);

                        //Set Available Qty





                    }
                }

            }
            catch (e) {
                log.error("beforeLoad Exception", e.message);
            }
        }

        function afterSubmit(context) {
            try {

                if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {

                    var currentRecord = context.newRecord;

                    if (currentRecord.type == 'salesorder') {

                        var customerId = currentRecord.getValue('entity');
                        var subMyerCustomerExist = subMyerCustomer(customerId);

                        if (subMyerCustomerExist == true) {// customer = 254592 MYER PTY LTD (Myer Market)


                            var billingInfo = getBillingInfo(currentRecord.id);

                            // log.debug('Billing Info', billingInfo);

                            if (billingInfo.state && billingInfo.zipCode) {

                                var closeOrder = isFMSOrder(billingInfo);

                                if (closeOrder == true) {

                                    var salesOrderObj = record.load({
                                        type: record.Type.SALES_ORDER,
                                        id: currentRecord.id
                                    });
                                    salesOrderObj.setValue({ fieldId: 'memo', value: 'Outside of FMS Zone' });
                                    salesOrderObj.setValue({ fieldId: 'custbody_fms_exclusion_zone', value: true });
                                    var lineCount = salesOrderObj.getLineCount({
                                        sublistId: 'item'
                                    });
                                    if (lineCount && lineCount > 0) {
                                        for (var m = 0; m < lineCount; m++) {
                                            salesOrderObj.setSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'isclosed',
                                                line: m,
                                                value: true
                                            });
                                        }
                                    }
                                    var soId = salesOrderObj.save();
                                    log.debug({
                                        title: 'soId',
                                        details: soId
                                    });

                                }
                            }
                        }

                    }
                }
                if (context.type === context.UserEventType.CREATE) {
                    //  if (context.type === context.UserEventType.EDIT) {
                    if (currentRecord.type == 'salesorder') {

                        transformIntoCashSalesInvoice(context);
                    }

                }

                if (context.type === context.UserEventType.EDIT) {

                    var rec = context.newRecord;

                    if (rec.type == 'salesorder') {

                        checkAutoLocCarrierTriggered(rec);

                        updateOrderTypeWhenShipViaChange(context);

                    }

                }

                //   if (context.type === context.UserEventType.TRANSFORM) {
                var rec = context.newRecord;
                if (rec.type == 'invoice') {

                    log.debug({
                        title: 'INVOICE Transform',
                        details: 'YES'
                    });
                }

            }

            // }
            catch (e) {

                log.error('afterSubmit Exception', e.message);
            }
        }

        function getItemAvailableStock(itemArray) {
            try {
                var itemStockArray = [];

                if (itemArray.length > 0) {

                    var itemStockSearch = search.create({
                        type: "item",
                        filters:
                            [
                                ["type", "anyof", "InvtPart", "Kit"],
                                "AND",
                                itemArray
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "internalid",
                                    summary: "GROUP"
                                }),
                                search.createColumn({
                                    name: "itemid",
                                    summary: "GROUP"
                                }),
                                search.createColumn({
                                    name: "formulatext",
                                    summary: "GROUP",
                                    formula: "CASE WHEN {type} = 'Kit/Package' AND ({memberitem.inventorylocation} = 'Broadmeadows VIC' OR {memberitem.inventorylocation} = 'Wetherill Park NSW' OR {memberitem.inventorylocation} = 'TMS Parkinson QLD') THEN {memberitem.inventorylocation} ELSE (CASE WHEN {type} = 'Inventory Item' AND ({inventorylocation} = 'Broadmeadows VIC' OR {inventorylocation} = 'Wetherill Park NSW' OR {inventorylocation} = 'TMS Parkinson QLD') THEN {inventorylocation} END) END",
                                }),
                                search.createColumn({
                                    name: "formulanumeric",
                                    summary: "MIN",
                                    formula: "CASE WHEN {type} = 'Kit/Package' AND ({memberitem.inventorylocation} = 'Broadmeadows VIC' OR {memberitem.inventorylocation} = 'Wetherill Park NSW' OR {memberitem.inventorylocation} = 'TMS Parkinson QLD') THEN (NVL({memberitem.locationquantityavailable}/{memberquantity},0)) ELSE (CASE WHEN {type} = 'Inventory Item' AND ({inventorylocation} = 'Broadmeadows VIC' OR {inventorylocation} = 'Wetherill Park NSW' OR {inventorylocation} = 'TMS Parkinson QLD') THEN {locationquantityavailable} ELSE 0 END) END"
                                }),
                                search.createColumn({
                                    name: "formulatext1",
                                    summary: "GROUP",
                                    formula: "CASE WHEN {type} = 'Kit/Package' AND {memberitem.inventorylocation} = 'Broadmeadows VIC' THEN '15' WHEN {memberitem.inventorylocation} = 'Wetherill Park NSW' THEN '10' WHEN {memberitem.inventorylocation} = 'TMS Parkinson QLD' THEN '9' ELSE (CASE WHEN {type} = 'Inventory Item' AND {inventorylocation} = 'Broadmeadows VIC' THEN '15' WHEN {inventorylocation} = 'Wetherill Park NSW' THEN '10' WHEN {inventorylocation} = 'TMS Parkinson QLD' THEN '9' END) END"
                                })
                            ]
                    });

                    var searchResult = itemStockSearch.run().getRange({ start: 0, end: 1000 });

                    for (var i = 0; i < searchResult.length; i++) {

                        var itemId = searchResult[i].getValue({
                            name: "internalid",
                            summary: "GROUP"
                        });

                        var inventoryLocation = searchResult[i].getValue({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "CASE WHEN {type} = 'Kit/Package' AND ({memberitem.inventorylocation} = 'Broadmeadows VIC' OR {memberitem.inventorylocation} = 'Wetherill Park NSW' OR {memberitem.inventorylocation} = 'TMS Parkinson QLD') THEN {memberitem.inventorylocation} ELSE (CASE WHEN {type} = 'Inventory Item' AND ({inventorylocation} = 'Broadmeadows VIC' OR {inventorylocation} = 'Wetherill Park NSW' OR {inventorylocation} = 'TMS Parkinson QLD') THEN {inventorylocation} END) END",

                        });

                        var availableStock = searchResult[i].getValue({
                            name: "formulanumeric",
                            summary: "MIN",
                            formula: "CASE WHEN {type} = 'Kit/Package' AND ({memberitem.inventorylocation} = 'Broadmeadows VIC' OR {memberitem.inventorylocation} = 'Wetherill Park NSW' OR {memberitem.inventorylocation} = 'TMS Parkinson QLD') THEN {memberitem.locationquantityavailable} ELSE (CASE WHEN {type} = 'Inventory Item' AND ({inventorylocation} = 'Broadmeadows VIC' OR {inventorylocation} = 'Wetherill Park NSW' OR {inventorylocation} = 'TMS Parkinson QLD') THEN {locationquantityavailable} ELSE 0 END) END"
                        }) || 0;

                        var locationId = searchResult[i].getValue({
                            name: "formulatext1",
                            summary: "GROUP",
                            formula: "CASE WHEN {type} = 'Kit/Package' AND {memberitem.inventorylocation} = 'Broadmeadows VIC' THEN '15' WHEN {memberitem.inventorylocation} = 'Wetherill Park NSW' THEN '10' WHEN {memberitem.inventorylocation} = 'TMS Parkinson QLD' THEN '9' ELSE (CASE WHEN {type} = 'Inventory Item' AND {inventorylocation} = 'Broadmeadows VIC' THEN '15' WHEN {inventorylocation} = 'Wetherill Park NSW' THEN '10' WHEN {inventorylocation} = 'TMS Parkinson QLD' THEN '9' END) END"
                        }) || '';

                        if (itemId) {

                            itemStockArray.push({ itemId, availableStock, inventoryLocation, locationId });

                        }

                    }
                }

            }
            catch (e) {
                log.error('getItemAvailableStock Exception', e.message);
            }
            var itemArray = mergeDataByItemId(itemStockArray) || [];

            return itemArray || [];
        }

        function setAvailableStock(currentRecord, itemAvalStock) {
            try {

                var itemLineCount = currentRecord.getLineCount({ sublistId: 'item' });

                var location = currentRecord.getValue('location') || '';

                log.debug('itemAvalStock', itemAvalStock);

                log.debug('Location', location);

                for (var i = 0; i < itemLineCount; i++) {

                    for (var j = 0; j < itemAvalStock.length; j++) {

                        var transactionItemId = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: i
                        }) || '';

                        var availableQty = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantityavailable',
                            line: i
                        }) || '';
                        log.debug('availableQty', availableQty);

                        var searchItemId = itemAvalStock[j].itemId || '';


                        if (transactionItemId == searchItemId) {

                            if (itemAvalStock[j].locations.length > 0) {

                                for (var k = 0; k < itemAvalStock[j].locations.length; k++) {

                                    var itemLocation = itemAvalStock[j].locations[k].inventoryLocation;

                                    if (itemLocation == 'Broadmeadows VIC') {

                                        currentRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_available_stock',
                                            value: !!itemAvalStock[j].locations[k].availableStock ? itemAvalStock[j].locations[k].availableStock : 0,
                                            line: i
                                        })

                                    }

                                    if (itemLocation == 'Wetherill Park NSW') {

                                        currentRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_available_stock_weth',
                                            value: !!itemAvalStock[j].locations[k].availableStock ? itemAvalStock[j].locations[k].availableStock : 0,
                                            line: i
                                        })

                                    }

                                    if (itemLocation == 'TMS Parkinson QLD') {

                                        currentRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_available_stock_tms',
                                            value: !!itemAvalStock[j].locations[k].availableStock ? itemAvalStock[j].locations[k].availableStock : 0,
                                            line: i
                                        })

                                    }

                                    //Set Location Available
                                    if (location && location == itemAvalStock[j].locations[k].locationId && location == '15') {

                                        currentRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_available_stock',
                                            value: !!availableQty ? availableQty : 0,
                                            line: i
                                        });

                                    }

                                    else if (location && location == itemAvalStock[j].locations[k].locationId && location == '10') {

                                        currentRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_available_stock_weth',
                                            value: !!availableQty ? availableQty : 0,
                                            line: i
                                        });

                                    }

                                    else if (location && location == itemAvalStock[j].locations[k].locationId && location == '9') {

                                        currentRecord.setSublistValue({
                                            sublistId: 'item',
                                            fieldId: 'custcol_available_stock_tms',
                                            value: !!availableQty ? availableQty : 0,
                                            line: i
                                        });

                                    }

                                }
                            }

                        }
                    }
                }

            }
            catch (e) {
                log.error('setAvailableStock Exception', e.message);
            }
        }

        function mergeDataByItemId(data) {
            try {
                log.debug('data', data);
                return Object.values(data.reduce((acc, current) => {

                    const itemId = current.itemId;

                    if (!acc[itemId]) {

                        acc[itemId] = { itemId, locations: [] };
                    }

                    acc[itemId].locations.push({
                        availableStock: parseInt(current.availableStock, 10),
                        inventoryLocation: current.inventoryLocation,
                        locationId: current.locationId
                    });

                    return acc;
                }, {}));
            }
            catch (e) {
                log.error('mergeDataByItemId Exception', e.message);
            }
        }

        function getBillingInfo(recordId) {
            try {

                var billDataObj = {};

                var state = '';

                var zipCode = '';

                if (recordId) {

                    var billingSearch = search.create({
                        type: "salesorder",
                        settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                        filters:
                            [
                                ["type", "anyof", "SalesOrd"],
                                "AND",
                                ["internalid", "anyof", recordId],
                                "AND",
                                ["mainline", "is", "T"]
                            ],
                        columns:
                            [
                                "entity",
                                "billstate",
                                "billzip"
                            ]
                    });

                    var searchResult = billingSearch.run().getRange({ start: 0, end: 1 });

                    if (searchResult.length > 0) {

                        state = searchResult[0].getValue({ name: "billstate" }) || '';

                        zipCode = searchResult[0].getValue({ name: "billzip" }) || '';

                    }
                }

            }
            catch (e) {
                log.error('getBillingInfo Exception', e.message);
            }

            billDataObj.state = state;

            billDataObj.zipCode = zipCode;

            return billDataObj || {};

        }

        function isFMSOrder(billingInfo) {
            var found = false;
            try {

                var state = billingInfo.state || '';

                var zipCode = billingInfo.zipCode || '';

                var csvDataObj = processCSVFile('20140982');

                var postingCodeArray = csvDataObj[state];

                if (postingCodeArray && postingCodeArray.length > 0) {

                    if (postingCodeArray.includes(parseInt(zipCode))) {

                        found = true;

                    }
                }

            }
            catch (e) {
                log.error('isFMSOrder Exception', e.message);
            }
            return found;
        }

        function processCSVFile(fileId) {
            try {

                var csvFile = file.load({ id: fileId });
                var csvContent = csvFile.getContents();
                var lines = csvContent.split('\n');

                var result = lines.slice(1, -1).reduce(function (acc, line) {
                    // Remove potential \r and split by the first comma
                    var parts = line.replace(/\r/g, '').split(/,(.+)/);
                    var state = parts[0].trim();
                    var rawPostcodes = parts[1];
                    var cleanPostcodes = rawPostcodes.replace(/"/g, '').split(/,\s*/);
                    var postingCode = cleanPostcodes.reduce(function (acc, code) {
                        if (code.indexOf('-') !== -1) {
                            var range = code.split('-').map(Number);
                            var start = range[0];
                            var end = range[1];
                            for (var i = start; i <= end; i++) {
                                acc.push(i);
                            }
                        } else {
                            acc.push(Number(code));
                        }
                        return acc;
                    }, []);
                    acc[state] = postingCode;
                    return acc;
                }, {});
            }
            catch (e) {
                log.error('processCSVFile Exception', e.message);
            }
            return result || {};
        }

        function subMyerCustomer(id) {
            var title = 'subMyerCustomer[::]';
            var custId;
            var exist = false;
            try {
                var customerSearchObj = search.load({
                    id: 'customsearch3142'
                });
                var filter = search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.ANYOF,
                    values: id
                });
                customerSearchObj.filters.push(filter);
                customerSearchObj.run().each(function (result) {
                    custId = result.getValue({ name: 'altname' });
                    return true;
                });
                if (custId) {
                    exist = true;
                }

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return exist || false;
        }

        function checkAutoLocCarrierTriggered(contextRec) {
            try {
                var rec = contextRec;

                var searchResultsData = autoLocCarrierSearch(rec.id);

                if (searchResultsData && searchResultsData.length > 0) {
                    var data = searchResultsData[0];
                    if (data.type == 'CustInvc') {
                        var otherId = record.submitFields({
                            type: 'invoice',
                            id: data.recId,
                            values: {
                                'location': data.location,
                                'shipmethod': data.shipmethod
                            }
                        });

                    } else {
                        var otherId = record.submitFields({
                            type: 'cashsale',
                            id: data.recId,
                            values: {
                                'location': data.location,
                                'shipmethod': data.shipmethod
                            }
                        });

                    }
                }


            }
            catch (e) {
                log.error('checkAutoLocCarrierTriggered Exception', e.message);
            }
        }

        function autoLocCarrierSearch(soID) {
            var title = 'autoLocCarrierSearch[::]';
            var obj = {};
            var array = [];
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["custbody_gfl_transform_via_script", "is", "T"],
                            "AND",
                            ["applyingtransaction.type", "anyof", "CustInvc", "CashSale"],
                            "AND",
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["formulanumeric: CASE WHEN {shipmethod} != {applyingtransaction.shipmethod} OR {location} != {applyingtransaction.location} THEN 1 ELSE 0 END", "equalto", "1"],
                            "AND",
                            ["internalid", "anyof", soID]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "location", label: "Location" }),
                            search.createColumn({ name: "shipmethod", label: "Ship Via" }),
                            search.createColumn({ name: "applyingtransaction", label: "Applying Transaction" }),
                            search.createColumn({
                                name: "type",
                                join: "applyingTransaction",
                                label: "Type"
                            })
                        ]
                });

                var searchResult = salesorderSearchObj.run().getRange({ start: 0, end: 1 });
                if (searchResult && searchResult.length > 0) {
                    obj.recId = searchResult[0].getValue({ name: 'applyingtransaction' });
                    obj.shipmethod = searchResult[0].getValue({ name: 'shipmethod' });
                    obj.location = searchResult[0].getValue({ name: 'location' });
                    obj.type = searchResult[0].getValue({ name: 'type', join: 'applyingTransaction' });
                    array.push(obj);
                }


            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }

        function transformIntoCashSalesInvoice(context) {
            var title = 'transformIntoCashSalesInvoice[::]';
            try {
                var rec = context.newRecord;

                var soSearchResults = search.load({
                    id: 'customsearch3927'
                });

                var filter = soSearchResults.filters;

                var mySearchFilter = search.createFilter({
                    name: "internalid",
                    operator: 'anyof',
                    values: rec.id
                });
                log.debug({
                    title: 'RecId',
                    details: rec.id
                });
                filter.push(mySearchFilter);

                var searchResult = soSearchResults.run().getRange({ start: 0, end: 1 });

                log.debug({
                    title: 'searchResult===',
                    details: searchResult
                });

                if (searchResult && searchResult.length > 0) {
                    var internalId = searchResult[0].getValue({ name: 'internalid', summary: "GROUP" });

                    var customForm = searchResult[0].getValue({ name: 'customform', summary: "GROUP" });

                    var shipViaNewText = searchResult[0].getText({ name: 'shipmethod', summary: "GROUP" });

                    var state = searchResult[0].getValue({ name: 'shipstate', summary: "GROUP" });

                    var soObj = record.load({
                        type: record.Type.SALES_ORDER,
                        id: rec.id
                    });

                    //set Order Type
                    setOrderTypeFunction(context, soObj, shipViaNewText, state);

                    soObj.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });


                    if (customForm == '117' || customForm == '118') {

                        if (customForm == '117') {//Cash Sales Form
                            log.debug({
                                title: 'GFL Sales Order - Cash Sale',
                                details: 'YES'
                            });
                            var cashSalesRecord = record.transform({
                                fromType: record.Type.SALES_ORDER,
                                fromId: rec.id,
                                toType: record.Type.CASH_SALE,
                                isDynamic: true
                            });

                            if (cashSalesRecord) {
                                // If dynamic mode is enabled, use setValue or setText
                                cashSalesRecord.setValue({
                                    fieldId: 'otherrefnum',
                                    value: 'Auto Biller'
                                });
                            }

                            var cashSalesRecordId = cashSalesRecord.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                            // var cashSalesRecordId = cashSalesRecord.save();
                            log.debug('cashSalesRecordId', cashSalesRecordId);
                            if (cashSalesRecordId) {
                                record.submitFields({
                                    type: record.Type.SALES_ORDER,
                                    id: rec.id,
                                    values: {
                                        'custbody_gfl_transform_via_script': true
                                    }
                                });
                            }
                        } else if (customForm == '118') {//Invoice Form
                            log.debug({
                                title: 'GFL Sales Order - invoice',
                                details: 'YES'
                            });
                            var invoiceRecord = record.transform({
                                fromType: record.Type.SALES_ORDER,
                                fromId: rec.id,
                                toType: record.Type.INVOICE,
                                isDynamic: true
                            });

                            if (invoiceRecord) {
                                invoiceRecord.setValue({
                                    fieldId: 'otherrefnum',
                                    value: 'Auto Biller'
                                });
                            }

                            var invoiceId = invoiceRecord.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });
                            log.debug('invoiceId', invoiceId);
                            if (invoiceId) {
                                record.submitFields({
                                    type: record.Type.SALES_ORDER,
                                    id: rec.id,
                                    values: {
                                        'custbody_gfl_transform_via_script': true
                                    }
                                });
                            }
                        }
                    }
                } 
                // else {

                //     var soObj = record.load({
                //         type: record.Type.SALES_ORDER,
                //         id: rec.id
                //     });

                //     var shipViaNewText = soObj.getText({ fieldId: 'shipmethod' });

                //     var state = soObj.getValue({ fieldId: 'shipstate' });

                //     if (shipViaNewText && state) {

                //         //set Order Type
                //         setOrderTypeFunction(context, soObj, shipViaNewText, state);

                //     }

                //     soObj.save({
                //         enableSourcing: true,
                //         ignoreMandatoryFields: true
                //     });
                // }

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        function setOrderType(customer) {

            var subOf = '';

            try {

                var customerSearch = search.create({
                    type: "customer",
                    filters:
                        [
                            ["parent", "anyof", "1443", "90", "98", "11543703", "861", "83", "10119", "60", "87", "10797417", "12704180", "12185970"],
                            "AND",
                            ["internalid", "anyof", customer]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "altname",
                                join: "parentCustomer",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "parentCustomer",
                                label: "Internal ID"
                            })
                        ]
                });

                var searchResult = customerSearch.run().getRange({ start: 0, end: 1 });

                if (searchResult.length > 0) {

                    subOf = searchResult[0].getValue({ name: 'internalid', join: 'parentCustomer' });

                }

            }
            catch (e) {
                log.error('setOrderType Exception', e.message);
            }

            return subOf || '';
        }

        function updateOrderTypeWhenShipViaChange(context) {
            var title = 'updateOrderTypeWhenShipViaChange[::]';
            try {

                var salesOrderObj = record.load({
                    type: 'salesorder',
                    id: context.newRecord.id
                });
                // var newRec = context.newRecord;
                var oldRec = context.oldRecord;

                var shipViaOld = oldRec.getValue({ fieldId: 'shipmethod' });
                var shipViaNew = salesOrderObj.getValue({ fieldId: 'shipmethod' });
                var shipViaNewText = salesOrderObj.getText({ fieldId: 'shipmethod' });

                var state = salesOrderObj.getValue({ fieldId: 'shipstate' });

                if (shipViaOld != shipViaNew) {
                    log.debug({
                        title: 'ShipVia Changes',
                        details: 'YES'
                    });

                    //set Order Type
                    setOrderTypeFunction(context, salesOrderObj, shipViaNewText, state);

                }
                salesOrderObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        function setOrderTypeFunction(context, salesOrderObj, shipViaNewText, state) {
            var title = 'setOrderTypeFunction[::]';
            log.debug('shipViaNewText123', shipViaNewText);
            try {

                /*
                Sub of parents ID

                9080 WEBSITE == 1443

                28 ACCOUNTS GENERAL == 90
                36 ACCOUNTS INDUSTRY == 98
                571236 WEBSITE ARCHIVE 1 == 11543703
                6580 ONSELLER == 861
                21 ONSELLER ARCHIVE 1 == 83
                8869 LSG WEBSITE == 10119
                9080 WEBSITE == 1443

                8869 LSG WEBSITE == 10119
                9080 WEBSITE == 1443
                36 ACCOUNTS INDUSTRY == 98

                9083 ACCOUNTS IBD == 60

                25 AMAZON == 87
                1025 ACCOUNTS MARKETPLACE : 531056 BUNNINGS MARKETPLACE == 10797417
                1025 ACCOUNTS MARKETPLACE : 629279 DECATHLON MARKETPLACE == 12704180
                1025 ACCOUNTS MARKETPLACE : 605097 BABY BUNTING MARKETPLACE == 12185970
                */

                //start
                var reference = salesOrderObj.getValue('custbody1') || '';
                var overDue = salesOrderObj.getValue('custbody_overdue_balance');
                var balance = salesOrderObj.getValue('balance');
                var creditlimit = salesOrderObj.getValue('custbody10');
                var customer = salesOrderObj.getValue('entity') || '';
                var lineItemsCount = salesOrderObj.getLineCount({ sublistId: 'item' });
                var parentCustomerId = '';
                if (customer) {
                    parentCustomerId = setOrderType(customer);
                    log.debug({
                        title: 'parentCustomerId',
                        details: parentCustomerId
                    });
                    log.debug({
                        title: 'parentCustomerId TYPEOF',
                        details: typeof parentCustomerId
                    });
                }
                if ((parentCustomerId == '10119' || parentCustomerId == '1443' || parentCustomerId == '98') && (areAllLineItemsAvailable(salesOrderObj) && overDue <= 0 && (balance < creditlimit || balance <= 0))) {
                    if (shipViaNewText == 'Pickup - Broadmeadows, VIC' && state == 'VIC') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Pickup - Wetherill Park, NSW' && state == 'NSW') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Same Day - VIC [Civic]' && state == 'VIC') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Same Day - NSW [Capital]' && state == 'NSW') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Click and Collect with Assembly' && state != '') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Diverse Delivery and Installation' && state != '') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Diverse Door to Door' && state != '') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Diverse Specialised Delivery' && state != '') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }

                }

                if (parentCustomerId == '1443' && (reference.startsWith("#TFO") && overDue <= 0 && balance < creditlimit)) {

                    salesOrderObj.setValue({ fieldId: 'ordertype', value: 14 });//AFD: Assembled Items      
                } else if ((parentCustomerId == '90' || parentCustomerId == '98' || parentCustomerId == '11543703' || parentCustomerId == '861' || parentCustomerId == '83' || parentCustomerId == '10119' || parentCustomerId == '1443') && (overDue <= 0 && balance < creditlimit)) {
               // } else if ((parentCustomerId == '90' || parentCustomerId == '98' || parentCustomerId == '11543703' || parentCustomerId == '861' || parentCustomerId == '83' || parentCustomerId == '10119' || parentCustomerId == '1443') && (overDue <= 0 && balance < creditlimit) && (context.executionContext !== runtime.ContextType.USER_INTERFACE)) {

                    if ((shipViaNewText == 'Allied Express' || shipViaNewText == 'Australia Post' || shipViaNewText == 'AirRoad') && (state == 'VIC')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 10 });//AFD: AX/HX/AP(VIC)

                    } else if ((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad Specialised') && (state == 'NSW')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 6 });//AFD: AX/HX (NSW)

                    } else if ((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state == 'QLD')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 7 });//AFD: AX/HX (QLD)

                    } else if ((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state == 'SA')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 8 });//AFD: AX/HX (SA)

                    } else if ((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state == 'WA')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 9 });//AFD: AX/HX (WA)

                    } else if ((shipViaNewText == 'Allied Express' || shipViaNewText == 'AirRoad') && (state != '')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 5 });//AFD: AX/HX (ACT/TAS/NT)

                    } else if ((shipViaNewText == 'Direct Freight') && (state != '')) {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    } else if (shipViaNewText == 'Australia Post' && state != 'VIC') {

                        salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                    }

                }
                // else if (parentCustomerId == '60' && (overDue <= 0 && balance < creditlimit) && (context.executionContext !== runtime.ContextType.USER_INTERFACE)) {

                //     salesOrderObj.setValue({ fieldId: 'ordertype', value: 11 });//AFD: IBD

                // } 
                else if ((parentCustomerId == '87' || parentCustomerId == '10797417' || parentCustomerId == '12704180' || parentCustomerId == '12185970')) {

                    salesOrderObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General

                }

                //end

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function areAllLineItemsAvailable(salesOrderObj) {
            var title = 'areAllLineItemsAvailable[::]';
            var lineItemsCount = salesOrderObj.getLineCount({ sublistId: 'item' });
            for (var i = 0; i < lineItemsCount; i++) {
                var availableQty = salesOrderObj.getSublistValue({ sublistId: 'item', fieldId: 'quantityavailable', line: i });
                if (availableQty <= 3) {
                    return false;
                }
            }
            return true;
        }

        return {
            beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        }

    });