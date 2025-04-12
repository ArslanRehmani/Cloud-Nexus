/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 */
    (log, record, search) => {


        const getInputData = (inputContext) => {
            var title = 'getInputData[::]';
            try {
                var kitInvSearchResults = kitInvSearch();
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return kitInvSearchResults || [];
        }

        const map = (mapContext) => {
            var title = 'map[::]';
            try {
                var data = JSON.parse(mapContext.value);
                log.debug({
                    title: 'data',
                    details: data
                });
                var department = data.values.department.text || '';
                var Class = data.values.class.text || '';
                var customLable0 = data.values.custitem_googleshoppingcustomlabel0 || '';
                var updatsCustomLable1 = department + ' | ' + customLable0;
                updatsCustomLable1 = updatsCustomLable1.replace(/^[| ]+|[| ]+$/g, '');
                var updatsCustomLable2;

                if(!isEmpty(Class)){
                    updatsCustomLable2 = department + ' | ' + Class + ' | ' + customLable0;
                    updatsCustomLable2 = updatsCustomLable2.replace(/^[| ]+|[| ]+$/g, '');
                }else{
                    updatsCustomLable2 = department + ' , '+ customLable0;
                    updatsCustomLable2 = updatsCustomLable2.replace(/^[| ]+|[| ]+$/g, '');
                }

                record.submitFields({
                    type: data.recordType,
                    id: data.id,
                    values: {
                        'custitem_googleshoppingcustomlabel1': updatsCustomLable1,
                        'custitem_googleshoppingcustomlabel2': updatsCustomLable2
                    },
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        function kitInvSearch() {
            var title = 'kitInvSearch[::]';
            try {
                var itemSearchObj = search.load({
                    // id: '3128'//SB
                    id: '3644'//PRD
                });
                return itemSearchObj || [];
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function isEmpty(stValue) {

            if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0)) {
              return true;
            }
            return false;
          }
        return { getInputData, map }

    });
