/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/https', 'N/record', 'N/search', 'N/log', 'N/query'],
    (https, record, search, log, query) => {

        const getInputData = (inputContext) => {
            try {
                var filters = [
                    // {
                    //     field: "is_exported_to_io",
                    //     value: "1",
                    //     conditionType: "eq"
                    // },
                    // {
                    //     field: "status",
                    //     value: "processing,complete",
                    //     conditionType: "in"
                    // },
                    // {
                    //     field: "store_id",
                    //     value: "2,1",
                    //     conditionType: "in"
                    // },
                    // {
                    //     field: "created_at",
                    //     value: "2024-08-23",
                    //     conditionType: "gt"
                    // }
                    {
                        field: "increment_id",
                        value: "2000055103",
                        conditionType: "eq"
                    }
                ];

                var pagination = {
                    pageSize: "1",
                    currentPage: "1"
                };

                var baseUrl = 'https://backend.richy.sa/index.php/rest/V1/orders?';

                var queryString = filters.map((filter, index) =>
                    `searchCriteria[filter_groups][${index}][filters][0][field]=${filter.field}&` +
                    `searchCriteria[filter_groups][${index}][filters][0][value]=${filter.value}&` +
                    `searchCriteria[filter_groups][${index}][filters][0][conditionType]=${filter.conditionType}`
                ).join('&');

                queryString += `&searchCriteria[pageSize]=${pagination.pageSize}&` +
                    `searchCriteria[currentPage]=${pagination.currentPage}`;

                var url = baseUrl + queryString;

                var headers = {
                    'Authorization': 'Bearer 08xiqiu5cpcqk97r2b7ju83elsii222g',
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                };

                var response = https.get({
                    url: url,
                    headers: headers
                });

                var responseBody = JSON.parse(response.body);

                // if (responseBody.items && responseBody.items.length > 0) {
                //     return responseBody.items;
                // } else {
                //     log.debug('No orders found', responseBody);
                //     return [];
                // }

            } catch (e) {
                log.error("Error: getInputData", e);
            }
            return [
                {
                    "base_currency_code": "SAR",
                    "base_discount_amount": 0,
                    "base_discount_canceled": 0,
                    "base_grand_total": 249,
                    "base_discount_tax_compensation_amount": 0,
                    "base_shipping_amount": 20,
                    "base_shipping_canceled": 20,
                    "base_shipping_discount_amount": 0,
                    "base_shipping_discount_tax_compensation_amnt": 0,
                    "base_shipping_incl_tax": 20,
                    "base_shipping_tax_amount": 0,
                    "base_subtotal": 199.13,
                    "base_subtotal_canceled": 199.13,
                    "base_subtotal_incl_tax": 229,
                    "base_tax_amount": 29.87,
                    "base_tax_canceled": 29.87,
                    "base_total_canceled": 249,
                    "base_total_due": 249,
                    "base_to_global_rate": 1,
                    "base_to_order_rate": 1,
                    "billing_address_id": 129042,
                    "created_at": "2025-05-01 00:27:37",
                    "customer_dob": "1998-03-16 00:00:00",
                    "customer_email": "a9535899020@gmail.com",
                    "customer_firstname": "ضاري",
                    "customer_gender": 1,
                    "customer_group_id": 10,
                    "customer_id": 60269,
                    "customer_is_guest": 0,
                    "customer_lastname": "الاسلمي",
                    "customer_note_notify": 1,
                    "discount_amount": 0,
                    "discount_canceled": 0,
                    "entity_id": 64563,
                    "global_currency_code": "SAR",
                    "grand_total": 249,
                    "discount_tax_compensation_amount": 0,
                    "increment_id": "2000066100",
                    "is_virtual": 0,
                    "order_currency_code": "SAR",
                    "protect_code": "4157cb2635ef77b0f940109e68411fa2",
                    "quote_id": 293840,
                    "remote_ip": "3.121.181.213",
                    "shipping_amount": 20,
                    "shipping_canceled": 20,
                    "shipping_description": "شحن |  - ريتشي",
                    "shipping_discount_amount": 0,
                    "shipping_discount_tax_compensation_amount": 0,
                    "shipping_incl_tax": 20,
                    "shipping_tax_amount": 0,
                    "state": "canceled",
                    "status": "canceled",
                    "store_currency_code": "SAR",
                    "store_id": 2,
                    "store_name": "Main Website\nRichy\nالعربية",
                    "store_to_base_rate": 0,
                    "store_to_order_rate": 0,
                    "subtotal": 199.13,
                    "subtotal_canceled": 199.13,
                    "subtotal_incl_tax": 229,
                    "tax_amount": 29.87,
                    "tax_canceled": 29.87,
                    "total_canceled": 249,
                    "total_due": 249,
                    "total_item_count": 1,
                    "total_qty_ordered": 1,
                    "updated_at": "2025-05-01 00:52:07",
                    "weight": 1,
                    "items": [
                        {
                            "amount_refunded": 0,
                            "applied_rule_ids": "1",
                            "base_amount_refunded": 0,
                            "base_discount_amount": 0,
                            "base_discount_invoiced": 0,
                            "base_discount_tax_compensation_amount": 0,
                            "base_original_price": 199.13,
                            "base_price": 199.13,
                            "base_price_incl_tax": 229,
                            "base_row_invoiced": 0,
                            "base_row_total": 199.13,
                            "base_row_total_incl_tax": 229,
                            "base_tax_amount": 29.87,
                            "base_tax_invoiced": 0,
                            "created_at": "2025-05-01 00:27:37",
                            "discount_amount": 0,
                            "discount_invoiced": 0,
                            "discount_percent": 0,
                            "free_shipping": 0,
                            "discount_tax_compensation_amount": 0,
                            "discount_tax_compensation_canceled": 0,
                            "is_qty_decimal": 0,
                            "is_virtual": 0,
                            "item_id": 294536,
                            "name": "قماش ريتشي  9118     ",
                            "no_discount": 0,
                            "order_id": 64563,
                            "original_price": 199.13,
                            "price": 199.13,
                            "price_incl_tax": 229,
                            "product_id": 3128,
                            "product_type": "configurable",
                            "qty_canceled": 1,
                            "qty_invoiced": 0,
                            "qty_ordered": 1,
                            "qty_refunded": 0,
                            "qty_shipped": 0,
                            "quote_item_id": 1058006,
                            "row_invoiced": 0,
                            "row_total": 199.13,
                            "row_total_incl_tax": 229,
                            "row_weight": 1,
                            "sku": "RFS911830",
                            "store_id": 2,
                            "tax_amount": 29.87,
                            "tax_canceled": 29.87,
                            "tax_invoiced": 0,
                            "tax_percent": 15,
                            "updated_at": "2025-05-01 00:52:07",
                            "weight": 1,
                            "product_option": {
                                "extension_attributes": {
                                    "configurable_item_options": [
                                        {
                                            "option_id": "252",
                                            "option_value": 537
                                        }
                                    ]
                                }
                            },
                            "extension_attributes": {
                                "product_custom_option_title": [],
                                "product_custom_option_sku": []
                            }
                        },
                        {
                            "amount_refunded": 0,
                            "base_amount_refunded": 0,
                            "base_discount_amount": 0,
                            "base_discount_invoiced": 0,
                            "base_price": 0,
                            "base_row_invoiced": 0,
                            "base_row_total": 0,
                            "base_tax_amount": 0,
                            "base_tax_invoiced": 0,
                            "created_at": "2025-05-01 00:27:37",
                            "discount_amount": 0,
                            "discount_invoiced": 0,
                            "discount_percent": 0,
                            "free_shipping": 0,
                            "discount_tax_compensation_canceled": 0,
                            "is_qty_decimal": 1,
                            "is_virtual": 0,
                            "item_id": 294537,
                            "name": "9118 كريم 1",
                            "no_discount": 0,
                            "order_id": 64563,
                            "original_price": 0,
                            "parent_item_id": 294536,
                            "price": 0,
                            "product_id": 1387,
                            "product_type": "simple",
                            "qty_canceled": 0,
                            "qty_invoiced": 0,
                            "qty_ordered": 1,
                            "qty_refunded": 0,
                            "qty_shipped": 0,
                            "quote_item_id": 1058007,
                            "row_invoiced": 0,
                            "row_total": 0,
                            "row_weight": 0,
                            "sku": "RFS911830",
                            "store_id": 2,
                            "tax_amount": 0,
                            "tax_canceled": 0,
                            "tax_invoiced": 0,
                            "tax_percent": 0,
                            "updated_at": "2025-05-01 00:52:07",
                            "weight": 1,
                            "parent_item": {
                                "amount_refunded": 0,
                                "applied_rule_ids": "1",
                                "base_amount_refunded": 0,
                                "base_discount_amount": 0,
                                "base_discount_invoiced": 0,
                                "base_discount_tax_compensation_amount": 0,
                                "base_original_price": 199.13,
                                "base_price": 199.13,
                                "base_price_incl_tax": 229,
                                "base_row_invoiced": 0,
                                "base_row_total": 199.13,
                                "base_row_total_incl_tax": 229,
                                "base_tax_amount": 29.87,
                                "base_tax_invoiced": 0,
                                "created_at": "2025-05-01 00:27:37",
                                "discount_amount": 0,
                                "discount_invoiced": 0,
                                "discount_percent": 0,
                                "free_shipping": 0,
                                "discount_tax_compensation_amount": 0,
                                "discount_tax_compensation_canceled": 0,
                                "is_qty_decimal": 0,
                                "is_virtual": 0,
                                "item_id": 294536,
                                "name": "قماش ريتشي  9118     ",
                                "no_discount": 0,
                                "order_id": 64563,
                                "original_price": 199.13,
                                "price": 199.13,
                                "price_incl_tax": 229,
                                "product_id": 3128,
                                "product_type": "configurable",
                                "qty_canceled": 1,
                                "qty_invoiced": 0,
                                "qty_ordered": 1,
                                "qty_refunded": 0,
                                "qty_shipped": 0,
                                "quote_item_id": 1058006,
                                "row_invoiced": 0,
                                "row_total": 199.13,
                                "row_total_incl_tax": 229,
                                "row_weight": 1,
                                "sku": "RFS911830",
                                "store_id": 2,
                                "tax_amount": 29.87,
                                "tax_canceled": 29.87,
                                "tax_invoiced": 0,
                                "tax_percent": 15,
                                "updated_at": "2025-05-01 00:52:07",
                                "weight": 1,
                                "product_option": {
                                    "extension_attributes": {
                                        "configurable_item_options": [
                                            {
                                                "option_id": "252",
                                                "option_value": 537
                                            }
                                        ]
                                    }
                                },
                                "extension_attributes": {
                                    "product_custom_option_title": [
                                        "كمّل رحلة ثوبك مع لامود لخدمة التفصيل",
                                        "قلاب مودرن ( مفتوح ) ",
                                        "بدون أزرار",
                                        "جبزور مخفي مثلث",
                                        "بقصة",
                                        "لا",
                                        "سادة"
                                    ],
                                    "product_custom_option_sku": [
                                        null,
                                        "الياقة:",
                                        "أزرار الياقة الخارجية:",
                                        "الصدر:",
                                        "جيب الصدر:",
                                        "خدمة التطريز:",
                                        "شكل الكم:"
                                    ]
                                }
                            },
                            "extension_attributes": {
                                "product_custom_option_title": [],
                                "product_custom_option_sku": []
                            },
                            "row_total_incl_tax": 0,
                            "base_row_total_incl_tax": 0
                        }
                    ],
                    "billing_address": {
                        "address_type": "billing",
                        "city": "Hail",
                        "country_id": "SA",
                        "email": "a9535899020@gmail.com",
                        "entity_id": 129042,
                        "firstname": "ضاري",
                        "lastname": "الاسلمي",
                        "parent_id": 64563,
                        "postcode": "1111",
                        "region": "Hail",
                        "region_code": "Hail",
                        "region_id": 579,
                        "street": [
                            "بيروت"
                        ],
                        "telephone": "535899020"
                    },
                    "payment": {
                        "account_status": null,
                        "additional_information": [
                            "95544",
                            "293840",
                            "2025-05-01 00:27:36",
                            "2025-05-01 00:27:36",
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            "0",
                            null,
                            "0",
                            "0",
                            null,
                            "[]",
                            null,
                            null,
                            null,
                            "Split into 4 payments, without fees with Tamara"
                        ],
                        "amount_authorized": 249,
                        "amount_ordered": 249,
                        "base_amount_authorized": 249,
                        "base_amount_ordered": 249,
                        "base_shipping_amount": 20,
                        "cc_exp_year": "0",
                        "cc_last4": null,
                        "cc_ss_start_month": "0",
                        "cc_ss_start_year": "0",
                        "entity_id": 64558,
                        "method": "tamara_pay_by_instalments_4",
                        "parent_id": 64563,
                        "shipping_amount": 20
                    },
                    "status_histories": [
                        {
                            "comment": "Tamara - order was canceled, canceled amount is 249.00 ريال‎  ",
                            "created_at": "2025-05-01 00:52:07",
                            "entity_id": 261013,
                            "entity_name": "order",
                            "is_customer_notified": null,
                            "is_visible_on_front": 0,
                            "parent_id": 64563,
                            "status": "canceled"
                        },
                        {
                            "comment": "We will authorize 249.00.00 ريال‎   after the payment is approved at the payment gateway.",
                            "created_at": "2025-05-01 00:27:38",
                            "entity_id": 261010,
                            "entity_name": "order",
                            "is_customer_notified": null,
                            "is_visible_on_front": 0,
                            "parent_id": 64563,
                            "status": "payment_review"
                        },
                        {
                            "comment": "Tamara - order was created, order id: f0a6a2d3-d678-4400-a9f2-37ec5b938fcf",
                            "created_at": "2025-05-01 00:27:38",
                            "entity_id": 261009,
                            "entity_name": "order",
                            "is_customer_notified": null,
                            "is_visible_on_front": 0,
                            "parent_id": 64563,
                            "status": "pending"
                        }
                    ],
                    "extension_attributes": {
                        "shipping_assignments": [
                            {
                                "shipping": {
                                    "address": {
                                        "address_type": "shipping",
                                        "city": "Hail",
                                        "country_id": "SA",
                                        "customer_address_id": 41368,
                                        "email": "a9535899020@gmail.com",
                                        "entity_id": 129041,
                                        "firstname": "ضاري",
                                        "lastname": "الاسلمي",
                                        "parent_id": 64563,
                                        "postcode": "1111",
                                        "region": "Hail",
                                        "region_code": "Hail",
                                        "region_id": 579,
                                        "street": [
                                            "بيروت"
                                        ],
                                        "telephone": "535899020"
                                    },
                                    "method": "flatrate_flatrate",
                                    "total": {
                                        "base_shipping_amount": 20,
                                        "base_shipping_canceled": 20,
                                        "base_shipping_discount_amount": 0,
                                        "base_shipping_discount_tax_compensation_amnt": 0,
                                        "base_shipping_incl_tax": 20,
                                        "base_shipping_tax_amount": 0,
                                        "shipping_amount": 20,
                                        "shipping_canceled": 20,
                                        "shipping_discount_amount": 0,
                                        "shipping_discount_tax_compensation_amount": 0,
                                        "shipping_incl_tax": 20,
                                        "shipping_tax_amount": 0
                                    }
                                },
                                "items": [
                                    {
                                        "amount_refunded": 0,
                                        "applied_rule_ids": "1",
                                        "base_amount_refunded": 0,
                                        "base_discount_amount": 0,
                                        "base_discount_invoiced": 0,
                                        "base_discount_tax_compensation_amount": 0,
                                        "base_original_price": 199.13,
                                        "base_price": 199.13,
                                        "base_price_incl_tax": 229,
                                        "base_row_invoiced": 0,
                                        "base_row_total": 199.13,
                                        "base_row_total_incl_tax": 229,
                                        "base_tax_amount": 29.87,
                                        "base_tax_invoiced": 0,
                                        "created_at": "2025-05-01 00:27:37",
                                        "discount_amount": 0,
                                        "discount_invoiced": 0,
                                        "discount_percent": 0,
                                        "free_shipping": 0,
                                        "discount_tax_compensation_amount": 0,
                                        "discount_tax_compensation_canceled": 0,
                                        "is_qty_decimal": 0,
                                        "is_virtual": 0,
                                        "item_id": 294536,
                                        "name": "قماش ريتشي  9118     ",
                                        "no_discount": 0,
                                        "order_id": 64563,
                                        "original_price": 199.13,
                                        "price": 199.13,
                                        "price_incl_tax": 229,
                                        "product_id": 3128,
                                        "product_type": "configurable",
                                        "qty_canceled": 1,
                                        "qty_invoiced": 0,
                                        "qty_ordered": 1,
                                        "qty_refunded": 0,
                                        "qty_shipped": 0,
                                        "quote_item_id": 1058006,
                                        "row_invoiced": 0,
                                        "row_total": 199.13,
                                        "row_total_incl_tax": 229,
                                        "row_weight": 1,
                                        "sku": "RFS911830",
                                        "store_id": 2,
                                        "tax_amount": 29.87,
                                        "tax_canceled": 29.87,
                                        "tax_invoiced": 0,
                                        "tax_percent": 15,
                                        "updated_at": "2025-05-01 00:52:07",
                                        "weight": 1,
                                        "product_option": {
                                            "extension_attributes": {
                                                "configurable_item_options": [
                                                    {
                                                        "option_id": "252",
                                                        "option_value": 537
                                                    }
                                                ]
                                            }
                                        },
                                        "extension_attributes": {
                                            "product_custom_option_title": [],
                                            "product_custom_option_sku": []
                                        }
                                    },
                                    {
                                        "amount_refunded": 0,
                                        "base_amount_refunded": 0,
                                        "base_discount_amount": 0,
                                        "base_discount_invoiced": 0,
                                        "base_price": 0,
                                        "base_row_invoiced": 0,
                                        "base_row_total": 0,
                                        "base_tax_amount": 0,
                                        "base_tax_invoiced": 0,
                                        "created_at": "2025-05-01 00:27:37",
                                        "discount_amount": 0,
                                        "discount_invoiced": 0,
                                        "discount_percent": 0,
                                        "free_shipping": 0,
                                        "discount_tax_compensation_canceled": 0,
                                        "is_qty_decimal": 1,
                                        "is_virtual": 0,
                                        "item_id": 294537,
                                        "name": "9118 كريم 1",
                                        "no_discount": 0,
                                        "order_id": 64563,
                                        "original_price": 0,
                                        "parent_item_id": 294536,
                                        "price": 0,
                                        "product_id": 1387,
                                        "product_type": "simple",
                                        "qty_canceled": 0,
                                        "qty_invoiced": 0,
                                        "qty_ordered": 1,
                                        "qty_refunded": 0,
                                        "qty_shipped": 0,
                                        "quote_item_id": 1058007,
                                        "row_invoiced": 0,
                                        "row_total": 0,
                                        "row_weight": 0,
                                        "sku": "RFS911830",
                                        "store_id": 2,
                                        "tax_amount": 0,
                                        "tax_canceled": 0,
                                        "tax_invoiced": 0,
                                        "tax_percent": 0,
                                        "updated_at": "2025-05-01 00:52:07",
                                        "weight": 1,
                                        "parent_item": {
                                            "amount_refunded": 0,
                                            "applied_rule_ids": "1",
                                            "base_amount_refunded": 0,
                                            "base_discount_amount": 0,
                                            "base_discount_invoiced": 0,
                                            "base_discount_tax_compensation_amount": 0,
                                            "base_original_price": 199.13,
                                            "base_price": 199.13,
                                            "base_price_incl_tax": 229,
                                            "base_row_invoiced": 0,
                                            "base_row_total": 199.13,
                                            "base_row_total_incl_tax": 229,
                                            "base_tax_amount": 29.87,
                                            "base_tax_invoiced": 0,
                                            "created_at": "2025-05-01 00:27:37",
                                            "discount_amount": 0,
                                            "discount_invoiced": 0,
                                            "discount_percent": 0,
                                            "free_shipping": 0,
                                            "discount_tax_compensation_amount": 0,
                                            "discount_tax_compensation_canceled": 0,
                                            "is_qty_decimal": 0,
                                            "is_virtual": 0,
                                            "item_id": 294536,
                                            "name": "قماش ريتشي  9118     ",
                                            "no_discount": 0,
                                            "order_id": 64563,
                                            "original_price": 199.13,
                                            "price": 199.13,
                                            "price_incl_tax": 229,
                                            "product_id": 3128,
                                            "product_type": "configurable",
                                            "qty_canceled": 1,
                                            "qty_invoiced": 0,
                                            "qty_ordered": 1,
                                            "qty_refunded": 0,
                                            "qty_shipped": 0,
                                            "quote_item_id": 1058006,
                                            "row_invoiced": 0,
                                            "row_total": 199.13,
                                            "row_total_incl_tax": 229,
                                            "row_weight": 1,
                                            "sku": "RFS911830",
                                            "store_id": 2,
                                            "tax_amount": 29.87,
                                            "tax_canceled": 29.87,
                                            "tax_invoiced": 0,
                                            "tax_percent": 15,
                                            "updated_at": "2025-05-01 00:52:07",
                                            "weight": 1,
                                            "product_option": {
                                                "extension_attributes": {
                                                    "configurable_item_options": [
                                                        {
                                                            "option_id": "252",
                                                            "option_value": 537
                                                        }
                                                    ]
                                                }
                                            },
                                            "extension_attributes": {
                                                "product_custom_option_title": [],
                                                "product_custom_option_sku": []
                                            }
                                        },
                                        "extension_attributes": {
                                            "product_custom_option_title": [],
                                            "product_custom_option_sku": []
                                        },
                                        "row_total_incl_tax": 0,
                                        "base_row_total_incl_tax": 0
                                    }
                                ]
                            }
                        ],
                        "payment_additional_info": [
                            {
                                "key": "payment_id",
                                "value": "95544"
                            },
                            {
                                "key": "quote_id",
                                "value": "293840"
                            },
                            {
                                "key": "created_at",
                                "value": "2025-05-01 00:27:36"
                            },
                            {
                                "key": "updated_at",
                                "value": "2025-05-01 00:27:36"
                            },
                            {
                                "key": "cc_type",
                                "value": "null"
                            },
                            {
                                "key": "cc_number_enc",
                                "value": "null"
                            },
                            {
                                "key": "cc_last_4",
                                "value": "null"
                            },
                            {
                                "key": "cc_cid_enc",
                                "value": "null"
                            },
                            {
                                "key": "cc_owner",
                                "value": "null"
                            },
                            {
                                "key": "cc_exp_month",
                                "value": "null"
                            },
                            {
                                "key": "cc_exp_year",
                                "value": "0"
                            },
                            {
                                "key": "cc_ss_owner",
                                "value": "null"
                            },
                            {
                                "key": "cc_ss_start_month",
                                "value": "0"
                            },
                            {
                                "key": "cc_ss_start_year",
                                "value": "0"
                            },
                            {
                                "key": "cc_ss_issue",
                                "value": "null"
                            },
                            {
                                "key": "additional_information",
                                "value": "[]"
                            },
                            {
                                "key": "paypal_payer_id",
                                "value": "null"
                            },
                            {
                                "key": "paypal_payer_status",
                                "value": "null"
                            },
                            {
                                "key": "paypal_correlation_id",
                                "value": "null"
                            },
                            {
                                "key": "method_title",
                                "value": "Split into 4 payments, without fees with Tamara"
                            }
                        ],
                        "applied_taxes": [
                            {
                                "code": "SA_VAT",
                                "title": "VAT",
                                "percent": 15,
                                "amount": 29.87,
                                "base_amount": 29.87
                            }
                        ],
                        "item_applied_taxes": [
                            {
                                "type": "product",
                                "item_id": 294536,
                                "applied_taxes": [
                                    {
                                        "code": "SA_VAT",
                                        "title": "VAT",
                                        "percent": 15,
                                        "amount": 29.87,
                                        "base_amount": 29.87
                                    }
                                ]
                            }
                        ],
                        "converting_from_quote": true,
                        "measurement_type": [],
                        "branch_city": "",
                        "order_from": "Website",
                        "celigo_sales_order": {
                            "parent_id": 64563,
                            "is_exported_to_io": 0
                        },
                        "mdosc_extra_fee": "0",
                        "rewards_base_discount": 0,
                        "rewards_discount": 0,
                        "rewards_spend": 0,
                        "rewards_earn": 398
                    }
                }
            ];
        }
        const map = (mapContext) => {
            try {
                var order = JSON.parse(mapContext.value);
                log.debug("order", order);

                log.debug("Customer", order.customer_id);
                var customerId = checkCustomerInCustomRecord(order.customer_id);
                log.debug("Customer Id", customerId);

                if (!customerId) {
                    throw new Error('Customer not found');
                }
                var salesOrderRecord = record.create({
                    type: record.Type.SALES_ORDER,
                    isDynamic: true
                });
                salesOrderRecord.setValue({ fieldId: 'customform', value: '188' });
                // Set main fields on the Sales Order
                var transactionId = "O-" + order.increment_id;
                salesOrderRecord.setValue({ fieldId: 'tranid', value: transactionId });
                salesOrderRecord.setValue({ fieldId: 'entity', value: customerId });
                salesOrderRecord.setValue({ fieldId: 'location', value: '8' });
                salesOrderRecord.setValue({ fieldId: 'salesrep', value: '256856' });
                salesOrderRecord.setValue({ fieldId: 'orderstatus', value: 'B' });
                salesOrderRecord.setValue({ fieldId: 'custbody_customer_contact', value: order.billing_address.telephone });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_etail_channel', value: '1' });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_etail_order_id', value: order.entity_id });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_mag2_order_number', value: order.increment_id });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_mag2_store', value: '1' });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_mag2_instance', value: '2' });
                salesOrderRecord.setValue({ fieldId: 'trandate', value: new Date(order.created_at) });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_etail_origpaymentmeth', value: order.payment.method });
                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_etail_transaction_ids', value: order.payment.last_trans_id });

                // Handle shipping cost
                var shippingCost = order.grand_total ? order.grand_total : order.shipping_invoiced;
                log.debug("shippingCost", shippingCost);
                salesOrderRecord.setValue({ fieldId: 'shippingcost', value: shippingCost });

                salesOrderRecord.setValue({ fieldId: 'custbody_celigo_etail_discount_code', value: '' });
                // salesOrderRecord.setValue({ fieldId: 'tax', value: order.tax_amount });
                //  salesOrderRecord.setValue({ fieldId: 'total', value: order.grand_total });

                // Set memo field based on payment method
                var memo = '';
                if (order.payment.method === "tamara_pay_by_instalments") {
                    if (order.status_histories && order.status_histories[2] && order.status_histories[2].comment) {
                        memo = order.status_histories[2].comment;
                    } else if (order.status_histories && order.status_histories[2] && order.status_histories[2].status === "pending") {
                        memo = "Tamara";
                    } else {
                        memo = order.status_histories[2] ? order.status_histories[2].comment : '';
                    }
                }
                log.debug("memo", memo);
                salesOrderRecord.setValue({ fieldId: 'memo', value: memo });

                var paymentMethodId = '';
                if (order.payment.method === "checkoutcom_apple_pay") {
                    paymentMethodId = '38'
                } else if (order.payment.method === "checkoutcom_card_payment") {
                    paymentMethodId = '37'
                } else if (order.payment.method === "tamara_pay_by_instalments") {
                    paymentMethodId = '39'
                } else if (order.payment.method === "tabby_installments") {
                    paymentMethodId = '40'
                } else if (order.payment.method === "tabby_checkout") {
                    paymentMethodId = '40'
                } else if (order.payment.method === "banktransfer") {
                    paymentMethodId = '31'
                } else if (order.payment.method === "branchpay") {
                    paymentMethodId = '81'
                } else if (order.payment.method === "free") {
                    paymentMethodId = '19'
                } else if (order.payment.method === "banktransfer") {
                    paymentMethodId = '37'
                }

                salesOrderRecord.setValue({ fieldId: 'paymentmethod', value: paymentMethodId });

                var items = order.items;
                log.debug("items", items);

                var skus = items.map(function (item) {
                    return item.sku;
                });

                log.debug("skus", skus);

                var itemIds = getItemInternalIds(skus);
                log.debug('Item Internal IDs', itemIds);

                var hasLMD0001 = itemIds.some(function (item) {
                    return item.sku === 'LMD0001';
                });

                var hasLMD0007 = itemIds.some(function (item) {
                    return item.sku === 'LMD0007';
                });

                var incrementId = order.increment_id;
                if (hasLMD0001) {
                    incrementId = 'LMD-' + incrementId;
                } else if (hasLMD0007) {
                    incrementId = 'X-LMD-' + incrementId;
                }
                salesOrderRecord.setValue({ fieldId: 'otherrefnum', value: incrementId });

                items.forEach(function (item) {
                    var matchingItemId = itemIds.find(function (id) {
                        return id.sku === item.sku;
                    });
                    log.debug("matchingItemId", matchingItemId);
                    log.debug("item.itemInternalId", item.itemInternalId);
                    log.debug("matchingItemId.itemInternalId", matchingItemId.itemInternalId);
                    if (matchingItemId) {
                        item.itemInternalId = matchingItemId.itemInternalId;
                    }
                });

                log.debug("items", items);
                log.debug("items.length", items.length);

                var measurementObj = getMeasurementValues(order);
                log.debug({
                    title: 'measurementObj',
                    details: measurementObj
                });
                log.debug({
                    title: 'measurementObj type',
                    details: typeof measurementObj
                });
                log.debug({
                    title: 'measurementObj.length',
                    details: measurementObj.length
                });

                if (measurementObj.length > 0) {
                    salesOrderRecord.setValue({ fieldId: 'custbody_measurement_location', value: measurementObj.join(', ') });
                }

                var StyleObj = getStyleValues(order);
                log.debug({
                    title: 'StyleObj',
                    details: StyleObj
                });
                log.debug({
                    title: 'StyleObj type',
                    details: typeof StyleObj
                });
                log.debug({
                    title: 'StyleObj.length',
                    details: StyleObj.length
                });

                for (var i = 0; i < items.length; i++) {
                    var item = items[i].itemInternalId;
                    var qty = items[i].qty_ordered;
                    var itemPrice = items[i].price;
                    log.debug("Magento Rate/Price", itemPrice);

                    salesOrderRecord.selectNewLine({
                        sublistId: 'item'
                    });

                    // Set the item and quantity
                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: 'item',
                        value: item,
                        ignoreFieldChange: false
                    });

                    // Get the NetSuite rate for this item
                    var netsuiteRate = salesOrderRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate'
                    });
                    log.debug("netsuiteRate", netsuiteRate);

                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: 'quantity',
                        value: qty,
                        ignoreFieldChange: false
                    });

                    salesOrderRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: 'location',
                        value: '8'
                    });

                    if (netsuiteRate !== itemPrice) {
                        // Calculate the discount amount
                        var discountAmount = itemPrice - netsuiteRate;
                        log.debug("discountAmount", discountAmount);

                        // Commit the current line
                        salesOrderRecord.commitLine({
                            sublistId: 'item'
                        });

                        // Add the discount line
                        salesOrderRecord.selectNewLine({
                            sublistId: 'item'
                        });

                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: '2206',
                            ignoreFieldChange: false
                        });

                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'price',
                            value: '-1'
                        });

                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            value: discountAmount.toFixed(2),
                            ignoreFieldChange: true
                        });

                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            value: discountAmount.toFixed(2),
                            ignoreFieldChange: true
                        });

                        // Commit the discount line
                        salesOrderRecord.commitLine({
                            sublistId: 'item'
                        });
                    } else {
                        // Commit the current line if no discount is needed
                        salesOrderRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                }

                if (StyleObj && StyleObj.length > 0) {

                    for (var l = 0; l <= StyleObj.length; l++) {
                        var styleData = StyleObj[l];

                        if (typeof styleData === 'object' && styleData !== null) {
                            if (Object.keys(styleData).length === 0) {
                                // Empty object: set to a blank string
                                styleData = ' ';
                            } else {
                                // Non-empty object: convert to string and remove curly braces
                                styleData = JSON.stringify(styleData)
                                    .slice(1, -1)  // Remove outer braces
                                    .replace(/"/g, ''); // Optionally remove quotes if needed
                            }
                        }

                        salesOrderRecord.selectLine({
                            sublistId: 'item',
                            line: l
                        });

                        salesOrderRecord.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcolstyle',
                            value: styleData,
                            ignoreFieldChange: true
                        });
                        salesOrderRecord.commitLine({
                            sublistId: 'item'
                        });
                    }
                }

                // Save the Sales Order
                var salesOrderId = salesOrderRecord.save();
                log.debug('Sales Order Created', 'Sales Order ID: ' + salesOrderId);

            } catch (e) {
                log.error('Error in Map Function', e);
            }
        };

        const reduce = (reduceContext) => {

        }
        const summarize = (summaryContext) => {

        }

        function checkCustomerInCustomRecord(customerId) {
            if (!customerId) return;
            try {
                var id = '';
                var searchResults = search.create({
                    type: "customrecord_celigo_mag2_cust_id_map",
                    filters:
                        [
                            ["custrecord_celigo_mag2_mcim_mag_cust_id", "is", customerId]
                        ],
                    columns:
                        [
                            "custrecord_celigo_mag2_mcim_nsid"
                        ]
                });
                var result = searchResults.run().getRange(0, 1);
                if (result.length > 0) id = result[0].getValue({ name: "custrecord_celigo_mag2_mcim_nsid" });
                return id;
            } catch (e) {
                log.error("Exception: checkCustomerInCustomRecord", e);
            }
        }

        function getItemInternalIds(skuArray) {
            var internalIds = [];
            try {
                var skuString = skuArray.map(function (sku) {
                    return "'" + sku + "'";
                }).join(',');

                var sql = "SELECT id AS internalid, itemid AS sku FROM item WHERE itemid IN (" + skuString + ")";

                // Execute the query
                var resultSet = query.runSuiteQL({
                    query: sql
                });

                // Process the results
                resultSet.asMappedResults().forEach(function (result) {
                    internalIds.push({
                        sku: result.sku,
                        itemInternalId: result.internalid
                    });
                });

            } catch (error) {
                log.error('Error retrieving internal IDs', error);
            }

            return internalIds;
        }
        // function getLocationOrStyleData(payload) {
        //     const measurementType = payload.extension_attributes?.measurement_type;

        //     if (Array.isArray(measurementType) && measurementType.length > 1) {
        //         return measurementType.slice(0, 2); // return single flat array
        //     }

        //     const result = [];
        //     const items = payload.items || [];

        //     for (const item of items) {
        //         const parent = item?.parent_item?.extension_attributes;
        //         const skus = parent?.product_custom_option_sku;
        //         const titles = parent?.product_custom_option_title;

        //         if (
        //             Array.isArray(skus) &&
        //             Array.isArray(titles) &&
        //             skus.length > 0 &&
        //             titles.length > 0 &&
        //             skus.length === titles.length
        //         ) {
        //             const obj = {};

        //             for (let i = 0; i < skus.length; i++) {
        //                 if (i === 0 && skus[0] === null) continue;

        //                 const key = skus[i];
        //                 const value = titles[i];

        //                 if (key && value) {
        //                     obj[key] = value;
        //                 }
        //             }

        //             result.push(obj);
        //         } else {
        //             result.push({});
        //         }
        //     }

        //     return result;
        // }

        function getMeasurementValues(payload) {
            const measurementType = payload.extension_attributes?.measurement_type;

            if (Array.isArray(measurementType) && measurementType.length >= 1) {
                const result = measurementType.slice(0, 2);
                //  console.log('Returning measurement values:', result);
                return result;
            }


            return [];
        }

        function getStyleValues(payload) {
            const measurementType = payload.extension_attributes?.measurement_type;


            if (Array.isArray(measurementType) && measurementType.length > 1) {
                //  console.log('🚫 Measurement exists, skipping style logic');
                return [];
            }

            const result = [];
            const items = payload.items || [];

            for (const item of items) {
                const parent = item?.parent_item?.extension_attributes;
                const skus = parent?.product_custom_option_sku;
                const titles = parent?.product_custom_option_title;



                if (
                    Array.isArray(skus) &&
                    Array.isArray(titles) &&
                    skus.length > 0 &&
                    titles.length > 0 &&
                    skus.length === titles.length
                ) {
                    const obj = {};

                    for (let i = 0; i < skus.length; i++) {
                        if (i === 0 && skus[0] === null) continue;

                        const key = skus[i];
                        const value = titles[i];
                        if (key && value) obj[key] = value;
                    }

                    result.push(obj);
                } else {
                    result.push({});
                }
            }


            return result;
        }
        return { getInputData, map, reduce, summarize }

    });
