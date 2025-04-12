/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
 define(['N/ui/serverWidget'], function (serverWidget) {

    function beforeLoad(context) {
        var title = 'beforeLoad[::]';
        try {

            var type = context.type;

            var form = context.form
            // Fields that will be hidden in Create, Edit mode

            if (type == context.UserEventType.CREATE || type == context.UserEventType.EDIT || type == context.UserEventType.VIEW) {

                hideColumnField(form, 'assignee', 'units');

                hideColumnField(form, 'assignee', 'unitcost');

                hideColumnField(form, 'assignee', 'estimatedwork');


            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function hideColumnField(formObj, sublistId, fieldId) {
        try {

            const formSublist = formObj.getSublist({ id: sublistId });

            if (formSublist) {

                const formField = formSublist.getField({ id: fieldId });

                if (formField && typeof formField !== 'undefined' && formField !== null) {

                    formField.isMandatory = false;

                    formField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                }
            }
        } catch (e) {
            log.error('hideColumnField Exception', e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    }
});
