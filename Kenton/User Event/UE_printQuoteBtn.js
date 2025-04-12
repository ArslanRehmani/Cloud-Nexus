/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log'], function (log) {

    function beforeLoad(context) {
        var title = 'beforeLoad[::]';
        try {
            var rec = context.newRecord;
            var form = context.form;
            if (context.type == context.UserEventType.VIEW) {
                var customer = rec.getValue({fieldId: 'entity'});
                log.debug({
                    title: 'customer',
                    details: customer
                });
                if(customer == 1856){// State of Missouri
                    log.debug({
                        title: 'customer Match',
                        details: 'YES'
                    });
                    addButton(form);
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function addButton(form) {
        var title = 'addButton[::]';
        try {
            log.debug({
                title: 'form',
                details: form
            });
            form.clientScriptFileId = 1528627;
            form.addButton({id: "custpage_quoteprintbtn", label: "Print", functionName: "printQuote()"});
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    }
});
