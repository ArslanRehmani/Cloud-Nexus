/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/search'], function (serverWidget, search) {

    function beforeLoad(context) {
        var title = 'beforeLoad[::]';
        try {

            var type = context.type;

            var form = context.form

            var currentRecord = context.newRecord;
            // Fields that will be hidden in Create, Edit mode

            if (currentRecord.type == 'projecttask' && (type == context.UserEventType.CREATE || type == context.UserEventType.EDIT || type == context.UserEventType.VIEW)) {

                hideColumnField(form, 'assignee', 'units');

                hideColumnField(form, 'assignee', 'unitcost');

                hideColumnField(form, 'assignee', 'estimatedwork');

            }

            else if (currentRecord.type == 'resourceallocation') {

                hideBodyField(form, 'allocationamount');

                hideBodyField(form, 'allocationtype');

                hideExtraData(form, 'allocationunit_fs');

            }

            else if (currentRecord.type == 'job') {

                var parent = currentRecord.getValue('parent');

                if (parent) {

                    var isMaster = isMasterProject(parent);

                    if (isMaster == true) {

                        //  updateFieldLabel(form, 'custentity24');
                    }
                }

                if (type == context.UserEventType.CREATE) return;

                var isMasterPrject = isMasterProject(currentRecord.id);

                if (isMasterPrject == true) {

                    hideExtraData(form, 'tbl_custpage_create_pr');

                }

            }

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }
    function beforeSubmit(context) {
        var title = 'beforeSubmit[::]';
        try {
            var rec = context.newRecord;
            var subCustomer = rec.getValue({ fieldId: 'custentity_sub_customer' });
            if (subCustomer) {
                // rec.setValue({ fieldId: 'customform', value: 338 });//MTP Site Project Form
                rec.setValue({ fieldId: 'custentity_is_sub_project', value: true });
                var defaultShipAddress = defaultCustShipAddress(subCustomer);
                log.debug({
                    title: 'defaultShipAddress',
                    details: defaultShipAddress
                });
                if (defaultShipAddress) {
                    rec.setValue({ fieldId: 'custentity24', value: defaultShipAddress });
                }

            }

        } catch (e) {
            log.error(title + e.name, e.message);
        }
    }

    function hideColumnField(formObj, sublistId, fieldId) {
        try {

            const formSublist = formObj.getSublist({ id: sublistId });

            if (formSublist) {

                const formField = formSublist.getField({ id: fieldId });

                if (formField && typeof formField !== 'undefined' && formField !== null) {

                    formField.isMandatory = false;

                    formField.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.HIDDEN
                    });

                }
            }
        } catch (e) {
            log.error('hideColumnField Exception', e.message);
        }
    }

    function hideBodyField(formObj, fieldId) {
        try {
            const formField = formObj.getField({ id: fieldId });

            if (formField && typeof formField !== 'undefined' && formField !== null) {

                formField.isMandatory = false;

                formField.updateDisplayType({
                    displayType: serverWidget.FieldDisplayType.HIDDEN
                });

            }
        } catch (e) {
            log.error('hideColumnField Exception', e.message);
        }
    }

    function hideExtraData(form, fldId) {

        try {

            var hideFld = form.addField({
                id: 'custpage_button',
                label: 'Hidden field',
                type: serverWidget.FieldType.INLINEHTML
            });

            var scr = "";

            scr += 'jQuery("#' + fldId + '").hide();';

            hideFld.defaultValue = "<script>jQuery(function($){require([], function(){" + scr + ";})})</script>"

        } catch (e) {

            log.error('hideExtraData Exception', e.message);
        }
    }

    function isMasterProject(projectId) {

        var isMasterProject = false;

        try {

            var jobSearchObj = search.create({
                type: "job",
                filters:
                    [
                        ["parent", "anyof", projectId],
                        "AND",
                        ["internalidnumber", "notequalto", projectId]
                    ],
                columns:
                    [
                        search.createColumn({ name: "entityid", label: "Name" }),
                    ]
            });
            var searchResultCount = jobSearchObj.runPaged().count;

            jobSearchObj.run().each(function (result) {

                isMasterProject = true;

                return true;
            });

        } catch (e) {

            log.error('isMasterProject Exception', e.message);
        }
        return isMasterProject;
    }

    function updateFieldLabel(form, fldId) {
        try {

            var field = form.getField({ id: fldId });

            if (field) {

                field.label = 'PROJECT SHIP TO ADDRESS';

            }

        }
        catch (e) {

            log.error('updateFieldLabel Exception', e.message);
        }
    }
    function defaultCustShipAddress(id) {
        var title = 'titleName[::]';
        var address = '';
        try {
            var customerSearchObj = search.create({
                type: "customer",
                filters:
                    [
                        ["internalid", "anyof", id],
                        "AND",
                        ["isdefaultshipping", "is", "T"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "altname", label: "Name" }),
                        search.createColumn({ name: "isdefaultshipping", label: "Default Shipping Address" }),
                        search.createColumn({ name: "address", label: "Address" })
                    ]
            });
            customerSearchObj.run().each(function (result) {
                address = result.getValue({ name: 'address' });
                return true;
            });
        } catch (e) {
            log.error(title + e.name, e.message);
        }
        return address || '';
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit
    }
});
