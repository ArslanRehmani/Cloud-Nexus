var _DEF_LIST_CALC_TARGET_ITEM_TYPES = ['InvtPart', 'Assembly', 'Kit', 'NonInvtPart'];

function calculteWeightVolumeIF() {
    calculateWeightIFV2();
    calculateCubicIFV2();
}

function calculteWeightVolumeSO() {
    calculateWeightSOV2();
    calculateCubicSOV2();
}

/**
 * Calculate total weight of items
 * This works on Item Fulfillment and Invoice
 */
function calculateWeightIFV2() {
    /** @type ClientScriptData */
    var clientScriptData = window.AvtClientScriptData;

    var recordType = nlapiGetRecordType();
    var recordTypeCreatedFrom = null;
    var recordIdCreatedFrom = nlapiGetFieldValue('createdfrom');
    if(recordIdCreatedFrom){
        recordTypeCreatedFrom = nlapiLookupField('transaction', recordIdCreatedFrom, 'recordtype');
    }

    var entityId = nlapiGetFieldValue('entity');
    if(!entityId && recordTypeCreatedFrom !== 'transferorder' ) {
        alert('Please select a Customer before calculate the weight');
        return;
    }

    var configRecord = clientScriptData.configRecord;
    var ifsWeightUnitId = configRecord.getFieldValue('custrecord_avt_ifs_conf_unit_measure') || 1;

    /** @type {{itemId: number, quantity: number}[]} */
    var items = [];

    var count = nlapiGetLineItemCount('item');
    for (var x = 1; x <= count; x++) {
        if (nlapiGetLineItemValue('item', 'itemreceive', x) === 'T' || recordType === 'invoice') {
            if(nlapiGetLineItemValue('item', 'itemtype', x) && _DEF_LIST_CALC_TARGET_ITEM_TYPES.indexOf(nlapiGetLineItemValue('item', 'itemtype', x)) >= 0
                && nlapiGetLineItemValue('item', 'item', x) && Number(nlapiGetLineItemValue('item', 'quantity', x)) > 0){

                items.push({
                    itemId: parseInt(nlapiGetLineItemValue('item', 'item', x)),
                    quantity: parseFloat(nlapiGetLineItemValue('item', 'quantity', x))
                });
            }
        }
    }

    if(items.length <= 0){
        // nothing to calculate
        return;
    }

    var weightVariance = parseFloat(configRecord.getFieldValue('custrecord_avt_ifs_weight_variance')) || 0;
    weightVariance = weightVariance / 100;

    var result = calculateTotalWeighAndCubic(items, ifsWeightUnitId);
    var totalWeight = result.totalWeight * (1 + weightVariance);

    var freightTypeId = parseInt(nlapiGetFieldValue('custbody_avt_ifs_freight_type'));
    if(freightTypeId) {
        var weightOnFreightType = parseFloat( nlapiLookupField('customrecord_avt_ifs_freight_type', freightTypeId, 'custrecordavt_ifs_freighttype_weight', false)) || 0;
        totalWeight += weightOnFreightType;
    }
    nlapiSetFieldValue('custbody_avt_ifs_total_weight', Math.round(totalWeight * 100) / 100, true, true);
}


function calculateWeightSOV2() {
    /** @type ClientScriptData */
    var clientScriptData = window.AvtClientScriptData;

    var entityId = nlapiGetFieldValue('entity');
    if (!entityId){
        alert('Please select a Customer before calculate the weight');
        return;
    }

    var configRecord = clientScriptData.configRecord;
    var ifsWeightUnitId = configRecord.getFieldValue('custrecord_avt_ifs_conf_unit_measure') || 1;

    /** @type {{itemId: number, quantity: number}[]} */
    var items = [];

    var count = nlapiGetLineItemCount('item');
    for (var x = 1; x <= count; x++) {
        if (nlapiGetLineItemValue('item', 'isclosed', x) !== 'T'){
            if(nlapiGetLineItemValue('item', 'itemtype', x) && _DEF_LIST_CALC_TARGET_ITEM_TYPES.indexOf(nlapiGetLineItemValue('item', 'itemtype', x)) >= 0
                && nlapiGetLineItemValue('item', 'item', x) && Number(nlapiGetLineItemValue('item', 'quantity', x)) > 0){
                items.push({
                    itemId: parseInt(nlapiGetLineItemValue('item', 'item', x)),
                    quantity: parseFloat(nlapiGetLineItemValue('item', 'quantity', x))
                });
            }
        }
    }

    if(items.length <= 0){
        // nothing to calculate
        return;
    }

    var weightVariance = parseFloat(configRecord.getFieldValue('custrecord_avt_ifs_weight_variance')) || 0;
    weightVariance = weightVariance / 100;

    var result = calculateTotalWeighAndCubic(items, ifsWeightUnitId);
    var totalWeight = result.totalWeight * (1 + weightVariance);

    var freightTypeId = parseInt(nlapiGetFieldValue('custbody_avt_ifs_freight_type'));
    if (freightTypeId) {
        var weightOnFreightType = parseFloat(nlapiLookupField('customrecord_avt_ifs_freight_type', freightTypeId, 'custrecordavt_ifs_freighttype_weight', false)) || 0;
        totalWeight += weightOnFreightType;
    }

    nlapiSetFieldValue('custbody_avt_ifs_total_weight', Math.round(totalWeight * 100) / 100 , true, true);
}

/**
 * Calculate total cubic volume of items
 * This works on Item Fulfillment and Invoice
 */
function calculateCubicIFV2() {
    /** @type ClientScriptData */
    var clientScriptData = window.AvtClientScriptData;

    var recordType = nlapiGetRecordType();
    var recordTypeCreatedFrom = null;
    var recordIdCreatedFrom = nlapiGetFieldValue('createdfrom');
    if(recordIdCreatedFrom){
        recordTypeCreatedFrom = nlapiLookupField('transaction', recordIdCreatedFrom, 'recordtype');
    }

    var entityId = nlapiGetFieldValue('entity');
    if (!entityId && recordTypeCreatedFrom !== 'transferorder'){
        alert('Please select a Customer before calculate the cubic volume');
        return;
    }

    var configRecord = clientScriptData.configRecord;
    var ifsWeightUnitId = configRecord.getFieldValue('custrecord_avt_ifs_conf_unit_measure') || 1;

    /** @type {{itemId: number, quantity: number}[]} */
    var items = [];

    var count = nlapiGetLineItemCount('item');
    for (var x = 1; x <= count; x++) {
        if (nlapiGetLineItemValue('item', 'itemreceive', x) === 'T' || recordType === 'invoice') {
            if(nlapiGetLineItemValue('item', 'itemtype', x) && _DEF_LIST_CALC_TARGET_ITEM_TYPES.indexOf(nlapiGetLineItemValue('item', 'itemtype', x)) >= 0
                && nlapiGetLineItemValue('item', 'item', x) && Number(nlapiGetLineItemValue('item', 'quantity', x)) > 0) {
                items.push({
                    itemId: parseInt(nlapiGetLineItemValue('item', 'item', x)),
                    quantity: parseFloat(nlapiGetLineItemValue('item', 'quantity', x))
                });
            }
        }
    }

    if(items.length <= 0){
        // nothing to calculate
        return;
    }

    var cubicVariance = parseFloat(configRecord.getFieldValue('custrecord_avt_ifs_cubic_variance')) || 0;
    cubicVariance = cubicVariance / 100;

    var result = calculateTotalWeighAndCubic(items, ifsWeightUnitId);
    var totalCubic = result.totalCubic * (1 + cubicVariance);

    nlapiSetFieldValue('custbody_avt_ifs_total_volume', Math.round(totalCubic * 10000) / 10000, true, true);
}

function calculateCubicSOV2() {
    /** @type ClientScriptData */
    var clientScriptData = window.AvtClientScriptData;

    var entityId = nlapiGetFieldValue('entity');
    if (!entityId){
        alert('Please select a Customer before calculate the cubic volume');
        return;
    }

    var configRecord = clientScriptData.configRecord;
    var ifsWeightUnitId = configRecord.getFieldValue('custrecord_avt_ifs_conf_unit_measure') || 1;

    /** @type {{itemId: number, quantity: number}[]} */
    var items = [];

    var count = nlapiGetLineItemCount('item');
    for (var x = 1; x <= count; x++) {
        if (nlapiGetLineItemValue('item', 'isclosed', x) !== 'T') {
            if(nlapiGetLineItemValue('item', 'itemtype', x) && _DEF_LIST_CALC_TARGET_ITEM_TYPES.indexOf(nlapiGetLineItemValue('item', 'itemtype', x)) >= 0
                && nlapiGetLineItemValue('item', 'item', x) && Number(nlapiGetLineItemValue('item', 'quantity', x)) > 0) {
                items.push({
                    itemId: parseInt(nlapiGetLineItemValue('item', 'item', x)),
                    quantity: parseFloat(nlapiGetLineItemValue('item', 'quantity', x))
                });
            }
        }
    }

    if(items.length <= 0){
        // nothing to calculate
        return;
    }

    var cubicVariance = parseFloat(configRecord.getFieldValue('custrecord_avt_ifs_cubic_variance')) || 0;
    cubicVariance = cubicVariance / 100;

    var result = calculateTotalWeighAndCubic(items, ifsWeightUnitId);
    var totalCubic = result.totalCubic * (1 + cubicVariance);

    nlapiSetFieldValue('custbody_avt_ifs_total_volume', Math.round(totalCubic * 10000) / 10000, true, true);
}

/**
 * Calculate total weight and volume in units set on configuration. Variance is not included.
 * @param {{itemId: number, quantity: number}[]} items
 * @param {number} ifsDefaultWeightUnitId
 * @return {{totalWeight: number, totalCubic: number}}
 */
function calculateTotalWeighAndCubic(items, ifsDefaultWeightUnitId) {
    var logFunctionName = 'calculateTotalWeighAndCubic';
    Log(logFunctionName, 'Start function. items:' + JSON.stringify(items));

    /** @type {{itemId: number, quantity: number, unitWeight: number, weightUnitId: number, unitCubicVolume: number}[]} - Add elements in this object */
    var itemsWithWeightAndCubic = JSON.parse(JSON.stringify(items));  // Copy not to destroy original object

    var itemIds = items.map(function (value) { return value.itemId; });

    var filters = [];
    filters[0] = new nlobjSearchFilter('internalid', null, 'anyof', itemIds, null);
    var columns = [];
    columns[0] = new nlobjSearchColumn('weight', null, null);
    columns[1] = new nlobjSearchColumn('weightunit', null, null);
    columns[2] = new nlobjSearchColumn('custitem_avt_ifs_cubic_volume', null, null);
    var columnNames = {
        weight: columns[0],
        weightUnitId: columns[1],
        cubicVolume: columns[2]
    };
    var search = nlapiCreateSearch('item', filters, columns);
    var searchResultSet = search.runSearch();

    var cursor = 0;
    var loadedLength = 0;
    do {
        var searchResult = searchResultSet.getResults(cursor, cursor + 1000);
        loadedLength = searchResult.length;
        cursor += loadedLength;

        for (var s = 0; s < searchResult.length; s++) {
            var res = searchResult[s];
            // process res

            var itemId = parseInt(res.getId());
            var unitWeight = parseFloat(res.getValue(columnNames.weight)) || 0;
            var weightUnitId = parseInt(res.getValue(columnNames.weightUnitId)) || 0;
            var unitCubicVolume = parseFloat(res.getValue(columnNames.cubicVolume)) || 0;

            for (var i=0; i < itemsWithWeightAndCubic.length; i++) {
                if (itemsWithWeightAndCubic[i].itemId === itemId) {
                    // Add elements
                    itemsWithWeightAndCubic[i].unitWeight = unitWeight;
                    itemsWithWeightAndCubic[i].weightUnitId= weightUnitId;
                    itemsWithWeightAndCubic[i].unitCubicVolume = unitCubicVolume;
                }
            }
        }
    } while (loadedLength >= 1000);

    var unitIdsUsed = itemsWithWeightAndCubic.reduce(function (previousValue, currentValue) {
        if (previousValue.indexOf(currentValue.weightUnitId) < 0) {
            previousValue.push(currentValue.weightUnitId)
        }
        return previousValue;
    }, []);

    var coefficients = getWeightConversionCoefficients(unitIdsUsed, ifsDefaultWeightUnitId);

    var returnObj = itemsWithWeightAndCubic.reduce(function (previousValue, currentValue) {
        var coefficient = coefficients[currentValue.weightUnitId];
        var weight = (currentValue.unitWeight * currentValue.quantity) * coefficient;
        var cubic = currentValue.unitCubicVolume * currentValue.quantity;
        previousValue.totalWeight += weight;
        previousValue.totalCubic += cubic;
        return previousValue;
    }, {totalWeight: 0, totalCubic: 0});

    Log(logFunctionName, 'Finish function. Return:' + JSON.stringify(returnObj));
    return returnObj;
}

/**
 * @param {number[]} fromWeightUnitIds
 * @param {number} toWeightUnitId
 * @return object.<number,number> - object[weightUnitId] -> conversionCoefficient
 */
function getWeightConversionCoefficients(fromWeightUnitIds, toWeightUnitId) {
    var logFunctionName = 'getWeightConversionCoefficients';
    Log(logFunctionName, "Start function. fromWeightUnitIds:'" + JSON.stringify(fromWeightUnitIds) + " toWeightUnitId:'" + JSON.stringify(toWeightUnitId) + "'");

    var coefficients = {0: 1};  // For item does not have Weight Unit
    var fromWeightUnitIdsWithoutZero = fromWeightUnitIds.reduce(function (previousValue, currentValue) {
        if (currentValue) {  // Remove 0
            previousValue.push(currentValue);
        }
        return previousValue;
    }, []);
    var fields = fromWeightUnitIdsWithoutZero.map(function (value) { return 'custrecord_avt_unit_conv_to_' + value });

    var searchResults = nlapiLookupField('customrecord_avt_unitweight', toWeightUnitId, fields, false);

    for (var i=0; i < fromWeightUnitIdsWithoutZero.length; i++) {
        var weightUnitId = fromWeightUnitIdsWithoutZero[i];
        var coefficient = parseFloat(searchResults[fields[i]]) || 1;

        coefficients[weightUnitId] = 1 / coefficient;
    }

    Log(logFunctionName, 'Finish function. Return:' + coefficients);
    return coefficients;
}

