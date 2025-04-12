/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record','N/log'], function (search, record, log) {

    function beforeSubmit(context) {
        var title = 'beforeSubmit(::)';
        try {
            var rec = context.newRecord;
            var itemId = rec.getValue({ fieldId: 'custrecord_item_id' });
            if(itemId){
                var itemSearch = itemTypeSearch(itemId);
                var itemType = itemSearch.type;
                log.debug({
                    title: 'itemType',
                    details: itemType
                });
                if (itemType == 'InvtPart') {
                    var fieldLookUp = search.lookupFields({
                        type: 'inventoryitem',
                        id: itemId,
                        columns: ['custitem_shipping_label_description']
                    }).custitem_shipping_label_description;
                    log.debug({
                        title: 'itemType fieldLookUp Data',
                        details: fieldLookUp
                    });
                    if (fieldLookUp) {
                        rec.setValue({fieldId: 'custrecord61', value: fieldLookUp});
                    }
                } else if (itemType == 'Kit') {
                    var kitSearchResults = kitSearch(itemId);
                    log.debug({
                        title: 'itemType KIT Data',
                        details: kitSearchResults
                    });
                    if (kitSearchResults.data) {
                        rec.setValue({fieldId: 'custrecord61', value: kitSearchResults.data});
                    }
                }
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    function itemTypeSearch(id) {
        var title = '(::)';
        var obj;
        try {
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["internalid", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "itemid",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({ name: "type", label: "Type" }),
                        search.createColumn({ name: "custitem_shipping_label_description", label: "Shipping Label Description" })
                    ]
            });
            itemSearchObj.run().each(function (result) {
                obj = {};
                obj.type = result.getValue({ name: 'type' });
                obj.CartonCode = result.getValue({ name: 'custitem_shipping_label_description' });
                return true;
            });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return obj;
    }
    function kitSearch(id) {
        var title = 'kitSearch(::)';
        var obj;
        try {
            var customrecord_avt_ifs_item_packageSearchObj = search.create({
                type: "customrecord_avt_ifs_item_package",
                filters:
                    [
                        ["custrecord_avt_ifs_item_package_item", "anyof", id]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custitem_shipping_label_description",
                            join: "CUSTRECORD_AVT_IFS_ITEM_PACKAGE_INV_ITEM",
                            label: "Shipping Label Description"
                        })
                    ]
            });
            var dataLength = customrecord_avt_ifs_item_packageSearchObj.run().getRange({
                start: 0,
                end: 1
            });
            for (var b = 0; b < dataLength.length; b++) {
                obj = {};
                obj.data = dataLength[b].getValue({name: 'custitem_shipping_label_description', join: 'CUSTRECORD_AVT_IFS_ITEM_PACKAGE_INV_ITEM'});
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return obj;
    }
    return {
        beforeSubmit: beforeSubmit
    }
});
