// Imports
var fs = require('fs');
var _ = require('lodash');
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance(),
    PNF = require('google-libphonenumber').PhoneNumberFormat,
    PNT = require('google-libphonenumber').PhoneNumberType;
// end Imports

// Functions
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
            classes.push(conteudo);
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
                endereco["type"] = "email";
                endereco["tags"] = tags;
                endereco["address"] = email;
                addresses.push(endereco);
            });
        } else {
            address["type"] = "email";
            address["tags"] = tags;
            address["address"] = conteudo;
            addresses.push(address);
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

function mergeObjectsWithSameElement(contentA) {
    var mergedJSON = [];
    var currentElement, oldElement;
    contentA.forEach(function(elemento) {
        currentElement = elemento;
        if (oldElement !== undefined) {
            if (currentElement["fullname"] === oldElement["fullname"]) {
                var tempObject = concatObjectsAndArrays(currentElement, oldElement);
                mergedJSON.push(tempObject);
            } else {
                mergedJSON.push(elemento);
            }
        }
        oldElement = elemento;
    });

    return mergedJSON;
}
function concatObjectsAndArrays(target, source) {
    var item, tItem, o, idx;
    if (typeof source == 'undefined') {
        return source;
    } else if (typeof target == 'undefined') {
        return target;
    }

    for (var prop in source) {
        item = source[prop];
        //check if the first element is indeed an object.
        if (typeof item == 'object' && item !== null) {
            //if the first item is an array
            if (_.isArray(item) && item.length) {
                //dealing with array of primitives
                if (typeof item[0] != 'object') {
                    item.forEach(function(conteudo) {
                        //push to the target all the elements;
                        target[prop].push(conteudo);
                    });
                } else {
                    //dealing with array of objects;
                    var targetArray = [];
                    var sourceArray = [];
                    for (i = 0; i < item.length; i++) {
                        idx = {};
                        if (_.isEqual(item[i], target[prop][i])) {
                            targetArray.push(item[i]);
                        } else {
                            targetArray.push(item[i]);
                            targetArray.push(target[prop][i]);
                        }
                    }
                    target[prop] = targetArray;
                }
            } else {
                //if its a normal object
                concatObjectsAndArrays(target[prop], item);
            }

        } else if (prop.startsWith("invisible") || prop.startsWith("see_all")) {
            // item is a primitive, just copy it over
            var resultOfSum = !!(target[prop] + item);
            target[prop] = resultOfSum;
        }
    }
    return target;
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
    temp["class"] = [];
    for (i = 0; i < headers.length; i++) {
        if (line[i] !== undefined) {
            var tempLine = line[i].replace(/"/g, "").replace(":)", "").replace("hahaha", "");
            if (headers[i].indexOf("fullname") >= 0) {
                temp[headers[i]] = tempLine;
            } else if (headers[i].startsWith("eid")) {
                temp[headers[i]] = tempLine;
            } else if (headers[i].startsWith("class")) {
                classes = trataClasses(tempLine);
                if (classes.length > 0) {
                    classes.forEach(function(classe) {
                        temp["class"].push(classe);
                    });
                } else {
                    delete temp["class"];
                    temp["class"] = classes[0];
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
//just a console log if you want to see in the console whats going on.
//console.log(JSON.stringify(finalJSON, null, 4));
finalJSON = mergeObjectsWithSameElement(finalJSON);
fs.writeFile("./resultado.json", JSON.stringify(finalJSON, null, 4), function(error) {
    if (error) {
        throw error;
    }
});
