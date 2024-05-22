import React, { useEffect, useState } from 'react';
import { webAuthnRegister } from './api/webauthn/webAuthnRegister';
import { webAuthnAuthenticate } from './api/webauthn/webAuthnAuthenticate';
import { fetchSession, Session } from './api/fetchSession';

const Home = () => {
  const [session, setSession] = useState<Session | undefined>(undefined);
  const [username, setUsername] = useState('');
  const [controller, setController] = useState<AbortController | undefined>(
    undefined,
  );
  const [message, setMessage] = useState<string | undefined>(undefined);

  const supportWebAuthn = (): boolean => {
    //  navigator.credentials.create は navigator.credentials.get が存在するときは必ず存在するらしい
    return !!(navigator.credentials && navigator.credentials.get);
  };

  const supportConditionalMediation = (): boolean => {
    return !!(
      PublicKeyCredential.isConditionalMediationAvailable &&
      PublicKeyCredential.isConditionalMediationAvailable()
    );
  };

  const getNextWebAuthnApiSignal = (): AbortSignal => {
    if (controller !== undefined) {
      const error = new Error('既存の WebAuthn の API を終了させます');
      error.name = 'AbortError';
      controller.abort(error);
    }
    const newController = new AbortController();
    setController(newController);
    return newController.signal;
  };

  useEffect(() => {
    if (!session && supportConditionalMediation()) {
      login(true);
    }
  }, []);

  const register = async () => {
    const signal = getNextWebAuthnApiSignal();
    const result = await webAuthnRegister(username, signal);
    switch (result) {
      case 'already_registered': {
        setMessage(`username: ${username} は登録済みです。`);
        break;
      }
      case 'invalid_input': {
        setMessage('username を入力して下さい。');
        break;
      }
      case 'failed': {
        setMessage('登録に失敗しました。');
        break;
      }
      case 'success': {
        setMessage(`登録成功。username = ${username}`);
        break;
      }
      case 'fail_create_credential': {
        setMessage('クレデンシャルの作成に失敗しました。');
        break;
      }
    }
  };

  const login = async (isConditionalMediation: boolean) => {
    const signal = getNextWebAuthnApiSignal();
    const result = await webAuthnAuthenticate(isConditionalMediation, signal);
    switch (result) {
      case 'canceled': {
        break;
      }
      case 'failed_to_get_credential': {
        setMessage('この端末のクレデンシャルを取得できませんでした。');
        break;
      }
      case 'failure': {
        setMessage('ログイン失敗。');
        break;
      }
      case 'success': {
        const session = await fetchSession();
        setSession(session);
        break;
      }
    }
  };

  const form = () => (
    <>
      <input
        type="text"
        placeholder="username"
        autoComplete="username webauthn"
        onChange={(event) => setUsername(event.target.value)}
      />
      <button onClick={register}>Register</button>
      <button onClick={() => login(false)}>Login</button>
      {message && <div>{message}</div>}
    </>
  );

  const contents = (session: Session) => (
    <>
      <div className="card">Hello {session.username}!!</div>
    </>
  );

  return (
    <div className="Home">
      <h1>Sample WebAuthn Application</h1>
      {session ? (
        contents(session)
      ) : supportWebAuthn() ? (
        form()
      ) : (
        <>WebAuthn is not supported by this browser.</>
      )}
    </div>
  );
};

export default Home;
