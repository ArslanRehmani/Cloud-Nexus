/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       16 Sep 2015     kenji
 *
 */



/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
    'use strict';
    var logFunctionName = 'userEventBeforeLoad';
    try{

        var handler = new UserEventHandler();
        handler.handleUserEventBeforeLoad(type, form, request);

    } catch (e){
        Logger.logErrorObjectE(logFunctionName, e, 'Unhandled error occurred.', null, false);
    }
};

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function userEventBeforeSubmit(type){
    'use strict';
    var logFunctionName = 'userEventBeforeSubmit';
    try{

        var handler = new UserEventHandler();
        handler.handleUserEventBeforeSubmit(type);

    } catch (e){
        Logger.logErrorObjectE(logFunctionName, e, 'Unhandled error occurred.', null, false);
    }
};

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
 * @appliedtorecord recordType
 *
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only)
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function userEventAfterSubmit(type){
    'use strict';
    var logFunctionName = 'userEventAfterSubmit';
    try{

    } catch (e){
        Logger.logErrorObjectE(logFunctionName, e, 'Unhandled error occurred.', null, false);
    }
};



function UserEventHandler(){
    'use strict';

    this._recordType = null;
    /** @type nlobjRecord */
    this._newRecord = null;
    this._recordId = null;
    /** @type nlobjRecord */
    this._record = null;
    /** @type nlobjRecord */
    this._configRecord = null;

    this._constructor();
};

UserEventHandler.prototype._SUPPORTED_RECORDTYPE_ARRAY = ['salesorder', 'itemfulfillment', 'cashsale', 'estimate', 'invoice', 'transferorder'];
UserEventHandler.prototype._FID_ORDER_DATE_FOR_EMAIL = 'custbody_avt_ifs_order_date_for_email';

UserEventHandler.prototype._constructor = function(){
    'use strict';
    var logFunctionName = 'UserEventHandler.prototype._constructor';

    this._recordType = nlapiGetRecordType();
    try{
        this._newRecord = nlapiGetNewRecord();
    } catch (e){
        this._newRecord = null;
    }
    try{
        this._recordId = nlapiGetRecordId();
    } catch(e){
        this._recordId = null;
    }
    if(this._recordId){
        try{
            this._record = nlapiLoadRecord(this._recordType, this._recordId, null);
        } catch(e){
            this._record = null;
        }
    }
    this._configRecord = getConfig(this._recordId ? this._record : this._newRecord);


    Logger.logVariablesD(logFunctionName,
            ['this._recordType', this._recordType, 'this._newRecord', this._newRecord,
             'this._recordId', this._recordId, 'this._record', this._record,
             'this._configRecord', this._configRecord], false, null);

    if(!this._recordType){
        throw new Error('Failed to load record type.');
    }
    if(!this._configRecord){
        throw new Error('Failed to config record.');
    }
};



UserEventHandler.prototype.handleUserEventBeforeLoad = function (type, form, request){
    'use strict';
    var logFunctionName = 'UserEventHandler.prototype.handleUserEventBeforeLoad';
    Logger.logStartFunctionD(logFunctionName, ['type', type, 'form', form, 'request', request], false, null);

    if(this._SUPPORTED_RECORDTYPE_ARRAY.indexOf(this._recordType) < 0){
        Logger.logVariables(Logger.LOG_LEVEL_AUDIT, logFunctionName, ['type', type, 'form', form, 'request', request], false, 'Record type is unepected type.');
        return;
    }

    switch (this._recordType){
    case 'salesorder':
        break;
    case 'itemfulfillment':
        break;
    case 'cashsale':
        break;
    case 'estimate':
        break;
    case 'invoice':
        this._initInvoiceRecordBeforeLoad(type, form, request);
        break;
    case 'transferorder':
        break;
    default:
    }

    Logger.logFinishFunctionD(logFunctionName, null, false, null);
};


UserEventHandler.prototype.handleUserEventBeforeSubmit = function (type){
    'use strict';
    var logFunctionName = 'UserEventHandler.prototype.handleUserEventBeforeSubmit';
    Logger.logStartFunctionD(logFunctionName, ['type', type], false, null);

    if(this._SUPPORTED_RECORDTYPE_ARRAY.indexOf(this._recordType) < 0){
        Logger.logVariables(Logger.LOG_LEVEL_AUDIT, logFunctionName, ['type', type], false, 'Record type is unepected type.');
        return;
    }

    switch (this._recordType){
    case 'salesorder':
        break;
    case 'itemfulfillment':
        break;
    case 'cashsale':
        break;
    case 'estimate':
        break;
    case 'invoice':
        break;
    case 'transferorder':
        if(type == 'create'){
            this._fillDefaultFieldValueFromLocationRecord();
        }
        break;
    default:
    }

    if(type == 'create'){
        this._initOrderDateForEmailField();  // run this on all record type
    }

    Logger.logFinishFunctionD(logFunctionName, null, false, null);
};


