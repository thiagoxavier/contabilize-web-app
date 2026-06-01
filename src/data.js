// Seguradoras brasileiras — seed data
// Color hint per insurer; we generate avatars from the first 2 chars + a brand-tinted bg.

export const SEGURADORAS = [
  { id: "s01", nome: "Porto Seguro", url: "portosseguro.com.br", color: "#0066B3", categoria: "Multi-ramos", login: "corretor.silva@nexa", senha: "Pr$5K9!mNqW2", criadaEm: "2024-08-12", atualizadaEm: "2025-12-03", forca: 4, mfa: true, obs: "Login pelo portal corretor — usa código de habilitação SUSEP" },
  { id: "s02", nome: "SulAmérica", url: "sulamericaseguros.com.br", color: "#F77F00", categoria: "Saúde", login: "32145.silva", senha: "SulAm@2025#x", criadaEm: "2024-02-22", atualizadaEm: "2026-03-14", forca: 3, mfa: true, obs: "" },
  { id: "s03", nome: "Bradesco Seguros", url: "bradescoseguros.com.br", color: "#CC092F", categoria: "Multi-ramos", login: "corretor28145", senha: "B2!ds#kP9xLm", criadaEm: "2023-11-09", atualizadaEm: "2026-01-22", forca: 4, mfa: true, obs: "MFA via SMS no celular do corretor" },
  { id: "s04", nome: "Itaú Seguros", url: "itau.com.br/seguros", color: "#EC7000", categoria: "Vida", login: "agencia0451-corr", senha: "1tA!seguros2025", criadaEm: "2024-05-04", atualizadaEm: "2025-09-08", forca: 4, mfa: false, obs: "" },
  { id: "s05", nome: "Allianz", url: "allianz.com.br", color: "#003781", categoria: "Auto", login: "BR-SP-1245", senha: "Allianz!9$wQ", criadaEm: "2024-01-15", atualizadaEm: "2026-02-19", forca: 3, mfa: true, obs: "" },
  { id: "s06", nome: "Mapfre", url: "mapfre.com.br", color: "#D2232A", categoria: "Multi-ramos", login: "M-BR-21458", senha: "MapFre$2026!", criadaEm: "2023-06-30", atualizadaEm: "2025-11-11", forca: 3, mfa: false, obs: "" },
  { id: "s07", nome: "HDI Seguros", url: "hdiseguros.com.br", color: "#00945E", categoria: "Auto", login: "corretor.31298", senha: "Hd1@auto2025", criadaEm: "2024-09-21", atualizadaEm: "2026-04-02", forca: 3, mfa: true, obs: "" },
  { id: "s08", nome: "Liberty Seguros", url: "libertyseguros.com.br", color: "#FFD200", categoria: "Auto", login: "LBR.4521.silva", senha: "Liberty#aBc9", criadaEm: "2023-03-18", atualizadaEm: "2024-07-30", forca: 2, mfa: false, obs: "Atenção: senha antiga, considerar troca" },
  { id: "s09", nome: "Tokio Marine", url: "tokiomarine.com.br", color: "#003366", categoria: "Auto", login: "32781-TM", senha: "Tokio@Sg2026!K", criadaEm: "2024-11-04", atualizadaEm: "2026-03-28", forca: 4, mfa: true, obs: "" },
  { id: "s10", nome: "Zurich Seguros", url: "zurich.com.br", color: "#2167AE", categoria: "Vida", login: "BR21-corr-145", senha: "Zur1ch!2025xS", criadaEm: "2024-04-09", atualizadaEm: "2026-01-09", forca: 4, mfa: true, obs: "" },
  { id: "s11", nome: "Azul Seguros", url: "azulseguros.com.br", color: "#0080C9", categoria: "Auto", login: "azul.32145", senha: "azul123", criadaEm: "2022-08-15", atualizadaEm: "2023-02-10", forca: 1, mfa: false, obs: "Senha fraca — trocar urgente" },
  { id: "s12", nome: "Generali", url: "generali.com.br", color: "#C8102E", categoria: "Vida", login: "GEN-21458-BR", senha: "Gen3rali$2025#", criadaEm: "2024-07-22", atualizadaEm: "2026-02-05", forca: 4, mfa: true, obs: "" },
  { id: "s13", nome: "Sompo Seguros", url: "sompo.com.br", color: "#B6171B", categoria: "Multi-ramos", login: "Sompo-145-Silva", senha: "S0mp0@seg2025!", criadaEm: "2024-06-10", atualizadaEm: "2025-11-22", forca: 3, mfa: true, obs: "" },
  { id: "s14", nome: "Suhai Seguradora", url: "suhaiseguradora.com", color: "#F37021", categoria: "Auto", login: "suh-21458", senha: "Suhai@9xKp", criadaEm: "2024-10-01", atualizadaEm: "2026-03-30", forca: 3, mfa: false, obs: "" },
  { id: "s15", nome: "Mongeral Aegon", url: "mongeralaegon.com.br", color: "#1B3A6F", categoria: "Vida", login: "mongeral.silva", senha: "M0ng3ral!2025", criadaEm: "2024-03-14", atualizadaEm: "2026-01-15", forca: 4, mfa: true, obs: "" },
  { id: "s16", nome: "MetLife", url: "metlife.com.br", color: "#0090DA", categoria: "Vida", login: "BRM-145-SP", senha: "MetLife@2025Sp!", criadaEm: "2024-05-19", atualizadaEm: "2026-02-12", forca: 4, mfa: true, obs: "" },
  { id: "s17", nome: "Icatu Seguros", url: "icatuseguros.com.br", color: "#005EB8", categoria: "Vida", login: "icatu-corretor-321", senha: "ICatu#prev2025", criadaEm: "2023-12-08", atualizadaEm: "2025-08-14", forca: 3, mfa: false, obs: "" },
  { id: "s18", nome: "Caixa Seguradora", url: "caixaseguradora.com.br", color: "#005CA9", categoria: "Multi-ramos", login: "cx-21458", senha: "C@ix@seg2025", criadaEm: "2024-02-04", atualizadaEm: "2026-01-30", forca: 3, mfa: true, obs: "" },
  { id: "s19", nome: "Chubb", url: "chubb.com/br", color: "#1A1A1A", categoria: "Patrimonial", login: "chubb-BR-SP", senha: "Chubb!premium25", criadaEm: "2024-08-25", atualizadaEm: "2026-04-10", forca: 4, mfa: true, obs: "" },
  { id: "s20", nome: "Prudential", url: "prudential.com.br", color: "#0F4B81", categoria: "Vida", login: "pru-21458-silva", senha: "Prudential@25!", criadaEm: "2024-11-12", atualizadaEm: "2026-02-28", forca: 3, mfa: true, obs: "" },
  { id: "s21", nome: "BB Seguros", url: "bbseguros.com.br", color: "#FFCC29", categoria: "Multi-ramos", login: "BBcorr-32145", senha: "BBseg2025!@#", criadaEm: "2023-09-30", atualizadaEm: "2025-12-18", forca: 3, mfa: true, obs: "" },
  { id: "s22", nome: "Pan Seguros", url: "panseguros.com.br", color: "#003C71", categoria: "Auto", login: "pan-145-silva", senha: "Pan!2026sQ", criadaEm: "2024-07-08", atualizadaEm: "2026-03-22", forca: 3, mfa: false, obs: "" },
  { id: "s23", nome: "Yelum Seguradora", url: "yelumseguradora.com.br", color: "#7B2D8E", categoria: "Auto", login: "yelum-corretor-321", senha: "Yelum2025!xKp", criadaEm: "2024-12-01", atualizadaEm: "2026-04-15", forca: 4, mfa: true, obs: "Antiga Liberty Seguros — login migrado" },
  { id: "s24", nome: "Ezze Seguros", url: "ezzeseguros.com.br", color: "#FF6900", categoria: "Multi-ramos", login: "ezze-145-SP", senha: "Ezze@2025#nM", criadaEm: "2025-01-14", atualizadaEm: "2026-03-05", forca: 4, mfa: true, obs: "" },
  { id: "s25", nome: "Mitsui Sumitomo", url: "mitsui.com.br", color: "#0033A0", categoria: "Patrimonial", login: "MS-BR-21458", senha: "M1tsui@2025", criadaEm: "2024-06-25", atualizadaEm: "2025-10-08", forca: 3, mfa: true, obs: "" },
  { id: "s26", nome: "Too Seguros", url: "tooseguros.com.br", color: "#E20613", categoria: "Auto", login: "too-321-corr", senha: "TooAuto2025!", criadaEm: "2025-02-08", atualizadaEm: "2026-04-01", forca: 3, mfa: false, obs: "" },
  { id: "s27", nome: "Capemisa", url: "capemisa.com.br", color: "#004A8F", categoria: "Vida", login: "cap-145-silva", senha: "Capemisa@25", criadaEm: "2023-10-15", atualizadaEm: "2024-12-12", forca: 2, mfa: false, obs: "Trocar — última atualização há mais de 1 ano" },
  { id: "s28", nome: "Excelsior Seguros", url: "excelsiorseguros.com.br", color: "#5B2E91", categoria: "Patrimonial", login: "exc-21458-corr", senha: "Excels!or2025#", criadaEm: "2024-09-09", atualizadaEm: "2026-02-22", forca: 4, mfa: true, obs: "" },
];

export const CATEGORIAS = [
  { id: "todas", label: "Todas", color: "var(--ink-900)" },
  { id: "Auto", label: "Auto", color: "#0066B3" },
  { id: "Vida", label: "Vida", color: "#13A170" },
  { id: "Saúde", label: "Saúde", color: "#9B742D" },
  { id: "Multi-ramos", label: "Multi-ramos", color: "#5B2E91" },
  { id: "Patrimonial", label: "Patrimonial", color: "#C2453A" },
];
