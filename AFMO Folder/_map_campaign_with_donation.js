/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope public
 */

/**
 * Date             Author          Remarks
 * 10-Nov-2020      Nabeel          Initial version
 *
 * A Suitelet to download the payment from the EBiz portal
 */

define(['N/search', 'N/format', 'N/ui/serverWidget'],
    function (search, nsFormat, nsUi) {
        /**
         * Entry point function
         * @param context
         */
        function onRequest(context) {
            try {
                var request = context.request;
                var response = context.response;
                var params = request.parameters;
                if (request.method === 'GET') {
                    getHandler(request, response, params);
                } else {
                    postHandler(request, response, params);
                }
            } catch (e) {
                log.error('Error::onRequest', e);
                response.writeLine({ output: 'Error: ' + e.name + ' , Details: ' + e.message });
            }
        }

        function getHandler(request, response, params) {
            var form = nsUi.createForm({
                title: 'Campaign Transactions'
            });
            var hasDateParams = (!!params.fromdate && !!params.todate)
            //  form.clientScriptModulePath = './ebiz_download_cs.js';
            form.addSubtab({ id: 'custpage_tab', label: 'Campaign Linked Transactions' });

            var fromDateFld = form.addField({
                id: 'custpage_fromdate',
                type: nsUi.FieldType.DATE,
                label: 'From Date',
            });

            var toDateFld = form.addField({
                id: 'custpage_todate',
                type: nsUi.FieldType.DATE,
                label: 'To Date',
            });


            if (!hasDateParams) {
                var fromDate = new Date();
                fromDate.setDate(fromDate.getDate() - 360);
                var toDate = new Date();
                toDate.setDate(toDate.getDate() + 1);
                fromDate = nsFormat.format({
                    value: fromDate,
                    type: nsFormat.Type.DATE
                });
                toDate = nsFormat.format({
                    value: toDate,
                    type: nsFormat.Type.DATE
                });

                fromDateFld.defaultValue = fromDate
                toDateFld.defaultValue = toDate
                params.fromdate = fromDate
                params.todate = toDate

            } else {
                fromDateFld.defaultValue = params.fromdate ? nsFormat.format({
                    value: params.fromdate,
                    type: nsFormat.Type.DATE
                }) : '';

                toDateFld.defaultValue = params.todate ? nsFormat.format({
                    value: params.todate,
                    type: nsFormat.Type.DATE
                }) : '';
            }
            var sublist = form.addSublist({
                id: 'custpage_results',
                label: 'Sales Orders',
                type: nsUi.SublistType.LIST,
                tab: 'custpage_tab'
            });
            sublist.addField({ id: 'custpage_date', label: 'Date', type: nsUi.FieldType.TEXT });
            sublist.addField({ id: 'custpage_campaign', label: 'Campaign', type: nsUi.FieldType.TEXT });
            sublist.addField({ id: 'custpage_name', label: 'Donor Name', type: nsUi.FieldType.TEXT });
            sublist.addField({ id: 'custpage_amount', label: 'Amount', type: nsUi.FieldType.TEXT });
            var donationArray = getDonations(fromDate, toDate, sublist);
            response.writePage(form);
        }
        function getDonations(fromDate, toDate, sublist) {
            try {
                var result = [];
                var campaignArray = getCampaignArrayDate(fromDate, toDate);
                log.debug('CampaignArray', campaignArray);
                var donationArray = getDonationArray(fromDate, toDate);
                log.debug('donationArray', donationArray);
                if(campaignArray.length > 0 && donationArray.length > 0){
                    for (var i = 0; i < donationArray.length; i++) {
                        var donationItem = donationArray[i];
                        var donationDate = new Date(donationItem.Date);
                        
                        var matchingCampaign = campaignArray.find(function(campaign) {
                          var campaignDate = new Date(campaign.Date);
                          return donationDate >= campaignDate;
                        });
                      
                        if (matchingCampaign) {
                          result.push({
                            'CampaignName': matchingCampaign.CampaignName,
                            'Date': matchingCampaign.Date,
                            'Donor': donationItem.Donor,
                            'Amount': parseFloat(donationItem.Amount)
                          });
                        }
                      }
                      log.debug('resultArray', result);
                }
                for(var j = 0; j < result.length; j++){
                    var campaignName = result[j].CampaignName;
                    var date = result[j].Date;
                    var donorName = result[j].Donor;
                    var amount = result[j].Amount;
                    sublist.setSublistValue({ id: 'custpage_date', value: date, line: j });
                    sublist.setSublistValue({ id: 'custpage_campaign', value: campaignName, line: j });
                    sublist.setSublistValue({ id: 'custpage_name', value: donorName, line: j });
                    sublist.setSublistValue({ id: 'custpage_amount', value: amount, line: j });
                }
            }
            catch (e) {
                log.error('getDonations Exception', e.message);
            }
        }
        function getCampaignArrayDate(fromDate, toDate) {
            try {
                var campaignArray = [];
                var campaginSearch = search.create({
                    type: "customrecord_campaings",
                    filters: [["custrecord5", "within", fromDate, toDate]],
                    columns: ["custrecord_campaign_name",
                        search.createColumn({
                            name: "custrecord5",
                            sort: search.Sort.DESC
                        })]
                });
                var searchResult = campaginSearch.run().getRange({ start: 0, end: 1000 });
                var linecount = searchResult.length;
                for (var i = 0; i < linecount; i++) {
                    var campaignName = searchResult[i].getValue({
                        name: 'custrecord_campaign_name'
                    });
                    var campaignDate = searchResult[i].getValue({
                        name: "custrecord5",
                        sort: search.Sort.DESC                    
                    });
                    campaignArray.push({
                        'CampaignName' : campaignName,
                        'Date' : campaignDate
                    });
                }
            }
            catch (e) {
                log.error('getCampaignArrayDate Exception', e.message);
            }
            return campaignArray;
        }
        function getDonationArray(fromDate, toDate){
            try{
                var donationArray = [];
                var campaginSearch = search.create({
                    type: "transaction",
                    filters:[["mainline","is","T"], "AND", ["trandate","within",fromDate,toDate]],
                    columns:
                    [
                       "entity",
                       "amount",
                       search.createColumn({
                          name: "trandate",
                          sort: search.Sort.DESC
                       })
                    ]
                 });
                var searchResult = campaginSearch.run().getRange({ start: 0, end: 1000 });
                var linecount = searchResult.length;
                for (var i = 0; i < linecount; i++) {
                    var donorId = searchResult[i].getValue({
                        name: 'entity'
                    });
                    var donorName = searchResult[i].getText({
                        name: 'entity'
                    });
                    var amount = searchResult[i].getValue({
                        name: 'amount'
                    });
                    var donationDate = searchResult[i].getValue({
                        name: "trandate",
                        sort: search.Sort.DESC                    
                    });
                    donationArray.push({
                        'DonorId' : donorName,
                        'Donor' : donorName,
                        'Amount' : amount,
                        'Date' : donationDate
                    });
                }
            }
            catch(e){
                log.error('getDonationArray Exception', e.message);
            }
            return donationArray;
        }
        return {
            onRequest: onRequest
        };
    });