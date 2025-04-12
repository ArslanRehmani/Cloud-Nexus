/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
define(['N/record', 'N/search'],
    /**
     * @param{record} record
     * @param{search} search
     */
    function (record, search) {
        function pageInit(context) {
            try {
                if (context.mode == 'create') {
                    var currentRecord = context.currentRecord;
                    var terms = currentRecord.getValue('terms');
                    log.debug('terms', terms);
                    if (terms == 14) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 100);
                    }
                    else if (terms == 7) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 50);
                    }
                    else {
                        currentRecord.setValue('custbody_sp_deposit_percent', '');
                    }
                }
            }
            catch (e) {
                log.debug('Exception', e);
            }

        }
        function fieldChanged(context) {

            var currentRecord = context.currentRecord;
            var fieldId = context.fieldId;
            try {
                if (fieldId == 'terms') {
                    var terms = currentRecord.getValue('terms');
                    log.debug('terms', terms);
                    if (terms == 14) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 100);
                    }
                    else if (terms == 7) {
                        currentRecord.setValue('custbody_sp_deposit_percent', 50);
                    }
                    else {
                        currentRecord.setValue('custbody_sp_deposit_percent', '');
                    }
                }
            }
            catch (e) {
                log.debug('Exception', e);
            }
            var title1 = 'setShipMethodrelatedFields(::)';
            var obj;
            try {
                if (fieldId == 'shipmethod') {
                    var shipMethod = currentRecord.getValue('shipmethod');
                    log.debug('shipMethod', shipMethod);
                    if (!!shipMethod) {
                        var customrecord1019SearchObj = search.create({
                            type: "customrecord1019",
                            filters:
                                [
                                    ["custrecord1394", "anyof", shipMethod]
                                ],
                            columns:
                                [
                                    search.createColumn({ name: "custrecord1395", label: "Suburb" }),
                                    search.createColumn({ name: "custrecord1396", label: "Source Post Code" })
                                ]
                        });
                        customrecord1019SearchObj.run().each(function (result) {
                            obj = {};
                            obj.Suburb = result.getValue({ name: 'custrecord1395' });
                            obj.SourcePostCode = result.getValue({ name: 'custrecord1396' });
                            return true;
                        });
                        log.debug({
                            title: 'obj',
                            details: obj
                        });
                        currentRecord.setValue({
                            fieldId: 'custbody_mcm_suburb',
                            value: obj.Suburb
                        });
                        currentRecord.setValue({
                            fieldId: 'custbody_mcm_src_post_code',
                            value: obj.SourcePostCode
                        });
                    }
                }
            } catch (e) {
                log.debug('Exception ' + title1, e.message);
            }
            var title2 = 'setLineLocationIfShipeMethodChange(::)';
            try {
                if (fieldId == 'shipmethod') {
                    var shipMethod = currentRecord.getValue('shipmethod');
                    var salesrepID = currentRecord.getValue('salesrep');
                    if (!!salesrepID) {
                        var fieldLookUp = search.lookupFields({
                            type: 'employee',
                            id: salesrepID,
                            columns: ['location']
                        });
                        var itemLineCount = currentRecord.getLineCount({
                            sublistId: 'item'
                        });
                        for (var i = 0; i < itemLineCount; i++) {

                            var invType = currentRecord.getSublistValue({
                                sublistId: 'item',
                                fieldId:'itemtype',
                                line: i
                            });
                            if(invType != 'Group' || invType != 'EndGroup'){
                                if (shipMethod == '6976') {
                                    currentRecord.selectLine({
                                        sublistId: 'item',
                                        line: i
                                    });
                                    currentRecord.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'location',
                                        value: fieldLookUp['location'][0].value,
                                        line: i,
                                        ignoreFieldChange: true
                                    });
                                    currentRecord.commitLine({
                                        sublistId: 'item'
                                    });
                                }
                            }
                        }
                    }
                }
            } catch (e) {
                log.debug('Exception ' + title2, e.message);
            }



        }
        function saveRecord(context) {
            try {
                var currentRecord = context.currentRecord;
                /* var shipMethod = currentRecord.getValue('shipmethod');
                 var salesrepID = currentRecord.getValue('salesrep');
                 var fieldLookUp = search.lookupFields({
                     type: 'employee',
                     id: salesrepID,
                     columns: ['location']
                 });
                  var keyCustomer = currentRecord.getValue('custbody17');
                  log.debug('Key Customer', keyCustomer);
                  var earlyDelivery = currentRecord.getValue('custbody16');
                  log.debug('earlyDelivery', earlyDelivery);
                  var partShip = currentRecord.getValue('custbody15');
                  log.debug('partShip', partShip);
                  var leadTime = currentRecord.getValue('custbody14');
                  log.debug('leadTime', leadTime);
                  var notRequiredDate = currentRecord.getValue('custbody2');
                  log.debug('notRequiredDate', notRequiredDate);
                  var itemLineCount = currentRecord.getLineCount({
                      sublistId: 'item'
                  });
                  log.debug('itemLineCount', itemLineCount);
                  for (var i = 0; i < itemLineCount; i++) {
                      currentRecord.selectLine({
                          sublistId: 'item',
                          line: i
                      });
                      if(shipMethod == '6976'){
                         currentRecord.setCurrentSublistValue({
                             sublistId: 'item',
                             fieldId: 'location',
                             value: fieldLookUp['location'][0].value,
                             line: i,
                             ignoreFieldChange: true
                         });
                      }
                      if (!keyCustomer && !!earlyDelivery && !!partShip && !notRequiredDate) {
                          currentRecord.setCurrentSublistValue({
                              sublistId: 'item',
                              fieldId: 'orderallocationstrategy',
                              value: '3',
                              line: i,
                              ignoreFieldChange: true
                          });
                      }
                      else if (!keyCustomer && !!earlyDelivery && !partShip && !notRequiredDate) {
                          currentRecord.setCurrentSublistValue({
                              sublistId: 'item',
                              fieldId: 'orderallocationstrategy',
                              value: '6',
                              line: i,
                              ignoreFieldChange: true
                          });
      
                      }
                      else if (!keyCustomer && !earlyDelivery && !partShip && !!notRequiredDate) {
                          currentRecord.setCurrentSublistValue({
                              sublistId: 'item',
                              fieldId: 'orderallocationstrategy',
                              value: '5',
                              line: i,
                              ignoreFieldChange: true
                          });
                      }
                      else if (!!keyCustomer) {
                          currentRecord.setCurrentSublistValue({
                              sublistId: 'item',
                              fieldId: 'orderallocationstrategy',
                              value: '8',
                              line: i,
                              ignoreFieldChange: true
                          });
                      }
                      if(!!leadTime && !! notRequiredDate){
                         if(notRequiredDate.getTime() > leadTime.getTime()){
                             currentRecord.setCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'requesteddate',
                                 value: notRequiredDate,
                                 line: i,
                                 ignoreFieldChange: true
                             });
                          }else{
                             currentRecord.setCurrentSublistValue({
                                 sublistId: 'item',
                                 fieldId: 'requesteddate',
                                 value: leadTime,
                                 line: i,
                                 ignoreFieldChange: true
                             });
                          }
                      }
                      if(!!notRequiredDate && !leadTime){
                         currentRecord.setCurrentSublistValue({
                             sublistId: 'item',
                             fieldId: 'requesteddate',
                             value: notRequiredDate,
                             line: i,
                             ignoreFieldChange: true
                         });
                      }
                      if(!notRequiredDate && !!leadTime){
                         currentRecord.setCurrentSublistValue({
                             sublistId: 'item',
                             fieldId: 'requesteddate',
                             value: leadTime,
                             line: i,
                             ignoreFieldChange: true
                         });
                      }
                      currentRecord.commitLine({
                          sublistId: 'item'
                      });
      
                  } */
                checkIfGroupItem(currentRecord);
                return true;
            }
            catch (e) {
                log.debug('Exception', e);
                return true;
            }

        }
        function postSourcing(context) {
            var title = 'postSourcing(::)';
            try {
                var currentRecord = context.currentRecord;
                var shipMethod = currentRecord.getValue('shipmethod');
                if (!!shipMethod) {
                    var salesrepID = currentRecord.getValue('salesrep');
                    if (!!salesrepID) {
                        var fieldLookUp = search.lookupFields({
                            type: 'employee',
                            id: salesrepID,
                            columns: ['location']
                        });;
                        if (shipMethod == '6976') {
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'location',
                                value: fieldLookUp['location'][0].value,
                                ignoreFieldChange: true
                            });
                        }
                    }
                }
            } catch (e) {
                log.debug('Exception ' + title, e.message);
            }

        }
        function checkIfGroupItem(currentRecord) {
            try {
                var count = 0;
                var groupItemCount = 0;
                var groupItemAverageCost = 0;
                var itemLineCount = currentRecord.getLineCount({ sublistId: 'item' });
                log.debug('itemLineCount', itemLineCount);
                for (var i = 0; i < itemLineCount; i++) {
                    var item = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    log.debug('item', item);
                    var itemType = currentRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'itemtype',
                        line: i
                    });
                    log.debug('item', itemType);
                    if (itemType == 'Group') {
                        var groupItemLine = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'line',
                            line: i
                        });
                        log.debug('groupItemLine', groupItemLine);
                        if (groupItemCount > 0) {
                            log.debug('test');
                            currentRecord.selectLine({
                                sublistId: 'item',
                                line: groupItemLine - 1
                            });
                            currentRecord.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_group_item_avg_cost',
                                value: groupItemAverageCost
                            });
                            currentRecord.commitLine({
                                sublistId: 'item'
                            });
                            groupItemAverageCost = 0;
                        }
                        groupItemCount++;
                        var memberItemObj = memberItems(item);
                        log.debug('memberItemObj', memberItemObj);
                        var parentItem = item;
                    }
                    log.debug('count test', count);
                    log.debug('item test', item);
                    log.debug('memberitem test', memberItemObj[count].id);
                    if (item == memberItemObj[count].id) {
                        log.debug('count', count);
                        var itemQuantity = currentRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
                        log.debug('itemQuantity', itemQuantity);
                        if (itemQuantity && memberItemObj[count].AverageCost && memberItemObj[count].parentItem == parentItem) {
                            var itemAverageCost = itemQuantity * memberItemObj[count].AverageCost;
                            log.debug('itemAverageCost', itemAverageCost);
                            groupItemAverageCost = groupItemAverageCost + itemAverageCost;
                            log.debug('groupItemAverageCost', groupItemAverageCost);
                            //count++;
                            if (itemAverageCost) {
                                currentRecord.selectLine({
                                    sublistId: 'item',
                                    line: i
                                });
                                currentRecord.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_group_item_avg_cost',
                                    value: itemAverageCost
                                });
                                currentRecord.commitLine({
                                    sublistId: 'item'
                                });
                            }
                        }
                        if ((count + 1) < memberItemObj.length) {
                            count++;
                        }
                    }
                    if ((count + 1) == memberItemObj.length) {
                        // log.debug('count if',count+1);
                        // log.debug('memberItemObj.length',memberItemObj.length);
                        currentRecord.selectLine({
                            sublistId: 'item',
                            line: groupItemLine - 1
                        });
                        currentRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_group_item_avg_cost',
                            value: itemAverageCost
                        });
                        currentRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                }
            }
            catch (e) {
                log.debug('checkIgGroupItem Exception', e);
            }
        }
        function memberItems(item) {
            var memberItemArray = [];
            var searchTest = search.create({
                type: "itemgroup",
                filters:
                    [
                        ["type", "anyof", "Group"],
                        "AND",
                        ["internalid", "anyof", parseInt(item)]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "memberitem",
                            sort: search.Sort.ASC
                        }),
                        search.createColumn({
                            name: "averagecost",
                            join: "memberItem"
                        })
                    ]
            });
            var searchResult = searchTest.run().getRange({
                start: 0,
                end: 1000
            });
            var linecount = searchResult.length;
            log.debug('Search Line Count', linecount);
            for (var i = 0; i < linecount; i++) {
                var memberItemObj = {};
                var memberItem = searchResult[i].getValue({
                    name: 'memberitem',
                    sort: search.Sort.ASC
                });
                log.debug('memberitem ID', memberItem);
                memberItemObj.id = memberItem;
                var averageCost = searchResult[i].getValue({
                    name: "averagecost",
                    join: "memberItem"
                });
                log.debug('averageCost', averageCost);
                memberItemObj.AverageCost = averageCost;
                memberItemObj.parentItem = item;
                memberItemArray.push(memberItemObj);
            }
            return memberItemArray;

        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord,
            postSourcing: postSourcing
        };

    });
