import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// Helper to wrap async routes
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Utility for Johnnny's global access
const isJohnny = (username) => username === 'johnny.oliveira@sp.senai.br';

// Initialize Admin
async function initAdmin() {
    const adminEmail = 'johnny.oliveira@sp.senai.br';
    const existing = await prisma.user.findUnique({ where: { username: adminEmail } });
    if (!existing) {
        await prisma.user.create({
            data: {
                username: adminEmail,
                email: adminEmail,
                password: '46431194',
                role: 'ADMIN',
                name: 'Johnny Oliveira'
            }
        });
        console.log('Super Admin created!');
    }
}
initAdmin().catch(console.error);

// Auth Login
app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (user && user.password === password) {
        const { password: _, ...userNoPass } = user;
        res.json(userNoPass);
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
}));

// Admin: Manage Teachers (Only Johnny)
app.get('/api/admin/teachers', asyncHandler(async (req, res) => {
    const teachers = await prisma.user.findMany({ where: { role: 'TEACHER' } });
    res.json(teachers);
}));

app.post('/api/admin/teachers', asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const teacher = await prisma.user.create({
        data: { username: email, email, password, role: 'TEACHER', name }
    });
    res.json(teacher);
}));

// Global View for Johnny
app.get('/api/admin/global-data', asyncHandler(async (req, res) => {
    const { username } = req.query;
    if (!isJohnny(username)) return res.status(403).json({ error: "Acesso negado" });

    const [users, classes, activities, grades] = await Promise.all([
        prisma.user.findMany({ include: { enrollments: true } }),
        prisma.class.findMany({ include: { teacher: true } }),
        prisma.activity.findMany({ include: { class: true } }),
        prisma.grade.findMany()
    ]);
    res.json({ users, classes, activities, grades });
}));

// Classes management
app.get('/api/classes', asyncHandler(async (req, res) => {
    const { teacherId, studentId, username } = req.query;

    if (isJohnny(username)) {
        return res.json(await prisma.class.findMany({ include: { teacher: true } }));
    }

    if (teacherId && teacherId !== 'undefined') {
        return res.json(await prisma.class.findMany({ where: { teacherId: parseInt(teacherId) } }));
    }

    if (studentId && studentId !== 'undefined') {
        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: parseInt(studentId) },
            include: { class: { include: { teacher: { select: { name: true, photoUrl: true, quote: true, bio: true } } } } }
        });
        return res.json(enrollments.map(e => ({
            ...e.class,
            enrollmentStatus: e.status
        })));
    }
    res.json([]);
}));

app.post('/api/classes', asyncHandler(async (req, res) => {
    const { name, subject, teacherId } = req.body;
    if (!teacherId || teacherId === 'undefined') return res.status(400).json({ error: "ID do professor inválido" });

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newClass = await prisma.class.create({
        data: { name, subject, teacherId: parseInt(teacherId), joinCode }
    });
    res.json(newClass);
}));

app.post('/api/classes/join', asyncHandler(async (req, res) => {
    const { studentId, joinCode } = req.body;
    const normalizedCode = joinCode?.trim().toUpperCase();
    console.log(`Attempting join for student ${studentId} with code: ${normalizedCode}`);

    const targetClass = await prisma.class.findUnique({ where: { joinCode: normalizedCode } });
    if (!targetClass) {
        console.warn(`Join failed: Class not found for code ${normalizedCode}`);
        return res.status(404).json({ error: "Código de turma inválido" });
    }

    const enrollment = await prisma.enrollment.upsert({
        where: { studentId_classId: { studentId: parseInt(studentId), classId: targetClass.id } },
        update: {},
        create: {
            studentId: parseInt(studentId),
            classId: targetClass.id,
            status: 'PENDING'
        }
    });
    res.json(enrollment);
}));

// Student lookup
app.get('/api/students', asyncHandler(async (req, res) => {
    const { classId, status } = req.query;
    if (!classId || classId === 'undefined') return res.json([]);

    const where = { classId: parseInt(classId) };
    if (status) {
        where.status = status;
    }

    const enrollments = await prisma.enrollment.findMany({
        where,
        include: { student: true }
    });
    res.json(enrollments.map(e => ({
        ...e.student,
        enrollmentStatus: e.status,
        enrollmentId: e.id
    })));
}));

