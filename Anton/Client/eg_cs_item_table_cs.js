/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/currentRecord', 'N/search', 'N/url'],
    function (currentRecord, search,url) {
        function pageInit(context) {
            window.onbeforeunload = null;
            console.log('I am here....');
        }
        function fieldChanged(context) {
            var title = 'fieldChanged(::)';
            try {
                var currentRec = context.currentRecord;
                var fieldId = context.fieldId;
                if (fieldId == 'custpage_fld_subsidiary') {
                    var selectedSubsidiary = currentRec.getValue({
                        fieldId: 'custpage_fld_subsidiary'
                    });
                    var selectedItemType = currentRec.getValue({
                        fieldId: 'custpage_fld_item_type'
                    });
                    if(!!selectedSubsidiary || !!selectedItemType){
                        console.log('URL', 'https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1' + "&subID=" + selectedSubsidiary+ "&itemType=" + selectedItemType);
                        location.replace('https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1' + "&subID=" + selectedSubsidiary+ "&itemType=" + selectedItemType);
                    }else{
                        console.log('URL', 'https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1');
                        location.replace('https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1');
                    }
                    
                }
                if (fieldId == 'custpage_fld_item_type') {
                    var selectedItemType = currentRec.getValue({
                        fieldId: 'custpage_fld_item_type'
                    });
                    var selectedSubsidiary = currentRec.getValue({
                        fieldId: 'custpage_fld_subsidiary'
                    });
                    if(!!selectedItemType || !!selectedSubsidiary){
                        console.log('URL', 'https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1' + "&itemType=" + selectedItemType+ "&subID=" + selectedSubsidiary);
                        location.replace('https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1' + "&itemType=" + selectedItemType+ "&subID=" + selectedSubsidiary);
                    }else{
                        console.log('URL', 'https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1');
                        location.replace('https://3981821-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=779&deploy=1');
                    }
                    
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }
    
        }
        function getItemData(itemType, subsidiaryId) {
            var title = "getItemData()";
            try {
                var currentRecordObj = currentRecord.get();
                console.log('I am here...')
                var itemDataArr = [];
                var filters = [];
                filters.push(['isinactive', 'is', 'F'])
                if (itemType) {
                    filters.push("AND");
                    filters.push(['type', 'anyof', 'itemType']);
                }
                if (subsidiaryId) {
                    filters.push("AND");
                    filters.push(['subsidiary', 'anyof', subsidiaryId]);
                }
                var itemSearch = search.create({
                    type: "item",
                    columns: [
                        search.createColumn({
                            name: 'itemid',
                            sort: search.Sort.ASC
                        }),
                        search.createColumn({
                            name: "salesdescription",
                        }),
                        search.createColumn({
                            name: "baseprice",
                        }),
                        search.createColumn({
                            name: "taxschedule",
                        })
                    ],
                    filters: filters,
                });

                var linesSearchData = [];
                var count = 0;
                var pageSize = 1000;
                var start = 0;

                do {
                    var tempLinesSearchData = itemSearch.run().getRange({
                        start: start,
                        end: start + pageSize
                    });

                    linesSearchData = linesSearchData.concat(tempLinesSearchData);
                    count = linesSearchData.length;
                    start += pageSize;
                } while (count == pageSize);

                if (linesSearchData.length > 0) {
                    for (var i = 0; i < 10; i++) {
                        var obj = {};
                        obj.itemName = linesSearchData[i].getValue({
                            name: 'itemid',
                            sort: search.Sort.ASC
                        });
                        obj.salesdescription = linesSearchData[i].getValue({
                            name: 'salesdescription'
                        });
                        obj.baseprice = linesSearchData[i].getValue({
                            name: 'baseprice'
                        });
                        obj.taxschedule = linesSearchData[i].getValue({
                            name: 'taxschedule'
                        });
                        itemDataArr.push(obj);
                    }
                }
                log.debug({
                    title: "Item Data " + title,
                    details: JSON.stringify(itemDataArr),
                });
                console.log(JSON.stringify(itemDataArr));
                var suiteletURL = url.resolveScript({
                    scriptId: 'customscript_eg_sl_item_list_form',
                    deploymentId: 'customdeploy_eg_sl_item_list_form',
                    params: {
                        itemData: JSON.stringify(itemDataArr),

                    }
                });
                window.open(suiteletURL, '_self');
               


                return itemDataArr;
            } catch (error) {
                log.error({
                    title: "error Message " + title,
                    details: error,
                });
            }
        }
        return {
            pageInit: pageInit,
            getItemData: getItemData,
            fieldChanged: fieldChanged
        };
    });