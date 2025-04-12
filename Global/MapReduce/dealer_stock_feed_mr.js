/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * 
 * Transfer from dealer_stock_feed_2_scheduler.js and dealer_stock_feed_2.js, and also run an independent git repostory
 */
define(['N/url', 'N/https', 'N/email', 'N/file', 'N/record', 'N/search', 'N/crypto', 'N/encode',
    '/SuiteScripts/G 2.0/lodash.4.17.15',
    '/SuiteScripts/glib/glib',
    '/SuiteScripts/Lib-NS/crypto-v3.1.2/crypto-js',
    'N/runtime',
    '/SuiteScripts/Sales order Init/sales_order_plugins'
],

    function (url, https, email, file, record, search, crypto, encode, _, libG, CryptoJS, runtime, soPlugins) {

        const ftpProxyMsg = 'please fill "FTP PROXY" in such format username:password@host/path';
        const currentWeekday = libG.getISOWeekDay();

        /**
         * Marks the beginning of the Map/Reduce process and generates input data.
         *
         * @typedef {Object} ObjectRef
         * @property {number} id - Internal ID of the record instance
         * @property {string} type - Record type id
         *
         * @return {Array|Object|Search|RecordRef} inputSummary
         * @since 2015.1
         */
        function getInputData() {
            const dealerInternalid = runtime.getCurrentScript().getParameter('custscript_dealer_stock_feed_dealer');
            const filters = [
                ['isinactive', 'is', 'F'],
                'AND',
                // ['custrecord_dealer_checkbox_id', 'isnotempty', null] //add null, IMPORTANT
                [[["custrecord_dealer_checkbox_id", "isnotempty", ""], "OR", ["custrecord_dealer_inventory_dept", "anyof", "@NONE@"]], "OR", [["custrecord_dealer_checkbox_id", "isempty", ""], "OR", ["custrecord_dealer_inventory_dept", "noneof", "@NONE@"]]]
            ];
            log.audit('dealerInternalid', dealerInternalid)
            if (dealerInternalid) {
                filters.push('AND');
                filters.push(['internalid', 'is', dealerInternalid])
            }
            const dealersArray = new Array();
            // get dealer record details
            search.create({
                type: 'customrecord_dealer_stock_feed_mgmt',
                filters: filters,
                columns: [
                    'name',
                    'custrecord_dealer_customer',
                    'custrecord_dealer_checkbox_id',
                    'custrecord_dealer_csv_format',
                    'custrecord_dealer_feed_invt_location',
                    'custrecord_dealer_quantity_formula',
                    'custrecord_dealer_stock_level',
                    'custrecord_dealer_inventory_dept',
                    'custrecord_dealer_outofstock_only',
                    'custrecord_dealer_recipients',
                    'custrecord_dealer_recipient_group',
                    'custrecord_dealer_mail_cc',
                    'custrecord_dealer_mail_bcc',
                    'custrecord_dealer_mail_subject',
                    'custrecord_dealer_feed_format',
                    'custrecord_dealer_feed_name_format',
                    'custrecord_dealer_mail_body',
                    'custrecord_dealer_weekdays',
                    'custrecord_dealer_ftp',
                    'custrecord_dealer_ftp_secure',
                    'custrecord_dealer_ftp_username',
                    'custrecord_dealer_ftp_password',
                    'custrecord_dealer_ftp_host',
                    'custrecord_dealer_lastest_inventory',
                ]
            }).run().each((result) => {
                // log.debug('result', JSON.stringify(result));
                log.debug('deale name', result.getValue('name'));
                const dealerObject = { internalid: result.id };
                dealerObject.dealer_name = result.getValue('name');
                dealerObject.customer_internalid = result.getValue('custrecord_dealer_customer');
                dealerObject.customer_fullname = result.getText('custrecord_dealer_customer');
                dealerObject.dealer_checkbox_id = _.trim(result.getValue('custrecord_dealer_checkbox_id'));
                dealerObject.dealer_inventory_department = result.getValue('custrecord_dealer_inventory_dept');

                const csvHeadingsAndFormat = getCSVHeadingsAndFormat(result.getValue('custrecord_dealer_csv_format'), result.getValue('name'));
                log.debug('csv format', csvHeadingsAndFormat);
                dealerObject.dealer_csv_headings = csvHeadingsAndFormat.csv_headings;
                dealerObject.dealer_csv_single_row_template = csvHeadingsAndFormat.csv_single_row;
                dealerObject.dealer_csv_additional_fields = csvHeadingsAndFormat.additional_fields || [];

                const inventoryLocation = result.getValue('custrecord_dealer_feed_invt_location') || '15';
                // const inventoryLocation = '15';
                dealerObject.dealer_feed_invetory_location = convertStringtoArray(inventoryLocation);
                log.audit('location', dealerObject.dealer_feed_invetory_location)

                dealerObject.quantity_formula = result.getValue('custrecord_dealer_quantity_formula');
                dealerObject.stock_level = result.getValue('custrecord_dealer_stock_level');
                dealerObject.outofstock_only = result.getValue('custrecord_dealer_outofstock_only');

                const emailRecipients = convertStringtoArray(result.getValue('custrecord_dealer_recipients'));

                const customerGroupIds = result.getValue('custrecord_dealer_recipient_group');
                // if (emailRecipients && emailRecipients.length > 0) {
                dealerObject.email_recipients = emailRecipients;
                // } else 
                let emailArray = [];
                if (customerGroupIds) {
                    util.each(customerGroupIds.split(','), customerGroupId => {
                        emailArray = _.concat(emailArray, _.compact(libG.getEntityGroupMembers(customerGroupId)));
                    })
                    // _.compact(emailArray);
                    emailArray = _.uniq(emailArray)
                    log.audit(`${result.getValue('name')} email array`, emailArray);
                }

                dealerObject.email_cc = convertStringtoArray(result.getValue('custrecord_dealer_mail_cc'));

                const emailBCC = convertStringtoArray(result.getValue('custrecord_dealer_mail_bcc'));
                dealerObject.email_bcc = libG.isEmpty(emailArray) ? emailBCC : _.concat(emailArray, emailBCC);

                // var currentDate = libG.getCurrentDate();
                // log.debug('current date', JSON.stringify(currentDate));

                dealerObject.email_subject = libG.replaceDateTemplate(result.getValue('custrecord_dealer_mail_subject'));
                dealerObject.feed_format = convertStringtoArray(result.getText('custrecord_dealer_feed_format'));
                dealerObject.feed_name = libG.replaceDateTemplate(result.getValue('custrecord_dealer_feed_name_format'));
                dealerObject.email_body = libG.replaceDateTemplate(result.getValue('custrecord_dealer_mail_body'));
                // dealerObject.email_body = result.getValue('custrecord_dealer_mail_body');
                dealerObject.weekdays = convertStringtoArray(result.getValue('custrecord_dealer_weekdays'));
                dealerObject.ftp = result.getValue('custrecord_dealer_ftp');
                dealerObject.ftp_secure = result.getValue('custrecord_dealer_ftp_secure');
                dealerObject.ftp_username = result.getValue('custrecord_dealer_ftp_username');
                dealerObject.ftp_password = result.getValue('custrecord_dealer_ftp_password');
                dealerObject.ftp_host = result.getValue('custrecord_dealer_ftp_host');
                dealerObject.multi_update = result.getValue('custrecord_dealer_multiple_update');
                // log.debug('dealer obje', (dealerObject));

                dealersArray.push(dealerObject);

                return true;
            });

            return dealersArray;
        }

        /**
         * Executes when the map entry point is triggered and applies to each key/value pair.
         *
         * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
         * @since 2015.1
         */
        function map(context) {
            const dealerObj = JSON.parse(context.value);
            log.debug('dealerObj start', dealerObj);

            // get dealers' price level
            //  pricelevel
            let priceLevelFormula = null;
            if (dealerObj.customer_internalid) {
                const customerObj = search.lookupFields({
                    type: 'customer',
                    id: dealerObj.customer_internalid,
                    columns: [
                        'pricelevel'
                    ]
                });
                log.debug('customerObj', customerObj);
                if (!_.isEmpty(customerObj.pricelevel) && customerObj.pricelevel[0].value) {
                    priceLevelFormula = '{pricelevel' + customerObj.pricelevel[0].value + '}';
                }
                log.debug('priceLevelFormula', priceLevelFormula);
            }

            if (dealerObj.dealer_checkbox_id) {
                var stockUrl = url.resolveScript({
                    scriptId: 'customscript_bulk_inventory',
                    deploymentId: 'customdeploy1',
                    returnExternalUrl: true,
                    params: {
                        filters: dealerObj.dealer_checkbox_id + ':is:T,isinactive:is:F',
                        location: dealerObj.dealer_feed_invetory_location.join(','),
                        dept: false

                    }
                });
            } else {
                var stockUrl = url.resolveScript({
                    scriptId: 'customscript_bulk_inventory',
                    deploymentId: 'customdeploy1',
                    returnExternalUrl: true,
                    params: {
                        filters: dealerObj.dealer_inventory_department,
                        location: dealerObj.dealer_feed_invetory_location.join(','),
                        dept: true
                    }
                });
            }

            const stockFields = [
                { name: 'isinactive', summary: 'GROUP' },
                { name: 'salesdescription', summary: 'GROUP' },
                { name: 'baseprice', summary: 'GROUP' },
                { name: 'custitem_prices_include_tax', summary: 'GROUP' },
            ];
            if (priceLevelFormula) {
                stockFields.push({ name: 'formulacurrency', formula: priceLevelFormula, label: 'dealer_price', summary: 'MAX' })
            }
            util.each(dealerObj.dealer_csv_additional_fields, function (field) {
                stockFields.push({ name: field, summary: 'GROUP' });
            })
            log.audit(dealerObj.dealer_name + ' stockUrl', stockUrl)
            log.audit(dealerObj.dealer_name + ' stockFields', stockFields)
            let respCode = 200, count = 4;
            do {
                try {
                    const stockResp = https.post({
                        url: stockUrl,
                        body: JSON.stringify({
                            fields: stockFields
                        })
                    });
                    log.debug('stockResp', stockResp);
                    respCode = stockResp.code;

                    if (stockResp.code == 200) {
                        var hasString = false;
                        if ((stockResp.body).includes('<!--')) {
                            hasString = true;
                            var response = {};
                            response.data = stockResp.body;
                            var outPut = (response.data).replace(/<!--[\s\S]*?-->/g, '');
                        }
                        const stockBody = !!hasString == true ? JSON.parse(outPut) : JSON.parse(stockResp.body);

                        var dealerItemArray = new Array();

                        // save item array to file
                        const fileName = `${_.snakeCase(dealerObj.dealer_name)}_${dealerObj.internalid}_item.json`
                        let preItemArr = [];
                        try {
                            preItemArr = JSON.parse(file.load(`./items/${fileName}`).getContents());
                            //set error field empty if no error occur
                            record.submitFields({
                                type: 'customrecord_dealer_stock_feed_mgmt',
                                id: dealerObj.internalid,
                                values: {
                                    'custrecord_dealer_stockfeed_error': ''
                                }
                            });
                        } catch (error) {
                            log.error(`get file ${fileName} error`, error);
                            //set error field with error.message if any error occur
                            record.submitFields({
                                type: 'customrecord_dealer_stock_feed_mgmt',
                                id: dealerObj.internalid,
                                values: {
                                    'custrecord_dealer_stockfeed_error': error.message
                                }
                            });
                        }
                        log.debug('preItemArr', preItemArr)
                        util.each(stockBody.inventory, (item) => {
                            //    log.debug('item', item);
                            const itemObj = {};
                            itemObj.internalid = item.internalid;
                            itemObj['sku'] = item.sku;
                            itemObj['description'] = libG.trimCommaLineBreaker(item.salesdescription);
                            itemObj['quantity'] = item.enforce_stock_buffer ? applyQtyStockLevelFormula(dealerObj.quantity_formula, dealerObj.stock_level, item.quantity_available) : item.quantity_available_original;
                            itemObj['price'] = item.dealer_price;

                            //  log.debug('item obj', (itemObj));

                            util.each(dealerObj.dealer_csv_additional_fields, function (field) {
                                // Display only when quantity is OUT OF STOCK or 0 ETA
                                if (field == 'custitem43') { // ETA
                                    if (
                                        (util.isString(itemObj.quantity) && itemObj.quantity != 'OUT OF STOCK') ||
                                        (util.isNumber(itemObj.quantity) && itemObj.quantity > 0)
                                    ) {
                                        itemObj[field] = '';
                                    } else {
                                        if (['9', '15'].indexOf(dealerObj.internalid) >= 0) {
                                            const websiteETA = soPlugins.getWebsiteETA(item[field])
                                            log.debug(`website eta ${item[field]}`, websiteETA)
                                            itemObj[field] = _.isEmpty(websiteETA) ? '' : websiteETA.format('DD/MM/YYYY')
                                        } else {
                                            itemObj[field] = item[field] || '';
                                        }
                                    }
                                } else if (field == 'custitem46') { // DISCONTINUED
                                    if (dealerObj.internalid == '10') {
                                        if (item[field]) {
                                            itemObj[field] = '1';
                                        } else {
                                            itemObj[field] = '0';
                                        }
                                    } else {
                                        if (item[field]) {
                                            itemObj[field] = 'YES';
                                        } else {
                                            itemObj[field] = '';
                                        }
                                    }
                                } else {
                                    itemObj[field] = item[field] || '';
                                }

                                // add 'Recent Arrivals', 'ETA Change' to header and content template
                                if (['9', '15'].indexOf(dealerObj.internalid) >= 0) {
                                    itemObj.recent_arrival = ''
                                    itemObj.eta_change = ''
                                    const preItemObj = _.find(preItemArr, { internalid: item.internalid })
                                    // log.debug('preItemObj', preItemObj)
                                    if (
                                        (preItemObj && preItemObj.quantity <= 0 && itemObj.quantity > 0) ||
                                        (preItemObj && preItemObj.quantity == 'OUT OF STOCK' && itemObj.quantity != 'OUT OF STOCK')
                                    ) {
                                        itemObj.recent_arrival = 'YES'
                                    }

                                    // ETA
                                    if (preItemObj && preItemObj.custitem43 && itemObj.custitem43 && preItemObj.custitem43 != itemObj.custitem43) {
                                        itemObj.eta_change = 'YES'
                                    }
                                }
                            });

                            // log.debug('item obj', (itemObj));
                            dealerItemArray.push(itemObj);
                        });

                        log.debug('dealerItemArray', dealerItemArray);

                        if (dealerObj.outofstock_only) {
                            dealerItemArray = _.filter(dealerItemArray,
                                { 'quantity': 0 }
                            );
                        }

                        // Modify dealerItemArray using lodash _.filter, take only quantity = 0;



                        // set removed item qty as 0
                        // if (!_.isEmpty(preItemArr) && !_.isEmpty(dealerItemArray)) {
                        //     util
                        // }

                        file.create({
                            name: fileName,
                            fileType: file.Type.JSON,
                            contents: JSON.stringify(dealerItemArray),
                            folder: 7746776, // 6420729, // sandbox, 7746776,
                            encoding: file.Encoding.UTF8,
                        }).save();

                        dealerObj.items = dealerItemArray;

                        // if (_.indexOf(dealerObj.feed_format, 'CSV') >= 0) {
                        // always required
                        const csvFile = generateCSVFile(dealerObj.dealer_csv_headings, dealerObj.dealer_csv_single_row_template, dealerObj.feed_name || dealerObj.dealer_name, dealerItemArray);
                        dealerObj.feed_file = csvFile;
                        updateRecord({ record_type: 'customrecord_dealer_stock_feed_mgmt', record_id: dealerObj.internalid, values: { 'custrecord_dealer_lastest_inventory': csvFile.id } });
                        // }

                        if (_.indexOf(dealerObj.feed_format, 'HTML') >= 0) {
                            const htmlFile = generateHTMLTable(dealerObj.dealer_name, dealerObj.dealer_csv_headings, dealerObj.dealer_csv_single_row_template, dealerItemArray);
                            dealerObj.email_body += '<hr>' + htmlFile.contents;
                            updateRecord({ record_type: 'customrecord_dealer_stock_feed_mgmt', record_id: dealerObj.internalid, values: { 'custrecord_dealer_lastest_inventory': htmlFile.id } });
                        }

                        log.debug('dealerObj end', dealerObj);
                        log.debug('current week day', currentWeekday);

                        const emailContext = {};
                        emailContext.author = 2628559;
                        //emailContext.recipients = ['george@lifespanfitness.com.au', 'sam@gflgroup.com.au'];
                        emailContext.recipients = dealerObj.email_recipients;
                        if ((dealerObj.email_cc).length > 0) {
                            emailContext.cc = dealerObj.email_cc;
                        }
                        if ((dealerObj.email_bcc).length > 0) {
                            emailContext.bcc = dealerObj.email_bcc;
                        }
                        emailContext.subject = dealerObj.email_subject;
                        emailContext.body = dealerObj.email_body;
                        if (!_.isEmpty(dealerObj.feed_file)) {
                            emailContext.attachments = [dealerObj.feed_file.file];
                        }
                        log.debug('emailContext', emailContext);
                        log.debug('deploymentId', runtime.getCurrentScript().deploymentId)
                        if (runtime.getCurrentScript().deploymentId !== 'customdeploy1') {
                            sendEmail(emailContext);
                        } else {
                            if (dealerObj.weekdays.indexOf(currentWeekday.toString()) >= 0 && !_.isEmpty(dealerObj.items)) {
                                const currentPeriod = libG.isMorningAfternoonEvening();
                                log.debug('currentPeriod', currentPeriod);
                                if (currentPeriod == 'M') {
                                    sendEmail(emailContext);
                                }
                                if (currentPeriod != 'M' && dealerObj.multi_update) {
                                    sendEmail(emailContext);
                                }
                            }
                        }

                        if (dealerObj.ftp && !_.isEmpty(dealerObj.items) && runtime.envType == 'PRODUCTION') {
                            if (dealerObj.ftp_username && dealerObj.ftp_password && dealerObj.ftp_host) {
                                const ftpHost = formatFTP(dealerObj.ftp_username, dealerObj.ftp_password, dealerObj.ftp_host, dealerObj.ftp_secure);
                                const payload = util.extend(ftpHost, { file_name: dealerObj.feed_file.name, file_body: dealerObj.feed_file.contents });

                                // Encrypt
                                const encrypted = CryptoJS.AES.encrypt(JSON.stringify(payload), 'toolset-gfl.heroku');
                                const ciphertext = encrypted.toString();
                                log.debug('ciphertext', ciphertext);
                                // Decrypt
                                // var bytes  = CryptoJS.AES.decrypt(ciphertext, 'toolset-gfl.heroku');
                                // var originalText = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
                                // log.debug('originalText', originalText);

                                ftpUpload(ciphertext);
                            } else {
                                throw new Error('FTP is enabled for ' + dealerObj.dealer_name + ' but missing FTP login details');
                            }
                        }

                        // can't make GUID work.
                        // var secretKey = crypto.createSecretKey({
                        //     guid: 'f68d7c5fe24a4b859e1764887cba2c1a',
                        //     encoding: encode.Encoding.HEX
                        // })

                        // var cipher = crypto.createCipher({
                        //     algorithm: crypto.EncryptionAlg.AES,
                        //     key: secretKey
                        // });
                        // cipher.update({
                        //     input: 'what1234',
                        //     inputEncoding: encode.Encoding.UTF_8
                        // });
                        // var cipherPayload = cipher.final({
                        //     outputEncoding: encode.Encoding.BASE_64
                        // });
                        // log.debug('cipherPayload', cipherPayload);

                    } else {
                        log.error(dealerObj.dealer_name + stockResp.code.toString(), stockResp.body);
                    }

                } catch (error) {
                    log.error('stock process error', error);
                    respCode = 500
                    // email.send({
                    //     author: 16,
                    //     recipients:['george.y@gflgroup.com.au'],
                    //     subject: `Faild to get stock for ${dealerObj.dealer_name} trying no. ${count}`,
                    //     body: JSON.stringify(dealerObj)
                    // })
                }
                count--
            } while (respCode != 200 && count > 0);
        }

        function updateRecord(data) {
            record.submitFields({
                type: data.record_type,
                id: data.record_id,
                values: data.values,
                enablesourcing: false,
                ignoreMandatoryFields: true
            })
        };

        function ftpUpload(payload, waiting) {
            if (waiting) {
                libG.wait(waiting);
            }
            const req = https.post({
                url: 'https://toolset-gfl.herokuapp.com/ftp?op=upload',
                headers: {
                    'Content-Type': 'text/plain',
                    'X-From': 'suitescript'
                },
                body: payload
            });
            log.debug('req', req);
            if (req.code == 200) {
                const body = JSON.parse(req.body);
                if (body.error) {
                    log.error('ftp uplaod error', body.error);
                    // ftpUpload(payload, 1);
                }
            } else {
                // ftpUpload(payload, 1);
            }
        }

        function formatFTP(username, password, host, secure) {
            const ftp = {};
            ftp.username = username;
            ftp.password = password;
            ftp.secure = secure;
            const hostArr = host.split('/');
            ftp.host = hostArr[0];
            if (hostArr.length > 1) {
                ftp.path = _.join(_.tail(hostArr), '/');
            }

            return ftp;
        }

        function sendEmail(emailContext) {
            log.audit('emailContext', emailContext)
            if ((emailContext.recipients && emailContext.recipients.length) + (emailContext.cc ? emailContext.cc.length : 0) + (emailContext.bcc ? emailContext.bcc.length : 0) > 10) {
                email.sendBulk(emailContext);
            } else if (emailContext.recipients && emailContext.recipients.length > 0) {
                email.send(emailContext);
            }
        }

        function applyQtyStockLevelFormula(quantityFormula, stockLevelFormula, quantity) {
            // log.debug('applyQtyStockLevelFormula', {quantityFormula, stockLevelFormula, quantity})
            let quantityToReturn = quantity;

            if (quantityFormula) {

                let bundary = 0;
                // :60p, >4:60p, :5:75p
                const elArray = quantityFormula.split(':');

                if (elArray[0].indexOf('>') >= 0) {
                    const locationRuleArray = elArray[0].split('>');
                    log.debug('locationRuleArray', locationRuleArray)
                    bundary = _.toInteger(locationRuleArray[1].match(/\d+/)[0]);
                }

                if (quantity > bundary) { //log.debug('quantity > bundary', quantity + ' > ' + bundary);
                    //get quantity formula 
                    for (let i = 1; i < elArray.length; i++) {
                        const currentEl = elArray[i];
                        const allowance = _.toInteger(currentEl.match(/\d+/)[0]);
                        if (_.toUpper(currentEl).indexOf('P') > 0) {
                            quantityToReturn = _.toInteger(quantityToReturn * allowance / 100)
                        } else {
                            quantityToReturn = (quantityToReturn > allowance) ? quantityToReturn - allowance : 0
                        }
                    }
                } else {
                    quantityToReturn = 0;
                }

            } else if (stockLevelFormula) {
                // outofstock:4,lowstock:20
                let outofstock, lowstock, instock;

                const stockLevelArray = convertStringtoArray(stockLevelFormula);
                _.forEach(stockLevelArray, function (stockLevel) {
                    const stockLevelRuleArray = stockLevel.split(':');

                    if (_.trim(stockLevelRuleArray[0]) == 'outofstock') {
                        outofstock = _.toInteger(stockLevelRuleArray[1]);
                    }

                    if (_.trim(stockLevelRuleArray[0]) == 'lowstock') {
                        lowstock = _.toInteger(stockLevelRuleArray[1]);
                    }

                    if (_.trim(stockLevelRuleArray[0]) == 'instock') {
                        instock = _.toInteger(stockLevelRuleArray[1]);
                    }
                });

                // log.debug('sotck', instock + '-' + lowstock + '-' + outofstock);

                if (quantity > outofstock) {

                    //outofstock:4,lowstock:20,instock:21
                    if (lowstock && instock) {

                        if (quantity > lowstock) {
                            quantityToReturn = 'IN STOCK';
                        } else {
                            quantityToReturn = 'LOW STOCK (' + quantity.toString() + ')';
                        }
                    } else if (!lowstock && instock) { //outofstock:4,instock:21
                        if (quantity >= instock) {
                            quantityToReturn = 'IN STOCK';
                        } else {
                            quantityToReturn = 'LOW STOCK (' + quantity.toString() + ')';
                        }
                    } else if (lowstock && !instock) { //outofstock:4,lowstock:20
                        if (quantity > lowstock) {
                            quantityToReturn = 'IN STOCK';
                        } else {
                            quantityToReturn = 'LOW STOCK (' + quantity.toString() + ')';
                        }
                    } else { //outofstock:4
                        quantityToReturn = 'IN STOCK';
                    }

                } else {
                    quantityToReturn = 'OUT OF STOCK';
                }
            }
            return quantityToReturn;
        }

        function generateCSVFile(csvHeading, csvTemplate, fileName, itemArray) {
            let csvString = csvHeading + '\n';

            itemArray.forEach(function (item) {
                // csvString += csvRow.replace('{S}', item.SKU).replace('{D}', item.Description).replace('{Q}', item.Quantity) + '\n';
                let csvRow = csvTemplate;
                _.forIn(item, function (value, key) {
                    csvRow = csvRow.replace('{' + key + '}', value);
                });
                csvString += csvRow + '\n';
            });

            if (!_.endsWith(fileName, '.csv')) {
                fileName += '.csv';
            }

            const fileObj = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: csvString,
                folder: 88847,
                isOnline: true
            });

            const fileId = fileObj.save();

            return {
                id: fileId,
                file: fileObj,
                name: fileName,
                contents: csvString
            };
        }

        function generateHTMLTable(dealerName, csvHeading, csvTemplate, itemArray) {

            const tableStyle = '<style>table thead {font-weight:bold; background:rgb(137,176,19);} ' +
                'table tbody td {border-bottom: 1px solid #000000; padding:5px;} ' +
                'table tbody tr:nth-child(even) {background:#CCC;} ' +
                'table tbody tr:nth-child(odd) {background:#FFF;}</style>';

            let tableHTML = "<table><thead><tr>";

            const tableHeadingArray = convertStringtoArray(csvHeading);
            tableHeadingArray.forEach(function (td) {
                tableHTML += '<td>' + td + '</td>';
            });
            tableHTML += "</tr></thead>";

            let tbodyHTML = "<tbody>";

            for (let i = 0; i < itemArray.length; i++) {
                const item = itemArray[i];
                let singleRowHTML = "<tr>";
                const rowArray = convertStringtoArray(csvTemplate);
                rowArray.forEach(cell => {
                    // singleRowHTML += '<td>' + cell.replace('{S}', item.SKU).replace('{D}', item.Description).replace('{Q}', item.quantity) + '</td>';
                    _.forIn(item, function (value, key) {
                        cell = cell.replace('{' + key + '}', value);
                    });

                    singleRowHTML += '<td>' + cell + '</td>';
                });

                tbodyHTML += singleRowHTML + "</tr>";
            }

            const htmlContent = tableStyle + tableHTML + tbodyHTML + "</tbody></table>";
            const htmlFile = file.create({
                name: dealerName + '_stock.html',
                fileType: file.Type.HTMLDOC,
                contents: htmlContent,
                folder: 88847,
            });
            const htmlFileId = htmlFile.save();
            return {
                id: htmlFileId,
                contents: htmlContent,
            }
        }

        function getCSVHeadingsAndFormat(csvFormat, dealerName) {
            log.debug('csvFormat', csvFormat);
            // var presetKeys = ['SKU', 'Description', 'Quantity']
            const additionalFields = new Array();

            const csvColumnHeadings = new Array();
            const csvSingleRowContent = new Array();

            const csvFormatArray = convertStringtoArray(csvFormat);
            log.debug('csvFormatArray', csvFormatArray);
            csvFormatArray.forEach((el) => {

                const elArray = el.split(':');
                if (elArray.length > 1) {

                    switch (elArray[1].toUpperCase().substring(0, 1)) {
                        case 'S': //SKU
                            csvSingleRowContent.push('{sku}');
                            break;
                        case 'D': //Description
                            csvSingleRowContent.push('{description}');
                            break;
                        case 'Q': //Quantity
                            csvSingleRowContent.push('{quantity}');
                            break;
                        case 'P': //Price
                            csvSingleRowContent.push('{price}');
                            break;
                        case '#': // Netsuite Field Value
                            csvSingleRowContent.push('{' + _.replace(_.toLower(elArray[1]), '#', '') + '}');
                            additionalFields.push(_.replace(_.toLower(elArray[1]), '#', ''));
                            break;
                        case '@': // Static Value
                            csvSingleRowContent.push(_.replace(elArray[1], '@', ''));
                            break;
                        default:
                            csvSingleRowContent.push('');
                    }

                } else if (elArray.length == 1) {
                    csvSingleRowContent.push('{' + _.snakeCase(elArray[0]) + '}');
                } else {
                    throw new Error(`incorrect dealer ${dealerName} csv format`, csvFormat)
                }

                csvColumnHeadings.push(elArray[0]);

            });

            return {
                csv_headings: csvColumnHeadings.join(','),
                csv_single_row: csvSingleRowContent.join(','),
                additional_fields: additionalFields
            }
        }

        function convertStringtoArray(str) {
            if (str.indexOf(',') > 0) {
                return _.compact(_.map(str.split(','), _.trim));
            } else if (str.indexOf(';') > 0) {
                return _.compact(_.map(str.split(';'), _.trim));
            } else {
                return _.compact([str]);
            }
        }

        /**
         * Executes when the reduce entry point is triggered and applies to each group.
         *
         * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
         * @since 2015.1
         */
        function reduce(context) {

        }

        /**
         * Executes when the summarize entry point is triggered and applies to the result set.
         *
         * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
         * @since 2015.1
         */
        function summarize(summary) {
            const mapSum = summary.mapSummary;
            mapSum.errors.iterator().each(function (key, value) {
                log.error('error in map stage ' + key, value);
                return true;
            });

            const reduSum = summary.reduceSummary;
            reduSum.errors.iterator().each(function (key, value) {
                log.error('error in reduce stage ' + key, value);
                return true;
            })
        }

        return {
            getInputData: getInputData,
            map: map,
            // reduce: reduce,
            summarize: summarize
        };

    });
