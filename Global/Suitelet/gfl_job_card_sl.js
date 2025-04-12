/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/search', 'N/record', 'N/email', 'N/redirect', 'N/url', 'N/runtime'],

function(render, search, record, email, redirect, url, runtime) {
   
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
     * @Since 2015.2
     */
    function onRequest(context) {
        var jobType = context.request.parameters['job_type'];
        var jobId = context.request.parameters['job_id'];
        var action = context.request.parameters['action'] || 'print';


        if (jobType && jobId) {

            var domainUrl = url.resolveDomain({
                hostType: url.HostType.APPLICATION,
                accountId: '1117015'
            });
            log.debug('domain url', domainUrl);

            var jobUrl = url.resolveRecord({
                recordType: 'customrecord_gfl_job_card',
                recordId: jobId
            });
            log.debug('job url', jobUrl);

            var jobRecord = record.load({
                type: 'customrecord_gfl_job_card',
                id: jobId
            })

            var jobTypeDetails = search.lookupFields({
                type: 'customrecord_gfl_job_card_type',
                id: jobType,
                columns: [
                    'internalid',
                    'name',
                    'custrecord_gfl_job_card_type_content',
                    // 'custrecord_gfl_job_card_type_signature',
                    'custrecord_gfl_job_card_type_file_name'
                ]
            });

            // var pdfContent = '<?xml version="1.0"?>'
            // +'<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">'
            // + '<pdfset>';

            // pdfContent += '</pdfset>';

            var pdfContent = '<?xml version="1.0"?>'
            +'<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';

            if (action == 'email' || action == 'print') {
                pdfContent += '<#assign action="' + action + '">' + jobTypeDetails.custrecord_gfl_job_card_type_content;
                
            } else {
                context.response.write('action is not validated');
                return;
            }

            var jobCardRenderer = render.create();
            jobCardRenderer.templateContent = pdfContent;
            jobCardRenderer.addRecord({
                templateName: 'customrecord',
                record: jobRecord
            });

            // var jobCardPdf = jobCardRenderer.renderAsString();
            // context.response.write(jobCardPdf);

            var jobCardPdf = jobCardRenderer.renderAsPdf();
            jobCardPdf.name = jobTypeDetails.name + ' ' + jobTypeDetails.custrecord_gfl_job_card_type_file_name;
            log.debug('job card pdf', JSON.stringify(jobCardPdf));
            if (action == 'email') {
                var emailAddress = jobRecord.getValue('custrecord_gfl_job_card_email');
                var emailSent = jobRecord.getValue('custrecord_gfl_job_card_email_sent');
                var editor = jobRecord.getValue('lastmodifiedby');
                // log.debug('editor', editor);
                if (emailAddress && emailSent == false) {
                    email.send({
                        author: 2628559,
                        recipients: emailAddress,
                        // recipients: 'it@gflgroup.com.au',
                        // recipients: runtime.getCurrentUser().id, // return -4, onlineuserform@1117015.com
                        bcc: [editor],
                        subject: 'GFL Job Card',
                        body: 'please review the term and confiditions.',
                        attachments: [jobCardPdf]
                    });
    
                    jobRecord.setValue('custrecord_gfl_job_card_email_sent', true);
                    jobRecord.save();
    
                    context.response.write('The email has been sent.');
                    
                    // redirected to login page
                    // redirect.toRecord({
                    //     type: 'customrecord_gfl_job_card',
                    //     id: jobId
                    // })

                    redirect.redirect({url: 'https://' + domainUrl + jobUrl});
                } else {
                    context.response.write('Missing email or email was sent already');
                }
            } else {
                context.response.writeFile({
                    file: jobCardPdf
                });
            }
        } else {
            context.response.write('Missing job type or job card');
        }
    }

    return {
        onRequest: onRequest
    };
    
});
