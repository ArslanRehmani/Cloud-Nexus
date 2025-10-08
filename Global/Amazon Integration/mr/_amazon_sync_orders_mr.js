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
            // return [
            //     {
            //         "BuyerInfo": {
            //             "BuyerEmail": "6cs7rrkcqtcbn7y@marketplace.amazon.com.au"
            //         },
            //         "AmazonOrderId": "503-4337548-5097463",
            //         "EarliestDeliveryDate": "2025-04-16T14:00:00Z",
            //         "EarliestShipDate": "2025-04-13T14:00:00Z",
            //         "SalesChannel": "Amazon.com.au",
            //         "AutomatedShippingSettings": {
            //             "HasAutomatedShippingSettings": false
            //         },
            //         "OrderStatus": "Unshipped",
            //         "NumberOfItemsShipped": 0,
            //         "OrderType": "StandardOrder",
            //         "IsPremiumOrder": false,
            //         "IsPrime": false,
            //         "FulfillmentChannel": "MFN",
            //         "NumberOfItemsUnshipped": 1,
            //         "HasRegulatedItems": false,
            //         "IsReplacementOrder": "false",
            //         "IsSoldByAB": false,
            //         "LatestShipDate": "2025-04-14T13:59:59Z",
            //         "ShipServiceLevel": "std-au",
            //         "DefaultShipFromLocationAddress": {
            //             "StateOrRegion": "VIC",
            //             "AddressLine1": "17 Fordson Rd",
            //             "PostalCode": "3061",
            //             "City": "Campbellfield",
            //             "CountryCode": "AU",
            //             "Name": "Global Fitness and Leisure Pty Ltd"
            //         },
            //         "IsISPU": false,
            //         "MarketplaceId": "A39IBJ37TRP1C6",
            //         "LatestDeliveryDate": "2025-04-23T13:59:59Z",
            //         "PurchaseDate": "2025-04-11T06:41:25Z",
            //         "ShippingAddress": {
            //             "StateOrRegion": "VIC",
            //             "PostalCode": "3030",
            //             "City": "POINT COOK",
            //             "CountryCode": "AU"
            //         },
            //         "IsAccessPointOrder": false,
            //         "PaymentMethod": "Other",
            //         "IsBusinessOrder": false,
            //         "OrderTotal": {
            //             "CurrencyCode": "AUD",
            //             "Amount": "108.90"
            //         },
            //         "PaymentMethodDetails": [
            //             "Standard"
            //         ],
            //         "IsGlobalExpressEnabled": false,
            //         "LastUpdateDate": "2025-04-11T06:47:45Z",
            //         "ShipmentServiceLevelCategory": "Standard"
            //     },
            //     {
            //         "BuyerInfo": {
            //             "BuyerEmail": "7jxm27v46g544mf@marketplace.amazon.com.au"
            //         },
            //         "AmazonOrderId": "503-1851960-6157452",
            //         "EarliestDeliveryDate": "2025-04-16T14:00:00Z",
            //         "EarliestShipDate": "2025-04-13T14:00:00Z",
            //         "SalesChannel": "Amazon.com.au",
            //         "AutomatedShippingSettings": {
            //             "HasAutomatedShippingSettings": false
            //         },
            //         "OrderStatus": "Shipped",
            //         "NumberOfItemsShipped": 1,
            //         "OrderType": "StandardOrder",
            //         "IsPremiumOrder": false,
            //         "IsPrime": false,
            //         "FulfillmentChannel": "MFN",
            //         "NumberOfItemsUnshipped": 0,
            //         "HasRegulatedItems": false,
            //         "IsReplacementOrder": "false",
            //         "IsSoldByAB": false,
            //         "LatestShipDate": "2025-04-14T13:59:59Z",
            //         "ShipServiceLevel": "expd-au",
            //         "DefaultShipFromLocationAddress": {
            //             "StateOrRegion": "Victoria",
            //             "AddressLine1": "null",
            //             "PostalCode": "3047",
            //             "City": "Broadmeadows",
            //             "CountryCode": "AU",
            //             "Name": "null"
            //         },
            //         "IsISPU": false,
            //         "MarketplaceId": "A39IBJ37TRP1C6",
            //         "LatestDeliveryDate": "2025-04-22T13:59:59Z",
            //         "PurchaseDate": "2025-04-13T06:21:10Z",
            //         "ShippingAddress": {
            //             "StateOrRegion": "QLD",
            //             "PostalCode": "4306",
            //             "City": "KARALEE",
            //             "CountryCode": "AU"
            //         },
            //         "IsAccessPointOrder": false,
            //         "PaymentMethod": "Other",
            //         "IsBusinessOrder": false,
            //         "OrderTotal": {
            //             "CurrencyCode": "AUD",
            //             "Amount": "36.26"
            //         },
            //         "PaymentMethodDetails": [
            //             "Standard"
            //         ],
            //         "IsGlobalExpressEnabled": false,
            //         "LastUpdateDate": "2025-04-13T23:19:59Z",
            //         "ShipmentServiceLevelCategory": "Expedited"
            //     }
            // ];

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

                        // var byerData = data.BuyerInfo;
                        var shippingAddress = data.ShippingAddress;
                        var amazonOrderId = data.AmazonOrderId;

                        var soAlreadyExist = checkSoExistAlready(amazonOrderId);

                        if (soAlreadyExist == 0) {

                            if (amazonOrderId) {
                                var getItemData = getItemDataAPI(amazonOrderId, token);
                            }

                            var customerId = 11364632; // 539912 Amazon Customer in SB

                            var salesOrderId = createSalesOrderFun(customerId, shippingAddress, getItemData, amazonOrderId);

                            log.debug({
                                title: 'salesOrderId',
                                details: salesOrderId
                            });

                        }else{
                            log.debug({
                                title: 'SO with ID: '+amazonOrderId+' already exists',
                                details: 'SO ID' + soAlreadyExist
                            });
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

                salesOrderObj.setValue({ fieldId: 'customform', value: 189 });// SB form name GFL Sales Order - invoice
                salesOrderObj.setValue({ fieldId: 'entity', value: custId });
                salesOrderObj.setValue({ fieldId: 'subsidiary', value: 1 });//  GFL
                salesOrderObj.setValue({ fieldId: 'memo', value: amazonOrderId });
                // salesOrderObj.setValue({ fieldId: 'shipmethod', value: 13712 });// PRD Best Available
                // salesOrderObj.setValue({ fieldId: 'custbody1', value: amazonOrderId });
                // salesOrderObj.setValue({ fieldId: 'otherrefnum', value: 'Amazon Integration' });
                // salesOrderObj.setValue({ fieldId: 'location', value: 15 });
                

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
        function checkSoExistAlready(amazonOrderId) {
            var title = 'checkSoExistAlready[::]';
            var soid;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["memo", "is", amazonOrderId],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "ordertype", label: "Order Type" }),
                            search.createColumn({ name: "mainline", label: "*" }),
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "asofdate", label: "As-Of Date" }),
                            search.createColumn({ name: "postingperiod", label: "Period" }),
                            search.createColumn({ name: "taxperiod", label: "Tax Period" }),
                            search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "entity", label: "Name" }),
                            search.createColumn({ name: "account", label: "Account" }),
                            search.createColumn({ name: "memo", label: "Memo" }),
                            search.createColumn({ name: "amount", label: "Amount" }),
                            search.createColumn({ name: "custbody_fraud_analysis_result", label: "Fraud Analysis" }),
                            search.createColumn({ name: "custbody_total_amount_payable", label: "Total Payable Amount" })
                        ]
                });

                salesorderSearchObj.run().each(function (result) {
                    var data = result.id;
                    if(data){
                        soid = data;
                    }
                    return true;
                });

                /*
                salesorderSearchObj.id="customsearch1744629035716";
                salesorderSearchObj.title="Custom Transaction Search 6 (copy)";
                var newSearchId = salesorderSearchObj.save();
                */
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return soid || 0;
        }
        return { getInputData, map, reduce, summarize }

    });
