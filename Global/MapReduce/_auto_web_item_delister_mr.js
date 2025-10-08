/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript    
*/
define(['N/record', 'N/search', 'N/runtime'],

    function (record, search, runtime) {
        function getInputData() {
            try {
                var searchId = runtime.getCurrentScript().getParameter({
                    name: 'custscript_search_id'
                });
                if (searchId) {

                    var searchObj = search.load({
                        id: searchId
                    });


                    return searchObj;
                }
            } catch (e) {
                log.error('getInputData Exception', e.message);
            }
        }
        function map(context) {
            try {
                var searchResult = JSON.parse(context.value);

                var itemQty = searchResult.values["SUM(formulanumeric)"] || '';
                log.debug('itemQty', itemQty);

                if (itemQty <= 0) {

                    var recordId = searchResult.values["GROUP(internalid)"].value || '';

                    var recordType = getRecordType(searchResult.values["GROUP(type)"].value);
                    //Get Shopify Stores Checks

                    var agDisplay = searchResult.values["GROUP(custitem_isonline_ag)"];
                    var lsfDisplay = searchResult.values["GROUP(custitem_isonline_lsf)"];
                    var lskDisplay = searchResult.values["GROUP(custitem_isonline_lsk)"];
                    var lsgDisplay = searchResult.values["GROUP(custitem_isonline_lsg_fitness)"];
                    var rbkDisplay = searchResult.values["GROUP(custitem_isonline_rbk)"];
                    var b2bDisplay = searchResult.values["GROUP(custitem_isonline_b2b)"];
                    var kswDisplay = searchResult.values["GROUP(custitem_isonline_ksw)"];
                    var pgDisplay = searchResult.values["GROUP(custitem_isonline_progear)"];
                    if (recordType && recordId) {
                        var itemRecord = record.load({
                            type: recordType,
                            id: recordId
                        });

                        //Set AG Display OFF
                        if(agDisplay == true || agDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_ag', false);
                        }

                        //Set LSF Display OFF
                      /*  if(lsfDisplay == true || lsfDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_lsf', false);
                        }

                        //Set LSK Display OFF
                        if(lskDisplay == true || lskDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_lsk', false);
                        } */

                        //Set LSG Display OFF
                        if(lsgDisplay == true || lsgDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_lsg_fitness', false);
                        }

                        //Set RBK Display OFF
                        if(rbkDisplay == true || rbkDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_rbk', false);
                        }

                        //Set B2B Display OFF
                        if(b2bDisplay == true || b2bDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_b2b', false);
                        }

                        //Set KSW Display OFF
                        if(kswDisplay == true || kswDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_ksw', false);
                        }

                        //Set PG Display OFF
                        if(pgDisplay == true || pgDisplay == 'T'){
                            itemRecord.setValue('custitem_isonline_progear', false);
                        }

                        //Save Item Record
                        var itemId = itemRecord.save({ignoreMandatoryFields : true});
                        log.debug('itemId', itemId);

                    }
                }

            } catch (e) {
                log.debug('map Exception', e.message);
            }
        }

        function getRecordType(itemType) {
            try {
                if (itemType == 'InvtPart') {
                    return 'inventoryitem';
                }
                else if (itemType == 'Kit') {
                    return 'kititem';
                }
            }
            catch (e) {
                log.error('getRecordType Exception', e.message);
            }
        }
        return {
            getInputData: getInputData,
            map: map
        };
    });

