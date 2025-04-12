/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/record', 'N/runtime', 'N/search', 'N/https'],
    function (record, runtime, search, https) {

        function getInputData() {
            var title = 'getInputData(::)';
            try {
                var campaignReportsIDsArray = campaignReportsXSearch();
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return campaignReportsIDsArray;
        }

        function map(context) {
            var title = 'map(::)';
            try {
                let campaignReportsIDObj = JSON.parse(context.value);
                let campaignReportRecID = campaignReportsIDObj.campaignReportRecID;
                let campaignId = campaignReportsIDObj.mailChimpCampaignID;
                getClickDetails(campaignReportRecID, campaignId);
                getLinksClicked(campaignReportRecID, campaignId)
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
        function getClickDetails(campaignReportRecID, campaignId) {
            try {
                if (!!campaignId) {
                    var headers = {};
                    headers['Content-Type'] = 'application/json';
                    headers['Accept'] = 'application/json';
                    headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
                    var link = `https://us4.api.mailchimp.com/3.0/reports/${campaignId}/click-details`;
                    link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=20';
                    var response = https.get({
                        url: link,
                        headers: headers
                    });
                    var body = JSON.parse(response.body);
                    // log.debug('body', body);
                    if (!!body) {
                        var clickedURL = body.urls_clicked || null;
                        if (clickedURL.length > 0) {
                            const modifiedClickData = mergeAndSumClicks(clickedURL);
                            // log.debug('modifiedClickData', modifiedClickData);
                            setClickDetailsNS(campaignReportRecID, modifiedClickData);
                        }
                    }
                }
            }
            catch (e) {
                log.error('getClickDetails Excpetion', e.message);
            }
        }
        function mergeAndSumClicks(data) {
            try {
                const mergedData = {};
                data.forEach((item) => {
                    const url = item.url;
                    if (!mergedData[url]) {
                        // If the URL is encountered for the first time, initialize the object
                        mergedData[url] = { ...item };
                    } else {
                        // If the URL is already encountered, concatenate the ids and sum the click values
                        mergedData[url].id += ',' + item.id;
                        mergedData[url].total_clicks += item.total_clicks;
                        mergedData[url].click_percentage += item.click_percentage;
                    }
                });
                Object.values(mergedData).forEach((item) => {
                    item.click_percentage = Math.round(item.click_percentage * 10000) / 100;
                });
                // Convert the mergedData object back to an array of objects
                const resultArray = Object.values(mergedData);
                return resultArray;
            }
            catch (e) {
                log.error('mergeAndSumClicks Exception', e.message);
            }
        }
        function setClickDetailsNS(campaignReportRecID, clickedURL) {
            try {
                var currentRec = record.load({
                    type: 'customrecord_info_compaign_rec_report',
                    id: campaignReportRecID
                })
                for (var i = 0; i < clickedURL.length > 0; i++) {
                    var clickId = clickedURL[i].id || '';
                    if (clickId) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_report_link', fieldId: 'custrecord_click_mailchimp_id', value: clickId, line: i });
                    var url = clickedURL[i].url || '';
                    if (url) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_report_link', fieldId: 'custrecord_click_link', value: url, line: i });
                    var totalClicks = clickedURL[i].total_clicks || '';
                    if (totalClicks) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_report_link', fieldId: 'custrecord_total_clicks', value: totalClicks, line: i });
                    var clickPercentage = clickedURL[i].click_percentage || '';
                    if (clickPercentage) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_report_link', fieldId: 'custrecord_click_percentage', value: clickPercentage.toFixed(1), line: i });
                }
                var recID = currentRec.save({ ignoreMandatoryFields: true });
                log.debug({
                    title: 'recID',
                    details: recID
                });
            }
            catch (e) {
                log.error('setClickDetailsNS Exception', e.message);
            }
        }
        function getLinksClicked(campaignReportRecID, campaignId) {
            try {
                var clickDetailsRecId;
                var currentRecord = record.load({
                    type: 'customrecord_info_compaign_rec_report',
                    id: campaignReportRecID
                });
                if (!!campaignId) {
                    var lineCount = currentRecord.getLineCount({
                        sublistId: 'recmachcustrecord_report_link'
                    });
                    for (var i = 0; i < lineCount; i++) {
                        var clickMailchimpId = currentRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_report_link',
                            fieldId: 'custrecord_click_mailchimp_id',
                            line: i
                        });
                        var clickDetailsRecId = currentRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_report_link',
                            fieldId: 'id',
                            line: i
                        });
                        if (!!clickMailchimpId) {
                            var resultArray = clickMailchimpId.split(',');
                            if (!!resultArray && resultArray.length > 1) {
                                var concatedIdArray = [];
                                for (var j = 0; j < resultArray.length; j++) {
                                    var id = resultArray[j];
                                    var headers = {};
                                    headers['Content-Type'] = 'application/json';
                                    headers['Accept'] = 'application/json';
                                    headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
                                    var link = `https://us4.api.mailchimp.com/3.0/reports/${campaignId}/click-details/${id}/members`;
                                    link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=20';
                                    var response = https.get({
                                        url: link,
                                        headers: headers
                                    });
                                    var body = JSON.parse(response.body);
                                    concatedIdArray.push(body.members);
                                }
                                // log.debug('concatedIdArray', concatedIdArray);
                                const result = concatedIdArray.reduce((acc, arr) => {
                                    arr.forEach((item) => {
                                        const existingItem = acc.find((el) => el.email_address === item.email_address);
                                        if (existingItem) {
                                            existingItem.clicks += item.clicks;
                                        } else {
                                            acc.push(item);
                                        }
                                    });
                                    return acc;
                                }, []);
                                setLinksClicksDetailsNS(clickDetailsRecId, result);
                            } else {
                                var mailchimplinkClickId = resultArray[0];
                                var headers = {};
                                headers['Content-Type'] = 'application/json';
                                headers['Accept'] = 'application/json';
                                headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
                                var link = `https://us4.api.mailchimp.com/3.0/reports/${campaignId}/click-details/${mailchimplinkClickId}/members`;
                                link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=20';
                                var response = https.get({
                                    url: link,
                                    headers: headers
                                });
                                var body = JSON.parse(response.body);
                                var member = body.members;
                                setLinksClicksDetailsNS(clickDetailsRecId, member);
                            }
                        }
                    }
                }
            }
            catch (e) {
                log.error('getClickDetails Excpetion', e.message);
            }
        }
        function setLinksClicksDetailsNS(clickDetailsRecId, result) {
            try {
                log.debug('result', result);
                var clickDetailsRecOBJ = record.load({
                    type: 'customrecord_mailchimp_click_details',
                    id: clickDetailsRecId
                });
                if (result.length > 0) {
                    // log.debug('WORKING', "YES");
                    for (var i = 0; i < result.length > 0; i++) {
                        var email_address = result[i].email_address || '';
                        if (email_address) {
                            clickDetailsRecOBJ.setSublistValue({ sublistId: 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_email_address', value: email_address, line: i });
                        }
                        if (result[i].merge_fields) {
                            var Fname = result[i].merge_fields.FNAME || '';
                            if (Fname) {
                                clickDetailsRecOBJ.setSublistValue({ sublistId: 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_links_rec_first_name', value: Fname, line: i });
                            }
                            var Lname = result[i].merge_fields.LNAME || '';
                            if (Lname) {
                                clickDetailsRecOBJ.setSublistValue({ sublistId: 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_links_rec_last_name', value: Lname, line: i });
                            }
                        }
                        var clicks = result[i].clicks || '';
                        if (clicks) {
                            clickDetailsRecOBJ.setSublistValue({ sublistId: 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_links_rec_total_clicks', value: clicks, line: i });
                        }
                    }
                    var clickDetailId = clickDetailsRecOBJ.save({ ignoreMandatoryFields: true });
                    log.debug('clickDetailId', clickDetailId);
                }
            }
            catch (e) {
                log.error('setLinksClicksDetailsNS Exception', e.message);
            }
        }
        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        }
    });
