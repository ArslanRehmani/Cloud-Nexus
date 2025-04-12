/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/url', 'N/ui/dialog', 'N/https', 'N/search', 'N/ui/message'], function (https, url, dialog, https, search, message) {
    function pageInit(context) {
    }
    function bulkSalesOrder(recid) {

        try {
            var isProcessing = isDeploymentRunning('customscript_bulk_so_processing_mr');

            if (isProcessing == true) {

                alert('System is already processing the request. Please try it after some time.');

                location.reload();

                return false;
            }

            var salesOrderId = getSalesOrder(recid);

            if (!salesOrderId) {

                alert('Please create one Sales Order for any linked Subproject to process.');

                return true;
            }

            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_bulk_so_processing',
                deploymentId: 'customdeploy_bulk_so_processing',
                params: { record_id: recid }
            });

            let response = https.get({
                url: suiteletUrl
            });

            window.location.href = ('https://4672998-sb1.app.netsuite.com' + suiteletUrl);


           // let nsMessage = showMesssage();

        } catch (e) {
            log.error('bulkSalesOrder Error:', e);
        }

    }

    function getSalesOrder(masterProjectId) {
        try {
            log.debug({
                title: 'masterProjectId======',
                details: masterProjectId
            });
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
                log.debug({
                    title: 'soId======',
                    details: soId
                });

                if (soId) return soId;
            }
        }
        catch (e) {
            log.error('getSalesOrder Exception', e.message);
        }
    }

    function isDeploymentRunning(scriptId) {
        try {

            var isRunning = false;

            var scheduledscriptinstanceSearchObj = search.create({
                type: "scheduledscriptinstance",
                filters:
                    [
                        ["mapreducestage", "noneof", "@NONE@"],
                        "AND",
                        ["script.scriptid", "is", scriptId],
                        "AND",
                        ["percentcomplete", "lessthan", "100"],
                        "AND",
                        ["status", "noneof", "CANCELED", "FAILED"]
                    ],
                columns:
                    [

                        search.createColumn({ name: "mapreducestage", label: "Map/Reduce Stage" }),
                        search.createColumn({ name: "percentcomplete", label: "Percent Complete" }),
                        search.createColumn({ name: "queueposition", label: "Queue Position" })
                    ]
            });
            var searchResultCount = scheduledscriptinstanceSearchObj.runPaged().count;
            if (searchResultCount > 0) {

                //  alert('System is already processing the request. Please try it after some time.');

                isRunning = true;

            }

        }
        catch (e) {

            log.error('isProcessing Exception', e.message);
        }

        return isRunning;
    }

    function showMesssage() {
        try {

            let msg = message.create({
                type: message.Type.INFORMATION,
                title: 'Processing',
                message: 'The records are being Processed.'
            });
            msg.show();

            setTimeout(function () {

                msg.hide();

            }, 5000);


            return msg;
        }
        catch (e) {
            console.log('showMesssage Exception', e.message);
        }
    }

    function importTemplate(projectId) {
        try {
            /*
            var isProcessing = isDeploymentRunning('customscript_bulk_so_processing_mr');

            if (isProcessing == true) {

                alert('System is already processing the request. Please try it after some time.');

                location.reload();

                return false;
            }
            */

            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_mtp_import_project_task_sl',
                deploymentId: 'customdeploy_mtp_import_project_task_sl',
                params: { record_id: projectId }
            });

            let response = https.get({
                url: suiteletUrl
            });

            window.location.replace('https://4672998-sb1.app.netsuite.com' + suiteletUrl + '');
        }
        catch (e) {
            log.error('importTemplate Exception', e.message);
        }
    }
    return {
        pageInit: pageInit,
        bulkSalesOrder: bulkSalesOrder,
        importTemplate: importTemplate
    };
});
