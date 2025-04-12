    /**
    *
    @NApiVersion 2.1
    * @NScriptType WorkflowActionScript
    * @NModuleScope public
    */
    define(['N/record', 'N/runtime', 'N/search', 'N/https'],
        function (record, runtime, search, https) {
            function onAction(context) {
                try {
                    var currentRecord = context.newRecord;
                    if (currentRecord.type == 'customrecord_info_compaign_rec_report') {
                        getOpenedDetails(currentRecord);
                    
                    }
                }
                catch (e) {
                    log.error('onAction Exception', e.message);
                }
            }

            //This Function will get Click Details for a Specific Campaigns
            function getOpenedDetails(currentRecord) {
                try {
                    var campaignId = currentRecord.getValue('custrecord_maichimp_camp_id');
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
                                log.debug('clickedURL', clickedURL);
                                setOpenedDetailsNS(currentRecord, clickedURL);
                            }
                        }
                    }
                }
                catch (e) {
                    log.error('getClickDetails Excpetion', e.message);
                }
            }
            function setOpenedDetailsNS(currentRecord, clickedURL) {
                try {
                    var currentRec = record.load({
                        type: 'customrecord_info_compaign_rec_report',
                        id: currentRecord.id
                    })
                    //Remove Lines
                    var openedCount = currentRec.getLineCount({ sublistId: 'recmachcustrecord_opened_report_link' });
                    if (openedCount > 0) removeLines(currentRec, openedCount);
                    for (var i = 0; i < clickedURL.length > 0; i++) {
                        var email = clickedURL[i].email_address || '';
                        if (email) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_email_address', value: email, line: i });
                        if(clickedURL[i].merge_fields.FNAME in clickedURL[i].merge_fields){
                        var fName = clickedURL[i].merge_fields.FNAME || '';
                        if (fName) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_first_name', value: fName, line: i });
                        }
                        if(clickedURL[i].merge_fields.LNAME in clickedURL[i].merge_fields){
                          var lName = clickedURL[i].merge_fields.LNAME || '';
                        if (lName) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_last_name', value: lName, line: i });
                        }
                        if(clickedURL[i].merge_fields.PHONE in clickedURL[i].merge_fields){
                          var phone = clickedURL[i].merge_fields.PHONE || '';
                        if (phone) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_phone', value: phone, line: i });
                        }
                          var openCount = clickedURL[i].opens_count || '';
                        if (openCount) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_open_count', value: openCount, line: i });
                        var contactStatus = clickedURL[i].contact_status || '';
                        if (contactStatus) currentRec.setSublistValue({ sublistId: 'recmachcustrecord_opened_report_link', fieldId: 'custrecord_opened_contact_status', value: contactStatus, line: i });
                    }
                    currentRec.save({ ignoreMandatoryFields: true });
                }
                catch (e) {
                    log.error('setClickDetailsNS Exception', e.message);
                }
            }
            function removeLines(currentRec, openedCount) {
                try {
                    for (var i = 0; i < openedCount; i++) {
                        currentRec.removeLine({
                            sublistId: 'recmachcustrecord_opened_report_link',
                            line: 0,
                            ignoreRecalc: true
                        })
                    }
                }
                catch (e) {
                    log.error('removeLines Excpetion', e.message);
                }
            }
            return {
                onAction: onAction
            }
        });