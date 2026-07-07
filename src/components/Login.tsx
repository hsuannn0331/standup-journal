import { FormEvent, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || '登入失敗,請再試一次');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message?.replace('Firebase: ', '') || '登入失敗,請再試一次');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>站會筆記</h1>
        <p className="sub">Daily Standup Journal</p>

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="primary-btn" disabled={busy}>
            {mode === 'login' ? '登入' : '註冊帳號'}
          </button>
        </form>

        <button className="google-btn" onClick={google} disabled={busy}>
          使用 Google 帳號登入
        </button>

        <button
          className="switch-mode-btn"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? '還沒有帳號？註冊一個' : '已經有帳號了？登入'}
        </button>
      </div>
    </div>
  );
}
