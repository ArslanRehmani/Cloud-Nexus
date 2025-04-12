/*******************************************************************
 *
 * Name: lirik.cl.price_level_zero
 *
 * @NApiVersion 2.x
 * @NScriptType ClientScript
* @NModuleScope SameAccount
 *
 * Author: Lirik, Inc.(Jamshed Ansari)
 * Purpose: This script is used to make the price level as custom and profit % as zero in sales order for intercompany.
 * Script: lirik.cl.unitpriceupdate
 * Deploy: customdeploy_lirik_unitpriceupdate
 *
 * ******************************************************************* */

define(['N/record','N/currentRecord','N/log'],
function(record,currentRecord,log)
{

    function fieldChanged(context){

        try{

            var nsRecordObj = context.currentRecord;
            var sublistName = context.sublistId;
            var fieldName = context.fieldId;
            var recordType = nsRecordObj.type;

            if (recordType === 'salesorder') {
  
                if (sublistName === 'item' && fieldName === 'item') {
        
                  var customer = nsRecordObj.getValue({
                    fieldId: 'entity'
                  });
				  
				  var exchangeRate = nsRecordObj.getValue({
					fieldId: 'exchangerate'
				  });
				  
                  if (customer == '6913' || customer == '9577' || customer == '9579' || customer == '9578' || customer == '16568' || customer == '6918' || customer == '8862' || customer == '20487' || customer == '20486') {
        
                    nsRecordObj.setCurrentSublistValue({
                      sublistId: 'item',
                      fieldId: 'price',
                      value: '-1'
                    });
                    log.debug('fieldName',fieldName);
                     if (fieldName !== 'rate' ) { //  ||fieldName == 'averagecost'
                      
                      var avgCost = nsRecordObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'averagecost',
                        ignoreFieldChange: true
                      });
                      if (avgCost) {
                        var lineQty = nsRecordObj.getCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'quantity',
                          ignoreFieldChange: true
                        });
                   //     log.debug('lineQty',lineQty);
                  //      log.debug('exchangeRate',exchangeRate);
						if (exchangeRate!= null) {
							var newRate = avgCost/exchangeRate;
						} else {
							var newRate = avgCost;
						}
                        var newAmount = newRate * lineQty;
                  //      log.debug('new average cost',newAmount);
                        nsRecordObj.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'rate',
                          value: newRate
                        });
                        nsRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'location',
                            value: nsRecordObj.getValue({ fieldId: 'location' })
                          });
        
                        nsRecordObj.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'amount',
                          value: newAmount
                          //ignoreFieldChange: true
                        });
						nsRecordObj.setCurrentSublistValue({
                          sublistId: 'item',
                          fieldId: 'amount',
                          value: newAmount
                          //ignoreFieldChange: true
                        });
                      }
                     }
                    var forInvoicingGroup = nsRecordObj.getValue({
                      fieldId: 'forinvoicegrouping'
                    });
        
                    if (forInvoicingGroup) {
                      nsRecordObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_profit',
                        value: 0,
                        ignoreFieldChange: true
                      });
                    }
                  }
                }
              }
    
        }catch(err){
            log.debug('Error in fieldChanged'+ err.message);
        }
    }
	
	function saveRecord(context) {
		try{
			log.debug('postSave','In postSave');
		}catch(err){
            log.debug('Error in postSave'+ err.message);
        }
		
    }

    return{
        saveRecord: saveRecord
    };

});