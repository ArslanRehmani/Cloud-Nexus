          /**
 *@NApiVersion 2.x
 *@NScriptType Portlet
 */

// This sample creates a portlet that displays simple HTML
define([], function() {
    function render(params) {
        params.portlet.clientScriptModulePath = '/SuiteScripts/AlphaBold/Portlet Script Execute Schedule Script/AB_CS_EXECUTE_SCHEDULESCRIPT.js';
        params.portlet.title = 'Save File To Folder';
        var content = '<td><span><input id="ab_button" class="ab_portlet_btn" type="button" onclick="btnClicked" value="Execute SCript"></span></td>';
        params.portlet.html = content;
    }

    return {
        render: render
    };
}); 

        