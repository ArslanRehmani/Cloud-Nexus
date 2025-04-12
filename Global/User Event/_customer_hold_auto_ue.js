/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {
    function afterSubmit(context) {
        // var title = 'afterSubmit[::]';
        try {
            var rec = context.newRecord;
            var searchResult = custHoldsearch();
            log.debug('searchResult', searchResult);
            if (searchResult.length > 0 && searchResult[0] && searchResult[0].creditHold) {
                var setValue = searchResult[0].creditHold;
                record.submitFields({
                    type: record.Type.CUSTOMER,
                    id: rec.id,
                    values: {
                        'creditholdoverride': setValue
                    }
                });
            }
        } catch (e) {
            log.error('execption', e.message);
        }


    }
    function custHoldsearch() {
        var obj;
        var arr = [];
        var customerSearchObj = search.create({
            type: "customer",
            filters:
                [
                    ["internalid", "anyof", "91"]
                ],
            columns:
                [
                    search.createColumn({
                        name: "formulatext",
                        formula: "{credithold}"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "{custentity_creditholdstatuslock}"
                    }),
                    search.createColumn({
                        name: "formulatext",
                        formula: "CASE WHEN {custentity_creditholdstatuslock} = 'T' THEN 'OFF' ELSE 'AUTO' END"
                    })
                ]
        });
        customerSearchObj.run().each(function (result) {
            obj = {};
            obj.creditHold = result.getValue({ name: 'formulatext' });
            arr.push(obj);
        });
        return arr || [];
    }

    return {
        afterSubmit: afterSubmit
    };
});





