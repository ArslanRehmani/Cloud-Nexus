/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log'], function (log) {

    function pageInit(context) {
        var title = 'pageInit[::]';
        try {
            var url = window.location.href;

            var parent = getParentProjectFromURL(url);
            var rec = context.currentRecord;
            var cf = rec.getValue({ fieldId: 'customform' });
            if (rec.id) {
                log.debug({
                    title: 'ID Exits',
                    details: 'YES'
                });
                return true;
            } else if (cf != 338) {
                if (parent != 0) {
                    log.debug({
                        title: 'CF = 338',
                        details: 'YES'
                    });
                    rec.setValue({ fieldId: 'customform', value: 338 }); //MTP Site Project Form
                }
            }else{
                log.debug({
                    title: 'Edit & CF already = 338',
                    details: 'YES'
                });
                rec.setValue({ fieldId: 'custentity_is_sub_project', value: true });
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function saveRecord(context) {

    }

    function validateField(context) {

    }

    function fieldChanged(context) {

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
    function getParentProjectFromURL(url) {
        var title = 'getParentProjectFromURL[::]';
        try {
            // Decode the URL to properly handle spaces and special characters
            var decodedURL = decodeURIComponent(url);

            // Create a URL object
            var url = new URL(decodedURL);

            // Create a URLSearchParams object
            var params = new URLSearchParams(url.search);

            // Extract the 'arr' parameter (note the space in the original URL parameter name)
            var data = params.get('parent');
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return data || 0;
    }

    return {
        pageInit: pageInit
        // saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
