/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/record', 'N/ui/dialog', 'N/email','N/runtime'], function (log, record, dialog, email,runtime) {

    function saveRecord(context) {
        var title = 'saveRecord(::)';
        try {
            var rec = context.currentRecord;
            var currentRecIDExit = context.currentRecord.id;
            log.debug('currentRecIDExit Id', currentRecIDExit);
             if(currentRecIDExit){
               return true;
             }else{
                var customerId = rec.getValue({ fieldId: 'entity' });
                var invTotal = rec.getValue({ fieldId: 'total' });
                var customerName = rec.getText({ fieldId: 'entity' });
                var customerOBJ = record.load({
                    type: 'customer',
                    id: parseInt(customerId)
                });
                var userID = runtime.getCurrentUser().id;
                log.debug('user Id', userID);
                var creditLimit = customerOBJ.getValue({ fieldId: 'creditlimit' });
                var creditHoldOverRide = customerOBJ.getValue({ fieldId: 'creditholdoverride' });
                // if (creditHoldOverRide == "AUTO" && (invTotal > creditLimit)) {
                    // alert('heloo');
                    // email.send({
                    //     author: userID,
                    //     recipients: assignedTo,
                    //     cc: multiSelectArray,
                    //     subject: "Task is " + taskStatus + "",
                    //     body: 'The following task has been assigned to you by ' + EmpName + ' in Pelmorex Corp. <br /> <br />\
                    //         Information regarding the task has been posted below.<br />\
                    //         To view the task record, log in to NetSuite then navigate to: https://4506264-sb2.app.netsuite.com/app/crm/calendar/task.nl?id='+ rec.id + ' <br /> <br />\
                    //         <b>Task:</b> '+ taskTitle + '<br />\
                    //         <b>Priority:</b> '+ taskPriority + '<br />\
                    //         <b>Status:</b> '+ taskStatus + '<br />\
                    //         <b>Start Date:</b> '+ taskStartDate + '<br />\
                    //         <b>Due Date:</b> '+ taskDueDate + '<br />\
                    //         <b>Associated companies, contacts:</b> '+ CompanyName + ''
                    // });
                    // return false;
                // }
            }
            return true;
        } catch (e) {
            log.debug('Exception ' + title, e.message);
        }

    }
    return {
        saveRecord: saveRecord
    }
});
