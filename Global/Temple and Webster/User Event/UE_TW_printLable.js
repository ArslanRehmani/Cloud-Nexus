/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/search'], function (record, log, search) {

    function beforeLoad(context) {
        var title = 'beforeLoad[::]';
        try {
            var rec = context.newRecord;

            var printLable = rec.getValue({fieldId: 'custbody_gfl_print_lable'});

            var templeAndWebsterCustId = rec.getValue({fieldId: 'entity'});//1410049

            log.debug({
                title: 'printLable',
                details: printLable
            });
            log.debug({
                title: 'templeAndWebsterCustId = 1410049',
                details: templeAndWebsterCustId
            });

            var recID = rec.id;

            log.debug({
                title: 'recID',
                details: recID
            });

            var form = context.form;

            form.clientScriptFileId = 20155863;

            var waveRecord = waveRecordSearch(recID);
            log.debug({
                title: 'waveRecordID',
                details: waveRecord
            });

            if(waveRecord != 0 && printLable == false && templeAndWebsterCustId == 1410049){

                // form.addButton({ id: "custpage_tw_print_lable", label: "Print Lable", functionName: "twprintlable(' " + recID + "')" });
                form.addButton({ id: "custpage_tw_print_lable", label: "Print Label", functionName: "twprintlable()" });

            }

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function waveRecordSearch(recId) {
        var title = 'titleName[::]';
        var id = 0;
        try {
            var salesorderSearchObj = search.create({
                type: "salesorder",
                settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["internalid", "anyof", recId],
                        "AND",
                        ["applyinglinktype", "anyof", "WaveOrd"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "tranid", label: "Document Number" }),
                        search.createColumn({ name: "applyinglinktype", label: "Applying Link Type" }),
                        search.createColumn({
                            name: "internalid",
                            join: "applyingTransaction",
                            label: "Internal ID"
                        })
                    ]
            });
            salesorderSearchObj.run().each(function (result) {
                id = result.getValue({name: 'internalid', join: 'applyingTransaction'});
                log.debug({
                    title: 'idddd',
                    details: id
                });
                return true;
            });

        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return id ||  0;
    }

    return {
        beforeLoad: beforeLoad
    }
});
