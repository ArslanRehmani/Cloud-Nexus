/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/log', 'N/url', 'N/record', 'N/currentRecord', 'N/search'], function (log, url, record, currentRecord, search) {

    function pageInit(context) {

    }

    function createNewWorkOrder() {
        try {
            var internalId = currentRecord.get().id;
            var currRec = record.load({
                type: 'job',
                id: internalId
            });
            var projectResource = getProjectResource(internalId);

            var projectManager = currRec.getValue('projectmanager');
            var address = currRec.getValue('custentity24');
            
            var salesOrderURL = url.resolveRecord({
                recordType: record.Type.PURCHASE_ORDER,
                isEditMode: true,
                params: {
                    entity: projectResource,
                    cf: 238,
                    'record.custbody6': projectManager,
                    'record.custbody10': internalId,
                    'record.custbody9': address
                }
            });

            window.open(salesOrderURL, '_blank');
            //   window.location.href = purchaseOrderUrl + '&cf=238&entity=' + jobResourceValue;

        } catch (e) {
            log.error('Error: ', e.message);
        }
    }

    function getProjectResource(projectId) {
        try {
            var resource = '';

            var resourceAllocationSearch = search.create({
                type: "resourceallocation",
                filters:
                    [
                        ["project", "anyof", projectId]
                    ],
                columns:
                    [
                        "resource",
                        "customer",
                        "company"
                    ]
            });

            var searchResult = resourceAllocationSearch.run().getRange({ start: 0, end: 1 });

            if (searchResult.length > 0) {

                resource = searchResult[0].getValue({
                    name: "resource",
                });
            }

        }
        catch (e) {
            log.error('getProjectResource Exception', e.message);
        }
        return resource || '';
    }

    return {
        pageInit: pageInit,
        createNewWorkOrder: createNewWorkOrder
    };
});