UserEventHandler.prototype._initInvoiceRecordBeforeLoad = function(type, form, request){
    'use strict';
    var logFunctionName = 'UserEventHandler.prototype._initInvoiceRecordBeforeLoad';

    var record = this._record;
    var configRecord = this._configRecord;
    var isIfsEnabled = this._isIfsEnabledForm();
    Logger.logVariables(Logger.LOG_LEVEL_AUDIT, logFunctionName, ['isIfsEnabled', isIfsEnabled], false, 'This custom form is not IFS enabled form.');
    if(isIfsEnabled){
        // do something only for IFS enabled form


        // make shipping cost free when it is free shipping applied
        var isFIS = nlapiGetFieldValue('custbody_avt_ifs_fis');
        if (isFIS == 'T') {
            nlapiSetFieldValue('shippingcost', 0, null, true);
        }

        var hideButton = configRecord.getFieldValue('custrecord_avt_ifs_conf_hide_but_invoice');


        if( type == 'view' ) {
            if (hideButton != 'T') {
                var confirm = request.getParameter('confirm_ifs');
                var nbBooked = request.getParameter('f_nbbooked');
                if (confirm) {
                    var conf_field = form.addField('custpage_avt_message', 'inlinehtml');
                    conf_field.setDefaultValue(CreateDivConfirmBooking(nbBooked));
                }
                var confirmDelete = request.getParameter('confirm_delete_ifs');
                var nbDeleted = request.getParameter('f_nbdeleted');
                if (confirmDelete) {
                    var confirmDelete_field = form.addField('custpage_avt_message', 'inlinehtml');
                    confirmDelete_field.setDefaultValue(CreateDivDeleteBooking(nbDeleted));
                }
                /*var soid = nlapiGetRecordId();
                var record = LoadRecord(soid);
                var isMultiSplit = record.getFieldValue('custbody_avt_ifs_is_multi_split');
                */
                var isMultiSplit = nlapiLookupField(nlapiGetRecordType(), nlapiGetRecordId(), 'custbody_avt_ifs_is_multi_split');
                if (isMultiSplit == 'T') {
                    form.addButton('custpage_avt_ifs_delcon_split', 'Delete Multi Split To IFS', CreateButton('customscript_avt_ifs_delcon_split', '1', true ));
                    form.addButton('custpage_avt_ifs_import_split', 'Import Multi Split To IFS', CreateButton('customscript_avt_ifs_import_split', '1', true ));
                } else {
                    if ( record.getFieldValue('custbody_avt_ifs_connote_num') ) {
                        form.addButton('custpage_avt_ifs_delcon', 'Delete Booking To IFS', CreateButton('customscript_avt_ifs_delcon', '1', true ));
                        if(configRecord.getFieldValue('custrecord_avt_ifs_conf_auto_consolidati') == 'Y'){
                            // this is to make appear Import Button for exceptional case that auto consolidation is enable
                            // this button allows to import more than once from the same record.
                            // Auto consolidation function (IFS function) consolidates these imported connote under 1 connote ID
                            form.addButton('custpage_avt_ifs_import', 'Re-import To IFS', CreateButton('customscript_avt_ifs_import', '1', true ));
                        }
                    } else {
                        form.addButton('custpage_avt_ifs_cost_comp', 'Freight Comparison IFS', CreateButton('customscript_avt_ifs_cost_comparison', '1', true ));
                        form.addButton('custpage_avt_ifs_cal_rate', 'Calculate Rate IFS', CreateButton('customscript_avt_ifs_calcule_rate', '1', true ));
                        form.addButton('custpage_avt_ifs_import', 'Import To IFS', CreateButton('customscript_avt_ifs_import', '1', true ));
                    }
                }
            }
        }

        if( type == 'edit' || type == 'create' ) {
            if (hideButton != 'T') {
                var htmlField = form.addField('custpage_avt_add_script', 'inlinehtml');
                if(htmlField){
                   htmlField.setDefaultValue(createNewScript());
                }
                form.addButton('custpage_avt_ifs_estimate', 'Estimate Freight', 'window.ShowCostComparison()');
                form.addButton('custpage_avt_ifs_calculateweight', 'Calculate Weight', 'window.calculateWeightIFV2()');
                form.addButton('custpage_avt_ifs_calculatevolum', 'Calculate Volume', 'window.calculateCubicIFV2()');
                form.addButton('custpage_avt_ifs_calculatevolum_weight', 'Calculate Weight & Volume', 'window.calculteWeightVolumeIF()');
            }
        }
    }
    //
    // below is applied even for non IFS enabled form
    //
    if(type == 'create'){
        // copy connote ID from item filfillment
        var invoiceRecord = nlapiGetNewRecord();
        var itemFulfillmentRecordId = request.getParameter('itemship');
        if(itemFulfillmentRecordId){
            var connoteNumber = nlapiLookupField('itemfulfillment', itemFulfillmentRecordId, 'custbody_avt_ifs_connote_num', false);
            if(connoteNumber){
                invoiceRecord.setFieldValue('custbody_avt_ifs_connote_num', connoteNumber);
            }
        }
    }
};




/**
 * Keep order date for email confirmation sent to customer.
 * If order date field if blank when a record is saved, populate it with 'trandate'
 */
UserEventHandler.prototype._initOrderDateForEmailField = function(){
    'use strict';
    var logFunctionName = 'UserEventHandler.prototype._initOrderDateField';

    var orderDate = this._newRecord.getFieldValue(this._FID_ORDER_DATE_FOR_EMAIL);

    if(!orderDate){
        var trandate = this._newRecord.getFieldValue('trandate');
        this._newRecord.setFieldValue(this._FID_ORDER_DATE_FOR_EMAIL, trandate);
    }
};

/**
 * Fulfill default carrier, service, freight type and sender from location record
 * if there are not populated on Transfer Order.
 *
 * Assumed to applied to Transfer Order
 */
