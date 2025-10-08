/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(['N/search', 'N/log', 'N/record', 'N/https','N/email'], function (search, log, record, https,email) {

    function afterSubmit(context) {
        try {
            var title = 'Send & Mark Code';

            log.audit(title + ' - Context Type', context.type);
            if (context.type !== context.UserEventType.CREATE) return;

            var newRec = context.newRecord;
            var itemCount = newRec.getLineCount({ sublistId: 'item' });

            var upcCode = null;
            for (var i = 0; i < itemCount; i++) {
                var upc = newRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_upc_code',
                    line: i
                });

                if (upc === 'GC1000' || upc === 'GC250' || upc === 'GC500') {
                    upcCode = upc;
                    break;
                }
            }

            if (!upcCode) {
                log.audit({ title: title, details: 'No GC UPC found' });
                return;
            }

            var phoneNumber = newRec.getValue({ fieldId: 'custbody_customer_contact' });
          
            if (!phoneNumber) {
                log.error({ title: title, details: 'Missing customer phone number.' });
                return;
            }

            var customerName = '';
            try {
                var customerId = newRec.getValue({ fieldId: 'entity' });
                if (customerId) {
                    var customerRec = record.load({
                        type: record.Type.CUSTOMER,
                        id: customerId
                    });
                    var entityId = customerRec.getValue({ fieldId: 'entityid' }) || '';
                    var altName = customerRec.getValue({ fieldId: 'altname' }) || '';
                    customerName = (entityId + ' ' + altName).trim();
                    log.debug('Loaded Customer Name', customerName);
                }
            } catch (e) {
                log.error({ title: 'Customer Load Error', details: e });
            }

            var promoSearch = search.create({
                type: 'customrecord_promotion_coupon_code',
                filters: [
                    ['custrecord_promotion_coupon_code', 'is', upcCode],
                    'AND',
                    ['custrecord_issent_promotion_coupon', 'is', 'F']
                ],
                columns: ['custrecord_code_promotion_coupon']
            });

            var results = promoSearch.run().getRange({ start: 0, end: 1 });
            if (!results || results.length === 0) {
                log.audit({ title: title, details: 'No unsent code available for ' + upcCode });
                return;
            }

            var promoRec = results[0];
            var code = promoRec.getValue({ name: 'custrecord_code_promotion_coupon' });
            var internalId = promoRec.id;

            var payload = {
                template_name: "branch_coupon",
                broadcast_name: "branch_coupon",
                parameters: [
                    { name: "name", value: customerName },
                    { name: "pdfLink", value: code }
                ]
            };
            // ✅ Send Whatsapp app 
            sendWhatsappNotification(payload, phoneNumber);

            // ✅ Send SMS also
            var smsMessage = 'مرحباً ' + customerName + '، شكراً لتسوقك من ريتشي 🤍\n' +
                 'قسيمتك: ' + code + '\n' +
                 'قدّمها لموظف الفرع للاستفادة منها.';
                 sendSMSNotification(smsMessage, phoneNumber);

           // ✅ Send Email
            sendEmailNotification(customerRec, customerName, code);

            record.submitFields({
                type: 'customrecord_promotion_coupon_code',
                id: internalId,
                values: {
                    custrecord_issent_promotion_coupon: true
                }
            });

            log.audit({
                title: title + ' - Code Sent',
                details: 'Code: ' + code + ' sent to ' + phoneNumber
            });

        } catch (e) {
            log.error({ title: 'Error in STEP 4', details: e });
        }
    }

