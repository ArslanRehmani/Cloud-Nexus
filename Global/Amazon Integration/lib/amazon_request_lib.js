/**
 * @NApiVersion 2.1
 */
define(['N/https'],
    /**
     * @param{https} 
     */
    (https) => {

        const CONSTANTS = {

            ACTION: {
                ACCESS_TOKEN_URL: 'https://api.amazon.com/auth/o2/token'
            },
            HEADERS: {
                CONTENT_TYPE: 'application/json'
            },

        }

        const REQUESTS = {

            getAccessToken: (clientId, clientSecret, refreshToken, grantType) => {
                var token = '';
                try {

                    let url = CONSTANTS.ACTION.ACCESS_TOKEN_URL;

                    let headers = { 'Content-Type': CONSTANTS.HEADERS.CONTENT_TYPE };

                    let body = JSON.stringify({
                        client_id: clientId,
                        client_secret: clientSecret,
                        grant_type: grantType,
                        refresh_token: refreshToken
                    });

                    let response = https.post({
                        url: url,
                        headers: headers,
                        body: body
                    });

                    log.debug('Response', response);
                    if (response.code == 200) {
                        let Body = JSON.parse(response.body);
                        token = Body.access_token;

                    }
                }
                catch (e) {

                    let err = `${e.name} - ${e.message} - ${e.stack}`;

                    log.error('getAccessToken:err', err);
                }
                return token || '';
            },
            getFormattedDate: () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
                const day = String(now.getDate()).padStart(2, '0'); // Ensure two digits

                return `${year}-${month}-${day}`;
            },
            getOrdersDeatilsFromAmazon: (token, amazonOrderId) => {
                var title = 'getOrdersFromAmazon[::]';
                try {
                    //Get Order Details from Amazon
                    var headers = {};
                    headers['Content-Type'] = 'application/json';
                    headers['x-amz-access-token'] = token;

                    var link = 'https://sellingpartnerapi-fe.amazon.com/orders/v0/orders/' + amazonOrderId + '';
                    var response = https.get({
                        url: link,
                        headers: headers
                    });
                    var responseBody = JSON.parse(response.body);

                } catch (e) {
                    log.error(title + e.name, e.message);
                }
                return responseBody || {};
            }


        }
        return { CONSTANTS, REQUESTS }

    });