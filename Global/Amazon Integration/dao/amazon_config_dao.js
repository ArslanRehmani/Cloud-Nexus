/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', '../lib/amazon_request_lib','N/https'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     */
    (log, record, runtime, search, requestLib, https) => {

        let scriptParams = {};

        const CONSTANTS = {

            SCRIPT: {
                MR: {
                    SCRIPT_ID: 'customscript_amazon_sync_orders_mr',
                    DEPLOYMENT_ID: 'customdeploy_amazon_sync_orders_mr',
                    PARAMS: {
                        CONFIG: 'custscript_amazon_config'
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
                }
                catch (e) {
                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getParams:err', err);
                }
                return scriptParams;
            },
            getAmazonConfigurations: () => {
                try {

                    let configRecord = CONFIG.getParams();

                    // log.debug('Amazon Configuration', configRecord);

                    let configDetails = CONFIG.getConfigDetails(configRecord.CONFIG || 1);
                    return configDetails;
                }
                catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getAmazonConfigurations:err', err);
                }
                return '';
            },
            getConfigDetails: (configRecordId) => {
                var getInputAccessToken = '';
                var accessToken = '';
                try {

                    let configSearch = search.create({
                        type: "customrecord_amazon_config_dao",
                        filters:
                            [
                                ["internalidnumber", "equalto", configRecordId],
                                "AND",
                                ["isinactive", "is", "F"]
                            ],
                        columns:
                            [
                                "name",
                                "custrecord_amazon_client_id",
                                "custrecord_amazon_client_secret",
                                "custrecord_amazon_refresh_tokens",
                                "custrecord_amazon_access_token",
                                "custrecord_amazon_grant_type"
                            ]
                    });

                    let searchResult = configSearch.run().getRange({ start: 0, end: 1 });

                    if (searchResult.length > 0) {

                        let clientId = searchResult[0].getValue({ name: "custrecord_amazon_client_id" }) || '';

                        let clientSecret = searchResult[0].getValue({ name: "custrecord_amazon_client_secret" }) || '';

                        let refreshToken = searchResult[0].getValue({ name: "custrecord_amazon_refresh_tokens" }) || '';

                        accessToken = searchResult[0].getValue({ name: "custrecord_amazon_access_token" }) || '';

                        let grantType = searchResult[0].getValue({ name: "custrecord_amazon_grant_type" }) || '';

                        if (!accessToken) {

                            accessToken = requestLib.REQUESTS.getAccessToken(clientId, clientSecret, refreshToken, grantType);

                            if (accessToken) {
                                record.submitFields({
                                    type: 'customrecord_amazon_config_dao',
                                    id: configRecordId,
                                    values: {
                                        'custrecord_amazon_access_token': accessToken
                                    }
                                });
                            }
                            getInputAccessToken = accessToken;

                        } else {
                            let lastAccessToken = CONFIG.lastAccessTokenDate();

                            if (lastAccessToken == true) {
                                let accessTokenAfterHour = requestLib.REQUESTS.getAccessToken(clientId, clientSecret, refreshToken, grantType);
                                if (accessTokenAfterHour) {
                                    record.submitFields({
                                        type: 'customrecord_amazon_config_dao',
                                        id: configRecordId,
                                        values: {
                                            'custrecord_amazon_access_token': accessTokenAfterHour
                                        }
                                    });
                                }
                                getInputAccessToken = accessTokenAfterHour;
                            } else {
                                getInputAccessToken = accessToken;
                            }
                        }

                    }

                }
                catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getAmazonConfigurations:err', err);
                }
                return getInputAccessToken || '';
            },
            getAccessToken: (clientId, clientSecret, refreshToken, grantType) => {
                try {

                    let accessTokenReq = requestLib.REQUESTS.getAccessToken(clientId, clientSecret, refreshToken, grantType);

                }
                catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getAccessToken:err', err);
                }
            },
            lastAccessTokenDate: () => {
                var title = 'lastAccessTokenDate[::]';
                try {

                    let customrecord_amazon_config_daoSearchObj = search.create({
                        type: "customrecord_amazon_config_dao",
                        filters:
                            [
                                ["systemnotes.field", "anyof", "CUSTRECORD_AMAZON_ACCESS_TOKEN"]
                            ],
                        columns:
                            [
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

                    let searchResult = customrecord_amazon_config_daoSearchObj.run().getRange({ start: 0, end: 1 });
                    if (searchResult.length > 0) {

                        var lastDateTime = searchResult[0].getValue({ name: 'date', join: 'systemNotes', summary: 'MAX' });
                        var currentDateTime = searchResult[0].getValue({ name: 'formuladatetime', formula: '{today}', summary: 'GROUP' });
                    }

                    var tokenWithinHour = CONFIG.tokenWithinHourFun(lastDateTime, currentDateTime);


                } catch (e) {

                    log.error(title + e.name, e.message);

                }
                return tokenWithinHour;
            },
            tokenWithinHourFun: (lastDateTime, currentDateTime) => {
                var title = 'tokenWithinHourFun[::]';
                var inAnHour = false;
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

                    // Check if the difference is greater than 1 hour
                    var isGreaterThanOneHour = diffInHours > 1;

                    if (isGreaterThanOneHour == true) { // true if the difference is greater then one hour, otherwise false
                        inAnHour = true;
                    } else {
                        inAnHour = false;
                    }

                } catch (e) {
                    log.error(title + e.name, e.message);
                }
                return inAnHour;
            },
            getItemData: (amazonOrderId, token) => {
                var title = 'getItemData[::]';
                try {
                    //Get Item Data from Amazon
                    var headers = {};
                    headers['Content-Type'] = 'application/json';
                    headers['x-amz-access-token'] = token;

                    var link = 'https://sellingpartnerapi-fe.amazon.com/orders/v0/orders/'+amazonOrderId+'/orderItems';
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

        return { CONSTANTS, CONFIG }

    });