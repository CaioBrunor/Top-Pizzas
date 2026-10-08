export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const REGEX_NOME = /^\p{L}[\p{L}\p{M}\s.'-]*$/u;

export const SENHA_MINIMO = 8;
export const SENHA_MAXIMO = 72;

const SENHAS_COMUNS = new Set([
  "senha123",
  "senha1234",
  "abc12345",
  "a1234567",
  "1234567a",
  "123456ab",
  "qwerty123",
  "password1",
  "admin123",
  "pizza123",
]);

export const soDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

export function erroDeNome(nome) {
  const limpo = String(nome ?? "").trim();
  if (limpo.length < 3) return "Escreva seu nome completo.";
  if (limpo.length > 80) return "O nome pode ter até 80 caracteres.";
  if (!REGEX_NOME.test(limpo)) return "Use apenas letras no nome.";
  return null;
}

export function erroDeEmail(email) {
  const limpo = String(email ?? "").trim();
  if (!limpo) return "Informe o e-mail.";
  if (limpo.length > 254 || !REGEX_EMAIL.test(limpo)) return "Confira o e-mail.";
  return null;
}

export function erroDeTelefone(telefone) {
  const digitos = soDigitos(telefone);
  if (digitos.length < 10 || digitos.length > 11) return "Telefone incompleto.";
  return null;
}

export function erroDeSenha(senha) {
  const valor = String(senha ?? "");
  if (valor.length < SENHA_MINIMO) {
    return `A senha precisa de pelo menos ${SENHA_MINIMO} caracteres.`;
  }
  if (valor.length > SENHA_MAXIMO) {
    return `A senha pode ter até ${SENHA_MAXIMO} caracteres.`;
  }
  if (!/\p{L}/u.test(valor) || !/\d/.test(valor)) {
    return "Misture letras e números na senha.";
  }
  if (SENHAS_COMUNS.has(valor.toLowerCase())) {
    return "Essa senha é muito comum. Escolha outra.";
  }
  return null;
}

// (83) 99999-0000 para celular, (83) 3333-0110 para fixo.
export function formatarTelefone(telefone) {
  const d = soDigitos(telefone);
  const corte = d.length === 11 ? 7 : 6;
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`;
}

export function formatarCep(cep) {
  const d = soDigitos(cep);
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
