import React, {useEffect, useState} from 'react'
import {webAuthnRegister} from "./api/webauthn/webAuthnRegister";
import {webAuthnAuthenticate} from "./api/webauthn/webAuthnAuthenticate";
import {fetchSession, Session} from "./api/fetchSession";

const Home = () => {
  const [session, setSession] = useState<Session | undefined>(undefined)
  const [username, setUsername] = useState('')

  const supportWebAuthn = (): boolean => {
    //  navigator.credentials.create は navigator.credentials.get が存在するときは必ず存在するらしい
    return !!(navigator.credentials && navigator.credentials.get)
  }

  const supportConditionalMediation = (): boolean => {
    return !!(PublicKeyCredential.isConditionalMediationAvailable && PublicKeyCredential.isConditionalMediationAvailable())
  }

  useEffect(() => {
    if (!session && supportConditionalMediation()) {
      login(true);
    }
  }, [])

  const onRegister = async () => {
    const result = await webAuthnRegister(username)
    switch (result) {
      case "already_registered": {
        console.log(`username: ${username} は登録済みです。`)
        break
      }
      case "invalid_input": {
        console.log('username を入力して下さい。')
        break
      }
      case "failed": {
        console.log('登録に失敗しました。')
        break;
      }
      case "success": {
        console.log(`登録成功。username = ${username}`)
        break;
      }
      case "fail_create_credential": {
        console.log('クレデンシャルの作成に失敗しました。')
        break;
      }
    }
  }

  const login = async (
    isConditionalMediation: boolean
  ) => {
    const result = await webAuthnAuthenticate(isConditionalMediation)
    switch (result) {
      case "failed_to_get_credential": {
        console.log('この端末のクレデンシャルを取得できませんでした。')
        break
      }
      case "failure": {
        console.log('ログイン失敗。')
        break
      }
      case "success": {
        const session = await fetchSession()
        setSession(session)
        break
      }
    }
  }

  const form = () => (
    <>
      <input
        type="text"
        placeholder="username"
        autoComplete="username webauthn"
        onChange={(event) => setUsername(event.target.value)}
      />
      <button onClick={onRegister}>Register</button>
      <button onClick={() => login(false)}>Login</button>
    </>
  )

  const contents = (session: Session) => (
    <>
      <div className="card">
        Hello {session.username}!!
      </div>
    </>
  )

  return (
    <div className="Home">
      <h1>Sample WebAuthn Application</h1>
      {
        session ? contents(session) :
          supportWebAuthn() ? form()
            : <>WebAuthn is not supported by this browser.</>
      }
    </div>
  )
}

export default Home
