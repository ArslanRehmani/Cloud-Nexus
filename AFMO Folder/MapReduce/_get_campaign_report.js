/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/url', 'N/https'], function (log, record, search, url, https) {

    function getInputData() {
        var campaignReportArray = getCampaignReport();
        return campaignReportArray;
    }
    function map(context) {
        try {
            var data = JSON.parse(context.value);
            log.debug('data', data);
            var mailChimpId = data.id;
            var bounced = 0
            if (mailChimpId) {
                var campaignRecordId = getNSCampaignReport(mailChimpId);
                if (campaignRecordId) {
                    var campaignReord = record.load({ type: 'customrecord_info_compaign_rec_report', id: campaignRecordId });
                }
                else {
                    var campaignReord = record.create({ type: 'customrecord_info_compaign_rec_report' });
                }
                campaignReord.setValue('name', data.campaign_title);
                campaignReord.setValue('custrecord_info_opened', data.opens.opens_total);
                campaignReord.setValue('custrecord_campaigns_unique_opened_rep', data.opens.unique_opens);
                campaignReord.setValue('custrecord_info_clicked', data.clicks.clicks_total);
                campaignReord.setValue('custrecord_info_unsubscribed', data.unsubscribed);
                campaignReord.setValue('custrecord_mailchimp_report_del', data.delivery_status.emails_sent);
                var hardBounced = data.bounces.hard_bounces || 0;
                var softBounced = data.bounces.soft_bounces || 0;
                if (hardBounced && softBounced) {
                    bounced = (hardBounced + softBounced) || 0;
                }
                campaignReord.setValue('custrecord_info_bounced', bounced);
                campaignReord.setValue('custrecord_maichimp_camp_id', mailChimpId);
                campaignReord.save({ ignoreMandatoryFields: true });
            }
        }
        catch (e) {
            log.debug('Exception', e);
        }
    }
    function reduce(context) {
    }
    function getCampaignReport() {
        try {
            // Get today's date
            var today = new Date();

            // Calculate the date one month ago
            var oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            // Format dates as 'YYYY-MM-DDT00:00:00 00:00'
            var startDate = oneMonthAgo.toISOString().slice(0, 10) + "T00:00:00 00:00";
            //startDate is one Month Back Date
            var endDate = today.toISOString().slice(0, 10) + "T00:00:00 00:00";

            var headers = {};
            headers['Content-Type'] = 'application/json';
            headers['Accept'] = 'application/json';
            headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
            var link = `https://us4.api.mailchimp.com/3.0/reports`;
            link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=2000&since_send_time='+startDate+'';
            var response = https.get({
                url: link,
                headers: headers
            });
            var body = JSON.parse(response.body);
            return body.reports || [];
        }
        catch (e) {
            log.error('getCampaignReport Exception', e.message);
        }
    }
    function getNSCampaignReport(mailChimpId) {
        try {
            var reportSearch = search.create({
                type: "customrecord_info_compaign_rec_report",
                filters: [["custrecord_maichimp_camp_id", "is", mailChimpId]],
                columns: ["internalid"]
            });
            var searchResult = reportSearch.run().getRange({ start: 0, end: 1 });
            if (searchResult.length > 0) {
                var id = searchResult[0].getValue({ name: 'internalid' });
                return id;
            }
        }
        catch (e) {
            log.error('getNSCampaignReport Exception', e.message);
        }
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
    }
});