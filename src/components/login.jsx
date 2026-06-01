import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons';
import { apiRequest, decodeJwt } from '../utils/api';



function checkPasswordStrength(password) {
  if (!password) {
    return { percent: 0, color: 'var(--danger)', text: 'Digite sua nova senha' };
  }
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;

  if (score <= 1) {
    return { percent: 25, color: 'var(--danger)', text: 'Fraca 🔴' };
  } else if (score === 2) {
    return { percent: 50, color: '#f97316', text: 'Média 🟡' };
  } else if (score === 3) {
    return { percent: 75, color: '#84cc16', text: 'Forte 🟢' };
  } else {
    return { percent: 100, color: 'var(--green-deep)', text: 'Excelente! 🔥' };
  }
}

// 6-digit individual input manager
function OtpInput({ value, onChange, onComplete }) {
  const inputs = useRef([]);

  const handleInputChange = (index, val) => {
    const newVal = [...value];
    newVal[index] = val.slice(-1);
    onChange(newVal);

    if (val && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto trigger submission if complete
    const filled = newVal.filter(v => v !== '').length === 6;
    if (filled && onComplete) {
      onComplete(newVal.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const newVal = [...value];
      newVal[index - 1] = '';
      onChange(newVal);
      inputs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').trim();
    if (text.length === 6 && /^\d+$/.test(text)) {
      const newVal = text.split('');
      onChange(newVal);
      inputs.current[5]?.focus();
      if (onComplete) {
        onComplete(text);
      }
    }
  };

  return (
    <div className="otp-inputs">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => inputs.current[idx] = el}
          type="text"
          maxLength={1}
          value={value[idx] || ''}
          onChange={(e) => handleInputChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="otp-field"
          pattern="[0-9]"
          required
        />
      ))}
    </div>
  );
}

