/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/runtime', '../eBay_dao/eBay_confiq_dao.js', 'N/log', '../eBay_lib/eBay_request_lib.js'],
    (search, record, runtime, eBayConfig, log, eBayLib) => {

        const getInputData = () => {
            try {
                let selectedOrders = runtime.getCurrentScript().getParameter({ name: 'custscript_selected_orders' });
                log.audit({ title: 'Retrieved Selected Orders', details: selectedOrders });

                let parsedOrders = JSON.parse(selectedOrders || '[]');
                log.audit({ title: 'Parsed Selected Orders', details: parsedOrders });

                // Get eBay orders from the API
                /** 
                let eBayConfigToken = eBayConfig.CONFIG.getEbayConfigurations();
                let eBayOrders = eBayConfig.CONFIG.getEbayOrders(eBayConfigToken);
                let ebayOrderArray = eBayOrders.orders || [];

                let matchedOrders = [];

                for (let i = 0; i < ebayOrderArray.length; i++) {
                    let order = ebayOrderArray[i];
                    let orderId = order.orderId;

                    if (parsedOrders.includes(orderId)) {
                        log.debug({ title: 'Matched Order', details: orderId });
                        matchedOrders.push(order);
                    }
                }

                log.audit({ title: 'Final Orders to Process', details: matchedOrders });

                return matchedOrders;
                */
                return parsedOrders;
            } catch (e) {
                log.error({ title: 'Error in getInputData', details: e });
                return [];
            }
        };

        const map = (context) => {
            try {
                let data = context.value;
                let orderId = context.value; //data.orderId; 
                log.audit({ title: 'Processing Order in Map', details: data });

                let eBayConfigToken = eBayConfig.CONFIG.getEbayConfigurations();
                log.debug('Token', eBayConfigToken);
                let orderDetails = eBayLib.REQUESTS.getOrdersDeatilsFromEBay(eBayConfigToken, orderId);
                log.debug('Details', orderDetails);

                if (!orderDetails || !orderDetails.orderId) {
                    log.error('map:err', `Order details not found for Order ID: ${orderId}`);
                    return;
                }

                // var soExitsAlready = checkSOinNS(orderId);
                let SOId = checkOrderIdinSO(orderId);
                var custObj = orderDetails.buyer;
                var email = orderDetails.buyer.buyerRegistrationAddress.email;
                log.debug('Email'.email);
                let custId;
                if (!SOId) {
                    custId = findCustomerInNS(email);

                    if (custId == 0) {
                        log.debug('Customer Create');
                        custId = createCustomer(custObj);
                    }
                    log.debug('SO Create');
                    createSalesOrderInNS(custId, orderDetails);

                } else {
                    log.debug('SO Update');
                    updateSalesOrderInNS(orderDetails, SOId);
                    log.debug({ title: 'Sales Order eBay-default-' + orderDetails.orderId, details: 'Already in NS' });
                }
            } catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;
                log.error('map:err', err);
            }
        };


        function checkOrderIdinSO(id) {
            var title = 'checkOrderIdinSO[::]';
            var salesOrderId;

            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters: [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["memo", "is", id]
                    ],
                    columns: [search.createColumn({ name: "internalid", label: "Internal Id" })]
                });

                var searchResult = salesorderSearchObj.run().getRange({ start: 0, end: 1 });
                if (searchResult.length > 0) {
                    salesOrderId = searchResult[0].getValue({ name: "internalid" });
                }

            } catch (e) {
                log.error(title + e.name, e.message);
            }

            return salesOrderId;
        }
        function createSalesOrderInNS(custId, obj) {
            var title = 'createSalesOrderInNS[::]';
            try {

                var itemDataLength = obj.lineItems;

                var salesOrderObj = record.create({
                    type: 'salesorder',
                    isDynamic: true
                });

                salesOrderObj.setValue({ fieldId: 'customform', value: 118 });//GFL Sales Order - invoice
                salesOrderObj.setValue({ fieldId: 'entity', value: custId });
                salesOrderObj.setValue({ fieldId: 'subsidiary', value: 1 });//  GFL
                salesOrderObj.setValue({ fieldId: 'externalid', value: 'eBay-default-' + obj.orderId });
                salesOrderObj.setValue({ fieldId: 'custbody_ebay_order', value: true });
                salesOrderObj.setValue({ fieldId: 'otherrefnum', value: 'eBay Integration' });
                salesOrderObj.setValue({ fieldId: 'location', value: 15 });//AU : Broadmeadows VIC
                salesOrderObj.setValue({ fieldId: 'shipmethod', value: 13712 });// Best Available
                salesOrderObj.setValue({ fieldId: 'custbody1', value: obj.orderId  });
                salesOrderObj.setValue({ fieldId: 'memo', value: obj.orderId  });
                salesOrderObj.setValue({ fieldId: 'shippingcost', value: obj.pricingSummary.deliveryCost.value });

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
                            fieldId: 'quantity',
                            line: m,
                            value: qtyOrder
                        });
                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
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
                            title: 'Add harcodded Item',
                            details: 'item added'
                        });
                        salesOrderObj.selectNewLine({
                            sublistId: 'item'
                        });
                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: m,
                            value: parseInt(35727)
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
                            value: itemPriceObj.value
                        });
                        salesOrderObj.commitLine({
                            sublistId: 'item'
                        });

                        var soId = salesOrderObj.save();

                        log.debug({
                            title: 'Created Sales Order',
                            details: soId
                        });
                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
                eBayConfig.CONFIG.createEbayErrorRecord(e.name, e.message, obj.orderId);
            }
        }
        function updateSalesOrderInNS(obj, SOId) {
            var title = 'updateSalesOrderInNS[::]';
            try {

                var itemDataLength = obj.lineItems;

                let salesOrderObj = record.load({
                    type: record.Type.SALES_ORDER,
                    id: SOId,
                    isDynamic: true
                });
                let entity = salesOrderObj.getValue('entity');
                log.debug('Entity', entity);
                salesOrderObj.setValue({ fieldId: 'entity', value: entity });
                //salesOrderObj.setValue({ fieldId: 'subsidiary', value: 1 });
                salesOrderObj.setValue({ fieldId: 'externalid', value: 'eBay-default-' + obj.orderId });
                salesOrderObj.setValue({ fieldId: 'custbody_ebay_order', value: true });
                let lineCount = salesOrderObj.getLineCount({ sublistId: 'item' });
                for (let i = lineCount - 1; i >= 0; i--) {
                    salesOrderObj.removeLine({ sublistId: 'item', line: i });
                }


                for (var m = 0; m < itemDataLength.length; m++) {

                    var itemPriceObj = itemDataLength[m].lineItemCost;
                    var qtyOrder = itemDataLength[m].quantity;
                    var item = itemDataLength[m].sku;

                    var InternalIdofItem = internalIdItemSearch(item);
                    log.debug('Item', InternalIdofItem);

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
                            value: itemPriceObj.value
                        });
                        salesOrderObj.commitLine({
                            sublistId: 'item'
                        });

                        var soId = salesOrderObj.save();

                        log.debug({
                            title: 'Created Sales Order',
                            details: soId
                        });
                    } else {
                        log.debug({
                            title: 'NO Item Exists',
                            details: 'NO Item Exists in NetSuite'
                        });
                        salesOrderObj.selectNewLine({
                            sublistId: 'item'
                        });
                        salesOrderObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            line: m,
                            value: parseInt(35727)
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
                            value: itemPriceObj.value
                        });
                        salesOrderObj.commitLine({
                            sublistId: 'item'
                        });

                        var soId = salesOrderObj.save();

                        log.debug({
                            title: 'Updated Sales Order ID',
                            details: soId
                        });
                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
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

                custObjRecord.selectNewLine({ sublistId: 'addressbook' });
                custObjRecord.setCurrentSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'defaultshipping',
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

                if (obj.shippingAddress) {
                    custObjRecord.selectNewLine({ sublistId: 'addressbook' });
                    custObjRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'defaultshipping',
                        value: true
                    });

                    var shippingAddress = custObjRecord.getCurrentSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress'
                    });



                    shippingAddress.setValue({ fieldId: 'country', value: obj.shippingStep.shipTo.contactAddress.countryCode });
                    shippingAddress.setValue({ fieldId: 'state', value: obj.shippingStep.shipTo.contactAddress.stateOrProvince });
                    shippingAddress.setValue({ fieldId: 'city', value: obj.shippingStep.shipTo.contactAddress.city });
                    shippingAddress.setValue({ fieldId: 'zip', value: obj.shippingStep.shipTo.contactAddress.postalCode });//add here
                    shippingAddress.setValue({ fieldId: 'addr1', value: obj.shippingStep.shipTo.contactAddress.addressLine1 });
                    shippingAddress.setValue({ fieldId: 'addr2', value: obj.shippingStep.shipTo.contactAddress.addressLine2 });
                    shippingAddress.setValue({ fieldId: 'addressee', value: obj.shippingStep.shipTo.fullName });

                    custObjRecord.commitLine({ sublistId: 'addressbook' });
                }

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

        return { getInputData, map };
    });
