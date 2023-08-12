import * as OTPAuth from "otpauth";

// Create a new TOTP object.
let totp = new OTPAuth.TOTP({
    issuer: "ACME",
    label: "AzureDiamond",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: "NB2W45DFOIZA", // or 'OTPAuth.Secret.fromBase32("NB2W45DFOIZA")'
});

// Generate a token (returns the current token as a string).
let token = totp.generate();

// Validate a token (returns the token delta or null if it is not found in the search window, in which case it should be considered invalid).
let delta = totp.validate({ token, window: 1 });
console.log(delta);