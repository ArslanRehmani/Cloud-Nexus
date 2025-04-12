function Event_Parameters(request,response)
{
	var context = nlapiGetContext();
	
	//Get script parameters
	var amount1 = context.getSetting("SCRIPT","custscript_amount1");
  	var amount2 = context.getSetting("SCRIPT","custscript_amount2");
  	var amount3 = context.getSetting("SCRIPT","custscript_amount3");
  	var amount4 = context.getSetting("SCRIPT","custscript_amount4");
  	var amount5 = context.getSetting("SCRIPT","custscript_amount5");
    var amount6 = context.getSetting("SCRIPT","custscript_amount6");
    var label1 = context.getSetting("SCRIPT","custscript_label1");
  	var label2 = context.getSetting("SCRIPT","custscript_label2");
  	var label3 = context.getSetting("SCRIPT","custscript_label3");
  	var label4 = context.getSetting("SCRIPT","custscript_label4");
    var label5 = context.getSetting("SCRIPT","custscript_label5");
    var label6 = context.getSetting("SCRIPT","custscript_label6");
    var donationItem = context.getSetting("SCRIPT","custscript_donation_item_param");
	
	var respObj = {
		amount1 : amount1,
      	amount2 : amount2,
      	amount3 : amount3,
      	amount4 : amount4,
      	amount5 : amount5,
        amount6 : amount6,
        label1 : label1,
      	label2 : label2,
      	label3 : label3,
      	label4 : label4,
      	label5 : label5,
        label6 : label6,
        donationItem : donationItem
	};
	
	_sendJSResponse(request, response, respObj);
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