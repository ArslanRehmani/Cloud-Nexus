/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define(['N/log', 'N/ui/serverWidget', 'N/search', 'N/record', 'N/redirect','N/task','N/ui/message'], 
function (log, serverWidget, search, record, redirect,task,message) {

    function onRequest(context) {
        var title = 'onRequest(::)';
        try {
            if (context.request.method === 'GET') {
                var param = context.request.parameters;
                var id = param.poid;
                displayForm(context, id);

            } else if (context.request.method === 'POST') {
                var totalLines = context.request.getLineCount({ group: 'custpage_po_list' });
                log.debug('totalLines', totalLines);
                var obj;
                var selectedPoIdArray = [];
                for (var i = 0; i < totalLines; i++) {
                    var isSelected = context.request.getSublistValue({
                        group: 'custpage_po_list',
                        name: 'custpage_sublist_bill',
                        line: i
                    });
                    if (isSelected == 'T' || isSelected == true) {
                        var POId = context.request.getSublistValue({
                            group: 'custpage_po_list',
                            name: 'custpage_sublist_poid',
                            line: i
                        });
                        var PODate = context.request.getSublistValue({
                            group: 'custpage_po_list',
                            name: 'custpage_sublist_date',
                            line: i
                        });
                        obj = {};
                        obj.id = POId;
                        obj.date = PODate;
                        selectedPoIdArray.push(obj);
                    }
                }
                log.debug({
                    title:'selectedPoIdArray',
                    details: selectedPoIdArray
                });
                //call MapReduce Script to Transform all selected PO to Bill
                try {
                    var title = 'mapReduceScript(::)';
                    //Call MR Script
                    var mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscriptpims_mr_transform_po_to_bill',
                        deploymentId: 'customdeploypims_mr_transform_po_to_bill',
                        params: {
                            'custscript_pims_selected_po_id': selectedPoIdArray
                        }
                    });
                    var mapReduceId = mrTask.submit();
                    log.debug('mapReduceId ', mapReduceId);
                    // var mrTaskId = mrTask.submit();
                    // var summary = task.checkStatus(mrTaskId);
                    
                } catch (e) {
                    log.debug('Exception ' + title, e.message);
                } 
                // var myMsg = message.create({
                //     title: 'My Title',
                //     message: 'My Message',
                //     type: message.Type.CONFIRMATION
                // });
                // myMsg.show({
                //     duration: 5000 // will disappear after 5s
                // });
                redirect.toSuitelet({
                    scriptId: 'customscript_pims_sl_receive_order',
                    deploymentId: 'customdeploy_pims_sl_receive_order'
                });
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }
    function displayForm(context, poid) {
        var title = 'displayForm(::)';
        try {
            var form = serverWidget.createForm({ title: 'Receive Orders' });
            form.clientScriptModulePath = "SuiteScripts/[AH] Customization Folder/Client Script/PIMS_CS_ReceiveOrders.js";
            form.addSubmitButton({ label: 'Submit' });
            var vendorField = form.addField({
                id: 'custpage_vendor',
                type: serverWidget.FieldType.SELECT,
                label: 'Vendor',
                source: 'vendor'
            });
            var poCount = form.addField({
                id: 'custpage_pocount',
                type: serverWidget.FieldType.TEXT,
                label: 'Total Receive Order'
            });
            var poSublist = form.addSublist({ // <—— HERE
                id: 'custpage_po_list',
                type: serverWidget.SublistType.LIST,
                label: 'Purchase Order List'
            });
            poSublist.addField({
                id: 'custpage_sublist_bill',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'BILL'
            });
            poSublist.addField({
                id: 'custpage_sublist_date',
                type: serverWidget.FieldType.TEXT,
                label: 'DATE'
            });
            var purchaseOrderLink = poSublist.addField({
                id: 'custpage_sublist_poid',
                type: serverWidget.FieldType.SELECT,
                label: 'PO ID',
                source: 'purchaseorder'
            });
            purchaseOrderLink.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            poSublist.addField({
                id: 'custpage_sublist_po_num',
                type: serverWidget.FieldType.TEXT,
                label: 'PO #'
            });
            poSublist.addField({
                id: 'custpage_sublist_vendor_name',
                type: serverWidget.FieldType.TEXT,
                label: 'VENDOR NAME'
            });
            poSublist.addField({
                id: 'custpage_sublist_subsidiary',
                type: serverWidget.FieldType.TEXT,
                label: 'SUBSIDIARY'
            });
            poSublist.addField({
                id: 'custpage_sublist_bill_to',
                type: serverWidget.FieldType.TEXT,
                label: 'BILL TO'
            });
            poSublist.addField({
                id: 'custpage_sublist_memo',
                type: serverWidget.FieldType.TEXT,
                label: 'MEMO'
            });
            poSublist.addField({
                id: 'custpage_sublist_order_total',
                type: serverWidget.FieldType.TEXT,
                label: 'ORDER TOTAL'
            });


            if (!!poid) {
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    filters:
                        [
                            ["type", "anyof", "PurchOrd"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["status", "noneof", "PurchOrd:A", "PurchOrd:G", "PurchOrd:H", "PurchOrd:C"],
                            "AND",
                            ["name", "anyof", poid]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "tranid", label: "PO #" }),
                            search.createColumn({ name: "entity", label: "Vendor Name" }),
                            search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                            search.createColumn({ name: "billaddress", label: "Bill To" }),
                            search.createColumn({ name: "memo", label: "Memo" }),
                            search.createColumn({ name: "amount", label: "Order Total" })
                        ]
                });
                vendorField.defaultValue = poid;
            } else {
                var purchaseorderSearchObj = search.create({
                    type: "purchaseorder",
                    filters:
                        [
                            ["type", "anyof", "PurchOrd"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["status", "noneof", "PurchOrd:A", "PurchOrd:G", "PurchOrd:H", "PurchOrd:C"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "tranid", label: "PO #" }),
                            search.createColumn({ name: "entity", label: "Vendor Name" }),
                            search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
                            search.createColumn({ name: "billaddress", label: "Bill To" }),
                            search.createColumn({ name: "memo", label: "Memo" }),
                            search.createColumn({ name: "amount", label: "Order Total" })
                        ]
                });
            }
            var counter = 0;
            var searchResultCount = purchaseorderSearchObj.runPaged().count;
            poCount.defaultValue = searchResultCount;
            purchaseorderSearchObj.run().each(function (result) {
                var POID = result.id;
                var date = result.getValue('trandate');
                var poNo = result.getValue('tranid');
                var vendorName = result.getText('entity');
                var subsidiary = result.getText('subsidiary');
                var billTo = result.getValue('billaddress');
                var memo = result.getValue('memo');
                var orderTotal = result.getValue('amount');


                poSublist.setSublistValue({
                    id: 'custpage_sublist_po_num',
                    line: counter,
                    value: poNo
                });
                poSublist.setSublistValue({
                    id: 'custpage_sublist_date',
                    line: counter,
                    value: date
                });
                poSublist.setSublistValue({
                    id: 'custpage_sublist_vendor_name',
                    line: counter,
                    value: vendorName
                });
                poSublist.setSublistValue({
                    id: 'custpage_sublist_subsidiary',
                    line: counter,
                    value: subsidiary
                });
                if (billTo != '' && billTo != null) {
                    poSublist.setSublistValue({
                        id: 'custpage_sublist_bill_to',
                        line: counter,
                        value: billTo
                    });
                }
                if (memo != '' && memo != null) {
                    poSublist.setSublistValue({
                        id: 'custpage_sublist_memo',
                        line: counter,
                        value: memo
                    });
                }
                if (!!orderTotal) {
                    poSublist.setSublistValue({
                        id: 'custpage_sublist_order_total',
                        line: counter,
                        value: orderTotal
                    });
                }
                poSublist.setSublistValue({
                    id: 'custpage_sublist_poid',
                    line: counter,
                    value: POID
                });
                counter++;
                return true;
            });
            poSublist.addMarkAllButtons();
            context.response.writePage(form);
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    return {
        onRequest: onRequest
    }
});
