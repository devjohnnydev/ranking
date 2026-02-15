# EduGame - Plataforma de Educação Gamificada

EduGame é uma plataforma educacional inovadora que utiliza elementos de gamificação para engajar alunos, facilitar a gestão de turmas para professores e oferecer controle total para administradores.

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19**: Biblioteca principal para construção da interface.
- **Vite**: Build tool ultrarrápida para desenvolvimento moderno.
- **Lucide React**: Biblioteca de ícones elegantes e consistentes.
- **Framer Motion**: Biblioteca para animações fluidas e interações avançadas.
- **CSS3**: Estilização customizada com foco em UX/UI moderno (Dark Mode).

### Backend
- **Node.js**: Ambiente de execução para o servidor.
- **Express.js**: Framework web para criação da API REST.
- **Prisma ORM**: Gerenciamento de banco de dados com tipagem forte e migrações seguras.
- **Dotenv**: Gestão de variáveis de ambiente.
- **Cors**: Configuração de segurança para requisições cross-origin.

### Banco de Dados
- **PostgreSQL**: Banco de dados relacional robusto para armazenamento de dados críticos.

---

## 🛠️ Funcionalidades Detalhadas

### 1. Sistema de Autenticação e Perfis
- **Multi-perfis**: Suporte para Administrador, Professor e Aluno.
- **Login Seguro**: Autenticação baseada em credenciais.
- **Gestão de Perfil**: Usuários podem atualizar fotos, bio, frases inspiradoras e senhas.
- **Registro de Alunos**: Alunos podem se cadastrar diretamente usando um código de turma.

### 2. Painel do Administrador (Johnny Oliveira)
- **Visão Global**: Acesso a todos os dados do sistema (usuários, turmas, atividades, notas).
- **Gestão de Professores**: Criação e visualização de contas de professores.
- **Monitoramento**: Acompanhamento de todas as turmas e rankings de forma centralizada.

### 3. Painel do Professor
- **Gestão de Turmas**: Criação de turmas com geração automática de códigos de entrada.
- **Aprovação de Matrículas**: Controle de quais alunos podem entrar na turma.
- **Criação de Missões e Atividades**: Definição de tarefas com pontuações máximas e prazos.
- **Lançamento de Notas**: Sistema de correção que gera XP automaticamente para os alunos.
- **Comunicação**: Envio de mensagens automáticas sobre notas e avisos.

### 4. Experiência do Aluno
- **Gamificação (XP & Níveis)**: Ganho de experiência baseado em notas, com sistema de níveis calculado automaticamente.
- **Mural de Turmas**: Visualização de todas as turmas em que está matriculado e busca de novas turmas via código.
- **Mural de Missões**: Lista de atividades pendentes com recompensas em XP.
- **Ranking da Turma**: Competição saudável entre colegas da mesma sala.
- **Sistema de Mensagens**: Recebimento de feedbacks e avisos.

### 5. Rankings e Engajamento
- **Ranking Global**: Visualização dos melhores alunos de toda a plataforma (acessível por admins).
- **Ranking por Turma**: Filtro para ver quem são os líderes de cada disciplina.
- **Progressão Visual**: Barras de nível e cards detalhados para incentivar o progresso.

---

## 📂 Estrutura do Projeto

```text
├── src/                # Código fonte do frontend (React)
│   ├── assets/         # Imagens e recursos estáticos
│   ├── components/     # Componentes reutilizáveis da UI
│   └── ...             # Páginas e lógica do cliente
├── server/             # Código fonte do backend (Express)
│   ├── prisma/         # Schema e migrações do banco de dados
│   └── index.js        # Servidor principal e rotas da API
├── public/             # Arquivos estáticos servidos pelo Vite
├── package.json        # Dependências e scripts do projeto
└── vite.config.js      # Configurações do Vite e Proxy da API
```

---

## 🏁 Como Iniciar

1. Instale as dependências: `npm install` e `cd server && npm install`
2. Configure o banco de dados via Prisma: `npx prisma db push`
3. Inicie o ambiente de desenvolvimento: `npm run dev`
