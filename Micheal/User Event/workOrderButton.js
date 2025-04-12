/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/search'], function (serverWidget, search) {
    function beforeLoad(context) {
        try {
            var form = context.form;
            var isMasterPrject = isMasterProject(context.newRecord.id);
            if (isMasterPrject == false) {
                form.clientScriptModulePath = './workOrderClient.js';
                var purchaseOrderSublist = form.getSublist({
                    id: 'custpage_p2p_purchaseorder_list'
                });

                purchaseOrderSublist.addButton({
                    id: 'custpage_new_work_order',
                    label: 'Create Work Order',
                    functionName: 'createNewWorkOrder'
                });
            }

        } catch (e) {
            log.error('Error', e.message);
        }
    }
    function isMasterProject(projectId) {

        var isMasterProject = false;

        try {

            var jobSearchObj = search.create({
                type: "job",
                filters:
                    [
                        ["parent", "anyof", projectId],
                        "AND",
                        ["internalidnumber", "notequalto", projectId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entityid", label: "Name" }),
                    ]
            });
            var searchResultCount = jobSearchObj.runPaged().count;

            jobSearchObj.run().each(function (result) {

                isMasterProject = true;

                return true;
            });

        } catch (e) {

            log.error('isMasterProject Exception', e.message);
        }
        return isMasterProject;
    }

    return {
        beforeLoad: beforeLoad
    };
});
