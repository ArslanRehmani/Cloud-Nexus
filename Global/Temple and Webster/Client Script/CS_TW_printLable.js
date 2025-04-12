/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/url', 'N/currentRecord', 'N/ui/dialog', 'N/search'], function (log, url, currentRecord, dialog, search) {

    function pageInit(context) {
        var title = 'pageInit[::]';
        try {
            console.log('Test', 'Test123');
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function twprintlable() {
        var title = 'twprintlable[::]';
        try {

            var rec = currentRecord.get();

            var referenceSOID = search.lookupFields({
                type: rec.type,
                id: rec.id,
                columns: ['custbody1']
            }).custbody1;

            console.log('referenceSOID', referenceSOID);

            // var referenceSOID = 'TW49239726';


            if (referenceSOID) {
                dialog.confirm({
                    title: '<span>Alert Message</span>',
                    message: '<b>This label will only be displayed once. Please make sure you can download it. Click OK to proceed or Cancel if you"re not ready to print the label yet.</b>'
                }).then(function (option) {
                    if (option) {
                        

                        var scriptURL = url.resolveScript({
                            scriptId: 'customscript_sl_tw_print_lable',
                            deploymentId: 'customdeploy_sl_tw_print_lable',
                            params: {
                                'SOID': rec.id
                            },
                            returnExternalUrl: false
                        });

                        newWindow = window.open(scriptURL);
                        return true;
                    }
                }).catch(function (e) {
                    throw new Error('ERROR', e.message);
                });

            } else {

                alert('T&W Order Id is Empty');

            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        pageInit: pageInit,
        twprintlable: twprintlable
    }
});
