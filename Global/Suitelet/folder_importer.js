/**
* @NApiVersion 2.x
* @NScriptType Suitelet
* @NModuleScope SameAccount
* @NAmdConfig /SuiteScripts/G 2.0/gconfig.json
*/
define(['N/search', 'N/runtime', 'N/record', 'N/url', 'N/https', 'OAuth', 'CryptoJS', 'N/email', 'libG', 'N/file', 'papaparse'],

    function (search, runtime, record, url, https, OAuth, CryptoJS, email, libG, file, papaparse) {

        var _ = libG.lodash();
        var currentDate = libG.getCurrentDate().full;
        // log.debug('date time', JSON.stringify(libG.getCurrentDate()));
        var customerCache = {};

        // log.debug('cryptojs sha1', CryptoJS.HmacSHA1('1', '1').toString(CryptoJS.enc.Base64));
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.debug('parameters', JSON.stringify(context.request.parameters));

            var customerHeaderMappingsObject = {
                firstname: 'firstname',
                lastname: 'lastname',
                phone: 'phone',
                addr1: 'addr1',
                addr2: 'addr2',
                city: 'city',
                state: 'state',
                zip: 'zip',
                addrphone: 'phone'
            };

            var resultArray = new Array();
            var customerErr = false;

            // Token Name: CSV Importer G - Hanna Protacio, GFL Customer Service TL
            var token = {
                key: '60f88705af49b3a2897a2c5602bc02043c77bea651f0f5a465e96ed42bf8074f',
                secret: 'b1ceb9c99f36fe7f41b63d0f56247cdd3eb98ad4d8e406d642e591416bb6de87'
            };
            var auth = OAuth({
                realm: '1117015_SB1',
                consumer: {
                    key: '9f47db82ff8e758b337f1a50c722d842e25a1882689a575341e34d61766144e0',
                    secret: 'b9e1d17da2dea58dd1a3444d91a3c8c664a118b65709a24b5f1e2bc9d64c9094'
                },
                signature_method: 'HMAC-SHA256',
                hash_function: function (base_string, key) {
                    return CryptoJS.HmacSHA256(base_string, key).toString(CryptoJS.enc.Base64);
                }
            });

            // generate restlet url of script actually create import task
            var restletUrl = url.resolveScript({
                scriptId: 'customscript_importer_restlet',
                deploymentId: 'customdeploy1',
                returnExternalUrl: true,
            });

            // get folder id and coresponding CSV import id, and preset values
            var settingSearch = search.create({
                type: 'customrecord_import_folder_settings',
                filters: [
                    ['isinactive', 'is', false]
                ],
                columns: [
                    'internalid',
                    'name',
                    'custrecord_import_folder_code',
                    'custrecord_import_folder_dealer',
                    'custrecord_import_folder_dropship',
                    'custrecord_import_folder_price_level',
                    'custrecord_import_folder_folder_id',
                    'custrecord_import_folder_import_type',
                    'custrecord_import_folder_preset_values',
                    'custrecord_import_folder_header_mappings',
                    'custrecord_import_folder_customer',
                    'custrecord_import_folder_customer_mappin'
                ]
            });

            // run for each folder
            var searchResultCount = settingSearch.runPaged().count;
            log.debug("settingSearch", searchResultCount);
            settingSearch.run().each(function (result) {
                log.debug('setting search result', (result));

                var code = result.getValue('custrecord_import_folder_code') || '';
                var dealerId = result.getValue('custrecord_import_folder_dealer');
                var dropship = result.getValue('custrecord_import_folder_dropship');
                var pricelevel = result.getValue('custrecord_import_folder_price_level');
                var folderId = result.getValue('custrecord_import_folder_folder_id');
                var importTypeId = result.getValue('custrecord_import_folder_import_type');
                var presetValueString = result.getValue('custrecord_import_folder_preset_values');
                var presetValueObject = {};
                if (!libG.isEmpty(presetValueString)) {
                    presetValueObject = JSON.parse(presetValueString);
                }
                var headerMappingsString = result.getValue('custrecord_import_folder_header_mappings');
                var headerMappingsObject = {};
                if (!libG.isEmpty(headerMappingsString)) {
                    headerMappingsObject = JSON.parse(headerMappingsString);
                }
                log.debug('header mapping', JSON.stringify(headerMappingsObject));

                var createCustomerRecord = result.getValue('custrecord_import_folder_customer');
                var customerHeaderMappingsString = result.getValue('custrecord_import_folder_customer_mappin');

                var mappingId = getImportType(importTypeId);
                var importName = result.getValue('name') + ' import';

                var fileSearch = search.create({
                    type: 'file',
                    filters: [
                        ['folder', 'is', folderId],
                        'AND',
                        ['filetype', 'is', 'CSV']
                    ],
                    columns: [
                        'internalid',
                        'name',
                        'owner',
                        'filetype',
                        'folder'
                    ]
                });
                var fileSearch123 = fileSearch.runPaged().count;
            log.debug("fileSearch123", fileSearch123);
                //run for each file inside folder
                //for csv files, First Name, Last Name, SKU, Zip/Postal Code, Quantity and External ID are must have             
                fileSearch.run().each(function (fileRsult) {
                    log.debug('file', JSON.stringify(fileRsult));
                    var fileId = fileRsult.getValue('internalid');
                    var ownerId = fileRsult.getValue('owner');
                    var fileName = fileRsult.getValue('name');

                    var fileObj = file.load({
                        id: fileId
                    });

                    var fileContent = fileObj.getContents();

                    var goodSOArray = new Array();
                    var badSOArray = new Array();

                    if (dropship) {
                        log.debug('dropship', true);
                        // log.debug('file content', fileContent);
                        fileContentPP = papaparse.parse(fileContent);
                        log.debug('papaparse', fileContentPP);

                        // generate column headings key by arrary index
                        // var fileHeadingsArray = _.map(fileContentPP.data[0], function(d) {return _.toLower(d)});
                        var fileHeadingsArray = fileContentPP.data[0];
                        // var fileHeadingKeyIndex = _.zipObject(fileHeadingsArray, _.map(fileHeadingsArray, function(k, i) {return i;}))
                        // log.debug('heading key index', fileHeadingKeyIndex);

                        var fileContentRowArray = new Array();
                        for (var i = 1; i < fileContentPP.data.length; i++) {
                            if (!_.isEmpty(_.compact(fileContentPP.data[i]))) {
                                var fileContentPPData = fileContentPP.data[i];
                                fileContentRowArray.push(_.zipObject(fileHeadingsArray, fileContentPPData));
                            }
                        }
                        log.debug('file content pp Data', JSON.stringify(fileContentRowArray));
                        var newFileContentRowArray = _.map(fileContentRowArray, function (f) {
                            if (!libG.isEmpty(pricelevel)) {
                                f['Price Level'] = pricelevel;
                            }

                            // add file name as a column
                            f['file_name'] = _.replace(_.toUpper(fileName), '.CSV', '');

                            // for Generic Dealer orders, add customer internlaid and pricelevel
                            if (_.has(headerMappingsObject, 'Customer Number NS')) {
                                log.error('ajf', _.trim(f[headerMappingsObject['Customer Number NS']]))
                                var dealerSearch = search.create({
                                    type: search.Type.CUSTOMER,
                                    filters: [
                                        ['entityid', 'is', _.trim(f[headerMappingsObject['Customer Number NS']])]
                                    ],
                                    columns: [
                                        'internalid',
                                        'pricelevel',
                                        'entitynumber',
                                        'entityid'
                                    ]
                                });

                                var dealerSearchResults = dealerSearch.run().getRange({
                                    start: 0,
                                    end: 1
                                });
                                log.debug('dealer', dealerSearchResults);
                                if (dealerSearchResults.length == 0) {
                                    throw 'cannot find the dealer, please make sure you have put correct dealer name';
                                }
                                f['Customer Internalid NS'] = dealerSearchResults[0].getValue('internalid');
                                f['Price Level'] = dealerSearchResults[0].getText('priceLevel');
                            }

                            if (_.has(headerMappingsObject, 'Parent Id') && _.toUpper(_.trim(f[headerMappingsObject['Parent Id']])) == 'YES') {
                                //Create customer record
                                log.audit('AJF PARENT HEADER MAPPING', _.trim(f[headerMappingsObject['Parent Id']]));
                                f['Parent Id'] = f['Customer Internalid NS']
                                log.error('checkME', f)
                                var customerRecordId = createCustomer(customerHeaderMappingsString, customerHeaderMappingsObject, importName, customerCache, f);
                                if (customerRecordId == 0) {
                                    throw "Unable to create customer record";
                                }
                                log.audit('CREATE A new Customer ID', customerRecordId);
                                f['Customer Internalid NS'] = customerRecordId;
                            } else {
                                //Do not Create customer Record
                                createCustomerRecord = false;
                                // log.audit('AJF NO PARENT', _.toUpper(_.trim(f[headerMappingsObject['Parent Id']])))
                                // f['Parent Id'] = 861
                            }

                            // backup 'externalid', and save first part of 'externalid'
                            if (_.has(headerMappingsObject, 'externalid')) {
                                var originalOrderId = f[headerMappingsObject.externalid];
                                f['original_order_id'] = originalOrderId;
                                var delimiter = _.has(headerMappingsObject, 'externalid_delimiter') ? headerMappingsObject.externalid_delimiter : '-';
                                f[headerMappingsObject.externalid] = code + (originalOrderId && originalOrderId.indexOf(delimiter) >= 0 ? originalOrderId.split(delimiter)[0] : originalOrderId);
                            }

                            // trim column
                            if (_.has(headerMappingsObject, 'sku')) {
                                f[headerMappingsObject.sku] = _.trim(f[headerMappingsObject.sku]);
                            }

                            // add addressee if both firstname and lastname exist otherwise it should be defined in saved import
                            if (_.has(headerMappingsObject, 'firstname') && _.has(headerMappingsObject, 'lastname')) {
                                f.Addressee = f[headerMappingsObject.firstname] + ' ' + f[headerMappingsObject.lastname];
                            }

                            // add preset values ect. and price level only if its value is string
                            _.forIn(presetValueObject, function (v, k) {
                                if (k != 'Price Level') {
                                    f[k] = v;
                                } else {
                                    if (_.isString(v)) {
                                        f['Price Level'] = v;
                                    }
                                }
                            });

                            // add date
                            f.Date = currentDate;

                            // remove empty header key and value
                            if (_.has(f, '')) {
                                f = _.omit(f, '');
                            }
                            return f;
                        });

                        log.debug('new file content row array', newFileContentRowArray);

                        // Get suggest location by sending all items in one sales order
                        var salesOrderGroups = _.groupBy(newFileContentRowArray, function (r) {
                            if (_.has(headerMappingsObject, 'externalid')) {
                                return r[headerMappingsObject.externalid];
                            } else {
                                return r['externalid'];
                            }
                        });
                        log.debug('sales order groups', JSON.stringify(salesOrderGroups));

                        // for each order, get SKUs, postcode, quantity 
                        // and set Location, and item internalid
                        // and create customer if necessory
                        _.forIn(salesOrderGroups, function (sogroup, externalid) {

                            var errorArray = new Array();

                            // make sure externalid exist not undefined
                            if (libG.isEmpty(externalid)) {
                                errorArray.push('Missing External ID in (' + JSON.stringify(sogroup) + ')');
                            } else {
                                // to create customer record HERE

                                // get item sku and quantity as one of parameters of freight options query
                                var itemArray = _.compact(_.map(sogroup, function (g) {

                                    if (g[headerMappingsObject.sku]) {

                                        if (_.has(headerMappingsObject, 'quantity') && g[headerMappingsObject.quantity]) {
                                            return g[headerMappingsObject.sku] + '*' + g[headerMappingsObject.quantity];
                                        } else {
                                            return g[headerMappingsObject.sku] + '*' + (g.Quantity || g.quantity || g.qty || '1');
                                        }
                                    } else {
                                        return '';
                                    }
                                }));
                                log.debug('item array', itemArray);
                                if (itemArray.length == 0) {
                                    errorArray.push('External ID ' + externalid + ' order is missing "SKU" or "Quantity" or both');
                                }

                                // get postcode for whole sales order
                                var postCodeArray = _.compact(_.uniq(_.map(sogroup, function (g) {
                                    if (_.has(headerMappingsObject, 'postcode')) {
                                        return g[headerMappingsObject.postcode]
                                    } else {
                                        return g['Zip/Postal Code'] || g['Postcode'] || g['zip'];
                                    }
                                })));
                                log.debug('postcode array', postCodeArray);
                                if (postCodeArray.length != 1) {
                                    errorArray.push("Single Externalid ID can only have one shipping destination");
                                }

                                // get postcode for whole sales order
                                var suburbArray = _.compact(_.uniq(_.map(sogroup, function (g) {
                                    if (_.has(headerMappingsObject, 'city')) {
                                        return g[headerMappingsObject.city]
                                    } else {
                                        return g['Suburb'] || g['City'];
                                    }
                                })));
                                log.debug('suburb array', suburbArray);
                                if (suburbArray.length != 1) {
                                    errorArray.push("Single Externalid ID can only have one shipping destination");
                                }

                                // get freigh options by making query
                                var freightUrl = url.resolveScript({
                                    scriptId: 'customscript_get_freight_options_v3',
                                    deploymentId: 'customdeploy1',
                                    returnExternalUrl: true,
                                    params: {
                                        item_sku: itemArray.join(','),
                                        postcode: _.trim(postCodeArray[0]),
                                        suburb: _.trim(suburbArray[0]),
                                        location: '15',
                                        source: 'folder_importer'
                                    }
                                });
                                log.debug('freight url', freightUrl);
                                //get available location and item internalid
                                var fexit = false;
                                var location = '15'; // BM
                                do {
                                    try {
                                        var freightResponse = https.get({
                                            url: freightUrl
                                        });

                                        if (freightResponse.code == '200') {
                                            log.debug('freight response', freightResponse.body);
                                            fexit = true;
                                            var freightOptions = JSON.parse(freightResponse.body);
                                        } else {
                                            log.error('freight response error', JSON.stringify(freightResponse));
                                        }
                                    } catch (e) {
                                        log.error('freight query error', JSON.stringify(e));
                                    }

                                } while (fexit == false);

                                if (freightOptions && !libG.isEmpty(freightOptions)) {

                                    // sogroup.Location = freightOptions.suggested_location.inventory_location_id || location;
                                    // sogroup.Location = freightOptions.cheapest_opt.location.inventory_location_id || location;
                                    // sogroup['Ship Via'] = freightOptions.cheapest_opt.shipitem;

                                    //for each line item in SO
                                    _.forEach(sogroup, function (l) {

                                        // add location
                                        // l.Location = sogroup.Location || location;
                                        // l['Ship Via'] = sogroup['Ship Via'] || '';

                                        // add item internalid
                                        // var itemid = _.has(headerMappingsObject, 'itemid') ? headerMappingsObject.itemid : 'Item Name';
                                        try {
                                            l['Item InternalID NS'] = _.find(freightOptions.item, {
                                                sku: l[headerMappingsObject.sku]
                                            }).internalid;

                                            //if price level is not exist lookup item to determine price level
                                            if (!_.has(l, 'Price Level')) {
                                                var itemDepartment = search.lookupFields({
                                                    type: search.Type.ITEM,
                                                    id: l['Item InternalID NS'],
                                                    columns: ['department']
                                                });

                                                log.debug('item department', JSON.stringify(itemDepartment));
                                                log.debug('item department', _.toUpper(itemDepartment['department'][0].text));
                                                log.debug('price level', JSON.stringify(presetValueObject['Price Level']));

                                                if (_.toUpper(itemDepartment['department'][0].text) == 'PROGEAR') {
                                                    l['Price Level'] = presetValueObject['Price Level']['progear'];
                                                } else {
                                                    if (presetValueObject['Price Level']) {
                                                        l['Price Level'] = presetValueObject['Price Level']['default'];
                                                    }
                                                }
                                            }

                                        } catch (e) {
                                            log.error('error', JSON.stringify(e));
                                            errorArray.push('failed to get Price Level, Please make sure item SKU is correct!');
                                        }
                                    });
                                } else {
                                    errorArray.push('Please make sure item sku, postcode, and quantity in order External ID ' + externalid + ' are correct!');
                                }
                            }

                            if (errorArray.length > 0) {
                                //attach error for each order line
                                _.forEach(sogroup, function (l) {
                                    l.Error = errorArray;
                                });
                                badSOArray = _.concat(badSOArray, sogroup);

                                resultArray.push({
                                    file_name: fileName,
                                    order_id: externalid,
                                    error: errorArray
                                });
                            } else {
                                goodSOArray = _.concat(goodSOArray, sogroup);
                            }
                        });
                    } else {
                        log.debug('dropship', false);

                        var fileLines = _.dropRight(papaparse.parse(fileContent, {
                            header: true
                        }).data);
                        log.debug('file lines', fileLines);
                        if (headerMappingsObject.sku) {
                            var itemSKUs = _.uniq(_.compact(_.map(fileLines, headerMappingsObject.sku)));
                            var itemFieldsRequest = https.get({
                                url: 'https://1117015.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=714&deploy=1&compid=1117015&h=abdbc3e7a02e6e0b76aa&item_sku=' + itemSKUs.join(',')
                            });

                            if (itemFieldsRequest.code == 200) {
                                var itemFields = JSON.parse(itemFieldsRequest.body)
                                log.debug('item fields request body', itemFields);

                                _.forEach(fileLines, function (fl) {
                                    var found = _.find(itemFields, {
                                        'sku': fl[headerMappingsObject.sku]
                                    });
                                    if (found) {
                                        fl[headerMappingsObject.sku] = found.internalid;
                                    }

                                    goodSOArray.push(fl);
                                });
                            } else {
                                _.forEach(fileLines, function (fl) {
                                    fl.Error = 'failed to find internalid of SKU';
                                    badSOArray.push(fl);
                                });
                            }
                        }
                    }

                    log.debug('bad sales order', JSON.stringify(badSOArray));
                    log.debug('good sales order', JSON.stringify(goodSOArray));

                    // create bad file in error folder
                    if (badSOArray.length > 0) {
                        var badFileId = createCSVFile(badSOArray, fileName + '.bad.csv', 2694828);
                        log.debug('bad file id', badFileId);

                        // send notice email to file owner
                        email.send({
                            author: 16,
                            recipients: ownerId,
                            cc: ['george.y@gflgroup.com.au', 'reece@gflgroup.com.au'],
                            subject: '[Notification] File Failed to append columns',
                            body: 'Error happends when append columns. check the file ' + fileName + '.bad.csv in folder "Import Files > Error"'
                        });
                    }

                    // create good file in processing folder
                    if (goodSOArray.length > 0) {
                        var goodFileId = createCSVFile(goodSOArray, fileName + '.good.csv', 2600867);
                        log.debug('good file id', goodFileId);
                    }

                    // delete the original file
                    if (badFileId || goodFileId) {
                        file.delete({
                            id: fileId
                        });
                    }

                    if (goodFileId) {

                        // generate restlet request headers
                        var requestData = {
                            url: restletUrl,
                            method: 'POST',
                            data: {}
                        };

                        // log.debug('restlet url', restletUrl);
                        // log.debug('oauth', JSON.stringify(auth));
                        // log.debug('oauth nonce', auth.getNonce());
                        // log.debug('oauth timestamp', auth.getTimeStamp());
                        // log.debug('oauth authorize', JSON.stringify(auth.authorize(requestData, token)));
                        // log.debug('oauth header', auth.toHeader(auth.authorize(requestData, token)));

                        var headers = auth.toHeader(auth.authorize(requestData, token));
                        log.error('headers', headers);
                        headers['Content-Type'] = 'application/json';
                        headers['User-Agent'] = 'suitelet';

                        // run import task except file in 'Test' Folder
                        var count = 0;
                        var rexist = false;
                        do {
                            try {
                                var response = https.post({
                                    url: restletUrl,
                                    headers: headers,
                                    body: JSON.stringify({
                                        file_id: goodFileId,
                                        mapping_id: mappingId
                                    })
                                });

                                log.debug('restlet response', JSON.stringify(response));

                                if (response.code == '200') {
                                    var responseBody = JSON.parse(response.body);
                                    rexist = true;
                                }

                            } catch (e) {
                                log.error('restlet request error', JSON.stringify(e));
                            }

                            count++;

                        } while (rexist == false && count < 10);

                        if (responseBody && responseBody.success) {

                            /** 
                         // creater scheduled importer for logging
                         var importRecordFields = {
                             'name': importName,
                             'custrecord_scheduled_importer_creator': ownerId,
                             'custrecord_scheduled_importer_type': importTypeId,
                             'custrecord_scheduled_importer_file': goodFileId,
                             'custrecord_scheduled_importer_task_id': responseBody.import_task_id,
                             'custrecord_scheduled_importer_status': responseBody.import_task_status
                         }
    
                         var importRecord = record.create({
                             type: 'customrecord_scheduled_importer',
                             isDynamic: true
                         });
    
                         for(var property in importRecordFields) {
                             if (importRecordFields.hasOwnProperty(property) && importRecordFields[property]) {
                                 importRecord.setValue({
                                     fieldId: property,
                                     value: importRecordFields[property]
                                 });
                             }
                         }
                         var importRecordId = importRecord.save({
                             enableSourcing: true,
                             ignoreMandatoryFields: true
                         });
    
                         log.debug('import record id', importRecordId);
                         */

                            // send notice if task creatation is failed.
                            if (responseBody.import_task_status == 'FAILED') {

                                resultArray.push({
                                    file_name: fileName,
                                    externalid: '',
                                    error: ['FAILED to create import task!']
                                });

                                //notice email
                                var emailBody = 'CSV import ' + importName + ' has failed to initiate';
                                // + '<br><br><a href="https://system.na2.netsuite.com/app/common/custom/custrecordentry.nl?rectype=3194&id=' + importRecordId + '">task</a>';
                                email.send({
                                    author: 16,
                                    recipients: ownerId,
                                    cc: ['george.y@gflgroup.com.au', 'reece@gflgroup.com.au'],
                                    subject: '[Notification] Failure executing saved csv import job',
                                    body: emailBody
                                });
                            } else if (
                                responseBody.import_task_status == 'PENDING' ||
                                responseBody.import_task_status == 'PROCESSING' ||
                                responseBody.import_task_status == 'COMPLETE'
                            ) {
                                resultArray.push({
                                    file_name: fileName,
                                    externalid: '',
                                    error: ['import task has been assigned SUCCESSFULLY!']
                                });
                            }
                        } else {
                            // not response Body, resetlet query failed
                            log.error('error', 'error happens when create import task');
                            resultArray.push({
                                file_name: fileName,
                                externalid: '',
                                error: ['error happens when create import task!']
                            });
                        }
                    }

                    // important, move to next file
                    return true;
                });

                // important move to next fold settings
                return true;
            });

            log.debug('remaining usage', runtime.getCurrentScript().getRemainingUsage());
            if (resultArray.length > 0) {

                var resultHtml = '<table><th><td>File</td><td>externalid</td><td>Results</td></th>';

                _.forEach(resultArray, function (result) {
                    resultHtml += '<tr>';
                    _.forIn(result, function (r, k) {
                        var cellHTML = _.isArray(r) ? r.join('<br>') : r;
                        resultHtml += '<td>' + cellHTML + '</td>';
                    });
                    resultHtml += '</tr>';
                });

                resultHtml += '</table>';

                context.response.write(resultHtml);
            }
        }

        function createCSVFile(data, fileName, folderId) {
            var csvString = papaparse.unparse(data, {
                header: true,
                delimiter: ',',
                newline: '\r\n'
            });

            var newCSVFile = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: csvString,
                folder: folderId
            });

            var fileId = newCSVFile.save();

            return fileId;
        }

        function createCustomer(customerHeaderMappingsString, customerHeaderMappingsObject, importName, customerCache, f) {
            var errorArray = [];
            log.debug('to create customer record', 'Yes');
            if (!libG.isEmpty(customerHeaderMappingsString)) {
                try {
                    customerHeaderMappingsObject = JSON.parse(customerHeaderMappingsString);
                    log.error('AJF customerHeaderMappingsObject', customerHeaderMappingsObject)
                    var customerRecordValue = {
                        entitystatus: 13 //CUSTOMER-Close Won
                        ,
                        parent: f['Parent Id'] || 861 //ONSELLER
                        ,
                        comments: importName,
                        category: 7,
                        isperson: 'T',
                        firstname: f[customerHeaderMappingsObject.firstname],
                        phone: f[customerHeaderMappingsObject.phone]
                    }

                    var addresseeName = f[customerHeaderMappingsObject.firstname];

                    if (_.has(customerHeaderMappingsObject, 'lastname') && !libG.isEmpty(f[customerHeaderMappingsObject.lastname])) {
                        customerRecordValue.lastname = f[customerHeaderMappingsObject.lastname];
                        addresseeName += ' ' + f[customerHeaderMappingsObject.lastname];
                    }

                    if (_.has(customerHeaderMappingsObject, 'email') && !libG.isEmpty(f[customerHeaderMappingsObject.email])) {
                        customerRecordValue.email = f[customerHeaderMappingsObject.email];
                    }

                    var addressDetails = {
                        country: 'AU',
                        addressee: addresseeName,
                        addr1: f[customerHeaderMappingsObject.addr1],
                        addr2: f[customerHeaderMappingsObject.addr2],
                        city: f[customerHeaderMappingsObject.city],
                        state: f[customerHeaderMappingsObject.state] //state's short form
                        ,
                        zip: f[customerHeaderMappingsObject.zip],
                        addrphone: f[customerHeaderMappingsObject.phone]
                    }

                    var cacheIdString = addresseeName + '-' + customerRecordValue.parent + '-' + customerRecordValue.phone;
                    log.error('cacheIdString', cacheIdString);
                    log.error('complete cache', customerCache);
                    //Check if customer record exists AJF
                    if (customerCache[cacheIdString]) {
                        var customerRecord = record.load({
                            id: customerCache[cacheIdString],
                            type: record.Type.CUSTOMER,
                            isDynamic: true
                        });
                    } else {
                        log.debug('Check Phone value', customerRecordValue.phone);
                        log.error('CheckaddresseeName', addresseeName);
                        const customerNameSearch = search.create({
                            type: 'customer',
                            filters: [
                                ['entityid', 'is', addresseeName],
                                'AND',
                                ['phone', 'is', customerRecordValue.phone],
                                'AND',
                                ['parent', 'is', customerRecordValue.parent],
                            ],
                            columns: [],
                        });

                        var customerNameSearchResults = customerNameSearch.run().getRange({
                            start: 0,
                            end: 1
                        });
                        log.error('CHECK THE LENGTH OF SEARCHRESULTS', customerNameSearchResults.length)
                        //Create new customer record if not existing
                        if (customerNameSearchResults.length <= 0) {
                            log.audit('AJF RECORD CREATE');
                            var customerRecord = record.create({
                                type: record.Type.CUSTOMER,
                                isDynamic: true,
                                defaultValues: {
                                    customform: 2
                                }
                            });
                        } else {
                            log.debug('Customer already exists, returning: ' + customerNameSearchResults[0].id)
                            return customerNameSearchResults[0].id;
                            log.audit('AJF CUSTOMER EDIT');
                            var customerRecord = record.load({
                                id: customerNameSearchResults[0].id,
                                type: record.Type.CUSTOMER,
                                isDynamic: true
                            });
                        }
                    }

                    // set customer value
                    util.each(customerRecordValue, function (v, k) {
                        customerRecord.setValue({
                            fieldId: k,
                            value: v
                        });
                    });

                    // set customer address
                    customerRecord.selectNewLine({
                        sublistId: 'addressbook'
                    });
                    customerRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'defaultbilling',
                        value: true
                    });
                    customerRecord.setCurrentSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'defaultshipping',
                        value: true
                    });

                    var subrecordAddress = customerRecord.getCurrentSublistSubrecord({
                        sublistId: 'addressbook',
                        fieldId: 'addressbookaddress'
                    });

                    util.each(addressDetails, function (addrv, addrk) {
                        subrecordAddress.setValue({
                            fieldId: addrk,
                            value: addrv
                        });
                    });

                    customerRecord.commitLine({
                        sublistId: 'addressbook'
                    });

                    var customerId = customerRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                    var custCacheString = addresseeName + '-' + customerRecordValue.parent + '-' + customerRecordValue.phone
                    log.debug('new created customer internalid', customerId);
                    customerCache[custCacheString] = customerId;

                    return customerId;
                } catch (e) {
                    errorArray.push('create customer record error: ' + JSON.stringify(e));
                    log.error(errorArray);
                    return 0;
                }
            } else {
                errorArray.push('missing customer field mappings!');
                log.error(errorArray);
                return 0;
            }
        }

        function getImportType(importTypeId) {
            var importScriptLookup = search.lookupFields({
                type: 'customrecord_scheduled_importer_type',
                id: importTypeId,
                columns: ['custrecord_saved_csv_import_id', 'name']
            });
            log.debug('csv import script id', importScriptLookup.custrecord_saved_csv_import_id);

            return importScriptLookup.custrecord_saved_csv_import_id;
        }

        return {
            onRequest: onRequest
        };

    });