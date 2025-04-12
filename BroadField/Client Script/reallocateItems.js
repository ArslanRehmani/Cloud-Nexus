/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/error', 'N/search', 'N/record', 'N/currentRecord', 'N/runtime'],

    function (log, error, search, record, currentRecord, runtime) {
        var totalLines = 0;
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            log.debug({
                title: 'test',
                details: 'yes'
            });
        }

        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            var title = 'fieldChanged[::]'
            try {
                var currentRecordObj = currentRecord.get();
                var fieldId = scriptContext.fieldId;
                var location, itemValue, existingLines;
                existingLines = currentRecordObj.getLineCount({
                    sublistId: 'custpage_items_sublist'
                });
                location = currentRecordObj.getValue({
                    fieldId: 'custpage_location'
                });
                console.log('location',location);
                itemValue = currentRecordObj.getValue({
                    fieldId: 'custpage_item'
                });
                console.log('itemValue',itemValue);
                if (totalLines == existingLines){
                    for (var j = existingLines - 1; j >= 0; j--) {
                        var checkboxValue = currentRecordObj.getSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_checkbox',
                            line: j
                        });
                        if(!checkboxValue){
                            window.confirm('Data you entered on this page has not been saved and will be lost. Press OK to proceed.');
                        } else {
                            currentRecordObj.removeLine({
                                sublistId: 'custpage_items_sublist',
                                line: j,
                                Recalc:true
                            });
                        }
                    }
                    totalLines = 0;
                }
                if (location && itemValue) {
                    var searchResults = searchResult(location,itemValue);
                }
                if(searchResults && searchResults.length > 0){
                    // currentRecordObj.setValue('custpage_quantity_picked',0);
                    //     currentRecordObj.setValue('custpage_units',0);
                    //     currentRecordObj.setValue('custpage_quantity',0);
                    //     currentRecordObj.setValue('custpage_quantity_on_hand',0);
                    //     currentRecordObj.setValue('custpage_quantity_required',0);
                    //     currentRecordObj.setValue('custpage_quantity_committed',0);
                    for (var m = 0; m < searchResults.length; m++) {
                        var result = searchResults[m];
                        totalLines++;
                        currentRecordObj.selectNewLine({
                            sublistId: 'custpage_items_sublist'
                        });
                    
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_order_date',
                            value: result.date || null,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_expected_ship_date',
                            value: result.ShipDate || null,
                            ignoreFieldChange: true
                        });
                    
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_order_no',
                            value: result.DocumentNumber || null,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_special_order',
                            value: result.SpecialOrder || null,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_quantity_received',
                            value: result.QuantityReceived || null,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_commit',
                            value: result.commit || null,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_quantity_committed_sublist',
                            value: result.QuantityCommitted || 0,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_customer',
                            value: parseInt(result.Name) || null,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_quantity_ordered',
                            value: result.QuantityOrdered || 0,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_comment',
                            value: result.Comments || '',
                            ignoreFieldChange: true
                        });
                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_checkbox',
                            value: true,
                            ignoreFieldChange: true
                        });
                        currentRecordObj.commitLine({
                            sublistId: 'custpage_items_sublist'
                        });
                    }
                }
            } catch (e) {
                console.log(title + 'Error', e.message);
            }
        }
        function saveRecord(context) {
            try {
                var currentRecordObj = currentRecord.get();
                console.log('test','yes');
                var locationValue = currentRecordObj.getValue({
                    fieldId: 'custpage_location'
                });
                var itemValue = currentRecordObj.getValue({
                    fieldId: 'custpage_item'
                });
                if (!itemValue && !locationValue) {
                    window.confirm('Please enter values for Item and Location.');
                } else if (!itemValue) {
                    window.confirm('Please enter a value for Item.');
                } else if (!locationValue) {
                    window.confirm('Please enter a value for Location.');
                } else {
                    var lineCount = currentRecordObj.getLineCount({
                        sublistId: 'custpage_items_sublist'
                    });

                    var trueCheckboxCount = 0;

                    for (var j = 0; j < lineCount; j++) {
                        var checkboxValue = currentRecordObj.getSublistValue({
                            sublistId: 'custpage_items_sublist',
                            fieldId: 'custpage_checkbox',
                            line: j
                        });

                        if (checkboxValue === true) {
                            trueCheckboxCount++;
                        }

                        if (checkboxValue === false) {
                            var confirmation = window.confirm('All remaining non-special order items will automatically be committed on submission. Click OK to submit anyway.');
                            if (confirmation) {
                                trueCheckboxCount++;
                            } else {
                                trueCheckboxCount = 0;
                                break;
                            }
                        }
                    }
                    if (trueCheckboxCount === lineCount) {
                        for (var i = 0; i < lineCount; i++) {
                            var documentNumber = currentRecordObj.getSublistValue({
                                sublistId: 'custpage_items_sublist',
                                fieldId: 'custpage_order_no',
                                line: i
                            });
                            console.log('document', documentNumber);
                            var recordSearch = search.create({
                                type: 'transaction',
                                filters: [['tranid', 'is', documentNumber]],
                                columns: ['type', 'internalid']
                            });
                            var searchResults = recordSearch.run().getRange({ start: 0, end: 1 });
                            var recordType = searchResults.length > 0 ? searchResults[0].getText('type') : null;
                            recordType = recordType.toLowerCase().replace(/\s/g, '');
                            var internalId = searchResults.length > 0 ? searchResults[0].getValue('internalid') : null;
                            if (recordType && internalId) {
                                var loadedRecord = record.load({
                                    type: recordType,
                                    id: internalId
                                });
                                var lines = loadedRecord.getLineCount({
                                    sublistId: 'item'
                                });
                                for (var j = 0; j < lines; j++) {
                                    var documentNumber = loadedRecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: 'quantitycommitted',
                                        line: j
                                    });
                                }

                            }
                        }
                        window.location.href = '/app/center/card.nl?sc=-29';
                    }
                }
            }
            catch (e) {
                console.log('Error: ', e.message);
            }
        }
        function searchResult(loc, item) {
            var title = 'searchResult[::]';
            var array = [];
            var obj;
            try {
                var salesorderSearchObj = search.create({
                    type: "salesorder",
                    filters:
                        [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["item", "anyof", item],
                            "AND",
                            ["location", "anyof", loc],
                            "AND",
                            ["status", "anyof", "SalesOrd:B"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "trandate", label: "Date" }),
                            search.createColumn({ name: "shipdate", label: "Ship Date" }),
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({ name: "specialorder", label: "Special Order" }),
                            search.createColumn({ name: "entity", label: "Name" }),
                            search.createColumn({ name: "quantity", label: "Quantity Ordered" }),
                            search.createColumn({ name: "quantity", label: "Quantity Remaining" }),
                            search.createColumn({ name: "quantityshiprecv", label: "Quantity Received" }),
                            search.createColumn({ name: "commit", label: "Commit" }),
                            search.createColumn({ name: "quantity", label: "Number Quantity Remaining" }),
                            search.createColumn({ name: "quantitycommitted", label: "Quantity Committed" }),
                            search.createColumn({name: "custbody_memo", label: "Comments"})
                        ]
                });
                var resultSet = searchAllWithColumns(salesorderSearchObj);
                for(var l = 0; l < resultSet.length; l++){
                    obj = {};
                    var resultobj = resultSet[l];
                    obj.date = resultobj.getValue({name: 'trandate'});
                    obj.ShipDate = resultobj.getValue({name: 'shipdate'});
                    obj.DocumentNumber = resultobj.getValue({name: 'tranid'});
                    obj.SpecialOrder = resultobj.getValue({name: 'specialorder'});
                    obj.QuantityReceived = resultobj.getValue({name: 'quantityshiprecv'});
                    obj.QuantityCommitted = resultobj.getValue({name: 'quantitycommitted'});
                    obj.QuantityOrdered = resultobj.getValue({name: 'quantity'});
                    obj.commit = resultobj.getValue({name: 'commit'});
                    obj.Name = resultobj.getValue({name: 'entity'});
                    obj.Comments = resultobj.getValue({name: 'custbody_memo'});
                    array.push(obj);
                }
            } catch (e) {
                log.error({ title: title + ' ' + e.name, details: e.message });
            }
            return array || [];
        }
        /**
             * @param  {} searchResult
             * @param  {} {return allresult of search in an array form }
             * Details : Return all search data 
             */
        function searchAllWithColumns(searchResult) {
            var title = 'searchAllWithColumns[::]';
            try {
                var allResults = [];
                var startIndex = 0;
                var RANGECOUNT = 1000;
                do {
                    var resultset = searchResult.run();
                    var pagedResults = resultset.getRange({
                        start: parseInt(startIndex),
                        end: parseInt(startIndex + RANGECOUNT)
                    });

                    allResults = allResults.concat(pagedResults);

                    var pagedResultsCount = pagedResults != null ? pagedResults.length : 0;
                    startIndex += pagedResultsCount;

                }
                while (pagedResultsCount == RANGECOUNT);
            } catch (error) {
                log.error(title + error.name, error.message);
            }
            return allResults;
        }
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord

        };

    });