// Sending a whatsapp number to message 
  function sendWhatsappNotification(payload, phoneNumber) {
    try {
        log.debug("sendWhatsappNotification()", '[EXECUTION START]');
        log.debug("Payload", JSON.stringify(payload));
        log.debug("Phone Number", phoneNumber);

        var headers = {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZWRjNDVkZC0yYzc3LTRhOTQtODU3MS1iN2NmYWUyNTViZmQiLCJ1bmlxdWVfbmFtZSI6ImluZm9AcmljaHkuc2EiLCJuYW1laWQiOiJpbmZvQHJpY2h5LnNhIiwiZW1haWwiOiJpbmZvQHJpY2h5LnNhIiwiYXV0aF90aW1lIjoiMDcvMTYvMjAyNSAxMDoxNDozMyIsInRlbmFudF9pZCI6IjMyODAwNSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.vfokyatzCExqcRI0sTN_hWdB663OZvSwAF36KBEN1qE",
            "Content-Type": "application/json"
        };

        var response = https.post({
            url: 'https://live-mt-server.wati.io/328005/api/v1/sendTemplateMessage?whatsappNumber=' + encodeURIComponent(phoneNumber),
            body: JSON.stringify(payload),
            headers: headers
        });

        log.debug('WhatsApp Response Code', response.code);
        log.debug('WhatsApp Response Body', response.body);
    } catch (e) {
        log.error({
            title: 'sendWhatsappNotification: Error sending WhatsApp message',
            details: e
        });
    }
}

  
// SMS Code 
  // function sendSMSNotification(phoneNumber, messageBody) {
  function sendSMSNotification(smsMessage, phoneNumber) {
    try {
        var appId = 'jXN8BQAYn5TehJfPhNkXEvIFMYEkTR';

        //Generate AccessToken 
        var url = 'https://lamode.richy.group/api/token/';

        var body = {
            "email": "nada@richy.sa", // M.waqas@richy.sa
             "password": "Ad1234min" 
            }

        var tokenHeaders = {
           'Content-Type': 'application/json',
           'Accept': 'application/json',
           'Cookie': 'csrftoken=Ti3Z0KKJwcY27P9NnmWPm2AOr1qAN3Le',
           'Authorization': 'Basic bmFkYUByaWNoeS5zYTpBZDEyMzRtaW4='
          };

        var TokenResponse = https.post({
                            url: url,
                            body: JSON.stringify(body),
                            headers: tokenHeaders
                        });

var Body = JSON.parse(TokenResponse.body);


        // Send without encodeURIComponent()
        // var postData =
        //     'AppSid=' + appId +
        //     '&Body=' + messageBody +
        //     '&Recipient=' + phoneNumber +
        //     '&SenderID=RICHY';
var postData = {
    "recipient": phoneNumber,
    "message": smsMessage
};

var headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUzOTYxODAxLCJpYXQiOjE3NTM5NTgyMDEsImp0aSI6IjMzOTIzYjVlMmI2OTRjZmI5OTU5NjRiN2MzYjczOTgzIiwidXNlcl9pZCI6NH0.wouqpoaG4Ru1kptE4NpYEsXHYfeDlZzFwz_ztYjDO5M'
    'Authorization': 'Bearer '+Body.access
};

log.debug('Post Body', postData);
log.debug('smsMessage', smsMessage);

var response = https.post({
    url: 'https://lamode.richy.group/api/api/send-sms/',
    body: JSON.stringify(postData),
    headers: headers
});

log.debug('SMS API Response', response.body);



        if (response.code === 200) {
            log.debug('SMS Sent Successfully', response.body);
        } else {
            log.error('Failed to Send SMS', response.code + ' - ' + response.body);
        }
    } catch (e) {
        log.error({ title: 'sendSMSNotification Error', details: e });
    }
}

  function sendEmailNotification(customerRec, customerName, code) {
        try {
            var customerEmail = customerRec.getValue({ fieldId: 'email' });
            if (!customerEmail) {
                log.error('Missing Email', 'Customer email not found.');
                return;
            }

var emailSubject = '🎁 قسيمتك الشرائية من ريتشي';

var emailBody =
  '<div style="direction: rtl; font-family: Tahoma, Arial, sans-serif; background-color: #fff8f0; color: #2c2c2c; padding: 20px; border-radius: 10px;">' +

    '<div style="text-align: center;">' +
      '<img src="http://5466906.shop.netsuite.com/core/media/media.nl?id=464667&c=5466906&h=TBPBMyrBRI_i_ncmseObz637y1dAeqI19cgQmap_0gcI7KUo" alt="Richy Logo" style="max-width: 180px; margin-bottom: 20px;" />' +
    '</div>' +

    '<p style="font-size: 18px;">مرحباً <strong>' + customerName + '</strong>،</p>' +

    '<p style="font-size: 16px;">شكراً لتسوقك من <strong>ريتشـي</strong> 🤍</p>' +
    '<p style="font-size: 16px;">يمكنك استخدام القسيمة الشرائية التالية في أحد فروع ريتشي، وعليك بالعافية 🤍</p>' +

    '<p style="font-size: 15px; color: #8a6d3b; background-color: #fff3cd; padding: 10px; border-radius: 6px; margin-top: 20px;">' +
      '<strong>ملاحظة:</strong> شارك رمز القسيمة المرفق مع موظف الفرع للاستفادة منها' +
    '</p>' +

    '<div style="text-align: center; margin: 30px 0;">' +
      '<span style="font-size: 24px; color: #b89b5e; font-weight: bold; background-color: #f2e6d9; padding: 12px 25px; border-radius: 10px; display: inline-block;">' + code + '</span>' +
    '</div>' +

    '<hr style="margin: 40px 0; border: none; border-top: 1px solid #ccc;" />' +

    '<p style="font-size: 14px; color: #999;">يرجى ملاحظة أن هذا البريد مُرسل من نظام تلقائي ولا يمكن الرد عليه.</p>' +
    '<p style="font-size: 14px;">للمساعدة أو الاستفسارات، تواصل معنا عبر الواتساب على الرقم التالي:</p>' +

    '<p style="text-align: center;">' +
      '<a href="https://api.whatsapp.com/send?phone=+966920014121&text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7" style="background-color: #25d366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">راسلنا عبر واتساب</a>' +
    '</p>' +

    '<p style="font-size: 12px; text-align: center; color: #aaa; margin-top: 30px;">أو يمكنك التواصل معنا عبر البريد: <a href="mailto:care@richy.sa" style="color: #b89b5e;">care@richy.sa</a></p>' +
    '<p style="font-size: 12px; text-align: center; color: #aaa;">© ' + new Date().getFullYear() + ' Richy Saudi</p>' +
  '</div>';

require(['N/email'], function(email) {
  email.send({
    author: 1789680, // غيّر هذا إلى ID الموظف أو سكربت المستخدم للإرسال
    recipients: customerEmail,
    subject: emailSubject,
    body: emailBody,
    isHtml: true
  });
});


            email.send({
                author: 1789680, 
                recipients: customerEmail,
             // recipients: "m.waqas@richy.sa",
                subject: emailSubject,
                body: emailBody
            });

            log.audit('Email Sent', 'Coupon code sent to ' + customerEmail);
        } catch (e) {
            log.error({ title: 'sendEmailNotification Error', details: e });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});



