/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/search', 'N/file', 'N/task'], function (search, file, task) {

    function onRequest(context) {
        var title = 'onRequest[::]';
        try {
            if (context.request.method === 'GET') {
                var shippingBatchParam = context.request.parameters.data;
                log.debug({
                    title: 'shippingBatchParam====',
                    details: shippingBatchParam
                });

                // Load the saved search
                var searchResults = search.load({
                    id: 'customsearch_airroad_specalised_exporter' // Your saved search ID here
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
                }


                // Create an array to hold the CSV data
                var csvContent = [];
                var columns = searchResults.columns;

                // Add header row
                var headerRow = [];
                for (var i = 0; i < columns.length; i++) {
                    headerRow.push(columns[i].label);
                }

                // Add the hard-coded columns to the header row
                // headerRow.push('Pickup requested', 'Service Level', 'Item Row Description');

                csvContent.push(headerRow.join(','));

                // Add data rows
                searchResults.run().each(function (result) {
                    var row = [];
                    for (var m = 0; m < columns.length; m++) {
                        var column = columns[m];
                        var textValue = result.getText(column) || '';
                        var value = textValue || result.getValue(column) || '';
                        row.push('"' + value.replace(/"/g, '""') + '"'); // Escape quotes in CSV format
                    }

                    // Add the hard-coded values to the data rows
                    //  row.push('"Yes"', '"T1"', '"Cartons"');

                    csvContent.push(row.join(','));
                    return true; // Continue to the next result
                });

                // Convert CSV content to a string
                var csvString = csvContent.join('\n');
                
                                // Create a file in NetSuite
                                var excelFile = file.create({
                                    name: 'AirRoad Specalised Exporter.csv',
                                    fileType: file.Type.CSV,
                                    contents: csvString,
                                    description: 'Exported search results',
                                    encoding: file.Encoding.UTF8
                                });
                
                                // Set the file to be downloadable
                                context.response.writeFile({
                                    file: excelFile,
                                    isInline: false
                                });
                                
                                // Call map Reduce To update Item Fulfillment Status, AVT Cubiic - Import Status and AVT Cubiic - Import Datetime fields
                                var mapReduce = task.create({
                                    taskType: task.TaskType.MAP_REDUCE,
                                    scriptId: 'customscript_gfl_mr_eirroadspecalised',
                                    deploymentId: 'customdeploy_gfl_mr_eirroadspecalised',
                                    params : {
                                        'custscript_gfl_shipping_batch': shippingBatchParam
                                    }
                                });
                                // Submit the map/reduce task
                                var mapReduceId = mapReduce.submit();
                                log.debug({
                                    title: 'mapReduceId',
                                    details: mapReduceId
                                });

            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }

    }

    return {
        onRequest: onRequest
    };
});
