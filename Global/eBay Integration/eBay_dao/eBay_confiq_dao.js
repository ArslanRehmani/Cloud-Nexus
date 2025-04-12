/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/https', '../eBay_lib/eBay_request_lib.js'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{https} https
     */
    (log, record, runtime, search, https, requestLib) => {

        let scriptParams = {};

        const CONSTANTS = {

            SCRIPT: {
                MR: {
                    SCRIPT_ID: 'customscript_mr_ebay_create_salesorder',
                    DEPLOYMENT_ID: 'customdeploy_mr_ebay_create_salesorder',
                    PARAMS: {
                        RECID: 'custscript_gfl_ebay_config'
                    }
                }
            }
        }

        const CONFIG = {
            getParams: () => {
                try {
                    if (!!scriptParams && Object.keys(scriptParams).length > 0) return scriptParams;

                    let scriptId = runtime.getCurrentScript().id;

                    let PARAMS = {};

                    switch (scriptId) {

                        case CONSTANTS.SCRIPT.MR.SCRIPT_ID:

                            PARAMS = CONSTANTS.SCRIPT.MR.PARAMS;

                            break;
                    }
                    Object.keys(PARAMS).forEach(key => {

                        scriptParams[key] = runtime.getCurrentScript().getParameter(PARAMS[key])

                    });
                } catch (e) {
                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getParams:err', err);
                }
                return scriptParams;
            },
            getEbayConfigurations: () => {
                try {

                    let configRecord = CONFIG.getParams();

                    let configDetails = CONFIG.getConfigDetails(configRecord.RECID || 1);
                    return configDetails;
                } catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getEbayConfigurations:err', err);
                }
                return '';
            },
            createEbayErrorRecord: (errorName, errorMsg, orderId) => {
                try {

                    var ebayErrorRecord = record.create({
                        type: 'customrecord_ebayerrorrecord'
                    });
                    ebayErrorRecord.setValue({
                        fieldId: 'custrecord_ebay_name',
                        value: errorName,
                    });
                    ebayErrorRecord.setValue({
                        fieldId: 'custrecord_ebay_msg',
                        value: errorMsg,
                    });
                    ebayErrorRecord.setValue({
                        fieldId: 'custrecord_ebay_orderid',
                        value: orderId,
                    });
                    var recordId = ebayErrorRecord.save();
                    log.debug({
                        title: 'Ebay error Record',
                        details: 'The Ebay error record is created with ID:' + recordId
                    });
                } catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('ebayErrorCustomRecord:err', err);
                }
            },
            getConfigDetails: (configRecordId) => {
                var getInputAccessToken = '';
                var accessToken = '';
                try {

                    let configSearch = search.create({
                        type: "customrecord_gfl_ebay_configuration",
                        filters: [
                            ["internalidnumber", "equalto", configRecordId],
                            "AND",
                            ["isinactive", "is", "F"]
                        ],
                        columns: [
                            search.createColumn({
                                name: "name",
                                label: "Name"
                            }),
                            search.createColumn({
                                name: "custrecord_gfl_ebay_grantrefreshtoken",
                                label: "Grant Type Refresh Token"
                            }),
                            search.createColumn({
                                name: "custrecord_gfl_refresh_token",
                                label: "Refresh Token"
                            }),
                            search.createColumn({
                                name: "custrecord_gfl_ebay_scope",
                                label: "Scope"
                            }),
                            search.createColumn({
                                name: "custrecord_gfl_username_password",
                                label: "eBay User Name"
                            }),
                            search.createColumn({
                                name: "custrecord_gfl_ebay_password",
                                label: "eBay Password"
                            }),
                            search.createColumn({
                                name: "custrecord_gfl_access_token",
                                label: "Access Token"
                            })
                        ]
                    });


                    let searchResult = configSearch.run().getRange({
                        start: 0,
                        end: 1
                    });

                    if (searchResult.length > 0) {

                        let grantType = searchResult[0].getValue({
                            name: "custrecord_gfl_ebay_grantrefreshtoken"
                        }) || '';

                        let refreshToken = searchResult[0].getValue({
                            name: "custrecord_gfl_refresh_token"
                        }) || '';

                        let scope = searchResult[0].getValue({
                            name: "custrecord_gfl_ebay_scope"
                        }) || '';

                        let clientId = searchResult[0].getValue({
                            name: "custrecord_gfl_username_password"
                        }) || '';

                        let clientSecret = searchResult[0].getValue({
                            name: "custrecord_gfl_ebay_password"
                        }) || '';

                        accessToken = searchResult[0].getValue({
                            name: "custrecord_gfl_access_token"
                        }) || '';

                        if (!accessToken) {

                            accessToken = requestLib.REQUESTS.getAccessToken(clientId, clientSecret, refreshToken, grantType, scope);

                            if (accessToken) {
                                record.submitFields({
                                    type: 'customrecord_gfl_ebay_configuration',
                                    id: configRecordId,
                                    values: {
                                        'custrecord_gfl_access_token': accessToken
                                    }
                                });
                            }
                            getInputAccessToken = accessToken;

                        } else {
                            let lastAccessToken = CONFIG.lastAccessTokenDate();

                            if (lastAccessToken == true) {
                                let accessTokenAfterTwoHour = requestLib.REQUESTS.getAccessToken(clientId, clientSecret, refreshToken, grantType, scope);
                                if (accessTokenAfterTwoHour) {
                                    record.submitFields({
                                        type: 'customrecord_gfl_ebay_configuration',
                                        id: configRecordId,
                                        values: {
                                            'custrecord_gfl_access_token': accessTokenAfterTwoHour
                                        }
                                    });
                                }
                                getInputAccessToken = accessTokenAfterTwoHour;
                            } else {
                                getInputAccessToken = accessToken;
                            }
                        }

                    }

                } catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getConfigDetails:err', err);
                }
                return getInputAccessToken || '';
            },
            lastAccessTokenDate: () => {
                var title = 'lastAccessTokenDate[::]';
                try {

                    let accessTokenRefesh = search.create({
                        type: "customrecord_gfl_ebay_configuration",
                        filters: [
                            ["systemnotes.field", "anyof", "CUSTRECORD_GFL_ACCESS_TOKEN"]
                        ],
                        columns: [
                            search.createColumn({
                                name: "date",
                                join: "systemNotes",
                                summary: "MAX",
                                label: "Date",
                                sort: search.Sort.ASC
                            }),
                            search.createColumn({
                                name: "formuladatetime",
                                summary: "GROUP",
                                formula: "{today}",
                                label: "Formula (Date/Time)"
                            })
                        ]
                    });

                    let searchResult = accessTokenRefesh.run().getRange({
                        start: 0,
                        end: 1
                    });
                    if (searchResult.length > 0) {

                        var lastDateTime = searchResult[0].getValue({
                            name: 'date',
                            join: 'systemNotes',
                            summary: 'MAX'
                        });
                        var currentDateTime = searchResult[0].getValue({
                            name: 'formuladatetime',
                            formula: '{today}',
                            summary: 'GROUP'
                        });
                    }

                    var tokenWithinTwoHour = CONFIG.tokenWithinTwoHourFun(lastDateTime, currentDateTime);

                } catch (e) {

                    log.error(title + e.name, e.message);

                }
                return tokenWithinTwoHour;
            },
            tokenWithinTwoHourFun: (lastDateTime, currentDateTime) => {
                var title = 'tokenWithinTwoHourFun[::]';
                var inTwoHours = false;
                try {
                    // Input date strings
                    var lastDate = lastDateTime;
                    var currentDate = currentDateTime; // Example date, change as needed

                    // Function to parse date string to Date object
                    function parseDateString(dateString) {
                        var parts = dateString.split(' ');
                        var datePart = parts[0].split('/');
                        var timePart = parts[1].split(':');
                        var period = parts[2];

                        var day = parseInt(datePart[0], 10);
                        var month = parseInt(datePart[1], 10) - 1; // Months are 0-based in JS Date object
                        var year = parseInt(datePart[2], 10);

                        var hours = parseInt(timePart[0], 10);
                        var minutes = parseInt(timePart[1], 10);

                        // Adjust for PM if needed
                        if (period === 'PM' && hours !== 12) {
                            hours += 12;
                        } else if (period === 'AM' && hours === 12) {
                            hours = 0;
                        }

                        return new Date(year, month, day, hours, minutes);
                    }

                    // Parse both date strings to Date objects
                    var lastDateObj = parseDateString(lastDate);
                    var currentDateObj = parseDateString(currentDate);

                    // Calculate the difference in milliseconds
                    var diff = currentDateObj - lastDateObj;

                    // Convert milliseconds to hours
                    var diffInHours = diff / (1000 * 60 * 60);

                    // Check if the difference is greater than 2 hours
                    var isGreaterThanTwoHours = diffInHours > 2;

                    if (isGreaterThanTwoHours) { // true if the difference is greater than two hours, otherwise false
                        inTwoHours = true;
                    } else {
                        inTwoHours = false;
                    }

                } catch (e) {
                    log.error(title + e.name, e.message);
                }
                return inTwoHours;
            },
            getEbayOrders: (token) => {
                var title = 'getItemData[::]';
                try {

                    var headers = {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };

                    var link = 'https://api.ebay.com/sell/fulfillment/v1/order';
                    var response = https.get({
                        url: link,
                        headers: headers
                    });
                    var responseBody = JSON.parse(response.body);

                } catch (e) {
                    log.error(title + e.name, e.message);
                }
                return responseBody || ''
            }

        }

        return {
            CONSTANTS,
            CONFIG
        }

    });