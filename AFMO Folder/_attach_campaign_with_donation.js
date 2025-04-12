/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/url', 'N/http', 'N/runtime', 'N/ui/dialog', 'N/format'], function (log, record, search, url, http, runtime, dialog, format) {

    function getInputData() {
        try {
            var searchObj = search.create({
                type: "customrecord_main_campaign",
                filters: [],
                columns: [
                    search.createColumn({
                        name: "custrecord_main_campaign_date",
                        summary: "MAX"
                    }),
                    search.createColumn({
                        name: "internalid",
                        summary: "GROUP"
                    }),
                    search.createColumn({
                        name: "name",
                        summary: "GROUP",
                        sort: search.Sort.ASC
                    })
                ]
            });
            log.debug('searchObj GetInputData',searchObj);
            return searchObj || [];
        }
        catch (e) {
            log.error('getInputData Exception', e.message);
        }
    }
    function map(context) {
        try {
            var data = JSON.parse(context.value);
            log.debug('Data', data);
            var campaignDate = data.values["MAX(custrecord_main_campaign_date)"];
            var campaignName = data.values["GROUP(name)"];
            var campaignId = data.values["GROUP(internalid)"].value;
            if (campaignDate && campaignName) {
                const inputDate = new Date('8/22/2023');
                const outputDate = new Date(inputDate.getTime() + 14 * 24 * 60 * 60 * 1000);
                const dateAfterTwoWeeks = `${outputDate.getMonth() + 1}/${outputDate.getDate()}/${outputDate.getFullYear()}`;
                var transactionBtDates = getTransactionsBtDate(campaignDate, dateAfterTwoWeeks, campaignName, campaignId);

            }
        }
        catch (e) {
            log.debug('map Exception', e.message);
        }
    }
    function reduce(context) {
    }
    function getTransactionsBtDate(campaignDate, dateAfterTwoWeeks, campaignName, campaignId) {
        try {
            var searchObj = search.create({
                type: "cashsale",
                filters:
                    [
                        ["type", "anyof", "CashSale"],
                        "AND",
                        ["trandate", "within", campaignDate, dateAfterTwoWeeks],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["formulatext: {custbody_linked_campaign}", "isempty", ""]
                    ],
                columns:
                    [
                        "internalid",
                        search.createColumn({
                            name: "email",
                            join: "customer"
                        }),

                    ]
            });
            var searchResult = searchObj.run().getRange({ start: 0, end: 1000 });
            var linecount = searchResult.length;
            for (var i = 0; i < linecount; i++) {
                var internalId = searchResult[i].getValue({
                    name: 'internalid'
                });
                log.debug('internalId getTransactionsBtDate',internalId);
                var email = searchResult[i].getValue({
                    name: "email",
                    join: "customer"
                });
                log.debug('email getTransactionsBtDate',email);
                if (email && campaignName) {
                    var words = campaignName.split(" ");
                    var firstWord = words[0];
                    var emailwithCampaign = matchEmailwithCampaign(email, firstWord);
                    if (emailwithCampaign) {
                        record.submitFields({
                            type: 'cashsale',
                            id: internalId,
                            values: {
                                custbody_linked_campaign: campaignId
                            },
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields : true
                            }
                        });
                    }
                }
            }
        }
        catch (e) {
            log.error('getTransactionsBtDate Exception', e.message);
        }
    }
    function matchEmailwithCampaign(email, campaignName) {
        try {
            var searchObj = search.create({
                type: "customrecord_mailchimp_click_details",
                filters:
                    [
                        ["custrecord_report_link.name", "startswith", campaignName],
                        "AND",
                        ["custrecord_click_detail_parent.custrecord_email_address", "is", email]
                    ],
                columns:
                    [
                        "custrecord_report_link",
                        search.createColumn({
                            name: "name",
                            join: "CUSTRECORD_REPORT_LINK"
                        })
                    ]
            });
            var searchResult = searchObj.run().getRange({ start: 0, end: 1000 });
            var linecount = searchResult.length;
            if (linecount > 0) {
                return true;
            }
        }
        catch (e) {
            log.error('matchEmailwithCampaign Exception', e.message);
        }
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
    }
});