/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/log', 'N/record'], (log, record) => {

    const beforeSubmit = (context) => {
        const logTitle = 'beforeSubmit[::]';

        try {
            const currentRecord = context.newRecord;

            const installmentLineCount = currentRecord.getLineCount({
                sublistId: 'installment'
            });

            const installmentArray = [];

            if (installmentLineCount > 0) {

                for (let lineIndex = 0; lineIndex < installmentLineCount; lineIndex++) {
                    
                    const installmentData = {
                        sequenceNumber: currentRecord.getSublistValue({
                            sublistId: 'installment',
                            fieldId: 'seqnum',
                            line: lineIndex
                        }),
                        dueDate: currentRecord.getSublistText({
                            sublistId: 'installment',
                            fieldId: 'duedate',
                            line: lineIndex
                        }),
                        amount: currentRecord.getSublistValue({
                            sublistId: 'installment',
                            fieldId: 'amount',
                            line: lineIndex
                        }),
                        status: currentRecord.getSublistText({
                            sublistId: 'installment',
                            fieldId: 'status',
                            line: lineIndex
                        })
                    };

                    installmentArray.push(installmentData);
                }
            }

            log.debug({
                title: 'Installment Array',
                details: installmentArray
            });

            if (installmentArray.length > 0) {
                currentRecord.setValue({
                    fieldId: 'custbody_djo_invoice_array',
                    value: JSON.stringify(installmentArray)
                });
            }

        } catch (error) {
            log.error({
                title: `${logTitle} ${error.name}`,
                details: error.message
            });
        }
    };

    return {
        beforeSubmit
    };
});
