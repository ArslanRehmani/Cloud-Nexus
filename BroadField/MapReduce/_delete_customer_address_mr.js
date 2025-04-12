/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', './_delete_customer_address_helper'],
    /**
     * @param{search} search
     */
    (search, HELPER) => {
        const getInputData = (inputContext) => {
            try {

                //Get Search ID from Script Parameters
                let params = HELPER.HELPERS.getParams();

                //Load Search
                let scheduleAddressDeleteionSearch = search.load({
                    id: params.SEARCHID
                });

                return scheduleAddressDeleteionSearch;
            }
            catch (e) {

                log.error('getInputData Exception', e.message);
            }
        }
        const map = (mapContext) => {
            try {
                //Get Data from getInput Function
                let data = JSON.parse(mapContext.value);
                log.debug('data', data);

                //Get Customer and Address IDs
                let customerId = data.values["GROUP(internalid)"].value || '';
                let addressId = data.values["GROUP(addressinternalid.Address)"] || '';

                //Delete Customer Address 
                if (customerId && addressId) {
                    HELPER.HELPERS.deleteScheduledAddress(customerId, addressId);
                } 
            } catch (e) {
                log.error('map Exception', e.message);
            }
        }
        const reduce = (reduceContext) => {

        }
        const summarize = (summaryContext) => {

        }
        return { getInputData, map, reduce, summarize }

    });
