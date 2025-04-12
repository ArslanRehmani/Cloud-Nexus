/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {


    function beforeSubmit(context) {
        var title = 'beforeSubmit[::]';
        try {
            if (context.type == context.UserEventType.CREATE) {

                var rec = context.newRecord;
                var customer = rec.getValue({ fieldId: 'custrecord_mtp_service_call_cust' });

                var custIntialsData = custIntialsSearch(customer);
                log.debug({
                    title: 'custIntialsData',
                    details: custIntialsData
                });

                if (custIntialsData != 0) {

                    var custIntials = custIntialsData.replace(/^\d+\s*/, '');

                    var maximumInitials = maximumInitialsNumSerch();

                    // Split the string by the hyphen
                    var splitParts = maximumInitials.split('-');

                    // Trim any whitespace in each part (without using ES6 map)
                    for (var i = 0; i < splitParts.length; i++) {
                        splitParts[i] = splitParts[i].trim();
                    }

                    // Get the last part of the split array (which is the portion after the last hyphen)
                    var lastPart = splitParts[splitParts.length - 1];

                    var num = parseInt(lastPart, 10) + 1;  // Convert to an integer and add 1

                    // Convert back to a string
                    var numStrNew = num.toString();

                    // Calculate how many zeroes to prepend
                    var numZeroes = lastPart.length - numStrNew.length;

                    // Prepend the required number of zeroes manually
                    for (var i = 0; i < numZeroes; i++) {
                        numStrNew = "0" + numStrNew;
                    }
                    log.debug({
                        title: 'numStrNew',
                        details: numStrNew
                    });

                    if (splitParts != 0) {
                        var recordInitials = custIntials + ' - ' + numStrNew;
                        rec.setValue({ fieldId: 'custrecord_mtp_service_num', value: recordInitials });
                    }
                }

            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function afterSubmit(context) {
        var title = 'afterSubmit[::]';
        try {
            var rec = context.newRecord;
            var serviceCallFormObj = record.load({
                type: rec.type,
                id: rec.id
            });
            var projectId = serviceCallFormObj.getValue({fieldId: 'custrecord21'});
            var estRevCostData = estRevCostSearch(projectId);
            log.debug({
                title: 'estRevCostData',
                details: estRevCostData
            });
            if(estRevCostData && estRevCostData.length > 0){
                record.submitFields({
                    type: 'job',
                    id: projectId,
                    values: {
                        'custentity29': parseFloat(estRevCostData[0].estRevenueService),
                        'custentity28': parseFloat(estRevCostData[0].estCostService)
                    }
                });
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function maximumInitialsNumSerch() {
        var title = 'maximumInitialsNumSerch[::]';
        var initials = '';
        try {

            var customrecord433SearchObj = search.load({
                id: 'customsearch1264'
            });
            var searchResult = customrecord433SearchObj.run().getRange({ start: 0, end: 1 });
            log.debug({
                title: 'searchResult.length',
                details: searchResult.length
            });

            if (searchResult.length > 0) {

                for (var m = 0; m < searchResult.length; m++) {
                    initials = searchResult[m].getValue({ name: 'custrecord_mtp_service_num' });
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return initials || 0;
    }
    function custIntialsSearch(customer) {
        var title = 'custIntialsSearch[::]';
        var data;
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["internalid", "anyof", customer]
                    ],
                columns:
                    [
                        search.createColumn({ name: "externalid", label: "External ID" })
                    ]
            });
            customerSearchObj.run().each(function (result) {
                data = result.getValue({ name: 'externalid' });

                return true;
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return data || 0;
    }
    function estRevCostSearch(id) {
        var title = 'estRevCostSearch[::]';
        try {
            var obj;
            var array = [];
            var customrecord433SearchObj = search.create({
                type: "customrecord433",
                filters:
                    [
                        ["custrecord21.internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custrecord_service_projectestimatedrev",
                            summary: "SUM",
                            label: "Project Estimated Revenue"
                        }),
                        search.createColumn({
                            name: "custrecord_service_projectestimatedcos",
                            summary: "SUM",
                            label: "Project Estimated Cost"
                        })
                    ]
            });

            customrecord433SearchObj.run().each(function (result) {
                obj = {};
                    obj.estRevenueService = result.getValue({ name: 'custrecord_service_projectestimatedrev', summary: 'SUM' });
                    obj.estCostService = result.getValue({ name: 'custrecord_service_projectestimatedcos', summary: 'SUM' });
                    array.push(obj);
                return true;
            });

        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return array || [];
    }
    return {
        // beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
