/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/search'], function (log, record, search) {

    function beforeSubmit(context) {
        var title = 'beforeSubmit[::]';
        try {
            var rec = context.newRecord;

            var termId = rec.getValue({ fieldId: 'terms' });

            if(termId){

                var days = search.lookupFields({
                type: 'term',
                id: termId,
                columns: ['daysuntilnetdue']
            }).daysuntilnetdue;

            var dateObj = rec.getValue({ fieldId: 'trandate' });

            var setDate = termsDateFun(dateObj, days);

            log.debug({
                title: 'setDate',
                details: setDate
            });

            rec.setValue({fieldId: 'custbodysero_due_date', value: new Date(setDate)});

            }else{
                rec.setValue({fieldId: 'custbodysero_due_date', value: ''});
            }

            

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function termsDateFun(dateObj, days) {
        var title = 'termsDateFun[::]';
        try {
            var daysToAdd = parseInt(days);

            // Parse the input string into a Date object
            var date = new Date(dateObj);

            // Add days
            var newDate = new Date(date); // create a copy to avoid mutating the original
            newDate.setDate(newDate.getDate() + daysToAdd);

            // Format as MM/DD/YYYY
            var formattedDate =
                (newDate.getMonth() + 1) + '/' +
                newDate.getDate() + '/' +
                newDate.getFullYear();

        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return formattedDate;
    }

    return {
        beforeSubmit: beforeSubmit
    }
});
