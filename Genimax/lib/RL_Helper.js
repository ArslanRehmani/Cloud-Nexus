/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/https', 'N/log'], (https, log) => {

    const BASE_URL = 'https://portal.regallogistics.com:2053/api/RegalServices';

    const authenticate = () => {
        const url = `${BASE_URL}/Authentication/json`;

        var body = "{\"CustomerMasterNo\":\"102030\",\"UserID\":\"tyler@fullcirclehome.com\",\"Password\":\"FCbrands2025!\"}";

        const response = https.post({
            url,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = JSON.parse(response.body);
        const token = result?.LogonResponse?.Token;

        if (!token) {
            throw new Error("Failed to retrieve token from API");
        }

        log.debug('API Token Retrieved', token);
        return token;
    };

    const getInventory = (token) => {
        const url = `${BASE_URL}/GetInventoryItem/json`;
        var array = ['2039', '2030'];

        // var body = "{\r\n  \"Token\": \"" + token + "\",\r\n  \"AccountNo\": \"" + 2138 + "\",\r\n  \"CustomerItem\": \"\",\r\n  \"IsExactMatchCustomerItem\": \"true\",\r\n  \"RegalItem\": \"\",\r\n  \"IsExactMatchRegalItem\": \"true\",\r\n  \"UPCNumber\": \"1\",\r\n  \"IsExactMatchUPCNumber\": \"false\",\r\n  \"Pack\": \"\",\r\n  \"OnHand\": \"true\",\r\n  \"Type\": \"All\",\r\n  \"Search\": \"\",\r\n  \"PageSize\": \"1\",\r\n  \"PageNumber\": \"20\"\r\n}";
        var body1 = "{\r\n  \"Token\": \"" + token + "\",\r\n  \"AccountNo\": \"" + 2039 + "\",\r\n  \"CustomerItem\": \"\",\r\n  \"IsExactMatchCustomerItem\": \"true\",\r\n  \"RegalItem\": \"\",\r\n  \"IsExactMatchRegalItem\": \"true\",\r\n  \"UPCNumber\": \"1\",\r\n  \"IsExactMatchUPCNumber\": \"false\",\r\n  \"Pack\": \"\",\r\n  \"OnHand\": \"true\",\r\n  \"Type\": \"All\",\r\n  \"Search\": \"\",\r\n  \"PageSize\": \"1\",\r\n  \"PageNumber\": \"20\"\r\n}";
        var body2 = "{\r\n  \"Token\": \"" + token + "\",\r\n  \"AccountNo\": \"" + 2030 + "\",\r\n  \"CustomerItem\": \"\",\r\n  \"IsExactMatchCustomerItem\": \"true\",\r\n  \"RegalItem\": \"\",\r\n  \"IsExactMatchRegalItem\": \"true\",\r\n  \"UPCNumber\": \"1\",\r\n  \"IsExactMatchUPCNumber\": \"false\",\r\n  \"Pack\": \"\",\r\n  \"OnHand\": \"true\",\r\n  \"Type\": \"All\",\r\n  \"Search\": \"\",\r\n  \"PageSize\": \"1\",\r\n  \"PageNumber\": \"20\"\r\n}";


        const response1 = https.post({
            url,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body1)
        });



        const result1 = JSON.parse(response1.body);
        var array1 = result1.listResult;

        const response2 = https.post({
            url,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body2)
        });

        const result2 = JSON.parse(response2.body);
        var array2 = result2.listResult;

        // Merge arrays
        var mergedArray = array1.concat(array2);

        // OR (modern ES6 spread operator)
        var mergedArray = [...array1, ...array2];
        // return result1?.listResult || [];

        return mergedArray || [];
    };

    return {
        authenticate,
        getInventory
    };

});
