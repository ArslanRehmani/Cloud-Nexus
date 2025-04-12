/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

 /************SCRIPT INFORMATION***********************
+-------------------------------------------------------------------------------------------------------------------------------+
|   Version |   Author                           |      Date            |       Remarks                                         |
+-------------------------------------------------------------------------------------------------------------------------------+
|   1.0     |   IAS                              |      13-Apr-2022     |       Initial Version                                 |
+-------------------------------------------------------------------------------------------------------------------------------+
*/

define(['N/search', 'N/record', 'N/log'],

function(Search, Record, Log) {

  var SEARCH_UNSYNCED = "customsearch_ias_donor_update_script";
  var DEFAULT_PAGESIZE = 400;

  /**
   * Marks the beginning of the Map/Reduce process and generates input data.
   *
   * @typedef {Object} ObjectRef
   * @property {number} id - Internal ID of the record instance
   * @property {string} type - Record type id
   *
   * @return {Array|Object|Search|RecordRef} inputSummary
   * @since 2015.1
   */
  function getInputData() {

    try {
      var idArray = [];

      var searchUnsynced = Search.load({
        id: SEARCH_UNSYNCED,
        type: Search.Type.CUSTOMER
      });

      var searchCount = searchUnsynced.runPaged().count;
      Log.debug('searchCount', searchCount);

      if (searchCount) {

        var pagedData = searchUnsynced.runPaged({pageSize: DEFAULT_PAGESIZE});

        var firstPage = pagedData.fetch({index: 0});
        firstPage.data.forEach(function(result){
          idArray.push(parseInt(result.id));
        });
      }

      Log.debug('Total Records', idArray.length);
      // Log.debug('idArray', idArray);
      return idArray;
      // return [598, 773, 517, 584, 726, 787, 720, 721, 885, 988, 1205, 148, 999, 1184, 1028, 906, 937, 946, 878, 1211, 912, 1219, 1004, 1462, 1657, 1492, 1262, 1228, 1605, 1341, 1465, 1656, 1477, 1512, 1659, 1498, 1232, 1238, 1669, 1342];
    }
    catch (error) {
      Log.debug('Catch ERROR', error);
      return [];
    }
  }

  /**
   * Executes when the map entry point is triggered and applies to each key/value pair.
   *
   * @param {MapSummary} context - Data collection containing the key/value pairs to process through the map stage
   * @since 2015.1
   */
  function map(context) {

    var donorId = context.value;

    Log.debug('donorId', donorId);

    try {

      var donorRec = Record.load({
        type: Record.Type.CUSTOMER,
        id: donorId
      });

      /**
       *  Individual Giving and Sub constituents Total Calculation Start
       */
      Log.debug('Individual Giving', 'Start');

      var allTransSearch = Search.load({
        type: Search.Type.TRANSACTION,
        id: 'customsearch_get_all_donor_transactions'   // Type: Pledge, Donation, Historic Gift
      });
      var currExpression = allTransSearch.filterExpression;

      // 'custbody_donor' : Historic Gift, Pledge, Soft Pledge
      currExpression.push("AND", [[ "custbody_donor", "anyof", donorId ], "OR", [ "customersubof", "anyof", donorId]]);
      allTransSearch.filterExpression = currExpression;

      var individualGivingTotal = 0;
      var subconstituentsTotal = 0;
      var latestTransactionId = "";
      var currentLatestDate = "";
      var firstTransactionId = "";
      var currentFirstDate = "";
      var largestTransactionId = "";
      var currentLargestAmount = 0;
      var numberOfGifts = 0;

      var latestPledgeId = "";
      var latestPledgeDate = "";
      var latestTransWPledgeId = "";
      var latestTransWPledgeDate = "";

      allTransSearch.run().each(function(result) {

        var internalId = result.getValue({name: 'internalid'});
        var amount = parseFloat(result.getValue({name: 'amount'}));
        var donor = result.getValue({name: 'custbody_donor'});
        var date = new Date(result.getValue({name: 'trandate'}));
        var type = result.getValue({name: 'type'});

        if (type != "CustInvc") { // Donation, Historic Gift

          numberOfGifts++;

          if (donor == donorId) { individualGivingTotal += amount; }
          else { subconstituentsTotal += amount; }

          // Get First Gift
          if (currentFirstDate == "" || date < currentFirstDate) {
            currentFirstDate = date;
            firstTransactionId = internalId;
          }

          // Get Latest Gift
          if (currentLatestDate == "" || date > currentLatestDate) {
            currentLatestDate = date;
            latestTransactionId = internalId;
          }
        }
        else { // Pledge

          // Get Latest Pledge
          if (latestPledgeDate == "" || date > latestPledgeDate) {
            latestPledgeDate = date;
            latestPledgeId = internalId;
          }
        }

        // Get largest Gift
        if (currentLargestAmount == 0 || amount > currentLargestAmount) {
          currentLargestAmount = amount;
          largestTransactionId = internalId;
        }

        // Get Latest Transaction with Pledges
        if (latestTransWPledgeDate == "" || date > latestTransWPledgeDate) {
          latestTransWPledgeDate = date;
          latestTransWPledgeId = internalId;
        }

        return true;
      });

      donorRec.setValue({
        fieldId: 'custentity_sub_constituents_total',
        value: subconstituentsTotal
      });
      donorRec.setValue({
        fieldId: 'custentity_individual_giving_total',
        value: individualGivingTotal
      });

      /**
       *  Soft Credit Total Calculation Start
       */
      Log.debug('Soft Credit start', 'numberOfGifts = ' + numberOfGifts);

      var softcreditsSearch = Search.load({
        type: 'customrecord_npo_soft_credit',
        id: 'customsearch_atlas_soft_credit_sblst_2'  // "ACS - Constituent Soft Credits"
      });

      var getParent = Search.createColumn({
        name: 'parent',
        join: 'custrecord_npo_sc_constituent',
      });
      softcreditsSearch.columns.push(getParent);

      var subconsituentFilter = Search.createFilter({
        name: 'parent',
        join: 'custrecord_npo_sc_constituent',
        operator: Search.Operator.ANYOF,
        values: [donorId]
      });

      softcreditsSearch.filters.push(subconsituentFilter);
      var currentSoftCreditTotal = 0

      softcreditsSearch.run().each(function(result) {

        numberOfGifts++;

        var billingTranId = result.getValue({name: 'custrecord_npo_sc_btid'});
        var date = new Date(result.getValue({name: 'custrecord1'}));
        var amount = parseFloat(result.getValue({name: 'custrecord_npo_sc_amount'}));
        currentSoftCreditTotal += amount;

        // Get First Gift
        if (currentFirstDate == "" || date < currentFirstDate) {
          currentFirstDate = date;
          firstTransactionId = billingTranId;
        }

        // Get Latest Gift
        if (currentLatestDate == "" || date > currentLatestDate) {
          currentLatestDate = date;
          latestTransactionId = billingTranId;
        }

        // Get Latest Transaction with Pledges
        if (latestTransWPledgeDate == "" || date > latestTransWPledgeDate) {
          latestTransWPledgeDate = date;
          latestTransWPledgeId = billingTranId;
        }

        // Get largest Gift
        if (currentLargestAmount == 0 || amount > currentLargestAmount) {
          currentLargestAmount = amount;
          largestTransactionId = billingTranId;
        }

        return true;
      });

      donorRec.setValue({
        fieldId: 'custentity_soft_giving_total',
        value: currentSoftCreditTotal
      });

      /**
       *  Gift Fields Calculation Start
       */
      Log.debug('Gift Fields', 'start');

      donorRec.setValue({
        fieldId: 'custentity_afmo_num_gift',
        value: numberOfGifts
      });
      donorRec.setValue({
        fieldId: 'custentity_afmo_first_gift_tx',
        value: firstTransactionId
      });
      donorRec.setValue({
        fieldId: 'custentity_afmo_latest_gift_tx',
        value: latestTransactionId
      });
      donorRec.setValue({
        fieldId: 'custentity_afmo_max_gift_tx',
        value: largestTransactionId
      });
      donorRec.setValue({
        fieldId: 'custentity_last_transaction',
        value: latestTransWPledgeId
      });
      donorRec.setValue({
        fieldId: 'custentity_last_pledge',
        value: latestPledgeId
      });

      var giftArr = ['custentity_afmo_first_gift_tx', 'custentity_afmo_latest_gift_tx','custentity_afmo_max_gift_tx', 'custentity_last_transaction', 'custentity_last_pledge'];
      var giftAmountFields = ['custentity_first_donation_amount', 'custentity_last_donation_amount', 'custentity_largest_donation_amount', 'custentity_last_transaction_amount', 'custentity_last_pledge_amount'];

      for (var i = 0; i < giftArr.length; i++) {

        var tranId = donorRec.getValue({
          fieldId: giftArr[i]
        });

        if (tranId != "" && tranId != null) {

          var amount = Search.lookupFields({
            type: Search.Type.TRANSACTION,
            id: tranId,
            columns: ['amount']
          }).amount;

          donorRec.setValue({
            fieldId: giftAmountFields[i],
            value: parseFloat(amount)
          });
        }
      }

      /**
       *  Pledges Calculation Start
       */
      Log.debug('Pledges', 'start');

      var pledgeSearch = Search.load({
        type: Search.Type.TRANSACTION,
        id: 'customsearchpledges'
      });
      var originalColumns = pledgeSearch.columns;

      var newColumns=[];
      for (var c = 0; c < originalColumns.length; c++) {

        if (originalColumns[c].name == "internalid") {

          newColumns.push(Search.createColumn({
            name: 'entity',
            summary: Search.Summary.GROUP
          }));

          newColumns.push(Search.createColumn({
            name: "internalid",
            summary: Search.Summary.COUNT
          }));
        }
        else if (!(originalColumns[c].name == "trandate" || originalColumns[c].name == "tranid")) {

          newColumns.push(Search.createColumn({
            name: originalColumns[c].name,
            summary: Search.Summary.SUM
          }));
        }
      }
      pledgeSearch.columns = newColumns;

      pledgeSearch.filters.push(Search.createFilter({
        name: 'customersubof',
        join: null,
        operator: Search.Operator.ANYOF,
        values: [donorId]
      }));

      var pledgeResults = pledgeSearch.run().getRange({
        start: 0,
        end: 1
      });

      var pledgeTotal = 0;
      var pledgePaid  = 0;
      var pledgeDue = 0;
      var pledgeCtr = 0;

      if (pledgeResults.length == 1) {

        pledgeTotal = pledgeResults[0].getValue({
          name: 'total',
          summary: Search.Summary.SUM
        });
        pledgePaid = pledgeResults[0].getValue({
          name: 'amountpaid',
          summary: Search.Summary.SUM
        });
        pledgeDue = pledgeResults[0].getValue({
          name: 'amountremaining',
          summary: Search.Summary.SUM
        });
        pledgeCtr = pledgeResults[0].getValue({
          name: 'internalid',
          summary: Search.Summary.COUNT
        });
      }

      donorRec.setValue({
        fieldId: 'custentity_pledge_total',
        value: parseFloat(pledgeTotal)
      });
      donorRec.setValue({
        fieldId: 'custentity_pledge_received',
        value: parseFloat(pledgePaid)
      });
      donorRec.setValue({
        fieldId: 'custentity_pledge_due',
        value: parseFloat(pledgeDue)
      });
      donorRec.setValue({
        fieldId: 'custentity_total_pledge_payments',
        value: pledgeCtr
      });

      /**
       *  Total Giving  Calculation Start
       */
      Log.debug('Total Giving', 'start');

      if (donorId == 11236 || donorId == 11711 || donorId == 598 || donorId == 12567) {
        donorRec.setValue({
          fieldId: 'custentity_afmo_life_giving',
          value: parseFloat(individualGivingTotal) + parseFloat(currentSoftCreditTotal) + parseFloat(subconstituentsTotal)
        });
      }
      else {
        donorRec.setValue({
          fieldId: 'custentity_afmo_life_giving',
          value: parseFloat(individualGivingTotal) + parseFloat(currentSoftCreditTotal) + parseFloat(subconstituentsTotal) + parseFloat(pledgeTotal)
        });
      }

      donorRec.setValue('custentity_ias_donor_updated', true);

      var newId = donorRec.save({ignoreMandatoryFields: true});
      Log.debug('Donor is updated', newId);
    }
    catch (error) {
      Log.debug('Catch ERROR', error);
    }
  }

  /**
   * Executes when the reduce entry point is triggered and applies to each group.
   *
   * @param {ReduceSummary} context - Data collection containing the groups to process through the reduce stage
   * @since 2015.1
   */
  function reduce(context) {

  }


  /**
   * Executes when the summarize entry point is triggered and applies to the result set.
   *
   * @param {Summary} summary - Holds statistics regarding the execution of a map/reduce script
   * @since 2015.1
   */
  function summarize(summary) {
    // Create a log entry showing each full serialized error
    summary.mapSummary.errors.iterator().each(
      function (key, error, executionNo) {
        log.error({
          title: 'Map error for key: ' + key + ", execution no.  " + executionNo,
          details: error
        });
        return true;
      }
    );
  }

  return {
     config:{
      retryCount: 3,
      exitOnError: true
     },

    getInputData: getInputData,
    map: map,
//        reduce: reduce,
    summarize: summarize
  };

});