// /**
//  * @NApiVersion 2.x
//  * @NScriptType UserEventScript
//  */

// define(['N/search', 'N/log', 'N/record', 'N/https','N/email'], function (search, log, record, https,email) {

//     function afterSubmit(context) {
//         try {
//             var title = 'Send & Mark Code';

//             log.audit(title + ' - Context Type', context.type);
//             if (context.type !== context.UserEventType.CREATE) return;

//             var newRec = context.newRecord;
//             var itemCount = newRec.getLineCount({ sublistId: 'item' });

//             var upcCode = null;
//             for (var i = 0; i < itemCount; i++) {
//                 var upc = newRec.getSublistValue({
//                     sublistId: 'item',
//                     fieldId: 'custcol_upc_code',
//                     line: i
//                 });

//                 if (upc === 'GC1000' || upc === 'GC250' || upc === 'GC500') {
//                     upcCode = upc;
//                     break;
//                 }
//             }

//             if (!upcCode) {
//                 log.audit({ title: title, details: 'No GC UPC found' });
//                 return;
//             }

//             var phoneNumber = newRec.getValue({ fieldId: 'custbody_customer_contact' });
          
//             if (!phoneNumber) {
//                 log.error({ title: title, details: 'Missing customer phone number.' });
//                 return;
//             }

//             var customerName = '';
//             try {
//                 var customerId = newRec.getValue({ fieldId: 'entity' });
//                 if (customerId) {
//                     var customerRec = record.load({
//                         type: record.Type.CUSTOMER,
//                         id: customerId
//                     });
//                     var entityId = customerRec.getValue({ fieldId: 'entityid' }) || '';
//                     var altName = customerRec.getValue({ fieldId: 'altname' }) || '';
//                     customerName = (entityId + ' ' + altName).trim();
//                     log.debug('Loaded Customer Name', customerName);
//                 }
//             } catch (e) {
//                 log.error({ title: 'Customer Load Error', details: e });
//             }

