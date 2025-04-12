/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

    function beforeLoad(context) {
        var title = 'beforeLoad(::)';
        try {
            if (context.type == context.UserEventType.CREATE) {
                var rec = context.newRecord;
                var obj;
                var createdFromId = rec.getValue({
                    fieldId: 'createdfrom'
                });
                log.debug({
                    title: 'createdFromId',
                    details: createdFromId
                });
                var assemblyItemID = rec.getValue({
                    fieldId: 'assemblyitem'
                });
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                    [
                        ["type","anyof","SalesOrd"], 
                        "AND", 
                        ["internalid","anyof",createdFromId], 
                        "AND", 
                        ["item","anyof",assemblyItemID]
                     ],
                    columns:
                        [
                            search.createColumn({ name: "custcol5", label: "Insert Colour" }),
                            search.createColumn({ name: "custcol_frame_colour", label: "Frame Colour" })
                        ]
                });
                salesorderSearchObj.run().each(function (result) {
                    obj = {};
                    obj.isnsertColour = result.getText({ name: 'custcol5' });
                    obj.frameColour = result.getText({ name: 'custcol_frame_colour' });
                    return true;
                });
                log.debug({
                    title: 'obj',
                    details: obj
                });
                if(obj.isnsertColour !=''){
                    rec.setValue({
                        fieldId : 'custbody_wo_insert_colour',
                        value: obj.isnsertColour
                    });
                }
                if(obj.frameColour != ''){
                    rec.setValue({
                        fieldId : 'custbody_wo_frame_colour',
                        value: obj.frameColour
                    });
                }
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }
    return {
        beforeLoad: beforeLoad
    }
});
