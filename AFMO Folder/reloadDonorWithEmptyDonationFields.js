/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/record', 'N/search'],
/**
 * @param {log} log
 * @param {record} record
 * @param {search} search
 */
function(log, record, search) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
    	var customerSearch = search.create({
    	    type: search.Type.CUSTOMER,
    	    columns: [{
    	        name: 'internalid'
    	    }],
    	    filters: [
	              ['custentity_individual_giving_total',search.Operator.ISEMPTY, ""],
	              'OR',
	              ['custentity_soft_giving_total',search.Operator.ISEMPTY, ""],
	              'OR',
	              ['custentity_sub_constituents_total',search.Operator.ISEMPTY, ""],
	              'OR',
	              ['custentity_afmo_life_giving',search.Operator.ISEMPTY, ""]
    	    	]
    	});
    	
    	customerSearch.run().each(function(customer){
            var donorRecord = record.load({
                type: record.Type.CUSTOMER,
                id: customer.getValue({
                  	name: 'internalid'
                })
            });
            donorRecord.save();
            
    		return true;
    	});
    }

    return {
        execute: execute
    };
    
});
