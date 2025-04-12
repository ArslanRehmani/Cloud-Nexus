'use strict';
/**
 *
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/http', 'N/runtime', 'N/record', 'N/search', 'N/task', 'N/format', 'N/error', './Entity', './Common', './CubiicConnecter', './AvtLicenseChecker', './lib/AVT_LoggerLib2-1-0-2'],
    /**
     *
     * @param {http} nsHttp
     * @param {runtime} nsRuntime
     * @param {record} nsRecord
     * @param {search} nsSearch
     * @param {task} nsTask
     * @param {format} nsFormat
     * @param {error} nsError
     * @param entity
     * @param common
     * @param cConnecter
     * @param avtLicense
     * @param logger
     * @return {{onRequest: onRequest}}
     */
    function (nsHttp, nsRuntime, nsRecord, nsSearch, nsTask, nsFormat, nsError, entity, common, cConnecter, avtLicense, logger) {
        var _LOG_MODULE_NAME = '/CubiicIntegratin/DataSenderIf.';

        var _MAX_CONNOTE_ITEM_NUM = 4;

        var _CONFIG_DATA = null;

        var _IFS_FREIGHT_TYPE_LSIT = {}; //{id: Freight Type Name, ...}


        var mu_user
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @module Manage Subscription
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            var logFunctionName = _LOG_MODULE_NAME + 'onRequest';
            logger.logStartFunctionD(logFunctionName, {
                context: context
            }, false, '');

            var error;

            try {
                if (context.request.method === nsHttp.Method.GET) {
                    // handle GET method
                    _handleGetRequest(context);

                } else if (context.request.method === nsHttp.Method.POST) {
                    // handle POST method
                    _handlePostRequest(context);

                } else {
                    error = nsError.create({
                        name: 'INTERNAL_ERROR',
                        message: 'Unexpected http method: ' + context.request.method,
                        notifyOff: true
                    });
                    throw error;
                }
            } catch (e) {
                logger.logErrorObjectE(logFunctionName, e, 'Unexpected Error');
            }
        }


        /**
         * @private
         * @param {{request: ServerRequest, response: ServerResponse}} context
         */
        function _handleGetRequest(context) {
            var logFunctionName = _LOG_MODULE_NAME + '_handleGetRequest';
            logger.logStartFunctionD(logFunctionName, {
                context: context
            }, false, '');

            var result = '';

            if (avtLicense.hasValidAvtLicense()) {



                var ifId = context.request.parameters[entity.SCRIPTS.SENDER_IF.URL_PARAMS.IF_ID] || '';

                mu_user = context.request.parameters['userid']
                log.error('userid', mu_user)

                logger.logA(logFunctionName, 'ifId=' + ifId);

                if (ifId) {

                    var processResult = _processToSendData(ifId);
                    result = processResult.logMessage;

                } else {
                    result = 'Skip process. Item Fulfillment ID is empty.';
                }
            } else {
                result = 'Your Netsuite account does not have valid AVT Subscription license. Please contact AVT.';
            }

            logger.logA(logFunctionName, 'result = ' + result);
            context.response.write({
                output: result
            });
        }


        /**
         * @private
         * @param {{request: ServerRequest, response: ServerResponse}} context
         */
        function _handlePostRequest(context) {
            var logFunctionName = _LOG_MODULE_NAME + '_handlePostRequest';
            logger.logStartFunctionD(logFunctionName, {
                context: context
            }, false, '');

            var resultObj = {
                succeed: false,
                errorMessage: ''
            };

            if (avtLicense.hasValidAvtLicense()) {

                var ifId = context.request.parameters[entity.SCRIPTS.SENDER_IF.URL_PARAMS.IF_ID] || '';
                logger.logA(logFunctionName, 'ifId = ' + ifId);

                if (ifId) {
                    var processResult = _processToSendData(ifId);
                    resultObj.succeed = processResult.succeed;
                    if (!resultObj.succeed) {
                        resultObj.errorMessage = processResult.logMessage;
                    }
                } else {
                    resultObj.errorMessage = 'Skip process. Item Fulfillment ID is empty.';
                }
            } else {
                resultObj.errorMessage = 'Your Netsuite account does not have valid AVT Subscription license. Please contact AVT.';
            }

            logger.logA(logFunctionName, 'resultObj = ' + JSON.stringify(resultObj));
            context.response.write({
                output: JSON.stringify(resultObj)
            });
        }

        /**
         * @private
         * @param {string} ifId
         * @return {object}
         */
        function _processToSendData(ifId) {
            var logFunctionName = _LOG_MODULE_NAME + '_processToSendData';
            logger.logStartFunctionD(logFunctionName, {
                ifId: ifId
            }, false, '');

            var resultObj = {
                succeed: false,
                logMessage: ''
            };

            _CONFIG_DATA = common.getConfigData();
            if (!_CONFIG_DATA) {
                resultObj.logMessage = 'Skip process. Failed to load config data.';
            }

            _IFS_FREIGHT_TYPE_LSIT = common.getIfsFreightTypeList();

            if (ifId && !resultObj.logMessage) {

                var generateDateResult = _getPostDataForIf(ifId);
                if (generateDateResult.succeed) {

                    var validateResult = _validatePostData(generateDateResult.postData);
                    if (validateResult.succeed) {

                        var sendResultObj = cConnecter.postJsonToCubiic(generateDateResult.postData);

                        log.debug('sendResultObj', sendResultObj)
                        var responseData = sendResultObj.responseData;
                        var responseBody = sendResultObj.bodyData;
                        logger.logA(logFunctionName, 'response Data = ' + JSON.stringify(sendResultObj.responseData));

                        if (sendResultObj.succeed) {
                            resultObj.succeed = true;
                            resultObj.logMessage += 'Succeed to send data to Cubiic. ';
                        } else {
                            resultObj.logMessage += 'Failed to send data to Cubiic. ' + sendResultObj.errorMessage;
                        }
                    } else {
                        resultObj.logMessage += 'Failed to generate post Data from IF. ' + validateResult.errorMessage;
                    }

                    //Store process result to IF
                    try {
                        var submitValues = {};
                        submitValues[entity.FIELDS.TRANS_BODY_IMPORT_STATUS] = (resultObj.succeed) ? entity.LISTS.STATUS.OPTIONS.SUCCESS : entity.LISTS.STATUS.OPTIONS.FAILURE;
                        submitValues[entity.FIELDS.TRANS_BODY_IMPORT_DATETIME] = new Date();
                        submitValues[entity.FIELDS.TRANS_BODY_IMPORT_LOG] = JSON.stringify(resultObj);
                        submitValues[entity.FIELDS.TRANS_BODY_REQUEST_DATA] = JSON.stringify(generateDateResult.postData);
                        submitValues[entity.FIELDS.TRANS_BODY_RESPONSE_DATA] = JSON.stringify(responseData);
                        if (resultObj.succeed && responseBody && responseBody.hasOwnProperty('consignmentNo')) {
                            submitValues[entity.FIELDS.TRANS_BODY_IFS_CONNOTE_NUMBER] = responseBody['consignmentNo'];

                            if (_CONFIG_DATA.hasOwnProperty(entity.RECORDS.CONFIG.FIELDS.UPDATE_IF_STATUS) && _CONFIG_DATA[entity.RECORDS.CONFIG.FIELDS.UPDATE_IF_STATUS]) {
                                submitValues['shipstatus'] = entity.LISTS.IF_STATUS._SHIPPED;
                            }
                        }

                        nsRecord.submitFields({
                            type: 'itemfulfillment',
                            id: Number(ifId),
                            values: submitValues,
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    } catch (e) {
                        resultObj.logMessage += 'Failed to save process Result. Unexpected error. ' + e + '. ';
                        logger.logErrorObjectE(logFunctionName, e, 'Unexpected error to save process result');
                    }


                    //Store process result to IFS Packages records
                    var useIfsPackagesRecordData = (_CONFIG_DATA.hasOwnProperty(entity.RECORDS.CONFIG.FIELDS.USE_IFS_PACKAGE_RECORD) && _CONFIG_DATA[entity.RECORDS.CONFIG.FIELDS.USE_IFS_PACKAGE_RECORD]);
                    logger.logA(logFunctionName, 'useIfsPackagesRecordData = ' + useIfsPackagesRecordData);
                    if (useIfsPackagesRecordData && generateDateResult.hasOwnProperty('ifsPackageIdList') && generateDateResult['ifsPackageIdList'] && generateDateResult['ifsPackageIdList'].length > 0) {
                        if (resultObj.succeed && responseBody && responseBody.hasOwnProperty('consignmentNo')) {
                            var submitValues = {};
                            submitValues[entity.RECORDS.IFS_PACKAGES.FIELDS.CONNOTE_NUMBER] = responseBody['consignmentNo'];

                            for (var x = 0; x < generateDateResult['ifsPackageIdList'].length; x++) {
                                try {
                                    nsRecord.submitFields({
                                        type: entity.RECORDS.IFS_PACKAGES.ID,
                                        id: Number(generateDateResult['ifsPackageIdList'][x]),
                                        values: submitValues,
                                        options: {
                                            ignoreMandatoryFields: true
                                        }
                                    });
                                } catch (e) {
                                    resultObj.logMessage += 'Failed to save process Result to IFS Packages records. Unexpected error. ' + e + '. ';
                                    logger.logErrorObjectE(logFunctionName, e, 'Unexpected error to save process result to IFS Packages records');
                                }
                            }
                        }
                    }

                } else {
                    resultObj.logMessage = 'Failed to generate Post data from Item Fulfillment. ' + generateDateResult.errorMessage;
                }
            } else {
                resultObj.logMessage = 'Skip process. Item Fulfillment ID is empty.';
            }

            logger.logA(logFunctionName, 'resultObj = ' + JSON.stringify(resultObj));
            return resultObj;
        }


        /**
         * @private
         * @param {string} ifId
         * @return {object|null}
         */
        function _getPostDataForIf(ifId) {
            var logFunctionName = _LOG_MODULE_NAME + '_getPostDataForIf';
            logger.logStartFunctionD(logFunctionName, {
                ifId: ifId
            }, false, '');

            var resultObj = {
                succeed: false,
                errorMessage: '',
                postData: null,
                ifsPackageIdList: []
            };

            if (ifId) {

                try {
                    var ifRecord = nsRecord.load({
                        type: 'itemfulfillment',
                        id: ifId
                    });



                    resultObj.postData = new ConsignmentData();

                    resultObj.postData.saveAsDraft = (_CONFIG_DATA && _CONFIG_DATA.hasOwnProperty(entity.RECORDS.CONFIG.FIELDS.CREATE_AS_DRAFT) && _CONFIG_DATA[entity.RECORDS.CONFIG.FIELDS.CREATE_AS_DRAFT]);

                    var createdFromId = ifRecord.getValue({
                        fieldId: 'createdfrom'
                    });
                    //Update
                    var dangerousGoods = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_DANGEROUS_GOODS
                    });
                    if(dangerousGoods == 'true' || dangerousGoods == true){
                        resultObj.postData.dangerousGoods = 'true';
                    }
                    //end Update
                    if (createdFromId) {
                        try {
                            var lookupValues = nsSearch.lookupFields({
                                type: nsSearch.Type.TRANSACTION,
                                id: Number(createdFromId),
                                columns: ['tranid']
                            });
                            if (lookupValues && lookupValues.hasOwnProperty('tranid') && lookupValues['tranid']) {
                                resultObj.postData.Reference = lookupValues['tranid'];
                            }
                        } catch (e) {
                            logger.logErrorObjectE(logFunctionName, e, 'Failed to get Tran ID from Created From');
                        }
                    }

                    var carrierId = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_IFS_CARRIER
                    });
                    if (carrierId) {
                        try {
                            var lookupValues = nsSearch.lookupFields({
                                type: entity.RECORDS.IFS_CARRIERS.ID,
                                id: Number(carrierId),
                                columns: [entity.RECORDS.IFS_CARRIERS.FIELDS.CODE]
                            });
                            if (lookupValues && lookupValues.hasOwnProperty(entity.RECORDS.IFS_CARRIERS.FIELDS.CODE) &&
                                lookupValues[entity.RECORDS.IFS_CARRIERS.FIELDS.CODE] && lookupValues[entity.RECORDS.IFS_CARRIERS.FIELDS.CODE] !== null
                            ) {
                                resultObj.postData.carrierCode = lookupValues[entity.RECORDS.IFS_CARRIERS.FIELDS.CODE];
                            }
                        } catch (e) {
                            resultObj.errorMessage += 'Unexpected error to get Carrier Code';
                            logger.logErrorObjectE(logFunctionName, e, 'Get Carrier Code');
                        }
                    }

                    var serviceId = null;
                    if (resultObj.postData.carrierCode) {
                        serviceId = ifRecord.getValue({
                            fieldId: entity.FIELDS.TRANS_BODY_IFS_SERVICE
                        });
                        if (serviceId) {
                            try {
                                var lookupValues = nsSearch.lookupFields({
                                    type: entity.RECORDS.IFS_SERVICES.ID,
                                    id: Number(serviceId),
                                    columns: [entity.RECORDS.IFS_SERVICES.FIELDS.DATA]
                                });
                                if (lookupValues && lookupValues.hasOwnProperty(entity.RECORDS.IFS_SERVICES.FIELDS.DATA) &&
                                    lookupValues[entity.RECORDS.IFS_SERVICES.FIELDS.DATA] && lookupValues[entity.RECORDS.IFS_SERVICES.FIELDS.DATA] !== null
                                ) {
                                    resultObj.postData.serviceCode = lookupValues[entity.RECORDS.IFS_SERVICES.FIELDS.DATA];
                                }
                            } catch (e) {
                                resultObj.errorMessage += 'Unexpected error to get Service Code';
                                logger.logErrorObjectE(logFunctionName, e, 'Get Service Code');
                            }
                        }
                    }
                    logger.logD(logFunctionName, 'carrierId=' + carrierId + ' serviceId=' + serviceId);

                    //Label Printer
                    try {
                        var currentEmployeeId = nsRuntime.getCurrentUser().id;
                        if (currentEmployeeId == -4) {
                            currentEmployeeId = mu_user
                        }
                        log.error('currentEmployeeId', currentEmployeeId)

                        var ifsTerminalId = common.getIfsTerminalIdForEmployee(currentEmployeeId);

                        if (ifsTerminalId) {
                            resultObj.postData.labelPrinter = ifsTerminalId;
                        }
                    } catch (e) {
                        logger.logErrorObjectE(logFunctionName, e, 'Get Labe printer for login user');
                    }

                    //get Wherehouse Code from Location or custom record
                    //get Sender Address
                    var senderLocationId = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_SENDER_LOCATION
                    });
                    if (senderLocationId) {
                        try {
                            var lookupValues = nsSearch.lookupFields({
                                type: nsSearch.Type.LOCATION,
                                id: Number(senderLocationId),
                                columns: [entity.FIELDS.OTHRE_CUBIIC_WAREHOUSE_CODE]
                            });
                            if (lookupValues) {
                                if (lookupValues.hasOwnProperty(entity.FIELDS.OTHRE_CUBIIC_WAREHOUSE_CODE) &&
                                    lookupValues[entity.FIELDS.OTHRE_CUBIIC_WAREHOUSE_CODE] !== null &&
                                    lookupValues[entity.FIELDS.OTHRE_CUBIIC_WAREHOUSE_CODE] !== ''
                                ) {
                                    resultObj.postData.WarehouseCode = lookupValues[entity.FIELDS.OTHRE_CUBIIC_WAREHOUSE_CODE];
                                }
                            }
                        } catch (e) {
                            resultObj.errorMessage += 'Unexpected error to get Warehouse Code';
                            logger.logErrorObjectE(logFunctionName, e, 'Get Warehouse code from Location');
                        }
                    } else {
                        resultObj.postData.WarehouseCode = '3PT';
                    }

                    var senderId = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_IFS_SENDER
                    });
                    if (senderId) {
                        try {
                            var senderRecord = nsRecord.load({
                                type: entity.RECORDS.IFS_SENDER.ID,
                                id: senderId
                            });
                            resultObj.postData.SenderAddress.CompanyName = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.NAME
                            });
                            resultObj.postData.SenderAddress.Address1 = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.ADDRESS1
                            });
                            resultObj.postData.SenderAddress.Address2 = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.ADDRESS2
                            });
                            resultObj.postData.SenderAddress.Suburb = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.CITY
                            });
                            resultObj.postData.SenderAddress.State = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.STATE
                            });
                            resultObj.postData.SenderAddress.PostCode = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.POSTCODE
                            });
                            resultObj.postData.SenderAddress.Country = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.COUNTRY
                            });
                            resultObj.postData.SenderAddress.Contact = senderRecord.getText({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.CONTACT
                            });
                            resultObj.postData.SenderAddress.Phone = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.PHONE
                            });
                            resultObj.postData.SenderAddress.Email = senderRecord.getValue({
                                fieldId: entity.RECORDS.IFS_SENDER.FIELDS.EMAIL
                            });
                        } catch (e) {
                            resultObj.errorMessage += 'Unexpected error to get Sender address';
                            logger.logErrorObjectE(logFunctionName, e, 'Get Sender address');
                        }
                    }

                    //get Receiver Address
                    var shipAddrId = ifRecord.getValue({
                        fieldId: 'shippingaddress'
                    });
                    logger.logD(logFunctionName, 'shipAddrId=' + shipAddrId);

                    if (shipAddrId) {
                        var addressData = common.getAddressData(shipAddrId);
                        if (addressData !== null) {
                            if (addressData.hasOwnProperty('addressee')) {
                                resultObj.postData.ReceiverAddress.CompanyName = addressData['addressee'];
                            }
                            if (addressData.hasOwnProperty('address1')) {
                                resultObj.postData.ReceiverAddress.Address1 = addressData['address1'];
                            }
                            if (addressData.hasOwnProperty('address2')) {
                                resultObj.postData.ReceiverAddress.Address2 = addressData['address2'];
                            }
                            if (addressData.hasOwnProperty('address3') && addressData['address3'] !== '') {
                                resultObj.postData.ReceiverAddress.Address2 += ' ' + addressData['address3'];
                            }
                            if (addressData.hasOwnProperty('city')) {
                                resultObj.postData.ReceiverAddress.Suburb = addressData['city'];
                            }
                            if (addressData.hasOwnProperty('state')) {
                                resultObj.postData.ReceiverAddress.State = addressData['state'];
                            }
                            if (addressData.hasOwnProperty('zip')) {
                                resultObj.postData.ReceiverAddress.PostCode = addressData['zip'];
                            }
                            if (addressData.hasOwnProperty('country')) {
                                resultObj.postData.ReceiverAddress.Country = addressData['country'];
                            }
                        }
                    }else{
                        //Retrieve shipping Address of customer here AJF NOVEMBER 30, 2022
                        var entityId = ifRecord.getValue({
                            fieldId: 'entity'
                        });

                        var addressData = searchCustomerAddress(entityId);
                        log.emergency('addressData', addressData)
                        if (addressData){
                            if (addressData.hasOwnProperty('addressee')) {
                                resultObj.postData.ReceiverAddress.CompanyName = addressData['addressee'];
                            }
                            if (addressData.hasOwnProperty('address1')) {
                                resultObj.postData.ReceiverAddress.Address1 = addressData['address1'];
                            }
                            if (addressData.hasOwnProperty('address2')) {
                                resultObj.postData.ReceiverAddress.Address2 = addressData['address2'];
                            }
                            if (addressData.hasOwnProperty('address3') && addressData['address3'] !== '') {
                                resultObj.postData.ReceiverAddress.Address2 += ' ' + addressData['address3'];
                            }
                            if (addressData.hasOwnProperty('city')) {
                                resultObj.postData.ReceiverAddress.Suburb = addressData['city'];
                            }
                            if (addressData.hasOwnProperty('state')) {
                                resultObj.postData.ReceiverAddress.State = addressData['state'];
                            }
                            if (addressData.hasOwnProperty('zip')) {
                                resultObj.postData.ReceiverAddress.PostCode = addressData['zip'];
                            }
                            if (addressData.hasOwnProperty('country')) {
                                resultObj.postData.ReceiverAddress.Country = addressData['country'];
                            }
                        }                        
                    }

                    var entityId = ifRecord.getValue({
                        fieldId: 'entity'
                    });
                    logger.logD(logFunctionName, 'entityId=' + entityId);

                    var soDetails = searchSalesOrder(ifId)

                    var phone_num = soDetails.phone

					log.error('phone_num before processing',phone_num)
                    if ((phone_num.trim().length > 1) && (phone_num != null || phone_num != '')) {
                        if (phone_num[0] == '+') {
                            phone_num = replaceAll(phone_num, '+61', '0')
                        } else if (phone_num[0] == '6' && phone_num[1] == '1') {
                            phone_num = phone_num.replace('61', '0')
                        }
                        phone_num = replaceAll(phone_num, '(', '')
                        phone_num = replaceAll(phone_num, ')', '')
                        phone_num = replaceAll(phone_num, ' ', '')
                        phone_num = replaceAll(phone_num, '-', '')


                        if (phone_num.length == 9 && phone_num[0] != '0') {
                            phone_num = '0' + phone_num
                        }
                    } else {                        
                        
                        /*AJF Update November 30, 2022
                        Comented out phone_num = '';
                        */
                        //phone_num = '';
                        phone_num = soDetails.custPhone
                    }

					log.error('phone_num after proc ', phone_num)
                    resultObj.postData.ReceiverAddress.Contact += ' ' + soDetails.contact
                    resultObj.postData.ReceiverAddress.Phone += ' ' + phone_num
                    resultObj.postData.ReceiverAddress.Email += ' ' + soDetails.email



                    var confEmail = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_IFS_EMAIL_CONFIRMATION
                    });
                    if (confEmail) {
                        var emailList = confEmail.split(',');
                        if (emailList && emailList.length > 0) {
                            for (var i = 0; i < emailList.length; i++) {
                                resultObj.postData.EmailTracking.push(emailList[i].trim());
                            }
                        }
                    }

                    var inst1 = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_IFS_SPECIAL_INSTRUCTIONS1
                    });
                    if (inst1) {
                        resultObj.postData.SpecialInstructions += inst1;
                    }
                    var inst2 = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_IFS_SPECIAL_INSTRUCTIONS2
                    });
                    if (inst2) {
                        resultObj.postData.SpecialInstructions += ' ' + inst2;
                    }
                    var inst3 = ifRecord.getValue({
                        fieldId: entity.FIELDS.TRANS_BODY_IFS_SPECIAL_INSTRUCTIONS3
                    });
                    if (inst3) {
                        resultObj.postData.SpecialInstructions += ' ' + inst3;
                    }

                    if (ifRecord.getValue({
                            fieldId: entity.FIELDS.TRANS_BODY_IS_AUTH_TO_LEAVE
                        })) {
                        resultObj.postData.isATL = true;
                    }

                    //Updated by AJF 14/08/2022 Add residentialPickup mapping
                    if (ifRecord.getValue({
                            fieldId: 'custbody_ajf_cubiic_pickup_delivery'
                    })){
                        resultObj.postData.isResidentialPickup = true;
                    }   

                    var useIfsPackagesRecordData = (_CONFIG_DATA.hasOwnProperty(entity.RECORDS.CONFIG.FIELDS.USE_IFS_PACKAGE_RECORD) && _CONFIG_DATA[entity.RECORDS.CONFIG.FIELDS.USE_IFS_PACKAGE_RECORD]);
                    logger.logA(logFunctionName, 'useIfsPackagesRecordData = ' + useIfsPackagesRecordData);

                    //add Connote goods
                    if (!useIfsPackagesRecordData) {
                        //get from Body fields
                        for (var index = 1; index <= _MAX_CONNOTE_ITEM_NUM; index++) {
                            var fieldIdSuffix = '';
                            if (index >= 2) {
                                fieldIdSuffix = '_' + index;
                            }

                            var fieldId = null;

                            fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_TOTAL_PACKAGES + fieldIdSuffix;
                            var qty = ifRecord.getValue({
                                fieldId: fieldId.toString()
                            });

                            fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_FREIGHT_TYPE + fieldIdSuffix;

                            var freightTypeId = ifRecord.getValue({
                                fieldId: fieldId.toString()
                            });
                            var freightTypeName = '';
                            if (freightTypeId && _IFS_FREIGHT_TYPE_LSIT && _IFS_FREIGHT_TYPE_LSIT.hasOwnProperty(freightTypeId)) {
                                freightTypeName = _IFS_FREIGHT_TYPE_LSIT[freightTypeId];
                            }

                            if (Number(qty) > 0 && cConnecter.isValidFreightTypeForCubiic(freightTypeName)) {

                                var oneGoodObj = new ConnoteGoodsData();
                                oneGoodObj.Qty = Number(qty);
                                oneGoodObj.UnitOfMeasureName = freightTypeName.toUpperCase();

                                fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_ITEM_DESCRIPTION + fieldIdSuffix;
                                var reference = ifRecord.getValue({
                                    fieldId: fieldId.toString()
                                });
                                if (reference) {
                                    oneGoodObj.ItemReference = reference;
                                }

                                fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_TOTAL_WEIGHT + fieldIdSuffix;
                                var weight = ifRecord.getValue({
                                    fieldId: fieldId.toString()
                                });
                                if (weight) {
                                    oneGoodObj.Weight = weight;
                                }

                                fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_TOTAL_LENGTH + fieldIdSuffix;
                                var length = ifRecord.getValue({
                                    fieldId: fieldId.toString()
                                });
                                if (length) {
                                    oneGoodObj.Length = length;
                                }

                                fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_TOTAL_WIDTH + fieldIdSuffix;
                                var width = ifRecord.getValue({
                                    fieldId: fieldId.toString()
                                });
                                if (width) {
                                    oneGoodObj.Width = width;
                                }

                                fieldId = entity.FIELDS.TRANS_BODY_IFS_PACKAGE_TOTAL_HEIGHT + fieldIdSuffix;
                                var height = ifRecord.getValue({
                                    fieldId: fieldId.toString()
                                });
                                if (height) {
                                    oneGoodObj.Height = height;
                                }

                                resultObj.postData.ConnoteGoods.push(oneGoodObj);
                            }
                        }

                    } else {

                        var ifsPackageDataList = common.getIfsPackagesData(ifId);

                        //add Connote goods from IFS Package Record (All lines' Carrier and Service have to mach Body field values)
                        for (var i = 0; i < ifsPackageDataList.length; i++) {

                            if (ifsPackageDataList[i].hasOwnProperty('internalid')) {
                                resultObj.ifsPackageIdList.push(ifsPackageDataList[i]['internalid']);
                            }

                            var qtyPackage = null;
                            if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_PACKAGES)) {
                                qtyPackage = Number(ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_PACKAGES]);
                            }

                            var freightTypeId = null;
                            if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.FREIGHT_TYPE)) {
                                freightTypeId = ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.FREIGHT_TYPE];
                            }

                            var freightTypeName = null;
                            if (freightTypeId && _IFS_FREIGHT_TYPE_LSIT && _IFS_FREIGHT_TYPE_LSIT.hasOwnProperty(freightTypeId)) {
                                freightTypeName = _IFS_FREIGHT_TYPE_LSIT[freightTypeId];
                            }

                            if (qtyPackage && Number(qtyPackage) > 0 && cConnecter.isValidFreightTypeForCubiic(freightTypeName)) {

                                if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_CARRIER) &&
                                    ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_CARRIER] == carrierId &&
                                    ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_SERVICE) &&
                                    ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_SERVICE] == serviceId
                                ) {
                                    var oneGoodObj = new ConnoteGoodsData();
                                    oneGoodObj.Qty = Number(qtyPackage);
                                    oneGoodObj.UnitOfMeasureName = freightTypeName.toUpperCase();

                                    if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.ITEM_DESCRIPTION) && ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.ITEM_DESCRIPTION]) {
                                        oneGoodObj.ItemReference = ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.ITEM_DESCRIPTION];
                                    }

                                    if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_WEIGHT) && ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_WEIGHT]) {
                                        oneGoodObj.Weight = ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_WEIGHT];
                                    }

                                    if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_LENGTH) && ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_LENGTH]) {
                                        oneGoodObj.Length = ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_LENGTH];
                                    }

                                    if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_WIDTH) && ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_WIDTH]) {
                                        oneGoodObj.Width = ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_WIDTH];
                                    }

                                    if (ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_HEIGHT) && ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_HEIGHT]) {
                                        oneGoodObj.Height = ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.TOTAL_HEIGHT];
                                    }

                                    resultObj.postData.ConnoteGoods.push(oneGoodObj);

                                } else {
                                    if (!ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_CARRIER) ||
                                        ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_CARRIER] != carrierId
                                    ) {
                                        resultObj.errorMessage += 'Invalid Ship Carrier in IFS Packages. All Ship Carriers in IFS Packages have to be the same as the "Carrier Name" field. ';
                                    }
                                    if (!ifsPackageDataList[i].hasOwnProperty(entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_SERVICE) ||
                                        ifsPackageDataList[i][entity.RECORDS.IFS_PACKAGES.FIELDS.SHIP_SERVICE] != serviceId
                                    ) {
                                        resultObj.errorMessage += 'Invalid Ship Service in IFS Packages. All Ship Services in IFS Packages have to be the same as the "Service" field. ';
                                    }

                                    if (resultObj.errorMessage) {
                                        break;
                                    }
                                }
                            }
                        }
                    }

                } catch (e) {
                    resultObj.errorMessage += 'Unexpected error to generate JSON data from IF. ' + e + '. ';
                    resultObj.postData = null;
                    logger.logErrorObjectE(logFunctionName, e);
                }
            } else {
                resultObj.errorMessage += 'Item Fulfillment ID is empty.';
                logger.logA(logFunctionName, 'Item Fulfillment ID is empty');
            }

            if (resultObj.errorMessage == '') {
                resultObj.succeed = true;
            }

            logger.logA(logFunctionName, 'resultObj = ' + JSON.stringify(resultObj));
            return resultObj;
        }


        /**
         * @private
         * @param {object} 
         * @return {object}
         */
        function _validatePostData(postData) {

            log.error('postData', postData)
            var logFunctionName = _LOG_MODULE_NAME + '_validatePostData';
            logger.logStartFunctionD(logFunctionName, {
                postData: postData
            }, false, '');

            logger.logD(logFunctionName, 'postData = ' + JSON.stringify(postData));

            var resultObj = {
                succeed: false,
                errorMessage: ''
            };

            //Validation
            if (postData) {
                try {
                    if (!postData.WarehouseCode) {

                        resultObj.errorMessage += 'Warehouse Code is empty. ';

                    }
                    if (postData.WarehouseCode === '3PT') {
                        if (!postData.hasOwnProperty('SenderAddress')) {
                            resultObj.errorMessage += 'SenderAddress is required for Warehouse: Third party. ';
                        } else {
                            if (!postData.SenderAddress.hasOwnProperty('CompanyName') || !postData.SenderAddress.CompanyName) {
                                resultObj.errorMessage += 'Company Name for Sender address is empty. ';
                            }
                            if (!postData.SenderAddress.hasOwnProperty('Address1') || !postData.SenderAddress.Address1) {
                                resultObj.errorMessage += 'Address1 for Sender address is empty. ';
                            }
                            if (!postData.SenderAddress.hasOwnProperty('Suburb') || !postData.SenderAddress.Suburb) {
                                resultObj.errorMessage += 'Suburb for Sender address is empty. ';
                            }
                            if (!postData.SenderAddress.hasOwnProperty('State') || !postData.SenderAddress.State) {
                                resultObj.errorMessage += 'State for Sender address is empty. ';
                            }
                            if (!postData.SenderAddress.hasOwnProperty('PostCode') || !postData.SenderAddress.PostCode) {
                                resultObj.errorMessage += 'PostCode for Sender address is empty. ';
                            }
                        }
                    }

                    if (!postData.hasOwnProperty('ReceiverAddress')) {
                        resultObj.errorMessage += 'ReceiverAddress is required. ';
                    } else {
                        if (!postData.ReceiverAddress.hasOwnProperty('CompanyName') || !postData.ReceiverAddress.CompanyName) {
                            resultObj.errorMessage += 'Company Name for Receiver address is empty. ';
                        }
                        if (!postData.ReceiverAddress.hasOwnProperty('Address1') || !postData.ReceiverAddress.Address1) {
                            resultObj.errorMessage += 'Address1 for Receiver address is empty. ';
                        }
                        if (!postData.ReceiverAddress.hasOwnProperty('Suburb') || !postData.ReceiverAddress.Suburb) {
                            resultObj.errorMessage += 'Suburb for Receiver address is empty. ';
                        }
                        if (!postData.ReceiverAddress.hasOwnProperty('State') || !postData.ReceiverAddress.State) {
                            resultObj.errorMessage += 'State for Receiver address is empty. ';
                        }
                        if (!postData.ReceiverAddress.hasOwnProperty('PostCode') || !postData.ReceiverAddress.PostCode) {
                            resultObj.errorMessage += 'PostCode for Receiver address is empty. ';
                        }
                    }

                    if (postData.ConnoteGoods.length > 0) {
                        for (var i = 0; i < postData.ConnoteGoods.length; i++) {
                            if (!postData.ConnoteGoods[i].Qty) {
                                resultObj.errorMessage += 'Qty for Connote Item (index' + i + ') is empty or 0. ';
                            }
                            if (postData.ConnoteGoods[i].UnitOfMeasureName) {
                                if (postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'CARTON' &&
                                    postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'CRATE' &&
                                    postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'HANGING BAG' &&
                                    postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'LENGTH' &&
                                    postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'PALLET' &&
                                    postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'SATCHEL' &&
                                    postData.ConnoteGoods[i].UnitOfMeasureName.toUpperCase() !== 'SKID'
                                ) {
                                    resultObj.errorMessage += 'Unit of Measure Name for Connote Item (index' + i + ') is invalid. ';
                                }
                            } else {
                                resultObj.errorMessage += 'Unit of Measure Name for Connote Item (index' + i + ') is empty. ';
                            }
                        }
                    } else {
                        resultObj.errorMessage += 'Connote Items are empty. ';
                    }
                } catch (e) {
                    resultObj.errorMessage += 'Unexpected Error. ' + e + '. ';
                    logger.logErrorObjectE(logFunctionName, e, 'Unexpected Error');
                }
            } else {
                resultObj.errorMessage = 'Empty data.';
            }

            if (resultObj.errorMessage == '') {
                resultObj.succeed = true;
            }

            logger.logA(logFunctionName, 'resultObj = ' + JSON.stringify(resultObj));
            return resultObj;
        }


        function ConsignmentData() {
            this.CustomerCode = 'GFLGROUP';
            this.WarehouseCode = '';
            this.Reference = '';

            /** @type AddressData */
            this.SenderAddress = new AddressData();

            /** @type AddressData */
            this.ReceiverAddress = new AddressData();

            /** @type string[] */
            this.EmailTracking = [];

            /** @type ConnoteGoodsData[] */
            this.ConnoteGoods = [];

            this.SpecialInstructions = '';

            this.saveAsDraft = true;
            this.carrierCode = ''; // Cubiic Carrier Identification Code
            this.serviceCode = ''; // Cubiic Service Identification Code
            this.labelPrinter = ''; // Label printer name
            this.isATL = false; //Autority to leave package without customer's sign
        }

        function AddressData() {
            this.CompanyName = '';
            this.Address1 = '';
            this.Address2 = '';
            this.Suburb = '';
            this.State = '';
            this.Country = '';
            this.PostCode = '';
            this.Contact = '';
            this.Phone = '';
            this.Email = '';
        }

        function ConnoteGoodsData() {
            this.ItemReference = '';
            this.Qty = 0;
            this.Weight = 0;
            this.Length = 0;
            this.Width = 0;
            this.Height = 0;
            this.UnitOfMeasureName = '';
        }
            /*AJF Update November 30, 2022
                Add customerSearchColPhone and so_details.custPhone
            */
        function searchSalesOrder(ifId) {
            var salesorderSearchColAddressee = nsSearch.createColumn({
                name: 'addressee',
                join: 'shippingAddress'
            });
            
            var salesorderSearchColPhone = nsSearch.createColumn({
                name: 'phone',
                join: 'shippingAddress'
            });
            var salesorderSearchColEmailConfirmation = nsSearch.createColumn({
                name: 'custbody_avt_ifs_email_confirmation'
            });

            
            var customerSearchColPhone = nsSearch.createColumn({ 
                name: 'phone', 
                join: 'customer' 
            });

            var salesorderSearch = nsSearch.create({
                type: 'itemfulfillment',
                filters: [
                    ['type', 'anyof', 'ItemShip'],
                    'AND',
                    ['internalid', 'anyof', ifId],
                    'AND',
                    ['mainline', 'is', 'T'],
                ],
                columns: [
                    salesorderSearchColAddressee,
                    salesorderSearchColPhone,
                    salesorderSearchColEmailConfirmation,
                    customerSearchColPhone
                ],
            });
            // Note: Search.run() is limited to 4,000 results
            // salesorderSearch.run().each((result: search.Result): boolean => {
            //   return true;
            // });

            var so_details = {
                contact: '',
                phone: '',
                email: '',
                custPhone: ''
            }
            salesorderSearch.run().each(function (result) {

                so_details.contact = result.getValue(salesorderSearchColAddressee).slice(0, 31);
                so_details.phone = result.getValue(salesorderSearchColPhone);
                so_details.email = result.getValue(salesorderSearchColEmailConfirmation);
                so_details.custPhone = result.getValue(customerSearchColPhone);
                return true;
            });
            return so_details
        } 

        function searchCustomerAddress(custId){
            var customerSearchColBillingAddressee = nsSearch.createColumn({ name: 'billaddressee' });
            var customerSearchColName = nsSearch.createColumn({ name: 'altname' });
            var customerSearchColBillingAddress = nsSearch.createColumn({ name: 'billaddress' });
            var customerSearchColBillingAddress1 = nsSearch.createColumn({ name: 'billaddress1' });
            var customerSearchColBillingAddress2 = nsSearch.createColumn({ name: 'billaddress2' });
            var customerSearchColBillingAddress3 = nsSearch.createColumn({ name: 'billaddress3' });
            var customerSearchColBillingAttention = nsSearch.createColumn({ name: 'billattention' });
            var customerSearchColBillingCity = nsSearch.createColumn({ name: 'billcity' });
            var customerSearchColBillingCountry = nsSearch.createColumn({ name: 'billcountry' });
            var customerSearchColBillingCountryCode = nsSearch.createColumn({ name: 'billcountrycode' });
            var customerSearchColBillingPhone = nsSearch.createColumn({ name: 'billphone' });
            var customerSearchColBillingStateprovince = nsSearch.createColumn({ name: 'billstate' });
            var customerSearchColBillingZip = nsSearch.createColumn({ name: 'billzipcode' });
            var customerSearchColAddressInternalId = nsSearch.createColumn({ name: 'addressinternalid' });
            var customerSearch = nsSearch.create({
            type: 'customer',
            filters: [
                ['isdefaultbilling', 'is', 'T'],
                'AND',
                ['internalid', 'anyof', custId],
            ],
            columns: [
                customerSearchColName,
                customerSearchColBillingAddress,
                customerSearchColBillingAddress1,
                customerSearchColBillingAddress2,
                customerSearchColBillingAddress3,
                customerSearchColBillingAttention,
                customerSearchColBillingCity,
                customerSearchColBillingCountry,
                customerSearchColBillingCountryCode,
                customerSearchColBillingPhone,
                customerSearchColBillingStateprovince,
                customerSearchColBillingZip,
                customerSearchColAddressInternalId,
                customerSearchColBillingAddressee
            ],
            });

            var addressData = {
                address: "",
                address1: "",
                address2: "",
                address3: "",
                addressee: "",
                attention: "",
                city: "",
                country: "",
                countrycode: "",
                externalid: "",
                internalid: "",
                override: "F",
                phone: "",
                state: "",
                zip: ""

            }

            customerSearch.run().each(function (result){
                addressData.address = result.getValue(customerSearchColBillingAddress)
                addressData.address1 = result.getValue(customerSearchColBillingAddress1)
                addressData.address2 = result.getValue(customerSearchColBillingAddress2)
                addressData.address3 = result.getValue(customerSearchColBillingAddress3)
                addressData.attention = result.getValue(customerSearchColBillingAttention)
                addressData.city = result.getValue(customerSearchColBillingCity)
                addressData.country = result.getValue(customerSearchColBillingCountry)
                addressData.countrycode = result.getValue(customerSearchColBillingCountryCode)
                addressData.phone = result.getValue(customerSearchColBillingPhone)
                addressData.state = result.getValue(customerSearchColBillingStateprovince)
                addressData.internalid = result.getValue(customerSearchColAddressInternalId)
                addressData.zip = result.getValue(customerSearchColBillingZip);
                addressData.addressee = result.getValue(customerSearchColBillingAddressee);
                return true;
            });
            log.emergency('addressData', addressData);
            return addressData

        }



        function replaceAll(str, find, replace) {
            while (str.indexOf(find) != -1) {
                str = str.replace(find, replace)

            }

            return str
        }

        return {
            onRequest: onRequest
        };
    });