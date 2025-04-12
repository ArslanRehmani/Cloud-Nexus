/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define([], function () {

    function beforeLoad(context) {
        var title = 'beforeLoad[::]';
        try {
            var currentRecord = context.newRecord;

            var formValue = currentRecord.getValue({ fieldId: 'customform' });

            // log.debug('formValue', formValue);

            if (formValue == 98 || formValue == -2) {

                var categoryField = currentRecord.getField({ fieldId: 'category' });

                if (categoryField) {

                    categoryField.isMandatory = true;

                }

            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});