/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/https', 'N/record', 'N/search'], function (log, https, record, search) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var listMembersArrayActivity = getListMembers('623e74aa7a');
            if (Array.isArray(listMembersArrayActivity) && listMembersArrayActivity.length > 0) {
                var activityRecordObj = createorUpdateProspectRecord(listMembersArrayActivity);
                // log.debug('activityRecordObj', activityRecordObj);
            }
            return activityRecordObj ;
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function map(context) {
        var title = 'map(::)';
        try {
            let data = JSON.parse(context.value);
            var activityCreate = record.create({
                type: 'customrecord_activity'
            });
            activityCreate.setValue({ fieldId: 'custrecord_activity_title', value: data.title });
            activityCreate.setValue({ fieldId: 'custrecord_activity_campaign_id', value: data.campaign_id });
            activityCreate.setValue({ fieldId: 'custrecord_activity_open_campaign', value: data.open });
            activityCreate.setValue({ fieldId: 'custrecord_activity_sent_campaign', value: data.sent });
            activityCreate.setValue({ fieldId: 'custrecord_activity_customer', value: data.custId });
            var recordId = activityCreate.save({ ignoreMandatoryFields: true });
            log.debug('recordId', recordId);
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function reduce(context) {

    }
    function getListMembers(listId) {
        try {
            var donorArray = getDonorsEmailfromNS();
            var activityArray = [];
            if (donorArray.length > 0) {
                for (var i = 0; i < donorArray.length; i++) {
                    var headers = {};
                    headers['Content-Type'] = 'application/json';
                    headers['Accept'] = 'application/json';
                    headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
                    var link = `https://us4.api.mailchimp.com/3.0/lists/${listId}/members/${donorArray[i].donorEmail}/activity`;
                    link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=2000';
                    var response = https.get({
                        url: link,
                        headers: headers
                    });
                    var body = JSON.parse(response.body);
                    // log.debug('body', body.activity);
                    if(body.activity.length > 0){
                        const mergedArray = body.activity.map((obj, index) => ({
                            ...obj,
                            custId: donorArray[i].donorId
                          }));
                          
                        const grouopArray = GroupByCampaignTitle(mergedArray);
                        activityArray.push(grouopArray);
                        
                    }
                }
                const flatArray = activityArray.flatMap(item => item);
                return flatArray || [];
            }
        }
        catch (e) {
            log.error('getListMembers Exception', e.message);
        }
    }
    function createorUpdateProspectRecord(listMembersActivityArray) {
        try {
            const extractedData = listMembersActivityArray.map(item => {
                const open = item.open;
                const sent = item.sent;
                const campaign_id = item.campaign_id;
                const title = item.title;
                const custId = item.custId;
                return { open, sent, campaign_id, title,custId};
            });
            return extractedData;
        }
        catch (e) {
            log.error('createOrUpdateProspectRecord Exception', e.message);
        }

    }
    function getDonorsEmailfromNS() {
        try {
            var donorArray = [];
            var donorSearch = search.create({
                type: "customer",
                filters: [["email", "isnotempty", ""]],
                columns:
                    [search.createColumn({ name: "internalid", sort: search.Sort.DESC }), "entityid", "email"]
            });
            var searchResult = donorSearch.run().getRange({ start: 0, end: 3 })
            var linecount = searchResult.length;
            // log.debug('Line Count', linecount);
            for (var i = 0; i < linecount; i++) {
                var donorId = searchResult[i].getValue({
                    name: "internalid",
                    sort: search.Sort.DESC
                });
                var donorEmail = searchResult[i].getValue({
                    name: "email",
                });
                if (donorId && donorEmail) {
                    var donorObj = { donorId, donorEmail };
                    donorArray.push(donorObj);
                }
            }
        }
        catch (e) {
            log.error('getDonorsEmailfromNS Exception', e.message);
        }
        return donorArray;
    }
    function GroupByCampaignTitle(array){
        try {
            const grouped = array.reduce((result, item) => {
                const key = `${item.campaign_id}-${item.title}`;
                if (!result[key]) {
                  result[key] = { open: 0, sent: 0, campaign_id: item.campaign_id, title: item.title ,custId: item.custId};
                }
                if (item.action === "open") {
                  result[key].open++;
                } else if (item.action === "sent") {
                  result[key].sent++;
                }
                return result;
              }, {});
              
              const groupedArray = Object.values(grouped);
            //   log.debug('groupedArray', groupedArray);
              return groupedArray;
        } catch (error) {
            
        }
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    }
});
