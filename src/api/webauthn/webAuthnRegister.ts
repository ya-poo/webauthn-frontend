import {Buffer} from "buffer";

type RegistrationResult = "invalid_input" | "already_registered" | "success"

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

  const encoder = new TextEncoder()
  options.user.id = encoder.encode(options.user.id)
  options.challenge = encoder.encode(options.challenge)
  if (options.excludeCredentials) {
    for (let cred of options.excludeCredentials) {
      cred.id = encoder.encode(cred.id);
    }
  }
  const credential = await navigator.credentials.create({publicKey: options})
    .catch((err) => {
      console.log("ERROR", err)
    })
  const authenticatorAttestationResponse = (credential as PublicKeyCredential).response as AuthenticatorAttestationResponse

  await fetch('http://localhost:8080/registration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      clientDataJSON: Buffer.from(authenticatorAttestationResponse.clientDataJSON).toString('base64'),
      attestationObject: Buffer.from(authenticatorAttestationResponse.attestationObject).toString('base64'),
    })
  })

  return "success"
}
