/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['../dao/amazon_config_dao', 'N/https', 'N/search', 'N/record', '../lib/amazon_request_lib', 'N/log', 'N/runtime'],

    (amazonConfig, https, search, record, requestLib, log, runtime) => {

        const getInputData = () => {
            try {
                var soArray = runtime.getCurrentScript().getParameter({
                    name: 'custscript_amazon_order_array'
                });
                var amazonSoArray = JSON.parse(soArray);

            }
            catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;

                log.error('getInputData:err', err);

            }

            return amazonSoArray || [];

        }
        const map = (mapContext) => {
            try {
                var title = 'mapContext[::]';
                try {
                    var token = amazonConfig.CONFIG.getAmazonConfigurations();

                    var data = JSON.parse(mapContext.value);

                    var amazonOrderId = data.amazonOrder;

                    var amazonOrderObj = requestLib.REQUESTS.getOrdersDeatilsFromAmazon(token, amazonOrderId);

                    if (!isEmpty(amazonOrderObj)) {

                        var byerData = amazonOrderObj.payload.BuyerInfo;
                        var shippingAddress = amazonOrderObj.payload.ShippingAddress;
                        var amazonOrderId = amazonOrderObj.payload.AmazonOrderId;
                        log.debug('amazonOrderId==', amazonOrderId);

                        if (amazonOrderId) {
                            var getItemData = getItemDataAPI(amazonOrderId, token);
                        }

                        //Check If SO exist in SO in NS
                        var soExist = soExistSearch(amazonOrderId);
                        log.debug({
                            title: 'soExist',
                            details: soExist
                        });

                        var byerEmail = byerData.BuyerEmail;

                        if (byerEmail) {
                            // var customerId = customerIdSearch(byerEmail);

                            // if (!isEmpty(customerId)) {
                            var customerId = 11358319;

                            //Update Sales Order

                            if (soExist != 0) {

                                var updateSalesOrderId = updateSalesOrderFun(customerId, shippingAddress, getItemData, amazonOrderId, soExist);

                                log.debug({
                                    title: 'updateSalesOrderId',
                                    details: updateSalesOrderId
                                });
                                if (updateSalesOrderId) {

                                    var AmazonOrderLog = AmazonOrderLogSearch(amazonOrderId);
                                    log.debug({
                                        title: 'AmazonOrderLog Seach ID',
                                        details: AmazonOrderLog
                                    })
                                    if (!isEmpty(AmazonOrderLog)) {
                                        updateAmazonOrerLog(AmazonOrderLog);
                                    }
                                }

                            } else {

                                var salesOrderId = createSalesOrderFun(customerId, shippingAddress, getItemData, amazonOrderId);

                                log.debug({
                                    title: 'salesOrderId',
                                    details: salesOrderId
                                });

                                if (salesOrderId) {

                                    var recId = amazonOrderLogsRec(amazonOrderId, 'Success', '', getItemData);
                                    log.debug({
                                        title: 'Amazon log recId',
                                        details: recId
                                    });
                                    if(recId){
                                        updateAmazonOrerLog(recId);
                                    }
                                }   
                            }
                            // }
                        }

                    }

                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            } catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;

                log.error('map:err', err);
            }
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0) || Object.keys(stValue).length === 0) {
                return true;
            }
            return false;
        }
        function getItemDataAPI(amazonOrderId, token) {
            var title = 'getItemDataAPI[::]';
            try {
                var itemData = amazonConfig.CONFIG.getItemData(amazonOrderId, token);
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return itemData || '';
        }
        function customerIdSearch(email) {
            var title = 'customerIdSearch[::]';
            var custId = '';
            try {
                var customerSearchObj = search.create({
                    type: "customer",
                    filters:
                        [
                            ["email", "is", email]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "altname", label: "Name" }),
                            search.createColumn({ name: "email", label: "Email" })
                        ]
                });
                customerSearchObj.run().each(function (result) {
                    custId = result.id;
                    return true;
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return custId || '';
        }
        function createSalesOrderFun(custId, shipAddress, getItemData, amazonOrderId) {
            var title = 'createSalesOrderFun[::]';
            try {
                var itemDataLength = getItemData.payload.OrderItems;

                var salesOrderObj = record.create({
                    type: 'salesorder',
                    isDynamic: true
                });

                salesOrderObj.setValue({ fieldId: 'entity', value: custId });
                salesOrderObj.setValue({ fieldId: 'subsidiary', value: 1 });//  GFL
                salesOrderObj.setValue({ fieldId: 'externalid', value: amazonOrderId });

                for (var m = 0; m < itemDataLength.length; m++) {

                    var itemPriceObj = itemDataLength[m].ItemPrice;
                    var qtyOrder = itemDataLength[m].QuantityOrdered;
                    var item = itemDataLength[m].SellerSKU;

                    var InternalIdofItem = internalIdItemSearch(item);

                    if (InternalIdofItem != false) {

                        salesOrderObj.selectNewLine({
                            sublistId: 'item'
                        });
                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: m,
                            value: parseInt(InternalIdofItem)
                        });
                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: m,
                            value: qtyOrder
                        });
                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: m,
                            value: itemPriceObj.Amount
                        });
                        salesOrderObj.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
                var soId = salesOrderObj.save();

            } catch (e) {
                log.error(title + e.name, e.message);
                amazonOrderLogsRec(amazonOrderId, 'Failed', e.message, getItemData);
            }
            return soId || 0;
        }
        function updateSalesOrderFun(custId, shipAddress, getItemData, amazonOrderId, id) {
            var title = 'updateSalesOrderFun[::]';
            try {
                var itemDataLength = getItemData.payload.OrderItems;

                var salesOrderObj = record.load({
                    type: 'salesorder',
                    id: id
                });

                // salesOrderObj.setValue({ fieldId: 'entity', value: custId });
                // salesOrderObj.setValue({ fieldId: 'subsidiary', value: 1 });//  GFL
                // salesOrderObj.setValue({ fieldId: 'externalid', value: amazonOrderId });

                for (var m = 0; m < itemDataLength.length; m++) {

                    var itemPriceObj = itemDataLength[m].ItemPrice;
                    var qtyOrder = itemDataLength[m].QuantityOrdered;
                    var item = itemDataLength[m].SellerSKU;

                    var InternalIdofItem = internalIdItemSearch(item);

                    if (InternalIdofItem != false) {

                        salesOrderObj.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: m,
                            value: parseInt(InternalIdofItem)
                        });
                        salesOrderObj.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: m,
                            value: qtyOrder
                        });
                        salesOrderObj.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: m,
                            value: itemPriceObj.Amount
                        });
                        salesOrderObj.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: m,
                            value: 7 // need to be set dynamic
                        });
                    }
                }
                var updateSoId = salesOrderObj.save();

            } catch (e) {
                log.error(title + e.name, e.message);
                amazonOrderLogsRec(amazonOrderId, 'Failed', e.message, getItemData);
            }
            return updateSoId || 0;
        }
        function internalIdItemSearch(name) {
            var title = 'internalIdItemSearch[::]';
            var id;
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["name", "is", name]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                let searchResult = itemSearchObj.run().getRange({ start: 0, end: 1 });
                if (searchResult.length > 0) {
                    id = searchResult[0].getValue({ name: 'internalid' });
                }

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return id || false;
        }
        function amazonOrderLogsRec(amazonOrderId, status, error, lineData) {
            var title = 'amazonOrderLogsRec[::]';
            try {
                var amazonOrderLogsRecord = record.create({
                    type: 'customrecord4271'
                });
                amazonOrderLogsRecord.setValue({ fieldId: 'custrecord_amazon_orders', value: amazonOrderId });
                amazonOrderLogsRecord.setValue({ fieldId: 'custrecord_amazon_order_status', value: status });
                amazonOrderLogsRecord.setValue({ fieldId: 'custrecord_amazon_error', value: error });
                amazonOrderLogsRecord.setValue({ fieldId: 'custrecord_amazon_order_data', value: lineData });
                var id = amazonOrderLogsRecord.save();
            } catch (e) {
                log.debug('Exception' + e.name, e.message);
            }
            return id;
        }
        function soExistSearch(orderId) {
            var title = 'soExistSearch[::]';
            var soExist = 0;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["externalidstring", "is", orderId],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "Document Number" })
                        ]
                });
                salesorderSearchObj.run().each(function (result) {
                    if (result.id) {
                        soExist = result.id;
                    }
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return soExist || 0;
        }
        function AmazonOrderLogSearch(id) {
            var title = 'AmazonOrderLogSearch[::]';
            try {
                var customrecord4271SearchObj = search.create({
                    type: "customrecord4271",
                    filters:
                        [
                            ["custrecord_amazon_orders", "is", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "scriptid", label: "Script ID" }),
                            search.createColumn({ name: "custrecord_amazon_orders", label: "Amazon Orders " }),
                            search.createColumn({ name: "custrecord_amazon_order_status", label: "Status" }),
                            search.createColumn({ name: "custrecord_amazon_error", label: "Error" }),
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var searchResult = customrecord4271SearchObj.run().getRange({ start: 0, end: 1 });
                var recId = searchResult[0].getValue({ name: 'internalid' });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return recId;
        }
        function updateAmazonOrerLog(id) {
            var title = 'updateAmazonOrerLog[::]';
            try {
                var amazonOrderLogObj = record.load({
                    type: 'customrecord4271',
                    id: id
                });
                amazonOrderLogObj.setValue({ fieldId: 'custrecord_reexecuted', value: true });
                var recId = amazonOrderLogObj.save();
                log.debug({
                    title: 'amazonOrderLogObj Record ID',
                    details: recId
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return { getInputData, map }

    });
