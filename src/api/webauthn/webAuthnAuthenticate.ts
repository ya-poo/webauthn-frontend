import {base64ToArrayBuffer} from "../../lib/base64ToArrayBuffer";
import {arrayBufferToBase64} from "../../lib/arrayBufferToBase64";
import {utf8StringToArrayBuffer} from "../../lib/utf8StringToArrayBuffer";

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

  options.challenge = utf8StringToArrayBuffer(options.challenge)
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
      id: arrayBufferToBase64(credential.rawId), // TODO: id は rawId を base64url encode したもの
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        authenticatorData: arrayBufferToBase64(authenticatorAssertionResponse.authenticatorData),
        signature: arrayBufferToBase64(authenticatorAssertionResponse.signature),
        userHandle: arrayBufferToBase64(authenticatorAssertionResponse.userHandle!!),
        clientDataJSON: arrayBufferToBase64(authenticatorAssertionResponse.clientDataJSON),
      }
    })
  })

  if (!authenticationResponse.ok) {
    return "failure"
  }

  return "success"
}
