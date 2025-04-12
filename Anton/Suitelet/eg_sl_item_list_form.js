/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
var DATATABLE_HTML_FILE_NAME = 'item_datatable.html';
define(['N/ui/serverWidget', 'N/record', 'N/search', 'N/file'],

    function (serverWidget, record, search, file) {

        function onRequest(context) {
            var title = 'onRequest() ::';

            try {
                var request = context.request;
                var response = context.response;
                var parameters = request.parameters;
                var subsidiaryId = parameters.subID;
                var itemType = parameters.itemType;
                var itemData = parameters.itemData;
                if (request.method == 'GET') {
                    log.debug('I am in Get:');
                    createSuiteletFrom(response, subsidiaryId, itemType, itemData);
                } else {
                    var dataArr = [];
                    log.debug('I am in POST:');
                    log.debug('parameters: ', JSON.stringify(parameters));
                    if (parameters) {

                        // log.debug('itemData: ', JSON.stringify(itemData));

                        createSuiteletFrom(response, subsidiaryId, itemType, itemData);
                    }
                }
            } catch (error) {
                log.error({
                    title: "error Message " + title,
                    details: error,
                });
            }
        }

        function createSuiteletFrom(response, subsidiaryId, itemType, itemData) {
            var title = 'createSuiteletFrom() ::';
            try {
                log.debug('itemData: ', itemData);
                log.debug('itemType: ', itemType);
                log.debug('subsidiaryId: ', subsidiaryId);

                // var htmlFileId = getFileId(DATATABLE_HTML_FILE_NAME)
                // var htmlFile = file.load({
                //     id: htmlFileId
                // });
                // var htmlContent = htmlFile.getContents();
                var form = serverWidget.createForm({
                    title: 'Items to add to Sales Order'
                });
                form.clientScriptFileId = 6077;
                var subsidiaryfld = form.addField({
                    id: 'custpage_fld_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    source: record.Type.SUBSIDIARY,
                    label: 'Subsidiary'
                });
                if (subsidiaryId) {
                    subsidiaryfld.defaultValue = subsidiaryId;
                }
                var itemTypefld = form.addField({
                    id: 'custpage_fld_item_type',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Item Type'
                });
                if (itemType) {
                    itemTypefld.defaultValue = itemType;
                }
                // itemTypefld.addSelectOption({
                //     value: 'InvtPart',
                //     text: 'Inventory Item'
                // });
                itemTypefld.addSelectOption({
                    value: 'Assembly',
                    text: 'Assembly/Bill of Materials'
                });
                itemTypefld.addSelectOption({
                    value: 'NonInvtPart',
                    text: 'Non-inventory Item'
                });
                itemTypefld.addSelectOption({
                    value: 'Service',
                    text: 'Service'
                });
                itemTypefld.addSelectOption({
                    value: 'OthCharge',
                    text: 'Other Charge'
                });
                form.addButton({
                    id: 'custpage_btn_search',
                    label: 'Search',
                    functionName: 'getItemData(' + itemType + ',' + subsidiaryId + ')'
                });
                // var datatableDiv = form.addField({
                //     id: 'custpage_fld_datatable_div',
                //     type: serverWidget.FieldType.INLINEHTML,
                //     label: 'Data Table Container'
                // });

                // datatableDiv.defaultValue = htmlContent;
                var itemSblst = form.addSublist({
                    id: 'custpage_sblst_item_list',
                    label: 'Items List',
                    type: serverWidget.SublistType.LIST
                });
                itemSblst.addField({
                    id: 'custpage_sblstfld_add',
                    label: 'Add',
                    type: serverWidget.FieldType.CHECKBOX
                });
                itemSblst.addField({
                    id: 'custpage_sblstfld_item_name',
                    label: 'Item Name',
                    type: serverWidget.FieldType.TEXT
                });
                itemSblst.addField({
                    id: 'custpage_sblstfld_desc',
                    label: 'DESCRIPTION',
                    type: serverWidget.FieldType.TEXT
                });

                itemSblst.addField({
                    id: 'custpage_sblstfld_price',
                    label: 'BASE PRICE',
                    type: serverWidget.FieldType.TEXT
                });
                itemSblst.addField({
                    id: 'custpage_sblstfld_tax_sch',
                    label: 'TAX SCHEDULE',
                    source: record.Type.TAX_TYPE,
                    type: serverWidget.FieldType.SELECT
                });
                if (!!subsidiaryId && !!itemType) {
                    if (itemType == 'Service') {
                        var noninventoryitemSearchObj = createSearch ("serviceitem",subsidiaryId,itemType);
                    } else if (itemType == 'NonInvtPart') {
                        var noninventoryitemSearchObj = createSearch ("noninventoryitem",subsidiaryId,itemType);
                    } else if (itemType == 'OthCharge') {
                        var noninventoryitemSearchObj = createSearch ("otherchargeitem",subsidiaryId,itemType);
                    } else if (itemType == 'InvtPart') {
                        var noninventoryitemSearchObj = createSearch ("inventoryitem",subsidiaryId,itemType);
                    } else {
                        var noninventoryitemSearchObj = createSearch ("assemblyitem",subsidiaryId,itemType);
                    }
                } else {
                    var noninventoryitemSearchObj = search.create({
                        type: "noninventoryitem",
                        filters:
                            [
                                ["type", "anyof", "NonInvtPart"]
                            ],
                        columns:
                            [
                                search.createColumn({
                                    name: "itemid",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({ name: "displayname", label: "Display Name" }),
                                search.createColumn({ name: "salesdescription", label: "Description" }),
                                search.createColumn({ name: "type", label: "Type" }),
                                search.createColumn({ name: "baseprice", label: "Base Price" }),
                                search.createColumn({ name: "custitem_psgss_nrf_color_code", label: "NRF Color Code" }),
                                search.createColumn({ name: "custitem_psgss_nrf_size_code", label: "NRF Size Code" }),
                                search.createColumn({ name: "custitem_psgss_style_number", label: "Style #" }),
                                search.createColumn({ name: "custitem_solupaysp_engstatus", label: "Engineering Status" })
                            ]
                    });
                }
                    var counter = 0;
                    noninventoryitemSearchObj.run().each(function (result) {
                        var itemName = result.getValue('itemid');
                        var description = result.getValue('salesdescription');
                        var baseprice = result.getValue('baseprice');


                        if (itemName != '' && itemName != null) {
                            itemSblst.setSublistValue({
                                id: 'custpage_sblstfld_item_name',
                                line: counter,
                                value: itemName
                            });
                        }
                        if (description != '' && description != null) {
                            itemSblst.setSublistValue({
                                id: 'custpage_sblstfld_desc',
                                line: counter,
                                value: description
                            });
                        }
                        if (baseprice != '' && baseprice != null) {
                            itemSblst.setSublistValue({
                                id: 'custpage_sblstfld_price',
                                line: counter,
                                value: baseprice
                            });
                        }
                        counter++;
                        return true;
                    });

                // if (itemData) {
                //     log.debug('I am here 1 itemData: ');

                //     if (itemData.length > 0) {
                //         log.debug('I am here 2 itemData: ');
                //         for (var i = 0; i < itemData.length; i++) {
                //             log.debug('I am here 3 itemData: ');
                //             if (itemData[i].itemName) {
                //                 itemSblst.setSublistValue({
                //                     id: 'custpage_sblstfld_item_name',
                //                     line: i,
                //                     value: itemData[i].itemName
                //                 });
                //             }
                //             if (itemData[i].salesdescription) {
                //                 itemSblst.setSublistValue({
                //                     id: 'custpage_sblstfld_desc',
                //                     line: i,
                //                     value: itemData[i].salesdescription
                //                 });

                //             }
                //             if (itemData[i].baseprice) {
                //                 itemSblst.setSublistValue({
                //                     id: 'custpage_sblstfld_price',
                //                     line: i,
                //                     value: itemData[i].baseprice
                //                 });
                //             }
                //             if (itemData[i].taxschedule) {
                //                 itemSblst.setSublistValue({
                //                     id: 'custpage_sblstfld_tax_sch',
                //                     line: i,
                //                     value: itemData[i].taxschedule
                //                 });
                //             }

                //         }
                //     }
                // }
                form.addSubmitButton({
                    label: 'Add to Sales Order'
                });
                response.writePage(form);
                // return form;
            } catch (error) {
                log.error({
                    title: "error Message " + title,
                    details: error,
                });
            }

        }
        // function getFileId(fileName) {
        //     try {
        //         var clientScriptFileSearch = search.create({
        //             type: "file",
        //             columns: [search.createColumn({
        //                 name: "internalid",
        //             })],
        //             filters: [search.createFilter({
        //                 name: "name",
        //                 operator: "haskeywords",
        //                 values: [fileName],
        //             })],
        //         });

        //         var searchResults = clientScriptFileSearch.run();
        //         var searchedFile;
        //         searchResults.each(function (res) {
        //             log.debug({
        //                 title: "GET CLIENT SCRIPT FILE ID",
        //                 details: res.getAllValues(),
        //             });
        //             searchedFile = res.getAllValues();
        //             return true;
        //         });
        //         return searchedFile.internalid[0].value;
        //     } catch (error) {
        //         log.error({
        //             title: "error Message " + title,
        //             details: error,
        //         });
        //     }
        // }
        function createSearch(type,subsidiaryId,itemType){
            var title = 'createSearch(::)';
            try {
                var noninventoryitemSearchObj = search.create({
                    type: type,
                    filters:
                        [
                            ["type", "anyof", itemType],
                            "AND",
                            ["subsidiary", "anyof", subsidiaryId]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "itemid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({ name: "displayname", label: "Display Name" }),
                            search.createColumn({ name: "salesdescription", label: "Description" }),
                            search.createColumn({ name: "type", label: "Type" }),
                            search.createColumn({ name: "baseprice", label: "Base Price" }),
                            search.createColumn({ name: "custitem_psgss_nrf_color_code", label: "NRF Color Code" }),
                            search.createColumn({ name: "custitem_psgss_nrf_size_code", label: "NRF Size Code" }),
                            search.createColumn({ name: "custitem_psgss_style_number", label: "Style #" }),
                            search.createColumn({ name: "custitem_solupaysp_engstatus", label: "Engineering Status" })
                        ]
                });
                return noninventoryitemSearchObj;
            } catch (e) {
             log.debug('Exception ' + title, e.message);
            }
        }
        return {
            onRequest: onRequest
        };

    });