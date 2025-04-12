function MN_UE_SetInvtDetails_AS(type, form) {
    if (type == 'create' || type == 'edit') {
        try {
            var recType = nlapiGetRecordType();
            var recId = nlapiGetRecordId();
            nlapiLogExecution('Debug', 'MN_UE_SetInvtDetails_AS', 'recId = ' + recId + ', recType = ' + recType);

            var poObj = nlapiLoadRecord(recType, recId);

            var location = poObj.getFieldValue('location');

            //////IF LOCATION IS ABC, Mississauga & ABC, Montreal (this location doesn't use Bin Number)
			//////ABC, Edmonton = 4
			//////ABC, Vancouver = 3
			////// ABCUS, Dallas = 10
			//////ABCUS, Chicago = 12
            //////ABCUS, Los Angeles = 20
			if(location == 1 || location == 2 || location == 3 || location == 4 || location == 10 || location == 12 || location == 20)
            {                
                var lineItemCount = poObj.getLineItemCount('item');
                nlapiLogExecution('debug', 'MN_UE_SetInvtDetails_AS function', 'lineItemCount: ' + lineItemCount);
                var updateRecord = true;
                
				var binNumber = '';

					if(location == 1) {
					    binNumber = '104';
					}
					else if(location == 4)
					{
						binNumber = '105';///?EDM
					}
					else if(location == 12)
					{
						binNumber = '106';///?CHI
					}
					var lotNumber = 'GOLIVE05132022';
                
                for (var i = 1; i <=  lineItemCount; i++) {
                    poObj.selectLineItem('item', i);

                	 var qty = poObj.getCurrentLineItemValue("item", "quantity");
                     nlapiLogExecution('debug', 'qty', 'qty: ' + qty);
                     var shpqty = poObj.getCurrentLineItemValue("item", "quantityonshipments");
                     nlapiLogExecution('debug', 'shpqty', 'shpqty: ' + shpqty);
                     var itemId = poObj.getCurrentLineItemValue("item", "item");
                	 var rate= poObj.getCurrentLineItemValue("item", "rate");
                     var description =" Duplicate Item Split Due to partial Inbound shipment, Orig qty:"+qty
                     
                     if(shpqty&&Number(shpqty)!=Number(qty)){
                    	 
                    	 var diff=Number(qty)-Number(shpqty)
                    	 nlapiLogExecution('debug', 'diff',diff);
                    	 poObj.removeCurrentLineItemSubrecord('item', 'inventorydetail');
                    	 poObj.setCurrentLineItemValue("item", "quantity",shpqty);
                    	 poObj.setCurrentLineItemValue('item', 'custcol_line_description','Original Item Split Qty:'+qty);

                    	 poObj.commitLineItem('item');

                    	 /*if(poObj.getLineItemCount('item')>i){
                    		 
                    	 poObj.insertLineItem('item', i+1)
                    	 i++;
                    	 
                    	 }else{
                        	 poObj.selectNewLineItem('item');
                    	 }
                    	 */
                    	 poObj.selectNewLineItem('item');
                    	 poObj.setCurrentLineItemValue('item', 'item', itemId); //MISS
                    	 poObj.setCurrentLineItemValue('item', 'rate', rate);
                    	// t=poObj.getCurrentLineItemValue("item", "item");
                         //nlapiLogExecution('debug', 'item commited', 'lineItemCount: ' + lineItemCount+' '+t);

                    	 poObj.setCurrentLineItemValue('item', 'quantity', diff);
                    	 poObj.setCurrentLineItemValue('item', 'custcol_line_description',description);

                    	 poObj.commitLineItem('item');
                     }
                	
                }

                
                var lineItemCount = poObj.getLineItemCount('item');
                nlapiLogExecution('debug', 'MN_UE_SetInvtDetails_AS function', 'lineItemCount: ' + lineItemCount);

                for (var i = 1; i <= lineItemCount; i++) {
                    poObj.selectLineItem('item', i);
                    var qty = poObj.getCurrentLineItemValue("item", "quantity");


                    var itemId = poObj.getCurrentLineItemValue("item", "item");
                   
                    
                    var islotitem = nlapiLookupField('item', itemId, 'islotitem');

                    if(!isEmpty(islotitem) && islotitem == 'T')
                    {                   
                        var isInventoryAvail = poObj.getCurrentLineItemValue('item', 'inventorydetailavail');
                        var invDetailSubrecord;

                        if (isInventoryAvail == 'F') {
                            //////create line item sub records
                            invDetailSubrecord = poObj.createLineItemSubrecord('item', 'inventorydetail');
                            invDetailSubrecord.selectNewLineItem('inventoryassignment');
                            invDetailSubrecord.setCurrentLineItemValue('inventoryassignment', 'binnumber', binNumber);
                            invDetailSubrecord.setCurrentLineItemValue('inventoryassignment', 'receiptinventorynumber', 'GOLIVE05132022'); //Serial / Lot Number
                            invDetailSubrecord.setCurrentLineItemValue('inventoryassignment', 'quantity', qty);
                            invDetailSubrecord.commitLineItem('inventoryassignment');
                            invDetailSubrecord.commit();
                        }
                        else
                        {
                            invDetailSubrecord = poObj.editCurrentLineItemSubrecord('item', 'inventorydetail');

                            if(!invDetailSubrecord)
                            {
                                invDetailSubrecord = poObj.createCurrentLineItemSubrecord('item', 'inventorydetail');
                            }
                            var subRecLines = invDetailSubrecord.getLineItemCount('inventoryassignment');
                            nlapiLogExecution('debug', 'MN_UE_SetInvtDetails_AS function', 'subRecLines: ' + subRecLines);
        

                            if(subRecLines <= 0)
                            {
                                //////create line item sub records
                                ////invDetailSubrecord = poObj.createLineItemSubrecord('item', 'inventorydetail');
                                invDetailSubrecord.selectNewLineItem('inventoryassignment');
                                invDetailSubrecord.setCurrentLineItemValue('inventoryassignment', 'binnumber', binNumber);
                                invDetailSubrecord.setCurrentLineItemValue('inventoryassignment', 'receiptinventorynumber', 'GOLIVE05132022'); //Serial / Lot Number
                                invDetailSubrecord.setCurrentLineItemValue('inventoryassignment', 'quantity', qty);
                                invDetailSubrecord.commitLineItem('inventoryassignment');
                                invDetailSubrecord.commit();
                            }
                            else
                            {                                
                                invDetailSubrecord.commitLineItem('inventoryassignment');
                                invDetailSubrecord.commit();
                            }
                        }
                    }
                    poObj.setCurrentLineItemValue("item", "location", location);
                    poObj.commitLineItem('item');
                }
                if (updateRecord) {
                    nlapiSubmitRecord(poObj);
                }
            }
        } catch (error) {
            nlapiLogExecution('Error', 'Error occurred on MN_UE_SetInvtDetails_AS', JSON.stringify(error));
        }
    }
}

/**
 * Return true if object is empty
 */
 function isEmpty(value) {
    if (value == null || value == 'null' || value == undefined || value == 'undefined' || value == '' || value == "" || value.length <= 0) {
        return true;
    }
    return false;
}
