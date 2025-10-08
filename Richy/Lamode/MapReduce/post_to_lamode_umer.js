/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log', 'N/https', 'N/runtime'], function (search, record, log, https, runtime) {

    function getInputData() {
        log.debug("getInputData", "Loading saved search");
        // const mySearch = search.load({ id: 'customsearch2400' });
        const mySearch = search.load({ id: 'customsearch2739' });
        mySearch.filters.push(
            search.createFilter({
                name: 'trandate',
                operator: search.Operator.ONORAFTER,
                values: '22/06/2025' // بداية شهر أبريل 2025
            })
        );

        return mySearch;
        // const paramJson = runtime.getCurrentScript().getParameter({
        //     name: 'custscript_cashsales_json'
        // });

        // if (!paramJson) {
        //     log.error('Missing Parameter');
        //     return [];
        // }

        // const data = JSON.parse(paramJson);

        // log.debug('Parsed Input Data', data);

        // return [data];
    }

    function map(context) {
        const searchResult = JSON.parse(context.value);
        // log.debug("Processing Transaction", { transactionId: searchResult.id, entityId: searchResult.values.entity.value, recordType: searchResult.recordType });
        log.debug("Processing Transaction", searchResult);

        //{"recordType":"cashsale","id":"2957093",
        // "values":{"recordtype":"cashsale","tranid":"J-20068","datecreated":"9/7/2025 12:57 pm","entity":{"value":"1782280","text":"164208 خالد الحارثي"},"formulatext":"+966503350093","formulanumeric":"7"}}

        const internalId = searchResult.id;
        log.debug({
            title: 'internalId',
            details: internalId
        });
        log.debug({
            title: 'internalId type of',
            details: typeof internalId
        });
        const entityId = searchResult.values.entity.value;

        try {
            const customer = record.load({ type: "customer", id: entityId });
            log.debug("Customer Record Loaded", { entityId });

            const customerData = {
                name: customer.getValue({ fieldId: "altname" }),
                mobile: customer.getValue({ fieldId: "phone" })
            };
            log.debug("Customer Data", customerData);

            const transaction = record.load({ type: searchResult.recordType, id: internalId });
            log.debug("Transaction Record Loaded", { transactionId: internalId });

            const items = extractTransactionItems(transaction);
            log.debug("items", items);

            if (items.length === 0) {
                log.debug("No items to process", { transactionId: internalId });
                return;
            }

            const payload = {
                invoice: transaction.getValue({ fieldId: "tranid" }),
                phone: customerData.mobile,
                id: entityId,
                name: customerData.name,
                items: items
            };

            log.debug("Payload Prepared", payload);

            const token = retrieveToken();
            log.debug("Token Retrieved", { token });

            postToApi(payload, transaction, token);

        } catch (error) {
            log.error("Error Processing Transaction", error);
        }
    }

    function extractTransactionItems(transaction) {
        const lineCount = transaction.getLineCount({ sublistId: "item" });
        log.debug("Extracting Transaction Items", { lineCount });

        const items = [];
        for (let i = 0; i < lineCount; i++) {
            var product = transaction.getSublistValue({ sublistId: "item", fieldId: "custcol_upc_code", line: i });

            var width = transaction.getSublistValue({ sublistId: "item", fieldId: "custcolwidth", line: i });

            var widthValue = "";
            if (width == "2") {
                widthValue = "58";
            } else if (width == "1") {
                widthValue = "38";
            }

            if (product != "LMD0008" && product != "LMD0010" && product != "Discount - خصم" && product != "LMD0001") {

                if (product.includes('LMD')) {

                    var type = "Fabric";


                    if (product == "LMD0001" || product == "RAV001" || product == "LMD0006") {
                        type = "Service";
                    }

                    var quantity = transaction.getSublistValue({ sublistId: "item", fieldId: "quantity", line: i });
                    if (quantity) {
                        quantity = quantity.toString();
                    } else {
                        quantity = "0";
                    }

                    const item = {
                        sku: product || '',
                        type: type,
                        qty: quantity,
                        width: widthValue,
                        note: transaction.getSublistValue({ sublistId: "item", fieldId: "note2", line: i }) || 'Default Note'
                    };
                    items.push(item);
                    log.debug("Item Extracted", item);
                }
            }
        }

        return items;
    }

    function retrieveToken() {
        try {
            const response = https.post({
                url: 'https://lamode.richy.group/api/token/',
                body: JSON.stringify({
                    email: "NetSuite@richy.sa",
                    password: "Ad1234min"
                }),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            const responseBody = JSON.parse(response.body);
            if (responseBody && responseBody.access) {
                return responseBody.access;
            } else {
                throw new Error('Token not included in API response');
            }
        } catch (error) {
            log.error("Token Retrieval Error", error);
            throw error;
        }
    }

    function postToApi(payload, transaction, token) {
        try {
            if (!token) {
                throw new Error("Token is missing. Unable to authenticate the request.");
            }

            log.debug("Posting Payload to API", { payload });

            const response = https.post({
                url: 'https://lamode.richy.group/api/create-invoice/',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            log.debug("API Response", { status: response.code, body: response.body });
            const responseBody = JSON.parse(response.body);

            if (responseBody && responseBody.success) {
                log.debug("API Call Successful", responseBody);

                transaction.setValue({ fieldId: 'custbody_ns_sync_oto_cb', value: true });
                transaction.setValue({ fieldId: 'custbody_richy_cash_sale_updated', value: true });
                transaction.save();
                log.debug("Transaction Marked as Synced", { transactionId: transaction.id });
            } else {
                log.error("API Response Error", responseBody);
            }
        } catch (error) {
            log.error("Error Posting to API", { error: error.message, stack: error.stack });
        }
    }

    return {
        getInputData: getInputData,
        map: map
    };
});
