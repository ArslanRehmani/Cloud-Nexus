/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/https'], function (record, runtime, search, https) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var campaignReportsIDsArray = campaignReportsXSearch();
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return campaignReportsIDsArray || [];
    }

    function map(context) {
        var title = 'map(::)';
        try {
            let campaignReportsIDObj = JSON.parse(context.value);
            let campaignReportRecID = campaignReportsIDObj.campaignReportRecID;
            let campaignId = campaignReportsIDObj.mailChimpCampaignID;
            getOpenedDetails(campaignReportRecID, campaignId);
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function reduce(context) {

    }

    function summarize(summary) {

    }
    function campaignReportsXSearch() {
        var title = 'campaignReportsXSearch(::)';
        try {
            var obj;
            var internalIdarray = [];
            var customrecord_info_compaign_rec_reportSearchObj = search.create({
                type: "customrecord_info_compaign_rec_report",
                filters:
                    [
                        ["created","within","today"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "custrecord_maichimp_camp_id", label: "MailChimp Campaign ID" })
                    ]
            });
            customrecord_info_compaign_rec_reportSearchObj.run().each(function (result) {
                obj = {};
                obj.campaignReportRecID = result.id;
                obj.mailChimpCampaignID = result.getValue({ name: 'custrecord_maichimp_camp_id' });
                internalIdarray.push(obj);
                return true;
            });
            return internalIdarray || [];
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    function getOpenedDetails(campaignReportRecID, campaignId) {
        try {
            if (!!campaignId) {
                var headers = {};
                headers['Content-Type'] = 'application/json';
                headers['Accept'] = 'application/json';
                headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
                var link = `https://us4.api.mailchimp.com/3.0/reports/${campaignId}/open-details`;
                link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=2000';
                var response = https.get({
                    url: link,
                    headers: headers
                });
                var body = JSON.parse(response.body);
                // log.debug('body', body);
                if (!!body) {
                    var clickedURL = body.members || null;
                    if (clickedURL.length > 0) {
                        // log.debug('clickedURL', clickedURL);
                        setOpenedDetailsNS(campaignReportRecID, clickedURL);
                    }
                }
            }
        }
        catch (e) {
            log.error('getClickDetails Excpetion', e.message);
        }
    }
    function setOpenedDetailsNS(campaignReportRecID, clickedURL) {
        try {
            var currentRec = record.load({
                type: 'customrecord_info_compaign_rec_report',
                id: campaignReportRecID
            })
            //Remove Lines
            // var openedCount = currentRec.getLineCount({ sublistId: 'recmachcustrecord_opened_report_link' });
            // if (openedCount > 0) removeLines(currentRec, openedCount);
            for (var i = 0; i < clickedURL.length > 0; i++) {
                var email = clickedURL[i].email_address || '';
                if (email) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_email_address', value: email, line: i });
                if (clickedURL[i].merge_fields) {
                    var fName = clickedURL[i].merge_fields.FNAME || '';
                    if (fName) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_first_name', value: fName, line: i });
                }
                if (clickedURL[i].merge_fields) {
                    var lName = clickedURL[i].merge_fields.LNAME || '';
                    if (lName) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_last_name', value: lName, line: i });
                }
                if (clickedURL[i].merge_fields) {
                    var phone = clickedURL[i].merge_fields.PHONE || '';
                    if (phone) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_phone', value: phone, line: i });
                }
                var openCount = clickedURL[i].opens_count || '';
                if (openCount) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_open_count', value: openCount, line: i });
                var contactStatus = clickedURL[i].contact_status || '';
                if (contactStatus) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_contact_status', value: contactStatus, line: i });
            }
            var recID = currentRec.save({ ignoreMandatoryFields: true });
            log.debug('recID', recID);
        }
        catch (e) {
            log.error('setClickDetailsNS Exception', e.message);
        }
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    }
});
