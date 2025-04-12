/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log','N/record','N/search'], function(log,record,search) {

    function beforeLoad(context) {
        var title = 'beforeLoad(::)';
        try{
            var rec = context.newRecord;
            var ItemId = rec.id;
            var memberItemArray = memberItemSearch(ItemId);
            var itemObj = record.load({
                type: rec.type,
                id: ItemId
            })
            itemObj.setValue({
                fieldId: 'custitem_member_item',
                value: memberItemArray
            });
            var recordId = itemObj.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            log.debug({
                title: 'recordId',
                details: recordId
            });
        } catch(e) {
            log.debug('Exception ' +title, e.message);
        }
        
    }
    function memberItemSearch(ItemId){
        var title = 'memberItemSearch(::)';
        try{
            var array = [];
            var itemSearchObj = search.create({
                type: "item",
                filters:
                [
                   ["memberitem.internalid","anyof",ItemId]
                ],
                columns:
                [
                   search.createColumn({
                      name: "itemid",
                      sort: search.Sort.ASC,
                      label: "Name"
                   }),
                   search.createColumn({name: "internalid", label: "Internal ID"})
                ]
             });
             itemSearchObj.run().each(function(result){
                array.push(result.id);
                return true;
             });
            log.debug({
                title: 'array',
                details: array
            });
        } catch(e) {
            log.debug('Exception ' +title, e.message);
        }
        return array || [];
    }
    return {
        beforeLoad: beforeLoad
    }
});
