/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (log, record, runtime, search) => {

        const beforeLoad = (scriptContext) => {
            var title = 'beforeLoad[::]';
            var currentRecord = scriptContext.newRecord;
            var recid = currentRecord.id;
            try {
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                    addbutton(scriptContext, recid);
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function addbutton(scriptContext, recid) {
            var title = 'addbutton[::]';
            try {
                log.debug('recID userEevnt', recid);
                var form = scriptContext.form;
                form.clientScriptFileId = '451669';
                form.addButton({ id: "custpage_downloadexcel", label: "PO SO report", functionName: "downloadExcel(' " + recid + "')" });
            }
            catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return { beforeLoad}

    });
