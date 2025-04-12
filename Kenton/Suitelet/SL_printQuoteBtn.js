/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
 define(['N/render', 'N/search', 'N/log', 'N/record', 'N/config', 'N/file'], function (render, search, log, record, config, file) {

    function onRequest(context) {
        var title = 'titleName[::]';
        try {
            var params = context.request.parameters;
            var recId = params.id;
            log.debug({
                title: 'recId',
                details: recId
            });
            var recType = params.rectype;
            log.debug({
                title: 'recType',
                details: recType
            });
            var configRecObj = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
            var companyInfo = configRecObj.getValue({
                fieldId: 'companyname',
            });
            var address = configRecObj.getValue({
                fieldId: 'mainaddress_text',
            });
            var quoteObj = record.load({
                type: recType,
                id: recId
            });
            var title = quoteObj.getValue({ fieldId: 'title' });
            var tranid = quoteObj.getValue({ fieldId: 'tranid' });
            var trandate = quoteObj.getValue({ fieldId: 'trandate' });
            var duedate = quoteObj.getValue({ fieldId: 'duedate' });
            var expectedclosedate = quoteObj.getValue({ fieldId: 'expectedclosedate' });
            var job = quoteObj.getText({ fieldId: 'job' }) || '';
            var salesrep = quoteObj.getText({ fieldId: 'salesrep' }) || '';
            var partner = quoteObj.getText({ fieldId: 'partner' }) || '';
            var shipmethod = quoteObj.getText({ fieldId: 'shipmethod' }) || '';
            var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += "<pdfset>";
            //PDF 1
            template += "<pdf>";
            template += "<head>";
            template += "<macrolist>";
            template += '<macro id="nlheader">';
            template += '<table class="header" style="width: 100%;"><tr>';
            template += '<td rowspan="3"><img src="https://5386899-sb1.app.netsuite.com/core/media/media.nl?id=11&amp;c=&amp;h=GuOvcW8NXMu3_Sq9F3XemEyxWaz-U1g92DiHYiY-HIalZtZN&amp;fcts=20210104075149&amp;whence=" style="float: left; margin: 7px; width: 25%; height: 25%;" /><br /><span>' + address + '</span></td>';
            if (recType == "invoice") {

                // template += '<td align="right"><span class="title"><b>INVOICE</b></span></td>';
                template += "</tr>";


            } else {

                template += '<td align="right"><span class="title"><b>QUOTE</b></span></td>';

                template += "</tr>";
                template += "<tr>";
                template += '<td align="right"><span class="number">#' + tranid + '</span></td>';
                template += "</tr>";
                template += "<tr>";
                template += '<td align="right">' + formateDate(trandate) + '</td>';
                template += "</tr>"
            }
            template += "</table>";
            template += "</macro>";
            template += '<macro id="nlfooter">';
            template += '<table class="footer" style="width: 100%;"><tr>';
            template += '<td><barcode codetype="code128" showtext="true" value="' + tranid + '"/></td>';
            template += '<td align="right"><pagenumber/> of <totalpages/></td>';
            template += "</tr></table>";
            template += "</macro>";
            template += "</macrolist >";

            template += "<link name='NotoSans' type='font' subtype='truetype' src='${nsfont.NotoSans_Regular}' src-bold='${nsfont.NotoSans_Bold}' src-italic='${nsfont.NotoSans_Italic}' src-bolditalic='${nsfont.NotoSans_BoldItalic}' bytes='2' />\
                <style>\
                    table {\
                    font-size: 9pt;\
                    table-layout: fixed;\
                    }\
                    th {\
                        font-weight: bold;\
                        font-size: 8pt;\
                        vertical-align: middle;\
                        padding: 5px 6px 3px;\
                        background-color: #e3e3e3;\
                        color: #333333;\
                    }\
                    td {\
                        padding: 4px 6px;\
                    }\
                    td p { align:left }\
                    table.border{\
                        border: 1px solid black;\
                    }\
                    td.borderRight{\
                        border-right: 1px solid black;\
                    }\
                    td.addressheader {\
                    font-size: 8pt;\
                    padding-top: 6px;\
                    padding-bottom: 2px;\
                    }\
                    td.totalboxtop {\
                    font-size: 12pt;\
                    background-color: #e3e3e3;\
                    }\
                    td.address {\
                    padding-top: 0px;\
                    }\
                    td.totalboxmid {\
                    font-size: 28pt;\
                    padding-top: 20px;\
                    background-color: #e3e3e3;\
                    }\
                    td.borderLeft{\
                        border-left: 1px solid black;\
                    }\
                    td.Tdborder{\
                        border-top: 1px solid black;\
                    }\
                    table#bodytbl {\
                        border-collapse: collapse;\
                        width: 100%;\
                        border: 0.5px solid #888; /* Border around the entire table */\
                    }\
                    table#bodytbl td{\
                        border: 0.5px solid #888; /* Border for table cells */\
                        padding: 8px;\
                        text-align: left;\
                    }\
                </style>\
                </head>";
            template += '<body header="nlheader" header-height="10%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
            if (recType != "invoice") {
                template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                template += '<th>Expires</th>';
                template += '<th>Exp. Close</th>';
                template += '<th>Project</th>';
                template += '<th>Sales Rep</th>';
                template += '<th>Partner</th>';
                template += '<th>Ship Method</th>';
                template += '</tr>';
                template += '<tr>';
                template += '<td>' + formateDate(duedate) + '</td>';
                template += '<td>' + formateDate(expectedclosedate) + '</td>';
                template += '<td>' + job + '</td>';
                template += '<td>' + salesrep + '</td>';
                template += '<td>' + partner + '</td>';
                template += '<td>' + shipmethod + '</td>';
                template += '</tr></table>';
            }
            //get Save Search Data
            if (recType == 'invoice') {
                var billAddress = quoteObj.getValue('billaddress');
                var shipaddress = quoteObj.getValue('shipaddress');
                var amountDue = quoteObj.getValue('amountremaining');

                template += '<table style="width: 100%; margin-top: 10px;">\
                            <tr>\
                            <td style = "width: 55%;"></td>\
                            <td style = "width: 45%; font-size: 15pt;" align="right"><b>INV# '+ tranid + '</b></td>\
                            </tr>\
                            </table>';

                template += '<table style="width: 100%; margin-top: 10px;"><tr>\
	                    <td class="addressheader" colspan="3"><b>Bill To</b></td>\
	                    <td class="addressheader" colspan="3"><b>Ship To</b></td>\
	                    <td class="totalboxtop" colspan="5"><b>Amount Due</b></td>\
	                    </tr>\
	                    <tr>\
	                    <td class="address" colspan="3" rowspan="2">'+ billAddress + '</td>\
	                    <td class="address" colspan="3" rowspan="2">'+ shipaddress + '</td>\
	                    <td align="right" class="totalboxmid" colspan="5">$'+ parseFloat(amountDue).toFixed(2) + '</td>\
	                    </tr></table>';

                var projectLabor = 0;

                var projectId = quoteObj.getValue('job');

                if (projectId) {

                    var projectRecord = record.load({
                        type: 'job',
                        id: projectId
                    });

                    projectLabor = projectRecord.getValue('chargelaboramount') || 0;

                }
                var searchResults = getInvData(recId, projectLabor);
                log.debug({
                    title: 'searchResults',
                    details: searchResults
                });

                template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                template += '<th>Part Number</th>';
                template += '<th>Quantity</th>';
                template += '<th>Item Cost</th>';
                template += '<th>Item Mark Up</th>';
                template += '<th>Item Price</th>';
                template += '<th>Ext Price</th>';
                template += '</tr>';
                var total = 0;

                if (searchResults && searchResults.length > 0) {
                    for (var m = 0; m < searchResults.length; m++) {
                        var data = searchResults[m];

                        template += '<tr>\
                                <td><b>'+ data.itemName + '</b><br /> ' + data.displayName + '</td>\
                                <td>'+ data.qty + '</td>\
                                <td>$'+ addCurrencySeparator(parseFloat(data.cost).toFixed(2)) + '</td>\
                                <td>'+ addCurrencySeparator(data.markup) + ' ' + '' + '%</td>\
                                <td>$'+ addCurrencySeparator(parseFloat(data.rate).toFixed(2)) + '</td>\
                                <td>$'+ addCurrencySeparator(parseFloat(data.amount).toFixed(2)) + '</td>\
                            </tr>';
                        total = total + parseFloat(data.amount);
                    }
                }
                template += '</table>';
                template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                template += '<td>&nbsp;</td>';
                template += '<td>&nbsp;</td>';
                template += '<td>&nbsp;</td>';
                template += '<td>&nbsp;</td>';
               // template += '<td>&nbsp;</td>';
                template += '<th><b>Total</b></th>';
                template += '<th>$' + addCurrencySeparator(total.toFixed(2)) + '</th>';
                template += '</tr>';
                template += '</table>'; 
                template += '<p style="page-break-after: always;">&nbsp;</p>';
            }
            else {
                // var searchResults = searchResultQuote();
                var searchResults = getQuoteData(recId);
                log.debug({
                    title: 'searchResults',
                    details: searchResults
                });

                // template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                // template += '<th>Name</th>';
                // template += '<th>Part Number</th>';
                // template += '<th>Quantity</th>';
                // template += '<th>Item Cost</th>';
                // template += '<th>Item Mark Up</th>';
                // template += '<th>Item Price</th>';
                // template += '<th>Ext Price</th>';
                // template += '</tr>';
                // var total = 0;

                // if (searchResults && searchResults.length > 0) {
                //     for (var m = 0; m < searchResults.length; m++) {
                //         var data = searchResults[m];

                //         template += '<tr>\
                //                 <td>'+ data.name + '</td>\
                //                 <td>'+ data.partName + '</td>\
                //                 <td>'+ data.qty + '</td>\
                //                 <td>'+ parseFloat(data.itemCost).toFixed(2) + '</td>\
                //                 <td>'+ data.itemMarkUp + '</td>\
                //                 <td>'+ parseFloat(data.itemPrice).toFixed(2) + '</td>\
                //                 <td>'+ parseFloat(data.extPrice).toFixed(2) + '</td>\
                //             </tr>';
                //         total = total + parseFloat(data.extPrice);
                //     }
                // }
                // template += '</table>';
                // template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                // template += '<td>&nbsp;</td>';
                // template += '<td>&nbsp;</td>';
                // template += '<td>&nbsp;</td>';
                // template += '<td>&nbsp;</td>';
                // template += '<td>&nbsp;</td>';
                // template += '<th><b>Total</b></th>';
                // template += '<th>$' + total.toFixed(2) + '</th>';
                // template += '</tr>';
                // template += '</table>';
                // template += '<p style="page-break-after: always;">&nbsp;</p>';
                template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                template += '<th>Part Number</th>';
                template += '<th>Quantity</th>';
                template += '<th>Item Cost</th>';
                template += '<th>Item Mark Up</th>';
                template += '<th>Item Price</th>';
                template += '<th>Ext Price</th>';
                template += '</tr>';
                var total = 0;

                if (searchResults && searchResults.length > 0) {
                    for (var m = 0; m < searchResults.length; m++) {
                        var data = searchResults[m];

                        template += '<tr>\
                                <td><b>'+ data.itemName + '</b><br /> ' + data.displayName + '</td>\
                                <td>'+ data.qty + '</td>\
                                <td>$'+ addCurrencySeparator(parseFloat(data.cost).toFixed(2)) + '</td>\
                                <td>'+ addCurrencySeparator(data.markup) + ' ' + '' + '%</td>\
                                <td>$'+ addCurrencySeparator(parseFloat(data.rate).toFixed(2)) + '</td>\
                                <td>$'+ addCurrencySeparator(parseFloat(data.amount).toFixed(2)) + '</td>\
                            </tr>';
                        total = total + parseFloat(data.amount);
                    }
                }
                template += '</table>';
                template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                template += '<td>&nbsp;</td>';
                template += '<td>&nbsp;</td>';
                template += '<td>&nbsp;</td>';
                template += '<td>&nbsp;</td>';
               // template += '<td>&nbsp;</td>';
                template += '<th><b>Total</b></th>';
                template += '<th>$' + addCurrencySeparator(total.toFixed(2)) + '</th>';
                template += '</tr>';
                template += '</table>'; 
                template += '<p style="page-break-after: always;">&nbsp;</p>';

            }
            /*   if (recType == "invoice") {
   
                   template += '<br />';
   
                   var OpenBillsforStateofMissouriResult = OpenBillsforStateofMissouriSearch();
   
                   template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                   template += '<th>Document Number</th>';
   
                   template += '<th>Status</th>';
                   template += '<th>Amount</th>';
                   template += '</tr>';
                   var totalamount = 0;
   
                   if (OpenBillsforStateofMissouriResult && OpenBillsforStateofMissouriResult.length > 0) {
                       for (var n = 0; n < OpenBillsforStateofMissouriResult.length; n++) {
                           var data1 = OpenBillsforStateofMissouriResult[n];
   
                           template += '<tr>\
                                   <td>'+ data1.tranid + '</td>\
                                   <td>'+ data1.statusref + '</td>\
                                   <td>'+ data1.amount + '</td>\
                                   </tr>';
                           totalamount = totalamount + parseFloat(data1.amount);
                       }
                   }
                   template += '</table>';
                   template += '<table class="body" style="width: 100%; margin-top: 10px;"><tr>';
                   template += '<td>&nbsp;</td>';
                   template += '<td>&nbsp;</td>';
                   template += '<td>&nbsp;</td>';
                   template += '<td>&nbsp;</td>';
                   template += '<td>&nbsp;</td>';
                   template += '<th><b>Total</b></th>';
                   template += '<th>$' + totalamount.toFixed(2) + '</th>';
                   template += '</tr>';
                   template += '</table>';
               } */

            if (recType == 'invoice') {

                var tranasactionArray = getRelatedTransaction(quoteObj);

                if (tranasactionArray.length > 0) {

                    let xmlTemplateFile = file.load(
                        "SuiteScripts/Customization/Suitelet/Bill XML Template.xml"
                    );
                    log.debug('xmlTemplateFile', xmlTemplateFile);

                    for (var i = 0; i < tranasactionArray.length; i++) {

                        var bill = tranasactionArray[i].applyingTrnsaction;

                        var documentNo = tranasactionArray[i].documentNo;

                        let renderer = render.create();

                        renderer.templateContent = xmlTemplateFile.getContents();

                        renderer.addRecord(
                            "record",
                            record.load({
                                type: 'vendorbill',
                                id: bill,
                            })
                        );
                        var pdf = renderer.renderAsString();
                        if (pdf) {
                            const bodyContent = pdf.match(/<body[^>]*>([\s\S]*?)<\/body>/);

                            if (bodyContent && bodyContent[1]) {

                                var templateContent = bodyContent[1].trim();
                                template += '<table style="width: 100%; margin-top: 10px;">\
                            <tr>\
                            <td style = "width: 55%;"></td>\
                            <td style = "width: 45%; font-size: 12pt;" align="right"><b>Vendor Bill# '+ documentNo + '</b></td>\
                            </tr>\
                            </table>';
                                template += templateContent;
                                template += '<p style="page-break-after: always;">&nbsp;</p>';
                            }
                        }

                    }
                }
            }

            template += "</body>";
            template += "</pdf>";
            template += "</pdfset>";
            var pdfFile = render.xmlToPdf({
                xmlString: template
            });
            context.response.writeFile(pdfFile, true);
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function formateDate(trandate) {
        var date = new Date(trandate);
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        var formateDate = month + '/' + day + '/' + year;
        return formateDate;
    }
    function searchResultQuote() {
        var title = 'searchResultQuote[::]';
        try {
            var obj;
            var array = [];
            var itemSearchObj = search.create({
                type: "item",
                filters:
                    [
                        ["internalid", "anyof", "44835", "45034", "45035", "46783", "49138", "52157", "56149", "56266", "57920", "63459", "110377", "242395", "252136", "45231", "246471", "204104", "45036", "54670", "59927", "44844", "52913", "70277", "202617", "78273", "78281", "44933"],
                        "AND",
                        ["transaction.type", "anyof", "SalesOrd"],
                        "AND",
                        ["transaction.status", "anyof", "SalesOrd:A", "SalesOrd:B"],
                        "AND",
                        ["transaction.shipping", "is", "F"],
                        "AND",
                        ["transaction.cogs", "is", "F"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "formulatext",
                            summary: "GROUP",
                            formula: "{manufacturer} || ' : ' || {name}",
                            label: "Name"
                        }),
                        search.createColumn({
                            name: "itemid",
                            summary: "GROUP",
                            label: "Part Number"
                        }),
                        search.createColumn({
                            name: "quantity",
                            join: "transaction",
                            summary: "SUM",
                            label: "Quantity"
                        }),
                        search.createColumn({
                            name: "rate",
                            join: "transaction",
                            summary: "AVG",
                            label: "Item Cost"
                        }),
                        search.createColumn({
                            name: "formulatext1",
                            summary: "GROUP",
                            formula: "CASE WHEN ({internalid} = '242395' OR {internalid} = '246471' OR {internalid} = '204104' ) THEN '25%' ELSE '30%' END",
                            label: "Item Mark Up"
                        }),
                        search.createColumn({
                            name: "formulanumeric",
                            summary: "MAX",
                            formula: "(AVG({transaction.rate}) * MAX(CASE WHEN {internalid} IN ('242395', '246471', '204104') THEN 0.25 ELSE 0.30 END) + AVG({transaction.rate}))",
                            label: "Item Price"
                        }),
                        search.createColumn({
                            name: "formulanumeric1",
                            summary: "SUM",
                            formula: "(AVG({transaction.rate}) * MAX(CASE WHEN {internalid} IN ('242395', '246471', '204104') THEN 0.25 ELSE 0.30 END) + AVG({transaction.rate})) * (SUM({transaction.quantity}))",
                            label: "Ext Price"
                        })
                    ]
            });
            itemSearchObj.run().each(function (result) {
                obj = {};
                obj.name = result.getValue({ name: 'formulatext', summary: 'GROUP', formula: "{manufacturer} || ' : ' || {name}" });
                obj.partName = result.getValue({ name: 'itemid', summary: 'GROUP' });
                obj.qty = result.getValue({ name: 'quantity', join: 'transaction', summary: 'SUM' });
                obj.itemCost = result.getValue({ name: 'rate', join: 'transaction', summary: 'AVG' });
                obj.itemMarkUp = result.getValue({ name: 'formulatext1', summary: 'GROUP', formula: "CASE WHEN ({internalid} = '242395' OR {internalid} = '246471' OR {internalid} = '204104' ) THEN '25%' ELSE '30%' END" });
                obj.itemPrice = result.getValue({ name: 'formulanumeric', summary: 'MAX', formula: "(AVG({transaction.rate}) * MAX(CASE WHEN {internalid} IN ('242395', '246471', '204104') THEN 0.25 ELSE 0.30 END) + AVG({transaction.rate}))" });
                obj.extPrice = result.getValue({ name: 'formulanumeric1', summary: 'SUM', formula: "(AVG({transaction.rate}) * MAX(CASE WHEN {internalid} IN ('242395', '246471', '204104') THEN 0.25 ELSE 0.30 END) + AVG({transaction.rate})) * (SUM({transaction.quantity}))" });
                array.push(obj);
                return true;
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return array || [];
    }

    function getRelatedTransaction(invObj) {

        var trasnactionArray = [];

        try {
            var salesOrder = invObj.getValue('createdfrom');

            if (salesOrder) {

                var transctionSearch = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["internalid", "anyof", salesOrder],
                            "AND",
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["applyingtransaction.type", "anyof", "PurchOrd"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "tranid",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "applyingtransaction",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "tranid",
                                join: "applyingTransaction",
                                summary: "GROUP"
                            })
                        ]
                });

                var searchResult = transctionSearch.run().getRange({ start: 0, end: 1000 });

                for (var i = 0; i < searchResult.length; i++) {

                    var applyingTrnsaction = searchResult[i].getValue({
                        name: "applyingtransaction",
                        summary: "GROUP"
                    });


                    if (applyingTrnsaction) {

                        trasnactionArray.push(applyingTrnsaction);
                    }
                }

                var billIdsArray = billFilterArray(trasnactionArray);
                log.debug('billIdsArray', billIdsArray);

                var internalIdIndex = billIdsArray.indexOf("internalid");

                var anyofIndex = billIdsArray.indexOf("anyof", internalIdIndex);

                var hasNumberAfterAnyof = billIdsArray.slice(anyofIndex + 1).some(item => !isNaN(Number(item)));

                if (hasNumberAfterAnyof) {

                    var billDataArray = getBillData(billIdsArray);
                    log.debug('billDataArray', billDataArray);

                    return billDataArray || [];
                }
            }
        }
        catch (e) {
            log.error('getRelatedTransaction Exception', e.message);
        }

        return [];
    }
    function getInvData(recId, projectLabor) {
        try {

            var invDataArray = [];

            var invSearch = search.create({
                type: "invoice",
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["internalid", "anyof", recId],
                        "AND",
                        ["item", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "itemid",
                            join: "item"
                        }),
                        search.createColumn({
                            name: "displayname",
                            join: "item"
                        }),
                        search.createColumn({
                            name: "cost",
                            join: "item"
                        }),
                        "quantity",
                        "amount",
                        "rate"
                    ]
            });

            var searchResult = invSearch.run().getRange({ start: 0, end: 1000 });


            for (var i = 0; i < searchResult.length; i++) {

                var markup = 0;

                var itemName = searchResult[i].getValue({
                    name: "itemid",
                    join: "item"
                });

                var qty = searchResult[i].getValue({
                    name: "quantity"
                });

                var amount = searchResult[i].getValue({
                    name: "amount"
                });

                var cost = searchResult[i].getValue({
                    name: "cost",
                    join: "item"
                }) || 0;

                var displayName = searchResult[i].getValue({
                    name: "displayname",
                    join: "item"
                })

                var rate = searchResult[i].getValue({
                    name: "rate",
                })

                if (!cost || cost == 0) {

                    markup = 0;
                }

                else {

                    markup = ((parseFloat(rate) - parseFloat(cost)) / parseFloat(cost)) * 100;

                    markup = markup.toFixed(2);
                }

                var extPrice = (parseFloat(amount) * (parseFloat(markup)/100)) + parseFloat(amount);

                invDataArray.push({ itemName, qty, amount, cost, markup, extPrice, displayName, rate });

            }

        }
        catch (e) {
            log.error('getInvData Exception', e.message);
        }

        return invDataArray || [];
    }

    function getQuoteData(recId) {
        try {

            var invDataArray = [];

            var invSearch = search.create({
                type: "estimate",
                filters:
                    [
                        ["type", "anyof", "Estimate"],
                        "AND",
                        ["shipping", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["internalid", "anyof", recId],
                        "AND",
                        ["item", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "itemid",
                            join: "item"
                        }),
                        search.createColumn({
                            name: "displayname",
                            join: "item"
                        }),
                        search.createColumn({
                            name: "cost",
                            join: "item"
                        }),
                        "quantity",
                        "amount",
                        "rate"
                    ]
            });

            var searchResult = invSearch.run().getRange({ start: 0, end: 1000 });


            for (var i = 0; i < searchResult.length; i++) {

                var markup = 0;

                var itemName = searchResult[i].getValue({
                    name: "itemid",
                    join: "item"
                });

                var qty = searchResult[i].getValue({
                    name: "quantity"
                });

                var amount = searchResult[i].getValue({
                    name: "amount"
                });

                var cost = searchResult[i].getValue({
                    name: "cost",
                    join: "item"
                }) || 0;

                var displayName = searchResult[i].getValue({
                    name: "displayname",
                    join: "item"
                })

                var rate = searchResult[i].getValue({
                    name: "rate",
                })

                if (!cost || cost == 0) {

                    markup = 0;
                }

                else {

                    markup = ((parseFloat(rate) - parseFloat(cost)) / parseFloat(cost)) * 100;

                    markup = markup.toFixed(2);
                }

                var extPrice = (parseFloat(amount) * (parseFloat(markup)/100)) + parseFloat(amount);

                invDataArray.push({ itemName, qty, amount, cost, markup, extPrice, displayName, rate });

            }

        }
        catch (e) {
            log.error('getQuoteData Exception', e.message);
        }

        return invDataArray || [];
    }

    function billFilterArray(searchDataArray) {
        try {
            log.debug('billFilterArray', searchDataArray);
            var intenralIdFitlers = ["internalid", "anyof"];

            for (var i = 0; i < searchDataArray.length; i++) {

                var interalId = searchDataArray[i] || '';

                if (interalId) {

                    intenralIdFitlers.push(interalId);

                }
            }

        }
        catch (e) {

            log.error('billDataArray Exception', e.message);
        }

        return intenralIdFitlers || [];
    }

    function getBillData(billIdsArray) {

        var billArray = [];

        try {

            var billSearch = search.create({
                type: "purchaseorder",
                filters:
                    [
                        ["type", "anyof", "PurchOrd"],
                        "AND",
                        ["applyingtransaction.type", "anyof", "VendBill"],
                        "AND",
                        billIdsArray
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "internalid",
                            join: "applyingTransaction",
                            summary: "GROUP"
                        }),
                        search.createColumn({
                            name: "tranid",
                            join: "applyingTransaction",
                            summary: "GROUP",
                            sort: search.Sort.ASC 
                        })
                    ]
            });

            var searchResult = billSearch.run().getRange({ start: 0, end: 1000 });

            for (var i = 0; i < searchResult.length; i++) {

                var applyingTrnsaction = searchResult[i].getValue({
                    name: "internalid",
                    join: "applyingTransaction",
                    summary: "GROUP"
                });

                var documentNo = searchResult[i].getValue({
                    name: "tranid",
                    join: "applyingTransaction",
                    summary: "GROUP",
                    sort: search.Sort.ASC 
                });

                if (applyingTrnsaction) {

                    billArray.push({ applyingTrnsaction, documentNo });
                }

            }

        }
        catch (e) {

            log.error('getBillData Exception', e.message);
        }

        return billArray || [];

    }

    function addCurrencySeparator(value) {
        try {
          if (value == 0 || value == 0.00 || !value) {
            return '0.00';
          }
          else {
            // Convert value to string and remove any negative sign
            value = parseFloat(value).toFixed(2);
            let stringValue = value.toString().replace('-', '');
            // Add commas as thousand separators
            let formattedValue = stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return formattedValue || '';
          }
        }
        catch (e) {
          return '';
        }
      }
    return {
        onRequest: onRequest
    }
});
