/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['../eBay_dao/eBay_confiq_dao.js', 'N/search', 'N/record'],

    (eBayConfig, search, record) => {

        const getInputData = () => {
            try {
                // Generate eBay Token
                let eBayConfigToken = eBayConfig.CONFIG.getEbayConfigurations();

                // Get eBay Orders
                let eBayOrders = eBayConfig.CONFIG.getEbayOrders(eBayConfigToken);

                var ebayOrderArray = eBayOrders.orders;

                // log.debug({
                //     title: 'GET in put',
                //     details: 'TEST'
                // });

            }
            catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;

                log.error('getInputData:err', err);

            }

            return ebayOrderArray || [];
            // return [{
            //     "orderId": "21-12833-40939",
            //     "legacyOrderId": "21-12833-40939",
            //     "creationDate": "2025-03-19T09:07:33.000Z",
            //     "lastModifiedDate": "2025-03-19T09:10:34.000Z",
            //     "orderFulfillmentStatus": "NOT_STARTED",
            //     "orderPaymentStatus": "PAID",
            //     "sellerId": "activego_australia",
            //     "buyer": {
            //         "username": "callum6563",
            //         "taxAddress": {
            //             "stateOrProvince": "VIC",
            //             "postalCode": "3825",
            //             "countryCode": "AU"
            //         },
            //         "buyerRegistrationAddress": {
            //             "fullName": "Callum Robertson",
            //             "contactAddress": {
            //                 "addressLine1": "Lot 5 Elswyk Road",
            //                 "city": "Moe",
            //                 "stateOrProvince": "Victoria",
            //                 "postalCode": "3825",
            //                 "countryCode": "AU"
            //             },
            //             "primaryPhone": {
            //                 "phoneNumber": "459326633"
            //             },
            //             "secondaryPhone": {
            //                 "phoneNumber": "0459326633"
            //             },
            //             "email": "3dc90952331c3656f384@members.ebay.com"
            //         }
            //     },
            //     "pricingSummary": {
            //         "priceSubtotal": {
            //             "value": "249.0",
            //             "currency": "AUD"
            //         },
            //         "deliveryCost": {
            //             "value": "2.58",
            //             "currency": "AUD"
            //         },
            //         "total": {
            //             "value": "251.58",
            //             "currency": "AUD"
            //         }
            //     },
            //     "cancelStatus": {
            //         "cancelState": "NONE_REQUESTED",
            //         "cancelRequests": []
            //     },
            //     "paymentSummary": {
            //         "totalDueSeller": {
            //             "value": "225.87",
            //             "currency": "AUD"
            //         },
            //         "refunds": [],
            //         "payments": [
            //             {
            //                 "paymentMethod": "EBAY",
            //                 "paymentReferenceId": "420004_S",
            //                 "paymentDate": "2025-03-19T09:07:33.965Z",
            //                 "amount": {
            //                     "value": "225.87",
            //                     "currency": "AUD"
            //                 },
            //                 "paymentStatus": "PAID"
            //             }
            //         ]
            //     },
            //     "fulfillmentStartInstructions": [
            //         {
            //             "fulfillmentInstructionsType": "SHIP_TO",
            //             "minEstimatedDeliveryDate": "2025-03-20T13:00:00.000Z",
            //             "maxEstimatedDeliveryDate": "2025-03-24T13:00:00.000Z",
            //             "ebaySupportedFulfillment": false,
            //             "shippingStep": {
            //                 "shipTo": {
            //                     "fullName": "Callum Robertson",
            //                     "contactAddress": {
            //                         "addressLine1": "ebay:xgslkk7",
            //                         "addressLine2": "3 Wattle Blossom Bvd",
            //                         "city": "Moe",
            //                         "stateOrProvince": "VIC",
            //                         "postalCode": "3825",
            //                         "countryCode": "AU"
            //                     },
            //                     "primaryPhone": {
            //                         "phoneNumber": "0459326633"
            //                     },
            //                     "email": "3dc90952331c3656f384@members.ebay.com"
            //                 },
            //                 "shippingServiceCode": "AU_StandardDelivery"
            //             }
            //         }
            //     ],
            //     "fulfillmentHrefs": [],
            //     "lineItems": [
            //         {
            //             "lineItemId": "10075789881221",
            //             "legacyItemId": "143894109894",
            //             "sku": "CSWT-BBH900",
            //             "title": "NEW CORTEX Olympic Barbell Holder for 9 Bars/Barbells Steel Storage",
            //             "lineItemCost": {
            //                 "value": "249.0",
            //                 "currency": "AUD"
            //             },
            //             "quantity": 1,
            //             "soldFormat": "FIXED_PRICE",
            //             "listingMarketplaceId": "EBAY_AU",
            //             "purchaseMarketplaceId": "EBAY_AU",
            //             "lineItemFulfillmentStatus": "NOT_STARTED",
            //             "total": {
            //                 "value": "251.58",
            //                 "currency": "AUD"
            //             },
            //             "deliveryCost": {
            //                 "shippingCost": {
            //                     "value": "2.58",
            //                     "currency": "AUD"
            //                 }
            //             },
            //             "appliedPromotions": [
            //                 {
            //                     "discountAmount": {
            //                         "value": "0.0",
            //                         "currency": "AUD"
            //                     },
            //                     "promotionId": "6",
            //                     "description": "Save with great prices"
            //                 }
            //             ],
            //             "taxes": [],
            //             "properties": {
            //                 "buyerProtection": true
            //             },
            //             "lineItemFulfillmentInstructions": {
            //                 "minEstimatedDeliveryDate": "2025-03-20T13:00:00.000Z",
            //                 "maxEstimatedDeliveryDate": "2025-03-24T13:00:00.000Z",
            //                 "shipByDate": "2025-03-20T12:59:59.000Z",
            //                 "guaranteedDelivery": false
            //             },
            //             "itemLocation": {
            //                 "location": "VIC",
            //                 "countryCode": "AU",
            //                 "postalCode": "3061"
            //             }
            //         }
            //     ],
            //     "salesRecordReference": "200162",
            //     "totalFeeBasisAmount": {
            //         "value": "251.58",
            //         "currency": "AUD"
            //     },
            //     "totalMarketplaceFee": {
            //         "value": "25.71",
            //         "currency": "AUD"
            //     }
            // }];

        }
        const map = (mapContext) => {
            try {
                var title = 'mapContext[::]';
                var custId;
                try {

                    var data = JSON.parse(mapContext.value);

                    if (!isEmpty(data)) {

                        //check if SO already exits in NS

                        var orderId = 'ebay-default-' + data.orderId;

                        var soExitsAlready = checkSOinNS(data.orderId);

                        if (soExitsAlready == false) {

                            var custObj = data.buyer;

                            var email = data.buyer.buyerRegistrationAddress.email;

                            custId = findCustomerInNS(email);

                            //create customer in NetSuite if not found
                            if (custId == 0) {

                                var custId = createCustomer(custObj);

                            } else {
                                // var custId = 11362832;
                                // Create Sales Order in NS
                                createSalesOrderInNS(custId, data);

                            }

                        } else {

                            log.debug({
                                title: 'Sales Order eBay-default-' + data.orderId + '',
                                details: 'Already in NS'
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
        function findCustomerInNS(email) {
            var customerSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: [
                    ['email', 'is', email]
                ],
                columns: ['internalid']
            });

            var resultSet = customerSearch.run();
            var searchResult = resultSet.getRange({ start: 0, end: 1 });

            if (searchResult.length > 0) {
                var id = searchResult[0].getValue('internalid');
            }
            return id || 0;
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0) || Object.keys(stValue).length === 0) {
                return true;
            }
            return false;
        }
        function createCustomer(obj) {
            var title = 'createCustomer[::]';
            try {
                var custObjRecord = record.create({
                    type: record.Type.CUSTOMER,
                    isDynamic: true
                });

                let fullname = obj.buyerRegistrationAddress.fullName;
                let { firstName, lastName } = getFirstAndLastName(fullname);

                custObjRecord.setValue({ fieldId: 'customform', value: 2 });//GFL Customer Form
                custObjRecord.setValue({ fieldId: 'isperson', value: 'T' });
                custObjRecord.setValue({ fieldId: 'firstname', value: firstName });
                custObjRecord.setValue({ fieldId: 'lastname', value: lastName });
                custObjRecord.setValue({ fieldId: 'parent', value: 913 }); //5616 EBAY
                custObjRecord.setValue({ fieldId: 'category', value: 12 }); //Accounts Marketplace
                custObjRecord.setValue({ fieldId: 'phone', value: obj.buyerRegistrationAddress.primaryPhone.phoneNumber });
                custObjRecord.setValue({ fieldId: 'subsidiary', value: 1 }); // GFL
                custObjRecord.setValue({ fieldId: 'email', value: obj.buyerRegistrationAddress.email });

                // Set the address
                custObjRecord.selectNewLine({ sublistId: 'addressbook' });
                // custObjRecord.setCurrentSublistValue({
                //     sublistId: 'addressbook',
                //     fieldId: 'defaultshipping',
                //     value: true
                // });
                custObjRecord.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultbilling',
                    value: true
                });

                var addressSubrecord = custObjRecord.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                });

                addressSubrecord.setValue({ fieldId: 'country', value: obj.buyerRegistrationAddress.contactAddress.countryCode });
                addressSubrecord.setValue({ fieldId: 'state', value: obj.taxAddress.stateOrProvince });
                addressSubrecord.setValue({ fieldId: 'city', value: obj.buyerRegistrationAddress.contactAddress.city });
                addressSubrecord.setValue({ fieldId: 'zip', value: obj.taxAddress.postalCode });
                addressSubrecord.setValue({ fieldId: 'addr1', value: obj.buyerRegistrationAddress.contactAddress.addressLine1 });

                custObjRecord.commitLine({ sublistId: 'addressbook' });

                var customerId = custObjRecord.save();
                log.debug('Customer Created', 'ID: ' + customerId);

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return customerId || 0;
        }
        function getFirstAndLastName(fullname) {
            let nameParts = fullname.trim().split(" ");
            return {
                firstName: nameParts[0] || "",
                lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""
            };
        }
        function createSalesOrderInNS(custId, obj) {
            var title = 'createSalesOrderInNS[::]';
            try {

                var itemDataLength = obj.lineItems;

                var salesOrderObj = record.create({
                    type: 'salesorder',
                    isDynamic: true
                });

                salesOrderObj.setValue({ fieldId: 'customform', value: 189 });//GFL Sales Order - invoice
                // Uncomment when to production (shipmethod)
                // salesOrderObj.setValue({ fieldId: 'shipmethod', value: 13712 });// Best Available
                salesOrderObj.setValue({ fieldId: 'entity', value: custId });
                salesOrderObj.setValue({ fieldId: 'location', value: 15 });//AU : Broadmeadows VIC
                salesOrderObj.setValue({ fieldId: 'subsidiary', value: 1 });//  GFL
                salesOrderObj.setValue({ fieldId: 'externalid', value: 'eBay-default-' + obj.orderId });
                salesOrderObj.setValue({ fieldId: 'custbody_ebay_order', value: true });
                salesOrderObj.setValue({ fieldId: 'otherrefnum', value: 'eBay Order' });
                salesOrderObj.setValue({ fieldId: 'custbody1', value: obj.orderId });
                salesOrderObj.setValue({ fieldId: 'memo', value: obj.orderId });
                salesOrderObj.setValue({ fieldId: 'shippingcost', value: obj.deliveryCost.shippingCost.value });

                // var addressSubrecord = salesOrderObj.getSubrecord('shippingaddress');
                // var addressSubrecord = salesOrderObj.getSubrecord('shipaddress');
                //     if (addressSubrecord) {
                //         addressSubrecord.setValue({ fieldId: 'country', value: obj.shippingStep.shipTo.contactAddress.countryCode });
                //         addressSubrecord.setValue({ fieldId: 'state', value: obj.shippingStep.shipTo.contactAddress.stateOrProvince });
                //         addressSubrecord.setValue({ fieldId: 'city', value: obj.shippingStep.shipTo.contactAddress.city });
                //         addressSubrecord.setValue({ fieldId: 'zip', value: obj.shippingStep.shipTo.contactAddress.postalCode });
                //         addressSubrecord.setValue({ fieldId: 'addr1', value: obj.shippingStep.shipTo.contactAddress.addressLine1 });
                //         addressSubrecord.setValue({ fieldId: 'addr2', value: obj.shippingStep.shipTo.contactAddress.addressLine2 });
                //         addressSubrecord.setValue({ fieldId: 'addressee', value: obj.shippingStep.shipTo.fullName });
                //     }




                for (var m = 0; m < itemDataLength.length; m++) {

                    var itemPriceObj = itemDataLength[m].lineItemCost;
                    var qtyOrder = itemDataLength[m].quantity;
                    var item = itemDataLength[m].sku;

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
                            fieldId: 'price',
                            line: m,
                            value: 1
                        });

                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: m,
                            value: qtyOrder
                        });

                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'grossamt',
                            line: m,
                            value: itemPriceObj.value
                        });
                        salesOrderObj.commitLine({
                            sublistId: 'item'
                        });

                        var soId = salesOrderObj.save();

                        log.debug({
                            title: 'Sales Order is Created ID',
                            details: soId
                        });
                    } else {
                        log.debug({
                            title: 'NO Item Exists',
                            details: 'NO Item Exists in NetSuite'
                        });
                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
                eBayConfig.CONFIG.createEbayErrorRecord(e.name,e.message,obj.orderId);
            }
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
        function checkSOinNS(id) {
            var title = 'checkSOinNS[::]';
            var result = false;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            // ["externalid", "anyof", id],
                            ["custbody1", "is", id],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "tranid", label: "Document Number" })
                        ]
                });

                salesorderSearchObj.run().each(function (result) {
                    var ID = result.id;
                    if (ID) {
                        result = true;
                    }
                    return true;
                });

                /*
                salesorderSearchObj.id="customsearch1739960874777";
                salesorderSearchObj.title="eBay Order Already in NS (copy)";
                var newSearchId = salesorderSearchObj.save();
                */
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return result || false;
        }

        return { getInputData, map }

    });
