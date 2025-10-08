/**
* @NApiVersion 2.1
* @NScriptType UserEventScript
* @NModuleScope Public
*/

define(['N/record', 'N/search'], function (record, search) {
    const afterSubmit = (context) => {

        let { type, newRecord } = context;
        if (type != 'create' && type != 'edit')
            return;

        let soId = newRecord.id;
        log.debug({
            title: 'soId',
            details: soId
        });

        try {

            const objSalesOrder = record.load({
                type: record.Type.SALES_ORDER,
                id: soId,
                isDynamic: false
            });

            let intCustomer = objSalesOrder.getValue({ fieldId: 'entity' });
            let totalComNotStart = objSalesOrder.getValue({ fieldId: 'custbody_hinkley_total_commission_not' }) || '';
            let flCustomerCommissionRate = 0;
            let intBaseDNForCom = 0;
            let soLineCount = objSalesOrder.getLineCount({
                sublistId: 'item'
            });

            if (intCustomer) {
                let objCustomerLookup = search.lookupFields({
                    type: 'customer',
                    id: +intCustomer,
                    columns: ['custentity_atlas_cpr_cuscomrate', 'custentity_hli_base_dn_com'],
                })

                log.debug({
                    title: 'objCustomerLookup',
                    details: objCustomerLookup
                });

                flCustomerCommissionRate = parseFloat((objCustomerLookup.custentity_atlas_cpr_cuscomrate).replace('%', '')) / 100;
                intBaseDNForCom = objCustomerLookup.custentity_hli_base_dn_com[0].value;
            };

            for (let i = 0; i < soLineCount; i++) {
                let intItem = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i });
                let flDiscItemRate = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_rma_disc_item_rate', line: i });
                let intQty = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                let flAmount = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                let flItemComRate = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_item_com_rate', line: i });
                let blOverrideCom = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_override_commissions', line: i });
                let flBasePrice = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcoll_hinkley_baseprice_line', line: i });
                let flRate = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                let flCusNetUnitPrice = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hli_customer_net_unit_price', line: i });
                let blCommercial = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custbody_hinkley_rma_commercial', line: i });
                let flOverageComPctRaw = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_overage_commission_pe', line: i });
                log.debug({
                    title: 'flOverageComPctRaw',
                    details: flOverageComPctRaw
                });
                let baseCommisionAmount = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', line: i });
                let overCom = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_inv_over_com', line: i });
                let custComRate = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_cus_com_rate', line: i });
                let effectiveComRate = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_effective_com_rate', line: i });
                let canadaDn = objSalesOrder.getSublistValue({ sublistId: 'item', fieldId: 'custcol_hli_canada_dn', line: i });
                // let flOverageCommissionPercent = parseFloat((flOverageComPctRaw).replace('%', '')) / 100;
                let flOverageCommissionPercent = parseFloat(flOverageComPctRaw) / 100;
                let flDiscountedAmount = 0;
                let flItemRecComRate = 0;
                let flEffectiveCommRate = 0;
                let flCanadaDNStored = 0;

                if (intItem) {
                    let objItem = search.lookupFields({
                        type: search.Type.ITEM,
                        id: Number(intItem),
                        columns: ['custitem_hinkley_item_com_rate', 'custitem_hli_canada_dn_stored']
                    });
                    log.debug({
                        title: 'objItem',
                        details: objItem
                    })
                    flItemRecComRate = objItem.custitem_hinkley_item_com_rate;
                    flCanadaDNStored = objItem.custitem_hli_canada_dn_stored;
                }

                log.debug({
                    title: 'Item Line Field Values',
                    details: `flDiscItemRate: ${flDiscItemRate} intQty: ${intQty} flAmount: ${flAmount} flItemComRate: ${flItemComRate} 
                    blOverrideCom: ${blOverrideCom} flBasePrice: ${flBasePrice} flRate:${flRate} flCusNetUnitPrice:${flCusNetUnitPrice} blCommercial:${blCommercial} 
                    flOverageCommissionPercent: ${flOverageCommissionPercent} flItemRecComRate: ${flItemRecComRate} flCanadaDNStored: ${flCanadaDNStored} 
                    intBaseDNForCom: ${intBaseDNForCom} flCustomerCommissionRate: ${flCustomerCommissionRate}`
                });

                if (flDiscItemRate) {
                    flDiscountedAmount = intQty * flDiscItemRate;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'amount', value: flDiscountedAmount, line: i });
                }
                objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_effective_item_rate', value: flDiscountedAmount ? flDiscountedAmount / intQty : flAmount / intQty, line: i });

                if (flCustomerCommissionRate) {
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_cus_com_rate', value: flCustomerCommissionRate, line: i });
                }

                //Base Commission Rate Assignment
                if (flItemComRate <= flCustomerCommissionRate && blOverrideCom == false && flItemRecComRate) {
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_effective_com_rate', value: flItemRecComRate * 100, line: i });
                    flEffectiveCommRate = flItemRecComRate * 100;
                }
                else if ((flCustomerCommissionRate <= flItemComRate || !flItemComRate) && blOverrideCom == false) {
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_effective_com_rate', value: flCustomerCommissionRate, line: i });
                    flEffectiveCommRate = flCustomerCommissionRate;
                }

                //Base Commission Amount Assignment

                let flBComsRate = flDiscItemRate || flRate; // Default to 'rate' if 'custcol_hinkley_rma_disc_item_rate' is null or undefined
                let flBComms = flItemComRate || 0; // Default to 0 if 'custcol_hinkley_so_item_com_rate' is null or undefined
                let flBaseComms = 0;
                let flBComsRateCA = flDiscItemRate || flCanadaDNStored;

                if (flRate > flBasePrice && intBaseDNForCom == 2) { // 2 is US DN
                    flBaseComms = (flBComsRate * intQty) * (flBComms !== 0 ? flBComms : 1);
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (flRate <= flBasePrice && intBaseDNForCom == 2) { // 2 is US DN
                    flEffectiveCommRate = flEffectiveCommRate !== 0 ? flEffectiveCommRate : 1;
                    flBaseComms = (flBComsRate * intQty) * flEffectiveCommRate;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (flRate > flCanadaDNStored && intBaseDNForCom == 1) {// 1 is Canada DN
                    flEffectiveCommRate = flEffectiveCommRate !== 0 ? flEffectiveCommRateflEffectiveCommRate : 1;
                    flBaseComms = (flBComsRateCA * intQty) * flEffectiveCommRate;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (flRate <= flCanadaDNStored && intBaseDNForCom == 1) {// 1 is Canada DN
                    flEffectiveCommRate = flEffectiveCommRate !== 0 ? flEffectiveCommRateflEffectiveCommRate : 1;
                    flBaseComms = flEffectiveCommRate * flAmount;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (intBaseDNForCom == 2 && flCusNetUnitPrice < flBasePrice && blCommercial ==  true) {// 2 is US DN
                    flEffectiveCommRate = effectiveComRate * intQty * flBasePrice; 
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if ((intBaseDNForCom == 2 && flCusNetUnitPrice > flBasePrice) || (intBaseDNForCom == 1 && canadaDn > flCusNetUnitPrice && blCommercial ==  true)) {// 2 is US DN
                    flEffectiveCommRate = effectiveComRate * intQty * flRate; 
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (intBaseDNForCom == 1 && flCusNetUnitPrice < canadaDn && blCommercial ==  true) {
                    flEffectiveCommRate = effectiveComRate * intQty * flBasePrice; 
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (flRate <= flBasePrice && intBaseDNForCom == 2) {
                    log.debug({
                        title: 'TEST',
                        details: 'YES'
                    });
                    flEffectiveCommRate = flRate *  intQty * effectiveComRate;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else if (flRate > flBasePrice && intBaseDNForCom == 2) {
                    
                    flEffectiveCommRate = flBasePrice *  intQty * effectiveComRate;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flBaseComms, line: i });
                }
                else {
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_so_eff_com_amount', value: flEffectiveCommRate * flAmount, line: i });
                }

                //Overage Amount Assignment

                let flOverage = 0;
                let flOverageCommission = 0;

                if (flCusNetUnitPrice <= flBasePrice && intBaseDNForCom == 2 && blCommercial == true && flRate >= flBasePrice) {
                    flOverage = (flRate - flBasePrice) * intQty;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_overage_amount', value: flOverage, line: i });
                }
                else if (flCusNetUnitPrice > flBasePrice && intBaseDNForCom == 2 && blCommercial == true && flRate > flCusNetUnitPrice) {
                    flOverage = (flRate - flCusNetUnitPrice) * intQty;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_overage_amount', value: flOverage, line: i });
                }
                else if (flRate > flCanadaDNStored && intBaseDNForCom == 1 && blCommercial == true) {
                    flOverage = (flRate - flCanadaDNStored) * intQty;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_overage_amount', value: flOverage, line: i });
                }
                else if (blCommercial == false) {
                    flOverage = 0;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_overage_amount', value: flOverage, line: i });
                }
                else if (flRate <= flBasePrice) {
                    flOverage = 0;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_overage_amount', value: flOverage, line: i });
                }

                //Set Overage Commission 
                if (blCommercial == false) {
                    flOverageCommission = 0;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_inv_over_com', value: flOverageCommission, line: i });
                }
                else {
                    flOverage = flOverage || 0;
                    flOverageCommissionPercent = flOverageCommissionPercent || 0;
                    flOverageCommission = (flOverage * flOverageCommissionPercent) || 0;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_inv_over_com', value: flOverageCommission, line: i });
                }


                if (newRecord.type == 'salesorder' || newRecord.type == 'quote' || newRecord.type == 'invoice') {

                    var totalComAmt = baseCommisionAmount + overCom;
                    log.debug({
                        title: 'totalComAmt===',
                        details: totalComAmt
                    });
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_total_commission_amou', value: totalComAmt, line: i });
                }
                else if (intItem == 18878 && (newRecord.type == 'creditmemo' || newRecord.type == 'returnauthorization')) { // PRICE ADJUSTMENT
                    var totalComAmt = flAmount * custComRate;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_total_commission_amou', value: totalComAmt, line: i });
                }
                else if (intItem != 18878 && (newRecord.type == 'creditmemo' || newRecord.type == 'returnauthorization')) {
                    var totalComAmt = baseCommisionAmount + overCom;
                    objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custcol_hinkley_total_commission_amou', value: totalComAmt, line: i });
                }

                objSalesOrder.setSublistValue({ sublistId: 'item', fieldId: 'custbody_hinnkley_total_commission', value: totalComNotStart, line: i });



            }
            // Save the newRecord.
            try {
                let newRecordId = objSalesOrder.save();
                log.debug({
                    title: 'newRecord created successfully',
                    details: 'Id: ' + newRecordId
                });
            } catch (e) {
                log.error({
                    title: e.name,
                    details: e.message
                });
            }


        } catch (e) {
            log.error({
                title: e.name,
                details: e.message
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});

