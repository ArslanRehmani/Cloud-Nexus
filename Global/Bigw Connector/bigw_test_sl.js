/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/task', './bigw_lib', 'N/search', 'N/file', 'N/format', '/SuiteScripts/G 2.0/moment-with-locales-timezones.min'],

    function (task, bigwlib, search, file, format, moment) {

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        function onRequest(context) {
            log.debug('request method', context.request.method);
            var dateObj = format.parse({type: format.Type.DATETIME, value: '11/3/2020 4:55 PM'});
            log.debug('date', dateObj);
            log.debug('moment date', moment(dateObj).tz('Australia/Melbourne').format('YYYY-MM-DD HH:mm:ss'));
            if (context.request.method == 'POST' && context.request.body) {
                var orderSubmitTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_bigw_order_mr',
                    deploymentId: 'customdeploy1',
                    params: {custscript_bigw_order_mr_submitted: context.request.body}
                });
                var taskId = orderSubmitTask.submit();
                log.debug('taskId', taskId);
                context.response.write(taskId);
            }


            // var current = moment().tz('Australia/Melbourne').format('YYYYMMDDHHmmss');
            // log.debug('current', current);

            // var now = new Date();
            // var nowISOStr = now.toISOString();
            // log.debug('now ISO string', nowISOStr);
            // var nowStr = format.format({
            //     value: now,
            //     type: format.Type.DATETIME,
            //     timezone: format.Timezone.AUSTRALIA_SYDNEY
            // });
            // log.debug('nowStr', nowStr);
            // var nowISOObj = format.parse({
            //     value: nowISOStr,
            //     type: format.Type.DATETIMETZ,
            //     timezone: format.Timezone.AUSTRALIA_SYDNEY
            // });
            // log.debug('nowISOObj', nowISOObj);
            // var nowObj = format.parse({
            //     value: nowStr,
            //     type: format.Type.DATETIMETZ,
            //     timezone: format.Timezone.AUSTRALIA_SYDNEY
            // });
            // log.debug('nowObj', nowObj);

            // var bigwConn = new bigwlib.bigwSFTP('inventory');
            // log.debug('list root', bigwConn.listDir('error')); 
            // {
            //     "type": "error.SuiteScriptError",
            //     "name": "TypeError",
            //     "message": "execute on foreign object failed due to: UnsupportedTypeException",
            //     "stack": ["Error"],
            //     "cause": {
            //         "message": "execute on foreign object failed due to: UnsupportedTypeException",
            //         "stack": "TypeError: execute on foreign object failed due to: UnsupportedTypeException"
            //     },
            //     "notifyOff": false,
            //     "userFacing": true
            // }

            // var internalidColumn = search.createColumn({name: 'internalid', sort: search.Sort.ASC});
            // var fileSearch = search.create({
            //     type: 'file',
            //     filters: [
            //         ['folder', 'is', '4825389'],
            //         'AND',
            //         ['filetype', 'is', 'JSON']
            //     ],
            //     columns: [
            //         internalidColumn,
            //         // 'internalid',
            //         'name',
            //         'owner',
            //     ]
            // });

            // fileSearch.run().each(function(result) {
            //     log.debug('result', result);
            //     // return true;
            //     // var currentFile = file.load(result.getValue('internalid'));
            //     // var fileContentObj = JSON.parse(currentFile.getContents());

            //     // util.each(fileContentObj.orders, function(orderData) {
            //     //     var bigOrder = new bigwlib.bigwOrder(orderData);
            //     //     log.debug('bigw order', bigOrder);
            //     // });
            // });
        }

        return {
            onRequest: onRequest
        };

    });