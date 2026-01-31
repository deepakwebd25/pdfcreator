const CryptoJS = require("crypto-js");

const SECRET = "MY_SECRET_123"; 

function generateLicense(user, expiry) {
  const data = `${user}|${expiry}`;
  const encrypted = CryptoJS.AES.encrypt(data, SECRET).toString();
  return encrypted;
}

// Example
console.log(generateLicense("Deepak", "2026-12-31"));
