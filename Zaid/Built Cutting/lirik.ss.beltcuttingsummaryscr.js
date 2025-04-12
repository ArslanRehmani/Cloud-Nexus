/*
 * Copyright (C) 2020 D&D Global, Inc.
 * https://ddglobal.com/
 * All rights reserved
 * Developed for D&D Global, Inc. by:
 *
 * Lirik, Inc.
 * http://lirik.io
 * hello@lirik.io
 */

/*******************************************************************
*
* Name: lirik.ss.beltcuttingsummaryscr.js
*
* @NApiVersion 2.1
* @NScriptType Suitelet
* @version: 1.4.0
*
* Author: Lirik, Inc.
* Purpose: Wire cutting process summary screen
* Script: customscript_lirik_ss_beltcuttingsummscr
* Deploy: customdeploy_lirik_ss_beltcuttingsummscr
*
* ******************************************************************* */

define(['N/ui/serverWidget', './lirik.screenConfig', './lib/lodash_4.17.11_min'], function (serverWidget, scrConfig, _) {

  /**
   * Definition of the Suitelet script trigger point.
   *
   * @param {object} params
   * @param {object} params.request - Encapsulation of the incoming request
   * @param {object} params.response - Encapsulation of the Suitelet response
   * @Since 2015.2
   */
  function onRequest(params) {

    const title = 'onRequest';

    try {

      log.debug({ title, details: 'body ::' + params.request.body });

      let summaryHTML = '';

      if (params.request.body) {

        const body = JSON.parse(params.request.body);

        if (scrConfig.summary && Array.isArray(scrConfig.summary.groupBy) && scrConfig.summary.groupBy.length > 0) {

          const arrGroupBy = JSON.parse(JSON.stringify(scrConfig.summary.groupBy));

          summaryHTML = groupData({ groupBy: arrGroupBy, data: body });
        }

        params.response.setHeader({ name: 'Content-Type', value: 'text/plain' });
        params.response.write({ output: summaryHTML });
      }
    } catch (err) {
      log.error({ title: 'onRequest', details: err });
      throw err;
    }
  }

  const groupData = (params) => {

    const title = 'groupData';

    try {

      log.debug({ title, details: { params } });

      let html = '';

      let groupedHTML = '';
      let groupHeaderHTML = '';
      let contentHTML = '';

      const colorCss = '';

      if (Array.isArray(params.groupBy) && params.groupBy.length > 0 && Array.isArray(params.data) && params.data.length > 0) {

        const groupedData = _.groupBy(params.data, params.groupBy[0].property);

        const groupedDataKeys = Object.keys(groupedData);
        log.debug({ title, details: { groupedDataKeys } });

        if (params.groupBy.length > 1) {

          const subGroup = params.groupBy.splice(1, params.groupBy.length);

          for (let index = 0; index < groupedDataKeys.length; index++) {

            contentHTML = groupData({ groupBy: subGroup, data: groupedData[groupedDataKeys[index]] });

            if (params.groupBy[0].secondHeader) {
              groupHeaderHTML = '<h3 class = "ui-widget-content-data_summary" style="float:left; width:100%' + colorCss + '" >' + '<ul style="float:left; width:100%" >' + '<li style="float:left;" >' + groupedDataKeys[index] + '</li>' + '<li style="float: right;" >' + scrConfig.summary.columns[params.groupBy[0].secondHeader.property].label + ' : ' + _.sumBy(groupedData[groupedDataKeys[index]], params.groupBy[0].secondHeader.property) + '</li>' + '</ul>' + '</h3>';
            } else {
              groupHeaderHTML = '<h3 class = "ui-widget-content-data_summary" style="float:left; width:100%' + colorCss + '" >' + '<ul style="float:left; width:100%" >' + '<li style="float:left;" >' + groupedDataKeys[index] + '</li>' + '</ul>' + '</h3>';
            }

            groupedHTML += '<div id="' + scrConfig.summary.columns[params.groupBy[0].property].id + '_accordion" style="font-size: 13px;" >' + '<div class="group" style="float:left; width:100%" >' + groupHeaderHTML + contentHTML + '</div>' + '</div>';
          }

          html += groupedHTML;

          log.debug({ title, details: { html } });

          return html;
        } else if (params.groupBy.length === 1) {

          for (let index = 0; index < groupedDataKeys.length; index++) {

            contentHTML = getContent({ data: groupedData[groupedDataKeys[index]] });

            if (params.groupBy[0].secondHeader) {

              groupHeaderHTML = '<h3 class = "ui-widget-content-data_summary" style="float:left; width:100%' + colorCss + '" >' + '<ul style="float:left; width:100%" >' + '<li style="float:left;" >' + groupedDataKeys[index] + '</li>' + '<li style="float: right;" >' + scrConfig.summary.columns[params.groupBy[0].secondHeader.property].label + ' : ' + _.sumBy(groupedData[groupedDataKeys[index]], params.groupBy[0].secondHeader.property) + '</li>' + '</ul>' + '</h3>';
            } else {

              groupHeaderHTML = '<h3 class = "ui-widget-content-data_summary" style="float:left; width:100%' + colorCss + '" >' + '<ul style="float:left; width:100%" >' + '<li style="float:left;" >' + groupedDataKeys[index] + '</li>' + '</ul>' + '</h3>';
            }

            groupedHTML += '<div id="' + scrConfig.summary.columns[params.groupBy[0].property].id + '_accordion" style="font-size: 13px;" >' + '<div class="group" style="float:left; width:100%" >' + groupHeaderHTML + contentHTML + '</div>' + '</div>';

          }

          html = '<div>' + groupedHTML + '</div>';
          log.debug({ title: title + ' ** Last **', details: { html } });

          return html;
        }
      }

      return html;
    } catch (err) {
      log.error({ title: 'groupData', details: err });
      throw err;
    }
  }

  const getContent = (params) => {

    const title = 'getContent';

    try {

      log.debug({ title, details: { params } });

      let contentHTML = '';

      if (_.isPlainObject(scrConfig.summary.columns) && Array.isArray(params.data) && params.data.length > 0) {

        const arrColumnsKeys = Object.keys(params.data[0]);

        //! Table Header
        for (let columnIndex = 0; columnIndex < arrColumnsKeys.length; columnIndex++) {

          if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]]) {

            if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].displayType !== serverWidget.FieldDisplayType.HIDDEN) {

              if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].width) {

                contentHTML += '<td style="font-weight: bolder; width:' + scrConfig.summary.columns[arrColumnsKeys[columnIndex]].width + '" >' +
                  scrConfig.summary.columns[arrColumnsKeys[columnIndex]].label + '</td>';
              } else {

                contentHTML += '<td style="font-weight: bolder;" >' +
                  scrConfig.summary.columns[arrColumnsKeys[columnIndex]].label + '</td>';
              }
            }
          }
        }
        contentHTML = '<tr style="font-weight: bolder;" >' + contentHTML + '</tr>';

        //! Table Data
        for (let index = 0; index < params.data.length; index++) {

          contentHTML += '<tr>';
          for (let columnIndex = 0; columnIndex < arrColumnsKeys.length; columnIndex++) {

            if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]]) {

              if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].displayType !== serverWidget.FieldDisplayType.HIDDEN) {

                let value = params.data[index][arrColumnsKeys[columnIndex]];
                if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].isBoolean) {

                  if (value) {

                    if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].true) {
                      value = scrConfig.summary.columns[arrColumnsKeys[columnIndex]].true;
                    } else {
                      value = 'Yes';
                    }

                  } else {

                    if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].false) {
                      value = scrConfig.summary.columns[arrColumnsKeys[columnIndex]].false;
                    } else {
                      value = '';
                    }

                  }
                }

                if (scrConfig.summary.columns[arrColumnsKeys[columnIndex]].width) {

                  contentHTML += '<td style="width:' + scrConfig.summary.columns[arrColumnsKeys[columnIndex]].width + '" >' + value + '</td>';
                } else {

                  contentHTML += '<td>' + value + '</td>';
                }
              }
            }
          }
          contentHTML += '</tr>';
        }

        contentHTML = '<div>' + '<table data-role="table" class="ui-responsive" border = "1" cellspacing="0" cellpadding="10" style="text-align:center" >' + '<tbody>' + contentHTML + '</tbody>' + '</table>' + '</div>';
      }
      log.debug({ title, details: { contentHTML } });

      return contentHTML;
    } catch (err) {
      log.error({ title: 'getContent', details: err });
      throw err;
    }
  }

  return {
    onRequest: onRequest
  };
});
