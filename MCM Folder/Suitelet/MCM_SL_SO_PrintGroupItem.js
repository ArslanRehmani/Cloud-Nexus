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
      var searchResults = salesOrderData(recId);

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
          <p style="font-size:7;">'+ searchResults.salesrep + '\
            <br/>'+ searchResults.empEmail + '\
            <br/>'+ searchResults.empContact + ' <br/>' + searchResults.empLocation + '</p>\
        </td>\
      </tr>\
      <tr style="margin-top:5mm;">\
            <td colspan="12" class="left">\
              <p class="left " style="font-size:6;">PROFORMA TAX INVOICE/DATE</p>\
              <p class="left " style="font-size:15;margin:0;padding:2mm 0 0 0;">Proforma Tax Invoice # '+ searchResults.tranid + '</p>\
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
          log.debug({
            title: 'totalAmount',
            details: totalAmount
          });
        }
        if (item.itemType == 'Discount') {
          var dis = disCount.slice(0, 2);
          var discountnt = parseInt(dis);
          discountItem += (totalAmount * discountnt) / 100;
          totalAmount = 0;
          log.debug({
            title: 'discountItem',
            details: discountItem
          });
        }

      }
      log.debug({
        title: 'totalAmountFinal Final',
        details: totalAmountFinal
      });
      var totalDiscountedAmount = parseFloat(totalAmountFinal - discountItem).toFixed(2);
      for (var i = 0; i < searchResults.item.length; i++) {
        var item = searchResults.item[i];

        if (item.itemType != 'Discount') {
          template += '<tr>';
          // <td class="left" colspan="8" >'+item.description+'<br />SKU:'+item.sku+'<br />'+item.dims+'</td>\
          var description = item.description;
          var descriptionAND = description.replace("&", "&amp;");
          template += '<td class="left" colspan="8">' + descriptionAND + '<br /><p style="font-size:7;">' + item.sku + '</p><p style="font-size:7; margin-top: 3%;">' + item.dims + '</p></td>\
                  <td class="center" colspan="3">\
                    <p class="center " style="font-size:9pt;padding-top:0mm;">'+ item.rrp + '</p>\
                  </td>\
                  <td class="center" colspan="2" ><p class="center " style="font-size:9pt;padding-top:0mm;">'+ item.qty + '</p></td>\
                  <td class="right" colspan="2" ><p class="right " style="font-size:9pt;padding-top:0mm;">'+ item.total1 + '</p></td>\
                </tr>';
        }
      }
      if (!!discountItem) {
        template += '<tr><td class="left" colspan="8">Discount</td>\
                  <td class="center" colspan="3">\
                    <p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p>\
                  </td>\
                  <td class="center" colspan="2" ><p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p></td>\
                  <td class="right" colspan="2" ><p class="right " style="font-size:9pt;padding-top:0mm;">'+ discountItem + '</p></td>\
                </tr>';
      }
      if (!!totalAmountFinal) {
        template += '<tr><td class="left" colspan="8">Total Disconted Amount</td>\
                  <td class="center" colspan="3">\
                    <p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p>\
                  </td>\
                  <td class="center" colspan="2" ><p class="center " style="font-size:9pt;padding-top:0mm;">&nbsp;</p></td>\
                  <td class="right" colspan="2" ><p class="right " style="font-size:9pt;padding-top:0mm;">'+ totalDiscountedAmount + '</p></td>\
                </tr>';
      }
      template += '</table>';
      var totalINCL = parseFloat(totalDiscountedAmount) + parseFloat(searchResults.shippingCost);
      template += '<div style="padding:0;margin:0">\
          <table style="width:100%;margin-top:2mm">\
            <tr>\
            <td colspan="16" style="width:60%;">\
              <table style="width:100%;margin-top:0mm">\
              <tr>\
                <td class="left" style="margin:0 4mm 0 0;padding: 2mm 0 0 0;border-top: 1px solid;"><p class="left" style="font-size:7pt;">'+ searchResults.memoInvoice + '</p></td>\
              </tr>\
              </table>\
            </td>\
            <td colspan="8" style="width:40%;border-top: 1px solid;">\
            <table style="width:100%;margin-top:0mm">\
            <tr>\
              <td><p style="font-size:7pt;"><b>CURRENCY</b></p></td>\
              <td><p style="font-size:7pt;">'+ searchResults.currency + '</p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;"><b>SUBTOTAL</b></p></td>\
            <td><p style="font-size:7pt;">$ ' + totalDiscountedAmount + '</p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;"><b>DISCOUNT</b></p></td>\
            <td><p style="font-size:7pt;">$ '+ discountItem + '</p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;"><b>SHIPPING</b></p></td>\
            <td><p style="font-size:7pt;">$' + searchResults.shippingCost + '</p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;"><b>GST INCLUDED</b></p></td>\
            <td><p style="font-size:7pt;">$ ' + searchResults.taxtotal + '</p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>TOTAL INCL GST</b></p></td>\
            <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + parseFloat(totalINCL).toFixed(2) + '</b></p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;"><b>TERMS</b></p></td>\
            <td><p style="font-size:7pt;">'+ searchResults.terms + '</p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>AMOUNT PAID</b></p></td>\
            <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + parseFloat(totalINCL).toFixed(2) + '</b></p></td>\
            </tr>\
            <tr>\
            <td><p style="font-size:7pt;margin-top:1mm;padding-top:2mm;"><b>TOTAL REMAINING</b></p></td>\
            <td><p style="font-size:15pt;margin-top:1mm;"><b>$ ' + parseFloat(searchResults.BalanceDue).toFixed(2) + '</b></p></td>\
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
      \
      \
      \
      \
      \
      <td colspan="8" class="left" style="margin:0;padding:0 0 0 0;width:35%;">\
        <table style="width:100%;margin:0;padding:0">\
          <tr><td colspan="10" class="left" style="margin-top:2mm"><p class="left supremebold track100" style="font-size:7pt;line-height:120%;"><b>CREDIT CARD</b></p></td></tr>\
          <tr><td colspan="10" class="left" style="font-size:7pt;"><p class="left supremelight">MCM House accepts all major credit cards. Please contact your consultant to make payment via our online payment portal or over the phone.</p></td></tr>\
