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
        const beforeLoad = (scriptContext) => {
            var title = 'beforeLoad[::]';
            try {
                var rec = scriptContext.newRecord;
                var form = scriptContext.form;
                var field = form.addField({
                    id : 'custpage_abc_text',
                    type : serverWidget.FieldType.TEXT,
                    label : 'Text'
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return { beforeLoad }

    });
