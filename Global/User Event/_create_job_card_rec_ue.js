/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['./_create_job_card_rec_helper.js', 'N/log', 'N/search'], function (HELPER, log, search) {
    function beforeLoad(context) {
        try {
            if (context.type === context.UserEventType.VIEW) {
                HELPER.createJobCardRecord(context);
            }
        }
        catch (e) {
            log.error('beforeLoad Exception', e.message);
        }
    }
    function beforeSubmit(context) {
        var title = 'beforeSubmit[::]';
        try {
            var rec = context.newRecord;
            var Item = rec.getValue({ fieldId: 'item' });
            if (Item) {
                var description = searchItemDescription(Item);
                rec.setValue({fieldId: 'custevent_gfl_sales_description', value: description});
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function searchItemDescription(id) {
        var title = 'searchItemDescription[::]';
        try {
            var des = '';
            var itemSearchObj = search.create({
                type: "item",
                filters:
                [
                   ["internalid","anyof",id]
                ],
                columns:
                [
                   search.createColumn({name: "itemid", label: "Name"}),
                   search.createColumn({name: "salesdescription", label: "Description"}),
                   search.createColumn({name: "type", label: "Type"})
                ]
             });
             itemSearchObj.run().each(function(result){
                des = result.getValue({name: 'salesdescription'});
                return true;
             });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return des || '';
    }
    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    };

});
