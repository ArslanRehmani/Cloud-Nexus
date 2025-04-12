/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/log', 'N/record', 'N/search', 'N/url', 'N/http', 'N/runtime', 'N/ui/dialog', 'N/format'], function (log, record, search, url, http, runtime, dialog, format) {

  function getInputData() {
    var campaignArray = [];
    var searchObj = search.create({
      type: "customrecord_info_compaign_rec_report",
      filters:
        [["custrecord_campaign_report_date", "on", "8/22/2023"]],
      columns: ["internalid", "name"]
    });
    var searchResult = searchObj.run().getRange({ start: 0, end: 1000 });
    var linecount = searchResult.length;
    for (var i = 0; i < linecount; i++) {
      var internalId = searchResult[i].getValue({
        name: 'internalid'
      });
      var name = searchResult[i].getValue({
        name: 'name'
      });
      if (internalId && name) {
        campaignArray.push({ internalId, name });
      }
    }
    var getSortedArray = sortDataForSameName(campaignArray);
    return getSortedArray || [];
  }
  function map(context) {
    try {
      var data = JSON.parse(context.value);
      log.debug('Data', data);
      var campaignRepId = data.sameName;
      var campIdArray = [];
      if(data.sameName.length > 0){ 
        var totalOpened = 0;
        var totalClicked = 0;
        var totalBounced = 0;
        var totalUnsubscribed = 0;
        var totalUniqueOpened = 0;
        var totalSuccessfulDelry = 0;
        for(var i = 0; i < campaignRepId.length; i++){
       //   log.debug('CamapignRepordInternalId', campaignRepId[i].internalId);
          var campRecord = record.load({
            type : 'customrecord_info_compaign_rec_report',
            id :  campaignRepId[i].internalId
          });
          if(campaignRepId[i].internalId){
            campIdArray.push(campaignRepId[i].internalId)
          }
          var name = campRecord.getValue('name');
          var date = campRecord.getValue('custrecord_campaign_report_date');
          var opened = campRecord.getValue('custrecord_info_opened') || 0;
          totalOpened += parseInt(opened);
          var clicked = campRecord.getValue('custrecord_info_clicked') || 0;
          totalClicked += parseInt(clicked);
          var bounced = campRecord.getValue('custrecord_info_bounced') || 0;
          totalBounced += parseInt(bounced);
          var unsubscribed = campRecord.getValue('custrecord_info_unsubscribed') || 0;
          totalUnsubscribed += parseInt(unsubscribed);
          var uniqueOpened = campRecord.getValue('custrecord_campaigns_unique_opened_rep') || 0;
          totalUniqueOpened += parseInt(uniqueOpened);
          var successfulDelry = campRecord.getValue('custrecord_mailchimp_report_del') || 0;
          totalSuccessfulDelry += parseInt(successfulDelry);
        }
        var mainCampaign = record.create({type:'customrecord_main_campaign'});
        mainCampaign.setValue('name',name);
        mainCampaign.setValue('custrecord_main_campaign_date',new Date(date));
        mainCampaign.setValue('custrecord_main_campaign_total_opened',totalOpened);
        mainCampaign.setValue('custrecord_main_campaign_total_clicked', totalClicked);
        mainCampaign.setValue('custrecord_main_campaign_total_bounced',totalBounced);
        mainCampaign.setValue('custrecord_main_campa_total_unsubscribed',totalUnsubscribed);
        mainCampaign.setValue('custrecord_main_campaign__unique_opened', totalUniqueOpened);
        mainCampaign.setValue('custrecord_main_campaign_succes_delry', totalSuccessfulDelry);
        var mainCampId = mainCampaign.save({ignoreMandatoryFields:true});
        for(var j = 0; j < campIdArray.length; j++){
          record.submitFields({
                type: 'customrecord_info_compaign_rec_report',
                id: parseInt(campIdArray[j]),
                values: {
                   custrecord_linked_main_campaign: mainCampId
                    },
                options: {
                     enableSourcing: false,
                      ignoreMandatoryFields : true
                    }
               });
        }
      }
    }
    catch (e) {
      log.debug('Exception', e);
    }
  }
  function reduce(context) {
  }

  function sortDataForSameName(array) {
    try {
      var groupedObjects = {};
      var result = [];
      array.forEach(function (obj) {
        var keyword = obj.name.split(' ')[0]; // Get the first word of the name
        if (groupedObjects[keyword]) {
          groupedObjects[keyword].sameName.push(obj);
        } else {
          groupedObjects[keyword] = { sameName: [obj], remaining: [] };
        }
      });
      for (var key in groupedObjects) {
        result.push(groupedObjects[key]);
      }
      return result;
    }
    catch (e) {
      log.error('sortDataForSameName Exception', e.message);
      return [];
    }
  }

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
  }
});