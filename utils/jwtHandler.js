const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const keysDir = path.join(__dirname, "..", "keys");
const privateKeyPath =
  process.env.JWT_PRIVATE_KEY_PATH || path.join(keysDir, "private.key");
const publicKeyPath =
  process.env.JWT_PUBLIC_KEY_PATH || path.join(keysDir, "public.key");

let privateKeyCache = null;
let publicKeyCache = null;

function ensureKeyPair() {
  const hasPrivateKey = fs.existsSync(privateKeyPath);
  const hasPublicKey = fs.existsSync(publicKeyPath);

  if (hasPrivateKey && hasPublicKey) {
    return;
  }

  fs.mkdirSync(path.dirname(privateKeyPath), { recursive: true });
  fs.mkdirSync(path.dirname(publicKeyPath), { recursive: true });

  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  fs.writeFileSync(privateKeyPath, privateKey, "utf8");
  fs.writeFileSync(publicKeyPath, publicKey, "utf8");
}

function getPrivateKey() {
  if (privateKeyCache) {
    return privateKeyCache;
  }
  ensureKeyPair();
  privateKeyCache = fs.readFileSync(privateKeyPath, "utf8");
  return privateKeyCache;
}

function getPublicKey() {
  if (publicKeyCache) {
    return publicKeyCache;
  }
  ensureKeyPair();
  publicKeyCache = fs.readFileSync(publicKeyPath, "utf8");
  return publicKeyCache;
}

function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, getPrivateKey(), {
    algorithm: "RS256",
    expiresIn: "1h",
    ...options,
  });
}

function verifyAccessToken(token, options = {}) {
  return jwt.verify(token, getPublicKey(), {
    algorithms: ["RS256"],
    ...options,
  });
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
