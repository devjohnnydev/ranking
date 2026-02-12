require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// CORS configuration for production and local dev
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.railway\.app$/ // Allow all railway apps
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Origin not allowed by CORS'));
        }
    },
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
            include: { class: { include: { teacher: true } } }
        });
        return res.json(enrollments.map(e => e.class));
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
    const targetClass = await prisma.class.findUnique({ where: { joinCode } });
    if (!targetClass) return res.status(404).json({ error: "Código de turma inválido" });

    const enrollment = await prisma.enrollment.upsert({
        where: { studentId_classId: { studentId: parseInt(studentId), classId: targetClass.id } },
        update: {},
        create: { studentId: parseInt(studentId), classId: targetClass.id }
    });
    res.json(enrollment);
}));

// Student lookup
app.get('/api/students', asyncHandler(async (req, res) => {
    const { classId } = req.query;
    if (!classId || classId === 'undefined') return res.json([]);
    const enrollments = await prisma.enrollment.findMany({
        where: { classId: parseInt(classId) },
        include: { student: true }
    });
    res.json(enrollments.map(e => e.student));
}));

// Student self-registration with code
app.post('/api/auth/register-student', asyncHandler(async (req, res) => {
    const { username, password, name, joinCode, photoUrl } = req.body;
    const targetClass = await prisma.class.findUnique({ where: { joinCode } });
    if (!targetClass) return res.status(404).json({ error: "Código de turma inválido" });

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
        return res.status(400).json({ error: "Este e-mail/usuário já está cadastrado" });
    }

    const student = await prisma.user.create({
        data: { username, password, name, role: 'STUDENT', photoUrl }
    });
    await prisma.enrollment.create({
        data: { studentId: student.id, classId: targetClass.id }
    });
    res.json(student);
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

// Activities & Grades
app.get('/api/activities', asyncHandler(async (req, res) => {
    const { classId } = req.query;
    if (!classId || classId === 'undefined') return res.json([]);
    const activities = await prisma.activity.findMany({
        where: { classId: parseInt(classId) }
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
    if (!classId || classId === 'undefined') return res.status(400).json({ error: "ID da turma inválido" });
    const activity = await prisma.activity.create({
        data: {
            title,
            description: description || desc || "",
            maxScore: parseFloat(maxScore) || 10,
            classId: parseInt(classId)
        }
    });
    res.json(activity);
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

// Rankings
app.get('/api/ranking', asyncHandler(async (req, res) => {
    const { classId, username } = req.query;

    let userQuery = { role: 'STUDENT' };
    if (!isJohnny(username) && classId && classId !== 'undefined') {
        userQuery = { enrollments: { some: { classId: parseInt(classId) } } };
    }

    const users = await prisma.user.findMany({
        where: userQuery,
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

// Profile upload
app.patch('/api/profile/:id', asyncHandler(async (req, res) => {
    const { photoUrl, name, password } = req.body;
    const user = await prisma.user.update({
        where: { id: parseInt(req.params.id) },
        data: { photoUrl, name, password }
    });
    res.json(user);
}));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Rota não encontrada" });
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

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
