/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search', 'N/currentRecord', 'N/https'],
/**
 * @param{record} record
 * @param{search} search
 */
function(record, search, currentRecord, https) {
    function pageInit(context) {

    }

    function getCampReport(campaignName) {
        try{
            var campReportId = getCampaignReportId(campaignName);
            if(!!campReportId) window.open('https://5288825-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=926&id='+campReportId+'');
            else alert('No Report found against this campaign');
        }

        catch (e) {
            log.debug('getCampReport Exception', e.message);

        }
    }
    function getCampaignReportId(campaignName){
        try{
            var campReportSearch = search.create({
                type: "customrecord_info_compaign_rec_report",
                filters:[["name","is",campaignName]],
                columns:["internalid"]
             });
             var searchResult = campReportSearch.run().getRange({start: 0,   end: 1});
             if(searchResult.length > 0){
             var campRecordId = searchResult[0].getValue({name: 'internalid'}) || '';
             return campRecordId;
            }
        }
        catch(e){
            log.error('getCampaignReportId Exception', e.message);
        }
    }
    function getCampReportMailChimp(){
        try{
            var headers = {};
            headers['Content-Type'] = 'application/json';
            headers['Accept'] = 'application/json';
            headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
            var link = 'https://us4.api.mailchimp.com/3.0/reports';
            link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4');
            link += '&campaignid=' + encodeURIComponent('b2f507a135');
            var response = https.get({
                url: link,
                headers: headers
            });
            var body = JSON.parse(response.body);
            log.debug('body', body);
        }
        catch(e){
            log.error('getCampReportMailChimp',e.error);
        }
    }
    return {
        pageInit: pageInit,
        getCampReport: getCampReport,
        getCampReportMailChimp: getCampReportMailChimp
    };
    
});
