/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/runtime', 'N/search'], function (record, runtime, search) {

    function afterSubmit(context) {
        try {
            var currentRecord = record.load({
                type: context.newRecord.type,
                id: context.newRecord.id
            });
            var customerId = currentRecord.getValue('entity');
            var fsCostMap = currentRecord.getValue('custbody_gfl_so_fs_costmap');
            log.debug({
                title: 'fsCostMap',
                details: fsCostMap
            });
            if (fsCostMap) {

                log.debug({
                    title: 'fsCostMap IN',
                    details: fsCostMap
                });
                var parts = fsCostMap.split('*').map(function (p) {
                    return p.trim();
                });

                var fieldIdFsCost = parts[0];

                var multiplyNum = parts[1];

                var shippingCost = currentRecord.getValue('shippingcost') || 0;
                var totalFSCost = currentRecord.getValue('custbody_fs_cost_total') || 0;
                var scriptObj = JSON.parse(runtime.getCurrentScript().getParameter({ name: 'custscript_set_fs_cost_kogan_ue' })) || [];
                log.debug({
                    title: 'customerId',
                    details: customerId
                });
                log.debug({
                    title: 'shippingCost',
                    details: shippingCost
                });
                if (!!customerId && scriptObj.indexOf(parseInt(customerId)) !== -1 && shippingCost > 0) {
                    log.debug({
                        title: 'customerId IN',
                        details: customerId
                    });
                    log.debug({
                        title: 'shippingCost IN',
                        details: shippingCost
                    });
                    setLineFSCost(currentRecord, shippingCost, totalFSCost, fieldIdFsCost, multiplyNum);
                }
            }
        }
        catch (e) {
            log.error('onAction Exception', e.message);
        }
    }
    function setLineFSCost(currentRecord, shippingCost, totalFSCost, fsCsost, multiplyNum) {
        try {
            var itemSearch = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid", "anyof", currentRecord.id],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["item.custitem_dealer_koganshipping", "is", "T"]
                    ],
                columns: ["item",
                    "custbody_farapp_storefront",
                    search.createColumn({
                        name: "formulatext",
                        formula: "{item." + fsCsost + "}",
                        label: "Formula (Text)"
                    })
                ]
            });
            var searchResult = itemSearch.run().getRange({ start: 0, end: 1000 });
            log.debug({
                title: 'searchResult',
                details: searchResult
            });
            var ttlFsCost = 0;
            var shopifyStore = '';
            for (var i = 0; i < searchResult.length; i++) {
                var itemId = searchResult[i].getValue({ name: 'item' });
                shopifyStore = searchResult[0].getValue({ name: 'custbody_farapp_storefront' });
                var data = searchResult[0].getValue({ name: 'formulatext', formula: '{item.' + fsCsost + '}' });

                if (!!itemId) {
                    var lineNumber = currentRecord.findSublistLineWithValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: itemId
                    });
                    if (lineNumber > -1) {
                        currentRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_fs_cost',
                            // value: shippingCost,
                            value: (data * parseFloat(Function("return " + multiplyNum)())),
                            line: lineNumber,
                            ignoreFieldChange: true
                        });
                        log.debug('FS COST DATA', data * parseFloat(Function("return " + multiplyNum)()))
                        // ttlFsCost += shippingCost;
                        ttlFsCost += data * parseFloat(Function("return " + multiplyNum)());
                    }
                }

            }
            var totalFsCost = currentRecord.getValue({ fieldId: 'custbody_fs_cost_total' }) || 0;
            totalFsCost = totalFsCost + ttlFsCost;
            currentRecord.setValue({ fieldId: 'custbody_fs_cost_total', value: ttlFsCost, ignoreFieldChange: true });
            currentRecord.save({ ignoreMandatoryFields: true });
        }
        catch (e) {
            log.error('setLineFSCost Exception', e.message);
        }
    }

    return {
        afterSubmit: afterSubmit,
    };
});