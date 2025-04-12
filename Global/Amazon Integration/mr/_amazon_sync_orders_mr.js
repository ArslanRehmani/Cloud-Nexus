/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['../dao/amazon_config_dao', 'N/https', 'N/search', 'N/record', '../lib/amazon_request_lib'],

    (amazonConfig, https, search, record, requestLib) => {

        const getInputData = () => {
            try {

                let amazConfig = amazonConfig.CONFIG.getAmazonConfigurations();

                var token = amazConfig;

                //Get Data from Amazon
                var headers = {};
                headers['Content-Type'] = 'application/json';
                headers['x-amz-access-token'] = token;
                var todayDate = requestLib.REQUESTS.getFormattedDate();
                log.debug({
                    title: 'todayDate',
                    details: todayDate
                });

                var link = 'https://sellingpartnerapi-fe.amazon.com/orders/v0/orders?MarketplaceIds=A39IBJ37TRP1C6&CreatedAfter=' + todayDate + '';
                var response = https.get({
                    url: link,
                    headers: headers
                });
                var responseBody = JSON.parse(response.body);

                var ordersLength = responseBody.payload.Orders;

            }
            catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;

                log.error('getInputData:err', err);

            }

            return ordersLength || [];

        }
        const map = (mapContext) => {
            try {
                var title = 'mapContext[::]';
                try {
                    var token = amazonConfig.CONFIG.getAmazonConfigurations();

                    var data = JSON.parse(mapContext.value);
                    log.debug({
                        title: 'data',
                        details: data
                    });
                    if (!isEmpty(data)) {

                        var byerData = data.BuyerInfo;
                        var shippingAddress = data.ShippingAddress;
                        var amazonOrderId = data.AmazonOrderId;

                        if (amazonOrderId) {
                            var getItemData = getItemDataAPI(amazonOrderId, token);
                        }

                        var byerEmail = byerData.BuyerEmail;

                        if (byerEmail) {
                            log.debug({
                                title: 'byerEmail',
                                details: byerEmail
                            });
                            // var customerId = customerIdSearch(byerEmail);
                            var customerId = 11364632; // 539912 Amazon Customer in SB

                            // if (!isEmpty(customerId)) {


                                var salesOrderId = createSalesOrderFun(customerId, shippingAddress, getItemData,amazonOrderId);
                                log.debug({
                                    title: 'salesOrderId',
                                    details: salesOrderId
                                });
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
        const reduce = (reduceContext) => {

        }
        const summarize = (summaryContext) => {

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
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0) || Object.keys(stValue).length === 0) {
                return true;
            }
            return false;
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
                salesOrderObj.setValue({ fieldId: 'memo', value: amazonOrderId });

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
            }
            return soId || 0;
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
        return { getInputData, map, reduce, summarize }

    });
