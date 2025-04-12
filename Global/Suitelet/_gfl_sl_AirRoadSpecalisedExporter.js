/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (log, record, search, serverWidget) => {

        const onRequest = (scriptContext) => {
            var title = 'onRequest[::]';
            try {
                if (scriptContext.request.method === 'GET') {

                    var searchResults = search.load({
                        id: 3876
                    });
    
                    var form = serverWidget.createForm({
                        title: 'AirRoad Specalised Exporter'
                    });
                    var shippingBatch = form.addField({
                        id: 'custpage_shippingbatch',
                        type: serverWidget.FieldType.TEXT,
                        label: 'Wave Number'
                    });
    
                    var shippingBatchParam = scriptContext.request.parameters.shippingBatch;
    
                    log.debug({
                        title: 'shippingBatchParam',
                        details: shippingBatchParam
                    });
    
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
    
                        shippingBatch.defaultValue = shippingBatchParam;
                    }
                    
                    
                    form.clientScriptFileId = 27733370;
                    form.addButton({ id: "custpage_download", label: "Download", functionName: "downloadSaveSearchData()" });
    
                    // Add a sublist to the form
                    var sublist = form.addSublist({
                        id: 'custpage_sub_airroad_specalised_exporter',
                        type: serverWidget.SublistType.LIST,
                        label: 'AirRoad Specalised Exporter List'
                    });
                    // sublist.addField({
                    //     id: 'custpage_select',
                    //     type: serverWidget.FieldType.CHECKBOX,
                    //     label: 'Select'
                    // });
    
                    // Get columns and add them as headers to the sublist
                    var columns = searchResults.columns;
                    for (var i = 0; i < columns.length; i++) {
                        var uniqueFieldId = 'custpage_' + columns[i].name + '_' + i; // Ensure unique ID for each field
                        sublist.addField({
                            id: uniqueFieldId,
                            type: serverWidget.FieldType.TEXT,
                            label: columns[i].label
                        });
                    }
    
                    // Run the search and add rows to the sublist
                    var searchResultCount = 0;
                    searchResults.run().each(function (result) {
                        for (var m = 0; m < columns.length; m++) {
                            var column = columns[m];
    
    
                            var value = result.getValue(column) || ''; // Get the actual value from the search result
                            var textValue = result.getText(column) || '';
                            if (column.name == 'custrecord_avt_ifs_record_transid') {
                                value = result.getText(column) || '';
                            }
    
                            if (!!textValue) {
    
                                value = textValue;
                            }
                            // Only set the value if it's not null, undefined, or an empty string
                            if (value !== '') {
                                var uniqueFieldId = 'custpage_' + column.name + '_' + m; // Ensure unique ID for each field
                                sublist.setSublistValue({
                                    id: uniqueFieldId,
                                    line: searchResultCount,
                                    value: value
                                });
                            }
                        }
                        searchResultCount++;
                        return true; // Continue to the next result
                    });
                    // Display the form
                    scriptContext.response.writePage(form);
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return { onRequest }

    });
