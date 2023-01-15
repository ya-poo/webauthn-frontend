import React, {useState} from 'react'
import './Home.css'
import {webAuthnRegister} from "./api/webauthn/webAuthnRegister";
import {webAuthnAuthenticate} from "./api/webauthn/webAuthnAuthenticate";
import {fetchSession, Session} from "./api/fetchSession";

const Home = () => {
  const [session, setSession] = useState<Session | undefined>(undefined)
  const [username, setUsername] = useState('')

  const onRegister = async () => {
    const result = await webAuthnRegister(username)
    switch (result) {
      case "already_registered": {
        alert(`username: ${username} は登録済みです。`)
        break
      }
      case "invalid_input": {
        alert('username を入力して下さい。')
        break
      }
      case "success": {
        alert(`登録成功。username = ${username}`)
        break;
      }
    }
  }

  const onLogin = async () => {
    const result = await webAuthnAuthenticate(username)
    switch (result) {
      case "invalid_input": {
        alert('username を入力して下さい。')
        break
      }
      case "user_not_found": {
        alert(`username: ${username} は存在しません。`)
        break
      }
      case "failed_to_get_credential": {
        alert('この端末のクレデンシャルを取得できませんでした。')
        break
      }
      case "failure": {
        alert('ログイン失敗。')
        break
      }
      case "success": {
        alert('ログイン成功。')
        const session = await fetchSession()
        setSession(session)
        break
      }
    }
  }

  const form = () => (
    <>
      <input type="text" placeholder="username" onChange={(event) => setUsername(event.target.value)}/>
      <button onClick={onRegister}>Register</button>
      <button onClick={onLogin}>Login</button>
    </>
  )

  const contents = () => (
    <>
      <div className="card">
        Hollow {session?.username}!!
      </div>
    </>
  )

  return (
    <div className="Home">
      <h1>WebAuthn Sample Application</h1>
      {
        session
          ? contents()
          : form()
      }
    </div>
  )
}

export default Home
