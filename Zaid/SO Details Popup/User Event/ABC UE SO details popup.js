/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/runtime'],

    function(runtime) {
       
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
            
            var type=scriptContext.type
            var userObj = runtime.getCurrentUser();
          log.debug('userObj',userObj);
            
            if(type=='edit' || type=='create'){
                try{
                var form=scriptContext.form
                
                var itemSublist = form.getSublist({
                    id : 'item'
                });
                form.clientScriptModulePath ='SuiteScripts/ABC CL SO details popup.js';
    
                  if(userObj.id != 19997 || userObj.role == 3 ) {
                itemSublist.addButton({
                    id : 'custpage_PurchaseOrders',
                    label : 'Purchase Orders',
                    functionName:'invokePopup("purchase_orders")'
                })
                  }
                  
                itemSublist.addButton({
                    id : 'custpage_saleshist',
                    label : 'Sales History',
                    functionName:'invokePopup("sales_hist")'
                })
                
                itemSublist.addButton({
                    id : 'custpage_openQuotes',
                    label : 'Open Quotes',
                    functionName:'invokePopup("open_quotes")'
                })
                
                itemSublist.addButton({
                    id : 'custpage_allQuotes',
                    label : 'All Quotes',
                    functionName:'invokePopup("all_quotes")'
                })

                itemSublist.addButton({
                    id : 'custpage_belttocut',
                    label : 'Belt Available to Cut',
                    functionName:'invokePopup("beltavialbaletocut")'
                })
    
                
                }catch(error){
                    
                    log.error('error',error)
                }
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
        function beforeSubmit(scriptContext) {
    
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
    
        }
    
        return {
            beforeLoad: beforeLoad
            //beforeSubmit: beforeSubmit,
            //afterSubmit: afterSubmit
        };
        
    });
    