import React, { useState } from 'react';
import { useData } from './DataContext';
import { Plus, Users, FileText, CheckCircle, LogOut, Award, BookOpen, Send, MessageSquare, ExternalLink } from 'lucide-react';
import * as XLSX from 'xlsx';

const DashboardAdmin = () => {
    const {
        logout, user, students = [], importStudents, activities = [],
        addActivity, setStudentGrade, grades = {}, ranking = [],
        classes = [], selectedClass, setSelectedClass, createClass, sendMessage
    } = useData();

    const [tab, setTab] = useState('ranking');
    const [showNewClass, setShowNewClass] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [newClassSubject, setNewClassSubject] = useState('');
    const [newActivity, setNewActivity] = useState({ title: '', desc: '', maxScore: 10 });
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
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>Mestre {user?.name || user?.username}</h1>
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
                <button onClick={logout} className="btn glass-card" style={{ color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    Sair <LogOut size={18} />
                </button>
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

            <nav style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button onClick={() => setTab('ranking')} className={`btn ${tab === 'ranking' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '130px' }}><Award size={18} /> Ranking</button>
                <button onClick={() => setTab('students')} className={`btn ${tab === 'students' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '130px' }}><Users size={18} /> Alunos</button>
                <button onClick={() => setTab('activities')} className={`btn ${tab === 'activities' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '130px' }}><FileText size={18} /> Missões</button>
                <button onClick={() => setTab('grades')} className={`btn ${tab === 'grades' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '130px' }}><CheckCircle size={18} /> Notas</button>
                <button onClick={() => setTab('messages')} className={`btn ${tab === 'messages' ? 'btn-primary' : 'glass-card'}`} style={{ flex: '1', minWidth: '130px' }}><MessageSquare size={18} /> Atas</button>
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
                        <h3 style={{ marginBottom: '2rem' }}>Alunos Matriculados ({students.length})</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                            {students.map(s => (
                                <div key={s.id} className="glass-card" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)' }}>
                                        {s.photoUrl ? <img src={s.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={20} style={{ margin: '12px' }} />}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: '800', fontSize: '0.95rem' }}>{s.name}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status: On-line</p>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && <p style={{ color: 'var(--text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Nenhum aluno entrou na turma ainda.</p>}
                        </div>
                    </div>
                )}

                {tab === 'activities' && (
                    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Painel de Missões</h3>
                        {selectedClass && (
                            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2.5rem', background: 'rgba(99, 102, 241, 0.05)' }}>
                                <h4 style={{ marginBottom: '1.2rem' }}>Criar Nova Missão</h4>
                                <form onSubmit={(e) => { e.preventDefault(); addActivity(newActivity); setNewActivity({ title: '', desc: '', maxScore: 10 }); }} style={{ display: 'grid', gap: '1.2rem' }}>
                                    <input className="input-field" placeholder="Título da Missão" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} required />
                                    <textarea className="input-field" placeholder="Detalhamento da missão..." value={newActivity.desc} onChange={e => setNewActivity({ ...newActivity, desc: e.target.value })} style={{ height: '100px' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.9rem' }}>Recompensa (Pontos):</span>
                                        <input type="number" className="input-field" style={{ width: '100px' }} value={newActivity.maxScore || ''} onChange={e => setNewActivity({ ...newActivity, maxScore: parseFloat(e.target.value) || 0 })} />
                                        <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>LANÇAR MISSÃO</button>
                                    </div>
                                </form>
                            </div>
                        )}
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {activities.map(a => (
                                <div key={a.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: '800' }}>{a.title}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.desc || 'Sem descrição'}</p>
                                    </div>
                                    <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--secondary)' }}>{a.maxScore} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tab === 'grades' && (
                    <div style={{ overflowX: 'auto' }}>
                        <h3 style={{ marginBottom: '2rem' }}>Gestão de Pontuação</h3>
                        {!selectedClass ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>Selecione uma turma para carregar as notas.</p> : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem', minWidth: '180px' }}>ALUNO</th>
                                        {activities.map(a => <th key={a.id} style={{ padding: '1rem', textAlign: 'center' }}>{a.title}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.name}</td>
                                            {activities.map(a => (
                                                <td key={a.id} style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        style={{ width: '70px', textAlign: 'center', padding: '0.4rem' }}
                                                        value={grades[`${s.id}-${a.id}`] || ''}
                                                        onChange={(e) => setStudentGrade(s.id, a.id, parseFloat(e.target.value) || 0)}
                                                        placeholder="0"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
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
        </div>
    );
};

export default DashboardAdmin;
