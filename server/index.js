import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'senai-secret-key-2024';

// Helper for unique class code
const generateUniqueCode = async () => {
    let code;
    let exists = true;
    while (exists) {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const check = await prisma.turma.findUnique({ where: { codigo: code } });
        if (!check) exists = false;
    }
    return code;
};

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// --- MIDDLEWARES ---

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }
    next();
};

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- INITIALIZATION ---

async function initAdmin() {
    const adminEmail = 'johnny.oliveira@sp.senai.br';
    const existing = await prisma.administrador.findUnique({ where: { email: adminEmail } });
    if (!existing) {
        const hashedPass = await bcrypt.hash('46431194', 10);
        await prisma.administrador.create({
            data: {
                nome: 'Johnny Oliveira',
                email: adminEmail,
                senha_hash: hashedPass
            }
        });
        console.log('Super Admin created!');
    }
}
initAdmin().catch(console.error);

// --- AUTH ROUTES ---

app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password, nome, codigo } = req.body;

    // 1. Aluno Login (Nome + Código)
    if (nome && codigo) {
        const student = await prisma.aluno.findFirst({
            where: {
                nome,
                turma: { codigo: codigo.trim().toUpperCase() }
            },
            include: { professor: true, turma: true }
        });

        if (student) {
            const token = jwt.sign({ id: student.id, role: 'ALUNO', name: student.nome }, JWT_SECRET);
            return res.json({ token, user: { ...student, role: 'ALUNO' } });
        }
        return res.status(401).json({ error: 'Dados do aluno ou código da turma inválidos' });
    }

    // 2. Admin Login
    const admin = await prisma.administrador.findUnique({ where: { email } });
    if (admin && await bcrypt.compare(password, admin.senha_hash)) {
        const token = jwt.sign({ id: admin.id, role: 'ADMIN', name: admin.nome }, JWT_SECRET);
        return res.json({ token, user: { ...admin, role: 'ADMIN' } });
    }

    // 3. Professor Login
    const professor = await prisma.professor.findUnique({ where: { email } });
    if (professor && await bcrypt.compare(password, professor.senha_hash)) {
        const token = jwt.sign({ id: professor.id, role: 'PROFESSOR', name: professor.nome }, JWT_SECRET);
        return res.json({ token, user: { ...professor, role: 'PROFESSOR' } });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
}));

// --- ADMIN ROUTES ---

app.get('/api/admin/professores', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const professores = await prisma.professor.findMany();
    res.json(professores);
}));

app.post('/api/admin/professores', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const { nome, email, senha } = req.body;
    const defaultPassword = senha || 'senaisaopaulo';
    const hashedPass = await bcrypt.hash(defaultPassword, 10);
    const codigo = await generateUniqueCode();

    const professor = await prisma.professor.create({
        data: {
            nome,
            email,
            senha_hash: hashedPass,
            codigo_turma: codigo, // Mantido apenas para compatibilidade legada se necessário
            primeiro_acesso: true
        }
    });

    // Criar a turma inicial
    await prisma.turma.create({
        data: {
            nome: `Turma Inicial - ${nome}`,
            codigo: codigo,
            professorId: professor.id,
            materia: 'Boas-vindas'
        }
    });

    res.json(professor);
}));

app.post('/api/admin/professores/:id/reset-senha', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const hashedPass = await bcrypt.hash('senaisaopaulo', 10);
    await prisma.professor.update({
        where: { id: parseInt(id) },
        data: { senha_hash: hashedPass, primeiro_acesso: true }
    });
    res.json({ message: "Senha resetada para padrão (senaisaopaulo) com sucesso" });
}));

app.delete('/api/admin/professores/:id', authenticate, authorize(['ADMIN']), asyncHandler(async (req, res) => {
    const { id } = req.params;
    // O Cascade Delete no Prisma cuidará das Turmas, Alunos, Atividades, etc.
    await prisma.professor.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Professor e todos os dados vinculados excluídos com sucesso" });
}));

// --- PROFESSOR ROUTES ---

app.patch('/api/professor/change-password', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { password } = req.body;
    const hashedPass = await bcrypt.hash(password, 10);
    await prisma.professor.update({
        where: { id: req.user.id },
        data: { senha_hash: hashedPass, primeiro_acesso: false }
    });
    res.json({ message: "Senha alterada com sucesso" });
}));

