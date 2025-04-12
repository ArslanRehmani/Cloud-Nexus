
/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */

define(['N/url', 'N/currentRecord'], function (nsUrl, currentRecord) {

    /**
     * Entry point function
     * @param context
     */
    function pageInit(context) {
        console.log('pageInit Work', 'pageWork');
    }
    /**
     * This function calls SL to print a GFL JOb Cards PDF
     * @param recID 
     */
    function printGFLjobCard(redId) {
        var title = 'printGFLjobCard(::)';
        try {
            var currentRec = currentRecord.get();
            var scriptURL = nsUrl.resolveScript({
                scriptId: 'customscript_global_sl_print_job_pdf',
                deploymentId: 'customdeploy_global_sl_print_job_pdf',
                params: {
                    id: redId,
                    rectype: currentRec.type
                },
                returnExternalUrl: false
            });
            newWindow = window.open(scriptURL);
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }


    return {
        pageInit: pageInit,
        printGFLjobCard: printGFLjobCard
    };
});