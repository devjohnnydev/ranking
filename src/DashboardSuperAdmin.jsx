import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useData } from './DataContext';
import { ShieldAlert, Users, BookOpen, MessageSquare, Send, Award, UserPlus, LogOut, Search, Globe } from 'lucide-react';

const DashboardSuperAdmin = () => {
    const { user, logout, sendMessage } = useData();
    const [teachers, setTeachers] = useState([]);
    const [globalData, setGlobalData] = useState({ users: [], classes: [], activities: [], grades: [] });
    const [tab, setTab] = useState('ranking');
    const [msgTarget, setMsgTarget] = useState({ type: 'global', id: null });
    const [msgContent, setMsgContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '' });

    const API_URL = import.meta.env.VITE_API_URL || '/api';

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [resTeachers, resGlobal] = await Promise.all([
                fetch(`${API_URL}/admin/teachers`).then(r => r.json()),
                fetch(`${API_URL}/admin/global-data?username=${user.username}`).then(r => r.json())
            ]);

            setTeachers(Array.isArray(resTeachers) ? resTeachers : []);
            if (resGlobal && typeof resGlobal === 'object' && !resGlobal.error) {
                setGlobalData({
                    users: Array.isArray(resGlobal.users) ? resGlobal.users : [],
                    classes: Array.isArray(resGlobal.classes) ? resGlobal.classes : [],
                    activities: Array.isArray(resGlobal.activities) ? resGlobal.activities : [],
                    grades: Array.isArray(resGlobal.grades) ? resGlobal.grades : []
                });
            }
        } catch (e) {
            console.error('Fetch global data error:', e);
        } finally {
            setLoading(false);
        }
    }, [user?.username, API_URL]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/admin/teachers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTeacher)
            });
            if (res.ok) {
                alert('Mestre convocado com sucesso!');
                setNewTeacher({ name: '', email: '', password: '' });
                fetchData();
            } else {
                const err = await res.json();
                alert('Erro: ' + (err.error || 'Falha ao cadastrar'));
            }
        } catch (e) {
            alert('Erro de conexão ao cadastrar professor');
        }
    };

    const handleSendAction = async () => {
        if (!msgContent.trim()) return;
        try {
            const operations = (globalData.classes || []).map(c => sendMessage({ toClassId: c.id, content: msgContent }));
            await Promise.all(operations);
            setMsgContent('');
            alert('Decreto Real enviado para toda a rede!');
        } catch (e) {
            alert('Falha ao enviar mensagem');
        }
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');

    const globalRanking = useMemo(() => {
        const users = globalData.users || [];
        const grades = globalData.grades || [];
        const classes = globalData.classes || [];
        
        return users
            .filter(u => u && u.role === 'STUDENT')
            .map(u => {
                const uGrades = grades.filter(g => g && g.studentId === u.id);
                const xp = uGrades.reduce((acc, g) => acc + (parseFloat(g.score) * 10 || 0), 0);
                const mainClass = classes.find(c => c.students?.some(e => e.studentId === u.id));
                const teacherName = mainClass?.teacher?.name || 'N/A';
                return { ...u, xp, level: Math.floor(Math.sqrt(xp / 100)) + 1, teacherName };
            })
            .filter(u => {
                const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesTeacher = teacherFilter === '' || u.teacherName === teacherFilter;
                return matchesSearch && matchesTeacher;
            })
            .sort((a, b) => b.xp - a.xp);
    }, [globalData.users, globalData.grades, globalData.classes, searchTerm, teacherFilter]);

    const teacherNames = useMemo(() => {
        const names = new Set();
        (globalData.classes || []).forEach(c => {
            if (c.teacher?.name) names.add(c.teacher.name);
        });
        return Array.from(names).sort();
    }, [globalData.classes]);

    const studentCount = (globalData.users || []).filter(u => u && u.role === 'STUDENT').length;
    const teacherCount = teachers.length;
    const classCount = (globalData.classes || []).length;

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '2.2rem', textTransform: 'uppercase' }}>
                        PlayGame
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '0.8rem' }}>Desenvolvido pelo professor Johnny Braga de Oliveira</p>
                    <p style={{ color: 'var(--secondary)', fontWeight: 'bold', marginTop: '0.4rem' }}>Painel Supremo: {user?.name || user?.username}</p>
                </div>
                <button onClick={logout} className="btn glass-card" style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    Sair do Trono <LogOut size={18} />
                </button>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Alunos Globais</p>
                    <h2 style={{ fontSize: '2.8rem', color: 'white' }}>{studentCount.toLocaleString()}</h2>
                </div>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid var(--secondary)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Guilda de Mestres</p>
                    <h2 style={{ fontSize: '2.8rem', color: 'white' }}>{teacherCount.toLocaleString()}</h2>
                </div>
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Turmas Ativas</p>
                    <h2 style={{ fontSize: '2.8rem', color: 'white' }}>{classCount.toLocaleString()}</h2>
                </div>
            </div>

            <nav style={{ display: 'flex', gap: '0.75rem', marginBottom: '3rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-primary' : 'glass-card'}`} style={{ flex: 1, minWidth: '160px' }}><Globe size={18} /> Ranking Global</button>
                <button onClick={() => setTab('teachers')} className={`btn ${tab === 'teachers' ? 'btn-primary' : 'glass-card'}`} style={{ flex: 1, minWidth: '160px' }}><Users size={18} /> Professores</button>
                <button onClick={() => setTab('classes')} className={`btn ${tab === 'classes' ? 'btn-primary' : 'glass-card'}`} style={{ flex: 1, minWidth: '160px' }}><BookOpen size={18} /> Todas Turmas</button>
                <button onClick={() => setTab('messages')} className={`btn ${tab === 'messages' ? 'btn-primary' : 'glass-card'}`} style={{ flex: 1, minWidth: '160px' }}><MessageSquare size={18} /> Decreto Real</button>
            </nav>

            <main className="glass-card" style={{ padding: '3rem' }}>
                {loading && globalData.users.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>Conectando à Rede Global...</div>
                ) : (
                    <>
                        {tab === 'ranking' && (
                            <div>
                                <h3 style={{ marginBottom: '2.5rem', fontSize: '1.6rem' }}>Hall da Fama da Rede</h3>
                                
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 2, minWidth: '200px', position: 'relative' }}>
                                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
                                        <input 
                                            className="input-field" 
                                            style={{ paddingLeft: '2.5rem' }} 
                                            placeholder="Filtrar por nome do aluno..." 
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <select 
                                            className="input-field"
                                            value={teacherFilter}
                                            onChange={e => setTeacherFilter(e.target.value)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <option value="">Todos os Professores</option>
                                            {teacherNames.map(name => (
                                                <option key={name} value={name} style={{ color: 'black' }}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.8rem' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <th style={{ padding: '0 1rem' }}>RANK</th>
                                                <th style={{ padding: '0 1rem' }}>SOBERANO</th>
                                                <th style={{ padding: '0 1rem' }}>MESTRE</th>
                                                <th style={{ padding: '0 1rem' }}>NÍVEL</th>
                                                <th style={{ padding: '0 1rem' }}>XP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {globalRanking.map((s, i) => (
                                                <tr key={s.id} style={{ background: i === 0 && !searchTerm && !teacherFilter ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)' }}>
                                                    <td style={{ padding: '1.2rem', fontWeight: '900', borderTopLeftRadius: '15px', borderBottomLeftRadius: '15px' }}>
                                                        {i + 1}º
                                                    </td>
                                                    <td style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', border: i === 0 && !searchTerm && !teacherFilter ? '2px solid var(--warning)' : 'none' }}>
                                                            {s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ margin: '11px' }} />}
                                                        </div>
                                                        <span style={{ fontWeight: '700' }}>{s.name}</span>
                                                    </td>
                                                    <td style={{ padding: '1.2rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                                        {s.teacherName}
                                                    </td>
                                                    <td style={{ padding: '1.2rem' }}>
                                                        <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>LVL {s.level}</span>
                                                    </td>
                                                    <td style={{ padding: '1.2rem', color: 'var(--primary)', fontWeight: '900', fontSize: '1.3rem', borderTopRightRadius: '15px', borderBottomRightRadius: '15px' }}>
                                                        {s.xp.toLocaleString()} XP
                                                    </td>
                                                </tr>
                                            ))}
                                            {globalRanking.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        Nenhum aventureiro encontrado com estes filtros.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {tab === 'teachers' && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '4rem' }}>
                                <div>
                                    <h3 style={{ marginBottom: '2rem' }}>Convocar Novo Mestre</h3>
                                    <form onSubmit={handleAddTeacher} style={{ display: 'grid', gap: '1.5rem' }}>
                                        <input className="input-field" placeholder="Nome Completo" value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} required />
                                        <input className="input-field" placeholder="E-mail Institucional" value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} required />
                                        <input className="input-field" type="password" placeholder="Senha Temporária" value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} required />
                                        <button className="btn btn-secondary" type="submit" style={{ padding: '1.2rem' }}>CODIFICAR MESTRE</button>
                                    </form>
                                </div>
                                <div>
                                    <h3 style={{ marginBottom: '2rem' }}>Guilda de Mestres Ativos</h3>
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {teachers.map(t => (
                                            <div key={t.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <p style={{ fontWeight: '800', fontSize: '1.1rem' }}>{t.name}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.email}</p>
                                                </div>
                                                <div className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                                                    {(globalData.classes || []).filter(c => c.teacherId === t.id).length} Turmas
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'classes' && (
                            <div>
                                <h3 style={{ marginBottom: '2rem' }}>Mapa de Turmas da Rede</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                    {globalData.classes.map(c => (
                                        <div key={c.id} className="glass-card" style={{ padding: '1.8rem', borderLeft: '4px solid var(--secondary)' }}>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>{c.subject}</p>
                                            <h4 style={{ margin: '0.5rem 0', fontSize: '1.3rem' }}>{c.name}</h4>
                                            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', opacity: '0.8', marginBottom: '1.2rem' }}>Mestre: {c.teacher?.name || 'N/A'}</p>
                                            <div style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: '900', color: 'var(--warning)', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)' }}>
                                                {c.joinCode}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {tab === 'messages' && (
                            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                                <h3 style={{ marginBottom: '1rem' }}>Anunciar Decreto Real</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Esta mensagem será enviada instantaneamente para toda a guilda de alunos.</p>
                                <div className="glass-card" style={{ padding: '2rem' }}>
                                    <textarea
                                        className="input-field"
                                        placeholder="Escreva seu pronunciamento para toda a rede..."
                                        value={msgContent}
                                        onChange={e => setMsgContent(e.target.value)}
                                        style={{ height: '200px', marginBottom: '1.5rem' }}
                                    />
                                    <button className="btn btn-primary" onClick={handleSendAction} style={{ width: '100%', padding: '1.2rem' }}>
                                        <Send size={20} /> ENVIAR PARA TODA A REDE
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default DashboardSuperAdmin;
