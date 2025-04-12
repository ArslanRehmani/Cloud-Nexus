    /**
    *
    @NApiVersion 2.1
    * @NScriptType WorkflowActionScript
    * @NModuleScope public
    */
    define(['N/record', 'N/runtime', 'N/search', 'N/https','N/task'],
        function (record, runtime, search, https,task) {
            function onAction(context) {
                try {
                    var currentRecord = context.newRecord;
                    if (currentRecord.type == 'customrecord_info_compaign_rec_report') {
                        getClickDetails(currentRecord);
                        // getLinksClicked(currentRecord.id);
                    }
                }
                catch (e) {
                    log.error('onAction Exception', e.message);
                }
            }

            //This Function will get Click Details for a Specific Campaigns
            function getClickDetails(currentRecord) {
                try {
                    var campaignId = currentRecord.getValue('custrecord_maichimp_camp_id');
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
                                setClickDetailsNS(currentRecord, modifiedClickData);
                            }
                        }
                    }
                }
                catch (e) {
                    log.error('getClickDetails Excpetion', e.message);
                }
            }
            function setClickDetailsNS(currentRecord, clickedURL) {
                try {
                    var clicksDetailsIDArray = [];
                    var currentRec = record.load({
                        type: 'customrecord_info_compaign_rec_report',
                        id: currentRecord.id
                    })
                    //Remove Lines
                    var clickDetailsCount = currentRec.getLineCount({ sublistId: 'recmachcustrecord_report_link' });
                    for (var i = 0; i < clickDetailsCount; i++) {
                        var clickMailchimpId = currentRecord.getSublistValue({
                            sublistId: 'recmachcustrecord_report_link',
                            fieldId: 'id',
                            line: i
                        });
                        clicksDetailsIDArray.push(clickMailchimpId);
                    }
                    log.debug({
                        title: 'clicksDetailsIDArray',
                        details: clicksDetailsIDArray
                    });
                    if (clickDetailsCount > 0) removeLines(currentRec, clickDetailsCount,clicksDetailsIDArray);
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
                    currentRec.save({ ignoreMandatoryFields: true });
                }
                catch (e) {
                    log.error('setClickDetailsNS Exception', e.message);
                }
            }
            function removeLines(currentRec, clickDetailsCount,clicksDetailsIDArray) {
                try {
                    if(!!clicksDetailsIDArray && clicksDetailsIDArray.length>0){
                        for(var j=0; j<clicksDetailsIDArray.length; j++){
                            var clickDetailRecId = clicksDetailsIDArray[j];
                            var customrecord_links_clickedSearchObj = search.create({
                                type: "customrecord_links_clicked",
                                filters:
                                [
                                ["custrecord_click_detail_parent","anyof",clickDetailRecId]
                                ],
                                columns:
                                [
                                search.createColumn({
                                    name: "scriptid",
                                    sort: search.Sort.ASC,
                                    label: "Script ID"
                                })
                                ]
                            });
                            customrecord_links_clickedSearchObj.run().each(function(result){
                                var id = result.id;
                                var salesOrderRecord = record.delete({
                                    type: 'customrecord_links_clicked',
                                    id: parseInt(id),
                                });
                                return true;
                            });
                        }
                    }
                    for (var i = 0; i < clickDetailsCount; i++) {
                        currentRec.removeLine({
                            sublistId: 'recmachcustrecord_report_link',
                            line: 0,
                            ignoreRecalc: true
                        })
                    }
                }
                catch (e) {
                    log.error('removeLines Excpetion', e.message);
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
            //this function will get Links Clicked from Mail Chimp
            function getLinksClicked(id) {
                try {
                    var clickDetailsRecId;
                    var currentRecord = record.load({
                        type: 'customrecord_info_compaign_rec_report',
                        id: parseInt(id)
                    });
                    var campaignId = currentRecord.getValue('custrecord_maichimp_camp_id');
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
                                    //   log.debug('result',result);
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
                                    // log.debug('member', member);
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
                log.debug('result',result);
                    var clickDetailsRecOBJ = record.load({
                        type: 'customrecord_mailchimp_click_details',
                        id: clickDetailsRecId
                    });
                    for (var i = 0; i < result.length > 0; i++) {
                        var email_address = result[i].email_address || '';
                        log.debug('email_address',email_address);
                        if (email_address) {
                        clickDetailsRecOBJ.setSublistValue({sublistId : 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_email_address', value: email_address, line:i });
                        var Fname = result[i].merge_fields.FNAME|| '';
                        log.debug('Fname',Fname);
                        clickDetailsRecOBJ.setSublistValue({sublistId : 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_links_rec_first_name', value: Fname, line: i });
                        var Lname = result[i].merge_fields.LNAME || '';
                        log.debug('Lname',Lname);
                        clickDetailsRecOBJ.setSublistValue({sublistId : 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_links_rec_last_name', value: Lname, line:i });
                        var clicks = result[i].clicks || '';
                        log.debug('clicks',clicks);
                        clickDetailsRecOBJ.setSublistValue({sublistId : 'recmachcustrecord_click_detail_parent', fieldId: 'custrecord_links_rec_total_clicks', value: clicks, line:i });
                        }
                    }
                    clickDetailsRecOBJ.save({ ignoreMandatoryFields: true });
                }
                catch (e) {
                    log.error('setLinksClicksDetailsNS Exception', e.message);
                }
            }
            return {
                onAction: onAction
            }
        });