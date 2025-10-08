/**
 * @NApiVersion 2.0
 */
define(['N/log', 'N/https', 'N/record', 'N/search'], function (log, https, record, search) {

    return {

        getToken: function () {
            var title = 'getToken[::]';
            try {
                //Generate Token
                // var tokenHeaders = {};
                // tokenHeaders['Content-Type'] = 'application/json';
                // tokenHeaders['CF-Access-Client-Id'] = '8cc9241f7630aacbfb11a4d9e7034e82.access';
                // tokenHeaders['CF-Access-Client-Secret'] = '3d58b482c726963d206292959707498b40e883e3a405c98812ed4174f8b7ccf5';
                // tokenHeaders['TWSP-API-KEY'] = '1E468A83-D9B0-8AED-48E7-24F19F821076';

                var tokenHeaders = {};
                tokenHeaders['Content-Type'] = 'application/json';
                tokenHeaders['TWSP-API-KEY'] = '79AFF2E0-6DBF-21C7-6B9E-41BEEEA7A26C';

                // var tokenLink = 'https://staging.partners.templeandwebster.com.au/v/api/v1/authenticate/generate_token';
                var tokenLink = 'https://partners.templeandwebster.com.au/v/api/v1/authenticate/generate_token';

                var tokenResponse = https.get({
                    url: tokenLink,
                    headers: tokenHeaders
                });

                if (tokenResponse.code !== 200) {
                    log.error('Token generation failed', 'Response code: ' + tokenResponse.code + ' Body: ' + tokenResponse.body);
                    return;
                }
                log.debug({
                    title: 'tokenResponse',
                    details: tokenResponse
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return tokenResponse || '';
        },
        poOrderList: function (fromDate, toDate) {
            var title = 'poOrderList[::]';
            try {
                var tokenResponse = this.getToken();
                log.debug({
                    title: 'tokenResponse======',
                    details: tokenResponse
                });

                var tokenResponseJSON = JSON.parse(tokenResponse.body);

                log.debug({
                    title: 'tokenResponseJSON>>>>',
                    details: tokenResponseJSON
                });

                var accessToken = tokenResponseJSON.data.access_token;

                // Capture cookies from the token response
                var cookies = tokenResponse.headers['Set-Cookie'];

                // log.debug({
                //     title: 'cookies',
                //     details: cookies
                // });

                if (cookies) {
                    var poHeaders = {
                        'Authorization': 'Bearer ' + accessToken,
                        'Cookie': cookies,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };

                    var poResponse = https.get({
                        url: 'https://partners.templeandwebster.com.au/v/api/v1/orders/list_purchase_orders?order_ready_date_from=' + fromDate + '&order_ready_date_to=' + toDate + '',
                        // url: 'https://staging.partners.templeandwebster.com.au/v/api/v1/orders/list_purchase_orders?order_ready_date_from='+fromDate+'&order_ready_date_to='+toDate+'',
                        headers: poHeaders
                    });

                    log.debug({
                        title: 'poResponse==>>',
                        details: poResponse
                    });
                    log.debug({
                        title: 'poResponse==>>.body',
                        details: poResponse.body
                    });

                    // Check response
                    if (poResponse.code !== 200) {
                        log.error('Failed to fetch Purchase Orders List', 'Response code: ' + poResponse.code + ' Body: ' + poResponse.body);
                        return;
                    }
                    // Process Purchase Orders Data
                    var purchaseOrdersData = JSON.parse(poResponse.body);

                    log.debug({
                        title: 'purchaseOrdersData',
                        details: purchaseOrdersData
                    });

                } else {
                    log.error('No cookies received from the token generation response.');
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return JSON.stringify(purchaseOrdersData);
        },
        getOnePoDataList: function (id) {
            var title = 'getOnePoDataList[::]';
            try {
                var tokenResponse = this.getToken();

                var tokenResponseJSON = JSON.parse(tokenResponse.body);

                var accessToken = tokenResponseJSON.data.access_token;

                // Capture cookies from the token response
                var cookies = tokenResponse.headers['Set-Cookie'];

                if (cookies) {
                    var poHeaders = {
                        'Authorization': 'Bearer ' + accessToken,
                        'Cookie': cookies,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };

                    var poOneOrderResponse = https.get({
                        url: 'https://partners.templeandwebster.com.au/v/api/v1/orders/get_purchase_order?purchase_order=' + id + '',
                        headers: poHeaders
                    });

                    // Check response
                    if (poOneOrderResponse.code !== 200) {
                        log.error('Failed to fetch Purchase Orders', 'Response code: ' + poOneOrderResponse.code + ' Body: ' + poOneOrderResponse.body);
                        return;
                    }
                    // Process Purchase Orders Data
                    var purchaseOrdersData = JSON.parse(poOneOrderResponse.body);

                } else {
                    log.error('No cookies received from the token generation response.');
                }
            }

            catch (e) {
                log.error(title + e.name, e.message);
            }
            return JSON.stringify(purchaseOrdersData);
        },
        updateManifiestOrder: function (twOrderId) {
            var title = 'updateManifiestOrder[::]';
            try {
                var tokenResponse = this.getToken();

                var tokenResponseJSON = JSON.parse(tokenResponse.body);

                var accessToken = tokenResponseJSON.data.access_token;

                // Capture cookies from the token response
                var cookies = tokenResponse.headers['Set-Cookie'];

                if (cookies) {
                    var manifiestHeaders = {
                        'Authorization': 'Bearer ' + accessToken,
                        'Cookie': cookies,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };

                    var updateManifiest = https.post({
                        url: 'https://partners.templeandwebster.com.au/v/api/v1/orders/manifest_purchase_order?purchase_order=' + twOrderId + '',
                        headers: manifiestHeaders
                    });

                    // Check response
                    log.debug({
                        title: 'updateManifiest',
                        details: updateManifiest
                    });

                    if (updateManifiest.code !== 200) {
                        log.error('Failed to update Temple and Webster Manifiest', 'Response code: ' + updateManifiest.code + ' Body: ' + updateManifiest.body);
                        return;
                    }

                } else {
                    log.error('No cookies received from the token generation response.');
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        },
        printLable: function (orderId, twOrderId) {
            var title = 'printLable[::]';
            try {
                var tokenResponse = this.getToken();

                var tokenResponseJSON = JSON.parse(tokenResponse.body);

                var accessToken = tokenResponseJSON.data.access_token;

                log.debug({
                    title: 'accessToken====',
                    details: accessToken
                });
                log.debug({
                    title: 'orderId==>>::',
                    details: orderId
                });

                // Capture cookies from the token response
                var cookies = tokenResponse.headers['Set-Cookie'];

                // log.debug({
                //     title: 'cookies',
                //     details: cookies
                // });

                if (cookies) {
                    var printLableHeaders = {
                        'Authorization': 'Bearer ' + accessToken,
                        'Cookie': cookies,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };

                    var printLableArray = this.printLableSeach(orderId);
                    log.debug({
                        title: 'printLableArray===>>>:::',
                        details: printLableArray
                    });

                    var consignment = [];

                    // if (printLableArray && printLableArray.length > 0) {

                    //     for (var i = 0; i < printLableArray.length; i++) {
                    //         var item = printLableArray[i];

                    //         // consignment.push({
                    //         //     container_type: "Carton(s)",
                    //         //     container_weight: item.netWeight ? parseFloat(item.netWeight) : 1, // Default to 0 if empty
                    //         //     container_width: parseFloat(item.width),
                    //         //     container_depth: parseFloat(item.totalLength),
                    //         //     container_height: parseFloat(item.height),
                    //         //     container_description: "mainbox"
                    //         // });

                    //         consignment.push({
                    //             container_type: "Carton(s)",
                    //             container_weight: item.netWeight ? parseFloat(item.netWeight) : 1, // Default to 1 if empty
                    //             container_width: parseFloat(item.width) || '',
                    //             container_depth: parseFloat(item.totalLength) || '',
                    //             container_height: parseFloat(item.height) || '',
                    //             // container_description: i === 0 ? "mainbox" : "secondary box"
                    //             container_description: this.getBoxLabel(i)
                    //         });
                    //     }

                    // }


                    if (printLableArray && printLableArray.length > 0) {
                        var boxIndex = 0;
                        for (var i = 0; i < printLableArray.length; i++) {
                            var item = printLableArray[i];
                            var quantity = parseInt(item.quantity) || 1;

                            for (var j = 0; j < quantity; j++) {
                                consignment.push({
                                    container_type: "Carton(s)",
                                    container_weight: item.netWeight ? parseFloat(item.netWeight) : 1,
                                    container_width: parseFloat(item.width) || '',
                                    container_depth: parseFloat(item.totalLength) || '',
                                    container_height: parseFloat(item.height) || '',
                                    container_description: this.getBoxLabel(boxIndex)
                                });
                                boxIndex++; // increment for each box, not just each item
                            }
                        }
                    }

                    var printLableBody = {
                        "purchase_order": twOrderId,
                        "location_id": 23669,
                        "consignment": consignment
                    };

                    var payload = JSON.stringify(printLableBody);
                    log.debug({
                        title: 'payload',
                        details: payload
                    });

                    var printLableResponse = https.post({
                        url: 'https://partners.templeandwebster.com.au/v/api/v1/label/generate',
                        // body: JSON.stringify(printLableBody),
                        body: payload,
                        headers: printLableHeaders
                    });

                    // Log the raw response body
                    log.debug({
                        title: 'Raw Response Body',
                        details: printLableResponse.body
                    });

                    // Parse and log the response if valid JSON
                    // try {
                    //     var printLableData = JSON.parse(printLableResponse.body);
                    //     log.debug({
                    //         title: 'Parsed Response',
                    //         details: printLableData
                    //     });
                    // } catch (e) {
                    //     log.error('Failed to parse JSON response', 'Error: ' + e.message + ' Response Body: ' + printLableResponse.body);
                    // }

                    // Check response
                    // if (printLableResponse.code !== 200) {
                    //     log.error('Failed to fetch Purchase Orders List', 'Response code: ' + printLableResponse.code + ' Body: ' + printLableData);
                    //     return;
                    // }
                    // Print Lable Data
                    var printLableData = JSON.parse(printLableResponse.body);

                } else {
                    log.error('No cookies received from the token generation response.');
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return printLableData;
        },
        printLableSeach: function (id) {
            var title = 'printLableSeach[::]';
            var obj;
            var array = [];
            // try {
            //     var salesorderSearchObj = search.create({
            //         type: "salesorder",
            //         settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            //         filters:
            //             [
            //                 ["type", "anyof", "SalesOrd"],
            //                 "AND",
            //                 ["custbody1", "is", id],
            //                 "AND",
            //                 ["taxline", "is", "F"],
            //                 "AND",
            //                 ["shipping", "is", "F"],
            //                 "AND",
            //                 ["item", "noneof", "@NONE@"]
            //             ],
            //         columns:
            //             [
            //                 search.createColumn({ name: "tranid", label: "Document Number" }),
            //                 search.createColumn({ name: "item", label: "Item" }),
            //                 search.createColumn({
            //                     name: "custitem_avt_total_width",
            //                     join: "item",
            //                     label: "Total Width (CM)"
            //                 }),
            //                 search.createColumn({
            //                     name: "custitem_avt_total_height",
            //                     join: "item",
            //                     label: "Total Height (CM)"
            //                 }),
            //                 search.createColumn({
            //                     name: "custitem_cubic_charge_weight",
            //                     join: "item",
            //                     label: "Charge Weight (KG)"
            //                 }),
            //                 search.createColumn({
            //                     name: "custitem_avt_total_length",
            //                     join: "item",
            //                     label: "Total Length (CM)"
            //                 })
            //             ]
            //     });
            //     salesorderSearchObj.run().each(function (result) {
            //         obj = {};
            //         obj.width = result.getValue({ name: 'custitem_avt_total_width', join: 'item' });
            //         obj.height = result.getValue({ name: 'custitem_avt_total_height', join: 'item' });
            //         obj.netWeight = result.getValue({ name: 'custitem_cubic_charge_weight', join: 'item' });
            //         obj.totalLength = result.getValue({ name: 'custitem_avt_total_length', join: 'item' });
            //         array.push(obj);
            //         return true;
            //     });
            // } catch (e) {
            //     log.error(title + e.name, e.message);
            // }
            var title = 'printLableSeach[::]';
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["transaction.internalid", "anyof", id],
                            "AND",
                            ["transaction.type", "anyof", "SalesOrd"],
                            "AND",
                            ["transaction.shipping", "is", "F"],
                            "AND",
                            ["transaction.taxline", "is", "F"],
                            "AND",
                            ["transaction.mainline", "is", "F"],
                            "AND",
                            ["type", "noneof", "Kit"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "tranid",
                                join: "transaction",
                                label: "Document Number"
                            }),
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({ name: "custitem_avt_total_height", label: "Total Height (CM)" }),
                            search.createColumn({ name: "custitem_avt_total_length", label: "Total Length (CM)" }),
                            search.createColumn({ name: "custitem_avt_total_width", label: "Total Width (CM)" }),
                            search.createColumn({ name: "custitem_cubic_charge_weight", label: "Charge Weight (KG)" }),
                            search.createColumn({
                                name: "quantity",
                                join: "transaction",
                                label: "Quantity"
                            }),
                            search.createColumn({
                                name: "formulanumeric",
                                formula: "CASE WHEN {transaction.item} = 'EXERCISE : ACCESSORIES & ATTACHMENTS : CONSUMABLES : SILSPRAY' THEN 1 ELSE {transaction.quantity}END",
                                label: "Quantity"
                            })
                        ]
                });

                itemSearchObj.run().each(function (result) {
                    obj = {};
                    obj.width = result.getValue({ name: 'custitem_avt_total_width' });
                    obj.height = result.getValue({ name: 'custitem_avt_total_height' });
                    obj.netWeight = result.getValue({ name: 'custitem_cubic_charge_weight' });
                    obj.totalLength = result.getValue({ name: 'custitem_avt_total_length' });
                    // obj.quantity = result.getValue({ name: 'quantity', join: 'transaction' });
                    obj.quantity = result.getValue({ name: 'formulanumeric', formula: "CASE WHEN {transaction.item} = 'EXERCISE : ACCESSORIES & ATTACHMENTS : CONSUMABLES : SILSPRAY' THEN 1 ELSE {transaction.quantity}END" });
                    array.push(obj);
                    return true;
                });

                /*
                itemSearchObj.id="customsearch1751525447224";
                itemSearchObj.title="Custom Item Search 6 (copy)";
                var newSearchId = itemSearchObj.save();
                */
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        },
        getBoxLabel: function (index) {
            const labels = [
                "main box",
                "secondary box",
                "tertiary box",
                "quaternary box",
                "quinary box",
                "senary box",
                "septenary box",
                "octonary box",
                "nonary box",
                "denary box",
                "undecenary box",
                "duodecenary box",
                "tredecenary box",
                "quattuordecenary box",
                "quindecenary box",
                "sexdecenary box",
                "septendecenary box",
                "octodecenary box",
                "novemdecenary box",
                "vigenary box"
            ];

            return labels[index]; // fallback if more than 10
        }

    };
});
