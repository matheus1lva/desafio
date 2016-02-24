var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
        , PNF = require('google-libphonenumber').PhoneNumberFormat
        , PNT = require('google-libphonenumber').PhoneNumberType;
console.log(phoneUtil.isValidNumber(phoneUtil.parse('202-456-1111', 'US')));
