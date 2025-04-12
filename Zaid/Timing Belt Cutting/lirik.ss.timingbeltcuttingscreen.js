/*******************************************************************
 *
 * Name: lirik.ss.timingbeltcuttingscreen.js
 *
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @version: 5.4.1
 *
 * Author: Lirik, Inc.
 * Purpose: Wire cutting process screen.
 * Script: customscript_lirik_ss_timingbeltcutscr
 * Deploy: customdeploy_lirik_ss_timingbeltcutscr
 *
 * ******************************************************************* */


define(['N/config', 'N/ui/serverWidget', 'N/search', './lirik.screenConfig', './lib/lirik.utils', './wrapper/lirik.wrapperclass', './lib/lodash_4.17.11_min'], function (config, serverWidget, search, scrConfig, utils, wrapper, _) {

  var isPaginationAdded = false;

  function onRequest(params) {
    try {

      if (scrConfig) {

        var nsForm = createForm(params);
        params.response.writePage(nsForm);
      }
    } catch (err) {
      log.error({ title: 'suitelet.onRequest', details: err });
      throw err.message;
    }
  }

  function createForm(params) {

    try {

      var nsForm = serverWidget.createForm({ title: scrConfig.form.title, hideNavBar: scrConfig.form.hideNavBar });
      if (scrConfig.clientScriptModulePath) {
        nsForm.clientScriptModulePath = scrConfig.clientScriptModulePath;
      } else if (scrConfig.clientScriptFileId) {
        nsForm.clientScriptFileId = scrConfig.clientScriptFileId;
      }

      // Adding HTML field
      var nsFieldLoaded = nsForm.addField({ id: 'form_fld_loaded', label: 'Loaded', type: serverWidget.FieldType.INLINEHTML });
      var loaderHTML = '';
      loaderHTML += '<head>';
      loaderHTML += '<style>' + '.lirik-overlay { position: fixed; left: 0px; top: 0px; width: 100%; height: 100%; z-index: 9999; background: url(https://3838877.app.netsuite.com/core/media/media.nl?id=398308&c=3838877&h=e07f20daff9752ba7b1f) center no-repeat #fff;}' + '</style>';
      loaderHTML += '</head>';
      loaderHTML += '<body>';
      loaderHTML += '<div class="lirik-overlay"></div>';
      loaderHTML += '</body>';
      nsFieldLoaded.defaultValue = loaderHTML;
      nsFieldLoaded.updateLayoutType({ layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE });

      // Adding summary field
      var nsShadedTabBGColor = '#E0E6EF';
      var nsTabBGColor = '#607799';
      var nsFieldSummary = nsForm.addField({ id: 'form_fld_summary', label: 'Summary', type: serverWidget.FieldType.INLINEHTML });
      var summaryHTML = '';
      summaryHTML += '<head>';
      summaryHTML += '<style>' +
        '.ui-dialog-titlebar-data_summary{ background-color:#eeeeee background-image:none color:#333333 border:1px solid #dddddd }' + '.ui-widget-content-data_summary{ border: 1px solid #dddddd !important; background: ' + nsShadedTabBGColor + ' !important;' + 'color: ' + nsTabBGColor + ' !important; }' +
        '</style>';
      summaryHTML += '</head>';
      summaryHTML += '<body>';
      summaryHTML += '<div id="data_summary" title="Confirm Submission" style="display:none;"></div>';
      summaryHTML += '</body>';
      nsFieldSummary.defaultValue = summaryHTML;

      if (nsForm) {

        addButtons({ nsForm: nsForm });

        addFieldsGroups({ nsForm: nsForm });

        var scrConfigKeys = Object.keys(scrConfig);

        if (scrConfigKeys.indexOf('filterFields') < scrConfigKeys.indexOf('fields')) {

          addFilterFields({ nsForm: nsForm, request: params.request });
          addFields({ nsForm: nsForm, request: params.request });
        } else {

          addFields({ nsForm: nsForm, request: params.request });
          addFilterFields({ nsForm: nsForm, request: params.request });
        }

        addSubtabs({ nsForm: nsForm, request: params.request });

        addSublists({ nsForm: nsForm, request: params.request });
      }

      return nsForm;
    } catch (err) {
      log.error({ title: 'createForm', details: err });
      throw err;
    }
  }

  function addButtons(params) {

    try {

      var addedButtonsCount = 0;

      if (params && params.nsForm) {

        var buttons = scrConfig.buttons;
        if (buttons && Array.isArray(buttons) && buttons.length > 0) {

          for (var index = 0; index < buttons.length; index++) {

            if (buttons[index] && buttons[index].id && buttons[index].label) {

              params.nsForm.addButton({ id: buttons[index].id, label: buttons[index].label, functionName: buttons[index].functionName });

              addedButtonsCount++;
            }
          }
        }
      }

      utils.debug('addButtons', { addedButtonsCount: addedButtonsCount });
    } catch (err) {
      log.error({ title: 'addButtons', details: err });
      throw err;
    }
  }

  function addFieldsGroups(params) {

    try {

      var addedGroupCount = 0;

      if (params && params.nsForm) {

        var fieldsGroups = scrConfig.fieldsGroups;
        if (fieldsGroups && Array.isArray(fieldsGroups) && fieldsGroups.length > 0) {

          for (var index = 0; index < fieldsGroups.length; index++) {

            if (fieldsGroups[index] && fieldsGroups[index].id) {

              params.nsForm.addFieldGroup({ id: fieldsGroups[index].id, label: fieldsGroups[index].label, tab: fieldsGroups[index].tab });

              addedGroupCount++;
            }
          }
        }
      }

      utils.debug('addFieldsGroups', { addedGroupCount: addedGroupCount });
    } catch (err) {
      log.error({ title: 'addFieldsGroups', details: err });
      throw err;
    }
  }

  function addFilterFields(params) {
    try {

      var addedFilterFields = 0;

      if (params && params.nsForm) {

        var filterFields = scrConfig.filterFields;
        if (filterFields && Array.isArray(filterFields) && filterFields.length > 0) {

          for (var index = 0; index < filterFields.length; index++) {

            if (filterFields[index] && filterFields[index].id && filterFields[index].label && filterFields[index].type) {

              var nsField = params.nsForm.addField({ id: filterFields[index].id, label: filterFields[index].label, type: filterFields[index].type, source: filterFields[index].source, container: filterFields[index].container });
              if (filterFields[index].help) {
                nsField.setHelpText({ help: filterFields[index].help, showInlineForAssistant: true });
              } else {
                nsField.setHelpText({ help: ' ', showInlineForAssistant: true });
              }

              if (filterFields[index].breakType) {
                nsField.updateBreakType({ breakType: fields[index].breakType });
              }

              if (filterFields[index].displayType) {
                nsField.updateDisplayType({ displayType: filterFields[index].displayType });
              }

              if (params.request && params.request.parameters && _.has(params.request.parameters, filterFields[index].id) && params.request.parameters[filterFields[index].id] !== '') {

                nsField.defaultValue = params.request.parameters[filterFields[index].id];
              } else if (_.has(filterFields[index], 'defaultValue') && filterFields[index].defaultValue !== '') {

                nsField.defaultValue = filterFields[index].defaultValue;
              }

              addedFilterFields++;
            }
          }
        }

        utils.debug('addFilterFields', { addedFilterFields: addedFilterFields });
      }
    } catch (err) {
      log.error({ title: 'addFilterFields', details: err });
      throw err;
    }
  }

  function addFields(params) {
    try {

      var addedFields = 0;

      if (params && params.nsForm) {

        if (params.request) {
          utils.debug('addFields', { 'params.request.parameters': params.request.parameters });
        }

        var fields = scrConfig.fields;
        if (fields && Array.isArray(fields) && fields.length > 0) {

          for (var index = 0; index < fields.length; index++) {

            if (fields[index] && fields[index].id && fields[index].label && fields[index].type) {

              var nsField = params.nsForm.addField({ id: fields[index].id, label: fields[index].label, type: fields[index].type, source: fields[index].source, container: fields[index].container });
              if (fields[index].help) {
                nsField.setHelpText({ help: fields[index].help, showInlineForAssistant: true });
              } else {
                nsField.setHelpText({ help: ' ', showInlineForAssistant: true });
              }

              if (fields[index].breakType) {
                nsField.updateBreakType({ breakType: fields[index].breakType });
              }

              if (fields[index].displayType) {
                nsField.updateDisplayType({ displayType: fields[index].displayType });
              }

              if (fields[index].retainValue && params.request && params.request.parameters && _.has(params.request.parameters, fields[index].id) && params.request.parameters[fields[index].id] !== '') {

                nsField.defaultValue = params.request.parameters[fields[index].id];
              } else {

                if (_.has(fields[index], 'defaultValue') && fields[index].defaultValue !== '') {
                  nsField.defaultValue = fields[index].defaultValue;
                }
              }

              addedFields++;
            }
          }
        }

        utils.debug('addFields', { addedFields: addedFields });
      }
    } catch (err) {
      log.error({ title: 'addFields', details: err });
      throw err;
    }
  }

  function addSubtabs(params) {
    try {

      // utils.debug('addSubtabs', { params: params });

      if (params && params.nsForm && Array.isArray(scrConfig.subtabs) && scrConfig.subtabs.length > 0) {

        var subtab = null;
        for (var index = 0; index < scrConfig.subtabs.length; index++) {

          subtab = scrConfig.subtabs[index];

          if (subtab.id && subtab.label) {
            params.nsForm.addSubtab({ id: subtab.id, label: subtab.label, tab: subtab.tab });
          }
        }
      }
    } catch (err) {
      log.error({ title: 'addSubtabs', details: err });
      throw err;
    }
  }

  function addSublists(params) {
    try {

      if (params && params.nsForm && Array.isArray(scrConfig.sublists) && scrConfig.sublists.length > 0) {

        var sublist = null;
        for (var index = 0; index < scrConfig.sublists.length; index++) {

          sublist = scrConfig.sublists[index];

          if (sublist && sublist.id && sublist.label && sublist.type) {

            var nsSublist = params.nsForm.addSublist({ id: sublist.id, label: sublist.label, type: sublist.type, tab: sublist.tab });

            if (sublist.columns && sublist.columns.length > 0) {

              var foundInternalIdCol = _.find(sublist.columns, function (o) {
                if (o.search) {
                  return o.search.name === 'internalid' && !o.search.join;
                }

                return false;
              });
              if (!foundInternalIdCol) {
                sublist.columns.unshift({
                  id: 'form_sublist_col_internalid',
                  label: 'Internal Id',
                  type: serverWidget.FieldType.TEXT,
                  search: { name: 'internalid' }
                });
              }

              for (var columnIndex = 0; columnIndex < sublist.columns.length; columnIndex++) {

                var sublistColumn = sublist.columns[columnIndex];

                var nsSublistFld = nsSublist.addField({ id: sublistColumn.id, label: sublistColumn.label, type: sublistColumn.type ? sublistColumn.type : serverWidget.FieldType.TEXT, source: sublistColumn.source });
                if (sublistColumn.displayType) {
                  nsSublistFld.updateDisplayType({ displayType: sublistColumn.displayType });
                } else {
                  // nsSublistFld.updateDisplayType({ displayType: ui.FieldLayoutType.READONLY });
                }

                if (sublistColumn.height && sublistColumn.width) {
                  nsSublistFld.updateDisplaySize({ height: sublistColumn.height, width: sublistColumn.width });
                } else if (sublistColumn.width) {
                  nsSublistFld.updateDisplaySize({ height: 1, width: sublistColumn.width });
                }

                if (_.has(sublistColumn, 'defaultValue') && sublistColumn.defaultValue !== '') {
                  nsSublistFld.defaultValue = sublistColumn.defaultValue;
                }
              }
            }

            wrapper.addSublist({ request: params.request, nsSublist: nsSublist, sublist: sublist });

            if (nsSublist && sublist.nsRecordSearchId) {

              if (sublist.dataOnFirstLoad || (sublist.dataLoadFilterField && params.request && params.request.parameters && params.request.parameters[sublist.dataLoadFilterField])) {

                var filters = getFilters({ request: params.request, filters: sublist.filters });
                utils.debug('addSublists', { id: sublist.id, label: sublist.label, filters: filters });

                var searchResults = searchSublistData({ request: params.request, sublist: sublist, filters: filters });
                // utils.debug('addSublists', { searchResults: searchResults });

                addSublistData({ request: params.request, nsForm: params.nsForm, nsSublist: nsSublist, sublist: sublist, searchResults: searchResults, filters: filters });

                addSublistButtons({ nsSublist: nsSublist, sublist: sublist });

              }
            }
          }
        }
      }
    } catch (err) {
      log.error({ title: 'addSublists', details: err });
      throw err;
    }
  }

  function addSublistButtons(params) {

    try {

      var addedSublistButtonsCount = 0;

      if (params && params.nsSublist && params.sublist && Array.isArray(params.sublist.buttons)) {

        var buttons = params.sublist.buttons;

        for (var index = 0; index < buttons.length; index++) {

          if (buttons[index] && buttons[index].id && buttons[index].label) {

            params.nsSublist.addButton({ id: buttons[index].id, label: buttons[index].label, functionName: buttons[index].functionName });

            addedSublistButtonsCount++;
          }
        }
      }

      utils.debug('addSublistButtons', { addedSublistButtonsCount: addedSublistButtonsCount });

      return addedSublistButtonsCount;
    } catch (err) {
      log.error({ title: 'addSublistButtons', details: err });
      throw err;
    }
  }

  function getFilters(params) {
    try {

      // utils.debug('getFilters', { params: params });
      utils.debug('getFilters', { filters: params.filters });

      if (params.filters) {

        var arrSeaFilters = [];

        if (Array.isArray(params.filters.request) && params.filters.request.length > 0) {

          var filter;
          var formFilter;
          for (var index = 0; index < params.filters.request.length; index++) {

            filter = params.filters.request[index];
            utils.debug('getFilters', { filter: filter });

            if (filter && (filter === 'AND' || filter === 'OR')) {
              arrSeaFilters.push(filter);
              continue;
            } else if (filter && Array.isArray(filter)) {
              arrSeaFilters.push(getFilters({ request: params.request, filters: { request: filter } }));
            } else if (params.request && params.request.parameters && _.has(params.request.parameters, filter.id) && params.request.parameters[filter.id] !== '') {

              arrSeaFilters.push([filter.searchField, filter.searchOperator, params.request.parameters[filter.id]]);
            } else if (filter && _.has(filter, 'defaultValue')) {
              arrSeaFilters.push([filter.searchField, filter.searchOperator, filter.defaultValue]);
            } else if (Array.isArray(scrConfig.filterFields) && scrConfig.filterFields.length > 0) {

              formFilter = _.find(scrConfig.filterFields, { id: filter.id });
              utils.debug('getFilters', { formFilter: formFilter });

              if (formFilter && _.has(formFilter, 'defaultValue') && formFilter.defaultValue !== '') {

                arrSeaFilters.push([filter.searchField, filter.searchOperator, formFilter.defaultValue]);
              }
            }
          }
        }

        // utils.debug('getFilters', { arrSeaFilters: arrSeaFilters });

        if (Array.isArray(arrSeaFilters) && arrSeaFilters.length > 0 && Array.isArray(params.filters.default) && params.filters.default.length > 0) {

          arrSeaFilters.push('AND');
          arrSeaFilters = arrSeaFilters.concat(params.filters.default);
        } else if (Array.isArray(params.filters.default) && params.filters.default.length > 0) {
          arrSeaFilters = params.filters.default;
        }

        utils.debug('getFilters - final', { arrSeaFilters: arrSeaFilters });

        return arrSeaFilters;
      }
    } catch (err) {
      log.error({ title: 'getFilters', details: err });
      throw err;
    }
  }

  function searchSublistData(params) {
    try {

      if (params.sublist && params.sublist.nsRecordSearchId && Array.isArray(params.sublist.columns) && params.sublist.columns.length > 0) {

        var sortedColumns = _.sortBy(params.sublist.columns, function (o) {
          if (o.search) {
            return o.search.sortIndex;
          }
        });

        var seaColumns = [];
        for (var index = 0; index < sortedColumns.length; index++) {

          var sublistColumn = sortedColumns[index];
          if (sublistColumn && sublistColumn.search && sublistColumn.search.name) {

            if (sublistColumn.search.name === 'internalid' && !sublistColumn.search.join) {
              continue;
            }

            var nsFoundSearchColumn = _.find(seaColumns, function (o) {
              if (o.join) {
                return o.name === sublistColumn.search.name && o.join === sublistColumn.search.join;
              } else {
                return o.name === sublistColumn.search.name;
              }
            });
            if (!nsFoundSearchColumn) {

              var seaColumn = {
                name: sublistColumn.search.name,
                join: sublistColumn.search.join,
                summary: sublistColumn.search.summary,
                formula: sublistColumn.search.formula,
                label: sublistColumn.search.label
              };

              if (sublistColumn.search.function) {
                seaColumn.function = sublistColumn.search.function;
              }
              if (sublistColumn.search.sort) {
                seaColumn.sort = sublistColumn.search.sort;
              }

              seaColumns.push(search.createColumn(seaColumn));
            }
          }
        }

        if (seaColumns && seaColumns.length > 0) {

          utils.debug('searchSublistData', { filters: params.filters, seaColumns: seaColumns });

          var nsSearch = search.create({ type: params.sublist.nsRecordSearchId, filters: JSON.parse(JSON.stringify(params.filters)), columns: seaColumns });


          var firstRecordIndex = 0;
          var lastRecordIndex = 1000;
          var count = 0;
          if (params.sublist.pagination) {

            if (!params.sublist.pagination.pageSize) {

              params.sublist.pagination.pageSize = config.load({ type: config.Type.USER_PREFERENCES }).getValue({ fieldId: 'LISTSEGMENTSIZE' });
            }
            params.sublist.pagination.pageSize = Number(params.sublist.pagination.pageSize) < 5 ? 5 : Number(params.sublist.pagination.pageSize);
            utils.debug('searchSublistData', { pageSize: params.sublist.pagination.pageSize });

            var nsSearchPagedData = nsSearch.runPaged({ pageSize: params.sublist.pagination.pageSize });

            var currPageIndex = params.request.parameters[params.sublist.pagination.id + '_curr_index'] ? params.request.parameters[params.sublist.pagination.id + '_curr_index'] : 1;
            if (params.sublist.pagination.pageSize > nsSearchPagedData.count) {
              currPageIndex = 1;
            }

            firstRecordIndex = (currPageIndex - 1) * params.sublist.pagination.pageSize;
            lastRecordIndex = currPageIndex * params.sublist.pagination.pageSize;

            count = nsSearchPagedData.count;
          }

          utils.debug('searchSublistData', { count: count, firstRecordIndex: firstRecordIndex, lastRecordIndex: lastRecordIndex });

          var nsSearchResultSet = nsSearch.run();
          var nsSearchResults = nsSearchResultSet.getRange({ start: firstRecordIndex, end: lastRecordIndex });

          utils.debug('searchSublistData', { 'nsSearchResults.length': nsSearchResults.length });

          if (!params.sublist.pagination) {
            count = nsSearchResults.length;
          }

          return { nsSearchResults: nsSearchResults, count: count };
        }
      }
    } catch (err) {
      log.error({ title: 'searchSublistData', details: err });
      throw err;
    }
  }

  function addSublistData(params) {
    try {

      if (params.nsSublist && Array.isArray(params.sublist.columns) && params.sublist.columns.length > 0 && params.searchResults) {

        if (Array.isArray(params.searchResults.nsSearchResults) && params.searchResults.nsSearchResults.length > 0) {

          var sublistFieldVal;

          for (var index = 0; index < params.searchResults.nsSearchResults.length; index++) {
            var nsSearchRes = params.searchResults.nsSearchResults[index];

            for (var columnIndex = 0; columnIndex < params.sublist.columns.length; columnIndex++) {

              sublistFieldVal = '';

              var sublistColumn = params.sublist.columns[columnIndex];

              var nsFoundSearchColumn = sublistColumn && sublistColumn.search ? _.find(nsSearchRes.columns, function (o) {
                if (o.join) {
                  return o.name === sublistColumn.search.name && o.join === sublistColumn.search.join;
                } else {
                  return o.name === sublistColumn.search.name;
                }
              }) : undefined;

              if (sublistColumn.search && _.has(sublistColumn.search, 'defaultValue') && sublistColumn.search.defaultValue !== '') {
                sublistFieldVal = sublistColumn.search.defaultValue;
              }

              if (!nsFoundSearchColumn && params.sublist.columns[columnIndex].search && params.sublist.columns[columnIndex].search.name === 'internalid' && !params.sublist.columns[columnIndex].search.join) {
                sublistFieldVal = nsSearchRes.id;
              }

              sublistFieldVal = nsFoundSearchColumn ? (sublistColumn.search.isText ? nsSearchRes.getText(nsFoundSearchColumn) : nsSearchRes.getValue(nsFoundSearchColumn)) : sublistFieldVal;

              if (sublistColumn.search && sublistColumn.search.isBoolean && nsSearchRes.getValue(nsFoundSearchColumn)) {
                sublistFieldVal = '<span>✅</span>';
              } else if (sublistColumn.search && sublistColumn.search.isBoolean) {
                sublistFieldVal = '';
              }

              if (sublistFieldVal) {
                params.nsSublist.setSublistValue({ id: sublistColumn.id, line: index, value: sublistFieldVal });
              }
            }
          }
        }

        wrapper.addSublistData({ request: params.request, nsForm: params.nsForm, nsSublist: params.nsSublist, searchResults: params.searchResults, sublist: params.sublist, filters: params.filters });

        if (!isPaginationAdded) {

          addSublistPagination({ request: params.request, nsForm: params.nsForm, nsSublist: params.nsSublist, sublist: params.sublist, searchResults: params.searchResults, filters: params.filters });

          isPaginationAdded = true;
        }

        return true;
      }
    } catch (err) {
      log.error({ title: 'addSublistData', details: err });
      throw err;
    }
  }

  function addSublistPagination(params) {

    try {

      utils.debug('addSublistPagination', { 'params.sublist.pagination': params.sublist.pagination });

      if (params && params.nsForm && scrConfig && params.sublist && params.sublist.pagination && params.searchResults.count > 0) {

        var pageIndex = 0;

        utils.debug('addSublistPagination', { pageSize: params.sublist.pagination.pageSize, count: params.searchResults.count, currPageIndex: params.request.parameters[params.sublist.pagination.id + '_curr_index'] });

        var nsSublistFldCurrPageIndex = params.nsForm.addField({ id: params.sublist.pagination.id + '_curr_index', label: 'Current Page Index', type: serverWidget.FieldType.TEXT });
        nsSublistFldCurrPageIndex.setHelpText({ help: ' ', showInlineForAssistant: true });
        nsSublistFldCurrPageIndex.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
        nsSublistFldCurrPageIndex.defaultValue = params.request.parameters[params.sublist.pagination.id + '_curr_index'] ? params.request.parameters[params.sublist.pagination.id + '_curr_index'] : 1;

        var nsSublistFld = params.nsForm.addField({ id: params.sublist.pagination.id, label: 'Page', type: serverWidget.FieldType.SELECT, container: params.sublist.pagination.container });
        nsSublistFld.updateBreakType({ breakType: serverWidget.FieldBreakType.STARTCOL });

        for (; pageIndex < parseInt(params.searchResults.count / params.sublist.pagination.pageSize); pageIndex++) {

          var firstRecIndex = (params.sublist.pagination.pageSize * pageIndex) + 1;
          var lastRecIndex = params.sublist.pagination.pageSize * (pageIndex + 1);

          if (Number(nsSublistFldCurrPageIndex.defaultValue) === (pageIndex + 1)) {
            nsSublistFld.addSelectOption({ value: pageIndex + 1, text: firstRecIndex + ' - ' + lastRecIndex, isSelected: true });
          } else {
            nsSublistFld.addSelectOption({ value: pageIndex + 1, text: firstRecIndex + ' - ' + lastRecIndex, isSelected: false });
          }
        }

        if (params.searchResults.count % params.sublist.pagination.pageSize !== 0) {

          if (Number(nsSublistFldCurrPageIndex.defaultValue) === (pageIndex + 1)) {
            nsSublistFld.addSelectOption({ value: pageIndex + 1, text: (params.sublist.pagination.pageSize * pageIndex) + ' - ' + params.searchResults.count, isSelected: true });
          } else {
            nsSublistFld.addSelectOption({ value: pageIndex + 1, text: (params.sublist.pagination.pageSize * pageIndex) + ' - ' + params.searchResults.count, isSelected: false });
          }
        }

        return true;
      }
    } catch (err) {
      log.error({ title: 'addSublistPagination', details: err });
      throw err;
    }
  }

  return {
    onRequest: onRequest
  };
});