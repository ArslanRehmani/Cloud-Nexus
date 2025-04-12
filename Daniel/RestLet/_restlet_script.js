/**
 * @NApiVersion 2.0
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/file'],
    /**
     * @param {log} log
     * @param {file} file
     */
    function (log, file) {
        /**
         * Function called upon sending a POST request to the RESTlet.
         *
         * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
         * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
         * @since 2015.2
         */
        function post(requestBody) {
            try {
                var fileName = requestBody.filename || '';
                var fileType = !!(requestBody.hasOwnProperty('file_type')) ? requestBody.file_type : '';
                var imgB64 = requestBody.rImage || '';
                var fileObj;
                    fileObj = file.create({
                        name: fileName,
                        fileType: file.Type.PNGIMAGE,
                        contents: imgB64,
                        folder: 3927432, //Product2
                        isOnline: true
                    });
                // Save the file
                var id = fileObj.save();
                log.debug({
                    title: 'Image file folder ID',
                    details: id
                });
                // return "HEllo";
            } catch (e) {
                log.error({ title: e.title, details: e.message });
            }
        }
        return {
            'post': post
        };

    });