# Luís Artz — Portfólio Social Media + Design + Web

Projeto em React + Vite + Firebase.

## Recursos
- Home profissional em azul escuro e azul claro
- Seção "Quem sou"
- Serviços e valores
- Portfólio
- Pré-orçamento com seleção de serviços e cálculo automático
- Envio do orçamento para WhatsApp
- Registro dos orçamentos no Firestore
- Área administrativa com login Firebase
- Edição de textos, contatos, serviços, preços e portfólio
- Visualização e exclusão dos orçamentos recebidos
- Responsivo para celular e computador

## Configuração
1. Crie um projeto no Firebase.
2. Ative Authentication > Email/Password.
3. Crie um usuário administrador.
4. Ative Firestore Database.
5. Copie `firestore.rules` para as regras do Firestore e publique.
6. Copie `.env.example` para `.env` e preencha com as credenciais do seu app web Firebase.
7. Altere o WhatsApp, Instagram e e-mail no painel ou no `DEFAULT_SITE`.

## Rodar localmente
```bash
npm install
npm run dev
```

## Deploy no Vercel
- Suba esta pasta para um repositório GitHub.
- Importe o repositório no Vercel.
- Cadastre as mesmas variáveis `VITE_FIREBASE_*` em Settings > Environment Variables.
- Faça o deploy.

## Observação importante
O pré-orçamento é apenas estimativo. Você pode editar os valores dos serviços pela área administrativa depois de o Firebase estar configurado.
