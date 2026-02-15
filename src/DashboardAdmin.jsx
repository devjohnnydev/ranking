import React, { useState } from 'react';
import { useData } from './DataContext';
import { Trophy, Users, Star, Plus, Send, LogOut, Award, ChevronRight, BookOpen, Clock, Check, X, MessageSquare, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const StudentGradeRow = ({ student, activities, grades, onSaveGrade }) => {
    const [localGrades, setLocalGrades] = useState({});
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = Object.entries(localGrades).map(([actId, score]) =>
                onSaveGrade(student.id, parseInt(actId), score)
            );
            await Promise.all(promises);
            setLocalGrades({});
            alert(`Notas de ${student.name} salvas!`);
        } finally {
            setSaving(false);
        }
    };

    return (
        <tr key={student.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.name}</td>
            {activities.map(a => (
                <td key={a.id} style={{ padding: '1rem', textAlign: 'center' }}>
                    <input
                        type="number"
                        className="input-field"
                        style={{ width: '70px', textAlign: 'center', padding: '0.4rem' }}
                        value={localGrades[a.id] !== undefined ? localGrades[a.id] : (grades[`${student.id}-${a.id}`] || '')}
                        onChange={(e) => setLocalGrades({ ...localGrades, [a.id]: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                    />
                </td>
            ))}
            <td style={{ padding: '1rem', textAlign: 'center' }}>
                <button
                    className={`btn ${Object.keys(localGrades).length > 0 ? 'btn-primary' : 'glass-card'}`}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                    disabled={Object.keys(localGrades).length === 0 || saving}
                    onClick={handleSave}
                >
                    {saving ? '...' : 'SALVAR'}
                </button>
            </td>
        </tr>
    );
};

const DashboardAdmin = () => {
    const {
        logout, user, students = [], activities = [], missions = [],
        addActivity, addMission, setStudentGrade, grades = {}, ranking = [],
        classes = [], selectedClass, setSelectedClass, createClass, sendMessage,
        pendingEnrollments = [], approveEnrollment, refreshAll, loading
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [showNewClass, setShowNewClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSubject, setNewClassSubject] = useState('');
    const [newActivity, setNewActivity] = useState({ title: '', description: '', maxScore: 10 });
    const [newMission, setNewMission] = useState({ title: '', description: '', reward: 100 });
    const [msgContent, setMsgContent] = useState('');

    const handleCreateClass = async (e) => {
        e.preventDefault();
        try {
            await createClass(newClassName, newClassSubject);
            setNewClassName('');
            setNewClassSubject('');
            setShowNewClass(false);
        } catch (err) {
            alert('Falha ao criar turma');
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addActivity({ ...newActivity, classId: selectedClass.id });
            setNewActivity({ title: '', description: '', maxScore: 10 });
            alert('Atividade lançada com sucesso!');
        } catch (err) {
            alert('Falha ao lançar atividade');
        }
    };

    const handleAddMission = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert('Selecione uma turma primeiro');
        try {
            await addMission({ ...newMission, classId: selectedClass.id });
            setNewMission({ title: '', description: '', reward: 100 });
            alert('Missão de classe lançada com sucesso!');
        } catch (err) {
            alert('Falha ao lançar missão');
        }
    };

    const sendClassMessage = async () => {
        if (!msgContent.trim() || !selectedClass) return;
        try {
            await sendMessage({ toClassId: selectedClass.id, content: msgContent });
            setMsgContent('');
            alert('Mensagem enviada com sucesso!');
        } catch (err) {
            alert('Falha ao enviar comunicado');
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--primary)', textTransform: 'uppercase' }}>PlayGame</h1>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>Desenvolvido pelo professor Johnny Braga de Oliveira</p>
                    <h2 style={{ fontSize: '1.2rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>Mestre {user?.name || user?.username}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.8rem' }}>
                        <div className="glass-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <BookOpen size={18} color="var(--primary)" />
                            <select
                                style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', outline: 'none', fontSize: '0.9rem' }}
                                value={selectedClass?.id || ''}
                                onChange={(e) => {
                                    const id = parseInt(e.target.value);
                                    const found = classes.find(c => c.id === id);
                                    if (found) setSelectedClass(found);
                                }}
                            >
                                <option value="" disabled>Selecione uma turma</option>
                                {classes.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name} - {c.subject}</option>)}
                                {classes.length === 0 && <option value="">Nenhuma turma disponível</option>}
                            </select>
                        </div>
                        <button onClick={() => setShowNewClass(true)} className="btn btn-secondary" style={{ height: '42px' }}>
                            <Plus size={18} /> Turma
                        </button>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={refreshAll} className="btn glass-card" disabled={loading} style={{ padding: '0.8rem' }}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    </button>
                    <button onClick={logout} className="btn glass-card" style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.8rem' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {showNewClass && (
                <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '3rem', maxWidth: '500px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Nova Aventura (Turma)</h3>
                    <form onSubmit={handleCreateClass} style={{ display: 'grid', gap: '1.2rem' }}>
                        <input className="input-field" placeholder="Nome da Turma" value={newClassName} onChange={e => setNewClassName(e.target.value)} required />
                        <input className="input-field" placeholder="Matéria Principal" value={newClassSubject} onChange={e => setNewClassSubject(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>CRIAR</button>
                            <button type="button" onClick={() => setShowNewClass(false)} className="btn glass-card" style={{ flex: 1 }}>VOLTAR</button>
                        </div>
                    </form>
                </div>
            )}

            {selectedClass && (
                <div className="glass-card" style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.05))',
                    padding: '1.5rem 2rem',
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: '4px solid var(--primary)'
                }}>
                    <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>CÓDIGO DE ENTRADA</span>
                        <h2 style={{ letterSpacing: '4px', color: 'var(--secondary)', fontSize: '2rem', margin: '0.2rem 0' }}>{selectedClass.joinCode}</h2>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontWeight: '800', fontSize: '1.2rem' }}>{selectedClass.name}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedClass.subject}</p>
                    </div>
                </div>
            )}

            <nav style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem', flexWrap: 'nowrap' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Trophy size={18} /> Ranking</button>
                <button onClick={() => setTab('students')} className={`btn ${tab === 'students' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Users size={18} /> Alunos</button>
                <button onClick={() => setTab('missions')} className={`btn ${tab === 'missions' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Plus size={18} /> Missões</button>
                <button onClick={() => setTab('grades')} className={`btn ${tab === 'grades' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Award size={18} /> Avaliação</button>
                <button onClick={() => setTab('messages')} className={`btn ${tab === 'messages' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '140px' }}><Send size={18} /> Mensagens</button>
            </nav>

            <main className="glass-card" style={{ padding: '2.5rem' }}>
                {tab === 'ranking' && (
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Classificação da Turma: {selectedClass?.name || 'Selecione uma turma'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.75rem' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ padding: '0 1rem' }}>RANK</th>
                                        <th style={{ padding: '0 1rem' }}>AVENTUREIRO</th>
                                        <th style={{ padding: '0 1rem' }}>NÍVEL</th>
                                        <th style={{ padding: '0 1rem' }}>XP TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((s, idx) => (
                                        <tr key={s.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                            <td style={{ padding: '1rem', fontWeight: '900', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}>
                                                {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `${idx + 1}º`}
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                                    {s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={18} style={{ margin: '9px' }} />}
                                                </div>
                                                <span style={{ fontWeight: '700' }}>{s.name}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>LVL {s.level || 1}</span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--secondary)', fontWeight: '900', fontSize: '1.2rem', borderTopRightRadius: '12px', borderBottomRightRadius: '12px' }}>
                                                {s.xp?.toLocaleString() || 0}
                                            </td>
                                        </tr>
                                    ))}
                                    {ranking.length === 0 && <tr><td colSpan="4" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aguardando registro de XP...</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'students' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0 }}>Alunos Matriculados ({students.length})</h3>
                            {pendingEnrollments.length > 0 && (
                                <span className="badge" style={{ background: 'var(--warning)', color: 'black' }}>
                                    {pendingEnrollments.length} PENDENTES
                                </span>
                            )}
                        </div>

                        {pendingEnrollments.length > 0 && (
                            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--warning)' }}>Aprovações Pendentes</h4>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {pendingEnrollments.map(e => (
                                        <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                                    {e.student.photoUrl ? <img src={e.student.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: '10px' }} />}
                                                </div>
                                                <span style={{ fontWeight: '700' }}>{e.student.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => approveEnrollment(e.id, 'APPROVED')} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>APROVAR</button>
                                                <button onClick={() => approveEnrollment(e.id, 'REJECTED')} className="btn glass-card" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: '#ef4444' }}>RECUSAR</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                            {students.map(s => (
                                <div key={s.id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                            {s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: '12px' }} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: '800', fontSize: '0.95rem' }}>{s.name}</p>
                                            <p style={{ fontSize: '0.7rem', color: 'var(--success)' }}>Ativo</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            if(confirm(`Remover ${s.name} da turma?`)) {
                                                try {
                                                    // We need the enrollment ID. The API expects enrollmentId for approve/reject.
                                                    // Since we don't have enrollmentId here directly in the student object, 
                                                    // we'll need to find it or adjust the API. 
                                                    // Actually, students lookup returns User objects.
                                                    // Let's adjust the delete logic to use studentId and classId.
                                                    const res = await fetch(`/api/enrollments/remove?studentId=${s.id}&classId=${selectedClass.id}`, { method: 'DELETE' });
                                                    if (res.ok) {
                                                        alert('Aluno removido');
                                                        refreshAll();
                                                    }
                                                } catch (e) {
                                                    alert('Erro ao remover');
                                                }
                                            }
                                        }}
                                        className="btn" 
                                        style={{ padding: '0.4rem', color: '#ef4444' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {students.length === 0 && pendingEnrollments.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Nenhum aluno entrou na turma ainda.</p>}
                        </div>
                    </div>
                )}

                {tab === 'missions' && (
                    <div>
                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(255, 232, 31, 0.1)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                <Plus size={24} /> Nova Missão de Classe (XP p/ Todos)
                            </h3>
                            <form onSubmit={handleAddMission} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 150px', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Título da Missão</label>
                                    <input className="input-field" value={newMission.title} onChange={e => setNewMission({ ...newMission, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Instruções</label>
                                    <input className="input-field" value={newMission.description} onChange={e => setNewMission({ ...newMission, description: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>XP</label>
                                    <input type="number" className="input-field" value={newMission.reward} onChange={e => setNewMission({ ...newMission, reward: parseInt(e.target.value) || 0 })} required />
                                </div>
                                <button type="submit" className="btn btn-primary">CRIAR MISSÃO</button>
                            </form>
                        </div>

                        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(99, 102, 241, 0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={24} color="var(--primary)" /> Novo Item de Avaliação (Individual)
                            </h3>
                            <form onSubmit={handleAddActivity} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 2fr 100px 150px', gap: '1rem', alignItems: 'end' }}>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Título</label>
                                    <input className="input-field" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Descrição (Opcional)</label>
                                    <input className="input-field" value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: '#E0E0E0' }}>Pontos</label>
                                    <input type="number" className="input-field" value={newActivity.maxScore} onChange={e => setNewActivity({ ...newActivity, maxScore: parseFloat(e.target.value) || 0 })} required />
                                </div>
                                <button type="submit" className="btn btn-primary">CRIAR ITEM</button>
                            </form>
                        </div>

                        <h3 style={{ marginBottom: '1.5rem' }}>Missões de Classe Ativas ({missions.length})</h3>
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
                            {missions.map(m => (
                                <div key={m.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,232,31,0.05)', borderLeft: '4px solid var(--primary)' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: '#FFFFFF' }}>{m.title}</h4>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#E0E0E0' }}>{m.description}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{m.reward} XP</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <h3 style={{ marginBottom: '1.5rem' }}>Atividades Avaliadas ({activities.length})</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {activities.map(a => (
                                <div key={a.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'white' }}>{a.title}</h4>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#E0E0E0' }}>{a.description || 'Sem descrição'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                            <span>{a.maxScore} XP</span>
                                        </div>
                                        <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#E0E0E0' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && missions.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--glass-border)', borderRadius: '16px' }}>
                                    <p style={{ color: 'var(--text-muted)' }}>Nenhuma missão ou atividade lançada ainda.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'grades' && (
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h3 style={{ margin: 0 }}>Lançamento de Notas</h3>
                            <button className="badge" style={{ background: 'var(--success)', color: 'white', border: 'none' }}>TURMA ATIVA</button>
                        </div>
                        {!selectedClass ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Selecione uma turma para carregar as notas.</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', minWidth: '180px' }}>ALUNO</th>
                                        {activities.map(a => <th key={a.id} style={{ padding: '1rem', textAlign: 'center' }}>{a.title}</th>)}
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>AÇÃO</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <StudentGradeRow
                                            key={s.id}
                                            student={s}
                                            activities={activities}
                                            grades={grades}
                                            onSaveGrade={setStudentGrade}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {tab === 'messages' && (
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Comunicados e Atas</h3>
                        {!selectedClass ? <p>Selecione uma turma para emitir ordens.</p> : (
                            <div>
                                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2.5rem' }}>
                                    <textarea
                                        className="input-field"
                                        placeholder="Escreva sua ordem ou aviso para todos os alunos..."
                                        value={msgContent}
                                        onChange={e => setMsgContent(e.target.value)}
                                        style={{ height: '140px', marginBottom: '1.2rem' }}
                                    />
                                    <button className="btn btn-primary" onClick={sendClassMessage} style={{ width: '100%' }}>
                                        <Send size={18} /> PUBLICAR NO MURAL
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <footer className="footer-credits">
                <p>Desenvolvido pelo Professor Johnny Braga de Oliveira</p>
                <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>© 2026 PlayGame System - All Rights Reserved</p>
            </footer>
        </div>
    );
};

export default DashboardAdmin;
