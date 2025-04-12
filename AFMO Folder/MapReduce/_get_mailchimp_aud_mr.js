/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/url', 'N/https', 'N/runtime', 'N/ui/dialog', 'N/format', 'N/url'], function (log, record, search, url, https, runtime, dialog, format, nsUrl) {

    function getInputData() {
        var listMembersArray = getListMembers('623e74aa7a');
        if (Array.isArray(listMembersArray) && listMembersArray.length > 0) {
            var prospectRecordObj = createorUpdateProspectRecord(listMembersArray)
        }
        return prospectRecordObj;
    }
    function map(context) {
        var title = 'map(::)';
        try {
            let data = JSON.parse(context.value);
            log.debug("data", data);
            let email = data.email;
            if (email) {
                let recExitCount = searchResults(email);
                if (recExitCount) {
                    log.debug("Record Exit in NetSuite", email);
                    log.debug("Prospect ID", recExitCount);
                } else {
                    let prospectRecord = record.create({ type: 'prospect' });
                    prospectRecord.setValue({ fieldId: 'firstname', value: data.firstName });
                    prospectRecord.setValue({ fieldId: 'lastname', value: data.lastName });
                    prospectRecord.setValue({ fieldId: 'custentity_creation_date', value: new Date(data.timestampOpt) });
                    prospectRecord.setValue({ fieldId: 'custentity_mailchimp_source', value: data.source });
                    prospectRecord.setValue({ fieldId: 'email', value: data.email });
                    prospectRecord.setValue({ fieldId: 'custentity_mailchimp_rating', value: data.memberRating });
                    prospectRecord.setValue({ fieldId: 'custentity_mailchimp_status', value: data.status });
                    prospectRecord.setValue({ fieldId: 'subsidiary', value: 2 });//    The American Friends of Migdal Ohr
                    prospectRecord.setValue({ fieldId: 'entitystatus', value: 8 });//    PROSPECT-In Discussion
                    // log.debug('prospectRecord', prospectRecord);
                    // prospectRecord.setValue({ fieldId: 'custrecord_member_contact_id', value: data.contactId });
                    // if (data.memberTags.length > 0) {
                    //     setMemberTagSublist(prospectRecord, data.memberTags);
                    // }
                    var recordId = prospectRecord.save({ ignoreMandatoryFields: true });
                    log.debug('recordId', recordId);
                }
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    function reduce(context) {
    }
    function getListMembers(listId) {
        try {
            var currentDate = new Date();
            var yesterdayDate = new Date(currentDate);
            yesterdayDate.setDate(currentDate.getDate() - 1);

            var year = yesterdayDate.getFullYear();
            var month = (yesterdayDate.getMonth() + 1).toString().padStart(2, '0');
            var day = yesterdayDate.getDate().toString().padStart(2, '0');

            var yesterdayDateString = `${year}-${month}-${day}`;
            var headers = {};
            headers['Content-Type'] = 'application/json';
            headers['Accept'] = 'application/json';
            headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
            var link = `https://us4.api.mailchimp.com/3.0/lists/${listId}/members`;
            link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&count=2000' + '&since_timestamp_opt=' + yesterdayDateString + '&sort_dir=DESC';
            var response = https.get({
                url: link,
                headers: headers
            });
            var body = JSON.parse(response.body);
            log.debug('body', body.members);
            return body.members || [];
        }
        catch (e) {
            log.error('getListMembers Exception', e.message);
        }
    }
    function createorUpdateProspectRecord(listMembersArray) {
        try {
            const extractedData = listMembersArray.map(item => {
                const firstName = item.merge_fields.FNAME;
                const lastName = item.merge_fields.LNAME;
                const timestampOpt = item.timestamp_opt;
                const source = item.source;
                const email = item.email_address;
                const memberRating = item.member_rating;
                const status = item.status;
                const contactId = item.contact_id;
                const memberTags = item.tags || [];
                return { firstName, lastName, timestampOpt, source, email, memberRating, contactId, memberTags, status };
            });
            return extractedData;
        }
        catch (e) {
            log.error('createOrUpdateProspectRecord Exception', e.message);
        }

    }
    function setMemberTagSublist(prospectRecord, memberTagArray) {
        try {
            for (var i = 0; i < memberTagArray.length; i++) {
                prospectRecord.setSublistValue({
                    sublistId: 'recmachcustrecord_member_link',
                    fieldId: 'custrecord_member_tag_id',
                    value: memberTagArray[i].id,
                    line: i
                });
                prospectRecord.setSublistValue({
                    sublistId: 'recmachcustrecord_member_link',
                    fieldId: 'custrecord_member_tag_name',
                    value: memberTagArray[i].name,
                    line: i
                });

            }
        }
        catch (e) {
            log.error('setMemberTagSublist Exception', e.message);
        }
    }
    function searchResults(email) {
        var title = 'searchResults(::)';
        try {
            var prospectRecId;
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["email", "contains", email]
                    ],
                columns:
                    [
                        search.createColumn({ name: "email", label: "Email" })
                    ]
            });
            customerSearchObj.run().each(function (result) {
                prospectRecId = result.id;
                return true;
            });
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
        return prospectRecId;
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
    }
});