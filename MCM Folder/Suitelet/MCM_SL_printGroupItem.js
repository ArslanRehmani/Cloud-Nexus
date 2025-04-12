/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// eslint-disable-next-line no-undef
define(['N/render', 'N/search', 'N/log', 'N/record', 'N/config'],
    function (render, search, log, record, config) {
        function onRequest(context) {
            var title = " onRequest() ";
            var response = context.response;
            var params = context.request.parameters;
            var recId = params.id;
            log.debug(title + "Recid ->", recId);
            var searchResults = quoteObjFunction(recId);
            var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += "<pdfset>";
            //PDF 1
            template += "<pdf>";
            template += "<head>";
            template += '<macrolist>';
            template += '<macro id="nlheader">';
            template += '<table  style="width:100%;" table-layout="fixed"><tr>\
                <td colspan="10" class="left" style=""><p class="left " style="font-size:15pt;padding-top:2.5mm;">'+ searchResults.entity + '</p></td>\
                <td colspan="10">&nbsp;</td>\
                <td colspan="7"  class="right" style="valign:top;padding: 2mm 0 0mm 0"  rowspan="3"><img src="https://5679695.app.netsuite.com/core/media/media.nl?id=446641&amp;c=5679695&amp;h=7Uq7gkNsQRcfz7Y8X1TTGyxFpHp3unmA87LV6qV_V4_-DKhQ" style="width:10%; height:10%;display: inline-block;"></img></td>\
                </tr>\
                <tr>\
                <td colspan = "10" class="left" style = "" > <p class="left light" style="font-size:7pt;">T. '+ searchResults.contect + '</p></td >\
                </tr >\
                <tr>\
                <td colspan="10" class="left" style=""><p class="left light" style="font-size:7pt;">'+ searchResults.custEmail + '</p></td>\
                </tr>';
            if (searchResults.projectOnInvoive) {
                template += '<tr style="margin-top:1mm">\
                <td colspan="10" class="left" style=""><p class="left " style="font-size:6pt;"><b>PROJECT</b></p></td>\
                <td colspan="7"/>\
                </tr>\
                <tr style="margin-top:0.5mm">\
                <td colspan="10" class="left" style=""><p class="left light" style="font-size:7pt;">'+ searchResults.projectOnInvoive + '</p></td>\
                <td colspan="7"/>\
                </tr>';
            }
            template += '<tr style="margin-top:5mm;" rowspan = "4">\
                <!-- Secondary Block - tables -->\
                <td colspan="6" class="left" style="width:33%;">\
                <p class="left " style="font-size:6;"><b>DELIVERY TO</b></p>\
                <p class="left light" style="font-size:7;margin-top:0.5mm;line-height:125%">'+ searchResults.shipaddress + '</p>\
                </td>\
                <td colspan="6" class="left" style="width:33%;">\
                <p class="left " style="font-size:6;">&nbsp;</p>\
                <p class="left light" style="font-size:7;margin-top:0.5mm;line-height:125%">&nbsp;</p>\
                </td>\
                <td colspan="6" class="left" style="width:33%;">\
                <p class="left " style="font-size:6;"><b>INVOICE TO</b></p>\
                <p class="left light" style="font-size:7;margin-top:0.5mm;line-height:125%">'+ searchResults.billaddress + '</p>\
                </td>\
                <td colspan="5" class="left" style="width:33%;">\
                <p class="left " style="font-size:6;">&nbsp;</p>\
                <p class="left light" style="font-size:7;margin-top:0.5mm;line-height:125%">&nbsp;</p>\
                </td>\
                <td colspan="5" class="left" padding-left="3mm" style="width:33%;">\
                <p class="left " style="font-size:6;"><b>CONSULTANT</b></p>\
                <p class="left light" style="font-size:7;margin-top:0.5mm;line-height:125%;">'+ searchResults.salesrep + '\
                <br/>'+ searchResults.empEmail + '\
                <br/>'+ searchResults.empContact + ' <br/>' + searchResults.empLocation + '</p>\
                </td>\
                </tr>\
                <tr style="margin-top:5mm;">\
                <td colspan="12" class="left">\
                <p class="left " style="font-size:6;">QUOTE/DATE</p>\
                <p class="left " style="font-size:15;margin:0;padding:2mm 0 0 0;">Quote # '+ searchResults.tranid + '</p>\
                <p class="left light" style="font-size:7;margin:0;padding:2mm 0 0 0;">'+ searchResults.trandate + '</p>\
                </td>\
                </tr>';
            template += '</table > ';
            template += '</macro>';
            template += '<macro id="nlfooter">';
            template += '<table style="width:100%;border-top:0.5px solid black;">\
                <tr style="">\
                <td class="left" style="padding:3mm 0 0 0;line-height:150%;"  colspan="9"><p class="left "  style="font-size:5pt">10 OXFORD ST, PADDINGTON, NSW 2021<br/>ABN 83 167 988 187</p></td>\
                <td class="left" style="padding:3mm 0 0 0;"  colspan="5" ><p class="right " style="font-size:5pt;">T. 1300 997 975 | MCMHOUSE.COM</p></td>\
                <td class="right" style="padding:3mm 0 0 0;"  colspan="3" ><p class="right " style="font-size:5pt;">PAGE <pagenumber/> OF <totalpages/></p></td>\
                </tr>\
                </table>';
            template += '</macro>';
            template += '</macrolist>';
            template += '</head>';
            template += "<body header='nlheader' header-height='27%' footer='nlfooter' footer-height='1.5%' padding='0.5in 0.5in 0.5in 0.5in' size='A4'>";
            template += '<table class="itemtable" style="width: 100%; margin-top: 10px;">\
                <tr style="padding-top:3mm;padding-bottom:3mm;margin:0">\
                <th class="left" colspan="8"><p class="left " style="font-size:6;letter-spacing:0.50;"><b>PRODUCT</b></p></th>\
                <th class="left" colspan="8"><p class="left " style="font-size:6;letter-spacing:0.50;"><b>DESCRIPTION</b></p></th>\
                <th class="center" colspan="3"><p class="center " style="font-size:6;letter-spacing:0.50;"><b>RRP</b></p></th>\
                <th class="center" colspan="2"><p class="center " style="font-size:6;letter-spacing:0.50;"><b>QTY</b></p></th>\
                <th class="right" colspan="2"><p class="right " style="font-size:6;letter-spacing:0.50;"><b>TOTAL</b></p></th>\
                </tr>';
            var discountItem = 0;
            var totalAmount = 0;
            var totalAmountFinal = 0;
            for (var j = 0; j < searchResults.item.length; j++) {
                var item = searchResults.item[j];
                var disCount = item.item;
                if (item.total) {
                    totalAmount += item.total;
                    totalAmountFinal += item.total;
                }
                if (item.itemType == 'Discount') {
                    var dis = disCount.slice(0, 2);
                    var discountnt = parseInt(dis);
                    discountItem += (totalAmount * discountnt) / 100;
                    totalAmount = 0;
                }
            }
            var totalDiscountedAmount = parseFloat(totalAmountFinal - discountItem).toFixed(2);
            for (var i = 0; i < searchResults.item.length; i++) {
                var item = searchResults['item'][i];
                if (item.itemType != 'Discount') {
                    template += '<tr>';
                    var description1 = item.description;
                    var descriptionAND = description1.replace("&", "&amp;");
                    var ImageUrl = item.imgUrl;
                    var imgurl = ImageUrl.replace('&', '&amp;');
                    var img = imgurl.replace('&h', '&amp;h');
                    if (item.imgUrl) {
                        template += '<td class="left" colspan="8"><img style="width:90px;height:90px;" src="' + img + '"/></td>';
                    } else {
                        template += '<td class="left" colspan="8">&nbsp;</td>';
                    }
                    template += '<td class="left" colspan="8">' + descriptionAND + '<br /><p style="font-size:7;">SKU:' + item.sku + '</p><br /><p style="font-size:7;">' + item.productcolor + '</p><p style="font-size:7; margin-top: 3%;">' + item.dims + '</p></td>\
                            <td class="center" colspan="3"><p class="center " style="font-size:9pt;padding-top:0mm;">'+ item.rrp + '</p></td>\
                            <td class="center" colspan="2" ><p class="center " style="font-size:9pt;padding-top:0mm;">'+ item.qty + '</p></td>\
                            <td class="right" colspan="2" ><p class="right " style="font-size:9pt;padding-top:0mm;">'+ item.total1 + '</p></td>\
                            </tr>';
                }
            }
            if (!!discountItem) {
                template += '<tr><td class="left" colspan="8">Discount</td>\
                    <td class="left" colspan="8">&nbsp;</td>\
                    <td class="center" colspan="3">\
                    <p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p>\
                    </td>\
                    <td class="center" colspan="2" ><p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p></td>\
                    <td class="right" colspan="2" ><p class="right " style="font-size:9pt;padding-top:0mm;">'+ discountItem + '</p></td>\
                    </tr>';
            }
            // if (!!totalAmountFinal) {
            //     template += '<tr><td class="left" colspan="8">Total Disconted Amount</td>\
            //         <td class="left" colspan="8">&nbsp;</td>\
            //         <td class="center" colspan="3">\
            //         <p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p>\
            //         </td>\
            //         <td class="center" colspan="2" ><p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p></td>\
            //         <td class="right" colspan="2" ><p class="right " style="font-size:9pt;padding-top:0mm;">'+ totalDiscountedAmount + '</p></td>\
            //         </tr>';
            // }
            template += '</table>';
            var totalINCL = (((searchResults.subTotal)* 1.1) + searchResults.shippingCost).toFixed(2);
            template += '<div style="padding:0;margin:0">\
                <table style="width:100%;margin-top:2mm">\
                <tr>\
                <td colspan="16" style="width:50%;">\
                <table style="width:100%;margin-top:0mm">\
                <tr>\
                <td class="left" style="margin:0 4mm 0 0;padding: 2mm 0 0 0;border-top: 1px solid;"><p class="left" style="font-size:7pt;">'+ searchResults.memoInvoice + '</p></td>\
                </tr>\
                </table>\
                </td>\
                <td colspan="8" style="width:50%;border-top: 1px solid;">\
                <table style="width:100%;margin-top:0mm">';
            // <tr>\
            // <td><p style="font-size:7pt;"><b>CURRENCY</b></p></td>\
            // <td><p  style="font-size:7pt;">'+ searchResults.currency + '</p></td>\
            // </tr>\
            // <tr>\
            // <td><p style="font-size:7pt;"><b>SUBTOTAL</b></p></td>\
            // <td><p style="font-size:7pt;">$ ' + totalDiscountedAmount + '</p></td>\
            // </tr>\
            template += '<tr>\
                <td><p style="font-size:7pt;"><b>SUBTOTAL</b></p></td>\
                <td><p style="font-size:7pt;">$ ' + ((searchResults.subTotal) * 1.1).toFixed(2) + '</p></td>\
                </tr>';
            // <tr>\
            // <td><p style="font-size:7pt;"><b>DISCOUNT</b></p></td>\
            // <td><p style="font-size:7pt;">$ '+ discountItem + '</p></td>\
            // </tr>\
            template += '<tr>\
                <td><p style="font-size:7pt;"><b>SHIPPING Inc GST <br />(STANDARD DELIVERY)</b></p></td>\
                <td><p style="font-size:7pt;">$ ' + searchResults.shippingCost + '</p></td>\
                </tr>\
                <tr>\
                <td><p style="font-size:7pt;"><b>GST INCLUDED in <br /> Total</b></p></td>\
                <td><p style="font-size:7pt;">$ ' + searchResults.taxtotal + '</p></td>\
                </tr>';
            // <tr>\
            // <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>TOTAL INCL GST</b></p></td>\
            // <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + totalINCL + '</b></p></td>\
            // </tr>\
            template += '<tr>\
                <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>TOTAL INCL GST</b></p></td>\
                <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + totalINCL + '</b></p></td>\
                </tr>\
                <tr>\
                <td><p style="font-size:7pt;"><b>TERMS</b></p></td>\
                <td><p style="font-size:7pt;">'+ searchResults.terms + '</p></td>\
                </tr>';
            // <tr>\
            // <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>DEPOSIT REQ.</b></p></td>\
            // <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + totalINCL / 2 + '</b></p></td>\
            // </tr>\
            template += '<tr>\
                <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>DEPOSIT REQ.</b></p></td>\
                <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + totalINCL / 2 + '</b></p></td>\
                </tr>\
                </table>\
                </td>\
                </tr>\
                </table>\
                </div>';
            template += '<div id="terms">\
                <table style="width:100%;margin-top:4mm">\
                <tr>\
                <td colspan="16" class="left btop suprememedium" style="margin:0 4mm 0 0;padding: 2mm 0 0 0;width:65%;border-top: 1px solid;"><p class="left supremebold track100" style="font-size:5pt;"><b>TERMS &amp; CONDITIONS</b></p></td>\
                <td colspan="8" class="left btop suprememedium" style="margin:0 0 0 0;padding: 2mm 0 0 0;width:35%;border-top: 1px solid;"><p class="left supremebold track100" style="font-size:5pt;"><b>PAYMENT DETAILS</b></p></td>\
                </tr>\
                <tr>\
                <td colspan="8" class="left" style="margin:0;padding:2mm 3mm 0 0;width:65%;">\
                <p class="left supremelight" style="font-size:5pt;margin:0;padding:0;">Terms and Conditions <a href="https://www.mcmhouse.com/pages/terms-and-conditons" target="_blank">Click Here</a> for more information.</p>\
                <p class="left supremelight" style="font-size:5pt;padding:0;margin:2mm 0 1mm 0;">Returns / Warranty <a href="https://www.mcmhouse.com/pages/product-care-maintainance" target="_blank">Click here</a> for more information</p>\
                </td>\
                <td colspan="8" class="left" style="margin:0;padding:2mm 3mm 0 0">&nbsp;</td>\
                <td colspan="8" class="left" style="margin:0;padding:0 0 0 0;width:35%;">\
                <table style="width:100%;margin:0;padding:0">\
                <tr><td colspan="10" class="left" style="margin-top:2mm"><p class="left supremebold track100" style="font-size:7pt;line-height:120%;"><a href="'+(searchResults.clickHereToPay).replace(/&/g, "&amp;")+'" target="_blank" style="color:blue">Click here to Pay</a></p></td></tr>\
                <tr><td colspan="10" class="left" style="margin-top:2mm"><p class="left supremebold track100" style="font-size:7pt;line-height:120%;"><b>CREDIT CARD</b></p></td></tr>\
                <tr><td colspan="10" class="left" style="font-size:7pt;"><p class="left supremelight">MCM House accepts all major credit cards. Please contact your consultant to make payment via our online payment portal or over the phone.</p></td></tr>\
                <tr><td colspan="10" class="left" style="font-size:7pt;"><p class="left supremelight">Please email your remittance advice to accounts@mcmhouse.com</p></td></tr>\
                </table>\
                </td>\
                </tr>\
            </table>\
            </div>';
            template += '<table style="width:100%;margin-top:4mm">\
            <tr>\
            <td style="width:20%;">&nbsp;</td>\
            <td style="width:60%;font-size:7pt;"><p class="left supremelight">"To confirm your order please contact your MCM House Sales Person"</p></td>\
            <td style="width:20%;">&nbsp;</td>\
            </tr>\
            </table>';
            template += "</body>";
            template += "</pdf>";
            template += "</pdfset>";
            //Using "N/render" Module to Generate PDF
            var pdfFile = render.xmlToPdf({
                xmlString: template
            });
            response.writeFile(pdfFile, true);
        }
        function quoteObjFunction(recId) {
            var title = 'quoteObjFunction(::)';
            var resultsObj = {
                item: []
            }
            try {
                var quoteObj = record.load({
                    type: 'estimate',
                    id: parseInt(recId)
                });
                resultsObj.entity = quoteObj.getText({ fieldId: 'entity' });
                resultsObj.clickHereToPay = quoteObj.getValue({ fieldId: 'custbody_custom_payment_link' });
                resultsObj.tranid = quoteObj.getText({ fieldId: 'tranid' });
                resultsObj.trandate = quoteObj.getText({ fieldId: 'trandate' });
                resultsObj.projectOnInvoive = quoteObj.getText({ fieldId: 'custbody_project_name' });
                resultsObj.shipaddress = quoteObj.getText({ fieldId: 'shipaddress' });
                resultsObj.billaddress = quoteObj.getText({ fieldId: 'billaddress' });
                resultsObj.salesrep = quoteObj.getText({ fieldId: 'salesrep' });
                var salesRepID = quoteObj.getValue({ fieldId: 'salesrep' });
                resultsObj.memoInvoice = quoteObj.getValue({ fieldId: 'custbody_memo_invoice' });
                resultsObj.currency = quoteObj.getText({ fieldId: 'currency' });
                resultsObj.subTotal = quoteObj.getValue({ fieldId: 'subtotal' });
                resultsObj.discounttotal = quoteObj.getValue({ fieldId: 'discounttotal' });
                resultsObj.shippingCost = quoteObj.getValue({ fieldId: 'custbody_shipping_cost_inc_gst' });
                resultsObj.taxtotal = quoteObj.getValue({ fieldId: 'taxtotal' });
                var total = quoteObj.getValue({ fieldId: 'total' });
                resultsObj.terms = quoteObj.getText({ fieldId: 'terms' });
                var amountPaid = quoteObj.getValue({ fieldId: 'custbody_so_amount_paid' });
                var depositAmount = quoteObj.getValue({ fieldId: 'custbody_sp_deposit_amount' });
                var DepositeAmt = parseInt(amountPaid) - parseInt(depositAmount);
                resultsObj.depositAmountToPrecision = DepositeAmt.toPrecision(2);
                resultsObj.BalanceDue = total;
                var employeeObj = record.load({
                    type: 'employee',
                    id: salesRepID
                });
                resultsObj.empEmail = employeeObj.getValue({ fieldId: 'email' });
                var empPhone = employeeObj.getValue({ fieldId: 'phone' });
                resultsObj.empLocation = employeeObj.getText({ fieldId: 'location' });
                var empMobilePhone = employeeObj.getValue({ fieldId: 'mobilephone' });
                if (empPhone) {
                    resultsObj.empContact = empPhone;
                } else {
                    resultsObj.empContact = empMobilePhone;
                }
                var entityID = quoteObj.getValue({ fieldId: 'entity' });
                var customerObj = record.load({
                    type: 'customer',
                    id: entityID
                });
                var custMobilePhone = customerObj.getValue({ fieldId: 'mobilephone' });
                var custPhone = customerObj.getValue({ fieldId: 'phone' });
                if (custMobilePhone) {
                    resultsObj.contect = custMobilePhone;
                } else {
                    resultsObj.contect = custPhone;
                }
                resultsObj.custEmail = customerObj.getValue({ fieldId: 'email' });
                resultsObj.item = searchData(recId);
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return resultsObj || {};
        }
        function searchData(recId) {
            var title = 'searchData(::)';
            var groupItemArray = [];
            var obj;
            try {
                var quoteID = recId.toString();
                var quoteSearchObj = search.create({
                    type: "estimate",
                    filters:
                        [
                            ["type", "anyof", "Estimate"],
                            "AND",
                            ["internalid", "anyof", quoteID],
                            "AND",
                            ["quantity", "isnotempty", ""],
                            "AND",
                            ["item.description", "isnot", "MK-DT-STD"],
                            "AND",
                            ["item.description", "isnot", "GST on Sales"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "item", label: "Item" }),
                            search.createColumn({ name: "quantity", label: "Quantity" }),
                            search.createColumn({ name: "custcol_rrpincl_total", label: "Total RRP" }),
                            search.createColumn({ name: "custcol_rrpincl", label: "RRP" }),
                            search.createColumn({ name: "custcol_print_item_code", label: "Print Item Code" }),
                            search.createColumn({ name: "custcol_item_dims_sales_order", label: "Item Dims - Sales Order" }),
                            search.createColumn({
                                name: "type",
                                join: "item",
                                label: "Type"
                            }),
                            search.createColumn({ name: "custcol_ext_img_url", label: "Img URL" }),
                            search.createColumn({ name: "custcol_product_colour_quote", label: "Product Colour" }),
                            search.createColumn({
                                name: "salesdescription",
                                join: "item",
                                label: "Description"
                            })
                        ]
                });
                quoteSearchObj.run().each(function (result) {
                    obj = {};
                    obj.item = result.getText({ name: 'item' });
                    obj.qty = result.getValue({ name: 'quantity' });
                    obj.total = parseFloat(result.getValue({ name: 'custcol_rrpincl_total' }));
                    obj.total1 = result.getValue({ name: 'custcol_rrpincl_total' });
                    obj.rrp = result.getValue({ name: 'custcol_rrpincl' });
                    obj.sku = result.getValue({ name: 'custcol_print_item_code' });
                    obj.dims = result.getValue({ name: 'custcol_item_dims_sales_order' });
                    obj.imgUrl = result.getValue({ name: 'custcol_ext_img_url' });
                    obj.productcolor = result.getValue({ name: 'custcol_product_colour_quote' });
                    obj.itemType = result.getValue({ name: 'type', join: 'item' });
                    obj.description = result.getValue({ name: 'salesdescription', join: 'item' });
                    groupItemArray.push(obj);
                    return true;
                });
                log.debug({
                    title: 'groupItemArray',
                    details: groupItemArray
                });
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return groupItemArray || [];
        }
        return {
            onRequest: onRequest
        };
    });