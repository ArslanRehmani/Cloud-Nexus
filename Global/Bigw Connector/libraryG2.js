/**
 * libraryG.js
 * @NApiVersion 2.x
 */

define(['N/http','N/https', 'N/record', 'N/search', 'N/url', 'N/email'], 

function (http, https, record, search, url, email) {

    /**
     * Return true if the input variable is empty
     * @param stValue
     * @returns {boolean}
     */
    function isEmpty(stValue) {
        if ((stValue == '') || (stValue == null) || (stValue == undefined)) {
            return true;
        } else {
            if (stValue instanceof String) {
                if ((stValue == '')) {
                    return true;
                }
            } else if (stValue instanceof Array) {
                if (stValue.length == 0) {
                    return true;
                }
            }

            return false;
        }
    }

    function getVersion() {

        var version = '0.2';

        return version;
    }

    function getSKU(itemFullName) {
        var itemFullNameArray = itemFullName.split(' : ');

        return itemFullNameArray[itemFullNameArray.length - 1];
    }

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > (milliseconds || 1000)) {
                break;
            }
        }
    }

    function getStateFullName(stateCode) {
        var stateFullName = '';

        switch (stateCode.toUpperCase()) {
            case 'VIC':
                stateFullName = 'Victoria';
                break;
            case 'NSW':
                stateFullName = 'New South Wales';
                break;
            case 'QLD':
                stateFullName = 'Queensland';
                break;
            case 'TAS':
                stateFullName = 'Tasmania';
                break;
            case 'WA':
                stateFullName = 'Western Australia';
                break;
            case 'ACT':
                stateFullName = 'Australian Capital Territory';
                break;
            case 'NT':
                stateFullName = 'Northern Territory';
                break;
            case 'SA':
                stateFullName = 'South Australia';
                break;
        }

        return stateFullName;
    }

    function getStateShortName(stateFullName) {
        var stateCode = '';

        switch (stateFullName.toUpperCase()) {
            case 'VICTORIA':
                stateCode = 'VIC';
                break;
            case 'NEW SOUTH WALES':
                stateCode = 'NSW';
                break;
            case 'QUEENSLAND':
                stateCode = 'QLD';
                break;
            case 'TASMANIA':
                stateCode = 'TAS';
                break;
            case 'WESTERN AUSTRALIA':
                stateCode = 'WA';
                break;
            case 'AUSTRALIAN CAPITAL TERRITORY':
                stateCode = 'ACT';
                break;
            case 'NORTHERN TERRITORY':
                stateCode = 'NT';
                break;
            case 'SOUTH AUSTRALIA':
                stateCode = 'SA';
                break;
        }

        return stateCode;
    }

    function getEntityGroupMembers(groupId) {
        var emailArray = new Array();
        var groupRecord = record.load({
            type: 'entitygroup',
            id: groupId, //3953390, //4018539,
            isDynamic: true
        });

        // log.debug('entity group', JSON.stringify(groupRecord));
        // log.debug('dynamic', groupRecord.getValue('dynamic'));
        // log.debug('saved search', groupRecord.getValue('savedsearch'));

        if (groupRecord.getValue('dynamic') == 'F' && isEmpty(groupRecord.getValue('savedsearch'))) {
            var numbLines = groupRecord.getLineCount({
                sublistId: 'groupmembers'
            });
            // log.debug('number lines', numbLines);
            for (var i = 0; i < numbLines; i++) {
                emailArray.push(groupRecord.getSublistValue({
                    sublistId: 'groupmembers',
                    fieldId: 'memberemail',
                    line: i
                }));
            }

        } else if (groupRecord.getValue('dynamic') == 'T' && groupRecord.getValue('savedsearch')) {

            var searchId = search.lookupFields({
                type: search.Type.SAVED_SEARCH,
                id: groupRecord.getValue('savedsearch'),
                columns: 'id'
            });
            // log.debug('search id', JSON.stringify(searchId));
            var groupSavedSearch = search.load({
                id: searchId.id
            });
            groupSavedSearch.run().each(function (gresult) {
                // log.debug('gresult email', gresult.getValue('email'));
                emailArray.push(gresult.getValue('email'));

                return true;
            });
            // log.debug('group saved search', JSON.stringify(groupSavedSearch));
        }

        // log.debug('email array length', emailArray.length);

        return emailArray;
    }

    /**
     * replace {d}, {dd}, {m}, {mm}, {yy},{yyyy}
     */
    function replaceDateTemplate(dateTemplate) {
        var currentDate = getCurrentDate();

        return dateTemplate.replace(/{(d|D)}/g, currentDate.D)
            .replace(/{(dd|DD)}/g, currentDate.DD)
            .replace(/{(m|M)}/g, currentDate.M)
            .replace(/{(mm|MM)}/g, currentDate.MM)
            .replace(/{(yy|YY)}/g, currentDate.YY)
            .replace(/{(yyyy|YYYY)}/g, currentDate.YYYY)
    }

    /**
     * remove comma and line breaker for description field
     */
    function trimCommaLineBreaker(orignal) {
        //trim comma
        var after = orignal.replace(/,/g, "");
        //remove line breaker
        after = after.replace(/(\n|\r|\r\n)/gm, "");

        return after;
    }

    function getCheckboxValue(value) {
        if (value == 'T' || value == true || value == 'true')
            return 'true';
        else if (value == 'F' || value == false || value == 'false')
            return 'false';
        else 
            return '';
    }

    function wait(second) {
        // http.get({url: 'http://www.lifespanonline.com.au/c.1117015/sleep.php?sleep=' + (second || '1')});
        if (second < 1) {
            second++;
        }
        
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > (second*1000)){
            break;
            }
        }
    }

    function getStateFromPostcode(postcode) {
        var state = '';

        var postcodeNumber = parseFloat(postcode);
        if (
            (postcodeNumber >= 1000 && postcodeNumber <= 1999) ||
            (postcodeNumber >= 2000 && postcodeNumber <= 2599) ||
            (postcodeNumber >= 2619 && postcodeNumber <= 2899) ||
            (postcodeNumber >= 2921 && postcodeNumber <= 2999)
        ) {
            state = 'NSW';
        } else if (
            (postcodeNumber >= 200 && postcodeNumber <= 299) ||
            (postcodeNumber >= 2600 && postcodeNumber <= 2618) ||
            (postcodeNumber >= 2900 && postcodeNumber <= 2920)
        ) {
            state = 'ACT';
        } else if (
            (postcodeNumber >= 3000 && postcodeNumber <= 3999) ||
            (postcodeNumber >= 8000 && postcodeNumber <= 8999)
        ) {
            state = 'VIC';
        } else if (
            (postcodeNumber >= 4000 && postcodeNumber <= 4999) ||
            (postcodeNumber >= 9000 && postcodeNumber <= 9999)
        ) {
            state = 'QLD';
        } else if (
            postcodeNumber >= 5000 && postcodeNumber <= 5999
        ) {
            state = 'SA';
        } else if (
            (postcodeNumber >= 6000 && postcodeNumber <= 6797) ||
            (postcodeNumber >= 6800 && postcodeNumber <= 6999)
        ) {
            state = 'WA';
        } else if (
            postcodeNumber >= 7000 && postcodeNumber <= 7999
        ) {
            state = 'TAS';
        } else if (postcodeNumber >= 800 && postcodeNumber <= 999) {
            state = 'NT';
        }

        return state;
    }

    // not suitable for upgrading sales order (line items), and customer (address lines)
    // but can used for add extra address lines from customer
    function createUpdateRecord(recordType, orderId, recordData) {
        var result = {
            record_type: recordType,
            record_internalid: orderId || null,
        }
        if (recordType) {
            if (util.isObject(recordData)) {
                if (orderId) {
                    var newRecord = record.load({
                        type: recordType,
                        id: orderId,
                        isDynamic: true,
                    })
                } else {
                    var newRecord = record.create({
                        type: recordType,
                        isDynamic: true,
                    });
                }

                try {
                    util.each(recordData, function(fv, key) {
                        if (util.isArray(fv) && fv.length > 0) {
                            for (var i = 0; i < fv.length; i++) {
                                newRecord.selectNewLine(key);
                                lv = fv[i];
                                util.each(lv, function(lineValue, lineKey){
                                    if (util.isObject(lineValue)) {
                                        var sublistsubrecord = newRecord.getCurrentSublistSubrecord({
                                            sublistId:key,
                                            fieldId: lineKey
                                        });
                                        util.each(lineValue, function(lvv, lvk){
                                            sublistsubrecord.setValue({
                                                fieldId: lvk,
                                                value: lvv
                                            });
                                        });
                                    } else {
                                        newRecord.setCurrentSublistValue({
                                            sublistId: key,
                                            fieldId: lineKey,
                                            value: lineValue
                                        });
                                    }
                                });
                                newRecord.commitLine(key);
                            }
                        } else if (util.isObject(fv)) {
                            var subrecord = newRecord.getSubrecord(key)
                            util.each(fv, function(fvv, fvk){
                                subrecord.setValue({
                                    fieldId: fvk,
                                    value: fvv
                                })
                            })
                        } else {
                            newRecord.setValue({
                                fieldId: key,
                                value: fv
                            });
                        }
                    });
        
                    var recordId = newRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }); // return number
                    log.debug((orderId ? 'Update ' : 'New ') + recordType, recordId);
                    result.record_internalid = recordId;
                } catch(err) {
                    log.error('create ' + recordType + ' error', err);
                    result.error = err.message;
                }
            } else {
                    result.error = 'misformated record data object.'
            }
        } else {
                result.error = 'missing record type!'
        }

        return result;
    }

    function SearchExistingRecord(recordType, filters, columns) {
        var existingRecords = [];
        var existingRecordSearch = search.create({
            type: recordType,
            filters: filters,
            columns: columns, 
        });
        existingRecordSearch.run().each(function(result) {
            var colArr = result.columns;
            var recordObj = {};
            util.each(colArr, function(col) {
                recordObj[col.name] = result.getValue(col);
            });

            existingRecords.push(recordObj);

            return true;
        });

        return existingRecords;
    }

    function formatPhone(phone, state) {
        var phoneString = phone.replace(/\s|\(|\)|\+/g, '');
        var stateUC = state.toUpperCase();

        if (phoneString.length == 8) {

            if ( stateUC == 'VIC' || stateUC == 'TAS') {
                phoneString = '613' + phoneString;
            } else if (stateUC == 'NSW' || stateUC == 'ACT') {
                phoneString = '612' + phoneString;                
            } else if (stateUC == 'QLD') {
                phoneString = '617' + phoneString;                
            } else if (stateUC == 'WA' || stateUC == 'SA' || stateUC == 'NT') {
                phoneString = '618' + phoneString;
            }
        } else if (phoneString.length == 9) {
            phoneString = '61' + phoneString;
        } else if (phoneString.length == 10) {
            phoneString = '61' + phoneString.slice(1);
        } else if (phoneString.length == 11) {
            phoneString = phoneString;
        } else {
            log.error('error', 'phone number wrong format: ' + phoneString);
        }
        return phoneString;
    }

    function requestUrl(url) {
        var exit = false;
        var responseResult = new Object();

        var count = 0
        do {
            count++
            try {
                var response = https.get({
                    url: url
                });
                if (response.code == '200') {
                    responseResult = JSON.parse(response.body);
                    exit = true;
                } else {
                    log.error('response error', response);
                }

            } catch(err) {
                switch (err.name) {
                    case 'SSS_REQUEST_TIME_EXCEEDED':
                        log.error('request error', err.message);
                        break;
                
                    default:
                        log.error('other request error', err.message)
                        break;
                }
            }

        } while (exit == false && count < 4)

        return {
            success: exit,
            body: responseResult
        };
    }

    function getFreightOptions(itemids, itemskus, postcode, suburb) {
        var freigthUrl = url.resolveScript({
            scriptId: 'customscript_get_freight_options_v3',
            deploymentId: 'customdeploy1',
            returnExternalUrl: true,
        });
        if (itemids) {
            freigthUrl += '&item_id=' + itemids;
        }
        if (itemskus) {
            freigthUrl += '&item_sku=' + itemskus;
        }
        if (postcode) {
            freigthUrl += '&postcode=' + postcode;
        }
        if (suburb) {
            freigthUrl += '&suburb=' + suburb;
        }
        freigthUrl += '&location=15';
        log.debug('freigthUrl', freigthUrl);
        var freightReq = https.get({url: freigthUrl});
        log.debug('freightReq', freightReq);
        if (freightReq.code == 200) {
            return JSON.parse(freightReq.body);
        } else {
            return null;
        }
    }

    function getTrackingUrl(ifsCarrierId, shipmethodId) {
        var filters = [['isinactive', 'is', 'F']];
        if (ifsCarrierId) {
            filters.push('AND');
            filters.push(['internalid', 'is', ifsCarrierId]);
        } else if (shipmethodId) {
            filters.push('AND');
            filters.push(['custrecord_avt_ifs_ship_method_car', 'is', shipmethodId]);
        }

        var carriers = SearchExistingRecord('customrecord_avt_ifs_carrier', 
            filters, 
            [
                'name',
                'custrecord_avt_ifs_carriername',
                'custrecord_avt_ifs_ship_method_car',
                'custrecord_avt_ifs_carrier_web'
            ]
        );

        return carriers[0];

    }

    function getItemFields(itemskus) {
        var itemUrl = url.resolveScript({
            scriptId: 'customscript_get_item_fields',
            deploymentId: 'customdeploy1',
            returnExternalUrl: true,
        });
        if (itemskus) {
            itemUrl += '&item_sku=' + itemskus;
        }

        var itemResp = https.get({url: itemUrl});
        log.debug('itemResp', itemResp);
        if (itemResp.code == 200) {
            return JSON.parse(itemResp.body);
        } else {
            return null;
        }
    }

    function emailNotice(options) {
        var defaultOption = {
            author: '16',
            recipients: '16',
        }
        email.send(util.extend(defaultOption, options));
    }

    return {
        isEmpty: isEmpty,
        getVersion: getVersion,
        getSKU: getSKU,
        getStateFullName: getStateFullName,
        getStateShortName: getStateShortName,
        getEntityGroupMembers: getEntityGroupMembers,
        replaceDateTemplate: replaceDateTemplate,
        trimCommaLineBreaker: trimCommaLineBreaker,
        getCheckboxValue: getCheckboxValue,
        wait: wait,
        getStateFromPostcode: getStateFromPostcode,
        createUpdateRecord: createUpdateRecord,
        SearchExistingRecord: SearchExistingRecord,
        formatPhone: formatPhone,
        requestUrl: requestUrl,
        getFreightOptions: getFreightOptions,
        getTrackingUrl: getTrackingUrl,
        getItemFields: getItemFields,
        emailNotice: emailNotice,
    }
});