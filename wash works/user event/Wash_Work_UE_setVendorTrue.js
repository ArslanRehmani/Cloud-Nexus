/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

    function afterSubmit(context) {
        var title = 'afterSubmit[::]';
        try {
            var rec = context.newRecord;

            var checkObj = record.load({
                type: rec.type,
                id: rec.id
            });

            var entityId = checkObj.getValue({ fieldId: 'entity' });

            var checkType = checkTypeSearch(entityId);

            log.debug({
                title: 'checkType',
                details: checkType
            });

            if(checkType == 'CustJob'){
                checkObj.setValue({fieldId: 'custbody_wash_work_checkbox', value: true});

            }
            checkObj.save();

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function checkTypeSearch(id) {
        var title = 'checkTypeSearch[::]';
        var type;
        try {
            var entitySearchObj = search.create({
                type: "entity",
                filters:
                    [
                        ["internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({ name: "altname", label: "Name" }),
                        search.createColumn({ name: "type", label: "Primary Type (Deprecated)" })
                    ]
            });

            entitySearchObj.run().each(function (result) {
                type = result.getValue({name: 'type'});
                return true;
            });

            /*
            entitySearchObj.id="customsearch1753724172468";
            entitySearchObj.title="Custom Entity Search (copy)";
            var newSearchId = entitySearchObj.save();
            */
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return type || '';
    }

    return {
        afterSubmit: afterSubmit
    }
});
