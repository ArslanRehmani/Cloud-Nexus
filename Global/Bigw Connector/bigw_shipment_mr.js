/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['./bigw_lib', 'N/search', './libraryG2', 'N/file', 'N/email'],

function(bigwLib, search, lg, file, email) {

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
        // log.debug('search', search.load({id: 1321}).filterExpression);
        var bigwLogs = lg.SearchExistingRecord(
            bigwLib.log_records.id,
            [
                ['isinactive', 'is', 'F'],
                'AND',
                ['custrecord_bigw_order_fulfilled', 'is', 'F'],
                'AND',
                ['custrecord_bigw_order_salesorder', 'noneof','@NONE@']
            ],
            bigwLib.log_records.fields
        )

        return bigwLogs;
    }

    /**
     * Executes when the map entry point is triggered and applies to each key/value pair.
     *
     * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
     * @since 2015.1
     */
    function map(context) {
        log.debug(context.key, context.value);

        var shipment = new bigwLib.bigwShipment(JSON.parse(context.value));
        log.debug('shipment', shipment);

        if (shipment.shipment_content) {
            context.write({
                key: 'all',
                value: shipment.shipment_content
            })
        }
    }

    /**
     * Executes when the reduce entry point is triggered and applies to each group.
     *
     * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
     * @since 2015.1
     */
    function reduce(context) {
        var fileContentObj = {shipment: []};
        util.each(context.values, function(contextValue) {
            log.debug('contextValue', contextValue);
            var contextValueObj = JSON.parse(contextValue);
            fileContentObj.shipment = fileContentObj.shipment.concat(contextValueObj.shipment);
        });

        log.debug('fileContentObj', fileContentObj);
        // save shipment first in case SFTP failed to establish connection
        file.create({
            name: 'shipment_' + new Date().getTime() + '.json',
            fileType: file.Type.JSON,
            contents: JSON.stringify(fileContentObj),
            encoding: file.Encoding.UTF8,
            folder: '6837985',
        }).save();
        var bigwConn = new bigwLib.bigwSFTP('shipment');
        var fileName = bigwConn.generateFileName('shipment') + '.json';
        var jsonFile = file.create({
            name: fileName,
            fileType: file.Type.JSON,
            contents: JSON.stringify(fileContentObj),
            encoding: file.Encoding.UTF8,
            folder: '6837985',
        });
        log.debug('jsonFile', jsonFile);
        var fileId = jsonFile.save();
        bigwConn.upload(jsonFile);
    }


    /**
     * Executes when the summarize entry point is triggered and applies to the result set.
     *
     * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
     * @since 2015.1
     */
    function summarize(summary) {
        log.debug('input summary', summary.inputSummary);
        var errors = '';
        var mapSum = summary.mapSummary;
        mapSum.errors.iterator().each(function(key, value) {
            log.error('error in map stage ' + key, value);
            errors += value + '<BR><BR>'
            return true;
        });

        var reduSum = summary.reduceSummary;
        reduSum.errors.iterator().each(function(key, value) {
            log.error('error in reduce stage ' + key, value );
            errors += value + '<BR><BR>'
            return true;
        });

        if (errors) {
            email.send({
                author: 16,
                recipients: ['george@lifespanfitness.com.au', 'sugito.r@gflgroup.com.au'],
                body: errors,
                subject: 'Bigw Shipment error'
            })
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
    
});
