/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/log', 'N/https', 'N/record'], function (ui, search, log, https, record) {

    function onRequest(context) {
        try {
            var request = context.request;
            var response = context.response;

            var form = ui.createForm({
                title: 'Netsuite Customers'
            });
            form.addSubmitButton('Submit');
            var resultCountField = form.addField({
                id: 'custpage_result_count',
                type: ui.FieldType.INLINEHTML,
                label: 'Result Count'
            });

            var sublist = form.addSublist({
                id: 'custpage_customer',
                type: ui.SublistType.LIST,
                label: 'Customers'
            });
            sublist.addField({
                id: 'custpage_checkbox',
                label: 'Select',
                type: ui.FieldType.CHECKBOX
            });
            sublist.addField({
                id: 'custpage_internalid',
                label: 'Internal ID',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_id',
                label: 'ID',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_smonkeyid',
                label: 'Survey Monkey Id',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_name',
                label: 'Name',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_first_name',
                label: 'First Name',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_last_name',
                label: 'Last Name',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_email',
                label: 'Email',
                type: ui.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_phone',
                label: 'Phone Number',
                type: ui.FieldType.TEXT
            });


            var mySearch = search.load({
                id: 'customsearch_customer_data'
            });

            var resultSet = mySearch.run();
            var results = resultSet.getRange({
                start: 0,
                end: 1000
            });

            resultCountField.defaultValue = '<div style="text-align: right; font-size: 16px;">Total Results: ' + results.length + '</div>';
            for (var i = 0; i < results.length; i++) {
                var result = results[i];

                sublist.setSublistValue({
                    id: 'custpage_internalid',
                    line: i,
                    value: result.getValue({ name: 'internalid' }) || ' '
                });

                sublist.setSublistValue({
                    id: 'custpage_id',
                    line: i,
                    value: result.getValue({ name: 'entityid' }) || ' '
                });

                sublist.setSublistValue({
                    id: 'custpage_smonkeyid',
                    line: i,
                    value: result.getValue({ name: 'custentity_s_monkey_internal_id' }) || ' '
                });

                sublist.setSublistValue({
                    id: 'custpage_name',
                    line: i,
                    value: result.getValue({ name: 'altname' }) || ' '
                });
                sublist.setSublistValue({
                    id: 'custpage_first_name',
                    line: i,
                    value: result.getValue({ name: 'firstname' }) || ' '
                });
                sublist.setSublistValue({
                    id: 'custpage_last_name',
                    line: i,
                    value: result.getValue({ name: 'lastname' }) || ' '
                });
                sublist.setSublistValue({
                    id: 'custpage_email',
                    line: i,
                    value: result.getValue({ name: 'email' }) || ' '
                });
                sublist.setSublistValue({
                    id: 'custpage_phone',
                    line: i,
                    value: result.getValue({ name: 'phone' }) || ' '
                });
            }

            // Post Request
            if (request.method === 'POST') {
                var selectedCustomers = [];

                for (var i = 0; i < results.length; i++) {
                    if (request.getSublistValue({
                        group: 'custpage_customer',
                        name: 'custpage_checkbox', line: i
                    }) === 'T') {
                        var customerId = results[i].getValue({ name: 'internalid' });
                        selectedCustomers.push(customerId);
                    }
                }

                selectedCustomers.forEach(function (customerId) {
                    try {
                        var customerRecord = record.load({
                            type: record.Type.CUSTOMER,
                            id: customerId
                        });
                        // var customerName = customerRecord.getValue({ fieldId: 'altname' });
                        var customerEmail = customerRecord.getValue({ fieldId: 'email' });
                        var customerFirstName = customerRecord.getValue({ fieldId: 'altname' });
                        var customerLastName = customerRecord.getValue({ fieldId: 'lastname' });
                        var customerPhone = customerRecord.getValue({ fieldId: 'phone' });

                        //  var fullName = customerName || (customerFirstName + " " + customerLastName);

                        var contact = {
                            //  name: fullName,
                            first_name: customerFirstName || '',
                            last_name: customerLastName || '',
                            email: customerEmail || '',
                            phone_number: customerPhone || ''
                        };

                        log.debug('contact', contact);

                        var surveyMonkeyToken = 'cOmUpOXfevWx560egh1njnpiSJc4aZ0V3SH.dvkYpytj.opn4GI0dSx5KVqGNtf-Qkurxqx9Ecdqx6abZegalckd8M-qTYSz5vW-WeqpazHcmK8UHEJeLWn6NU4QPGBF';
                        var apiUrl = 'https://api.surveymonkey.com/v3/contacts';
                        var headers = {
                            'Authorization': 'Bearer ' + surveyMonkeyToken,
                            'Content-Type': 'application/json'
                        };

                        // Check if the contact exists by email (common way to search for a contact)
                        var getUrl = 'https://api.surveymonkey.com/v3/contacts?email=' + encodeURIComponent(customerEmail);
                        var getResponse = https.get({
                            url: getUrl,
                            headers: headers
                        });
                        // log.debug({
                        //     title: 'getResponse+++',
                        //     details: getResponse
                        // });

                        if (getResponse.code === 200) {
                            var existingContacts = JSON.parse(getResponse.body).data;

                            if (existingContacts.length > 0) {
                                // Use the first contact (in case there are multiple) to update it
                                var contactId = existingContacts[0].id;

                                var updateUrl = 'https://api.surveymonkey.com/v3/contacts/' + contactId;

                                var updateResponse = https.put({
                                    url: updateUrl,
                                    headers: headers,
                                    body: JSON.stringify(contact)
                                });
                                // log.debug({
                                //     title: 'updateResponse==',
                                //     details: updateResponse
                                // });

                                if (updateResponse.code === 200) {
                                    log.debug('Successfully updated contact', updateResponse.body);
                                    var dataABC = JSON.parse(updateResponse.body);
                                    var sMonkeyId = dataABC.id;
                                    log.debug({
                                        title: 'sMonkeyId==',
                                        details: sMonkeyId
                                    });
                                    record.submitFields({
                                        type: record.Type.CUSTOMER,
                                        id: customerId,
                                        values: {
                                            'custentity_s_monkey_internal_id': sMonkeyId
                                        }
                                    });
                                } else {
                                    log.error('SurveyMonkey API Error during update', updateResponse.body);
                                }
                            }
                        // } else if (getResponse.code === 404) {
                        } else {
                            // If contact does not exist, create it
                            var postData = JSON.stringify(contact);
                            var postResponse = https.post({
                                url: apiUrl,
                                headers: headers,
                                body: postData
                            });

                            if (postResponse.code === 200) {
                                log.debug('Successfully added contact', postResponse.body);
                                var dataABC = JSON.parse(postResponse.body);
                                var sMonkeyId = dataABC.id;
                                log.debug({
                                    title: 'sMonkeyId==',
                                    details: sMonkeyId
                                });
                                record.submitFields({
                                    type: record.Type.CUSTOMER,
                                    id: customerId,
                                    values: {
                                        'custentity_s_monkey_internal_id': sMonkeyId
                                    }
                                });
                            } else {
                                log.error('SurveyMonkey API Error during create', postResponse.body);
                            }
                        // } else {
                        //     log.error('SurveyMonkey API Error', getResponse.body);
                        }
                    } catch (error) {
                        log.error('Error processing customer', error);
                    }
                });

                response.write('Contacts have been added/updated in SurveyMonkey!');
                return;
            }

            response.writePage(form);

        } catch (error) {
            log.error('onRequest Exception', error);
            response.write('An error occurred. Please check the logs.');
        }
    }

    return {
        onRequest: onRequest
    };
});
