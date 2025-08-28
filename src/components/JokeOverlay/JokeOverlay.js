import React from "react";
import styled from "styled-components";
import forge from "node-forge";
const Overlay = styled.div`
  position: fixed;
  top: 5%;
  right: 5%;
  z-index: 1000;
  background-color: var(--slate-400);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--slate-500);
  font-family: monospace;
`;

function isAscii(str) {
  return /^[\x20-\x7F]*$/.test(str);
}

function startsWithTh(str) {
  return str.startsWith("Th");
}

function lengthAtLeast3(str) {
  return str.length >= 3;
}

const encryptedBase64 =
  "U2FsdGVkX19zQCWo/QFwcwv/xn/qeyn6aLGizL9qReGGHNf7J+4+oQOmdnNnY2BmomnJytdKLnuSfLBzNf1Op7mSBSVyNr6ZWiaXnueFojM=";
const encryptedData = forge.util.decode64(encryptedBase64);

export function useSeedDecryptor() {
  const [status, setStatus] = React.useState("idle");
  const [decryptedText, setDecryptedText] = React.useState(null);

  const trySeed = React.useCallback((seed) => {
    setStatus("decrypting");

    try {
      // Convert seed to string for decryption key
      const seedStr = seed ? seed.toString() : "0";

      // Check for "Salted__" prefix
      if (encryptedData.substring(0, 8) !== "Salted__") {
        throw new Error("Not a valid OpenSSL encrypted file");
      }

      // Extract salt (next 8 bytes)
      const salt = encryptedData.substring(8, 16);

      // Derive key and IV (using SHA-256 by default)
      const keySize = 32; // 256 bits
      const ivSize = 16; // 128 bits
      const derivedBytes = forge.pbe.opensslDeriveBytes(
        seedStr,
        salt,
        keySize + ivSize,
        forge.md.sha256.create()
      );

      const key = derivedBytes.substring(0, keySize);
      const iv = derivedBytes.substring(keySize);

      // Create decipher
      const decipher = forge.cipher.createDecipher("AES-CBC", key);
      decipher.start({ iv: iv });
      decipher.update(forge.util.createBuffer(encryptedData.substring(16)));
      decipher.finish();

      const decrypted = decipher.output.toString();

      // Check if decryption makes sense
      if (
        isAscii(decrypted) &&
        startsWithTh(decrypted) &&
        lengthAtLeast3(decrypted)
      ) {
        setDecryptedText(decrypted);
        setStatus("success");
      } else {
        setStatus("failed");
      }
    } catch (error) {
      setStatus("failed");
    }
  }, []);

  return { status, decryptedText, trySeed };
}

function JokeOverlay({ firstSeed }) {
  const { status, decryptedText, trySeed } = useSeedDecryptor();

  React.useEffect(() => {
    if (firstSeed !== null) {
      trySeed(firstSeed);
    }
  }, [firstSeed, trySeed]);

  if (status !== "success" || !decryptedText) {
    return null;
  }

  return <Overlay>{decryptedText}</Overlay>;
}

export default JokeOverlay;
