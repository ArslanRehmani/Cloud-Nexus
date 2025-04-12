/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
// eslint-disable-next-line no-undef
define(['N/sftp','N/log','N/task'],
    function (sftp,log,task) {

        function onRequest(context) {
            if (context.request.method === 'GET') {
                var parms = context.request.parameters;
                var connection = sftp.createConnection({
                    username: parms.username,
                    passwordGuid: parms.passwordGuid,
                    url: parms.url,
                    port: parseInt(parms.port),
                    hostKey: parms.hostKey
                });
                log.debug("connection",connection); 
                // if(connection){
                //     var downloadedFile = connection.download({
                //         filename: '214 Flat File._2AIyxCdUlk6bblBCVJMyng_20221122112726957.csv'
                //     });
                //     downloadedFile.folder = 43596;
                //     var fileId = downloadedFile.save();
                //     log.debug("fileId",fileId); 
                // } 
                // var mapReduce = task.create({
                //     taskType: task.TaskType.MAP_REDUCE,
                //     scriptId: 'customscript_ab_mr_create_shipping_sts',
                //     deploymentId: 'customdeploy_ab_mr_create_shipping_sts'
                // });  
                // var mapReduceId = mapReduce.submit();       
                context.response.write(JSON.stringify(connection));
            } 
        }
        return{
            onRequest:onRequest
        };
    });