/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/log', 'N/record', 'N/search', 'N/ui/serverWidget', 'N/redirect'],
    /**
 * @param{log} log
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{redirect} redirect
 */
    (log, record, search, serverWidget, redirect) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var title = 'onRequest[::]';
            try {
                var request = scriptContext.request;
                var response = scriptContext.response;
                if (request.method === 'GET') {
                    createSuiteletFrom(response);
                }
                //Post Method
                else {
                    var obj;
                    var empAttendenceArray = [];
                    var lineCount = request.getLineCount({ group: 'custpage_employee_list' });
                    //Get Date
                    var date = scriptContext.request.parameters.custpage_date; 
                    for (var k = 0; k < lineCount; k++) {
                        obj = {};
                        obj.emp = request.getSublistValue({
                            group: 'custpage_employee_list',
                            name: 'custpage_employee',
                            line: k
                        });
                        obj.present = request.getSublistValue({
                            group: 'custpage_employee_list',
                            name: 'custpage_present',
                            line: k
                        });
                        obj.absent = request.getSublistValue({
                            group: 'custpage_employee_list',
                            name: 'custpage_absent',
                            line: k
                        });
                        obj.wfh = request.getSublistValue({
                            group: 'custpage_employee_list',
                            name: 'custpage_wfh',
                            line: k
                        });
                        obj.onroad = request.getSublistValue({
                            group: 'custpage_employee_list',
                            name: 'custpage_onroad',
                            line: k
                        });
                        empAttendenceArray.push(obj);
                    }
                    if (empAttendenceArray && empAttendenceArray.length > 0) {
                        //craete Daily Employee Attendence Record function
                        createDailyAttendanceRecord(empAttendenceArray,date);
                    }
                    //Redirect to Same Suitelet
                    redirect.toSuitelet({
                        scriptId: 'customscript_cnl_sl_employee_attendence',
                        deploymentId: 'customdeploy_cnl_sl_employee_attendence'
                    });
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function createSuiteletFrom(response) {
            var title = 'createSuiteletFrom[::]';
            try {
                var form = serverWidget.createForm({
                    title: 'Employee Attendence Form',
                });
                form.clientScriptModulePath = '../Client script/cs_employeeAttendence.js';
                var todayDate = form.addField({
                    id: 'custpage_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Today Date',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });
                todayDate.defaultValue = new Date();
                var sublist = form.addSublist({
                    id: 'custpage_employee_list',
                    type: serverWidget.SublistType.LIST,
                    label: 'Employees',
                });
                sublist.addField({
                    id: 'custpage_serialnum',
                    type: serverWidget.FieldType.INTEGER,
                    label: 'Line Number',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });
                sublist.addField({
                    id: 'custpage_employee',
                    type: serverWidget.FieldType.SELECT,
                    source: 'employee',
                    label: 'Emplpoyee',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.INLINE,
                });
                sublist.addField({
                    id: 'custpage_present',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Present',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });
                sublist.addField({
                    id: 'custpage_absent',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Absent',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });
                sublist.addField({
                    id: 'custpage_wfh',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'Work From Home',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });
                sublist.addField({
                    id: 'custpage_onroad',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'On Road',
                }).updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.NORMAL,
                });

                var searchResults = employeeAttendenceSearch();
                if (searchResults && searchResults.length > 0) {
                    for (var l = 0; l < searchResults.length; l++) {
                        var result = searchResults[l];
                        sublist.setSublistValue({
                            id: 'custpage_employee',
                            value: parseInt(result.empId),
                            line: l
                        });
                        sublist.setSublistValue({
                            id: 'custpage_serialnum',
                            value: parseInt(l+1),
                            line: l
                        });
                    }
                }
                form.addButton({
                    id : 'custpage_all_present',
                    label : 'All Present',
                    functionName: 'allPresent()'
                });
                form.addSubmitButton({
                    label: 'Submit',
                });
                response.writePage(form);
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        function employeeAttendenceSearch() {
            var title = 'employeeAttendenceSearch[::]';
            var array = [];
            var obj;
            try {
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters:
                        [
                            ["isinactive", "is", "F"],
                            "AND",
                            ["custentity_enable_for_attendance", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            })
                        ]
                });
                employeeSearchObj.run().each(function (result) {
                    obj = {};
                    obj.empId = result.id;
                    array.push(obj);
                    return true;
                });
            } catch (e) {
                log.error(title + e.name, e.message);
            }
            return array || [];
        }
        function createDailyAttendanceRecord(arr, date) {
            var title = 'createDailyAttendanceRecord[::]';
            try {
                for(var m = 0; m < arr.length; m++){
                    var empObj = arr[m];
                    var dailyAttendanceRec = record.create({
                        type: 'customrecord_daily_attendance'
                    });
                    dailyAttendanceRec.setValue({
                        fieldId: 'custrecord_employee',
                        value: parseInt(empObj.emp)
                    });
                    if(empObj.present == 'T' || empObj.present == true){
                        dailyAttendanceRec.setValue({
                            fieldId: 'custrecord_present',
                            value: true
                        });
                    }
                    if(empObj.absent == 'T' || empObj.absent == true){
                        dailyAttendanceRec.setValue({
                            fieldId: 'custrecord_absent',
                            value: true
                        });
                    }
                    if(empObj.wfh == 'T' || empObj.wfh == true){
                        dailyAttendanceRec.setValue({
                            fieldId: 'custrecord_work_from_home',
                            value: true
                        });
                    }
                    if(empObj.onroad == 'T' || empObj.onroad == true){
                        dailyAttendanceRec.setValue({
                            fieldId: 'custrecord_on_road',
                            value: true
                        });
                    }
                    dailyAttendanceRec.setValue({
                        fieldId: 'custrecord_attendance_date',
                        value: new Date(date)
                    });
                    dailyAttendanceRec.save();
                }
            } catch (e) {
                log.error(title + e.name, e.message);
            }
        }
        return { onRequest }

    });