UserEventHandler.prototype._fillDefaultFieldValueFromLocationRecord = function(){
    'use strict';

    var logFunctionName = 'UserEventHandler.prototype._fillDefaultFieldValueFromLocationRecord';
    Logger.logStartFunctionD(logFunctionName, null, false, null);

    var isIfsEnabled = this._isIfsEnabledForm();
    if(!isIfsEnabled){
        return;
    }

    var locationId = this._newRecord.getFieldValue('transferlocation');

    if(!locationId){
        Logger.logA(logFunctionName, 'Failed to load location ID');
        return;
    }

    var valueMap = nlapiLookupField('location', locationId,
            ['custrecord_avt_ifs_default_sender',
             'custrecord_avt_ifs_default_carrier',
             'custrecord_avt_ifs_default_service',
             'custrecord_avt_ifs_default_freight_type',
             'custrecord_avt_ifs_default_special_inst1',
             'custrecord_avt_ifs_default_special_inst2',
             'custrecord_avt_ifs_default_special_inst3'],
            false);

    var currentSender      = this._newRecord.getFieldValue('custbody_avt_ifs_sender_business');
    var currentCarrier     = this._newRecord.getFieldValue('custbody_avt_ifs_shipcarrier');

    var defaultSender      = valueMap.custrecord_avt_ifs_default_sender;
    var defaultCarrier     = valueMap.custrecord_avt_ifs_default_carrier;
    var defaultService     = valueMap.custrecord_avt_ifs_default_service;
    var defaultFreightType = valueMap.custrecord_avt_ifs_default_freight_type;

    if(!currentSender && defaultSender){
        this._newRecord.setFieldValue('custbody_avt_ifs_sender_business', defaultSender);
    }
    if(!currentCarrier && defaultCarrier){
        this._newRecord.setFieldValue('custbody_avt_ifs_shipcarrier', defaultCarrier);
        if(defaultService){
            this._newRecord.setFieldValue('custbody_avt_ifs_shipservice', defaultService);
            if(defaultFreightType){
                this._newRecord.setFieldValue('custbody_avt_ifs_freight_type', defaultFreightType);
            }
        }
    }

    // fill special instructions
    var currentSpecialInst1 = this._newRecord.getFieldValue('custbody_avt_ifs_special_instructions1');
    var currentSpecialInst2 = this._newRecord.getFieldValue('custbody_avt_ifs_special_instructions2');
    var currentSpecialInst3 = this._newRecord.getFieldValue('custbody_avt_ifs_special_instructions3');

    var defaultSpecialInst1 = valueMap.custrecord_avt_ifs_default_special_inst1;
    var defaultSpecialInst2 = valueMap.custrecord_avt_ifs_default_special_inst2;
    var defaultSpecialInst3 = valueMap.custrecord_avt_ifs_default_special_inst3;

    if(!currentSpecialInst1 && defaultSpecialInst1){
        this._newRecord.setFieldValue('custbody_avt_ifs_special_instructions1', defaultSpecialInst1);
    }
    if(!currentSpecialInst2 && defaultSpecialInst2){
        this._newRecord.setFieldValue('custbody_avt_ifs_special_instructions2', defaultSpecialInst2);
    }
    if(!currentSpecialInst3 && defaultSpecialInst3){
        this._newRecord.setFieldValue('custbody_avt_ifs_special_instructions3', defaultSpecialInst3);
    }

    Logger.logFinishFunctionD(logFunctionName, null, false, null);
    return;
};

/**
 * @returns Boolean
 */
UserEventHandler.prototype._isIfsEnabledForm = function(){
    'use strict';
    var logFunctionName = 'UserEventHandler.prototype._isIfsEnabledForm';
    Logger.logStartFunctionD(logFunctionName, null, false, null);

    var isEnabled = false;

    var recordType = this._recordType;
    var configRecord = this._configRecord;
    var ifsEnabledCustomFormString = null;
    switch(recordType){
    case 'salesorder':
        ifsEnabledCustomFormString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_so');
        break;
    case 'itemfulfillment':
        ifsEnabledCustomFormString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_if');
        break;
    case 'cashsale':
        ifsEnabledCustomFormString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_cs');
        break;
    case 'estimate':
        ifsEnabledCustomFormString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_qt');
        break;
    case 'invoice':
        ifsEnabledCustomFormString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_invoice');
        break;
    case 'transferorder':
        ifsEnabledCustomFormString = configRecord.getFieldValue('custrecord_avt_ifs_customform_id_to');
        break;
    default:
        Logger.logVariables(Logger.LOG_LEVEL_ERROR, logFunctionName,
                ['recordType', recordType], false, 'Unexpected record type.');
        return isEnabled;
    }
    if(!ifsEnabledCustomFormString){
        Logger.logVariables(Logger.LOG_LEVEL_DEBUG, logFunctionName,
                ['ifsEnabledCustomFormString', ifsEnabledCustomFormString], false, 'Failed to load custom form setting.');
        return isEnabled;
    }
    var splitArray = ifsEnabledCustomFormString.split(';');
    for(var i=0; i < splitArray.length; i++){
        splitArray[i] = splitArray[i].trim();
    }

    var currentCustomFormId = null;

    if(this._newRecord){
        currentCustomFormId = this._newRecord.getFieldValue('customform');
    }
    if(!currentCustomFormId && this._record){
        currentCustomFormId = this._record.getFieldValue('customform');
    }
    Logger.logVariablesD(logFunctionName,
            ['ifsEnabledCustomFormString', ifsEnabledCustomFormString, 'currentCustomFormId', currentCustomFormId], false, null);
    if(currentCustomFormId && splitArray.indexOf(currentCustomFormId.toString()) >= 0){
        isEnabled = true;
    }

    Logger.logFinishFunctionD(logFunctionName, isEnabled, false, null);
    return isEnabled;
};






/**
 * Utility and Logger Module
 */

/**
 * Log entry entity class
 * Used by Logger Module and Utility Module
 */
function LogEntry(logType, logFunctionName, details){
    'use strict';

    this.timedate = '';
    this.logType = logType || '';
    this.logFunctionName = logFunctionName || '';
    this.details = details || '';

    // constructor
    var now = new Date();
    this.timedate =
        [(now.getDate() >= 0 && now.getDate() < 10) ? '0' + now.getDate() : now.getDate() + '',
                (now.getMonth() + 1 >= 0 && now.getMonth() + 1 < 10) ? '0' + now.getMonth() + 1 : now.getMonth() + 1 + '',
                        now.getFullYear()].join('/');
    this.timedate += ' ';
    this.timedate +=
        [(now.getHours() >= 1 && now.getHours() < 10) ? '0' + now.getHours() : now.getHours() + '',
                (now.getMinutes() >= 1 && now.getMinutes() < 10) ? '0' + now.getMinutes() : now.getMinutes() + ''].join(':');
};


/**
 * Utility module
 *
 * Version    Date            Author           Remarks
 * 1.00       28 May 2015     kenji
 *
 */

if(!Util){
    var Util = new UtilityModule();
}

function UtilityModule(){
    'use strict';

    return this;
};

/**
 * Find indexes of nlobjSearchColumn from array.
 */
