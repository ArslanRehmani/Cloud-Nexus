/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */
define(['N/file', 'N/log'], function (file, log) {

    function onRequest(context) {
        var title = 'onRequest(::)';
        try {
            var params = context.request.parameters;
            var fileId = params.id;
            var CSVErrorFile = file.load({
                id: fileId
            });
            context.response.writeFile(CSVErrorFile, true);
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }
    }
    return {
        onRequest: onRequest
    }
});
