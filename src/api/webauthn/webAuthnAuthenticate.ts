import {Buffer} from "buffer";
import {base64ToArrayBuffer} from "../../lib/base64ToArrayBuffer";

type AuthenticationResult = "invalid_input" | "user_not_found" | "failed_to_get_credential" | "success" | "failure"

export const webAuthnAuthenticate = async (username: string): Promise<AuthenticationResult> => {
  if (username === '') {
    return "invalid_input"
  }

  const preAuthenticationResponse = await fetch('http://localhost:8080/pre-authentication', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username
    })
  })
  if (preAuthenticationResponse.status === 400) {
    return "user_not_found"
  }

  const options = await preAuthenticationResponse.json()

  const encoder = new TextEncoder()
  options.challenge = encoder.encode(options.challenge)
  if (options.allowCredentials) {
    for (let cred of options.allowCredentials) {
      cred.id = base64ToArrayBuffer(cred.id)
    }
  }
  const credential = await navigator.credentials.get({publicKey: options})
    .then((cred) => {
      return cred as PublicKeyCredential
    })
    .catch((err) => {
      console.log('ERROR', err)
    })
  if (credential == null) {
    return "failed_to_get_credential"
  }

  const authenticatorAssertionResponse = credential.response as AuthenticatorAssertionResponse

  const authenticationResponse = await fetch('http://localhost:8080/authentication', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: Buffer.from(credential.rawId).toString('base64'), // TODO: id は rawId を base64url encode したもの
      rawId: Buffer.from(credential.rawId).toString('base64'),
      response: {
        authenticatorData: Buffer.from(authenticatorAssertionResponse.authenticatorData).toString('base64'),
        signature: Buffer.from(authenticatorAssertionResponse.signature).toString('base64'),
        userHandle: Buffer.from(authenticatorAssertionResponse.userHandle!!).toString('base64'),
        clientDataJSON: Buffer.from(authenticatorAssertionResponse.clientDataJSON).toString('base64'),
      }
    })
  })

  if (!authenticationResponse.ok) {
    return "failure"
  }

  return "success"
}
