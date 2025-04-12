/**
 * @NApiVersion 2.1
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/file'],
/**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{file} file
 */
(log, record, runtime, search, file,) => {

    let scriptParams = {};
    const CONSTANTS = {
        SCRIPT: {
            UE: {
                SCRIPT_ID: 'customscript_key_ue_generate_file',
                DEPLOYMENT_ID: 'customdeploy_key_ue_generate_file',
                PARAMS: {
                    ROLES: 'custscript_ue_roles'
                }
            },
            SUITELET: {
                SCRIPT_ID: 'customscript_sl_generate_pdf_excel_file',
                DEPLOYMENT_ID: 'customdeploy_sl_generate_pdf_excel_file',
                PARAMS: {
                    SAVEDSEARCHID: 'custscript_po_saved_search'
                }
            }   
        },
        DROPSHIP_CONFIGURATION: {
            USERNAME: 'custrecord_dropship_user_name',
            PASSWORD: 'custrecord_dropship_password'
        },
        DROPSHIPAPI:{
            
        }
    }

    const HELPERS = {

        getParams: () => {
            if (!!scriptParams && Object.keys(scriptParams).length > 0) return scriptParams;
            let scriptId = runtime.getCurrentScript().id;
            let PARAMS = {};
            switch (scriptId) {
                case CONSTANTS.SCRIPT.UE.SCRIPT_ID:
                    PARAMS = CONSTANTS.SCRIPT.UE.PARAMS;
                    break;
                case CONSTANTS.SCRIPT.SUITELET.SCRIPT_ID:
                    PARAMS = CONSTANTS.SCRIPT.SUITELET.PARAMS;
                    break;
                
            }

            Object.keys(PARAMS).forEach(key => {
                scriptParams[key] = runtime.getCurrentScript().getParameter(PARAMS[key])
            });
            return scriptParams;
        }
    }

    return { CONSTANTS, HELPERS }

});