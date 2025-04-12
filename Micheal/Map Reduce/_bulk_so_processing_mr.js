/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record', 'N/runtime'],
    function (log, search, record, runtime) {

        function getInputData() {
            try {

                var selectedLineData = runtime.getCurrentScript().getParameter({
                    name: 'custscript_line_data'
                });

                log.debug('Selected Lines', selectedLineData);

                var masterProjectId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_master_project_id'
                });

                log.debug('Master Project ID', masterProjectId);

                if (masterProjectId) {

                    var filters = getSubProjectsFilter(selectedLineData);

                    log.debug('Filters', filters);

                    var subProjects = getSubProjects(masterProjectId, filters);


                    return subProjects || [];

                }

            }
            catch (e) {

                log.error('getInputData Exception', e.message);
            }

        }

        function map(context) {
            try {
                var dataObj = {};

                var searchResult = JSON.parse(context.value);
                log.debug('searchResult', searchResult);

                var subProjectId = searchResult.values['internalid'].value || '';

                if (subProjectId) {

                    dataObj.subProjectId = subProjectId;
                }

            }
            catch (e) {

                log.error('map Exception', e.message);
            }

            finally {

                var masterProjectId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_master_project_id'
                });

                if (masterProjectId) {

                    context.write({
                        key: masterProjectId,
                        value: dataObj
                    });

                }
            }
        }

        function reduce(context) {
            try {
                var masterProject = JSON.parse(context.key);
                log.debug('Master Project', masterProject);

                var reduceValues = context.values.map(function (val) {
                    return JSON.parse(val);
                });

                var salesOrderId = getSalesOrder(masterProject);

                if (salesOrderId) {

                    for (var i = 0; i < reduceValues.length; i++) {

                        var subProjectId = reduceValues[i].subProjectId || '';
                        log.debug('subProjectId', subProjectId);

                        if (subProjectId) {

                            var salesOrderRecord = record.copy({
                                type: record.Type.SALES_ORDER,
                                id: salesOrderId,
                            });

                            salesOrderRecord.setValue('job', subProjectId);

                            var id =  salesOrderRecord.save({ignoreMandatoryFields : true });

                            log.debug('Sales Order ID', id);
                        }
                    }
                }
            }
            catch (e) {

                log.error('reduce Exception', e.message);
            }
        }

        function getSalesOrder(masterProjectId) {
            try {

                var salesOrderSearch = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["job.parent", "anyof", masterProjectId],
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "internalid",
                                summary: "MAX"
                            }),
                            search.createColumn({
                                name: "tranid",
                                summary: "GROUP"
                            })
                        ]
                });

                var searchResult = salesOrderSearch.run().getRange({ start: 0, end: 1 });

                if (searchResult.length > 0) {

                    var soId = searchResult[0].getValue({
                        name: "internalid",
                        summary: "MAX"
                    });

                    if (soId) return soId;
                }
            }
            catch (e) {
                log.error('getSalesOrder Exception', e.message);
            }
        }

        function getSubProjects(masterProjectId, filters) {
            try {

                var subProjectSearch = search.create({
                    type: "job",
                    filters:
                        [
                            ["parent", "anyof", masterProjectId],
                            "AND",
                            ["internalidnumber", "notequalto", masterProjectId],
                            "AND",
                            filters
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "internalid" }),
                        ]
                });

                return subProjectSearch;

            }
            catch (e) {
                log.error('getSubProjects Exception', e.message);
            }
        }

        function getSubProjectsFilter(selectedLineData){
            try{

                selectedLineData = JSON.parse(selectedLineData);

                var filters = ["internalid", "anyof"];

                for(var i = 0; i < selectedLineData.length; i++){

                    var subProjectId = selectedLineData[i].projId;

                    filters.push(subProjectId);
                }
                log.debug('Filters', filters);
                let hasNumber = filters.some(element => !isNaN(element));

                if(hasNumber) return filters;

            }

            catch(e){

                log.error('getSubPRojects Exception', e.message);
            }

            return [];
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        };
    });
