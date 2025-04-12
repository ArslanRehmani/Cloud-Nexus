/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

 /************SCRIPT INFORMATION***********************
+-------------------------------------------------------------------------------------------------------------------------------+
|   Version |   Author                           |      Date            |       Remarks                                         |
+-------------------------------------------------------------------------------------------------------------------------------+
|   1.0     |   IAS                              |      09-Apr-2022     |       Initial Version                                 |
+-------------------------------------------------------------------------------------------------------------------------------+
*/

define(['N/log', 'N/record', 'N/search', 'N/runtime'],
/**
 * @param {log} log
 * @param {record} record
 * @param {search} search
 */
function(log, record, search, runtime) {

  /**
   * Definition of the Scheduled script trigger point.
   *
   * @param {Object} scriptContext
   * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
   * @Since 2015.2
   */
  function execute(scriptContext) {

    // get parameters from UE scripts 358, 1009
    var script = runtime.getCurrentScript();
    var eventType = script.getParameter({name: 'custscript_ias_ss_event_type'});
    var recType = script.getParameter({name: 'custscript_ias_ss_rec_type'});
    var recId = script.getParameter({name: 'custscript_ias_ss_rec_id'});
    var donorId = script.getParameter({name: 'custscript_ias_ss_donor_id'});
    var scDonorIdString = script.getParameter({name: 'custscript_ias_ss_sc_donor_ids'});

    log.debug('Starting', eventType + ',' + recType + ',' + recId);
    log.debug('donorId = ' + donorId, "scDonorIdString = " + scDonorIdString);

    if (recType == 'customrecord_npo_soft_credit') {

      if (!isEmpty(donorId)) {

        var donorRec = record.load({
          type: record.Type.CUSTOMER,
          id: donorId
        });
        donorRec.save({ignoreMandatoryFields: true});
        log.debug('Donor is updated', donorId);
      }
      return;
    }

    if ((eventType == 'create') || (eventType == 'edit')) {

      var tranRec = record.load({
        type: recType,
        id: recId
      });

      // Refresh Entity record
      var donorId = tranRec.getValue({fieldId: 'entity'});
      var donorRec = record.load({
        type: record.Type.CUSTOMER,
        id: donorId
      });
      donorRec.save({ignoreMandatoryFields: true});
      log.debug('Donor is updated', donorId);

      if (recType == "cashsale") {

        var softCreditsCount = tranRec.getLineCount({
          sublistId: 'recmachcustrecord_npo_sc_btid'
        });

        // Save and Load all Donors listed under the Soft Credit tab of the Donation record.
        for (var index = 0; index < softCreditsCount; index++) {

          var donorId = tranRec.getSublistValue({
            sublistId: 'recmachcustrecord_npo_sc_btid',
            fieldId: 'custrecord_npo_sc_constituent',
            line: index
          });

          var donorRecord = record.load({
            type: record.Type.CUSTOMER,
            id: donorId
          });
          donorRecord.save({ignoreMandatoryFields: true});
          log.debug('Donor is updated for Soft Credit', donorId);
        }
      }
    }
    else if (eventType == 'delete') {

      // Refresh Entity record
      var donorRec = record.load({
        type: record.Type.CUSTOMER,
        id: donorId
      });
      donorRec.save({ignoreMandatoryFields: true});
      log.debug('Donor is updated', donorId);

      if (recType == "cashsale") {

        if ((scDonorIdString == null) || (scDonorIdString == '')) {
          return;
        }

        var scDonors = scDonorIdString.split(',');

        for (var index = 0; index < scDonors.length; index++) {

          var donorRecord = record.load({
            type: record.Type.CUSTOMER,
            id: scDonors[index]
          });
          donorRecord.save({ignoreMandatoryFields: true});
          log.debug('Donor is updated for Soft Credit', donorId);
        }
      }
    }
  }

  function isEmpty(stValue) {

    if ((stValue === '') || (stValue == null) || (stValue == undefined) || (stValue.length == 0)) {
      return true;
    }
    return false;
  }

  return {
    execute: execute
  };
});