app.patch('/api/professor/perfil', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { foto_url, bio, mensagem_incentivo } = req.body;
    const updated = await prisma.professor.update({
        where: { id: req.user.id },
        data: { foto_url, bio, mensagem_incentivo }
    });
    res.json(updated);
}));

app.post('/api/turmas', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { nome, materia, observacao } = req.body;
    const codigo = await generateUniqueCode();

    const turma = await prisma.turma.create({
        data: {
            nome,
            materia,
            observacao,
            codigo,
            professorId: req.user.id
        }
    });
    res.json(turma);
}));

app.get('/api/turmas', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    if (req.user.role === 'ADMIN') {
        return res.json(await prisma.turma.findMany({ include: { professor: true } }));
    }
    const turmas = await prisma.turma.findMany({
        where: { professorId: req.user.id }
    });
    res.json(turmas);
}));

app.get('/api/alunos', authenticate, authorize(['ADMIN', 'PROFESSOR']), asyncHandler(async (req, res) => {
    const { turmaId } = req.query;
    const where = {};
    if (req.user.role === 'PROFESSOR') {
        where.professorId = req.user.id;
    }
    if (turmaId) {
        where.turmaId = parseInt(turmaId);
    }

    const alunos = await prisma.aluno.findMany({
        where,
        include: { turma: true }
    });
    res.json(alunos);
}));

// Aluno self-registration
app.post('/api/auth/register-aluno', asyncHandler(async (req, res) => {
    const { nome, codigo } = req.body;
    const normalizedCode = codigo?.trim().toUpperCase();

    const turma = await prisma.turma.findUnique({ where: { codigo: normalizedCode } });
    if (!turma) return res.status(404).json({ error: "Código de turma inválido" });

    const aluno = await prisma.aluno.create({
        data: {
            nome,
            professorId: turma.professorId,
            turmaId: turma.id
        }
    });

    const token = jwt.sign({ id: aluno.id, role: 'ALUNO', name: aluno.nome }, JWT_SECRET);
    res.json({ token, user: { ...aluno, role: 'ALUNO' } });
}));

// --- GAME LOGIC (Missions, Activities, Grades) ---

app.post('/api/atividades', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { titulo, descricao, nota_maxima, turmaId } = req.body;

    // Verify ownership
    const turma = await prisma.turma.findFirst({ where: { id: parseInt(turmaId), professorId: req.user.id } });
    if (!turma) return res.status(403).json({ error: "Você não tem permissão para esta turma" });

    const atividade = await prisma.atividade.create({
        data: {
            titulo,
            descricao,
            nota_maxima: parseFloat(nota_maxima) || 10,
            turmaId: parseInt(turmaId)
        }
    });
    res.json(atividade);
}));

app.post('/api/notas', authenticate, authorize(['PROFESSOR']), asyncHandler(async (req, res) => {
    const { alunoId, atividadeId, valor } = req.body;
    const grade = await prisma.nota.upsert({
        where: { alunoId_atividadeId: { alunoId: parseInt(alunoId), atividadeId: parseInt(atividadeId) } },
        update: { valor: parseFloat(valor) },
        create: {
            alunoId: parseInt(alunoId),
            atividadeId: parseInt(atividadeId),
            valor: parseFloat(valor)
        }
    });
    res.json(grade);
}));

app.get('/api/ranking', asyncHandler(async (req, res) => {
    const { turmaId } = req.query;

    const where = {};
    if (turmaId) where.turmaId = parseInt(turmaId);

    const alunos = await prisma.aluno.findMany({
        where,
        include: {
            notas: true,
            professor: { select: { nome: true } },
            turma: { select: { nome: true } }
        }
    });

    const ranking = alunos.map(a => {
        const totalXP = a.notas.reduce((acc, n) => acc + (n.valor * 10), 0);
        return {
            id: a.id,
            nome: a.nome,
            xp: totalXP,
            level: Math.floor(Math.sqrt(totalXP / 100)) + 1,
            professorNome: a.professor.nome,
            turmaNome: a.turma.nome
        };
    }).sort((a, b) => b.xp - a.xp);

    res.json(ranking);
}));

// --- APP SETUP ---

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor" });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
