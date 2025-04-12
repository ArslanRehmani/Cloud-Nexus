/**
 * @NApiVersion 2.1
 */
define(['N/https', 'N/encode'],
    /**
     * @param{https} 
     * @param{encode} 
     */
    (https, encode) => {

        const CONSTANTS = {

            ACTION: {
                ACCESS_TOKEN_URL: 'https://api.ebay.com/identity/v1/oauth2/token'
            },
            HEADERS: {
                CONTENT_TYPE: 'application/json'
            },

        }

        const REQUESTS = {

            getAccessToken: (clientId, clientSecret, refreshToken, grantType, scope) => {
                var token = '';
                try {

                    let url = CONSTANTS.ACTION.ACCESS_TOKEN_URL;

                    // Basic Authentication credentials

                    let encodedCredentials = encode.convert({
                        string: clientId + ':' + clientSecret,
                        inputEncoding: encode.Encoding.UTF_8,
                        outputEncoding: encode.Encoding.BASE_64,
                    });

                    // Define headers
                    let headers = {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                        'Authorization': 'Basic ' + encodedCredentials,
                    };


                    // Prepare body (use x-www-form-urlencoded format)
                    let body = 'grant_type='+grantType+'' +
                        '&refresh_token='+refreshToken+'' +
                        '&scope='+scope+'';

                    let response = https.post({
                        url: url,
                        headers: headers,
                        body: body
                    });

                  log.debug('Response', response);
                  if(response.code == 200){
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
            getOrdersDeatilsFromEBay: (token, ebayOrderId) => {
                var title = 'getOrdersFromAmazon[::]';
                try {
                    //Get Single Order Details from Ebay
                    var headers = {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    };
                  //  var link = 'https://sellingpartnerapi-fe.amazon.com/orders/v0/orders/' + amazonOrderId + '';
                   var link = 'https://api.ebay.com/sell/fulfillment/v1/order/' + ebayOrderId + '';
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