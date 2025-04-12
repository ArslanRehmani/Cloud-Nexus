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
            try {
                var currentRecord = scriptContext.newRecord;
                var recid = currentRecord.id;
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                    var searchResult = parentSearh(recid);
                    log.debug({
                        title: 'searchResult',
                        details: searchResult
                    });
                    if (searchResult != 0) {
                        addbutton(scriptContext, recid);
                    }
                    addTemplateButton(scriptContext, recid);
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
                // form.clientScriptFileId = '20134875';
                form.clientScriptModulePath = './_bulk_so_processing_cs.js';
                form.addButton({ id: "custpage_bulksalesorder", label: "Bulk SO", functionName: "bulkSalesOrder('" + recid + "')" });
            }
            catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function parentSearh(id) {
            var title = 'parentSearh[::]';
            try {
                var projectId = 0;
                var jobSearchObj = search.create({
                    type: "job",
                    filters:
                        [
                            ["parent", "anyof", id],
                            "AND",
                            ["internalidnumber", "notequalto", id]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "entityid", label: "Name" }),
                        ]
                });
                var searchResultCount = jobSearchObj.runPaged().count;
                jobSearchObj.run().each(function (result) {
                    projectId = result.id;
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return projectId || 0;
        }

        function addTemplateButton(context, recid) {
            try {
                var form = context.form;

                form.clientScriptModulePath = './_bulk_so_processing_cs.js';

                form.addButton({ id: "custpage_importtemplate", label: "Import Template", functionName: "importTemplate('" + recid + "')" });

            }
            catch (e) {
                log.error('addTemplateButton Exception', e.message);
            }
        }
        return { beforeLoad }

    });
