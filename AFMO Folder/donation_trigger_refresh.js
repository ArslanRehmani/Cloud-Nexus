/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

/************SCRIPT INFORMATION***********************
+-------------------------------------------------------------------------------------------------------------------------------+
|   Version |   Author                           |      Date            |       Remarks                                         |
+-------------------------------------------------------------------------------------------------------------------------------+
|   1.0     |                                    |                      |       Initial version                                 |
|   2.0     |   IAS                              |      09-Apr-2022     |       Refine & Update logic                           |
+-------------------------------------------------------------------------------------------------------------------------------+
*/

define(['N/record', 'N/redirect', 'N/log', 'N/task'],

function(record, redirect, log, task) {

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {string} scriptContext.type - Trigger type
   * @param {Form} scriptContext.form - Current form
   * @Since 2015.2
   */
  function beforeLoad(scriptContext) {

  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function beforeSubmit(scriptContext) {

  }

  /**
   * Function definition to be triggered before record is loaded.
   *
   * @param {Object} scriptContext
   * @param {Record} scriptContext.newRecord - New record
   * @param {Record} scriptContext.oldRecord - Old record
   * @param {string} scriptContext.type - Trigger type
   * @Since 2015.2
   */
  function afterSubmit(scriptContext) {

    log.debug('afterSubmit', scriptContext.type);

    // get record values
    var newRec = scriptContext.newRecord;
    log.debug('newRec - ' + newRec.id, newRec.type);

    var donorId = newRec.getValue({fieldId: 'entity'});

    var scDonorIds = [];
    var softCreditsCount = newRec.getLineCount({
      sublistId: 'recmachcustrecord_npo_sc_btid'
    });

    log.debug('softCreditsCount', softCreditsCount);

    for (var index = 0; index < softCreditsCount; index++) {

      var scDonorId = newRec.getSublistValue({
        sublistId: 'recmachcustrecord_npo_sc_btid',
        fieldId: 'custrecord_npo_sc_constituent',
        line: index
      });

      scDonorIds.push(scDonorId);
    }

    var params = {eventType: scriptContext.type, recType: newRec.type, recId: newRec.id, donorId: donorId, scDonorIds: scDonorIds.join(',')};

    submitTask('customdeploy', 1, params);

    // redirect.toSuitelet({
    //   scriptId: 'customscript_reload_donor_record' ,
    //   deploymentId: 'customdeploy_reload_donor_record',
    //   parameters: {
    //     'eventType': scriptContext.type,
    //     'donationRecord': scriptContext.newRecord.id,
    //     'recordType': scriptContext.newRecord.type
    //   }
    // });
  }

  function submitTask(deploymentPrefix, index, params) {

    try {

      // call scheduled script
      var scriptTask = task.create({
        taskType: task.TaskType.SCHEDULED_SCRIPT,
        scriptId: 'customscript_ias_ss_reload_donor',
        deploymentId: deploymentPrefix + index,
        params: {'custscript_ias_ss_event_type': params.eventType,
                 'custscript_ias_ss_rec_type': params.recType,
                 'custscript_ias_ss_rec_id': params.recId,
                 'custscript_ias_ss_donor_id': params.donorId,
                 'custscript_ias_ss_sc_donor_ids': params.scDonorIds}
      });
      var scriptTaskId = scriptTask.submit();

      log.debug('checkifscheduled - ' + index, 'scriptTaskId = ' + scriptTaskId);
    }
    catch(error) {

      log.debug('Catch ERROR - ' + index, error);

      if (error.name == 'FAILED_TO_SUBMIT_JOB_REQUEST_1') {

        var newIndex = (index == 7) ? 1 : index + 1;
        submitTask(deploymentPrefix, newIndex, params);
      }
    }
  }


  return {
    // beforeLoad: beforeLoad,
    // beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit
  };

});
