/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 */
    (log, record, search, runtime) => {

        const getInputData = (inputContext) => {
            var title = 'getInputData[::]';
            var search1 = [];
            try {
                var arr = search.lookupFields({
                    type: 'customrecord_gfl_includechildredfalse',
                    id: '1',
                    columns: ['custrecord_gfl_item_array']
                }).custrecord_gfl_item_array;
                var data;
                if (arr) {
                    data = JSON.parse(arr);
                }
                log.debug({
                    title: 'data',
                    details: data
                });
                var scriptObj = runtime.getCurrentScript();

                if (scriptObj.deploymentId && scriptObj.deploymentId == 'customdeploy_gfl_mr_setincludechildren') {
                    if (data.length > 0) {
                        var search1 = searchkitResultsParent(data);
                    } else {
                        var search1 = searchkitResults();
                    }
                }

                else {
                    if (data.length > 0) {
                        var search1 = searchResultsParent(data);
                    } else {
                        var search1 = searchResults();
                    }

                }
                return search1 || [];

            } catch (e) {

                log.error(title + e.name, e.message);
            }
        }


        const map = (mapContext) => {

            var title = 'map[::]';
            try {
                var data = JSON.parse(mapContext.value);

                var itemId = record.submitFields({
                    type: data.recordType,
                    id: parseInt(data.id),
                    values: {
                        includechildren: false
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            } finally {
                mapContext.write({
                    key: '1',
                    value: { itemId }
                });
            }
        }

        const reduce = (reduceContext) => {
            var title = 'reduce[::]';
            try {
                var data = reduceContext.values.map(function (val) {
                    return JSON.parse(val);
                });
                log.debug({
                    title: 'data Reduce',
                    details: data
                });
                var array = [];
                for (var m = 0; m < data.length; m++) {
                    var itemIdNull = data[m].itemId;
                    if (!isEmpty(itemIdNull)) {
                        array.push(data[m].itemId);
                    }
                }
                record.submitFields({
                    type: 'customrecord_gfl_includechildredfalse',
                    id: 1,
                    values: {
                        'custrecord_gfl_item_array': JSON.stringify(array)
                    }
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function searchResultsParent(arr) {
            var title = 'searchResultsParent[::]';
            var stringArray = arr.map(String);
            var filter = ["parent", "anyof"].concat(stringArray);
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["type", "anyof", "NonInvtPart", "InvtPart"],
                            "AND",
                            ["includechildren", "is", "T"],
                            "AND",
                            ["matrix", "is", "F"],
                            "AND",
                            ["matrixchild", "is", "F"],
                            "AND",
                            ["subsidiary", "anyof", "1"],
                            "AND",
                            filter
                        ],
                    columns:
                        [
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "salesdescription", label: "Description" }),
                            search.createColumn({ name: "type", label: "Type" })
                        ]
                });
                return itemSearchObj || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function searchResults() {
            var title = 'searchResults[::]';
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        // [
                        //     ["type", "anyof", "NonInvtPart", "InvtPart"],
                        //     "AND",
                        //     ["includechildren", "is", "T"],
                        //     "AND",
                        //     ["subsidiary", "anyof", "1"],
                        //     "AND",
                        //     ["parent", "anyof", "@NONE@"]
                        //     // "AND",
                        //     // ["internalid", "anyof", "2652"]
                        // ],
                        [
                            ["type", "anyof", "InvtPart", "NonInvtPart"],
                            "AND",
                            ["includechildren", "is", "T"],
                            "AND",
                            ["matrixchild", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "salesdescription", label: "Description" }),
                            search.createColumn({ name: "type", label: "Type" })
                        ]
                });
                return itemSearchObj || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        function searchkitResultsParent(arr) {
            var title = 'searchkitResultsParent[::]';
            var stringArray = arr.map(String);
            var filter = ["parent", "anyof"].concat(stringArray);
            try {
                var itemSearchObj = search.create({
                    type: "kititem",
                    filters:
                        [
                            ["type", "anyof", "Kit"],
                            "AND",
                            ["includechildren", "is", "T"],
                            "AND",
                            ["subsidiary", "anyof", "1"],
                            "AND",
                            ["matrix", "is", "F"],
                            "AND",
                            ["matrixchild", "is", "F"],
                            "AND",
                            filter
                        ],
                    columns:
                        [
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "salesdescription", label: "Description" }),
                            search.createColumn({ name: "type", label: "Type" })
                        ]
                });
                return itemSearchObj || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function searchkitResults() {
            var title = 'searchkitResults[::]';
            try {
                var itemSearchObj = search.create({
                    type: "kititem",
                    filters:
                        [
                            ["type", "anyof", "Kit"],
                            "AND",
                            ["includechildren", "is", "T"],
                            "AND",
                            ["subsidiary", "anyof", "1"]
                            // "AND",
                            // ["parent", "anyof", "@NONE@"],
                            // "AND",
                            // ["internalid", "anyof", "11457"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "salesdescription", label: "Description" }),
                            search.createColumn({ name: "type", label: "Type" })
                        ]
                });
                return itemSearchObj || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0)) {
                return true;
            }
            return false;
        }
        return { getInputData, map, reduce }
    });
