/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/search', 'N/record'],
/**
 * @param{search} search
 * @param{record} record
 */
function(search, record) {
    function beforeLoad(context) {
        try{
            context.form.addButton({
                 id : 'custpage_get_camp_report',
                 label : 'View Report',
                 functionName: 'getCampReport("' + context.newRecord.getValue('name') + '")'
             });
             //Get Report Data From MailChimp
           /*  context.form.addButton({
                id : 'custpage_get_camp_report_mail_chimp',
                label : 'Get Campaign Report',
                functionName: 'getCampReportMailChimp()'
            }); */
       
          context.form.clientScriptModulePath = "./_get_camp_report_cs.js";
            }
       catch (e) {
            log.debug("Exception",e);
        }
    }

    return {
        beforeLoad:beforeLoad
       }

});