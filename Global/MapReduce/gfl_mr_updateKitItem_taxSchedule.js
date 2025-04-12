/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
 define(['N/search', 'N/log', 'N/record', 'N/runtime'], function (search, log, record, runtime) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {

            //Get Saved Search from Script Parameters
            var taxScheduleSearchId = runtime.getCurrentScript().getParameter({
                name: 'custscript_saved_search_for_tax_schedule'
            });

            //If Found Search ID then Load Search
            if (taxScheduleSearchId) {

                var searchObj = search.load({
                    id: taxScheduleSearchId
                });

                return searchObj;
            }

        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return [];
    }

    function map(context) {
        var title = 'map(::)';
        try {
            var data = JSON.parse(context.value);

            //Load Kit Item Record
            var kitItemOBJ = record.load({
                type: data.recordType,
                id: data.id
            });

            //Get Member Items Count
            var memberListCount = kitItemOBJ.getLineCount({
                sublistId: 'member'
            });

            var dataArray = [];
            var schedule;

            for (var j = 0; j < memberListCount; j++) {

                //Push Each Schedule Tax Code in Array 
                schedule = kitItemOBJ.getSublistValue({
                    sublistId: 'member',
                    fieldId: 'taxschedule',
                    line: j
                });
                if (schedule == null || schedule == '') {
                    kitItemOBJ.setValue({ fieldId: 'taxschedule', value: '' });
                    var itemId = kitItemOBJ.save({ ignoreMandatoryFields: true });
                    return;
                } else {
                    dataArray.push(schedule);
                }
            }

            if (dataArray && dataArray.length > 0) {
                //Check If all schedules are same or not
                var sameSchedule = areAllElementsSame(dataArray);

                //IF Tax Schedule is same then set same schedule for Kit
                if (sameSchedule == 'true' || sameSchedule == true) {

                    kitItemOBJ.setValue({ fieldId: 'taxschedule', value: schedule });
                    var itemId = kitItemOBJ.save({ ignoreMandatoryFields: true });
                    log.debug('itemId', itemId);
                }else{
                    kitItemOBJ.setValue({ fieldId: 'taxschedule', value: '' });
                    var itemId = kitItemOBJ.save({ ignoreMandatoryFields: true });
                    log.debug('itemId', itemId);
                }
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    function areAllElementsSame(arr) {
        var title = 'areAllElementsSame(::)';
        try {
            // Check if the array is empty
            if (arr.length === 0) {
                return true;
            }

            // Compare each element with the first one
            for (var i = 1; i < arr.length; i++) {
                if (arr[i] !== arr[0]) {
                    return false;
                }
            }

            // All elements are the same
            return true;
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    return {
        getInputData: getInputData,
        map: map
    }
});
