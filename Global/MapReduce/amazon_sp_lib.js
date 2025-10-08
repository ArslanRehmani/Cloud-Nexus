/**
 * amazon_sp_lib.js
 * @NApiVersion 2.1
 * 
 * amazon vendor center direct fulfillment (drop ship)
 */

define([
    'N/https',
    'N/file',
    '/SuiteScripts/dealer-api-mgmt/dealer_api_mgmt',
    'N/xml',
    'N/record',
    'N/runtime',
    'N/search',
    'N/encode'
], function(https, file, dam, xml, record, runtime, search, encode) {
    'use strict';

    const orderLogFields = {
        order_log_record_type: 'customrecord_amz_sp_order_log',
        order_log_fields: [
            'name',
            'custrecord_amz_sp_order_dealer',
            'custrecord_amz_sp_order_ack',
            'custrecord_amz_sp_order_fulfilled',
            'custrecord_amz_sp_order_invoiced',
            'custrecord_amz_sp_order_cancelled',
            'custrecord_amz_sp_order_haspslip',
            'custrecord_amz_sp_order_pslipsource',
            'custrecord_amz_sp_order_pslipfile',
            'custrecord_amz_sp_order_source',
            'custrecord_amz_sp_order_salesorder',
            'custrecord_amz_sp_order_customer'
        ]
    }
    const transactionLogFields = {
        order_log_record_type: 'customrecord_amz_sp_order_txn_log',
        order_log_fields: [
            'name',
            'custrecord_amz_sp_order_txn_cancelled',
            'custrecord_amz_sp_order_txn_request',
            'custrecord_amz_sp_order_txn_status',
            'custrecord_amz_sp_order_txn_statuserror',
            'custrecord_amz_sp_order_txn_orderlog',
            'custrecord_amz_sp_order_txn_documents',
            'custrecord_amz_sp_order_txn_response',
            'custrecord_amz_sp_order_txn_requestbody',
        ]
    }

    const inventoryLogFields = {
        order_log_record_type: 'customrecord_amz_vendor_inventory_log',
        order_log_fields: [
            'name',
            'custrecord_amz_vendor_inventory_dealer',
            'custrecord_amz_vendor_inventory_whs',
            'custrecord_amz_vendor_inventory_errors',
            'custrecord_amz_vendor_inventory_status',
            'custrecord_amz_vendor_inventory_payload'
        ]
    }
    
    class AmzSP extends dam.dealer_api_mgmt {
        constructor(id) {
            super(id)
            
            this.crypto = this.callCrypto();
            this.getAccessToken();
            this.endPoint = this.config.endpoint || this.root_url.replace(/^(http|https):\/\//, '').replace(/\/$/, '')
        }

        GetInventorySubmitStatus() {
            const inventorySubmitWithoutStatus = this.getRecordValuesOnlyFromSearch({
                type: inventoryLogFields.order_log_record_type,
                filters: [
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_amz_vendor_inventory_status', 'isempty', null]
                ],
                columns: inventoryLogFields.order_log_fields
            })
            log.debug('inventorySubmitWithoutStatus', inventorySubmitWithoutStatus)
            inventorySubmitWithoutStatus.forEach(isws => {
                const {recordType, recordId, ...logValues} = isws
                new AmzSPInventory(this.id, recordId, logValues).getStatus()
            })
        }

        getAllItemsProducts() {
            this.items = this.getItemsFromSearch()
            this.getItemStock()

            this.items.forEach(item => {
                item.product.availableQuantity.amount = item.item.stock_overridden.value ? 0 : item.item?.quantity?.value || 0
            })

            // this.products = this.items.map(i => i.product)
        }

        getProductsForWarehouses() {
            if (!this.items) {
                this.getAllItemsProducts()
            }
            const warehouseProducts = this.items.reduce((pre, cur) => {
                // log.debug('cur', cur)
                const curWarehouse = cur.item.warehouse.text
                // log.debug('curWarehouse', curWarehouse)
                if (curWarehouse) {
                    if (!pre[curWarehouse]) {
                        pre[curWarehouse] = []
                    }
                    pre[curWarehouse].push(cur.product)
                }
                return pre
            }, {})
            log.debug('warehouseProducts', warehouseProducts)

            return warehouseProducts
        }

        submitInventory() {
            const warehouseProducts = this.getProductsForWarehouses()
            for (const warehouseName in warehouseProducts) {
                const items = warehouseProducts[warehouseName]
                const found = this.config.warehouses.find(w => w.name.trim().toUpperCase() == warehouseName.trim().toUpperCase())
                if (found) {
                    const body = JSON.stringify({
                        inventory: {
                            sellingParty: this.config.sellingParty,
                            isFullUpdate: false,
                            items
                        }
                    })
                    log.debug(`submit inventory body ${warehouseName}`, body)
                    const resp = this.request({
                        method: 'POST',
                        apiPath: `/vendor/directFulfillment/inventory/v1/warehouses/${found.code}/items`,
                        body
                    })
                    log.debug('submit inventory resp', resp)
                    if (resp.code == 202) {
                        const name = JSON.parse(resp.body).payload.transactionId
                        new AmzSPInventory(this.id, null, {
                            name,
                            custrecord_amz_vendor_inventory_dealer: this.id,
                            custrecord_amz_vendor_inventory_whs: found.name,
                            custrecord_amz_vendor_inventory_payload: body
                        })
                    } else {
                        throw new Error(`Unable to submit Inventory feed for warehouse Name ${warehouseName} due to ${resp.code} ${resp.body}`)
                    }
                } else {
                    throw new Error(`Unable to find warehouse ${warehouseName} in configurations`)
                }
            }
        }

        getOrder(orderId) {
            const resp = this.request({
                method: 'GET',
                apiPath: `/vendor/directFulfillment/orders/v1/purchaseOrders/${orderId}`
            }, true)
            log.debug('getOrder resp', resp)
            if (resp.code == 200) {
                var order = JSON.parse(resp.body).payload // payload was seen removed on 17st September
                //order = !order && JSON.parse(resp.body);
                //log.audit('order', order)
                return [{
                    name: order.purchaseOrderNumber,
                    custrecord_amz_sp_order_dealer: this.id,
                    custrecord_amz_sp_order_haspslip: order.orderDetails.shipmentDetails.isPslipRequired,
                    custrecord_amz_sp_order_source: JSON.stringify(order)
                }]
            } else {
                throw new Error(`Unable to get order due to ${resp.code} ${resp.body}`)
            }
        }

        getOrders(options, cont=false) {
            let allOrders = [], nowTime = new Date().getTime();
            const { query } = options || {}
            const getOrdersOptions = {
                method: 'GET',
                apiPath: '/vendor/directFulfillment/orders/v1/purchaseOrders',
                query: {
                    createdAfter:  new Date(nowTime - 1000 * 60 * 60 * 3).toISOString(), //"2023-07-19T05:59:00.000Z"
                    createdBefore: new Date(nowTime).toISOString(), //"2023-07-20T12:50:00.000Z"
                    marketplaceId: this.config.marketplaceId,
                    limit: 100,
                    includeDetails: true,
                    ...query
                },
                // ...options
            }

            log.debug('getOrders options', getOrdersOptions)
            const resp = this.request(getOrdersOptions, true)
            //log.audit('check fetch order', resp);
            if (resp.code == 200) {
                // log.debug('get orders resp body', resp.body);
                var body = JSON.parse(resp.body).payload;
                allOrders = allOrders.concat(body.orders)

                const nextToken = body.pagination?.nextToken;
                cont = nextToken ? true : false;
                log.debug('cont', {cont, nextToken})

                if (cont) {
                    getOrdersOptions.query.nextToken = nextToken;
                    allOrders = allOrders.concat(this.getOrders(getOrdersOptions, cont))
                }
            } else {
                throw new Error(`Failed to get response ${JSON.stringify(resp)}`)
            }
            return allOrders.map(order => {
                return {
                    name: order.purchaseOrderNumber,
                    custrecord_amz_sp_order_dealer: this.id,
                    custrecord_amz_sp_order_haspslip: order.orderDetails.shipmentDetails.isPslipRequired,
                    custrecord_amz_sp_order_source: JSON.stringify(order)
                }
            });
        }

        getUTCISODate() {
            const isoDate = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
            this.isoDate = {
                short: isoDate.substr(0, 8),
                full: isoDate
            }
        }

        /**
         * 
         * @param {Object} opt {method:String, apiPath:String, query:Object, body:Object} 
         * @returns 
         */
        request(opt, requireRDT=false) {
            const options = this.buildSignAPIRequest(opt, requireRDT)
                // apiPath: '/feeds/2021-06-30/feeds',
                // query: [
                //     {name: 'marketplaceId', value: this.config.marketplaceId}
                // ]
            const resp = https.request(options)
            log.debug('resp from buildSignAPIRequest()', resp)

            if (resp.code == 403) {
                this.requestNewAccessToken()
                return this.request(opt)
            } else {
                return resp;
            }

        }


        buildSignAPIRequest({method, apiPath, query, body}, requireRDT=false) {
            // log.debug('roleCredentials', this.roleCredentials)
            this.getUTCISODate()
            // log.debug('sign api iso date', this.isoDate)
            const actionType = 'execute-api'; //service

            requireRDT && this.requestRestrictedDataToken(method, apiPath); //updating this.accessToken

            const encodedQueryString = this.encodeQueryString(query)
            // log.debug('encodedQueryString', encodedQueryString)
            const canonicalRequest = this.buildCanonicalRequestForAPI(method, apiPath, encodedQueryString, body)
            // log.debug('canonicalRequest', canonicalRequest)
            const stringToSign = this.buildStringtoSign(this.config.aws_region, actionType, canonicalRequest)
            // log.debug('stringToSign', stringToSign)
            const signature = this.buildSignature(this.config.aws_region, actionType, stringToSign, this.roleCredentials.secret)
            // log.debug('signature', signature)
            const url = this.buildURL(apiPath, encodedQueryString)
            return {
                method,
                url: url,
                body: body? JSON.stringify(body) : null,
                headers: {
                    'Authorization': `AWS4-HMAC-SHA256 Credential=${this.roleCredentials.id}/${this.isoDate.short}/${this.config.aws_region}/execute-api/aws4_request, SignedHeaders=host;x-amz-access-token;x-amz-date, Signature=${signature}`,
                    'Content-Type': 'application/json; charset=utf-8',
                    'host': this.endPoint,
                    'x-amz-access-token': this.accessToken,
                    'x-amz-security-token': this.roleCredentials.token,
                    'x-amz-date': this.isoDate.full,
                    'User-Agent': 'netsuite/amz-sp'
                }
            }
        }

        requestRestrictedDataToken(method, apiPath){
            const resp = https.request({
                method: 'POST',
                url: 'https://sellingpartnerapi-fe.amazon.com/tokens/2021-03-01/restrictedDataToken',
                headers: {
                    'Content-Type': 'application/json',
                    'x-amz-access-token': this.accessToken
                },
                body: JSON.stringify({
                    "restrictedResources": [
                        {
                          "method": method,
                          "path": apiPath
                        }
                    ]
                })
            })
            log.audit('requestRestrictedDataToken', resp)
            if (resp.code == 403) {
                this.requestNewAccessToken()
                this.requestRestrictedDataToken(method, apiPath)
            } else if(resp.code == 200) {
                const body = JSON.parse(resp.body)
                this.accessToken = body.restrictedDataToken
            } else {
                throw new Error(`Failed to get response RDT ${JSON.stringify(resp)}`)
            }
        }
       
        requestRoleCredentials() {
            const query = {
                'Action':'AssumeRole',
                'DurationSeconds':'3600',
                'RoleArn': this.config.aws_user_role,
                'RoleSessionName':'SPAPISession',
                'Version':'2011-06-15'
            }

            this.getUTCISODate();
            const encodedQueryString = this.encodeQueryString(query)
            const canonicalRequest = this.buildCanonicalRequestForRoleCredentials(encodedQueryString)
            const stringToSign = this.buildStringtoSign('us-east-1', 'sts', canonicalRequest)
            const signature = this.buildSignature('us-east-1', 'sts', stringToSign, this.config.aws_sercret_access_key)

            const resp = https.request({
                method: 'POST',
                url: 'https://sts.amazonaws.com',
                body: encodedQueryString,
                headers: {
                    'Authorization': `AWS4-HMAC-SHA256 Credential=${this.config.aws_access_key_id}/${this.isoDate.short}/us-east-1/sts/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                    'Host': 'sts.amazonaws.com',
                    'X-Amz-Content-Sha256': this.crypto.SHA256(encodedQueryString).toString(this.crypto.enc.Hex),
                    'X-Amz-Date': this.isoDate.full
                }
            })
            // log.debug('resp', resp)
            if (resp.code == '200') {
                const xmlDoc = xml.Parser.fromString(resp.body)
                const token = xmlDoc.getElementsByTagName({tagName: 'SessionToken'})[0].textContent
                const id = xmlDoc.getElementsByTagName({tagName: 'AccessKeyId'})[0].textContent
                const secret = xmlDoc.getElementsByTagName({tagName: 'SecretAccessKey'})[0].textContent
                // this.sessionToken = found[0].textContent;
                
                this.roleCredentials = { id, secret, token }
            } else {
                throw new Error(`Failed to request role credential token due to ${resp.code} ${resp.body}`)
            }
        }

        buildCanonicalRequestForRoleCredentials(encodedQueryString) {
            const canonicalRequest = []
            canonicalRequest.push('POST'),
            canonicalRequest.push('/')
            canonicalRequest.push('')
            canonicalRequest.push('host:sts.amazonaws.com')
            canonicalRequest.push('x-amz-content-sha256:' + this.crypto.SHA256(encodedQueryString))
            canonicalRequest.push('x-amz-date:' + this.isoDate.full);
            canonicalRequest.push('')
            canonicalRequest.push('host;x-amz-content-sha256;x-amz-date')
            canonicalRequest.push(this.crypto.SHA256(encodedQueryString))

            return canonicalRequest.join('\n')
        }

        buildURL(apiPath, encodedQueryString) {
            // log.debug(`root url ${this.root_url.endsWith('/')}`, this.root_url)
            let url = `https://${this.endPoint}${apiPath}`;
            // log.debug('url', url)
            return encodedQueryString ? `${url}?${encodedQueryString}` : url
        }

        buildSignature(region, actionType, stringToSign, secret) {
            let signature = this.crypto.HmacSHA256(this.isoDate.short, `AWS4${secret}`)
            signature = this.crypto.HmacSHA256(region, signature)
            signature = this.crypto.HmacSHA256(actionType, signature)
            signature = this.crypto.HmacSHA256('aws4_request', signature)

            return this.crypto.HmacSHA256(stringToSign, signature).toString(this.crypto.enc.Hex)
        }

        buildStringtoSign(region, actionType, canonicalRequest) {
            const stringToSign = []
            stringToSign.push('AWS4-HMAC-SHA256')
            stringToSign.push(this.isoDate.full)
            stringToSign.push(`${this.isoDate.short}/${region}/${actionType}/aws4_request`)
            stringToSign.push(this.crypto.SHA256(canonicalRequest))

            return stringToSign.join('\n')
        }

        buildCanonicalRequestForAPI(method, apiPath, encodedQueryString, body) {
            const canonicalRequest = []
            canonicalRequest.push(method)
            canonicalRequest.push(this.encodeAPIPath(apiPath))
            canonicalRequest.push(encodedQueryString)
            canonicalRequest.push(`host:${this.endPoint}`)
            canonicalRequest.push(`x-amz-access-token:${this.accessToken}`)
            canonicalRequest.push(`x-amz-date:${this.isoDate.full}`)
            canonicalRequest.push('')
            canonicalRequest.push('host;x-amz-access-token;x-amz-date')
            canonicalRequest.push(this.crypto.SHA256(body? JSON.stringify(body): ''));

            return canonicalRequest.join('\n')
        }

        // Double encoding the api path will fix issues with path variables containing UTF-8 chars or whitespace (i.e. SKUs)
        encodeAPIPath(path) {
            return path.split('/').map(part => encodeURIComponent(encodeURIComponent(part))).join('/')
        }

        /**
         * encode parameters in url path
         * 
         * transform object to collection type first
         * 
         * @param {Array} object {} eg. {createdAfter: '2021-11-10T05:57:28.391Z'}
         * @returns 
         */
        encodeQueryString(query) {
            if (query) {
                let collection = [];
                for (const [name, value] of Object.entries(query)) {
                    const valueStr = util.isObject(value) ? JSON.stringify(value) : (value + '')
                    collection.push({name, value:valueStr})
                }
                // log.debug('collection', collection)
                collection.forEach(q => q.value = encodeURIComponent(q.value.replace(/ /g, '+')))
                // log.debug('collection endcoded', collection)
                const sorted = this._.sortBy(collection, ['name', 'value'])
                // log.debug('qeury encoded sorted', sorted)
                return sorted.map(s => {
                    if (util.isArray(s)) {
                        return s.join('=')
                    } else if (util.isObject(s)) {
                        return `${s.name}=${s.value}`
                    }
                }).join('&')
            }

            return ''
        }

        getAccessToken() {
            try {
                const existingAccessToken = JSON.parse(file.load('./logs/access_token.json').getContents())
                // leave 1000 seconds
                if (new Date(existingAccessToken.creation_datetime).getTime() + existingAccessToken.expires_in * 1000 < new Date().getTime() - 1000000) {
                    this.requestNewAccessToken()
                } else {
                    this.accessToken = existingAccessToken.access_token
                    this.roleCredentials = existingAccessToken.role_credentials
                }
            } catch (error) {
                log.error('get access token error', error)
                // if (error?.name == 'RCRD_DSNT_EXIST') {
                    this.requestNewAccessToken()
                // }
            }
        }

        // request new access token and temp role credentials
        requestNewAccessToken() {
            const resp = https.post({
                url: 'https://api.amazon.com/auth/o2/token',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: this.config.app_client_id,
                    client_secret: this.config.app_client_secret,
                    grant_type: 'refresh_token',
                    refresh_token: this.config.refresh_token
                })
            })
            log.debug('requestNewAccessToken', resp)
            if (resp.code == 200) {
                const body = JSON.parse(resp.body)
                body.creation_datetime = new Date().toISOString()
                this.accessToken = body.access_token

                this.requestRoleCredentials()
                body.role_credentials = this.roleCredentials

                file.create({
                    name: 'access_token.json',
                    contents: JSON.stringify(body),
                    fileType: file.Type.JSON,
                    folder: this.dealer_folder,
                    isOnline: false
                }).save()
            } else {
                throw new Error(`${this.name} failed to requrest access token from amazon auth`)
            }
        }

        submitAcknowledgement(body) {
            if (runtime.envType == 'PRODUCTION') {
                const resp = this.request({
                    method: 'POST',
                    apiPath: '/vendor/directFulfillment/orders/v1/acknowledgements',
                    body
                })
                log.debug('submit ack resp', resp)
                if (resp.code == 202) {
                    return JSON.parse(resp.body).payload.transactionId
                } else {
                    throw new Error(`Failed to sumbit Acknowledgement due to ${resp.code} ${resp.body} with ${JSON.stringify(body)}`)
                }
            } else {
                log.debug('submitAcknowledgement non production envType', runtime.envType)
            }
            
        }

        getTransactionStatus(transactionId) {
            const resp = this.request({
                method: 'GET',
                apiPath: `/vendor/directFulfillment/transactions/v1/transactions/${transactionId}`
            })
            log.debug(`get transaction statuts ${transactionId}`, resp)
            // {"type":"http.ClientResponse","code":200,"headers":{"content-length":"127","Content-Length":"127","Content-Type":"application/json","content-type":"application/json","Date":"Fri, 14 Jan 2022 05:31:31 GMT","date":"Fri, 14 Jan 2022 05:31:31 GMT","Via":"1.1 mono004","via":"1.1 mono004","x-amz-apigw-id":"L66bqEbjPHcF7_g=","X-Amz-Apigw-Id":"L66bqEbjPHcF7_g=","x-amzn-RequestId":"e80fa8bc-5c3c-44b3-b9ae-2b00d9cd71f1","x-amzn-requestid":"e80fa8bc-5c3c-44b3-b9ae-2b00d9cd71f1","X-Amzn-Requestid":"e80fa8bc-5c3c-44b3-b9ae-2b00d9cd71f1","X-Amzn-Trace-Id":"Root=1-61e10ab0-58c11be8446701e95c6f7d0d","x-amzn-trace-id":"Root=1-61e10ab0-58c11be8446701e95c6f7d0d"},"body":"{\"payload\":{\"transactionStatus\":{\"transactionId\":\"5efde876-9be7-451d-9b43-bd169f3776c8-20220112025830\",\"status\":\"Processing\"}}}"}	
            if (resp.code == 200) {
                return JSON.parse(resp.body).payload?.transactionStatus
            } else {
                throw new Error(`Failed to get transaction ${transactionId} status due to ${resp.code} ${resp.body}`)
            }
        }

        submitShippingLabelRequest(body) {
            if (runtime.envType == 'PRODUCTION') {
                const resp = this.request({
                    method: 'POST',
                    apiPath: '/vendor/directFulfillment/shipping/v1/shippingLabels',
                    body
                })
                log.debug('submit shipping label request resp', resp)
                if (resp.code == 202) {
                    return JSON.parse(resp.body).payload.transactionId
                } else {
                    throw new Error(`Failed to submit shipping label request due to ${resp.code} ${resp.body} with ${JSON.stringify(body)}`)
                }
            } else {
                log.debug('submitShippingLabelRequest non production envType', runtime.envType)
            }
        }

        /**
         * download shipping label
         * 1. Order Acknowledged first
         * 2. request sihpping label
         * 3. wait up to 15 mins
         * 4. check request shipping label if success if so do step 5, otherwise restart the process from step 2
         * 5. get shipping label
         */
        getShippingLabel(purchaseOrderNumber) {
            const resp = this.request({
                method: 'GET',
                apiPath: `/vendor/directFulfillment/shipping/v1/shippingLabels/${purchaseOrderNumber}`
            }, true)
            log.debug('getShippingLabel response', resp)
            if (resp.code == 200) {
                return JSON.parse(resp.body).payload
            } else {
                throw new Error(`unable to downlaod shipping label for ${this.name} order ${purchaseOrderNumber}`)
            }
        }

        getPackingSlip(purchaseOrderNumber) {
            const resp = this.request({
                method: 'GET',
                apiPath: `/vendor/directFulfillment/shipping/v1/packingSlips/${purchaseOrderNumber}`
            })
            if (resp.code == 200) {
                return JSON.parse(resp.body).payload
            } else {
                throw new Error(`unable to get packing slip for ${this.name} order ${purchaseOrderNumber}`)
            }
        }

        submitShipmentConfirmations(body) {
            if (runtime.envType == 'PRODUCTION') {
                const resp = this.request({
                    method: 'POST',
                    apiPath: '/vendor/directFulfillment/shipping/v1/shipmentConfirmations',
                    body
                })
                log.debug('submitShipmentConfirmations resp', resp)
                if (resp.code == 202) {
                    return JSON.parse(resp.body).payload.transactionId
                } else {
                    throw new Error(`unable to submit shipment confirmation order due to ${resp.code} ${resp.body} with ${JSON.stringify(body)}`)
                }
            } else {
                log.debug('submitShipmentConfirmations non production envType', runtime.envType)
            }
        }

        submitInvoice(body) {
            if (runtime.envType == 'PRODUCTION') {
                const resp = this.request({
                    method: 'POST',
                    apiPath: '/vendor/directFulfillment/payments/v1/invoices',
                    body
                })
                log.debug('submit Invoice resp', resp)
                if (resp.code == 202) {
                    return JSON.parse(resp.body).payload.transactionId
                } else {
                    throw new Error(`unable to submit invoice for ${this.name} due to ${resp.code} ${resp.body} with ${JSON.stringify(body)}`)
                }
            } else {
                log.debug('submitInvoice non production envType', runtime.envType)
            }
        }
    }

    class AmzSPOrder extends dam.dealerOrderLog {
        constructor(id, logInternalid, logValues) {
            super(id, orderLogFields, logInternalid, logValues)
            this.dealerId = id;
            const {purchaseOrderNumber, orderDetails} = this.getOrderBody(JSON.parse(this.logValues.custrecord_amz_sp_order_source))
            this.order = orderDetails
            this.purchaseOrderNumber = purchaseOrderNumber
        }

        invoice() {
            if (this.logValues.custrecord_amz_sp_order_invoiced) {
                log.audit('order has been invoiced', `${this.name} ${this.logValues.name}`)
            } else if (this.logValues.custrecord_amz_sp_order_fulfilled && !this.logValues.custrecord_amz_sp_order_cancelled) {
                // only submit invoice when shipment is confirmed
                const operation = 'submitInvoice';
                const existing = this.searchExisting({
                    type: transactionLogFields.order_log_record_type,
                    filters: [
                        ['custrecord_amz_sp_order_txn_orderlog', 'is', this.logInternalid],
                        'AND',
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['custrecord_amz_sp_order_txn_request', 'is', operation],
                        'AND',
                        ['custrecord_amz_sp_order_txn_cancelled', 'is', 'F']
                    ],
                    columns: transactionLogFields.order_log_fields
                })
                if (existing) {
                    // if (existing.custrecord_amz_sp_order_txn_status.toUpperCase() == 'SUCCESS') {
                    //     this.update({custrecord_amz_sp_order_invoiced: true})
                    // } else if (existing.custrecord_amz_sp_order_txn_status.toUpperCase() == 'IN PROGRESS' || 
                    //     existing.custrecord_amz_sp_order_txn_status.toUpperCase() == ''
                    // ) {
                    //     // get transaction status
                    //     const {recordType, recordId, ...transactionValues} = existing
                    //     new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getStatus()
                    // }
                    // get transaction status
                    const {recordType, recordId, ...transactionValues} = existing
                    new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getStatus()
                } else {
                    // create new transaction
                    const {status, invoices} = this.getInvoiceDetails(this.logValues.custrecord_amz_sp_order_salesorder)
                    log.debug('invoice details', {status, invoices})
                    if (status == 'fullyBilled') {
                        this.order.items.forEach(item => {
                            const found = invoices.find(inv => inv.sku == item.vendorProductIdentifier)
                            if (found) {
                                
                            } else {
                                throw new Error(`unable to find item ${item.vendorProductIdentifier} in ${this.name} order ${this.logValues.name} in invoices`)
                            }
                        })
                        const body = {invoices: []}
                        const invoiceGroup = this._.groupBy(invoices, 'invoicetranid')

                        util.each(invoiceGroup, group => {
                            const invoice = {
                                invoiceNumber: group[0].invoicetranid,
                                invoiceDate: group[0].invoice_moment,
                                remitToParty: {
                                    ...this.order.sellingParty,
                                    address: {
                                        name: 'Global Fitness & Leisure Pty Ltd',
                                        // addressLine1: 'PO BOX 335',
                                        // city: 'Campbellfield',
                                        // stateOrRegion: 'VIC',
                                        // postalCode: '3061',
                                        addressLine1: '23-25 Maygar Blvd',
                                        city: 'Broadmeadows',
                                        stateOrRegion: 'VIC',
                                        postalCode: '3047',
                                        countryCode: 'AU'
                                    },
                                    taxRegistrationDetails: [
                                        {
                                            taxRegistrationType: 'GST',
                                            taxRegistrationNumber: '96137370953'
                                        }
                                    ]
                                },
                                shipFromParty: this.order.shipFromParty,
                                invoiceTotal: {
                                    currencyCode: 'AUD',
                                    amount: group[0].invoicetotal
                                },
                                items: []
                            }
                            group.forEach(g => {
                                const item = this.order.items.find(i => i.vendorProductIdentifier = g.sku)
                                invoice.items.push({
                                    itemSequenceNumber: item.itemSequenceNumber,
                                    buyerProductIdentifier: item.buyerProductIdentifier,
                                    vendorProductIdentifier: item.vendorProductIdentifier,
                                    invoicedQuantity: {
                                        unitOfMeasure: 'Each',
                                        amount: g.invoiceitemquantity
                                    },
                                    netCost: {
                                        currencyCode: 'AUD',
                                        amount: g.invoicenetamount
                                    },
                                    purchaseOrderNumber: this.logValues.name,
                                    vendorOrderNumber: g.tranid
                                })
                            })
                            body.invoices.push(invoice)
                        })
                        log.debug('submit invoice body', body)
                        const transactionId = new AmzSP(this.dealerId).submitInvoice(body)
                        new AmzSPOrderTransaction(this.dealerId, null, {
                            name: transactionId,
                            custrecord_amz_sp_order_txn_request: operation,
                            custrecord_amz_sp_order_txn_requestbody: JSON.stringify(body),
                            custrecord_amz_sp_order_txn_orderlog: this.logInternalid
                        })
                    }
                }
            }
        }

        submitShipment(fulfillments) {
            if (this.logValues.custrecord_amz_sp_order_fulfilled) {
                // can continue to submit invoice()
                log.audit(`order has been fulfilled`, `${this.name} ${this.logValues.name}`)
            } else {
                const operation = 'submitShipmentConfirmations';
                const existing = this.searchExisting({
                    type: transactionLogFields.order_log_record_type,
                    filters: [
                        ['custrecord_amz_sp_order_txn_orderlog', 'is', this.logInternalid],
                        'AND',
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['custrecord_amz_sp_order_txn_request', 'is', operation],
                        'AND',
                        ['custrecord_amz_sp_order_txn_cancelled', 'is', 'F']
                    ],
                    columns: transactionLogFields.order_log_fields
                })
                if (existing) {
                    // get transaction status
                    const {recordType, recordId, ...transactionValues} = existing
                    new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getStatus()
                } else {
                    // create new transaction
                    const body = {
                        shipmentConfirmations: [{
                            purchaseOrderNumber: this.logValues.name,
                            shipmentDetails: {
                                shippedDate: new Date().toISOString(),
                                shipmentStatus: 'SHIPPED'
                            },
                            sellingParty: this.order.sellingParty,
                            shipFromParty: this.order.shipFromParty,
                            items: []
                        }]
                    }
                    this.order.items.forEach(item => {
                        const found = fulfillments.find(ff => ff.sku == item.vendorProductIdentifier)
                        if (found) {
                            body.shipmentConfirmations[0].items.push({
                                itemSequenceNumber: item.itemSequenceNumber,
                                buyerProductIdentifier: item.buyerProductIdentifier,
                                vendorProductIdentifier: item.vendorProductIdentifier,
                                shippedQuantity: {
                                    "amount": parseInt(found.quantity),
                                    "unitOfMeasure": "Each"
                                }
                            })
                        } else {
                            throw new Error(`unable to find item ${item.vendorProductIdentifier} in ${this.name} order ${this.logValues.name} in fulfillments`)
                        }
                    })
                    log.debug('submit shipment confirmations body', body)
                    const transactionId = new AmzSP(this.dealerId).submitShipmentConfirmations(JSON.stringify(body))
                    new AmzSPOrderTransaction(this.dealerId, null, {
                        name: transactionId,
                        custrecord_amz_sp_order_txn_request: operation,
                        custrecord_amz_sp_order_txn_requestbody: JSON.stringify(body),
                        custrecord_amz_sp_order_txn_orderlog: this.logInternalid
                    })
                }
                // if (existing?.custrecord_amz_sp_order_txn_status.toUpperCase() == 'SUCCESS') {
                //     // submit invoice
                //     this.update({custrecord_amz_sp_order_fulfilled: true})
                // } else if (existing?.custrecord_amz_sp_order_txn_status.toUpperCase() == 'IN PROGRESS' || 
                //     existing?.custrecord_amz_sp_order_txn_status.toUpperCase() == ''
                // ) {
                //     // get transaction status
                //     const {recordType, recordId, ...transactionValues} = existing
                //     new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getStatus()
                // }
            }
        }

        shipLabel(fulfillments) {
            const operation = 'submitShippingLabelRequest'
            // find the existing trancation log for shipping label request first
            const existing = this.searchExisting({
                type: transactionLogFields.order_log_record_type,
                filters: [
                    ['custrecord_amz_sp_order_txn_orderlog', 'is', this.logInternalid],
                    'AND',
                    ['isinactive', 'is', 'F'],
                    'AND',
                    ['custrecord_amz_sp_order_txn_request', 'is', operation],
                    'AND',
                    ['custrecord_amz_sp_order_txn_cancelled', 'is', 'F']
                ],
                columns: transactionLogFields.order_log_fields
            })
            log.debug('existing shiplabel transaction', existing)
            // if (existing?.custrecord_amz_sp_order_txn_status.toUpperCase() === 'SUCCESS') {
            //     this.submitShipment(fulfillments)
            //     if (existing.custrecord_amz_sp_order_txn_response) {
            //         return JSON.parse(existing.custrecord_amz_sp_order_txn_response)

            //     } else {
            //         const {recordType, recordId, ...transactionValues} = existing
            //         return new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getShippingLabel()
            //     }
            // } else if (existing?.custrecord_amz_sp_order_txn_status.toUpperCase() == 'IN PROGRESS' || 
            //         existing?.custrecord_amz_sp_order_txn_status.toUpperCase() == ''
            // ) {
            //     const {recordType, recordId, ...transactionValues} = existing
            //     const transaction = new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues)
            //     const status = transaction.getStatus()
            //     if (status.toUpperCase() == 'SUCCESS') {
            //         return transaction.getShippingLabel()
            //     }
            // }
            if (existing) {
                const {recordType, recordId, ...transactionValues} = existing;
                const transaction = new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues)
                const status = transaction.getStatus()
                if (status.toUpperCase() == 'SUCCESS') {
                    log.debug(`txn docs ${typeof transactionValues.custrecord_amz_sp_order_txn_documents}`, transactionValues.custrecord_amz_sp_order_txn_documents)
                    if (!transactionValues.custrecord_amz_sp_order_txn_documents) {
                        transaction.getShippingLabel()
                    } else {
                        let labels = {}
                        try {
                            labels = JSON.parse(transactionValues.custrecord_amz_sp_order_txn_documents)
                        } catch (error) {
                            log.error('parse shipping labels error', error)
                            throw new Error(`Incorrect shiplabels data format in transaction ${transactionValues.name} ${operation} , it should be "{shippingLabels: [fileInternalids...]}"`)
                        }

                        if (util.isArray(labels.shippingLabels) && labels.shippingLabels.length) {
                            this.submitShipment(fulfillments)
                        }
                    }
                }
            } else {
                // create submitShippingLabelRequest transaction
                // in case of missing labels, need to list all packages with dimension and weight
                // const body = {
                //     shippingLabelRequests: [{
                //             purchaseOrderNumber: this.logValues.name,
                //             sellingParty: this.order.sellingParty,
                //             shipFromParty: this.order.shipFromParty,
                //             containers: [{
                //                 containerType: 'carton',
                //                 containerIdentifier: '',
                //                 containerSequenceNumber,
                //                 dimensions: {
                //                     length,
                //                     width,
                //                     height,
                //                     unitOfMeasure: 'CM'
                //                 },
                //                 weight: {
                //                     value, // dead weight
                //                     unitOfMeasure: 'KG'
                //                 },
                //                 packedItems: {
                //                     itemSequenceNumber,
                //                     buyerProductIdentifier,
                //                     vendorProductIdentifier,
                //                     packedQuantity // total item quantity packed in the container
                //                 }
                //             }]
                //         }
                //     ]
                // }
                const body = {shippingLabelRequests: []}
                util.each(this.order.items, (item, index) => {
                    const shippingLabel = {
                        purchaseOrderNumber: this.logValues.name,
                        sellingParty: this.order.sellingParty,
                        shipFromParty: this.order.shipFromParty,
                        containers: []
                    }
                    const found = fulfillments.find(ff => item.vendorProductIdentifier.toUpperCase() == ff.sku.toUpperCase())
                    if (found) {
                        const measures = this.getItemDimensionsWeightCarrier(found.type, found.item)
                        log.debug('measures', measures)
                        let container = {
                            containerType: 'carton',
                            containerIdentifier: found.sku,
                            packedItems: [{
                                itemSequenceNumber: item.itemSequenceNumber,
                                buyerProductIdentifier: item.buyerProductIdentifier,
                                vendorProductIdentifier: item.vendorProductIdentifier,
                                packedQuantity: {
                                    "amount": 1,
                                    "unitOfMeasure": "Each"
                                } // total item quantity packed in the container
                            }]
                        }
                        if (found.type == 'InvtPart') {
                            // based on all InvtPart item has only 1 package
                            for (let i = 1; i <= (item.orderedQuantity.amount) * (measures[0].data.total_package.value); i++) {
                                container = {
                                    ...container,
                                    containerSequenceNumber: shippingLabel.containers.length + 1,
                                    dimensions: {
                                        length: measures[0].data.length.value,
                                        width: measures[0].data.width.value,
                                        height: measures[0].data.height.value,
                                        unitOfMeasure: 'CM'
                                    },
                                    weight: {
                                        value: measures[0].data.weight.value,
                                        unitOfMeasure: 'KG'
                                    },
                                }
                                shippingLabel.containers.push(container)
                            }
                        } else if (found.type == 'Kit') {
                            for (let i = 1; i <= item.orderedQuantity.amount; i++) {
                                // for (let j = 1; j <= measures[0].total_package.value; j++) {
                                for (let m = 0; m < measures.length; m++) {
                                    for (let j = 1; j <= measures[m].data.length * measures[m].data.memberquantity.value; j++) {
                                        container = {
                                            ...container,
                                            containerIdentifier: `${found.sku}_${measures[m].data.memberitem_displayname.value}_${j}`,
                                            containerSequenceNumber: shippingLabel.containers.length + 1,
                                            dimensions: {
                                                length: measures[m].data.length.value,
                                                width: measures[m].data.width.value,
                                                height: measures[m].data.height.value,
                                                unitOfMeasure: 'CM'
                                            },
                                            weight: {
                                                value: measures[m].data.weight.value,
                                                unitOfMeasure: 'KG'
                                            },
                                        }
                                        shippingLabel.containers.push(container)
                                    }
                                }
                            }
                        }
                    } else {
                        throw new Error(`Unable to find item ${item.vendorProductIdentifier} in ${fulfillments[0].tranid} item fulfillments`)
                    }

                    body.shippingLabelRequests.push(shippingLabel)
                })
                log.debug('submit shipping label request body', body)
                const transactionId = new AmzSP(this.dealerId).submitShippingLabelRequest(JSON.stringify(body))
                new AmzSPOrderTransaction(this.dealerId, null, {
                    name: transactionId,
                    custrecord_amz_sp_order_txn_request: operation,
                    custrecord_amz_sp_order_txn_requestbody: JSON.stringify(body),
                    custrecord_amz_sp_order_txn_orderlog: this.logInternalid
                })
            }
        }

        getPSlip() {
            if (this.logValues.custrecord_amz_sp_order_haspslip && !this.logValues.custrecord_amz_sp_order_pslipfile) {
                const pslip = new AmzSP(this.dealerId).getPackingSlip(this.logValues.name)
                if (pslip.contentType == 'application/pdf') {
                    const pslipFileId = file.create({
                        name: `${this.logValues.name}_packing_slip.pdf`,
                        contents: pslip.content,
                        fileType: file.Type.PDF,
                        folder: this.dealer_folder,
                        isOnline: false
                    }).save()
                    if (pslipFileId) {
                        this.update({
                            custrecord_amz_sp_order_pslipsource: JSON.stringify(pslip),
                            custrecord_amz_sp_order_pslipfile: pslipFileId
                        })
                    }
                } else {
                    throw new Error(`${this.name} order ${this.logValues.name} Save Packing Slip Error, only support PDF type`)
                }
            }

            // return JSON.parse(this.logValues.custrecord_amz_sp_order_pslipsource)
            return {
                packingSlipFileId: this.logValues.custrecord_amz_sp_order_pslipfile,
                source: JSON.parse(this.logValues.custrecord_amz_sp_order_pslipsource || '{}')
            }
        }

        ack(cancelled) {
            const operation = 'submitAcknowledgement'
            if (this.logValues.custrecord_amz_sp_order_ack) {
                log.audit('ack already', `${this.name} ${this.logValues.name}`)
            } else {
                // search transaction log and update if existing rather create new log
                const existing = this.searchExisting({
                    type: transactionLogFields.order_log_record_type,
                    filters: [
                        ['custrecord_amz_sp_order_txn_request', 'is', operation],
                        'AND',
                        ['isinactive', 'is', 'F'],
                        'AND',
                        ['custrecord_amz_sp_order_txn_orderlog', 'is', this.logInternalid],
                        'AND',
                        ['custrecord_amz_sp_order_txn_cancelled', 'is', 'F']
                    ],
                    columns: transactionLogFields.order_log_fields
                })
                log.audit('existing ack transaction', existing)
                if (existing) {
                    // if (existing.custrecord_amz_sp_order_txn_status.toUpperCase() === 'SUCCESS') {
                    //     log.audit('ack txn alreay exists', existing)
                    //     // update ack in order log
                    //     this.update({custrecord_amz_sp_order_ack: true})
                    // } else if (existing.custrecord_amz_sp_order_txn_status.toUpperCase() == 'IN PROGRESS' || 
                    //     existing.custrecord_amz_sp_order_txn_status.toUpperCase() == '' ||
                    //     existing.custrecord_amz_sp_order_txn_status.toUpperCase() === 'PROCESSING'
                    // ){
                    //     // get transaction status
                    //     const {recordType, recordId, ...transactionValues} = existing
                    //     const status = new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getStatus()
                    //     if (status.toUpperCase() == 'SUCCESS' && cancelled) {
                    //         this.update({custrecord_amz_sp_order_cancelled: true})
                    //     }
                    // }

                    const {recordType, recordId, ...transactionValues} = existing
                    const status = new AmzSPOrderTransaction(this.dealerId, recordId, transactionValues).getStatus()
                    
                    if (status.toUpperCase() == 'SUCCESS' && cancelled) {
                        this.update({custrecord_amz_sp_order_cancelled: true})
                    }
                } else {
                    // submit acknowledgement
                    // create transaction log with transaction response when existing is null or existing.status is 'FAILED'
                    const acknowledgementStatus = {
                        code: cancelled ? "03" : "00", 
                        description: cancelled ? "Canceled out of stock" : "Shipping 100 percent of ordered product"
                    }
                    const itemAcknowledgements = this.order.items.map(item => {
                        return {
                            itemSequenceNumber: item.itemSequenceNumber,
                            acknowledgedQuantity: {
                                amount: item.orderedQuantity.amount,
                                unitOfMeasure: item.orderedQuantity.unitOfMeasure
                            }
                        }
                    })
                    const columns = search.lookupFields({
                        type: 'salesorder',
                        id: this.logValues.custrecord_amz_sp_order_salesorder,
                        columns: ['tranid']
                    })
                    log.debug('search so tranid', columns)
                    const body = {
                        purchaseOrderNumber: this.logValues.name,
                        vendorOrderNumber: columns.tranid,
                        acknowledgementDate: new Date().toISOString(),
                        acknowledgementStatus,
                        sellingParty: this.order.sellingParty,
                        shipFromParty: this.order.shipFromParty,
                        itemAcknowledgements
                    }
                    log.debug('submit acknowledgement body', body)
                    const transactionId = this.submitAcknowledgement(body)
                    if (transactionId) {
                        new AmzSPOrderTransaction(this.dealerId, null, {
                            name: transactionId,
                            custrecord_amz_sp_order_txn_request: operation,
                            custrecord_amz_sp_order_txn_requestbody: JSON.stringify(body),
                            custrecord_amz_sp_order_txn_orderlog: this.logInternalid
                        })
                    } else {
                        throw new Error(`missing transactionId from ${this.name} ${this.logValues.name} order acknowledgement`)
                    }
                    
                }
            }
        }

        submitAcknowledgement(body) {
            return new AmzSP(this.logValues.custrecord_amz_sp_order_dealer).submitAcknowledgement(JSON.stringify({orderAcknowledgements: [body]}))
        }

        process() {
            if ((!this.logValues.custrecord_amz_sp_order_fulfilled || !this.logValues.custrecord_amz_sp_order_invoiced) && !this.logValues.custrecord_amz_sp_order_cancelled) {
                const {status, fulfillments} = this.getFulfillmentDetails(this.logValues.custrecord_amz_sp_order_salesorder);
                log.debug('status fulfillment', {status, fulfillments})
                
                if (status == 'closed') {
                    // acknowledge amz cancelled
                    this.ack(true)
                } else if (status == 'fullyBilled' || status == 'pendingBilling') {
                    this.ack(false)
                    this.getPSlip()

                    if (fulfillments.length > 0) {
                        this.shipLabel(fulfillments)
                    }

                    if (status == 'fullyBilled') {
                        // make sure the shipment confirmation has been successfully submitted and accepted
                        this.invoice()
                    }
                } else {
                    // {"status":"pendingFulfillment","fulfillments":[{"custbody_close_reason":"","tranid":"SO447864"}]}
                    log.audit('has not been processed yet', `${this.name} order ${this.purchaseOrderNumber} ${fulfillments[0].tranid} ${status}`)
                }
            } else {
                log.audit(`${this.name} order ${this.logValues.name} cancelled or fulfilled already`, 
                    {acknowledged: this.logValues.custrecord_amz_sp_order_ack, fulfilled: this.logValues.custrecord_amz_sp_order_fulfilled, invoiced: this.logValues.custrecord_amz_sp_order_invoiced, cancelled: this.logValues.custrecord_amz_sp_order_cancelled}
                )
            }
        }

        generateSalesorder() {
            if (this.logValues.custrecord_amz_sp_order_salesorder) {
                log.audit('existing salesorder', this.logValues.custrecord_amz_sp_order_salesorder)
            } else {
                const salesorderValues = this.fetchNSValues('order', this.order)
                log.debug('salesorderValue', salesorderValues)
                delete salesorderValues.shippingaddress.addrphone; // Amazon stop transmit customer data, delete phone number becase incorrect format 
                const {type, id} = this.createUpdateRecord({
                    type: 'salesorder',
                    data: salesorderValues
                })

                this.update({custrecord_amz_sp_order_salesorder: id})
            }
        }

        // add __NS_ITEMS__ to order body
        getOrderBody(source) {
            const {purchaseOrderNumber, orderDetails} = source;
            const items = source.orderDetails.items.map(item => {
                if(!item.vendorProductIdentifier){
                    // Fix item with no NS sku identifier
                    if(item.buyerProductIdentifier == 'B09W8TQ3LT'){item.vendorProductIdentifier = 'LFRB-RBX100'}
                }
            	if(item.vendorProductIdentifier == '9347166064998'){
            	    // Fix item with no NS sku identifier
            	    item.vendorProductIdentifier = 'LFAC-BTS500-BK1'
            	}
                if(item.vendorProductIdentifier == '777904450650'){
            	    // Fix item with no NS sku identifier
            	    item.vendorProductIdentifier = 'SPMAGICALHOUSE'
            	}
                if(item.vendorProductIdentifier == 'LFAC-BTS500-BK4'){
            	    // Fix item with sku changed
            	    item.vendorProductIdentifier = 'LFAC-BTS500-BK4-OLD'
            	}
                if(item.vendorProductIdentifier == 'LFAC-BTS500-BK6'){
            	    // Fix item with sku changed
            	    item.vendorProductIdentifier = 'LFAC-BTS500-BK6-OLD'
            	}
                if(item.vendorProductIdentifier == 'LFAC-BTS500-BK8'){
            	    // Fix item with sku changed
            	    item.vendorProductIdentifier = 'LFAC-BTS500-BK8-OLD'
            	}
                if(item.vendorProductIdentifier == 'B07JYL1T47'){
                    item.vendorProductIdentifier = 'BIKPRD120WHT-59';
                }
                if (item.vendorProductIdentifier.indexOf("(Discon)") !== -1) {
                    item.vendorProductIdentifier = item.vendorProductIdentifier.replace(/ \(.+\)$/, "");
                }
                const itemInfo = this.getItemInfo({
                    item_sku: item.vendorProductIdentifier
                });
                if (itemInfo[0]?.sku == item.vendorProductIdentifier) {
                    return {
                        item: itemInfo[0].internalid,
                        price: this.price_level,
                        quantity: item.orderedQuantity.amount,
                        taxcode: 7
                    }
                } else {
                    throw new Error(`Unable to find ${item.vendorProductIdentifier} in Netsuite`)
                }
            })
            orderDetails.__NS_ITEMS__ = items

            let instructions = [`customer order number: ${orderDetails.customerOrderNumber}`];
            if (source.orderDetails.shipmentDetails?.isPslipRequired) {
                instructions.push(`Require Packing Slip: Yes`)
            }
            if (source.orderDetails.shipmentDetails?.shipmentDates?.requiredShipDate) {
                instructions.push('Required Ship Date: ' + this.moment.tz(
                    new Date(source.orderDetails.shipmentDetails?.shipmentDates?.requiredShipDate),'Australia/Melbourne'
                ).format('D/M/YYYY H:mm:ss'))
            }
            if (source.orderDetails.shipmentDetails?.shipmentDates?.promisedDeliveryDate) {
                instructions.push('Promised delivery Date: ' + this.moment.tz(
                    new Date(source.orderDetails.shipmentDetails?.shipmentDates?.promisedDeliveryDate), 'Australia/Melbourne'
                ).format('D/M/YYYY H:mm:ss'))
            }
            if (instructions.length > 0) {
                orderDetails.__INSTRUCTIONS__ = instructions.join('\n')
            }
            return {purchaseOrderNumber, orderDetails}
        }
    }

    /**
     * order tranaction logs
     * 
     * operations we cover: submitAcknowledgement, submitShippingLabelRequest, submitShipmentConfirmations, submitInventoryUpdate, submitInvoice
     * 
     * the following operation doesn't need transaction response
     * submitAcknowledgement, submitShipmentConfirmations, submitShipmentStatusUpdates, submitInventoryUpdate, submitInvoice
     * 
     * the following operation do need transaction response
     * submitShippingLabelRequest
     */
    class AmzSPOrderTransaction extends dam.dealerOrderLog {
        constructor(id, logInternalid, logValues) {
            super(id, transactionLogFields, logInternalid, logValues)
            this.dealerId = id;
        }

        getStatus() {
            if (this.logValues.custrecord_amz_sp_order_txn_status.toUpperCase() == 'SUCCESS') {
                log.audit(`${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} status`, 'Success')
            } else if (
                this.logValues.custrecord_amz_sp_order_txn_status.toUpperCase() == 'IN PROGRESS' || 
                this.logValues.custrecord_amz_sp_order_txn_status == '' || 
                this.logValues.custrecord_amz_sp_order_txn_status.toUpperCase() == 'PROCESSING'
            ) {
                const {status, errors} = new AmzSP(this.dealerId).getTransactionStatus(this.logValues.name)
                this.update({custrecord_amz_sp_order_txn_status: status, custrecord_amz_sp_order_txn_statuserror: (errors || '')})

                if (status.toUpperCase() == 'FAILURE') {
                    log.error(`${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} Failed`, errors)
                    this.noticeEmail({
                        subject: `Amazon SP transaction ${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} FAILED`,
                        body: `Amazon SP transaction ${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} FAILED due to
                        ${errors.map(err => `${err.code}: ${err.message}`).join('\n')}
                        `
                    });
                    throw new Error(`Amazon SP transaction ${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} FAILED due to
                    ${errors.map(err => `${err.code}: ${err.message}`).join('\n')}`)
                } else if (status.toUpperCase() == 'SUCCESS') {
                    if (this.logValues.custrecord_amz_sp_order_txn_request == 'submitShippingLabelRequest') {
                        this.getShippingLabel()
                    } else if (this.logValues.custrecord_amz_sp_order_txn_request == 'submitAcknowledgement') {
                        this.submitParentFields({custrecord_amz_sp_order_ack: true})
                    } else if (this.logValues.custrecord_amz_sp_order_txn_request == 'submitShipmentConfirmations') {
                        this.submitParentFields({custrecord_amz_sp_order_fulfilled: true})
                    } else if (this.logValues.custrecord_amz_sp_order_txn_request == 'submitInvoice') {
                        this.submitParentFields({custrecord_amz_sp_order_invoiced: true})
                    }
                } else {
                    log.audit(`${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} status`, status)
                }
            } else if (this.logValues.custrecord_amz_sp_order_txn_status.toUpperCase() == 'FAILURE') {
                log.audit(`${this.logValues.name} ${this.logValues.custrecord_amz_sp_order_txn_request} status`, 'FAILURE')
            }
            

            return this.logValues.custrecord_amz_sp_order_txn_status
        }

        getShippingLabel() {
            const columns = search.lookupFields({
                type: orderLogFields.order_log_record_type,
                id: this.logValues.custrecord_amz_sp_order_txn_orderlog,
                columns: ['name']
            });
            log.debug('submit shipping label request columns', columns)
            const shippingLabel = new AmzSP(this.dealerId).getShippingLabel(columns.name)
            const labelList = shippingLabel.labelData.map(ll => {
                const results = encode.convert({
                    string: ll.content,
                    inputEncoding: encode.Encoding.BASE_64,
                    outputEncoding: encode.Encoding.UTF_8
                });
                const options = {
                    contents: results,
                    folder: this.dealer_folder,
                    isOnline: false
                }
                if (shippingLabel.labelFormat.toUpperCase() == 'ZPL') {
                    return file.create({
                        name: `${shippingLabel.purchaseOrderNumber}_${ll.trackingNumber}.zpl`,
                        fileType: file.Type.PLAINTEXT,
                        ...options
                    }).save()
                } else if (shippingLabel.labelFormat.toUpperCase() == 'PNG') {
                    return file.create({
                        name: `${shippingLabel.purchaseOrderNumber}_${ll.trackingNumber}.png`,
                        fileType: file.Type.PNGIMAGE,
                        ...options
                    }).save()
                } else {
                    throw new Error(`Please contact Developer, currenlty shipping label supports ZPL or PNG format only`)
                }
            })
            if (labelList.length) {
                this.update({
                    custrecord_amz_sp_order_txn_response: JSON.stringify(shippingLabel),
                    custrecord_amz_sp_order_txn_documents: JSON.stringify({shippingLabels:labelList})
                })
            }

            return labelList;
        }

        submitParentFields(values) {
            // update parent's ack
            record.submitFields({
                type: orderLogFields.order_log_record_type,
                id: this.logValues.custrecord_amz_sp_order_txn_orderlog,
                values,
                options: {
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                }
            })
        }
    }

    class AmzSPInventory extends dam.dealerOrderLog {
        constructor(id, logInternalid, logValues) {
            super(id, inventoryLogFields, logInternalid, logValues)
            this.dealerId = id;
        }

        getStatus() {
            const {status, errors} = new AmzSP(this.dealerId).getTransactionStatus(this.logValues.name)
            this.update({custrecord_amz_vendor_inventory_status: status, custrecord_amz_vendor_inventory_errors: (errors ? JSON.stringify(errors) : '')})

            if (status?.toUpperCase() == 'FAILURE') {
                log.error(`${this.logValues.name} Failed`, errors)
                this.noticeEmail({
                    subject: `[Notification] Amazon SP Inventory Submit ${this.logValues.name} FAILED`,
                    body: `Amazon SP inventory submit ${this.logValues.name} FAILED due to
                    ${errors.map(err => `${err.code}: ${err.message}`).join('\n')}
                    `
                });
                // throw new Error(`Amazon SP inventory submit ${this.logValues.name} FAILED due to
                // ${errors.map(err => `${err.code}: ${err.message}`).join('\n')}`)
            }

            return status
        }
    }

    return { AmzSP, AmzSPOrder, AmzSPOrderTransaction, AmzSPInventory }
    
});