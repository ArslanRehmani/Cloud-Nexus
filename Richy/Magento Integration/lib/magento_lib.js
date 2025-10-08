/**
 * @NApiVersion 2.1
 */
define(["N/https", "N/record", "N/log"],
  /**
   * @param{https}
   * @param{record}
   * @param{log}
   */
  (https, record, log) => {
    const CONSTANTS = {
      ACTION: {
        BASE_URL: "https://backend.richy.sa/index.php/rest/V1/customers/search",
      },
      HEADERS: {
        CONTENT_TYPE: "application/json",
        AUTHORIZATION: "Bearer 08xiqiu5cpcqk97r2b7ju83elsii222g",
        ACCEPT: "*/*",
      },
    };

    const REQUESTS = {
      getCustomerInfo: () => {
        var token = "";
        try {
          // const params = [
          //     'searchCriteria[filter_groups][0][filters][0][field]=updated_at',
          //     'searchCriteria[filter_groups][0][filters][0][value]=2024-05-14T07%3A29%3A12%2B00%3A00',
          //     'searchCriteria[filter_groups][0][filters][0][condition_type]=gt',
          //     'searchCriteria[filter_groups][1][filters][0][field]=store_id',
          //     'searchCriteria[filter_groups][1][filters][0][value]=2,1',
          //     'searchCriteria[filter_groups][1][filters][0][conditionType]=in',
          //     'searchCriteria[pageSize]=1'
          // ];
          const params = [
            "searchCriteria[filterGroups][0][filters][0][field]=created_at",
            "searchCriteria[filterGroups][0][filters][0][value]=2025-05-01",
            "searchCriteria[filterGroups][0][filters][0][condition_type]=gteq",
          ];

          let url = `${CONSTANTS.ACTION.BASE_URL}?${params.join("&")}`;

          let headers = {
            Authorization: CONSTANTS.HEADERS.AUTHORIZATION,
            "Content-Type": CONSTANTS.HEADERS.CONTENT_TYPE,
            Accept: CONSTANTS.HEADERS.ACCEPT,
          };

          const response = https.get({
            url: url,
            headers: headers,
          });

          // log.debug('Response', response);

          if (response.code == 200) {
            const body = JSON.parse(response.body);

            // log.debug("Customer API Response", body);

            if (body.items && body.items.length > 0) {
              return body.items;
            } else {
              log.debug("No customers found");
              return [];
            }
          }
        } catch (e) {
          let err = `${e.name} - ${e.message} - ${e.stack}`;

          log.error("getAccessToken:err", err);
        }
      },

      createCustomerInNS: (customerData) => {
        var title = "createCustomerInNS[::]";
        try {
          log.debug({
            title: "customerData.id",
            details: customerData.id,
          });
          // Start the process of creating customer in NetSuite
          var custRecord = record.create({
            type: "customer",
            isDynamic : true
          });

          custRecord.setValue({
            fieldId: "custentity_celigo_etail_cust_id",
            value: customerData.id,
          });
          custRecord.setValue({
            fieldId: "lastname",
            value: customerData.lastname,
          });
          // custRecord.setValue({fieldId: 'glommedname', value: customerData.firstname});
          custRecord.setValue({
            fieldId: "firstname",
            value: customerData.firstname,
          });
          custRecord.setValue({ fieldId: "email", value: customerData.email });
          custRecord.setValue({ fieldId: "isindividual", value: true });
          custRecord.setValue({
            fieldId: "custentity_celigo_mag2_customer_group",
            value: customerData.group_id,
          });
          custRecord.setValue({
            fieldId: "custentity_celigo_mag2_customer_group",
            value: customerData.group_id,
          });
          // custRecord.setValue({fieldId: 'custentity_celigo_mag2_website', value: customerData.store_id});
          custRecord.setValue({
            fieldId: "custentity_celigo_mag2_website",
            value: 1,
          });
          custRecord.setValue({
            fieldId: "custentity_celigo_etail_isguest_customer",
            value: true,
          });

          custRecord.setValue({
            fieldId: "custentity_celigo_etail_channel",
            value: 1,
          }); // Magento 2
          custRecord.setValue({
            fieldId: "category",
            value: customerData.group_id,
          });
          custRecord.setValue({ fieldId: "pricelevel", value: 5 }); //Online Price
          let company = getCustomerAddressee(customerData);
          log.debug("Company", company);
          if (company) {
            custRecord.setValue("companyname", company);
          }

          let mobileNo = getMobileNumber(customerData);
          if (mobileNo) {
            custRecord.setValue("mobilephone", mobileNo);
            custRecord.setValue("phone", mobileNo);
          }

          custRecord.setValue({
            fieldId: "accountnumber",
            value: "Online Customer",
          });
          custRecord.setValue({
            fieldId: "custentity1",
            value: "Online Customer",
          });
          custRecord.setValue({
            fieldId: "custentity_dob",
            value: customerData.dob,
          });
          custRecord.setValue({
            fieldId: "custentity_gender_customer",
            value: customerData.gender,
          });
          custRecord.setValue({ fieldId: "salesrep", value: 256856 }); // salerep value
          // custRecord.setValue({
          //   fieldId: "salesrep",
          //   value: customerData.gender,
          // }); // salerep value

          const addresses = customerData.addresses || [];
          addresses.forEach((address) => {
            addCustomerAddress(custRecord, address);
          });

          var custId = custRecord.save();
          log.debug({
            title: "custId",
            details: custId,
          });
        } catch (e) {
          log.error(title + e.name, e.message);
        }
      },
    };
    return { CONSTANTS, REQUESTS };
  });

