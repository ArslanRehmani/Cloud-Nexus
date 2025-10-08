/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/https', 'N/encode', 'N/log'], (https, encode, log) => {

    const execute = async (context) => {
        var title = 'execute[::]';
        try {
            
            const refreshToken = 'eyJraWQiOiJjLjExMTcwMTVfU0IxLjIwMjUtMDktMDFfMDItNDAtMjYiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIzOzExOTIzODYzIiwiYXVkIjpbIjQ4NERCMUU3LThBMEMtNEE2QS1BRkY3LTVFODlFNjJBNjk0NzsxMTE3MDE1X1NCMSIsIjEyYjQwM2IyZjNkZTY0MTBiNzM1NzkwZWIzNjUxYzgwMmJlZjU1ZDZiYzhjY2JhNDU5YjZiNWU1Y2U0NWVhMGUiXSwic2NvcGUiOlsicmVzdGxldHMiXSwiaXNzIjoiaHR0cHM6Ly9zeXN0ZW0ubmV0c3VpdGUuY29tIiwib2l0IjoxNzU5OTA4ODY3LCJleHAiOjE3NjA1MTM2NjcsImlhdCI6MTc1OTkwODg2NywianRpIjoiMTExNzAxNV9TQjEuci1hLmIxMWUwNTFhLWI0NWEtNGM3OS1hMWY5LWJjZDg4MDdlZDFiYl8xNzU5OTA4ODY3NjQ5LjAifQ.AZTFf4xQpZmxoU9DjrPZ5HBRmCeTKD0T_Oa-BOMxgZe53IdfLxvTCKRwQIWLztn0QMDd8BABMKkTJg9b661vlZkNjJBfHUwnS4GmsLTbuJdEPs9zIYXWeF0jdaqT06byl9QcirA1ZY9qwOvAZVAiC_QlqdfbIfoMwUHi4eIFhu4cJsdm0FT0wr7bWGpNGqugOVTiEwaFY-1CaFbidx_1TonOGqBKmedKwyoLITxfoe0pIQFfsFw-wAl7CxDXO8gQLUygTx4AqPNdnS_R7XkJCOk4pPuuFN_yEst7lhy8CGBhNoICd30J1Hd5ZXALmO-kOY9Zb8rTejJxJnzv-H5HVycyRd6dsomWtF3FWyy8E35AVLU5jVyg1iOq4fFALHaN-2lmYe9oRPn9k-KB-vlMOmokYPoJuFwbv13280d8Bbmg_VwPXWVYidgv9s_DXnRIThe5EltelpbrhkdH21toReHtu6b02NgHocnwXYJF2fpLRgzG96IDRs9lz-FWIuBD1pRJUZstErgvr_zJnpMbSCdzyAvq7_tNXX2szO374CAyjNrquJDG2zdPwhBnuQZNuaCj5MpZJ18PyRahVg_NDrDZO33bBLEfV_62lBbVJYO8UOSSNwdCL6Ds7uEkvi4R46F8z7T8KbtChJu4n4JCYXsb2urksQYtLhst5mcSEoo';    // ideally from script parameter
            // const refreshToken = 'eyJraWQiOiJjLjExMTcwMTVfU0IxLjIwMjUtMDktMDFfMDItNDAtMjYiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIzOzExOTIzODYzIiwiYXVkIjpbIjQyRkJFOUJDLTRDOTUtNDA1Mi1CQTY0LTlGNTQyNDhGMDQwNTsxMTE3MDE1X1NCMSIsIjdkMmMyMmM0YmQzMzdhYjI2NjUzMGI1Y2U2NjUwMjBmYzE5M2I2ODc5ZDZhNDU0NGJmMmU1NjlhNGZmZjA0M2QiXSwic2NvcGUiOlsicmVzdGxldHMiLCJyZXN0X3dlYnNlcnZpY2VzIl0sImlzcyI6Imh0dHBzOi8vc3lzdGVtLm5ldHN1aXRlLmNvbSIsIm9pdCI6MTc1OTkwODU4MSwiZXhwIjoxNzU5OTEyMTgxLCJpYXQiOjE3NTk5MDg1ODEsImp0aSI6IjExMTcwMTVfU0IxLmEtYy5udWxsLjE3NTk5MDg1ODE2MjIifQ.i6iNG4tAZH4SCdxCv2fHmxW25API2--lw8QN4-oZTPNTN2_17tUiCQlxIYgoadpUrZv9e8gQXEPRvYIHba1lUmTQu4rwNN4_KqZ9BSlcs6PCnCBAD6TGn8mjBEr69lPiYd015tfeucqtjnDzTYj4gc8s67LchKki-9P_M5CKOMpY5an06ClbicEZ4Pt9LGpquRJAB_CYQ4t3sIZhcvXxltYBrptHlo2tv0o0VAIb4qV6-82FPvGFxI16ALIQWm1mBPoJCsCaJTZbz_ZGcv62uRw5W_eCWpiElH5x2a9jjTb7Y5f-4UjJQQir6CfL9XNaNjDZ9YSFe2BF1zVJZNoqRaC6SO377cJluVpR3pDXcqfW9HGnTpw5_zOrK8K9L5PmZCWCWV7-8eRProt_Xind_62nJwiOTzMNe08y68Em52esoGkxIlTRWR_xQJpiZPfNZOa2elLojXGiTerSCQkhIwpVecJPFsiaxtxI_6Yeq9xMwMYlClLfqEGoZsE_YnOuOmWy3XX8Rs5SrnP9x3GK5uGj2Nl8uxLUJ7hdzjYLa3_Z8kkv_Cbo00dTYwSiJI-4EXMhefsCfEASpJw4VAtPiURZVrzeGhWJjQm8jHA7GHMfYmKtMKbKfjMGJLa90P07QzdsEVw95WqHKULjc_GALat8daOjFyP24McMjqzliCM';    // ideally from script parameter
            const consumerKey = '12b403b2f3de6410b735790eb3651c802bef55d6bc8ccba459b6b5e5ce45ea0e';
            const consumerSecret = 'f4271655c0f1ff12e485a3b376ca3e718a9463d79bdf94733f2aab10794ac92a';
            const tokenUrl = 'https://1117015-SB1.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token?grant_type=refresh_token&refresh_token='+refreshToken+''; // replace with your token endpoint

            // Encode Consumer Key + Secret for Basic Auth
            const basicAuth = encode.convert({
                string: consumerKey + ':' + consumerSecret,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });

            const headers = {
                'Authorization': 'Basic ' + basicAuth,
                'Content-Type': 'application/x-www-form-urlencoded'
            };

            const response = await https.post.promise({
                url: tokenUrl,
                headers: headers
            });

            log.debug('Response', response);
            log.debug('Response Code', response.code);
            log.debug('Response Body', response.body);

            if (response.code === 200) {
                const result = JSON.parse(response.body);
                const accessToken = result.access_token;
                const newRefreshToken = result.refresh_token; // sometimes returned
                log.audit('Access Token', accessToken);
                log.audit('New Refresh Token', newRefreshToken);
            } else {
                log.error('Failed to refresh token', response.body);
            }

        } catch (e) {
            log.error('Error refreshing token', e);
        }
    };

    return { execute };
});