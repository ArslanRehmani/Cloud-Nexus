/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['./bigw_lib', 'N/file'],

function(bigwLib, file) {
   
    /**
     * Definition of the Scheduled script trigger point.
     *
     * @param {Object} scriptContext
     * @param {string} scriptContext.type - The context in which the script is executed. It is one of the values from the scriptContext.InvocationType enum.
     * @Since 2015.2
     */
    function execute(scriptContext) {
        
        var bigwInventory = new bigwLib.bigwInventory();
        // var bigwInventory = new bigwLib.bigwInventory(true);
        log.debug('bigwInventory', bigwInventory);
        if (bigwInventory.csv_contents && util.isString(bigwInventory.csv_contents)) {
            var bigwConn = new bigwLib.bigwSFTP('inventory');
            var fileName = bigwConn.generateFileName('inventory') + '.csv';
            var csvFile = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: bigwInventory.csv_contents,
                encoding: file.Encoding.UTF8,
                // folder: '4825389',
            });
            // csvFile.save();
            bigwConn.upload(csvFile);
        }
    }

    return {
        execute: execute
    };
    
});
