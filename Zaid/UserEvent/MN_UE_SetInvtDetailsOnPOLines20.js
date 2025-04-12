    /**
     *@NApiVersion 2.0
    *@NScriptType UserEventScript
    */
    define(['N/record', 'N/log', 'N/search', 'N/task'], function (record, log, search, task) {
        function beforeSubmit(context){
            var title = 'beforeLoad(::)';
            try {
                if(context.type == context,UserEventType.CREATE){
                    var rec = context.newRecord;
                    var recType = rec.type;
                    log.debug({
                        title: 'recType',
                        details: recType
                    });
                    if(recType == 'returnauthorization'){
                        var lineItemCount = rec.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < lineItemCount; i++) {
                            rec.removeSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail',
                                line: i
                            });
                            log.debug({
                                title: 'Working',
                                details: 'YES'
                            });
                        }
                    }
                }
            } catch (e) {
            log.debug('Exception ' + title, e.message);
            }
        }
        function afterSubmit(context) {
            var title = 'MN_UE_SetInvtDetails_AS afterSubmit(::)';
            try {
                var nr = context.newRecord;
                var recType = nr.type;
                var recId = nr.id;
                log.debug({
                    title: 'MN_UE_SetInvtDetails_AS',
                    details: 'recId = ' + recId + ', recType = ' + recType
                });
                var mapreduceStatus = mapReduceStatusSearch();
                log.debug({
                    title: 'mapreduceStatus',
                    details: mapreduceStatus
                });
                if(isEmpty(mapreduceStatus)){
                    log.debug({
                        title: 'status empty',
                        details: 'YES'
                    });
                    var mapReduce =  task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: 'customscript_mr_setinven_detail_onpoline',
                        deploymentId: 'customdeploy_mr_setinven_detail_onpoline',
                        params: {
                            'custscript_po_id': recId,
                            'custscript_po_type': recType
                        }
                    });
                    mapReduce.submit();
                }else{
                var poRec =  record.create({
                        type: 'customrecord_amcan_pending_po_rec'
                    });
                    poRec.setValue({fieldId: 'custrecord150', value: JSON.stringify([{ 'id': recId, 'type': recType }])});
                    poRec.setValue({fieldId: 'custrecord151', value: 'Pending'});
                    poRec.save();
                }
            } catch (e) {
                log.debug('Exception ' + title, JSON.stringify(e));
            }
        }
        function mapReduceStatusSearch(){
            var title = 'mapReduceStatusSearch(::)';
            try {
                var status;
                var scheduledscriptinstanceSearchObj = search.create({
                    type: "scheduledscriptinstance",
                    filters:
                    [
                    ["status","anyof","PENDING"], 
                    "AND", 
                    ["script.scriptid","is","customscript_mr_setinven_detail_onpoline"], 
                    "AND", 
                    ["mapreducestage","noneof","@NONE@"]
                    ],
                    columns:
                    [
                    search.createColumn({name: "status", label: "Status"}),
                    search.createColumn({name: "percentcomplete", label: "Percent Complete"})
                    ]
                });
                scheduledscriptinstanceSearchObj.run().each(function(result){
                    status = result.getValue({name: 'status'});
                    return true;
                });
            } catch (e) {
            log.debug('Exception ' + title, e.message);
            }
            return status || '';
        }
        function isEmpty(value) {
            if (value == null || value == 'null' || value == undefined || value == 'undefined' || value == '' || value == "" || value.length <= 0) {
                return true;
            }
            return false;
        }
        return {
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }

    });

