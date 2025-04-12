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

        const afterSubmit = (context) => {
            try {

                var currentRecord = record.load({
                    type: context.newRecord.type,
                    id: context.newRecord.id
                });

                //Update Master Project Costs and Revenues

                var projectActualCostRev = getProjectActualBudget(currentRecord.id);

                updateProjectBudget(currentRecord, projectActualCostRev);

                updateMasterProjectCostRev(currentRecord, projectActualCostRev);

                currentRecord.save({ ignoreMandatoryFields: true });
            } catch (e) {

                log.error('afterSubmit Exception', e.message);
            }
        }

        const updateMasterProjectCostRev = (currentRecord, projectActualCostRev) => {
            try {

                var parent = currentRecord.getValue('parent');

                if (parent) {

                    var isProject = checkIfProject(parent);

                    parent = (isProject == false) ? currentRecord.id : parent;

                    var subProjectSearch = search.create({
                        type: "job",
                        filters:
                            [
                                ["parent", "anyof", parent],
                                "AND",
                                ["internalid", "noneof", parent]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "custentity31",
                                    summary: "SUM"
                                }),
                                search.createColumn({
                                    name: "custentity30",
                                    summary: "SUM"
                                }),
                                search.createColumn({
                                    name: "custentity28",
                                    summary: "SUM"
                                }),
                                search.createColumn({
                                    name: "custentity29",
                                    summary: "SUM"
                                })
                            ]
                    });
                    var searchResult = subProjectSearch.run().getRange({ start: 0, end: 1 });


                    if (searchResult.length > 0) {

                        var estCost = searchResult[0].getValue({
                            name: "custentity28",
                            summary: "SUM"
                        }) || 0;

                        var estRev = searchResult[0].getValue({
                            name: "custentity29",
                            summary: "SUM"
                        }) || 0;

                        if (isProject == true) {
                            var projectRecord = record.load({
                                type: 'job',
                                id: parent
                            });
                        }
                        else {
                            projectRecord = currentRecord;
                        }
                        var projectActualCostRev = getProjectActualBudget(parent);
                        
                        var actualCost = parseFloat(projectActualCostRev.projectActualCost);

                        actualCost = actualCost.toFixed(2);

                        var actualRev = parseFloat(projectActualCostRev.projectActualRev);

                        actualRev = actualRev.toFixed(2);

                        projectRecord.setValue('custentity31', actualCost);

                        projectRecord.setValue('custentity30', actualRev);

                        projectRecord.setValue('custentity28', estCost);

                        projectRecord.setValue('custentity29', estRev);
                        if (isProject == true) {

                            projectRecord.save({ ignoreMandatoryFields: true })
                        }

                    }
                }

            }
            catch (e) {
                log.error('updateMasterProjectCostRev Exception', e.message);
            }
        }

        const getProjectActualBudget = (projectId) => {

            try {

                var projectActualCost = 0;
                var projectActualRev = 0;

                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["custcol3", "is", "T"],
                            "AND",
                            ["createdfrom.type", "anyof", "SalesOrd"],
                            "AND",
                            ["job.parent", "anyof", projectId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                            }),
                            search.createColumn({
                                name: "averagecost",
                                join: "item",
                                summary: "SUM",
                            })
                        ]
                });

                var searchResult = invoiceSearchObj.run().getRange({ start: 0, end: 1 });
                log.debug('searchResult', searchResult);

                if (searchResult.length > 0) {

                    projectActualRev += searchResult[0].getValue({
                        name: "amount",
                        summary: "SUM"
                    }) || 0;
                    projectActualCost += searchResult[0].getValue({
                        name: "averagecost",
                        join: "item",
                        summary: "SUM",
                    }) || 0;

                }


            }
            catch (e) {
                log.error('getMasterProjectActualBudget Exception', e.message);
            }

            return { projectActualCost, projectActualRev };
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

        const updateProjectBudget = (currentRecord, projectActualCostRev) => {
            try {

                var actualCost = parseFloat(projectActualCostRev.projectActualCost);

                actualCost = actualCost.toFixed(2);

                var actualRev = parseFloat(projectActualCostRev.projectActualRev);

                actualRev = actualRev.toFixed(2);

                currentRecord.setValue('custentity31', actualCost);

                currentRecord.setValue('custentity30', actualRev);


            }
            catch (e) {
                log.error('updateProjectBudget Exception', e.message);
            }
        }


        return { afterSubmit }

    });