UtilityModule.prototype.findIndexesOfSearchColumn = function (searchColumnArray, searchColumn, name, join, summary) {
    'use strict';
    var logFunctionName = 'UtilityModule.prototype.findIndexesOfSearchColumn';
    Logger.logStartFunctionD(logFunctionName, ['searchColumnArray', searchColumnArray,
                                               'name', name, 'join', join, 'summary', summary,
                                               'searchColumn', searchColumn], false, null);

    Logger.logVariablesD(logFunctionName, ['Array.isArray(searchColumnArray)',Array.isArray(searchColumnArray),
                                           '(name && join && summary)', (name && join && summary),
                                           '(searchColumn && searchColumn instanceof nlobjSearchColumn)', (searchColumn && searchColumn instanceof nlobjSearchColumn)], false, null);

    if(/*Array.isArray(searchColumnArray) == false ||*/
            !((name && join && summary) || (searchColumn && searchColumn instanceof nlobjSearchColumn)) ){
        var errorObj = new Error('Invalid argument.');
        Logger.logErrorObjectE(logFunctionName, errorObj, null,
                ['searchColumnArray', searchColumnArray,
                 'name', name, 'join', join, 'summary', summary,
                 'searchColumn', searchColumn], false);
        throw errorObj;
    }
    var resultArray = new Array();
    var targetName = '';
    var targetJoin = '';
    var targetSummary = '';
    if(searchColumn){
        targetName = searchColumn.getName();
        targetJoin = searchColumn.getJoin();
        targetSummary = searchColumn.getSummary();
    } else {
        targetName = name;
        targetJoin = join;
        targetSummary = summary;
    }
    for(var i=0; i < searchColumnArray.length; i++){
        if(searchColumnArray[i].getName() === targetName &&
                searchColumnArray[i].getJoin() === targetJoin &&
                searchColumnArray[i].getSummary() === targetSummary){
            resultArray.push(i);
        }
    }

    Logger.logFinishFunctionD(logFunctionName, resultArray, true, null);
    return resultArray;
};


/**
 * Format date and time
 * @param  date {Date} date Date object
 * @param  format {String} [optional] Format of output
 * @return {String} Formatted date ant time
 */
UtilityModule.prototype.formatDate = function (date, format) {
    'use strict';
    if(format === undefined){
        format = 'YYYY-MM-DD hh:mm:ss.SSS';
    }
    format = format.replace(/YYYY/g, date.getFullYear());
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/DD/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    if (format.match(/S/g)) {
        var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
        var length = format.match(/S/g).length;
        for (var i = 0; i < length; i++) format = format.replace(/S/, milliSeconds.substring(i, i + 1));
    }
    return format;
};

// time zone information will be wrong
UtilityModule.prototype.createDateWithTimeDefference = function(date, timeDifference){
    'use strict';
    if(timeDifference === undefined){
        timeDifference = 0;
    }
    if(!date){
        date = new Date();
    }
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    // adjust time difference
    var date = new Date(utc + (3600000 * timeDifference));

    return date;
};

UtilityModule.prototype.commafyNumber = function (number) {
    var str = number.toString().split('.');
    if (str[0].length >= 4) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 4) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
};

UtilityModule.prototype.makeAddressString = function (addr1, addr2, city, state, zip){
    var address = '';
    addr1 = addr1 ? addr1.trim() : '';
    addr2 = addr2 ? addr2.trim() : '';
    city = city ? city.trim() : '';
    state = state ? state.trim() : '';
    zip = zip ? zip.trim() : '';

    if (addr1.length > 0){
        address += addr1;
    }
    if (addr2.length > 0) {
        if (address.length > 0){
            address += ', ';
        }
        address += addr2;
    }
    // join city, state and zip string
    var cityStateZip = '';
    if (city.length > 0) {
        cityStateZip += city;
    }
    if (state.length > 0) {
        if (cityStateZip.length > 0){
            cityStateZip += ' ';
        }
        cityStateZip += state;
    }
    if (zip.length > 0){
        if (cityStateZip.length > 0){
            cityStateZip += ' ';
        }
        cityStateZip += zip;
    }
    if (cityStateZip.length > 0){
        if (address.length > 0){
            address += ', ';
        }
        address += cityStateZip;
    }
    address = address.trim();
    return address;
};

