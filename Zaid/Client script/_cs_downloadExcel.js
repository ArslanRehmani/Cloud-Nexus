/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/log', 'N/url'],

    function (search, log, url) {

        function pageInit(scriptContext) {
            var title = 'pageInit[::]';
            try {
                log.debug({
                    title: 'Working',
                    details: 'YES'
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function downloadExcel(recId) {
            var title = 'downloadExcel[::]';
            try {
                console.log('printxlsx ->', recId.toString());
                
                var scriptURL = url.resolveScript({
                    scriptId: 'customscript_sl_download_excel_formate',
                    deploymentId: 'customdeploy_sl_download_excel_formate',
                    params: {
                        id: recId
                    },
                    returnExternalUrl: false
                });
                newWindow = window.open(scriptURL);
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return {
            pageInit: pageInit,
            downloadExcel: downloadExcel
        };

    });
