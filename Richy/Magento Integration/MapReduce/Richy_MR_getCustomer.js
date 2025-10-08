/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/https', 'N/log', '../lib/magento_lib.js'], (https, log, magento_LIB) => {

    const getInputData = () => {
        try {

            let customerArray = magento_LIB.REQUESTS.getCustomerInfo();

            log.debug({
                title: 'customerArray',
                details: customerArray
            });

            if (customerArray && customerArray.length > 0){
                // return customerArray || [];
                return [{"id":63440,"group_id":1,"created_at":"2025-06-18 11:33:01","updated_at":"2025-06-18 11:33:04","created_in":"العربية","dob":"1991-06-25","email":"juvdi10@gmail.com","firstname":"Abdulmajeed","lastname":"Alenazy","gender":1,"store_id":2,"website_id":1,"addresses":[],"disable_auto_group_change":0,"extension_attributes":{"is_subscribed":false},"custom_attributes":[{"attribute_code":"mobilenumber","value":"+966500701478"},{"attribute_code":"firebase_device_token","value":"e-EDtH_EBUXSrJGWBMh7IR:APA91bFEqZ4kvo1kwa3hoT5aPdaP9t9nuvylUwqxg_C8NRNatn9wzWyx5Um6OlZAL4u6qKlLadr_M7RD3Xq2kXasQMp8YvQq-zzluOOMYUhekw5kq-g0_DU"},{"attribute_code":"rewards_subscription","value":"1"},{"attribute_code":"mpmilestone_disable_auto","value":"0"}]}];
            }

        } catch (e) {
            log.error("Error in getInputData", e);
        }
    };

    const map = (mapContext) => {
        try {
            const customer = JSON.parse(mapContext.value);
            log.debug("Customer Record", customer);

            let customerId = magento_LIB.REQUESTS.createCustomerInNS(customer);
            // log.debug("customerId", customerId);
        } catch (e) {
            log.error("Error in map function", e);
        }
    };

    return { getInputData, map };
});