//             var promoSearch = search.create({
//                 type: 'customrecord_promotion_coupon_code',
//                 filters: [
//                     ['custrecord_promotion_coupon_code', 'is', upcCode],
//                     'AND',
//                     ['custrecord_issent_promotion_coupon', 'is', 'F']
//                 ],
//                 columns: ['custrecord_code_promotion_coupon']
//             });

//             var results = promoSearch.run().getRange({ start: 0, end: 1 });
//             if (!results || results.length === 0) {
//                 log.audit({ title: title, details: 'No unsent code available for ' + upcCode });
//                 return;
//             }

//             var promoRec = results[0];
//             var code = promoRec.getValue({ name: 'custrecord_code_promotion_coupon' });
//             var internalId = promoRec.id;

//             var payload = {
//                 template_name: "branch_coupon",
//                 broadcast_name: "branch_coupon",
//                 parameters: [
//                     { name: "name", value: customerName },
//                     { name: "pdfLink", value: code }
//                 ]
//             };
//             // ✅ Send Whatsapp app 
//             sendWhatsappNotification(payload, phoneNumber);

//             // ✅ Send SMS also
// var smsMessage = 'مرحباً ' + customerName + '، شكراً لتسوقك من ريتشي 🤍\n' +
//                  'قسيمتك: ' + code + '\n' +
//                  'قدّمها لموظف الفرع للاستفادة منها.';

//            // ✅ Send Email
//             sendEmailNotification(customerRec, customerName, code);

//             record.submitFields({
//                 type: 'customrecord_promotion_coupon_code',
//                 id: internalId,
//                 values: {
//                     custrecord_issent_promotion_coupon: true
//                 }
//             });

//             log.audit({
//                 title: title + ' - Code Sent',
//                 details: 'Code: ' + code + ' sent to ' + phoneNumber
//             });

//         } catch (e) {
//             log.error({ title: 'Error in STEP 4', details: e });
//         }
//     }

// // Sending a whatsapp number to message 
//   function sendWhatsappNotification(payload, phoneNumber) {
//     try {
//         log.debug("sendWhatsappNotification()", '[EXECUTION START]');
//         log.debug("Payload", JSON.stringify(payload));
//         log.debug("Phone Number", phoneNumber);

//         var headers = {
//             "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlZWRjNDVkZC0yYzc3LTRhOTQtODU3MS1iN2NmYWUyNTViZmQiLCJ1bmlxdWVfbmFtZSI6ImluZm9AcmljaHkuc2EiLCJuYW1laWQiOiJpbmZvQHJpY2h5LnNhIiwiZW1haWwiOiJpbmZvQHJpY2h5LnNhIiwiYXV0aF90aW1lIjoiMDcvMTYvMjAyNSAxMDoxNDozMyIsInRlbmFudF9pZCI6IjMyODAwNSIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.vfokyatzCExqcRI0sTN_hWdB663OZvSwAF36KBEN1qE",
//             "Content-Type": "application/json"
//         };

//         var response = https.post({
//             url: 'https://live-mt-server.wati.io/328005/api/v1/sendTemplateMessage?whatsappNumber=' + encodeURIComponent(phoneNumber),
//             body: JSON.stringify(payload),
//             headers: headers
//         });

//         log.debug('WhatsApp Response Code', response.code);
//         log.debug('WhatsApp Response Body', response.body);
//     } catch (e) {
//         log.error({
//             title: 'sendWhatsappNotification: Error sending WhatsApp message',
//             details: e
//         });
//     }
// }

  
// // SMS Code 
//   function sendSMSNotification(phoneNumber, messageBody) {
//     try {
//         var appId = 'jXN8BQAYn5TehJfPhNkXEvIFMYEkTR';

//         // Send without encodeURIComponent()
//         // var postData =
//         //     'AppSid=' + appId +
//         //     '&Body=' + messageBody +
//         //     '&Recipient=' + phoneNumber +
//         //     '&SenderID=RICHY';
//         var postData =
//             'AppSid=' + appId +
//             '&Body=' + messageBody +
//             '&Recipient=' + phoneNumber +
//             '&SenderID=RICHY';

