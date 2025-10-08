/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(['./sales_order_plugins', 'N/search'], function(plugins, search) {
    /**
     * 
     * @param {object} scriptContext 
     * @param {record} scriptContext.newRecord - The new record. record.Record.save() is not permitted.
     * @param {record} scriptContext.oldRecord - The old record. record.Record.save() is not permitted.
     * @param {Form} scriptContext.Form - The form through which the script interacts with the record. This parameter is available only in the beforeLoad context.
     * @param {string} scriptContext.type - An event type, such as create, edit, view, or delete.
     * @param {integer} scriptContext.workflowId - The internal ID of the workflow that calls the script.
     */
    function onAction(scriptContext) {
        log.debug('start', '--------------------')
        const recordFields = search.lookupFields({
            type: scriptContext.newRecord.type,
            id: scriptContext.newRecord.id,
            columns: ['tranid', 'shippingaddress.state', 'shipmethod', 'location']
        });
        log.debug('recordFields', recordFields)
        let locationId = !_.isEmpty(recordFields.location) && recordFields.location[0].value

        try {
            locationId = plugins.locationMapper(scriptContext)

        } catch (error) {
            log.error('locationMapper error', error)
        }
        log.debug('end', '------------------------')
        return locationId
    }

    return {
        onAction: onAction
    }
});