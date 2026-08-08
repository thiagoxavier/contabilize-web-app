export function EnvironmentBanner() {
  const envVal = (import.meta.env.VITE_ENV || import.meta.env.VITE_AMBIENTE || '').toLowerCase();
  const isTest = 
    import.meta.env.VITE_IS_TEST === 'true' ||
    import.meta.env.VITE_IS_TEST === '1' ||
    ['homologacao', 'homolog', 'teste', 'staging', 'test'].includes(envVal);

  if (!isTest) return null;

  return (
    <div className="env-homolog-banner">
      <span className="env-homolog-banner-badge">HOMOLOGAÇÃO</span>
      <span>⚠️ Você está utilizando o <strong>Ambiente de Homologação</strong></span>
    </div>
  );
}