//         var headers = {
//             'Content-Type': 'application/x-www-form-urlencoded'
//         };

//         log.debug('Unifonic Post Body', postData);

//         var response = https.post({
//             // url: 'https://el.cloud.unifonic.com/rest/SMS/messages',
//             url: 'https://el.cloud.unifonic.com/rest/SMS/messages',
//             body: postData,
//             headers: headers
//         });

//         if (response.code === 200) {
//             log.debug('SMS Sent Successfully', response.body);
//         } else {
//             log.error('Failed to Send SMS', response.code + ' - ' + response.body);
//         }
//     } catch (e) {
//         log.error({ title: 'sendSMSNotification Error', details: e });
//     }
// }

//   function sendEmailNotification(customerRec, customerName, code) {
//         try {
//             var customerEmail = customerRec.getValue({ fieldId: 'email' });
//             if (!customerEmail) {
//                 log.error('Missing Email', 'Customer email not found.');
//                 return;
//             }

// var emailSubject = '🎁 قسيمتك الشرائية من ريتشي';

// var emailBody = '<div style="direction: rtl; font-family: Tahoma, Arial, sans-serif; background-color: #fff8f0; color: #2c2c2c; padding: 20px; border-radius: 10px;">' +
//   '<div style="text-align: center;">' +
//     '<img src="https://5466906.app.netsuite.com/core/media/media.nl?id=464667&c=5466906&h=TBPBMyrBRI_i_ncmseObz637y1dAeqI19cgQmap_0gcI7KUo" alt="Richy Logo" style="max-width: 180px; margin-bottom: 20px;" />' +
//   '</div>' +

//   '<p style="font-size: 18px;">مرحباً <strong>' + customerName + '</strong>،</p>' +

//   '<p style="font-size: 16px;">شكراً لتسوقك من <strong>ريتشـي</strong> 🤍</p>' +
//   '<p style="font-size: 16px;">يمكنك استخدام القسيمة الشرائية التالية في أحد فروع ريتشي، وعليك بالعافية 🤍</p>' +

//   '<p style="font-size: 15px; color: #8a6d3b; background-color: #fff3cd; padding: 10px; border-radius: 6px; margin-top: 20px;">' +
//     '<strong>ملاحظة:</strong> شارك رمز القسيمة المرفق مع موظف الفرع للاستفادة منها' +
//   '</p>' +

//   '<div style="text-align: center; margin: 30px 0;">' +
//     '<span style="font-size: 24px; color: #b89b5e; font-weight: bold; background-color: #f2e6d9; padding: 12px 25px; border-radius: 10px; display: inline-block;">' + code + '</span>' +
//   '</div>' +

//   '<hr style="margin: 40px 0; border: none; border-top: 1px solid #ccc;" />' +
//   '<p style="font-size: 14px; color: #999;">يرجى ملاحظة أن هذا البريد مُرسل من نظام تلقائي ولا يمكن الرد عليه.</p>' +
//   '<p style="font-size: 14px;">للمساعدة أو الاستفسارات، تواصل معنا عبر الواتساب على الرقم التالي:</p>' +
//   '<p style="text-align: center;">' +
//     '<a href="https://api.whatsapp.com/send?phone=+966920014121&text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7" style="background-color: #25d366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">راسلنا عبر واتساب</a>' +
//   '</p>' +

//   '<p style="font-size: 12px; text-align: center; color: #aaa; margin-top: 30px;">أو يمكنك التواصل معنا عبر البريد: <a href="mailto:care@richy.sa" style="color: #b89b5e;">care@richy.sa</a></p>' +
//   '<p style="font-size: 12px; text-align: center; color: #aaa;">© ' + new Date().getFullYear() + ' Richy Saudi</p>' +
// '</div>';

//             email.send({
//                 author: 1789680, 
//                 recipients: customerEmail,
//              // recipients: "m.waqas@richy.sa",
//                 subject: emailSubject,
//                 body: emailBody
//             });

//             log.audit('Email Sent', 'Coupon code sent to ' + customerEmail);
//         } catch (e) {
//             log.error({ title: 'sendEmailNotification Error', details: e });
//         }
//     }

//     return {
//         afterSubmit: afterSubmit
//     };
// });
