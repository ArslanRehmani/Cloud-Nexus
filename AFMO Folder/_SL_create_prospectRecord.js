/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/log', 'N/record'], function(log,record) {

    function onRequest(context) {
        var title = 'onRequest(::)';
        try {
            let params = context.request.parameters;
            let name = params.name;
            let date = params.date;
            let source = params.source;
            let email = params.email;
            let memberRating = params.memberRating;
            let status = params.status;
            let contactId = params.contactId;
            let memberTags = params.memberTags;
            let prospectRecord = record.create({type : 'customrecord_mailchimp_prospect'});
                    prospectRecord.setValue({fieldId : 'custrecord_member_name', value: name})
                    prospectRecord.setValue({fieldId : 'custrecord_member_creation_date', value: date});
                    prospectRecord.setValue({fieldId : 'custrecord_member_source', value:  source});
                    prospectRecord.setValue({fieldId : 'custrecord_member_email', value:  email});
                    prospectRecord.setValue({fieldId : 'custrecord_member_rating', value:  memberRating});
                    prospectRecord.setValue({fieldId : 'custrecord_member_status', value:  status});
                    prospectRecord.setValue({fieldId : 'custrecord_member_contact_id', value:  contactId});
                    if(memberTags.length > 0){
                        setMemberTagSublist(prospectRecord, memberTags);
                    }
                    var recordId = prospectRecord.save({ignoreMandatoryFields : true});
                    log.debug('recordId',recordId);
        } catch (e) {
         log.debug('Exception ' + title, e.message);
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
    return {
        onRequest: onRequest
    }
});
