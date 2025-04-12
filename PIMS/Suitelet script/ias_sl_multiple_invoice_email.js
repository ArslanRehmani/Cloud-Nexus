/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/http', 'N/ui/serverWidget', 'N/search', 'N/runtime', 'N/url', 'N/task', 'N/record', 'SuiteScripts/IAS/lib/Utilities.js', 'N/email'],

    (http, serverWidget, search, runtime, url, task, record, util, email) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const logTitle = 'onRequest';
            try {
                const parameters = scriptContext.request.parameters;
                log.audit('parameters', parameters);

                //Get script parameters
                const ssTransactions = runtime.getCurrentScript().getParameter('custscript_ias_bulk_email_tran_ss');

                if (scriptContext.request.method === http.Method.GET) {
                    log.debug('*****', parameters.custparam_customer);
                    const params = {
                        ssTransactions: ssTransactions,
                        page: parameters.custparam_page,
                        date: parameters.custparam_date,
                        subsidiary: parameters.custparam_subsidiary,
                        customer: parameters.custparam_customer,
                        status: parameters.custparam_status,
                        emailbody: parameters.custparam_emailbody,
                        emailsubject: parameters.custparam_emailsubject,
                        emailtemp: parameters.custparam_emailtemp
                    }
                    displayForm(scriptContext, params);

                } else if (scriptContext.request.method === http.Method.POST) {
                    let emailBody = scriptContext.request.parameters.custpage_message;
                    let emailSubject = scriptContext.request.parameters.custpage_subject;
                    let customerEmailID = scriptContext.request.parameters.custpage_customer;
                    let selectedCustArray = customerEmailID.split('\u0005');
                    // let selectedCustArray = Object.values(arrayObj);
                    log.debug({
                        title: 'selectedCustArray',
                        details: selectedCustArray
                    });
                    // log.debug({
                    //     title: 'arrayObj',
                    //     details: arrayObj
                    // });
                    if(selectedCustArray && selectedCustArray.length && selectedCustArray != ''){
                        var custArry = [];
                        for (var i = 0; i < selectedCustArray.length; i++) {
                            var custId = selectedCustArray[i];
                            var customerEmail = search.lookupFields({
                                type: 'customer',
                                id: custId,
                                columns: ['custentity_ii_ap_email']
                            }).custentity_ii_ap_email;
                            // log.debug('customerEmail', customerEmail);
                            if (customerEmail) {
                                custArry.push(customerEmail)
                            }
                        }
                    }
                    log.debug('custArry', custArry);
                    let arrTransactionsIdSelected = [];
                    for (let i = 0; i < scriptContext.request.getLineCount({ group: 'custpage_table' }); i++) {
                        if (scriptContext.request.getSublistValue({
                            group: 'custpage_table',
                            name: 'custpage_select',
                            line: i
                        }) === 'T') {
                            arrTransactionsIdSelected.push(parseInt(scriptContext.request.getSublistValue({
                                group: 'custpage_table',
                                name: 'custpage_inv_id',
                                line: i
                            })));
                        }
                    }

                    log.audit('arrTransactionsIdSelected', arrTransactionsIdSelected);
                    //Get script parameters
                    const mapReduce_id = runtime.getCurrentScript().getParameter('custscript_ias_mr_mult_inv_email_id');
                    const mapReduceDeploy = runtime.getCurrentScript().getParameter('custscript_ias_mr_mult_inv_email_deploy');
                    if (!util.isEmpty(mapReduce_id) && !util.isEmpty(mapReduceDeploy)) {
                        //Gets all the data from the suitelet

                        try {
                            //Call MR Script
                            const mrTask = task.create({
                                taskType: task.TaskType.MAP_REDUCE,
                                scriptId: mapReduce_id,
                                deploymentId: mapReduceDeploy,
                                params: {
                                    'custscript_ias_mr_transactions_id': JSON.stringify(arrTransactionsIdSelected),
                                    //'custscript_ias_mr_email_body': JSON.stringify(emailBody),
                                    'custscript_ias_mr_email_body': emailBody,
                                    'custscript_ias_mr_email_subject': emailSubject
                                }
                            });
                            const mrTaskId = mrTask.submit();
                            const summary = task.checkStatus(mrTaskId);
                            log.audit(logTitle, 'Map Reduce script executed.');
                            pageHandler(scriptContext.response, 'Success. Transactions are being processed and emailed.');
                        } catch (mapreduce_error) {
                            log.error('ERROR', mapreduce_error);
                            pageHandler(scriptContext.response, mapreduce_error);
                        }

                    } else {
                        log.error('ERROR', 'Script parameters are empty');
                        pageHandler(scriptContext.response, 'Script parameters are empty');
                    }
                    //send Email Code
                    const sender = runtime.getCurrentUser().id;
                    var totalLines = scriptContext.request.getLineCount({ group: 'custpage_sublist' });
                    log.debug('totalLines', totalLines);
                    var selectedLines = [];
                    for (var i = 0; i < totalLines; i++) {
                        var isSelected = scriptContext.request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'sublist1',
                            line: i
                        });
                        var isSelectedEmail = scriptContext.request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'sublist3',
                            line: i
                        });
                            selectedLines.push(isSelectedEmail); 
                            selectedLines.push(isSelected);
                    }
                    log.debug('selectedLines 111', selectedLines);
                    var emailTitle = 'emailSend(::)';
                    try{
                        if (selectedLines && selectedLines.length && (custArry && custArry != '')) {
                            var newArray = selectedLines.concat(custArry);
                            newArray = newArray.filter(item => item !== null);
                            log.debug('newArray', newArray);
                            email.send({
                                author: sender,
                                recipients: newArray,
                                // cc: ['pims@infoagesolutions.net'],
                                subject: 'testsubject',
                                body: 'testbody'
                            });
                        } else if(custArry && custArry.length & custArry != '') {
                            var newArray = custArry.filter(item => item !== null);
                            email.send({
                                author: sender,
                                recipients: newArray,
                                // cc: ['pims@infoagesolutions.net'],
                                subject: 'testsubject',
                                body: 'testbody'
                            });
                        }else{
                            var newArray = selectedLines.filter(item => item !== null);
                            email.send({
                                author: sender,
                                recipients: newArray,
                                // cc: ['pims@infoagesolutions.net'],
                                subject: 'testsubject',
                                body: 'testbody'
                            });
                        }
                    } catch(e) {
                        log.debug('Exception ' +emailTitle, e.message);
                    }
                }
            } catch (e) {
                log.error('ERROR', e);
                pageHandler(scriptContext.response, e);
            }
        }

        //Displays the suitelet with all the fields needed
        function displayForm(scriptContext, params) {

            let form = serverWidget.createForm({
                title: 'Transaction emails in bulk'
            });
            //Set the Client script id
            form.clientScriptModulePath = 'SuiteScripts/IAS/cs/ias_cs_multiple_invoice_email.js';
            //Adding aditional fields
            const subsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                source: 'subsidiary'
            });
            if (!util.isEmpty(params.subsidiary)) {
                subsidiary.defaultValue = params.subsidiary;
            }
            const date = form.addField({
                id: 'custpage_date',
                type: serverWidget.FieldType.DATE,
                label: 'Date'
            });
            if (!util.isEmpty(params.date) && params.date !== NaN) {
                date.defaultValue = params.date;
            }

            const status = form.addField({
                id: 'custpage_status',
                type: serverWidget.FieldType.SELECT,
                label: 'Status'
            });
            let arrInvoiceStatusValues = [
                {
                    value: "CustInvc:A",
                    text: 'Open'
                },
                {
                    value: "CustInvc:B",
                    text: 'Paid In Full'
                },
                {
                    value: "CustInvc:D",
                    text: 'Pending Approval'
                },
                {
                    value: "CustInvc:E",
                    text: 'Rejected'
                },
                {
                    value: "CustInvc:V",
                    text: 'Voided'
                }];
            status.addSelectOption({
                value: '',
                text: ''
            });
            for (let i = 0; i < arrInvoiceStatusValues.length; i++) {
                status.addSelectOption({
                    value: arrInvoiceStatusValues[i].value,
                    text: arrInvoiceStatusValues[i].text
                });
            }
            if (!util.isEmpty(params.status) && params.status !== NaN) {
                status.defaultValue = params.status;
            }



            const customer = form.addField({
                id: 'custpage_customer',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Customer',
                source: 'customer'
            });
            if (!util.isEmpty(params.customer)) {
                customer.defaultValue = JSON.parse(params.customer);
            }

            //***Pagination drop down to select the page #
            // Run search and determine page count
            const page_size = 500;
            const retrieveSearch = runSearch(params.ssTransactions, page_size, params.subsidiary, params.date, params.customer, params.status);
            //log.debug('retrieveSearch', retrieveSearch);
            //Added Math.ceil to round up the number. If the calculation is 0.xx (greater than 0) the pageCount needs to be 1, can't be 0
            const pageCount = Math.ceil(parseFloat(retrieveSearch.pagedData.count / page_size));
            log.debug('pageCount', pageCount);
            // Set pageId to correct value if out of index
            if (!params.page || params.page == '' || params.page < 0 || util.isEmpty(pageCount)) {
                params.page = 0;
            } else if (params.page >= pageCount) {
                params.page = pageCount - 1;
            }
            log.debug('params.page', params.page);
            // Add drop-down and options to navigate to specific page
            selectOptions = form.addField({
                id: 'custpage_pageid',
                label: 'Page Index',
                type: serverWidget.FieldType.SELECT
            });
            if (!util.isEmpty(pageCount)) {
                for (let i = 0; i < pageCount; i++) {
                    if (i === params.page) {
                        selectOptions.addSelectOption({
                            value: i,
                            text: ((i * page_size) + 1) + ' - ' + ((i + 1) * page_size),
                            isSelected: true
                        });
                    } else {
                        selectOptions.addSelectOption({
                            value: i,
                            text: ((i * page_size) + 1) + ' - ' + ((i + 1) * page_size)
                        });
                    }
                }
            }

            if (!util.isEmpty(params.page)) {
                selectOptions.defaultValue = JSON.parse(params.page);
            }

            // Get subset of data to be shown on page
            form = fetchSearchResult(form, retrieveSearch, params.page);

            //***Pagination code end

            form.addSubtab({
                id: 'custpage_subtab_message',
                label: 'Message'
            });

            let emailTemplateField = form.addField({
                id: 'custpage_email_templates',
                type: serverWidget.FieldType.SELECT,
                label: 'Email Templates: ',
                container: 'custpage_subtab_message',
                source: 'emailtemplate'
            });
            log.debug('params.emailtemp', params.emailtemp);
            if (!util.isEmpty(params.emailtemp)) {
                emailTemplateField.defaultValue = JSON.parse(params.emailtemp);
            }

            let subjectField = form.addField({
                id: 'custpage_subject',
                type: serverWidget.FieldType.TEXT,
                label: 'Subject: ',
                container: 'custpage_subtab_message'
            });
            log.debug('params.emailsubject', params.emailsubject);
            if (!util.isEmpty(params.emailsubject)) {
                //subjectField.defaultValue = JSON.parse(params.emailsubject);
                subjectField.defaultValue = params.emailsubject;
            }

            subjectField.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTCOL
            });

            let messageField = form.addField({
                id: 'custpage_message',
                type: serverWidget.FieldType.RICHTEXT,
                label: 'Message: ',
                container: 'custpage_subtab_message'
            });
            messageField.richTextWidth = 650;
            messageField.richTextHeight = 450;

            log.debug('params.emailbody', params.emailbody);
            if (!util.isEmpty(params.emailbody)) {
                //messageField.defaultValue = JSON.parse(params.emailbody);
                messageField.defaultValue = params.emailbody;
            }


            form.addSubmitButton({
                label: 'Submit'
            });
            //Add Submit and Cancel buttons
            form.addButton({
                id: 'custpage_btn_searchtransaction',
                label: 'Apply Filter',
                functionName: 'searchTransaction()'
            });

            // form.addButton({
            //     id: 'custpage_btn_cancel',
            //     label: 'Close',
            //     functionName: 'closeWindow()'
            // });

            scriptContext.response.writePage(form);

        }


        //Pagination aux functions - runs the search and applies the filters needed
        function runSearch(searchId, searchPageSize, subsidiary, date, customer, status) {
            let searchObj = search.load({
                id: searchId
            });
            if (!util.isEmpty(subsidiary)) {
                searchObj.filters.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: subsidiary
                }));
            }
            if (!util.isEmpty(date)) {
                log.debug('runSearch date', date);
                searchObj.filters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ON,
                    values: date
                }));
            }
            if (!util.isEmpty(customer)) {
                log.debug('runSearch customer', customer);
                log.debug('runSearch customer type', typeof customer);
                let objCustomers = JSON.parse(customer);
                log.debug('objCustomers', objCustomers);
                if (!util.isEmpty(objCustomers) && !util.isEmpty(objCustomers[0])) {
                    searchObj.filters.push(search.createFilter({
                        name: 'entity',
                        operator: search.Operator.ANYOF,
                        values: objCustomers
                    }));
                }
            }

            if (!util.isEmpty(status)) {
                searchObj.filters.push(search.createFilter({
                    name: 'status',
                    operator: search.Operator.ANYOF,
                    values: status
                }));
            }

            return {
                'pagedData': searchObj.runPaged({
                    pageSize: searchPageSize
                }),
                'columns': searchObj.run().columns
            };
        }
        //Gets the search, runs it and returns the results
        function fetchSearchResult(form, searchObjectHelper, pageIndex) {
            log.debug('fetchSearchResult', 'Start');
            // Add sublist that will show results
            const sublist = form.addSublist({
                id: 'custpage_table',
                type: serverWidget.SublistType.LIST,
                label: 'Transactions'
            });
            //sublist.addRefreshButton();
            const searchColumns = searchObjectHelper.columns;
            sublist.addField({
                id: 'custpage_select',
                label: 'Select',
                type: serverWidget.FieldType.CHECKBOX
            });
            sublist.addField({
                id: 'custpage_transaction_url',
                label: 'Go To',
                type: serverWidget.FieldType.URL
            }).linkText = 'View';
            // sublist.addField({
            //         id: 'sublist2',
            //         type: serverWidget.FieldType.SELECT,
            //         label: 'ADDITIONAL RECIPIENT',
            //         source: 'employee'
            //     });
            let internalIdField = sublist.addField({
                id: 'custpage_inv_id',
                label: 'Internal id',
                type: serverWidget.FieldType.TEXT
            });
            internalIdField.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            for (let i = 0; i < searchColumns.length; i++) {
                // Add columns to be shown on Page
                sublist.addField({
                    id: searchColumns[i].name,
                    label: searchColumns[i].label,
                    type: serverWidget.FieldType.TEXT
                });
            }

            //Sublist Fields
            let sublist_message = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Additional Recipients'
            });
            sublist_message.addField({
                id: 'sublist1',
                type: serverWidget.FieldType.SELECT,
                label: 'RECIPIENT',
                source: 'employee'
            });
            sublist_message.addField({
                id: 'sublist3',
                type: serverWidget.FieldType.EMAIL,
                label: 'EMAIL'
            });
            sublist_message.addField({
                id: 'sublist4',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'TO'
            });
            sublist_message.addField({
                id: 'sublist5',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'CC'
            });
            sublist_message.addField({
                id: 'sublist6',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'BCC'
            });
            //End sublist fields

            if (!util.isEmpty(searchObjectHelper.pagedData) && searchObjectHelper.pagedData.count !== 0) {

                const searchPage = searchObjectHelper.pagedData.fetch({
                    index: pageIndex
                });
                let row = 0;
                searchPage.data.forEach(function (result) {

                    for (let j = 0; j < searchColumns.length; j++) {

                        sublist.setSublistValue({
                            id: 'custpage_transaction_url',
                            line: row,
                            value: url.resolveRecord({
                                recordType: result.recordType,
                                recordId: result.id
                            })
                        });

                        sublist.setSublistValue({
                            id: 'custpage_inv_id',
                            line: row,
                            value: result.id
                        });

                        let resultTextORValue = result.getText({
                            name: searchColumns[j].name
                        });
                        if (util.isEmpty(resultTextORValue)) {
                            resultTextORValue = result.getValue({
                                name: searchColumns[j].name
                            }) || ' ';
                        }

                        sublist.setSublistValue({
                            id: searchColumns[j].name,
                            line: row,
                            value: resultTextORValue
                        });
                    }

                    row++;

                });
            }
            log.debug('fetchSearchResult', 'End');
            return form;
        }

        function pageHandler(response, message) {
            try {
                let form = serverWidget.createForm({
                    title: "Notification!"
                });
                // let script = "win = window.close();";
                // form.addButton({
                //     id: 'custpage_btn_close',
                //     label: 'Close',
                //     functionName: script
                // });
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

        return { onRequest }

    });
