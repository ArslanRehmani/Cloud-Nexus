'use strict';
/**
 * ##################################################
 * ##  Logger Module for SuiteScript 2.0  v1.0.2   ##
 * ##################################################
 *
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/record', 'N/runtime'],
    /**
     *
     * @param {log} nsLog
     * @param {record} nsRecord
     * @param {runtime} nsRuntime
     * @return {LoggerModule}
     */
    function (nsLog, nsRecord, nsRuntime) {
        var _LOG_MODULE_NAME = '/AvtLoggerLib2.';

        /**
         * Log entry entity class
         * Used by Logger Module and Utility Module
         * @constructor
         */
        function LogEntry(logType, title, details) {
            /** @type string - time stamp of log in "YYYY-MM-DD hh:mm:ss.SSS" format */
            this.datetime = '';
            this.logType = '';
            this.title = '';
            this.details = '';

            // initialize time stamp
            var date = new Date();
            this.datetime = date.getFullYear().toString() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
                ('0' + date.getDate()).slice(-2) + ' ' +
                ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2) + ':' +
                ('0' + date.getSeconds()).slice(-2) + '.' + ('00' + date.getMilliseconds()).slice(-3);

            logType = logType || '';
            title = title || '';
            details = details || '';

            if (typeof logType !== 'string') {
                logType = logType.toString();
            }
            // max length of type of N/log is 9 characters (EMERGENCY)
            this.logType = logType.slice(0, 9);

            if (typeof title !== 'string') {
                title = title.toString();
            }
            // max length of title of N/log is 99 characters
            this.title = title.slice(0, 99);
            if (typeof details !== 'string') {
                details = details.toString();
            }
            // max length of details of N/log is 3999 characters
            this.details = details.slice(0, 3999);

            return this;
        }


        /**
         * Logger Module Class
         * @constructor
         */
        function LoggerModule() {
            // member variables
            /** contains LogEntry object. [0] contains the most recent log entry */
            this.logEntryArray = [];
            /** @type boolean true: Enable SuiteScript log using N/log. Can be false only for Client Script */
            this._isSuiteScriptLogEnabled = true;
            /** @type boolean true: Enable browser console log. Works only for Client Script */
            this._isBrowserConsoleLogEnabled = false;
            /** @type number (integer) - log level number in _LOG_LEVEL_MAP. 0: disable logging. */
            this._logLevel = 4;

            return this;
        }

        // static variables
        LoggerModule.prototype.LOG_LEVEL = {
            DEBUG: 'DEBUG',
            AUDIT: 'AUDIT',
            ERROR: 'ERROR',
            EMERGENCY: 'EMERGENCY'
        };

        LoggerModule.prototype._LOG_LEVEL_MAP = {
            DEBUG: 4,
            AUDIT: 3,
            ERROR: 2,
            EMERGENCY: 1
        };

        /** @type Object - key: log level of N/log  value: corresponding function of N/log */
        LoggerModule.prototype._SS2_LOG_FUNCTION_NAME_MAP = {};
        LoggerModule.prototype._SS2_LOG_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.DEBUG] = 'debug';
        LoggerModule.prototype._SS2_LOG_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.AUDIT] = 'audit';
        LoggerModule.prototype._SS2_LOG_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.ERROR] = 'error';
        LoggerModule.prototype._SS2_LOG_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.EMERGENCY] = 'emergency';

        /** @type Object - key: log level of N/log  value: corresponding function of console */
        LoggerModule.prototype._CONSOLE_FUNCTION_NAME_MAP = {};
        LoggerModule.prototype._CONSOLE_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.DEBUG] = 'log';
        LoggerModule.prototype._CONSOLE_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.AUDIT] = 'warn';
        LoggerModule.prototype._CONSOLE_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.ERROR] = 'error';
        LoggerModule.prototype._CONSOLE_FUNCTION_NAME_MAP[LoggerModule.prototype.LOG_LEVEL.EMERGENCY] = 'error';

        LoggerModule.prototype._DEFAULT_LOG_LEVEL = LoggerModule.prototype.LOG_LEVEL.DEBUG;
        LoggerModule.prototype._MAX_LOG_ENTRY_ARRAY_LENGTH = 200;

        // Log Report Record related
        LoggerModule.prototype._LOG_REPORT_RECORD_TYPE = 'customrecord_avt_log_report';
        LoggerModule.prototype._LOG_REPORT_RECORD_FIELD_SCRIPT_ID = 'custrecord_avt_logrep_script_id';
        LoggerModule.prototype._LOG_REPORT_RECORD_FIELD_DEPLOYMENT_ID = 'custrecord_avt_logrep_deployment_id';
        LoggerModule.prototype._LOG_REPORT_RECORD_FIELD_LOG_REPORT_JSON = 'custrecord_avt_logrep_log_report_json';

        /**
         * Create log object and add it to this.logEntryArray
         *
         * @param {string} type
         * @param {string} title
         * @param {string} details
         * @private
         */
        LoggerModule.prototype._addLogEntry = function (type, title, details) {
            var logEntry = new LogEntry(type, title, details);

            this.logEntryArray.unshift(logEntry);
            if (this.logEntryArray.length > this._MAX_LOG_ENTRY_ARRAY_LENGTH) {
                this.logEntryArray.pop();
            }
        };

        /**
         * Format date and time
         *
         * @param  {Date} date Date object
         * @return {string} Formatted date and time in "YYYY-MM-DD hh:mm:ss.SSS"
         * @private
         */
        LoggerModule.prototype._formatDate = function (date) {
            var format = 'YYYY-MM-DD hh:mm:ss.SSS';

            var milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
            format = format.replace('SSS', milliSeconds.slice(0, 3));

            format = format.replace('YYYY', date.getFullYear().toString());
            format = format.replace('MM', ('0' + (date.getMonth() + 1)).slice(-2));
            format = format.replace('DD', ('0' + date.getDate()).slice(-2));
            format = format.replace('hh', ('0' + date.getHours()).slice(-2));
            format = format.replace('mm', ('0' + date.getMinutes()).slice(-2));
            format = format.replace('ss', ('0' + date.getSeconds()).slice(-2));

            return format;
        };

        /**
         * @param {string} logLevel - Log level of N/log.<br>
         *     null: disable logging
         * Logs lower level than this argument won't be logged.
         */
        LoggerModule.prototype.setLogLevel = function (logLevel) {
            var logFunctionName = _LOG_MODULE_NAME + 'setLogLevel';

            if (logLevel === null) {
                this._logLevel = 0;
                return;
            }

            var logLevelNumber = this._LOG_LEVEL_MAP[logLevel];
            if (logLevelNumber) {
                this._logLevel = logLevelNumber;
            } else {
                this.logVariables(this.LOG_LEVEL.AUDIT, logFunctionName,
                    {logLevel: logLevel}, false, 'Log level is invalid.');
            }
        };

        /**
         * Change setting of SuiteScript logging by N/log. This function is for Client Script to improve performance disabling SuiteScript log.
         *
         * @param {boolean} isEnabled true: Enable browser console log. false: Disable browser console log.
         * @return boolean Setting after execution
         */
        LoggerModule.prototype.enableSuiteScriptLog = function (isEnabled) {

            var newIsEnabledValue = isEnabled;

            if ([nsRuntime.ContextType.CLIENT, nsRuntime.ContextType.USER_INTERFACE].indexOf(nsRuntime.executionContext) < 0) {
                newIsEnabledValue = true;  // Do not allow to disable NetSuite logging for server side script

            } else {
                newIsEnabledValue = isEnabled;
            }

            this._isSuiteScriptLogEnabled = newIsEnabledValue;

            return this._isSuiteScriptLogEnabled;
        };

        /**
         * Change setting of browser console logging. If console's functions are not available, console logging is forced to disabled.
         *
         * @param {boolean} isEnabled true: Enable browser console log. false: Disable browser console log.
         * @return boolean Setting after execution
         */
        LoggerModule.prototype.enableBrowserConsoleLog = function (isEnabled) {

            var newIsEnabledValue = isEnabled;

            if ([nsRuntime.ContextType.CLIENT, nsRuntime.ContextType.USER_INTERFACE].indexOf(nsRuntime.executionContext) < 0) {
                newIsEnabledValue = false;

            } else if (typeof console === 'object') {
                // check availability of console object and its functions
                // determine this execution context is client script if all console function is available

                var isAllFunctionAvailable = true;
                for (var key in this._CONSOLE_FUNCTION_NAME_MAP) {
                    var consoleFunctionName = this._CONSOLE_FUNCTION_NAME_MAP[key];
                    if (typeof console[consoleFunctionName] !== 'function') {
                        isAllFunctionAvailable = false;
                        break;
                    }
                }
                if (!isAllFunctionAvailable) {  // Make false if console's functions are not available
                    newIsEnabledValue = false;
                }
            }

            this._isBrowserConsoleLogEnabled = newIsEnabledValue;

            return this._isBrowserConsoleLogEnabled;
        };

        /**
         * Log all HTTP parameter contained in request.
         *
         * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - Title of log record
         * @param {ServerRequest} request - HTTP request passed by NetSuite framework to Suitelet
         * @returns {void}
         */
        LoggerModule.prototype.logAllHttpParameters = function (logLevel, logFunctionName, request) {
            var selfLogFunctionName = 'LoggerModule.prototype.logAllHttpParameters';

            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            try {
                var params = request.parameters;
                var dumpString = '';
                for (var key in params) {
                    if (dumpString) {
                        dumpString += ', ';
                    }
                    dumpString += '[' + key + '] \'' + params[key] + '\'';
                }
                this.logWithTry(logLevel, logFunctionName, '[HttpParameters][' + dumpString + ']');
            } catch (e) {
                this.logErrorObjectE(selfLogFunctionName, e, 'Failed to log HTTP parameters.', null, false);
            }
        };

        /**
         * Log all HTTP parameter contained in request.
         *
         * @param {string} logFunctionName - Title of log record
         * @param {ServerRequest} request - HTTP request passed by NetSuite framework to Suitelet
         * @returns {void}
         */
        LoggerModule.prototype.logAllHttpParametersA = function (logFunctionName, request) {
            this.logAllHttpParameters(this.LOG_LEVEL.AUDIT, logFunctionName, request);
        };

        /**
         * Log beginning of function with arguments
         *
         * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - Title of log record
         * @param {Object|Array} [nameAndValueMapOrArray] - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [message] - Additional message appended to log
         * @returns {void}
         */
        LoggerModule.prototype.logStartFunction = function (logLevel, logFunctionName, nameAndValueMapOrArray, isJsonEnabled, message) {
            var selfLogFunctionName = 'LoggerModule.prototype.logStartFunction';

            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            try {
                var logMessage = '';
                if (message) {
                    logMessage += '[Message] \'' + message + '\', ';
                }
                logMessage += '[Arguments][' + this.createVariablesString(nameAndValueMapOrArray, isJsonEnabled) + ']';
                this.logWithTry(logLevel, logFunctionName, 'Function start ' + logMessage);
            } catch (e) {
                this.logErrorObjectE(selfLogFunctionName, e, 'Failed to log.', null, false);
            }
        };

        /**
         * Log beginning of function with arguments using DEBUG log level
         *
         * @param {string} logFunctionName - Title of log record
         * @param {Object|Array} [nameAndValueMapOrArray] - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [message] - Additional message appended to log
         * @returns {void}
         */
        LoggerModule.prototype.logStartFunctionD = function (logFunctionName, nameAndValueMapOrArray, isJsonEnabled, message) {
            this.logStartFunction(this.LOG_LEVEL.DEBUG, logFunctionName, nameAndValueMapOrArray, isJsonEnabled, message);
        };

        /**
         * Log finishing of function with return value.
         *
         * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - Title of log record
         * @param {*} [returnValue] -  Return value of the function being logged
         * @param {boolean} [doesReturnVoid] - true: returnValue is void
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [message] - Additional message appended to log
         * @returns {void}
         */
        LoggerModule.prototype.logFinishFunction = function (logLevel, logFunctionName, returnValue, doesReturnVoid, isJsonEnabled, message) {
            var selfLogFunctionName = 'LoggerModule.prototype.logFinishFunction';

            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            if (doesReturnVoid && returnValue !== null && returnValue !== undefined) {
                doesReturnVoid = false;
            }

            try {
                var logMessage = '';
                if (message) {
                    logMessage += '[Message] \'' + message + '\', ';
                }
                logMessage += '[Return] ';

                if (doesReturnVoid) {
                    logMessage += '(void)';
                } else if (returnValue === undefined) {
                    logMessage += '(undefined)';
                } else if (returnValue === null) {
                    logMessage += '(null)';
                } else if (isJsonEnabled) {
                    var jsonString = null;
                    try {
                        jsonString = JSON.stringify(returnValue);
                    } catch (e) {
                        jsonString = 'JSON.stringify() failed. ' + this.getErrorMessage(e);
                    }
                    logMessage += '(JSON)' + ':\'' + jsonString + '\'';
                } else {
                    if(Array.isArray(returnValue)) {
                        logMessage += '(Array)[' + returnValue.length + ']';
                    } else if (typeof returnValue === 'object') {
                        var length = null;
                        try {
                            if (typeof returnValue.length === 'number') {
                                length = returnValue.length;
                            } else {
                                length = Object.keys(returnValue).length;
                            }
                        } catch (e) {
                            length = 'N/A';
                        }
                        logMessage += '(' + typeof returnValue + ')[' + length + ']';
                    } else {
                        logMessage += '(' + typeof returnValue + '):\'' + returnValue + '\'';
                    }
                }

                this.logWithTry(logLevel, logFunctionName, 'Function finish ' + logMessage);
            } catch (e) {
                this.logErrorObjectE(selfLogFunctionName, e, 'Failed to log.', null, false);
            }
        };

        /**
         * Log finishing of function with return value using DEBUG log level
         *
         * @param {string} logFunctionName - Title of log record
         * @param {*} [returnValue] - Return value of the function being logged
         * @param {boolean} [doesReturnVoid] - true: returnValue is void
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [message] - Additional message appended to log
         * @returns {void}
         */
        LoggerModule.prototype.logFinishFunctionD = function (logFunctionName, returnValue, doesReturnVoid, isJsonEnabled, message) {
            this.logFinishFunction(this.LOG_LEVEL.DEBUG, logFunctionName, returnValue, doesReturnVoid, isJsonEnabled, message);
        };

        /**
         * Log names and values of valuables.
         *
         * @param {string} logLevel - One of log type following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - Title of log record
         * @param {Object|Array} nameAndValueMapOrArray - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [message] - Additional message appended to log
         * @returns {void}
         */
        LoggerModule.prototype.logVariables = function (logLevel, logFunctionName, nameAndValueMapOrArray, isJsonEnabled, message) {
            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            var logString = '';
            if (message) {
                logString = '[Message] \'' + message + '\', ';
            }
            logString += '[Variable][' + this.createVariablesString(nameAndValueMapOrArray, isJsonEnabled) + ']';

            this.logWithTry(logLevel, logFunctionName, logString);
        };

        /**
         * Log names and values of valuables using DEBUG log level
         *
         * @param {string} logFunctionName - Title of log record
         * @param {Object|Array} nameAndValueMapOrArray - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [message] - Additional message appended to log
         * @returns {void}
         */
        LoggerModule.prototype.logVariablesD = function (logFunctionName, nameAndValueMapOrArray, isJsonEnabled, message) {
            this.logVariables(this.LOG_LEVEL.DEBUG, logFunctionName, nameAndValueMapOrArray, isJsonEnabled, message);
        };

        /**
         * Log messages utilizing N/log.debug
         *
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {string} [details] - The details of the log entry (max length: 3999 characters)
         * @returns {void}
         */
        LoggerModule.prototype.logD = function (logFunctionName, details) {
            this.logWithTry(this.LOG_LEVEL.DEBUG, logFunctionName, details);
        };

        /**
         * Log messages utilizing N/log with AUDIT tag
         *
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {string} [details] - The details of the log entry (max length: 3999 characters)
         * @returns {void}
         */
        LoggerModule.prototype.logA = function (logFunctionName, details) {
            this.logWithTry('AUDIT', logFunctionName, details);
        };

        /**
         * Log messages utilizing N/log with ERROR tag
         *
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {string} [details] - The details of the log entry (max length: 3999 characters)
         * @returns {void}
         */
        LoggerModule.prototype.logE = function (logFunctionName, details) {
            this.logWithTry(this.LOG_LEVEL.ERROR, logFunctionName, details);
        };

        /**
         * Log messages utilizing N/log with EMERGENCY tag
         *
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {string} [details] - The details of the log entry (max length: 3999 characters)
         * @returns {void}
         */
        LoggerModule.prototype.logEmergency = function (logFunctionName, details) {
            this.logWithTry('EMERGENCY', logFunctionName, details);
        };

        /**
         * Log messages utilizing N/log with debug tag
         *
         * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {SuiteScriptError|UserEventError|Error} errorObj - Error object to be logged
         * @param {string} [message] - Additional message appended to log
         * @param {Object|Array} [nameAndValueMapOrArray] - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @returns {void}
         */
        LoggerModule.prototype.logErrorObject = function (logLevel, logFunctionName, errorObj, message, nameAndValueMapOrArray, isJsonEnabled) {
            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            var logMessage = '';
            if (message) {
                logMessage += '[Message] \'' + message + '\', ';
            }
            logMessage += '[Error Object][' + this.getErrorMessage(errorObj) + ']';
            if (nameAndValueMapOrArray) {
                logMessage += ', [Variable][' + this.createVariablesString(nameAndValueMapOrArray, isJsonEnabled) + ']';
            }
            this.logWithTry(logLevel, logFunctionName, logMessage);
        };

        /**
         * Log messages utilizing N/log with debug tag
         *
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {SuiteScriptError|UserEventError|Error} errorObj - Error object to be logged
         * @param {string} [message] -  Additional message appended to log
         * @param {Object|Array} [nameAndValueMapOrArray] - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @returns {void}
         */
        LoggerModule.prototype.logErrorObjectE = function (logFunctionName, errorObj, message, nameAndValueMapOrArray, isJsonEnabled) {
            this.logErrorObject(this.LOG_LEVEL.ERROR, logFunctionName, errorObj, message, nameAndValueMapOrArray, isJsonEnabled);
        };

        /**
         * Log start of timer and return Date object.
         *
         * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - Title of log record
         * @param {string} [message] - Message to log
         * @return {Date} Start time of timer
         */
        LoggerModule.prototype.logStartTimer = function (logLevel, logFunctionName, message) {
            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            var date = new Date();

            var logMessage = '';
            if (message) {
                logMessage += '[Message]\'' + message + '\', ';
            }
            logMessage += '[Start Time]\'' + this._formatDate(date) + '\'';
            this.logWithTry(logLevel, logFunctionName, logMessage);
            return date;
        };

        /**
         * Log end time of timer and duration from start time.
         *
         * @param {string} logLevel - One of log types following. DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - Title of log record
         * @param {Date} date - Start time of timer
         * @param {string} [message] - Message to log
         */
        LoggerModule.prototype.logStopTimer = function (logLevel, logFunctionName, date, message) {
            var selfLogFunctionName = 'LoggerModule.prototype.logStopTimer';

            if (typeof logLevel !== 'string') {
                // invalid logLevel. use default log level
                logLevel = this._DEFAULT_LOG_LEVEL;
            } else {
                logLevel = logLevel.toUpperCase();
                if (!this._LOG_LEVEL_MAP[logLevel]) {
                    // invalid logLevel. use default log level
                    logLevel = this._DEFAULT_LOG_LEVEL;
                }
            }

            if (!date || !(date instanceof Date)) {
                this.logA(selfLogFunctionName, 'Argument error. date argument is invalid.');
            }

            var dateNow = new Date();
            var duration = dateNow.valueOf() - date.valueOf();
            var isNegative = duration < 0;
            if (isNegative) {
                duration = -duration;
            }
            var milliSec = duration % 1000;
            var second = Math.floor(duration / 1000);
            var minute = Math.floor(duration / 60000);
            var hour = Math.floor(duration / 3600000);

            var durationString = isNegative ? '-' : '';
            durationString += hour + ':' + ('0' + minute).slice(-2) + ':' +
                ('0' + second).slice(-2) + '.' + ('00' + milliSec).slice(-3);

            var logMessage = '';
            if (message) {
                logMessage += '[Message]\'' + message + '\', ';
            }
            logMessage += '[Stop Time]\'' + this._formatDate(date) + '\', [Duration]\'' + durationString + '\'';
            this.logWithTry(logLevel, logFunctionName, logMessage);
        };

        /**
         * Log messages utilizing N/log with try-catch.<br>
         * Use console.debug etc. for client script, N/log for other scripts.
         *
         * @param {string} logType - One of the following log types:
         *     DEBUG, AUDIT, ERROR, EMERGENCY
         * @param {string} logFunctionName - A title used to organize log entries (max length: 99 characters).<br>
         *     If you set title to null or empty string (''), you will see
         *     the word “Untitled” appear in your log entry.
         * @param {string} [details] - The details of the log entry (max length: 3999 characters)
         * @returns {void}
         */
        LoggerModule.prototype.logWithTry = function (logType, logFunctionName, details) {
            var selfLogFunctionName = 'LoggerModule.prototype.logWithTry';

            try {
                this._addLogEntry(logType, logFunctionName, details);
            } catch (e) {
                var errorMessage = 'Failed to add log entry to Logger module.';
                // use N/log
                nsLog.error({title: selfLogFunctionName, details: errorMessage});

                if (this._isBrowserConsoleLogEnabled) {
                    // log on console for client script if it is enabled
                    console.error('[Logging Error]', 'title: \'' + selfLogFunctionName +
                        '\', details: \'' + errorMessage + '\'');
                }
            }

            // check log level
            if (this._LOG_LEVEL_MAP[logType] > this._logLevel) {
                // this log should not output
                return;
            }

            // use N/log to log
            if (this._isSuiteScriptLogEnabled) {
                try {
                    var suiteScriptFunctionName = this._SS2_LOG_FUNCTION_NAME_MAP[logType];
                    nsLog[suiteScriptFunctionName]({title: logFunctionName, details: details});

                } catch (e) {
                    nsLog.error({
                        title: 'Logging Error',
                        details: 'title: \'' + logFunctionName + '\', details: \'' + details + '\', Error Object: \'' + this.getErrorMessage(e) + '\''
                    })
                }
            }

            if (this._isBrowserConsoleLogEnabled) {
                // log on console for client script if it is enabled
                try {
                    var consoleFunctionName = this._CONSOLE_FUNCTION_NAME_MAP[logType];
                    console[consoleFunctionName]('[' + logFunctionName + ']: ' + details);
                } catch (e) {
                    console.error('[Logging Error]', 'title: \'' + logFunctionName +
                        '\', details: \'' + details + '\', Error Object: \'' + this.getErrorMessage(e) + '\'');
                }
            }
        };

        /**
         * Create string shows valuables' content.
         *
         * @param {Object|Array} nameAndValueMapOrArray - Object or Array of name and value.<br>
         *     This should contain even number of elements.<br>
         *     e.g. {name1: value1, name2: value2, ...}<br>
         *     e.g. ['name1', value1, 'name2', value2, ...]
         * @param {boolean} [isJsonEnabled] - true: use JSON.stringify() to create dump string
         * @param {string} [delimiter] - Delimiter between each elements. default is ', '
         * @returns {string} valuables dump string
         */
        LoggerModule.prototype.createVariablesString = function (nameAndValueMapOrArray, isJsonEnabled, delimiter) {
            var logFunctionName = _LOG_MODULE_NAME + 'createVariablesString';

            if (delimiter === undefined || delimiter === null) {
                delimiter = ', ';
            }
            // check if argument is valid
            if (nameAndValueMapOrArray === undefined) {
                return 'undefined';
            } else if (nameAndValueMapOrArray === null) {
                return 'null';
            }

            var i;
            var nameArray = [];
            var valueArray = [];


            if(Array.isArray(nameAndValueMapOrArray) && nameAndValueMapOrArray.length % 2 === 0) {
                for (i = 0; i < nameAndValueMapOrArray.length; i += 2) {
                    nameArray.push(nameAndValueMapOrArray[i]);
                    valueArray.push(nameAndValueMapOrArray[i + 1]);
                }

            } else if (typeof nameAndValueMapOrArray === 'object') {
                for (var key in nameAndValueMapOrArray) {
                    if (!nameAndValueMapOrArray.hasOwnProperty(key)) {
                        continue;
                    }
                    nameArray.push(key);
                    valueArray.push(nameAndValueMapOrArray[key]);
                }

            } else {
                return 'Invalid Argument';
            }

            var dumpStr = '';
            try {
                for(i=0; i < nameArray.length; i++){
                    var name = nameArray[i];
                    var value = valueArray[i];
                    if (i > 0) {
                        dumpStr += delimiter;
                    }
                    if (isJsonEnabled) {
                        var jsonString = null;
                        try {
                            jsonString = JSON.stringify(value);
                        } catch (e) {
                            jsonString = 'JSON.stringify() failed. ' + this.getErrorMessage(e);
                        }
                        dumpStr += '(JSON)' + name + ':\'' + jsonString + '\'';
                    } else {
                        if (value === undefined || value === null) {
                            dumpStr += '(' + value + ')' + name;
                        } else if (Array.isArray(value)) {
                            dumpStr += '(Array)' + name + '[' + value.length + ']';
                        } else if (typeof value === 'object') {
                            var length = null;
                            try {
                                if (typeof value.length === 'number') {
                                    length = value.length;
                                } else {
                                    length = Object.keys(value).length;
                                }
                            } catch (e) {
                                length = 'N/A';
                            }
                            dumpStr += '(object)' + name + '[' + length + ']';
                        } else {
                            dumpStr += '(' + typeof value + ')' + name + ':\'' + value + '\'';
                        }
                    }
                }
            } catch (e) {
                this.logErrorObjectE(logFunctionName, e);
            }
            return dumpStr;
        };

        /**
         * Retrieve error message from error object.
         *
         * @param {SuiteScriptError|UserEventError|Error} errorObj - Standard error object or Suite Script error object
         * @param {string} [delimiter] - Delimiter between each elements. default is ', '
         * @returns {string} error message retrieved from error object
         */
        LoggerModule.prototype.getErrorMessage = function (errorObj, delimiter) {
            if (errorObj === null) {
                return 'Error object is null';
            } else if (errorObj === undefined) {
                return 'Error object is undefined';
            }
            if (!delimiter) {
                delimiter = ', ';
            }
            var returnMessage = null;
            if (typeof Error === 'function' && errorObj instanceof Error) {
                returnMessage = '[Message] \'' + errorObj.message + '\'';

            } else if (typeof errorObj === 'object') {
                // assume errorObj is SuiteScriptError or UserEventError
                // typeof errorObj === 'function' && (errorObj instanceof SuiteScriptError || errorObj instanceof UserEventError)

                var name = errorObj.name;
                var message = errorObj.message;
                var eventType = errorObj.eventType;  // undefined for SuiteScriptError
                var id = errorObj.id;
                var recordId = errorObj.recordId;    // undefined for SuiteScriptError
                var stack = errorObj.stack;
                if(Array.isArray(stack)) {
                    stack = stack.join(delimiter);
                }

                // add standard property of Error object
                returnMessage =
                    '[Name] \'' + name + '\'' + delimiter +
                    '[Message] \'' + message + '\'' + delimiter +
                    '[ID] \'' + id + '\'' + delimiter +
                    '[Stack] \'' + stack + '\'';
                if (eventType) {
                    returnMessage += delimiter + '[Event Type] \'' + eventType + '\'';
                }
                if (recordId) {
                    returnMessage += delimiter + '[Record ID] \'' + recordId + '\'';
                }

            } else {
                returnMessage = 'Error object is unexpected type';
            }
            return returnMessage;
        };


        /**
         * Submit Log Report record. The record contains log entries and execution context.
         *
         * @param {string} [message]
         * @param {Error|SuiteScriptError|UserEventError} [errorObj]
         */
        LoggerModule.prototype.submitLogToLogReportRecord = function (message, errorObj) {
            var logFunctionName = _LOG_MODULE_NAME + 'submitLogToLogReportRecord';

            var logReport = this.getLogReport(message, errorObj);
            var logReportJsonString = null;
            try {
                logReportJsonString = JSON.stringify(logReport);
            } catch (e) {
                logReportJsonString = 'JSON.stringify() failed. ' + this.getErrorMessage(e);
            }

            var scriptId = '';
            var deploymentId = '';

            var script = nsRuntime.getCurrentScript();
            if (script) {
                scriptId = script.id || '';
                deploymentId = script.deploymentId || '';
            }

            var newLogReportRecord = null;
            try {
                // Log Report record may not exist
                newLogReportRecord = nsRecord.create({type: this._LOG_REPORT_RECORD_TYPE});
                newLogReportRecord.setValue({fieldId: this._LOG_REPORT_RECORD_FIELD_SCRIPT_ID, value: scriptId});
                newLogReportRecord.setValue({fieldId: this._LOG_REPORT_RECORD_FIELD_DEPLOYMENT_ID, value: deploymentId});
                newLogReportRecord.setValue({fieldId: this._LOG_REPORT_RECORD_FIELD_LOG_REPORT_JSON, value: logReportJsonString.slice(0, 1000000)}); // Long Text field contains up to 1,000,000 characters
                newLogReportRecord.save({enableSourcing: true, ignoreMandatoryFields: false});
            } catch (e) {
                this.logErrorObject(this.LOG_LEVEL.AUDIT, logFunctionName, e, 'Failed to create Log Report record.', null, false);
            }
        };

        /**
         * Returns object contains all log and execution context.
         *
         * @param {string} message
         * @param {Error|SuiteScriptError|UserEventError} [errorObj]
         * @returns {Object}
         */
        LoggerModule.prototype.getLogReport = function (message, errorObj) {
            var errorString = '';
            if (!errorObj) {
                errorString = null;
            } else {
                errorString = this.getErrorMessage(errorObj);
            }

            var accountId = nsRuntime.accountId || '';
            var environment = nsRuntime.envType || '';
            var userId = '';
            var executionContext = nsRuntime.executionContext || '';
            var scriptId = '';
            var deploymentId = '';
            var remainingUsage = '';

            var script = nsRuntime.getCurrentScript();
            if (script) {
                scriptId = script.id || '';
                deploymentId = script.deploymentId || '';
                remainingUsage = script.getRemainingUsage(null) || '';
            }

            var user = nsRuntime.getCurrentUser();
            if (user) {
                userId = user.id || '';
            }

            var contextInfo = {
                accountId: accountId,
                environment: environment,
                userId: userId,
                executionContext: executionContext,
                scriptId: scriptId,
                deploymentId: deploymentId,
                remainingUsage: remainingUsage
            };

            return {
                message: message,
                errorObj: errorString,
                contextInfo: contextInfo,
                logEntryArray: this.logEntryArray
            };
        };

        return new LoggerModule();
    });
