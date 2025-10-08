/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/log', 'N/runtime'], (url, log, runtime) => {

    const beforeLoad = (context) => {

        const title = 'beforeLoad[::]';

        try {

            if (context.type !== context.UserEventType.VIEW) return;

            const form = context.form;

            const recId = context.newRecord.id;

            const suiteletUrl = url.resolveScript({
                scriptId: 'customscript_wst_sl_print_if',
                deploymentId: 'customdeploy_wst_sl_print_if',
                params: { fulfillmentId: recId }
            });

            form.addButton({
                id: 'custpage_generate_pdf',
                label: 'Print Invoice',
                functionName: `window.open('${suiteletUrl}', '_blank')`
            });

        } catch (e) {
            
            log.error(`${title}${e.name}`, e.message);
        }
    };
    const beforeSubmit = (context) => {

        const title = 'beforeSubmit[::]';

        try {

            var rec = context.newRecord;

            if (context.type !== context.UserEventType.CREATE) return;

            const currentUser = runtime.getCurrentUser();
            log.debug({
                title: 'currentUser',
                details: currentUser
            });

            rec.setValue({fieldId: 'custbody_wst_if_created_by', value: currentUser.name});

        } catch (e) {
            
            log.error(`${title}${e.name}`, e.message);
        }
    };

    return { beforeLoad, beforeSubmit };
});
