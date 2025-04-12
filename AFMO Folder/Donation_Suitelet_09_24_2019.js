var CAPTCHA_VERIFICATION_URL = 'https://www.google.com/recaptcha/api/siteverify';
var CAPTCHA_PRIVATE_KEY = '6LeDw7wUAAAAAKYZYaYRz1MKoWf5bollVinT4nt5';

function createCustomOrder(params) {
    
	nlapiLogExecution("debug","In Suitelet!");
	
	var returnObj = {
		sales_order_number : "",
		success : true,
		error : "",
		hold_details : "",
		hold_reason : "",
		payment_status : "",
		paypal_url : ""
	};
	
	var customRec = nlapiCreateRecord("customrecord_donation_page");
	
	var payloadObj = {
		campaign : params.getParameter("campaign"),
		ccexpiredate : params.getParameter("ccexp"),
		monthlyGift : params.getParameter("monthlyGift"),
		paymentMethod : params.getParameter("paymentMethod"),
		includeFee : params.getParameter("includeFee"),
		itemId : params.getParameter("itemid"),
		amount : params.getParameter("amount"),
		firstName : params.getParameter("firstName"),
		lastName : params.getParameter("lastName"),
		address : params.getParameter("address"),
        address2 : params.getParameter("address2"),
		city : params.getParameter("city"),
		state : params.getParameter("state"),
		zipcode : params.getParameter("zip"),
		country : params.getParameter("country"),
		email : params.getParameter("email"),
		phone : params.getParameter("phone"),
		newsletter : params.getParameter("newsLetter"),
		memorial : params.getParameter("memorial"),
		nameHonor : params.getParameter("nameHonor"),
		addressHonor : params.getParameter("addressHonor"),
      	emailHonor : params.getParameter("emailHonor"),
        fromHonor : params.getParameter("fromHonor"),
        dedicationHonor : params.getParameter("dedicationHonor"),
		comments : params.getParameter("comments"),
		donationFor : params.getParameter("donationFor"),
		fund : params.getParameter("fund"),
      	qty : params.getParameter("qty"),
		tickets : params.getParameter("tickets"),
      	tables : params.getParameter("tables"),
		guests : params.getParameter("guests"),
		additionalAmount : params.getParameter("additionalAmount"),
		additionalInfo : params.getParameter("additionalInfo"),
        type : params.getParameter("type"),
        contactMethod : params.getParameter("contact"),
        dedicationInterest : params.getParameter("dedicationInterest"),
        legacyInterest : params.getParameter("legacyInterest"),
        twinningInterest : params.getParameter("twinningInterest")
	}
	
	customRec.setFieldValue("custrecord_form_data",JSON.stringify(payloadObj));
	var customRecId = nlapiSubmitRecord(customRec,true,true);
	
	//Check for Google reCaptcha
	var postData = {
		secret : CAPTCHA_PRIVATE_KEY,
		response : params.getParameter("recaptcha")
	};
	
	nlapiLogExecution("debug","Post Data",JSON.stringify(postData));
	
	var captchaVerificationResponse = nlapiRequestURL(CAPTCHA_VERIFICATION_URL, postData);
	
	nlapiLogExecution("debug","Google Response Code",captchaVerificationResponse.getCode());
	nlapiLogExecution("debug","Google Response Body",captchaVerificationResponse.getBody());
	
	if(captchaVerificationResponse.getCode() != 200 || captchaVerificationResponse.getBody().indexOf('true') == -1) {
		
		//Failed verification
		nlapiLogExecution("audit","Not Processing Record (Google reCaptcha Failed)","First Name: " + params.getParameter("firstName") + 
							"\n\nEmail: " + params.getParameter("email"));
		
		//returnObj.thank_you_page = thankYouPage;
		
		returnObj.success = false;
		returnObj.error = "Google Recaptcha server validation failed.";

   		_sendJSResponse(request, response, returnObj);
		
		return true;
	}else{
		//Successful verification
		nlapiLogExecution("audit","Google reCaptcha validation successful");
	}
	
	//Check minimum and maximum donation amounts
	var minDonation = nlapiGetContext().getSetting("SCRIPT","custscript_min_donation_amount");
	nlapiLogExecution("debug","Minimum Donation Amount",minDonation);
	
	if(minDonation!=null && minDonation!="")
	{
		if(parseFloat(payloadObj.amount) < parseFloat(minDonation))
		{
			nlapiLogExecution("error","Donation Is Below Min Donation","Script will terminate.");
			
			returnObj.success = false;
			returnObj.error = "Donation Is Below Min Donation.";
			
			_sendJSResponse(request, response, returnObj);
			return true;
		}
	}
	
	var maxDonation = nlapiGetContext().getSetting("SCRIPT","custscript_max_donation_amount");
	nlapiLogExecution("debug","Maximum Donation Amount",maxDonation);
	
	if(maxDonation!=null && maxDonation!="")
	{
		if(parseFloat(payloadObj.amount) > parseFloat(maxDonation))
		{
			nlapiLogExecution("error","Donation Exceeds Max Donation","Script will terminate.");
			
			returnObj.success = false;
			returnObj.error = "Donation Exceeds Max Donation";
			
			_sendJSResponse(request, response, returnObj);
			return true;
		}
	}
	
	//Grab IP address from header
	var headers = request.getAllHeaders();
	var ipAddress = "";
	for(header in headers)
	{
		nlapiLogExecution("debug","Header: " + header,"Value: " + headers[header]);
		if(header=="ns-client-ip")
		{
			ipAddress = headers[header];	
			break;
		}
	}
	
	nlapiLogExecution("debug","IP Address",ipAddress);
	
	//Check if order came in within past X minutes from same IP address
	var filterExp = [
		["mainline","is","T"],
		"and",
		["formulanumeric:{now} - {datecreated}","lessthan","0.004167"],
		"and",
		[
			["custbody_donation_ip_address","is",ipAddress],
			"or",
			[
				["customer.firstname","is",payloadObj.firstName],
				"and",
				["customer.lastname","is",payloadObj.lastName],
			]
		]
	];
	var cols = [];
	cols.push(new nlobjSearchColumn("tranid"));
	var results = nlapiSearchRecord("salesorder",null,filterExp,cols);
	if(results)
	{
		nlapiLogExecution("error","Velocity Threshold Reached","Script deployment will terminate to prevent additional transactions.");
		
		if(results.length >= 3)
		{
			killIt();
			
			returnObj.success = false;
			returnObj.error = "Script fail. Contact Migdal support to place your donation.";
			
			_sendJSResponse(request, response, returnObj);
			return true;
		}
	}
	
	try
	{
        var ccNumber = params.getParameter("ccnumber");
        if(ccNumber!='')
          ccNumber = ccNumber.replace(/ /gi, "");
		
        var segNumber = params.getParameter("cccvc");
        var campaign = params.getParameter("campaign");
        var ccexpiredate  = params.getParameter("ccexp"); 
        var monthlyGift  = params.getParameter("monthlyGift");
        nlapiLogExecution("debug","frequency",monthlyGift);
		
        var paymentmethod = params.getParameter("paymentMethod");
        var idCustomer = params.getParameter("customerid");
		var includeFee = params.getParameter("includeFee");
		nlapiLogExecution("debug","Include CC Processing Fee?",includeFee);
		
		nlapiLogExecution("debug","Section 1");
		
        //params items
        //var itemid = nlapiGetContext().getSetting('SCRIPT','custscript_donation_item');
        var amount = params.getParameter("amount"); 
		
        //params billing
        var firstName = params.getParameter("firstName");
        var lastName = params.getParameter("lastName");
        var address = params.getParameter("address");
      	var address2 = params.getParameter("address2");
        var city = params.getParameter("city");
        var state = params.getParameter("state");
        var country = params.getParameter("country");
        var zip = params.getParameter("zip");
        var email = params.getParameter("email");
        var phone = params.getParameter("phone");
        var newsletter = params.getParameter("newsLetter");
        var memorial = params.getParameter("memorial");
        var emailFrom = "5233";
        var nameHonor = params.getParameter("nameHonor");
        var addressHonor = params.getParameter("addressHonor");
      	var emailHonor = params.getParameter("emailHonor");
        var fromHonor = params.getParameter("fromHonor");
        var dedicationHonor = params.getParameter("dedicationHonor");
        var comments = params.getParameter("comments");
        var donationFor = params.getParameter("donationFor");
        var fund = params.getParameter("fund");
      	var qty = params.getParameter("qty");
        var tickets = params.getParameter("tickets");
      	var tables = params.getParameter("tables");
        var guests = params.getParameter("guests");
        var additionalAmount = params.getParameter("additionalAmount");
		var additionalInfo = params.getParameter("additionalInfo");
      	var type = params.getParameter("type");
      	var itemid = params.getParameter("itemid");
        var contactMethod = params.getParameter("contact");
        var dedicationInterest = params.getParameter("dedicationInterest");
        var legacyInterest = params.getParameter("legacyInterest");
        var twinningInterest = params.getParameter("twinningInterest");
		nlapiLogExecution("debug","Section 2");
		
		var filters = [];
		filters.push(new nlobjSearchFilter("email",null,"is",email));
        filters.push(new nlobjSearchFilter("firstname",null,"is",firstName));
        filters.push(new nlobjSearchFilter("lastname",null,"is",lastName));
		
		var filterExp = [
			["lastname","is",lastName],
			"and",
			[
				["email","is",email],
				"or",
				["custentity_afmo_cust_businessemail","is",email]
			]
		];
		
		var cols = [];
		cols.push(new nlobjSearchColumn("datecreated").setSort());
		var results = nlapiSearchRecord("customer",null,filterExp,cols);

         if(results)
		{
			var customer  = nlapiLoadRecord("customer",results[0].getId());
		}
		else
		{
			var customer  = nlapiCreateRecord("customer");
			customer.setFieldValue('subsidiary','2');
			customer.setFieldValue('autoname', "F");
	       	customer.setFieldValue('isperson', "T");
          	customer.setFieldValue('email', email);
			customer.setFieldValue('firstname', firstName);
			customer.setFieldValue('lastname', lastName);
		}
		customer.setFieldValue('custentity_best_contact_method', contactMethod);
		customer.setFieldValue('phone', phone);
        if(dedicationInterest == 'dedication')
          customer.setFieldValue('custentity_dedication_program', '1');
        if(legacyInterest == 'legacy')
          customer.setFieldValue('custentity_planned_giving', '1');
        if(twinningInterest == 'twinning')
          customer.setFieldValue('custentity_twinning_program', '1');
		
		//create address subrecord
		customer.selectNewLineItem("addressbook");
		customer.setCurrentLineItemValue("addressbook","label",address);	
		customer.setCurrentLineItemValue("addressbook","defaultbilling","T");
		customer.setCurrentLineItemValue("addressbook","defaultshipping","T");
		
		var subrecord = customer.createCurrentLineItemSubrecord("addressbook","addressbookaddress");
		subrecord.setFieldValue("country",country);
		subrecord.setFieldValue("addressee",firstName + " " + lastName);
		subrecord.setFieldValue("addr1",address);
        subrecord.setFieldValue("addr2",address2);
		subrecord.setFieldValue("city",city);
		subrecord.setFieldValue("state",state);
		subrecord.setFieldValue("zip",zip);
		subrecord.commit();
		
		customer.commitLineItem("addressbook");
				
		if(paymentmethod!="9")
		{
			customer.selectNewLineItem('creditcards');
			customer.setCurrentLineItemValue('creditcards', 'ccexpiredate', ccexpiredate);
			customer.setCurrentLineItemValue('creditcards', 'ccname', firstName + " " + lastName);
			customer.setCurrentLineItemValue('creditcards', 'ccnumber', ccNumber);
			customer.setCurrentLineItemValue('creditcards', 'paymentmethod', paymentmethod);
			customer.setCurrentLineItemValue('creditcards', 'ccdefault', 'T');
			customer.commitLineItem('creditcards');
		}
           
		nlapiLogExecution("debug","Section 3");
		/*  IGNORE LOGIN STUFF    
		if(customer.getFieldValue("giveaccess")=='F')
		{
			customer.setFieldValue('giveaccess', 'T');
			
			var newPass = randomPassword(10);
			
			customer.setFieldValue('password', newPass);
			customer.setFieldValue('password2', newPass);
			customer.setFieldValue('custentity_temp_pw', newPass);
		}
        */     
		var idCustomer = nlapiSubmitRecord(customer,true,true);
		nlapiLogExecution("debug","Customer Internal ID",idCustomer);

		var order = nlapiCreateRecord('salesorder');
      
		order.setFieldValue('entity',idCustomer);
		order.setFieldValue('custbody_donation_ip_address',ipAddress);
		order.setFieldValue('custbody_solupay_paymentprocessprofile',"1")
		order.selectNewLineItem('item');
		order.setCurrentLineItemValue('item', 'item', itemid);
		
		nlapiLogExecution("debug","Original amount from website",amount);
		if(amount!=null && amount!="")
			amount = parseFloat(amount.replace(/,/g, ''));
            
		nlapiLogExecution("debug","formatted amount",amount);
        if(fund!=null && fund!="")
          order.setCurrentLineItemValue('item', 'custcol_cseg_npo_program', fund);
        order.setCurrentLineItemValue('item', 'amount', amount);
        order.setCurrentLineItemValue('item', 'rate', amount);
        order.setCurrentLineItemValue('item', 'quantity', 1);
        order.commitLineItem('item');
        
        
      	
		if(includeFee=="optin")
		{
			order.selectNewLineItem('item');
       		order.setCurrentLineItemValue('item', 'item', nlapiGetContext().getSetting('SCRIPT','custscript_processing_fee_item'));
			order.setCurrentLineItemValue('item', 'amount', nlapiFormatCurrency(amount * nlapiGetContext().getSetting('SCRIPT','custscript_processing_fee_amount')));
            order.setCurrentLineItemValue('item', 'rate', nlapiFormatCurrency(amount * nlapiGetContext().getSetting('SCRIPT','custscript_processing_fee_amount')));
        	order.setCurrentLineItemValue('item', 'quantity', 1);
			order.commitLineItem('item');
		}
		if(paymentmethod == '9'){
          order.setFieldValue('ccexpiredate','');
          order.setFieldValue('creditcard','');
          order.setFieldValue('ccnumber','');
          order.setFieldValue('ccname','');
          order.setFieldValue('getauth','F');
        }	
      
        if(paymentmethod!="9")
		{
			order.setFieldValue('ccnumber',ccNumber);
			order.setFieldValue('ccexpiredate',ccexpiredate);
			order.setFieldValue('ccname',firstName + " " + lastName);
			order.setFieldValue('getauth','T');
			order.setFieldValue('ccsecuritycode',segNumber);
		}

        order.setFieldValue('paymentmethod', paymentmethod);
		//order.setFieldValue('custbody_nof_donationtransactionflag', 'T');
        //order.setFieldValue('custbody_tno_isgrantransaction', 'F');
        order.setFieldValue('billphone',phone);
        order.setFieldValue('billstate',state);
        order.setFieldValue('billzip',zip);
        order.setFieldValue('billcity',city);
        order.setFieldValue('billcountry',country);     
        order.setFieldValue('mandatorytaxcode','F');
        order.setFieldValue('memo',comments);
		//order.setFieldValue('undepfunds','T');
      
        nlapiLogExecution("debug","Honor/Memory",memorial);
        if(memorial=="memory"){
          nlapiLogExecution("debug","Memory",memorial);
          order.setFieldValue('custbody_tribute_type',"2");
        }
        if(memorial=="honor"){
          nlapiLogExecution("debug","Honor",memorial);
          order.setFieldValue('custbody_tribute_type',"1");
        }
        order.setFieldValue('custbody_tribute_from',fromHonor);
        order.setFieldValue('custbody_tribute_email',emailHonor);
      	order.setFieldValue('custbody_tribute_address',addressHonor);
        order.setFieldValue('custbody_tribute_to',nameHonor);
        order.setFieldValue('custbody_tribute_dedication',dedicationHonor);
      nlapiLogExecution("debug","type",type);
      nlapiLogExecution("debug","qty",qty);
        
      	if(monthlyGift=='monthly')
          order.setFieldValue('custbody_monthly','T');
      	
      	
      
        try{
            nlapiLogExecution("debug","Made it to end",idCustomer);
	       
		    var idOrder = nlapiSubmitRecord(order,true,true);
			
			nlapiSubmitField("customrecord_donation_page",customRecId,"custrecord_created_transaction",idOrder);
			
			var filters = [];
			filters.push(new nlobjSearchFilter("transaction",null,"is",idOrder));
			filters.push(new nlobjSearchFilter("mainline","transaction","is","T"));
			var cols = [];
			cols.push(new nlobjSearchColumn("holdreason"));
			cols.push(new nlobjSearchColumn("holddetails"));
			cols.push(new nlobjSearchColumn("paymentstatus"));
            //cols.push(new nlobjSearchColumn("statusreason"));
          	cols.push(new nlobjSearchColumn("paymenteventtype"));
			cols.push(new nlobjSearchColumn("tranid","transaction"));
            cols.push(new nlobjSearchColumn("total","transaction"));
			var results = nlapiSearchRecord("paymentevent",null,filters,cols);
			if(results)
			{
				returnObj.sales_order_number = results[0].getValue("tranid","transaction");
                returnObj.sales_order_amount = results[0].getValue("total","transaction");
				returnObj.hold_details = results[0].getValue("holddetails");
				returnObj.hold_reason = results[0].getText("holdreason");
				returnObj.payment_status = results[0].getText("paymentstatus");
              	//returnObj.payment_status_reason = results[0].getText("statusreason");
                returnObj.payment_operation = results[0].getText("paymenteventtype");
				
				if(results[0].getValue("paymentstatus")=="HOLD")
				{
					returnObj.success = false;
					returnObj.error = "CC_PROCESSING";
				}
			}
			
			//Update Paypal URL if Paypal payment method
			if(paymentmethod == '9')
			{
				returnObj.paypal_url = "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=peni@migdalohrusa.org&lc=US&no_note=0&item_name=Creating+a+supportive,+nurturing,+loving+environment+for+children+to+break+the+cycle+of+poverty+and+realize+their+dreams.&cn=&curency_code=USD&bn=PP-DonationsBF:btn_donateCC_LG.gif:NonHosted";
			}
			
			//returnObj.sales_order_number = nlapiLookupField("cashsale",idOrder,"tranid");
			
            nlapiLogExecution("debug","Order ID",idOrder);
			
       	}catch(e){
       		nlapiLogExecution('ERROR', 'submit', e.message);
			
			returnObj.success = false;
			returnObj.error = e.message;
			
			nlapiSubmitField("customrecord_donation_page",customRecId,"custrecord_error_message",e.message);
      	}
		
		_sendJSResponse(request, response, returnObj);
    } catch (e) {
		
		nlapiLogExecution('ERROR', 'Non-order submission error', e);
		
		returnObj.success = false;
		returnObj.error = e.message;
		
		nlapiSubmitField("customrecord_donation_page",customRecId,"custrecord_error_message",e.message);
		
		_sendJSResponse(request, response, returnObj);
    }
}

