/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/log', 'N/search'],
    /**
 * @param{log} log
 * @param{search} search
 */
    (log, search) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            var title = 'get[::]';
            try {
                var newSearch = search.create({
                    type: search.Type.CUSTOMER,
                    title: 'Customer Info Search',
                    columns: ['entityid', 'email', 'phone']
                });

                var searchResults = newSearch.run().getRange({
                    start: 0,
                    end: 10
                });
                var resultsArray = [];
                searchResults.forEach(function (result) {
                    var name = result.getValue('entityid');
                    var email = result.getValue('email');
                    var phone = result.getValue('phone');

                    resultsArray.push({
                        name: name,
                        email: email,
                        phone: phone
                    });
                });

                log.debug('Info', resultsArray);
                var responseBody = {
                    data: resultsArray
                };

                return responseBody;
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }


        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            var title = 'post[::]';
            try {
                log.debug('Hello POST', requestBody);
                return JSON.stringify("Hello POST Request");
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }

        return { get, post }

    });
