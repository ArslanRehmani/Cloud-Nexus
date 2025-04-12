
/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	
	var locationId=nlapiGetContext().getSetting('script','custscript1');
 
	var PutAwayBin; 
 
		switch (locationId) { // MISS: 104 , 105	EDM, 106	CHI
				case '1':  //Mississauga MISS
					PutAwayBin=104;
					nlapiLogExecution('DEBUG', 'Location->Bin','MISS->'+PutAwayBin);
					break;
				case '4': //Edmonton EDM
					PutAwayBin=105;
					nlapiLogExecution('DEBUG', 'Location->Bin','EDM->'+PutAwayBin);
					break;
				case '12': //Chicago CHI
					PutAwayBin=106;
					nlapiLogExecution('DEBUG', 'Location->Bin','CHI->'+PutAwayBin);
					break;
				default:
					nlapiLogExecution('ERROR', 'DEFAULT CASE:','SWITCH Default ran');
					break;
			}
	
	//nlapiLogExecution('debug','locationId',locationId);
	var binPutAway = nlapiCreateRecord('binworksheet',{recordmode:'dynamic',location:locationId});
	//var binPutAway = nlapiCreateRecord('binworksheet',{location:locationId});
	
	var itemCount=binPutAway.getLineItemCount('item');

  if(itemCount && itemCount > 0) {
	for(var i=1;i<=itemCount;i++){

		var quantity=binPutAway.getLineItemValue('item','quantity',i);
		var itemName=binPutAway.getLineItemValue('item','itemname',i);
		var itemID=binPutAway.getLineItemValue('item','item',i);
		//if (itemID != 117680)
			//continue;
			binPutAway.selectLineItem('item',i);
		
 
		var serialnumbers = searchLotNumbersFromItem(itemID,locationId);
      
		nlapiLogExecution('DEBUG', 'serialnumbers.length', serialnumbers.length);

//nlapiLogExecution('DEBUG', 'type', type);
		
		var inventoryDetails = binPutAway.createCurrentLineItemSubrecord('item','inventorydetail');

		//line item 1 subrecord 1 bin 1
		

		if(serialnumbers.length>0){
			var loopQty=0;
			for(k=0;k<serialnumbers.length;k++) { //k<serialnumbers.length
				nlapiLogExecution('DEBUG', 'k',k);
				nlapiLogExecution('DEBUG', 'loopQty',loopQty);
				//nlapiLogExecution('DEBUG', 'serialnumbers[k]',serialnumbers[k]);
				loopQty += parseInt(serialnumbers[k].getValue('quantity','inventoryDetail'));
				
				inventoryDetails.selectNewLineItem('inventoryassignment');
			
			//nlapiLogExecution('DEBUG', 'serialnumbers[k].getText',serialnumbers[k].getText('inventorynumber','inventoryDetail'));
			//nlapiLogExecution('DEBUG', 'serialnumbers[k].getValue',serialnumbers[k].getValue('inventorynumber','inventoryDetail'));
			nlapiLogExecution('DEBUG', 'serialnumbers[k].quantity',serialnumbers[k].getValue('quantity','inventoryDetail'));
				nlapiLogExecution('DEBUG', 'loopQty',loopQty);
			
				inventoryDetails.setCurrentLineItemValue('inventoryassignment', 'issueinventorynumber',serialnumbers[k].getValue('inventorynumber','inventoryDetail'));
				inventoryDetails.setCurrentLineItemValue('inventoryassignment', 'binnumber',PutAwayBin);
				inventoryDetails.setCurrentLineItemValue('inventoryassignment', 'quantity',serialnumbers[k].getValue('quantity','inventoryDetail'));
				inventoryDetails.commitLineItem('inventoryassignment');
				
				if(loopQty>=quantity) {
					loopQty=0;
					break;
					//k=serialnumbers.length;
				}
			}
								
				inventoryDetails.commit();
				binPutAway.commitLineItem('item');
		}
		else {
			inventoryDetails.selectNewLineItem('inventoryassignment');

			inventoryDetails.setCurrentLineItemValue('inventoryassignment', 'quantity',quantity);
			inventoryDetails.setCurrentLineItemValue('inventoryassignment', 'binnumber',PutAwayBin);
			inventoryDetails.commitLineItem('inventoryassignment');
		
			inventoryDetails.commit();
			binPutAway.commitLineItem('item');

		}
	}


	var id = nlapiSubmitRecord(binPutAway);
  	nlapiLogExecution('DEBUG', 'Bin Worksheet Id', id);
  }
}


function searchLotNumbersFromItem(itemID,locationId){
	nlapiLogExecution('DEBUG', 'Starting searchLotNumbersFromItem()', itemID);
	var s = nlapiSearchRecord("item",null,
[
   ["type","anyof","Assembly","InvtPart"], 
   "AND", 
   ["islotitem","is","T"], 
   "AND", 
   ["inventorydetail.binnumber","anyof","@NONE@"], 
   "AND", 
   ["inventorydetail.location","anyof",locationId], 
   "AND", 
   ["islotitem","is","T"], 
   "AND", 
   ["internalid","anyof",itemID]
], 
[
   new nlobjSearchColumn("itemid").setSort(false), 
   new nlobjSearchColumn("inventorynumber","inventoryDetail",null), 
   new nlobjSearchColumn("binnumber","inventoryDetail",null), 
   new nlobjSearchColumn("location","inventoryDetail",null),
   new nlobjSearchColumn("quantity","inventoryDetail",null), 
   new nlobjSearchColumn("lineid","inventoryDetail",null),
   new nlobjSearchColumn("internalid","inventoryDetail",null).setSort(true)
]
);
	//nlapiLogExecution('DEBUG', 's.length', s.length);
	if(s) {
		//nlapiLogExecution('DEBUG', 's.length', s.length);
	//for(j=0;j<s.length;j++){
		//nlapiLogExecution('DEBUG', 's'+j, s[j].getValue('displayname')+' '+s[j].getText('inventorynumber','inventoryDetail'));
	//}
	
		return s;//return[s[0].getText('inventorynumber','inventorynumberbinonhand'),s[0].getText('type')];
	}
	return [];
}