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
            log.debug({
                title: 'recId',
                details: recId
            });
            var searchResults = LineItemData(recId);
            log.debug({
                title: 'searchResults',
                details: searchResults
            });
            var SalesOrderOBJ = record.load({
                type: 'salesorder',
                id: parseInt(recId)
            });
            var BillTo = SalesOrderOBJ.getValue({ fieldId: 'billaddress' });
            var ShipTo = SalesOrderOBJ.getText({ fieldId: 'shipaddress' });
            var ShipMethod = SalesOrderOBJ.getText({ fieldId: 'shipmethod' });
            var orderNum = SalesOrderOBJ.getText({ fieldId: 'tranid' });
            var email = SalesOrderOBJ.getText({ fieldId: 'custbody_cust_email' });
            var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += "<pdfset>";
            //PDF 1
            template += "<pdf>";
            template += "<head>";
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
              td.borderLeft{\
                border-left: 1px solid black;\
              }\
              td.Tdborder{\
                border-top: 1px solid black;\
              }\
        </style>\
        </head>";
            template += "<body padding='0.5in 0.5in 0.5in 0.5in' size='Letter'>";
            template += "<table>\
            <tr>\
            <td>\
            <img src='http://6481478.shop.netsuite.com/core/media/media.nl?id=4450&amp;c=6481478&amp;h=cRusmfL2e3cqNP32r3rxxKAvVBlq4HgRwmhGsGtzXT52-BZH' style='width:90%; height:70%;display: inline-block'></img>\
            </td>\
            <td>&nbsp;</td>\
            <td>&nbsp;</td>\
            </tr>\
            </table>";
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 33%;'>&nbsp;</td>\
            <td style='width: 33%;'>&nbsp;</td>\
            <td style='width: 33%;'>\
            <p style='font-size: 20px;text-align: right;'><b>DELIVERY DOCKET</b></p>\
            </td>\
            </tr>\
            </table>";
            template += "<table style='text-align: right;'>\
            <tr>\
            <td>60 Mica Street</td>\
            </tr>\
            <tr>\
            <td>Carole Park QLD 4300</td>\
            </tr>\
            <tr>\
            <td>07 3800 4400</td>\
            </tr>\
            <tr>\
            <td>"+ email + "</td>\
            </tr>\
            <tr>\
            <td>ABN: 77 694 996 922</td>\
            </tr>\
            </table>";
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='background-color:lightgrey;width: 50%'>Invoice To:</td>\
            </tr>\
            <tr>\
            <td>\
            <table style='width: 50%;margin-left: -8px;'>\
            <tr>\
            <td>"+BillTo.replace(/&/g, "&amp;")+"</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 50%;'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='background-color:lightgrey;width: 50%'>Delivery Address:</td>\
            </tr>\
            <tr>\
            <td>\
            <table style='width: 50%;margin-left: -8px;'>\
            <tr>\
            <td>"+ShipTo.replace(/&/g, "&amp;")+"</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>";
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 33%;'>\
            <table>\
            <tr>\
            <td>ORDER NUMBER:</td>\
            </tr>\
            <tr>\
            <td>"+ orderNum + "</td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 33%;'>\
            <table>\
            <tr>\
            <td>SHIP VIA:</td>\
            </tr>\
            <tr>\
            <td>"+ ShipMethod + "</td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 33%;'>\
            <table>\
            <tr>\
            <td>CON NOTE #:</td>\
            </tr>\
            <tr>\
            <td>123</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>";
            template += '<table class="itemtable" style="width: 100%; margin-top: 10px;">\
                <tr style="padding-top:3mm;padding-bottom:3mm;margin:0;">\
                <th class="left" colspan="2"><p class="left " style="letter-spacing:0.50;"><b>QTY</b></p></th>\
                <th class="left" colspan="5"><p class="left " style="letter-spacing:0.50;"><b>ITEM CODE</b></p></th>\
                <th class="center" colspan="12"><p class="left " style="letter-spacing:0.50;"><b>DESCRIPTION</b></p></th>\
                <th class="center" colspan="6"><p class="left " style="letter-spacing:0.50;"><b>Bin Location</b></p></th>\
                </tr>';
            for (var i = 0; i < searchResults.length; i++) {
                var resultOBJ = searchResults[i];
                var dec = resultOBJ.itemDes;
                var description = dec.replace(/&/g, "&amp;");
                template += '<tr>\
                    <td class="left" colspan="2"><p>'+ resultOBJ.quantity + '</p></td>\
                    <td class="left" colspan="5"><p>'+ resultOBJ.itemName + '</p></td>\
                    <td class="left" colspan="12"><p>'+ description + '</p></td>\
                    <td class="left" colspan="6"><p>N/A</p></td>\
                    </tr>';
            }
            template += '</table>';
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>PACKED BY:</td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 50%;'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>RECEIVED BY:</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>";
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>NAME:________________________________________</td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 50%;'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>NAME:________________________________________</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>";
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>SIGN:________________________________________</td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 50%;'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>SIGN:________________________________________</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>";
            template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>DATE:________________________________________</td>\
            </tr>\
            </table>\
            </td>\
            <td style='width: 50%;'>\
            <table style='width: 100%;'>\
            <tr>\
            <td style='width: 50%'>DATE:________________________________________</td>\
            </tr>\
            </table>\
            </td>\
            </tr>\
            </table>";
            template += "</body>";
            template += "</pdf>";
            template += "</pdfset>";
            //Using "N/render" Module to Generate PDF
            var pdfFile = render.xmlToPdf({
                xmlString: template
            });
            response.writeFile(pdfFile, true);
        }
        function LineItemData(id) {
            var title = 'LineItemData(::)';
            try {
                var array = [];
                var obj;
                var SalesOrderOBJ = record.load({
                    type: 'salesorder',
                    id: parseInt(id)
                });
                var lineCount = SalesOrderOBJ.getLineCount({
                    sublistId: 'item'
                });
                for (var i = 0; i < lineCount; i++) {
                    obj = {};
                    obj.itemName = SalesOrderOBJ.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    obj.itemDes = SalesOrderOBJ.getSublistText({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    });
                    obj.quantity = SalesOrderOBJ.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    });
                    array.push(obj);
                }
                return array || [];
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }

        }
        return {
            onRequest: onRequest
        };
    });