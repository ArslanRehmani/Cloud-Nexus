        /**
         * @NApiVersion 2.1
         * @NScriptType MapReduceScript
         */
        define(['N/record', 'N/search', 'N/render', 'N/email', 'N/file', 'N/runtime', 'N/url'],
            function (record, search, render, email, file, runtime, url) {

                var global_adjustment_id = 0
                var lines_res = 0
                var sku_array = []

                function getCustRecords(context) {

                    var soSearch = search.load({
                        id: 'customsearch_donor_record_sync' // change this based on the created saved search
                    });

                    var soResult = [];
                    var count = 0;
                    var pageSize = 1000;
                    var start = 0;
                    do {
                        var soResultSet = soSearch.run().getRange({
                            start: start,
                            end: start + pageSize
                        });

                        soResult = soResult.concat(soResultSet);
                        count = soResultSet.length;
                        start += pageSize;

                    } while (count == pageSize);

                    return soResult

                }


                function map(context) {
                    log.debug('context', context)
                    var searchResult = JSON.parse(context.value)
                    log.debug({
                        title: 'MAP JSON',
                        details: searchResult
                    })


                    var invObj = {
                        id: searchResult.id,
                    }


                    context.write({
                        key: invObj,
                        value: 1
                    })




                }


                function gatherInfo(context) {


                    try {
                        var reduceObj = JSON.parse(context.key)

                        log.debug('reduceObj', reduceObj)


                    var objRecord = record.load({
                            type: record.Type.CASH_SALE,
                            id: reduceObj.id,
                            isDynamic: true,
                        });

                        objRecord.setValue({
                            fieldId: 'custbody_donor_record_sync',
                            value: true
                        })

                        var donor_id = objRecord.getValue({
                            fieldId: 'entity'
                        })
                        
                        var recordId = objRecord.save({
                            enableSourcing: true,
                           ignoreMandatoryFields: true
                        });

                        
                        var cust_rec = record.load({
                            type: record.Type.CUSTOMER,
                            id: donor_id,
                            isDynamic: true,
                        });
                        
                        var cust_id = cust_rec.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });









                    } catch (e) {
                        log.debug('error on creating inventory detail on summary', e)
                    }




                }

















                return {
                    getInputData: getCustRecords,
                    map: map,
                    reduce: gatherInfo,
                    // summarize: summarize,
                }
            });