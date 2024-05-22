import { base64ToArrayBuffer } from '../../lib/base64ToArrayBuffer';
import { arrayBufferToBase64 } from '../../lib/arrayBufferToBase64';
import { utf8StringToArrayBuffer } from '../../lib/utf8StringToArrayBuffer';

type AuthenticationResult =
  | 'failed_to_get_credential'
  | 'success'
  | 'failure'
  | 'canceled';

export const webAuthnAuthenticate = async (
  isConditionalMediation: boolean,
  signal: AbortSignal,
): Promise<AuthenticationResult> => {
  const preAuthenticationResponse = await fetch(
    'http://localhost:8080/webauthn/credential_request_options',
    {
      method: 'GET',
    },
  );

  const options = await preAuthenticationResponse.json();
  options.publicKey.challenge = utf8StringToArrayBuffer(
    options.publicKey.challenge,
  );
  if (options.publicKey.allowCredentials) {
    for (let cred of options.publicKey.allowCredentials) {
      cred.id = base64ToArrayBuffer(cred.id);
    }
  }
  if (isConditionalMediation) {
    options.mediation = 'conditional';
  }
  options.signal = signal;

  console.log(
    `PublicKeyCredentialRequestOption:\n${JSON.stringify(options, null, '\t')}`,
  );

  const credential = await navigator.credentials
    .get(options)
    .then((cred) => {
      return cred as PublicKeyCredential;
    })
    .catch((err) => {
      if (err.name === 'AbortError') {
        return undefined;
      }
      return JSON.stringify(err);
    });
  if (typeof credential === 'string') {
    console.error(credential);
    return 'failure';
  }
  if (credential == undefined) {
    return 'canceled';
  }
  const authenticatorAssertionResponse =
    credential.response as AuthenticatorAssertionResponse;

  const authenticationResponse = await fetch(
    'http://localhost:8080/webauthn/authentication',
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: arrayBufferToBase64(credential.rawId),
        rawId: arrayBufferToBase64(credential.rawId),
        response: {
          authenticatorData: arrayBufferToBase64(
            authenticatorAssertionResponse.authenticatorData,
          ),
          signature: arrayBufferToBase64(
            authenticatorAssertionResponse.signature,
          ),
          userHandle: arrayBufferToBase64(
            authenticatorAssertionResponse.userHandle!!,
          ),
          clientDataJSON: arrayBufferToBase64(
            authenticatorAssertionResponse.clientDataJSON,
          ),
        },
      }),
    },
  );

  if (!authenticationResponse.ok) {
    return 'failure';
  }

  return 'success';
};
