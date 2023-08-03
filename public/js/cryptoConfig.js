const config = {
    key:{name:'PBKDF2',hash:'SHA-256',iterations:1000000},
    encryption:{name:"AES-GCM",length:256},
    wrapping:{ name: "AES-KW", length: 256 }
};

const arrayToString = array=>btoa(array.map(byte=>String.fromCharCode(byte)).join(''));