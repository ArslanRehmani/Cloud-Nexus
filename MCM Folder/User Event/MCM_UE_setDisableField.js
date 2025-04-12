/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/ui/serverWidget', 'N/runtime'], function (record, log, serverWidget, runtime) {

    function beforeLoad(context) {
        var title = 'beforeLoad(::)';
        try {
            var rec = context.newRecord;
            var form = context.form;
            var paramRole = runtime.getCurrentScript().getParameter({ name: 'custscript_mcm_role' });
            var array = paramRole.split(',');
            var found = false;

            var customForm = rec.getValue({ fieldId: 'customform' });//205
            var customFormInt = parseInt(customForm);
            var userRole = runtime.getCurrentUser();
            var role = JSON.stringify(userRole.role);
            for (var i = 0; i < array.length; i++) {
                var roles = array[i];
                if (roles == role) {
                    found = true;
                }
            }
            log.debug('found', found);
            if (found == true && customFormInt == 205) {
                var sublistObj = form.getSublist({
                    id: 'item'
                });
                var field1 = sublistObj.getField({ id: 'price' });
                field1.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.DISABLED
                });
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }

    return {
        beforeLoad: beforeLoad
    }
});
