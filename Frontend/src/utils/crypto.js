/**
 * Utility functions for End-to-End Encryption (E2EE) using Web Crypto API.
 */

// Helper: Convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer) => {
  const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
  return window.btoa(binary);
};

// Helper: Convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// 1. Generate a new RSA-OAEP key pair
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  // Export public key as SPKI (SubjectPublicKeyInfo) format
  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const publicKeyStr = arrayBufferToBase64(publicKeyBuffer);

  // Export private key as PKCS#8 format (usually you'd encrypt this before storage)
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );
  const privateKeyStr = arrayBufferToBase64(privateKeyBuffer);

  return { publicKey: publicKeyStr, privateKey: privateKeyStr };
};

// 2. Encrypt a message with a public key string
export const encryptMessage = async (message, publicKeyStr) => {
  try {
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyStr);
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      data
    );

    return arrayBufferToBase64(encryptedData);
  } catch (error) {
    console.error("Encryption error:", error);
    return message; // Fallback if encryption fails
  }
};

// 3. Decrypt a message with a private key string
export const decryptMessage = async (encryptedMessage, privateKeyStr) => {
  try {
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyStr);
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["decrypt"]
    );

    const encryptedData = base64ToArrayBuffer(encryptedMessage);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.warn("Decryption error (possibly not an encrypted message):", error);
    return encryptedMessage; // Return original if decryption fails (e.g., legacy message)
  }
};
