/**
 *@NApiVersion 2.0
 *@NScriptType MapReduceScript
 */
define(['N/https', 'N/log', '../lib/temple_and_webster_lib', 'N/search', 'N/record'],
    function (https, log, tempWebLIB, search, record) {

        function getInputData() {
            var title = 'getInputData[::]';
            try {

                var poOrderObj, fromDate, toDate, poOrderObjJSON, poArray;

                fromDate = formateFromDate();
                toDate = fromDate;

                log.debug({
                    title: 'fromDate',
                    details: fromDate
                });

                poOrderObj = tempWebLIB.poOrderList(fromDate, toDate);

                poOrderObjJSON = JSON.parse(poOrderObj);

                poArray = poOrderObjJSON.data.purchase_order;

                log.debug({
                    title: 'poArray Get In PUT',
                    details: poArray
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return poArray || [];
            //access token eyJhbGciOiJIUzI1NiIsInR5cCI6IlRXVCJ9.eyJpc3N1ZWRfYXQiOjE3Mzg5MTA4NTYsImV4cGlyZXNfYXQiOjE3Mzg5MTQ0NTYsImVha19pZCI6NjN9.d1e086bc459b3bdbd5edf00890335ed4e482a3abdbfc69a61fa8c1c8f8466f1f
            // return ["TW49788519"];
        }

        function map(context) {
            var title = 'map[::]';
            try {
                var poOrderId = JSON.stringify(context.value);
                poOrderId = poOrderId.replace(/"/g, '');

                log.debug({
                    title: 'poOrderId',
                    details: poOrderId
                });

                if (poOrderId) {
                    var onePoData = tempWebLIB.getOnePoDataList(poOrderId);

                    var onePoDataJSON = JSON.parse(onePoData);
                    var ItemNameArray = onePoDataJSON.data.order_product;

                    //create Item Array from Temple and Webster to create SO lines in NS
                    var itemInternalIdArray = [];
                    var obj;
                    for (var m = 0; m < ItemNameArray.length; m++) {
                        obj = {};
                        var itemObj = ItemNameArray[m];
                        var itemSku = itemObj.ref_product_id;

                        var ItemID = templeAndWebsterItemSearch(itemSku);
                        if (ItemID != 0) {
                            obj.ItemID = ItemID;
                            obj.qty = itemObj.quantity;
                            obj.amount = itemObj.wholesale_price;
                            itemInternalIdArray.push(obj);
                        } else {

                            log.debug({
                                title: 'No Item found in NS againts Order Id ' + poOrderId,
                                details: "NO Item"
                            });
                            createSOErrorRec('No Item found in NS againts Order Id ' + poOrderId, poOrderId)
                            return;
                        }
                    }
                    // itemInternalIdArray = [{ "ItemID": "543333331", "qty": 1, "amount": 12.28 }];
                    //Check if SO already Exits or not

                    var soExits = soExitsSearch(poOrderId);

                    if (soExits == 0) {//Not Exits

                        //Create SO in NS using itemInternalIdArray And Temple and Webster Customer 
                        var custId = 1410049; //107095 TEMPLE & WEBSTER
                        var SOIdrec = crateSoInNetSuite(custId, itemInternalIdArray, poOrderId);

                        log.debug({
                            title: 'SOIdrec',
                            details: SOIdrec
                        });

                    } else {

                        log.debug({
                            title: 'Sales Order with Id: ' + soExits + ' alreday Exits in NS',
                            details: "YES"
                        });

                    }
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        function formateFromDate() {
            var title = 'formateFromDate[::]';
            try {
                // var date = new Date();

                // // var year = date.getFullYear().toString() + "4"; // Append "4" to the year
                // var year = date.getFullYear().toString(); // Append "4" to the year
                // var month = date.getMonth() + 1; // Months are zero-indexed
                // var day = date.getDate(); // Get the day

                // // Add leading zeros to month and day if necessary
                // if (month < 10) {
                //     month = '0' + month;
                // }
                // if (day < 10) {
                //     day = '0' + day;
                // }

                // return year + '-' + month + '-' + day;

                var now = new Date();
                var localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));

                var year = localTime.getFullYear().toString();
                var month = localTime.getMonth() + 1;
                var day = localTime.getDate();

                month = month < 10 ? '0' + month : month;
                day = day < 10 ? '0' + day : day;

                return year + '-' + month + '-' + day;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function templeAndWebsterItemSearch(itemName) {
            var title = 'templeAndWebsterItemSearch[::]';
            var itemId = 0;
            try {
                var itemSearchObj = search.create({
                    type: "item",
                    filters:
                        [
                            ["name", "is", itemName]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "itemid", label: "Name" }),
                            search.createColumn({ name: "displayname", label: "Display Name" })
                        ]
                });
                itemSearchObj.run().each(function (result) {
                    itemId = result.id;
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return itemId || 0;
        }
        function crateSoInNetSuite(custId, itemArray, poOrderId) {
            var title = 'crateSoInNetSuite[::]';
            try {
                var SoRecObj = record.create({
                    type: 'salesorder',
                    isDynamic: true
                });
                SoRecObj.setValue({ fieldId: 'customform', value: 189 });//GFL Sales Order - invoice
                SoRecObj.setValue({ fieldId: 'shipmethod', value: 25032 });//Pickup - Broadmeadows, VIC
                SoRecObj.setValue({ fieldId: 'location', value: 15 });//AU : Broadmeadows VIC
                SoRecObj.setValue({ fieldId: 'ordertype', value: 4 });//AFD: General
                SoRecObj.setValue({ fieldId: 'entity', value: parseInt(custId) });
                SoRecObj.setValue({ fieldId: 'memo', value: poOrderId });
                SoRecObj.setValue({ fieldId: 'custbody1', value: poOrderId });
                //set item lines

                for (var n = 0; n < itemArray.length; n++) {

                    var itemObj = itemArray[n];

                    SoRecObj.selectNewLine({
                        sublistId: 'item'
                    });

                    SoRecObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: parseInt(itemObj.ItemID),
                        forceSyncSourcing: true
                    });

                    SoRecObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        value: parseInt(itemObj.qty)
                    });

                    // SoRecObj.setCurrentSublistValue({
                    //     sublistId: 'item',
                    //     fieldId: 'amount',
                    //     value: parseFloat(itemObj.amount)
                    // });
                    SoRecObj.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'taxcode',
                        value: 7
                    });
                    SoRecObj.commitLine({
                        sublistId: 'item'
                    });
                }
                var soId = SoRecObj.save();

            } catch (e) {
                log.error(title + e.name, e.message);
                createSOErrorRec(e.message, poOrderId);
            }
            return soId;
        }
        function soExitsSearch(externalId) {
            var title = 'soExitsSearch[::]';
            try {
                var soId;
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            //    ["externalid","anyof",externalId],
                            ["custbody1", "contains", externalId],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" }),
                            search.createColumn({ name: "entity", label: "Name" }),
                            search.createColumn({ name: "tranid", label: "Document Number" })
                        ]
                });

                salesorderSearchObj.run().each(function (result) {
                    soId = result.id;
                    return true;
                });

            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return soId || 0;
        }
        function createSOErrorRec(message, poOrderId) {
            var title = 'createSOErrorRec[::]';
            try {
                var errorRec = record.create({
                    type: 'customrecord_templewebster_errorlogs'
                });
                errorRec.setValue({ fieldId: 'custrecord_temple_order_id', value: poOrderId });
                errorRec.setValue({ fieldId: 'custrecord_temple_order_error', value: message });
                errorRec.setValue({ fieldId: 'custrecord_temple_order_status', value: 'Failed' });
                var recId = errorRec.save();
                log.debug({
                    title: 'SO Error Rec ID',
                    details: recId
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return {
            getInputData: getInputData,
            map: map
        }

    });
