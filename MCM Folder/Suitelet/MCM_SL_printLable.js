/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/https', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/render', 'N/file','N/email','N/runtime'],
/**
 * @param {https} https
 * @param {record} record
 * @param {search} search
 * @param {serverWidget} serverWidget
 */
function(https, record, search, serverWidget, render, file,email,runtime) {
	
	
    /**
     * Definition of the Suitelet script trigger point.
     *
     * @param {Object} context
     * @param {ServerRequest} context.request - Encapsulation of the incoming request
     * @param {ServerResponse} context.response - Encapsulation of the Suitelet responsez
     * @Since 2015.2
     */     
    function onRequest(context) {
    	var PARAMS = context.request.parameters;
		log.debug('request', PARAMS);
    	if(context.request.method=='GET'){
    		var CUST; 			
			if(PARAMS.tranid){ //add security check here
				  var TRANSACTION = record.load({type: 'purchaseorder', id: PARAMS.tranid});   
          log.error('PO', PARAMS.tranid);               

          var TEMPLATE = render.create();
          TEMPLATE.addRecord({templateName: 'record', record: TRANSACTION}); 

          var lines = getTranData(PARAMS.tranid);

          // var lineNum = TRANSACTION.findSublistLineWithValue({
          //   sublistId: 'item',
          //   fieldId: 'item',
          //   value: PARAMS.item,
          // });

          log.audit('lines length', lines.length);
          
          log.debug('lines', lines);

          var customData = {lines: []};


          for(var i=0; lines && i < lines.length; i++) {
            for(var x in lines[i]) {
              if(typeof lines[i][x] == 'string') {
                lines[i][x] = lines[i][x].trim();
              }
            }
            customData.lines.push(lines[i]);            
          }

          // Debug code
          // if(PARAMS.tranid == 548260) {
          //     customData.lines = [];
          //     for(var i=6; i < 9 ; i++) {                           
          //       customData.lines.push(lines[i]);            
          //       log.audit('line', lines[i]);
          //     }            
          // }

          // customData = JSON.parse(JSON.stringify(customData).replace(/&/g, '&amp;'));
          customData = JSON.parse(escapeXml(JSON.stringify(customData)));
          
          
          log.audit('customData', customData);
          
          TEMPLATE.addCustomDataSource({
              alias: "JSON",
              format: render.DataSource.OBJECT,
              data: customData
          });    

          var templateFile = file.load({
              id: 1201473     // Label Template.html
          });
          log.debug('templateFile', templateFile.getContents());
          TEMPLATE.templateContent = templateFile.getContents();  
          log.debug('CONTENT', templateFile.getContents());
          // TEMPLATE.renderToResponse(context.response); 
          var pdf = TEMPLATE.renderAsPdf();                
          context.response.writeFile(pdf,true); 

          return;
			}
    		
    	} else {
            context.response.write('Something is wrong.');
        }

    }

    function getTranData(tranid) {
      var purchaseorderSearchObj = search.create({
         type: "purchaseorder",
         filters:
         [
            ["type","anyof","PurchOrd"], 
            "AND", 
            ["internalid","anyof", tranid], 
            "AND", 
            ["item.type","anyof","InvtPart","Kit","Group"]
         ],
         columns:
         [
            search.createColumn({name: "item", label: "Item"}),
            search.createColumn({
               name: "salesdescription",
               join: "item",
               label: "Description"
            }),
            search.createColumn({
               name: "itemid",
               join: "item",
               label: "Name"
            }),
            search.createColumn({name: "custcol_item_dims_sales_order", label: "Item Dims - Sales Order"}),
            search.createColumn({name: "custcol_product_colour_quote", label: "Product Colour"}),
            search.createColumn({
               name: "custitem_carton_height",
               join: "item",
               label: "Carton Height"
            }),
            search.createColumn({
               name: "custitem_carton_width",
               join: "item",
               label: "Carton Width"
            }),
            search.createColumn({
               name: "custitem_carton_length",
               join: "item",
               label: "Carton Length"
            }),
            search.createColumn({
               name: "custitem_carton_weight",
               join: "item",
               label: "Carton Weight (kgs)"
            }),
            search.createColumn({
               name: "custitem_units_per_carton",
               join: "item",
               label: "Units Per Carton"
            }),
            search.createColumn({name: "custcol_item_version", label: "Item Version"})
         ]
      });      
      var searchResultCount = purchaseorderSearchObj.runPaged().count;
      log.debug("purchaseorderSearchObj result count",searchResultCount);

      var tranData = [];
      purchaseorderSearchObj.run().each(function(result){
         // .run().each has a limit of 4,000 results         
          tranData.push({
              id: result.getValue({
                    name: 'item'
              }),
              sku: result.getValue({
                  name: 'itemid',
                  join: 'item'
              }),
              desc: result.getValue({
                  name: 'salesdescription',
                  join: 'item'
              }),
              size: result.getValue({
                  name: 'custcol_item_dims_sales_order'
              }),
              color: result.getValue({
                  name: 'custcol_product_colour_quote'                  
              }),
              carton_width: result.getValue({
                  name: 'custitem_carton_width',
                  join: 'item'
              }),
              carton_height: result.getValue({
                  name: 'custitem_carton_height',
                  join: 'item'
              }),
              carton_length: result.getValue({
                  name: 'custitem_carton_length',
                  join: 'item'
              }),
              carton_weight: result.getValue({
                  name: 'custitem_carton_weight',
                  join: 'item'
              }),              
              carton_unit: result.getValue({
                  name: 'custitem_units_per_carton',
                  join: 'item'
              }),              
              custcol_item_version: result.getValue({
                  name: 'custcol_item_version'
              }),              
          })
         return true;
      });
      return tranData;
    }

    function lookupRecord(type, fieldID, fieldValue) {
      try {
        // log.debug('lookupEntityID : ', 'type = ' + type +
        // ',fieldID = ' + fieldID + ',fieldValue = ' + fieldValue
        // );
        if ( _logValidation(type) && _logValidation(fieldID) && _logValidation(fieldValue) ) {
          var searchObj = search.create({
            type: type,
            filters: [
              [fieldID, "is", fieldValue]
            ],
            columns: [search.createColumn({
              name: "internalid"
            })]
          });
          var entityID = null;
          //log.debug('lookupEntityID Search', searchObj);
          searchObj.run().each(function(result) {
            // the first record if found then return the record id
            //log.debug('lookupEntityID: result', result);
            entityID = result.getValue('internalid');
            return false;
          });
          return entityID;
        }
      } catch (ex) {
        log.error('lookupEntityID Error', ex.message);
        log.error('lookupEntityID : ', 'fieldID = ' + fieldID +
                  ',fieldValue = ' + fieldValue);
      }
      return null;
    }

    function escapeXml(unsafe) {
      return unsafe.replace(/[<>&']/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          // case '"': return '&quot;';
        }
      });
    }

    function _logValidation(value) {
        if (value != null && value !== '' && value != undefined && value.toString() != 'NaN' && value != NaN) {
          return true;
        } else {
          return false;
        }
    }

    return {
        onRequest: onRequest
    };
    
});