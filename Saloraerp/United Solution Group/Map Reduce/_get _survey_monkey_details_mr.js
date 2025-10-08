/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/https', 'N/log', 'N/runtime', 'N/record', 'N/search', 'N/format'], function (https, log, runtime, record, search, format) {

  function getInputData() {
    try {
      var url = `https://api.surveymonkey.com/v3/groups`;
      var headers = {
        'Authorization': 'Bearer cOmUpOXfevWx560egh1njnpiSJc4aZ0V3SH.dvkYpytj.opn4GI0dSx5KVqGNtf-Qkurxqx9Ecdqx6abZegalckd8M-qTYSz5vW-WeqpazHcmK8UHEJeLWn6NU4QPGBF',
        'Content-Type': 'application/json'
      };
      log.debug('url', url)
      
      var response = https.get({
        url: url,
        headers: headers
      });

      if (response.code === 200) {
        var responseData = JSON.parse(response.body);
        log.debug('Response Data', responseData);
        
        var inputData = responseData.data || []; 
        log.debug('Input Data for MapReduce', inputData);

        return inputData;  
      } else {
        log.error('Request Error', 'There was a problem with the request: ' + response.body);
        return [];  
      }
    } catch (error) {
      log.error('getInputData Exception', error);
      return [];  
    }
  }

  function map(context) {
    try {
      var value = JSON.parse(context.value); 
      log.debug('Map Stage Data', value);

    } catch (error) {
      log.error('Map Exception', error);
    }
  }

  function reduce(context) { }

  function summarize(summary) { }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
  };
});
