/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/url', 'N/log', 'N/currentRecord'], function (url, log, currentRecord) {

    function pageInit(context) {
        console.log("Page TEST");
    }

    function printQuote() {
        var title = 'printQuote[::]';
        try {
            console.log("TEST");
            var currentRec = currentRecord.get();
            var scriptURL = url.resolveScript({
                scriptId: 'customscript_sl_print_quote',
                deploymentId: 'customdeploy_sl_print_quote',
                params: {
                    id: currentRec.id,
                    rectype: currentRec.type
                },
                returnExternalUrl: false
            });
            newWindow = window.open(scriptURL);
        } catch (e) {
            console.log(title + e.name, e.message);
        }
    }

    return {
        pageInit: pageInit,
        printQuote: printQuote
    }
});
