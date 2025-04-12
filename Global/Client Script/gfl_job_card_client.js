/**
 * @NApiVersion 2.x
 * 
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/url', 'N/currentRecord'],

function(log, url, currentRecord) {

    function printPDF(jobId, jobTypeId) {
        var jobRecord = currentRecord.get();
        log.debug('current record', jobRecord.getValue('name'));

        log.debug('client script function', 'printPDF');
        // alert('print pdf');
        var paramsObj = {
            job_id: jobId,
            job_type: jobTypeId,
            action: 'print'
        }
        log.debug('paramsObj', paramsObj);
            var pdfLink = generatePDF(paramsObj);
            log.debug('link to generate pdf', pdfLink);
    
            window.open(pdfLink, '_blank');
    }

    function emailPDF(jobId, jobTypeId) {
        var jobRecord = currentRecord.get();
        log.debug('current record', jobRecord.getValue('name'));

        log.debug('client script function', 'emailPDF');

        // if (emailAddress == '' || emailAddress == null) {
        //     alert('Missing email');
        // } else {
            var paramsObj = {
                job_id: jobId,
                job_type: jobTypeId,
                action: 'email'
            }
            var pdfLink = generatePDF(paramsObj);
            log.debug('link to generate pdf', pdfLink);
    
            window.open(pdfLink, '_blank');

            setTimeout(function(){
                window.location.reload(true);
            }, 5000);
        // }
    }

    function generatePDF(paramsObj) {
        return url.resolveScript({
            scriptId: 'customscript_gfl_job_card_sl',
            deploymentId: 'customdeploy1',
            returnExternalUrl: true,
            params: paramsObj
        });

        // var pdfLinkResp = https.get({
        //     url: pdfLink
        // });
        // log.debug('link response', JSON.stringify(pdfLinkResp));
    }

    return {
        printPDF: printPDF,
        emailPDF: emailPDF
    };
    
});