UtilityModule.prototype.convertFunctionToClientScriptString = function (functionName, stringMap){
    'use strict';
    var logFunctionName = 'UtilityModule.prototype.convertFunctionToClientScriptString';
    Logger.logStartFunctionD(logFunctionName, ['functionName', functionName]);

    var returnValue = null;
    var functionString = functionName.toString();

    var regExp = null;
    for(var prop in stringMap){
        if (stringMap[prop]){
        regExp = new RegExp('"\\$\\{\\s*' + prop + '\\s*\\}"', 'g');
        functionString = functionString.replace(regExp, stringMap[prop]);
        }
    }
//  functionString = functionString.replace(/\"/g,'\'').replace(/\\\'/g,'"');
    // double quotation symbol causes error on browser. the symbol should not be used in client script
    functionString = functionString.replace(/\"/g,'\'');
    returnValue = '(' + functionString + ')();';
    Logger.logFinishFunctionD(logFunctionName, returnValue);
    return returnValue;
};



UtilityModule.prototype.getIndexOfLineItem = function(record, lineItemName, valueMap, textMap, doesReturnMultiple){
    'use strict';
    var logFunctionName = 'UtilityModule.prototype.getIndexOfLineItem';
//    LogStartFunctionD(logFunctionName);

    if(!valueMap){
        valueMap = new Object();
    }
    if(!textMap){
        textMap = new Object();
    }
    if(doesReturnMultiple !== true){
        doesReturnMultiple = false;
    }
    var returnValue = null;
    if(doesReturnMultiple){
        returnValue = new Array();
    } else {
        returnValue = -1;
    }

    try{
        var itemCount = record.getLineItemCount(lineItemName);
        var doesMatch = true;
        var targetLineItemFieldValue = null;
        var key = null;
        for(var i=1; i <= itemCount; i++){
            doesMatch = true;
            for(key in valueMap){
//                LogValuablesD(logFunctionName, ['key', key, 'valueMap[key]', valueMap[key],
//                        'record.getLineItemValue(lineItemName, key, i)',record.getLineItemValue(lineItemName, key, i)]);
                if(record.getLineItemValue(lineItemName, key, i) == valueMap[key]){
                    // keep continue
                } else {
                    doesMatch = false;
                    break;
                }
            }
            // if all values in valueMap matched then check if textMap matches
            if(doesMatch){
                for(key in textMap){
//                    LogValuablesD(logFunctionName, ['key', key, 'valueMap[key]', valueMap[key],
//                            'record.getLineItemText(lineItemName, key, i)', record.getLineItemText(lineItemName, key, i)]);
                    if(record.getLineItemText(lineItemName, key, i) == textMap[key]){
                        // keep continue
                    } else {
                        doesMatch = false;
                        break;
                    }
                }
            }

            if(doesMatch){
                if(doesReturnMultiple){
                    returnValue.push(i);
                } else {
                    returnValue = i;
                    break;
                }
            }
        }

    } catch (e){
        LogErrorObject(logFunctionName, e, 'Error was occurred during finding index.');
        if (doesReturnMultiple){
            returnValue = new Array();
        } else {
            returnValue = -1;
        }
        LogFinishFunctionD(logFunctionName, returnValue);
        return returnValue;
    }

//    LogFinishFunctionD(logFunctionName, returnValue);
    return returnValue;
};


UtilityModule.prototype.getIndexOfArray = function(array, value, doesReturnMultiple){
    'use strict';
    var logFunctionName = 'UtilityModule.prototype.getIndexOfArray';
//    LogStartFunctionD(logFunctionName);

    if(doesReturnMultiple !== true){
        doesReturnMultiple = false;
    }
    var returnValue = null;
    if(doesReturnMultiple){
        returnValue = new Array();
    } else {
        returnValue = -1;
    }
    var arrayLength = 0;
    if(Array.isArray(array)){
        arrayLength = array.length;
    }
    var doesMatch = false;
    for(var i=0; i < arrayLength; i++){
        if(array[i] === value){
            if(doesReturnMultiple){
                returnValue.push(i);
            } else {
                returnValue = i;
                break;
            }
        }
    }

//    LogFinishFunctionD(logFunctionName, returnValue);
    return returnValue;
};

UtilityModule.prototype.writeErrorReportToResponse = function(response, message, errorObj, doesAppendLog){
    'use strict';
    var logFunctionName = 'UtilityModule.prototype.writeErrorReportToResponse';
    Logger.logStartFunctionD(logFunctionName);

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
        messageInErrorObject = errorObj.message
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
            '<p>' + '[Message]<br />' + this.escapeHtmlMetaChar(messageInErrorObject) + '</p>' +
            '<p>' + '[Code]<br /> ' + this.escapeHtmlMetaChar(codeInErrorObject).replace(/\n/g, '<br />') + '</p>' +
            '<br /><br />' +
            '<h2>Error Object Dump</h2>' +
            '<p>' + Logger.getErrorMessage(errorObj, '<br />\n') + '</p>';
        }

    var htmlCode = '<html><body>' + htmlBodyCode +'</body></html>';
    inlineHtml.setDefaultValue(htmlCode);

    if(doesAppendLog){
        var subList = form.addSubList('custpage_log_table', 'list', 'Recent Log', false);
        subList.addField('type', 'text', 'Level', null);
        subList.addField('date', 'text', 'Date', null);
        subList.addField('title', 'text', 'Title', null);
        subList.addField('details', 'text', 'Details', null);

        var logEntryArray = Logger.logEntryArray;
        for(var i=0; i < logEntryArray.length; i++){
            var log = logEntryArray[i];
            subList.setLineItemValue('type', i + 1, log.logType);
            subList.setLineItemValue('date', i + 1, log.timedate);
            subList.setLineItemValue('title', i + 1, log.logFunctionName);
            subList.setLineItemValue('details', i + 1, log.logType);
        }
    }

    response.writePage(form);

    Logger.logFinishFunctionD(logFunctionName);
};

