export function EnvironmentBanner() {
  const envVal = (window.__ENV__?.VITE_ENV || import.meta.env.VITE_ENV || import.meta.env.VITE_AMBIENTE || '').toLowerCase();
  const isTestFlag = window.__ENV__?.VITE_IS_TEST ?? import.meta.env.VITE_IS_TEST;
  const isTest = 
    isTestFlag === 'true' ||
    isTestFlag === '1' ||
    ['homologacao', 'homolog', 'teste', 'staging', 'test'].includes(envVal);

  if (!isTest) return null;

  return (
    <div className="env-homolog-banner">
      <span className="env-homolog-banner-badge">HOMOLOGAÇÃO</span>
      <span>⚠️ Você está utilizando o <strong>Ambiente de Homologação</strong></span>
    </div>
  );
}
