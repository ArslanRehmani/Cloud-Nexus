/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log'], function(log) {

    function beforeLoad(context) {
       var title = 'beforeLoad(::)';
       try{
           var rec = context.newRecord;
           var customFormID = rec.getValue({fieldId: 'customform'});
           if(customFormID == 205){//1 MCM - SO for Showrooms
            rec.setValue({fieldId: 'shipmethod', value: 26398})//Exchange Item DT (Standard)
           }
       } catch(e) {
           log.debug('Exception ' +title, e.message);
       }
        
    }

    return {
        beforeLoad: beforeLoad
    }
});
