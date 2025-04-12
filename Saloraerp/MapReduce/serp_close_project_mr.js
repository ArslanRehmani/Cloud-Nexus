/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/search', 'N/record', 'N/runtime'],
    function (log, search, record, runtime) {

        function getInputData() {
            try {

                let masterProjectSearchId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_master_project__search_id'
                });

                if (masterProjectSearchId) {

                    let searchObj = search.load({ id: masterProjectSearchId });

                    return searchObj || [];

                }

            }
            catch (e) {

                log.error('getInputData Exception', e.message);
            }

            return [];

        }

        function map(context) {
            try {

                let searchResult = JSON.parse(context.value);
                log.debug('searchResult', searchResult);

                let projectId = searchResult.values["internalid"].value || '';

                if (projectId) {

                    let closeProject = getSubProjectsStatus(projectId);

                    if (closeProject == true) {

                        let id = record.submitFields({
                            type: 'job',
                            id: projectId,
                            values: {
                                entitystatus: 1
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });

                        log.debug('Closed Project', id);
                    }

                    else {

                        log.debug('Still having In Progress Sub-Projects', projectId);
                    }
                }

            }
            catch (e) {

                log.error('map Exception', e.message);
            }
        }

        function reduce(context) {
            try {

            }
            catch (e) {

                log.error('reduce Exception', e.message);
            }
        }


        function getSubProjectsStatus(masterProjectId) {

            let closeProject = false;

            try {

                let subProjectSearch = search.create({
                    type: "job",
                    filters:
                        [
                            ["status", "anyof", "2"],
                            "AND",
                            ["parent", "anyof", masterProjectId],
                            "AND",
                            ["internalid", "noneof", masterProjectId]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "internalid" }),
                        ]
                });

                let searchResult = subProjectSearch.run().getRange({ start: 0, end: 1 });
                log.debug('Search Result', searchResult);

                if (searchResult.length > 0) {

                    return closeProject;

                }

                else {

                    return true;

                }


            }
            catch (e) {
                log.error('getSubProjects Exception', e.message);
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        };
    });