// Student self-registration with code
app.post('/api/auth/register-student', asyncHandler(async (req, res) => {
    const { username, password, name, joinCode, photoUrl } = req.body;
    const normalizedCode = joinCode?.trim().toUpperCase();
    console.log(`[Register] Attempting: ${username} with code: ${normalizedCode}`);

    if (!normalizedCode) return res.status(400).json({ error: "Código da turma é obrigatório" });

    const targetClass = await prisma.class.findUnique({ where: { joinCode: normalizedCode } });
    if (!targetClass) {
        console.warn(`[Register] Failed: Class not found for code ${normalizedCode}`);
        return res.status(404).json({ error: "Código de turma inválido ou não encontrado" });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        return res.status(400).json({ error: "Este e-mail/usuário já está cadastrado" });
    }

    // Use transaction to ensure both user and enrollment are created
    const result = await prisma.$transaction(async (tx) => {
        const student = await tx.user.create({
            data: { username, password, name, role: 'STUDENT', photoUrl }
        });

        const enrollment = await tx.enrollment.create({
            data: {
                studentId: student.id,
                classId: targetClass.id,
                status: 'APPROVED'
            }
        });

        console.log(`[Register] Success: Student ${student.id} linked to class ${targetClass.id}`);
        return student;
    });

    const { password: _, ...userNoPass } = result;
    res.json(userNoPass);
}));

// Messaging
app.post('/api/messages', asyncHandler(async (req, res) => {
    const { fromId, toUserId, toClassId, content } = req.body;
    const msg = await prisma.message.create({
        data: {
            fromId: parseInt(fromId),
            toUserId: (toUserId && toUserId !== 'undefined') ? parseInt(toUserId) : null,
            toClassId: (toClassId && toClassId !== 'undefined') ? parseInt(toClassId) : null,
            content
        }
    });
    res.json(msg);
}));

