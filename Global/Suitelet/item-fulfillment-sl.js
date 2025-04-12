/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/render', 'N/search', 'N/record', 'N/xml'],

    function (render, search, record, xml) {

        var COMPANYNAME = "Global Fitness and Leisure";

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {

            log.debug('fulfillment record internalid', context.request.parameters['record_id']);

            var fulfillmentRecord = record.load({
                // type: record.Type.ITEM_FULFILLMENT,
                type: 'itemfulfillment',
                id: context.request.parameters['record_id']
            });

            var reference = fulfillmentRecord.getValue({
                fieldId: "custbody1"
            });
            var createdFrom = fulfillmentRecord.getText({
                fieldId: "createdfrom"
            });

            var createdFrom_id = fulfillmentRecord.getValue({
                fieldId: "createdfrom"
            });
            var createdFromArr = createdFrom.split("#");
            var createdFromType = createdFromArr[0];
            createdFrom = createdFrom.replace(createdFromType + "#", "");

            log.debug('createdFromType', createdFromType)

            var totalPackage = fulfillmentRecord.getValue({
                fieldId: "custbody_avt_ifs_total_packages"
            });

            var itemPackageDescription;
            var specialInstructions1;
            var specialInstructions2;
            var customrecord_avt_ifs_recordSearchObj = search.create({
                type: "customrecord_avt_ifs_record",
                filters: [
                    ["custrecord_avt_ifs_record_transid", "anyof", context.request.parameters['record_id']]
                ],
                columns: [
                    search.createColumn({
                        name: "custrecord_avt_ifs_item_package_desc",
                        label: "Item Package Description"
                    }),
                    search.createColumn({
                        name: "custrecord_avt_ifs_special_instructions1",
                        label: "Special Instructions 1"
                    }),
                    search.createColumn({
                        name: "custrecord_avt_ifs_special_instructions2",
                        label: "Special Instructions 2"
                    }),
                ]
            });
            customrecord_avt_ifs_recordSearchObj.run().each(function (result) {
                itemPackageDescription = result.getValue({
                    name: "custrecord_avt_ifs_item_package_desc"
                });
                specialInstructions1 = result.getValue({
                    name: "custrecord_avt_ifs_special_instructions1"
                });
                specialInstructions2 = result.getValue({
                    name: "custrecord_avt_ifs_special_instructions2"
                });
                return true;
            });


            var shippingAddress = fulfillmentRecord.getValue({
                fieldId: "shippingaddress_text"
            });
            log.debug("shippingAddress", shippingAddress);
            xmlHolder += "<td style=\"vertical-align: middle;\">";
            var shippingAddressArray = shippingAddress.split("\n");

            var xmlHolder = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
            xmlHolder += "<pdf>\n";
            xmlHolder += "<body style=\"font-family: NotoSans, sans-serif; font-size:18pt;\">\n";

            //===========3/16/2023 AJF=============

            let mainItemCount = fulfillmentRecord.getLineCount({
                sublistId: 'item'
            });
            let mainItemObj = []
            for (let i = 0; i < mainItemCount; i++) {
                let tempObj = {};
                tempObj['item'] = fulfillmentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: i
                });
                tempObj['itemName'] = fulfillmentRecord.getSublistText({
                    sublistId: "item",
                    fieldId: "itemname",
                    line: i
                });

                tempObj['description'] = fulfillmentRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "description",
                    line: i
                });
                tempObj['type'] = fulfillmentRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'itemtype',
                    line: i
                });
                mainItemObj.push(tempObj);
            }

            log.audit('mainItemObj', mainItemObj);

            var itemLineCount = fulfillmentRecord.getLineCount({
                sublistId: "recmachcustrecord_avt_ifs_record_transid"
            });

            log.audit('itemLineCount', itemLineCount);
            //MW
            if (itemLineCount > 0) {

                var so_line_item_counter = []

                let printOutArr = [];
                for (var jj = 0; jj < itemLineCount; jj++) {
                    let tempObj = {}
                    //GET IFS LINE ITEM
                    let so_text_counter2 = fulfillmentRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_avt_ifs_record_transid',
                        fieldId: 'custrecord_avt_ifs_item_package_desc',
                        line: jj
                    });
                    tempObj['ifsDescription'] = so_text_counter2;
                    tempObj['itemId'] = searchItem(so_text_counter2, mainItemObj);

                    //Find the line Item description
                    for (let i = 0; i < mainItemObj.length; i++) {
                        if (mainItemObj[i]['item'] == tempObj['itemId']) {
                            tempObj['lineDescription'] = mainItemObj[i]['description'];
                            tempObj['itemName'] = mainItemObj[i]['itemName'];
                            break;
                        }
                    }

                    log.audit('tempObj', tempObj);
                    printOutArr.push(tempObj);

                    // //Search related item here
                    //
                    //
                    if (tempObj['lineDescription']) {
                        var so_arr_counter = tempObj['lineDescription'].split(' ')

                        for (x = 0; x < so_arr_counter.length; x++) {
                            if (so_arr_counter[x].startsWith('SO')) {
                                so_line_item_counter.push(so_arr_counter[x])
                            }
                        }
                    }


                }

                if (so_line_item_counter.length != 0) {
                    var counts = {};

                    so_line_item_counter.forEach(function (x) {
                        counts[x] = (counts[x] || 0) + 1;
                    });
                }

                log.audit('counts', counts)

                log.audit('so_line_item_counter', so_line_item_counter)

                log.audit('itemPrintout', printOutArr);

                var page_count = 0
                var prev_so


                for (var i = 0; i < printOutArr.length; i++) {
                    xmlHolder += "<p style=\"align: center;\"><b>" + COMPANYNAME + "</b></p>\n";
                    xmlHolder += "<table style=\"width: 90%; border: 1px solid black; margin-top: 25pt; align: center;\">\n";
                    xmlHolder += "<tr style=\"border-bottom: 1px solid black;\">\n";
                    xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; vertical-align: middle;\">From:</td>\n";
                    xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">To:</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "<tr>\n";

                    if (createdFromType.replace("Order ", "Order") == 'Transfer Order') {
                        var locationId = fulfillmentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "location",
                            line: i
                        });

                        // var so_text = fulfillmentRecord.getSublistValue({
                        //     sublistId: "item",
                        //     fieldId: "description",
                        //     line: i
                        // });
                        var so_text = printOutArr[i]['lineDescription']
                    } else {

                        var res = search.lookupFields({
                            type: 'salesorder',
                            id: createdFrom_id,
                            columns: 'location'
                        })

                        //log.error('res', res)


                        var locationId = res.location[0].value
                    }

                    // var ifs_desc = fulfillmentRecord.getSublistValue({
                    //     sublistId: "recmachcustrecord_avt_ifs_record_transid",
                    //     fieldId: "custrecord_avt_ifs_item_package_desc",
                    //     line: i
                    // });
                    var ifs_desc = printOutArr[i]['ifsDescription']

                    //log.error('ifs_desc', ifs_desc)

                    //log.error('SOTXT', so_text)
                    if (createdFromType.replace("Order ", "Order") == 'Transfer Order') {
                        var so_arr = so_text.split(' ')
                        var so_line_item = ''
                        for (x = 0; x < so_arr.length; x++) {
                            if (so_arr[x].startsWith('SO')) {
                                so_line_item = so_arr[x]
                            }
                        }


                        //log.error('so_line_item', so_line_item)
                    }
                    var locationRec = record.load({
                        type: "location",
                        id: locationId
                    });
                    var locationAddress = locationRec.getValue({
                        fieldId: "mainaddress_text"
                    });
                    log.debug("locationAddress", locationAddress);
                    var locationAddressArray = locationAddress.split("\n");
                    log.debug('locationAddressArray', locationAddressArray)
                    xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; vertical-align: middle;\">";
                    for (var j = 0; j < locationAddressArray.length - 1; j++) {
                        if (j > 0) {
                            xmlHolder += "<br />";
                        }
                        xmlHolder += xml.escape({
                            xmlText: locationAddressArray[j]
                        });
                    }
                    xmlHolder += "</td>\n";
                    xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">";
                    for (var j = 0; j < shippingAddressArray.length - 1; j++) {
                        if (j > 0) {
                            xmlHolder += "<br />";
                        }
                        xmlHolder += xml.escape({
                            xmlText: shippingAddressArray[j]
                        });
                    }
                    xmlHolder += "</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "</table>\n";

                    //Add Shipmethod
                    var shipMethod = fulfillmentRecord.getText({
                        fieldId: 'shipmethod'
                    });

                    var custbody8 = fulfillmentRecord.getText({
                        fieldId: 'custbody8'
                    });

                    if (shipMethod) {
                        xmlHolder += "<table style=\"width: 90%; border: 1px solid black; border-top: 0px; margin-top: 0pt; align: center;\">\n";
                        xmlHolder += "<tr>\n";
                        xmlHolder += "<td style=\"vertical-align: middle;\">" + xml.escape({
                            xmlText: shipMethod
                        }) + "</td>\n";
                        xmlHolder += "</tr>\n";
                        xmlHolder += "</table>\n";
                    }



                    xmlHolder += "<table style=\"width: 90%; border: 1px solid black; border-top: 0px; border-bottom: 4px solid black margin-top: 0pt; align: center;\">\n";
                    if (custbody8) {
                        xmlHolder += "<tr style=\"border-bottom: 4px solid black; \">\n";
                        xmlHolder += "<td style=\"vertical-align: middle; align: center; \">" + xml.escape({
                            xmlText: custbody8
                        }) + "</td>\n";
                        xmlHolder += "</tr>\n";
                    }
                    if (reference) {
                        xmlHolder += "<tr style=\"border-top: 1px solid black;\">\n";
                        xmlHolder += "<td style=\"font-size:26pt; vertical-align: middle; align: center;\">" + xml.escape({
                            xmlText: reference
                        }) + "</td>\n";
                        xmlHolder += "</tr>\n";

                    }
                    xmlHolder += "<tr style=\"border-top: 1px solid black;\">\n";
                    xmlHolder += "<td style=\"font-size:26pt; vertical-align: middle; align: center;\">" + xml.escape({
                        xmlText: createdFrom
                    }) + "</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "</table>\n";



                    xmlHolder += "<table style=\"width: 90%; border: 1px solid black; border-bottom: 4px solid black; margin-top: 0pt; align: center;\">\n";
                    xmlHolder += "<tr>\n";
                    //TO DO : Not sure if first IF Transaction Line means Item Name
                    var itemName = printOutArr[i]['itemName'] || "";
                    log.debug('printOutArr[i]["itemName"]', printOutArr[i]['itemName'])
                    // var itemName = fulfillmentRecord.getSublistValue({
                    //     sublistId: "item",
                    //     fieldId: "itemname",
                    //     line: i
                    // });
                    xmlHolder += "<td style=\"vertical-align: middle;\">" + xml.escape({
                        xmlText: itemName
                    }) + "</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "<tr style=\"border-top: 1px solid black;\">\n";
                    //TO DO : Not sure if first IF Transaction Line means Item Description
                    var itemDesc = printOutArr[i]['lineDescription'] || "";
                    log.debug('itemDescplacing', itemDesc);
                    // var itemDesc = fulfillmentRecord.getSublistText({
                    //     sublistId: "item",
                    //     fieldId: "description",
                    //     line: i
                    // });
                    if (itemDesc) {
                        xmlHolder += "<td style=\"vertical-align: middle;\">" + xml.escape({
                            xmlText: itemDesc
                        }) + "</td>\n";
                    }

                    xmlHolder += "</tr>\n";
                    xmlHolder += "<tr style=\"border-top: 1px solid black;\">\n";
                    xmlHolder += "<td style=\"font-size:38pt; vertical-align: middle; align: center;\">" + xml.escape({
                        xmlText: ifs_desc
                    }) + "</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "</table>\n";


                    createdFromType = createdFromType.replace("Order ", "Order");
                    log.debug("createdFromTypeAJF", createdFromType);

                    //TO DO: Need to add logic to check if the line description has an SO#
                    if (so_line_item != "" && createdFromType == 'Transfer Order') {
                        if (prev_so == so_line_item && (prev_so != '' || prev_so != null)) {
                            page_count = page_count + 1
                        } else {
                            page_count = 1
                        }

                        log.audit('check', 'check');
                        xmlHolder += "<table style=\"width: 90%; border: 1px solid black; margin-top: 35pt; align: center;\">\n";
                        xmlHolder += "<tr style=\"border-bottom: 1px solid black;\">\n";
                        xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; font-size:26pt; vertical-align: middle;\">" + so_line_item + "</td>\n";
                        //TO DO: Commented out these lines for now since there is no value in the IFS Package Record
                        // xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; font-size:26pt; vertical-align: middle;\">" + xml.escape({xmlText : specialInstructions1}) + "</td>\n";
                        xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + getCustName(so_line_item) + "</td>\n";
                        //xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">test</td>\n";
                        // xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + xml.escape({xmlText : specialInstructions2}) + "</td>\n";
                        xmlHolder += "</tr>\n";
                        xmlHolder += "<tr>\n";
                        xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; vertical-align: middle;\">Package</td>\n";
                        //TO DO: Not sure if each line in the Item Fulfillment is automatically counted as 1 package
                        var currentLine = i + 1;
                        //xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + currentLine + " of " + totalPackage + "</td>\n";
                        xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + page_count + " of " + counts[so_line_item] + "</td>\n";
                        xmlHolder += "</tr>\n";
                        xmlHolder += "</table>\n";
                        // xmlHolder += "<pbr/>\n";

                        if (i < itemLineCount - 1) {
                            xmlHolder += "<pbr/>\n";

                        }

                        prev_so = so_line_item

                    } else if (createdFromType != 'Transfer Order') {
                        if (prev_so == so_line_item && (prev_so != '' || prev_so != null)) {
                            page_count = page_count + 1
                        } else {
                            page_count = 1
                        }


                        // log.error('sales order created from ')
                        // log.error('sales order created from ')
                        // log.error('sales order created from ')

                        xmlHolder += "<table style=\"width: 90%; border: 1px solid black; margin-top: 35pt; align: center;\">\n";
                        xmlHolder += "<tr style=\"border-bottom: 1px solid black;\">\n";
                        // xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; font-size:26pt; vertical-align: middle;\">" + so_line_item + "</td>\n";
                        //TO DO: Commented out these lines for now since there is no value in the IFS Package Record
                        // xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; font-size:26pt; vertical-align: middle;\">" + xml.escape({xmlText : specialInstructions1}) + "</td>\n";
                        // xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + getCustName(so_line_item) + "</td>\n";
                        // // xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + xml.escape({xmlText : specialInstructions2}) + "</td>\n";
                        xmlHolder += "</tr>\n";
                        xmlHolder += "<tr>\n";
                        xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; vertical-align: middle;\">Package</td>\n";
                        //TO DO: Not sure if each line in the Item Fulfillment is automatically counted as 1 package
                        var currentLine = i + 1;

                        var page_num = parseInt(i) + 1
                        //xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + currentLine + " of " + totalPackage + "</td>\n";
                        xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">" + page_num + " of " + itemLineCount + "</td>\n";
                        xmlHolder += "</tr>\n";
                        xmlHolder += "</table>\n";
                        // xmlHolder += "<pbr/>\n";



                        if (i < itemLineCount - 1) {
                            xmlHolder += "<pbr/>\n";

                        }

                        prev_so = so_line_item
                    }


                }

                
            }else{
                xmlHolder += "<p style=\"align: center;\"><b>" + COMPANYNAME + "</b></p>\n";
                    xmlHolder += "<table style=\"width: 90%; border: 1px solid black; margin-top: 25pt; align: center;\">\n";
                    xmlHolder += "<tr style=\"border-bottom: 1px solid black;\">\n";
                    xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; vertical-align: middle;\">From:</td>\n";
                    xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">To:</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "<tr>\n";


                    if (createdFromType.replace("Order ", "Order") == 'Transfer Order') {
                        var locationId = fulfillmentRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "location",
                            line: i
                        });
                    } else {

                        var res = search.lookupFields({
                            type: 'salesorder',
                            id: createdFrom_id,
                            columns: 'location'
                        })

                        //log.error('res', res)


                        var locationId = res.location[0].value
                    }

                    var locationRec = record.load({
                        type: "location",
                        id: locationId
                    });
                    var locationAddress = locationRec.getValue({
                        fieldId: "mainaddress_text"
                    });
                    log.debug("locationAddress", locationAddress);
                    var locationAddressArray = locationAddress.split("\n");
                    log.debug('locationAddressArray', locationAddressArray)
                    xmlHolder += "<td width=\"50%\" style=\"border-right: 1px solid black; vertical-align: middle;\">";
                    for (var j = 0; j < locationAddressArray.length - 1; j++) {
                        if (j > 0) {
                            xmlHolder += "<br />";
                        }
                        xmlHolder += xml.escape({
                            xmlText: locationAddressArray[j]
                        });
                    }
                    xmlHolder += "</td>\n";
                    xmlHolder += "<td width=\"50%\" style=\"vertical-align: middle;\">";
                    for (var j = 0; j < shippingAddressArray.length - 1; j++) {
                        if (j > 0) {
                            xmlHolder += "<br />";
                        }
                        xmlHolder += xml.escape({
                            xmlText: shippingAddressArray[j]
                        });
                    }
                    xmlHolder += "</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "</table>\n";

                    //Add Shipmethod
                    var shipMethod = fulfillmentRecord.getText({
                        fieldId: 'shipmethod'
                    });

                    var custbody8 = fulfillmentRecord.getText({
                        fieldId: 'custbody8'
                    });

                    if (shipMethod) {
                        xmlHolder += "<table style=\"width: 90%; border: 1px solid black; border-top: 0px; margin-top: 0pt; align: center;\">\n";
                        xmlHolder += "<tr>\n";
                        xmlHolder += "<td style=\"vertical-align: middle;\">" + xml.escape({
                            xmlText: shipMethod
                        }) + "</td>\n";
                        xmlHolder += "</tr>\n";
                        xmlHolder += "</table>\n";
                    }

                    xmlHolder += "<table style=\"width: 90%; border: 1px solid black; border-top: 0px; border-bottom: 4px solid black margin-top: 0pt; align: center;\">\n";
                    if (custbody8) {
                        xmlHolder += "<tr style=\"border-bottom: 4px solid black; \">\n";
                        xmlHolder += "<td style=\"vertical-align: middle; align: center; \">" + xml.escape({
                            xmlText: custbody8
                        }) + "</td>\n";
                        xmlHolder += "</tr>\n";
                    }
                    if (reference) {
                        xmlHolder += "<tr style=\"border-top: 1px solid black;\">\n";
                        xmlHolder += "<td style=\"font-size:26pt; vertical-align: middle; align: center;\">" + xml.escape({
                            xmlText: reference
                        }) + "</td>\n";
                        xmlHolder += "</tr>\n";

                    }
                    xmlHolder += "<tr style=\"border-top: 1px solid black;\">\n";
                    xmlHolder += "<td style=\"font-size:26pt; vertical-align: middle; align: center;\">" + xml.escape({
                        xmlText: createdFrom
                    }) + "</td>\n";
                    xmlHolder += "</tr>\n";
                    xmlHolder += "</table>\n";
            }//MW
            xmlHolder += "</body>\n</pdf>";

                log.debug("xmlHolder", xmlHolder);
                var pdfFile = render.xmlToPdf({
                    xmlString: xmlHolder
                });
                pdfFile.name = "Shipping Label.pdf";
                context.response.writeFile({
                    file: pdfFile,
                    isInline: true
                });
            
        }


        //=====create search here/////

        const searchItem = (description, itemList) => {
            log.audit('searchItem: description', description);
            log.audit('searchItem: itemList', itemList)
            let itemOut = ''
            const itemSearchColName = search.createColumn({ name: 'internalid', sort: search.Sort.ASC });
            const itemSearchColShippingLabelDescription = search.createColumn({ name: 'custitem_shipping_label_description' });
            const itemSearchColType = search.createColumn({ name: 'type' });
            const itemSearchColMemberOf = search.createColumn({ name: 'memberof' });
            const itemSearch = search.create({
                type: 'item',
                filters: [
                    ['custitem_shipping_label_description', 'is', description],
                    'AND',
                    ['type', 'noneof', 'Kit'],
                ],
                columns: [
                    itemSearchColName,
                    itemSearchColShippingLabelDescription,
                    itemSearchColType,
                    itemSearchColMemberOf
                ],
            });

            const itemSearchPagedData = itemSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < itemSearchPagedData.pageRanges.length; i++) {
                const itemSearchPage = itemSearchPagedData.fetch({ index: i });
                itemSearchPage.data.forEach((result) => {
                    let itemExist = false;
                    for (let c = 0; c < itemList.length; c++) {
                        log.debug('itemsearch check:  ', itemList[c]['item'] + '==' + result.id);
                        if (itemList[c]['item'] == result.id) {
                            itemExist = true;
                            break; // exit loop once item is found
                        }
                    }
                    log.debug('itemSearch: itemExist', itemExist);
                    if (itemExist) {
                        log.audit('itemSearch: inventoryitem', result.id)
                        itemOut = result.id;
                    } else {
                        log.audit('itemSearch: kit', result.id)
                        if (description == "PE19 2.2m Slide - Green") {
                            log.error('check MemberOf-' + description, result.getValue(itemSearchColMemberOf))
                            log.error('check itemList-' + description, itemList)
                        }
                        //Search the member of value here
                        let tempitemOut = searchMemberOfItem(result.getValue(itemSearchColMemberOf), itemList, description)
                        if (tempitemOut > 0) {
                            itemOut = tempitemOut;
                        }
                    }
                });
            }
            return itemOut
        }

        const searchMemberOfItem = (description, itemList, test) => {
            let id = 0;
            if (test == 'PE19 2.2m Slide - Green') log.error(description)
            const itemSearchColName = search.createColumn({ name: 'itemid', sort: search.Sort.ASC });
            const itemSearch = search.create({
                type: 'item',
                filters: [
                    ['name', 'haskeywords', description],
                ],
                columns: [
                    itemSearchColName,
                ],
            });
            const itemSearchPagedData = itemSearch.runPaged({ pageSize: 1000 });
            for (let i = 0; i < itemSearchPagedData.pageRanges.length; i++) {
                const itemSearchPage = itemSearchPagedData.fetch({ index: i });
                itemSearchPage.data.forEach((result) => {
                    for (let c = 0; c < itemList.length; c++) {
                        if (itemList[c]['item'] == result.id) {
                            log.error('searchMemberOfItem: description:' + test, itemList[c]['item'] + '==' + result.id);
                            id = result.id;
                        }
                    }

                });
            }
            return id;
        }
        function getCustName(so_tranid) {
            log.audit('getCustName:', so_tranid);
            var salesorderSearchColFirstName = search.createColumn({
                name: 'firstname',
                join: 'customer'
            });
            var salesorderSearchColLastName = search.createColumn({
                name: 'lastname',
                join: 'customer'
            });
            var salesorderSearch = search.create({
                type: 'salesorder',
                filters: [
                    ['type', 'anyof', 'SalesOrd'],
                    'AND',
                    ['transactionnumber', 'startswith', so_tranid],
                    'AND',
                    ['mainline', 'is', 'T'],
                ],
                columns: [
                    salesorderSearchColFirstName,
                    salesorderSearchColLastName
                ],
            });
            // Note: Search.run() is limited to 4,000 results
            // salesorderSearch.run().each((result: search.Result): boolean => {
            //   return true;
            // });


            var cust_name
            var firstname
            var lastname
            var searchResultCount = salesorderSearch.runPaged().count;

            salesorderSearch.run().each(function (result) {
                firstname = result.getValue(salesorderSearchColFirstName);
                lastname = result.getValue(salesorderSearchColLastName);
                return true;
            });
            cust_name = firstname + ' ' + lastname

            return cust_name
        }

        return {
            onRequest: onRequest
        };
    });