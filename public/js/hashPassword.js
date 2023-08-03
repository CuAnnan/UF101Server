async function hashPassword(password)
{

    // create an array of digits representing the number of iterations


    // generate a crypto key with the password
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        config.key.name,
        false,
        ['deriveBits']
    );

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