app.get('/api/messages', asyncHandler(async (req, res) => {
    const { userId } = req.query;
    if (!userId || userId === 'undefined') return res.json([]);

    const studentEnrollments = await prisma.enrollment.findMany({ where: { studentId: parseInt(userId) } });
    const classIds = studentEnrollments.map(e => e.classId);

    const messages = await prisma.message.findMany({
        where: {
            OR: [
                { toUserId: parseInt(userId) },
                { toClassId: { in: classIds } }
            ]
        },
        include: { from: true, toClass: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
}));

// Activities, Missions & Grades
app.get('/api/missions', asyncHandler(async (req, res) => {
    const { classId, teacherId } = req.query;
    const where = {};
    if (classId && classId !== 'undefined') {
        where.classId = parseInt(classId);
    } else if (teacherId && teacherId !== 'undefined') {
        where.teacherId = parseInt(teacherId);
    }
    
    const missions = await prisma.mission.findMany({
        where,
        include: { teacher: true, class: true },
        orderBy: { createdAt: 'desc' }
    });
    res.json(missions);
}));

app.post('/api/missions', asyncHandler(async (req, res) => {
    const { title, description, reward, deadline, classId, teacherId } = req.body;
    if (!classId || classId === 'undefined') return res.status(400).json({ error: "ID da turma inválido" });
    if (!teacherId || teacherId === 'undefined') return res.status(400).json({ error: "ID do professor inválido" });

    const mission = await prisma.mission.create({
        data: {
            title,
            description,
            reward: parseInt(reward) || 0,
            deadline: deadline ? new Date(deadline) : null,
            classId: parseInt(classId),
            teacherId: parseInt(teacherId)
        }
    });
    res.json(mission);
}));

app.get('/api/activities', asyncHandler(async (req, res) => {
    const { classId } = req.query;
    if (!classId || classId === 'undefined') return res.json([]);
    const activities = await prisma.activity.findMany({
        where: { classId: parseInt(classId) },
        orderBy: { createdAt: 'desc' }
    });
    res.json(activities);
}));

app.get('/api/grades', asyncHandler(async (req, res) => {
    const { classId } = req.query;
    if (!classId || classId === 'undefined') return res.json([]);

    // Fetch all activities for this class to get their IDs
    const activities = await prisma.activity.findMany({
        where: { classId: parseInt(classId) },
        select: { id: true }
    });
    const activityIds = activities.map(a => a.id);

    const grades = await prisma.grade.findMany({
        where: { activityId: { in: activityIds } }
    });
    res.json(grades);
}));

app.post('/api/activities', asyncHandler(async (req, res) => {
    const { title, description, desc, maxScore, classId } = req.body;
    console.log(`Mission creation attempt for class ${classId}: ${title}`);
    if (!classId || classId === 'undefined') return res.status(400).json({ error: "ID da turma inválido" });

    try {
        const activity = await prisma.activity.create({
            data: {
                title,
                description: description || desc || "",
                maxScore: parseFloat(maxScore) || 10,
                classId: parseInt(classId)
            }
        });
        console.log(`Mission created successfully: ${activity.id}`);
        res.json(activity);
    } catch (err) {
        console.error("Error creating mission:", err);
        res.status(500).json({ error: "Falha ao criar missão no banco de dados" });
    }
}));

app.post('/api/grades', asyncHandler(async (req, res) => {
    const { studentId, activityId, score, teacherId } = req.body;
    const grade = await prisma.grade.upsert({
        where: { studentId_activityId: { studentId: parseInt(studentId), activityId: parseInt(activityId) } },
        update: { score: parseFloat(score) },
        create: { studentId: parseInt(studentId), activityId: parseInt(activityId), score: parseFloat(score) }
    });

    const activity = await prisma.activity.findUnique({ where: { id: parseInt(activityId) } });
    await prisma.message.create({
        data: {
            fromId: parseInt(teacherId),
            toUserId: parseInt(studentId),
            content: `Sua nota na atividade "${activity.title}" foi postada: ${score}!`
        }
    });

    res.json(grade);
}));

app.get('/api/ranking', asyncHandler(async (req, res) => {
    const { classId, username } = req.query;

    const where = { role: 'STUDENT' };
    if (!isJohnny(username) && classId && classId !== 'undefined') {
        where.enrollments = {
            some: {
                classId: parseInt(classId),
                status: 'APPROVED'
            }
        };
    }

    const users = await prisma.user.findMany({
        where,
        include: { grades: true, enrollments: { include: { class: true } } }
    });

    const ranking = users.map(u => {
        const totalXP = u.grades.reduce((acc, g) => acc + (g.score * 10), 0);
        return {
            id: u.id,
            name: u.name,
            photoUrl: u.photoUrl,
            xp: totalXP,
            level: Math.floor(Math.sqrt(totalXP / 100)) + 1,
            classes: u.enrollments.map(e => e.class.name)
        };
    }).sort((a, b) => b.xp - a.xp);

    res.json(ranking);
}));

// Enrollment Management
app.get('/api/enrollments/pending', asyncHandler(async (req, res) => {
    const { classId } = req.query;
    if (!classId || classId === 'undefined') return res.json([]);

    const enrollments = await prisma.enrollment.findMany({
        where: { classId: parseInt(classId), status: 'PENDING' },
        include: { student: true }
    });
    res.json(enrollments);
}));

app.post('/api/enrollments/approve', asyncHandler(async (req, res) => {
    const { enrollmentId, status } = req.body; // status: 'APPROVED' or 'REJECTED'
    if (!enrollmentId) return res.status(400).json({ error: "ID da matrícula não fornecido" });

    if (status === 'REJECTED') {
        await prisma.enrollment.delete({ where: { id: parseInt(enrollmentId) } });
        return res.json({ message: "Solicitação recusada e removida" });
    }

    const enrollment = await prisma.enrollment.update({
        where: { id: parseInt(enrollmentId) },
        data: { status }
    });
    res.json(enrollment);
}));

app.delete('/api/enrollments/remove', asyncHandler(async (req, res) => {
    const { studentId, classId } = req.query;
    await prisma.enrollment.delete({
        where: {
            studentId_classId: {
                studentId: parseInt(studentId),
                classId: parseInt(classId)
            }
        }
    });
    res.json({ message: "Aluno removido com sucesso" });
}));

// Profile update
app.patch('/api/profile/:id', asyncHandler(async (req, res) => {
    const { photoUrl, name, password, bio, quote } = req.body;
    const user = await prisma.user.update({
        where: { id: parseInt(req.params.id) },
        data: { photoUrl, name, password, bio, quote }
    });
    const { password: _, ...userNoPass } = user;
    res.json(userNoPass);
}));

// 404 handler
app.use(/\/api\/.*/, (req, res) => {
    res.status(404).json({ error: "Rota da API não encontrada" });
});

// Global Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Erro interno do servidor" });
});

// Serve frontend - Catch-all route
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});
