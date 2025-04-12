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
            var workOrderObj = record.load({
                type: 'workorder',
                id: parseInt(recId)
            });
            var lineCount = workOrderObj.getLineCount({
                sublistId: 'item'
            });
            var salesOrderId = workOrderObj.getValue({
                fieldId: 'createdfrom'
            });
            var assemblyitemID = workOrderObj.getValue({
                fieldId: 'assemblyitem'
            });
            var WOID = workOrderObj.getValue({
                fieldId: 'tranid'
            });
            var specialIntruc = workOrderObj.getValue({
                fieldId: 'custbody_spec_instr'
            });
            var assemblyObjData = assemblySearch(assemblyitemID);
            log.debug('assemblyObjData',assemblyObjData);
            var salesOrderData = searchResults(salesOrderId,assemblyitemID);
            log.debug('salesOrderData',salesOrderData);
            var template = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            template += "<pdfset>";
            //PDF 1
            template += "<pdf>";
            template += "<head>";
            template += "<macrolist>\
            <macro id='nlfooter'>\
                <table class='footer' style='width: 100%;'><tr>\
        <td><barcode codetype='code128' showtext='true' value='"+WOID+"'/></td>\
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
        </style>\
        </head>";
            template += '<body  footer="nlfooter" footer-height="20pt" padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
            var obj;
            var woArray = [];
            for (var i = 0; i < lineCount; i++) {
                obj = {};
                obj.ItemType = workOrderObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemtype',
                    line: i
                });
                obj.ItemId = workOrderObj.getSublistText({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                });
                obj.assemblylevel = workOrderObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'assemblylevel',
                    line: i
                });
                obj.quantity = workOrderObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                    line: i
                });
                obj.description = workOrderObj.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'description',
                    line: i
                });
                woArray.push(obj);
            }
            // log.debug('woArray', woArray);
            var mapObj = {};
            for (var x = 0; x < woArray.length; x++) {
                var obj = woArray[x];
                var assemblylevel = obj.assemblylevel;
                var itemId = obj.ItemId;
                if (assemblylevel == 1 && !mapObj[itemId]) {
                    var parentId = itemId;
                    mapObj[itemId] = {
                        'parent': obj,
                        'childs': []
                    }
                } else {
                    mapObj[parentId].childs.push(obj)
                }
            }
            for (var j = 0; j < woArray.length; j++) {
                var firstLevel = woArray[j];
                var itemId = firstLevel.ItemId;
                if (mapObj[itemId]) {
                    template += createTable(mapObj[itemId],salesOrderData,assemblyObjData,WOID,specialIntruc);
                }
            }
            template += "</body>";
            template += "</pdf>";
            template += "</pdfset>";
            //Using "N/render" Module to Generate PDF
            var pdfFile = render.xmlToPdf({
                xmlString: template
            });
            response.writeFile(pdfFile, true);
        }
        function createTable(level1Array,salesOrderData,assemblyObjData,WOID,specialIntruc) {
            var title = 'createTable(::)';
            try {
                var level = level1Array;
                    var parent = level['parent'];
                    var child = level['childs'];
                   var template = '<table class="border" style="width: 100%; margin-top: 10px;"><tr>\
             <td style="margin-left: 200px;text-transform:uppercase;"><b>GANNON FABRICATIONS '+assemblyObjData.assemblyClass+'</b></td>\
             </tr>\
             <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 25%"><b>Customer:</b></td>\
                 <td style="width: 25%"><b>Work Order:</b></td>\
                 <td style="width: 25%"><b>Job Details:</b></td>\
                 <td class="borderLeft" style="width: 25%"><b>Due Date:</b></td>\
                 </tr></table>\
             </td>\
             </tr>\
             <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 25%">'+salesOrderData.customer+'</td>\
                 <td style="width: 25%">'+WOID+'</td>\
                 <td style="width: 25%">'+salesOrderData.jobRef+'</td>\
                 <td class="borderLeft" style="width: 25%"><b>'+salesOrderData.supplyDate+'</b></td>\
                 </tr></table>\
             </td>\
             </tr>\
             <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td  style="width: 7%"><b>Qty:</b></td>\
                 <td class="borderLeft" style="width: 15%"><b>Door size:</b></td>\
                 <td class="borderLeft" style="width: 12%"><b>Frame Colour:</b></td>\
               <td class="borderLeft" style="width: 10%"><b>Insert Colour:</b></td>\
                 <td class="borderLeft" style="width: 10%"><b>Door swing:</b></td>\
                 <td class="borderLeft" style="width: 10%"><b>Infill:</b></td>\
                 <td class="borderLeft" style="width: 8%"><b>Heater:</b></td>\
                 </tr></table>\
             </td>\
             </tr>\
             <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 7%"><b>'+salesOrderData.quantity+'</b></td>\
                 <td class="borderLeft" style="width: 15%"><b>'+assemblyObjData.doorSize+'</b></td>\
                 <td class="borderLeft" style="width: 12%"><b>'+salesOrderData.frameColor+'</b></td>\
                 <td class="borderLeft" style="width: 10%"><b>'+salesOrderData.color+'</b></td>\
                 <td class="borderLeft" style="width: 10%"><b>'+salesOrderData.doorSwing+'</b></td>\
                 <td class="borderLeft" style="width: 10%"><b>'+salesOrderData.Infill+'</b></td>\
                 <td class="borderLeft" style="width: 8%"><b>'+assemblyObjData.heater+'</b></td>\
                 </tr></table>\
             </td>\
             </tr>\
             <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 36.5% ;background-color: rgb(220,220,220);"><b>LOW TEMP</b></td>\
                 <td class="borderLeft" style="width: 8.5%"><b>Frame:</b></td>\
                 <td class="borderLeft" style="width: 10.5%"><b>Doorway:</b></td>\
                 <td class="borderLeft" style="width: 10.5%"><b>Lights:</b></td>\
                 <td class="borderLeft" style="width: 6%"><b>CAPS</b></td>\
                 <td class="borderLeft" style="width: 6%"><b>SAW</b></td>\
                 </tr></table>\
             </td>\
             </tr>\
           <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 12%;"><b>1882</b></td>\
                 <td style="width: 5%;"><b>X</b></td>\
                 <td style="width: 12%;"><b>3122</b></td>\
                 <td class="borderLeft" style="width: 8.5%"><b>'+assemblyObjData.frame+'</b></td>\
                 <td class="borderLeft" style="width: 10.5%"><b>'+assemblyObjData.doorWay+'</b></td>\
                 <td class="borderLeft" style="width: 10.5%"><b>'+salesOrderData.light+'</b></td>\
                 <td class="borderLeft" style="width: 6%"><b>Crated</b></td>\
                 <td class="borderLeft" style="width: 6%">'+salesOrderData.createdForShip+'</td>\
                 </tr></table>\
             </td>\
             </tr>\
            <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 8%;"><b>Cap Height</b></td>\
                 <td class="borderLeft" style="width: 5%;"><b>'+assemblyObjData.capHeight+'</b></td>\
                 <td class="borderLeft" style="width: 6%;"><b>X2</b></td>\
                 <td class="borderLeft" style="width: 5%"></td>\
                 <td class="borderLeft" style="width: 22%"><b>Shelves per door</b></td>\
                 <td class="borderLeft" style="width: 12%">'+salesOrderData.shelvesPD+'</td>\
                 </tr></table>\
             </td>\
             </tr>\
            <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 8%;"><b>Cap Width</b></td>\
                 <td class="borderLeft" style="width: 5%;"><b>'+assemblyObjData.capWidth+'</b></td>\
                 <td class="borderLeft" style="width: 6%;"><b>X2</b></td>\
                 <td class="borderLeft" style="width: 5%"></td>\
                 <td class="borderLeft" style="width: 8%"><b>Group</b></td>\
                 <td class="borderLeft" style="width: 7%">'+assemblyObjData.group+'</td>\
                 <td class="borderLeft" style="width: 12%"><b>Cut Flanges</b></td>\
                 </tr></table>\
             </td>\
             </tr>\
            <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="width: 8%;"><b>Door Bracket</b></td>';
                 if(!!salesOrderData.doorBracket && salesOrderData.doorBracket == true){
                    template += '<td class="borderLeft" style="width: 5%;"><b>YES</b></td>';
                 }else{
                    template += '<td class="borderLeft" style="width: 5%;"><b>NO</b></td>';
                 }
                 template += '<td class="borderLeft" style="width: 6%;"><b>SS Push Bars</b></td>';
                 if(!!salesOrderData.pushBar && salesOrderData.pushBar == true){
                    template += '<td class="borderLeft" style="width: 5%">YES</td>';
                 }else{
                    template += '<td class="borderLeft" style="width: 5%">NO</td>';
                 }
                 template += '<td class="borderLeft" style="width: 20.5%"><b>Rear Sliding Door Kit</b></td>';
                 if(!!salesOrderData.rearSlidingDoorKkit && salesOrderData.rearSlidingDoorKkit==true){
                    template += '<td class="borderLeft" style="width: 3%"><b>YES</b></td>';
                 }else{
                    template += '<td class="borderLeft" style="width: 3%"><b>NO</b></td>';
                 }
                 template += '</tr></table>\
             </td>\
             </tr>\
            <tr>\
             <td>\
             <table class="border" style="width: 100%"><tr>\
                 <td style="height: 40px;"><b>Special Instructions</b><br /><span>'+specialIntruc+'</span></td>\
                 </tr></table>\
             </td>\
             </tr>\
           </table>';
                    template += '<table class="border" style="width: 100%; margin-top: 10px;"><tr>\
                    <td align="center" style="background-color: rgb(220,220,220);"><b>Job No.</b></td>\
                    <td class="borderLeft">'+WOID+'</td>\
                    <td align="center" class="borderLeft" style="background-color: rgb(220,220,220);"><b>Customer</b></td>\
                    <td class="borderLeft">'+salesOrderData.customer+'</td>\
                    </tr>\
                    <tr>\
                    <td style="background-color: rgb(220,220,220);">&nbsp;</td>\
                    <td style="background-color: rgb(220,220,220);">&nbsp;</td>\
                    <td style="margin-left: -50px;background-color: rgb(220,220,220);"><b><u>Bill of Materials</u></b></td>\
                    <td style="background-color: rgb(220,220,220);">&nbsp;</td>\
                        </tr>\
                    </table>';
                    template += '<table class="border" style="width=100%;">\
                    <tr style="background-color: #d3d3d3; ">\
                    <th align="center" style="font-weight: bold; " width="250pt">SKU</th>\
                    <th align="center" style="font-weight: bold; " width="260pt">Description</th>\
                    <th align="center" style=" font-weight: bold; " width="100pt">Qty</th>\
                    <th align="center" style="font-weight: bold; " width="190pt">Check</th>\
                    </tr>';
                    template += '<tr>\
                            <td align="center" style="border-bottom: 1px solid black;">'+ parent.ItemId + '</td>\
                            <td align="center" style="border-bottom: 1px solid black;">'+ parent.description + '</td>\
                                <td align="center" style="border-bottom: 1px solid black;">'+ parent.quantity + '</td>\
                                <td align="center" style="border-bottom: 1px solid black;"><div style="height: 15px;width: 15px;background-color: #d3d3d3;;"></div></td>\
                        </tr>';
                    if (child.length != 0) {
                        for (var i = 0; i < child.length; i++) {
                            var item = child[i];
                            template += '<tr>\
                                <td align="center" style="border-bottom: 1px solid black;">'+ item.ItemId + '</td>\
                                <td align="center" style="border-bottom: 1px solid black;">'+ item.description + '</td>\
                                <td align="center" style="border-bottom: 1px solid black;">'+ item.quantity + '</td>\
                                <td align="center" style="border-bottom: 1px solid black;"><div style="height: 15px;width: 15px;background-color: #d3d3d3;;"></div></td>\
                            </tr>';
                        }
                    }
                    template += '</table>';
                    template += '<p style="page-break-before: always;">&nbsp;</p>';
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
            return template;
        }
        function searchResults(salesOrderId,assemblyitemID){
            var title = 'searchResults(::)';
            var obj;
            try{
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                    [
                       ["type","anyof","SalesOrd"], 
                       "AND", 
                       ["internalid","anyof",salesOrderId], 
                       "AND", 
                       ["item","anyof",assemblyitemID]
                    ],
                    columns:
                    [
                        search.createColumn({name: "entity", label: "Name"}),
                        search.createColumn({name: "custbody1", label: "Job Reference"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "custcol9", label: "Door Size"}),
                        search.createColumn({name: "custcol10", label: "No of Doors"}),
                        search.createColumn({name: "custcol5", label: "Insert Colour"}),
                        search.createColumn({name: "custcol1", label: "Door Swing"}),
                        search.createColumn({name: "custcol_so_lights", label: "Lights"}),
                        search.createColumn({name: "custcol7", label: "Shelves P/D"}),
                        search.createColumn({name: "custcol11", label: "Door Type"}),
                        search.createColumn({name: "custcol_cut_flanges", label: "Cut Flanges"}),
                        search.createColumn({name: "custcol_rear_sliding_door_kit", label: "Rear Sliding Door Kit"}),
                        search.createColumn({name: "custcol_dwr_soline_att_4", label: "Special Instructions"}),
                        search.createColumn({name: "requesteddate", label: "Supply Required By Date"}),
                        search.createColumn({name: "custcol_frame_colour", label: "Frame Colour"}),
                        search.createColumn({name: "custcol3", label: "Door Hold Open Brackets"}),
                        search.createColumn({name: "custcol_push_bar", label: "S/S Push Bar"}),
                        search.createColumn({name: "custbody_spec_instr", label: "Special Instructions"}),
                        search.createColumn({name: "custbodycrated", label: "CRATED FOR SHIPPING "})
                     ]
                 });
                 salesorderSearchObj.run().each(function(result){
                    obj={};
                    obj.customer = result.getText({name: 'entity'});
                    obj.jobRef = result.getValue({name:'custbody1'});
                    obj.date = result.getValue({name:'trandate'});
                    obj.doorSize = result.getValue({name:'custcol9'});
                    obj.quantity = result.getValue({name:'custcol10'});
                    obj.color = result.getText({name:'custcol5'});
                    obj.doorSwing = result.getText({name:'custcol1'});
                    obj.light = result.getValue({name:'custcol_so_lights'});
                    obj.shelvesPD = result.getValue({name:'custcol7'});
                    obj.Infill = result.getValue({name:'custcol11'});
                    obj.cutFlanges = result.getValue({name:'custcol_cut_flanges'});
                    obj.rearSlidingDoorKkit = result.getValue({name:'custcol_rear_sliding_door_kit'});
                    // obj.specialIntruction = result.getValue({name:'custcol_dwr_soline_att_4'});
                    obj.supplyDate = result.getValue({name:'requesteddate'});
                    obj.frameColor = result.getText({name:'custcol_frame_colour'});
                    obj.doorBracket = result.getValue({name:'custcol3'});
                    obj.pushBar = result.getValue({name:'custcol_push_bar'});
                    obj.specialIntruction = result.getValue({name:'custbody_spec_instr'});
                    obj.createdForShip = result.getText({name:'custbodycrated'});
                    return true;
                 });
            } catch(e) {
                log.debug('Exception ' +title, e.message);
            }
            return obj || {};
        }
        function assemblySearch(assemblyitemID){
            var title = 'assemblySearch(::)';
            try{
                var obj = {};
                var assemblyOBJ = record.load({
                    type: 'assemblyitem',
                    id: parseInt(assemblyitemID)
                });
                obj.doorSize = assemblyOBJ.getValue({
                    fieldId: 'custitem9'
                });
                obj.heater = assemblyOBJ.getValue({
                    fieldId: 'custitem5'
                });
                obj.frame = assemblyOBJ.getValue({
                    fieldId: 'custitem8'
                });
                obj.doorWay = assemblyOBJ.getValue({
                    fieldId: 'custitem6'
                });
                obj.capHeight = assemblyOBJ.getValue({
                    fieldId: 'custitem_cap_height'
                });
                obj.capWidth = assemblyOBJ.getValue({
                    fieldId: 'custitem_cap_width'
                });
                obj.group = assemblyOBJ.getText({
                    fieldId: 'custitem_item_group'
                });
                obj.assemblyClass = assemblyOBJ.getText({
                    fieldId: 'class'
                });
                return obj || {};
            } catch(e) {
                log.debug('Exception ' +title, e.message);
            }
        }
        return {
            onRequest: onRequest
        };
    });