function Contact_Donor_Salutations(type)
{
	if(type=="create" || type=="edit")
	{
		try
		{
			var contact = nlapiGetNewRecord();
			var donor = contact.getFieldValue("company");
			var firstName = contact.getFieldValue("firstname");
			var lastName = contact.getFieldValue("lastname");
			var salutation = contact.getFieldValue("salutation");
            var role = contact.getFieldValue("contactrole");
            nlapiLogExecution("debug", "role", role);
			
			if(role=="-10"){
				if(salutation !="" && salutation!=null){
					nlapiSubmitField("customer",donor,["custentity_short_salutation"],[salutation + firstName + lastName]);
				}else{
					nlapiSubmitField("customer",donor,["custentity_short_salutation"],[firstName]);
				}
			}
		}
		catch(err)
		{
			nlapiLogExecution("error","Error writing salutation field to Donor","Details: " + err.message);
		}
	}
}
function Donor_Salutations(type)
{
	if(type=="create" || type=="edit")
	{
		try
		{
			var donor = nlapiGetNewRecord();
			var donorID = nlapiGetRecordId();
			var isPerson = donor.getFieldValue("isperson");
			var company = donor.getFieldValue("companyname");
          	//var prefix = donor.getFieldValue("salutation");
            var suffix = donor.getFieldValue("custentity_suffix");
            var firstName = donor.getFieldValue("firstname");
            var lastName = donor.getFieldValue("lastname");
            //var spouseFirstName = donor.getFieldValue("custentity3");
            //var spouseLastName = donor.getFieldValue("custentity5");
            var type = donor.getFieldValue("custentity_npo_constituent_type");
            var prefix = !donor.getFieldValue("salutation") ? "" : donor.getFieldValue("salutation");
			var spouseFirstName = !donor.getFieldValue("custentity3") ? "" : donor.getFieldValue("custentity3");
			var spouseLastName = !donor.getFieldValue("custentity5") ? "" : donor.getFieldValue("custentity5");
			nlapiLogExecution("debug", "isPerson", isPerson);
			nlapiLogExecution("debug", "company name", company);
			if(isPerson=="F"){
			var filters = [];
			filters.push(new nlobjSearchFilter("internalid",null,"is",donorID));
            filters.push(new nlobjSearchFilter("contact",null,"isnotempty"));
			
			var cols = [];
			cols.push(new nlobjSearchColumn("firstname","contactprimary").setSort(true));
			cols.push(new nlobjSearchColumn("lastname","contactprimary"));
			cols.push(new nlobjSearchColumn("salutation","contactprimary"));
			//cols.push(new nlobjSearchColumn("firstname"));
			cols.push(new nlobjSearchColumn("contact"));
			var results = nlapiSearchRecord("customer",null,filters,cols);
			if(results)
			{nlapiLogExecution("debug", "has primary contact");
				if(results[0].getValue("salutation","contactprimary")!="" && results[0].getValue("salutation","contactprimary")!=null){
                  nlapiLogExecution("debug", "has prefix");
					nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],
                                     [results[0].getValue("salutation","contactprimary")+' '+results[0].getValue("firstname","contactprimary")+' '+results[0].getValue("lastname","contactprimary"),
                                      results[0].getValue("salutation","contactprimary")+' '+results[0].getValue("firstname","contactprimary")+' '+results[0].getValue("lastname","contactprimary")]
                                    );
				}else{nlapiLogExecution("debug", "no prefix");
					nlapiLogExecution("debug","results",results[0].getValue("firstname","contactprimary"));
					nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[results[0].getValue("firstname","contactprimary"),results[0].getValue("firstname","contactprimary")+' '+results[0].getValue("lastname","contactprimary")]);
					}
			}else{
				nlapiLogExecution("debug", "no primary contact");
				nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],["Supporter",company]);
			}
			
			}
          if(isPerson=="T"){
          	if(lastName == spouseLastName){
              if(prefix !="" && prefix !=null){
                 nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[prefix +' '+ lastName + ' and ' + spouseFirstName, prefix +' '+firstName +' '+spouseFirstName +' '+ lastName]);
              }else{
                nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[firstName + ' and ' + spouseFirstName, firstName +' and '+spouseFirstName +' '+ lastName]);
              }
            }
          if(lastName != spouseLastName){
              if(prefix !="" && prefix !=null){
                 nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[prefix +' '+ lastName + ' and ' + spouseFirstName, prefix +' '+firstName +' '+ lastName +' and '+ spouseFirstName +' '+ spouseLastName]);
              }else{
                nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[firstName + ' and ' + spouseFirstName, firstName +' '+ lastName +' and '+ spouseFirstName +' '+ spouseLastName]);
              }
            }
            if(spouseLastName =='' || spouseFirstName ==''){
              if(prefix !="" && prefix !=null){
                 nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[prefix +' '+ lastName + ' ' + spouseFirstName, prefix +' '+firstName +' '+ lastName +' '+ spouseFirstName +' '+ spouseLastName]);
              }else{
                nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[firstName + ' ' + spouseFirstName, firstName +' '+ lastName +' '+ spouseFirstName +' '+ spouseLastName]);
              }
            }
            if(type==14){
                               nlapiSubmitField("customer",donorID,["custentity_short_salutation","custentity_envelope_salutation"],[lastName + ' ' + spouseLastName  +' Family', lastName + ' ' + spouseLastName  +' Family']);

               }
          }
          
		}
		catch(err)
		{
			nlapiLogExecution("error","Error writing salutation field to Donor","Details: " + err.message);
		}
	}
}