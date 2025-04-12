/**
*
@NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 * @NModuleScope public
 */
define(['N/record', 'N/runtime', 'N/search', 'N/https', './crypto-js.min.js'],
    function (record, runtime, search, https, CryptoJSLib) {
        function createTag(context) {
            try {
                var currentRecord = context.newRecord;
                var tagName = currentRecord.getValue('name');
                var memberArray = currentRecord.getValue('custrecord_member_link');
                if (tagName && memberArray.length > 0) {
                    var filters = ["internalid", "anyof"];
                    filters = filters.concat(memberArray);
                    log.debug('filters', filters);
                    var memberEmail = getMemberEmail(filters);
                    if (memberEmail.length > 0) {
                        for (var i = 0; i < memberEmail.length; i++) {
                            var body = { 'tags': [{ 'name': tagName, 'status': "active" }] }
                            body = JSON.stringify(body);
                            var encodedKeys = authorization('afmo', '505b42b3afd460654e9d8eeaca029af8-us4');
                            var headers = {
                                "Authorization": "Basic " + encodedKeys,
                                "Content-Type": "application/json"
                            };
                            var link = `https://us4.api.mailchimp.com/3.0/lists/623e74aa7a/members/${memberEmail[i]}/tags`;
                            var response = https.post({
                                url: link,
                                headers: headers,
                                body: body

                            });
                            var body = response.body;
                            log.debug('body', body);
                        }
                    }
                }
            }
            catch (e) {
                log.error('createTag Exception', e.message);
            }
        }
        function getMemberEmail(filters) {
            try {
                var memberEmailArray = [];
                if (filters.length > 0) {
                    var memberSearch = search.create({
                        type: "customer",
                        filters: [filters],
                        columns: ["email"]
                    });
                    var searchResult = memberSearch.run().getRange({ start: 0, end: 1000 });
                    if (searchResult.length > 0) {
                        for (var i = 0; i < searchResult.length; i++) {
                            var memberEmail = searchResult[i].getValue({
                                name: 'email'
                            });
                            if (memberEmail) memberEmailArray.push(memberEmail);
                        }
                    }
                }
            }
            catch (e) {
                log.error('getMemberEmail Exception', e.message);
            }
            return memberEmailArray;
        }
        function authorization(key, pin) {
            try {
                var keys = key + ":" + pin;
                var encodedKeys = CryptoJSLib.enc.Base64.stringify(CryptoJSLib.enc.Utf8.parse(keys));
                return encodedKeys;
            } catch (e) {
                log.error('Error::authorization', e);
            }
        }
        return {
            onAction: createTag
        }
    });