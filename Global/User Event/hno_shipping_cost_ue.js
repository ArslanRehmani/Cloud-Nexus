/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
 define(['N/record', 'N/file', 'N/search', 'N/email'],

 function (record, file, search , email) {

     /**
      * Function definition to be triggered before record is loaded.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {string} scriptContext.type - Trigger type
      * @param {Form} scriptContext.form - Current form
      * @Since 2015.2
      */
     function beforeLoad(scriptContext) {

     }

     /**
      * Function definition to be triggered before record is loaded.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type
      * @Since 2015.2
      */
     function beforeSubmit(scriptContext) {

         try {

             if (scriptContext.type == 'edit' || scriptContext.type == 'create') {


                 var rec = scriptContext.newRecord

                 
                 var cust_id = rec.getValue({
                     fieldId: 'entity'
                 })

                 var tranid = rec.getValue('tranid')

                 var rec_hno_stat = rec.getValue({
                    fieldId: 'custbody_hno_shipping_cost_status'
                 })


                 if(rec_hno_stat != 4){

                 if (cust_id == 2131138 || cust_id == '2131138') { // HNO Customer


                     var subRec = rec.getSubrecord({
                         fieldId: 'shippingaddress'
                     });

                     var line_count = rec.getLineCount({
                         sublistId: 'item'
                     })

                     var post_code = subRec.getValue('zip')

                     log.debug('line_count', line_count)

                     var total_ship_cost = 0

                     for (x = 0; x < line_count; x++) {



                         var display_name = rec.getSublistValue({
                             sublistId: 'item',
                             fieldId: 'custcol_display_name',
                             line: x
                         })

                         var item_qty = rec.getSublistValue({
                             sublistId: 'item',
                             fieldId: 'quantity',
                             line: x
                         })

                         log.debug('display_name', display_name)



                         var hno_ship_cost = getShippingCost(display_name, post_code)
                         log.debug('hno_ship_cost 3', hno_ship_cost)
                         if (hno_ship_cost == '') {
                             rec.setValue({
                                 fieldId: 'custbody_hno_shipping_cost_status',
                                 value: 2
                             })

                             rec.setSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_hno_item_stat',
                                 line: x,
                                 value: 2
                             })

                             email.send({
                                author: 2628559,
                                recipients: ['errorsdevelopers@gflgroup.com.au','errorsdispatch@gflgroup.com.au'],
                                subject: 'HNO Shipping Cost Calculation Error',
                                body: 'Please check '+tranid+ '. One of the items in this order has no shipping cost file. \nPlease check and upload it to Documents > File Cabinet> HNO Shipping Cost> File Library. \nEdit and save the record manually to recalculate HNO shipping cost.',
                              })


                         } else if (hno_ship_cost == -1) {
                             rec.setValue({
                                 fieldId: 'custbody_hno_shipping_cost_status',
                                 value: 2
                             })
                             rec.setSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_hno_item_stat',
                                 line: x,
                                 value: 1
                             })

                             email.send({
                                author: 2628559,
                                recipients: ['errorsdevelopers@gflgroup.com.au','errorsdispatch@gflgroup.com.au'],
                                subject: 'HNO Shipping Cost Calculation Error',
                                body: 'Please check '+tranid+ '. One of the items in this order has no shipping cost file.\nPlease check and upload it to Documents > File Cabinet> HNO Shipping Cost> File Library. \nEdit and save the record manually to recalculate HNO shipping cost.',
                              })

                         } else {
                             rec.setSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'custcol_hno_shipping_cost_line_item',
                                 line: x,
                                 value: item_qty * ((parseInt(hno_ship_cost) / 1.1).toFixed(2))
                             })

                             total_ship_cost = total_ship_cost + (item_qty * ((parseInt(hno_ship_cost) / 1.1).toFixed(2)))
                             if (total_ship_cost != 0) {
                                 rec.setValue({
                                     fieldId: 'shippingcost',
                                     value: total_ship_cost
                                 })

                                 var hno_stat = rec.getValue('custbody_hno_shipping_cost_status', )
                                 if (hno_stat == '' || hno_stat == 1 || hno_stat == 3) {
                                     rec.setValue({
                                         fieldId: 'custbody_hno_shipping_cost_status',
                                         value: 1
                                     })
                                 }
                                 rec.setSublistValue({
                                     sublistId: 'item',
                                     fieldId: 'custcol_hno_item_stat',
                                     line: x,
                                     value: 3
                                 })

                             }
                         }

                     }




                 }
             }
            }
         } catch (e) {
             log.error('error', e)
         }

     }

     /**
      * Function definition to be triggered before record is loaded.
      *
      * @param {Object} scriptContext
      * @param {Record} scriptContext.newRecord - New record
      * @param {Record} scriptContext.oldRecord - Old record
      * @param {string} scriptContext.type - Trigger type
      * @Since 2015.2
      */
     function afterSubmit(scriptContext) {


         //     var rec = record.create({
         //         type: 'salesorder',
         //         isDynamic: true
         //     })

         //     rec.setValue({
         //         fieldId: 'entity',
         //         value: 534418,
         //     })

         //     rec.setValue({
         //         fieldId: 'memo',
         //         value: 'test',
         //     })

         //    rec.selectNewLine({
         //        sublistId: 'item'
         //    })

         //    rec.setCurrentSublistValue({
         //        sublistId: 'item',
         //        fieldId: 'item',
         //        value: 12231
         //    })

         //    rec.commitLine({
         //        sublistId: 'item'
         //    })
         //    rec.save({
         //        enableSourcing: true,
         //        ignoreMandatoryFields: true
         //    })
     }


     function getShippingCost(diplay_name, postcode) {

         var item_disp_name = diplay_name
         var post_code = postcode
         var shipping_cost = ''
         item_disp_name = item_disp_name + '.csv'

         var search_result = getInternalId(item_disp_name)

         log.debug('search_result', search_result)

         if (search_result.internalId == undefined) {
             shipping_cost = -1
             log.debug('shipping_cost', shipping_cost)
         }
         log.debug('shipping_cost 1', shipping_cost)


         try {
             var arrLines = file.load({
                 id: search_result.internalId
             }).getContents().split(/\n|\n\r/);
             for (var i = 1; i < arrLines.length - 1; i++) {



                 var content = csvToArray(arrLines[i])

                 if (content[0][0] == post_code) {

                     shipping_cost = content[0][2]

                 }

             }
         } catch (e) {
             log.debug('error', e)
         }

         log.debug('shipping_cost 2', shipping_cost)

         return shipping_cost
     }

     function getInternalId(item_disp_name) {
         var folderSearchColName = search.createColumn({
             name: 'name',
             join: 'file'
         });
         var folderSearchColInternalId = search.createColumn({
             name: 'internalid',
             join: 'file'
         });
         var folderSearchObj = search.create({
             type: 'folder',
             filters: [
                 ['internalid', 'anyof', '12425886'],
                 'AND',
                 ['file.name', 'is', item_disp_name],
             ],
             columns: [
                 folderSearchColName,
                 folderSearchColInternalId,
             ],
         });

         var file_name
         var internalId

         folderSearchObj.run().each(function (result) {
             file_name = result.getValue(folderSearchColName);
             internalId = result.getValue(folderSearchColInternalId);
             return true;
         });

         return_obj = {
             'file_name': file_name,
             'internalId': internalId
         }

         return return_obj

     }


     function csvToArray(text) {
         let p = '',
             row = [''],
             ret = [row],
             i = 0,
             r = 0,
             s = !0,
             l;
         for (l of text) {
             if ('"' === l) {
                 if (s && l === p) row[i] += l;
                 s = !s;
             } else if (',' === l && s) l = row[++i] = '';
             else if ('\n' === l && s) {
                 if ('\r' === p) row[i] = row[i].slice(0, -1);
                 row = ret[++r] = [l = ''];
                 i = 0;
             } else row[i] += l;
             p = l;
         }
         return ret;
     }

     return {
         // beforeLoad: beforeLoad,
         beforeSubmit: beforeSubmit,
         // afterSubmit: afterSubmit
     };

 });