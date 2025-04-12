/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 */
    (log, record, runtime, search, serverWidget) => {

        const beforeLoad = (scriptContext) => {
            var title = 'beforeLoad[::]';
            try {
                var rec = scriptContext.newRecord;
                var subsidiary = rec.getValue({ fieldId: 'subsidiary' });
                log.debug({
                    title: 'subsidiary',
                    details: subsidiary
                });
                if (subsidiary && subsidiary.length > 0) {
                    var numericArray = subsidiary.map(Number);
                    if (numericArray.includes(7)) {// subsidiary contains Global China Co
                        var lineCount1 = rec.getLineCount({
                            sublistId: 'price1'
                        });
                        hidePriceLevelData(scriptContext, lineCount1);
                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function hidePriceLevelData(scriptContext, lineCount) {
            var title = 'hidePriceLevelData[::]';
            try {
                if (lineCount && lineCount > 0) {
                    //create an inline html field
                    var hideFld = scriptContext.form.addField({
                        id: 'custpage_button',
                        label: 'Hidden field',
                        type: serverWidget.FieldType.INLINEHTML
                    });
                    var scr = "";

                    for (var m = 1; m < lineCount; m++) {// start m = 1 because except base price hide other price level
                        //for every button you want to hide, modify the scr += line
                        for (var l = 1; l < lineCount; l++) {
                            // scr += 'jQuery("#'+row + m + '").hide();';
                            scr += 'jQuery("#price' + m + 'row' + l + '").hide();';
                        }

                        //push the script into the field so that it fires and does its handy work
                    }
                    hideFld.defaultValue = "<script>jQuery(function($){require([], function(){" + scr + ";})})</script>"
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return {
            beforeLoad
        }

    });
