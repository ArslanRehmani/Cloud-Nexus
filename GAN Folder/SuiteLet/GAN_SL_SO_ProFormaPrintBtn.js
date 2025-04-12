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
      var SearchResults = LineItemData(recId);
      log.debug({
        title: 'SearchResults',
        details: SearchResults
      });
      var SalesOrderOBJ = record.load({
        type: 'salesorder',
        id: parseInt(recId)
      });
      log.debug({
        title: 'SalesOrderOBJ',
        details: SalesOrderOBJ
      });
      var subTotal = SalesOrderOBJ.getValue({ fieldId: 'subtotal' });
      var total = SalesOrderOBJ.getValue({ fieldId: 'total' });
      var invDate = SalesOrderOBJ.getText({ fieldId: 'trandate' });
      var invNum = SalesOrderOBJ.getValue({ fieldId: 'tranid' });
      var ref = SalesOrderOBJ.getValue({ fieldId: 'custbody1' });
      var customerName = SalesOrderOBJ.getText({ fieldId: 'entity' });
      var customerID = SalesOrderOBJ.getValue({ fieldId: 'entity' });
      var email = SalesOrderOBJ.getText({ fieldId: 'custbody_cust_email' });
      var phone = SalesOrderOBJ.getValue({ fieldId: 'custbody_cust_phone' });
      var SubsidaryID = SalesOrderOBJ.getValue({ fieldId: 'subsidiary' });
      var handlingCost = SalesOrderOBJ.getValue({ fieldId: 'althandlingcost' });
      var frighting = SalesOrderOBJ.getValue({ fieldId: 'altshippingcost' });
      var TotalGST = SalesOrderOBJ.getValue({ fieldId: 'taxtotal' });
      var department = SalesOrderOBJ.getValue({ fieldId: 'department' });
      var customerOrderOBJ = record.load({
        type: 'customer',
        id: parseInt(customerID)
      });
      var custAddress = customerOrderOBJ.getValue({ fieldId: 'defaultaddress' });
      var subsidaryObj = record.load({
        type: 'subsidiary',
        id: parseInt(SubsidaryID)
      });
      var mainaddress_text = subsidaryObj.getText({ fieldId: 'mainaddress_text' });
      var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
      template += "<pdfset>";
      //PDF 1
      template += "<pdf>";
      template += "<head>";
      template += "<macrolist>\
      <macro id='nlheader'>\
      <table style='width:100%;'>\
            <tr>\
            <td style='width:33%;'>\
            <img src='http://6481478.shop.netsuite.com/core/media/media.nl?id=4450&amp;c=6481478&amp;h=cRusmfL2e3cqNP32r3rxxKAvVBlq4HgRwmhGsGtzXT52-BZH' style='width:90%; height:70%;display: inline-block'></img>\
            </td>\
            <td style='width:33%;'>&nbsp;</td>";
            if(department && department == 11){
              template += "<td style='width:33%;'>\
            <img src='http://6481478.shop.netsuite.com/core/media/media.nl?id=13252&amp;c=6481478&amp;h=rhHM2DTP8nKJ8rxl1KjSZ_Evb0PYo1wg7SdfFnoHIZiS4MBv' style='width:30%; height:35%;display: inline-block'></img>\
            </td>";
            }else{
              template += "<td style='width:33%;'>&nbsp;</td>";
            }
            template += "</tr>\
            </table>\
      </macro >\
      <macro id='nlfooter'>\
        <table style='width:100%;'>\
          <tr>\
            <td style='border-bottom: 1px dashed black;'>&nbsp;</td>\
          </tr>\
        </table>\
        <table style='width:100%;'>\
          <tr>\
            <td style='width:50%;' >\
              <table>\
                <tr >\
                  <td style='font-size: 20px; width: 2%; white-space: nowrap;'><b>PAYMENT ADVICE</b><br /><br /></td>\
                </tr>\
                <tr>\
                  <td>To:</td>\
                  <td style='white-space: nowrap;'>Gannon Group Pty Ltd<br />\
                    PO Box 138<br />\
                    ELLEN GROVE QLD 4078<br />\
                    Australia</td>\
                </tr>\
              </table>\
            </td>\
            <td style='width:50%;'>\
              <table>\
                <tr>\
                  <td><b>Customer</b></td>\
                  <td>"+ customerName + "</td>\
                </tr>\
                <tr>\
                  <td style='border-bottom: 1px solid black;'><b>Invoice Number</b></td>\
                  <td style='border-bottom: 1px solid black;'>"+ invNum + "</td>\
                </tr>\
                <tr>\
                  <td><b>Amount Due</b></td>\
                  <td> N/A</td>\
                </tr>\
                <tr>\
                  <td style='border-bottom: 1px solid black;'><b>Due Date</b></td>\
                  <td style='border-bottom: 1px solid black;'>"+ invDate + "</td>\
                </tr>\
                <tr>\
                  <td><b>Amount Enclosed</b></td>\
                  <td>\
                    <table>\
                      <tr>\
                        <td>&nbsp;</td>\
                      </tr>\
                      <tr>\
                        <td style='border-bottom: 1px solid black;'></td>\
                      </tr>\
                      <tr><td>Enter the amount you are paying above</td></tr>\
                    </table>\
                  </td>\
                </tr>\
              </table>\
            </td>\
          </tr>\
        </table>\
      </macro>\
        </macrolist > ";
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
          td p {align:left }\
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
        </head > ";
      template += '<body header="nlheader" header-height="8%" footer="nlfooter" footer-height="20%" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
      template += "<table style='width: 100%;'>\
      <tr>\
      <td style='width: 33%;'><p style='font-size: 20px;text-align: right;'><b>SALES ORDER</b></p>\</td>\
      <td style='width: 33%;'><b>Invoice Date:</b><br /> "+ invDate + "</td>\
      <td style='width: 33%;'>Gannon Group Pty Ltd<br />\
      PO Box 138<br />\
      ELLEN GROVE QLD 4078<br />\
      Australia<br />\
      </td>\
      </tr>\
      </table>";
      template += "<table style='width: 100%;'>\
            <tr>\
                <td style='width: 33%;'>\
                <table style='width: 100%;'>\
                    <tr>\
                    <td><b>Customer Name:</b> "+ customerName + "</td>\
                    </tr>\
                    <tr>\
                    <td><b>Email:</b> "+ email + "</td>\
                    </tr>\
                    <tr>\
                    <td><b>Phone:</b> "+ phone + "</td>\
                    </tr>\
                    <tr>\
                    <td><b>Address:</b> "+ custAddress + "</td>\
                    </tr>\
                </table>\
                </td>\
                <td style='width: 33%;'>\
                <table style='width: 100%;'>\
                    <tr>\
                    <td><b>Invoice Number:</b><br /> "+ invNum + "</td>\
                    </tr>\
                    <tr>\
                    <td><b>Reference:</b><br /> "+ ref + "</td>\
                    </tr>\
                    <tr>\
                    <td><b>ABN:</b><br /> N/A</td>\
                    </tr>\
                </table>\
                </td>\
                <td style='width: 33%;'>&nbsp;</td>\
            </tr>\
            </table>";
      template += '<table class="itemtable" style="width: 100%; margin-top: 10px;">\
                <tr style="padding-top:3mm;padding-bottom:3mm;margin:0;">\
                <th class="left" colspan="4"><p class="left " style="letter-spacing:0.50;"><b>Item</b></p></th>\
                <th class="left" colspan="8"><p class="left " style="letter-spacing:0.50;"><b>Description</b></p></th>\
                <th class="center" colspan="3"><p class="left " style="letter-spacing:0.50;"><b>Quantity</b></p></th>\
                <th class="center" colspan="4"><p class="left " style="letter-spacing:0.50;"><b>Unit Price</b></p></th>\
                <th class="center" colspan="2"><p class="left " style="letter-spacing:0.50;"><b>GST</b></p></th>\
                <th class="center" colspan="4"><p class="left " style="letter-spacing:0.50;"><b>Amount AUD</b></p></th>\
                </tr>';
      for (var i = 0; i < SearchResults.length; i++) {
        var serchObj = SearchResults[i];
        var gst = serchObj.gst;
        var GSTtoFixed = Math.round(parseFloat(gst).toFixed(2));
        var dec = serchObj.itemDes;
        var description = dec.replace(/&/g, "&amp;");
        template += '<tr>\
                  <td class="left" colspan="4"><p>'+ serchObj.itemName + '</p></td>\
                  <td class="left" colspan="8"><p>'+ description + '</p></td>\
                  <td class="left" colspan="3"><p>'+ serchObj.quantity + '</p></td>\
                  <td class="left" colspan="4"><p>'+ serchObj.rate + '</p></td>\
                  <td class="left" colspan="2"><p>'+ GSTtoFixed + ' %</p></td>\
                  <td class="left" colspan="4"><p>'+ serchObj.amount + '</p></td>\
                  </tr>';
      }
      template += '</table>';
      template += "<hr />";
      template += "<table style='width: 100%;'>\
            <tr>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 30%;'>\
              <table style='width: 100%;'>\
              <tr>\
              <td style='width: 50%;'>SubTotal</td>\
              <td style='width: 50%;'>$ "+ subTotal + "</td>\
              </tr>\
              </table>\
            </td>\
            </tr>\
            <tr>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 35%;'>&nbsp;</td>"
      if (frighting) {
        template += "<td style='width: 30%;'>\
                <table style='width: 100%;'>\
                  <tr>\
                    <td style='width: 50%;'>FRIGHT</td>\
                    <td style='width: 50%;'>$ "+ frighting + "</td>\
                  </tr>\
                </table>\
              </td>";
      } else {
        template += "<td style='width: 30%;'>\
                <table style='width: 100%;'>\
                  <tr>\
                    <td style='width: 50%;'>FRIGHT</td>\
                    <td style='width: 50%;'>$ 0.0</td>\
                  </tr>\
                </table>\
              </td>";
      }
      template += "</tr >";

      template += "<tr>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 35%;'>&nbsp;</td>";
      if (handlingCost) {
        template += "<td style='width: 30%;'>\
              <table style='width: 100%;'>\
              <tr>\
              <td style='width: 50%;'>CREATING</td>\
              <td style='width: 50%;'>$ "+ handlingCost + "</td>\
              </tr>\
              </table>\
              </td>";
      } else {
        template += "<td style='width: 30%;'>\
              <table style='width: 100%;'>\
              <tr>\
              <td style='width: 50%;'>CREATING</td>\
              <td style='width: 50%;'>$ 0.0</td>\
              </tr>\
              </table>\
              </td>";
      }
      template += "</tr>\
            <tr>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 30%;'>\
              <table style='width: 100%;'>\
              <tr>\
              <td style='width: 50%;'>TOTAL GST</td>\
              <td style='width: 50%;'>$ "+ TotalGST + "</td>\
              </tr>\
              </table>\
            </td>\
            </tr>\
            <tr>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 30%;align:left' >\
              <hr />\
            </td>\
            </tr>\
            <tr>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 35%;'>&nbsp;</td>\
            <td style='width: 30%;'>\
              <table style='width: 100%;'>\
              <tr>\
              <td style='width: 50%;'>TOTAL AUD</td>\
              <td style='width: 50%;'>$ "+ total + "</td>\
              </tr>\
              </table>\
            </td>\
            </tr>\
            </table>";
      template += "<table style='width: 100%;'>\
            <tr>\
                <td style='width: 33%;'>\
                <table style='width: 100%;'>\
                    <tr>\
                    <td><b>Due Date: 29/06/2023</b></td>\
                    </tr>\
                    <tr>\
                    <td>*** PLEASE NOTE OUR NEW BANK ACCOUNT DETAILS***</td>\
                    </tr>\
                    <tr>\
                    <td>EFT Details:</td>\
                    </tr>\
                    <tr>\
                    <td>Account Name: Gannon Group Pty Ltd</td>\
                    </tr>\
                    <tr>\
                    <td>BSB: 064 203</td>\
                    </tr>\
                    <tr>\
                    <td>Account Number: 1067 3455</td>\
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
          obj.itemDes = SalesOrderOBJ.getSublistValue({
            sublistId: 'item',
            fieldId: 'description',
            line: i
          });
          obj.quantity = SalesOrderOBJ.getSublistValue({
            sublistId: 'item',
            fieldId: 'quantity',
            line: i
          });
          obj.rate = SalesOrderOBJ.getSublistValue({
            sublistId: 'item',
            fieldId: 'rate',
            line: i
          });
          obj.gst = SalesOrderOBJ.getSublistValue({
            sublistId: 'item',
            fieldId: 'taxrate1',
            line: i
          });
          obj.amount = SalesOrderOBJ.getSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
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