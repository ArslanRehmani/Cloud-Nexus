/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/log', 'N/email', 'N/runtime', 'N/render'], function (record, search, log, email, runtime, render) {

    function afterSubmit(context) {
        var title = 'afterSubmit[::]';
        try {
            var newRec = context.newRecord;

            var rec = record.load({
                type: newRec.type,
                id: newRec.id
            });

            var senderId = runtime.getCurrentUser().id;

            var custId = rec.getValue({ fieldId: 'entity' });

            var shopifySite = rec.getValue({ fieldId: 'custbody_shopify_site' });

            var createdfrom = rec.getValue({ fieldId: 'createdfrom' });//sales order case only not TO

            var customerData = search.lookupFields({
                type: search.Type.CUSTOMER,
                id: custId,
                columns: ['firstname', 'lastname', 'companyname', 'email', 'category']
            });

            var customerEmail = customerData.email;
            var firstName = customerData.firstname || '';
            var lastName = customerData.lastname || '';
            var companyName = customerData.companyname || '';
            var custCategory = customerData.category || '';


            //Email Start
            // 1. Load the PDF Template by Script ID (from Advanced PDF/HTML template)
            var renderer = render.create();
            renderer.setTemplateByScriptId('CUSTTMPL_431_1117015_513'); // replace with your template script ID

            renderer.addRecord({
                templateName: 'record',
                record: record.load({
                    type: rec.type,
                    id: rec.id
                })
            });


            // 2. Render the PDF File
            var pdfFile = renderer.renderAsPdf();
            pdfFile.name = 'My_Attachment.pdf';


            var greeting = '';
            if (firstName || lastName) {
                greeting = 'Dear ' + firstName + ' ' + lastName + ',';
            } else if (companyName) {
                greeting = 'Dear ' + companyName + ',';
            } else {
                greeting = 'Dear Customer,';
            }

            if (shopifySite == '1') {//LSF logo

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from Lifespan Fitness';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'Lifespan Fitness \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@lifespanfitness.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '4') {//lifespan-kids

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from Lifespan Kids';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'Lifespan Kids \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@lifespankids.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '2') {//progearbikes

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from Progear Bikes';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'Progear Bikes \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@progearbikes.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '3') {//lsg-fitness

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from LSG Fitness';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'LSG Fitness \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@lsgfitness.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '8') {//the-fitness-outlet-australia

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from The Fitness Outlet';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'The Fitness Outlet \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@thefitnessoutlet.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '6') {//reebok-fitness

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from The Reebok Fitness';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'Reebok Fitness \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@thefitnessoutlet.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '12') {//walkingpad-australia

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from WalkingPad Australia';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'WalkingPad Australia \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@au.walkingpad.com',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '9') {//activego-global

                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from ActiveGo';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'ActiveGo \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@activego.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });

            } else if (shopifySite == '') {//Empty

                if ((custCategory[0].value === '2' || custCategory[0].value === '6' || custCategory[0].value === '8')) {

                    var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from Global Fitness and Leisure';

                    var body = greeting + '\n\n' +
                        'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                        'Thank you for your attention.\n\n' +
                        'Regards,\n' +
                        'Global Fitness and Leisure \n' +
                        '********************************* \n' +
                        'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                        '*********************************';

                    var contactEmailArray = contactSubscription(custId);

                    contactEmailArray.push('donotreply@gflgroup.com.au');

                    email.send({
                        author: senderId,
                        recipients: contactEmailArray,
                        subject: subject,
                        body: body,
                        attachments: [pdfFile]
                    });
                } else if (custCategory[0].value === '12') {

                    var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from GFL Marketplaces';

                    var body = greeting + '\n\n' +
                        'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                        'Thank you for your attention.\n\n' +
                        'Regards,\n' +
                        'GFL Marketplaces \n' +
                        '********************************* \n' +
                        'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                        '*********************************';

                    email.send({
                        author: senderId,
                        recipients: 'donotreply@gflmarketplaces.com.au',
                        subject: subject,
                        body: body,
                        attachments: [pdfFile]
                    });
                } else {

                    var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from Global Fitness and Leisure';

                    var body = greeting + '\n\n' +
                        'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                        'Thank you for your attention.\n\n' +
                        'Regards,\n' +
                        'Global Fitness and Leisure \n' +
                        '********************************* \n' +
                        'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                        '*********************************';

                    email.send({
                        author: senderId,
                        recipients: 'donotreply@gflgroup.com.au',
                        subject: subject,
                        body: body,
                        attachments: [pdfFile]
                    });
                }

            } else {
                log.debug({
                    title: 'ELSE',
                    details: 'YES'
                });
                var subject = 'Invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' from Global Fitness and Leisure';

                var body = greeting + '\n\n' +
                    'Please kindly find attached invoice ' + rec.getValue({ fieldId: 'tranid' }) + ' for your reference.\n\n' +
                    'Thank you for your attention.\n\n' +
                    'Regards,\n' +
                    'Global Fitness and Leisure \n' +
                    '********************************* \n' +
                    'Note: This is an automated system generated email from { Team Name }. Please do not reply.\n \n' +
                    '*********************************';

                email.send({
                    author: senderId,
                    recipients: 'donotreply@gflgroup.com.au',
                    subject: subject,
                    body: body,
                    attachments: [pdfFile]
                });
            }

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function contactSubscription(id) {
        var title = 'contactSubscription[::]';
        var array = [];
        try {
            var contactSearchObj = search.create({
                type: "contact",
                filters:
                    [
                        ["customer.internalid", "anyof", id],
                        "AND",
                        ["subscriptionstatus", "is", "T"],
                        "AND",
                        ["subscription", "anyof", "2"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entityid", label: "Name" }),
                        search.createColumn({ name: "email", label: "Email" })
                    ]
            });
            contactSearchObj.run().each(function (result) {
                array.push(result.getValue({ name: 'email' }));
                return true;
            });

            /*
            contactSearchObj.id="customsearch1757495087208";
            contactSearchObj.title="Contact Subscription Search (copy)";
            var newSearchId = contactSearchObj.save();
            */
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return array || [];
    }

    return {
        afterSubmit: afterSubmit
    }
});
