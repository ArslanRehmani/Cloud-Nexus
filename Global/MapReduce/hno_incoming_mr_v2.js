/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['./hno_lib', 'N/search', 'N/file'],

function (hnoLib, search, file) {

    /**
     * Marks the beginning of the Map/Reduce process and generates input data.
     *
     * @typedef {Object} ObjectRef
     * @property {number} id - Internal ID of the record instance
     * @property {string} type - Record type id
     *
     * @return {Array|Object|Search|RecordRef} inputSummary
     * @since 2015.1
     */
    function getInputData() {

        var unImported = [];

        // for missed order only
        search.create({
            type: hnoLib.hno_log_record.id,
            filters: [
                ['isinactive', 'is', 'F'],
                'AND',
                [
                    ['custrecord_hno_import_log_salesorder', 'is', '@NONE@'],
                    'OR',
                    ['custrecord_hno_import_log_customer', 'is', '@NONE@']
                ],
                'AND',
                ['custrecord_hno_import_log_fulfilled', 'is', 'F'],
                'AND',
                ['custrecord_hno_import_log_file', 'noneof', '@NONE@']
            ],
            columns: hnoLib.hno_log_record.fields
        }).run().each(function(l) {
            log.audit('log', l);
            var fileInternid = l.getValue('custrecord_hno_import_log_file');
            var fileObj = file.load(fileInternid);
            log.debug('fileObj', fileObj);
            if (!fileObj.internalid) {
                fileObj.internalid = fileInternid;
            }
            var hnoOrderValue = hnoLib.generate_order(fileObj, l.id)
            log.debug('hnoOrderValue', hnoOrderValue);

            unImported.push(hnoOrderValue);
            return true;
        });

        var incomings = [];
        try {
            var conn = new hnoLib.sftp();
            incomings = conn.listIncoming();
        } catch (error) {
            log.error('sftp conn error', error)

            search.create({
                type: 'file',
                filters: [
                    ['folder', 'is', '7818165'],
                    // 'AND',
                    // ['isinactive', 'is', 'F'] // file search doesn't have isinactive
                ],
                columns: [
                    'internalid',
                    'name'
                ]
            }).run().each(function(f) {
                var fileObj = file.load(f.getValue('internalid'))
                fileObj.internalid = f.getValue('internalid')
                var orderValues = hnoLib.generate_order(fileObj)

                incomings.push(util.extend({
                    file: fileObj,
                    file_internalid: f.getValue('internalid'),
                    from_local: true,
                }, orderValues))
            })
        }

        // remove duplicated
        util.each(unImported, function(uni) {
            var found = false;
            for (var i = 0; i < incomings.length; i++) {
                if (incomings[i].log_internalid == uni.log_internalid) {
                    found = true;
                    break; 
                }
            }

            if (found == false) {
                incomings.push(uni);
            }
        })

        return incomings;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        // {file:{},file_internalid, order_type, order:{order_level:{},line_level:[{},{}]},log_internalid,log_values:{internalid,values:{}}}
        var incomingObj = JSON.parse(context.value);
        log.debug(context.key, incomingObj);
        if (incomingObj.order_type == 'order') {
            if (incomingObj.log_values.values.custrecord_hno_import_log_salesorder && incomingObj.log_values.values.custrecord_hno_import_log_customer) {
                if (incomingObj.from_local) {
                    incomingObj.file.folder = 6890153;
                    incomingObj.file.save();
                } else {
                    moveToBackup(incomingObj.log_values.values.file_name)
                }
            } else {
                var hnoOrder = new hnoLib.order(incomingObj);
            }
        } else if (incomingObj.order_type == 'cancel') {
            if (incomingObj.log_values.values.custrecord_hno_import_log_cancel_process) {
                if (incomingObj.from_local) {
                    incomingObj.file.folder = 6890153;
                    incomingObj.file.save();
                  log.debug('incomingObj==',incomingObj);
                } else {
                    // conn.moveFile(incomingObj.log_values.values.cancel_file_name, 'backup/'+incomingObj.log_values.values.cancel_file_name)
                    moveToBackup(incomingObj.log_values.values.cancel_file_name)
                }
            } else {
                var hnoCancel = new hnoLib.cancel(incomingObj)
                // send ack to sftp
            }
        } else if (incomingObj.order_type == 'return') {
            if (incomingObj.log_values.values.custrecord_hno_import_log_return_process) {
                if (incomingObj.from_local) {
                    incomingObj.file.folder = 6890153;
                    incomingObj.file.save();
                } else {
                    // conn.moveFile(incomingObj.log_values.values.return_file_name, 'backup/'+incomingObj.log_values.values.return_file_name)
                    moveToBackup(incomingObj.log_values.values.return_file_name)
                }
            } else {
                var honReturn = new hnoLib.return_req(incomingObj)
                // send ack to sftp
            }
        }
    }

    function moveToBackup(filePath) {
        var conn = new hnoLib.sftp();
        conn.moveFile(filePath, 'backup/' + filePath)
        conn.moveFile(filePath + '.DONE', 'backup/' + filePath + '.DONE')
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {

    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug('input summary', summary.inputSummary);
        var mapSum = summary.mapSummary;
        mapSum.errors.iterator().each(function(key, value) {
            log.error('error in map stage ' + key, value);
            return true;
        });

        // var reduSum = summary.reduceSummary;
        // reduSum.errors.iterator().each(function(key, value) {
        //     log.error('error in reduce stage ' + key, value );
        //     return true;
        // });
    }

    return {
        getInputData: getInputData,
        map: map,
        // reduce: reduce,
        summarize: summarize
    };

});