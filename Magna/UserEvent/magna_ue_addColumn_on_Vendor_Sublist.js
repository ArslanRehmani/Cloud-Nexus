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
 * @param{serverWidget} serverWidget
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
                if (scriptContext.type == scriptContext.UserEventType.CREATE ||
                    scriptContext.type == scriptContext.UserEventType.EDIT ||
                    scriptContext.type == scriptContext.UserEventType.VIEW) {
                    var rec = scriptContext.newRecord;
                    var form = scriptContext.form;
                    var vendorSublist = form.getSublist({
                        id: 'itemvendor'
                    });
                    var field = vendorSublist.addField({
                        id: 'custpage_magna_vendor_comment',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Comment'
                    });
                    field.defaultValue = 'Insert Text Here.';
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

        }

        return { beforeLoad, beforeSubmit, afterSubmit }

    });
