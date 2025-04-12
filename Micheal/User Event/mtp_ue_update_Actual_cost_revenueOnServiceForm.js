/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (log, record, runtime, search) => {
        const afterSubmit = (scriptContext) => {
            var title = 'afterSubmit[::]';
            try {
                var projectId = '';
                var serviceForm = '';
                var totalActualCost = 0;
                var rec = scriptContext.newRecord;
                // if (rec.type == 'invoice') {

                projectId = rec.getValue({ fieldId: 'job' });
                serviceForm = rec.getValue({ fieldId: 'custbody_service_mtp_callfield' });

                // }

                // if (projectId) {
                if (serviceForm) {


                    var data = projectActualCostAndRevenueFun(serviceForm);
                    log.debug({
                        title: 'data',
                        details: data
                    });

                    var billActualCost = getBillActualCost(serviceForm);

                    log.debug('billActualCost', billActualCost);

                    if (data && data.length > 0) {

                        //Update Actual Cost & Actual Revenue Field on Project 

                        totalActualCost = parseFloat(billActualCost) + parseFloat(data[0].actualCost);

                        record.submitFields({
                            type: 'customrecord433',
                            id: parseInt(serviceForm),
                            values: {
                                'custrecord_service_projectactualcost': totalActualCost,
                                'custrecord_service_projectactualrevenu': data[0].actualRevenue
                            }
                        });

                        //Update Master Project
                        updateMasterProjectActualCostRev(projectId, billActualCost)
                        // wo service dekhao kis ki project id = project id amount sum 
                    }

                }

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function projectActualCostAndRevenueFun(id) {
            var title = 'projectActualCostAndRevenueFun[::]';
            try {
                var obj;
                var array = [];
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            // "AND",
                            // ["custcol3", "is", "T"],
                            "AND",
                            ["createdfrom.type", "anyof", "SalesOrd"],
                            "AND",
                            ["custbody_service_mtp_callfield", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Actual Revenue"
                            }),
                            /*   search.createColumn({
                                   name: "averagecost",
                                   join: "item",
                                   summary: "SUM",
                                   label: "Actual Cost"
                               })
                           */
                            search.createColumn({
                                name: "custcol_gfl_avg_cost",
                                summary: "SUM"
                            })
                        ]
                });
                invoiceSearchObj.run().each(function (result) {
                    obj = {};
                    obj.actualRevenue = result.getValue({ name: 'amount', summary: 'SUM' });
                    obj.actualCost = result.getValue({ name: 'custcol_gfl_avg_cost', summary: 'SUM' });
                    array.push(obj);
                    return true;
                });
                return array || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return [{ "actualRevenue": "0.00", "actualCost": "0.00" }];
        }

        function updateMasterProjectActualCostRev(projectId, billActualCost) {
            try {
                if (projectId) {

                    var data = MTPServiceActualCostActualRevenueSearch(projectId);

                    log.debug({
                        title: 'data====',
                        details: data
                    });
                    if (data && data.length > 0) {
                        //Update Actual Cost & Actual Revenue Field on Project 
                        var totalActualCost = parseFloat(billActualCost) + parseFloat(data[0].actualCostService);

                        record.submitFields({
                            type: 'job',
                            id: projectId,
                            values: {
                                'custentity31': totalActualCost,
                                // 'custentity31': billActualCost,
                                // 'custentity30': billActualRevenew
                                'custentity30': parseFloat(data[0].actualRevenueService)
                            }
                        });
                    }
                }

            }
            catch (e) {
                log.error('updateMasterProjectActualCostRev Exception', e.message);
            }
        }
        const checkIfProject = (id) => {

            try {
                var isProject = false;
                var recordTypeSearch = search.create({
                    type: "job",
                    filters:
                        [
                            ["internalidnumber", "equalto", id]
                        ],
                    columns:
                        [
                            "internalid"
                        ]
                });

                var searchResult = recordTypeSearch.run().getRange({ start: 0, end: 1 });


                if (searchResult.length > 0) {

                    isProject = true;
                }

            }
            catch (e) {
                log.error('checkIfProject Exception', e.message);
            }
            return isProject;
        }

        function getBillActualCost(serviceForm) {
            try {
                var billActualCost = 0;

                var vendorBillSearch = search.create({
                    type: "vendorbill",
                    filters:
                        [
                            ["type", "anyof", "VendBill"],
                            "AND",
                            ["item", "noneof", "@NONE@"],
                            "AND",
                            ["custbody_service_mtp_callfield", "anyof", serviceForm]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "item",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "amount",
                                summary: "SUM"
                            })
                        ]
                });

                var searchResult = vendorBillSearch.run().getRange({ start: 0, end: 1000 });

                for (var i = 0; i < searchResult.length; i++) {

                    var itemId = searchResult[i].getValue({
                        name: "item",
                        summary: "GROUP"
                    });

                    var amount = searchResult[i].getValue({
                        name: "amount",
                        summary: "SUM"
                    });

                    billActualCost += parseFloat(amount);
                }

            }
            catch (e) {
                log.error('getBillActualCost Exception', e.message);
            }

            return billActualCost.toFixed(2);
        }
        function MTPServiceActualCostActualRevenueSearch(id) {
            var title = 'MTPServiceActualCostActualRevenueSearch[::]';
            try {
                var obj;
                var array = [];
                var customrecord433SearchObj = search.create({
                    type: "customrecord433",
                    filters:
                        [
                            ["custrecord21", "anyof", id]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "custrecord_service_projectactualrevenu",
                                summary: "SUM",
                                label: "Project Actual Revenue"
                            }),
                            search.createColumn({
                                name: "custrecord_service_projectactualcost",
                                summary: "SUM",
                                label: "Project Actual Cost"
                            })
                        ]
                });
                customrecord433SearchObj.run().each(function (result) {
                    obj = {};
                    obj.actualRevenueService = result.getValue({ name: 'custrecord_service_projectactualrevenu', summary: 'SUM' });
                    obj.actualCostService = result.getValue({ name: 'custrecord_service_projectactualcost', summary: 'SUM' });
                    array.push(obj);
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }
        return { afterSubmit }

    });