function AfterSaveSo() {
    StartTime("AfterSaveSo");

    try{
        var currentContext = nlapiGetContext();
        if (currentContext.getExecutionContext() == "userinterface") {

            StartTime("customform");
            var customForm = nlapiGetFieldValue('customform');
            //Log("customForm", customForm);
            EndTime("customform");

            StartTime("customForm2");

            if (customForm == null || customForm == '') {
                var soid = nlapiGetRecordId();
                var record = LoadRecord(soid);
                //nlapiGetNewRecord
                if (record != null && record != '') {
                    customForm = record.getFieldValue('customform');
                }
            }
            //Log("customForm2", customForm);
            EndTime("customForm2");

            var subsidiaryId = nlapiGetFieldValue('subsidiary');
            if (subsidiaryId == null) {
                subsidiaryId = 1;
            }
            var location = nlapiGetFieldValue('location');
            if (location == null) {
                location = 1;
            }
            StartTime("configObjectApi");
            var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
            //Log("custrecord_avt_ifs_customform_id_so", configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_so') );
            EndTime("configObjectApi");

            if (configObjectApi != null && configObjectApi != '') {
                var listOfCustomFormSo = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_so');
                if (listOfCustomFormSo != null && listOfCustomFormSo != '') {
                    var arrayOfCustomFormSo = listOfCustomFormSo.split(';');
                    StartTime("arrayOfCustomFormSo");
                    for (var i = 0; i < arrayOfCustomFormSo.length; i++) {
                        if (arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm) {
                            var isAutoImportSo = (configObjectApi.getFieldValue('custrecord_avt_ifs_auto_import_so') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_auto_import_so') : "";
                            if (isAutoImportSo != '' && isAutoImportSo == 'T') {
                                var record = LoadRecord(nlapiGetRecordId());
                                if (record != null) {
                                    //var isMultiSplit = ( configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') : "F";
                                    var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                    if (isMultiSplit != null && isMultiSplit == 'F') {
                                        var connoteNum = record.getFieldValue('custbody_avt_ifs_connote_num');
                                        if (connoteNum == null || connoteNum == '') {
                                            CallScript('customscript_avt_ifs_import', nlapiGetRecordId());
                                        }
                                    }
                                } else {
                                    CallScript('customscript_avt_ifs_import', nlapiGetRecordId());
                                }
                            }
                            break;
                        }
                    }
                    EndTime("arrayOfCustomFormSo");
                }
            }
        }
    } catch (e) {
        Log('ERROR in AfterSaveSo', e);
    }
    EndTime("AfterSaveSo");
}


function CheckAutoImport(customForm, currentContext) {
    if (customForm == null || customForm == '') {
        var soid = nlapiGetRecordId();
        var record = LoadRecord(soid);
        if (record != null && record != '') {
            customForm = record.getFieldValue('customform');
        }
    }
    Log("customForm 2", customForm);

    var subsidiaryId = nlapiGetFieldValue('subsidiary');
     if (subsidiaryId == null) {
         subsidiaryId = 1;
     }

     var location = 1;
     var count = nlapiGetLineItemCount('item');
    for (var x = 1; x <= count; x++) {
        if (nlapiGetLineItemValue('item', 'itemreceive', x) == 'T') {
            location = nlapiGetLineItemValue('item', 'location', x);
            if (location != null && location != '') {
                break;
            } else {
                location = 1;
            }
        }
    }

    var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
    Log("custrecord_avt_ifs_customform_id_if", configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_if') );

    var listOfCustomFormIf = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_if');
    if (listOfCustomFormIf != null && listOfCustomFormIf != '') {
        var arrayOfCustomFormSo = listOfCustomFormIf.split(';');
        for ( var i = 0; i < arrayOfCustomFormSo.length; i++) {
            if ( arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm ) {
                var typeRecord = nlapiGetRecordType();
                Log("typeRecord", typeRecord);
                var isAutoImportIf = (configObjectApi.getFieldValue('custrecord_avt_ifs_auto_import_if') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_auto_import_if') : "";
                Log("isAutoImportIf", isAutoImportIf);
                if (isAutoImportIf != '' && isAutoImportIf == 'T' && typeRecord == 'itemfulfillment' ) {
                    var record = LoadRecord(nlapiGetRecordId());
                    var isCustomerPickup = (record && record.getFieldValue('custbody_avt_ifs_customer_pickup') == 'T') ? true : false;
                    if (record != null && !isCustomerPickup) {
                        //new feature cartdrige
                        var isMarkedShipped = configObjectApi.getFieldValue('custrecord_avt_ifs_marked_shipped');
                        var shipstatus = record.getFieldValue('shipstatus');
                        Log("isMarkedShipped", isMarkedShipped);
                        Log("shipstatus", shipstatus);
                        if (isMarkedShipped == 'F' ||  ( isMarkedShipped == 'T' && shipstatus == 'B' ) ) {
                            var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                            Log("isMultiSplit", isMultiSplit);
                            var doNotAutoImport = record.getFieldValue('custbody_avt_ifs_do_not_auto_import');
                            if (isMultiSplit != null && isMultiSplit == 'F' && doNotAutoImport != 'T' ) {
                                var isReadToIfs = ( record.getFieldValue('custbody_avt_ifs_read_to_ifs') != null) ? record.getFieldValue('custbody_avt_ifs_read_to_ifs') : "T";
                                Log("isReadToIfs", isReadToIfs);
                                if (isReadToIfs != null && isReadToIfs == 'F') {
                                    Log("CallScript");
                                    CallScript('customscript_avt_ifs_import', nlapiGetRecordId(), isAutoImportIf, currentContext );
                                    Log("End CallScript");
                                }
                            } /* else {
                                 CallScript('customscript_avt_ifs_import', nlapiGetRecordId(), isAutoImportIf);
                             }*/
                        }
                    }
                }
            }
        }
    }
}

/**
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {void}
 */
function BeforeSaveIf(type) {
    var logFunctionName = 'BeforeSaveIf';
    Log(logFunctionName, 'Start function. type:' + type);

    var lineItemCount,line;

    if (type) {
        type = type.toString();
    }

    try {
        var newRecord = nlapiGetNewRecord();
        var customFormId = parseInt(newRecord.getFieldValue('customform'));
        var subsidiaryId = parseInt(newRecord.getFieldValue('subsidiary')) || 1;
        var location = parseInt(newRecord.getFieldValue('location')) || 0;
        if (!location) {
            // Check line level location fields
            lineItemCount = newRecord.getLineItemCount('item');
            for (line = 1; line <= lineItemCount; line++) {
                if (newRecord.getLineItemValue('item', 'itemreceive', line) === 'T') {
                    location = newRecord.getLineItemValue('item', 'location', line);
                    if (location) {
                        break;
                    }
                }
            }
        }
        if (!location) {
            location = 1;
        }

        Log(logFunctionName, 'subsidiary:' + subsidiaryId + ' location:' + location);
        var configRecord = getConfigWithSubsidiary(subsidiaryId, location);

        // Check Item Fulfillment form ID
        var ifsEnabledFormIdsString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_if');
        var ifsEnabledFormIds = ifsEnabledFormIdsString.split(';').map(function (value) {
            return parseInt(value.trim())
        });
        if (ifsEnabledFormIds.indexOf(customFormId) < 0) {
            Log(logFunctionName, 'Finish function. Form is not IFS enabled form. customFormId:' + customFormId);
            return;
        }

        var isAutoCalculateWeighAndCubicOnItemFulfillmentEnabled = configRecord.getFieldValue('custrecord_avt_ifs_conf_auto_wv_calc_if') === 'T';
        if (type === 'create' && isAutoCalculateWeighAndCubicOnItemFulfillmentEnabled) {
            // Populate "TOTAL WEIGHT (KG)" (custbody_avt_ifs_total_weight) and "TOTAL VOLUME (M3)" (custbody_avt_ifs_total_volume)
            var currentTotalWeight = parseFloat(newRecord.getFieldValue('custbody_avt_ifs_total_weight')) || 0;
            var currentTotalCubic = parseFloat(newRecord.getFieldValue('custbody_avt_ifs_total_volume')) || 0;
            if (!currentTotalWeight || !currentTotalCubic) {
                /** @type {{itemId: number, quantity: number}[]} */
                var items = [];
                lineItemCount = newRecord.getLineItemCount('item');
                for (line = 1; line <= lineItemCount; line++) {
                    if (newRecord.getLineItemValue('item', 'itemreceive', line) === 'T') {
                        var itemId = parseInt(newRecord.getLineItemValue('item', 'item', line));
                        var quantity = parseFloat(newRecord.getLineItemValue('item', 'quantity', line));
                        items.push({
                            itemId: itemId,
                            quantity: quantity
                        })
                    }
                }

                var ifsDefaultWeightUnitId = parseInt(configRecord.getFieldValue('custrecord_avt_ifs_conf_unit_measure'));
                var totalWeightAndCubic = calculateTotalWeighAndCubic(items, ifsDefaultWeightUnitId);

                var weightVariance = parseFloat(configRecord.getFieldValue('custrecord_avt_ifs_weight_variance')) || 0;
                weightVariance = weightVariance / 100;
                var cubicVariance = parseFloat(configRecord.getFieldValue('custrecord_avt_ifs_cubic_variance')) || 0;
                cubicVariance = cubicVariance / 100;

                var numberOfPackages = parseInt(newRecord.getFieldValue('custbody_avt_ifs_total_packages')) || 1;
                if (!currentTotalWeight) {
                    var totalWeightWithVariance =totalWeightAndCubic.totalWeight * (1 + weightVariance);
                    newRecord.setFieldValue('custbody_avt_ifs_total_weight', (Math.round(totalWeightWithVariance * 100) / 100).toString());
                    var weightPerPackageWithVariance = totalWeightWithVariance / numberOfPackages;
                    newRecord.setFieldValue('custbody_avt_ifs_total_weight_pkg', (Math.round(weightPerPackageWithVariance * 1000) / 1000).toString());
                }
                if (!currentTotalCubic) {
                    var totalCubicWithVariance = totalWeightAndCubic.totalCubic * (1 + cubicVariance);
                    newRecord.setFieldValue('custbody_avt_ifs_total_volume', (Math.round(totalCubicWithVariance * 10000) / 10000).toString());
                    var volumePerPackageWithVariance = totalCubicWithVariance / numberOfPackages;
                    newRecord.setFieldValue('custbody_avt_ifs_total_volume_pkg', (Math.round(volumePerPackageWithVariance * 100000) / 100000).toString());
                }
            }
        }
    } catch (/** @type nlobjError */ e) {
        nlapiLogExecution('ERROR', logFunctionName, "Unhandled error occurred. code:'" + e.getCode() + " details:'" + e.getDetails() + "'" );
    }

    Log(logFunctionName, 'Finish function.');
}

function AfterSaveIf() {
    try{

        Log("AfterSaveIf");
        var currentContext = nlapiGetContext();

        if (currentContext != null && currentContext.getExecutionContext() == "userinterface") {
            var customForm = nlapiGetFieldValue('customform');
            Log("customForm", customForm);
            CheckAutoImport(customForm, currentContext.getExecutionContext());
        }

        // populate account number field if carrier is populated
        // account field is sourced from carrier record, however it is not sometimes
        // [Issue] account number is kept blank even carrier field is populated [Tea Too](May 2016)
        var newRecord = nlapiGetNewRecord();
        var carrierId = newRecord.getFieldValue('custbody_avt_ifs_shipcarrier');
        var currentAccountNum = newRecord.getFieldValue('custbody_avt_ifs_accountno');
        if(carrierId && !currentAccountNum){
            var newAccountNum = nlapiLookupField('customrecord_avt_ifs_carrier', carrierId, 'custrecord_avt_ifs_accountno', false);
            if(newAccountNum){
                nlapiSubmitField(newRecord.getRecordType(), newRecord.getId(), 'custbody_avt_ifs_accountno', newAccountNum, false);
            }
        }

    } catch (e) {
        Log('ERROR in AfterSaveIf', e);
    }
    Log("END AfterSaveIf");
}

function BeforeSaveSO_FurnwareDorset() {
    try{
        var currentContext = nlapiGetContext();

        if (currentContext != null && currentContext.getExecutionContext() == "webstore") {
            Log("currentContext.getExecutionContext()", currentContext.getExecutionContext());

            var entityId = nlapiGetFieldValue('entity');
            Log("entity", entityId);

            UpdateDefaultDataForSO(entityId);

            //set to Sneder
            nlapiSetFieldValue('custbody_avt_ifs_charge_to', '1' );

            var extentionFreightNum = new Array();
            extentionFreightNum.push("");
            extentionFreightNum.push("_2");
            extentionFreightNum.push("_3");
            extentionFreightNum.push("_4");
            for ( var j = 0; j < extentionFreightNum.length; j++) {
                var freightType = nlapiGetFieldValue('custbody_avt_ifs_freight_type' + extentionFreightNum[j]);
                if (freightType != null && freightType != '' ) {
                    Log("freightType", freightType);
                    SetAvtIfsFreightType(nlapiGetFieldValue('custbody_avt_ifs_freight_type' + extentionFreightNum[j]) ,extentionFreightNum[j]);
                }
            }
        }
    } catch (e) {
        Log('ERROR in BeforeSaveSO_FurnwareDorset', e);
    }
}



function SetShipAddressToCustomer(record, recordId) {
    if ( record != null ) {
        var shipaddresslist = record.getFieldValue('shipaddresslist');
        Log('shipaddresslist', shipaddresslist + '.');
        if (shipaddresslist == null || shipaddresslist == '' ) {
             var entityId = record.getFieldValue('entity');
             Log('entityId', entityId);
             if (entityId != null && entityId != '') {
                 var customer = nlapiLoadRecord( 'customer', entityId );
                 if (customer != null && customer != '') {
                    var numberOfAddresses = customer.getLineItemCount('addressbook');
                    Log('numberOfAddresses', numberOfAddresses);
                    var flagHaveAddress = false;
                      for (var i=1; i <= numberOfAddresses; i++)  {
                          var defaultshipping = customer.getLineItemValue('addressbook','defaultshipping',i);
                          if ( defaultshipping == "T") {
                              record.setFieldValue('shipaddresslist' , customer.getLineItemValue('addressbook','id',i) );
                            flagHaveAddress = true;
                            Log('ADDRESS flagHaveAddress ', i);
                          }
                      }
                      if (!flagHaveAddress) {
                          if (numberOfAddresses > 0) {
                              record.setFieldValue('shipaddresslist' , customer.getLineItemValue('addressbook','id',1) );
                              Log('ADDRESS num 1 !');
                          }
                      }
                      Log('SAVE ADDRESS');
                    nlapiSubmitRecord(record, false, true);
                    record = LoadRecord(recordId);
                 }
             }
        }
    }
    return record;
}


function SetWeightToIfsPackage(record, configObjectApi, recordId) {
    if ( record != null ) {
        var recordDefaultUnitMeasure = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') : "1";
        Log("recordDefaultUnitMeasure",recordDefaultUnitMeasure);

        var ifsPackageRecords = GetIfsPackageRecord(record);
        if (ifsPackageRecords == null || ifsPackageRecords.length == 0) {
            ifsPackageRecords = new Array();
            var recordIfsPackage = initIfsPackageRecord( recordId );

            var count =  record.getLineItemCount('item');
            Log("count", count);
            var itemsWeight = 0;
            for (var x = 1; x <= count; x++) {

                var inventoryId = record.getLineItemValue( 'item', 'item' , x);
                var quantity = record.getLineItemValue( 'item', 'quantity' , x);
                //var isclosed = record.getLineItemValue( 'item', 'isclosed' , x);
                Log("inventoryId", inventoryId);

                var item =  LoadItemRecord(inventoryId);
                if (item != null) {
                    var weight = item.getFieldValue('weight');
                    if (weight != null && weight != "") {
                        var weightunit = item.getFieldValue('weightunit');
                        if (weightunit != null && weightunit != "") {
                            var coefConvert = nlapiLookupField('customrecord_avt_unitweight', recordDefaultUnitMeasure, 'custrecord_avt_unit_conv_to_' + weightunit , false);
                            var weightVariance = (configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') != null && configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') != '') ? configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') : "0";
                            if (weightVariance != 0) {
                                weightVariance = coefConvert * weight * quantity * weightVariance/ 100;
                            }
                            itemsWeight += CNULL( (coefConvert * weight * quantity) + CNULL(weightVariance) );
                        }
                    }
                }
            }
            recordIfsPackage.custrecord_avt_ifs_total_weight = formatStringToNumber(itemsWeight);

            var carrierDetails =  GetIfsShippingMethod(record);
            if (carrierDetails != null ) {
                recordIfsPackage.custrecord_avt_ifs_shipcarrier =  carrierDetails.carrierId;
                recordIfsPackage.custrecord_avt_ifs_shipservice =  carrierDetails.serviceId;
                recordIfsPackage.custrecord_avt_ifs_freight_type = carrierDetails.freightTypeId;
            } else {
                recordIfsPackage.custbody_avt_ifs_apply_leastcost = "T";
            }


            //specific to HotToner
            var configGlobal =  nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
            var bulkOrder = configGlobal.getFieldValue('custrecord_avt_ifs_confg_is_fulfil_order');
            Log("bulkOrder", bulkOrder);
            if (bulkOrder != null && bulkOrder == 'T') {
                var createdfrom = record.getFieldValue('createdfrom');
                Log("createdfrom", createdfrom);
                if ( createdfrom != null ) {
                    var soRecord = LoadRecord(createdfrom);
                    var customForm = soRecord.getFieldValue('customform');
                    Log("customForm", customForm);
                    if (customForm != null && customForm != '') {
                        try {
                            var filter = new Array();
                            filter [ filter.length ] = new nlobjSearchFilter( 'custrecord_avt_ifs_link_form_id', null, 'is', customForm);

                            var cols = new Array();
                            cols[ cols.length ] = new nlobjSearchColumn('custrecord_avt_ifs_link_sender');

                            var searchrecord = nlapiSearchRecord('customrecord_avt_ifs_link_sender_form', null, filter, cols );
                            Log("searchrecord ----- ", searchrecord.length);
                            if( searchrecord != null && searchrecord.length > 0 ) {
                                defaultSender = searchrecord[0].getValue('custrecord_avt_ifs_link_sender');
                                recordIfsPackage.custrecord_avt_ifs_sender_business =  defaultSender;
                                Log("defaultSender ----- ", defaultSender);
                            }
                        } catch(e1) {
                            Log("ERROR", e1);
                        }
                    }
                }
            }

            //special Hot Toner.
            if (record != null) {
                var shippingNotes = record.getFieldValue('custbody_shipping_notes');
                if (shippingNotes != null && shippingNotes.length > 30 ) {
                    recordIfsPackage.custrecord_avt_ifs_special_instructions3 =  shippingNotes.substring(30,59);
                }
                Log("shippingNotes",  shippingNotes);

                if (shippingNotes != null) {
                    recordIfsPackage.custrecord_avt_ifs_special_instructions2 =  shippingNotes.substring(0,29);
                }

                recordIfsPackage.custrecord_avt_ifs_special_instructions1 =  record.getFieldValue('shipcompany');
            }

            ifsPackageRecords.push(recordIfsPackage);

            if (ifsPackageRecords != null && ifsPackageRecords.length > 0 ) {
                record.setFieldValue('custbody_avt_ifs_is_multi_split' ,  'T');
                nlapiSubmitRecord(record, false, true);
            }

            //Creation
            for ( var i = 0; i < ifsPackageRecords.length; i++) {
                createRecord(ifsPackageRecords[i]);
            }

            record = LoadRecord(recordId);
        }
    }
    return record;
}

function MassiveBookingV2 () {
    var recordId = nlapiGetRecordId();
    var record = LoadRecord(recordId);
    var configObjectApi = getConfig(record);

    if ( record != null ) {
        //record = SetShipAddressToCustomer(record, recordId);
        Log('SetWeightToIfsPackage');
        record = SetWeightToIfsPackage(record, configObjectApi, recordId);


        StartTime("callSuitletImportSplit");
        var configGlobal =  nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
        var urlImport = configGlobal.getFieldValue('custrecord_avt_ifs_confg_url_import');

        // HOT TONER NEED TO COMMENTS
        if (urlImport != null && urlImport != '') {
            var response = nlapiRequestURL( urlImport  + '&f_recordid=' + recordId + '&f_batchmode=T', null, null);
        }


        EndTime("callSuitletImportSplit");
        //Log("IFS call for the record " + recordId + " number" + i , response);
    }
}


function initIfsPackageRecord( custrecord_avt_ifs_record_transid ) {
    var ifsPackageRecord = null;

    try {
        ifsPackageRecord = new IFSPackageRecord(custrecord_avt_ifs_record_transid);

        if (ifsPackageRecord != null && ifsPackageRecord != '') {
            Log("ifsPackageRecord sckeleton");
            var subsidiaryId = nlapiGetFieldValue('subsidiary');
            if (subsidiaryId == null) {
                subsidiaryId = 1;
            }
            var configObjectApi = getConfigWithSubsidiary(subsidiaryId);
            Log("configObjectApi sckeleton");
            if (configObjectApi != null) {
                var defaultSender = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') : "";
                if (defaultSender != '') {
                    ifsPackageRecord.custrecord_avt_ifs_sender_business = defaultSender;
                }

                var markUpDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') : "";
                if (markUpDefault != '') {
                    ifsPackageRecord.custrecord_avt_ifs_markup_cost = markUpDefault;
                }

                var confirmationDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') : "";
                if (confirmationDefault != '' && confirmationDefault == 'T' ) {
                    ifsPackageRecord.custrecord_avt_ifs_email_client = confirmationDefault;
                }

                var soNumToConnotNum = (configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') : "";
                if (soNumToConnotNum != '' && soNumToConnotNum == 'T' ) {
                    ifsPackageRecord.custrecord_avt_ifs_so_num_to_ifs_num = soNumToConnotNum;
                }

                try {
                    var confirmationSmsDefault = (configObjectApi.getFieldValue('custbody_avt_ifs_sms_is_to_send') != null) ? configObjectApi.getFieldValue('custbody_avt_ifs_sms_is_to_send') : "";
                    if (confirmationSmsDefault != '' && confirmationSmsDefault == 'T' ) {
                        ifsPackageRecord.custrecord_avt_ifs_sms_is_to_send = confirmationSmsDefault;
                    }
                } catch (e) {
                        Log('ERROR in initIfsPackageRecord', e);
                }

                var leastCostDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') : "";
                if (leastCostDefault != '' && leastCostDefault == 'T' ) {
                    ifsPackageRecord.custrecord_avt_ifs_apply_leastcost = leastCostDefault;
                }

                var fasterDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') : "";
                if (fasterDefault != '' && fasterDefault == 'T' ) {
                    ifsPackageRecord.custrecord_avt_ifs_faster_is = fasterDefault;
                }

                ifsPackageRecord.custrecord_avt_ifs_total_packages = '1';

                var record = LoadRecord(custrecord_avt_ifs_record_transid);
                var email = record.getFieldValue('custbody_avt_ifs_email_confirmation');
                ifsPackageRecord.custrecord_avt_ifs_email_confirmation = email;

                var carrierId = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') : "";
                if (carrierId != '' ) {
                    ifsPackageRecord.custrecord_avt_ifs_shipcarrier =  carrierId;
                    var serviceId = (configObjectApi.getFieldValue('custrecord_avt_default_service_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_default_service_id') : "";
                    if (serviceId != '' ) {
                        ifsPackageRecord.custrecord_avt_ifs_shipservice = serviceId;
                        var freightTypeId = (configObjectApi.getFieldValue('custrecord_avt_default_freight_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_default_freight_id') : "";
                        if (freightTypeId != '' ) {
                            ifsPackageRecord.custrecord_avt_ifs_freight_type = freightTypeId;
                        }
                    }
                }

                /*
                var autoCalculateWeight = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_auto_cal_weight') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_auto_cal_weight') : "";
                if (autoCalculateWeight != ''  && autoCalculateWeight == 'T' ) {
                    var soId = nlapiGetFieldValue('custrecord_avt_ifs_record_transid');
                    var totalWeight = getItemsWeight(soId, configObjectApi);
                    ifsPackageRecord.custrecord_avt_ifs_total_weight = formatStringToNumber(totalWeight);
                } */

                var autoCalculateCubic = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_auto_cal_cubic') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_auto_cal_cubic') : "";
                if (autoCalculateCubic != ''  && autoCalculateCubic == 'T' ) {
                    var soId = nlapiGetFieldValue('custrecord_avt_ifs_record_transid');
                    var totalCubic = getItemsCubic(soId, configObjectApi);
                    ifsPackageRecord.custrecord_avt_ifs_total_volume = formatStringToNumber(totalCubic);
                }

                var chargeToDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_charge_to') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_charge_to') : "";
                if (chargeToDefault != '' ) {
                    ifsPackageRecord.custrecord_avt_ifs_charge_to = chargeToDefault;
                }
            }
        }
    }  catch (e) {
        alert(e.message);
        Log('ERROR initIfsPackageRecord ' , e);
    }
    return ifsPackageRecord;
}

function MassiveBooking() {

    //Get the mapping between shipping method and your function.
    var soid = nlapiGetRecordId();
    var record = LoadRecord(soid);

    if (record != null && record != '') {
        var shipmethod = record.getFieldValue('shipmethod');
        Log("shipmethod", shipmethod);

        var shipmethodMapping = GetIfsShippingMethod(record);

        if (shipmethodMapping != null && shipmethodMapping.length > 0) {
            for ( var i = 0; i < shipmethodMapping.length; i++) {
                var shipMethodRecord = shipmethodMapping[i];
                if (shipMethodRecord != null) {
                    if ( shipMethodRecord.getValue("custrecord_avt_ifs_shipmethod_carrier") != null ) {
                        record.setFieldValue('custbody_avt_ifs_shipcarrier' ,  shipMethodRecord.getValue("custrecord_avt_ifs_shipmethod_carrier") );
                        record.setFieldValue('custbody_avt_ifs_shipservice',  shipMethodRecord.getValue("custrecord_avt_ifs_shipmethod_service") );
                        record.setFieldValue('custbody_avt_ifs_freight_type',  shipMethodRecord.getValue("custrecord_avt_ifs_shipmethod_freight_ty") );
                        nlapiSubmitRecord(record, false, true);
                    }
                }
            }
        }

        //Need to call the WS
        StartTime("callSuitletImport");
        //var response = nlapiRequestURL( 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=245&deploy=1&f_recordid=' + recordId + '&f_batchmode=T', null, null);
        var configGlobal =  nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
        var urlImport = configGlobal.getFieldValue('custrecord_avt_ifs_confg_url_import');
        if (urlImport != null && urlImport != '') {
            var response = nlapiRequestURL( urlImport  + '&f_recordid=' + soid, null, null);
        }
        EndTime("callSuitletImport");
    }

}

function AfterSaveIfsPackage() {
    try{
        var customForm = nlapiGetFieldValue('customform');
        Log("customForm", customForm);

        if (customForm == null || customForm == '') {
            var soid = nlapiGetRecordId();
            var record = LoadRecord(soid);
            if (record != null && record != '') {
                customForm = record.getFieldValue('customform');
            }
        }
        Log("customForm 2", customForm);

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
         if (subsidiaryId == null) {
             subsidiaryId = 1;
         }
        var location = nlapiGetFieldValue('location');
        if (location == null) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
         Log("custrecord_avt_ifs_customform_id_ifs_pac", configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_ifs_pac') );

         var listOfCustomFormIfsPackageRecord = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_ifs_pac');
         if (listOfCustomFormIfsPackageRecord != null && listOfCustomFormIfsPackageRecord != '') {
             var arrayOfCustomFormSo = listOfCustomFormIfsPackageRecord.split(';');
             for ( var i = 0; i < arrayOfCustomFormSo.length; i++) {
                 if ( arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm ) {
                     var typeRecord = nlapiGetRecordType();
                     Log("typeRecord", typeRecord);
                     var isAutoImportIfsPac = (configObjectApi.getFieldValue('custrecord_avt_ifs_auto_import_ifs_pac') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_auto_import_ifs_pac') : "";
                     Log("isAutoImportIfsPac", isAutoImportIfsPac);
                     if (isAutoImportIfsPac != '' && isAutoImportIfsPac == 'T' ) {
                         var soid = nlapiGetFieldValue('custrecord_avt_ifs_record_transid');
                         var record = LoadRecord(soid);
                         if (record != null) {
                             //var isMultiSplit = ( configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') : "F";
                             var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                             Log("isMultiSplit", isMultiSplit);
                             if (isMultiSplit != null && isMultiSplit == 'T' ) {
                                 var ifsConnotNum = nlapiGetFieldValue('custrecord_avt_ifs_connote_num');
                                 Log("ifsConnotNum", ifsConnotNum);
                                 if (ifsConnotNum != null && ifsConnotNum == '') {
                                     CallScript('customscript_avt_ifs_import_split', soid);
                                 }
                             }
                         } /*else {
                             CallScript('customscript_avt_ifs_import', soid);
                         }*/
                     }
                 }
             }
         }
    } catch (e) {
        Log('ERROR in AfterSaveIf', e);
    }
}

/* InitFunctionIF */
function InitFunction(type){
    try{
        UpdateClientScriptData();
        var configRecord = window.AvtClientScriptData.configRecord;

        if (type == 'create'){
            InitPrinterIdOnTransactionRecord(configRecord);
        }
        if (type == 'create' || type == 'copy'){
            var customerId = nlapiGetFieldValue('entity');
            if(customerId){
                UpdateDefaultDataForIF(configRecord);
            }
        }
    } catch (e) {
        console.error('Error occurred in InitFunction. ' + e.message);
    }
}

/* InitFunction for SO */
function InitFunctionSO(type){
    try{
        UpdateClientScriptData();
        var configRecord = window.AvtClientScriptData.configRecord;

        if (type == 'create'){
            InitPrinterIdOnTransactionRecord(configRecord);
        }
        if (type == 'create' || type == 'copy'){
            var customerId = nlapiGetFieldValue('entity');
            if(customerId){
                UpdateDefaultDataForSO(configRecord, customerId);
            }
        }
    } catch (e) {
        console.error('Error occurred in InitFunctionSO. ' + e.message);
    }
}


/**
 * For Client Script
 * @returns {Boolean} - true: config record was changed
 */
function UpdateClientScriptData(){

    var clientScriptData = window.AvtClientScriptData;  // load data from global variable
    if(typeof clientScriptData === 'undefined'){
        // init global variable if it does not exist
        clientScriptData = new ClientScriptData();
        window.AvtClientScriptData = clientScriptData;
    }

    if (!clientScriptData.globalConfigRecord) {
        clientScriptData.globalConfigRecord = nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
    }

    var subsidiaryId = nlapiGetFieldValue('subsidiary');
    if(!subsidiaryId){
        subsidiaryId = 1;
    }
    var location = nlapiGetFieldValue('location');
    if(!location && nlapiGetRecordType() === 'itemfulfillment'){
        var count = nlapiGetLineItemCount('item');
        for(var i = 1; i <= count; i++) {
            if(nlapiGetLineItemValue('item', 'itemreceive', i) === 'T') {
                location = nlapiGetLineItemValue('item', 'location', i);
                if(location){
                    break;
                }
            }
        }
    }
    if(!location) {
        location = 1;
    }

    var isSenderBasedConfigEnabled = (clientScriptData.globalConfigRecord.getFieldValue('custrecord_avt_ifs_confg_use_sender_cfg') === 'T');
    var senderId = nlapiGetFieldValue('custbody_avt_ifs_sender_business') || null;

    var wasConfigChanged = false;
    var configRecord = clientScriptData.configRecord;

    if (isSenderBasedConfigEnabled && senderId !== clientScriptData.senderId) {

        var senderConfigId = nlapiLookupField('customrecord_avt_ifs_sender', senderId, 'custrecord_avt_ifs_sender_ifs_config', false);

        if (senderConfigId) {
            clientScriptData.configRecord = nlapiLoadRecord('customrecord_avt_ifs_config', senderConfigId);
            nlapiSetFieldValue('custbody_avt_ifs_config', clientScriptData.configRecord.getId(), false, true);
            wasConfigChanged = true;
        } else {
            // This case does not happen if sender and config records are setup correctly
            clientScriptData.configRecord = nlapiLoadRecord('customrecord_avt_ifs_config', 1);
            nlapiSetFieldValue('custbody_avt_ifs_config', clientScriptData.configRecord.getId(), false, true);
            wasConfigChanged = true;
        }

        clientScriptData.senderId = senderId;

    } else if (!configRecord ||
            clientScriptData.subsidiaryId !== subsidiaryId ||
            clientScriptData.location !== location){
        // need to reload config
        clientScriptData.subsidiaryId = subsidiaryId;
        clientScriptData.location = location;
        var newConfigRecord = getConfigWithSubsidiary(subsidiaryId, location);
        if(!configRecord ||
                ( configRecord && configRecord.getId() !== newConfigRecord.getId() )){
            // config record was changed
            clientScriptData.configRecord = newConfigRecord;
            wasConfigChanged = true;
        }
    }

    return wasConfigChanged;
};


/**
 *
 * It is assumed that this function is used as client script (type == create)
 *
 * @param {nlobjRecord} configRecord
 */
function InitPrinterIdOnTransactionRecord(configRecord){

    // check config option "Do Not Supply Printer Information"
    var doesSupplyPrinterId =
        configRecord.getFieldValue('custrecord_avt_ifs_conf_add_printer_id') === 'T' ? true : false;
    if(!doesSupplyPrinterId){
        return;
    }

    var recordTypeListString = configRecord.getFieldValue('custrecord_avt_ifs_conf_rectyp_init_prnt') || '';
    var recordTypeArray = recordTypeListString.split(';');

    if(recordTypeArray.indexOf( nlapiGetRecordType() ) < 0){
        return;
    }

    var printerIdBeforeEdit = null;
    var createdFrom = nlapiGetFieldValue('createdfrom');
    if(createdFrom){
        printerIdBeforeEdit = nlapiLookupField('transaction', createdFrom, 'custbody_avt_ifs_printer_id', false);
    }

    if(printerIdBeforeEdit){
        // restore printer ID on record before edit
        nlapiSetFieldValue('custbody_avt_ifs_printer_id', printerIdBeforeEdit, true, false);
        return;
    }

    // initialize printer id from terminal record
    var filterArray = new Array();
    filterArray[0] = new nlobjSearchFilter('custrecord_avt_ifs_term_emp', null, 'anyof', nlapiGetUser(), null);
    filterArray[1] = new nlobjSearchFilter('custrecord_avt_ifs_term_terminal', null, 'isnotempty', null, null);

    var columnArray = new Array();
    columnArray[0] = new nlobjSearchColumn('internalid', null, null).setSort();

    var searchResult = nlapiSearchRecord('customrecord_avt_ifs_terminals', null, filterArray, columnArray);

    if(searchResult){
        var printerId = searchResult[0].getValue(columnArray[0]);
        nlapiSetFieldValue('custbody_avt_ifs_printer_id', printerId, true, false);
    } else {
        nlapiSetFieldValue('custbody_avt_ifs_printer_id', '', true, false);
    }

};


function SaveRecordSo()  {
    try{

        var entityId = nlapiGetFieldValue('entity');
        if (entityId != null && entityId != '') {
            UpdateDefaultDataForSO(entityId);
        }

        var extentionFreightNum = new Array();
        extentionFreightNum.push("");
        extentionFreightNum.push("_2");
        extentionFreightNum.push("_3");
        extentionFreightNum.push("_4");

        for ( var j = 0; j < extentionFreightNum.length; j++) {
            SetAvtIfsFreightType(nlapiGetFieldValue('custbody_avt_ifs_freight_type' + extentionFreightNum[j]) ,extentionFreightNum[j]);
        }
    } catch (e) {

        Log('ERROR in SaveRecordSo', e);
    }
    return true;
}


function OnFieldChangeSO(type, name, linenum) {
    try{
        var wasConfigChanged = UpdateClientScriptData();
        var configObjectApi = window.AvtClientScriptData.configRecord;
        if(wasConfigChanged){
            // if it is creation not edit
            if(!nlapiGetRecordId()){
                InitPrinterIdOnTransactionRecord(configObjectApi);
            }
        }

        var entityId = nlapiGetFieldValue('entity');
        var location = nlapiGetFieldValue('location');
        if (entityId != null && entityId != '') {
            if ( name == 'subsidiary' || name == 'location' || name == 'entity') {
                UpdateDefaultDataForSO(configObjectApi, entityId);
            }
        }
        updateFreightLineDetailOnFieldChange(configObjectApi, type, name, linenum);

    } catch (e) {
        console.error('Error occurred in OnFieldChangeSO. ' + e.message);
    }
}

function UpdateDefaultDataForSO(configObjectApi, entityId) {

    if (configObjectApi != null) {

        var defaultSender = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') : "";
        if (defaultSender != '') {
            nlapiSetFieldValue('custbody_avt_ifs_sender_business', defaultSender, false, false);
        }

        var markUpDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') : "";
        if (markUpDefault != '') {
            nlapiSetFieldValue('custbody_avt_ifs_markup_cost', markUpDefault, false, false);
        }

        var confirmationDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') : "";
        if (confirmationDefault != '' && confirmationDefault == 'T') {
            nlapiSetFieldValue('custbody_avt_ifs_email_client', confirmationDefault, false, false);
        }

        var soNumToConnotNum = (configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') : "";
        if (soNumToConnotNum != '' && soNumToConnotNum == 'T') {
            nlapiSetFieldValue('custbody_avt_ifs_so_num_to_connot_num', soNumToConnotNum, false, false);
        }

        var params = new Array();
        params.push('custentity_avt_ifs_user_sender_default');
        params.push('custentity_avt_ifs_user_charge_to_defaul');
        params.push('custentity_avt_ifs_receiver_account_num');
        params.push('custentity_avt_ifs_user_carrier_default');
        params.push('custentity_avt_ifs_user_service_default');
        params.push('custentity_avt_ifs_user_freight_default');
        params.push('custentity_avt_ifs_user_least_default');
        params.push('custentity_avt_ifs_user_faster_default');
        params.push('custentity_avt_ifs_update_shipping_cost');
        params.push('custentity_avt_ifs_flat_shipping_charge');
        params.push('custentity_avt_ifs_is_send_email');
        params.push('custentity_avt_ifs_email');
        params.push('email');
        params.push('custentity_avt_ifs_special_instructions1');
        params.push('custentity_avt_ifs_special_instructions2');
        params.push('custentity_avt_ifs_special_instructions3');
        params.push('custentity_avt_ifs_user_markup');


        var values = nlapiLookupField('customer', entityId, params);
        if (values.custentity_avt_ifs_user_least_default != null && values.custentity_avt_ifs_user_least_default == 'T') {
            nlapiSetFieldValue('custbody_avt_ifs_apply_leastcost', values.custentity_avt_ifs_user_freight_default, false, false);
        } else {
            var leastCostDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') : "";
            if (leastCostDefault != '' && leastCostDefault == 'T') {
                nlapiSetFieldValue('custbody_avt_ifs_apply_leastcost', leastCostDefault, false, false);
            }
        }

        if (values.custentity_avt_ifs_user_faster_default != null && values.custentity_avt_ifs_user_faster_default == 'T') {
            nlapiSetFieldValue('custbody_avt_ifs_faster_is', values.custentity_avt_ifs_user_faster_default, false, false);
        } else {
            var fasterDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') : "";
            if (fasterDefault != '' && fasterDefault == 'T') {
                nlapiSetFieldValue('custbody_avt_ifs_faster_is', fasterDefault, false, false);
            }
        }

        if (values.custentity_avt_ifs_user_sender_default) {
            nlapiSetFieldValue('custbody_avt_ifs_sender_business', values.custentity_avt_ifs_user_sender_default, false, false);
        }

        if (values.custentity_avt_ifs_user_charge_to_defaul) {
            nlapiSetFieldValue('custbody_avt_ifs_charge_to', values.custentity_avt_ifs_user_charge_to_defaul, false, false);
        }

        if (values.custentity_avt_ifs_receiver_account_num) {
            nlapiSetFieldValue('custbody_avt_ifs_receiver_account_num', values.custentity_avt_ifs_receiver_account_num, false, false);
        } else {
            nlapiSetFieldValue('custbody_avt_ifs_receiver_account_num', entityId, false, false);
        }

        if (values.custentity_avt_ifs_user_carrier_default != null && values.custentity_avt_ifs_user_carrier_default != '') {
            nlapiSetFieldValue('custbody_avt_ifs_shipcarrier', values.custentity_avt_ifs_user_carrier_default, false, true);
            nlapiSetFieldValue('custbody_avt_ifs_apply_leastcost', 'F', false, false);  // clear Apply Least Cost check box
            nlapiSetFieldValue('custbody_avt_ifs_faster_is', 'F', false, false);  // clear Apply Fastest check box

            if (values.custentity_avt_ifs_user_service_default != null && values.custentity_avt_ifs_user_service_default != '') {
                nlapiSetFieldValue('custbody_avt_ifs_shipservice', values.custentity_avt_ifs_user_service_default, false, true);
                if (values.custentity_avt_ifs_user_freight_default != null && values.custentity_avt_ifs_user_freight_default != '') {
                    nlapiSetFieldValue('custbody_avt_ifs_freight_type', values.custentity_avt_ifs_user_freight_default, false, true);
                    SetAvtIfsFreightType(values.custentity_avt_ifs_user_freight_default, "");
                }
            }
        } else {
            var carrierId = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') : "";
            if (carrierId != '') {
                nlapiSetFieldValue('custbody_avt_ifs_shipcarrier', carrierId, false, true);
                nlapiSetFieldValue('custbody_avt_ifs_apply_leastcost', 'F', false, false);  // clear Apply Least Cost check box
                nlapiSetFieldValue('custbody_avt_ifs_faster_is', 'F', false, false);  // clear Apply Fastest check box

                var serviceId = (configObjectApi.getFieldValue('custrecord_avt_default_service_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_default_service_id') : "";
                if (serviceId != '') {
                    nlapiSetFieldValue('custbody_avt_ifs_shipservice', serviceId, false, true);
                    var freightTypeId = (configObjectApi.getFieldValue('custrecord_avt_default_freight_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_default_freight_id') : "";
                    if (freightTypeId != '') {
                        nlapiSetFieldValue('custbody_avt_ifs_freight_type', freightTypeId, false, true);
                        SetAvtIfsFreightType(freightTypeId, "");
                    }
                }
            }
        }

        //beware you can't have flate rate and update cost in the same time !!!!
        if (values != null && values.custentity_avt_ifs_flat_shipping_charge != '') {
            nlapiSetFieldValue('custbody_avt_ifs_update_so_ship_coast', 'F', false, false);
        }

        if (values.custentity_avt_ifs_update_shipping_cost != null && values.custentity_avt_ifs_update_shipping_cost == 'T') {
            nlapiSetFieldValue('custbody_avt_ifs_update_so_ship_coast', 'T', false, false);
        }

        if (values.custentity_avt_ifs_is_send_email != null && values.custentity_avt_ifs_is_send_email == 'T') {
            nlapiSetFieldValue('custbody_avt_ifs_email_client', 'T', false, false);
        }

        var ifsEmail = values.custentity_avt_ifs_email;
        if (!ifsEmail) {
            ifsEmail = values.email;
        }
        if (ifsEmail) {
            nlapiSetFieldValue('custbody_avt_ifs_email_confirmation', ifsEmail, false, false);
        }

        var markUp = values['custentity_avt_ifs_user_markup'];
        if (markUp) {
            nlapiSetFieldValue('custbody_avt_ifs_markup_cost', markUp, false, false);
        }

        var companyId = nlapiGetContext().getCompany();
        var createdfrom = nlapiGetFieldValue('createdfrom');
        if (companyId != '3586834' && !createdfrom) { // don't run this section for Furnware to avoid instruction overwritten problem. Don't run for Sales Order created by Quote
            // Load customer specific special instructions
            var specialInstruction1 = values.custentity_avt_ifs_special_instructions1;
            var specialInstruction2 = values.custentity_avt_ifs_special_instructions2;
            var specialInstruction3 = values.custentity_avt_ifs_special_instructions3;
            if(specialInstruction1 != null){
                nlapiSetFieldValue('custbody_avt_ifs_special_instructions1', specialInstruction1, false, false);
            }
            if(specialInstruction2 != null){
                nlapiSetFieldValue('custbody_avt_ifs_special_instructions2', specialInstruction2, false, false);
            }
            if(specialInstruction3 != null){
                nlapiSetFieldValue('custbody_avt_ifs_special_instructions3', specialInstruction3, false, false);
            }
        }

        nlapiSetFieldValue('custbody_avt_ifs_total_packages', "1", false, false);
    }
}

function UpdateDefaultDataForIF(configObjectApi) {
    try {
        if (configObjectApi != null) {

            var forcesSouring = configObjectApi.getFieldValue('custrecord_avt_ifs_force_fld_src_ifcr') === 'T';

            var defaultSender = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') || "";
            var currentSender = nlapiGetFieldValue('custbody_avt_ifs_sender_business');
            if (defaultSender && (forcesSouring || !currentSender)) {
                nlapiSetFieldValue('custbody_avt_ifs_sender_business', defaultSender, false, false);
            }

            var markUpDefault = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') || "";
            var currentMarkUp = nlapiGetFieldValue('custbody_avt_ifs_markup_cost');
            if (markUpDefault && (forcesSouring || !currentMarkUp)) {
                nlapiSetFieldValue('custbody_avt_ifs_markup_cost', markUpDefault, false, false);
            }

            var confirmationDefault = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') || "";
            var currentConfirmation = nlapiGetFieldValue('custbody_avt_ifs_email_client');
            if (confirmationDefault === 'T' && (forcesSouring || currentConfirmation === 'F')) {
                nlapiSetFieldValue('custbody_avt_ifs_email_client', confirmationDefault, false, false);
            }

            var soNumToConnotNum = configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') || "";
            var currentSoNumToConnotNum = nlapiGetFieldValue('custbody_avt_ifs_so_num_to_connot_num');
            if (soNumToConnotNum === 'T' && (forcesSouring || currentSoNumToConnotNum === 'F')) {
                nlapiSetFieldValue('custbody_avt_ifs_so_num_to_connot_num', soNumToConnotNum, false, false);
            }

            var chargeToDefault = configObjectApi.getFieldValue('custrecord_avt_ifs_default_charge_to') || "";
            var currentChargeTo = nlapiGetFieldValue('custbody_avt_ifs_charge_to');
            if (chargeToDefault && (forcesSouring || !currentChargeTo)) {
                nlapiSetFieldValue('custbody_avt_ifs_charge_to', chargeToDefault, false, false);
            }

            var defaultCarrierId = configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') || "";
            var currentCarrier = nlapiGetFieldValue('custbody_avt_ifs_shipcarrier');
            if (defaultCarrierId && (forcesSouring || !currentCarrier)) {
                nlapiSetFieldValue('custbody_avt_ifs_shipcarrier', defaultCarrierId, false, true);
                var defaultServiceId = configObjectApi.getFieldValue('custrecord_avt_default_service_id') || "";
                var currentServiceId = nlapiGetFieldValue('custbody_avt_ifs_shipservice');
                if (defaultServiceId && (forcesSouring || !currentServiceId)) {
                    nlapiSetFieldValue('custbody_avt_ifs_shipservice', defaultServiceId, false, true);
                    var defaultFreightTypeId = configObjectApi.getFieldValue('custrecord_avt_default_freight_id') || "";
                    var currentFreightTypeId = nlapiGetFieldValue('custbody_avt_ifs_freight_type');
                    if (defaultFreightTypeId && (forcesSouring || !currentFreightTypeId)) {
                        nlapiSetFieldValue('custbody_avt_ifs_freight_type', defaultFreightTypeId, false, true);
                    }
                }
            }

            var carrierId = nlapiGetFieldValue('custbody_avt_ifs_shipcarrier');
            if (carrierId) {
                nlapiSetFieldValue('custbody_avt_ifs_apply_leastcost', 'F', false, false);
                nlapiSetFieldValue('custbody_avt_ifs_faster_is', 'F', false, false);
            } else {
                var leastCostDefault = configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') || "";
                var currentLeastCost = nlapiGetFieldValue('custbody_avt_ifs_apply_leastcost');
                if (leastCostDefault === 'T' && (forcesSouring || currentLeastCost === 'F')) {
                    nlapiSetFieldValue('custbody_avt_ifs_apply_leastcost', leastCostDefault, false, false);
                }

                var fasterDefault = configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') || "";
                var currentFaster = nlapiGetFieldValue('custbody_avt_ifs_faster_is');
                if (fasterDefault === 'T' && (forcesSouring || currentFaster === 'F')) {
                    nlapiSetFieldValue('custbody_avt_ifs_faster_is', fasterDefault, false, false);
                }
            }

            var currentPackages = nlapiGetFieldValue('custbody_avt_ifs_total_packages');
            if (!currentPackages) {
                nlapiSetFieldValue('custbody_avt_ifs_total_packages', "1", false, false);
            }

        }
    } catch (e) {
        Log('ERROR in UpdateDefaultDataForIF', e.message);
    }
}

function OnFieldChangeIF(type, name, linenum) {
    try{
        var wasConfigChanged = UpdateClientScriptData();
        var configObjectApi = window.AvtClientScriptData.configRecord;
        if(wasConfigChanged){
            UpdateDefaultDataForIF(configObjectApi);
            // if it is creation, not edit
            if(!nlapiGetRecordId()){
                InitPrinterIdOnTransactionRecord(configObjectApi);
            }
        }
        updateFreightLineDetailOnFieldChange(configObjectApi, type, name, linenum);

    } catch (e) {
        console.error('Error occurred in OnFieldChangeIF. ' + e.message);
    }
}


function updateFreightLineDetailOnFieldChange(configObjectApi, type, name, linenum){

    var fieldSuffix = ['', '_2', '_3', '_4'];
    // update volume field when length, width or height is changed
    var fieldNameArray = ['custbody_avt_ifs_total_length',
                          'custbody_avt_ifs_total_width',
                          'custbody_avt_ifs_total_height'];
    var doesMultiplyPackage =
        configObjectApi.getFieldValue('custrecord_avt_ifs_calc_cubic_multi_pack') == 'T' ? true : false;
    if(doesMultiplyPackage){
        fieldNameArray.push('custbody_avt_ifs_total_packages');
    }

    var isAutoCalculateCubicOnEntryEnabled = configObjectApi.getFieldValue('custrecord_avt_ifs_calculte_cubic') === 'T'
    if(name.indexOf('custbody_avt_ifs_total') == 0 && isAutoCalculateCubicOnEntryEnabled){
        for ( var i = 0; i < fieldNameArray.length; i++) {
            for ( var j = 0; j < fieldSuffix.length; j++) {
                if (name == fieldNameArray[i] + fieldSuffix[j] ) {
                    //NEED TO UPDATE THE VOLUME
                    updateVolumeField(fieldNameArray, fieldSuffix[j]);
                }
            }
        }
    }

    if (configObjectApi.getFieldValue('custrecord_avt_ifs_calc_wv_using_per_pkg') == 'T') {
        // calculate Total Weight and Total Volume field
        for (var i = 0; i < fieldSuffix.length; i++) {
            if (name == 'custbody_avt_ifs_total_packages' + fieldSuffix[i] ||
                name == 'custbody_avt_ifs_total_weight_pkg' + fieldSuffix[i] ||
                name == 'custbody_avt_ifs_total_volume_pkg' + fieldSuffix[i]) {
                // change Total Weight if Total Packages and Weight/Packages are both populated
                var packages = nlapiGetFieldValue('custbody_avt_ifs_total_packages' + fieldSuffix[i]);
                packages = parseInt(packages);
                var weightPerPackage = nlapiGetFieldValue('custbody_avt_ifs_total_weight_pkg' + fieldSuffix[i]);
                weightPerPackage = parseFloat(weightPerPackage);
                var volumePerPackage = nlapiGetFieldValue('custbody_avt_ifs_total_volume_pkg' + fieldSuffix[i]);
                // update Total Weight field
                if (!isNaN(packages) && !isNaN(weightPerPackage) &&
                    packages >= 1 && weightPerPackage > 0) {
                    nlapiSetFieldValue('custbody_avt_ifs_total_weight' + fieldSuffix[i], weightPerPackage * packages, false, false);
                } else if (name == 'custbody_avt_ifs_total_weight_pkg' + fieldSuffix[i]) {
                    nlapiSetFieldValue('custbody_avt_ifs_total_weight' + fieldSuffix[i], '', false, false);
                }
                // update Total Volume field
                if (!isNaN(packages) && !isNaN(volumePerPackage) &&
                    packages >= 1 && volumePerPackage > 0) {
                    nlapiSetFieldValue('custbody_avt_ifs_total_volume' + fieldSuffix[i], volumePerPackage * packages, false, false);
                } else if (name == 'custbody_avt_ifs_total_volume_pkg' + fieldSuffix[i]) {
                    nlapiSetFieldValue('custbody_avt_ifs_total_volume' + fieldSuffix[i], '', false, false);
                }
            }
        }
        // calculate Weight/Package field
        for (var i = 0; i < fieldSuffix.length; i++) {
            if (name == 'custbody_avt_ifs_total_weight' + fieldSuffix[i]) {
                // change Weight/Package if Total Packages and Total Weight are both populated
                var packages = nlapiGetFieldValue('custbody_avt_ifs_total_packages' + fieldSuffix[i]);
                packages = parseInt(packages);
                var totalWeight = nlapiGetFieldValue('custbody_avt_ifs_total_weight' + fieldSuffix[i]);
                totalWeight = parseFloat(totalWeight);
                // update Weight/Package field
                if (!isNaN(packages) && !isNaN(totalWeight) &&
                    packages >= 1 && totalWeight > 0) {
                    nlapiSetFieldValue('custbody_avt_ifs_total_weight_pkg' + fieldSuffix[i], totalWeight / packages, false, false);
                } else {
                    nlapiSetFieldValue('custbody_avt_ifs_total_weight_pkg' + fieldSuffix[i], '', false, false);
                }
            }
        }
        // calculate Volume/Package field
        if (!isAutoCalculateCubicOnEntryEnabled) {  // Auto Calculate Cubic on Entry option already calculated volume
            for (var i = 0; i < fieldSuffix.length; i++) {
                if (name == 'custbody_avt_ifs_total_volume' + fieldSuffix[i]) {
                    // change Weight/Package if Total Packages and Total Weight are both populated
                    var packages = nlapiGetFieldValue('custbody_avt_ifs_total_packages' + fieldSuffix[i]);
                    packages = parseInt(packages);
                    var totalVolume = nlapiGetFieldValue('custbody_avt_ifs_total_volume' + fieldSuffix[i]);
                    totalVolume = parseFloat(totalVolume);
                    // update Weight/Package field
                    if (!isNaN(packages) && !isNaN(totalVolume) &&
                        packages >= 1 && totalVolume > 0) {
                        nlapiSetFieldValue('custbody_avt_ifs_total_volume_pkg' + fieldSuffix[i], totalVolume / packages, false, false);
                    } else {
                        nlapiSetFieldValue('custbody_avt_ifs_total_volume_pkg' + fieldSuffix[i], '', false, false);
                    }
                }
            }
        }
    }

    // load length, width and width when freight type is changed
    for ( var j = 0; j < fieldSuffix.length; j++) {
        if (name == 'custbody_avt_ifs_freight_type' + fieldSuffix[j] ) {
            SetAvtIfsFreightType(nlapiGetFieldValue('custbody_avt_ifs_freight_type' + fieldSuffix[j]) ,fieldSuffix[j]);
        }
    }

    // update default service and freight type when carrier is changed
    if ( name == 'custbody_avt_ifs_shipcarrier' ) {
        var params = new Array();
        params.push('custrecord_avt_ifs_carrier_default_servi');
        params.push('custrecord_avt_ifs_carrier_default_freig');
        var chosenCarrierId = nlapiGetFieldValue('custbody_avt_ifs_shipcarrier');
        if(chosenCarrierId){
            var values = nlapiLookupField('customrecord_avt_ifs_carrier', chosenCarrierId, params);
            var defaultServiceId = parseInt(values.custrecord_avt_ifs_carrier_default_servi);
            var defaultFreightTypeId = parseInt(values.custrecord_avt_ifs_carrier_default_freig);
            if (defaultServiceId) {
                window.AvtClientScriptData.carrierDefault.serviceId = defaultServiceId;

                if (defaultFreightTypeId) {
                    window.AvtClientScriptData.carrierDefault.freightTypeId = defaultFreightTypeId;
                }
            }
        }
    }
}

/**
 * Designed to used on Sales Order and Item Fulfillment records.
 *
 * @param type
 * @param name
 * @constructor
 */
function OnPostSourcing(type, name) {
    var carrierDefault = window.AvtClientScriptData.carrierDefault;

    if (name === 'custbody_avt_ifs_shipcarrier' && carrierDefault.serviceId) {
        nlapiSetFieldValue('custbody_avt_ifs_shipservice', carrierDefault.serviceId.toString(), true, true);

        // Check if value has been successfully set.
        // It fails when field initialization of target field has not been done.
        if (parseInt(nlapiGetFieldValue('custbody_avt_ifs_shipservice')) === carrierDefault.serviceId) {
            carrierDefault.serviceId = 0;
        }
    }

    if (name === 'custbody_avt_ifs_shipservice' && carrierDefault.freightTypeId) {
        nlapiSetFieldValue('custbody_avt_ifs_freight_type', carrierDefault.freightTypeId.toString(), true, true);

        // Check if value has been successfully set.
        // It fails when field initialization of target field has not been done.
        if (parseInt(nlapiGetFieldValue('custbody_avt_ifs_freight_type')) === carrierDefault.freightTypeId) {
            carrierDefault.freightTypeId = 0;
        }
    }
}


function OnFieldChangeIFPackage(type, name) {
    try{

        var extentionFreightNum = new Array();
        extentionFreightNum.push("");
        paramArray = new Array("custrecord_avt_ifs_total_length","custrecord_avt_ifs_total_width","custrecord_avt_ifs_total_height");
        for ( var i = 0; i < paramArray.length; i++) {
            for ( var j = 0; j < extentionFreightNum.length; j++) {
                if (name == paramArray[i] + extentionFreightNum[j] ) {
        var subsidiaryId = nlapiGetFieldValue('subsidiary');
        if (subsidiaryId == null) {
            subsidiaryId = 1;
        }
                     var location = nlapiGetFieldValue('location');
        if (location == null) {
            location = 1;
        }

                     var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
                    if (configObjectApi != null) {
                        var isCalculCubic = (configObjectApi.getFieldValue('custrecord_avt_ifs_calculte_cubic') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_calculte_cubic') : "F";
                        if (isCalculCubic != null && isCalculCubic == 'T') {
                            //NEED TO UPDATE THE VOLUME
                            var total = 1;
                            for ( var x = 0; x < paramArray.length; x++) {
                                total *= CNULL( nlapiGetFieldValue(paramArray[x] + extentionFreightNum[j]) );
                            }
                            nlapiSetFieldValue('custrecord_avt_ifs_total_volume', formatStringToNumber(total), false, false);
                        }
                    }
                }
            }
        }
    } catch (e) {
        Log('ERROR in OnFieldChangeIFPackage', e);
    }
}

function updateVolumeField(paramArray, extention) {
    if (paramArray != null && extention != null) {
        var total = 1;
        for ( var i = 0; i < paramArray.length; i++) {
            var value  = CNULL( nlapiGetFieldValue(paramArray[i] + extention) );
            if( value == 0) {
                return; // don't calcualte if it's not available
            }
            total *= CNULL( nlapiGetFieldValue(paramArray[i] + extention) );
        }
        total = Math.round(total / 1000000 * 10000) / 10000;
        nlapiSetFieldValue('custbody_avt_ifs_total_volume' + extention, total, false, false);

        var totalPackage = nlapiGetFieldValue('custbody_avt_ifs_total_packages' + extention) || '1';
        totalPackage = parseInt(totalPackage);
        var volumePerPackage = Math.round(total / totalPackage * 10000) / 10000;
        nlapiSetFieldValue('custbody_avt_ifs_total_volume_pkg' + extention, volumePerPackage, false, false);
    }
}


function UpdateDefaultDataForIFSRecord (record)  {
    if (record != null ) {
        var configObjectApi = null;

        var subsidiaryId = null;
        var location = null;

        if (record != null) {
            subsidiaryId = record.getFieldValue('subsidiary');
            if (subsidiaryId == null || subsidiaryId == '' ) {
                subsidiaryId = 1;
            }
        }
        if (record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'itemfulfillment' ) {
            var count =  record.getLineItemCount('item');
            Log('count', count);
            for (var x = 1; x <= count; x++) {
                if (record.getLineItemValue( 'item', 'itemreceive', x ) == 'T') {
                    location = record.getLineItemValue('item', 'location', x);
                    if (location != null && location != '') {
                        break;
                    } else {
                        location = 1;
                    }
                }
            }
        } else if  ( record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'salesorder'  ) {
            location = record.getFieldValue('location');
            if (location == null || location == '') {
                location = 1;
            }
        } else if  ( record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'cashsale'  ) {
            location = record.getFieldValue('location');
            if (location == null || location == '') {
                location = 1;
            }
        }

        configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);

        if (configObjectApi != null) {

            var defaultSender = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_sender') : "";
            if (defaultSender != '') {
                nlapiSetFieldValue('custrecord_avt_ifs_sender_business', defaultSender, false, false);
            }

            var markUpDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_default_markup') : "";
            if (markUpDefault != '') {
                nlapiSetFieldValue('custrecord_avt_ifs_markup_cost', markUpDefault, false, false);
            }

            var confirmationDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_conf_email_defau') : "";
            if (confirmationDefault != '' && confirmationDefault == 'T' ) {
                nlapiSetFieldValue('custrecord_avt_ifs_email_client', confirmationDefault, false, false);
            }

            var soNumToConnotNum = (configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_so_num_to_connot_num') : "";
            if (soNumToConnotNum != '' && soNumToConnotNum == 'T' ) {
                nlapiSetFieldValue('custbody_avt_ifs_so_num_to_connot_num', soNumToConnotNum, false, false);
            }

            try {
                var confirmationSmsDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_sms_default_send_2') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_sms_default_send_2') : "";
                if (confirmationSmsDefault != '' && confirmationSmsDefault == 'T' ) {
                    nlapiSetFieldValue('custrecord_avt_ifs_sms_is_to_send', confirmationSmsDefault, false, false);
                }
            } catch (e) {
                Log('ERROR in UpdateDefaultDataForIFSRecord', e);
            }

            //populate the email customer to the IFS record
            if (record != null) {
                var email = record.getFieldValue('custbody_avt_ifs_email_confirmation');
                nlapiSetFieldValue('custrecord_avt_ifs_email_confirmation', email, false, false);
            }

            var entityId = record.getFieldValue('entity');
            if (entityId != null) {
                var params = new Array();
                params.push('custentity_avt_ifs_user_freight_default');
                params.push('custentity_avt_ifs_user_service_default');
                params.push('custentity_avt_ifs_user_carrier_default');
                params.push('custentity_avt_ifs_user_least_default');
                params.push('custentity_avt_ifs_user_faster_default');
                params.push('custentity_avt_ifs_update_shipping_cost');
                params.push('custentity_avt_ifs_flat_shipping_charge');
                params.push('custentity_avt_ifs_is_send_email');

                var values = nlapiLookupField('customer', entityId , params);
                if (values.custentity_avt_ifs_user_least_default != null && values.custentity_avt_ifs_user_least_default == 'T') {
                    nlapiSetFieldValue('custrecord_avt_ifs_apply_leastcost', values.custentity_avt_ifs_user_freight_default, false, false);
                } else {
                    var leastCostDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_leastco') : "";
                    if (leastCostDefault != '' && leastCostDefault == 'T' ) {
                        nlapiSetFieldValue('custrecord_avt_ifs_apply_leastcost', leastCostDefault, false, false);
                    }
                }

                if (values.custentity_avt_ifs_user_faster_default != null && values.custentity_avt_ifs_user_faster_default == 'T') {
                    nlapiSetFieldValue('custrecord_avt_ifs_faster_is', values.custentity_avt_ifs_user_faster_default, false, false);
                } else {
                    var fasterDefault = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_apply_faster') : "";
                    if (fasterDefault != '' && fasterDefault == 'T' ) {
                        nlapiSetFieldValue('custrecord_avt_ifs_faster_is', fasterDefault, false, false);
                    }
                }

                if (values.custentity_avt_ifs_user_carrier_default != null && values.custentity_avt_ifs_user_carrier_default != '') {
                    nlapiSetFieldValue('custrecord_avt_ifs_shipcarrier', values.custentity_avt_ifs_user_carrier_default, false, true);
                    if (values.custentity_avt_ifs_user_service_default != null && values.custentity_avt_ifs_user_service_default != '') {
                        nlapiSetFieldValue('custrecord_avt_ifs_shipservice', values.custentity_avt_ifs_user_service_default, false, true);
                        if (values.custentity_avt_ifs_user_freight_default != null && values.custentity_avt_ifs_user_freight_default != '') {
                            nlapiSetFieldValue('custrecord_avt_ifs_freight_type', values.custentity_avt_ifs_user_freight_default, false, true);

                            //SetAvtIfsFreightType(values.custentity_avt_ifs_user_freight_default, "");

                            StartTime("GetCustomRecordAvtIfsFreightTypeForIFSRecord");
                            if (recordId != null && recordId != '' ) {
                                var filter = new Array();
                                var cols = new Array();
                                filter[filter.length] = new nlobjSearchFilter('internalid', null, 'anyof', values.custentity_avt_ifs_user_freight_default);
                                cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_description');
                                cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_service_id');
                                cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_volume');
                                cols[cols.length] = new nlobjSearchColumn('custrecordavt_ifs_freighttype_weight');
                                cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_height');
                                cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_width');
                                cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_length');

                                var search = nlapiSearchRecord('customrecord_avt_ifs_freight_type', null, filter, cols);

                                if (search != null && search.length > 0) {
                                    for (var x = 0; x < search.length; x++) {
                                        nlapiSetFieldValue('custrecord_avt_ifs_total_volume', search[x].getValue('custrecord_avt_ifs_freight_volume'), false, false);
                                        nlapiSetFieldValue('custrecord_avt_ifs_total_weight', search[x].getValue('custrecordavt_ifs_freighttype_weight'), false, false);
                                        nlapiSetFieldValue('custrecord_avt_ifs_total_height', search[x].getValue('custrecord_avt_ifs_freight_height'), false, false);
                                        nlapiSetFieldValue('custrecord_avt_ifs_total_width' , search[x].getValue('custrecord_avt_ifs_freight_width'), false, false);
                                        nlapiSetFieldValue('custrecord_avt_ifs_total_length', search[x].getValue('custrecord_avt_ifs_freight_length'), false, false);
                                    }
                                }

                            }
                            EndTime("GetCustomRecordAvtIfsFreightTypeForIFSRecord");
                        }
                    }
                } else {
                    var carrierId = (configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_default_carrier_id') : "";
                    if (carrierId != '' ) {
                        nlapiSetFieldValue('custrecord_avt_ifs_shipcarrier', carrierId, true, true);
                        var serviceId = (configObjectApi.getFieldValue('custrecord_avt_default_service_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_default_service_id') : "";
                        if (serviceId != '' ) {
                            nlapiSetFieldValue('custrecord_avt_ifs_shipservice', serviceId, true, true);
                            var freightTypeId = (configObjectApi.getFieldValue('custrecord_avt_default_freight_id') != null) ? configObjectApi.getFieldValue('custrecord_avt_default_freight_id') : "";
                            if (freightTypeId != '' ) {
                                nlapiSetFieldValue('custrecord_avt_ifs_freight_type', freightTypeId, true, true);
                            }
                        }
                    }
                }

                if (values.custentity_avt_ifs_is_send_email != null && values.custentity_avt_ifs_is_send_email == 'T') {
                    nlapiSetFieldValue('custbody_avt_ifs_email_client', 'T', false, false);
                }

            }

            nlapiSetFieldValue('custrecord_avt_ifs_total_packages', "1", false, false);
        }
    }
}

function OnInitIfsPackageRecord(mode){
    try{
        if (mode == 'create') {

            var soId = nlapiGetFieldValue('custrecord_avt_ifs_record_transid');
            var record = LoadRecord(soId);

            if (record == null || record == '') {
                //shouldn't go there .. need to be test.
                record = LoadItemRecord(soId);
            }

            UpdateDefaultDataForIFSRecord(record);

        }
    } catch (e) {
        Log('ERROR in OnInitIfsPackageRecord', e);
    }
}

function OnInitIfsPackageRecord(mode){
    try{
        if (mode == 'create') {

            var soId = nlapiGetFieldValue('custrecord_avt_ifs_record_transid');
            var record = LoadRecord(soId);

            if (record == null || record == '') {
                //shouldn't go there .. need to be test.
                record = LoadItemRecord(soId);
            }

            UpdateDefaultDataForIFSRecord(record);

        }
    } catch (e) {
        Log('ERROR in OnInitIfsPackageRecord', e);
    }
}


function OnInitSO() {
    StartTime("OnInitSO");
    nlapiLogExecution('debug', "123", "details");
    try{

        StartTime("getConfigWithSubsidiary");
        var customForm = nlapiGetFieldValue('customform');
        //Log("customForm", customForm);
        var record = null;
        if (customForm == null || customForm == '') {
            customForm = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'customform');
        }
        //Log("customForm2", customForm);

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
         if (subsidiaryId == null) {
          subsidiaryId = 1;
         }

         var location = null;
         if (nlapiGetRecordId()){
             location = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'location');
         }
         if (location == null) {
             location = 1;
         }
        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
        EndTime("getConfigWithSubsidiary");
        //Log("custrecord_avt_ifs_customform_id_so", configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_so') );
         if (configObjectApi != null && configObjectApi != '') {
             var listOfCustomFormSo = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_so');
             if (listOfCustomFormSo != null && listOfCustomFormSo != '') {
                 var arrayOfCustomFormSo = listOfCustomFormSo.split(';');
                 for ( var i = 0; i < arrayOfCustomFormSo.length; i++) {
                     if ( arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm ) {
                         StartTime("view");

                         if( type == 'view' ) {
                             var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but_so');
                             if (hideButton != null && hideButton != 'T') {
                                 var addshipping = request.getParameter('addshipping');
                                 if (addshipping != null && addshipping != '') {
                                     var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     conf_field.setDefaultValue(CreateDivAddShipping());
                                 }
                                 var confirm = request.getParameter('confirm_ifs');
                                 var nbBooked = request.getParameter('f_nbbooked');
                                 if (confirm != null && confirm != '') {
                                     var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     conf_field.setDefaultValue(CreateDivConfirmBooking(nbBooked));
                                 }

                                 var confirmDelete = request.getParameter('confirm_delete_ifs');
                                 var nbDeleted = request.getParameter('f_nbdeleted');
                                 if (confirmDelete != null && confirmDelete != '') {
                                     var confirmDelete_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     confirmDelete_field.setDefaultValue(CreateDivDeleteBooking(nbDeleted));
                                 }

                                 var isImportInSo = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_import_in_so');
                                 /*
                                 var soid = nlapiGetRecordId();
                                 var record = LoadRecord(soid);
                                 */

                                if (record == null) {
                                   record = nlapiGetNewRecord();
                                }

                                 //var isMultiSplit = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') : "F";
                                 var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                 if (isImportInSo != null && isImportInSo == 'T' ) {

                                     if (isMultiSplit != null && isMultiSplit == 'T') {
                                         form.addButton('custpage_avt_ifs_delcon_split', 'Delete Multi Split To IFS', CreateButton('customscript_avt_ifs_delcon_split', '1', true, true ));
                                         form.addButton('custpage_avt_ifs_import_split', 'Import Multi Split To IFS', CreateButton('customscript_avt_ifs_import_split', '1', true, true ));
                                     } else {
                                         if ( record.getFieldValue('custbody_avt_ifs_connote_num') !=  null && record.getFieldValue('custbody_avt_ifs_connote_num') != '' ) {
                                             form.addButton('custpage_avt_ifs_delcon', 'Delete Booking To IFS', CreateButton('customscript_avt_ifs_delcon', '1', true, true ));
                                             if(['Y', 'A'].indexOf( configObjectApi.getFieldValue('custrecord_avt_ifs_conf_auto_consolidati') ) >= 0){
                                                 // this is to make appear Import Button for exceptional case that auto consolidation is enable
                                                // this button allows to import more than once from the same record.
                                                // Auto consolidation function (IFS function) consolidates these imported connote under 1 connote ID
                                                 if (isImportInSo != null && isImportInSo =='T' ) {
                                                     form.addButton('custpage_avt_ifs_import', 'Re-import To IFS', CreateButton('customscript_avt_ifs_import', '1', true, true ));
                                                 }
                                             }
                                         } else {
                                           //  form.addButton('custpage_avt_ifs_cost_comp', 'Freight Comparison IFS', CreateButton('customscript_avt_ifs_cost_comparison', '1', true ));
                                            // form.addButton('custpage_avt_ifs_cal_rate', 'Calculate Rate IFS', CreateButton('customscript_avt_ifs_calcule_rate', '1', true ));
                                             if (isImportInSo != null && isImportInSo =='T' ) {
                                                 form.addButton('custpage_avt_ifs_import', 'Import To IFS', CreateButton('customscript_avt_ifs_import', '1', true, true ));
                                             }
                                         }
                                     }
                                 }
                             }
                         } else {
                              var addScript = form.addField('custpage_avt_add_script', 'inlinehtml');
                              addScript.setDefaultValue(createNewScript());
                         }
                         EndTime("view");

                         StartTime("editcreate");
                         if( type == 'edit' || type == 'create' ) {
                             if (configObjectApi != null) {
                                 var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but_so');
                                 if (hideButton != null && hideButton != 'T') {
                                     form.addButton('custpage_avt_ifs_estimate', 'Estimate Freight', 'window.ShowCostComparison()');
                                     form.addButton('custpage_avt_ifs_calculateweight', 'Calculate Weight', 'window.calculateWeightSOV2()');
                                     form.addButton('custpage_avt_ifs_calculatevolum', 'Calculate Volume', 'window.calculateCubicSOV2()');
                                     form.addButton('custpage_avt_ifs_calculatevolum_weight', 'Calculate Weight & Volume', 'window.calculteWeightVolumeSO()');
                                 }
                             }
                         }
                         EndTime("editcreate");

                         StartTime("viewedit");
                         if( type == 'view' || type == 'edit') {
                             if (configObjectApi != null) {
                                  var addLinkSo = (configObjectApi.getFieldValue('custrecord_avt_ifs_add_link_so') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_add_link_so') : "";
                                 //Log("addLinkSo", addLinkSo);
                                  Log('addLinkSo');
                                  if (addLinkSo != '' && addLinkSo == 'T'  ) {
                                     var ifsFormTab = configObjectApi.getFieldValue('custrecord_avt_ifs_form_tab_id');
                                     if (ifsFormTab == null || ifsFormTab == '' ) {
                                         ifsFormTab = 'custpage_ifs_data';
                                         form.addTab( ifsFormTab , 'IFS booking number');
                                     }
                                     var allIfQuote = form.addSubList('custpage_quotelist', 'list', 'IF data', ifsFormTab);

                                     allIfQuote.addField('custpage_if_link', 'text', 'IF link');
                                     allIfQuote.addField('custpage_ifs_quonote', 'text', 'Booking Number');
                                     allIfQuote.addField('custpage_carriername', 'text', 'Carrier Name');
                                     allIfQuote.addField('custpage_carrier_web', 'text', 'Carrier Link');
                                     allIfQuote.addField('custpage_carrier_phone', 'text', 'Carrier Phone');

                                     /*var soid = nlapiGetRecordId();
                                     var record = LoadRecord(soid);*/
                                     if (record == null) {
                                         record = nlapiGetNewRecord();
                                     }

                                     var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                     //Log("isMultiSplit", isMultiSplit);
                                     if (isMultiSplit == null || isMultiSplit == 'F') {

                                         var showUrlWithTracking = configObjectApi.getFieldValue('custrecord_avt_ifs_show_url_with_trackin');

                                         StartTime("load_itemfulfillment");
                                         nlapiLogExecution('debug', 'nlapiGetRecordId()', nlapiGetRecordId());

                                         var filter = new Array();
                                         filter[filter.length] = new nlobjSearchFilter('createdfrom', null, 'is', nlapiGetRecordId() );
                                         filter[filter.length] = new nlobjSearchFilter('custbody_avt_ifs_connote_num', null, 'isnotempty' );
                                         filter[filter.length] = new nlobjSearchFilter( 'mainline', null, 'is', 'T');

                                         var cols = new Array();
                                         cols[cols.length] = new nlobjSearchColumn('internalid');
                                         cols[cols.length] = new nlobjSearchColumn('tranid');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_shipcarrier');//custbody_avt_ifs_shipcarrier
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_connote_num');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_trackingid');

                                         var searchresult = nlapiSearchRecord('itemfulfillment', null, filter, cols);
                                         nlapiLogExecution('debug', "searchresult==", searchresult);
                                         EndTime("load_itemfulfillment");
                                         if (searchresult != null && searchresult.length > 0) {
                                             StartTime("custpage_if_link");
                                             for (var int = 0; int < searchresult.length; int++) {
                                                 //allIfQuote.setLineItemValue( 'custpage_if_link', (int + 1), '<a href="https://system.na1.netsuite.com/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                 allIfQuote.setLineItemValue( 'custpage_if_link', (int + 1), '<a href="/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                 allIfQuote.setLineItemValue( 'custpage_ifs_quonote', (int + 1), searchresult[int].getValue('custbody_avt_ifs_connote_num') );
                                                 var carrierId =  searchresult[int].getValue('custbody_avt_ifs_shipcarrier');

                                                    var filter2 = new Array();
                                                    filter2[filter2.length] = new nlobjSearchFilter('internalid', null, 'is', carrierId);

                                                    var cols2 = new Array();
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carriername');
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_web');
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_phone');

                                                    var searchresult2 = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter2, cols2);
                                                    if (searchresult2 != null && searchresult2.length > 0) {
                                                        for (var int2 = 0; int2 < searchresult2.length; int2++) {
                                                            allIfQuote.setLineItemValue( 'custpage_carriername', (int + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carriername') );
                                                            var carrierWeb = searchresult2[int2].getValue('custrecord_avt_ifs_carrier_web');
                                                            if (carrierWeb != null && carrierWeb != '') {

                                                                if (showUrlWithTracking != '' && showUrlWithTracking == 'T') {
                                                                    allIfQuote.setLineItemValue( 'custpage_carrier_web', (int + 1), '<a href="' + carrierWeb + '/' + searchresult[int].getValue('custbody_avt_ifs_trackingid') +' ">' + carrierWeb + '/' + searchresult[int].getValue('custbody_avt_ifs_trackingid')  + '</a>');
                                                                } else {
                                                                    allIfQuote.setLineItemValue( 'custpage_carrier_web', (int + 1), '<a href="' + carrierWeb + '">' + carrierWeb + '</a>');
                                                                }
                                                            }
                                                            allIfQuote.setLineItemValue( 'custpage_carrier_phone', (int + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carrier_phone') );
                                                        }
                                                    }
                                             }
                                             EndTime("custpage_if_link");
                                         }
                                      } else {
                                         var filter = new Array();
                                         filter[filter.length] = new nlobjSearchFilter('createdfrom', null, 'is', nlapiGetRecordId() );
                                         filter[filter.length] = new nlobjSearchFilter( 'mainline', null, 'is', 'T');

                                         var cols = new Array();
                                         cols[cols.length] = new nlobjSearchColumn('internalid');
                                         cols[cols.length] = new nlobjSearchColumn('tranid');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_shipcarrier');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_connote_num');

                                         var searchresult = nlapiSearchRecord('itemfulfillment', null, filter, cols);
                                         if (searchresult != null && searchresult.length > 0) {
                                             var nbLine = 0;
                                              for (var int = 0; int < searchresult.length; int++) {
                                                 //MULTI SPLIT
                                                 var record = LoadRecord( searchresult[int].getValue('internalid') );
                                                 var ifsPackageArray = GetIfsPackageRecord(record);
                                                 if (ifsPackageArray != null && ifsPackageArray.length > 0) {
                                                     for (var i = 0; i < ifsPackageArray.length; i++) {
                                                         var ifsPackageRecord = ifsPackageArray[i];
                                                         if (ifsPackageRecord != null && ifsPackageRecord.getFieldValue('custrecord_avt_ifs_record_status_import') == 'Booked'  ) {
                                                             allIfQuote.setLineItemValue( 'custpage_if_link', (nbLine + 1), '<a href="/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                             allIfQuote.setLineItemValue( 'custpage_ifs_quonote', (nbLine + 1), ifsPackageRecord.getFieldValue('custrecord_avt_ifs_connote_num') );
                                                             var carrierId =  ifsPackageRecord.getFieldValue('custrecord_avt_ifs_shipcarrier');

                                                             var filter2 = new Array();
                                                                filter2[filter2.length] = new nlobjSearchFilter('internalid', null, 'is', carrierId);

                                                                var cols2 = new Array();
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carriername');
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_web');
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_phone');

                                                                var searchresult2 = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter2, cols2);
                                                                if (searchresult2 != null && searchresult2.length > 0) {
                                                                    for (var int2 = 0; int2 < searchresult2.length; int2++) {
                                                                        allIfQuote.setLineItemValue( 'custpage_carriername', (nbLine + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carriername') );
                                                                        var carrierWeb = searchresult2[int2].getValue('custrecord_avt_ifs_carrier_web');
                                                                        if (carrierWeb != null && carrierWeb != '') {
                                                                            allIfQuote.setLineItemValue( 'custpage_carrier_web', (nbLine + 1), '<a href="' + carrierWeb + '">' + carrierWeb + '</a>');
                                                                        }
                                                                        allIfQuote.setLineItemValue( 'custpage_carrier_phone', (nbLine + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carrier_phone') );
                                                                    }
                                                                }
                                                                //Add a new line
                                                                nbLine++;
                                                         }
                                                     }
                                                 }
                                              }
                                         }
                                     }
                                 }
                             }
                         }
                         EndTime("viewedit");
                         break;
                     }
                 }
             }
        }
    } catch (e) {
        Log('ERROR in OnInitSO', e);
    }
    EndTime("OnInitSO");
}

function OnInitCS() {
    try{
        var customForm = nlapiGetFieldValue('customform');
        //Log("customForm", customForm);
        var record = null;
        if (customForm == null || customForm == '') {
            customForm = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'customform');
        }
        //Log("customForm2", customForm);

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
         if (subsidiaryId == null) {
          subsidiaryId = 1;
         }

         var location = null;
         if (nlapiGetRecordId()){
             location = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'location');
         }
        if (location == null) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
         Log("custrecord_avt_ifs_customform_id_cs", configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_cs') );

         if (configObjectApi != null && configObjectApi != '') {
             var listOfCustomFormSo = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_cs');
             if (listOfCustomFormSo != null && listOfCustomFormSo != '') {
                 var arrayOfCustomFormSo = listOfCustomFormSo.split(';');
                 for ( var i = 0; i < arrayOfCustomFormSo.length; i++) {
                     if ( arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm ) {
                         Log("type", type);
                         if( type == 'view' ) {
                             var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but_cs');
                             Log("hideButton", hideButton);
                             if (hideButton != null && hideButton != 'T') {
                                 var addshipping = request.getParameter('addshipping');
                                 if (addshipping != null && addshipping != '') {
                                     var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     conf_field.setDefaultValue(CreateDivAddShipping());
                                 }
                                 var confirm = request.getParameter('confirm_ifs');
                                 var nbBooked = request.getParameter('f_nbbooked');
                                 if (confirm != null && confirm != '') {
                                     var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     conf_field.setDefaultValue(CreateDivConfirmBooking(nbBooked));
                                 }

                                 var confirmDelete = request.getParameter('confirm_delete_ifs');
                                 var nbDeleted = request.getParameter('f_nbdeleted');
                                 if (confirmDelete != null && confirmDelete != '') {
                                     var confirmDelete_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     confirmDelete_field.setDefaultValue(CreateDivDeleteBooking(nbDeleted));
                                 }

                                 var isImportInSo = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_import_in_so');
                                 var soid = nlapiGetRecordId();
                                 var record = LoadRecord(soid);

                                 //var isMultiSplit = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_use_split') : "F";
                                 var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                 Log("isImportInSo", isImportInSo);
                                 if (isImportInSo != null && isImportInSo == 'T' ) {

                                     if (isMultiSplit != null && isMultiSplit == 'T') {
                                         form.addButton('custpage_avt_ifs_delcon_split', 'Delete Multi Split To IFS', CreateButton('customscript_avt_ifs_delcon_split', '1', true, true ));
                                         form.addButton('custpage_avt_ifs_import_split', 'Import Multi Split To IFS', CreateButton('customscript_avt_ifs_import_split', '1', true, true ));
                                     } else {
                                         if ( record.getFieldValue('custbody_avt_ifs_connote_num') !=  null && record.getFieldValue('custbody_avt_ifs_connote_num') != '' ) {
                                             form.addButton('custpage_avt_ifs_delcon', 'Delete Booking To IFS', CreateButton('customscript_avt_ifs_delcon', '1', true, true ));
                                         } else {
                                             form.addButton('custpage_avt_ifs_cost_comp', 'Freight Comparison IFS', CreateButton('customscript_avt_ifs_cost_comparison', '1', true ));
                                             form.addButton('custpage_avt_ifs_cal_rate', 'Calculate Rate IFS', CreateButton('customscript_avt_ifs_calcule_rate', '1', true ));
                                             if (isImportInSo != null && isImportInSo =='T' ) {
                                                 form.addButton('custpage_avt_ifs_import', 'Import To IFS', CreateButton('customscript_avt_ifs_import', '1', true, true ));
                                             }
                                         }
                                     }
                                 }
                             }
                         } else {
                              var addScript = form.addField('custpage_avt_add_script', 'inlinehtml');
                              addScript.setDefaultValue(createNewScript());
                         }

                         if(type == 'edit' || type == 'create') {
                             if (configObjectApi != null) {
                                 var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but_cs');
                                 if (hideButton != null && hideButton != 'T') {
                                     form.addButton('custpage_avt_ifs_estimate', 'Estimate Freight', 'window.ShowCostComparison()');
                                     form.addButton('custpage_avt_ifs_calculateweight', 'Calculate Weight', 'window.calculateWeightSOV2()');
                                     form.addButton('custpage_avt_ifs_calculatevolum', 'Calculate Volume', 'window.calculateCubicSOV2()');
                                     form.addButton('custpage_avt_ifs_calculatevolum_weight', 'Calculate Weight & Volume', 'window.calculteWeightVolumeSO()');
                                 }
                             }
                         }

                         if( type == 'view' || type == 'edit') {
                              if (configObjectApi != null) {
                                 var addLinkSo = (configObjectApi.getFieldValue('custrecord_avt_ifs_add_link_so') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_add_link_so') : "";
                                 Log("addLinkSo", addLinkSo);
                                 if (addLinkSo != '' && addLinkSo == 'T'  ) {
                                     var ifsFormTab = configObjectApi.getFieldValue('custrecord_avt_ifs_form_tab_id');
                                     if (ifsFormTab == null || ifsFormTab == '' ) {
                                         ifsFormTab = 'custpage_ifs_data';
                                         form.addTab( ifsFormTab , 'IFS booking number');
                                     }
                                     var allIfQuote = form.addSubList('custpage_quotelist', 'list', 'IF data', ifsFormTab);

                                     allIfQuote.addField('custpage_if_link', 'text', 'IF link');
                                     allIfQuote.addField('custpage_ifs_quonote', 'text', 'Booking Number');
                                     allIfQuote.addField('custpage_carriername', 'text', 'Carrier Name');
                                     allIfQuote.addField('custpage_carrier_web', 'text', 'Carrier Link');
                                     allIfQuote.addField('custpage_carrier_phone', 'text', 'Carrier Phone');
                                     var soid = nlapiGetRecordId();
                                     var record = LoadRecord(soid);
                                     var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                       var showUrlWithTracking = configObjectApi.getFieldValue('custrecord_avt_ifs_show_url_with_trackin');

                                     Log("isMultiSplit", isMultiSplit);
                                     if (isMultiSplit == null || isMultiSplit == 'F') {
                                         var filter = new Array();
                                         filter[filter.length] = new nlobjSearchFilter('createdfrom', null, 'is', nlapiGetRecordId() );
                                         filter[filter.length] = new nlobjSearchFilter('custbody_avt_ifs_connote_num', null, 'isnotempty' );
                                         filter[filter.length] = new nlobjSearchFilter( 'mainline', null, 'is', 'T');

                                         var cols = new Array();
                                         cols[cols.length] = new nlobjSearchColumn('internalid');
                                         cols[cols.length] = new nlobjSearchColumn('tranid');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_shipcarrier');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_connote_num');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_trackingid');
                                         var searchresult = nlapiSearchRecord('itemfulfillment', null, filter, cols);
                                         if (searchresult != null && searchresult.length > 0) {
                                             for (var int = 0; int < searchresult.length; int++) {
                                                 allIfQuote.setLineItemValue( 'custpage_if_link', (int + 1), '<a href="/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                 allIfQuote.setLineItemValue( 'custpage_ifs_quonote', (int + 1), searchresult[int].getValue('custbody_avt_ifs_connote_num') );
                                                 var carrierId =  searchresult[int].getValue('custbody_avt_ifs_shipcarrier');

                                                    var filter2 = new Array();
                                                    filter2[filter2.length] = new nlobjSearchFilter('internalid', null, 'is', carrierId);

                                                    var cols2 = new Array();
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carriername');
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_web');
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_phone');

                                                    var searchresult2 = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter2, cols2);
                                                    if (searchresult2 != null && searchresult2.length > 0) {

                                                        for (var int2 = 0; int2 < searchresult2.length; int2++) {
                                                            allIfQuote.setLineItemValue( 'custpage_carriername', (int + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carriername') );
                                                            var carrierWeb = searchresult2[int2].getValue('custrecord_avt_ifs_carrier_web');
                                                            if (carrierWeb != null && carrierWeb != '') {
                                                                if (showUrlWithTracking != '' && showUrlWithTracking == 'T') {
                                                                    allIfQuote.setLineItemValue( 'custpage_carrier_web', (int + 1), '<a href="' + carrierWeb + '/' + searchresult[int].getValue('custbody_avt_ifs_trackingid') +' ">' + carrierWeb + '/' + searchresult[int].getValue('custbody_avt_ifs_trackingid')  + '</a>');
                                                                } else {
                                                                    allIfQuote.setLineItemValue( 'custpage_carrier_web', (int + 1), '<a href="' + carrierWeb + '">' + carrierWeb + '</a>');
                                                                }
                                                            }
                                                            allIfQuote.setLineItemValue( 'custpage_carrier_phone', (int + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carrier_phone') );
                                                        }
                                                    }
                                             }
                                         }
                                      } else {
                                         var filter = new Array();
                                         filter[filter.length] = new nlobjSearchFilter('createdfrom', null, 'is', nlapiGetRecordId() );
                                         filter[filter.length] = new nlobjSearchFilter( 'mainline', null, 'is', 'T');

                                         var cols = new Array();
                                         cols[cols.length] = new nlobjSearchColumn('internalid');
                                         cols[cols.length] = new nlobjSearchColumn('tranid');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_shipcarrier');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_connote_num');

                                         var searchresult = nlapiSearchRecord('itemfulfillment', null, filter, cols);
                                         if (searchresult != null && searchresult.length > 0) {
                                             var nbLine = 0;
                                              for (var int = 0; int < searchresult.length; int++) {
                                                 //MULTI SPLIT
                                                 var record = LoadRecord( searchresult[int].getValue('internalid') );
                                                 var ifsPackageArray = GetIfsPackageRecord(record);
                                                 if (ifsPackageArray != null && ifsPackageArray.length > 0) {
                                                     for (var i = 0; i < ifsPackageArray.length; i++) {
                                                         var ifsPackageRecord = ifsPackageArray[i];
                                                         if (ifsPackageRecord != null && ifsPackageRecord.getFieldValue('custrecord_avt_ifs_record_status_import') == 'Booked'  ) {
                                                             allIfQuote.setLineItemValue( 'custpage_if_link', (nbLine + 1), '<a href="/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                             allIfQuote.setLineItemValue( 'custpage_ifs_quonote', (nbLine + 1), ifsPackageRecord.getFieldValue('custrecord_avt_ifs_connote_num') );
                                                             var carrierId =  ifsPackageRecord.getFieldValue('custrecord_avt_ifs_shipcarrier');

                                                             var filter2 = new Array();
                                                                filter2[filter2.length] = new nlobjSearchFilter('internalid', null, 'is', carrierId);

                                                                var cols2 = new Array();
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carriername');
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_web');
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_phone');

                                                                var searchresult2 = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter2, cols2);
                                                                if (searchresult2 != null && searchresult2.length > 0) {
                                                                    for (var int2 = 0; int2 < searchresult2.length; int2++) {
                                                                        allIfQuote.setLineItemValue( 'custpage_carriername', (nbLine + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carriername') );
                                                                        var carrierWeb = searchresult2[int2].getValue('custrecord_avt_ifs_carrier_web');
                                                                        if (carrierWeb != null && carrierWeb != '') {
                                                                            allIfQuote.setLineItemValue( 'custpage_carrier_web', (nbLine + 1), '<a href="' + carrierWeb + '">' + carrierWeb + '</a>');
                                                                        }
                                                                        allIfQuote.setLineItemValue( 'custpage_carrier_phone', (nbLine + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carrier_phone') );
                                                                    }
                                                                }
                                                                //Add a new line
                                                                nbLine++;
                                                         }
                                                     }
                                                 }
                                              }
                                         }
                                     }
                                 }
                             }
                         }
                         break;
                     }
                 }
             }
        }
    } catch (e) {
        Log('ERROR in OnInitCS', e);
    }
}

function OnInitQT() {
    try{
        var customForm = nlapiGetFieldValue('customform');
        //Log("customForm", customForm);
        var record = null;
        if (customForm == null || customForm == '') {
            customForm = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'customform');
        }
        //Log("customForm2", customForm);

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
         if (subsidiaryId == null) {
          subsidiaryId = 1;
         }

         var location = null;
         if (nlapiGetRecordId()){
            location = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'location');
         }
        if (location == null) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);
         Log("custrecord_avt_ifs_customform_id_qt", configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_qt') );

         if (configObjectApi != null && configObjectApi != '') {
             var listOfCustomFormSo = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_qt');
             if (listOfCustomFormSo != null && listOfCustomFormSo != '') {
                 var arrayOfCustomFormSo = listOfCustomFormSo.split(';');
                 for ( var i = 0; i < arrayOfCustomFormSo.length; i++) {
                     if ( arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm ) {
                         Log("type", type);
                         if( type == 'view' ) {
                             var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but_qt');
                             Log("hideButton", hideButton);
                             if (hideButton != null && hideButton != 'T') {
                                 var addshipping = request.getParameter('addshipping');
                                 if (addshipping != null && addshipping != '') {
                                     var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     conf_field.setDefaultValue(CreateDivAddShipping());
                                 }
                                 var confirm = request.getParameter('confirm_ifs');
                                 var nbBooked = request.getParameter('f_nbbooked');
                                 if (confirm != null && confirm != '') {
                                     var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     conf_field.setDefaultValue(CreateDivConfirmBooking(nbBooked));
                                 }

                                 var confirmDelete = request.getParameter('confirm_delete_ifs');
                                 var nbDeleted = request.getParameter('f_nbdeleted');
                                 if (confirmDelete != null && confirmDelete != '') {
                                     var confirmDelete_field = form.addField('custpage_avt_message', 'inlinehtml');
                                     confirmDelete_field.setDefaultValue(CreateDivDeleteBooking(nbDeleted));
                                 }

                                 var isImportInSo = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_import_in_so');
                                 var soid = nlapiGetRecordId();
                                 var record = LoadRecord(soid);

                                 var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                 Log("isImportInSo", isImportInSo);
                                 if (isImportInSo != null && isImportInSo == 'T' ) {
                                     if (isMultiSplit != null && isMultiSplit == 'T') {
                                         form.addButton('custpage_avt_ifs_delcon_split', 'Delete Multi Split To IFS', CreateButton('customscript_avt_ifs_delcon_split', '1', true, true ));
                                         form.addButton('custpage_avt_ifs_import_split', 'Import Multi Split To IFS', CreateButton('customscript_avt_ifs_import_split', '1', true, true ));
                                     } else {
                                         if ( record.getFieldValue('custbody_avt_ifs_connote_num') !=  null && record.getFieldValue('custbody_avt_ifs_connote_num') != '' ) {
                                             form.addButton('custpage_avt_ifs_delcon', 'Delete Booking To IFS', CreateButton('customscript_avt_ifs_delcon', '1', true, true ));
                                         } else {
                                             form.addButton('custpage_avt_ifs_cost_comp', 'Freight Comparison IFS', CreateButton('customscript_avt_ifs_cost_comparison', '1', true ));
                                             form.addButton('custpage_avt_ifs_cal_rate', 'Calculate Rate IFS', CreateButton('customscript_avt_ifs_calcule_rate', '1', true ));
                                             if (isImportInSo != null && isImportInSo =='T' ) {
                                                 form.addButton('custpage_avt_ifs_import', 'Import To IFS', CreateButton('customscript_avt_ifs_import', '1', true, true ));
                                             }
                                         }
                                     }
                                 }
                             }
                         } else {
                              var addScript = form.addField('custpage_avt_add_script', 'inlinehtml');
                              if (addScript != null) {
                                 addScript.setDefaultValue(createNewScript());
                              }
                         }

                         if( type == 'edit' || type == 'create' ) {
                             if (configObjectApi != null) {
                                 var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but_qt');
                                 if (hideButton != null && hideButton != 'T') {
                                     form.addButton('custpage_avt_ifs_estimate', 'Estimate Freight', 'window.ShowCostComparison()');
                                     form.addButton('custpage_avt_ifs_calculateweight', 'Calculate Weight', 'window.calculateWeightSOV2()');
                                     form.addButton('custpage_avt_ifs_calculatevolum', 'Calculate Volume', 'window.calculateCubicSOV2()');
                                     form.addButton('custpage_avt_ifs_calculatevolum_weight', 'Calculate Weight & Volume', 'window.calculteWeightVolumeSO()');
                                 }
                             }
                         }

                         if( type == 'view' || type == 'edit') {
                              if (configObjectApi != null) {
                                 var addLinkSo = (configObjectApi.getFieldValue('custrecord_avt_ifs_add_link_so') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_add_link_so') : "";
                                 Log("addLinkSo", addLinkSo);
                                 if (addLinkSo != '' && addLinkSo == 'T'  ) {
                                     var ifsFormTab = configObjectApi.getFieldValue('custrecord_avt_ifs_form_tab_id');
                                     if (ifsFormTab == null || ifsFormTab == '' ) {
                                         ifsFormTab = 'custpage_ifs_data';
                                         form.addTab( ifsFormTab , 'IFS booking number');
                                     }
                                     var allIfQuote = form.addSubList('custpage_quotelist', 'list', 'IF data', ifsFormTab);

                                     allIfQuote.addField('custpage_if_link', 'text', 'IF link');
                                     allIfQuote.addField('custpage_ifs_quonote', 'text', 'Booking Number');
                                     allIfQuote.addField('custpage_carriername', 'text', 'Carrier Name');
                                     allIfQuote.addField('custpage_carrier_web', 'text', 'Carrier Link');
                                     allIfQuote.addField('custpage_carrier_phone', 'text', 'Carrier Phone');
                                     var soid = nlapiGetRecordId();
                                     var record = LoadRecord(soid);
                                     var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                                     Log("isMultiSplit", isMultiSplit);
                                     if (isMultiSplit == null || isMultiSplit == 'F') {
                                         var showUrlWithTracking = configObjectApi.getFieldValue('custrecord_avt_ifs_show_url_with_trackin');

                                         var filter = new Array();
                                         filter[filter.length] = new nlobjSearchFilter('createdfrom', null, 'is', nlapiGetRecordId() );
                                         filter[filter.length] = new nlobjSearchFilter('custbody_avt_ifs_connote_num', null, 'isnotempty' );
                                         filter[filter.length] = new nlobjSearchFilter( 'mainline', null, 'is', 'T');

                                         var cols = new Array();
                                         cols[cols.length] = new nlobjSearchColumn('internalid');
                                         cols[cols.length] = new nlobjSearchColumn('tranid');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_shipcarrier');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_connote_num');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_trackingid');

                                         var searchresult = nlapiSearchRecord('itemfulfillment', null, filter, cols);
                                         if (searchresult != null && searchresult.length > 0) {
                                              for (var int = 0; int < searchresult.length; int++) {
                                                 allIfQuote.setLineItemValue( 'custpage_if_link', (int + 1), '<a href="/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                 allIfQuote.setLineItemValue( 'custpage_ifs_quonote', (int + 1), searchresult[int].getValue('custbody_avt_ifs_connote_num') );
                                                 var carrierId =  searchresult[int].getValue('custbody_avt_ifs_shipcarrier');

                                                    var filter2 = new Array();
                                                    filter2[filter2.length] = new nlobjSearchFilter('internalid', null, 'is', carrierId);

                                                    var cols2 = new Array();
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carriername');
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_web');
                                                    cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_phone');

                                                    var searchresult2 = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter2, cols2);
                                                    if (searchresult2 != null && searchresult2.length > 0) {
                                                        for (var int2 = 0; int2 < searchresult2.length; int2++) {
                                                            allIfQuote.setLineItemValue( 'custpage_carriername', (int + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carriername') );
                                                            var carrierWeb = searchresult2[int2].getValue('custrecord_avt_ifs_carrier_web');
                                                            if (carrierWeb != null && carrierWeb != '') {
                                                                if (showUrlWithTracking != '' && showUrlWithTracking == 'T') {
                                                                    allIfQuote.setLineItemValue( 'custpage_carrier_web', (int + 1), '<a href="' + carrierWeb + '/' + searchresult[int].getValue('custbody_avt_ifs_trackingid') +' ">' + carrierWeb + '/' + searchresult[int].getValue('custbody_avt_ifs_trackingid')  + '</a>');
                                                                } else {
                                                                    allIfQuote.setLineItemValue( 'custpage_carrier_web', (int + 1), '<a href="' + carrierWeb + '">' + carrierWeb + '</a>');
                                                                }
                                                            }
                                                            allIfQuote.setLineItemValue( 'custpage_carrier_phone', (int + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carrier_phone') );
                                                        }
                                                    }
                                             }
                                         }
                                      } else {
                                         var filter = new Array();
                                         filter[filter.length] = new nlobjSearchFilter('createdfrom', null, 'is', nlapiGetRecordId() );
                                         filter[filter.length] = new nlobjSearchFilter( 'mainline', null, 'is', 'T');

                                         var cols = new Array();
                                         cols[cols.length] = new nlobjSearchColumn('internalid');
                                         cols[cols.length] = new nlobjSearchColumn('tranid');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_shipcarrier');
                                         cols[cols.length] = new nlobjSearchColumn('custbody_avt_ifs_connote_num');

                                         var searchresult = nlapiSearchRecord('itemfulfillment', null, filter, cols);
                                         if (searchresult != null && searchresult.length > 0) {
                                             var nbLine = 0;
                                              for (var int = 0; int < searchresult.length; int++) {
                                                 //MULTI SPLIT
                                                 var record = LoadRecord( searchresult[int].getValue('internalid') );
                                                 var ifsPackageArray = GetIfsPackageRecord(record);
                                                 if (ifsPackageArray != null && ifsPackageArray.length > 0) {
                                                     for (var i = 0; i < ifsPackageArray.length; i++) {
                                                         var ifsPackageRecord = ifsPackageArray[i];
                                                         if (ifsPackageRecord != null && ifsPackageRecord.getFieldValue('custrecord_avt_ifs_record_status_import') == 'Booked'  ) {
                                                             allIfQuote.setLineItemValue( 'custpage_if_link', (nbLine + 1), '<a href="/app/accounting/transactions/itemship.nl?id=' + searchresult[int].getValue('internalid') + '">' + searchresult[int].getValue('tranid') + '</a>');
                                                             allIfQuote.setLineItemValue( 'custpage_ifs_quonote', (nbLine + 1), ifsPackageRecord.getFieldValue('custrecord_avt_ifs_connote_num') );
                                                             var carrierId =  ifsPackageRecord.getFieldValue('custrecord_avt_ifs_shipcarrier');

                                                             var filter2 = new Array();
                                                                filter2[filter2.length] = new nlobjSearchFilter('internalid', null, 'is', carrierId);

                                                                var cols2 = new Array();
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carriername');
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_web');
                                                                cols2[cols2.length] = new nlobjSearchColumn('custrecord_avt_ifs_carrier_phone');

                                                                var searchresult2 = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter2, cols2);
                                                                if (searchresult2 != null && searchresult2.length > 0) {
                                                                    for (var int2 = 0; int2 < searchresult2.length; int2++) {
                                                                        allIfQuote.setLineItemValue( 'custpage_carriername', (nbLine + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carriername') );
                                                                        var carrierWeb = searchresult2[int2].getValue('custrecord_avt_ifs_carrier_web');
                                                                        if (carrierWeb != null && carrierWeb != '') {
                                                                            allIfQuote.setLineItemValue( 'custpage_carrier_web', (nbLine + 1), '<a href="' + carrierWeb + '">' + carrierWeb + '</a>');
                                                                        }
                                                                        allIfQuote.setLineItemValue( 'custpage_carrier_phone', (nbLine + 1), searchresult2[int2].getValue('custrecord_avt_ifs_carrier_phone') );
                                                                    }
                                                                }
                                                                //Add a new line
                                                                nbLine++;
                                                         }
                                                     }
                                                 }
                                              }
                                         }
                                     }
                                 }
                             }
                         }
                         break;
                     }
                 }
             }
        }
    } catch (e) {
        //alert(e.message);
        Log('ERROR in OnInitQT', e);
    }
}


function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}

function OnInitInvoiceFromIf(request) {
    try {
        Log('request', window.location);
        var myURL = parseURL(window.location);
        Log(' myURL.params.itemship',  myURL.params.itemship);
        if (myURL != null && myURL.params != null && myURL.params.itemship != null ) {
            var params = new Array();
            params.push('custbody_avt_ifs_shipcarrier');
            params.push('custbody_avt_ifs_shipservice');
            params.push('custbody_avt_ifs_freight_type');
            params.push('custbody_avt_ifs_connote_num');
            var values = nlapiLookupField('itemfulfillment',  myURL.params.itemship , params);
            if (values != null ) {
                Log('custbody_avt_ifs_shipcarrier',  values.custbody_avt_ifs_shipcarrier);
                nlapiSetFieldValue('custbody_avt_ifs_shipcarrier', values.custbody_avt_ifs_shipcarrier, false, true);
                nlapiSetFieldValue('custbody_avt_ifs_shipservice', values.custbody_avt_ifs_shipservice, false, true);
                nlapiSetFieldValue('custbody_avt_ifs_freight_type', values.custbody_avt_ifs_freight_type, false, true);
                nlapiSetFieldValue('custbody_avt_ifs_connote_num', values.custbody_avt_ifs_connote_num, false, true);
            }
        }
        OnInitInvoice();
    } catch (e) {
        Log('ERROR in OnInitInvoiceFromIf', e);
    }
}


/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord invoice
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */

function OnInitInvoice(type, form, request) {
    try{
        var customForm = nlapiGetFieldValue('customform');
        Log("customForm", customForm);
        if (customForm == null || customForm == '') {
            customForm = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'customform');
        }
        Log("customForm2", customForm);

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
        if (subsidiaryId == null) {
            subsidiaryId = 1;
        }
        var location = nlapiGetFieldValue('location');

        if (location == null) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);

        if (configObjectApi != null && configObjectApi != '') {
            var listOfCustomFormSo = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_invoice');
             if (listOfCustomFormSo != null && listOfCustomFormSo != '') {
                 var arrayOfCustomFormSo = listOfCustomFormSo.split(';');
                 for ( var i = 0; i < arrayOfCustomFormSo.length; i++) {
                     if ( arrayOfCustomFormSo[i] != null && arrayOfCustomFormSo[i] == customForm ) {
                         var isFIS = nlapiGetFieldValue('custbody_avt_ifs_fis');
                         Log("isFIS", isFIS);
                         if (isFIS == 'T') {
                             nlapiSetFieldValue('shippingcost', 0, null, true);
                         }
                     }
                 }
             }
        }
    } catch (e) {
        Log('ERROR in OnInitInvoice', e);
    }
}



function OnInit() {
    try{
        Log("OnInit");

        var context = nlapiGetContext().getExecutionContext();
        if (context != 'userinterface') {
            return;
        }

        var customForm = nlapiGetFieldValue('customform');
        Log("customForm", customForm);
        var record = null;  // nlapiGetFieldValue() does not work on view mode 24 Nov 2015
        // http://codeboxllc.com/ksc/2013/02/13/scripting-tip-34what-is-so-special-about-custom-form-field-during-onload-event-in-view-mode/
        if(type == 'view'){
            record = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
        }
        if( record && !customForm ) {
            customForm = record.getFieldValue('customform');
        }
        Log("customForm2", customForm);

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
        if( record && !subsidiaryId ){
            subsidiaryId = record.getFieldValue('subsidiary');
        }
        if( !subsidiaryId ){
            subsidiaryId = 1;
        }

        var location = nlapiGetFieldValue('location');
        if( record && !location ){  // for type == view
            var count =  record.getLineItemCount('item');
            for(var i=1; i <= count; i++){
                if(record.getLineItemValue( 'item', 'itemreceive', i ) === 'T'){
                    location = record.getLineItemValue('item', 'location', i);
                    if(location){
                        break;
                    }
                }
            }
        } else if (!location){  // for other types
            var count =  nlapiGetLineItemCount('item');
            for(var i=1; i <= count; i++){
                if(nlapiGetLineItemValue('item', 'itemreceive', i) === 'T'){
                    location = nlapiGetLineItemValue('item', 'location', i);
                    if(location){
                        break;
                    }
                }
            }
        }
        if ( !location ) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);

        var listOfCustomFormIf = configObjectApi.getFieldValue('custrecord_avt_ifs_customform_id_if');
        var arrayOfCustomFormIf = new Array();
        if(listOfCustomFormIf){
            arrayOfCustomFormIf = listOfCustomFormIf.split(';');
        }
        if(arrayOfCustomFormIf.indexOf(customForm) < 0){
            // nothing to do on this custom form
            return;
        }
        if( type == 'view' ) {
            var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but');
            if (hideButton != null && hideButton != 'T') {
                if (request != null && request != '') {
                    var confirm = request.getParameter('confirm_ifs');
                    var nbBooked = request.getParameter('f_nbbooked');
                    if (confirm != null && confirm != '') {
                        var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                        conf_field.setDefaultValue(CreateDivConfirmBooking(nbBooked));
                    }
                    var confirmDelete = request.getParameter('confirm_delete_ifs');
                    var nbDeleted = request.getParameter('f_nbdeleted');
                    Log('confirmDelete', confirmDelete);
                    Log('nbDeleted', nbDeleted);
                    if (confirmDelete != null && confirmDelete != '') {
                        var confirmDelete_field = form.addField('custpage_avt_message', 'inlinehtml');
                        confirmDelete_field.setDefaultValue(CreateDivDeleteBooking(nbDeleted));
                    }
                }
                /*var soid = nlapiGetRecordId();
                var record = LoadRecord(soid);
                var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                */
                var isMultiSplit = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'custbody_avt_ifs_is_multi_split');
                if (isMultiSplit != null && isMultiSplit == 'T') {
                    form.addButton('custpage_avt_ifs_delcon_split', 'Delete Multi Split To IFS', CreateButton('customscript_avt_ifs_delcon_split', '1', true, true));
                    form.addButton('custpage_avt_ifs_import_split', 'Import Multi Split To IFS', CreateButton('customscript_avt_ifs_import_split', '1', true, true));
                } else {
                    var values = getOption();
                    if (values == null || values.custbody_avt_ifs_read_to_ifs == null || values.custbody_avt_ifs_read_to_ifs == 'F') {
                        form.addButton('custpage_avt_ifs_cost_comp', 'Freight Comparison IFS', CreateButton('customscript_avt_ifs_cost_comparison', '1', true ));
                        if ( (values.custbody_avt_ifs_apply_leastcost == null || values.custbody_avt_ifs_apply_leastcost == 'F' ) && (values.custbody_avt_ifs_faster_is == null || values.custbody_avt_ifs_faster_is == 'F' ) ) {
                            form.addButton('custpage_avt_ifs_cal_rate', 'Calculate Rate IFS', CreateButton('customscript_avt_ifs_calcule_rate', '1', true ));
                        }
                        form.addButton('custpage_avt_ifs_import', 'Import To IFS', CreateButton('customscript_avt_ifs_import', '1', true, true));
                    } else if(['Y', 'A'].indexOf( configObjectApi.getFieldValue('custrecord_avt_ifs_conf_auto_consolidati') ) >= 0){
                        // this is to appear Import Button for exceptional case that auto consolidation is enable
                        // this button allows to import more than once from the same record.
                        // Auto consolidation function (IFS function) consolidates these imported connote under 1 connote ID
                        form.addButton('custpage_avt_ifs_import', 'Re-import To IFS', CreateButton('customscript_avt_ifs_import', '1', true, true ));
                    }
                    if (values != null && values.custbody_avt_ifs_conid != null && values.custbody_avt_ifs_conid != "") {
                        form.addButton('custpage_avt_ifs_delcon', 'Delete Booking To IFS', CreateButton('customscript_avt_ifs_delcon', '1', true, true ));
                    }

                    var isReturnConnoteBookingEnabled = configObjectApi.getFieldValue('custrecord_avt_ifs_enable_return_connote') === 'T';
                    if (isReturnConnoteBookingEnabled) {
                        var returnConnoteIfsPackageRecordId = parseInt(record.getFieldValue('custbody_avt_ifs_return_con_package')) || 0;
                        if (returnConnoteIfsPackageRecordId) {
                            // add import button of return connote
                            var deleteReturnButtonScript = '';
                            deleteReturnButtonScript += 'this.disabled = true;';

                            var deleteReturnButtonScriptToSendPostRequest = "\
                                var formElement = document.createElement('form');\
                                formElement.method='post';\
                                formElement.action = nlapiResolveURL('SUITELET',\
                                    'customscript_avt_ifs_return_con_delete', 'customdeploy_avt_ifs_return_con_delete', false);\
                                var recordIdImputElement = document.createElement('input');\
                                recordIdImputElement.setAttribute('name', 'f_recordid');\
                                recordIdImputElement.setAttribute('value', '" + nlapiGetRecordId() + "');\
                                formElement.appendChild(recordIdImputElement);\
                                var recordTypeImputElement = document.createElement('input');\
                                recordTypeImputElement.setAttribute('name', 'f_recordtype');\
                                recordTypeImputElement.setAttribute('value', '" + nlapiGetRecordType() + "');\
                                formElement.appendChild(recordTypeImputElement);\
                                document.body.appendChild(formElement);\
                                formElement.submit();\
                                document.body.removeChild(formElement);";

                            deleteReturnButtonScript = addAlertToScript(deleteReturnButtonScript, false);
                            deleteReturnButtonScript += 'var myVar=setTimeout(function(){' + deleteReturnButtonScriptToSendPostRequest + '},1000);';

                            form.addButton('custpage_avt_ifs_return_connote_import', 'Delete Return Connote', deleteReturnButtonScript);

                        } else {
                            // add import button of return connote
                            var importReturnButtonScript = '';
                            importReturnButtonScript += 'this.disabled = true;';

                            var importReturnButtonScriptToSendPostRequest = "\
                                var formElement = document.createElement('form');\
                                formElement.method='post';\
                                formElement.action = nlapiResolveURL('SUITELET',\
                                    'customscript_avt_ifs_return_con_import', 'customdeploy_avt_ifs_return_con_import', false);\
                                var recordIdImputElement = document.createElement('input');\
                                recordIdImputElement.setAttribute('name', 'f_recordid');\
                                recordIdImputElement.setAttribute('value', '" + nlapiGetRecordId() + "');\
                                formElement.appendChild(recordIdImputElement);\
                                var recordTypeImputElement = document.createElement('input');\
                                recordTypeImputElement.setAttribute('name', 'f_recordtype');\
                                recordTypeImputElement.setAttribute('value', '" + nlapiGetRecordType() + "');\
                                formElement.appendChild(recordTypeImputElement);\
                                document.body.appendChild(formElement);\
                                formElement.submit();\
                                document.body.removeChild(formElement);";

                            importReturnButtonScript = addAlertToScript(importReturnButtonScript, false);
                            importReturnButtonScript += 'var myVar=setTimeout(function(){' + importReturnButtonScriptToSendPostRequest + '},1000);';

                            form.addButton('custpage_avt_ifs_return_connote_import', 'Import Return Connote', importReturnButtonScript);
                        }
                    }
                }
            }
            if(configObjectApi.getFieldValue('custrecord_avt_ifs_enable_label_print') == 'T'){
                form.addButton('custpage_avt_ifs_print_label', 'IFS Print Label',
                        CreateButton('customscript_avt_ifs_label_pdf_creator',
                                'customdeploy_avt_ifs_label_pdf_creator',
                                false, false,
                                {recordtype: 'itemfulfillment', recordid: nlapiGetRecordId()},
                                true)
                );
            }
        }

        if( type == 'edit' || type == 'create' ) {
            if (configObjectApi != null) {
                var hideButton = configObjectApi.getFieldValue('custrecord_avt_ifs_conf_hide_but');
                if (hideButton != null && hideButton != 'T') {
                    //form.addButton('custpage_avt_ifs_estimate', 'Estimate Freight', 'window.ShowCostComparison()'); //no estimate in IF
                    form.addButton('custpage_avt_ifs_calculateweight', 'Calculate Weight', 'window.calculateWeightIFV2()');
                    form.addButton('custpage_avt_ifs_calculatevolum', 'Calculate Volume', 'window.calculateCubicIFV2()');
                    form.addButton('custpage_avt_ifs_calculatevolum_weight', 'Calculate Weight & Volume', 'window.calculteWeightVolumeIF()');
                }
            }
        }
    } catch (e) {
        Log('ERROR in OnInit', e);
    }
    Log("END OnInit");
}

function ShowCostComparison() {
    try{
        var url  = GetShowUrl('customscript_avt_ifs_cost_comparison_nw', '1', nlapiGetRecordId());
        myWindow=window.open(url,'','width=800,height=600,scrollbars=yes');
    } catch (e) {
        alert(e.message);
        Log('ERROR in RunWebStoreCostQuery', e);
    }
}


function GetShowUrl(scriptid, deployid, recordid ) {
    var data = '';
    //call the suitelet
    data += '/app/site/hosting/scriptlet.nl?script=' + scriptid + '&deploy=' + deployid + '&f_recordid=' + recordid;

    var paramArray = new Array("custbody_avt_ifs_apply_leastcost","custbody_avt_ifs_faster_is","entity","custbody_avt_ifs_sender_business","custbody_avt_ifs_charge_to","custbody_avt_ifs_apply_leastcost","custbody_avt_ifs_faster_is","custbody_avt_ifs_sender_business","custbody_avt_ifs_shipcarrier","custbody_avt_ifs_shipservice","custbody_avt_ifs_con_date", "custbody_avt_ifs_con_date","custbody_avt_ifs_user_defaults","custbody_avt_ifs_accountno");

    //GET value generic
    for ( var int1 = 0; int1 < paramArray.length; int1++) {
        data += '&' + paramArray[int1] + '=' + MyNlapiEscapeXML(nlapiGetFieldValue(paramArray[int1]));
    }

    //GET value specific
    var recordType = nlapiGetRecordType();

    if (recordType != null && ( recordType == 'salesorder' || recordType == 'estimate' || recordType == 'invoice') ) { //|| recordType == 'itemfullfilment')
        var paramArray2 = new Array("shipaddr1","shipaddr2","shipcity","shipstate","shipzip","shipphone");
        for ( var i = 0; i < paramArray2.length; i++) {
            data += '&' + paramArray2[i] + '=' + MyNlapiEscapeXML(nlapiGetFieldValue(paramArray2[i]));
        }
    } else if (recordType != null && recordType == 'cashsale') {

        data += '&shipaddr1=' + MyNlapiEscapeXML(nlapiGetFieldValue('billaddr1'));
        data += '&shipaddr2=' +  MyNlapiEscapeXML(nlapiGetFieldValue('billaddr2'));
        data += '&shipcity=' +  MyNlapiEscapeXML(nlapiGetFieldValue('billcity'));
        data += '&shipstate=' +  MyNlapiEscapeXML(nlapiGetFieldValue('billstate'));
        data += '&shipzip=' +  MyNlapiEscapeXML(nlapiGetFieldValue('billzip'));
        data += '&shipphone=' +  MyNlapiEscapeXML(nlapiGetFieldValue('billphone'));
    }

    //TEXT in list for exemple
    var paramArrayTEXT = new Array("custbody_avt_ifs_default_freight_type","createdfrom");
    for (var i = 0; i < paramArrayTEXT.length; i++) {
        data += '&' + paramArrayTEXT[i] + '=' +  nlapiEscapeXML(nlapiGetFieldText(paramArrayTEXT[i]));
    }

    var subsidiaryId = 1;
    try{
        subsidiaryId = nlapiGetFieldValue('subsidiary');
    } catch (e) {
        subsidiaryId = 1;
    }
    if (subsidiaryId == null || subsidiaryId =='') {
        subsidiaryId = 1;
    }
    data += '&subsidiary=' + subsidiaryId;

    var locationId = 1;
    try{
        locationId = nlapiGetFieldValue('location');
    } catch (e) {
        locationId = 1;
    }
    if (locationId == null || locationId == '') {
        locationId = 1;
    }
    data += '&location=' + locationId;
    data += '&nlapiGetRecordType=' + nlapiGetRecordType();

    var configRecord = getConfigWithSubsidiary(subsidiaryId, locationId);
    if (configRecord.getFieldValue('custrecord_avt_ifs_use_custom_recadd_map') === 'T') {  // custom address mapping
        for (var i=1; i <= 5; i++) {
            var recAddFieldId = configRecord.getFieldValue('custrecord_avt_ifs_recaddr_add${NUMBER}_field_id'.replace('${NUMBER}', i));
            if (recAddFieldId && data.indexOf('&' + recAddFieldId + '=') < 0) {
                data += '&' + recAddFieldId + '=' + MyNlapiEscapeXML(nlapiGetFieldValue(recAddFieldId));
            }
        }
    }

    var extentionFreightNum = new Array();
    extentionFreightNum.push("");
    extentionFreightNum.push("_2");
    extentionFreightNum.push("_3");
    extentionFreightNum.push("_4");
    var paramArray3 = new Array("custbody_avt_ifs_total_packages","custbody_avt_ifs_total_weight","custbody_avt_ifs_total_volume","custbody_avt_ifs_total_length","custbody_avt_ifs_total_width","custbody_avt_ifs_total_height", "custbody_avt_ifs_freight_type");
    var paramArrayTEXT2 = new Array("custbody_avt_ifs_freight_type");

    for ( var j = 0; j < extentionFreightNum.length; j++) {

        //Value
        for ( var i = 0; i < paramArray3.length; i++) {
            data += '&' + paramArray3[i] + extentionFreightNum[j] + '=' + MyNlapiEscapeXML(nlapiGetFieldValue(paramArray3[i] + extentionFreightNum[j]));
        }
    }

    var regex = new RegExp( '#' , 'g');
    data = data.replace( regex , '%23' );

    return data;
}


function RunWebStoreCostQuery(request, response) {
    Log('RunWebStoreCostQuery Begin');
    try{
        if ( validClientSub(request, response)) {
            RunWebStoreCostQueryInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunWebStoreCostQuery', e);
    }
}

function RunCalculateRate(request, response) {
    Log('RunCalculateRate Begin');
    try{
        if ( validClientSub(request, response)) {
            RunCalculateRateInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunCalculateRate', e);
    }
}

function RunCostComparison(request, response) {
    Log('RunCostComparison Begin');
    try{
        if ( validClientSub(request, response)) {
            RunCostComparisonInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunCostComparison', e);
        writeErrorReportToResponse(response, 'Unhandled error occurred', e, true);
    }
}

function RunCostComparisonNewWindow(request, response) {
    Log('RunCostComparison Begin');
    try{
        if ( validClientSub(request, response)) {
            RunCostComparisonNewWindowInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunCostComparisonNewWindow', e);
    }

}

function RunImport(request, response) {
    Log('RunImport Begin');
    try{
        if ( validClientSub(request, response)) {
            RunImportInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunImport', e);
        writeErrorReportToResponse(response, 'Unhandled error occurred', e, true);
    }
}

function RunReturnConnoteImport(request, response) {
    Log('RunReturnConnoteImport Begin');
    try{
        if ( validClientSub(request, response)) {
            RunReturnConnoteImportInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunReturnConnoteImport', e);
        writeErrorReportToResponse(response, 'Unhandled error occurred', e, true);
    }
}

function RunReturnConnoteDelete(request, response) {
    Log('RunReturnConnoteDelete Begin');
    try{
        if ( validClientSub(request, response)) {
            RunReturnConnoteDeleteInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunReturnConnoteDelete', e);
        writeErrorReportToResponse(response, 'Unhandled error occurred', e, true);
    }
}

function RunBulkImport(request, response) {
    Log('RunBulkImport Begin');
    try{
        if ( validClientSub(request, response)) {
            RunBulkImportInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunBulkImport', e);
//        response.addHeader('Content-Type', 'application/json');
        response.setContentType('PLAINTEXT', null, 'inline');
        var suiteletResponse = {errorMessage: 'Unhandled error occurred. ' + e.message};
        response.write(JSON.stringify(suiteletResponse));
    }
}

function RunDeleteCon(request, response) {
    Log('RunDeleteCon Begin');
    try{
        if ( validClientSub(request, response)) {
            RunDeleteConInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunDeleteCon', e);
    }

}

/* Commented By Stuti 17 May 2021
function RunImportMultiSplit(request, response) {
    Log('RunImportMultiSplit Begin');
    try{
        if ( validClientSub(request, response)) {
            RunImportMultiSplitInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunImportMultiSplit', e);
    }
}*/

function RunImportMultiSplit(request, response) {
    Log('RunImportMultiSplit Begin');
    try{
        var soid = request.getParameter('f_recordid');
        Log('RunImportMultiSplit', ' soid' + ' = ' +soid);

        var batchmode = request.getParameter('f_batchmode');
        Log('RunImportMultiSplit', ' batchmode' + ' = ' +batchmode);

        var params = new Object();
        params['custscript_recordid'] = soid;
        params['custscript_batchmode'] = batchmode;

        nlapiScheduleScript('customscript_avt_ifs_import_split_sched', 'customdeploy_avt_ifs_import_split_sched', params);
        if (batchmode == null || batchmode == 'F' ) {
            //var avttype = record.getFieldValue('custbody_avt_ifs_type_record');
            var avttype = nlapiLookupField('salesorder',  soid , 'custbody_avt_ifs_type_record');
            Log('RunImportMultiSplit', ' avttype'+'=' +avttype);
           // if (avttype != null) {
                var params = new Array();
                /*if (emailTosendArray != null && emailTosendArray.length > 0) {
                 params['confirm_ifs'] = 1;
                 }*/
                params['f_recordid'] = soid;
                //params['f_nbbooked'] = nbBooked;
                params['f_multi_split'] = 'true';
                params['confirm_ifs'] = 1;
                nlapiSetRedirectURL('RECORD', 'itemfulfillment' , soid, false, params);
            //}
        }
        return; //script immediately exits



    } catch (e) {
        Log('ERROR in RunImportMultiSplit', e);
    }
}

function RunDeleteConForMultiFreightLine(request, response) {
    Log('RunDeleteConForMultiFreightLine Begin');
    try{
        if ( validClientSub(request, response)) {
            RunDeleteConForMultiFreightLineInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunDeleteConForMultiFreightLine', e);
    }

}


function RunBulkIFSBooking(request, response) {
    Log('RunBulkIFSBooking Begin');
    try{
        if ( validClientSub(request, response)) {
            RunBulkIFSBookingInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunBulkIFSBooking', e);
    }
}

function RunEnquiryMultiSplit() {
    Log('RunEnquiryMultiSplit Begin');
    try{
        if ( validClientSub(request, response)) {
            RunEnquiryMultiSplitInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunEnquiryMultiSplit', e);
    }
}

function RunEnquiry() {
    Log('RunEnquiry Begin');
    try{
        if ( validClientSub(request, response)) {
            RunEnquiryInLib(request, response);
        }
    } catch (e) {
        Log('ERROR in RunEnquiry', e);
    }
}

function RunEnquiryScheduleInLib(request, response) {
    Log('RunEnquiryScheduleInLib Begin');
    try{
        if ( validClientSub(request, response)) {
            var search = nlapiLoadSearch('transaction', 'customsearch_avt_ifs_search_enquiry');
            var resultSet = search.runSearch();
            var nbRequestProcess = 0;
            var configGlobal = nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
            //var urlImport = configGlobal.getFieldValue('custrecord_avt_ifs_confg_url_import');

            var urlEnquiry = configGlobal.getFieldValue('custrecord_avt_ifs_confg_url_enquiry');
            Log("urlEnquiry", urlEnquiry );
            resultSet.forEachResult(function(searchResult) {
                Log("ID", searchResult.getValue('internalid') );
                var recordId = searchResult.getValue('internalid');

                StartTime("RunEnquiryMultiSplit");
                try{
                    if (urlEnquiry != null && urlEnquiry != '') {
                        var response = nlapiRequestURL( urlEnquiry +'&f_recordid=' + recordId + '&f_batchmode=T' , null, null);
                    }
                } catch (e) {
                    Log('ERROR in RunEnquiryScheduleInLib', e);
                }
                EndTime("RunEnquiryMultiSplit");
                nbRequestProcess++;
                return true;                // return true to keep iterating
            });

            Log('END - nbRequestProcess', nbRequestProcess);
            return nbRequestProcess ;
        }
    } catch (e) {
        Log('ERROR in RunEnquiryScheduleInLib', e);
    }
}



function RunBulkScheduleInLib(request, response) {
    Log('RunBulkScheduleInLib Begin');
    try{
        if ( validClientSub(request, response)) {
            var search = nlapiLoadSearch('transaction', 'customsearch_avt_cs_search');
            var resultSet = search.runSearch();
            var nbRequestProcess = 0;
            var configGlobal =  nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
            var urlImport = configGlobal.getFieldValue('custrecord_avt_ifs_confg_url_import');

            var connotes = new Array();

            resultSet.forEachResult(function(searchResult) {
                Log("ID", searchResult.getValue('internalid') );
                var recordId = searchResult.getValue('internalid');
                if (recordId != null) {
                    if (urlImport != null && urlImport != '') {
                        StartTime("callSuitletImportSplit");
                        //RunImportMultiSplitInLibFunction(recordId);
                        var consigment = createXmlImport(recordId);
                        if (consigment != null) {
                            var record = LoadRecord(recordId);
                            record.setFieldValue('custbody_avt_ifs_read_to_ifs',  'T');
                            nlapiSubmitRecord(record, false, true);
                            connotes.push(consigment);
                        }
                        EndTime("callSuitletImportSplit");
                    }
                }
                nbRequestProcess++;
                return true;                // return true to keep iterating
            });

            Log('END - nbRequestProcess', nbRequestProcess);


            if (nbRequestProcess > 0 ) {
                var folderId = configGlobal.getFieldValue('custrecord_avt_ifs_folder_id_xml');
                /*
                if ( folderId == null) {
                    folderId = CreateFolder(soid + "_" + makeBookingByRequestResponse.requestId);
                }*/
                var d = new Date();
                var n = d.getTime();

                var data = "<connotes>";
                for ( var int = 0; int < connotes.length; int++) {
                    data += connotes[int];
                }
                data += "</connotes>";

                Log("data", data);

                var xmlFileId= CreateFileInFolder(data, n, folderId);
                var f = nlapiLoadFile(xmlFileId);
                Log("f URL", f.getURL());
                Log("f ID", f.getId());

                var iFSFileToBook = new IFSFileToBook();

                iFSFileToBook.name = n;
                iFSFileToBook.custrecord_avt_ifs_file =  f.getId();
                iFSFileToBook.custrecord_avt_ifs_file_reference = f.getURL();

                var iFSFileToBookId = createRecord(iFSFileToBook);
                Log("iFSFileToBookId", iFSFileToBookId);
            }
            return nbRequestProcess ;
        }
    } catch (e) {
        Log('ERROR in RunBulkScheduleInLib', e);
    }
}

function CreateFolder(folderName) {
    var folder = nlapiCreateRecord('folder');
    var folderId = null;

    if (folder) {
        folder.setFieldValue('parent', fileParentNum); // create root level folder
        folder.setFieldValue('name', folderName);
        folderId = nlapiSubmitRecord(folder);
    }
    return folderId;
}


function CreateFileInFolder(data, fileName, folderId) {
    var fileId = null;
    if ( folderId != null && folderId != '') {
        var fileCreated = nlapiCreateFile(fileName + ".xml",  'XMLDOC' , data );
        fileCreated.setFolder(folderId);
        fileId = nlapiSubmitFile(fileCreated);
        Log("fileId : " + fileName + ".pdf", fileId);
    }
    return fileId;
}


function LoadRecord(itemId, recordType, initializeValues) {
    var record = null;

    if (recordType) {
        try {
            Log('LoadRecord', 'itemId: ' + itemId + '  recordType: ' + recordType);
            record = nlapiLoadRecord(recordType, itemId, initializeValues);

            switch (recordType) {
                case 'itemfulfillment':
                    record.setFieldValue('custbody_avt_ifs_type_record', 'itemfulfillment');
                    record.setFieldValue('custbody_avt_ifs_redirect', 'itemship.nl');
                    break;
                case 'salesorder':
                    record.setFieldValue('custbody_avt_ifs_type_record', 'salesorder');
                    record.setFieldValue('custbody_avt_ifs_redirect', 'salesord.nl');
                    break;
                case 'cashsale':
                    record.setFieldValue('custbody_avt_ifs_type_record', 'cashsale');
                    record.setFieldValue('custbody_avt_ifs_redirect', 'cashsale.nl');
                    break;
                case 'estimate':
                    record.setFieldValue('custbody_avt_ifs_type_record', 'estimate');
                    record.setFieldValue('custbody_avt_ifs_redirect', 'estimate.nl');
                    break;
                case 'invoice':
                    record.setFieldValue('custbody_avt_ifs_type_record', 'invoice');
                    record.setFieldValue('custbody_avt_ifs_redirect', 'custinvc.nl');
                    break;
                default:
            }

        } catch (e) {
            Log('ERROR:LoadRecord', 'itemId: ' + itemId + '  recordType: ' + recordType);
        }
    } else {

        try {
            record = nlapiLoadRecord('itemfulfillment', itemId);
            record.setFieldValue('custbody_avt_ifs_type_record', 'itemfulfillment');
            record.setFieldValue('custbody_avt_ifs_redirect', 'itemship.nl');
            Log('LoadRecord itemId itemfulfillment', itemId);
            Log('LoadRecord internalid itemfulfillment', record.getId());
        } catch (e) {
            try {
                record = nlapiLoadRecord('salesorder', itemId);
                record.setFieldValue('custbody_avt_ifs_type_record', 'salesorder');
                record.setFieldValue('custbody_avt_ifs_redirect', 'salesord.nl');
                Log('LoadRecord itemId salesorder', itemId);
                Log('LoadRecord internalid salesorder', record.getId());
            } catch (e) {
                try {
                    record = nlapiLoadRecord('cashsale', itemId);
                    record.setFieldValue('custbody_avt_ifs_type_record', 'cashsale');
                    record.setFieldValue('custbody_avt_ifs_redirect', 'cashsale.nl');
                    Log('LoadRecord itemId cashsale', itemId);
                    Log('LoadRecord internalid cashsale', record.getId());
                } catch (e) {
                    try {
                        record = nlapiLoadRecord('estimate', itemId);
                        record.setFieldValue('custbody_avt_ifs_type_record', 'estimate');
                        record.setFieldValue('custbody_avt_ifs_redirect', 'estimate.nl');
                        Log('LoadRecord itemId estimate', itemId);
                        Log('LoadRecord internalid estimate', record.getId());
                    } catch (e) {
                        try {
                            record = nlapiLoadRecord('invoice', itemId);
                            record.setFieldValue('custbody_avt_ifs_type_record', 'invoice');
                            record.setFieldValue('custbody_avt_ifs_redirect', 'custinvc.nl');
                            Log('LoadRecord itemId invoice', itemId);
                            Log('LoadRecord internalid invoice', record.getId());
                        } catch (e) {
                            Log('ERROR:LoadRecord for:', itemId);
                        }
                    }
                }
            }
        }
    }
    return record;
}

function LoadItemRecord(itemId) {
    var record = null;
    try {
        record =  nlapiLoadRecord( 'inventoryitem' , itemId );
    } catch (e) {
        try {
            record =  nlapiLoadRecord( 'kititem' , itemId );
        } catch (e) {
            try {
                record =  nlapiLoadRecord( 'assemblybuild' , itemId );
            } catch (e) {
                try {
                    record =  nlapiLoadRecord( 'serviceitem' , itemId );
                } catch (e) {
                    try {
                        record =  nlapiLoadRecord( 'discountitem' , itemId );
                    } catch (e) {
                        try {
                            record =  nlapiLoadRecord( 'otherchargeitem' , itemId );
                        } catch (e) {
                            try {
                                record =  nlapiLoadRecord( 'lotnumberedassemblyitem' , itemId );
                            } catch (e) {
                                alert('ERROR:LoadRecord ' + e.message);
                                Log('ERROR:LoadRecord for:' , itemId );
                            }
                        }
                    }
                }
            }
        }
    }
    return record;
}


function getOption() {
    try{
        var params = new Array();
        params.push('custbody_avt_ifs_read_to_ifs');
        //params.push('custbody_avt_ifs_is_estimate');
        params.push('custbody_avt_ifs_apply_leastcost');
        params.push('custbody_avt_ifs_faster_is');
        params.push('custbody_avt_ifs_conid');
        var values = nlapiLookupField('itemfulfillment',  nlapiGetRecordId() , params);
        if (values == null ) {
            values = nlapiLookupField('salesorder',  nlapiGetRecordId() , params);
        }

        return values;
    } catch (e) {
        Log('ERROR in getOption', e);
    }
}


function getItemWeightUtil(internalId) {
    try{
        var params = new Array();
        params.push('weight');
        params.push('weightunit');
        params.push('itemid');
        var values = nlapiLookupField('item',  internalId , params);
        return values;
    } catch (e) {
        Log('ERROR in getItemWeightUtil', e);
    }
}

function getItemCubicUtil(internalId) {
    try{
        var params = new Array();
        params.push('custitem_avt_ifs_cubic_volume');
        params.push('itemid');
        var values = nlapiLookupField('item',  internalId , params);
        return values;
    } catch (e) {
        Log('ERROR in getItemCubicUtil', e);
    }
}


function getCheapestFaster(soid) {
    try{
        var params = new Array();
        params.push('custbody_avt_ifs_faster_is');
        params.push('custbody_avt_ifs_apply_leastcost');
        var values = nlapiLookupField('itemfulfillment', soid , params);

        if (values == null ) {
            values = nlapiLookupField('salesorder', soid , params);
        }
        return values;
    } catch (e) {
        Log('ERROR in getCheapestFaster', e);
    }
}


function CheckIfsQuotesForm(){
    try{
        var target = document.getElementById('div__header');
        var para=document.createElement('div');
        para.id = 'div__waiting__avt';
        target.appendChild(para);
        var s = document.createElement('script');
        s.setAttribute('type', 'text/javascript');
        s.value = showAlertBox('div__waiting__avt', 'Loading', 'Please wait for the Ifs response. Thank you!', 0, '100%', null, null);
        var div = document.getElementById('div__waiting__avt');
        div.style.display = 'none';

        var isChecked = "F";

        var count = nlapiGetLineItemCount("custpage_quotelist");
        for ( var int = 1; int <= count; int++) {
             isChecked =  nlapiGetLineItemValue('custpage_quotelist', 'custpage_quote' , int);
             if (isChecked == "T") {
                 break;
             }
        }
        if (isChecked != "T") {
            alert("Please Select a Quote.");
            return false;
        }
        div.style.display = '';
    } catch (e) {
        Log('ERROR in CheckIfsQuotesForm', e);
    }
     return true;
}

function createNewScript(){
     var data = '<script type="text/javascript">';
     data += 'function updateCarrier(carriername, servicename, ItemDesc1, ItemDesc2, ItemDesc3, ItemDesc4, cost, subsidiaryId, carrieraccount  ){';
         data += 'var carrierId = getCarrierIdByCarrierNameWORLDACCOUNT(subsidiaryId, carriername, carrieraccount);nlapiSetFieldValue(\'custbody_avt_ifs_shipcarrier\', carrierId, null, true);';
         data += 'if (carrierId != null && carrierId != \'\'){ var serviceId = getServiceIdByServiceName(servicename, carrierId);nlapiSetFieldValue(\'custbody_avt_ifs_shipservice\', serviceId, null, true);}';
         data += 'if (carrierId != null && carrierId != \'\' && serviceId != null && serviceId != \'\'){ var freightType = getFreightTypeIdByServiceName(ItemDesc1, serviceId);nlapiSetFieldValue(\'custbody_avt_ifs_freight_type\', freightType);}';
         data += 'if (carrierId != null && carrierId != \'\' && serviceId != null && serviceId != \'\'){ var freightType = getFreightTypeIdByServiceName(ItemDesc2, serviceId);nlapiSetFieldValue(\'custbody_avt_ifs_freight_type_2\', freightType);}';
         data += 'if (carrierId != null && carrierId != \'\' && serviceId != null && serviceId != \'\'){ var freightType = getFreightTypeIdByServiceName(ItemDesc3, serviceId);nlapiSetFieldValue(\'custbody_avt_ifs_freight_type_3\', freightType);}';
         data += 'if (carrierId != null && carrierId != \'\' && serviceId != null && serviceId != \'\'){ var freightType = getFreightTypeIdByServiceName(ItemDesc4, serviceId);nlapiSetFieldValue(\'custbody_avt_ifs_freight_type_4\', freightType);}';

         data += 'var purcent = nlapiGetFieldText(\'custbody_avt_ifs_markup_cost\');';

         data += 'if (carrierId != null && carrierId != \'\'){';
         //data += '  nlapiSetFieldValue(\'shipcarrier\', configObjectApi.getFieldValue(\'custrecord_avt_ifs_conf_shipcarrier\'),null, true);';
         data += 	'nlapiSetFieldValue(\'shipcarrier\', \'nonups\' ,true, true);';
         data += 	'var params = new Array();';
         data += 	'params.push(\'custrecord_avt_ifs_ship_method_car\');';
         data += 	'var values=  nlapiLookupField(\'customrecord_avt_ifs_carrier\' , carrierId, params);';
         data += 	'if (values != null && values.custrecord_avt_ifs_ship_method_car != null) {';
         data += 		'nlapiSetFieldValue(\'shipmethod\', values.custrecord_avt_ifs_ship_method_car ,true, true);';
         data += 	'}';
         data += '}';

         data += 'if ( nlapiGetFieldValue(\'custbody_avt_ifs_update_so_ship_coast\') == \'T\') { ';
         data += 	'if (purcent == null || purcent == \'\' || purcent <=  0.0 || purcent ==  0) {';
         data += 	'nlapiSetFieldValue(\'shippingcost\', removeComma(cost));';
         data += '} else { ';
         data += 	'purcent = parseFloat( removeComma(cost) * purcent / 100 );';
         data += 	'var resultShipping = purcent + parseFloat(removeComma(cost));';
         data += 	'nlapiSetFieldValue(\'shippingcost\', resultShipping);';
         data += '}';
     data += '}';
     data += '};';
     data += '</script>';
     return data;

}

function CreateDivAddShipping() {
    var data = '<script type="text/javascript">';
    data += 'var target = document.getElementById(\'div__header\');';
    data += 'var para=document.createElement(\'div\');';
    data += 'para.id = \'div__alert__avt_ifs\';';
    data += 'target.appendChild(para);';
    data += 'var s = document.createElement(\'script\');';
    data += 's.setAttribute(\'type\', \'text/javascript\');';
    data += 's.value = showAlertBox(\'div__alert__avt_ifs\', \'Confirmation\', \'Shipping Cost Added\', 0, \'100%\', null, null);';
    data += '</script>';
    return data;
}

function CreateDivConfirmBooking(nbBook) {
    var data = '<script type="text/javascript">';
    data += 'var target = document.getElementById(\'div__header\');';
    data += 'var para=document.createElement(\'div\');';
    data += 'para.id = \'div__alert__avt_ifs\';';
    data += 'target.appendChild(para);';
    data += 'var s = document.createElement(\'script\');';
    data += 's.setAttribute(\'type\', \'text/javascript\');';
    if (nbBook != null && nbBook != '') {
        if ( nbBook == 0 ) {
            data += 's.value = showAlertBox(\'div__alert__avt_ifs\', \'Error\', \'No Booking was Done, You need to have a line in the tab IFS Packages\', 3, \'100%\', null, null);';
        } else {
            data += 's.value = showAlertBox(\'div__alert__avt_ifs\', \'Confirmation\', \'' + nbBook + ' Booking(s) is(are) successfully Done\', 0, \'100%\', null, null);';
        }
    } else {
        data += 's.value = showAlertBox(\'div__alert__avt_ifs\', \'Confirmation\', \'Booking successfully Done\', 0, \'100%\', null, null);';
    }
    data += '</script>';
    return data;
}

function CreateDivDeleteBooking(nbDeleted) {
    var data = '<script type="text/javascript">';
    data += 'var target = document.getElementById(\'div__header\');';
    data += 'var para=document.createElement(\'div\');';
    data += 'para.id = \'div__alert__avt_ifs_del\';';
    data += 'target.appendChild(para);';
    data += 'var s = document.createElement(\'script\');';
    data += 's.setAttribute(\'type\', \'text/javascript\');';
    if (nbDeleted != null && nbDeleted  != '') {
        if ( nbDeleted == 0 ) {
            data += 's.value = showAlertBox(\'div__alert__avt_ifs_del\', \'Error\', \'No Booking was Deleted, You need to have a line in the tab IFS Packages\', 3, \'100%\', null, null);';
        } else {
            data += 's.value = showAlertBox(\'div__alert__avt_ifs_del\', \'Confirmation\', \' '+ nbDeleted + '  Booking(s) is(are) successfully Deleted\', 0, \'100%\', null, null);';
        }
    } else {
        data += 's.value = showAlertBox(\'div__alert__avt_ifs_del\', \'Confirmation\', \'Booking successfully Deleted\', 0, \'100%\', null, null);';
    }
    data += '</script>';
    return data;
}

function getCarrierIdByCarrierName(carriername){
    var carrierId = '';
    if (carriername != null && carriername != '') {
         var filter = new Array();
         filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_carriername', null, 'is', carriername);

         var cols = new Array();
         cols[cols.length] = new nlobjSearchColumn('internalid');

         var searchresult = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter, cols);
         if (searchresult != null && searchresult.length > 0) {
             carrierId = searchresult[0].getValue('internalid');
             //Log('new carrierId', carrierId);
         } else {
             Log('ERROR getServiceIdByServiceName impoosible to find carriername ', carriername);
         }
    }
    return carrierId;
}

//need to be swap with getCarrierIdByCarrierName for a WORLDACCOUNT
function getCarrierIdByCarrierNameWORLDACCOUNT(subsidiaryId, carriername, accountNumber){
    var carrierId = '';
    if (carriername != null && carriername != '') {

         var filter = new Array();
         filter[filter.length] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
         filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_carriername', null, 'is', carriername);
         filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_carrier_subsidiary', null, 'is', subsidiaryId);

         if (accountNumber != null && accountNumber != '') {
             filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_accountno', null, 'is', accountNumber);
         }

         var cols = new Array();
         cols[cols.length] = new nlobjSearchColumn('internalid');

         var searchresult = nlapiSearchRecord('customrecord_avt_ifs_carrier', null, filter, cols);
         if (searchresult != null && searchresult.length > 0) {
             carrierId = searchresult[0].getValue('internalid');
             Log('new getCarrierIdByCarrierNameWORLDACCOUNT carrierId', carrierId);
         } else {
             Log('ERROR getCarrierIdByCarrierNameWORLDACCOUNT impoosible to find carriername ', carriername);
             Log('ERROR getCarrierIdByCarrierNameWORLDACCOUNT impoosible to find subsidiary ', subsidiaryId);
         }
    }
    return carrierId;
}


function getServiceIdByServiceName(servicename, carrierId){
    var serviceId = '';
    if (servicename != null && servicename != '') {
         var filter = new Array();
         filter[filter.length] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
         filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_data', null, 'is', servicename);
         if (carrierId != null && carrierId != '') {
             filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_sercice', null, 'is', carrierId);
         }

         var cols = new Array();
         cols[cols.length] = new nlobjSearchColumn('internalid');

         var searchresult = nlapiSearchRecord('customrecord_avt_ifs_services', null, filter, cols);
         if (searchresult != null && searchresult.length > 0) {
             serviceId = searchresult[0].getValue('internalid');
             //Log('new serviceId', serviceId);
         } else {
             Log('ERROR getServiceIdByServiceName impoosible to find servicename ', servicename);
             Log('ERROR getServiceIdByServiceName impoosible to find carrierId ', carrierId);
         }
    }
    Log('getServiceIdByServiceName returns', serviceId);
    return serviceId;
}

function getFreightTypeIdByServiceName(freightTypename, serviceId){
    var freightTypeId = '';
    if (freightTypename != null && freightTypename != '') {
         var filter = new Array();
         filter[filter.length] = new nlobjSearchFilter('isinactive', null, 'is', 'F');
         filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_description', null, 'is', freightTypename);
         if (serviceId != null && serviceId != '') {
             filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_service_id', null, 'is', serviceId);
         }
         var cols = new Array();
         cols[cols.length] = new nlobjSearchColumn('internalid');

         var searchresult = nlapiSearchRecord('customrecord_avt_ifs_freight_type', null, filter, cols);
         if (searchresult != null && searchresult.length > 0) {
             freightTypeId = searchresult[0].getValue('internalid');
            // Log('new freightTypeId', freightTypeId);
         } else {
             Log('ERROR getFreightTypeIdByServiceName impoosible to find FreightTypeId ', freightTypename);
             Log('ERROR getFreightTypeIdByServiceName impoosible to find serviceId ', serviceId);
         }
    }
    return freightTypeId;
}

function removeComma(n) {
    return n.replace(/\,/g ,'');
}

function validClientSub(request, response) {
    //alert(CheckSub(request, response));
    Log("CheckSub(request, response)", CheckSub(request, response));
    if (CheckSub(request, response)) {
       return true;
    }
    else {
        var form = nlapiCreateForm('Start');
        var myfield = form.addField('custpage_message', 'inlinehtml', '');
        myfield.setDefaultValue('Please contact AVT www.abvt.com.au for support. Your subscription is not active');
        //response.write( 'Please contact AVT www.abvt.com.au for support. Your subscription is not active' );
        response.writePage(form);
        return false;
    }
}

function CheckSub(request, response) {
    //var URL = 'https://forms.netsuite.com/app/site/hosting/scriptlet.nl?script=64&deploy=1&compid=1025736&h=eab8198da11e7d1fbf01';
    var URL = 'https://1025736.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=64&deploy=1&compid=1025736&ns-at=AAEJ7tMQvQZ7UC-5b8fWLu0rk179o3hyTvizj8wE-eekTko5irU';
    var key = nlapiGetContext().getCompany();

    if (key != null && key != '') {
        URL = URL + "&KEY=" + key;
        var response = nlapiRequestURL(URL);
        if (response != null) {
            var body = response.getBody();
            if (body != null && body != '') {
                if (body.indexOf("TRUE") != -1) {
                    return true; // ACTIVE
                }
            }
        }
    }
    return false;
}

/***** LOG *****/
function Log(param1, param2) {
    if (param1 == null) {
        param1 == '';
    }
    if (param2 == null) {
        param2 == '';
    }
    try {
        nlapiLogExecution('Debug', param1, param2);

        var logEntry = new LogEntry('Debug', param1, param2);

        // check if there is global variable to store logs
        if(typeof g_logEntryArray == 'undefined'){
            g_logEntryArray = new Array();
        }
        // dump last log if log array is full
        g_logEntryArray.push(logEntry);
        if(g_logEntryArray.length > 200){
            g_logEntryArray.shift();
        }

    } catch (Error) {}
}


function CreateButton(scriptid, deployid, iswaiting, willDisableAfterClick, urlQueryMap, openNewWindow) {

    if(willDisableAfterClick !== true){
        willDisableAfterClick = false;
    }

    var data = '';

    if(willDisableAfterClick){
        data += 'this.disabled = true;';
    }
    var urlQueryString = '';
    var key = null;
    for(key in urlQueryMap){
        urlQueryString += '&' + key + '=' + urlQueryMap[key];
    }
    var url = nlapiResolveURL('SUITELET', scriptid, deployid, false) + urlQueryString;
    //call the suitelet
    data += 'var recordid = document.forms[\'main_form\'].elements[\'id\'].value;';
    data += 'var url = \'' + url + '&f_recordtype=workorder&f_recordid=\' + recordid;';

    if(openNewWindow === true){
        data += 'window.open(url, \'_blank\');';
    } else if(iswaiting != null && iswaiting == true){
        //add the load gif
        data = addAlertToScript(data, false);
        data += 'var myVar=setTimeout(function(){waitdl(url)},1000);';
        data += 'function waitdl(newUrl){window.location = newUrl;}';
    } else {
         data += 'window.location = url;';
    }
    return data;
}


function AddFunction(scriptid) {
    var data = '';
    try{
        data += ' window.' + scriptid + ';';
    } catch (e) {
        Log('ERROR in AddFunction', e);
    }
    return data;

}

function CreateButtonNewWindows (scriptid, deployid, iswaiting) {
    var data = '';
    try{
        //call the suitelet
        data += 'var recordid = document.forms[\'main_form\'].elements[\'id\'].value;';
        var url  = GetShowUrl('customscript_avt_ifs_cost_comparison_nw', '1', nlapiGetRecordId());
        //Log("url", url);
        data += 'var url = \'' + url + '\';';
        if (iswaiting != null && iswaiting == true){
            //add the load gif
            data = addAlertToScript(data, false);
            data += 'var myVar=setTimeout(function(){waitdl(url)},1000);';
            data += 'function waitdl(newUrl){window.open(url,\'\',\'width=800,height=600,scrollbars=yes\');}';
        }  else {
             data += 'window.open(url,\'\',\'width=800,height=600,scrollbars=yes\') = url;';
        }

    } catch (e) {
        Log('ERROR in CreateButtonNewWindows', e);
    }
    return data;
}


function addAlertToScript(data, isHtml) {

    data += 'var target = document.getElementById(\'div__header\');';
    data += 'var para=document.createElement(\'div\');';
    data += 'para.id = \'div__waiting__avt\';';
    data += 'target.appendChild(para);';
    data += 'var s = document.createElement(\'script\');';
    data += 's.setAttribute(\'type\', \'text/javascript\');';
    data += 's.value = showAlertBox(\'div__waiting__avt\', \'Loading\', \'Please wait for the IFS response. Thank you!\', 0, \'100%\', null, null);';

    return data;
}

function toFixed(value, precision) {
    var precision = precision || 0,
    neg = value < 0,
    power = Math.pow(10, precision),
    value = Math.round(value * power),
    integral = String((neg ? Math.ceil : Math.floor)(value / power)),
    fraction = String((neg ? -value : value) % power),
    padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');

    return precision ? integral + '.' +  padding + fraction : integral;
}

function formatStringToNumber(n) {
    return toFixed(n, 2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

function getConfig(record) {
    var config = null;
    if (record != null) {
        try {

            var configIdPreference = record.getFieldValue('custbody_avt_ifs_config');
            if (configIdPreference) {
                config = nlapiLoadRecord('customrecord_avt_ifs_config', configIdPreference);

            } else {

                var context = nlapiGetContext();
                var isWorldAccount = context.getFeature('SUBSIDIARIES');
                var isMultiLocation = context.getFeature('LOCATIONS');
                Log('isWorldAccount', isWorldAccount);
                Log('isMultiLocation', isMultiLocation);
                var filter = new Array();

                if (isWorldAccount) {
                    var subsidiaryId = record.getFieldValue('subsidiary');
                    if (subsidiaryId == null) {
                        subsidiaryId = 1;
                    }
                    filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_conf_subsidiary', null, 'equalto', subsidiaryId);
                }
                var location = null;
                var recordType = record.getRecordType();
                if (isMultiLocation) {
                    if ((record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'itemfulfillment') || recordType == 'itemfulfillment') {
                        var count = record.getLineItemCount('item');
                        Log('count', count);
                        for (var x = 1; x <= count; x++) {
                            if (record.getLineItemValue('item', 'itemreceive', x) == 'T') {
                                location = record.getLineItemValue('item', 'location', x);
                                if (location != null && location != '') {
                                    break;
                                } else {
                                    location = 1;
                                }
                            }
                        }
                    } else if ((record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'salesorder') || recordType == 'salesorder') {
                        location = record.getFieldValue('location');
                        if (location == null || location == '') {
                            location = 1;
                        }
                    } else if ((record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'cashsale') || recordType == 'cashsale') {
                        location = record.getFieldValue('location');
                        if (location == null || location == '') {
                            location = 1;
                        }
                    } else if ((record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'estimate') || recordType == 'estimate') {
                        location = record.getFieldValue('location');
                        if (location == null || location == '') {
                            location = 1;
                        }
                    } else if ((record != null && record.getFieldValue('custbody_avt_ifs_type_record') == 'invoice') || recordType == 'invoice') {
                        location = record.getFieldValue('location');
                        if (location == null || location == '') {
                            location = 1;
                        }
                    }
                    if (location == null || location == '') {
                        location = 1;
                    }
                    filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_conf_location', null, 'is', location);
                    Log('location in isMultiLocation', location);
                }


                if (filter != null && filter.length > 0) {
                    var cols = new Array();
                    cols[cols.length] = new nlobjSearchColumn('internalid');
                    cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_username');

                    var searchresult = nlapiSearchRecord('customrecord_avt_ifs_config', null, filter, cols);
                    if (searchresult != null && searchresult.length > 0) {
                        var configObjectId = searchresult[0].getValue('internalid');
                        Log('searchresult.length', searchresult.length);
                        Log('config number custrecord_avt_ifs_username', searchresult[0].getValue('custrecord_avt_ifs_username'));
                        config = nlapiLoadRecord('customrecord_avt_ifs_config', configObjectId);
                        Log('config number', configObjectId);
                    } else {
                        Log('ERROR getConfigRecord for the subsidiaryId', subsidiaryId);
                    }
                }

            }
        } catch (e) {
            Log('NO subsidiary 1', e);
        }
    }
    if (config == null) {
        Log('config DEFAULT ---- because null');
        config =  nlapiLoadRecord('customrecord_avt_ifs_config', 1);
    }
    return config;
}

function getConfigWithSubsidiary(subsidiaryId, location) {
    var config = null;
    try {
        var context = nlapiGetContext();
        var isWorldAccount = context.getFeature('SUBSIDIARIES');
        var isMultiLocation = context.getFeature('LOCATIONS');
        Log('isWorldAccount getConfigWithSubsidiary', isWorldAccount);
        Log('isMultiLocation getConfigWithSubsidiary', isMultiLocation);
        var filter = new Array();
        if (isWorldAccount){
            if( subsidiaryId == null &&  subsidiaryId == '') {
                subsidiaryId = 1;
            }
            filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_conf_subsidiary', null, 'equalto', subsidiaryId);
            Log('subsidiaryId getConfigWithSubsidiary', subsidiaryId);
        }
        if (isMultiLocation) {
            if( location == null && location == '' ) {
                location = 1;
            }
            filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_conf_location', null, 'is', location);
            Log('location getConfigWithSubsidiary', location);
        }

        if (filter != null && filter.length > 0) {
            var cols = new Array();
            cols[cols.length] = new nlobjSearchColumn('internalid');
            cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_username');

            var searchresult = nlapiSearchRecord('customrecord_avt_ifs_config', null, filter, cols);
            if (searchresult != null && searchresult.length > 0) {
                var configObjectId = searchresult[0].getValue('internalid');
                config = nlapiLoadRecord('customrecord_avt_ifs_config', configObjectId);
                Log('config number', configObjectId);
            } else {
                Log('ERROR getConfigRecord for the subsidiaryId', subsidiaryId);
            }
        }
    } catch (e) {
        Log('NO subsidiary 2', e);
    }
    if (config == null) {
        config =  nlapiLoadRecord('customrecord_avt_ifs_config', 1);
    }
    return config;
}

function checkSaveNz() {
    try {
        var recaddr = new Recaddr();
        recaddr.add2 = nlapiGetFieldValue('shipaddr2');
        recaddr.add3 = nlapiGetFieldValue('shipcity');
        recaddr.add5 = nlapiGetFieldValue('shipzip');
        //alert("recaddr.add5 " + recaddr.add5 + " - recaddr.add3 " + recaddr.add3 + " - recaddr.add2 " + recaddr.add2);
        if ( recaddr.add5 != null ) {
            if ( recaddr.add5.toUpperCase() == 'NI' ||  recaddr.add5.toUpperCase() == 'SI' )  {
                return true;
            } else {
                var filter = new Array();
                 filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_city_town_nz', null, 'is', recaddr.add3);
                 if ( recaddr.add2 != '') {
                     filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_city_locality', null, 'is', recaddr.add2);
                 }

                 var cols = new Array();
                 cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_city_island_code');
                 cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_city_locality');

                 var searchresult = nlapiSearchRecord('customrecord_avt_ifs_city_nz', null, filter, cols);

                 if (searchresult != null && searchresult.length > 0) {
                     if ( searchresult.length > 1 ) {
                         var cityLocality = "";
                         for (var int = 0; int < searchresult.length; int++) {
                               cityLocality += searchresult[int].getValue('custrecord_avt_ifs_city_locality');
                               if ( (int + 1) < searchresult.length) {
                                   cityLocality += " or ";
                               }
                         }
                         alert("We find the city :'" + recaddr.add3 +"'\nBut please you need to provide in address 2: '" +  cityLocality +"'" );
                         return false;
                     } else {
                          var codeZip = searchresult[0].getText('custrecord_avt_ifs_city_island_code');
                          nlapiSetFieldValue('shipzip', codeZip, false);
                          return true;
                     }
                 } else {
                     alert("we can't find the city :'" + recaddr.add3 +"'\n with the locality: '" +  recaddr.add2 +"'" );
                     return false;
                 }
            }
        }
    } catch (Error) {

    }
    return true;
}

function getItemsWeight(recordId, configObjectApi) {
    var itemsWeight = 0;
    if (recordId != null && recordId != '') {
        var record = LoadRecord(recordId);
        if (configObjectApi == null || configObjectApi == '') {
            configObjectApi = getConfig(record);
        }

        var recordDefaultUnitMeasure = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') : "1";
        Log("recordDefaultUnitMeasure",recordDefaultUnitMeasure);
        var nbItem =  record.getLineItemCount('item');
        if (nbItem > 0) {
            for (var i=1; i <= nbItem; i++) {
                var itemId = record.getLineItemValue( 'item', 'item', i );
                var quantity = record.getLineItemValue( 'item', 'quantity', i );
                var isclosed = record.getLineItemValue( 'item', 'isclosed', i );
                //var item =  nlapiLoadRecord('inventoryitem' , itemId );
                var item = LoadItemRecord(itemId);

                Log("quantity",quantity);
                if (item != null && isclosed != "T") {
                    var weight = item.getFieldValue('weight');
                    Log("weight",weight);
                    if (weight != null && weight != "") {
                        var weightunit = item.getFieldValue('weightunit');
                        Log("weightunit",weightunit);
                        if (weightunit != null && weightunit != "") {
                            var coefConvert = nlapiLookupField('customrecord_avt_unitweight', recordDefaultUnitMeasure, 'custrecord_avt_unit_conv_to_' + weightunit , false);

                            var weightVariance = (configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') != null && configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') != '') ? configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') : '0';
                            if (weightVariance != 0) {
                                weightVariance = coefConvert * weight * quantity * weightVariance/ 100;
                            }
                            itemsWeight += ( (coefConvert * weight * quantity) + CNULL(weightVariance) );
                            Log("itemsWeight", itemsWeight );
                        }
                    }
                }
            }
        }
    }
    return itemsWeight;
}


function getItemsCubic(recordId, configObjectApi) {
    var itemsCubic = 0;
    if (recordId != null && recordId != '') {

        var record = LoadRecord(recordId);
        //var configObjectApi = getConfig(record);

        var recordDefaultUnitMeasure = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') : "1";
        Log("recordDefaultUnitMeasure",recordDefaultUnitMeasure);
        var nbItem =  record.getLineItemCount('item');
        if (nbItem > 0) {
            for (var i=1; i <= nbItem; i++) {
                var itemId = record.getLineItemValue( 'item', 'item', i );
                var quantity = record.getLineItemValue( 'item', 'quantity', i );
                var isclosed = record.getLineItemValue( 'item', 'isclosed', i );
                //var item =  nlapiLoadRecord('inventoryitem' , itemId );
                var item = LoadItemRecord(itemId);

                Log("quantity",quantity);
                if (item != null && isclosed != "T") {
                    var cubic = item.getFieldValue('custitem_avt_ifs_cubic_volume');
                    if ( cubic != null && cubic != '') {
                        var cubicVariance = (configObjectApi.getFieldValue('custrecord_avt_ifs_cubic_variance') != null && configObjectApi.getFieldValue('custrecord_avt_ifs_cubic_variance') !=  '') ? configObjectApi.getFieldValue('custrecord_avt_ifs_cubic_variance') : '0';
                        if (cubicVariance != 0 ) {
                            cubicVariance = cubic * quantity * cubicVariance / 100;
                        }
                        itemsCubic += ( (cubic  * quantity ) + CNULL(cubicVariance)) ;
                    }
                }
            }
        }
    }
    return itemsCubic;
}


function GetIfsPackageRecord(record) {
    Log("GetIfsPackageRecord");
    StartTime("GetIfsPackageRecord");
    var results = new Array();

    Log('internalid : ' , record.getId() );

    var filter = new Array();
    filter[filter.length] = new nlobjSearchFilter('custrecord_avt_ifs_record_transid', null, 'anyof', record.getId() );
    var cols = new Array();
    cols[cols.length] = new nlobjSearchColumn('internalid');

    var searchresult = nlapiSearchRecord('customrecord_avt_ifs_record', null, filter, cols);

    if (searchresult != null && searchresult.length > 0) {
        for ( var i = 0; i < searchresult.length; i++) {
            var ifsPackageRecord = LoadIFSPackageRecord(searchresult[i].getValue('internalid') );
            results.push(ifsPackageRecord);
        }
    }
    EndTime("GetIfsPackageRecord");
    Log("GetIfsPackageRecord end find: ", results.length);
    return results;
}

function CallScript(scriptName, f_recordId, isAutoImport, currentContext) {

    try {

        var params = new Array();
        params['deploy'] = 1;
        params['f_recordid'] = f_recordId;
        if (isAutoImport != null && isAutoImport != '') {
            params['isAutoImport'] = isAutoImport;
        }
        Log('currentContext', currentContext);
        if (currentContext != null && currentContext == 'userevent') {
            Log('scriptName', scriptName);
            Log('f_recordId', f_recordId);

            //var url = nlapiResolveURL('SUITELET', scriptName, 1);
            var configGlobal =  nlapiLoadRecord('customrecord_avt_ifs_global_conf', 1);
            var urlImport = configGlobal.getFieldValue('custrecord_avt_ifs_conf_url_no_spit_im');
            Log('urlImport', urlImport  + '&f_recordid=' + f_recordId + '&isAutoImport=' + isAutoImport);
            // HOT TONER NEED TO COMMENTS
            if (urlImport != null && urlImport != '') {
                var response = nlapiRequestURL( urlImport  + '&f_recordid=' + f_recordId + '&isAutoImport=' + isAutoImport, null, null);
            }

        } else {
            nlapiSetRedirectURL('SUITELET', scriptName, 1, null, params);
        }
    } catch (Error) {
        Log('error', Error.message);
    }

}

function CNULL(data) {
    try {

        data = parseFloat(formatPriceToFloat(data));
        if (!isNaN(data) && isFinite(data)) {
            return data;
        }
    } catch (Error) {
        //NOTHING
    }

    return 0;
}

function CNULL2(data) {
    try {

        data = parseFloat(data);
        if (!isNaN(data) && isFinite(data)) {
            return data;
        }
    } catch (Error) {
        //NOTHING
    }

    return 0;
}

function CNULLString(data) {
    try {

        data = parseFloat(data);
        if (!isNaN(data) && isFinite(data)) {
            return data;
        }
    } catch (Error) {
        //NOTHING
    }

    return '';
}

function formatPriceToFloat(price) {
    if (price != null && price != '') {
        return price.toString().replace(/[^0-9-.]/g, '');
    }
    return "";
}

function MyNlapiEscapeXML(stringXml) {
    if (stringXml != null && stringXml != 'null') {
        return nlapiEscapeXML(stringXml);
    }
    return "";
}

function getWeight() {
    try{
        var count = nlapiGetLineItemCount('item');

        var totalLine = 0;

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
        if (subsidiaryId == null) {
          subsidiaryId = 1;
        }
        var location = nlapiGetFieldValue('location');
        if (location == null) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);

        var recordDefaultUnitMeasure = (configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') != null) ? configObjectApi.getFieldValue('custrecord_avt_ifs_conf_unit_measure') : "1";

        var itemLinequatityArray = new Array();
        var internalIdArray = new Array();
        for (var x = 1; x <= count; x++) {
            if (nlapiGetLineItemValue('item', 'isclosed', x) != 'T') {
                itemLinequatityArray[itemLinequatityArray.length] = nlapiGetLineItemValue('item', 'quantity', x);
                internalIdArray[internalIdArray.length] = nlapiGetLineItemValue('item', 'item', x);
            }
        }

        if (internalIdArray != null && internalIdArray.length > 0) {
            var weightVarance = (configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') != null && configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') != "" ) ? configObjectApi.getFieldValue('custrecord_avt_ifs_weight_variance') : '0';
            weightVarance = CNULL2(weightVarance);
            var filter = new Array();
            filter[filter.length] = new nlobjSearchFilter('internalid', null, 'anyof', internalIdArray );

            var cols = new Array();
            cols[cols.length] = new nlobjSearchColumn('internalid');
            cols[cols.length] = new nlobjSearchColumn('weight');
            cols[cols.length] = new nlobjSearchColumn('weightunit');
            cols[cols.length] = new nlobjSearchColumn('itemid');

            var searchresult = nlapiSearchRecord('item', null, filter, cols);
            if (searchresult != null && searchresult.length > 0) {
                for (var i = 0; i < searchresult.length; i++) {
                    var internalid = searchresult[i].getValue( "internalid");
                    for ( var int = 0; int < internalIdArray.length; int++) {
                        if (internalid == internalIdArray[int] ) {
                            var weight = searchresult[i].getValue( "weight");
                            if (weight != null && weight != '' ) {
                                var weightunit = searchresult[i].getValue( "weightunit");
                                if (weightunit != null  && weightunit!= '') {
                                    //need to be load before to be faster (in a tab)
                                    var coefConvert = nlapiLookupField('customrecord_avt_unitweight', recordDefaultUnitMeasure, 'custrecord_avt_unit_conv_to_' + weightunit , false);
                                    if (weightVarance != 0) {
                                        weightVarance = CNULL2(coefConvert * weight * itemLinequatityArray[int] * weightVarance / 100);
                                    }
                                    totalLine += CNULL2( CNULL2( coefConvert * weight * itemLinequatityArray[int] ) + weightVarance);
                                }
                            }
                            break;
                        }
                    }
                }
            }

            var freightTypeId = nlapiGetFieldValue('custbody_avt_ifs_freight_type');
            if (freightTypeId != null && freightTypeId != '') {
                var params = new Array();
                params.push('custrecordavt_ifs_freighttype_weight');
                var values = nlapiLookupField('customrecord_avt_ifs_freight_type', freightTypeId , params);
                if (values != null && values.custrecordavt_ifs_freighttype_weight != '') {
                    totalLine += CNULL2(values.custrecordavt_ifs_freighttype_weight);
                }
            }

            return totalLine;
        }
    } catch (e) {
        Log('ERROR in calculateWeightSO', e);
    }
}

function getVolume() {
    try{
        var totalLine = 0;

        var count = nlapiGetLineItemCount('item');

        var subsidiaryId = nlapiGetFieldValue('subsidiary');
        if (subsidiaryId == null) {
          subsidiaryId = 1;
        }
        var location = nlapiGetFieldValue('location');
        if (location == null) {
            location = 1;
        }

        var configObjectApi = getConfigWithSubsidiary(subsidiaryId, location);

        var itemLinequatityArray = new Array();
        var internalIdArray = new Array();

        for (var x = 1; x <= count; x++) {
            if (nlapiGetLineItemValue('item', 'isclosed', x) != 'T') {
                itemLinequatityArray[itemLinequatityArray.length] = nlapiGetLineItemValue('item', 'quantity', x);
                internalIdArray[internalIdArray.length] = nlapiGetLineItemValue('item', 'item', x);
            }
        }

        var cubicVariance = (configObjectApi.getFieldValue('custrecord_avt_ifs_cubic_variance') != null && configObjectApi.getFieldValue('custrecord_avt_ifs_cubic_variance') != "" ) ? configObjectApi.getFieldValue('custrecord_avt_ifs_cubic_variance') : '0';

        var filter = new Array();
        filter[filter.length] = new nlobjSearchFilter('internalid', null, 'anyof', internalIdArray );

        var cols = new Array();
        cols[cols.length] = new nlobjSearchColumn('internalid');
        cols[cols.length] = new nlobjSearchColumn('custitem_avt_ifs_cubic_volume');
        cols[cols.length] = new nlobjSearchColumn('itemid');

        var searchresult = nlapiSearchRecord('item', null, filter, cols);
        if (searchresult != null && searchresult.length > 0) {
            for (var i = 0; i < searchresult.length; i++) {
                var internalid = searchresult[i].getValue( "internalid");
                for ( var int = 0; int < internalIdArray.length; int++) {
                    if (internalid == internalIdArray[int] ) {
                        var cubicVolume = searchresult[i].getValue( "custitem_avt_ifs_cubic_volume");
                        if (cubicVolume != null && cubicVolume != '' ) {
                            if (cubicVariance != 0) {
                                cubicVariance = cubicVolume  * itemLinequatityArray[int] * cubicVariance / 100;
                            }
                            totalLine += ( (cubicVolume  * itemLinequatityArray[int] ) + CNULL(cubicVariance)) ;
                        }
                        break;
                    }
                }
            }
        }
        return totalLine;

    } catch (e) {
        //alert('ERROR in calculateCubicSOV2' , e.message);
        Log('ERROR in calculateCubicSO', e);
    }
}


function SetAvtIfsFreightType(recordId, endText){
    StartTime("GetCustomRecordAvtIfsFreightType");
    var avtIfsFreightType = new CustomRecordAvtIfsFreightType();
    if (recordId != null && recordId != '' ) {
        var filter = new Array();
        var cols = new Array();
        filter[filter.length] = new nlobjSearchFilter('internalid', null, 'anyof', recordId);
        cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_description');
        cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_service_id');
        cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_volume');
        cols[cols.length] = new nlobjSearchColumn('custrecordavt_ifs_freighttype_weight');
        cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_height');
        cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_width');
        cols[cols.length] = new nlobjSearchColumn('custrecord_avt_ifs_freight_length');

        var search = nlapiSearchRecord('customrecord_avt_ifs_freight_type', null, filter, cols);

        if (search != null && search.length > 0) {
            for (var x = 0; x < search.length; x++) {
                var volume = search[x].getValue('custrecord_avt_ifs_freight_volume');
                if(volume != null && volume != ''){  // variable may contain 0
                    nlapiSetFieldValue('custbody_avt_ifs_total_volume_pkg' + endText, volume, true, false);
                }
                var weight = search[x].getValue('custrecordavt_ifs_freighttype_weight');
                if(weight != null && weight != ''){
                    nlapiSetFieldValue('custbody_avt_ifs_total_weight_pkg' + endText, weight, true, false);
                }
                var height = search[x].getValue('custrecord_avt_ifs_freight_height');
                if(height != null && height != ''){
                    nlapiSetFieldValue('custbody_avt_ifs_total_height' + endText, height, false, false);
                }
                var width = search[x].getValue('custrecord_avt_ifs_freight_width');
                if(width != null && width != ''){
                    nlapiSetFieldValue('custbody_avt_ifs_total_width' + endText, width, false, false);
                }
                var length = search[x].getValue('custrecord_avt_ifs_freight_length');
                if(length != null && length != ''){
                    nlapiSetFieldValue('custbody_avt_ifs_total_length' + endText, length, false, false);
                }
            }
        }
    }

    EndTime("GetCustomRecordAvtIfsFreightType");
    return avtIfsFreightType;
}


function SplitAEE_TurboSmart() {
    'use strict';

    try {
        var recordType = nlapiGetRecordType();

        if (recordType !== 'salesorder' && recordType !== 'itemfulfillment'){
            return;
        }

        nlapiSetFieldValue('custbody_avt_ifs_shipcarrier', 4, true, true); // AEE
        nlapiSetFieldValue('custbody_avt_ifs_shipservice', 22, true, true); // AEE service PREPAID
        var originalWeightWithVariance = getWeight();  // this weight includs variance
        var weightToBook = originalWeightWithVariance;
        var originalVolumeWithVariance = getVolume();

        var dimensionalWeight  = originalVolumeWithVariance * 250;
        if (dimensionalWeight > weightToBook) {
            weightToBook = dimensionalWeight;
        }

        var quotientOf5 = weightToBook / 5;
        var remainingWeight = weightToBook;
        var numberOf3KgBox = 0;
        var totalWeightOf3KgBoxes = 0;
        var numberOf5KgBox = 0;
        var totalWeightOf5KgBoxes = 0;

        if (quotientOf5 >= 1) {
            numberOf5KgBox =  Math.floor(quotientOf5);
            totalWeightOf5KgBoxes = numberOf5KgBox * 5;
        }
        remainingWeight = weightToBook - totalWeightOf5KgBoxes;

        if (remainingWeight > 3) {
            numberOf5KgBox++;
            totalWeightOf5KgBoxes += remainingWeight;
        } else if (remainingWeight > 0) {
            numberOf3KgBox = 1;
            totalWeightOf3KgBoxes += remainingWeight;
        }
        remainingWeight = 0;

        // remove current values
        nlapiSetFieldValue('custbody_avt_ifs_freight_type', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_total_packages', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_total_weight', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_total_volume', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_freight_type_2', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_total_packages_2', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_total_weight_2', '', false, false);
        nlapiSetFieldValue('custbody_avt_ifs_total_volume_2', '', false, false);

        var extentionOfFields = ''; // use this to change fields to fill up
        if(numberOf5KgBox > 0){
            nlapiSetFieldValue('custbody_avt_ifs_freight_type', 30, false, false); // 5kg
            nlapiSetFieldValue('custbody_avt_ifs_total_packages', numberOf5KgBox, false, false);
            nlapiSetFieldValue('custbody_avt_ifs_total_weight', totalWeightOf5KgBoxes, false, false);
            nlapiSetFieldValue('custbody_avt_ifs_total_volume', (numberOf5KgBox * 0.0175), false, false); // 5kg volume
            extentionOfFields = '_2';
        }
        if(numberOf3KgBox > 0){
            // 5Kg * N + 3Kg
            nlapiSetFieldValue('custbody_avt_ifs_freight_type' + extentionOfFields, 29, false, false); //3kg
            nlapiSetFieldValue('custbody_avt_ifs_total_packages' + extentionOfFields, numberOf3KgBox, false, false);
            nlapiSetFieldValue('custbody_avt_ifs_total_weight' + extentionOfFields, totalWeightOf3KgBoxes, false, false);
            nlapiSetFieldValue('custbody_avt_ifs_total_volume' + extentionOfFields, (numberOf3KgBox * 0.01), false, false); // 3kg volume
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

//Get a standard NetSuite record
function getRecord(datain) {
    try {
         Log("getRecord ");
         var o = new Object();
         o.sayhi = 'Hello World! ' + datain.recordId + " " + datain.recordType;
         //var record = LoadRecord(datain.recordId);


         Log("Hello World! ");
         return o.sayhi;

    } catch (e) {
        Log("Error " + e.message);
    }

}

var mapTime = new Map();

function StartTime(str){
    var startT = new Date().getTime();
    mapTime.put(str, startT);
}

function EndTime(str) {

    if (mapTime.get(str) != ''){
        var end = new Date().getTime();
        var start = mapTime.get(str);
        Log("Timing : " + str , (end - start) / 1000 + " s");
        mapTime.remove(str);
    }
}

function escapeHtmlMetaChar(str) {
    if (!str || typeof str !== 'string'){
        return str;
    }
    str = str.replace(/&/g,'&amp;');
    str = str.replace(/</g,'&lt;');
    str = str.replace(/>/g,'&gt;');
    str = str.replace(/"/g,'&quot;');
    str = str.replace(/'/g,'&#039;');
    return str;
};

/****** MAP FUNTION ******/
function Map() {

this.keys = new Array();
this.data = new Object();

    this.put = function(key, value) {
        if(this.data[key] == null){
            this.keys.push(key);
        }
        this.data[key] = value;
    };

    this.get = function(key) {
        return this.data[key];
    };

    this.remove = function(key) {
        var index = this.keys.indexOf(key);
        if (index != null && index != -1) {
            this.keys.splice(index, 1);
            this.data[key] = null;
        }

    };

    this.each = function(fn){
        if(typeof fn != 'function'){
            return;
        }
        var len = this.keys.length;
        for(var i=0;i<len;i++){
            var k = this.keys[i];
            fn(k,this.data[k],i);
        }
    };

    this.entrys = function() {
        var len = this.keys.length;
        var entrys = new Array(len);
        for (var i = 0; i < len; i++) {
            entrys[i] = {
                key : this.keys[i],
                value : this.data[i]
            };
        }
        return entrys;
    };

    this.isEmpty = function() {
        return this.keys.length == 0;
    };

    this.size = function(){
        return this.keys.length;
    };
}
/****** MAP FUNTION END ********/

/* customrecord_avt_ifs_freight_type */
function CustomRecordAvtIfsFreightType(){
    this.custrecord_avt_ifs_description = "";
    this.custrecord_avt_ifs_service_id = new CustomRecordAvtIfsServices(); //Service customrecord_avt_ifs_services
    this.custrecord_avt_ifs_freight_volume = "";
    this.custrecordavt_ifs_freighttype_weight = "";
    this.custrecord_avt_ifs_freight_height = "";
    this.custrecord_avt_ifs_freight_width = "";
    this.custrecord_avt_ifs_freight_length = "";
}

/* customrecord_avt_ifs_services */
function CustomRecordAvtIfsServices() {
    this.custrecord_avt_ifs_data = "";
    this.custrecord_avt_ifs_sercice = new CustomRecordAvtIfsCarrier(); //Carrier  customrecord_avt_ifs_carrier
}

/* customrecord_avt_ifs_carrier */
function CustomRecordAvtIfsCarrier() {
    this.custrecord_avt_ifs_carriername = "";
    this.custrecord_avt_ifs_accountno = "";
}




function getAccount() {
    return 'TSTDRV704278';
}

function credentials() {
    this.email='nicolas@abvt.com.au';
    this.account=getAccount();
    this.role='3';
    this.password='ABVT1234';
}

function getRESTletURL() {
    return 'https://rest.na1.netsuite.com/app/site/hosting/restlet.nl?script=127&deploy=1&c='+getAccount(); // for phasing
}

function getOpportunites() {
    alert("getOpportunites");
    var url = getRESTletURL() + '&recordId=' + nlapiGetRecordId() + "&recordType=" + nlapiGetRecordType() ;
    //var url = getRESTletURL();
    var cred = new credentials();
    var headers = new Array();
    headers['User-Agent-x'] = 'SuiteScript-Call';
    headers['Authorization'] = 'NLAuth nlauth_account='+cred.account+', nlauth_email='+cred.email+', nlauth_signature='+cred.password+', nlauth_role='+cred.role;
    headers['Content-Type'] = 'application/json';
    var response = nlapiRequestURL( url, null, headers );
    var responsebody = JSON.parse(response.getBody());
    var error = responsebody['error'];
    alert(response.getBody());
    if (error) {
        var code = error.code;
        var message = error.message;
        nlapiLogExecution('DEBUG','failed: code='+code+'; message='+message);
        nlapiCreateError(code, message, false);
    }
    return responsebody['nssearchresult'];
}

function opportunity(internalid, title, probability, amount, customer, salesrep) {
    this.id = internalid;
    this.title = title;
    this.probability = probability;
    this.amount = amount;
    this.customer = customer;
    this.salesrep = salesrep;
}


/* ################################################
 *   [Error Report related code] begin
 * ################################################ */

/**
 * Log entry entity class
 * Used by Logger Module and Utility Module
 */
function LogEntry(logType, title, details){
    'use strict';

    this.datetime = '';
    this.logType = '';
    this.title = '';
    this.details = '';

    // constructor
    var now = new Date();
    this.datetime = now.toString();

    logType = logType || '';
    title = title || '';
    details = details || '';

    if(typeof logType !== 'string'){
        logType = logType.toString();
    }
    // max length of type of nlapiLogExecution() is 9 characters (EMERGENCY)
    this.logType = logType.slice(0, 9);

    if(typeof title !== 'string'){
        title = title.toString();
    }
    // max length of title of nlapiLogExecution() is 99 characters
    this.title = title.slice(0, 99);
    if(typeof details !== 'string'){
        details = details.toString();
    }
    // max length of details of nlapiLogExecution() is 3999 characters
    this.details = details.slice(0, 3999);

    return this;
};

function writeErrorReportToResponse(response, message, errorObj, doesAppendLog){

    if(doesAppendLog !== false){
        doesAppendLog = true;
    }

    var form = nlapiCreateForm('Error Report', false);
    var inlineHtml = form.addField('custpage_error_message', 'inlinehtml');

    if(!message){
        message = '';
    }
    var messageInErrorObject = null;
    try {
        messageInErrorObject = errorObj.message;
    } catch (e){}
    if(!messageInErrorObject){
        messageInErrorObject = '';
    }
    var codeInErrorObject = null;
    try {
        errorObj.getCode();
    } catch (e){}
    if(!codeInErrorObject){
        codeInErrorObject = '';
    }

    var htmlBodyCode =
        '<p style="font-weight: bold;">' + message + '</p>';
    if(errorObj){
        htmlBodyCode +=
            '<br />' +
            '<p>' + '[Message]<br />' + escapeHtmlMetaChar(messageInErrorObject) + '</p>' +
            '<p>' + '[Code]<br /> ' + escapeHtmlMetaChar(codeInErrorObject).replace(/\n/g, '<br />') + '</p>' +
            '<br /><br />';
        }

    var context = nlapiGetContext();
    if(context){
        htmlBodyCode +=
            '<br />' +
            '<h2>Context Information</h2>' +
            '<p>[Account ID] \'' + context.getCompany() + '\'</p>' +
            '<p>[Environment] \'' + context.getEnvironment() + '\'</p>' +
            '<p>[User ID] \'' + context.getUser() + '\'</p>' +
            '<p>[Execution Context] \'' + context.getExecutionContext() + '\'</p>' +
            '<p>[Script ID] \'' + context.getScriptId() + '\'</p>' +
            '<p>[Deployment ID] \'' + context.getDeploymentId() + '\'</p>' +
            '<p>[Remaining Usage] \'' + context.getRemainingUsage() + '\'</p>';
    }
    var htmlCode = '<html><body>' + htmlBodyCode +'</body></html>';
    inlineHtml.setDefaultValue(htmlCode);

    var logEntryArray = g_logEntryArray;
    if(doesAppendLog){
        var subList = form.addSubList('custpage_log_table', 'list', 'Recent Log', false);
        subList.addField('type', 'text', 'Level', null);
        subList.addField('date', 'text', 'Date', null);
        subList.addField('title', 'text', 'Title', null);
        subList.addField('details', 'textarea', 'Details', null);

        for(var i=0; i < logEntryArray.length; i++){
            var log = logEntryArray[i];
            subList.setLineItemValue('type', i + 1, log.logType);
            subList.setLineItemValue('date', i + 1, log.datetime);
            subList.setLineItemValue('title', i + 1, log.title.slice(0, 300));
            subList.setLineItemValue('details', i + 1, log.details.slice(0, 4000));
        }
    }

    // bury log data and download function as inline HTML
    var contextInfo = {
            accountId:context.getCompany(),
            environment:context.getEnvironment(),
            userId:context.getUser(),
            executionContext: context.getExecutionContext(),
            scriptId:context.getScriptId(),
            deploymentId:context.getDeploymentId(),
            remainingUsage:context.getRemainingUsage()};

    var errorReport = {
            message:message,
            errorMessage:errorObj.message,
            contextInfo:contextInfo,
            logEntryArray:logEntryArray};
    var errorReportJsonString = JSON.stringify(errorReport);
    errorReportJsonString =
        errorReportJsonString.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    addClientScriptToForm(
            form,
            'custpage_download_error_report',
            'downloadErrorReport',
            __clientScript_downloadErrorReport,
            {errorReportJsonString:errorReportJsonString});

    var downloadButton = form.addButton('custpage_download_error_report_button', 'Download Report', 'downloadErrorReport();');

    response.setEncoding('UTF-8');
    response.setContentType('HTMLDOC', null, 'inline');
    response.writePage(form);
    return;
};

/**
 * this function is converted to client script dynamically
 * not invoked on server
 */
function __clientScript_downloadErrorReport(){
    'use strict';

    // content of this variable is replaced by converter dynamically
    var _ERROR_REPORT_STRING = '${errorReportJsonString}';
    var blob = null;
    try{
        blob = new Blob([_ERROR_REPORT_STRING], {type:'text/plain'});
    } catch (e){
        console.debug('Failed to create Blob object.');
        console.debug(e.message);
        return;
    }

    var now = new Date();
    var dateTime = now.getFullYear() + '-';
    dateTime += ('0' + (now.getMonth() + 1)).slice(-2) + '-';
    dateTime += ('0' + now.getDate()).slice(-2) + '_';
    dateTime += ('0' + now.getHours()).slice(-2) + '-';
    dateTime += ('0' + now.getMinutes()).slice(-2) + '-';
    dateTime += ('0' + now.getSeconds()).slice(-2);

    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ErrorReport_' + dateTime + '.txt';
    link.click();
};

function addClientScriptToForm(form, fieldId, functionName, sourceFunction, stringMap){
    var scriptHtmlField = form.addField(fieldId, 'inlinehtml', null, null, false);

    var scriptStr = convertFunctionToClientScriptString(
            sourceFunction, stringMap, functionName);

    if(scriptStr.indexOf('</script>') >= 0){
        scriptStr = scriptStr.replace(/<\/script>/g, '&lt;/script&gt;');
    }
    scriptHtmlField.setDefaultValue('<script>' + scriptStr + '</script>');

    return scriptHtmlField;
};

function convertFunctionToClientScriptString(sourceFunction, stringMap, functionName){

    if(!stringMap){
        stringMap = new Object();
    }
    // toString() replaces all single quote (') for string quotation to (")
    // e.g. var string = 'Foo "Bar" Buz'; --> var string = "Foo \"Bar\" Buz";
    var returnValue = sourceFunction.toString();
    var regExp = null;
    for(var prop in stringMap){
        if (stringMap[prop]){
            // replace ${propName} with stringMap[propName]
        regExp = new RegExp('\\$\\{\\s*' + prop + '\\s*\\}', 'g');
        returnValue = returnValue.replace(regExp, stringMap[prop]);
        }
    }
    if(functionName){
        returnValue = returnValue.replace(/function.*\(/, 'function ' + functionName + '(');
    } else {
        // convert function as immediate function
        returnValue = '(' + returnValue + ')();';
    }
    Log('convertFunctionToClientScriptString returns', returnValue);

    return returnValue;
};

/* ### [Error Report related code] end ############ */


/**
 * This abject is stored in bworser global object to help client script
 */
function ClientScriptData(){
    this.subsidiaryId = null;
    this.location = null;
    this.senderId = null;
    /** @type nlobjRecord */
    this.globalConfigRecord = null;
    /** @type nlobjRecord */
    this.configRecord = null;
    this.carrierDefault = {
        /** @type number - This value is set on fieldChanged client script event.
         * The value is set back to 0 after default service is set on postSourcing client script event. */
        serviceId: 0,
        /** @type number - This value is set on fieldChanged client script event.
         * The value is set back to 0 after default freight type is set on postSourcing client script event. */
        freightTypeId: 0
    }
}


//#########################
//##  For Furnware begin ##
//#########################

function OnFieldChangeSOAlt1(type, name, linenum) {
    try{

        var wasConfigChanged = false;
        if (name == 'subsidiary' || name == 'location' || name == 'entity') {
            wasConfigChanged = UpdateClientScriptData();
        }
        var configObjectApi = window.AvtClientScriptData.configRecord;
        if (wasConfigChanged) {
            // if it is creation not edit
            if (!nlapiGetRecordId()) {
                InitPrinterIdOnTransactionRecord(configObjectApi);
            }
        }

        var entityId = nlapiGetFieldValue('entity');
        if (entityId != null && entityId != '') {
            if ( name == 'subsidiary' || name == 'location' || name == 'entity') {
                UpdateDefaultDataForSO(configObjectApi, entityId);
            }
        }
        updateFreightLineDetailOnFieldChange(configObjectApi, type, name, linenum);

    } catch (e) {
        console.error('Error occurred in OnFieldChangeSO. ' + e.message);
    }
}

//#######################
//##  For Furnware end ##
//#######################
