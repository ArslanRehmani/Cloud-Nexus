/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/https', 'N/record', 'N/search'], function (log, https, record, search) {

    function getInputData() {
        var title = 'getInputData(::)';
        try {
            var donorSearch = search.create({
                type: "customer",
                filters: [
                    ["email", "isnotempty", ""],
                    "OR",
                    ["custentity_afmo_cust_businessemail", "isnotempty", ""],
                    "OR",
                    ["custentity6", "isnotempty", ""]
                ],
                // filters: [["email", "contains", "wlandesman@dlpartners.com"]],
                columns:
                    [search.createColumn({ name: "internalid", sort: search.Sort.DESC }), "entityid", "email"]
            });

            return donorSearch;
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }

    function map(context) {
        var title = 'map(::)';
        try {
            let data = JSON.parse(context.value);
            var email = data.values.email;
            var donorId = data.values.internalid.value;
            if (email) {
                var headers = {};
                headers['Content-Type'] = 'application/json';
                headers['Accept'] = 'application/json';
                headers['x-api-key'] = '5d28fd31-ccb7-71f1-8e75-9b7229faf6a2';
                var link = `https://us4.api.mailchimp.com/3.0/search-members`;
                link += '?apikey=' + encodeURIComponent('505b42b3afd460654e9d8eeaca029af8-us4') + '&query=' + email;
                var response = https.get({
                    url: link,
                    headers: headers
                });
                var body = JSON.parse(response.body);
                if (body.exact_matches.members.length > 0) {
                    // log.debug('body.exact_matches.members',body.exact_matches.members);
                    var mergedArray = body.exact_matches.members.map((obj, index) => ({
                        ...obj,
                        custId: donorId
                    }));
                    const newArray = mergeNestedObjects(mergedArray);
                    // log.debug('newArray', newArray);
                    var name = newArray[0].tags[0].name;
                    var custID = newArray[0].custId
                    var tagExits = searchResults(name);
                    log.debug('tagExits', tagExits);
                    if (tagExits.id) {
                        var tagREcOBJ = record.load({
                            type: 'customrecord_member_tags',
                            id: parseInt(tagExits.id)
                        });
                        var memberlink = tagREcOBJ.getValue({ fieldId: 'custrecord_member_link' });
                        log.debug('memberlink', memberlink);
                        if (memberlink.length > 0) {
                            memberlink.push(custID);
                            tagREcOBJ.setValue({ fieldId: 'custrecord_member_link', value: memberlink });
                            tagREcOBJ.save({ ignoreMandatoryFields: true });
                            record.submitFields({
                                type: 'customer',
                                id: parseInt(custID),
                                values: {
                                    custentity_mailchimp_rating: newArray[0].member_rating,
                                    custentity_mailchimp_status: newArray[0].status
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        } else {
                            var array = [];
                            array.push(newArray[0].custId);
                            tagREcOBJ.setValue({ fieldId: 'custrecord_member_link', value: array });
                            tagREcOBJ.save({ ignoreMandatoryFields: true });
                            record.submitFields({
                                type: 'customer',
                                id: parseInt(custID),
                                values: {
                                    custentity_mailchimp_rating: newArray[0].member_rating,
                                    custentity_mailchimp_status: newArray[0].status
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    } else {
                        var tagRecord = record.create({
                            type: 'customrecord_member_tags'
                        });
                        var memberLinkArray = [];
                        memberLinkArray.push(newArray[0].custId);
                        tagRecord.setValue('name', newArray[0].tags[0].name);
                        tagRecord.setValue('custrecord_member_tag_id', newArray[0].tags[0].id);
                        tagRecord.setValue('custrecord_member_link', memberLinkArray);
                        var tagId = tagRecord.save();
                        log.debug('TagId', tagId);
                        record.submitFields({
                            type: 'customer',
                            id: parseInt(custID),
                            values: {
                                custentity_mailchimp_rating: newArray[0].member_rating,
                                custentity_mailchimp_status: newArray[0].status
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }
                }
            }

        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    function mergeNestedObjects(nestedArray) {
        try {
            const transformedArray = nestedArray.map(item => ({
                status: item.status || "",
                member_rating: item.member_rating || "",
                tags: item.tags || [{}],
                custId: item.custId || "",
            }));

            return transformedArray;
        }
        catch (e) {
            log.error('mergeNestedObjects', e.message);
        }
    }
    function searchResults(name) {
        var title = 'searchResults(::)';
        try {
            var obj;
            var customrecord_member_tagsSearchObj = search.create({
                type: "customrecord_member_tags",
                filters:
                    [
                        ["name", "contains", name]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
            });
            customrecord_member_tagsSearchObj.run().each(function (result) {
                obj = {};
                obj.id = result.id;
                return true;
            });
            return obj || {};
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    return {
        getInputData: getInputData,
        map: map
    }
});
