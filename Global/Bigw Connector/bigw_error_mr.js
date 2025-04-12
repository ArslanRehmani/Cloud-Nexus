/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['./bigw_lib', 'N/file'],

function (bigwLib, file) {
    var _ = bigwLib._;

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
        var sftpConn = new bigwLib.bigwSFTP();
        // var sftpConn = new bigwLib.bigwSFTP();
        var processedErrorFile = file.load({id: './bigw_errors_processed.txt'});
        var bigwError = [];
        bigwError = bigwError.concat(sftpConn.listDir(sftpConn.scopeDirs.inventory.error));
        bigwError = bigwError.concat(sftpConn.listDir(sftpConn.scopeDirs.shipment.error));

        var bigwErrorNames = _.map(bigwError, 'name');
        // filter with alreay processed and add them into the file
        var iterator = processedErrorFile.lines.iterator();
        //Skip the first line (CSV header)
        // iterator.each(function () {return false;});
        var processedBigWErrors = [];
        iterator.each(function (line){
            processedBigWErrors.push(_.trim(line.value));
            return true;
        });
        log.debug('processedBigWErrors', processedBigWErrors);
        var unprocessedBigwErrors = _.compact(_.map(bigwError, function(be) {
            if (processedBigWErrors.indexOf(be.name) < 0) {
                return be;
            };
        }));
        // [{
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200207171445.csv",
        //     "size": 87,
        //     "lastModified": "2020-02-07T06:50:47.000Z"
        // }, {
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200207180010.csv",
        //     "size": 87,
        //     "lastModified": "2020-02-07T06:50:40.000Z"
        // }, {
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200305170318.csv",
        //     "size": 384,
        //     "lastModified": "2020-03-05T06:04:06.000Z"
        // }, {
        //     "directory": false,
        //     "name": "errorupload_inventory_84320009_20200306091843.csv",
        //     "size": 401,
        //     "lastModified": "2020-03-05T22:23:21.000Z"
        // }]

        log.debug('unprocessedBigwErrors', unprocessedBigwErrors);
        return unprocessedBigwErrors;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        var sftpConn = new bigwLib.bigwSFTP();
        var contextObj = JSON.parse(context.value);
        var processedErrorFile = file.load({id: './bigw_errors_processed.txt'});
        
        // Error Code Error Message
        // INV01 INV_INVALID_WAREHOUSECODE
        // INV02 INV_INVALID_PRODUCTCODE
        // INV03 INV_INVALID_STOCK
        // INV04 INV_MANDATORY_FIELD_MISSING
        // SH01 BIGW_INVALID_CONSIGNMENTNUMBER
        // SH02 BIGW_MANDATORY_FIELD_MISSING
        // SH03 BIGW_INVALID_CONSIGNMENTNUMBER
        // SH04 BIGW_MISMATCH_PRODUCTCODE_ORDERLINENUMBER
        // SH05 BIGW_MISMATCH_PRODUCTCODE_CONSIGNMENTNUMBER
        // SH06 BIGW_VENDOR_INCORRECT_OUTBOND_FORMAT
        // SH07 BIGW_ACCEPTEDQUANTITY_ERROR
        // SH08 BIGW_REJECTEDQUANTITY_ERROR
        // SH09 BIGW_ACCEPTEDANDREJECTEDQUANTITY_ERROR
        // SH10 BIGW_DUPLICATE_ORDERSHIPPINGINFO
        // SH11 BIGW_INVALID_PRODUCTCODE
        // SH12 BIGW_INVALID_TRACKINGURL
        // SH13 BIGW_INVALID_VENDOR_ID
        // SH14 BIGW_INVALID_SCHEMA
        // SH15 BIGW_INVALID_ERROR
        // SH16 BIGW_INVALID_ATTRIBUTE_VALUE_OR_MANDATORY_FIELD_VALUE_MISSING
        // SH17 BIGW_INVALID_SHIPPED_DATE

        // append file name to processed error file
        processedErrorFile.appendLine({value: contextObj.name})
        var processedErrorFileId = processedErrorFile.save();
        log.debug('processedErrorFileId', processedErrorFileId);

        var nameArr = contextObj.name.split('_');
        var scope = nameArr[1];
        var emailSubject = 'Bigw Upload error: ' + contextObj.name;

        if (!contextObj.directory && nameArr[0] == 'errorupload') {

            // var sftpConn = new bigwLib.bigwSFTP();
            // download file
            if (scope == 'inventory') {
                var filePrepath = sftpConn.scopeDirs.inventory;
            } else if (scope == 'shipment') {
                var filePrepath = sftpConn.scopeDirs.shipment;
            }

            if (filePrepath) {
                var filePath = filePrepath.error + contextObj.name;
                var errorFile =  sftpConn.download({filename: filePath});
                var errorFileJSON = sftpConn.getFileContentJSON(errorFile);
                new bigwLib.bigwError(scope, contextObj.name, errorFileJSON);
                // move error file to archive
                // sftpConn.move(filePath, filePrepath.archive + contextObj.name);

                context.write({
                    key: scope,
                    value: errorFileJSON
                })
            }
        }
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        log.debug('reduct contextkey', context.key);
        log.debug('reduce contextvalue', context.values);
        var shipmentErrorArray = [];
        var inventoryErrorArray = [];
        util.each(context.values, function(cv) {
            log.debug('reduct context value', _.trim(cv));
            // [{"ConsignmentId":"consAUBW273534154_0","errorCode":"SH02"},
            // {"ConsignmentId":"consAUBW273534154_0","errorCode":"SH05"},
            // {"ConsignmentId":"consAUBW273534154_0","errorCode":"SH06"}]
            if (context.key == 'inventory') {
                inventoryErrorArray.push(JSON.parse(_.trim(cv)));
            } else if (context.key == 'shipment') {
                // remove the coresponding shipment record
                shipmentErrorArray.push(JSON.parse(_.trim(cv)));
            }
        });
        if (shipmentErrorArray.length > 0) {
            var consignmentNumberArr = _.compact(_.map(shipmentErrorArray, 'ConsignmentId'));
            util.each(consignmentNumberArr, function(cn) {
                new bigwLib.bigwShipmentError(cn);
            });
        }
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

        var reduSum = summary.reduceSummary;
        reduSum.errors.iterator().each(function(key, value) {
            log.error('error in reduce stage ' + key, value );
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };

});