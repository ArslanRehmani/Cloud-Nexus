/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 */
define(['N/log', 'N/url'],
    function (log, url) {
        function fieldChanged(context) { }
        function btnClicked() {
            try {
                open('https://6485266-sb1.app.netsuite.com/app/center/card.nl?sc=-29&whence=', "_parent")
            } catch (e) {
                log.debug({ title: "debug: beforeLoad", details: JSON.stringify(e) });
            }
        }
        return {
            fieldChanged: fieldChanged,
            btnClicked: btnClicked
        }
    });