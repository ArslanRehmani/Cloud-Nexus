/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['./_set_aed_price_helper'],

    (HELPER) => {
        const beforeLoad = (scriptContext) => {
            try {
                if (scriptContext.type === scriptContext.UserEventType.VIEW || scriptContext.type === scriptContext.UserEventType.EDIT) {

                    HELPER.HELPERS.getAEDBasePrice(scriptContext);
                }
            }
            catch (e) {
                log.error('beforeLoad Exception', e.message);
            }
        }

        return { beforeLoad }

    });