export function LoginScreen({ onLoginSuccess }) {
  const [currentPanel, setCurrentPanel] = useState('login'); // login, forgot, mfa
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password states (Simulated on frontend since backend does not implement email recovery)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotStep, setForgotStep] = useState(1); // 1 = send, 2 = reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // MFA states
  const [mfaOtp, setMfaOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);

  // MFA Countdown Timer (optimized to avoid teardown/setup of interval every second)
  useEffect(() => {
    if (currentPanel !== 'mfa') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsResendActive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [currentPanel]);

  // Helpers
  const navigateTo = (panel) => {
    setErrorMsg('');
    setCurrentPanel(panel);
    if (panel === 'mfa') {
      setTimeLeft(60);
      setIsResendActive(false);
      setMfaOtp(['', '', '', '', '', '']);
    }
    if (panel === 'forgot') {
      setForgotStep(1);
      setForgotEmail('');
      setForgotOtp(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
  };

  // Submit Login Form via API
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.includes('@') || password.length < 6) {
      setErrorMsg('Por favor, informe um e-mail válido e senha (mínimo 6 caracteres).');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha: password }),
      });

      if (response.mfaObrigatorio) {
        sessionStorage.setItem('temp_token', response.token);
        navigateTo('mfa');
      } else {
        localStorage.setItem('auth_token', response.token);
        handleSuccessFinished();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Credenciais inválidas ou acesso restrito.');
    } finally {
      setIsLoading(false);
    }
  };



  // Forgot Password step 1 (Simulado no frontend)
  const handleForgotSend = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!forgotEmail.includes('@')) {
      setErrorMsg('E-mail cadastrado inválido.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setForgotStep(2);
    }, 1200);
  };

  // Forgot Password step 2 (Simulado no frontend)
  const handleForgotReset = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const otpCode = forgotOtp.join('');
    if (otpCode.length < 6) {
      setErrorMsg('Por favor, insira o código de 6 dígitos completo.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('A nova senha deve possuir ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigateTo('login');
    }, 1200);
  };

  // Submit MFA Verification via API
  const handleMfaSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const token = mfaOtp.join('');
    if (token.length < 6) {
      setErrorMsg('Insira o token de segurança completo.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ codigo: token }),
      });

      localStorage.setItem('auth_token', response.token);
      sessionStorage.removeItem('temp_token');
      handleSuccessFinished();
    } catch (err) {
      setErrorMsg(err.message || 'Código MFA inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend MFA Token via API
  const handleResendCode = async (e) => {
    e.preventDefault();
    if (!isResendActive) return;
    
    setErrorMsg('');
    try {
      const response = await apiRequest('/auth/mfa/resend', {
        method: 'POST',
      });
      sessionStorage.setItem('temp_token', response.token);
      setMfaOtp(['', '', '', '', '', '']);
      setTimeLeft(60);
      setIsResendActive(false);
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao reenviar código.');
    }
  };

  const handleSuccessFinished = () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded) {
        const emailVal = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] || decoded.email || email;
        const nameVal = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.unique_name || decoded.name;
        const rolesClaim = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role || decoded.roles || [];
        const roles = Array.isArray(rolesClaim) ? rolesClaim : (rolesClaim ? [rolesClaim] : []);
        
        onLoginSuccess({
          name: nameVal,
          email: emailVal,
          avatar: nameVal ? nameVal.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'US',
          subtitle: roles.join(', ') || 'Central do Cliente',
          roles: roles
        });
        return;
      }
    }

    // Fallback
    const emailPrefix = email.split('@')[0] || 'usuario';
    let name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    let initials = emailPrefix.substring(0, 2).toUpperCase();

    onLoginSuccess({
      name: name,
      avatar: initials,
      subtitle: 'Central do Cliente',
      email: email
    });
  };

  // Calc password strength variables
  const strength = checkPasswordStrength(newPassword);

  return (
    <div className="auth">
      {/* ============ LEFT BRAND PANEL ============ */}
      <aside className="brand-panel">
        <div className="bp-logo">
          <div className="mark">
            CS
          </div>
          <div className="txt">
            <span>Contabilize Seguro</span>
            <span>Central do cliente</span>
          </div>
        </div>

        <div className="bp-hero">
          <span className="bp-eyebrow">
            <span className="dot"></span> Especializada em corretoras
          </span>
          <h1 id="heroTitle">Sua corretora<br /><em>em um só lugar.</em></h1>
          
          <p id="heroText">Acesse apólices, sinistros, clientes, documentos contábeis e o cofre de senhas das seguradoras — tudo num ambiente desenhado para corretores.</p>

          <ul className="bp-feats">
            <li>
              <span className="ic">
                <Icon name="check" size={13} stroke={2.4} />
              </span>
              <span><b>Contabilidade verticalizada</b> integrada — só para corretoras de seguros PJ.</span>
            </li>
          </ul>
        </div>

        <div className="bp-foot">
          <span>© 2026 Contabilize Seguro · CRC 1SP 045.281/O-2</span>
          <span className="badges">
            <span className="badge">
              <Icon name="shieldCheck" size={14} />
              SUSEP
            </span>
            <span className="badge">
              <Icon name="lock" size={14} />
              LGPD
            </span>
          </span>
        </div>
      </aside>

      {/* ============ RIGHT FORM PANEL ============ */}
      <section className="form-panel">
        <div className="form-wrap">
          {/* ============ PANEL 1: LOGIN ============ */}
          <div className={`panel ${currentPanel === 'login' ? 'active' : ''}`}>
            <div className="form-head">
              <h2>Bem-vindo de volta</h2>
              <p>Entre na central da sua corretora para continuar.</p>
            </div>

            <div className="divider">ou entre com e-mail</div>

            {/* Login Credentials Form */}
            <form className="form" onSubmit={handleLoginSubmit}>
              {errorMsg && (
                <div className="alert show">
                  <Icon name="alert" size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="field">
                <label htmlFor="email">E-mail corporativo</label>
                <div className="input-wrap">
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="voce@suacorretora.com.br"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    className="focus-brand"
                  />
                </div>

              </div>

              <div className="field">
                <label htmlFor="senha">
                  <span>Senha</span>
                  <a href="#" className="forgot" onClick={(e) => { e.preventDefault(); navigateTo('forgot'); }}>Esqueci minha senha</a>
                </label>
                <div className="input-wrap">
                  <input
                    id="senha"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="has-eye focus-brand"
                  />
                  <button
                    type="button"
                    className="reveal"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                </div>
              </div>

              <label className="check">
                <input type="checkbox" id="remember" defaultChecked />
                <span>Manter sessão neste dispositivo por 7 dias</span>
              </label>

              <button type="submit" className={`submit ${isLoading ? 'loading' : ''}`}>
                <span className="spinner"></span>
                <span className="label">Entrar na central</span>
                <span className="arrow"></span>
              </button>
            </form>

            <div className="form-foot">
              Acesso restrito a corretoras clientes. <br />
              <a href="#" onClick={e => e.preventDefault()}>Falar com nosso time comercial →</a>
            </div>
          </div>

          {/* ============ PANEL 2: FORGOT PASSWORD ============ */}
          <div className={`panel ${currentPanel === 'forgot' ? 'active' : ''}`}>
            <a href="#" className="back-to-login-link" onClick={(e) => { e.preventDefault(); navigateTo('login'); }}>
              <Icon name="chevLeft" size={16} />
              Voltar ao login
            </a>

            <div className="form-head">
              <h2>Recuperar acesso</h2>
              <p>
                {forgotStep === 1 
                  ? 'Informe seu e-mail cadastrado para enviarmos um código temporário de redefinição.'
                  : 'Insira o código de 6 dígitos que enviamos para o seu e-mail e defina a nova senha.'}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form className="form" onSubmit={handleForgotSend}>
                {errorMsg && (
                  <div className="alert show">
                    <Icon name="alert" size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="field">
                  <label htmlFor="forgotEmail">E-mail cadastrado</label>
                  <div className="input-wrap">
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      placeholder="voce@suacorretora.com.br"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="focus-brand"
                    />
                  </div>
                </div>

                <button type="submit" className={`submit ${isLoading ? 'loading' : ''}`}>
                  <span className="spinner"></span>
                  <span className="label">Enviar código de redefinição</span>
                  <span className="arrow"></span>
                </button>
              </form>
            ) : (
              <form className="form" onSubmit={handleForgotReset}>
                {errorMsg && (
                  <div className="alert show">
                    <Icon name="alert" size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="field">
                  <label>Código de 6 dígitos recebido</label>
                  <OtpInput value={forgotOtp} onChange={setForgotOtp} />
                </div>

                <div className="field" style={{ marginTop: '10px' }}>
                  <label htmlFor="newPassword">Nova senha</label>
                  <div className="input-wrap">
                    <input
                      id="newPassword"
                      type="password"
                      required
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="focus-brand"
                    />
                  </div>
                  
                  {/* Password Strength Meter */}
                  <div className="password-strength-container">
                    <div className="strength-bar-track">
                      <div 
                        className="strength-bar-fill" 
                        style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                      ></div>
                    </div>
                    <span className="strength-text">Força da senha: {strength.text}</span>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="confirmNewPassword">Confirme a nova senha</label>
                  <div className="input-wrap">
                    <input
                      id="confirmNewPassword"
                      type="password"
                      required
                      placeholder="Repita a nova senha"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      className="focus-brand"
                    />
                  </div>
                </div>

                <button type="submit" className={`submit ${isLoading ? 'loading' : ''}`}>
                  <span className="spinner"></span>
                  <span className="label">Redefinir senha</span>
                  <span className="arrow"></span>
                </button>
              </form>
            )}
          </div>

          {/* ============ PANEL 3: MFA (TWO-FACTOR) ============ */}
          <div className={`panel ${currentPanel === 'mfa' ? 'active' : ''}`}>
            <a href="#" className="back-to-login-link" onClick={(e) => { e.preventDefault(); navigateTo('login'); }}>
              <Icon name="chevLeft" size={16} />
              Voltar
            </a>

            <div className="form-head">
              <h2>Verificação de segurança</h2>
              <p>Um código de confirmação foi enviado para o seu dispositivo autenticador. Insira-o abaixo para continuar.</p>
            </div>

            <form className="form" onSubmit={handleMfaSubmit}>
              {errorMsg && (
                <div className="alert show">
                  <Icon name="alert" size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="otp-container">
                <OtpInput value={mfaOtp} onChange={setMfaOtp} onComplete={() => {
                  // Direct validation on last digit filled
                  handleMfaSubmit();
                }} />

                <div className="timer-wrap">
                  <span>
                    O código expira em:{' '}
                    <span className="timer">
                      00:{String(timeLeft).padStart(2, '0')}
                    </span>
                  </span>
                  <a 
                    href="#" 
                    onClick={handleResendCode} 
                    className={`resend-btn ${isResendActive ? 'active' : ''}`}
                  >
                    Reenviar código
                  </a>
                </div>
              </div>

              <button type="submit" className={`submit ${isLoading ? 'loading' : ''}`}>
                <span className="spinner"></span>
                <span className="label">Validar token de acesso</span>
                <span className="arrow"></span>
              </button>
            </form>
          </div>

        </div>

        <div className="legal">
          Ao entrar, você concorda com nossos <a href="#" onClick={e => e.preventDefault()}>Termos de Uso</a> e <a href="#" onClick={e => e.preventDefault()}>Política de Privacidade</a>.
        </div>
      </section>
    </div>
  );
}

