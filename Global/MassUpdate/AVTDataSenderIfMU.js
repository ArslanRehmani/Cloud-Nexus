'use strict';
/**
 *@NApiVersion 2.0
 *@NScriptType MassUpdateScript
 * @NModuleScope SameAccount
 */
define([ 'N/log', 'N/url', 'N/ui/serverWidget' ,'N/https', 'N/runtime', 'N/record', 'N/search', 'N/task', 'N/format', 'N/error', './Entity', './Common', './CubiicConnecter', './AvtLicenseChecker', './DataSenderIf', './lib/AVT_LoggerLib2-1-0-2'],
/**
     *
     * @param {log} nsLog
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
	 * @param dataSender
	 * @param logger
     * @return {{each: each}}
     */
    function(nsLog, nsUrl ,nsWindow,  nsHttps, nsRuntime, nsRecord, nsSearch, nsTask, nsFormat, nsError, entity, common, cConnecter, avtLicense, dataSender, logger) {
        function each(params) {
            var id = params.id;
            var type = params.type;
            nsLog.debug('ifId = ' + id);
            var headerObj = {
                name: 'Accept-Language',
                value: 'en-us'
            };
          
           var currentEmployeeId = nsRuntime.getCurrentUser().id;
           log.error('currentEmployeeId',currentEmployeeId)
          
          
          
            var suiteletURL = nsUrl.resolveScript({
                                                  scriptId:'customscript_avt_cubiic_sender_if',
                                                  deploymentId: 'customdeploy_avt_cubiic_sender_if',
                                                  returnExternalUrl: true

                                                  });
            nsLog.debug('ifId = ' + suiteletURL);
	        var response = nsHttps.get({
		                   //url: 'https://1117015-sb1.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=3204&deploy=1&compid=1117015_SB1&h=668b6e9843b0d847c8bf&ifid='+ id,
		                   //url: 'https://1117015-sb1.app.netsuite.com' + suiteletURL +  '&ifid=' + id,
		                   url:suiteletURL +  '&ifid=' + id +'&userid='+currentEmployeeId,
		                   body: headerObj
	                       });



           /* var parameters= '';
            var suiteletURL = url.resolveScript({
                                      scriptId:'customscript_avt_cubiic_sender_if',
                                      deploymentId: 'customdeploy_avt_cubiic_sender_if',
                                      params: {
                              	      'IF_ID':id,
                                      }

                                      });
            var response = https.post({
                              url: suiteletURL,
                              body: parameters
                              });
            log.debug(response.body.toString());*/

	        /*var resultObj = {
            				succeed: false,
            				errorMessage: ''
            			};

				if (id) {
					var processResult = dataSender._processToSendData(id);
					resultObj.succeed = processResult.succeed;
					if (!resultObj.succeed) {
						resultObj.errorMessage = processResult.logMessage;
					}
				}

            nsLog.debug('resultObj = ' +JSON.stringify(resultObj));*/
           /* nsLog.debug('ifId = ' + id);

                var suiteletURL = nsUrl.resolveScript({
                    scriptId: 'customscript_avt_cubiic_sender_if',
                    deploymentId: 'customdeploy_avt_cubiic_sender_if',
                    returnExternalUrl: false
                });
                suiteletURL = suiteletURL + + '&ifid=' + id;
                window.open(suiteletURL, "_self");*/


        }
        return {
            each: each
        };
    }
);
