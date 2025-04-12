/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/record', 'N/runtime'],

    (search, record, runtime) => {

        const getInputData = () => {
            var results;
            try {
                var saveSearchID = runtime.getCurrentScript().getParameter('custscript_showroom_indicator_search');

                log.debug({
                    title: 'saveSearchID',
                    details: saveSearchID
                });

                if (saveSearchID) {

                    results = search.load({
                        id: saveSearchID
                    });

                    log.debug({
                        title: 'results',
                        details: results
                    });

                }


            }
            catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;

                log.error('getInputData:err', err);

            }

            return results || [];
            // return [];

        }
        const map = (mapContext) => {
            try {
                var title = 'mapContext[::]';
                try {

                    var data = JSON.parse(mapContext.value);
                    log.debug({
                        title: 'data',
                        details: data
                    });

                    var itemInternalId = data.values['GROUP(internalid)'].value;

                    log.debug({
                        title: 'itemInternalId',
                        details: itemInternalId
                    });

                    var searhResults = showroomIndicatorSearch(itemInternalId);
                    // var searhResults = showroomIndicatorSearch('78974');

                    log.debug({
                        title: 'searhResults',
                        details: searhResults
                    });
                    if (searhResults && searhResults.length > 0) {

                        var locObj = checkShowroomValues(searhResults);

                        log.debug({
                            title: 'locObj',
                            details: locObj
                        });
                        if (!isEmpty(locObj)) {

                            if (locObj.bmValid == true && locObj.wpValid == false && locObj.qldValue == false) {

                                record.submitFields({
                                    type: 'inventoryitem',
                                    id: itemInternalId,
                                    values: {
                                        'custitem_showroomindicator': ['1']
                                    }
                                });

                            }
                            if (locObj.wpValid == true && locObj.bmValid == false && locObj.qldValue == false) {
                                record.submitFields({
                                    type: 'inventoryitem',
                                    id: itemInternalId,
                                    values: {
                                        'custitem_showroomindicator': ['2']
                                    }
                                });
                            }
                            if (locObj.wpValid == false && locObj.bmValid == false && locObj.qldValue == true) {
                                record.submitFields({
                                    type: 'inventoryitem',
                                    id: itemInternalId,
                                    values: {
                                        'custitem_showroomindicator': ['3']
                                    }
                                });
                            }
                            if (locObj.bmValid == true && locObj.wpValid == true && locObj.qldValue == true) {
                                record.submitFields({
                                    type: 'inventoryitem',
                                    id: itemInternalId,
                                    values: {
                                        'custitem_showroomindicator': ['1', '2', '3']
                                    }
                                });
                            }

                        }
                    }


                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            } catch (e) {
                let err = `${e.name} - ${e.message} - ${e.stack}`;

                log.error('map:err', err);
            }
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0) || Object.keys(stValue).length === 0) {
                return true;
            }
            return false;
        }
        function showroomIndicatorSearch(id) {
            var title = 'showroomIndicatorSearch[::]';
            var array = [];
            var obj;
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["type", "anyof", "InvtPart", "Kit"],
                            "AND",
                            ["internalid", "anyof", id],
                            "AND",
                            ["inventorylocation", "anyof", "24", "27", "9"],
                            "AND",
                            ["locationquantityonhand", "greaterthan", "0"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "inventorylocation", label: "Inventory Location" }),
                            search.createColumn({ name: "locationquantityonhand", label: "Location On Hand" })
                        ]
                });
                itemSearchObj.run().each(function (result) {
                    obj = {};
                    var loc = result.getText({ name: 'inventorylocation' });
                    log.debug({
                        title: 'loc',
                        details: loc
                    });
                    if (loc) {
                        obj[loc] = result.getValue({ name: 'locationquantityonhand' });
                    }
                    array.push(obj);
                    return true;
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }
        function checkShowroomValues(arr) {
            var title = 'titleName[::]';
            try {
                let bmValid = false;
                let wpValid = false;
                let qldValue = false;

                arr.forEach(obj => {
                    if (obj.hasOwnProperty("Showroom (BM)")) {
                        const value = obj["Showroom (BM)"];
                        if (value !== "" && Number(value) > 0) {
                            bmValid = true;
                        }
                    }
                    if (obj.hasOwnProperty("Showroom (WP)")) {
                        const value = obj["Showroom (WP)"];
                        if (value !== "" && Number(value) > 0) {
                            wpValid = true;
                        }
                    }
                    if (obj.hasOwnProperty("TMS Parkinson QLD")) {
                        const value = obj["TMS Parkinson QLD"];
                        if (value !== "" && Number(value) > 0) {
                            qldValue = true;
                        }
                    }
                });

                return { bmValid, wpValid, qldValue };
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return { getInputData, map }

    });
