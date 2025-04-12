/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/format', 'N/search', 'N/ui/serverWidget', '../dao/amazon_config_dao', '../lib/amazon_request_lib', 'N/https', 'N/task'],
    function (log, record, format, search, serverWidget, amazonConfig, requestLib, https, task) {

        function onRequest(scriptContext) {
            var title = 'onRequest[::]';
            try {
                if (scriptContext.request.method === 'GET') {

                    var form = serverWidget.createForm({
                        title: 'Re Execute Amazon Order'
                    });
                    //client script 
                    form.clientScriptFileId = 20145896;
                    // Select Date
                    var amazonOrderDate = form.addField({
                        id: 'custpage_amazonorderid',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Amazon Order Id'
                    });

                    var amazonOrderIdParam = '';

                    amazonOrderIdParam = scriptContext.request.parameters.amazonOrderid;
                    log.debug({
                        title: 'amazonOrderIdParam',
                        details: amazonOrderIdParam
                    });

                    var ordersLength;

                    if (amazonOrderIdParam) {
                        amazonOrderDate.defaultValue = amazonOrderIdParam;
                        ordersLength = reExecuteAmazonOrder(amazonOrderIdParam);
                    } else {
                        ordersLength = reExecuteAmazonOrder(amazonOrderIdParam)
                    }




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
                        id: 'custpage_status',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Status'
                    });
                    itemSublist.addField({
                        id: 'custpage_error',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Error'
                    });

                    if (ordersLength && ordersLength.length > 0) {
                        for (var m = 0; m < ordersLength.length; m++) {
                            var orderId = ' ';
                            var status = ' ';
                            var error = ' ';
                            // log.debug({
                            //     title: 'orderData',
                            //     details: orderData
                            // });
                            orderId = ordersLength[m].amazonOrderId;
                            status = ordersLength[m].status;
                            error = ordersLength[m].error;

                            itemSublist.setSublistValue({
                                id: 'custpage_order_id',
                                line: m,
                                value: orderId || ' '
                            });
                            itemSublist.setSublistValue({
                                id: 'custpage_status',
                                line: m,
                                value: status || ' '
                                // value: 'date'
                            });
                            itemSublist.setSublistValue({
                                id: 'custpage_error',
                                line: m,
                                value: error || ' '
                                // value: 'email'
                            });
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

        function reExecuteAmazonOrder(amazonOrderId) {
            var title = 'formatDateString[::]';
            var obj;
            var array = [];
            try {
                log.debug({
                    title: 'amazonOrderId=========',
                    details: amazonOrderId
                });
                if (!isEmpty(amazonOrderId)) {
                    var customrecord4271SearchObj = search.create({
                        type: "customrecord4271",
                        filters:
                            [
                                ["custrecord_amazon_error", "isnotempty", ""],
                                "AND",
                                ["custrecord_amazon_order_status", "is", "Failed"],
                                "AND",
                                ["custrecord_reexecuted", "is", "F"],
                                "AND",
                                ["custrecord_amazon_orders", "is", amazonOrderId]

                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "custrecord_amazon_orders",
                                    summary: "GROUP",
                                    label: "Amazon Orders "
                                }),
                                search.createColumn({
                                    name: "custrecord_amazon_order_status",
                                    summary: "GROUP",
                                    label: "Status"
                                }),
                                search.createColumn({
                                    name: "custrecord_amazon_error",
                                    summary: "GROUP",
                                    label: "Error"
                                })
                            ]
                    });
                }else{

                    var customrecord4271SearchObj = search.create({
                        type: "customrecord4271",
                        filters:
                            [
                                ["custrecord_amazon_error", "isnotempty", ""],
                                "AND",
                                ["custrecord_amazon_order_status", "is", "Failed"],
                                "AND",
                                ["custrecord_reexecuted", "is", "F"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "custrecord_amazon_orders",
                                    summary: "GROUP",
                                    label: "Amazon Orders "
                                }),
                                search.createColumn({
                                    name: "custrecord_amazon_order_status",
                                    summary: "GROUP",
                                    label: "Status"
                                }),
                                search.createColumn({
                                    name: "custrecord_amazon_error",
                                    summary: "GROUP",
                                    label: "Error"
                                })
                            ]
                    });
                }
                customrecord4271SearchObj.run().each(function (result) {
                    obj = {};
                    obj.amazonOrderId = result.getValue({ name: 'custrecord_amazon_orders', summary: 'GROUP' });
                    obj.status = result.getValue({ name: 'custrecord_amazon_order_status', summary: 'GROUP' });
                    obj.error = result.getValue({ name: 'custrecord_amazon_error', summary: 'GROUP' });
                    array.push(obj);
                    return true;
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0) || Object.keys(stValue).length === 0) {
                return true;
            }
            return false;
        }
        return {
            onRequest: onRequest
        }
    });
