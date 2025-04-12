/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/email', 'N/http', 'N/https', 'N/runtime', 'N/ui/serverWidget', 'N/record', 'N/render', 'N/file'],
    /**
 * @param{email} email
 * @param{http} http
 * @param{https} https
 * @param{runtime} runtime
 * @param{serverWidget} serverWidget
 */
    (email, http, https, runtime, serverWidget, record, render, file) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const stLogTitle = 'onRequest';
            try {
                const request = scriptContext.request;
                let response = scriptContext.response;
                const parameters = request.parameters;
                let form;

                const recordId = parameters.custparam_recordid;
                const stRecordName = parameters.custparam_recordname;
                const multipleEmails = parameters.custparam_multiemails;

                const transactionId = parameters.custparam_transactionid;
                const recordType = parameters.custparam_recordtype;

                if (scriptContext.request.method === http.Method.GET) {
                    let params = {
                        recordid: recordId,
                        emailsubject: '',
                        multipleEmails: multipleEmails,
                        transactionId: transactionId,
                        recordType: recordType
                    };

                    form = displayForm(params);
                    response.writePage(form);
                } else if (scriptContext.request.method === http.Method.POST) {
                    let response = scriptContext.response;
                    let form, outputHTMLField;

                    //Gets all the data from the suitelet
                    const sender = runtime.getCurrentUser().id;

                    const receiver = scriptContext.request.parameters.custpage_receiver;

                    const recordid = scriptContext.request.parameters.custpage_recordid;

                    const multipleEmails = scriptContext.request.parameters.custpage_multi_emails;
                    const transactionId = scriptContext.request.parameters.custpage_transactionid;
                    const recordType = scriptContext.request.parameters.custpage_recordtype;
                    const fileid = scriptContext.request.parameters.custpage_fileid

                    log.debug('transactionId', transactionId);
                    log.debug('recordType', recordType);

                    const attachment = scriptContext.request.files['custpage_attachment'];
                    let arrAttachments = [];
                    if (!isEmpty(attachment)) {
                        attachment.folder = runtime.getCurrentScript().getParameter('custscript_ias_invoice_folder');

                        arrAttachments.push(attachment);
                    }

                    if (!isEmpty(fileid)) {
                        arrAttachments.push(file.load(fileid));
                    }

                    let subject = scriptContext.request.parameters.custpage_subject;
                    let message = scriptContext.request.parameters.custpage_message;
                    log.debug('Post Method', message);


                    let arrTO = [];
                    arrTO.push(receiver);
                    let arrCC = [];
                    let arrBCC = [];

                    let sublistInputs = scriptContext.request.parameters.custpage_sublistinputs;
                    if(!isEmpty(sublistInputs)){
                        sublistInputs = JSON.parse(sublistInputs);
                        for (var i = 0; i < sublistInputs.length && ((arrTO.length + arrCC.length + arrBCC.length)<10); i++) {
                            if(sublistInputs[i].to == true){
                                arrTO.push(sublistInputs[i].employeeid);
                            }else if(sublistInputs[i].cc == true){
                                arrCC.push(sublistInputs[i].employeeid);
                            }else if(sublistInputs[i].bcc == true){
                                arrBCC.push(sublistInputs[i].employeeid);
                            }
                        }

                    }

                    log.debug('Post Method', 'arrTO: '+arrTO);
                    log.debug('Post Method', 'arrCC: '+arrCC);
                    log.debug('Post Method', 'arrBCC: '+arrBCC);
                    if (!isEmpty(arrTO) && !isEmpty(subject) && !isEmpty(message) && !isEmpty(recordid)) {

                        let arrRecipientEmails = multipleEmails.split(';');
                        log.debug('arrRecipientEmails', arrRecipientEmails);
                        try {
                            email.send({
                                author: sender,
                                recipients: arrRecipientEmails,
                                //recipients: arrTO,
                                cc: ['accountingteam@pimsinc.com'],
                                //bcc: arrBCC,
                                subject: subject,
                                body: message,
                                attachments: arrAttachments,
                                relatedRecords: {
                                    entityId: receiver,
                                    transactionId: transactionId
                                }
                            });


                            log.audit('Post Method', 'Email Sent');
                            //Suitelet is closed
                            response.write('<html><body><script type="text/javascript">window.close();</script></body></html>');
                        } catch (email_error) {
                            log.error('Post Method', email_error);
                            pageHandler(scriptContext.response, 'ERROR: There was an error when sending the email, please contact your Netsuite Admin')

                        }
                    } else {
                        // No From and To set
                        log.error('Post Method', 'No receiver or message');
                        pageHandler(scriptContext.response,'ERROR: Receiver, Email subject and Email message are mandatory');
                        //displayMessage(outputHTMLField, response, form, 'ERROR: Receiver, Email subject and Email message are mandatory', true);
                    }

                }
            } catch (error) {
                log.error(stLogTitle, error);
                pageHandler(scriptContext.response,'Unexpected error. Please contact your Netsuite Admin');
                //displayMessage(outputHTMLField, response, form, 'Unexpected error. Please contact your Netsuite Admin', true);
            }
        }

        //Displays the suitelet with all the fields needed
        function displayForm(params) {
            const stLogTitle = 'displayForm';
            try {
                let form = serverWidget.createForm({
                    title: 'Message Form'
                });

                //Set the Client script id
                form.clientScriptModulePath = 'SuiteScripts/IAS/cs/ias_cs_custom_message_record.js';

                let receiver = form.addField({
                    id: 'custpage_receiver',
                    type: serverWidget.FieldType.SELECT,
                    label: 'To: ',
                    source: 'customer'
                });

                receiver.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });
                receiver.defaultValue = params.recordid;

                let multipleEmails = form.addField({
                    id: 'custpage_multi_emails',
                    type: serverWidget.FieldType.TEXT,
                    label: 'EMAIL/S: '
                });
                multipleEmails.defaultValue = params.multipleEmails;

                form.addField({
                    id: 'custpage_attachment',
                    type: serverWidget.FieldType.FILE,
                    label: 'Attachment: '
                });
                if(params.recordType === 'invoice') {
                    let tranpdf = form.addField({
                        id: 'custpage_transaction_pdf',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Transaction PDF: '
                    });
                    let objFile = getFileURL(params.transactionId, params.recordType);
                    tranpdf.defaultValue = '<a href="'+ objFile.url +'"> Transaction PDF: '+objFile.name+'</a>';
                    //tranpdf.defaultValue = '<img src="'+objFile.url+'" alt="Transaction PDF: '+objFile.name+'">';
                    tranpdf.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.INLINE
                    });

                    tranpdf.updateBreakType({
                        breakType : serverWidget.FieldBreakType.STARTCOL
                    });

                    let fileid = form.addField({
                        id: 'custpage_fileid',
                        type: serverWidget.FieldType.TEXT,
                        label: 'File id: '
                    });
                    fileid.defaultValue = objFile.id;
                    fileid.updateDisplayType({
                        displayType: 'hidden'
                    });
                }

                let recordid = form.addField({
                    id: 'custpage_recordid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Record id: '
                });
                if (!isEmpty(params.recordid)) {
                    recordid.defaultValue = params.recordid;
                }
                recordid.updateDisplayType({
                    displayType: 'hidden'
                });

                let transactionid = form.addField({
                    id: 'custpage_transactionid',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Transaction id: '
                });
                if (!isEmpty(params.transactionid)) {
                    transactionid.defaultValue = params.transactionId;
                }
                transactionid.updateDisplayType({
                    displayType: 'hidden'
                });

                let recordtype = form.addField({
                    id: 'custpage_recordtype',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Record type: '
                });
                if (!isEmpty(params.recordtype)) {
                    recordtype.defaultValue = params.recordtype;
                }
                recordtype.updateDisplayType({
                    displayType: 'hidden'
                });

                let sublistInputs = form.addField({
                    id: 'custpage_sublistinputs',
                    type: serverWidget.FieldType.LONGTEXT,
                    label: 'Sublist Inputs:'
                });
                sublistInputs.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

                //Sublist Fields
                let sublist_message = form.addSublist({
                    id: 'sublist',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Recipients'
                });
                sublist_message.addField({
                    id: 'sublist1',
                    type: serverWidget.FieldType.SELECT,
                    label: 'RECIPIENT',
                    source: 'employee'
                });
              /*  sublist_message.addField({
                    id: 'sublist2',
                    type: serverWidget.FieldType.SELECT,
                    label: 'ADDITIONAL RECIPIENT',
                    source: 'employee'
                });*/
                sublist_message.addField({
                    id: 'sublist2',
                    type: serverWidget.FieldType.EMAIL,
                    label: 'EMAIL'
                });
                sublist_message.addField({
                    id: 'sublist3',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'TO'
                });
                sublist_message.addField({
                    id: 'sublist4',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'CC'
                });
                sublist_message.addField({
                    id: 'sublist5',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'BCC'
                });
                //End sublist fields
                form.addSubtab({
                    id: 'custpage_subtab_message',
                    label: 'Message'
                });

                form.addField({
                    id: 'custpage_email_templates',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Email Templates: ',
                    container: 'custpage_subtab_message',
                    source: 'emailtemplate'
                });

                let subject = form.addField({
                    id: 'custpage_subject',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Subject: ',
                    container: 'custpage_subtab_message'
                });
                if (!isEmpty(params.emailsubject)) {
                    subject.defaultValue = params.emailsubject;
                }

                subject.updateBreakType({
                    breakType: serverWidget.FieldBreakType.STARTCOL
                });

                form.addField({
                    id: 'custpage_message',
                    type: serverWidget.FieldType.RICHTEXT,
                    label: 'Message: ',
                    container: 'custpage_subtab_message'
                });


                form.addSubmitButton({
                    label: 'Send'
                });

                return form;
            } catch (error) {
                log.error(stLogTitle, error);
            }
        }

        function pageHandler(response, message) {
            try {
                let form = serverWidget.createForm({
                    title: "Notification!"
                });
                let script = "win = window.close();";
                form.addButton({
                    id: 'custpage_btn_close',
                    label: 'Close',
                    functionName: script
                });
                let outputHTMLField = form.addField({
                    id: 'custpage_output_html',
                    label: 'Output',
                    type: serverWidget.FieldType.INLINEHTML
                });
                outputHTMLField.defaultValue = message;
                outputHTMLField.updateLayoutType({
                    layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
                });
                response.writePage(form);
            } catch (e) {
                log.error('pageHandler', e);
            }
        }

        function isEmpty(stValue) {
            return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v) {
                for (var k in v)
                    return false;
                return true;
            })(stValue)));
        };

        function getFileURL(transactionId, recordType){
            const tmplFileId = runtime.getCurrentScript().getParameter('custscript_ias_invoice_pdftemplate_2');


            const myFile = render.create();
            myFile.setTemplateById({
                id: tmplFileId
            });
            log.debug('recordType', recordType);
            log.debug('transactionId', transactionId);
            const invoice = record.load({
                type: recordType,
                id: transactionId
            });
            myFile.addRecord('record', invoice);
            const invoicePdf = myFile.renderAsPdf();

            const invoiceName = invoice.getValue('tranid');
            invoicePdf.name = 'Invoice ' + invoiceName + '.pdf';
            //Change the folder id later
            invoicePdf.folder = runtime.getCurrentScript().getParameter('custscript_ias_invoice_folder');//2000;
            const fileId = invoicePdf.save();
            const objFile = file.load(fileId);
            return objFile;
        }


        return {onRequest}

    });