const getCustomerAddressee = (customerData) => {
  const addresses = customerData.addresses || [];

  // Check if first address has a company
  if (addresses[0] && addresses[0].company) {
    return addresses[0].company;
  }

  // Check if second address exists and has a company
  if (addresses.length > 1 && addresses[1].company) {
    return addresses[1].company;
  }

  // Fallback: use customer name
  return `${customerData.firstname || ""} ${customerData.lastname || ""
    }`.trim();
};

const getMobileNumber = (customerData) => {
  try {
    return (
      customerData?.custom_attributes?.find(
        (attr) => attr.attribute_code === "mobilenumber"
      )?.value || ""
    );
  } catch (error) {
    log.error({ title: "Error getting mobile number", details: error });
    return "";
  }
};

const addCustomerAddress = (customerRecord, address) => {
  try {
    if (!address) return;

    customerRecord.selectNewLine({ sublistId: "addressbook" });

    if (address.default_shipping) {
      customerRecord.setCurrentSublistValue({
        sublistId: "addressbook",
        fieldId: "defaultshipping",
        value: true,
      });
    }

    if (address.default_billing) {
      customerRecord.setCurrentSublistValue({
        sublistId: "addressbook",
        fieldId: "defaultbilling",
        value: true,
      });
    }

    const addressSubrecord = customerRecord.getCurrentSublistSubrecord({
      sublistId: "addressbook",
      fieldId: "addressbookaddress",
    });

    addressSubrecord.setValue({
      fieldId: "addressee",
      value: `${address.firstname || ""} ${address.lastname || ""}`.trim(),
    });

    addressSubrecord.setValue({
      fieldId: "addr1",
      value: address.street?.[0] || "",
    });

    if (address.street?.length > 1) {
      addressSubrecord.setValue({
        fieldId: "addr2",
        value: address.street[1],
      });
    }

    addressSubrecord.setValue({
      fieldId: "city",
      value: address.city || "",
    });

    addressSubrecord.setValue({
      fieldId: "state",
      value: address.region?.region_code || "",
    });

    addressSubrecord.setValue({
      fieldId: "zip",
      value: address.postcode || "",
    });

    addressSubrecord.setValue({
      fieldId: "phone",
      value: address.telephone || "",
    });

    addressSubrecord.setValue({
      fieldId: "country",
      value: address.country_id || "",
    });

    customerRecord.commitLine({ sublistId: "addressbook" });
  } catch (e) {
    log.error({ title: "Error in addCustomerAddress()", details: e });
  }
};
