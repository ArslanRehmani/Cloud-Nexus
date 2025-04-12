/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/runtime'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{runtime} runtime
 */
    (log, record, search, runtime) => {

        const getInputData = (inputContext) => {
            var title = 'getInputData[::]';
            try {
                var shippingBatchParam = runtime.getCurrentScript().getParameter({
                    name: 'custscript_gfl_shipping_batch'
                });
                log.debug({
                    title: 'shippingBatchParam',
                    details: shippingBatchParam
                });
                var searchResults = search.load({
                    id: 'customsearch_airroad_specalised_exporter'
                });
                var IfColumn = search.createColumn({name: "custrecord_avt_ifs_record_transid", label: "IF"});
                searchResults.columns.push(IfColumn);
                if(shippingBatchParam){

                    var filter = searchResults.filters;
    
                    var mySearchFilter = search.createFilter({
                        name: "custbody_avt_ifs_shipping_batch",
                        join: "CUSTRECORD_AVT_IFS_RECORD_TRANSID",
                        label: "Shipping Batch",
                        operator: 'is',
                        values: shippingBatchParam
                    });
    
                    filter.push(mySearchFilter);
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return searchResults || [];
            // return [];
            // return [{ "recordType": "customrecord_avt_ifs_record", "id": "330726", "values": { "internalid": { "value": "330726", "text": "330726" }, "created": "9/8/2024 8:59 AM", "custrecord_avt_ifs_record_transid": { "value": "36185307", "text": "Item Fulfillment #706259" }, "formulatext": "CARTON (AEX)", "custrecord_avt_ifs_total_packages": "1", "custrecord_avt_ifs_total_weight": "45", "custrecord_avt_ifs_total_volume": "", "custrecord_avt_ifs_total_length": "213", "custrecord_avt_ifs_total_width": "37", "custrecord_avt_ifs_total_height": "16", "custrecord_avt_ifs_item_package_desc": "CSS010a", "custrecord_avt_ifs_special_instructions1": "", "custrecord_avt_ifs_special_instructions2": "SO718666 CSS010", "custrecord_avt_ifs_special_instructions3": "0407907928", "shipaddress1.CUSTRECORD_AVT_IFS_RECORD_TRANSID": ". 36 Burleigh Street" } }];
        }

        const map = (mapContext) => {
            var title = 'map[::]';
            try {
                var data = JSON.parse(mapContext.value);
                log.debug({
                    title: 'data',
                    details: data
                });
                
                var IfId = data.values.custrecord_avt_ifs_record_transid.value;
                // Submit Item Fulfillment fields like status, AVT Cubiic - Import Status and AVT Cubiic - Import Datetime
                record.submitFields({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: IfId,
                    values: {
                        'shipstatus': 'C', //Shipped
                        'custbody_avt_cubiic_im_status': 3,//Success (CSV)
                        'custbody_avt_cubiic_im_datetime': new Date(), //today date
                    }
                });
                
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        const reduce = (reduceContext) => {

        }

        const summarize = (summaryContext) => {

        }

        return {
            getInputData,
            map
            // reduce,
            // summarize
        }

    });
