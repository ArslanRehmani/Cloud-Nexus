/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// eslint-disable-next-line no-undef
define(['N/render', 'N/search', 'N/log', 'N/record', 'N/file', 'N/encode'],
   function (render, search, log, record, file, encode) {
      function onRequest(context) {
         var title = " onRequest() ";
         try {
            if (context.request.method === 'GET') {
               var response = context.response;
               var params = context.request.parameters;
               var recId = params.id;
               log.debug(title + "Recid ->", recId);
               var poObj;
               // RCRD_LOCKED_BY_WF

               poObj = record.load({
                  type: 'purchaseorder',
                  id: parseInt(recId)
               });



               var tranid = poObj.getValue({
                  fieldId: 'tranid'
               });
               var trandate = poObj.getValue({
                  fieldId: 'trandate'
               });
               var total = poObj.getValue({
                  fieldId: 'total'
               });
               // Parse the date string
               var parsedDate = new Date(trandate);

               // Format the date
               var formattedDate = parsedDate.getDate() + '/' + (parsedDate.getMonth() + 1) + '/' + parsedDate.getFullYear();
               var supplier = poObj.getText({
                  fieldId: 'entity'
               });
               var supplierAddress = poObj.getValue({
                  fieldId: 'billaddress'
               });
               supplierAddress = !!supplierAddress ? supplierAddress.replace(supplier, '').trim() : '';
               var memo = poObj.getValue({
                  fieldId: 'memo'
               });
               var currency = poObj.getText({
                  fieldId: 'currency'
               });
               var customer = poObj.getText({
                  fieldId: 'custbody_gfl_po_customer'
               });
               var ref = poObj.getText({
                  fieldId: 'custbody1'
               });
               var shiptoAddress = poObj.getText({
                  fieldId: 'custbody_gfl_cust_default_add'
               });
               var supplierID = poObj.getValue({
                  fieldId: 'entity'
               });
               var ETD = poObj.getValue({
                  fieldId: 'custbody4'
               });
               var subsidiary = poObj.getValue({
                  fieldId: 'subsidiary'
               }) || '';

               // Parse the date string
               var parsedETD = new Date(ETD);

               // Format the date
               var formattedETDDate = parsedETD.getDate() + '/' + (parsedETD.getMonth() + 1) + '/' + parsedETD.getFullYear();
               var portOfLoading = poObj.getValue({
                  fieldId: 'custbody_portofloading'
               });

               var vatId = search.lookupFields({
                  type: search.Type.VENDOR,
                  id: supplierID,
                  columns: ['vatregnumber']
               }).vatregnumber;
               var searchResuts = searchPOItems(poObj);
               var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
               xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
               xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
               xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
               xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
               xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

               xmlStr += '<Styles>'
                  + '<Style ss:ID="s63">'
                  + '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000"/>'
                  + '</Style>'
                  + '<Style ss:ID="s64">'
                  + '<Font x:CharSet="204" ss:Size="14" ss:Bold="1" ss:Color="#000000"/>'
                  + '</Style>'
                  + '<Style ss:ID="s65">'
                  + '<Font x:CharSet="204" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>'
                  + '</Style>'
                  + '<Style ss:ID="s66">'
                  + '<Font x:CharSet="204" ss:Size="11"/>'
                  + '</Style>'
                  + '<Style ss:ID="s67">'
                  + '<Font x:CharSet="204" ss:Size="14" ss:Color="#FFFFFF"/>'
                  + '<Interior ss:Color="#000000" ss:Pattern="Solid"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s68">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Bold="1" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s69">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s70">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s71">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s72">'
                  + '<Font x:CharSet="204" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s73">'
                  + '<Font x:CharSet="204" ss:Size="10" ss:Bold="1" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s74">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s75">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s76">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s77">'
                  + '<Font x:CharSet="204" ss:Size="9" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '<Style ss:ID="s78">'
                  + '<Font x:CharSet="204" ss:Size="12" ss:Color="#000000"/>'
                  + '<Alignment ss:Vertical="Top" ss:WrapText="1"/>'
                  + '<Borders>'
                  + '<Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '<Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>'
                  + '</Borders>'
                  + '</Style>'
                  + '</Styles>';

               xmlStr += '<Worksheet ss:Name="Sheet1">';
               xmlStr += '<Table>';


               xmlStr += '<Row ss:StyleID="s64">';
               xmlStr += '<Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell>';
               xmlStr += '<Cell><Data ss:Type="String">Purchase Order</Data></Cell>';
               xmlStr += '</Row>';

               xmlStr += '<Row>';
               xmlStr += '<Cell></Cell>';
               xmlStr += '</Row>';
               if (subsidiary == 3) {
                  xmlStr += '<Row ss:StyleID="s64">';
                  xmlStr += '<Cell ss:StyleID="s65"><Data ss:Type="String">China(HK) Global Company Limited</Data></Cell>';
                  xmlStr += '<Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s67"><Data ss:Type="String">Purchase Order #</Data></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s78"><Data ss:Type="String">' + tranid + '</Data></Cell>';
                  xmlStr += '</Row>';
                  xmlStr += '<Row>';
                  xmlStr += '<Cell ss:MergeAcross="4" ><Data ss:Type="String">Rm 201, Dehong Business Building</Data></Cell>';
                  xmlStr += '<Cell></Cell><Cell></Cell><Cell ss:MergeAcross="2" ss:StyleID="s67"><Data ss:Type="String">Date</Data></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s78"><Data ss:Type="String">' + formattedDate + '</Data></Cell>';
                  xmlStr += '</Row>';

                  xmlStr += '<Row><Cell ss:MergeAcross="4"><Data ss:Type="String">No.70 Minsheng Road, Gongming Street</Data></Cell></Row>';
                  xmlStr += '<Row><Cell ss:MergeAcross="4"><Data ss:Type="String">Guangming District, Shenzhen 518106, China</Data></Cell></Row>';
               }

               else {
                  xmlStr += '<Row ss:StyleID="s64">';
                  xmlStr += '<Cell ss:StyleID="s65"><Data ss:Type="String">GLOBAL FITNESS AND LEISURE PTY LTD</Data></Cell>';
                  xmlStr += '<Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s67"><Data ss:Type="String">Purchase Order #</Data></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s78"><Data ss:Type="String">' + tranid + '</Data></Cell>';
                  xmlStr += '</Row>';
                  xmlStr += '<Row>';
                  xmlStr += '<Cell ss:MergeAcross="4" ><Data ss:Type="String">23-25 Maygar Boulevard</Data></Cell>';
                  xmlStr += '<Cell></Cell><Cell></Cell><Cell ss:MergeAcross="2" ss:StyleID="s67"><Data ss:Type="String">Date</Data></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s78"><Data ss:Type="String">' + formattedDate + '</Data></Cell>';
                  xmlStr += '</Row>';

                  xmlStr += '<Row><Cell ss:MergeAcross="4"><Data ss:Type="String">Broadmeadows, VIC 3047</Data></Cell></Row>';
                  xmlStr += '<Row><Cell ss:MergeAcross="4"><Data ss:Type="String">Australia</Data></Cell></Row>';
                  xmlStr += '<Row><Cell ss:MergeAcross="4"><Data ss:Type="String">ABN: 96137370953</Data></Cell></Row>';
               }

               // Add empty row
               xmlStr += '<Row><Cell></Cell></Row>';

               // Supplier Row
               xmlStr += '<Row ss:StyleID="s65">';
               xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s72"><Data ss:Type="String">Supplier:</Data></Cell>';
               if(customer){
                  xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s72"><Data ss:Type="String">Ship To:</Data></Cell>';
               }
               xmlStr += '</Row>';

               xmlStr += '<Row>';
               xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s74"><Data ss:Type="String">' + supplier + '</Data></Cell>';
               if(customer){
                  xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s74"><Data ss:Type="String">&nbsp;</Data></Cell>';
               }
               xmlStr += '</Row>';
               xmlStr += '<Row ss:Height="60">';
               xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s74"><Data ss:Type="String">' + supplierAddress + '</Data></Cell>';
               if(customer){
                  xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s74"><Data ss:Type="String">' + shiptoAddress + '</Data></Cell>';
               }
               xmlStr += '</Row>';
               // xmlStr += '<Row>';
               // xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s74"><Data ss:Type="String">Community, Matian Street, Guangming District, Shenzhen</Data></Cell>';
               // xmlStr += '</Row>';
               // xmlStr += '<Row>';
               // xmlStr += '<Cell ss:MergeAcross="5" ss:StyleID="s74"><Data ss:Type="String">China</Data></Cell>';
               // xmlStr += '</Row>';
               if (vatId) {
                  xmlStr += '<Row ss:StyleID="s66">';
                  xmlStr += '<Cell ss:StyleID="s68"><Data ss:Type="String">VAT ID:</Data></Cell>';
                  xmlStr += '<Cell ss:MergeAcross="4" ss:StyleID="s74"><Data ss:Type="String">' + vatId + '</Data></Cell>';
                  xmlStr += '</Row>';
               }
               // Add empty row
               xmlStr += '<Row><Cell></Cell></Row>';
               // Add Currency Row
               xmlStr += '<Row>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s68"><Data ss:Type="String">Currency</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s69"><Data ss:Type="String">' + currency + '</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s68"><Data ss:Type="String">ETD</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s69"><Data ss:Type="String">' + formattedETDDate + '</Data></Cell>';
               xmlStr += '</Row>';


               xmlStr += '<Row>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s68"><Data ss:Type="String">Supplier Number</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s69"><Data ss:Type="String">'+supplierID+'</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s68"><Data ss:Type="String">Port of Loading</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s69"><Data ss:Type="String">' + portOfLoading + '</Data></Cell>';
               xmlStr += '</Row>';
               xmlStr += '<Row>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s68"><Data ss:Type="String">Reference</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s69"><Data ss:Type="String">'+ref+'</Data></Cell>';
               xmlStr += '</Row>';
               xmlStr += '<Row>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s68"><Data ss:Type="String">Memo</Data></Cell>';
               xmlStr += '<Cell ss:MergeAcross="2" ss:StyleID="s69"><Data ss:Type="String">' + memo + '</Data></Cell>';
               xmlStr += '</Row>';
               // Add empty row
               xmlStr += '<Row><Cell></Cell></Row>';
               // Header row for item details
               xmlStr += '<Row>';
               ['Supplier Code', 'UPC Code', 'Supplier Version','Stock Description', 'Purchase Description', 'Item SKU', 'Sales Description', 'Qty', 'Rate', 'Amount'].forEach(function (cellValue, index) {
                  if (index === 0 || index === 1 || index === 2 || index === 3 || index === 4 || index === 5 || index === 6) {
                     xmlStr += '<Cell ss:MergeAcross="1" ss:StyleID="s68"><Data ss:Type="String">' + cellValue + '</Data></Cell>';
                  } else {
                     xmlStr += '<Cell ss:StyleID="s68"><Data ss:Type="String">' + cellValue + '</Data></Cell>';
                  }
               });
               xmlStr += '</Row>';

               var itemRows = searchResuts;

               itemRows.forEach(function (row) {
                  xmlStr += '<Row>';
                  row.forEach(function (cellValue, index) {
                     if (index === 0 || index === 1 || index === 2 || index === 3 || index === 4 || index === 5 || index === 6) {
                        xmlStr += '<Cell ss:MergeAcross="1" ss:StyleID="s69"><Data ss:Type="String">' + cellValue + '</Data></Cell>';
                     } else {
                        xmlStr += '<Cell ss:StyleID="s69"><Data ss:Type="String">' + cellValue + '</Data></Cell>';
                     }
                  });
                  xmlStr += '</Row>';
               });
               // Add Total Line
               xmlStr += '<Row>';
               xmlStr += '<Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell></Cell><Cell ss:StyleID="s68"><Data ss:Type="String">Total</Data></Cell>';
               xmlStr += '<Cell ss:StyleID="s69"><Data ss:Type="String">$ ' + parseFloat(total).toFixed(2) + '</Data></Cell>';
               xmlStr += '</Row>';

               xmlStr += '</Table></Worksheet></Workbook>';

               var strXmlEncoded = encode.convert({
                  string: xmlStr,
                  inputEncoding: encode.Encoding.UTF_8,
                  outputEncoding: encode.Encoding.BASE_64
               });

               var objXlsFile = file.create({
                  name: tranid + ' ExcelFile.xls',
                  fileType: file.Type.EXCEL,
                  contents: strXmlEncoded
               });

               context.response.writeFile({
                  file: objXlsFile
               });
            }
         } catch (e) {
            log.error(title + e.name, e.message);
         }
      }
      function searchPOItems(poObj) {
         var title = 'searchPOItems[::]';
         try {
            var innerArray;
            var array = [];
            var lineCount = poObj.getLineCount({
               sublistId: 'item'
            });
            for (var m = 0; m < lineCount; m++) {
               innerArray = [];
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'vendorname',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_gfl_upc_code',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_supplier_version',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_gfl_stock_description',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'description',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistText({
                  sublistId: 'item',
                  fieldId: 'item',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'custcol_sales_description',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'quantity',
                  line: m
               }) || '');
               innerArray.push(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'origrate',
                  line: m
               }).toFixed(2));
               // innerArray.push('$ '+ poObj.getSublistValue({
               //    sublistId: 'item',
               //    fieldId: 'amount',
               //    line: m
               // }));
               innerArray.push('$ ' + parseFloat(poObj.getSublistValue({
                  sublistId: 'item',
                  fieldId: 'amount',
                  line: m
               })).toFixed(2));
               array.push(innerArray);
            }
            return array;
         } catch (e) {
            log.error(title + e.name, e.message);
         }
      }
      return {
         onRequest: onRequest
      };
   });