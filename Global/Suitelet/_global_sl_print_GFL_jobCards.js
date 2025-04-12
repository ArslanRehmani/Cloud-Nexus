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
            var GFLRecOBJ, Type, phone, date, billToGFL, billToGFLYesNo, warranty, warrantyYesNo, ID,
                Name, SalesOrderText, caseId, salesOrderID, salesOrderObj, reference, searchResults;
            GFLRecOBJ = record.load({
                type: 'customrecord_gfl_job_card',
                id: parseInt(recId)
            });
            Type = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_type' });
            phone = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_phone' });
            date = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_date' });
            billToGFL = GFLRecOBJ.getText({ fieldId: 'custrecord_bill_to_gfl' });
            billToGFLYesNo;
            if (billToGFL == 'F') {
                billToGFLYesNo = 'NO';
            } else {
                billToGFLYesNo = 'Yes';
            }
            warranty = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_warranty' });
            warrantyYesNo;
            if (warranty == 'F') {
                warrantyYesNo = 'NO';
            } else {
                warrantyYesNo = 'Yes';
            }
            ID = GFLRecOBJ.getValue({ fieldId: 'name' });
            Name = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_customer' });
            SalesOrderText = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_sales' });
            caseId = GFLRecOBJ.getText({ fieldId: 'custrecord_gfl_job_card_case' });
            salesOrderID = GFLRecOBJ.getValue({ fieldId: 'custrecord_gfl_job_card_sales' });
            if (salesOrderID) {
                salesOrderObj = record.load({
                    type: 'salesorder',
                    id: parseInt(salesOrderID)
                });
                reference = search.lookupFields({
                    type: search.Type.SALES_ORDER,
                    id: parseInt(salesOrderID),
                    columns: ['custbody1']
                }).custbody1;
            }

            var lineCount = GFLRecOBJ.getLineCount({
                sublistId: 'recmachcustrecord_glf_job_card_link'
            });
            // if (Type == 'Assembly') {
                var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                template += "<pdfset>";
                //PDF 1
                template += "<pdf>";
                template += "<head>";
                template += "\
                <macrolist>\
                    <macro id='nlheader'>\
                        <table style='width:100%;'>\
                        <tr>\
                        <td style='width:33%;'>\
                        <img src='https://1117015-sb1.app.netsuite.com/core/media/media.nl?id=1670478&amp;c=&amp;h=6Nz9T2MUQtf8WYzFPhaxiXql1PyG9Fmfo8YJvPN1L06wF326' style='width:50%; height:50%;display: inline-block'></img>\
                        </td>\
                        <td style='width:33%;'>&nbsp;</td>\
                        <td style='width:33%;'>&nbsp;</td>\
                        </tr>\
                        </table>\
                    </macro >\
                    <macro id='nlfooter'>\
                        <table class='footer' style='width: 100%;'><tr>\
                        <td align='right'><pagenumber/> of <totalpages/></td>\
                        </tr></table>\
                    </macro>\
                </macrolist>";
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
                template += '<body header="nlheader" header-height="8%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
                template += '<table style="width: 100%">\
                <tr>\
                <td style="width:33%;">&nbsp;</td>\
                <td style="width: 33%;font-size: 16px;"><b>Assembly Job Request</b></td>\
                <td style="width:33%;">&nbsp;</td>\
                </tr>\
                </table>';
                template += '<table>\
                <tr>\
                <td style="font-size: 16px;"><b>Procedure</b></td>\
                </tr>\
                </table>';
                template += '<table>\
                <tr>\
                <td style="font-size: 12px;">The standard assembly procedure to be followed by GFL and the Repairer is as follows:</td>\
                </tr>\
                </table>';
                template += "<p style='font-size: 12px; margin-left: 30px;'>1. GFL receives customer request for assembly and pick up at the nominated Repairer.</p>";
                template += "<p style='font-size: 12px; margin-left: 30px;'>2. GFL dispatches the bicycle to the Repairer.</p>";
                template += "<p style='font-size: 12px; margin-left: 30px;'>3. GFL informs Repairer via email of the upcoming assembly job and provides customer contact information.</p>";
                template += "<p style='font-size: 12px; margin-left: 30px;'>4. Repairer receives the bicycle and contacts the customer to book in suitable time and date for this pick up.</p>";
                template += "<p style='font-size: 12px; margin-left: 30px;'>5. Repairer assembly the bicycle after contact is made with the customer.</p>";
                template += "<p style='font-size: 12px; margin-left: 30px;'>6. Repairer invoices GFL for the completed job after the pickup is completed.</p>";
                template += '<table>\
                <tr>\
                <td style="font-size: 16px;"><b>Cancellation Policy</b></td>\
                </tr>\
                </table>';
                template += '<table>\
                <tr>\
                <td style="font-size: 12px;">Where a customer fails to pick up their bike from the Repairer within 4 weeks after it has been delivered for assembly, GFL will organise the return of the bike to GFL.</td>\
                </tr>\
                </table>';
                template += '<table>\
                <tr>\
                <td style="font-size: 16px;"><b>Billing to GFL</b></td>\
                </tr>\
                </table>';
                template += '<table>\
                <tr>\
                <td style="font-size: 12px;">Once pick up has been conducted, invoices can be emailed to accountspayable@gflgroup.com.au</td>\
                </tr>\
                </table>';
                template +='<p style="page-break-after: always;">&nbsp;</p>';
                template += '<table>\
                <tr>\
                <td style="font-size: 16px;">Customer Order Summary </td>\
                </tr>\
                </table>';
                template += '<table id= "bodytbl" border="1">\
                    <tr>\
                        <td>ID</td>\
                        <td>'+ ID + '</td>\
                        <td>NAME</td>\
                        <td>'+ Name + '</td>\
                    </tr>\
                    <tr>\
                        <td>TYPE</td>\
                        <td>'+ Type + '</td>\
                        <td>PHONE</td>\
                        <td>'+ phone + '</td>\
                    </tr>\
                    <tr>\
                        <td>DATE</td>\
                        <td>'+ date + '</td>\
                        <td>WARRANTY</td>\
                        <td>'+ warrantyYesNo + '</td>\
                    </tr>\
                    <tr>\
                        <td>SALES ORDER</td>\
                        <td>'+ SalesOrderText + '</td>\
                        <td>CASE ID</td>\
                        <td>'+ caseId + '</td>\
                    </tr>\
                    <tr>\
                        <td>REFERENCE</td>\
                        <td>'+ reference + '</td>\
                        <td>BILL TO GFL</td>\
                        <td>'+ billToGFLYesNo + '</td>\
                    </tr>\
                </table>';
                template += '<table>\
                <tr>\
                <td>&nbsp;</td>\
                </tr>\
                <tr>\
                <td style="font-size: 16px;">Items</td>\
                </tr>\
                </table>';
                template += '<table id= "bodytbl" border="1">\
                    <tr>\
                        <td>SKU</td>\
                        <td>Description</td>\
                        <td>Qty</td>\
                        <td>Scope of Works</td>\
                    </tr>';
                if (lineCount && lineCount > 0) {
                    for (var i = 0; i <= lineCount - 1 ; i++) {
                        var ScopeOfWorks = '';
                        var description = GFLRecOBJ.getSublistValue({
                            sublistId: 'recmachcustrecord_glf_job_card_link',
                            fieldId: 'custrecord_glf_item_description',
                            line: i
                        });
                        var itemName = GFLRecOBJ.getSublistValue({
                            sublistId: 'recmachcustrecord_glf_job_card_link',
                            fieldId: 'custrecord_item_id_display',
                            line: i
                        });
                        var quantity = GFLRecOBJ.getSublistValue({
                            sublistId: 'recmachcustrecord_glf_job_card_link',
                            fieldId: 'custrecord_gfl_job_card_item_quantity',
                            line: i
                        });
                        var assemblyHour = GFLRecOBJ.getSublistValue({
                            sublistId: 'recmachcustrecord_glf_job_card_link',
                            fieldId: 'custrecord_gfl_job_card_sow',
                            line: i
                        });
                        if (assemblyHour !== '') {
                            var x = parseInt(assemblyHour);
                            if (x <= 0.7) {
                                ScopeOfWorks = 'Standard Bike Assembly';
                            } else if (0.7 < x <= 0.9) {
                                ScopeOfWorks = 'Electric Bike Assembly';
                            } else if (0.9 < x <= 1.5) {
                                ScopeOfWorks = 'E-Trike/Trike Assembly';
                            }
                        } else {
                            ScopeOfWorks = 'Standard Bike Assembly';
                        }
                        template += '<tr>\
                                <td>'+ itemName.replace(/&/g, '&amp;') + '</td>\
                                <td>'+ description + '</td>\
                                <td>'+ quantity + '</td>\
                                <td>'+ ScopeOfWorks + '</td>\
                            </tr>';
                    }
                } 
                template += '</table>';
                template += "</body>";
                template += "</pdf>";
                template += "</pdfset>";
            // } 
            // else if (Type == 'Service') {
            //     var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            //     template += "<pdfset>";
            //     //PDF 1
            //     template += "<pdf>";
            //     template += "<head>";
            //     template += "\
            //     <macrolist>\
            //         <macro id='nlheader'>\
            //             <table style='width:100%;'>\
            //             <tr>\
            //             <td style='width:33%;'>\
            //             <img src='https://1117015-sb1.app.netsuite.com/core/media/media.nl?id=1670478&amp;c=&amp;h=6Nz9T2MUQtf8WYzFPhaxiXql1PyG9Fmfo8YJvPN1L06wF326' style='width:50%; height:50%;display: inline-block'></img>\
            //             </td>\
            //             <td style='width:33%;'>&nbsp;</td>\
            //             <td style='width:33%;'>&nbsp;</td>\
            //             </tr>\
            //             </table>\
            //         </macro >\
            //         <macro id='nlfooter'>\
            //             <table class='footer' style='width: 100%;'><tr>\
            //             <td align='right'><pagenumber/> of <totalpages/></td>\
            //             </tr></table>\
            //         </macro>\
            //     </macrolist>";
            //     template += "<link name='NotoSans' type='font' subtype='truetype' src='${nsfont.NotoSans_Regular}' src-bold='${nsfont.NotoSans_Bold}' src-italic='${nsfont.NotoSans_Italic}' src-bolditalic='${nsfont.NotoSans_BoldItalic}' bytes='2' />\
            //     <style>\
            //         table {\
            //         font-size: 9pt;\
            //         table-layout: fixed;\
            //         }\
            //         th {\
            //             font-weight: bold;\
            //             font-size: 8pt;\
            //             vertical-align: middle;\
            //             padding: 5px 6px 3px;\
            //             background-color: #e3e3e3;\
            //             color: #333333;\
            //         }\
            //         td {\
            //             padding: 4px 6px;\
            //         }\
            //         td p { align:left }\
            //         table.border{\
            //             border: 1px solid black;\
            //         }\
            //         td.borderRight{\
            //             border-right: 1px solid black;\
            //         }\
            //         td.borderLeft{\
            //             border-left: 1px solid black;\
            //         }\
            //         td.Tdborder{\
            //             border-top: 1px solid black;\
            //         }\
            //         table#bodytbl {\
            //             border-collapse: collapse;\
            //             width: 100%;\
            //             border: 0.5px solid #888; /* Border around the entire table */\
            //         }\
            //         table#bodytbl td{\
            //             border: 0.5px solid #888; /* Border for table cells */\
            //             padding: 8px;\
            //             text-align: left;\
            //         }\
            //     </style>\
            //     </head>";
            //     template += '<body header="nlheader" header-height="8%" footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
            //     template += '<table style="width: 100%">\
            //     <tr>\
            //     <td style="width:33%;">&nbsp;</td>\
            //     <td style="width: 33%;font-size: 16px;"><b>Service Job Request</b></td>\
            //     <td style="width:33%;">&nbsp;</td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 16px;">Customer Order Summary</td>\
            //     </tr>\
            //     </table>';
            //     template += '<table id= "bodytbl" border="1">\
            //         <tr>\
            //             <td>ID</td>\
            //             <td>'+ ID + '</td>\
            //             <td>NAME</td>\
            //             <td>'+ Name + '</td>\
            //         </tr>\
            //         <tr>\
            //             <td>TYPE</td>\
            //             <td>'+ Type + '</td>\
            //             <td>PHONE</td>\
            //             <td>'+ phone + '</td>\
            //         </tr>\
            //         <tr>\
            //             <td>DATE</td>\
            //             <td>'+ date + '</td>\
            //             <td>WARRANTY</td>\
            //             <td>'+ warrantyYesNo + '</td>\
            //         </tr>\
            //         <tr>\
            //             <td>SALES ORDER</td>\
            //             <td>'+ SalesOrderText + '</td>\
            //             <td>CASE ID</td>\
            //             <td>'+ caseId + '</td>\
            //         </tr>\
            //         <tr>\
            //             <td>REFERENCE</td>\
            //             <td>'+ reference + '</td>\
            //             <td>BILL TO GFL</td>\
            //             <td>'+ billToGFLYesNo + '</td>\
            //         </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td>&nbsp;</td>\
            //     </tr>\
            //     <tr>\
            //     <td style="font-size: 16px;">Items</td>\
            //     </tr>\
            //     </table>';
            //     template += '<table id= "bodytbl" border="1">\
            //     <tr>\
            //     <td>SKU</td>\
            //     <td>Description</td>\
            //     <td>Qty</td>\
            //     <td>Scope of Works</td>\
            // </tr>';
            //     if (searchResults && searchResults.length > 0) {
            //         for (var i = 0; i < searchResults.length; i++) {
            //             var data = searchResults[i];
            //             var itemId = data.itemID;
            //             var itemType = data.type;
            //             var ScopeOfWorks = '';
            //             if (itemType == 'InvtPart') {
            //                 var fieldLookUp = search.lookupFields({
            //                     type: 'inventoryitem',
            //                     id: itemId,
            //                     columns: ['custitem_assemblyhours']
            //                 }).custitem_assemblyhours;
            //                 if (fieldLookUp !== '') {
            //                     var x = parseInt(fieldLookUp);
            //                     if (x <= 0.7) {
            //                         ScopeOfWorks = 'Standard Bike Assembly';
            //                     } else if (0.7 < x <= 0.9) {
            //                         ScopeOfWorks = 'Electric Bike Assembly';
            //                     } else if (0.9 < x <= 1.5) {
            //                         ScopeOfWorks = 'E-Trike/Trike Assembly';
            //                     }
            //                 } else {
            //                     ScopeOfWorks = 'Standard Bike Assembly';
            //                 }
            //             } else if (itemType == 'Kit') {
            //                 var fieldLookUp = search.lookupFields({
            //                     type: 'kititem',
            //                     id: itemId,
            //                     columns: ['custitem_assemblyhours']
            //                 }).custitem_assemblyhours;
            //                 if (fieldLookUp !== '') {
            //                     var x = parseInt(fieldLookUp);
            //                     if (x <= 0.7) {
            //                         ScopeOfWorks = 'Standard Bike Assembly';
            //                     } else if (0.7 < x <= 0.9) {
            //                         ScopeOfWorks = 'Electric Bike Assembly';
            //                     } else if (0.9 < x <= 1.5) {
            //                         ScopeOfWorks = 'E-Trike/Trike Assembly';
            //                     }
            //                 } else {
            //                     ScopeOfWorks = 'Standard Bike Assembly';
            //                 }
            //             }
            //             template += '<tr>\
            //             <td>'+ data.itemName.replace('&', '&amp;') + '</td>\
            //             <td>'+ data.description + '</td>\
            //             <td>'+ data.quantity + '</td>\
            //             <td>'+ ScopeOfWorks + '</td>\
            //         </tr>';
            //         }
            //     } else {
            //         template += '<tr>\
            //             <td></td>\
            //             <td></td>\
            //             <td></td>\
            //             <td></td>\
            //         </tr>';
            //     }
            //     template += '</table>';
            //     template += '<table>\
            //     <tr>\
            //     <td>&nbsp;</td>\
            //     </tr>\
            //     <tr>\
            //     <td style="font-size: 16px;"><b>Procedure</b></td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 12px;">The standard warranty repair procedure to be followed by GFL and the Repairer is as follows:</td>\
            //     </tr>\
            //     </table>';
            //     template += "<p style='font-size: 12px; margin-left: 30px;'>1. GFL approves warranty work and nominates the Repairer to carry out warranty repairs.</p>";
            //     template += "<p style='font-size: 12px; margin-left: 30px;'>2. GFL contacts the repairer to inform them of the upcoming job and provides the Repairer with all necessary customer information.</p>";
            //     template += "<p style='font-size: 12px; margin-left: 30px;'>3. The customer takes the bike to the Repairer. For mobile Repairer operations, GFL will specify whether the Repairer is required to visit the customer.</p>";
            //     template += "<p style='font-size: 12px; margin-left: 30px;'>4. The repairer completes the required work and contacts the customer upon completion.</p>";
            //     template += "<p style='font-size: 12px; margin-left: 30px;'>5. Repairer invoices GFL for the completed job after the pickup is completed.</p>";
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 16px;"><b>Coordination with Repairer</b></td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 12px;">If a customer"s warranty claim requires follow-up services, GFL"s customer support team shall coordinate with the Repairer to facilitate the necessary repairs or replacements. The Repairer will be responsible for performing the warranty services under GFL"s guidance and within the agreed-upon rates.</td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 16px;"><b>Customer Support Responsibility</b></td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 12px;">GFL shall handle any follow-ups regarding warranty claims directly with the customer. The Repairer shall redirect any customer inquiries related to warranties back to GFL"s customer support team.</td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 16px;"><b>Billing to GFL</b></td>\
            //     </tr>\
            //     </table>';
            //     template += '<table>\
            //     <tr>\
            //     <td style="font-size: 12px;">Once pick up has been conducted, invoices can be emailed to accountspayable@gflgroup.com.au.</td>\
            //     </tr>\
            //     </table>';
            //     template += "</body>";
            //     template += "</pdf>";
            //     template += "</pdfset>";
            // }
            //Using "N/render" Module to Generate PDF
            var pdfFile = render.xmlToPdf({
                xmlString: template
            });
            response.writeFile(pdfFile, true);


            // var renderer = render.create();
            // renderer.templateContent = template;
    
            // var pdfFile = renderer.renderAsPdf();
            // pdfFile.name = Type+'.pdf';
            // response.writeFile(pdfFile);
        }
        return {
            onRequest: onRequest
        };
    });