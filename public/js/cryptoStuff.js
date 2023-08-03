/*
Given some key material and some random salt
derive an AES-KW key using PBKDF2.
*/
function getKey(keyMaterial, salt)
{
    let algo = config.key;
    algo.salt = salt;
    return window.crypto.subtle.deriveKey(
        algo,
        keyMaterial,
        config.wrapping,
        true,
        ["wrapKey", "unwrapKey"],
    );
}

function getPasswordKey(password)
{
    return window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: config.key.name },
        false,
        ["deriveBits", "deriveKey"],
    );
}

function getEncryptionKey()
{
    return window.crypto.subtle.generateKey(
        config.encryption,
        true,
        ["encrypt", "decrypt"]
    );
}

/*
Wrap the given key.
*/
async function wrapCryptoKey(keyToWrap, password) {
    // get the key encryption key
    const keyMaterial = await getPasswordKey(password);
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const saltArray = Array.from(salt);

    const wrappingKey = await getKey(keyMaterial, salt);

    const wrappedKey = await window.crypto.subtle.wrapKey("raw", keyToWrap, wrappingKey, config.wrapping.name);
    const keyArray = Array.from(new Uint8Array(wrappedKey));

    return `${config.key.name}:${config.key.hash}:${config.key.iterations}:${arrayToString(saltArray)}:${arrayToString(keyArray)}`;
}

function stringToArrayBuffer(string)
{
    let bytes = atob(string).split('').map(char=>char.charCodeAt(0));
    const bytesUint8 = new Uint8Array(bytes);
    return bytesUint8.buffer;
}

/**
 *
 * @param {Uint8Array} uintArray
 * @returns {string}
 * @constructor
 */
function Uint8ArrayToString(uintArray)
{
    return btoa(Array.from(uintArray).map(Uint8=>String.fromCharCode(Uint8)).join(''));
}

async function unwrapCryptoKey(keyToUnwrap, password)
{
    // get the Salt
    const [, , , saltString, keyString] = keyToUnwrap.split(':');

    const saltArrayBuffer = stringToArrayBuffer(saltString);
    const keyArrayBuffer = stringToArrayBuffer(keyString);


    const keyMaterial = await getPasswordKey(password);
    const unwrappingKey = await getKey(keyMaterial, saltArrayBuffer);

    return window.crypto.subtle.unwrapKey(
        "raw", // import format
        keyArrayBuffer, // ArrayBuffer representing key to unwrap
        unwrappingKey, // CryptoKey representing key encryption key
        config.wrapping.name, // algorithm identifier for key encryption key
        config.encryption.name, // algorithm identifier for key to unwrap
        true, // extractability of key to unwrap
        ["encrypt", "decrypt"], // key usages for key to unwrap
    );
}


async function encrypt(plainText, key)
{
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedTextArrayBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        new TextEncoder().encode(plainText)
    );
    const encryptedUint8Array = new Uint8Array(encryptedTextArrayBuffer);
    const encryptedString = Uint8ArrayToString(encryptedUint8Array);
    const ivString = Uint8ArrayToString(iv);

    return `AES-GCM:${ivString}:${encryptedString}`;
}

async function decrypt(encryptedCombinedText, key)
{
    const[,ivString,encryptedString] = encryptedCombinedText.split(':');
    const dec = new TextDecoder();
    const iv = new Uint8Array(stringToArrayBuffer(ivString));
    const encrypted = new Uint8Array(stringToArrayBuffer(encryptedString));

    // do the decryption
    const decryptedTextArrayBuffer = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encrypted
    );

    const decryptedTextArray = new Uint8Array(decryptedTextArrayBuffer);
    return dec.decode(decryptedTextArray);
}