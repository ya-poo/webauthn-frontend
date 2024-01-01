import {arrayBufferToBase64} from "../../lib/arrayBufferToBase64";
import {utf8StringToArrayBuffer} from "../../lib/utf8StringToArrayBuffer";

type RegistrationResult = "invalid_input" | "already_registered" | "success" | "failed"

export const webAuthnRegister = async (username: string): Promise<RegistrationResult> => {
  if (username === '') {
    return "invalid_input"
  }
  const preregistrationResponse = await fetch('http://localhost:8080/preregistration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username
    })
  })
  if (preregistrationResponse.status === 400) {
    return "already_registered"
  }
  const options = await preregistrationResponse.json()
  options.publicKey.user.id = utf8StringToArrayBuffer(options.publicKey.user.id)
  options.publicKey.challenge = utf8StringToArrayBuffer(options.publicKey.challenge)
  if (options.publicKey.excludeCredentials) {
    for (let cred of options.publicKey.excludeCredentials) {
      cred.id = utf8StringToArrayBuffer(cred.id);
    }
  }

  console.log(`PublicKeyCredentialCreationOption:\n${JSON.stringify(options, null, "\t")}`)

  const credential = await navigator.credentials.create(options)
    .catch((err) => {
      console.log("ERROR", err)
    }) as PublicKeyCredential

  const authenticatorAttestationResponse = credential.response as AuthenticatorAttestationResponse

  const registrationResponse = await fetch('http://localhost:8080/registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientDataJSON: arrayBufferToBase64(authenticatorAttestationResponse.clientDataJSON),
      attestationObject: arrayBufferToBase64(authenticatorAttestationResponse.attestationObject),
    })
  })

  if (!registrationResponse.ok) {
    return "failed"
  }

  return "success"
}