\
          <tr><td colspan="10" class="left" style="margin-top:2mm"><p class="left supremebold track100" style="font-size:7pt;line-height:120%;"><b>EFT</b></p></td></tr>\
          <tr><td colspan="10" class="left" style="margin-top:2mm"><p class="left supremebold track100" style="font-size:7pt;line-height:120%;">EFT</p></td></tr>\
          <tr><td colspan="3" class="left" style="font-size:7pt;"><p class="left supremelight">Name:</p></td><td colspan="7" class="left" style="font-size:7pt;"><p class="left supremelight">Charles Bruce Pty Ltd T/A MCM House</p></td></tr>\
          <tr><td colspan="3" class="left" style="font-size:7pt;"><p class="left supremelight">BSB:</p></td><td colspan="7" class="left" style="font-size:7pt;"><p class="left supremelight">012 140</p></td></tr>\
          <tr><td colspan="3" class="left" style="font-size:7pt;"><p class="left supremelight">Account:</p></td><td colspan="7" class="left" style="font-size:7pt;"><p class="left supremelight">302 8126 02</p></td></tr>\
          <tr><td colspan="3" class="left" style="font-size:7pt;"><p class="left supremelight">Reference:</p></td><td colspan="7" class="left" style="font-size:7pt;"><p class="left supremelight">#'+ searchResults.tranid + '</p></td></tr>\
          <tr><td colspan="10" class="left" style="font-size:7pt;"><p class="left supremelight">Please email your remittance advice to accounts@mcmhouse.com</p></td></tr>\
        </table>\
      </td>\
      </tr>\
          </table>\
          </div>';
      template += "</body>";
      template += "</pdf>";
      template += "</pdfset>";
      //Using "N/render" Module to Generate PDF
      var pdfFile = render.xmlToPdf({
        xmlString: template
      });
      response.writeFile(pdfFile, true);
    }
    function salesOrderData(recId) {
      var title = 'salesOrderData(::)';
      var resultsData = {
        item: []
      }
      try {
        var salesOrderObj = record.load({
          type: 'salesorder',
          id: parseInt(recId)
        });
        resultsData.entity = salesOrderObj.getText({ fieldId: 'entity' });
        resultsData.tranid = salesOrderObj.getText({ fieldId: 'tranid' });
        resultsData.trandate = salesOrderObj.getText({ fieldId: 'trandate' });
        resultsData.projectOnInvoive = salesOrderObj.getText({ fieldId: 'custbody_project_name' });
        resultsData.shipaddress = salesOrderObj.getText({ fieldId: 'shipaddress' });
        resultsData.billaddress = salesOrderObj.getText({ fieldId: 'billaddress' });
        resultsData.salesrep = salesOrderObj.getText({ fieldId: 'salesrep' });
        var salesRepID = salesOrderObj.getValue({ fieldId: 'salesrep' });
        resultsData.memoInvoice = salesOrderObj.getValue({ fieldId: 'custbody_memo_invoice' });
        resultsData.currency = salesOrderObj.getText({ fieldId: 'currency' });
        resultsData.subTotal = salesOrderObj.getValue({ fieldId: 'subtotal' });
        resultsData.discounttotal = salesOrderObj.getValue({ fieldId: 'discounttotal' });
        resultsData.shippingCost = salesOrderObj.getValue({ fieldId: 'custbody_shipping_cost_inc_gst' });
        resultsData.giftcertapplied = salesOrderObj.getValue({ fieldId: 'giftcertapplied' });
        resultsData.taxtotal = salesOrderObj.getValue({ fieldId: 'taxtotal' });
        var total = salesOrderObj.getValue({ fieldId: 'total' });
        resultsData.terms = salesOrderObj.getText({ fieldId: 'terms' });
        var amountPaid = salesOrderObj.getValue({ fieldId: 'custbody_so_amount_paid' });
        var depositAmount = salesOrderObj.getValue({ fieldId: 'custbody_sp_deposit_amount' });
        var DepositeAmt = parseInt(amountPaid) - parseInt(depositAmount);
        resultsData.depositAmountToPrecision = DepositeAmt.toPrecision(2);
        resultsData.BalanceDue = total - amountPaid;
        var employeeObj = record.load({
          type: 'employee',
          id: salesRepID
        });
        resultsData.empEmail = employeeObj.getValue({ fieldId: 'email' });
        var empPhone = employeeObj.getValue({ fieldId: 'phone' });
        resultsData.empLocation = employeeObj.getText({ fieldId: 'location' });
        var empMobilePhone = employeeObj.getValue({ fieldId: 'mobilephone' });
        if (empPhone) {
          resultsData.empContact = empPhone;
        } else {
          resultsData.empContact = empMobilePhone;
        }
        var entityID = salesOrderObj.getValue({ fieldId: 'entity' });
        var customerObj = record.load({
          type: 'customer',
          id: entityID
        });
        var custMobilePhone = customerObj.getValue({ fieldId: 'mobilephone' });
        var custPhone = customerObj.getValue({ fieldId: 'phone' });
        if (custMobilePhone) {
          resultsData.contect = custMobilePhone;
        } else {
          resultsData.contect = custPhone;
        }
        resultsData.custEmail = customerObj.getValue({ fieldId: 'email' });
        resultsData.item = searchObjData(recId);
      } catch (e) {
        log.debug('Exception ' + title, e.message);
      }
      return resultsData || {};
    }
    function searchObjData(recId){
      var title = 'searchObjData(::)';
      var groupItemArray = [];
      var obj;
      try{
        var salesOrderId = recId.toString();
        var salesorderSearchObj = search.create({
          type: "salesorder",
          filters:
            [
              ["type", "anyof", "SalesOrd"],
              "AND",
              ["internalid", "anyof", salesOrderId],
              "AND", 
              ["item","noneof","@NONE@"]
            ],
          columns:
            [
              search.createColumn({ name: "item", label: "Item" }),
              search.createColumn({ name: "quantity", label: "Quantity" }),
              search.createColumn({ name: "custcol_rrpincl_total", label: "Total RRP" }),
              search.createColumn({ name: "custcol_rrpincl", label: "RRP" }),
              search.createColumn({ name: "custcol_print_item_code", label: "Print Item Code" }),
              search.createColumn({ name: "custcol_item_dims_sales_order", label: "Item Dims - Sales Order" }),
              search.createColumn({ name: "custcol_itemdisplayname", label: "Item Display Name" }),
              search.createColumn({
                name: "type",
                join: "item",
                label: "Type"
              })
            ]
        });
        salesorderSearchObj.run().each(function (result) {
          obj = {};
          obj.item = result.getText({ name: 'item' });
          obj.qty = result.getValue({ name: 'quantity' });
          obj.total = parseFloat(result.getValue({ name: 'custcol_rrpincl_total' }));
          obj.total1 = result.getValue({ name: 'custcol_rrpincl_total' });
          obj.rrp = result.getValue({ name: 'custcol_rrpincl' });
          obj.sku = result.getValue({ name: 'custcol_print_item_code' });
          obj.dims = result.getValue({ name: 'custcol_item_dims_sales_order' });
          obj.description = result.getValue({ name: 'custcol_itemdisplayname' });
          obj.itemType = result.getValue({ name: 'type', join: 'item' });
          groupItemArray.push(obj);
          return true;
        });
        log.debug({
          title: 'groupItemArray',
          details: groupItemArray
        });
      } catch(e) {
          log.debug('Exception ' +title, e.message);
      }
      return groupItemArray || [];
    }
    return {
      onRequest: onRequest
    };
  });