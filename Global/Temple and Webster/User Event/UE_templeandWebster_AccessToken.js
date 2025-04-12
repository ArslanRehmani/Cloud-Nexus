/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/https', 'N/log'], function (https, log) {

    function beforeLoad(context) {
        var title = 'beforeLoad[::]';
        try {

            //Generate Token
            var tokenHeaders = {};
            tokenHeaders['Content-Type'] = 'application/json';
            tokenHeaders['CF-Access-Client-Id'] = '8cc9241f7630aacbfb11a4d9e7034e82.access';
            tokenHeaders['CF-Access-Client-Secret'] = '3d58b482c726963d206292959707498b40e883e3a405c98812ed4174f8b7ccf5';
            tokenHeaders['TWSP-API-KEY'] = '1E468A83-D9B0-8AED-48E7-24F19F821076';

            var tokenLink = 'https://staging.partners.templeandwebster.com.au/v/api/v1/authenticate/generate_token';

            var tokenResponse = https.get({
                url: tokenLink,
                headers: tokenHeaders
            });
            var tokenResponseJSON = JSON.parse(tokenResponse.body);
            log.debug({
                title: 'tokenResponseJSON',
                details: tokenResponseJSON
            });
            var accessToken = tokenResponseJSON.data.access_token;
            log.debug({
                title: 'accessToken',
                details: accessToken
            });




            var headers = {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json', // Assuming this is correct from Postman
                'Cookie': 'WFSID=13gpit2qptdhn4s77t6fgf7kam; wfgelfs=db_class=0; CF_AppSession=nd87c0f76d0e2d8f5; CF_Authorization=eyJraWQiOiJhZDg2OGJiYTNhMDQxZTU1ZTkyZWYyZDYwODBlY2JiNDBjMTljNGIzNGRkMzc4NjA3ZTQ3M2YyODg5MWU5NzQyIiwiYWxnIjoiUlMyNTYiLCJ0eXAiOiJKV1QifQ.eyJ0eXBlIjoiYXBwIiwiYXVkIjoiZWMwMTNlMWJlNzE1YTZhYWZmZWMwNTVkODkxOWM0ZDI3M2FlMDM0MThmMzhiZDJlMTY2M2FkODEwN2E3ZDQyNiIsImV4cCI6MTcyNzgwMTc0OCwiaXNzIjoiaHR0cHM6XC9cL3RlbXBsZWFuZHdlYnN0ZXIuY2xvdWRmbGFyZWFjY2Vzcy5jb20iLCJjb21tb25fbmFtZSI6IjhjYzkyNDFmNzYzMGFhY2JmYjExYTRkOWU3MDM0ZTgyLmFjY2VzcyIsImlhdCI6MTcyNzc1ODU0OCwic3ViIjoiIn0.N3TUkIl5lVWPf4Mqxl4kcpZi9oVW6j1Onr5bSDdX5O1_aeaUl-LhOEoq7bJuoYQGy29164zXSgGc0ndStH_BcJnP1dRj1S66rY__MfxvxlZ5sh3Pl6vLWr4hWDA0vFf0vufpPKTMfPV9-EhwhhsA3y2nv9EGp8oC5awHcfyDERFAyvY2C-WpkiTH6QVdRlmFe90p6OKStKGu8bZl81VTH_4ZxFrl8V4CIPhulKtnWEhJicQEnaG0yRZ6PzPmhtNU7X5mlm64ry_lV3_5RqZlzmDAbOJghZNSnWAXsJiKSsFPclcIIlKjmGtdTHmzRGujZJv_vqqzmyN3_v16wViu6w; server=Staging3'
            };
            // var reqHeaders = {};
            // reqHeaders['Content-Type'] = 'application/json';
            // reqHeaders['Authorization'] = 'Bearer ' + accessToken;
            // reqHeaders['Accept'] = 'application/json;odata=verbose';
            // reqHeaders['Accept-Encoding'] = 'gzip, deflate, br';
            var urlLink = 'https://staging.partners.templeandwebster.com.au/v/api/v1/orders/list_purchase_orders?order_ready_date_from=2023-02-30&order_ready_date_to=2023-09-22';
            var poOrderResponse = https.get({
                url: urlLink,
                headers: headers
            });
            log.debug({
                title: 'poOrderResponse',
                details: poOrderResponse
            });
            log.debug({
                title: 'poOrderResponse.code',
                details: poOrderResponse.code
            });
            log.debug({
                title: 'poOrderResponse.body',
                details: poOrderResponse.body
            });
            // var poOrderResponseJSON = JSON.parse(poOrderResponse.body);
            
            // log.debug({
            //     title: 'poOrderResponseJSON',
            //     details: poOrderResponseJSON
            // });

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    // function beforeSubmit(context) {

    // }

    // function afterSubmit(context) {

    // }

    return {
        beforeLoad: beforeLoad
        // beforeSubmit: beforeSubmit,
        // afterSubmit: afterSubmit
    }
});
