import { Part } from "@google/generative-ai";

export function base64Encode(buffer: ArrayBuffer) {
    let string = '';
    (new Uint8Array(buffer)).forEach((byte) => {
        string += String.fromCharCode(byte);
    });
    return btoa(string)
}

export function base64Decode(string: string) {
    string = atob(string);
    const length = string.length,
        buf = new ArrayBuffer(length),
        bufView = new Uint8Array(buf);
    for (var i = 0; i < length; i++) {
        bufView[i] = string.charCodeAt(i);
    }
    return buf;
}

export function bufferToImagePart(buffer: ArrayBuffer, mimeType: string): Part {
    const imagePart: Part = {
        inlineData: {
            data: base64Encode(buffer),
            mimeType
        }
    }
    return imagePart;
}

export function testJSON(text: any): text is string {
    if (typeof text !== "string"){
        return false;
    }
    try{
        var json = JSON.parse(text);
        return (typeof json === 'object');
    }
    catch (error){
        return false;
    }
}