function randomPassword(length)
{
  var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890*!@#";
  var pass = "";
  var i;
  for(x=0;x<length;x++)
  {
    i = Math.floor(Math.random() * 62);
    pass += chars.charAt(i);
  }
  
  nlapiLogExecution("debug","Finished Loop",pass);
  
  //Ensure has upper and numeric
  var uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var numbers = "1234567890";
  var lowers = "abcdefghijklmnopqrstuvwxyz";
  
  i = Math.floor(Math.random() * 26);
  pass += uppers.charAt(i);
  nlapiLogExecution("debug","Added Upper",pass);
  
  i = Math.floor(Math.random() * 10);
  pass += numbers.charAt(i);
  nlapiLogExecution("debug","Added Number",pass);
  
  i = Math.floor(Math.random() * 26);
  pass += lowers.charAt(i);
  nlapiLogExecution("debug","Added Lower",pass);
  
  return pass;
}

function _sendJSResponse(request,response,respObject)
{
	response.setContentType('JAVASCRIPT');

	var callbackFcn = request.getParameter("jsoncallback")  || request.getParameter('callback');
	
	if(callbackFcn)
	{
		response.writeLine(callbackFcn + "(" + JSON.stringify(respObject) + ");");
	}
	else
	{
		response.writeLine(JSON.stringify(respObject));
	} 
}

function killIt()
{
	nlapiLogExecution("error","*** Terminating Suitelet ***","Deployment ID: " + nlapiGetContext().getDeploymentId());
	
	var deployment = nlapiLoadRecord("scriptdeployment",nlapiGetContext().getDeploymentId());
	deployment.setFieldValue("isdeployed","F");
	deployment.setFieldValue("isonline","F");
	var deploymentId = nlapiSubmitRecord(deployment,true,true);
	
	nlapiSendEmail("5","5","Donation Page Fraud Prevention Triggered","The donation page has been taken offline due to the fraud prevention measures being triggered.");
}