UtilityModule.prototype.escapeHtmlMetaChar = function (str) {
    'use strict';
    if (!str){
        return str;
    }
    str = str.replace(/&/g,'&amp;');
    str = str.replace(/</g,'&lt;');
    str = str.replace(/>/g,'&gt;');
    str = str.replace(/"/g,'&quot;');
    str = str.replace(/'/g,'&#039;');
    return str;
};


UtilityModule.prototype.appendErrorMessageToErrorObject = function(errorObj, message, doesAppendLatter, delimiter){
    'use strict';
    var logFunctionName = 'UtilityModule.prototype.appendErrorMessageToErrorObject';
    Logger.logStartFunctionD(logFunctionName,
            ['errorObj', errorObj, 'message', message, 'doesAppendLatter', doesAppendLatter, 'delimiter', delimiter]);

    if(message === null || message === undefined){
        return;
    }
    if(!doesAppendLatter){
        doesAppendLatter = false;
    }
    var currentMessage = errorObj.message;
    Logger.logVariablesD(logFunctionName, ['currentMessage', currentMessage]);
    var newMessage = '';
    if (!currentMessage){
        newMessage = message;
        errorObj.message = newMessage;
        Logger.logFinishFunctionD(logFunctionName, ['newMessage', newMessage, 'errorObj.message', errorObj.message]);
        return;
    }
    if(delimiter === undefined || delimiter === null){
        delimiter = '\n';
    }

    if(doesAppendLatter){
        newMessage = currentMessage + delimiter + message;
    } else {
        newMessage = message + delimiter + currentMessage;
    }
    errorObj.message = newMessage;
    Logger.logVariablesD(logFunctionName, ['newMessage', newMessage, 'errorObj.message', errorObj.message]);
    Logger.logFinishFunctionD(logFunctionName);
};




/**
 * Logger module to support logging
 *
 * Version    Date            Author           Remarks
 * 1.00       28 May 2015     kenji
 *
 */
if(!Logger){
    var Logger = new LoggerModule();
};

function LoggerModule(){
    'use strict';

    // member variables
    /** contains LogEntry object */
    this.logEntryArray = new Array();

    return this;
};


// static variables
LoggerModule.prototype.LOG_LEVEL_DEBUG = 'DEBUG';
LoggerModule.prototype.LOG_LEVEL_AUDIT = 'AUDIT';
LoggerModule.prototype.LOG_LEVEL_ERROR = 'ERROR';
LoggerModule.prototype.LOG_LEVEL_EMERGENCY = 'EMERGENCY';


LoggerModule.prototype._LOG_LEVEL_MAP =  {
        DEBUG: 4,
        AUDIT: 3,
        ERROR: 2,
        EMERGENCY: 1
};
LoggerModule.prototype._MAX_LOG_ENTRY_ARRAY_LENGTH = 200;


/**
 *
 * @param {string} type
 * @param {string} title
 * @param {string} details
 */
LoggerModule.prototype._addLogEntry = function(type, title, details){
    'use strict';

    var logEntry = new LogEntry(type, title, details);

    this.logEntryArray.push(logEntry);
    if(this.logEntryArray.length > this._MAX_LOG_ENTRY_ARRAY_LENGTH){
        this.logEntryArray.shift();
    }
};

/**
 * Log all HTTP parameter contained in request.
 * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
 * @param {string} logFunctionName - Title of log record
 * @param {Array} request - HTTP request passed by NetSuite framework to Suitelet
 * @returns {void}
 */
LoggerModule.prototype.logAllHttpParameters = function (logLevel, logFunctionName, request){
    'use strict';

    if (typeof logLevel !== 'string'){
        // invalid logLevel
        return;
    } else {
        logLevel = logLevel.toUpperCase();
    }
    if(!this._LOG_LEVEL_MAP[logLevel]){
        // invalid logLevel
        return;
    }

    try {
        var params = request.getAllParameters();
        var dumpString = '';
        var param = null;
        for (param in params){
            if (dumpString){
                dumpString += ', ';
            }
            dumpString += param + ': \'' + params[param] + '\'';
        };
        this.logWithTry(logLevel, logFunctionName, '[HttpParameters] ' + dumpString);
    } catch (e){
        this.logErrorObject(logFunctionName, e);
    }
};

/**
 * Log all HTTP parameter contained in request.
 * @param {string} logFunctionName - Title of log record
 * @param {Array} request - HTTP request passed by NetSuite framework to Suitelet
 * @returns {void}
 */
LoggerModule.prototype.logAllHttpParametersA = function (logFunctionName, request){
    'use strict';

    this.logAllHttpParameters(this.LOG_LEVEL_AUDIT, logFunctionName, request);
};

/**
 * Log beginning of function with arguments
 * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
 * @param {string} logFunctionName - Title of log record
 * @param {Array} namesAndValuesArray - Array of name and valuable<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @param {string} message [optional] - Additional message appended to log
 * @returns {void}
 */
LoggerModule.prototype.logStartFunction = function(logLevel, logFunctionName, namesAndValuesArray, isJsonEnabled, message){
    'use strict';

    if (typeof logLevel !== 'string'){
        // invalid logLevel
        return;
    } else {
        logLevel = logLevel.toUpperCase();
    }
    if(!this._LOG_LEVEL_MAP[logLevel]){
        // invalid logLevel
        return;
    }

    try{
        var logMessage = ' [Arguments] ' + this.createVariablesString(namesAndValuesArray, isJsonEnabled, null, '');
        if (message){
            logMessage += ', [Message] \'' + message + '\'';
        }
        this.logWithTry(logLevel, logFunctionName, 'function start' + logMessage);
    } catch (e){
        this.logErrorObject(logFunctionName, e);
    }
};

/**
 * Log beginning of function with arguments using DEBUG log level
 * @param {string} logFunctionName - Title of log record
 * @param {Array} namesAndValuesArray - Array of name and valuable<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @param {string} message [optional] - Additional message appended to log
 * @returns {void}
 */
LoggerModule.prototype.logStartFunctionD = function (logFunctionName, namesAndValuesArray, isJsonEnabled, message){
    'use strict';
    this.logStartFunction('DEBUG', logFunctionName, namesAndValuesArray, isJsonEnabled, message);
};


/**
 * Log finishing of function with return value.
 * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
 * @param {string} logFunctionName - Title of log record
 * @param {any} returnValue - [optional] Return value of the function being logged
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @param {string} message - [optional] Additional message appended to log
 * @returns {void}
 */
LoggerModule.prototype.logFinishFunction = function(logLevel, logFunctionName, returnValue, isJsonEnabled, message){
    'use strict';

    if (typeof logLevel !== 'string'){
        // invalid logLevel
        return;
    } else {
        logLevel = logLevel.toUpperCase();
    }
    if(!this._LOG_LEVEL_MAP[logLevel]){
        // invalid logLevel
        return;
    }

    try{
        var logMessage = '';
        if (returnValue === undefined){
            // do nothing
        } else if(isJsonEnabled){
            logMessage = ' [Return] ';
            logMessage += '(' + typeof returnValue + ') ' + ': \'' + JSON.stringify(returnValue) + '\'';
        } else{
            logMessage = ' [Return] ';
            if (Array.isArray(returnValue)){
                logMessage += '(' + typeof returnValue + ') ' + '[' + returnValue.length + ']';
            } else {
                logMessage += '(' + typeof returnValue + ') ' + ': \'' + returnValue + '\'';
            }
        }
        if (message){
            if(logMessage){
                logMessage += ', ';
            }
            logMessage += '[Message] \'' + message + '\'';
        }
        this.logWithTry(logLevel, logFunctionName, 'function finish' + logMessage);
    } catch (e){
        this.logErrorObject(logFunctionName, e);
    }
};

/**
 * Log finishing of function with return value using DEBUG log level
 * @param {string} logFunctionName - Title of log record
 * @param {any} returnValue - [optional] Return value of the function being logged
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @param {string} message - [optional] Additional message appended to log
 * @returns {void}
 */

LoggerModule.prototype.logFinishFunctionD = function(logFunctionName, returnValue, isJsonEnabled, message){
    'use strict';

    this.logFinishFunction('DEBUG', logFunctionName, returnValue, isJsonEnabled, message);
};


/**
 * Log names and values of valuables.
 * @param {string} logLevel - One of log type following. DEBUG, AUDIT, ERROR, EMERGENCY
 * @param {string} logFunctionName - Title of log record
 * @param {Array} namesAndValuesArray - Array of name and valuable.<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @returns {void}
 */
LoggerModule.prototype.logVariables = function(logLevel, logFunctionName, namesAndValuesArray, isJsonEnabled, message){
    'use strict';

    if (typeof logLevel !== 'string'){
        // invalid logLevel
        return;
    } else {
        logLevel = logLevel.toUpperCase();
    }
    if(!this._LOG_LEVEL_MAP[logLevel]){
        // invalid logLevel
        return;
    }

    var logString = '';
    if(message){
        logString = '[Message] ' + message + ', ';
    }
    logString += this.createVariablesString(namesAndValuesArray, isJsonEnabled);

    this.logWithTry(logLevel, logFunctionName, logString);
};

/**
 * Log names and values of valuables using DEBUG log level
 * @param {string} logFunctionName - Title of log record
 * @param {Array} namesAndValuesArray - Array of name and valuable.<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @returns {void}
 */
LoggerModule.prototype.logVariablesD = function(logFunctionName, namesAndValuesArray, isJsonEnabled, message){
    'use strict';

    this.logVariables('DEBUG', logFunctionName, namesAndValuesArray, isJsonEnabled, message);
};


/**
 * Log messages utilizing nlapiLogExecution() with DEBUG tag<br>
 * Usage example:<br>
 * <code>
 * var logFunctionName = 'functionName';
 * LogEmergency(logFunctionName, 'start');
 * </code>
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {string} details - [optional] The details of the log entry (max length: 3999 characters)
 * @returns {void}
 */
LoggerModule.prototype.logD = function(logFunctionName, details) {
    'use strict';
    this.logWithTry('DEBUG', logFunctionName, details);
};

/**
 * Log messages utilizing nlapiLogExecution() with AUDIT tag<br>
 * Usage example:<br>
 * <code>
 * var logFunctionName = 'functionName';
 * LogEmergency(logFunctionName, 'start');
 * </code>
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {string} details - [optional] The details of the log entry (max length: 3999 characters)
 * @returns {void}
 */
LoggerModule.prototype.logA = function(logFunctionName, details) {
    'use strict';
    this.logWithTry('AUDIT', logFunctionName, details);
};

/**
 * Log messages utilizing nlapiLogExecution() with ERROR tag<br>
 * Usage example:<br>
 * <code>
 * var logFunctionName = 'functionName';
 * LogEmergency(logFunctionName, 'start');
 * </code>
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {string} details - [optional] The details of the log entry (max length: 3999 characters)
 * @returns {void}
 */
LoggerModule.prototype.logE = function(logFunctionName, details) {
    'use strict';
    this.logWithTry('ERROR', logFunctionName, details);
};

/**
 * Log messages utilizing nlapiLogExecution() with EMERGENCY tag<br>
 * Usage example:<br>
 * <code>
 * var logFunctionName = 'functionName';
 * LogEmergency(logFunctionName, 'start');
 * </code>
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {string} details - [optional] The details of the log entry (max length: 3999 characters)
 * @returns {void}
 */
LoggerModule.prototype.logEmergency = function(logFunctionName, details) {
    'use strict';
    this.logWithTry('EMERGENCY', logFunctionName, details);
};

/**
 * Log messages utilizing nlapiLogExecution() with debug tag<br>
 * Usage example:<br>
 * <code>
 * var logFunctionName = 'functionName';
 * LogD(logFunctionName, 'start');
 * </code>
 * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {object} errorObj - Error object to be logged
 * @param {string} message - [optional] Additional message appended to log
 * @param {Array} namesAndValuesArray - Array of name and valuable.<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @returns {void}
 */
LoggerModule.prototype.logErrorObject = function(logLevel, logFunctionName, errorObj, message, namesAndValuesArray, isJsonEnabled){
    'use strict';

    if (typeof logLevel !== 'string'){
        // invalid logLevel
        return;
    } else {
        logLevel = logLevel.toUpperCase();
    }
    if(!this._LOG_LEVEL_MAP[logLevel]){
        // invalid logLevel
        return;
    }
    var logMessage = '(Error Object): \'' + this.getErrorMessage(errorObj) + '\'';
    if(message){
        logMessage += ', [Message] \'' + message + '\'';
    }
    if(namesAndValuesArray){
        logMessage += ', ' + this.createVariablesString(namesAndValuesArray, isJsonEnabled);
    }
    this.logWithTry(logLevel, logFunctionName, logMessage);
};

/**
 * Log messages utilizing nlapiLogExecution() with debug tag<br>
 * Usage example:<br>
 * <code>
 * var logFunctionName = 'functionName';
 * LogD(logFunctionName, 'start');
 * </code>
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {object} errorObj - Error object to be logged
 * @param {string} message - [optional] Additional message appended to log
 * @param {Array} namesAndValuesArray - Array of name and valuable.<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @returns {void}
 */
LoggerModule.prototype.logErrorObjectE = function(logFunctionName, errorObj, message, namesAndValuesArray, isJsonEnabled){
    'use strict';

    this.logErrorObject('ERROR', logFunctionName, errorObj, message, namesAndValuesArray, isJsonEnabled);
};

/**
 * Log messages utilizing nlapiLogExecution() with try-catch
 * @param {string} logType - [required] One of the following log types:
 *     DEBUG, AUDIT, ERROR, EMERGENCY
 * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
 *     If you set title to null or empty string (''), you will see
 *     the word “Untitled” appear in your log entry.
 * @param {string} details - [optional] The details of the log entry (max length: 3999 characters)
 * @returns {void}
 */
LoggerModule.prototype.logWithTry = function(logType, logFunctionName, details){
    'use strict';
    try{
        nlapiLogExecution(logType, logFunctionName, details);
        this._addLogEntry(logType, logFunctionName, details);
    } catch (e) {
        nlapiLogExecution('ERROR', 'Logging Error', 'title: \'' + logFunctionName +
                '\', details: \'' + details + ', Error Object: \'' + this.getErrorMessage(e) + '\'');
    }
};

/**
 * Create string shows valuables' content.
 * @param {Array} namesAndValuesArray - Array of name and valuable.<br>
 *     This should contain even number of elements.<br>
 *     e.g. ['name1', value1, 'name2', value2, ...]
 * @param {boolean} isJsonEnabled - [optional] true: use JSON.stringify() to create dump string
 * @param {string} delimiter - [optional] Delimiter between each elements. default is ', '
 * @param {string} header - [optional] header string put before variables dump. default is '[Variables Dump] '
 * @returns {string} valuables dump string
 */
LoggerModule.prototype.createVariablesString = function(namesAndValuesArray, isJsonEnabled, delimiter, header){
    'use strict';
    var logFunctionName = 'CreateVariablesString';

    if(delimiter === undefined || delimiter === null){
        delimiter = ', ';
    }
    if(header === undefined || header === null){
        header = '[Variables Dump] ';
    }
    // check if argument is valid
    if(!namesAndValuesArray){
        return '';
    }
    if(Array.isArray(namesAndValuesArray) === false || namesAndValuesArray.length % 2 != 0){
        this.logWithTry('DEBUG', logFunctionName, 'Argument error. Second argument should contain an even number of elements.');
        return '';
    }
    var dumpStr = header;
    try {
        for(var i=0; i < namesAndValuesArray.length; i += 2){
            if(i > 0){
                dumpStr += delimiter;
            }
            if(isJsonEnabled){
                dumpStr += '(' + typeof namesAndValuesArray[i+1] + ') ' + namesAndValuesArray[i] + ': \'' + JSON.stringify(namesAndValuesArray[i+1]) + '\'';
            } else {
                if (namesAndValuesArray[i+1] && Array.isArray(namesAndValuesArray[i+1])){
                    dumpStr += '(' + typeof namesAndValuesArray[i+1] + ') ' + namesAndValuesArray[i] + '[' + namesAndValuesArray[i+1].length + ']';
                } else {
                    dumpStr += '(' + typeof namesAndValuesArray[i+1] + ') ' + namesAndValuesArray[i] + ': \'' + namesAndValuesArray[i+1] + '\'';
                }
            }
        }
    } catch (e) {
        this.logErrorObject(logFunctionName, e);
    }
    return dumpStr;
};

/**
 * Retrieve error message from error object.
 * @param {object} errorObj - Standard error object or nlobjError
 * @param {string} delimiter - [optional] Delimiter between each elements. default is ', '
 * @returns {string} error message retrieved from errorObj
 */
LoggerModule.prototype.getErrorMessage = function(errorObj, delimiter){
    'use strict';
    var logFunctionName = LoggerModule.prototype.getErrorMessage;

    if (errorObj === null){
        return 'Error object is null';
    } else if (errorObj === undefined){
        return 'Error object is undefined'
    }
    if(!delimiter){
        delimiter = ', ';
    }
    var returnMessage = null;
    if(typeof errorObj === 'object'){
        // try to retrieve data from standard error object
        var name = null;
        try {
            name = errorObj.name;
        } catch (e){}
        if(!name){
            name = '';
        }
        var message = null;
        try {
            message = errorObj.message;
        } catch (e){}
        if(!message){
            message = '';
        }
        var constructor = null;
        try {
            constructor = errorObj.constructor;
        } catch (e){}
        if(!constructor){
            constructor = '';
        }
        // try to retrieve data from nlobjError
        var fileName = null;
        try {
            fileName = errorObj.fileName;  // this property is not on document
        } catch (e){}
        var lineNumber = null;
        try {
            lineNumber = errorObj.lineNumber;  // this property is not on document
        } catch (e){}
        var rhinoException = null;
        try {
            rhinoException = errorObj.rhinoException;  // this property is not on document
        } catch (e){}
        var stack = null;
        try {
            stack = errorObj.stack;  // this property is not on document
        } catch (e){}
        var code = null;
        try {
            code = errorObj.getCode();
        } catch (e){}
        var details = null;
        try {
            details = errorObj.getDetails();
        } catch (e){}
        var id = null;
        try {
            id = errorObj.getId();
        } catch (e){}
        var internalId = null;
        try {
            internalId = errorObj.getInternalId();
        } catch (e){}
        var stackTrace = null;
        try {
            stackTrace = errorObj.getStackTrace();
        } catch (e){}
        var userEvent = null;
        try {
            userEvent = errorObj.getUserEvent();
        } catch (e){}
        // add standard property of Error object
        returnMessage =
            '[Name] \'' + name + '\'' + delimiter +
            '[Message] \'' + message +'\'' + delimiter +
            '[Constructor] \'' + constructor + '\'';
        // append nlobjError
        if(fileName){
            returnMessage += delimiter + '[File Name] \'' + fileName + '\'';
        }
        if(lineNumber){
            returnMessage += delimiter + '[Line Number] \'' + lineNumber + '\'';
        }
        if(rhinoException){
            returnMessage += delimiter + '[Rhino Exception] \'' + rhinoException + '\'';
        }
        if(stack){
            returnMessage += delimiter + '[Stack] \'' + stack + '\'';
        }
        if(code){
            returnMessage += delimiter + '[Code] \'' + code + '\'';
        }
        if(details){
            returnMessage += delimiter + '[Details] \'' + details + '\'';
        }
        if(id){
            returnMessage += delimiter + '[Id] \'' + id + '\'';
        }
        if(internalId){
            returnMessage += delimiter + '[Iinternal Id] \'' + internalId + '\'';
        }
        if(stackTrace){
            returnMessage += delimiter + '[Stack Trace] \'' + stackTrace + '\'';
        }
        if(userEvent){
            returnMessage += delimiter + '[User Event] \'' + userEvent + '\'';
        }
    } else {
        returnMessage = 'Error object is unexpected type';
    }
    return returnMessage;
};

