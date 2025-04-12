/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/task', 'N/ui/serverWidget', 'N/search', 'N/redirect'], function (log, task, serverWidget, search, redirect) {

    function onRequest(context) {
        try {

            var response = context.response;

            var request = context.request;

            var recId = request.parameters.record_id;

            log.debug('Record ID', recId);

            if (request.method == 'GET') {

                var form = serverWidget.createForm({
                    title: 'Bulk Sales Order Processing'
                });

                form.addSubmitButton({
                    label: 'Process'
                });

                if (recId) {

                    var projectArray = getSubProjects(recId);

                    if (projectArray.length > 0) {

                        addSubprojectToForm(form, projectArray, recId);
                    }
                }


                response.writePage(form);

            }
            else if (request.method == 'POST') {
                var selectedLines = getSelectedLines(request);

                log.debug('Selected Lines', selectedLines);

                var projectId = request.parameters.custpage_project

                log.debug('Post Rec ID', projectId);

                if (selectedLines.length > 0) {

                    var mrTask = task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_bulk_so_processing_mr',
                        deploymentId: 'customdeploy_bulk_so_processing_mr',
                        params: {
                            custscript_line_data: JSON.stringify(selectedLines),
                            custscript_master_project_id: projectId
                        }
                    });

                    var mrTaskId = mrTask.submit();

                    redirect.toRecord({
                        type: 'job',
                        id: projectId,
                        isEditMode: false
                    });
                }
            }

        } catch (e) {

            log.error('onRequest Exception', e.message);
            context.response.write('Error executing Suitelet: ' + e.message);
        }
    }

    function getSubProjects(masterProjectId) {
        try {

            var projectArray = [];

            var subProjectSearch = search.create({
                type: "job",
                filters:
                    [
                        ["parent", "anyof", masterProjectId],
                        "AND",
                        ["internalidnumber", "notequalto", masterProjectId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({ name: "entityid", label: "Name" }),
                        search.createColumn({ name: "custentity_sub_customer", label: "Sub Customer" })
                    ]
            });

            var searchResult = subProjectSearch.run().getRange({ start: 0, end: 1000 });

            if (searchResult.length > 0) {

                for (var i = 0; i < searchResult.length; i++) {

                    var projectId = searchResult[i].getValue({ name: "internalid" });

                    var projectName = searchResult[i].getValue({ name: "entityid" });

                    var subCustomer = searchResult[i].getText({ name: "custentity_sub_customer" });

                    projectArray.push({ projectId, projectName, subCustomer });

                }
            }


        }
        catch (e) {
            log.error('getSubProjects Exception', e.message);
        }

        return projectArray || [];
    }

    function addSubprojectToForm(form, projectArray, projectId) {
        try {

            var projectFld = form.addField({
                id: 'custpage_project',
                type: serverWidget.FieldType.SELECT,
                label: 'Master Project',
                source: 'job'
            });

            projectFld.defaultValue = projectId;

            projectFld.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

            var soFld = form.addField({
                id: 'custpage_latest_so',
                type: serverWidget.FieldType.SELECT,
                label: 'Sales Order to be Copied',
                source: 'salesorder'
            });

            soFld.defaultValue = getSalesOrder(projectId);

            soFld.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

            var sublist = form.addSublist({
                id: 'custpage_projects',
                type: serverWidget.SublistType.LIST,
                label: 'Sub-Projects'
            });

            sublist.addMarkAllButtons();

            sublist.addField({
                id: 'custpage_select',
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
            });

            sublist.addField({
                id: 'custpage_project_id',
                label: 'Project ID',
                type: serverWidget.FieldType.TEXT
            });

            var projectNameFld = sublist.addField({
                id: 'custpage_proj_id',
                label: 'Project Name',
                type: serverWidget.FieldType.SELECT,
                source: 'job'
            });

            projectNameFld.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });

            sublist.addField({
                id: 'custpage_customer',
                label: 'Customer',
                type: serverWidget.FieldType.TEXT,
            });


            for (var i = 0; i < projectArray.length; i++) {

                sublist.setSublistValue({
                    id: 'custpage_project_id',
                    line: i,
                    value: projectArray[i].projectId || ''
                });

                sublist.setSublistValue({
                    id: 'custpage_proj_id',
                    line: i,
                    value: projectArray[i].projectId || ''
                });

                sublist.setSublistValue({
                    id: 'custpage_customer',
                    line: i,
                    value: projectArray[i].subCustomer || ''
                });

            }



        }
        catch (e) {
            log.error('addSubprojectToForm Exception', e.message);
        }
    }

    function getSelectedLines(request) {

        var selectedLines = [];

        try {

            var totalLines = request.getLineCount({ group: 'custpage_projects' });

            for (var i = 0; i < totalLines; i++) {

                var isSelected = request.getSublistValue({
                    group: 'custpage_projects',
                    name: 'custpage_select',
                    line: i
                });

                if (isSelected == true || isSelected == 'T') {

                    var projId = request.getSublistValue({
                        group: 'custpage_projects',
                        name: 'custpage_project_id',
                        line: i
                    });

                    selectedLines.push({ projId });


                }
            }

            return selectedLines;

        }
        catch (e) {
            log.error('getSelectedLines Exception', e.message);
        }
    }

    function getSalesOrder(masterProjectId) {
        try {

            var salesOrderSearch = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["job.parent", "anyof", masterProjectId],
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            summary: "MAX"
                        }),
                        search.createColumn({
                            name: "tranid",
                            summary: "GROUP"
                        })
                    ]
            });

            var searchResult = salesOrderSearch.run().getRange({ start: 0, end: 1 });

            if (searchResult.length > 0) {

                var soId = searchResult[0].getValue({
                    name: "internalid",
                    summary: "MAX"
                });

                if (soId) return soId;
            }
        }
        catch (e) {
            log.error('getSalesOrder Exception', e.message);
        }
    }

    return {
        onRequest: onRequest
    };
});
