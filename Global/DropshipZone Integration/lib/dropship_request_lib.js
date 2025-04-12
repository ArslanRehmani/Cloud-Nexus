/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/file', 'N/https'],
    /**
     * @param{log} log
     * @param{record} record
     * @param{runtime} runtime
     * @param{search} search
     * @param{file} file
     * @param{https} https
     */
    (log, record, runtime, search, file, https) => {

        const CONSTANTS = {
            DROPSHIP_CONFIGURATION: {
                RECORTYPE: 'customrecord_dropshipzone_configuration',
                ID: 1,
                USERNAME: 'custrecord_dropship_user_name',
                PASSWORD: 'custrecord_dropship_password'
            }
        }

        const HELPERS = {

            getToken: () => {
                var title = 'getToken[::]';
                try {
                    //Load DropshipZone Configuration Record
                    var dropShipRecord = record.load({
                        type: CONSTANTS.DROPSHIP_CONFIGURATION.RECORTYPE,
                        id: CONSTANTS.DROPSHIP_CONFIGURATION.ID
                    });

                    //get User Name field from DropshipZone Configuration Record
                    var userName = dropShipRecord.getValue({
                        fieldId: CONSTANTS.DROPSHIP_CONFIGURATION.USERNAME
                    });

                    //get Password Field from DropshipZone Configuration Record
                    var password = dropShipRecord.getValue({
                        fieldId: CONSTANTS.DROPSHIP_CONFIGURATION.PASSWORD
                    });

                    //Generate Token
                    var tokenHeaders = {};
                    tokenHeaders['Content-Type'] = 'application/json';
                    tokenHeaders['Accept'] = 'application/json';
                    var tokenLink = 'https://api.dropshipzone.com.au/auth';
                    var tokenBody = {
                        "email": userName,
                        "password": password
                    };
                    var tokenPostBody = JSON.stringify(tokenBody);
                    var tokenResponse = https.post({
                        url: tokenLink,
                        body: tokenPostBody,
                        headers: tokenHeaders
                    });
                    var tokenResponseJSON = JSON.parse(tokenResponse.body);
                    var token = tokenResponseJSON.token;
                    return token || '';
                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            },
            getDropShipOrders: () => {
                var title = 'getDropShipOrders[::]';
                try {
                    var token = HELPERS.getToken();

                    //Get Orders from DropshipZone
                    var headers = {};
                    headers['Content-Type'] = 'application/json';
                    headers['Authorization'] = 'jwt ' + token;
                    // var link = 'https://services.dropshipzone.com.au/admin/api/supplier/v1/orders?limit=1000&exported_status=0';
                    // var link = 'https://services.dropshipzone.com.au/admin/api/supplier/v1/orders?order_ids=1000758537&status=processing&limit=1000';
                    var link = 'https://services.dropshipzone.com.au/admin/api/supplier/v1/orders?status=processing&limit=1000';
                    var response = https.get({
                        url: link,
                        headers: headers
                    });
                    var responseBody = JSON.parse(response.body);
                    var bodyOrders = responseBody.data;
                    var ordersList = bodyOrders.orders;
                    if(ordersList && ordersList.length > 0){
                        return ordersList;
                    }else{
                        return [];
                    }
                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            },
            
        }

        return { CONSTANTS, HELPERS }

    });