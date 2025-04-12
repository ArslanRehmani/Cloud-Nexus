/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/url', 'N/currentRecord'], function (log, url, currentRecord) {

    function pageInit(context) {
        var title = 'pageInit[::]';
        try {
            window.onbeforeunload = null;
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function saveRecord(context) {

    }

    function validateField(context) {

    }

    function fieldChanged(scriptContext) {
        var title = 'fieldChanged[::]';
        try {
            var rec = currentRecord.get();
            if (scriptContext.fieldId == 'custpage_amazonorderdate') {
                var data = rec.getText({ fieldId: 'custpage_amazonorderdate' });
                window.location.href = 'https://1117015-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=5475&deploy=1&amazonOrderDate=' + data + '';
            }
            if (scriptContext.fieldId == 'custpage_amazonorderid') {
                var orderId = rec.getText({ fieldId: 'custpage_amazonorderid' });
                window.location.href = 'https://1117015-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=5478&deploy=1&whence=&amazonOrderid=' + orderId + '';
            }
        } catch (e) {
            console.log(title + e.name, e.message);
        }
    }

    function postSourcing(context) {

    }

    function lineInit(context) {

    }

    function validateDelete(context) {

    }

    function validateInsert(context) {

    }

    function validateLine(context) {

    }

    function sublistChanged(context) {

    }

    return {
        pageInit: pageInit,
        // saveRecord: saveRecord,
        // validateField: validateField,
        fieldChanged: fieldChanged
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
