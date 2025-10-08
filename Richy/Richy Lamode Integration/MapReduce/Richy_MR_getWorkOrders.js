/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/https', 'N/record', 'N/log', 'N/runtime', 'N/search'],
    (https, record, log, runtime, search) => {

        const TOKEN_URL = 'https://lamode.richy.group/api/token/';
        const ORDERS_URL = 'https://lamode.richy.group/api/orders/completed/';

        const USERNAME = 'nada@richy.sa';
        const PASSWORD = 'Ad1234min';

        const getAccessToken = () => {
            const payload = JSON.stringify({
                "email": USERNAME,
                "password": PASSWORD
            });

            const response = https.post({
                url: TOKEN_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cookie': 'csrftoken=Ti3Z0KKJwcY27P9NnmWPm2AOr1qAN3Le',
                    'Authorization': 'Basic bmFkYUByaWNoeS5zYTpBZDEyMzRtaW4='
                },
                body: payload
            });

            log.debug('Token raw body', JSON.parse(response.body));
            log.debug('response.code', response.code);

            if (response.code !== 200) {
                throw new Error(`Token request failed. Code: ${response.code}, Body: ${response.body}`);
            }

            let responseBody;
            try {
                responseBody = JSON.parse(response.body);
            } catch (e) {
                throw new Error(`Token response is not valid JSON: ${response.body}`);
            }

            if (!responseBody.access) {
                throw new Error('Access token not found in response.');
            }

            return responseBody.access;
        };
        const getCompletedOrders = (token) => {
            const response = https.get({
                url: 'https://lamode.richy.group/api/orders/completed/',
                headers: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzU0NDA1NzMzLCJpYXQiOjE3NTQ0MDIxMzMsImp0aSI6ImY5ZTViYjc4ZjUxNjQ0ZWI4MjhiNjE3ZjNiOWRkOTk3IiwidXNlcl9pZCI6NH0.ApRBk0yM3B5vr66RzsvqtOEl53dgW84rzLspIJrhLjU',
                    'Accept': '*/*',
                    'Cache-Control': 'no-cache'
                }
            });
            log.debug({
                title: 'response==',
                details: response
            });

            if (response.code !== 200) {
                throw `Orders fetch failed: ${response.body}`;
            }

            return JSON.parse(response.body);
        };


        const getAssemblyItemId = (sku) => {
            if (!sku) return null;

            const itemSearch = search.create({
                type: search.Type.ASSEMBLY_ITEM,
                filters: [['itemid', 'is', sku]],
                columns: ['internalid']
            });

            const results = itemSearch.run().getRange({ start: 0, end: 1 });
            return results.length ? results[0].getValue('internalid') : null;
        };

        const createWorkOrder = (order) => {
            try {
                const itemId = getAssemblyItemId(order.fabric_sku);
                if (!itemId) return;

                const workOrder = record.create({ type: record.Type.WORK_ORDER, isDynamic: true });

                workOrder.setValue({ fieldId: 'entity', value: parseInt(order.netsuite_customer_id) });
                workOrder.setValue({ fieldId: 'memo', value: order.order_id });
                workOrder.setValue({ fieldId: 'assemblyitem', value: itemId });
                workOrder.setValue({ fieldId: 'quantity', value: 1 }); // Update if fabric_size available
                workOrder.setValue({ fieldId: 'subsidiary', value: 1 });
                workOrder.setValue({ fieldId: 'location', value: 18 });
                workOrder.setValue({ fieldId: 'department', value: 68 });
                workOrder.setValue({ fieldId: 'class', value: 5 });

                if (order.model_number) {
                    workOrder.setValue({ fieldId: 'custbody_model_list', value: order.model_number });
                }

                const woId = workOrder.save();
                log.audit('Work Order Created', `ID: ${woId} for Order: ${order.order_id}`);
            } catch (e) {
                log.error('Work Order Creation Error', e);
            }
        };

        return {
            getInputData: () => {
                const token = getAccessToken();
                log.debug({
                    title: 'MY token',
                    details: token
                });
                const orders = getCompletedOrders(token);
                return orders || [];
            },

            map: (context) => {
                const order = JSON.parse(context.value);
                log.debug({
                    title: 'order',
                    details: order
                });
                // createWorkOrder(order);
            }
        };
    });
