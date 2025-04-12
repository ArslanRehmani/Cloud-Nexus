'use strict';
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define([],function(){

	var LISTS = {
		STATUS : {
			ID: 'customlist_avt_cubiic_status',
			OPTIONS: {
				SUCCESS: 1,
				FAILURE: 2,
			}
		},

		IF_STATUS : {
			_PICKED: 'A',
			_PACKED: 'B',
			_SHIPPED: 'C'
		}
	};

    var RECORDS = {
		CONFIG : {
			ID: 'customrecord_avt_cubiic_config',
			FIELDS: {
				URL_API_BASE: 'custrecord_avt_cubiic_api_base_url',
				TOKEN: 'custrecord_avt_cubiic_config_token',
				TOKEN_VALID_TO: 'custrecord_avt_cubiic_config_token_to',
				LOGIN_EMAIL: 'custrecord_avt_cubiic_config_login_email',
				LOGIN_PASSWORD: 'custrecord_avt_cubiic_config_login_pass',
				LOGIN_WMS_CODE: 'custrecord_avt_cubiic_config_wms_code',
				CREATE_AS_DRAFT: 'custrecord_avt_cubiic_config_as_draft',
				USE_IFS_PACKAGE_RECORD: 'custrecord_avt_cubiic_config_use_ifs_pac',
				UPDATE_IF_STATUS: 'custrecord_avt_cubiic_config_update_if'
			}
		},

		IFS_SENDER : {
			ID: 'customrecord_avt_ifs_sender',
			FIELDS: {
				NAME: 'custrecord_avt_ifs_sendername',
				ADDRESS1: 'custrecord_avt_ifs_senderaddr1',
				ADDRESS2: 'custrecord_avt_ifs_senderaddr2',
				CITY: 'custrecord_avt_ifs_sendercity',	//For Suburb
				STATE: 'custrecord_avt_ifs_senderstate',
				POSTCODE: 'custrecord_avt_ifs_senderzip',
				COUNTRY: 'custrecord_avt_ifs_sendercountry',
				CONTACT: 'custrecord_avt_ifs_sendercontact',
				PHONE: 'custrecord_avt_ifs_senderphone',
				EMAIL: 'custrecord_avt_ifs_sendemail',
			}
		},

		IFS_CARRIERS : {
			ID: 'customrecord_avt_ifs_carrier',
			FIELDS: {
				NAME: 'name',
				CODE: 'custrecord_avt_ifs_carriername'
			}
		},

		IFS_SERVICES : {
			ID: 'customrecord_avt_ifs_services',
			FIELDS: {
				NAME: 'name',
				DATA: 'custrecord_avt_ifs_data'		//Get Service Code for Cubiic from this field
			}
		},

		IFS_TERMINALS : {
			ID: 'customrecord_avt_ifs_terminals',
			FIELDS: {
				NAME: 'name',
				EMPLOYEE: 'custrecord_avt_ifs_term_emp',
				TERMINAL_ID: 'custrecord_avt_ifs_term_terminal'		//Get printer code for Cubiic from this field
			}
		},

		IFS_PACKAGES : {
			ID: 'customrecord_avt_ifs_record',
			FIELDS: {
				TRANSACTION_ID: 'custrecord_avt_ifs_record_transid',

				SHIP_CARRIER: 'custrecord_avt_ifs_shipcarrier',
				SHIP_SERVICE: 'custrecord_avt_ifs_shipservice',
				FREIGHT_TYPE: 'custrecord_avt_ifs_freight_type',
				TOTAL_PACKAGES: 'custrecord_avt_ifs_total_packages',
				TOTAL_WEIGHT: 'custrecord_avt_ifs_total_weight',
				//TOTAL_VOLUME: 'custrecord_avt_ifs_total_volume',  //Not using
				TOTAL_LENGTH: 'custrecord_avt_ifs_total_length',
				TOTAL_WIDTH: 'custrecord_avt_ifs_total_width',
				TOTAL_HEIGHT: 'custrecord_avt_ifs_total_height',
				ITEM_DESCRIPTION: 'custrecord_avt_ifs_item_package_desc',

				CONNOTE_NUMBER: 'custrecord_avt_ifs_connote_num'

				// SPECIAL_INSTRUCTIONS1: 'custrecord_avt_ifs_special_instructions1',
				// SPECIAL_INSTRUCTIONS2: 'custrecord_avt_ifs_special_instructions2',
				// SPECIAL_INSTRUCTIONS3: 'custrecord_avt_ifs_special_instructions3',
			}
		},

		IFS_FREIGHT_TYPE : {
			ID: 'customrecord_avt_ifs_freight_type',
			FIELDS: {
				NAME: 'name',
				DESCRIPTION: 'custrecord_avt_ifs_description'
			}
		}
    };

	var FIELDS = {
		TRANS_BODY_SENDER_LOCATION: 'custbody_avt_cubiic_sender_location',

		TRANS_BODY_IMPORT_STATUS: 'custbody_avt_cubiic_im_status',
		TRANS_BODY_IMPORT_DATETIME: 'custbody_avt_cubiic_im_datetime',
		TRANS_BODY_IMPORT_LOG: 'custbody_avt_cubiic_im_log',
		TRANS_BODY_REQUEST_DATA: 'custbody_avt_cubiic_data_request',
		TRANS_BODY_RESPONSE_DATA: 'custbody_avt_cubiic_data_response',
		TRANS_BODY_IS_AUTH_TO_LEAVE: 'custbody_avt_cubiic_is_auth_leave',
		TRANS_BODY_DANGEROUS_GOODS: 'custbody_gfl_dangerous_goods',//update

		TRANS_BODY_IFS_CONNOTE_NUMBER: 'custbody_avt_ifs_connote_num',
		TRANS_BODY_IFS_EMAIL_CONFIRMATION: 'custbody_avt_ifs_email_confirmation',
		TRANS_BODY_IFS_SENDER: 'custbody_avt_ifs_sender_business',

		TRANS_BODY_IFS_CARRIER: 'custbody_avt_ifs_shipcarrier',
		TRANS_BODY_IFS_SERVICE: 'custbody_avt_ifs_shipservice',

		TRANS_BODY_IFS_SPECIAL_INSTRUCTIONS1: 'custbody_avt_ifs_special_instructions1',
		TRANS_BODY_IFS_SPECIAL_INSTRUCTIONS2: 'custbody_avt_ifs_special_instructions2',
		TRANS_BODY_IFS_SPECIAL_INSTRUCTIONS3: 'custbody_avt_ifs_special_instructions3',

		TRANS_BODY_IFS_PACKAGE_FREIGHT_TYPE: 'custbody_avt_ifs_freight_type',
		TRANS_BODY_IFS_PACKAGE_TOTAL_PACKAGES: 'custbody_avt_ifs_total_packages',
		TRANS_BODY_IFS_PACKAGE_TOTAL_WEIGHT: 'custbody_avt_ifs_total_weight',
		//TRANS_BODY_IFS_PACKAGE_TOTAL_VOLUME: 'custbody_avt_ifs_total_volume',  //Not using
		TRANS_BODY_IFS_PACKAGE_TOTAL_LENGTH: 'custbody_avt_ifs_total_length',
		TRANS_BODY_IFS_PACKAGE_TOTAL_WIDTH: 'custbody_avt_ifs_total_width',
		TRANS_BODY_IFS_PACKAGE_TOTAL_HEIGHT: 'custbody_avt_ifs_total_height',
		TRANS_BODY_IFS_PACKAGE_ITEM_DESCRIPTION: 'custbody_avt_ifs_your_item_desc',
		//TRANS_BODY_IFS_PACKAGE_WEIGHT_PER_PACK: 'custbody_avt_ifs_total_weight_pkg',  //Not using
		//TRANS_BODY_IFS_PACKAGE_VOLUME_PER_PACK: 'custbody_avt_ifs_total_volume_pkg',  //Not uging
		//TRANS_BODY_IFS_PACKAGE_FREIGHT_LINE_REF: 'custbody_avt_ifs_freight_line_ref', //Not using
		//TRANS_BODY_IFS_PACKAGE_ASSET_TYPE: 'custbody_avt_ifs_asset_type',			//Not using

		OTHRE_CUBIIC_WAREHOUSE_CODE: 'custrecord_avt_cubiic_warehouse_code'
	};

	var SEARCHES = {
	};

	var SCRIPTS = {
        SENDER_IF : {
            ID: 'customscript_avt_cubiic_sender_if',
            DEPLOYMENT_ID: 'customdeploy_avt_cubiic_sender_if',
			URL_PARAMS: {
            	IF_ID: 'ifid'
			}
        },
		UE_ADD_BTN_SEND_DATA: {
        	ID: 'customscript_avt_cubiic_if_ue'
		}
	};

	var BUTTONS = {
		SEND_DATA : {
			ID: 'custpage_send_data_cubiic',
			LABEL: 'Import To Cubiic',
			FUNCTION_NAME: 'onBtnSendToCubiic',
			CS_PATH: 'SuiteBundles/Bundle 356429/AVT-CubiicIntegration/SendDataToCubiicCS.js'
			//CS_PATH: 'SuiteScripts/AVT-CubiicIntegration/SendDataToCubiicCS.js' 	//For Development account
		}
	};

    return {
		LISTS: LISTS,
        RECORDS: RECORDS,
		FIELDS: FIELDS,
		SEARCHES: SEARCHES,
		SCRIPTS: SCRIPTS,
		BUTTONS: BUTTONS
    }
});
