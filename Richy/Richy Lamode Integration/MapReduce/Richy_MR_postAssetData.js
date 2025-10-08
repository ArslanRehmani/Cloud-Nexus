/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/https', 'N/log', '../lib/lamode_lib.js'], (search, https, log, lamodeLIB) => {

    const getInputData = () => {
        // return search.create({
        //     type: "customrecord_ncfar_asset",
        //     filters: [
        //         ["internalid", "anyof", "918"],
        //         "AND",
        //         ["custrecord_assettype", "anyof", "3"]
        //     ],
        //     columns: [
        //         "name",
        //         "altname",
        //         "custrecord_assetdescr",
        //         "custrecord_assettype",
        //         "custrecord_assetstatus"
        //     ]
        // });
        try {
            const paramJson = runtime.getCurrentScript().getParameter({
                name: 'custscript_assetdata_json'
            });

            if (!paramJson) {
                log.error('Missing Parameter');
                return [];
            }

            const data = JSON.parse(paramJson);

            log.debug('Parsed Input Data', data);

            return [data];

        } catch (e) {
            log.error('Error in getInputData', e.message);
            return [];
        }
    };

    const map = (context) => {
        try {
            const result = JSON.parse(context.value);
            const values = result.values;

            // let createAsset = lamodeLIB.REQUESTS.createAssetInLamode(values);
            let createAsset = lamodeLIB.REQUESTS.createAssetInLamode(result);



        } catch (e) {
            log.error('Error in map stage', e);
        }
    };

    const reduce = (context) => {

    };

    const summarize = (summary) => {
        if (summary.inputSummary.error) {
            log.error('Input Error', summary.inputSummary.error);
        }

        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error('Map Error for key: ' + key, error);
            return true;
        });
    };

    return { getInputData, map, reduce, summarize };
});
