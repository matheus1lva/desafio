// Imports
var fs = require('fs');
var _ = require('lodash');
var R = require('ramda');
var validator = require('validator');
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance(),
    PNF = require('google-libphonenumber').PhoneNumberFormat,
    PNT = require('google-libphonenumber').PhoneNumberType;
// end Imports
// begin functions
function trataClasses(conteudo) {
    var classes = [];
    if (conteudo !== undefined && conteudo !== "") {
        if (conteudo.indexOf("/") >= 0) {
            var tempArray = conteudo.split("/");
            tempArray.forEach(function(classe) {
                classes.push(classe.trim().replace(/\n/g, ""));
            });
        } else if (conteudo.indexOf(",") >= 0) {
            var tempArray = conteudo.split(",");
            tempArray.forEach(function(classe) {
                classes.push(classe.trim().replace(/\n/g, ""));
            });
        } else {
            return conteudo;
        }
    }
    return classes;
}

function trataAddress(conteudo, header) {
    var address = {};
    var addresses = [];
    var tags = [];
    var telephoneNumber, temp;
    var sanitizedHeader = header.split(",");
    sanitizedHeader.forEach(function(headerContent) {
        headerContent = headerContent.replace("email", "").replace("phone", "").replace(/"/g, "").trim();
        tags.push(headerContent);
    });

    if (header.indexOf("email") >= 0) {
        if (conteudo.indexOf("/") >= 0) {
            temp = conteudo.split("/");
            temp.forEach(function(email) {
                var endereco = {};
                if (validator.isEmail(email)) {
                    endereco["type"] = "email";
                    endereco["tags"] = tags;
                    endereco["address"] = email;
                    addresses.push(endereco);
                }
            });
        } else {
            if (validator.isEmail(conteudo)) {
                address["type"] = "email";
                address["tags"] = tags;
                address["address"] = conteudo;
                addresses.push(address);
            }

        }
    } else {
        temp = conteudo.replace("(", "").replace(")", "").replace(" ", "");
        try {
            var number = phoneUtil.parse(temp, 'BR');
            telephoneNumber = phoneUtil.format(number, PNF.E164).replace("+", "");
            if (phoneUtil.isValidNumber(number) && conteudo !== undefined) {
                address["type"] = "phone";
                address["tags"] = tags
                address["address"] = telephoneNumber;
                addresses.push(address);
            }
        } catch (err) {
            //console.log("deu errado");
        }
    }
    return addresses;
}

function fillOthers(conteudo, header) {
    if (conteudo === "1" || conteudo == "yes") {
        return true;
    } else {
        return false;
    }
}

/*
* This function is not used. However, this is another implementation of the line 167, but there
* the implementation is way more cleaner and has a better performance.
* The usage of the library Ramda fits perfectly for this scope of usage, can not be useful in future problems.
* You can remove this uncommented lines if you want.
*/
// function concatObjectsAndArrays(target, source) {
//     var item, tItem;
//     if (typeof source == 'undefined') {
//         return source;
//     } else if (typeof target == 'undefined') {
//         return target;
//     }
//
//     for (var prop in source) {
//         item = source[prop];
//         //check if the first element is indeed an object.
//         if (typeof item == 'object' && item !== null) {
//             //if the first item is an array
//             if (_.isArray(item) && item.length) {
//                 //dealing with array of primitives
//                 if (typeof item[0] != 'object') {
//                     item.forEach(function(conteudo) {
//                         //push to the target all the elements;
//                         target[prop].push(conteudo);
//                     });
//                 } else {
//                     var targetArray = item.concat(target[prop]);
//                     target[prop] = targetArray;
//                 }
//             } else {
//                 //if its a normal object
//                 concatObjectsAndArrays(target[prop], item);
//             }
//
//         } else if (prop.startsWith("invisible") || prop.startsWith("see_all")) {
//             // item is a primitive, just copy it over
//             var resultOfSum = !!(target[prop] + item);
//             target[prop] = resultOfSum;
//         }
//     }
//     return target;
// }

function mergeAttrs(array) {
    var resultArray = [];
    if (array.length === 1) {
        return array;
    }
    for (i = 0; i < array.length; i++) {
        var object = {};
        if (array[i] !== undefined && array[i + 1] !== undefined) {
            if (array[i]["type"] === array[i + 1]["type"] && array[i]["address"] == array[i + 1]["address"]) {
                if (!_.isEqual(array[i]["tags"], array[i + 1]["tags"])) {
                    _.extend(object, array[i]);
                    object["tags"] = _.uniq(array[i]["tags"].concat(array[i + 1]["tags"]));
                    resultArray.push(object);
                    i = i + 1;
                }
            } else {
                resultArray.push(array[i]);
            }
        } else if (array[i] !== undefined && array[i + 1] === undefined) {
            resultArray.push(array[i]);
        }

    }
    return resultArray;
}

function mergeObjectsWithSameElement(contentA) {
    var mergedJSON = [];
    var currentElement, oldElement;
    var dupeMergeFn = function(a, b) {
        return (Array.isArray(a)) ? a.concat(b) : b;
    };
    contentA.forEach(function(elemento) {
        currentElement = elemento;
        if (oldElement !== undefined) {
            if (currentElement["fullname"] === oldElement["fullname"]) {
            //var tempObject = concatObjectsAndArrays(currentElement, oldElement);
                var tempObject = R.mergeWith(dupeMergeFn, currentElement, oldElement);
                tempObject["see_all"] = !!(currentElement["see_all"]+oldElement["see_all"]);
                tempObject["invisible"] = !!(currentElement["invisible"]+oldElement["invisible"]);
                mergedJSON.push(tempObject);
            } else {
                var object = currentElement;
                var tempObject = {};
                for (var attr in object) {
                    if (_.isArray(object[attr]) && attr === "addresses") {
                        tempObject[attr] = mergeAttrs(object[attr]);
                    } else {
                        tempObject[attr] = object[attr];
                    }
                }
                mergedJSON.push(tempObject);
            }
        }
        oldElement = elemento;
    });
    return mergedJSON;
}
// End Functions

var f = fs.readFileSync('./alunos.csv', {
    encoding: 'utf-8'
}, function(err) {
    throw error;
});

f = f.split("\n");
//work around to have the last element not beeing " ";
f.splice(-1, 1);
var headers = f.shift().split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
var finalJSON = [];

f.forEach(function(entry) {
    var temp = {};
    var addresses, classes, others;
    var line = entry.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    temp["addresses"] = [];
    temp["classes"] = [];
    for (i = 0; i < headers.length; i++) {
        if (line[i] !== undefined) {
            var tempLine = line[i].replace(/"/g, "").replace("hahaha", "");
            if (headers[i].indexOf("fullname") >= 0) {
                temp[headers[i]] = tempLine;
            } else if (headers[i].startsWith("eid")) {
                temp[headers[i]] = tempLine;
            } else if (headers[i].startsWith("class")) {
                classes = trataClasses(tempLine);
                if(_.isArray(classes)){
                    if(_.isArray(temp["classes"])){
                        classes.forEach(function(classe){
                            temp["classes"].push(classe);
                        });
                    }else{
                        temp["classes"] = classes;
                    }
                }else{
                    if(_.isArray(temp["classes"])){
                        temp["classes"].push(classes);
                    }else{
                        temp["classes"] = classes;
                    }
                }
            } else if (headers[i].indexOf("invisible") >= 0 || headers[i].indexOf("see_all") >= 0) {
                others = fillOthers(tempLine);
                temp[headers[i]] = others;
            } else {
                addresses = trataAddress(tempLine, headers[i]);
                addresses.forEach(function(enderecos) {
                    temp["addresses"].push(enderecos);
                });
            }
        }
    }
    finalJSON.push(temp);
});
finalJSON = mergeObjectsWithSameElement(finalJSON);
fs.writeFile("./resultado.json", JSON.stringify(finalJSON, null, 4), function(error) {
    if (error) {
        throw error;
    }
});
