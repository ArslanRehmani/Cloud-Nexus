/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (log, record, runtime, search, serverWidget) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            var title = 'beforeLoad[::]';
            try {
                var hideFld = scriptContext.form.addField({
                    id:'custpage_hide_buttons',
                    label:'not shown - hidden',
                    type: serverWidget.FieldType.INLINEHTML
                });                
                var scr = "";
                scr += 'jQuery("#recmachcustrecord41_existingrecmachcustrecord41_fs_lbl").hide();';
                scr += 'jQuery("#recmachcustrecord41_existingrecmachcustrecord41_fs").hide();';
                scr += 'jQuery("#tdbody_attach").hide();';
                hideFld.defaultValue = "<script>jQuery(function($){require([], function(){" + scr + ";})})</script>"
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }


        return { beforeLoad }

    });
