/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/record','N/render','N/runtime','N/search'],

    (record,render, runtime, search) => {

        let CONST = {
            templateId: 'CUSTTMPL_128_6937542_SB1_930',
        }

        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = context => {
            const { request, response } = context;
            try {
                let params = request.parameters;
                log.debug('params.id', params.id);
                if (!params) {
                    log.error('--ERROR--', 'Missing params.')
                }

                let renderer = render.create();
                let rec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: params.id
                });
                // Add customer record as record
                renderer.addRecord({
                    templateName: 'record',
                    record: rec,
                });
                renderer.setTemplateByScriptId(CONST.templateId);
                response.writeFile(renderer.renderAsPdf(), true);
            }
            catch (e) {
                log.error('---ERROR---', e.message);
            }
        }

        return {
            onRequest
        };

    });
