// Imports
var fs = require('fs');
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()
        , PNF = require('google-libphonenumber').PhoneNumberFormat
        , PNT = require('google-libphonenumber').PhoneNumberType;
// end Imports

// Functions
function trataClasses(conteudo, classes) {
    var classes = [];
    if (conteudo.startsWith("Sala") && conteudo !== undefined && conteudo !== "") {
        if (conteudo.indexOf(",") >= 0) {
            var tempString = conteudo.split(",");
            classes.push(tempString[0].trim());
            classes.push(tempString[1].trim());
        }else{
            classes.push(conteudo);
        }
    }
    if (classes.length > 1) {
        return classes;
    } else {
        return classes[0];
    }
}

function trataAddress(conteudo, header) {
    var address = {};
    var addresses = [];
    var tags = [];
    var telephoneNumber, temp;
    var sanitizedHeader = header.split(",");
    sanitizedHeader.forEach(function(headerContent){
        headerContent = headerContent.replace("email", "").replace("phone", "").replace(/"/g, "").trim();
        tags.push(headerContent);
    });

    if(header.indexOf("email")>= 0){
        if(conteudo.indexOf("/") >= 0){
            temp = conteudo.split("/");
            temp.forEach(function(email){
                var endereco = {};
                endereco["type"] = "email";
                endereco["tags"] = tags;
                endereco["address"] = email;
                addresses.push(endereco);
            });
        }else{
            address["type"] = "email";
            address["tags"] = tags;
            address["address"] = conteudo;
            addresses.push(address);
        }
    }else{
        temp = conteudo.replace("(", "").replace(")", "").replace(" ", "");
        try{
            var number = phoneUtil.parse(temp, 'BR');
            telephoneNumber = phoneUtil.format(number, PNF.E164).replace("+", "");
            if(phoneUtil.isValidNumber(number) && conteudo !== undefined){
                address["type"] = "phone";
                address["tags"] = tags
                address["address"] = telephoneNumber;
                addresses.push(address);
            }
        }catch(err){
            //console.log("deu errado");
        }
    }
    return addresses;
}
function fillOthers(conteudo, header){
        if(conteudo === "1" || conteudo == "yes"){
            return true;
        }else {
            return false;
        }
    }
// End Functions
var f = fs.readFileSync('./alunos.csv', {encoding: 'utf-8'}, function(err) { throw error;});

f = f.split("\n");
//work around to have the last element not beeing " ";
f.splice(-1, 1);
var headers = f.shift().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
var tempArray = [];

f.forEach(function(entry) {
    var temp = {};
    var addresses, classes, others;
    var line = entry.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    temp["addresses"] = [];
    for (i = 0; i < headers.length; i++) {
        if (line[i] !== undefined) {
            var tempLine = line[i].replace(/"/g, "").replace(":)", "").replace("hahaha", "").trim();
            if(headers[i].indexOf("fullname") >= 0){
                // console.log("Estou dentro de fullname e o conteudo é: "+ tempLine);
                temp[headers[i]] = tempLine;
            }else if(headers[i].startsWith("eid")){
                // console.log("Estou dentro de eid e o conteudo é: "+ tempLine);
                temp[headers[i]] = tempLine[i];
            }else if (headers[i].startsWith("class")) {
                // console.log("Estou dentro de class e o conteudo é: "+ tempLine);
                classes = trataClasses(tempLine);
                temp[headers[i]] = classes;
            }else if(headers[i].indexOf("invisible") >= 0 || headers[i].indexOf("see_all") >= 0){
                // console.log("Estou dentro de invisible e o conteudo é: "+ tempLine);
                others = fillOthers(tempLine);
                temp[headers[i]] = others;
            }else{
            //    console.log("estou dentro dos endereços  e conteudo é : " + tempLine);
                addresses = trataAddress(tempLine, headers[i]);
                addresses.forEach(function(enderecos){
                    temp["addresses"].push(enderecos);
                });
            }
        }
    }
    tempArray.push(temp);
});
fs.writeFile("./resultado.json", JSON.stringify(tempArray, null, 4), function(error){
    console.log(error);
});
