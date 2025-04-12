/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/search', 'N/runtime'],
    /**
     * @param{record} record
     * @param{search} search
     * @param{runtime} runtime
     */
    (record, search, runtime) => {
        let scriptParams = {};
        const CONSTANTS = {
            SCRIPT: {
                MR: {
                    SCRIPT_ID: 'customscript_schedule_address_to_delete',
                    DEPLOYMENT_ID: 'customdeploy_schedule_address_to_delete',
                    PARAMS: {
                        SEARCHID: 'custscript_address_deletion_search'
                    }
                }
            },
            SUBLIST: {
                SUBLIST_ID: {
                    ADRESS: 'addressbook'
                }
            },
            SUBLIST_FIELD: {
                ADDRESS_ID: 'internalid',
                ADRESS: 'addressbookaddress'
            }
        }

        const HELPERS = {
            getParams: () => {
                try {
                    if (!!scriptParams && Object.keys(scriptParams).length > 0) return scriptParams;
                    let scriptId = runtime.getCurrentScript().id;
                    let PARAMS = {};
                    switch (scriptId) {
                        case CONSTANTS.SCRIPT.MR.SCRIPT_ID:
                            PARAMS = CONSTANTS.SCRIPT.MR.PARAMS;
                            break;
                    }
                    Object.keys(PARAMS).forEach(key => {
                        scriptParams[key] = runtime.getCurrentScript().getParameter(PARAMS[key])
                    });
                    return scriptParams;
                }
                catch (e) {
                    log.error('getParams Exception', e.message);
                }
            },
            deleteScheduledAddress: (customerId, addressId) => {
                try {

                    //Load Customer Record
                    let customerRecord = record.load({
                        type: record.Type.CUSTOMER,
                        id: customerId
                    });

                    //Find Customer Address Line No from Address ID
                    let addressLineNo = customerRecord.findSublistLineWithValue({
                        sublistId: CONSTANTS.SUBLIST.SUBLIST_ID.ADRESS,
                        fieldId: CONSTANTS.SUBLIST_FIELD.ADDRESS_ID,
                        value: addressId
                    });

                    //If Found Line then Delete Address
                    if (addressLineNo > -1) {
                        customerRecord.removeSublistSubrecord({
                            sublistId: CONSTANTS.SUBLIST.SUBLIST_ID.ADRESS,
                            fieldId: CONSTANTS.SUBLIST_FIELD.ADRESS,
                            line: addressLineNo
                        });
                        customerRecord.removeLine({
                            sublistId: CONSTANTS.SUBLIST.SUBLIST_ID.ADRESS,
                            line: addressLineNo
                        });
                        let id = customerRecord.save({ ignoreMandatoryFields: true });
                        log.debug('Customer ID', customerId);
                    }
                }
                catch (e) {
                    log.error('deleteScheduledAddress Exception', e.message);
                }
            }

        }
        return { CONSTANTS, HELPERS }

    });