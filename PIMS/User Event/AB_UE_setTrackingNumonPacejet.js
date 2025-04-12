/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/task', 'N/url', 'N/https', 'N/search', 'N/record'], function (log, task, url, https, search, record) {

    function afterSubmit(context) {
        var title = 'afterSubmit(::)';
        try {
            var rec = context.newRecord;
            var pacejetTransLinks = rec.getValue({ fieldId: 'custrecord_pacejet_transaction_link' });
            if (pacejetTransLinks) {
                log.debug({
                    title: 'pacejetTransLinks',
                    details: pacejetTransLinks
                });
                var TRACKING_NUMBER = rec.getValue({ fieldId: 'custrecord_pacejet_package_tracking' });
                if (!TRACKING_NUMBER) {
                    log.debug('TRACKING_NUMBER', 'EMPTY');
                    var typeArray = [];
                    var obj;
                    if (pacejetTransLinks.length && pacejetTransLinks.length != 0) {
                        for (var i = 0; i < pacejetTransLinks.length; i++) {
                            var recInternalId = pacejetTransLinks[i];
                            var transactionSearchObj = search.create({
                                type: "transaction",
                                filters:
                                    [
                                        ["internalid", "anyof", recInternalId],
                                        "AND",
                                        ["mainline", "is", "T"]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "type", label: "Type" })
                                    ]
                            });
                            transactionSearchObj.run().each(function (result) {
                                obj = {};
                                obj.type = result.getValue({ name: 'type' });
                                obj.id = result.id;
                                typeArray.push(obj);
                                return true;
                            });
                        }
                    }
                    log.debug('typeArray', typeArray);
                    log.debug('typeArray.length', typeArray.length);
                    if (typeArray.length && typeArray.length > 0) {
                        for (var j = 0; j < typeArray.length; j++) {
                            var typeObj = typeArray[j];
                            var ObjType = typeObj.type;
                            if (ObjType == 'ItemShip') {
                                var itemFulfilmentObj = record.load({
                                    type: 'itemfulfillment',
                                    id: parseInt(typeObj.id)
                                });
                                var userField11Data = itemFulfilmentObj.getValue({fieldId: 'custbody_pacejet_updateentity'});
                                itemFulfilmentObj.setValue({fieldId: 'custbody_tcm_pkg_track_info_updated',value: true});
                                var itemFulfilmentRECid = itemFulfilmentObj.save();
                                log.debug('itemFulfilmentRECid', itemFulfilmentRECid);
                                var regex = /<UserField11>(.*?)<\/UserField11>/;
                                var match = regex.exec(userField11Data);
                                var userField11 = match ? match[1] : null;
                                log.debug('userField11', userField11);
                                //Load Pacejet Pacakage Info Rec to set Transaction Number
                                var pacejetPacakageInfoRecOBJ = record.load({
                                    type: rec.type,
                                    id: parseInt(rec.id)
                                });
                                pacejetPacakageInfoRecOBJ.setValue({ fieldId: 'custrecord_pacejet_package_tracking', value: userField11 });
                                var pacejetPacakageInfoRecid = pacejetPacakageInfoRecOBJ.save();
                                log.debug('pacejetPacakageInfoRecid', pacejetPacakageInfoRecid);
                            }
                        }
                    }
                }
                // var linkArray = JSON.stringify(pacejetTransLinks);
                // var params = {
                //     'array': linkArray
                //   }
                // var scriptURL = url.resolveScript({
                //     scriptId: 'customscript_ab_sl_updateitemfulfillment',
                //     deploymentId: 'customdeploy_ab_sl_updateitemfulfillment',
                //     returnExternalUrl: true
                // });
                // log.debug({
                //     title: 'scriptURL',
                //     details: scriptURL
                // });
                // var response = https.post({
                //     url: scriptURL,
                //     body: params
                // });
                // log.debug({
                //     title: 'response',
                //     details: response
                // });
            }
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }

    return {
        afterSubmit: afterSubmit
    }
});
