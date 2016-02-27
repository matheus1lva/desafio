// Imports
var fs = require('fs');
var _ = require('lodash');
var extend = require('util')._extend;
var R = require('ramda');
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

function mergeEVERYTHING(contentA) {
    var mergedJSON = [];
    var currentElement, oldElement;
    contentA.forEach(function(elemento) {
        currentElement = elemento;
        if (oldElement !== undefined) {
            if (currentElement["fullname"] === oldElement["fullname"]) {
                // console.log("CURRENT ELEMENT: "+ JSON.stringify(currentElement, null, 4));
                // console.log("OLD ELEMENT : "+ JSON.stringify(oldElement, null, 4));
                var tempObject = mergeObjects(currentElement, oldElement);
                console.log(JSON.stringify(tempObject, null, 4));
                //mergedJSON.push(tempObject);
            } else {
                mergedJSON.push(elemento);
            }

        }
        oldElement = elemento;
    });

    return mergedJSON;
}
// Assumes that target and source are either objects (Object or Array) or undefined
// Since will be used to convert to JSON, just reference objects where possible
function mergeObjects(target, source) {
    var item, tItem, o, idx;
    if (typeof source == 'undefined') {
        return source;
    } else if (typeof target == 'undefined') {
        return target;
    }

    for (var prop in source) {
        item = source[prop];
        //        console.log("ITEM:> "+ JSON.stringify(item, null, 4));
        //check if the first element is indeed an object.
        if (typeof item == 'object' && item !== null) {
            //if the first item is an array
            if (_.isArray(item) && item.length) {
                //dealing with array of primitives
                //console.log("SOU UM ARRAY");
                if (typeof item[0] != 'object') {
                    // console.log("SOU UM ARRAY de primitivas (string, etc...)");
                    item.forEach(function(conteudo) {
                        //push to the target all the elements;
                        target[prop].push(conteudo);
                    });
                } else {
                    //console.log("SOU UM ARRAY de objetos");
                    //dealing with array of objects;
                    var targetArray = [];
                    var sourceArray = [];
                    for (i = 0; i < item.length; i++) {
                        idx = {};
                        //    console.log("ITEM: " + JSON.stringify(item[i], null, 4) + " - TARGET " + JSON.stringify(target[prop][i], null, 4));
                        if (_.isEqual(item[i], target[prop][i])) {
                            targetArray.push(item[i]);
                        } else {
                            targetArray.push(item[i]);
                            targetArray.push(target[prop][i]);
                        }
                        // for(var attr in item[i]){
                        //     tItem = target[prop][i][attr];
                        //     var sourceItem = source[prop][i][attr];
                        //     console.log("TITEM AT ["+prop+"]["+i+"]["+attr+"] ===>" + require('util').inspect(tItem, {showHidden:true, depth:null}));
                        //     console.log("SOURCE ITEM AT ["+prop+"]["+i+"]["+attr+"] ===> " + require('util').inspect(sourceItem, {showHidden:true, depth:null}));
                        //     if(_.isArray(tItem) && _.isArray(source[attr])){
                        //         console.log("AMBOS SOMOS ARRAYS");
                        //         tItem.concat(source[attr]);
                        //         idx[attr] = tItem;
                        //     }else if(_.isArray(tItem) && !_.isArray(sourceItem)){
                        //         console.log("APENAS O OLD ELEMENT NAO É ARRAY");
                        //         tItem.push(source[attr]);
                        //         idx[attr] = tItem;
                        //     }else if(typeof tItem !== "object" && typeof sourceItem !== "object" && tItem !== sourceItem){
                        //         console.log("ESTES AQUI SAO O QUE SAO DIFERENTES: " + tItem + " E : " + sourceItem);
                        //         var idx2 = extend({}, idx);
                        //         console.log("ESTE é O IDX2 " + JSON.stringify(idx2, null, 4));
                        //         idx2[attr] = sourceItem;
                        //         console.log("ESTE é O IDX2 DEPOIS DE ALTERADO O ENDERECO" + JSON.stringify(idx2, null, 4));
                        //         targetArray.push(idx2);
                        //
                        //
                        //         idx[attr] = tItem;
                        //     }
                        //     else{
                        //         console.log("ESTOU SOU EU CASO NAO SEJA NADA");
                        //         idx[attr] = tItem;
                        //     }
                        //     console.log("ESTOU SOU O NOVO EU --->" + JSON.stringify(idx, null, 4));
                        //
                        // }
                        // targetArray.push(idx);
                        // console.log("ESTE AQUI É PRA ONDE ESTÃO INDO TODAS AS COISAS " + JSON.stringify(targetArray, null, 4));

                    }
                    //console.log(JSON.stringify(targetArray, null, 4));
                    target[prop] = targetArray;
                }
            } else {
                //if its a normal object
                mergeObjects(target[prop], item);
            }

        } else if(prop.startsWith("invisible") || prop.startsWith("see_all")) {
            // item is a primitive, just copy it over
            var resultOfSum = !!(target[prop]+item);
            target[prop] = resultOfSum;
        }
    }
    return target;
}

// function mergeObjects(target, source){
//     var item, tItem, o, idx;
//     if (typeof source == 'undefined') {
//       return source;
//     } else if (typeof target == 'undefined') {
//       return target;
//     }
//
//     for (var prop in source) {
//         item = source[prop];
//         //check if the first element is indeed an object.
//         if (typeof item == 'object' && item !== null) {
//             //if the first item is an array
//           if (_.isArray(item) && item.length) {
//               //dealing with array of primitives
//               if (typeof item[0] != 'object') {
//                   item.forEach(function(conteudo){
//                       //push to the target all the elements;
//                       target[prop].push(conteudo);
//                   });
//               }else{
//                 //dealing with array of objects;
//                 for(var attr in item){
//                     idx = {};
//                     tItem = target[attr]
//                     mergeObjects(tItem,item);
//                 }
//               }
//           }//if its a normal object
//           else {
//            // deal with object
//            mergeObjects(target[prop],item);
//          }
//
//         } else {
//              // item is a primitive, just copy it over
//              target[prop] = item;
//            }
//     }
//     return target;
// }
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
            var tempLine = line[i].replace(/"/g, "").replace(":)", "").replace("hahaha", "").trim();
            if (headers[i].indexOf("fullname") >= 0) {
                temp[headers[i]] = tempLine;
            } else if (headers[i].startsWith("eid")) {
                temp[headers[i]] = tempLine[i];
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
//console.log(JSON.stringify(finalJSON, null, 4));
finalJSON = mergeEVERYTHING(finalJSON);
// fs.writeFile("./resultado.json", JSON.stringify(finalJSON, null, 4), function(error) {
//     if (error) {
//         throw error;
//     }
// });
