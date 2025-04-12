/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
    const pageInit = (context) => {

        let tdColor = '#B2FF33'; 
        let sublistId = 'custpage_ebay_orders'; 
        let sublist = document.getElementById(sublistId + '_splits'); 

        let totalRows = sublist.getElementsByTagName('tr').length;
        
        for (let i = 0; i < totalRows - 1; i++) { 
            let trDom = document.getElementById(sublistId + 'row' + i);

            if (!trDom) {
                continue;
            }

            let statusCell = trDom.children[3]; 

            if (statusCell) {
                let statusText = statusCell.innerText.trim();

                if (statusText === 'Sync') {
                    for (let t = 0; t < trDom.children.length; t++) {
                        let tdDom = trDom.children[t];
                        tdDom.setAttribute(
                            'style',
                            `background-color: ${tdColor} !important; border-color: white ${tdColor} ${tdColor} ${tdColor} !important;`
                        );
                    }
                }
            }
        }

    };

    return { 
        pageInit: pageInit 
    };
});
