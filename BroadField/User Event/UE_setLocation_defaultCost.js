/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define([], function () {


    function beforeSubmit(context) {
        var title = 'beforeSubmit[::]';
        try {
            var rec = context.newRecord;
            var bodyCost = rec.getValue({fieldId: 'cost'});

            var lineCount = rec.getLineCount({
                sublistId: 'locations'
            });

            if(lineCount && lineCount > 0){
                for(var m = 0; m < lineCount; m++){
                    var lineDefaultCost = rec.getSublistValue({
                        sublistId: 'locations',
                        fieldId: 'cost',
                        line: m
                    });
                    log.debug({
                        title: 'lineDefaultCost',
                        details: lineDefaultCost
                    });
 
                    if((isEmpty(lineDefaultCost) || lineDefaultCost == 0) && !isEmpty(bodyCost)){
                        rec.setSublistValue({
                            sublistId: 'locations',
                            fieldId: 'cost',
                            line: m,
                            value: bodyCost
                        });
                    }
                }
            }
        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function isEmpty(stValue) {

        if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0) || (stValue.length == 0.00)) {
          return true;
        }
        return false;
      }

    return {

        beforeSubmit: beforeSubmit
    }
});
