// Imports
var fs = require('fs');
var _ = require('lodash');
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
                    if(validator.isEmail(email)){
                        endereco["type"] = "email";
                        endereco["tags"] = tags;
                        endereco["address"] = email;
                        addresses.push(endereco);
                    }
                });
            } else {
                if(validator.isEmail(conteudo)){
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
    Array.prototype.equals = function (array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time
        if (this.length != array.length)
            return false;

        for (var i = 0, l=this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i]))
                    return false;
            }
            else if (this[i] != array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    }

    function checkHasArray(object){
        for(var attr in object){
            if(_.isArray(object[attr])){
                return true;
            }
        }
    }
    function mergeObjectsWithArraysInside(object1, object2){
        var mergedObject = {};
        var idx2 = {};
        var mergedObjects = [];
        for(var atributo in object1){
            if(object1[atributo] === object2[atributo]){
                mergedObject[atributo] = object1[atributo];
            }else if(_.isArray(object1[atributo]) && _.isArray(object2[atributo])){
                mergedObject[atributo] = _.uniq(object1[atributo].concat(object2[atributo]));
            }else{
                mergedObjects.push(object1);
                mergedObjects.push(object2);
                return mergedObjects;
            }
        }
        return idx;
    }
    function specificMerge(object1, object2){
        var object = {};
        if(object1["type"] === object2["type"] && object1["address"] === object2["address"]){
            object = object1;
            object["tags"] = _.uniq(object1["tags"].concat(object2["tags"]));
            return object;
        }else {

        }
    }
    function concatObjectsAndArrays(target, source) {

        var item, tItem;
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
                        //var targetArray = [];
                        var targetArray = item.concat(target[prop]);
                        //var sourceArray = [];
                        //console.log("TARGET -> " + JSON.stringify(item, null, 4));
                        //console.log("source -> " + JSON.stringify(target[prop], null, 4));
                        // for (i = 0; i < target[prop].length; i++) {
                        //     var sItem;
                        //     var tempObjeto = {};
                        //     tItem = target[prop][i];
                        //     sItem = item[i];
                        //     if(sItem !== undefined && tItem !== undefined){
                        //         if (_.isEqual(tItem, sItem)) {
                        //             targetArray.push(sItem);
                        //         } else {
                        //             var objetoConcatenado = specificMerge(sItem, tItem);
                        //             if(objetoConcatenado !== undefined && _.isObject(objetoConcatenado)){
                        //                 tempArray.push(objetoConcatenado);
                        //             }else if(checkHasArray(sItem) && checkHasArray(tItem)){
                        //                 var mergedObject = mergeObjectsWithArraysInside(sItem, tItem);
                        //                 if(_.isArray(mergedObject)){
                        //                     targetArray = targetArray.concat(mergedObject);
                        //                 }else if(_.isObject(mergedObjects)){
                        //                     targetArray.push(mergeObjects);
                        //                 }
                        //             }
                        //         }
                        //     }else if(sItem === undefined && tItem !== undefined){
                        //         targetArray.push(tItem);
                        //     }

                            //console.log("TARGET -> " + JSON.stringify(item[i], null, 4));
                            //console.log("source -> " + JSON.stringify(target[prop][i], null, 4));


                            // idx = {};
                            // if (_.isEqual(item[i], target[prop][i])) {
                            //     //console.log("to dentro do if " + item[i] + " - " + target[prop][i]);
                            //     targetArray.push(item[i]);
                            // } else {
                            //     console.log(item[i]);
                            //     console.log(target[prop][i]);
                            //     targetArray.push(item[i]);
                            //     targetArray.push(target[prop][i]);
                            // }
                        //}
                        //console.log(targetArray);
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
            var tempLine = line[i].replace(/"/g, "").replace("hahaha", "");
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

finalJSON = mergeObjectsWithSameElement(finalJSON);
console.log(JSON.stringify(finalJSON, null, 4));
fs.writeFile("./resultado.json", JSON.stringify(finalJSON, null, 4), function(error) {
    if (error) {
        throw error;
    }
});
