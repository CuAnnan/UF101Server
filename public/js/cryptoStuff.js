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

function getPasswordKey(password, bitsOnly = false, algorithm=config.key.name)
{

    return window.crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        { name: algorithm },
        false,
        bitsOnly?['deriveBits']:['deriveKey','deriveBits'],
    );
}

async function hashPassword(password)
{

    // generate a crypto key with the password
    const cryptoKey = await getPasswordKey(password, true);
    // generate a salt for hashing the password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    // store the salt as an array for later use
    const saltArray = Array.from(new Uint8Array(salt));
    let algo = config.key;
    algo.salt = salt;
    // hash the password
    const keyBuffer = await crypto.subtle.deriveBits(algo,cryptoKey,256);
    // save it as an array
    const keyArray = Array.from(new Uint8Array(keyBuffer));
    return `${config.key.name}:${config.key.hash}:${config.key.iterations}:${arrayToString(saltArray)}:${arrayToString(keyArray)}`;
}


/**
 *
 * @param password
 * @param {Object} passwordHashObject
 * @param {String} passwordHashObject.algorithm
 * @param {String} passwordHashObject.digest
 * @param {Number} passwordHashObject.iterations
 * @param {String} passwordHashObject.salt
 * @param {String} passwordHashObject.hash
 * @returns {Promise<Boolean>}
 */
async function verifyPassword(password, passwordHashObject)
{
    const newKey =  await getPasswordKey(password, true, passwordHashObject.algorithm);

    const newKeyBuffer = await crypto.subtle.deriveBits(
        {
            name:passwordHashObject.algorithm,
            hash:passwordHashObject.digest,
            salt:stringToArrayBuffer(passwordHashObject.salt),
            iterations:passwordHashObject.iterations
        },
        newKey,
        256
    );
    const newKeyArray = Array.from(new Uint8Array(newKeyBuffer));
    const newKeyString = arrayToString(newKeyArray);
    return newKeyString === passwordHashObject.hash;
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