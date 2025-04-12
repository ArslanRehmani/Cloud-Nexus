/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/format', 'N/search', 'N/ui/serverWidget', '../dao/amazon_config_dao', '../lib/amazon_request_lib', 'N/https', 'N/task'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{format} format
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{amazonConfig} amazonConfig
 * @param{requestLib} requestLib
 * @param{https} https
 */
    (log, record, format, search, serverWidget, amazonConfig, requestLib, https, task) => {
        const onRequest = (scriptContext) => {
            var title = 'onRequest[::]';
            try {
                if (scriptContext.request.method === 'GET') {

                    var form = serverWidget.createForm({
                        title: 'Amazon Order'
                    });
                    //client script 
                    form.clientScriptFileId = 20145896;
                    // Select Date
                    var amazonOrderDate = form.addField({
                        id: 'custpage_amazonorderdate',
                        type: serverWidget.FieldType.DATE,
                        label: 'Amazon Order Date'
                    });

                    var amazonOrderDateParam = scriptContext.request.parameters.amazonOrderDate;
                    log.debug({
                        title: 'amazonOrderDateParam',
                        details: amazonOrderDateParam
                    });

                    var todayDate = '';

                    if (amazonOrderDateParam) {
                        amazonOrderDate.defaultValue = amazonOrderDateParam;
                        todayDate = formatDateString(amazonOrderDateParam);
                    } else {
                        todayDate = requestLib.REQUESTS.getFormattedDate();
                    }

                    var token = amazonConfig.CONFIG.getAmazonConfigurations();

                    //Get Data from Amazon
                    var headers = {};
                    headers['Content-Type'] = 'application/json';
                    headers['x-amz-access-token'] = token;

                    log.debug({
                        title: 'todayDate',
                        details: todayDate
                    });
                    // todayDate = '2024-09-09';

                    // log.debug({
                    //     title: 'todayDate1',
                    //     details: todayDate
                    // });

                    var link = 'https://sellingpartnerapi-fe.amazon.com/orders/v0/orders?MarketplaceIds=A39IBJ37TRP1C6&CreatedAfter=' + todayDate + '';
                    var response = https.get({
                        url: link,
                        headers: headers
                    });
                    var responseBody = JSON.parse(response.body);

                    var ordersLength = responseBody.payload.Orders;

                    log.debug({
                        title: 'ordersLength',
                        details: ordersLength
                    });

                    var itemSublist = form.addSublist({
                        id: 'custpage_item_sublist',
                        // type: serverWidget.SublistType.STATICLIST,
                        type: serverWidget.SublistType.INLINEEDITOR,
                        label: 'Amazon Orders List'
                    });
                    itemSublist.addField({
                        id: 'custpage_checkbox',
                        type: serverWidget.FieldType.CHECKBOX,
                        label: 'Select'
                    });
                    itemSublist.addField({
                        id: 'custpage_order_id',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Order Id'
                    });
                    itemSublist.addField({
                        id: 'custpage_order_date',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Date'
                    });
                    itemSublist.addField({
                        id: 'custpage_cust_email',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Customer Email'
                    });
                    itemSublist.addField({
                        id: 'custpage_order_status',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Order Staus'
                    });

                    if (ordersLength && ordersLength.length > 0) {
                        for (var m = 0; m < ordersLength.length; m++) {
                            var custEmail = ' ';
                            var orderId = ' ';
                            var date = ' ';
                            var OrderStatus = ' ';
                            // var orderData = ordersLength[m];
                            // log.debug({
                            //     title: 'orderData',
                            //     details: orderData
                            // });
                            orderId = ordersLength[m].AmazonOrderId;
                            date = ordersLength[m].PurchaseDate;
                            if (Object.keys(ordersLength[m].BuyerInfo).length !== 0) {
                                custEmail = ordersLength[m].BuyerInfo.BuyerEmail;
                            }
                            OrderStatus = ordersLength[m].OrderStatus;

                            //Check If SO exist in SO in NS
                            var soExist = soExistSearch(orderId);
                            log.debug({
                                title: 'soExist',
                                details: soExist
                            });

                            // if (custEmail) {
                            itemSublist.setSublistValue({
                                id: 'custpage_order_id',
                                line: m,
                                value: orderId || ' '
                            });
                            itemSublist.setSublistValue({
                                id: 'custpage_order_date',
                                line: m,
                                value: date || ' '
                                // value: 'date'
                            });
                            itemSublist.setSublistValue({
                                id: 'custpage_cust_email',
                                line: m,
                                value: custEmail || ' '
                                // value: 'email'
                            });
                            if (soExist == true) {
                                itemSublist.setSublistValue({
                                    id: 'custpage_order_status',
                                    line: m,
                                    value: OrderStatus + " ,Synced"
                                });
                            } else {
                                itemSublist.setSublistValue({
                                    id: 'custpage_order_status',
                                    line: m,
                                    value: OrderStatus + " ,Not Synced"
                                });
                            }
                            // }

                        }
                    }

                    form.addSubmitButton({
                        label: 'Save'
                    });

                    scriptContext.response.writePage(form);

                } else {
                    var totalLines = scriptContext.request.getLineCount({ group: 'custpage_item_sublist' });
                    log.debug({
                        title: 'totalLines',
                        details: totalLines
                    });
                    var array = [];
                    var obj;
                    if (totalLines > 0) {
                        for (var m = 0; m < totalLines; m++) {
                            obj = {};
                            var checkBox = scriptContext.request.getSublistValue({
                                group: 'custpage_item_sublist',
                                name: 'custpage_checkbox',
                                line: m
                            });
                            var orderId = scriptContext.request.getSublistValue({
                                group: 'custpage_item_sublist',
                                name: 'custpage_order_id',
                                line: m
                            });
                            if (checkBox == 'T' || checkBox == true || checkBox == 'true') {
                                obj.amazonOrder = orderId;
                                array.push(obj);
                            }

                        }

                        log.debug({
                            title: 'array',
                            details: array
                        });
                        // Call MapReduce

                        var mrTask = task.create({
                            taskType: task.TaskType.MAP_REDUCE,
                            scriptId: 'customscript_mr_amazon_createsoin_ns',
                            deploymentId: 'customdeploy_mr_amazon_createsoin_ns',
                            params: {
                                'custscript_amazon_order_array': array
                            }
                        });
                        // Submit the map/reduce task
                        var mapReduceId = mrTask.submit();
                        log.debug({
                            title: 'mapReduceId',
                            details: mapReduceId
                        });

                    }


                    scriptContext.response.write(`You have entered: selectedOrder : ${JSON.stringify(array)}`);
                    // scriptContext.response.write(`You have entered: Data`);
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function soExistSearch(orderId) {
            var title = 'soExistSearch[::]';
            var soExist = false;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["externalidstring", "contains", orderId],
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
                        soExist = true;
                    }
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return soExist || false;
        }
        /*
        function getFormattedDateParam(date1) {
            var title = 'getFormattedDateParam[::]';
            try {
                log.debug({
                    title: 'date1',
                    details: date1
                });
                log.debug({
                    title: 'date1 TYPE',
                    details: typeof date1
                });
                const date = new Date('Mon Sep 09 2024 00:00:00 GMT 0500 (Pakistan Standard Time)');
                log.debug('Date', date);
                var year = date.getFullYear();
                var month = ("0" + (date.getMonth() + 1)).slice(-2); // Add 1 to get the correct month (0-indexed)
                var day = ("0" + date.getDate()).slice(-2);

                var formattedDate = `${year}-${month}-${day}`;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
             return formattedDate;
        }
        */
        function formatDateString(date) {
            var title = 'formatDateString[::]';
            try {
                // Given date in DD/MM/YYYY format
                var dateStr = date; // Use a string for the date

                // Split the date string into day, month, and year
                var parts = dateStr.split('/');

                // Rearrange the parts to YYYY-MM-DD format
                var formattedDate = `${parts[2]}-${String(parts[1]).padStart(2, '0')}-${String(parts[0]).padStart(2, '0')}`;
                return formattedDate;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return { onRequest }

    });
