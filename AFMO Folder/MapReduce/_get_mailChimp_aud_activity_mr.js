/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log','N/https','N/record'], function(log,https,record) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var listMembersArrayActivity = getListMembers('623e74aa7a');
            if (Array.isArray(listMembersArrayActivity) && listMembersArrayActivity.length > 0) {
                var activityRecordObj = createorUpdateProspectRecord(listMembersArrayActivity)
            }
            return activityRecordObj;
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
            activityCreate.setValue({fieldId: 'custrecord_activity_title', value: data.title});
            activityCreate.setValue({fieldId: 'custrecord_activity_campaign_id', value: data.campaign_id});
            if(data.type){
                activityCreate.setValue({fieldId: 'custrecord_activity_type', value: data.type});
            }
            activityCreate.setValue({fieldId: 'custrecord_activity_action', value: data.custrecord_activity_action});
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
            var email = 'mkron1950@gmail.com';
            var headers = {};
            headers['Content-Type'] = 'application/json';
            headers['Accept'] = 'application/json';
            headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
            var link = `https://us4.api.mailchimp.com/3.0/lists/${listId}/members/${email}/activity`;
            link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=2000';
            var response = https.get({
                url: link,
                headers: headers
            });
            var body = JSON.parse(response.body);
            log.debug('body', body.activity);
            return body.activity || [];
        }
        catch (e) {
            log.error('getListMembers Exception', e.message);
        }
    }
    function createorUpdateProspectRecord(listMembersActivityArray) {
        try {
            const extractedData = listMembersActivityArray.map(item => {
                const action = item.action;
                const type = item.type;
                const campaign_id = item.campaign_id;
                const title = item.title;
                return { action, type, campaign_id, title};
            });
            return extractedData;
        }
        catch (e) {
            log.error('createOrUpdateProspectRecord Exception', e.message);
        }

    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    }
});
