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
    function afterSubmit(context) {
        try{
            var currentRecord = context.newRecord;
            var mailChimpId = currentRecord.getValue('custrecord_maichimp_camp_id');
            if(mailChimpId){
            var campReportSearch = search.create({
                type: "customrecord_campaings",
                filters:[["custrecord_mailchimp_id","is",mailChimpId]],
                columns:["internalid", "custrecord5"]
             });
             var searchResult = campReportSearch.run().getRange({start: 0,   end: 1});
             if(searchResult.length > 0){
             var campRecordId = searchResult[0].getValue({name: 'internalid'}) || '';
             var campRecordDate = searchResult[0].getValue({name: 'custrecord5'}) || '';
             var campaignReportRecord = record.load({type:currentRecord.type, id : currentRecord.id });
             campaignReportRecord.setValue('custrecord_campaign_link', campRecordId);
             campaignReportRecord.setValue('custrecord_campaign_report_date', new Date(campRecordDate));
             campaignReportRecord.save({ignoreMandatoryFields:true});
             }
             }
            }
       catch (e) {
            log.debug("Exception",e);
        }
    }

    return {
       afterSubmit:afterSubmit
       }

});