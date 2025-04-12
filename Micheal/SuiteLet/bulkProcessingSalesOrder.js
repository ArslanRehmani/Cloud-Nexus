/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/ui/serverWidget', 'N/search', 'N/record', 'N/redirect', 'N/runtime'], function (log, serverWidget, search, record, redirect, runtime) {

    function onRequest(context) {
        try {
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({ title: 'Sales Orders' });
                getHandler(form);
                context.response.writePage(form);
            } else if (context.request.method === 'POST') {
                postHandler(context);
            }
        } catch (e) {
            log.error({ title: 'Error', details: e });
            context.response.write('An error occurred. Please check the logs for details.');
        }
    }

    function getHandler(form) {
        try {
            //Get Current User ID
            var userId = runtime.getCurrentUser().id;

            //Attach Client Script
            form.clientScriptModulePath = './bulkProcessingSoClient.js';

            var sublist = form.addSublist({
                id: 'custpage_salesorder_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Sales Orders'
            });

            sublist.addMarkAllButtons();

            sublist.addField({
                id: 'custpage_checkbox',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Select'
            });

            sublist.addField({
                id: 'custpage_tran_date',
                type: serverWidget.FieldType.TEXT,
                label: 'Date'
            });

            sublist.addField({
                id: 'custpage_salesorder_id',
                type: serverWidget.FieldType.TEXT,
                label: 'Sales Order ID'
            });

            sublist.addField({
                id: 'custpage_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'Document Number'
            });

            sublist.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.TEXT,
                label: 'Customer'
            });

            sublist.addField({
                id: 'custpage_amount',
                type: serverWidget.FieldType.TEXT,
                label: 'Amount'
            });

            sublist.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.TEXT,
                label: 'Status'
            });

            var approvalList = sublist.addField({
                id: 'custpage_accept_reject',
                type: serverWidget.FieldType.SELECT,
                label: 'Approve/Reject'
            });

            approvalList.addSelectOption({ value: '', text: '' });
            approvalList.addSelectOption({ value: 'accept', text: 'Approve' });
            approvalList.addSelectOption({ value: 'reject', text: 'Reject' });
            approvalList.defaultValue = 'accept';

            var rejectionReasonFld = sublist.addField({
                id: 'custpage_rejection_reason',
                type: serverWidget.FieldType.TEXT,
                label: 'Rejection Reason'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
            });

            rejectionReasonFld.updateDisplayType({ displayType: serverWidget.FieldDisplayType.DISABLED });

            form.addSubmitButton({
                label: 'Submit'
            });

            var salesOrderData = getSalesOrderData(userId);

            populateSublistData(sublist, salesOrderData);

        } catch (e) {
            log.error({ title: 'getHandler Exception', details: e.message });
        }
    }

    function getSalesOrderData(userId) {
        try {
            var salesOrderSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: [
                    ["type", "anyof", "SalesOrd"],
                    "AND",
                    ["status", "anyof", "SalesOrd:A"],
                    "AND",
                    ["custbody6", "anyof", userId],
                    "AND",
                    ["mainline", "is", "T"]
                ],
                columns: ["trandate", "internalid", "tranid", "entity", "amount", "statusref"]
            });

            var searchResults = salesOrderSearch.run().getRange({ start: 0, end: 1000 });
            var salesOrderDataArray = [];

            for (var i = 0; i < searchResults.length; i++) {
                var salesOrderObj = {};
                var internalId = searchResults[i].getValue({ name: 'internalid' }) || '';
                salesOrderObj.internalId = internalId;
                var tranDate = searchResults[i].getValue({ name: 'trandate' }) || '';
                salesOrderObj.tranDate = tranDate;
                var tranId = searchResults[i].getValue({ name: 'tranid' }) || '';
                salesOrderObj.tranId = tranId;
                var customer = searchResults[i].getText({ name: 'entity' }) || '';
                salesOrderObj.customer = customer;
                var amount = searchResults[i].getValue({ name: 'amount' }) || '';
                salesOrderObj.amount = amount;
                var status = searchResults[i].getText({ name: 'statusref' }) || '';
                salesOrderObj.status = status;
                salesOrderDataArray.push(salesOrderObj);
            }

            return salesOrderDataArray;
        } catch (e) {
            log.error({ title: 'getSalesOrderData Exception', details: e.message });
            return [];
        }
    }

    function populateSublistData(sublist, salesOrderData) {
        try {
            for (var i = 0; i < salesOrderData.length; i++) {
                sublist.setSublistValue({
                    id: 'custpage_tran_date',
                    line: i,
                    value: salesOrderData[i].tranDate
                });

                sublist.setSublistValue({
                    id: 'custpage_salesorder_id',
                    line: i,
                    value: salesOrderData[i].internalId
                });

                sublist.setSublistValue({
                    id: 'custpage_tranid',
                    line: i,
                    value: salesOrderData[i].tranId
                });

                sublist.setSublistValue({
                    id: 'custpage_customer',
                    line: i,
                    value: salesOrderData[i].customer
                });

                sublist.setSublistValue({
                    id: 'custpage_amount',
                    line: i,
                    value: salesOrderData[i].amount
                });

                sublist.setSublistValue({
                    id: 'custpage_status',
                    line: i,
                    value: salesOrderData[i].status
                });
            }
        } catch (e) {
            log.error({ title: 'populateSublistData Exception', details: e.message });
        }
    }

    function postHandler(context) {
        try {
            var selectedLines = getSelectedLines(context);

            for (var i = 0; i < selectedLines.length; i++) {
                var selectedLine = selectedLines[i];
                var internalId = selectedLine.salesOrderId;
                var approvalValue = selectedLine.approvalValue;
                var rejectionReason = selectedLine.rejectionReason;

                if (!!internalId) {
                    var salesOrder = record.load({
                        type: record.Type.SALES_ORDER,
                        id: internalId
                    });

                    if (approvalValue === 'accept') {
                        salesOrder.setValue({
                            fieldId: 'orderstatus',
                            value: 'B'
                        });
                    } else if (approvalValue === 'reject') {
                        salesOrder.setValue({
                            fieldId: 'custbody7',
                            value: rejectionReason
                        });
                    }

                    salesOrder.save({ ignoreMandatoryFields: true });
                }
            }

            redirect.toSuitelet({
                scriptId: 'customscript873',
                deploymentId: 'customdeploy1'
            });
        } catch (e) {
            log.error({ title: 'postHandler Exception', details: e.message });
        }
    }

    function getSelectedLines(context) {
        try {
            var lineCount = context.request.getLineCount('custpage_salesorder_sublist');
            var soApprovalArray = [];

            for (var i = 0; i < lineCount; i++) {
                var processSalesOrder = context.request.getSublistValue({
                    group: 'custpage_salesorder_sublist',
                    name: 'custpage_checkbox',
                    line: i
                });

                if (processSalesOrder == true || processSalesOrder == 'T') {
                    var salesOrderId = context.request.getSublistValue({
                        group: 'custpage_salesorder_sublist',
                        name: 'custpage_salesorder_id',
                        line: i
                    });

                    var approvalValue = context.request.getSublistValue({
                        group: 'custpage_salesorder_sublist',
                        name: 'custpage_accept_reject',
                        line: i
                    });
                    var rejectionReason = context.request.getSublistValue({
                        group: 'custpage_salesorder_sublist',
                        name: 'custpage_rejection_reason',
                        line: i
                    });

                    soApprovalArray.push({
                        salesOrderId, approvalValue, rejectionReason
                    });
                }
            }

            return soApprovalArray;
        } catch (e) {
            log.error('getSelectedLines Exception', e.message);
            return [];
        }
    }

    return {
        onRequest: onRequest
    };
});
