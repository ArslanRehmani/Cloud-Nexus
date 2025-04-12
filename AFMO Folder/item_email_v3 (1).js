function item_email_UE(type)
{
	if(type=="create")
	{
		try
		{
			var context = nlapiGetContext();
			if(context.getExecutionContext()=="userinterface")
			{
				nlapiLogExecution("debug","Triggered via UI. Script will not run.");
				return true;
			}
			
			var order = nlapiGetNewRecord();
			var orderId = nlapiGetRecordId();
			var customer = order.getFieldValue("entity");
            var paymentMethod = order.getFieldValue("paymentmethod")
			var orderItems = [];
			
			//Prevent script from running on both sales orders and cash sales
			var createdFrom = order.getFieldValue("createdfrom");
			if(createdFrom!=null && createdFrom!="")
				return true;
          
			var sentItems = [];
			
			for(var x=0; x < order.getLineItemCount("item"); x++)
			{
				var item = order.getLineItemValue("item","item",x+1);
				
				var alreadySent = false;
				
				for(var i=0; i < sentItems.length; i++)
				{
					if(item==sentItems[i])
					{
						alreadySent = true;
						break;
					}
				}
				
				if(alreadySent===true)
					continue;
				
				var itemDetails = nlapiLookupField("item",order.getLineItemValue("item","item",x+1),["custitem_email_template","custitem_email_from"]);
				
				if(itemDetails.custitem_email_template !=null && itemDetails.custitem_email_template !="")
				{
                	//Email Attendee
					var emailMerger = nlapiCreateEmailMerger(itemDetails.custitem_email_template);
					emailMerger.setTransaction(orderId);
                	emailMerger.setEntity("customer", customer);
                
					var mergeResult = emailMerger.merge();
					var emailBody = mergeResult.getBody();
				
                	var records = new Object();
                	records["transaction"]=orderId;
                	records["entity"]=customer;
					
		            //Send different Template for paypal orders
					if(paymentMethod=="9")
		              {
		                var emailMergerPayPal = nlapiCreateEmailMerger(3);
							emailMergerPayPal.setTransaction(orderId);
		                	emailMergerPayPal.setEntity("customer", customer);
		                
							var mergeResult = emailMergerPayPal.merge();
							var emailBody = mergeResult.getBody();
		                nlapiSendEmail(itemDetails.custitem_email_from,customer,mergeResult.getSubject(),emailBody,null,null,records,null,true);
		              }else{
		                nlapiSendEmail(itemDetails.custitem_email_from,customer,mergeResult.getSubject(),emailBody,null,null,records,null,true);
		              }
			  
			  		sentItems.push(item);

               }
          }
		}
		catch(err)
		{
			nlapiLogExecution("error","Error Handling Item Auto Email","Details: " + err.message);
		}
	}
}