/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/search', 'N/currentRecord'], function (log, search, currentRecord) {

    function pageInit(context) {
        var title = 'pageInit(::)';
        try {
            window.onbeforeunload = null;
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }

    function fieldChanged(context) {
        var title = 'fieldChanged(::)';
        try {
            var currentRec = context.currentRecord;
            var fieldId = context.fieldId;
            if (fieldId == 'custpage_vendor') {
                var selectedVendor = currentRec.getValue({
                    fieldId: 'custpage_vendor'
                });
                if(!!selectedVendor){
                    console.log('URL', 'https://256476.app.netsuite.com/app/site/hosting/scriptlet.nl?script=893&deploy=1' + "&poid=" + selectedVendor);
                    location.replace('https://256476.app.netsuite.com/app/site/hosting/scriptlet.nl?script=893&deploy=1' + "&poid=" + selectedVendor);
                }else{
                    console.log('URL', 'https://256476.app.netsuite.com/app/site/hosting/scriptlet.nl?script=893&deploy=1');
                    location.replace('https://256476.app.netsuite.com/app/site/hosting/scriptlet.nl?script=893&deploy=1');
                }
                
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }
    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    }
});
