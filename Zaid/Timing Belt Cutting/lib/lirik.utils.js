/*******************************************************************
 *
 *
 * Name: lirik.utils.js
 * Script Type: library
 * @version: 0.1.0
 *
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 *
 * Author: Lirik Inc.
 * Purpose: Library for all the utitity api
 *
 *
 * ******************************************************************* */

define(['N/runtime', 'N/task', './lodash_4.17.11_min'], utils);

function utils(runtime, task, _) {

  function checkInteger(value) {
    try {
      return /^[-]*\d+$/.test(value);
    } catch (err) {
      log.error('utils.checkInteger', err);
      throw err;
    }
  }

  function debug(title, details) {
    try {
      if (typeof details === 'object') {
        log.debug(title, JSON.stringify(details));
      } else {
        log.debug(title, details);
      }
    } catch (err) {
      log.error('utils.log', err);
      throw err;
    }
  }

  function formatData(params) {
    try {
      /*
      debug('utils.formatData', {
        params: params
      });
      */
      if (params.mapping.type === 'boolean') {
        return params.value === 'T' ? true : false;
      } else if (params.mapping.type === 'currency') {
        return Number(params.value).toFixed(2);
      } else if (params.mapping.type === 'number') {
        return Number(params.value);
      } else {
        return params.value;
      }
    } catch (err) {
      log.error('utils.formatData', err);
      throw err;
    }
  }

  function getRecordFieldValues(params) {
    try {

      if (!params.recordObject) {
        params.recordObject = {};
      }

      for (var key in params.fieldMapping) {

        if (params.fieldMapping.hasOwnProperty(key) && key === 'fields') {

          params.recordObject.fields = {};
          var arrFieldKeys = Object.keys(params.fieldMapping.fields);
          for (var fieldKeyIndex = 0; fieldKeyIndex < arrFieldKeys.length; fieldKeyIndex++) {

            var fieldKey = arrFieldKeys[fieldKeyIndex];
            var fieldMap = params.fieldMapping.fields[fieldKey];

            if (fieldMap.isText) {
              params.recordObject.fields[fieldKey] = params.nsRecord.getText({
                'fi​e​l​d​I​d': fieldMap.nsId
              }) || null;
            } else {
              params.recordObject.fields[fieldKey] = params.nsRecord.getValue({
                'fi​e​l​d​I​d': fieldMap.nsId
              }) || null;
            }

            params.recordObject.fields[fieldKey] = formatData({
              'mapping': fieldMap,
              'value': params.recordObject.fields[fieldKey]
            });
          }
        } else if (params.fieldMapping.hasOwnProperty(key) && key === 'lineitems') {

          params.recordObject.lineitems = {};
          var arrLineItemKeys = Object.keys(params.fieldMapping.lineitems);

          for (var lineItemKeyIndex = 0; lineItemKeyIndex < arrLineItemKeys.length; lineItemKeyIndex++) {

            var lineItemKey = arrLineItemKeys[lineItemKeyIndex];
            var lineItemMap = params.fieldMapping.lineitems[lineItemKey];

            var lineItemName = lineItemKey;
            if (lineItemMap.name) {
              lineItemName = lineItemMap.name;
            }

            params.recordObject.lineitems[lineItemName] = [];

            var listItemLinesCount = params.nsRecord.getLineCount({
              'sublistId': lineItemKey
            });

            /*
            debug('utils.getRecordFieldValues', {
              params.recordObject: params.recordObject
            });
            debug('utils.getRecordFieldValues', {
              listItemLinesCount: listItemLinesCount
            });
            */

            for (var currline = 0; currline < listItemLinesCount; currline++) {
              params.nsRecord.selectLine({
                'sublistId': lineItemKey,
                'line': currline
              });

              var lineItemData = {};
              var arrLineItemFieldKeys = Object.keys(lineItemMap.fields);
              for (var lineItemFieldKeyIndex = 0; lineItemFieldKeyIndex < arrLineItemFieldKeys.length; lineItemFieldKeyIndex++) {

                var lineItemFieldKey = arrLineItemFieldKeys[lineItemFieldKeyIndex];
                var lineItemFieldMap = lineItemMap.fields[lineItemFieldKey];

                if (lineItemFieldMap.isText) {
                  lineItemData[lineItemFieldKey] = params.nsRecord.getCurrentSublistText({
                    'sublistId': lineItemKey,
                    'fieldId': lineItemFieldMap.nsId
                  }) || null;
                } else {
                  lineItemData[lineItemFieldKey] = params.nsRecord.getCurrentSublistValue({
                    'sublistId': lineItemKey,
                    'fieldId': lineItemFieldMap.nsId
                  }) || null;
                }

                lineItemData[lineItemFieldKey] = formatData({
                  'mapping': lineItemFieldMap,
                  'value': lineItemData[lineItemFieldKey]
                });
              }

              params.recordObject.lineitems[lineItemName].push(lineItemData);
            }
          }
        }
      }

      params.recordObject.recordId = params.nsRecord.id;
      params.recordObject.recordType = params.nsRecord.type;

      debug('utils.getRecordFieldValues', {
        recordObject: params.recordObject
      });

      return params.recordObject;
    } catch (err) {
      log.error('utils.getRecordFieldValues', err);
      throw err;
    }
  }

  function getScriptParameters(params) {
    try {
      debug('utils.getScriptParameters', { params: params });
      var scrParamKeys = Object.keys(params);

      if (scrParamKeys && scrParamKeys.length > 0) {

        var scriptParams = {};

        var _nsScriptRec = runtime.getCurrentScript();

        for (var scrParamIndex = 0; scrParamIndex < scrParamKeys.length; scrParamIndex++) {

          scriptParams[scrParamKeys[scrParamIndex]] = _nsScriptRec.getParameter({
            name: params[scrParamKeys[scrParamIndex]]
          });
        }

        debug('utils.getScriptParameters', { scriptParams: scriptParams });

        return scriptParams;
      }
    } catch (err) {
      log.error('utils.getScriptParameters', err);
      throw err;
    }
  }

  function getSearchValues(searchResult) {
    try {
      if (searchResult) {
        var searchResultValues = { id: searchResult.id, recordType: searchResult.recordType };
        for (var columnIndex = 0; columnIndex < searchResult.columns.length; columnIndex++) {
          if (searchResult.columns[columnIndex].join) {
            searchResultValues[searchResult.columns[columnIndex].join + '.' + searchResult.columns[columnIndex].name] = searchResult.getValue(searchResult.columns[columnIndex]);
          } else {
            searchResultValues[searchResult.columns[columnIndex].name] = searchResult.getValue(searchResult.columns[columnIndex]);
          }
        }
        debug('utils.getSearchValues', { searchResultValues: searchResultValues });
        return searchResultValues;
      }
    } catch (err) {
      log.error('utils.getSearchValues', err);
      throw err;
    }
  }

  function getSearchValuesWithText(params) {
    try {
      var searchResultValues = {};
      for (var columnIndex = 0; columnIndex < params.columns.length; columnIndex++) {

        if (params.columns[columnIndex].join) {
          searchResultValues[params.columns[columnIndex].join + '.' + params.columns[columnIndex].name] = {
            value: params.searchResult.getValue(params.columns[columnIndex]),
            text: params.searchResult.getText(params.columns[columnIndex])
          };
        } else {
          searchResultValues[params.columns[columnIndex].name] = {
            value: params.searchResult.getValue(params.columns[columnIndex]),
            text: params.searchResult.getText(params.columns[columnIndex])
          };
        }
      }
      return searchResultValues;
    } catch (err) {
      log.error('utils.getSearchValuesWithText', err);
      throw err;
    }
  }

  function rescheduleScript(params) {
    try {

      log.debug('rescheduleScript', { params: params });

      var scriptTask = task.create({ taskType: task.TaskType.SCHEDULED_SCRIPT });

      scriptTask.scriptId = params.scriptId;
      scriptTask.deploymentId = params.deploymentId;
      scriptTask.params = params.params ? params.params : null;
      return scriptTask.submit();
    } catch (err) {
      log.error('utils.rescheduleScript', 'ERROR');
      throw err;
    }
  }

  function setFieldsValues(params) {
    try {
      debug('utils.setFieldsValues', { fields: params.fields, ignoreFieldChange: params.ignoreFieldChange });

      for (var key in params.fields) {
        params.nsRecord.setValue({
          fieldId: key,
          value: params.fields[key],
          ignoreFieldChange: params.ignoreFieldChange
        });
      }
    } catch (err) {
      log.error('utils.setFieldsValues', err);
      throw err;
    }
  }

  function selectLine(params) {
    try {
      debug('utils.selectLine', { fields: params.fields, ignoreFieldChange: params.ignoreFieldChange, sublistId: params.sublistId, line: params.line });

      if (params.sublistId && params.line) {
        params.nsRecord.selectLine({ sublistId: params.sublistId, line: params.line });

        for (var key in params.fields) {
          params.nsRecord.setCurrentSublistValue({
            sublistId: params.sublistId,
            fieldId: key,
            value: params.fields[key],
            ignoreFieldChange: params.ignoreFieldChange
          });
        }

        params.nsRecord.commitLine({ sublistId: params.sublistId });
      }
    } catch (err) {
      log.error('utils.selectLine', err);
      throw err;
    }
  }

  function selectNewLine(params) {
    try {
      debug('utils.selectNewLine', { fields: params.fields, ignoreFieldChange: params.ignoreFieldChange, sublistId: params.sublistId });

      if (params.sublistId) {
        params.nsRecord.selectNewLine({ sublistId: params.sublistId });

        for (var key in params.fields) {
          params.nsRecord.setCurrentSublistValue({
            sublistId: params.sublistId,
            fieldId: key,
            value: params.fields[key],
            ignoreFieldChange: params.ignoreFieldChange
          });
        }

        params.nsRecord.commitLine({ sublistId: params.sublistId });
      }
    } catch (err) {
      log.error('utils.selectNewLine', err);
      throw err;
    }
  }

  return {
    checkInteger: checkInteger,
    debug: debug,
    getRecordFieldValues: getRecordFieldValues,
    getScriptParameters: getScriptParameters,
    getSearchValues: getSearchValues,
    getSearchValuesWithText: getSearchValuesWithText,
    rescheduleScript: rescheduleScript,
    setFieldsValues: setFieldsValues,
    selectLine: selectLine,
    selectNewLine: selectNewLine
  };
}
