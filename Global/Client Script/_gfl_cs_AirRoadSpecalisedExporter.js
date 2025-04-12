/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/url', 'N/currentRecord','N/ui/dialog', 'N/ui/message'],

    function (log, url, currentRecord, dialog, message) {

        function pageInit(scriptContext) {
            var title = 'pageInit[::]';
            try {
                // window.onbeforeunload = null;

                console.log('TEST');

                var myMsg = message.create({
                    title: "Alert",
                    message: "Press 'Download' while leaving batch number empty to download and ship this entire list",
                    type: message.Type.INFORMATION
                });

                myMsg.show({
                    duration: 5000 // will disappear after 5s
                });

            } catch (e) {
                console.log(title + e.name, e.message);
            }
        }

        function fieldChanged(scriptContext) {
            var title = 'fieldChanged[::]';
            try {
                var rec = currentRecord.get();
                if (scriptContext.fieldId == 'custpage_shippingbatch') {
                    var data = rec.getValue({ fieldId: 'custpage_shippingbatch' });
                    window.location.href = 'https://1117015.app.netsuite.com/app/site/hosting/scriptlet.nl?script=7226&deploy=1&compid=1117015&whence=&shippingBatch=' + data + '';
                }
            } catch (e) {
                console.log(title + e.name, e.message);
            }
        }

        function postSourcing(scriptContext) {

        }

        function sublistChanged(scriptContext) {

        }

        function lineInit(scriptContext) {

        }

        function validateField(scriptContext) {

        }

        function validateLine(scriptContext) {

        }

        function validateInsert(scriptContext) {

        }

        function validateDelete(scriptContext) {

        }

        function saveRecord(scriptContext) {

        }
        function downloadSaveSearchData() {
            var title = 'downloadSaveSearchData[::]';
            try {

                var rec = currentRecord.get();

                var data = rec.getValue({ fieldId: 'custpage_shippingbatch' });

                if (data) {

                    var scriptURL = url.resolveScript({
                        scriptId: 'customscript_sl_downlodairroadspecalised',
                        deploymentId: 'customdeploy_sl_downlodairroadspecalised',
                        params: {
                            'data': data
                        },
                        returnExternalUrl: false
                    });

                    newWindow = window.open(scriptURL);

                } else {

                    alert('Please enter wave number');

                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            // validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
            // saveRecord: saveRecord
            downloadSaveSearchData: downloadSaveSearchData
        };

    });
