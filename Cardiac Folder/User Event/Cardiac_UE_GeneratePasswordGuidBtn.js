    /**
     *@NApiVersion 2.0
    *@NScriptType UserEventScript
    */
    // eslint-disable-next-line no-undef
    define(['N/log','N/ui/serverWidget','N/sftp'], function (log,serverWidget,sftp) {

        function beforeLoad(context) {
            var title = 'beforeLoad()::';
            try {
                var rec = context.newRecord;
                var form = context.form;
                if(context.type == context.UserEventType.VIEW){

                    form.addButton({
                        id: "custpage_GenerateGUID",
                        label: "Generate GUID",
                        functionName: "generateGUID"
                    });
                    if(context.type == context.UserEventType.VIEW){
                        form.addButton({
                            id: "custpage_sftpConnection",
                            label: "Test Connection",
                            functionName: "sftpConnection"
                        });
                    }
                    form.clientScriptModulePath = 'SuiteScripts/Customization Folder/Client Script/Cardiac_CS_GeneratePasswordGuid.js';
                }
    
            } catch (error) {
                log.error(title + error.name, error.message);
            }

        }
        return {
            beforeLoad: beforeLoad
        };
    });