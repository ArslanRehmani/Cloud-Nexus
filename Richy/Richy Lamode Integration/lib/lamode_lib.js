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
                BASE_URL: 'https://lamode.richy.group/api'
            },
            HEADERS: {
                CONTENT_TYPE: 'application/json',
                ACCEPT: '*/*'
            },
            CREDENTIAL: {
                USER_NAME: 'nada@richy.sa',
                PASSWORD: 'Ad1234min'
            }

        }

        const REQUESTS = {

            getAccessToken: () => {
                var title = 'getAccessToken[::]';
                try {
                    let body = {
                        "email": CONSTANTS.CREDENTIAL.USER_NAME,
                        "password": CONSTANTS.CREDENTIAL.PASSWORD
                    }

                    let headers = {
                        'Content-Type': CONSTANTS.HEADERS.CONTENT_TYPE,
                        'Accept': CONSTANTS.HEADERS.ACCEPT
                    };
                    var response = https.post({
                        url: CONSTANTS.ACTION.BASE_URL + '/token/',
                        headers: headers,
                        body: JSON.stringify(body)
                    });

                } catch (e) {
                    log.error(title + e.name, e.message);
                }
                return JSON.parse(response.body).access || '';
            },

            createAssetInLamode: (value) => {
                var title = 'createAssetInLamode[::]';
                try {
                    var token = REQUESTS.getAccessToken();
                    log.debug({
                        title: 'token',
                        details: token
                    });
                    const values = value;

                    const payload = {
                        status: true,
                        asset_number: values.name,
                        category: values.altname,
                        model_name: values.custrecord_assetdescr?.text || '',
                        asset_type: values.custrecord_assettype?.text || '',
                        device_validity: values.custrecord_assetstatus?.text || '',
                        condition: values.custrecord_assetstatus?.text || ''
                    };

                    const headers = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': 'Bearer '+token+''
                    };

                    const response = https.post({
                        url: 'https://lamode.richy.group/api/create-assets/',
                        headers: headers,
                        body: JSON.stringify(payload)
                    });

                    log.debug('POST Response', {
                        code: response.code,
                        body: response.body
                    });
                } catch (e) {
                    log.error(title + e.name, e.message);
                }
            }


        }
        return { CONSTANTS, REQUESTS }

    });